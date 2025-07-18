import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/userProfileModel";
import { verifyUserToken } from "@/lib/verifyUser";
import { NotificationService } from "@/lib/notificationService";
import {
  analyzeProfileUpdate,
  generateNotificationContent,
  shouldSendNotification,
  generateActivityLogEntry,
  checkForMilestones,
} from "@/utils/profileNotificationUtils";

// Helper: Extract user UID from Authorization header
async function getUserIdFromAuth(request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null;
    }
    const token = authHeader.substring(7);
    const decodedToken = await verifyUserToken(token);
    return decodedToken?.uid || null;
  } catch (error) {
    console.error("Auth verification error:", error);
    return null;
  }
}

// GET - Fetch user profile
export async function GET(request) {
  try {
    await connectDB();

    const userId = await getUserIdFromAuth(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let user = await User.findOne({ firebaseUid: userId });

    // Get the user's email from the Firebase token
    let userEmail = null;
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.substring(7)
      : null;
    if (token) {
      const decodedToken = await verifyUserToken(token);
      userEmail = decodedToken?.email;
    }

    if (!user && userEmail) {
      user = new User({
        firebaseUid: userId,
        name: "New User",
        email: userEmail,
        fitnessGoal: "Weight Loss",
        experience: "Beginner",
        stats: {
          workoutsCompleted: 0,
          daysStreak: 0,
          caloriesBurned: 0,
          totalHours: 0,
        },
        achievements: [
          {
            title: "Welcome!",
            description: "Welcome to your fitness journey",
            icon: "Star",
            earned: true,
            earnedDate: new Date(),
          },
        ],
        recentActivities: [],
      });
      await user.save();
    }

    const profileData = {
      name: user.name,
      email: user.email,
      phone: user.phone,
      location: user.location,
      birthDate: user.birthDate,
      fitnessGoal: user.fitnessGoal,
      experience: user.experience,
      height: user.height,
      weight: user.weight,
      targetWeight: user.targetWeight,
      bio: user.bio,
      profileImage: user.profileImage,
      stats: user.stats,
      achievements: user.achievements,
      recentActivities: user.recentActivities,
    };

    return NextResponse.json(
      { success: true, data: profileData },
      { status: 200 }
    );
  } catch (error) {
    console.error("Profile GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT - Update user profile with advanced notifications
export async function PUT(request) {
  try {
    await connectDB();

    const userId = await getUserIdFromAuth(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      phone,
      location,
      birthDate,
      fitnessGoal,
      experience,
      height,
      weight,
      targetWeight,
      bio,
    } = body;

    // Get email from Firebase user
    let userEmail = null;
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.substring(7)
      : null;
    if (token) {
      const decodedToken = await verifyUserToken(token);
      userEmail = decodedToken?.email;
    }

    if (!name || !userEmail) {
      return NextResponse.json(
        { error: "Name and email are required" },
        { status: 400 }
      );
    }

    // Check for duplicate emails
    const existingUser = await User.findOne({
      email: userEmail.toLowerCase(),
      firebaseUid: { $ne: userId },
    });
    if (existingUser) {
      return NextResponse.json(
        { error: "Email already exists" },
        { status: 400 }
      );
    }

    // Get existing user data for comparison
    const existingUserData = await User.findOne({ firebaseUid: userId });
    const isNewUser = !existingUserData;

    // Prepare update data
    const updateData = {
      name,
      email: userEmail.toLowerCase(),
      firebaseUid: userId,
      phone,
      location,
      birthDate,
      fitnessGoal,
      experience,
      height,
      weight,
      targetWeight,
      bio,
      updatedAt: new Date(),
    };

    // Analyze profile changes
    const oldData = existingUserData || {};
    const analysis = analyzeProfileUpdate(oldData, updateData);

    // Update user profile
    const updatedUser = await User.findOneAndUpdate(
      { firebaseUid: userId },
      { $set: updateData },
      { new: true, runValidators: true, upsert: true }
    );

    if (!updatedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Initialize notification tracking variables
    let notificationsSent = false;
    let milestonesCount = 0;
    let milestones = [];

    // Handle notifications and activity logging
    try {
      console.log("🔍 Checking notification requirements...");
      console.log(
        "User push token:",
        updatedUser.pushToken ? "Available" : "Not available"
      );
      console.log("Is new user:", isNewUser);
      console.log("Analysis:", analysis);

      // Check if notification should be sent
      if (updatedUser.pushToken) {
        const notificationContent = {
          title: "Profile Updated",
          body: "Your profile information has been successfully updated.",
          data: {
            type: "profile_update",
            section: "profile", // optional: helps frontend know what was updated
          },
        };

        try {
          const result = await NotificationService.sendCustomNotification(
            updatedUser.pushToken,
            notificationContent.title,
            notificationContent.body,
            notificationContent.data
          );
          console.log("✅ Profile update notification sent:", result);
          notificationsSent = true;
        } catch (err) {
          console.error("❌ Error sending update notification:", err);
        }
      } else {
        console.log("❌ Notification criteria not met");
      }

      // Check for milestones
      milestones = checkForMilestones(oldData, updateData);
      milestonesCount = milestones.length;
      console.log("🏆 Milestones found:", milestonesCount);

      if (milestones.length > 0 && updatedUser.pushToken) {
        console.log("🎯 Sending milestone notifications...");

        // Send milestone notifications
        for (const milestone of milestones) {
          try {
            await NotificationService.sendMilestoneNotification(
              updatedUser.pushToken,
              milestone.title
            );
            console.log("✅ Milestone notification sent:", milestone.title);

            // Add milestone to user's achievements
            await User.findOneAndUpdate(
              { firebaseUid: userId },
              {
                $push: {
                  achievements: {
                    title: milestone.title,
                    description: milestone.description,
                    icon: getMilestoneIcon(milestone.type),
                    earned: true,
                    earnedDate: new Date(),
                  },
                },
              }
            );
          } catch (milestoneError) {
            console.error(
              "❌ Failed to send milestone notification:",
              milestoneError
            );
          }
        }
      }

      // Log activity
      const activityEntry = generateActivityLogEntry(analysis, isNewUser);
      await User.findOneAndUpdate(
        { firebaseUid: userId },
        {
          $push: {
            recentActivities: {
              $each: [activityEntry],
              $slice: -10, // Keep only last 10 activities
            },
          },
        }
      );

      // Send welcome notification for new users
      if (isNewUser && updatedUser.pushToken) {
        console.log("🎉 Scheduling welcome notification for new user...");
        setTimeout(async () => {
          try {
            await NotificationService.sendWelcomeNotification(
              updatedUser.pushToken
            );
            console.log("✅ Welcome notification sent");
          } catch (welcomeError) {
            console.error(
              "❌ Failed to send welcome notification:",
              welcomeError
            );
          }
        }, 2000); // Send welcome notification after 2 seconds
      }
    } catch (notificationError) {
      console.error(
        "❌ Notification/Activity logging failed:",
        notificationError
      );
      console.error("Full error details:", notificationError.stack);
      // Don't break the profile update if notification fails
    }

    // Return success response
    return NextResponse.json(
      {
        success: true,
        message: "Profile updated successfully",
        data: {
          name: updatedUser.name,
          email: updatedUser.email,
          phone: updatedUser.phone,
          location: updatedUser.location,
          birthDate: updatedUser.birthDate,
          fitnessGoal: updatedUser.fitnessGoal,
          experience: updatedUser.experience,
          height: updatedUser.height,
          weight: updatedUser.weight,
          targetWeight: updatedUser.targetWeight,
          bio: updatedUser.bio,
        },
        notifications: {
          sent: notificationsSent,
          milestones: milestonesCount,
          changeType: analysis.primaryChangeType,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Profile PUT error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Helper function to get milestone icon
function getMilestoneIcon(milestoneType) {
  const iconMap = {
    profile_completion: "User",
    goal_set: "Target",
    target_set: "Scale",
    body_stats_complete: "Activity",
    weight_loss: "TrendingDown",
  };
  return iconMap[milestoneType] || "Award";
}

// DELETE - Delete user profile (optional)
export async function DELETE(request) {
  try {
    await connectDB();

    const userId = await getUserIdFromAuth(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const deletedUser = await User.findOneAndDelete({ firebaseUid: userId });

    if (!deletedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Send goodbye notification if user has FCM token
    if (deletedUser.pushToken) {
      try {
        await NotificationService.sendCustomNotification(
          deletedUser.pushToken,
          "Profile Deleted",
          "Your profile has been successfully deleted. We're sorry to see you go!",
          { type: "profile_deleted", link: "/" }
        );
      } catch (notificationError) {
        console.error(
          "Failed to send deletion notification:",
          notificationError
        );
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: "Profile deleted successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Profile DELETE error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

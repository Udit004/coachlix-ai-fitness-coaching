import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/models/userProfileModel';
import { verifyUserToken } from '@/app/api/verifyUser'; // ✅ Updated path

// ✅ Helper: Extract user UID from Authorization header using centralized verifyUserToken
async function getUserIdFromAuth(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    const token = authHeader.substring(7);
    const decodedToken = await verifyUserToken(token);
    return decodedToken?.uid || null;
  } catch (error) {
    console.error('Auth verification error:', error);
    return null;
  }
}

// GET - Fetch user profile
export async function GET(request) {
  try {
    await connectDB();

    const userId = await getUserIdFromAuth(request);

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let user = await User.findOne({ firebaseUid: userId });

    // Get the user's email from the Firebase token
    let userEmail = null;
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
    if (token) {
      const decodedToken = await verifyUserToken(token);
      userEmail = decodedToken?.email;
    }

    if (!user && userEmail) {
      user = new User({
        firebaseUid: userId,
        name: 'New User',
        email: userEmail,
        fitnessGoal: 'Weight Loss',
        experience: 'Beginner',
        stats: {
          workoutsCompleted: 0,
          daysStreak: 0,
          caloriesBurned: 0,
          totalHours: 0
        },
        achievements: [
          {
            title: 'Welcome!',
            description: 'Welcome to your fitness journey',
            icon: 'Star',
            earned: true,
            earnedDate: new Date()
          }
        ],
        recentActivities: []
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
      recentActivities: user.recentActivities
    };

    return NextResponse.json({ success: true, data: profileData }, { status: 200 });

  } catch (error) {
    console.error('Profile GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update user profile
export async function PUT(request) {
  try {
    await connectDB();

    const userId = await getUserIdFromAuth(request);

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, phone, location, birthDate, fitnessGoal, experience, height, weight, targetWeight, bio } = body;


    // Always get email from Firebase user (not from client)
    let userEmail = null;
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
    if (token) {
      const decodedToken = await verifyUserToken(token);
      userEmail = decodedToken?.email;
    }
    if (!name || !userEmail) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 });
    }

    // Prevent duplicate emails for other users
    const existingUser = await User.findOne({
      email: userEmail.toLowerCase(),
      firebaseUid: { $ne: userId }
    });
    if (existingUser) {
      return NextResponse.json({ error: 'Email already exists' }, { status: 400 });
    }

    // Always upsert with both firebaseUid and email
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
      updatedAt: new Date()
    };

    const updatedUser = await User.findOneAndUpdate(
      { firebaseUid: userId },
      { $set: updateData },
      { new: true, runValidators: true, upsert: true }
    );

    if (!updatedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
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
        bio: updatedUser.bio
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Profile PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

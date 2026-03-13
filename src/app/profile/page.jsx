import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { QueryClient, HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { verifySessionCookie } from "@/lib/verifyUser";
import { connectDB } from "@/lib/db";
import User from "@/models/userProfileModel";
import ProfilePageClient from "@/feature/profile/pages/ProfilePageClient";
import { profileKeys } from "@/feature/profile/hooks/useProfileQueries";

function toPlain(value) {
  return JSON.parse(JSON.stringify(value));
}

function mapProfileForClient(user) {
  if (!user) return null;

  const mapped = {
    name: user.name,
    email: user.email,
    phone: user.phone,
    location: user.location,
    birthDate: user.birthDate,
    fitnessGoal: user.fitnessGoal,
    experience: user.experience,
    gender: user.gender,
    activityLevel: user.activityLevel,
    dietaryPreference: user.dietaryPreference,
    age: user.age,
    height: user.height,
    weight: user.weight,
    targetWeight: user.targetWeight,
    bio: user.bio,
    profileImage: user.profileImage,
    stats: user.stats || {},
    achievements: user.achievements || [],
    recentActivities: user.recentActivities || [],
    profileCompleted: user.profileCompleted !== false,
  };

  mapped.needsOnboarding =
    user.profileCompleted === false ||
    (user.name === "New User" && (!user.location || !user.location.trim())) ||
    (user.gender === "other" && user.name === "New User");

  return toPlain(mapped);
}

export default async function ProfilePage() {
  const queryClient = new QueryClient();

  let profileData = null;
  let sessionUser = null;

  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("__session")?.value;

    if (sessionCookie) {
      sessionUser = await verifySessionCookie(sessionCookie);
      if (sessionUser?.uid) {
        await connectDB();
        const user = await User.findOne({ firebaseUid: sessionUser.uid }).lean();
        profileData = mapProfileForClient(user);
      }
    }
  } catch {
    // Ignore SSR prefetch failures; client hooks will recover.
  }

  if (sessionUser?.uid && profileData) {
    if (profileData.needsOnboarding) {
      redirect("/onboarding");
    }

    queryClient.setQueryData(profileKeys.detail(sessionUser.uid), profileData);
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ProfilePageClient />
    </HydrationBoundary>
  );
}
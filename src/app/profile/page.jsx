
const metadata = {
  title: "Profile",
  description: "View and manage your profile information, including personal details, fitness goals, and dietary preferences.",
};

export { metadata };

import ProfilePageClient from "@/feature/profile/pages/ProfilePageClient";

export default function ProfilePage() {
  return <ProfilePageClient />;
}
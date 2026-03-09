// Server Component — SSR data fetch + delegate rendering to AIChatClient
import { cookies } from "next/headers";
import AIChatClient from "./AIChatClient";
import { verifySessionCookie } from "@/lib/verifyUser";
import { connectDB } from "@/lib/db";
import ChatSession from "@/models/ChatSession";
import User from "@/models/userProfileModel";

export const metadata = {
  title: "AI Chat - Coachlix",
  description: "Chat with your AI fitness coach",
};

/**
 * Fetches chat history and user profile server-side via the __session cookie.
 * Both are passed as props to AIChatClient, which seeds TanStack Query cache
 * and Zustand profile store immediately — eliminating the 1.8 s staged
 * loading sequence for authenticated users.
 */
async function fetchSSRData() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("__session")?.value;
    if (!sessionCookie) return { chatHistory: [], profile: null };

    const user = await verifySessionCookie(sessionCookie);
    if (!user?.uid) return { chatHistory: [], profile: null };

    await connectDB();

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [chats, profile] = await Promise.all([
      ChatSession.find({
        userId: user.uid,
        isActive: true,
        createdAt: { $gte: thirtyDaysAgo },
      })
        .sort({ updatedAt: -1 })
        .limit(50)
        .select("title plan messages messageCount lastMessage createdAt updatedAt")
        .lean(),

      User.findOne({ firebaseUid: user.uid }).lean(),
    ]);

    return {
      chatHistory: JSON.parse(JSON.stringify(chats || [])),
      profile: profile ? JSON.parse(JSON.stringify(profile)) : null,
    };
  } catch {
    return { chatHistory: [], profile: null };
  }
}

export default async function AIChatPage() {
  const { chatHistory, profile } = await fetchSSRData();
  return <AIChatClient initialChatHistory={chatHistory} initialProfile={profile} />;
}

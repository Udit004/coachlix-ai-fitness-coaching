// Server Component — SSR data fetch + delegate rendering to AIChatClient
import { cookies } from "next/headers";
import AIChatClient from "./AIChatClient";
import { verifySessionCookie } from "@/lib/verifyUser";
import { connectDB } from "@/lib/db";
import ChatSession from "@/models/ChatSession";
import User from "@/models/userProfileModel";
import { QueryClient, HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { CHAT_KEYS } from "@/hooks/useChatQueries";

export const metadata = {
  title: "AI Chat - Coachlix",
  description: "Chat with your AI fitness coach",
};

/**
 * Fetches chat history and user profile server-side via the __session cookie.
 * Chat history is loaded into TanStack Query cache via HydrationBoundary.
 * Profile is passed as a prop to AIChatClient for Zustand seeding.
 * Both eliminate the 1.8 s staged loading sequence for authenticated users.
 */
async function fetchSSRData() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("__session")?.value;
    if (!sessionCookie) return { uid: null, chatHistory: [], profile: null };

    const user = await verifySessionCookie(sessionCookie);
    if (!user?.uid) return { uid: null, chatHistory: [], profile: null };

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
      uid: user.uid,
      chatHistory: JSON.parse(JSON.stringify(chats || [])),
      profile: profile ? JSON.parse(JSON.stringify(profile)) : null,
    };
  } catch {
    return { uid: null, chatHistory: [], profile: null };
  }
}

export default async function AIChatPage() {
  const queryClient = new QueryClient();
  const { uid, chatHistory, profile } = await fetchSSRData();

  if (uid && chatHistory.length > 0) {
    // useChatHistory(userId) stores an array directly — cache in the same shape
    queryClient.setQueryData(CHAT_KEYS.list(uid), chatHistory);
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <AIChatClient initialProfile={profile} />
    </HydrationBoundary>
  );
}

"use client";

import dynamic from "next/dynamic";

const AIChatClient = dynamic(() => import("./AIChatClient"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-[60vh] items-center justify-center">
      <p className="text-sm text-gray-500">Loading AI chat...</p>
    </div>
  ),
});

export default AIChatClient;

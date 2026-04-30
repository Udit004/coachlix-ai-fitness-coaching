const metadata = {
  title: "AI Chat",
  description: "Engage in a personalized conversation with our AI fitness coach. Get instant answers to your fitness questions, receive tailored advice, and stay motivated on your fitness journey.",
};

export { metadata };  

import AIChatClient from "./AIChatClient";

export default function AIChatPage() {
  return <AIChatClient />;
}

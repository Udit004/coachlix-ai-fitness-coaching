// app/layout.js

import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import ConditionalFooter from "../components/ConditionalFooter";
import { AuthProvider } from "@/auth/AuthContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Coachlix – Your AI Fitness Coach",
  description: "Get personalized AI-powered coaching. Track workouts, ask questions, and improve your fitness journey.",
  keywords: ["fitness", "AI coach", "workout", "trainer", "Coachlix", "gym"],
  authors: [{ name: "Udit Kumar Tiwari" }],
  metadataBase: new URL("https://coachlix-ai-fitness-coaching.vercel.app"),
  icons: {
    icon: "/CoachlixLogo.ico",
    apple: "/icon-192.png",
  },
  manifest: "/manifest.json",
  themeColor: "#000000",
  appleWebApp: {
    capable: true,
    title: "Coachlix",
    statusBarStyle: "black-translucent",
  },
  openGraph: {
    title: "Coachlix AI Fitness Coaching",
    description: "Your AI fitness coach with personalized plans.",
    url: "https://coachlix-ai-fitness-coaching.vercel.app/",
    siteName: "Coachlix AI",
    images: [
      {
        url: "/icon-512.png",
        width: 512,
        height: 512,
        alt: "Coachlix AI Logo",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Coachlix AI Fitness Coaching",
    description: "Smart AI-powered personal fitness assistant",
    images: ["/icon-512.png"],
  },
  verification: {
    google: "SGSmDTkUcfGUOsfWJWVBksxsbCZptyQ15tqK1e-SF3M",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <AuthProvider>
          <Navbar />
          {children}
        </AuthProvider>
        <ConditionalFooter />
      </body>
    </html>
  );
}
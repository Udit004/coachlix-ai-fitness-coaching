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
  title: 'Coachlix – Your AI Fitness Coach',
  description: 'Get personalized AI-powered coaching. Track workouts, ask questions, and improve your fitness journey.',
  keywords: 'fitness, AI coach, workout, trainer, Coachlix, gym',
  authors: [{ name: 'Udit Kumar Tiwari' }],
  icons: {
    icon: '/CoachlixLogo.ico',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* PWA Essentials */}
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="theme-color" content="#000000" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />

        {/* Open Graph for Social Sharing */}
        <meta property="og:title" content="Coachlix AI Fitness Coaching" />
        <meta property="og:description" content="Your AI fitness coach with personalized plans." />
        <meta property="og:image" content="/icon-512.png" />
        <meta property="og:type" content="website" />
      </head>

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

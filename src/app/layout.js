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
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <Navbar/>
          {children}
        </AuthProvider>
        <ConditionalFooter/>
      </body>
    </html>
  );
}
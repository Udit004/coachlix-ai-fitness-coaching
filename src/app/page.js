"use client";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { app } from "../lib/firebase"; // Make sure this path is correct
import { useAuthContext } from "../auth/AuthContext";
import RecentActivitySection from "@/components/RecentActivitySection";
import ActivePlans from "@/components/ActivePlans";
import HomeStatic from "@/components/home/HomeStatic";
import HomeDashboard from "@/components/home/HomeDashboard";
import FeaturesSection from "@/components/home/FeaturesSection";
import HowItWorks from "@/components/home/HowItWorks";
import Testimonials from "@/components/home/Testimonials";
import { ArrowRight, CheckCircle, Heart, Users } from "lucide-react";


export default function HomePage() {
  const router = useRouter();
  const { user: authUser } = useAuthContext();

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-200">
      {authUser ? (
        <>
          <HomeDashboard />
          <RecentActivitySection />
        </>
      ) : (
        <>
          <HomeStatic />
          <FeaturesSection />
          <HowItWorks />
          <Testimonials />

          {/* Final CTA Section */}
          <section className="py-24 bg-gradient-to-r from-blue-600 to-purple-600 relative overflow-hidden">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Ready to Transform Your Life?</h2>
              <p className="text-xl text-blue-100 mb-12 max-w-2xl mx-auto">Join thousands of users who have already started their fitness journey with Coachlix. Your personal AI coach is waiting to help you succeed.</p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button className="group bg-white text-blue-600 px-8 py-4 rounded-full text-lg font-semibold hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 flex items-center justify-center" onClick={() => router.push("/ai-chat")}>
                  <Heart className="h-5 w-5 mr-2" />
                  Start Free Today
                  <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </button>
                <button className="group bg-transparent text-white px-8 py-4 rounded-full text-lg font-semibold border-2 border-white/30 hover:border-white hover:bg-white/10 transition-all duration-300 flex items-center justify-center">
                  <Users className="h-5 w-5 mr-2" />
                  Join Community
                </button>
              </div>

              <div className="mt-12 flex items-center justify-center space-x-8 text-blue-100">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  <span>No Credit Card Required</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  <span>Cancel Anytime</span>
                </div>
              </div>
            </div>
          </section>

          {/* Meet the Creator Section */}
          <section className="px-4 py-16 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Meet the Creator</h2>
            <p className="text-lg text-gray-700 mb-4">Coachlix is created by <strong>Udit Kumar Tiwari</strong>, a tech enthusiast and fitness expert. Learn more about the mission behind Coachlix and the person building it.</p>
            <a href="/about" className="inline-block px-6 py-3 text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-full font-semibold hover:shadow-lg transition">Read About Us</a>
          </section>
        </>
      )}
    </div>
  );
}
                      
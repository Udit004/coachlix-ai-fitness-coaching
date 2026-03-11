// SSG Server Component — statically generated at build time
import Link from "next/link";
import HomeStatic from "@/feature/home/HomeStatic";
import FeaturesSection from "@/feature/home/FeaturesSection";
import HowItWorks from "@/feature/home/HowItWorks";
import Testimonials from "@/feature/home/Testimonials";
import HomeAuthRedirect from "@/feature/home/HomeAuthRedirect";
import { ArrowRight, CheckCircle, Heart, Users } from "lucide-react";

// Opt into static generation explicitly
export const dynamic = "force-static";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-200">
      {/* Thin client component — redirects authenticated users to /dashboard */}
      <HomeAuthRedirect />

      <HomeStatic />
      <FeaturesSection />
      <HowItWorks />
      <Testimonials />

      {/* Final CTA Section */}
      <section className="py-24 bg-gradient-to-r from-blue-600 to-purple-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Ready to Transform Your Life?</h2>
          <p className="text-xl text-blue-100 mb-12 max-w-2xl mx-auto">
            Join thousands of users who have already started their fitness journey with Coachlix. Your personal AI coach is waiting to help you succeed.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/ai-chat"
              className="group bg-white text-blue-600 px-8 py-4 rounded-full text-lg font-semibold hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 flex items-center justify-center"
            >
              <Heart className="h-5 w-5 mr-2" />
              Start Free Today
              <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
            <button className="group bg-transparent text-white px-8 py-4 rounded-full text-lg font-semibold border-2 border-white/30 hover:border-white hover:bg-white/10 transition-all duration-300 flex items-center justify-center cursor-pointer">
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
      <section className="px-4 py-16 text-center bg-white dark:bg-gray-900">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Meet the Creator</h2>
        <p className="text-lg text-gray-700 dark:text-gray-400 mb-4">
          Coachlix is created by <strong className="text-gray-900 dark:text-white">Udit Kumar Tiwari</strong>, a tech enthusiast and fitness expert. Learn more about the mission behind Coachlix and the person building it.
        </p>
        <a href="/about" className="inline-block px-6 py-3 text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-full font-semibold hover:shadow-lg transition">
          Read About Us
        </a>
      </section>
    </div>
  );
}
                      
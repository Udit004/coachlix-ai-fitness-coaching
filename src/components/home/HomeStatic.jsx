"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { Bot, ArrowRight, Play, Zap } from "lucide-react";

export default function HomeStatic() {
  const router = useRouter();

  return (
    <section className="relative bg-gradient-to-br from-blue-50 via-white to-purple-50 pt-20 pb-32 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      <div className="absolute top-20 right-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-30"></div>
      <div className="absolute bottom-20 left-10 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-30"></div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full border border-gray-200 mb-8">
            <Zap className="h-4 w-4 text-blue-600 mr-2" />
            <span className="text-sm font-medium text-gray-700">Powered by Advanced AI Technology</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
            Your Personal
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent block">
              AI Fitness Coach
            </span>
          </h1>

          <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed">
            Transform your health journey with personalized workout plans,
            nutrition guidance, and 24/7 AI coaching tailored specifically to
            your goals and lifestyle.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <button
              className="group bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-full text-lg font-semibold hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 flex items-center justify-center"
              onClick={() => router.push("/ai-chat")}
            >
              <Bot className="h-5 w-5 mr-2" />
              Ask AI Coach
              <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </button>
            <button className="group bg-white text-gray-900 px-8 py-4 rounded-full text-lg font-semibold border-2 border-gray-200 hover:border-blue-300 hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300 flex items-center justify-center" onClick={() => router.push('/workout-plan')}>
              <Play className="h-5 w-5 mr-2" />
              Start Your Plan
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

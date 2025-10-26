"use client";
import React, { useState } from "react";
import { Bot, Calendar, Apple, Target } from "lucide-react";

const features = [
  { icon: Bot, title: "AI-Powered Coaching", description: "Get personalized fitness advice from our advanced AI coach, available 24/7 to answer your questions and guide your journey.", color: "from-blue-500 to-purple-600" },
  { icon: Apple, title: "Custom Diet Plans", description: "Receive tailored nutrition plans based on your goals, dietary preferences, and lifestyle for optimal results.", color: "from-green-500 to-emerald-600" },
  { icon: Calendar, title: "Smart Workouts", description: "Access personalized workout routines that adapt to your fitness level, schedule, and available equipment.", color: "from-orange-500 to-red-600" },
  { icon: Target, title: "Goal Tracking", description: "Monitor your progress with detailed analytics and celebrate milestones on your fitness journey.", color: "from-purple-500 to-pink-600" },
];

export default function FeaturesSection() {
  const [activeFeature, setActiveFeature] = useState(0);

  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Everything You Need to Succeed</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">Comprehensive tools and AI-powered insights to help you reach your fitness goals faster than ever.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            {features.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <div key={index} className={`p-6 rounded-2xl cursor-pointer transition-all duration-300 ${activeFeature === index ? "bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 shadow-lg" : "bg-gray-50 hover:bg-gray-100 border-2 border-transparent"}`} onClick={() => setActiveFeature(index)}>
                  <div className="flex items-start space-x-4">
                    <div className={`p-3 rounded-xl bg-gradient-to-r ${feature.color}`}>
                      <IconComponent className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                      <p className="text-gray-600">{feature.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="relative">
            <div className="bg-gradient-to-br from-blue-100 to-purple-100 rounded-3xl p-8 h-96 flex items-center justify-center">
              <div className="text-center">
                <div className={`inline-flex p-6 rounded-2xl bg-gradient-to-r ${features[activeFeature].color} mb-4`}>
                  {(() => {
                    const IconComponent = features[activeFeature].icon;
                    return <IconComponent className="h-12 w-12 text-white" />;
                  })()}
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{features[activeFeature].title}</h3>
                <p className="text-gray-600">Experience the power of AI-driven fitness coaching</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

"use client";
import React from "react";
import { MessageSquare, Brain, Trophy, ArrowRight } from "lucide-react";

const steps = [
  { step: "01", title: "Tell Us About You", description: "Share your fitness goals, current level, and preferences to get started.", icon: MessageSquare },
  { step: "02", title: "Get Your Plan", description: "Receive personalized workout and diet plans tailored specifically for you.", icon: Brain },
  { step: "03", title: "Track Progress", description: "Follow your plans, chat with AI coach, and watch your transformation unfold.", icon: Trophy },
];

export default function HowItWorks() {
  return (
    <section className="py-24 bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">How It Works</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">Get started with Coachlix in just three simple steps and begin your transformation today.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, index) => {
            const IconComponent = step.icon;
            return (
              <div key={index} className="text-center relative">
                <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl text-2xl font-bold mb-6">
                    {step.step}
                  </div>
                  <IconComponent className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">{step.title}</h3>
                  <p className="text-gray-600">{step.description}</p>
                </div>
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                    <ArrowRight className="h-8 w-8 text-blue-300" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

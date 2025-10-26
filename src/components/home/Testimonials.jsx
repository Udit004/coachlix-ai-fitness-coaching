"use client";
import React from "react";
import { Star } from "lucide-react";

const testimonials = [
  { name: "Sarah Johnson", role: "Fitness Enthusiast", content: "Coachlix transformed my approach to fitness. The AI coach feels like having a personal trainer in my pocket!", rating: 5, avatar: "SJ" },
  { name: "Mike Chen", role: "Busy Professional", content: "Finally found a solution that fits my hectic schedule. The personalized plans are incredibly effective.", rating: 5, avatar: "MC" },
  { name: "Emma Davis", role: "Beginner", content: "As someone new to fitness, Coachlix made everything simple and approachable. Highly recommend!", rating: 5, avatar: "ED" },
];

export default function Testimonials() {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">What Our Users Say</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">Join thousands of satisfied users who have transformed their lives with Coachlix.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-8 hover:shadow-lg transition-shadow duration-300">
              <div className="flex items-center mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-gray-700 mb-6 italic">{testimonial.content}</p>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold mr-4">{testimonial.avatar}</div>
                <div>
                  <div className="font-semibold text-gray-900">{testimonial.name}</div>
                  <div className="text-gray-600 text-sm">{testimonial.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

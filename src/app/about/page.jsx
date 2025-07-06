"use client";
import { Briefcase, GraduationCap, Dumbbell } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white py-24 px-4 sm:px-8 lg:px-24">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-5xl font-bold text-gray-900 mb-8">About Coachlix</h1>

        <p className="text-lg text-gray-700 leading-relaxed mb-6">
          <strong>Coachlix</strong> is an AI-powered fitness coaching platform built with the mission to make
          personalized fitness guidance accessible to everyone. Whether you’re a beginner or a seasoned
          athlete, Coachlix adapts to your goals, preferences, and progress in real time.
        </p>

        <p className="text-lg text-gray-700 leading-relaxed mb-6">
          Designed using <strong>Next.js</strong> and built with modern web technologies, Coachlix provides:
        </p>

        <ul className="list-disc pl-6 text-lg text-gray-700 mb-6 space-y-2">
          <li>AI-powered workout and nutrition planning</li>
          <li>24/7 access to a smart virtual fitness assistant</li>
          <li>Progress tracking with real-time insights</li>
        </ul>

        <h2 className="text-3xl font-bold text-gray-900 mb-4 mt-12">👤 About the Creator</h2>

        <div className="space-y-4 text-lg text-gray-700">
          <p>
            I'm <strong>Udit Kumar Tiwari</strong>, a Computer Science & Engineering student and passionate web developer from India. I love building tools that blend technology and real-life utility.
          </p>
          <p>
            With over 7 years of experience in competitive sports like badminton and a deep interest in fitness,
            I created Coachlix to help people lead healthier lives using AI-powered coaching.
          </p>
          <p>
            I specialize in full-stack development, machine learning, and user-centric design.
          </p>
        </div>

        <div className="mt-12 flex gap-4 text-blue-600">
          <div className="flex items-center">
            <Briefcase className="w-5 h-5 mr-2" />
            Web Developer
          </div>
          <div className="flex items-center">
            <GraduationCap className="w-5 h-5 mr-2" />
            B.Tech Student – CSE
          </div>
          <div className="flex items-center">
            <Dumbbell className="w-5 h-5 mr-2" />
            Fitness Enthusiast
          </div>
        </div>
      </div>
    </div>
  );
}

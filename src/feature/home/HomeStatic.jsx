"use client";
import React from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Bot, ArrowRight, Play, Zap, Star, TrendingUp, Shield } from "lucide-react";

export default function HomeStatic() {
  const router = useRouter();

  return (
    <section className="relative min-h-screen bg-gray-950 overflow-hidden flex items-center md:-mt-10">

      {/* ── Layered background ── */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(99,102,241,0.25),transparent)]" />
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.6) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.6) 1px,transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-3xl" />

      {/* ── Main grid ── */}
      <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-0">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

          {/* ── Left column ── */}
          <div className="flex flex-col items-start">

            {/* Live badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/30 mb-8 backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500" />
              </span>
              <Zap className="h-3.5 w-3.5 text-indigo-400" />
              <span className="text-sm font-medium text-indigo-300">Powered by Advanced AI Technology</span>
            </div>

            {/* Heading */}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-white leading-[1.08] tracking-tight mb-6">
              Your Personal
              <span className="block mt-1 bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
                AI Fitness Coach
              </span>
            </h1>

            {/* Description */}
            <p className="text-lg sm:text-xl text-gray-400 mb-10 max-w-lg leading-relaxed">
              Transform your health journey with personalized workout plans,
              nutrition guidance, and 24/7 AI coaching tailored specifically to
              your goals and lifestyle.
            </p>

            {/* CTA buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mb-12 w-full sm:w-auto">
              <button
                onClick={() => router.push("/ai-chat")}
                className="group relative inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full text-base font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-700/30 hover:shadow-blue-600/50 transform hover:-translate-y-0.5 transition-all duration-300 cursor-pointer"
              >
                <Bot className="h-5 w-5" />
                Ask AI Coach
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={() => router.push("/workout-plan")}
                className="group inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full text-base font-semibold text-gray-200 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 backdrop-blur-sm transform hover:-translate-y-0.5 transition-all duration-300 cursor-pointer"
              >
                <Play className="h-4 w-4" />
                Start Your Plan
              </button>
            </div>

            {/* Social proof row */}
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  {["SJ", "MC", "ED", "RK"].map((init, i) => (
                    <div
                      key={i}
                      className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 border-2 border-gray-950 flex items-center justify-center text-white text-[10px] font-bold"
                    >
                      {init}
                    </div>
                  ))}
                </div>
                <div>
                  <div className="flex items-center gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" />
                    ))}
                  </div>
                  <span className="text-xs text-gray-500">10,000+ happy users</span>
                </div>
              </div>
              <div className="w-px h-8 bg-gray-800 hidden sm:block" />
              <div className="flex items-center gap-1.5 text-gray-500 text-sm">
                <Shield className="h-4 w-4 text-green-500" />
                Free to start
              </div>
              <div className="flex items-center gap-1.5 text-gray-500 text-sm">
                <TrendingUp className="h-4 w-4 text-blue-400" />
                Real-time AI
              </div>
            </div>
          </div>

          {/* ── Right column — hero image ── */}
          <div className="relative flex justify-center lg:justify-end">
            <div className="relative w-full max-w-[520px]">

              {/* Outer glow */}
              <div className="absolute -inset-6 bg-gradient-to-r from-blue-600/30 to-purple-600/30 rounded-[2rem] blur-3xl" />

              {/* Image card */}
              <div className="relative rounded-[1.75rem] overflow-hidden ring-1 ring-white/10 shadow-[0_30px_80px_-10px_rgba(0,0,0,0.6)]">
                <Image
                  src="/assets/homePageImage.png"
                  alt="Coachlix AI Fitness Coach"
                  width={600}
                  height={520}
                  className="w-full h-auto object-cover"
                  priority
                />
                <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/40 to-transparent" />
              </div>

              {/* Floating card — top left: Live AI */}
              <div className="absolute -top-4 -left-4 sm:-left-8 flex items-center gap-3 bg-gray-900/90 backdrop-blur-md border border-white/10 rounded-2xl px-4 py-3 shadow-xl">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                  <Bot className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-white leading-tight">AI Coach</p>
                  <p className="text-[11px] text-green-400 flex items-center gap-1">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                    Live &amp; ready
                  </p>
                </div>
              </div>

              {/* Floating card — bottom right: streak */}
              <div className="absolute -bottom-4 -right-4 sm:-right-8 flex items-center gap-3 bg-gray-900/90 backdrop-blur-md border border-white/10 rounded-2xl px-4 py-3 shadow-xl">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-pink-600 flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-white leading-tight">Weekly Streak</p>
                  <p className="text-[11px] text-orange-400">🔥 7-day streak!</p>
                </div>
              </div>

              {/* Floating badge — top right: rating */}
              <div className="absolute top-4 -right-4 sm:-right-6 flex items-center gap-2 bg-gray-900/90 backdrop-blur-md border border-white/10 rounded-xl px-3 py-2 shadow-xl">
                <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                <span className="text-sm font-bold text-white">4.9</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

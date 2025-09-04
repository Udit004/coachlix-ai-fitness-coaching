"use client";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { app } from "../lib/firebase"; // Make sure this path is correct
import { useAuthContext } from "../auth/AuthContext";
import RecentActivitySection from "@/components/RecentActivitySection";
import ActivePlans from "@/components/ActivePlans";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useWorkoutPlans, useWorkoutStats } from "@/hooks/useWorkoutQueries";
import { useDietPlans } from "@/hooks/useDietPlanQueries";

import {
  Bot,
  Calendar,
  Apple,
  Zap,
  Users,
  Trophy,
  CheckCircle,
  Star,
  ArrowRight,
  Play,
  MessageSquare,
  Target,
  Brain,
  Heart,
} from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const { user: authUser, loading: authLoading } = useAuthContext();
  const [activeFeature, setActiveFeature] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState(null);
  const [fcmToken, setFcmToken] = useState(null);

  // Dashboard data hooks
  const { data: workoutPlans } = useWorkoutPlans({ activeOnly: true });
  const { data: dietPlans } = useDietPlans({ activeOnly: true });
  const workoutPlanList = Array.isArray(workoutPlans)
    ? workoutPlans
    : (Array.isArray(workoutPlans?.plans) ? workoutPlans.plans : []);
  const dietPlanList = Array.isArray(dietPlans)
    ? dietPlans
    : (Array.isArray(dietPlans?.plans) ? dietPlans.plans : []);

  // Favorite plan selection (persisted per user via localStorage)
  const [favoriteWorkoutPlanId, setFavoriteWorkoutPlanId] = useState(null);
  const [favoriteDietPlanId, setFavoriteDietPlanId] = useState(null);

  useEffect(() => {
    if (!authUser) return;
    try {
      const favWorkout = localStorage.getItem(`favWorkout:${authUser.uid}`);
      const favDiet = localStorage.getItem(`favDiet:${authUser.uid}`);
      if (favWorkout) setFavoriteWorkoutPlanId(favWorkout);
      if (favDiet) setFavoriteDietPlanId(favDiet);
    } catch (e) {
      // ignore
    }
  }, [authUser]);

  const selectedWorkoutPlan = workoutPlanList.find(p => p._id === favoriteWorkoutPlanId) || (workoutPlanList[0] || null);
  const selectedDietPlan = dietPlanList.find(p => p._id === favoriteDietPlanId) || (dietPlanList[0] || null);

  const { data: workoutStats } = useWorkoutStats(selectedWorkoutPlan?._id);

// Updated setupNotifications function with proper error handling
const setupNotifications = async () => {
  try {
    if (typeof window === "undefined" || !("Notification" in window)) {
      console.log("This browser does not support notifications.");
      return;
    }

    // Wait for auth to be ready
    if (authLoading) {
      console.log("Auth still loading, waiting...");
      return;
    }

    const messaging = getMessaging(app);
    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);

    if (permission === "granted") {
      console.log("Notification permission granted.");

      // Ensure we use the registered service worker
      const registration = await navigator.serviceWorker.ready;
      const fcmToken = await getToken(messaging, {
        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
        serviceWorkerRegistration: registration,
      });

      if (fcmToken) {
        console.log("FCM Token:", fcmToken);
        setFcmToken(fcmToken);

        // Only proceed if we have an authenticated user
        if (authUser) {
          try {
            // Get fresh auth token
            const authToken = await authUser.getIdToken(true); // Force refresh
            console.log("Auth token obtained:", authToken ? 'Yes' : 'No');

            const response = await fetch("/api/save-token", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${authToken}`,
              },
              body: JSON.stringify({ token: fcmToken }),
            });

            console.log("Response status:", response.status);
            
            if (!response.ok) {
              const errorText = await response.text();
              console.error("Server response:", errorText);
              throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

            const result = await response.json();
            
            if (result.success) {
              console.log("FCM Token saved to server successfully");
              console.log("User ID:", result.userID);
              console.log("Token saved:", result.tokenSaved);

              // Verify the token was saved by fetching it back
              // setTimeout(() => {
              //   verifyFCMToken();
              // }, 1000);
            } else {
              console.error("Failed to save FCM token:", result.message);
            }
          } catch (error) {
            console.error("Error saving FCM token:", error);
          }
        } else {
          console.log("No authenticated user, skipping token save");
        }
      } else {
        console.log("No registration token available.");
      }

      // Foreground message handling
      onMessage(messaging, (payload) => {
        console.log("Foreground message received:", payload);
        if (payload.notification) {
          new Notification(payload.notification.title, {
            body: payload.notification.body,
            icon: payload.notification.icon || "/icon-192.png",
          });
        }
      });
    } else {
      console.log("Notification permission denied.");
    }
  } catch (error) {
    console.error("Error setting up FCM:", error);
  }
};

// Updated useEffect to handle auth state properly
useEffect(() => {

  router.prefetch("/ai-chat");

  setMounted(true);

  // Register service worker
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker
      .register("/firebase-messaging-sw.js")
      .then((registration) => {
        console.log("Firebase SW Registered:", registration);
      })
      .catch((err) => console.error("SW registration failed:", err));
  }

  // Only setup notifications when auth is ready
  if (!authLoading) {
    setupNotifications();
  }
}, [authLoading, authUser]); // Add authLoading and authUser as dependencies

  const testNotification = async () => {
    if (!fcmToken) {
      alert("No FCM token available. Please allow notifications first.");
      return;
    }

    try {
      const authToken = authUser ? await authUser.getIdToken() : undefined;
      const response = await fetch("/api/send-notification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify({
          token: fcmToken,
          title: "Test Notification",
          body: "This is a test notification from Coachlix!",
          data: { test: "true" },
        }),
      });

      if (response.ok) {
        console.log("Test notification sent successfully");
      } else {
        console.error("Failed to send test notification");
      }
    } catch (error) {
      console.error("Error sending test notification:", error);
    }
  };

  const features = [
    {
      icon: Bot,
      title: "AI-Powered Coaching",
      description:
        "Get personalized fitness advice from our advanced AI coach, available 24/7 to answer your questions and guide your journey.",
      color: "from-blue-500 to-purple-600",
    },
    {
      icon: Apple,
      title: "Custom Diet Plans",
      description:
        "Receive tailored nutrition plans based on your goals, dietary preferences, and lifestyle for optimal results.",
      color: "from-green-500 to-emerald-600",
    },
    {
      icon: Calendar,
      title: "Smart Workouts",
      description:
        "Access personalized workout routines that adapt to your fitness level, schedule, and available equipment.",
      color: "from-orange-500 to-red-600",
    },
    {
      icon: Target,
      title: "Goal Tracking",
      description:
        "Monitor your progress with detailed analytics and celebrate milestones on your fitness journey.",
      color: "from-purple-500 to-pink-600",
    },
  ];

  const howItWorks = [
    {
      step: "01",
      title: "Tell Us About You",
      description:
        "Share your fitness goals, current level, and preferences to get started.",
      icon: MessageSquare,
    },
    {
      step: "02",
      title: "Get Your Plan",
      description:
        "Receive personalized workout and diet plans tailored specifically for you.",
      icon: Brain,
    },
    {
      step: "03",
      title: "Track Progress",
      description:
        "Follow your plans, chat with AI coach, and watch your transformation unfold.",
      icon: Trophy,
    },
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Fitness Enthusiast",
      content:
        "Coachlix transformed my approach to fitness. The AI coach feels like having a personal trainer in my pocket!",
      rating: 5,
      avatar: "SJ",
    },
    {
      name: "Mike Chen",
      role: "Busy Professional",
      content:
        "Finally found a solution that fits my hectic schedule. The personalized plans are incredibly effective.",
      rating: 5,
      avatar: "MC",
    },
    {
      name: "Emma Davis",
      role: "Beginner",
      content:
        "As someone new to fitness, Coachlix made everything simple and approachable. Highly recommend!",
      rating: 5,
      avatar: "ED",
    },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-200">

      {/* Today's Dashboard for authenticated users */}
      {authUser && (
        <section className="pt-8 pb-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Today&#39;s Dashboard</h2>
            <div className="flex gap-2">
              <Button onClick={() => router.push("/ai-chat")}>
                Ask AI Coach
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Today's Workout */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Today&#39;s Workout</CardTitle>
              </CardHeader>
              <CardContent>
                {/* Favorite selector */}
                {Array.isArray(workoutPlanList) && workoutPlanList.length > 0 && (
                  <div className="mb-4">
                    <label className="text-sm text-gray-600 dark:text-gray-300 mr-2">Favorite plan:</label>
                    <select
                      className="border rounded px-2 py-1 text-sm bg-white dark:bg-gray-900"
                      value={selectedWorkoutPlan?._id || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFavoriteWorkoutPlanId(val);
                        if (authUser) {
                          try { localStorage.setItem(`favWorkout:${authUser.uid}`, val); } catch {}
                        }
                      }}
                    >
                      {workoutPlanList.map((p) => (
                        <option key={p._id} value={p._id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                {!selectedWorkoutPlan && (
                  <div className="text-gray-600 dark:text-gray-300">
                    No active workout plan. Create one to get started.
                    <div className="mt-4">
                      <Link href="/workout-plan">
                        <Button>Create Workout Plan</Button>
                      </Link>
                    </div>
                  </div>
                )}
                {selectedWorkoutPlan && (
                  <WorkoutTodaySummary plan={selectedWorkoutPlan} onStart={(link) => router.push(link)} />
                )}
              </CardContent>
            </Card>

            {/* Progress at a Glance */}
            <Card>
              <CardHeader>
                <CardTitle>Progress at a Glance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-center">
                    <div className="text-xs text-gray-500">Workouts</div>
                    <div className="text-xl font-semibold">{workoutStats?.totalWorkouts ?? selectedWorkoutPlan?.stats?.totalWorkouts ?? 0}</div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-center">
                    <div className="text-xs text-gray-500">Avg mins</div>
                    <div className="text-xl font-semibold">{workoutStats?.averageWorkoutDuration ?? selectedWorkoutPlan?.stats?.averageWorkoutDuration ?? 0}</div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-center">
                    <div className="text-xs text-gray-500">Completion</div>
                    <div className="text-xl font-semibold">{(workoutStats?.completionRate ?? selectedWorkoutPlan?.stats?.completionRate ?? 0)}%</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Today's Meals and Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
            {/* Today's Meals */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Today&#39;s Meals</CardTitle>
              </CardHeader>
              <CardContent>
                {/* Favorite selector */}
                {Array.isArray(dietPlanList) && dietPlanList.length > 0 && (
                  <div className="mb-4">
                    <label className="text-sm text-gray-600 dark:text-gray-300 mr-2">Favorite plan:</label>
                    <select
                      className="border rounded px-2 py-1 text-sm bg-white dark:bg-gray-900"
                      value={selectedDietPlan?._id || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFavoriteDietPlanId(val);
                        if (authUser) {
                          try { localStorage.setItem(`favDiet:${authUser.uid}`, val); } catch {}
                        }
                      }}
                    >
                      {dietPlanList.map((p) => (
                        <option key={p._id} value={p._id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                {!selectedDietPlan && (
                  <div className="text-gray-600 dark:text-gray-300">
                    No active diet plan. Create one to see meals for today.
                    <div className="mt-4">
                      <Link href="/diet-plan">
                        <Button>Create Diet Plan</Button>
                      </Link>
                    </div>
                  </div>
                )}
                {selectedDietPlan && <DietTodaySummary plan={selectedDietPlan} />}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button className="w-full" onClick={() => router.push("/ai-chat")}>Ask the AI Coach</Button>
                  {selectedWorkoutPlan && (
                    <Button className="w-full" onClick={() => router.push(`/workout-plan/${selectedWorkoutPlan._id}`)}>Go to Workout Plan</Button>
                  )}
                  {selectedDietPlan && (
                    <Button className="w-full" onClick={() => router.push(`/diet-plan/${selectedDietPlan._id}`)}>Add a Meal</Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      )}

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-50 via-white to-purple-50 pt-20 pb-32 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="absolute top-20 right-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-30"></div>
        <div className="absolute bottom-20 left-10 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-30"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full border border-gray-200 mb-8">
              <Zap className="h-4 w-4 text-blue-600 mr-2" />
              <span className="text-sm font-medium text-gray-700">
                Powered by Advanced AI Technology
              </span>
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
              <button className="group bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-full text-lg font-semibold hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 flex items-center justify-center" onClick={() => router.push("/ai-chat")}>
                <Bot className="h-5 w-5 mr-2" />
                Ask AI Coach
                <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </button>
              <button className="group bg-white text-gray-900 px-8 py-4 rounded-full text-lg font-semibold border-2 border-gray-200 hover:border-blue-300 hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300 flex items-center justify-center">
                <Play className="h-5 w-5 mr-2" />
                Start Your Plan
              </button>
            </div>

            <RecentActivitySection />
            <div className="mt-8">
              <ActivePlans />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-2xl mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  10K+
                </div>
                <div className="text-gray-600">Active Users</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  50K+
                </div>
                <div className="text-gray-600">Workouts Completed</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  4.9★
                </div>
                <div className="text-gray-600">User Rating</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Rest of your existing sections remain the same... */}
      {/* Key Features Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Succeed
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Comprehensive tools and AI-powered insights to help you reach your
              fitness goals faster than ever.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              {features.map((feature, index) => {
                const IconComponent = feature.icon;
                return (
                  <div
                    key={index}
                    className={`p-6 rounded-2xl cursor-pointer transition-all duration-300 ${
                      activeFeature === index
                        ? "bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 shadow-lg"
                        : "bg-gray-50 hover:bg-gray-100 border-2 border-transparent"
                    }`}
                    onClick={() => mounted && setActiveFeature(index)}
                  >
                    <div className="flex items-start space-x-4">
                      <div
                        className={`p-3 rounded-xl bg-gradient-to-r ${feature.color}`}
                      >
                        <IconComponent className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                          {feature.title}
                        </h3>
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
                  <div
                    className={`inline-flex p-6 rounded-2xl bg-gradient-to-r ${features[activeFeature].color} mb-4`}
                  >
                    {(() => {
                      const IconComponent = features[activeFeature].icon;
                      return <IconComponent className="h-12 w-12 text-white" />;
                    })()}
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {features[activeFeature].title}
                  </h3>
                  <p className="text-gray-600">
                    Experience the power of AI-driven fitness coaching
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Get started with Coachlix in just three simple steps and begin
              your transformation today.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {howItWorks.map((step, index) => {
              const IconComponent = step.icon;
              return (
                <div key={index} className="text-center relative">
                  <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl text-2xl font-bold mb-6">
                      {step.step}
                    </div>
                    <IconComponent className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">
                      {step.title}
                    </h3>
                    <p className="text-gray-600">{step.description}</p>
                  </div>
                  {index < howItWorks.length - 1 && (
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

      {/* Testimonials Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              What Our Users Say
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Join thousands of satisfied users who have transformed their lives
              with Coachlix.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-8 hover:shadow-lg transition-shadow duration-300"
              >
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star
                      key={i}
                      className="h-5 w-5 text-yellow-400 fill-current"
                    />
                  ))}
                </div>
                <p className="text-gray-700 mb-6 italic">
                  {testimonial.content}
                </p>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold mr-4">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">
                      {testimonial.name}
                    </div>
                    <div className="text-gray-600 text-sm">
                      {testimonial.role}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-24 bg-gradient-to-r from-blue-600 to-purple-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Transform Your Life?
          </h2>
          <p className="text-xl text-blue-100 mb-12 max-w-2xl mx-auto">
            Join thousands of users who have already started their fitness
            journey with Coachlix. Your personal AI coach is waiting to help you
            succeed.
          </p>

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
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Meet the Creator
        </h2>
        <p className="text-lg text-gray-700 mb-4">
          Coachlix is created by <strong>Udit Kumar Tiwari</strong>, a tech
          enthusiast and fitness expert. Learn more about the mission behind
          Coachlix and the person building it.
        </p>
        <a
          href="/about"
          className="inline-block px-6 py-3 text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-full font-semibold hover:shadow-lg transition"
        >
          Read About Us
        </a>
      </section>
    </div>
  );
}

// Helper component: Today's Workout summary
function WorkoutTodaySummary({ plan, onStart }) {
  try {
    const today = new Date();
    const planStart = plan.startDate ? new Date(plan.startDate) : today;
    const dayDiff = Math.floor((today.setHours(0,0,0,0) - planStart.setHours(0,0,0,0)) / (1000 * 60 * 60 * 24));
    const weekNumber = Math.max(1, Math.min(plan.weeks?.length || 1, Math.floor(dayDiff / 7) + 1));
    const week = plan.weeks?.find((w) => w.weekNumber === weekNumber) || plan.weeks?.[0];
    const jsDay = new Date().getDay(); // 0 Sun ... 6 Sat
    const mappedDayNumber = jsDay === 0 ? 7 : jsDay; // map Sun->7
    const day = week?.days?.find((d) => d.dayNumber === mappedDayNumber) || week?.days?.[0];
    const workout = day?.workouts?.[0];

    if (!week || !day || !workout) {
      return (
        <div className="text-gray-600 dark:text-gray-300">
          Rest day or no workout scheduled for today.
        </div>
      );
    }

    const sessionLink = `/workout-plan/${plan._id}/session?week=${week.weekNumber}&day=${day.dayNumber}&workout=0`;

    return (
      <div>
        <div className="mb-3">
          <div className="text-sm text-gray-500">{week?.weeklyGoal || `Week ${week.weekNumber}`}</div>
          <h4 className="text-xl font-semibold">{workout.name}</h4>
        </div>
        <ul className="list-disc pl-5 text-sm text-gray-700 dark:text-gray-300 space-y-1">
          {workout.exercises?.slice(0, 6).map((ex, idx) => (
            <li key={idx}>
              <span className="font-medium">{ex.name}</span>{" "}
              {ex.targetSets ? `• ${ex.targetSets} sets` : null}{" "}
              {ex.targetReps ? `• ${ex.targetReps} reps` : null}
            </li>
          ))}
          {workout.exercises?.length > 6 && (
            <li>+{workout.exercises.length - 6} more…</li>
          )}
        </ul>
        <div className="mt-4">
          <Button onClick={() => onStart(sessionLink)}>Start Workout</Button>
        </div>
      </div>
    );
  } catch (e) {
    return <div className="text-gray-600">Unable to compute today&#39;s workout.</div>;
  }
}

// Helper component: Today&#39;s Meals summary
function DietTodaySummary({ plan }) {
  try {
    const today = new Date();
    const planStart = plan.createdAt ? new Date(plan.createdAt) : today;
    const dayDiff = Math.floor((today.setHours(0,0,0,0) - planStart.setHours(0,0,0,0)) / (1000 * 60 * 60 * 24));
    const dayIndex = Math.max(0, Math.min((plan.days?.length || 1) - 1, dayDiff));
    const day = plan.days?.[dayIndex] || plan.days?.[0];

    if (!day) {
      return <div className="text-gray-600 dark:text-gray-300">No meals scheduled for today.</div>;
    }

    const mealOrder = ["Breakfast", "Lunch", "Dinner", "Snacks"];
    const meals = [...(day.meals || [])].sort((a, b) => mealOrder.indexOf(a.type) - mealOrder.indexOf(b.type));

    return (
      <div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {mealOrder.map((type) => {
            const meal = meals.find((m) => m.type === type);
            return (
              <div key={type} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <div className="font-semibold">{type}</div>
                </div>
                {meal ? (
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    {(meal.items || []).slice(0, 3).map((it, i) => (
                      <div key={i}>{it.name} — {it.quantity || "1 serving"}</div>
                    ))}
                    {meal.items?.length > 3 && (
                      <div>+{meal.items.length - 3} more…</div>
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">No items yet</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  } catch (e) {
    return <div className="text-gray-600">Unable to compute today&#39;s meals.</div>;
  }
}

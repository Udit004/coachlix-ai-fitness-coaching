"use client"
import { useState, useEffect } from 'react';
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
  Heart
} from 'lucide-react';

export default function HomePage() {
  const [activeFeature, setActiveFeature] = useState(0);
  const [mounted, setMounted] = useState(false);

  // Only set mounted to true after component mounts on client
  useEffect(() => {
    setMounted(true);
  }, []);

  const features = [
    {
      icon: Bot,
      title: "AI-Powered Coaching",
      description: "Get personalized fitness advice from our advanced AI coach, available 24/7 to answer your questions and guide your journey.",
      color: "from-blue-500 to-purple-600"
    },
    {
      icon: Apple,
      title: "Custom Diet Plans",
      description: "Receive tailored nutrition plans based on your goals, dietary preferences, and lifestyle for optimal results.",
      color: "from-green-500 to-emerald-600"
    },
    {
      icon: Calendar,
      title: "Smart Workouts",
      description: "Access personalized workout routines that adapt to your fitness level, schedule, and available equipment.",
      color: "from-orange-500 to-red-600"
    },
    {
      icon: Target,
      title: "Goal Tracking",
      description: "Monitor your progress with detailed analytics and celebrate milestones on your fitness journey.",
      color: "from-purple-500 to-pink-600"
    }
  ];

  const howItWorks = [
    {
      step: "01",
      title: "Tell Us About You",
      description: "Share your fitness goals, current level, and preferences to get started.",
      icon: MessageSquare
    },
    {
      step: "02", 
      title: "Get Your Plan",
      description: "Receive personalized workout and diet plans tailored specifically for you.",
      icon: Brain
    },
    {
      step: "03",
      title: "Track Progress",
      description: "Follow your plans, chat with AI coach, and watch your transformation unfold.",
      icon: Trophy
    }
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Fitness Enthusiast",
      content: "Coachlix transformed my approach to fitness. The AI coach feels like having a personal trainer in my pocket!",
      rating: 5,
      avatar: "SJ"
    },
    {
      name: "Mike Chen",
      role: "Busy Professional", 
      content: "Finally found a solution that fits my hectic schedule. The personalized plans are incredibly effective.",
      rating: 5,
      avatar: "MC"
    },
    {
      name: "Emma Davis",
      role: "Beginner",
      content: "As someone new to fitness, Coachlix made everything simple and approachable. Highly recommend!",
      rating: 5,        
      avatar: "ED"
    }
  ];

  return (
    <div className="min-h-screen bg-white">
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
              <span className="text-sm font-medium text-gray-700">Powered by Advanced AI Technology</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
              Your Personal
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent block">
                AI Fitness Coach
              </span>
            </h1>
            
            <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed">
              Transform your health journey with personalized workout plans, nutrition guidance, 
              and 24/7 AI coaching tailored specifically to your goals and lifestyle.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <button className="group bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-full text-lg font-semibold hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 flex items-center justify-center">
                <Bot className="h-5 w-5 mr-2" />
                Ask AI Coach
                <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </button>
              <button className="group bg-white text-gray-900 px-8 py-4 rounded-full text-lg font-semibold border-2 border-gray-200 hover:border-blue-300 hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300 flex items-center justify-center">
                <Play className="h-5 w-5 mr-2" />
                Start Your Plan
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-2xl mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900 mb-1">10K+</div>
                <div className="text-gray-600">Active Users</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900 mb-1">50K+</div>
                <div className="text-gray-600">Workouts Completed</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900 mb-1">4.9★</div>
                <div className="text-gray-600">User Rating</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Key Features Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Succeed
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Comprehensive tools and AI-powered insights to help you reach your fitness goals faster than ever.
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
                        ? 'bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 shadow-lg' 
                        : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                    }`}
                    onClick={() => mounted && setActiveFeature(index)}
                  >
                    <div className="flex items-start space-x-4">
                      <div className={`p-3 rounded-xl bg-gradient-to-r ${feature.color}`}>
                        <IconComponent className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                          {feature.title}
                        </h3>
                        <p className="text-gray-600">
                          {feature.description}
                        </p>
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
              Get started with Coachlix in just three simple steps and begin your transformation today.
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
                    <p className="text-gray-600">
                      {step.description}
                    </p>
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
              Join thousands of satisfied users who have transformed their lives with Coachlix.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-8 hover:shadow-lg transition-shadow duration-300">
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
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
                    <div className="font-semibold text-gray-900">{testimonial.name}</div>
                    <div className="text-gray-600 text-sm">{testimonial.role}</div>
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
            Join thousands of users who have already started their fitness journey with Coachlix. 
            Your personal AI coach is waiting to help you succeed.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="group bg-white text-blue-600 px-8 py-4 rounded-full text-lg font-semibold hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 flex items-center justify-center">
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
    </div>
  );
}
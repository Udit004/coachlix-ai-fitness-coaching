'use client';
import { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  Send, 
  Mic, 
  MicOff,
  Paperclip, 
  MoreVertical,
  Dumbbell,
  Apple,
  Calendar,
  Target,
  Zap,
  User,
  Settings,
  Trash2,
  Copy,
  ThumbsUp,
  ThumbsDown,
  Sparkles,
  Activity,
  Clock,
  Menu,
  X,
  AlertCircle
} from 'lucide-react';
import axios from 'axios';
import { Toaster, toast } from 'react-hot-toast';
import ProtectedRoute from '@/auth/ProtectedRoute';

export default function AIChatPage() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'ai',
      content: "Hi! I'm your personal AI fitness coach. I'm here to help you with personalized workout plans, nutrition advice, and badminton training tips. What would you like to work on today?",
      timestamp: new Date(Date.now() - 60000),
      suggestions: [
        "Create a badminton training plan",
        "Design a diet for muscle gain",
        "Weekly workout schedule",
        "Pre-match nutrition tips"
      ]
    }
  ]);
  
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('general');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  const plans = [
    { id: 'general', name: 'General Fitness', icon: Activity, color: 'from-blue-500 to-purple-600' },
    { id: 'badminton', name: 'Badminton Player', icon: Target, color: 'from-green-500 to-emerald-600' },
    { id: 'weight-loss', name: 'Weight Loss', icon: Apple, color: 'from-orange-500 to-red-600' },
    { id: 'muscle-gain', name: 'Muscle Building', icon: Dumbbell, color: 'from-purple-500 to-pink-600' }
  ];

  const quickActions = [
    { icon: Dumbbell, text: "Create a workout plan for me", color: "bg-gradient-to-r from-blue-500 to-blue-600" },
    { icon: Apple, text: "Design a nutrition plan", color: "bg-gradient-to-r from-green-500 to-green-600" },
    { icon: Calendar, text: "Help me create a weekly schedule", color: "bg-gradient-to-r from-orange-500 to-orange-600" },
    { icon: Target, text: "Set fitness goals with me", color: "bg-gradient-to-r from-purple-500 to-purple-600" }
  ];

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isTyping) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputValue,
      timestamp: new Date(),
      plan: selectedPlan
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputValue;
    setInputValue('');
    setIsTyping(true);
    setError(null);

    try {
      const response = await axios.post('/api/chat', {
        message: currentInput,
        plan: selectedPlan,
        conversationHistory: messages
      });
      const data = response.data;

      if (!data.success) {
        throw new Error(data.message || 'Failed to get AI response');
      }

      const aiResponse = {
        id: Date.now() + 1,
        type: 'ai',
        content: data.response,
        timestamp: new Date(),
        suggestions: data.suggestions
      };

      setMessages(prev => [...prev, aiResponse]);
    } catch (error) {
      console.error('Error sending message:', error);
      setError(error.message);
      
      // Add error message to chat
      const errorMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: "I apologize, but I'm having trouble responding right now. Please try again in a moment.",
        timestamp: new Date(),
        suggestions: ["Try again", "Check connection", "Refresh page"],
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setInputValue(suggestion);
    textareaRef.current?.focus();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    // TODO: Implement speech-to-text functionality
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
    toast.success('copied to clipboard!');
  };

  const clearChat = () => {
    setMessages([messages[0]]); // Keep only the initial message
    setError(null);
  };

  return (
    <ProtectedRoute>
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
        <Toaster position="top-right" />
      {/* Enhanced Header */}
      <div className="bg-white/90 backdrop-blur-lg border-b border-gray-200/50 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-lg">
                  <Bot className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">AI Fitness Coach</h1>
                  <p className="text-sm text-gray-600">Your 24/7 Personal Trainer</p>
                </div>
              </div>
              
              {/* Enhanced Plan Selector */}
              <div className="hidden lg:flex items-center space-x-2 bg-gray-100/80 rounded-xl p-1 backdrop-blur-sm">
                {plans.map((plan) => {
                  const IconComponent = plan.icon;
                  return (
                    <button
                      key={plan.id}
                      onClick={() => setSelectedPlan(plan.id)}
                      className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                        selectedPlan === plan.id
                          ? 'bg-white text-gray-900 shadow-md transform scale-105'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                      }`}
                    >
                      <IconComponent className="h-4 w-4" />
                      <span>{plan.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button 
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors lg:hidden"
              >
                <Menu className="h-5 w-5" />
              </button>
              <button 
                onClick={clearChat}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                title="Clear Chat"
              >
                <Trash2 className="h-5 w-5" />
              </button>
              <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                <Settings className="h-5 w-5" />
              </button>
              <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                <MoreVertical className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 py-2">
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <span className="text-red-700 text-sm">{error}</span>
            <button 
              onClick={() => setError(null)}
              className="ml-auto text-red-500 hover:text-red-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Enhanced Sidebar */}
          <div className={`lg:col-span-1 space-y-6 ${sidebarOpen ? 'block' : 'hidden lg:block'}`}>
            {/* Mobile close button */}
            <div className="lg:hidden flex justify-end mb-4">
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Mobile Plan Selector */}
            <div className="lg:hidden bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-gray-200/50">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Training Focus</h3>
              <div className="grid grid-cols-2 gap-2">
                {plans.map((plan) => {
                  const IconComponent = plan.icon;
                  return (
                    <button
                      key={plan.id}
                      onClick={() => setSelectedPlan(plan.id)}
                      className={`flex items-center space-x-2 p-3 rounded-lg text-xs font-medium transition-all duration-200 ${
                        selectedPlan === plan.id
                          ? 'bg-blue-100 text-blue-900 border-2 border-blue-300'
                          : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <IconComponent className="h-4 w-4" />
                      <span>{plan.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-gray-200/50">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Zap className="h-5 w-5 mr-2 text-blue-600" />
                Quick Actions
              </h3>
              <div className="grid grid-cols-1 gap-3">
                {quickActions.map((action, index) => {
                  const IconComponent = action.icon;
                  return (
                    <button
                      key={index}
                      onClick={() => handleSuggestionClick(action.text)}
                      className={`flex items-center space-x-3 p-4 rounded-xl ${action.color} text-white hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200`}
                    >
                      <IconComponent className="h-5 w-5" />
                      <span className="font-medium text-sm">{action.text}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Enhanced Stats */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-gray-200/50">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Activity className="h-5 w-5 mr-2 text-green-600" />
                Today's Progress
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <span className="text-gray-700 font-medium">Calories Burned</span>
                  <span className="font-bold text-green-600">320 kcal</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <span className="text-gray-700 font-medium">Workout Time</span>
                  <span className="font-bold text-blue-600">45 min</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                  <span className="text-gray-700 font-medium">Water Intake</span>
                  <span className="font-bold text-purple-600">1.2L / 2.5L</span>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Chat Interface */}
          <div className="lg:col-span-3">
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 flex flex-col h-[75vh]">
              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                {messages.map((message) => (
                  <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] ${message.type === 'user' ? 'order-2' : 'order-1'}`}>
                      <div className={`flex items-start space-x-3 ${message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                        <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center shadow-md ${
                          message.type === 'user' 
                            ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white' 
                            : message.isError
                            ? 'bg-gradient-to-r from-red-500 to-red-600 text-white'
                            : 'bg-gradient-to-r from-green-500 to-emerald-600 text-white'
                        }`}>
                          {message.type === 'user' ? <User className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
                        </div>
                        
                        <div className={`flex-1 ${message.type === 'user' ? 'text-right' : 'text-left'}`}>
                          <div className={`inline-block p-4 rounded-2xl shadow-sm ${
                            message.type === 'user'
                              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                              : message.isError
                              ? 'bg-red-50 text-red-900 border border-red-200'
                              : 'bg-gray-50 text-gray-900 border border-gray-200'
                          }`}>
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                          </div>
                          
                          <div className={`flex items-center mt-2 space-x-2 text-xs text-gray-500 ${
                            message.type === 'user' ? 'justify-end' : 'justify-start'
                          }`}>
                            <Clock className="h-3 w-3" />
                            <span>{formatTime(message.timestamp)}</span>
                            {message.type === 'ai' && !message.isError && (
                              <div className="flex items-center space-x-1 ml-2">
                                <button className="p-1 hover:bg-gray-200 rounded transition-colors">
                                  <ThumbsUp className="h-3 w-3" />
                                </button>
                                <button className="p-1 hover:bg-gray-200 rounded transition-colors">
                                  <ThumbsDown className="h-3 w-3" />
                                </button>
                                <button 
                                  onClick={() => copyToClipboard(message.content)}
                                  className="p-1 hover:bg-gray-200 rounded transition-colors"
                                >
                                  <Copy className="h-3 w-3" />
                                </button>
                              </div>
                            )}
                          </div>
                          
                          {/* AI Suggestions */}
                          {message.type === 'ai' && message.suggestions && (
                            <div className="mt-4 flex flex-wrap gap-2">
                              {message.suggestions.map((suggestion, index) => (
                                <button
                                  key={index}
                                  onClick={() => handleSuggestionClick(suggestion)}
                                  className="px-3 py-2 bg-blue-50 text-blue-700 text-xs rounded-full hover:bg-blue-100 transition-colors border border-blue-200 shadow-sm"
                                >
                                  {suggestion}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* Typing Indicator */}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-md">
                        <Bot className="h-5 w-5 text-white" />
                      </div>
                      <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200">
                        <div className="flex space-x-2">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Enhanced Input Area */}
              <div className="border-t border-gray-200/50 p-6 bg-white/50 backdrop-blur-sm">
                <div className="flex items-end space-x-4">
                  <div className="flex-1 relative">
                    <textarea
                      ref={textareaRef}
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Ask about workouts, diet plans, badminton training..."
                      className="w-full resize-none rounded-2xl border border-gray-300 px-4 py-3 pr-20 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent max-h-32 min-h-[48px] bg-white/90 backdrop-blur-sm text-gray-900 placeholder-gray-500 shadow-sm"
                      rows={1}
                      disabled={isTyping}
                      style={{
                        fontSize: '16px',
                        lineHeight: '1.5',
                        color: '#1f2937'
                      }}
                    />
                    
                    <div className="absolute bottom-3 right-3 flex items-center space-x-2">
                      <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100">
                        <Paperclip className="h-4 w-4" />
                      </button>
                      <button
                        onClick={toggleRecording}
                        className={`p-2 transition-colors rounded-lg ${
                          isRecording 
                            ? 'text-red-500 hover:text-red-600 hover:bg-red-50' 
                            : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  
                  <button
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim() || isTyping}
                    className="flex-shrink-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-3 rounded-2xl hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
                  >
                    <Send className="h-5 w-5" />
                  </button>
                </div>
                
                <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="h-3 w-3 text-blue-500" />
                    <span>Powered by DeepSeek AI</span>
                  </div>
                  <span className="hidden sm:inline">Press Enter to send, Shift + Enter for new line</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </ProtectedRoute>
  );
}
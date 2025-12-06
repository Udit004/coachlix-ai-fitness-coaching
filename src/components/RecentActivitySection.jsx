import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '../auth/AuthContext';
import useRecentActivity from '../hooks/useRecentActivity';
import {
  MessageSquare,
  Dumbbell,
  Apple,
  Clock,
  Play,
  TrendingUp,
  Calendar,
  Target,
  ChevronRight,
  Activity,
  BookOpen,
  Zap,
  Plus,
  RefreshCw
} from 'lucide-react';

const RecentActivitySection = () => {
  const router = useRouter();
  const { user } = useAuthContext();

  // Pull ALL recent activity from the hook
  const {
    recentChats,
    activeWorkouts,
    dietPlans,
    progress,
    loading,
    refreshing,
    handleRefresh
  } = useRecentActivity(user?.uid);

  const formatTimeAgo = (date) => {
    if (!date) return '';
    const now = new Date();
    const diff = now - new Date(date);
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return 'Just now';
  };

  const getPlanColor = (plan) => {
    const colors = {
      'weight-loss': 'bg-red-100 text-red-700',
      'muscle-gain': 'bg-blue-100 text-blue-700',
      'general': 'bg-green-100 text-green-700',
      'endurance': 'bg-purple-100 text-purple-700'
    };
    return colors[plan] || colors.general;
  };

  if (loading) {
    return (
      <section className="pt-8 pb-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Recent Activity</h2>
            <div className="animate-spin">
              <RefreshCw className="h-5 w-5 text-gray-400" />
            </div>
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-4 animate-pulse">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="pt-8 pb-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Activity className="h-6 w-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Recent Activity</h2>
          </div>
          <button
            onClick={handleRefresh}
            className={`p-2 rounded-full bg-white dark:bg-gray-800 shadow-md hover:shadow-lg transition-all duration-200 ${
              refreshing ? 'animate-spin' : 'hover:scale-105'
            }`}
          >
            <RefreshCw className="h-5 w-5 text-gray-600 dark:text-gray-300" />
          </button>
        </div>

        {/* Quick Stats */}
        {progress && (
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{progress.weeklyWorkouts}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">This Week</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{progress.currentStreak}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Day Streak</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">
                {Math.round((progress.weeklyWorkouts / progress.weeklyTarget) * 100)}%
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Goal Progress</div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <button
            onClick={() => router.push('/ai-chat')}
            className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-xl flex items-center justify-center space-x-2 hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg"
          >
            <MessageSquare className="h-5 w-5" />
            <span className="font-semibold">Ask AI Coach</span>
          </button>
          <button
            onClick={() => router.push('/workout-plan')}
            className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 rounded-xl flex items-center justify-center space-x-2 hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-lg"
          >
            <Plus className="h-5 w-5" />
            <span className="font-semibold">New Workout</span>
          </button>
        </div>

        {/* Recent Chats */}
        {recentChats.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                <MessageSquare className="h-5 w-5 mr-2 text-blue-600" />
                Recent Conversations
              </h3>
              <button
                onClick={() => router.push('/ai-chat')}
                className="text-blue-600 text-sm font-medium hover:text-blue-700 flex items-center"
              >
                View All
                <ChevronRight className="h-4 w-4 ml-1" />
              </button>
            </div>
            <div className="space-y-3">
              {recentChats.map((chat) => (
                <div
                  key={chat._id}
                  onClick={() => router.push(`/ai-chat?chatId=${chat._id}`)}
                  className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-500 hover:shadow-md transition-all duration-200 cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-gray-900 dark:text-white line-clamp-1 flex-1">
                      {chat.title}
                    </h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPlanColor(chat.plan)}`}>
                      {chat.plan.replace('-', ' ')}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-1 mb-2">{chat.lastMessage}</p>
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span className="flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {formatTimeAgo(chat.updatedAt)}
                    </span>
                    <span>{chat.messageCount} messages</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Active Workouts */}
        {activeWorkouts.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                <Dumbbell className="h-5 w-5 mr-2 text-green-600" />
                Active Workouts
              </h3>
              <button
                onClick={() => router.push('/workout-plan')}
                className="text-green-600 text-sm font-medium hover:text-green-700 flex items-center"
              >
                View All
                <ChevronRight className="h-4 w-4 ml-1" />
              </button>
            </div>
            <div className="space-y-3">
              {activeWorkouts.map((workout) => (
                <div
                  key={workout._id}
                  onClick={() =>
                    router.push(
                      `/workout-plan/${workout._id}/week/${workout.currentWeek}/day/${workout.currentDay}/workout/0`
                    )
                  }
                  className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 hover:border-green-200 dark:hover:border-green-500 hover:shadow-md transition-all duration-200 cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-900 dark:text-white">{workout.name}</h4>
                    <div className="flex items-center bg-green-100 text-green-700 px-2 py-1 rounded-full">
                      <Play className="h-3 w-3 mr-1" />
                      <span className="text-xs font-medium">Continue</span>
                    </div>
                  </div>
                  {/* Progress Bar */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-300 mb-1">
                      <span>Week {workout.currentWeek}, Day {workout.currentDay}</span>
                      <span>{workout.progress}% complete</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${workout.progress}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span className="flex items-center">
                      <Target className="h-3 w-3 mr-1" />
                      Next: {workout.nextWorkout}
                    </span>
                    <span>{workout.exerciseCount} exercises</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Diet Plans */}
        

        {/* Empty State */}
        {recentChats.length === 0 && activeWorkouts.length === 0 && dietPlans.length === 0 && (
          <div className="text-center py-12">
            <div className="mb-4">
              <Zap className="h-12 w-12 text-gray-300 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Ready to Start Your Journey?</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-sm mx-auto">
              Begin by chatting with your AI coach or creating your first workout plan.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => router.push('/ai-chat')}
                className="bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Start Chatting
              </button>
              <button
                onClick={() => router.push('/workout-plans')}
                className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 px-6 py-3 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 flex items-center justify-center"
              >
                <BookOpen className="h-4 w-4 mr-2" />
                Browse Plans
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default RecentActivitySection;

"use client";
import React, { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Filter,
  Search,
  Calendar,
  Target,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import DietPlanCard from "./DietPlanCard";
import CreatePlanModal from "./CreatePlanModal";
import dietPlanService from "../../service/dietPlanService";
import { useAuth } from "../../hooks/useAuth";

export default function DietPlansPage() {
  const { user, loading: authLoading } = useAuth();
  const [dietPlans, setDietPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGoal, setSelectedGoal] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  const goals = [
    "Weight Loss",
    "Muscle Gain", 
    "Maintenance",
    "Cutting",
    "Bulking",
    "General Health",
  ];

  // Memoized fetch function to prevent unnecessary re-renders
  const fetchDietPlans = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);

      const options = {
        activeOnly: true,
        ...(selectedGoal && { goal: selectedGoal }),
        sort:
          sortBy === "newest"
            ? "-createdAt"
            : sortBy === "oldest"
            ? "createdAt"
            : "-updatedAt",
      };

      const data = await dietPlanService.getDietPlans(options);
      
      // Ensure data structure is valid
      if (data && Array.isArray(data.plans)) {
        setDietPlans(data.plans);
      } else if (Array.isArray(data)) {
        setDietPlans(data);
      } else {
        console.warn("Unexpected data structure:", data);
        setDietPlans([]);
      }
    } catch (err) {
      console.error("Error fetching diet plans:", err);
      setError(err?.message || "Failed to fetch diet plans");
      setDietPlans([]); // Ensure state is always an array
    } finally {
      setLoading(false);
    }
  }, [user, selectedGoal, sortBy]);

  // Fetch diet plans when dependencies change
  useEffect(() => {
    if (!authLoading && user) {
      fetchDietPlans();
    } else if (!authLoading && !user) {
      // Clear plans when user logs out
      setDietPlans([]);
      setLoading(false);
    }
  }, [authLoading, user, fetchDietPlans]);

  // Safe filter with null checks
  const filteredPlans = React.useMemo(() => {
    if (!Array.isArray(dietPlans)) return [];
    
    return dietPlans.filter((plan) => {
      if (!plan) return false;
      
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        !searchTerm ||
        (plan.name && plan.name.toLowerCase().includes(searchLower)) ||
        (plan.description && plan.description.toLowerCase().includes(searchLower)) ||
        (plan.goal && plan.goal.toLowerCase().includes(searchLower));

      return matchesSearch;
    });
  }, [dietPlans, searchTerm]);

  const handleCreatePlan = async (planData) => {
    try {
      setError(null); // Clear any previous errors
      
      if (!planData || !planData.name?.trim()) {
        throw new Error("Plan name is required");
      }

      const newPlan = await dietPlanService.createDietPlan(planData);

      if (!newPlan) {
        throw new Error("Failed to create plan - no data returned");
      }

      // Ensure the new plan has all required properties
      const planWithDefaults = {
        _id: newPlan._id || newPlan.id || `temp-${Date.now()}`,
        name: newPlan.name || "",
        description: newPlan.description || "",
        goal: newPlan.goal || "",
        tags: Array.isArray(newPlan.tags) ? newPlan.tags : [],
        isActive: newPlan.isActive !== undefined ? newPlan.isActive : true,
        targetCalories: newPlan.targetCalories || 2000,
        targetProtein: newPlan.targetProtein || 0,
        targetCarbs: newPlan.targetCarbs || 0,
        targetFats: newPlan.targetFats || 0,
        duration: newPlan.duration || 7,
        difficulty: newPlan.difficulty || "Beginner",
        createdAt: newPlan.createdAt || new Date().toISOString(),
        ...newPlan, // Override with actual data
      };

      // Add to the beginning of the list
      setDietPlans((prev) => {
        const updated = [planWithDefaults, ...prev];
        return updated;
      });

      setShowCreateModal(false);

      // Clear filters if they would hide the new plan
      if (searchTerm) {
        const newPlanMatchesSearch =
          planWithDefaults.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          planWithDefaults.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          planWithDefaults.goal.toLowerCase().includes(searchTerm.toLowerCase());

        if (!newPlanMatchesSearch) {
          setSearchTerm("");
        }
      }

      if (selectedGoal && selectedGoal !== planWithDefaults.goal) {
        setSelectedGoal("");
      }
    } catch (err) {
      console.error("Error creating plan:", err);
      setError(err?.message || "Failed to create plan");
    }
  };

  const handleDeletePlan = async (planId) => {
    if (!planId) {
      console.error("No plan ID provided for deletion");
      return;
    }

    if (!confirm("Are you sure you want to delete this diet plan?")) return;

    try {
      setError(null);
      await dietPlanService.deleteDietPlan(planId);
      setDietPlans((prev) => prev.filter((plan) => plan && plan._id !== planId));
    } catch (err) {
      console.error("Error deleting plan:", err);
      setError(err?.message || "Failed to delete plan");
    }
  };

  const handleClonePlan = async (planId, newName) => {
    if (!planId || !newName?.trim()) {
      console.error("Plan ID and name are required for cloning");
      return;
    }

    try {
      setError(null);
      const clonedPlan = await dietPlanService.cloneDietPlan(planId, newName);
      
      if (clonedPlan) {
        setDietPlans((prev) => [clonedPlan, ...prev]);
      }
    } catch (err) {
      console.error("Error cloning plan:", err);
      setError(err?.message || "Failed to clone plan");
    }
  };

  const calculateAverageCalories = () => {
    if (!Array.isArray(dietPlans) || dietPlans.length === 0) return 0;
    
    const total = dietPlans.reduce((sum, plan) => {
      return sum + (plan?.targetCalories || 0);
    }, 0);
    
    return Math.round(total / dietPlans.length);
  };

  // Show loading while auth is loading
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded-lg w-48 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }, (_, i) => (
                <div
                  key={i}
                  className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm"
                >
                  <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded mb-4"></div>
                  <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded mb-2"></div>
                  <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show login prompt if user is not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="max-w-sm mx-auto">
              <div className="bg-gray-100 dark:bg-gray-800 rounded-full h-20 w-20 flex items-center justify-center mx-auto mb-4">
                <Calendar className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Authentication Required
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Please log in to access your diet plans
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show loading while fetching plans
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded-lg w-48 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }, (_, i) => (
                <div
                  key={i}
                  className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm"
                >
                  <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded mb-4"></div>
                  <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded mb-2"></div>
                  <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Diet Plans
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage your nutrition plans and track your goals
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="mt-4 sm:mt-0 inline-flex items-center space-x-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <Plus className="h-5 w-5" />
            <span>Create Plan</span>
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Calendar className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {Array.isArray(dietPlans) ? dietPlans.length : 0}
                </p>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Total Plans
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                <Target className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {Array.isArray(dietPlans) 
                    ? dietPlans.filter((p) => p?.isActive).length 
                    : 0}
                </p>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Active Plans
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <TrendingUp className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {calculateAverageCalories().toLocaleString()}
                </p>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Avg Calories
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search plans..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />
            </div>

            {/* Goal Filter */}
            <select
              value={selectedGoal}
              onChange={(e) => setSelectedGoal(e.target.value)}
              className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">All Goals</option>
              {goals.map((goal) => (
                <option key={goal} value={goal}>
                  {goal}
                </option>
              ))}
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="updated">Recently Updated</option>
            </select>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-8">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mr-2" />
              <p className="text-red-800 dark:text-red-200">Error: {error}</p>
            </div>
            <button
              onClick={fetchDietPlans}
              className="mt-2 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* Diet Plans Grid */}
        {filteredPlans.length === 0 ? (
          <div className="text-center py-12">
            <div className="max-w-sm mx-auto">
              <div className="bg-gray-100 dark:bg-gray-800 rounded-full h-20 w-20 flex items-center justify-center mx-auto mb-4">
                <Calendar className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No diet plans found
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {searchTerm || selectedGoal
                  ? "Try adjusting your search or filters"
                  : "Create your first diet plan to get started"}
              </p>
              {!searchTerm && !selectedGoal && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center space-x-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-colors"
                >
                  <Plus className="h-5 w-5" />
                  <span>Create Your First Plan</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPlans.map((plan) => {
              if (!plan || !plan._id) {
                console.warn("Invalid plan data:", plan);
                return null;
              }
              
              return (
                <DietPlanCard
                  key={plan._id}
                  plan={plan}
                  onDelete={handleDeletePlan}
                  onClone={handleClonePlan}
                />
              );
            })}
          </div>
        )}

        {/* Create Plan Modal */}
        {showCreateModal && (
          <CreatePlanModal
            onClose={() => setShowCreateModal(false)}
            onCreate={handleCreatePlan}
          />
        )}
      </div>
    </div>
  );
}
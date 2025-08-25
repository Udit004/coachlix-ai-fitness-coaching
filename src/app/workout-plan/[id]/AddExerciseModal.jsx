"use client";
import React, { useState, useEffect, useMemo } from "react";
import {
  X,
  Search,
  Filter,
  Dumbbell,
  Target,
  Clock,
  Plus,
  Check,
  ChevronDown,
} from "lucide-react";
import exerciseService from "../../../service/exerciseService";
import workoutPlanService from "../../../service/workoutPlanService";

export default function AddExerciseModal({
  onClose,
  onAdd,
  planId,
  weekNumber,
  dayNumber,
  workoutId,
}) {
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState("");
  const [selectedEquipment, setSelectedEquipment] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedExercises, setSelectedExercises] = useState([]);
  const [selectedDetails, setSelectedDetails] = useState({}); // per-exercise targets
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // AI exercise state
  const [aiExercise, setAiExercise] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [showAiResult, setShowAiResult] = useState(false);

  // Adding exercises state
  const [adding, setAdding] = useState(false);

  const categories = [
    "Strength",
    "Cardio",
    "Flexibility",
    "Sports",
    "Functional",
    "Plyometric",
    "Balance",
  ];

  const muscleGroups = [
    "Chest",
    "Back",
    "Shoulders",
    "Arms",
    "Legs",
    "Core",
    "Glutes",
    "Calves",
    "Forearms",
    "Full Body",
  ];

  const equipment = [
    "Barbell",
    "Dumbbell",
    "Machine",
    "Cable",
    "Bodyweight",
    "Resistance Band",
    "Kettlebell",
    "Medicine Ball",
    "TRX",
    "Cardio Equipment",
    "Pull-up Bar",
    "Bench",
  ];

  const difficulties = ["Beginner", "Intermediate", "Advanced"];

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm.trim()), 300);
    return () => clearTimeout(t);
  }, [searchTerm]);

  useEffect(() => {
    fetchExercises();
  }, [
    debouncedSearch,
    selectedCategory,
    selectedMuscleGroup,
    selectedEquipment,
    selectedDifficulty,
  ]);

  const fetchExercises = async (pageNum = 1) => {
    try {
      setLoading(pageNum === 1);

      const options = {
        page: pageNum,
        limit: 20,
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(selectedCategory && { category: selectedCategory }),
        ...(selectedMuscleGroup && { muscleGroups: [selectedMuscleGroup] }),
        ...(selectedEquipment && { equipment: [selectedEquipment] }),
        ...(selectedDifficulty && { difficulty: selectedDifficulty }),
      };

      let response = await exerciseService.getExercises(options);

      // Handle different response formats
      let newExercises;
      if (response.exercises) {
        newExercises = response.exercises;
      } else if (Array.isArray(response)) {
        newExercises = response;
      } else if (response.data) {
        newExercises = response.data;
      } else {
        console.error("Unexpected response format:", response);
        newExercises = [];
      }

      // If nothing found from DB and we have a search term, fallback to external suggestions
      if ((newExercises?.length || 0) === 0) {
        const suggestQuery = debouncedSearch || selectedMuscleGroup || selectedEquipment || selectedCategory;
        if (suggestQuery) {
        try {
          console.log('🔎 Falling back to external suggestions for:', suggestQuery);
          const suggestResp = await fetch(`/api/exercises/suggest?q=${encodeURIComponent(suggestQuery)}`, { cache: 'no-store' });
          const suggestJson = await suggestResp.json();
          if (suggestJson?.success && Array.isArray(suggestJson.exercises)) {
            newExercises = suggestJson.exercises;
          }
        } catch (e) {
          console.warn('External suggestion failed', e);
        }
        }
      }

      if (pageNum === 1) {
        setExercises(newExercises);
      } else {
        setExercises((prev) => [...prev, ...newExercises]);
      }

      setHasMore(newExercises.length === 20);
      setPage(pageNum);
    } catch (error) {
      console.error("Error fetching exercises:", error);
      if (pageNum === 1) {
        setExercises([]);
      }
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    if (hasMore && !loading) {
      fetchExercises(page + 1);
    }
  };

  const toggleExerciseSelection = (exercise) => {
    setSelectedExercises((prev) => {
      const exists = prev.find((e) => e._id === exercise._id);
      if (exists) {
        const updated = prev.filter((e) => e._id !== exercise._id);
        setSelectedDetails((d) => {
          const nd = { ...d };
          delete nd[exercise._id];
          return nd;
        });
        return updated;
      } else {
        // initialize per-exercise targets
        setSelectedDetails((d) => ({
          ...d,
          [exercise._id]: {
            targetSets: exercise.metrics?.defaultSets || 3,
            targetReps: exercise.metrics?.defaultReps || exercise.targetReps || "8-12",
            targetWeight: 0,
          },
        }));
        return [...prev, exercise];
      }
    });
  };

  const handleAddExercises = async () => {
    if (selectedExercises.length === 0 || adding) return;
    
    if (!planId || !weekNumber || !dayNumber || workoutId === undefined) {
      console.error("Missing required props:", {
        planId,
        weekNumber,
        dayNumber,
        workoutId,
      });
      alert("Missing required information to add exercises. Please try again.");
      return;
    }

    try {
      setAdding(true);
      console.log("=== ADDING EXERCISES ===");
      console.log("Selected exercises:", selectedExercises);
      console.log("Context:", { planId, weekNumber, dayNumber, workoutId });

      // Prepare exercises data according to the WorkoutPlan ExerciseSchema
      const exerciseData = {
        exercises: selectedExercises.map((exercise) => ({
          // Required fields for WorkoutPlan ExerciseSchema
          exerciseName: exercise.name,
          name: exercise.name,
          category: exercise.category || "Strength",
          
          // Muscle groups - map primaryMuscleGroups to muscleGroups for WorkoutPlan schema
          muscleGroups: exercise.primaryMuscleGroups || exercise.muscleGroups || [],
          
          // Equipment
          equipment: exercise.equipment || ["Bodyweight"],
          
          // Target values (customizable per selection)
          targetSets: selectedDetails[exercise._id]?.targetSets ?? (exercise.metrics?.defaultSets || 3),
          targetReps: selectedDetails[exercise._id]?.targetReps ?? (exercise.metrics?.defaultReps || exercise.targetReps || "8-12"),
          targetWeight: Number.isFinite(selectedDetails[exercise._id]?.targetWeight)
            ? selectedDetails[exercise._id].targetWeight
            : 0,
          
          // Instructions and metadata
          instructions: Array.isArray(exercise.instructions)
            ? exercise.instructions.map(inst => inst.description || inst).join(". ")
            : exercise.instructions || exercise.description || "",
          
          // Additional fields
          videoUrl: exercise.videoUrl || "",
          difficulty: exercise.difficulty || "Beginner",
          
          // Initialize empty sets array and completion status
          sets: [],
          isCompleted: false,
          
          // Personal record tracking
          personalRecord: {
            weight: 0,
            reps: 0,
            date: null
          }
        })),
      };

      console.log("Prepared exercise data:", exerciseData);

      // Use the workout plan service to add exercises
      await workoutPlanService.addExercisesToWorkout(
        planId,
        weekNumber,
        dayNumber,
        workoutId,
        exerciseData
      );

      console.log("✅ Exercises added successfully!");
      
      // Call the onAdd callback if provided (for refreshing parent component)
      if (onAdd && typeof onAdd === 'function') {
        await onAdd();
      }

      // Close modal on success
      onClose();
      
      // Show success message
      alert(`Successfully added ${selectedExercises.length} exercise${selectedExercises.length !== 1 ? 's' : ''} to workout!`);

    } catch (error) {
      console.error("Error adding exercises:", error);
      alert(`Failed to add exercises: ${error.message || "Unknown error"}`);
    } finally {
      setAdding(false);
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case "Beginner":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "Intermediate":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "Advanced":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCategory("");
    setSelectedMuscleGroup("");
    setSelectedEquipment("");
    setSelectedDifficulty("");
  };

  const searchWithAI = async (searchTerm) => {
    if (!searchTerm || searchTerm.length < 3) return;

    try {
      setAiLoading(true);
      const response = await exerciseService.searchExerciseWithAI(searchTerm);
      setAiExercise(response.exercise);
      setShowAiResult(true);
    } catch (error) {
      console.error("AI search failed:", error);
      alert("AI search failed. Please try regular search.");
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Dumbbell className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Add Exercises
              </h2>
              {selectedExercises.length > 0 && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedExercises.length} exercise
                  {selectedExercises.length !== 1 ? "s" : ""} selected
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search and Filters */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search exercises..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            {/* AI Search Button */}
            <button
              onClick={() => searchWithAI(searchTerm)}
              disabled={aiLoading || searchTerm.length < 3}
              className="flex items-center space-x-2 px-4 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              <span>🤖</span>
              <span>{aiLoading ? "Searching..." : "AI Search"}</span>
            </button>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <Filter className="h-5 w-5" />
              <span>Filters</span>
              <ChevronDown
                className={`h-4 w-4 transition-transform ${
                  showFilters ? "rotate-180" : ""
                }`}
              />
            </button>
          </div>

          {/* Quick filter chips */}
          <div className="flex flex-wrap gap-2 mb-4">
            {["Chest","Back","Legs","Arms","Shoulders","Core"].map((mg) => (
              <button
                key={mg}
                onClick={() => setSelectedMuscleGroup(selectedMuscleGroup === mg ? "" : mg)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                  selectedMuscleGroup === mg
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600"
                }`}
              >
                {mg}
              </button>
            ))}
            {["Barbell","Dumbbell","Machine","Cable","Bodyweight"].map((eq) => (
              <button
                key={eq}
                onClick={() => setSelectedEquipment(selectedEquipment === eq ? "" : eq)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                  selectedEquipment === eq
                    ? "bg-emerald-600 text-white border-emerald-600"
                    : "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600"
                }`}
              >
                {eq}
              </button>
            ))}
          </div>

          {/* AI Result */}
          {showAiResult && aiExercise && (
            <div className="mb-6 p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-purple-900 dark:text-purple-100 flex items-center space-x-2">
                  <span>🤖</span>
                  <span>AI Generated Exercise</span>
                </h3>
                <button
                  onClick={() => setShowAiResult(false)}
                  className="text-purple-600 hover:text-purple-800"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium text-lg">{aiExercise.name}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {aiExercise.description}
                </p>

                <div className="flex flex-wrap gap-2">
                  <span className="px-2 py-1 bg-purple-100 dark:bg-purple-800 text-purple-800 dark:text-purple-200 rounded text-xs">
                    {aiExercise.category}
                  </span>
                  <span className="px-2 py-1 bg-purple-100 dark:bg-purple-800 text-purple-800 dark:text-purple-200 rounded text-xs">
                    {aiExercise.difficulty}
                  </span>
                  {aiExercise.primaryMuscleGroups?.map((muscle) => (
                    <span
                      key={muscle}
                      className="px-2 py-1 bg-purple-100 dark:bg-purple-800 text-purple-800 dark:text-purple-200 rounded text-xs"
                    >
                      {muscle}
                    </span>
                  ))}
                </div>

                <button
                  onClick={() => {
                    toggleExerciseSelection(aiExercise);
                    setShowAiResult(false);
                  }}
                  className="w-full mt-3 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                >
                  Add This Exercise
                </button>
              </div>
            </div>
          )}

          {/* Filters */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>

              <select
                value={selectedMuscleGroup}
                onChange={(e) => setSelectedMuscleGroup(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">All Muscle Groups</option>
                {muscleGroups.map((group) => (
                  <option key={group} value={group}>
                    {group}
                  </option>
                ))}
              </select>

              <select
                value={selectedEquipment}
                onChange={(e) => setSelectedEquipment(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">All Equipment</option>
                {equipment.map((eq) => (
                  <option key={eq} value={eq}>
                    {eq}
                  </option>
                ))}
              </select>

              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">All Difficulties</option>
                {difficulties.map((diff) => (
                  <option key={diff} value={diff}>
                    {diff}
                  </option>
                ))}
              </select>

              <button
                onClick={clearFilters}
                className="px-4 py-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>

        {/* Exercise List */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Selected tray */}
          {selectedExercises.length > 0 && (
            <div className="mb-4 p-3 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
              <div className="flex flex-wrap gap-2">
                {selectedExercises.map((ex) => (
                  <div key={ex._id} className="flex items-center gap-2 px-3 py-2 rounded-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600">
                    <span className="text-sm font-medium text-gray-800 dark:text-gray-100">{ex.name}</span>
                    <input
                      type="number"
                      min={1}
                      value={selectedDetails[ex._id]?.targetSets ?? 3}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => setSelectedDetails((d) => ({
                        ...d,
                        [ex._id]: { ...(d[ex._id] || {}), targetSets: Math.max(1, parseInt(e.target.value || '1')) }
                      }))}
                      className="w-14 px-2 py-1 text-xs rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
                    />
                    <input
                      type="text"
                      value={selectedDetails[ex._id]?.targetReps ?? '8-12'}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => setSelectedDetails((d) => ({
                        ...d,
                        [ex._id]: { ...(d[ex._id] || {}), targetReps: e.target.value }
                      }))}
                      className="w-16 px-2 py-1 text-xs rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
                    />
                    <input
                      type="number"
                      min={0}
                      step={1}
                      value={selectedDetails[ex._id]?.targetWeight ?? 0}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => setSelectedDetails((d) => ({
                        ...d,
                        [ex._id]: { ...(d[ex._id] || {}), targetWeight: Math.max(0, parseFloat(e.target.value || '0')) }
                      }))}
                      className="w-16 px-2 py-1 text-xs rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
                    />
                    <button
                      onClick={() => toggleExerciseSelection(ex)}
                      className="text-xs px-2 py-1 rounded bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Loading exercises...
              </p>
            </div>
          ) : exercises.length === 0 ? (
            <div className="text-center py-8">
              <Dumbbell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                No exercises found
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {exercises.map((exercise) => {
                const isSelected = selectedExercises.find(
                  (e) => e._id === exercise._id
                );

                return (
                  <div
                    key={exercise._id}
                    onClick={() => toggleExerciseSelection(exercise)}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                      isSelected
                        ? "border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-900/20"
                        : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {exercise.name}
                          </h3>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(
                              exercise.difficulty
                            )}`}
                          >
                            {exercise.difficulty}
                          </span>
                        </div>

                        {exercise.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                            {exercise.description}
                          </p>
                        )}

                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                          <span className="flex items-center space-x-1">
                            <Target className="h-4 w-4" />
                            <span>{exercise.category}</span>
                          </span>

                          {exercise.primaryMuscleGroups?.length > 0 && (
                            <span>
                              {exercise.primaryMuscleGroups
                                .slice(0, 2)
                                .join(", ")}
                              {exercise.primaryMuscleGroups.length > 2 &&
                                ` +${exercise.primaryMuscleGroups.length - 2}`}
                            </span>
                          )}

                          {exercise.equipment?.length > 0 && (
                            <span className="flex items-center space-x-1">
                              <Dumbbell className="h-4 w-4" />
                              <span>{exercise.equipment[0]}</span>
                              {exercise.equipment.length > 1 && (
                                <span>+{exercise.equipment.length - 1}</span>
                              )}
                            </span>
                          )}

                          {exercise.metrics && (
                            <span className="flex items-center space-x-1">
                              <Clock className="h-4 w-4" />
                              <span>
                                {exercise.metrics.defaultSets || 3} sets
                              </span>
                            </span>
                          )}
                        </div>
                      </div>

                      <div
                        className={`p-2 rounded-lg ${
                          isSelected
                            ? "bg-blue-600 text-white"
                            : "bg-gray-100 dark:bg-gray-700 text-gray-400"
                        }`}
                      >
                        <Check className="h-5 w-5" />
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Load More */}
              {hasMore && (
                <div className="text-center py-4">
                  <button
                    onClick={loadMore}
                    disabled={loading}
                    className="px-6 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {loading ? "Loading..." : "Load More"}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {selectedExercises.length} exercise
            {selectedExercises.length !== 1 ? "s" : ""} selected
          </p>

          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              disabled={adding}
              className="px-6 py-3 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleAddExercises}
              disabled={selectedExercises.length === 0 || adding}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center space-x-2"
            >
              {adding && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              )}
              <span>
                {adding
                  ? "Adding..."
                  : `Add ${
                      selectedExercises.length > 0
                        ? selectedExercises.length
                        : ""
                    } Exercise${selectedExercises.length !== 1 ? "s" : ""}`}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
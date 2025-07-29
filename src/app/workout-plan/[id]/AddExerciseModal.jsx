"use client";
import React, { useState, useEffect } from "react";
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

export default function AddExerciseModal({ onClose, onAdd }) {
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState("");
  const [selectedEquipment, setSelectedEquipment] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedExercises, setSelectedExercises] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const categories = [
    "Strength", "Cardio", "Flexibility", "Sports", "Functional", "Plyometric", "Balance"
  ];

  const muscleGroups = [
    "Chest", "Back", "Shoulders", "Arms", "Legs", "Core", "Glutes", "Calves", "Forearms", "Full Body"
  ];

  const equipment = [
    "Barbell", "Dumbbell", "Machine", "Cable", "Bodyweight", "Resistance Band", 
    "Kettlebell", "Medicine Ball", "TRX", "Cardio Equipment", "Pull-up Bar", "Bench"
  ];

  const difficulties = ["Beginner", "Intermediate", "Advanced"];

  useEffect(() => {
    fetchExercises();
  }, [searchTerm, selectedCategory, selectedMuscleGroup, selectedEquipment, selectedDifficulty]);

  const fetchExercises = async (pageNum = 1) => {
    try {
      setLoading(pageNum === 1);
      
      const options = {
        page: pageNum,
        limit: 20,
        ...(searchTerm && { search: searchTerm }),
        ...(selectedCategory && { category: selectedCategory }),
        ...(selectedMuscleGroup && { muscleGroups: selectedMuscleGroup }),
        ...(selectedEquipment && { equipment: selectedEquipment }),
        ...(selectedDifficulty && { difficulty: selectedDifficulty }),
      };

      const response = await exerciseService.getExercises(options);
      const newExercises = response.exercises || response;

      if (pageNum === 1) {
        setExercises(newExercises);
      } else {
        setExercises(prev => [...prev, ...newExercises]);
      }

      setHasMore(newExercises.length === 20);
      setPage(pageNum);
    } catch (error) {
      console.error("Error fetching exercises:", error);
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
    setSelectedExercises(prev => {
      const exists = prev.find(e => e._id === exercise._id);
      if (exists) {
        return prev.filter(e => e._id !== exercise._id);
      } else {
        return [...prev, exercise];
      }
    });
  };

  const handleAddExercises = () => {
    if (selectedExercises.length === 0) return;

    const exercisesToAdd = selectedExercises.map(exercise => ({
      name: exercise.name,
      category: exercise.category,
      muscleGroups: exercise.primaryMuscleGroups,
      equipment: exercise.equipment,
      instructions: exercise.description,
      difficulty: exercise.difficulty,
      targetSets: exercise.metrics?.defaultSets || 3,
      targetReps: exercise.metrics?.defaultReps || "8-12",
      targetWeight: 0,
      sets: [],
      isCompleted: false
    }));

    onAdd(exercisesToAdd);
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
                  {selectedExercises.length} exercise{selectedExercises.length !== 1 ? 's' : ''} selected
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
            {/* Search */}
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

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <Filter className="h-5 w-5" />
              <span>Filters</span>
              <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>

              <select
                value={selectedMuscleGroup}
                onChange={(e) => setSelectedMuscleGroup(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">All Muscle Groups</option>
                {muscleGroups.map(group => (
                  <option key={group} value={group}>{group}</option>
                ))}
              </select>

              <select
                value={selectedEquipment}
                onChange={(e) => setSelectedEquipment(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">All Equipment</option>
                {equipment.map(eq => (
                  <option key={eq} value={eq}>{eq}</option>
                ))}
              </select>

              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">All Difficulties</option>
                {difficulties.map(diff => (
                  <option key={diff} value={diff}>{diff}</option>
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
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 dark:text-gray-400 mt-2">Loading exercises...</p>
            </div>
          ) : exercises.length === 0 ? (
            <div className="text-center py-8">
              <Dumbbell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">No exercises found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {exercises.map((exercise) => {
                const isSelected = selectedExercises.find(e => e._id === exercise._id);
                
                return (
                  <div
                    key={exercise._id}
                    onClick={() => toggleExerciseSelection(exercise)}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {exercise.name}
                          </h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(exercise.difficulty)}`}>
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
                              {exercise.primaryMuscleGroups.slice(0, 2).join(", ")}
                              {exercise.primaryMuscleGroups.length > 2 && ` +${exercise.primaryMuscleGroups.length - 2}`}
                            </span>
                          )}

                          {exercise.equipment?.length > 0 && (
                            <span className="flex items-center space-x-1">
                              <Dumbbell className="h-4 w-4" />
                              <span>{exercise.equipment[0]}</span>
                              {exercise.equipment.length > 1 && <span>+{exercise.equipment.length - 1}</span>}
                            </span>
                          )}

                          {exercise.metrics && (
                            <span className="flex items-center space-x-1">
                              <Clock className="h-4 w-4" />
                              <span>{exercise.metrics.defaultSets || 3} sets</span>
                            </span>
                          )}
                        </div>
                      </div>

                      <div className={`p-2 rounded-lg ${
                        isSelected 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-400'
                      }`}>
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
                    {loading ? 'Loading...' : 'Load More'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {selectedExercises.length} exercise{selectedExercises.length !== 1 ? 's' : ''} selected
          </p>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-6 py-3 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark
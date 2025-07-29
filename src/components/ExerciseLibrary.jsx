// components/ExerciseLibrary.jsx
"use client";
import React, { useState, useEffect } from "react";
import {
  Search,
  Filter,
  Dumbbell,
  Heart,
  Zap,
  Target,
  Clock,
  Star,
  Play,
  BookOpen,
  AlertCircle,
  ChevronDown,
  X
} from "lucide-react";

export default function ExerciseLibrary({ onSelectExercise, selectedExercises = [] }) {
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState("");
  const [selectedEquipment, setSelectedEquipment] = useState([]);
  const [selectedMuscleGroups, setSelectedMuscleGroups] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState(null);

  const categories = [
    { value: "Strength", icon: Dumbbell, color: "blue" },
    { value: "Cardio", icon: Heart, color: "red" },
    { value: "Flexibility", icon: Target, color: "purple" },
    { value: "Plyometric", icon: Zap, color: "yellow" },
    { value: "Functional", icon: Target, color: "green" }
  ];

  const difficulties = ["Beginner", "Intermediate", "Advanced"];

  const muscleGroups = [
    "Chest", "Back", "Shoulders", "Arms", "Legs", 
    "Core", "Glutes", "Calves", "Forearms", "Full Body"
  ];

  const equipmentOptions = [
    "Barbell", "Dumbbell", "Machine", "Cable", "Bodyweight",
    "Resistance Band", "Kettlebell", "Medicine Ball", "TRX", "Cardio Equipment"
  ];

  useEffect(() => {
    fetchExercises();
  }, [searchTerm, selectedCategory, selectedDifficulty, selectedEquipment, selectedMuscleGroups]);

  const fetchExercises = async (resetPage = false) => {
    try {
      setLoading(true);
      setError(null);

      const currentPage = resetPage ? 1 : page;
      
      const options = {
        search: searchTerm,
        category: selectedCategory,
        difficulty: selectedDifficulty,
        equipment: selectedEquipment,
        muscleGroups: selectedMuscleGroups,
        limit: 20,
        page: currentPage
      };

      const data = await exerciseService.getExercises(options);

      if (data.success) {
        if (resetPage) {
          setExercises(data.exercises);
          setPage(1);
        } else {
          setExercises(prev => [...prev, ...data.exercises]);
        }
        
        setTotalResults(data.pagination?.total || 0);
        setHasMore(data.pagination?.current < data.pagination?.pages);
      } else {
        setError(data.message || 'Failed to fetch exercises');
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch exercises');
    } finally {
      setLoading(false);
    }
  };

  const loadMoreExercises = () => {
    if (!loading && hasMore) {
      setPage(prev => prev + 1);
      fetchExercises();
    }
  };

  const handleEquipmentToggle = (equipment) => {
    setSelectedEquipment(prev =>
      prev.includes(equipment)
        ? prev.filter(e => e !== equipment)
        : [...prev, equipment]
    );
    setPage(1);
  };

  const handleMuscleGroupToggle = (group) => {
    setSelectedMuscleGroups(prev =>
      prev.includes(group)
        ? prev.filter(g => g !== group)
        : [...prev, group]
    );
    setPage(1);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCategory("");
    setSelectedDifficulty("");
    setSelectedEquipment([]);
    setSelectedMuscleGroups([]);
    setPage(1);
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case "Beginner": return "text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-300";
      case "Intermediate": return "text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-300";
      case "Advanced": return "text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-300";
      default: return "text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  const isExerciseSelected = (exerciseId) => {
    return selectedExercises.some(ex => ex._id === exerciseId || ex.id === exerciseId);
  };

  const handleSelectExercise = (exercise) => {
    if (onSelectExercise) {
      onSelectExercise(exercise);
      // Log exercise usage for analytics
      exerciseService.logExerciseUsage(exercise._id, 'selection');
    }
  };


  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-4">
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

          {/* Category Quick Filters */}
          <div className="flex gap-2">
            {categories.map(({ value, icon: Icon, color }) => (
              <button
                key={value}
                onClick={() => setSelectedCategory(selectedCategory === value ? "" : value)}
                className={`flex items-center space-x-2 px-4 py-3 rounded-lg border transition-colors ${
                  selectedCategory === value
                    ? `border-${color}-500 bg-${color}-50 text-${color}-700`
                    : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{value}</span>
              </button>
            ))}
          </div>

          {/* Advanced Filters Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center space-x-2 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
          >
            <Filter className="h-4 w-4" />
            <span>Filters</span>
            <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Difficulty */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Difficulty
                </label>
                <select
                  value={selectedDifficulty}
                  onChange={(e) => setSelectedDifficulty(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">All Levels</option>
                  {difficulties.map(diff => (
                    <option key={diff} value={diff}>{diff}</option>
                  ))}
                </select>
              </div>

              {/* Equipment */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Equipment ({selectedEquipment.length})
                </label>
                <div className="max-h-32 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-lg p-2">
                  {equipmentOptions.map(equipment => (
                    <label key={equipment} className="flex items-center space-x-2 py-1">
                      <input
                        type="checkbox"
                        checked={selectedEquipment.includes(equipment)}
                        onChange={() => handleEquipmentToggle(equipment)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{equipment}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Muscle Groups */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Muscle Groups ({selectedMuscleGroups.length})
                </label>
                <div className="max-h-32 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-lg p-2">
                  {muscleGroups.map(group => (
                    <label key={group} className="flex items-center space-x-2 py-1">
                      <input
                        type="checkbox"
                        checked={selectedMuscleGroups.includes(group)}
                        onChange={() => handleMuscleGroupToggle(group)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{group}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <button
                onClick={clearFilters}
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                Clear all filters
              </button>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {exercises.length} exercises found
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-800 rounded-xl p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mr-2" />
            <p className="text-red-800 dark:text-red-200">Error: {error}</p>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 9 }, (_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm animate-pulse">
              <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded mb-3"></div>
              <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded mb-2"></div>
              <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      )}

      {/* Exercise Grid */}
      {!loading && exercises.length === 0 && (
        <div className="text-center py-12">
          <Dumbbell className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No exercises found
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Try adjusting your search or filters
          </p>
        </div>
      )}

      {!loading && exercises.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {exercises.map(exercise => (
            <div
              key={exercise._id}
              className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border-2 transition-all duration-200 ${
                isExerciseSelected(exercise._id)
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600'
              }`}
            >
              <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                      {exercise.name}
                    </h3>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(exercise.difficulty)}`}>
                        {exercise.difficulty}
                      </span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {exercise.category}
                      </span>
                    </div>
                  </div>
                  
                  {exercise.averageRating > 0 && (
                    <div className="flex items-center space-x-1">
                      <Star className="h-4 w-4 text-yellow-400 fill-current" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {exercise.averageRating.toFixed(1)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Muscle Groups */}
                <div className="mb-4">
                  <div className="flex flex-wrap gap-1">
                    {exercise.primaryMuscleGroups.slice(0, 3).map(muscle => (
                      <span
                        key={muscle}
                        className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300 rounded text-xs"
                      >
                        {muscle}
                      </span>
                    ))}
                    {exercise.primaryMuscleGroups.length > 3 && (
                      <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded text-xs">
                        +{exercise.primaryMuscleGroups.length - 3}
                      </span>
                    )}
                  </div>
                </div>

                {/* Equipment */}
                <div className="mb-4">
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <Dumbbell className="h-4 w-4 mr-1" />
                    <span>{exercise.equipment.join(", ")}</span>
                  </div>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
                  <div className="flex items-center text-gray-600 dark:text-gray-400">
                    <Target className="h-3 w-3 mr-1" />
                    <span>{exercise.metrics.defaultSets} sets</span>
                  </div>
                  <div className="flex items-center text-gray-600 dark:text-gray-400">
                    <Clock className="h-3 w-3 mr-1" />
                    <span>{exercise.metrics.defaultRestTime}s rest</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-2">
                  <button
                    onClick={() => setSelectedExercise(exercise)}
                    className="flex-1 inline-flex items-center justify-center space-x-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
                  >
                    <BookOpen className="h-3 w-3" />
                    <span>Details</span>
                  </button>
                  
                  {onSelectExercise && (
                    <button
                      onClick={() => onSelectExercise(exercise)}
                      disabled={isExerciseSelected(exercise._id)}
                      className={`flex-1 inline-flex items-center justify-center space-x-1 px-3 py-2 rounded-lg transition-colors ${
                        isExerciseSelected(exercise._id)
                          ? 'bg-green-600 text-white cursor-not-allowed'
                          : 'bg-blue-600 hover:bg-blue-700 text-white'
                      }`}
                    >
                      {isExerciseSelected(exercise._id) ? (
                        <>
                          <div className="h-3 w-3 rounded-full bg-white" />
                          <span>Added</span>
                        </>
                      ) : (
                        <>
                          <div className="h-3 w-3 rounded-full border-2 border-white" />
                          <span>Add</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Exercise Detail Modal */}
      {selectedExercise && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {selectedExercise.name}
                  </h2>
                  <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {totalResults > 0 && `${totalResults} exercise${totalResults !== 1 ? 's' : ''} found`}
        </p>
        {(searchTerm || selectedCategory || selectedDifficulty || selectedEquipment.length > 0 || selectedMuscleGroups.length > 0) && (
          <button
            onClick={clearFilters}
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
          >
            Clear all filters
          </button>
        )}
      </div>

      {/* Exercise Grid */}
      {!loading && exercises.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {exercises.map(exercise => (
              <ExerciseCard
                key={exercise._id}
                exercise={exercise}
                isSelected={isExerciseSelected(exercise._id)}
                onSelect={handleSelectExercise}
                onViewDetails={setSelectedExercise}
                mode={mode}
              />
            ))}
          </div>

          {/* Load More Button */}
          {hasMore && (
            <div className="text-center">
              <button
                onClick={loadMoreExercises}
                disabled={loading}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Loading...' : 'Load More Exercises'}
              </button>
            </div>
          )}
        </>
      )}

      {/* Exercise Detail Modal */}
      {selectedExercise && (
        <ExerciseDetailModal
          exercise={selectedExercise}
          onClose={() => setSelectedExercise(null)}
          onAddExercise={mode === "select" ? handleSelectExercise : null}
          isSelected={isExerciseSelected(selectedExercise._id)}
        />
      )}
    </div>
  );
}

// Exercise Card Component
function ExerciseCard({ exercise, isSelected, onSelect, onViewDetails, mode }) {
  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case "Beginner": return "text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-300";
      case "Intermediate": return "text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-300";
      case "Advanced": return "text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-300";
      default: return "text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border-2 transition-all duration-200 ${
        isSelected
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
          : 'border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600'
      }`}
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 line-clamp-2">
              {exercise.name}
            </h3>
            <div className="flex items-center space-x-2 mb-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(exercise.difficulty)}`}>
                {exercise.difficulty}
              </span>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {exercise.category}
              </span>
            </div>
          </div>
          
          {exercise.averageRating > 0 && (
            <div className="flex items-center space-x-1 ml-2">
              <Star className="h-4 w-4 text-yellow-400 fill-current" />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {exercise.averageRating.toFixed(1)}
              </span>
            </div>
          )}
        </div>

        {/* Muscle Groups */}
        <div className="mb-4">
          <div className="flex flex-wrap gap-1">
            {exercise.primaryMuscleGroups?.slice(0, 3).map(muscle => (
              <span
                key={muscle}
                className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300 rounded text-xs"
              >
                {muscle}
              </span>
            ))}
            {exercise.primaryMuscleGroups?.length > 3 && (
              <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded text-xs">
                +{exercise.primaryMuscleGroups.length - 3}
              </span>
            )}
          </div>
        </div>

        {/* Equipment */}
        <div className="mb-4">
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
            <Dumbbell className="h-4 w-4 mr-1 flex-shrink-0" />
            <span className="truncate">{exercise.equipment?.join(", ")}</span>
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
          <div className="flex items-center text-gray-600 dark:text-gray-400">
            <Target className="h-3 w-3 mr-1" />
            <span>{exercise.metrics?.defaultSets || 3} sets</span>
          </div>
          <div className="flex items-center text-gray-600 dark:text-gray-400">
            <Clock className="h-3 w-3 mr-1" />
            <span>{exercise.metrics?.defaultRestTime || 60}s rest</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex space-x-2">
          <button
            onClick={() => onViewDetails(exercise)}
            className="flex-1 inline-flex items-center justify-center space-x-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
          >
            <BookOpen className="h-3 w-3" />
            <span>Details</span>
          </button>
          
          {mode === "select" && onSelect && (
            <button
              onClick={() => onSelect(exercise)}
              disabled={isSelected}
              className={`flex-1 inline-flex items-center justify-center space-x-1 px-3 py-2 rounded-lg transition-colors ${
                isSelected
                  ? 'bg-green-600 text-white cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {isSelected ? (
                <>
                  <Check className="h-3 w-3" />
                  <span>Added</span>
                </>
              ) : (
                <>
                  <Plus className="h-3 w-3" />
                  <span>Add</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
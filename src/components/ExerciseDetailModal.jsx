import React from "react";
import {
  X,
  Play,
  BookOpen,
  Target,
  Clock,
  Star,
  Dumbbell,
  AlertTriangle,
  CheckCircle,
  User,
  TrendingUp
} from "lucide-react";

export default function ExerciseDetailModal({ exercise, onClose, onAddExercise, isSelected }) {
  if (!exercise) return null;

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case "Beginner": return "text-green-600 bg-green-100";
      case "Intermediate": return "text-yellow-600 bg-yellow-100";
      case "Advanced": return "text-red-600 bg-red-100";
      default: return "text-gray-600 bg-gray-100";
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case "Strength": return Dumbbell;
      case "Cardio": return TrendingUp;
      case "Flexibility": return Target;
      default: return Dumbbell;
    }
  };

  const CategoryIcon = getCategoryIcon(exercise.category);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-4">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <CategoryIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {exercise.name}
              </h2>
              <div className="flex items-center space-x-3 mt-1">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(exercise.difficulty)}`}>
                  {exercise.difficulty}
                </span>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {exercise.category}
                </span>
                {exercise.averageRating > 0 && (
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {exercise.averageRating.toFixed(1)} ({exercise.totalRatings})
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {onAddExercise && (
              <button
                onClick={() => onAddExercise(exercise)}
                disabled={isSelected}
                className={`inline-flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  isSelected
                    ? 'bg-green-600 text-white cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {isSelected ? (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    <span>Added</span>
                  </>
                ) : (
                  <>
                    <Target className="h-4 w-4" />
                    <span>Add Exercise</span>
                  </>
                )}
              </button>
            )}
            
            <button
              onClick={onClose}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="p-6 space-y-6">
            {/* Description */}
            {exercise.description && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Description
                </h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  {exercise.description}
                </p>
              </div>
            )}

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-center">
                <Target className="h-5 w-5 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
                <div className="text-lg font-semibold text-gray-900 dark:text-white">
                  {exercise.metrics?.defaultSets || 3}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Sets</div>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-center">
                <User className="h-5 w-5 text-green-600 dark:text-green-400 mx-auto mb-2" />
                <div className="text-lg font-semibold text-gray-900 dark:text-white">
                  {exercise.metrics?.defaultReps || "8-12"}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Reps</div>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-center">
                <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mx-auto mb-2" />
                <div className="text-lg font-semibold text-gray-900 dark:text-white">
                  {exercise.metrics?.defaultRestTime || 60}s
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Rest</div>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-center">
                <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400 mx-auto mb-2" />
                <div className="text-lg font-semibold text-gray-900 dark:text-white">
                  {exercise.metrics?.caloriesPerMinute || 5}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Cal/min</div>
              </div>
            </div>

            {/* Muscle Groups */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Target Muscles
              </h3>
              <div className="space-y-3">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Primary
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {exercise.primaryMuscleGroups?.map(muscle => (
                      <span
                        key={muscle}
                        className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300 rounded-full text-sm font-medium"
                      >
                        {muscle}
                      </span>
                    ))}
                  </div>
                </div>
                
                {exercise.secondaryMuscleGroups?.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Secondary
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {exercise.secondaryMuscleGroups.map(muscle => (
                        <span
                          key={muscle}
                          className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm"
                        >
                          {muscle}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Equipment */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Equipment Needed
              </h3>
              <div className="flex flex-wrap gap-2">
                {exercise.equipment?.map(equip => (
                  <div
                    key={equip}
                    className="flex items-center space-x-2 px-3 py-2 bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-300 rounded-lg"
                  >
                    <Dumbbell className="h-4 w-4" />
                    <span className="text-sm font-medium">{equip}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Instructions */}
            {exercise.instructions?.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Instructions
                </h3>
                <div className="space-y-3">
                  {exercise.instructions.map((instruction, index) => (
                    <div key={index} className="flex space-x-3">
                      <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                        {instruction.step}
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                        {instruction.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Form Tips */}
            {exercise.formTips?.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mr-2" />
                  Form Tips
                </h3>
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                  <ul className="space-y-2">
                    {exercise.formTips.map((tip, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                        <span className="text-green-800 dark:text-green-300 text-sm">
                          {tip}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Common Mistakes */}
            {exercise.commonMistakes?.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                  <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mr-2" />
                  Common Mistakes
                </h3>
                <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
                  <ul className="space-y-2">
                    {exercise.commonMistakes.map((mistake, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                        <span className="text-red-800 dark:text-red-300 text-sm">
                          {mistake}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Variations */}
            {exercise.variations?.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Variations
                </h3>
                <div className="space-y-3">
                  {exercise.variations.map((variation, index) => (
                    <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {variation.name}
                        </h4>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          variation.difficulty === 'Easier' 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                            : variation.difficulty === 'Harder'
                            ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                        }`}>
                          {variation.difficulty}
                        </span>
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">
                        {variation.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Video */}
            {exercise.videoUrl && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                  <Play className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2" />
                  Demonstration Video
                </h3>
                <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-8 text-center">
                  <Play className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">
                    Video demonstration available
                  </p>
                  <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    Watch Video
                  </button>
                </div>
              </div>
            )}

            {/* Tags */}
            {exercise.tags?.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Tags
                </h3>
                <div className="flex flex-wrap gap-2">
                  {exercise.tags.map(tag => (
                    <span
                      key={tag}
                      className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-sm"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
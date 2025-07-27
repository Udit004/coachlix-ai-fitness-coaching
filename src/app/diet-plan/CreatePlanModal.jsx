"use client";
import React, { useState } from "react";
import { X, Sparkles, Calculator, Plus } from "lucide-react";
import dietPlanService from "../../service/dietPlanService";

export default function CreatePlanModal({ onClose, onCreate }) {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    goal: "Weight Loss",
    targetCalories: 2000,
    targetProtein: 150,
    targetCarbs: 200,
    targetFats: 65,
    duration: 7,
    difficulty: "Beginner",
    tags: [],
    createMethod: "manual", // 'manual' or 'ai'
  });
  const [aiPreferences, setAiPreferences] = useState({
    dietType: "balanced",
    restrictions: [],
    mealCount: 3,
    preferredFoods: "",
    avoidFoods: "",
  });

  const goals = [
    "Weight Loss",
    "Muscle Gain",
    "Maintenance",
    "Cutting",
    "Bulking",
    "General Health",
  ];
  const difficulties = ["Beginner", "Intermediate", "Advanced"];
  const dietTypes = [
    { value: "balanced", label: "Balanced Diet" },
    { value: "keto", label: "Ketogenic" },
    { value: "mediterranean", label: "Mediterranean" },
    { value: "vegetarian", label: "Vegetarian" },
    { value: "vegan", label: "Vegan" },
    { value: "paleo", label: "Paleo" },
    { value: "lowcarb", label: "Low Carb" },
  ];
  const restrictions = [
    "Gluten-Free",
    "Dairy-Free",
    "Nut-Free",
    "Soy-Free",
    "Egg-Free",
    "Shellfish-Free",
  ];

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleTagAdd = (tag) => {
    if (tag.trim() && !formData.tags.includes(tag.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, tag.trim()],
      }));
    }
  };

  const handleTagRemove = (tagToRemove) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  const calculateMacros = () => {
    const { targetCalories, goal } = formData;
    let protein, carbs, fats;

    // Macro calculations based on goal
    switch (goal) {
      case "Weight Loss":
        protein = Math.round((targetCalories * 0.35) / 4); // 35% protein
        carbs = Math.round((targetCalories * 0.35) / 4); // 35% carbs
        fats = Math.round((targetCalories * 0.3) / 9); // 30% fats
        break;
      case "Muscle Gain":
        protein = Math.round((targetCalories * 0.3) / 4); // 30% protein
        carbs = Math.round((targetCalories * 0.45) / 4); // 45% carbs
        fats = Math.round((targetCalories * 0.25) / 9); // 25% fats
        break;
      case "Cutting":
        protein = Math.round((targetCalories * 0.4) / 4); // 40% protein
        carbs = Math.round((targetCalories * 0.3) / 4); // 30% carbs
        fats = Math.round((targetCalories * 0.3) / 9); // 30% fats
        break;
      default: // Maintenance, Bulking, General Health
        protein = Math.round((targetCalories * 0.25) / 4); // 25% protein
        carbs = Math.round((targetCalories * 0.5) / 4); // 50% carbs
        fats = Math.round((targetCalories * 0.25) / 9); // 25% fats
    }

    setFormData((prev) => ({
      ...prev,
      targetProtein: protein,
      targetCarbs: carbs,
      targetFats: fats,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let planData;

      if (formData.createMethod === "ai") {
        // Generate AI plan
        planData = await dietPlanService.generateAIPlan({
          ...formData,
          ...aiPreferences,
        });
      } else {
        // Create manual plan with empty days
        const emptyDays = Array.from({ length: formData.duration }, (_, i) => ({
          dayNumber: i + 1,
          meals: [
            { type: "Breakfast", items: [] },
            { type: "Lunch", items: [] },
            { type: "Dinner", items: [] },
            { type: "Snacks", items: [] },
          ],
        }));

        planData = {
          ...formData,
          days: emptyDays,
        };
      }

      await onCreate(planData);
    } catch (error) {
      console.error("Error creating plan:", error);
      alert("Error creating plan: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Plan Name *
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => handleInputChange("name", e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
          placeholder="e.g., Summer Shred Plan"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Description
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => handleInputChange("description", e.target.value)}
          rows={3}
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 resize-none"
          placeholder="Describe your diet plan goals and approach..."
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Goal *
          </label>
          <select
            value={formData.goal}
            onChange={(e) => handleInputChange("goal", e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            {goals.map((goal) => (
              <option key={goal} value={goal}>
                {goal}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Difficulty
          </label>
          <select
            value={formData.difficulty}
            onChange={(e) => handleInputChange("difficulty", e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            {difficulties.map((diff) => (
              <option key={diff} value={diff}>
                {diff}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Duration (Days) *
        </label>
        <input
          type="number"
          value={formData.duration}
          onChange={(e) =>
            handleInputChange("duration", parseInt(e.target.value) || 1)
          }
          min="1"
          max="365"
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        />
      </div>

      {/* Creation Method Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          How would you like to create this plan?
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => handleInputChange("createMethod", "manual")}
            className={`p-4 border-2 rounded-xl text-left transition-all ${
              formData.createMethod === "manual"
                ? "border-green-500 bg-green-50 dark:bg-green-900"
                : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Calculator className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <div className="font-medium text-gray-900 dark:text-white">
                  Manual Creation
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Create and customize everything yourself
                </div>
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleInputChange("createMethod", "ai")}
            className={`p-4 border-2 rounded-xl text-left transition-all ${
              formData.createMethod === "ai"
                ? "border-green-500 bg-green-50 dark:bg-green-900"
                : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <div className="font-medium text-gray-900 dark:text-white">
                  AI Generated
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Let AI create a personalized plan
                </div>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Target Calories *
          </label>
          <button
            type="button"
            onClick={calculateMacros}
            className="inline-flex items-center space-x-1 text-sm text-green-600 hover:text-green-700 dark:text-green-400"
          >
            <Calculator className="h-4 w-4" />
            <span>Auto Calculate</span>
          </button>
        </div>
        <input
          type="number"
          value={formData.targetCalories}
          onChange={(e) =>
            handleInputChange("targetCalories", parseInt(e.target.value) || 0)
          }
          min="1000"
          max="5000"
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Macronutrient Targets (grams per day)
        </label>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
              Protein
            </label>
            <input
              type="number"
              value={formData.targetProtein}
              onChange={(e) =>
                handleInputChange(
                  "targetProtein",
                  parseInt(e.target.value) || 0
                )
              }
              min="0"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
              Carbs
            </label>
            <input
              type="number"
              value={formData.targetCarbs}
              onChange={(e) =>
                handleInputChange("targetCarbs", parseInt(e.target.value) || 0)
              }
              min="0"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
              Fats
            </label>
            <input
              type="number"
              value={formData.targetFats}
              onChange={(e) =>
                handleInputChange("targetFats", parseInt(e.target.value) || 0)
              }
              min="0"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            />
          </div>
        </div>
        <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
          Total:{" "}
          {formData.targetProtein * 4 +
            formData.targetCarbs * 4 +
            formData.targetFats * 9}{" "}
          calories
        </div>
      </div>

      {formData.createMethod === "ai" && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Diet Type
            </label>
            <select
              value={aiPreferences.dietType}
              onChange={(e) =>
                setAiPreferences((prev) => ({
                  ...prev,
                  dietType: e.target.value,
                }))
              }
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              {dietTypes.map((diet) => (
                <option key={diet.value} value={diet.value}>
                  {diet.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Dietary Restrictions
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {restrictions.map((restriction) => (
                <label key={restriction} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={aiPreferences.restrictions.includes(restriction)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setAiPreferences((prev) => ({
                          ...prev,
                          restrictions: [...prev.restrictions, restriction],
                        }));
                      } else {
                        setAiPreferences((prev) => ({
                          ...prev,
                          restrictions: prev.restrictions.filter(
                            (r) => r !== restriction
                          ),
                        }));
                      }
                    }}
                    className="mr-2 rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {restriction}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Number of Meals per Day
            </label>
            <select
              value={aiPreferences.mealCount}
              onChange={(e) =>
                setAiPreferences((prev) => ({
                  ...prev,
                  mealCount: parseInt(e.target.value),
                }))
              }
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value={3}>3 meals</option>
              <option value={4}>4 meals</option>
              <option value={5}>5 meals</option>
              <option value={6}>6 meals</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Preferred Foods (optional)
            </label>
            <textarea
              value={aiPreferences.preferredFoods}
              onChange={(e) =>
                setAiPreferences((prev) => ({
                  ...prev,
                  preferredFoods: e.target.value,
                }))
              }
              rows={2}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 resize-none"
              placeholder="e.g., chicken, rice, broccoli, almonds..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Foods to Avoid (optional)
            </label>
            <textarea
              value={aiPreferences.avoidFoods}
              onChange={(e) =>
                setAiPreferences((prev) => ({
                  ...prev,
                  avoidFoods: e.target.value,
                }))
              }
              rows={2}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 resize-none"
              placeholder="e.g., shellfish, processed foods, sugar..."
            />
          </div>
        </>
      )}

      {/* Tags */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Tags (optional)
        </label>
        <div className="space-y-3">
          <input
            type="text"
            placeholder="Add a tag and press Enter"
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleTagAdd(e.target.value);
                e.target.value = "";
              }
            }}
          />
          {formData.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {formData.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center space-x-1 px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full text-sm"
                >
                  <span>{tag}</span>
                  <button
                    type="button"
                    onClick={() => handleTagRemove(tag)}
                    className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {" "}
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {step === 1 ? "Create Diet Plan" : "Nutrition & Preferences"}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {step === 1
                ? "Set up your plan basics"
                : "Configure your nutrition targets"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        {/* Progress Indicator */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900">
          <div className="flex items-center space-x-4">
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                step >= 1
                  ? "bg-green-600 text-white"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
              }`}
            >
              1
            </div>
            <div
              className={`flex-1 h-1 rounded-full ${
                step >= 2 ? "bg-green-600" : "bg-gray-200 dark:bg-gray-700"
              }`}
            ></div>
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                step >= 2
                  ? "bg-green-600 text-white"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
              }`}
            >
              2
            </div>
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Basic Info
            </span>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Nutrition
            </span>
          </div>
        </div>


        
        {/* Content */}
        <div className="flex flex-col flex-1 min-h-0">
          {step === 1 ? (
            <>
              <div className="flex-1 overflow-y-auto p-6">{renderStep1()}</div>
              {/* Footer for Step 1 */}
              <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                <div className="flex space-x-3">
                  {/* Previous button not needed on step 1 */}
                </div>

                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-6 py-3 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setStep(2);
                    }}
                    disabled={!formData.name.trim()}
                    className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-xl transition-colors disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="flex flex-col flex-1 min-h-0"
            >
              <div className="flex-1 overflow-y-auto p-6">{renderStep2()}</div>
              {/* Footer for Step 2 */}
              <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setStep(1);
                    }}
                    className="px-6 py-3 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                  >
                    Previous
                  </button>
                </div>

                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-6 py-3 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={
                      loading ||
                      !formData.name.trim() ||
                      formData.targetCalories < 1000
                    }
                    className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-xl transition-colors disabled:cursor-not-allowed inline-flex items-center space-x-2"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Creating...</span>
                      </>
                    ) : (
                      <>
                        {formData.createMethod === "ai" ? (
                          <Sparkles className="h-4 w-4" />
                        ) : (
                          <Plus className="h-4 w-4" />
                        )}
                        <span>Create Plan</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

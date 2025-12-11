// src/ai/reasoning/entities/extractor.js
// Enhanced entity extraction from user messages
// Extracts foods, exercises, numbers, measurements, time references, etc.

/**
 * Extract all entities from user message
 * 
 * @param {string} message 
 * @returns {Object} - Extracted entities
 */
export function extractEntities(message) {
  const entities = {
    foods: extractFoods(message),
    exercises: extractExercises(message),
    numbers: extractNumbers(message),
    measurements: extractMeasurements(message),
    timeReferences: extractTimeReferences(message),
    meals: extractMeals(message),
    bodyParts: extractBodyParts(message)
  };
  
  return entities;
}

/**
 * Extract food items from message
 * 
 * @param {string} message 
 * @returns {Array<string>}
 */
function extractFoods(message) {
  const messageLower = message.toLowerCase();
  
  // Comprehensive food list
  const foodKeywords = [
    // Proteins
    'chicken', 'fish', 'egg', 'eggs', 'paneer', 'tofu', 'salmon', 'tuna',
    'beef', 'pork', 'turkey', 'shrimp', 'prawns',
    
    // Grains
    'rice', 'roti', 'chapati', 'bread', 'pasta', 'noodles', 'oats', 'quinoa',
    'wheat', 'barley', 'cereal',
    
    // Vegetables
    'broccoli', 'spinach', 'carrot', 'tomato', 'potato', 'onion', 'garlic',
    'cauliflower', 'cabbage', 'beans', 'peas', 'corn',
    
    // Fruits
    'banana', 'apple', 'orange', 'mango', 'grapes', 'strawberry', 'blueberry',
    'watermelon', 'papaya', 'pineapple',
    
    // Dairy
    'milk', 'yogurt', 'curd', 'cheese', 'butter', 'ghee', 'cream',
    
    // Legumes
    'dal', 'lentils', 'chickpeas', 'kidney beans', 'black beans',
    
    // Nuts
    'almonds', 'walnuts', 'cashews', 'peanuts', 'pistachios',
    
    // Common dishes
    'salad', 'soup', 'curry', 'sandwich', 'burger', 'pizza', 'biryani',
    
    // Beverages
    'coffee', 'tea', 'juice', 'smoothie', 'shake', 'water'
  ];
  
  const foundFoods = foodKeywords.filter(food => 
    messageLower.includes(food)
  );
  
  return [...new Set(foundFoods)]; // Remove duplicates
}

/**
 * Extract exercise names from message
 * 
 * @param {string} message 
 * @returns {Array<string>}
 */
function extractExercises(message) {
  const messageLower = message.toLowerCase();
  
  const exerciseKeywords = [
    // Bodyweight
    'push-up', 'pushup', 'pull-up', 'pullup', 'squat', 'lunge', 'plank',
    'burpee', 'jumping jack', 'mountain climber', 'sit-up', 'crunch',
    
    // Weightlifting
    'bench press', 'deadlift', 'squat', 'overhead press', 'shoulder press',
    'bicep curl', 'tricep extension', 'lat pulldown', 'row',
    
    // Cardio
    'running', 'jogging', 'walking', 'cycling', 'swimming', 'rowing',
    'treadmill', 'elliptical', 'stair climber',
    
    // Core
    'plank', 'crunches', 'leg raises', 'russian twist', 'bicycle crunch',
    
    // Legs
    'leg press', 'leg curl', 'leg extension', 'calf raise',
    
    // General
    'cardio', 'hiit', 'circuit', 'superset', 'warmup', 'cooldown'
  ];
  
  const foundExercises = exerciseKeywords.filter(exercise => 
    messageLower.includes(exercise)
  );
  
  return [...new Set(foundExercises)];
}

/**
 * Extract numbers from message
 * 
 * @param {string} message 
 * @returns {Array<number>}
 */
function extractNumbers(message) {
  // Match integers and decimals
  const numberMatches = message.match(/\b\d+(\.\d+)?\b/g);
  
  if (!numberMatches) return [];
  
  return numberMatches.map(n => parseFloat(n));
}

/**
 * Extract measurements with units
 * 
 * @param {string} message 
 * @returns {Array<Object>} - Array of {value, unit, type}
 */
function extractMeasurements(message) {
  const measurements = [];
  
  // Weight measurements
  const weightPattern = /(\d+(?:\.\d+)?)\s*(kg|kgs|kilograms?|lbs?|pounds?)/gi;
  let match;
  while ((match = weightPattern.exec(message)) !== null) {
    measurements.push({
      value: parseFloat(match[1]),
      unit: match[2].toLowerCase(),
      type: 'weight'
    });
  }
  
  // Height measurements
  const heightPattern = /(\d+(?:\.\d+)?)\s*(cm|centimeters?|ft|feet|inches?|in)/gi;
  while ((match = heightPattern.exec(message)) !== null) {
    measurements.push({
      value: parseFloat(match[1]),
      unit: match[2].toLowerCase(),
      type: 'height'
    });
  }
  
  // Calorie measurements
  const caloriePattern = /(\d+(?:\.\d+)?)\s*(calories|cals?|kcal)/gi;
  while ((match = caloriePattern.exec(message)) !== null) {
    measurements.push({
      value: parseFloat(match[1]),
      unit: match[2].toLowerCase(),
      type: 'calories'
    });
  }
  
  // Macro measurements (grams)
  const macroPattern = /(\d+(?:\.\d+)?)\s*(g|grams?|oz|ounces?)/gi;
  while ((match = macroPattern.exec(message)) !== null) {
    measurements.push({
      value: parseFloat(match[1]),
      unit: match[2].toLowerCase(),
      type: 'macro'
    });
  }
  
  return measurements;
}

/**
 * Extract time references
 * 
 * @param {string} message 
 * @returns {Array<Object>} - Array of {reference, type}
 */
function extractTimeReferences(message) {
  const messageLower = message.toLowerCase();
  const timeReferences = [];
  
  // Relative time
  const relativeTime = [
    'today', 'tomorrow', 'yesterday', 'tonight',
    'this week', 'next week', 'last week',
    'this month', 'next month', 'last month'
  ];
  
  for (const ref of relativeTime) {
    if (messageLower.includes(ref)) {
      timeReferences.push({
        reference: ref,
        type: 'relative'
      });
    }
  }
  
  // Time of day
  const timeOfDay = [
    'morning', 'afternoon', 'evening', 'night',
    'breakfast', 'lunch', 'dinner', 'snack'
  ];
  
  for (const ref of timeOfDay) {
    if (messageLower.includes(ref)) {
      timeReferences.push({
        reference: ref,
        type: 'time_of_day'
      });
    }
  }
  
  // Days of week
  const daysOfWeek = [
    'monday', 'tuesday', 'wednesday', 'thursday',
    'friday', 'saturday', 'sunday'
  ];
  
  for (const day of daysOfWeek) {
    if (messageLower.includes(day)) {
      timeReferences.push({
        reference: day,
        type: 'day_of_week'
      });
    }
  }
  
  return timeReferences;
}

/**
 * Extract meal types
 * 
 * @param {string} message 
 * @returns {Array<string>}
 */
function extractMeals(message) {
  const messageLower = message.toLowerCase();
  const meals = ['breakfast', 'lunch', 'dinner', 'snack', 'pre-workout', 'post-workout'];
  
  return meals.filter(meal => messageLower.includes(meal));
}

/**
 * Extract body parts mentioned
 * 
 * @param {string} message 
 * @returns {Array<string>}
 */
function extractBodyParts(message) {
  const messageLower = message.toLowerCase();
  
  const bodyParts = [
    'chest', 'back', 'shoulders', 'arms', 'biceps', 'triceps',
    'legs', 'quads', 'hamstrings', 'calves', 'glutes',
    'abs', 'core', 'obliques'
  ];
  
  return bodyParts.filter(part => messageLower.includes(part));
}

/**
 * Get entity statistics for debugging
 * 
 * @param {Object} entities 
 * @returns {Object}
 */
export function getEntityStats(entities) {
  return {
    totalEntities: Object.values(entities).flat().length,
    foods: entities.foods.length,
    exercises: entities.exercises.length,
    numbers: entities.numbers.length,
    measurements: entities.measurements.length,
    timeReferences: entities.timeReferences.length,
    meals: entities.meals.length,
    bodyParts: entities.bodyParts.length,
    hasEntities: Object.values(entities).some(arr => arr.length > 0)
  };
}

/**
 * Format entities for logging
 * 
 * @param {Object} entities 
 * @returns {string}
 */
export function formatEntitiesForLogging(entities) {
  const parts = [];
  
  if (entities.foods.length > 0) {
    parts.push(`Foods: ${entities.foods.join(', ')}`);
  }
  
  if (entities.exercises.length > 0) {
    parts.push(`Exercises: ${entities.exercises.join(', ')}`);
  }
  
  if (entities.measurements.length > 0) {
    const measurements = entities.measurements
      .map(m => `${m.value}${m.unit}`)
      .join(', ');
    parts.push(`Measurements: ${measurements}`);
  }
  
  if (entities.timeReferences.length > 0) {
    const times = entities.timeReferences
      .map(t => t.reference)
      .join(', ');
    parts.push(`Time: ${times}`);
  }
  
  return parts.length > 0 ? parts.join(' | ') : 'No entities';
}

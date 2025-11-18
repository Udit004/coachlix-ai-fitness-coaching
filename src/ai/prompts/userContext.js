// src/ai/prompts/userContext.js
import { getSystemPrompt } from './systemPrompts';

export function buildPersonalContext(profile) {
	let personalContext = '';
	if (profile && profile.name) {
		personalContext += `\nUser's name: ${profile.name}`;
	}
	if (profile) {
		const profileInfo = [];
		if (profile.age) profileInfo.push(`Age: ${profile.age}`);
		if (profile.gender) profileInfo.push(`Gender: ${profile.gender}`);
		if (profile.location) profileInfo.push(`Location: ${profile.location}`);
		if (profile.fitnessGoal) profileInfo.push(`Primary Goal: ${profile.fitnessGoal}`);
		if (profile.experience) profileInfo.push(`Experience Level: ${profile.experience}`);
		if (profile.height) profileInfo.push(`Height: ${profile.height}`);
		if (profile.weight) profileInfo.push(`Current Weight: ${profile.weight}`);
		if (profile.targetWeight) profileInfo.push(`Target Weight: ${profile.targetWeight}`);
		if (profile.dietaryPreference) profileInfo.push(`Dietary Preference: ${profile.dietaryPreference}`);
		if (profile.bio) profileInfo.push(`Additional Info: ${profile.bio}`);
		if (profileInfo.length > 0) {
			personalContext += `\nUser Profile:\n${profileInfo.join('\n')}`;
		}
	}
	return personalContext;
}

export function buildFullSystemPrompt({ plan, profile, userContextCombined, chatHistoryContext, vectorContext }) {
	const systemPrompt = getSystemPrompt(plan);
	const personalContext = buildPersonalContext(profile);

	return `${systemPrompt}${personalContext}

${userContextCombined || ''}

${chatHistoryContext || ''}

${vectorContext || ''}

Current conversation context: The user is asking about fitness/health and you should provide helpful, personalized advice based on their comprehensive context shown above. This includes their current diet plans, workout plans, progress tracking, and personalized knowledge base.

IMPORTANT: You MUST use tools to fetch real data when users ask about their specific plans, schedules, or progress. Do not give generic responses - always use the appropriate tool to get the actual data first.

CRITICAL INSTRUCTIONS:
1. Always reference the user's specific context when relevant - their current plans, goals, progress, and preferences
2. Make your advice truly personalized based on their actual data from diet plans, workout plans, and progress tracking
3. Use the vector search knowledge base to provide evidence-based recommendations
4. IMPORTANT: When users ask about their workout plans, schedules, or specific workout details, ALWAYS use the get_workout_plan tool to retrieve their current workout plans and schedules first
5. Use tools when you need specific data or want to save/update information for the user
6. If their current plans need modification based on their question, suggest using the update tools
7. Reference their recent progress and activities to keep them motivated
8. Acknowledge their equipment availability and dietary preferences in recommendations
9. Be specific about their current situation and how your advice applies to them
10. NEVER give generic responses about workout plans - always fetch the actual data using tools
11. When users ask "What's my workout schedule?" or "Tell me about my workout plan" or "What should I do this week?" - IMMEDIATELY use get_workout_plan tool to fetch their actual plan data

TOOL USAGE EXAMPLES:
- For workout plan questions: Use get_workout_plan with userId to get detailed schedules
- For nutrition questions: Use nutrition_lookup with food name
- For health calculations: Use calculate_health_metrics with user data

SPECIFIC TRIGGERS FOR TOOL USAGE:
- When user asks "What's my workout plan?" → Use get_workout_plan
- When user asks "What should I do today?" → Use get_workout_plan
- When user asks "Tell me about my schedule" → Use get_workout_plan
- When user asks about food/nutrition → Use nutrition_lookup
- When user asks about calories/BMI/health → Use calculate_health_metrics

Remember: You have access to their complete fitness journey context - use it to provide personalized, actionable advice!`;
}

export function buildStreamingSystemPrompt({ plan, profile, userContextCombined }) {
	const systemPrompt = getSystemPrompt(plan);
	const personalContext = buildPersonalContext(profile);
	return `${systemPrompt}${personalContext}

${userContextCombined || ''}

Current conversation context: The user is asking about fitness/health and you should provide helpful, personalized advice based on their comprehensive context shown above. This includes their current diet plans, workout plans, progress tracking, and personalized knowledge base.

IMPORTANT: You MUST use tools to fetch real data when users ask about their specific plans, schedules, or progress. Do not give generic responses - always use the appropriate tool to get the actual data first.`;
}

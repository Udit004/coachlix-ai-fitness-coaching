// src/ai/prompts/userContext.js
import { getSystemPrompt } from './systemPrompts';

export function buildPersonalContext(profile, userId = null) {
	if (!userId && !profile) return '';
	
	const parts = [];
	
	if (userId) parts.push(`userId: ${userId}`);
	if (profile?.name) parts.push(`User: ${profile.name}`);
	if (profile?.fitnessGoal) parts.push(`Goal: ${profile.fitnessGoal}`);
	if (profile?.experience) parts.push(`Level: ${profile.experience}`);
	
	return parts.length > 0 ? `\n${parts.join(' | ')}` : '';
}

export function buildFullSystemPrompt({ plan, profile, userContextCombined, chatHistoryContext, vectorContext, userId, query = '' }) {
	const systemPrompt = getSystemPrompt(plan);
	const personalContext = buildPersonalContext(profile, userId);
	
	// Smart context filtering: Only include relevant context for the query type
	const isSimpleToolQuery = /\b(bmi|bmr|calorie|macro|nutrition|food)\b/i.test(query);
	
	// For simple tool queries, skip heavy context to save tokens
	if (isSimpleToolQuery) {
		return `${systemPrompt}${personalContext}

Use tools: calculate_health_metrics(userId), nutrition_lookup(food), get_workout_plan(userId)`;
	}

	// For complex queries, include full context
	return `${systemPrompt}${personalContext}

${userContextCombined || ''}

${chatHistoryContext || ''}

${vectorContext || ''}

Use tools for user data. Provide personalized advice.`;
}

export function buildStreamingSystemPrompt({ plan, profile, userContextCombined, userId }) {
	const systemPrompt = getSystemPrompt(plan);
	const personalContext = buildPersonalContext(profile, userId);
	return `${systemPrompt}${personalContext}

${userContextCombined || ''}

Use tools for user-specific data. Provide personalized fitness advice based on context above.`;
}

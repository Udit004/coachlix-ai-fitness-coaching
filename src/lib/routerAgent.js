// lib/routerAgent.js - Lightweight router to classify user intent

import { SystemMessage, HumanMessage } from "@langchain/core/messages";

const ROUTER_SYSTEM_PROMPT = `You are a routing classifier. Read the user's message and output ONLY a single JSON object with keys: category, confidence, rationale.

Allowed categories:
- workout_query: questions about workout plans, schedules, exercises, routines, training, sets/reps
- nutrition_query: questions about foods, calories, macros, meals, diet planning
- health_metrics_query: questions about BMI, BMR, calorie targets, macros calculation
- badminton_query: badminton-specific coaching, drills, technique, matches
- general_conversation: greetings, motivation, chit-chat or anything else

Rules:
- Respond with strictly one-line JSON. No extra commentary.
- confidence: number between 0 and 1.
`;

export async function classifyIntent(llm, userMessage) {
	try {
		const response = await llm.invoke([
			new SystemMessage(ROUTER_SYSTEM_PROMPT),
			new HumanMessage(userMessage)
		]);
		const content = typeof response?.content === 'string'
			? response.content
			: Array.isArray(response?.content)
				? response.content.map(c => (typeof c === 'string' ? c : c?.text || '')).join('')
				: '';
		let parsed;
		try {
			parsed = JSON.parse(content.trim());
		} catch {
			parsed = { category: 'general_conversation', confidence: 0.4, rationale: 'fallback' };
		}
		return parsed;
	} catch (error) {
		console.error('Router classification error:', error);
		return { category: 'general_conversation', confidence: 0.0, rationale: 'error' };
	}
}

export function mapCategoryToPlan(category) {
	switch (category) {
		case 'badminton_query':
			return 'badminton';
		case 'nutrition_query':
			return 'weight-loss';
		case 'workout_query':
			return 'muscle-gain';
		case 'health_metrics_query':
			return 'general';
		default:
			return 'general';
	}
}



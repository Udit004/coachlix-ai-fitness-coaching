// src/ai/reasoning/responseValidator.js
// Self-Critique and Response Validation for Quality Assurance
// Ensures responses are safe, accurate, culturally appropriate, and helpful

import { createStreamingLLM } from "../config/llmconfig";

/**
 * Validation criteria categories
 */
export const ValidationCategory = {
  SAFETY: 'safety',
  ACCURACY: 'accuracy',
  RELEVANCE: 'relevance',
  CULTURAL_APPROPRIATENESS: 'cultural_appropriateness',
  TONE: 'tone',
  COMPLETENESS: 'completeness',
  ACTIONABILITY: 'actionability'
};

/**
 * Validation result severity levels
 */
export const ValidationSeverity = {
  CRITICAL: 'critical',    // Must fix - could cause harm
  MAJOR: 'major',          // Should fix - significant issue
  MINOR: 'minor',          // Nice to fix - minor improvement
  PASS: 'pass'             // No issues
};

/**
 * Quick validation rules (pattern-based checks)
 * These run before LLM validation for efficiency
 */
const quickValidationRules = {
  safety: [
    {
      pattern: /\b(starve|starvation|skip meals?|don't eat|stop eating)\b/i,
      severity: ValidationSeverity.CRITICAL,
      issue: 'Contains potentially harmful advice about skipping meals or starvation',
      suggestion: 'Recommend healthy calorie deficits instead of extreme restriction'
    },
    {
      pattern: /\b(extreme|crash|very low calorie|under \d{3,4} calories)\b/i,
      severity: ValidationSeverity.MAJOR,
      issue: 'Suggests extreme dieting methods',
      suggestion: 'Recommend sustainable, moderate approaches'
    },
    {
      pattern: /\b(injury|pain|hurt|ache|strain)\b/i,
      severity: ValidationSeverity.MAJOR,
      issue: 'Mentions injury or pain - should recommend professional consultation',
      suggestion: 'Always advise consulting healthcare professionals for pain/injury'
    },
    {
      pattern: /\b(steroid|anabolic|drug|illegal|banned substance)\b/i,
      severity: ValidationSeverity.CRITICAL,
      issue: 'References potentially illegal or harmful substances',
      suggestion: 'Remove any mention of illegal or harmful substances'
    }
  ],
  
  culturalAppropriatenss: [
    {
      pattern: /\b(american|western|burger|pizza|hotdog)\b/i,
      context: 'isIndian',
      severity: ValidationSeverity.MINOR,
      issue: 'Suggests Western foods to likely Indian user',
      suggestion: 'Consider suggesting Indian alternatives (roti, dal, paneer, sabzi)'
    },
    {
      pattern: /\b(beef|pork)\b/i,
      context: 'isIndian',
      severity: ValidationSeverity.MAJOR,
      issue: 'Suggests foods that may be culturally inappropriate for Indian users',
      suggestion: 'Avoid beef/pork for Indian users unless explicitly requested'
    }
  ],
  
  completeness: [
    {
      pattern: /^.{0,50}$/,
      severity: ValidationSeverity.MINOR,
      issue: 'Response is very short (under 50 characters)',
      suggestion: 'Provide more detailed, helpful information'
    },
    {
      pattern: /\bI don't know\b/i,
      severity: ValidationSeverity.MAJOR,
      issue: 'Response admits inability to help',
      suggestion: 'Provide alternative suggestions or ask clarifying questions'
    },
    {
      pattern: /\b(maybe|perhaps|possibly|might be)\b/gi,
      threshold: 3,
      severity: ValidationSeverity.MINOR,
      issue: 'Response contains too many uncertain phrases',
      suggestion: 'Be more confident and directive in recommendations'
    }
  ],
  
  tone: [
    {
      pattern: /\b(stupid|dumb|idiot|lazy|pathetic|useless)\b/i,
      severity: ValidationSeverity.CRITICAL,
      issue: 'Contains disrespectful or demeaning language',
      suggestion: 'Use encouraging and supportive language'
    },
    {
      pattern: /\b(must|have to|need to|should|obligated)\b/gi,
      threshold: 5,
      severity: ValidationSeverity.MINOR,
      issue: 'Too many directive/commanding phrases',
      suggestion: 'Balance directives with suggestions and encouragement'
    }
  ]
};

/**
 * Run quick pattern-based validation checks
 * 
 * @param {string} response - Generated response
 * @param {Object} context - User context and intent
 * @returns {Array} - Array of validation issues
 */
function runQuickValidation(response, context = {}) {
  const issues = [];
  
  for (const [category, rules] of Object.entries(quickValidationRules)) {
    for (const rule of rules) {
      // Check context requirements
      if (rule.context === 'isIndian' && !context.isIndianUser) {
        continue;
      }
      
      // Check threshold-based patterns
      if (rule.threshold) {
        const matches = response.match(rule.pattern);
        if (matches && matches.length >= rule.threshold) {
          issues.push({
            category,
            severity: rule.severity,
            issue: rule.issue,
            suggestion: rule.suggestion,
            evidence: `Found ${matches.length} occurrences`
          });
        }
      } else {
        // Simple pattern match
        if (rule.pattern.test(response)) {
          issues.push({
            category,
            severity: rule.severity,
            issue: rule.issue,
            suggestion: rule.suggestion,
            evidence: response.match(rule.pattern)?.[0] || 'Pattern matched'
          });
        }
      }
    }
  }
  
  return issues;
}

/**
 * Generate validation prompt for LLM-based critique
 * 
 * @param {Object} params - { response, message, intent, userContext, reasoning }
 * @returns {string} - Validation prompt
 */
function generateValidationPrompt({ response, message, intent, userContext, reasoning }) {
  return `You are a quality assurance AI reviewing a fitness assistant's response for safety, accuracy, and helpfulness.

USER MESSAGE: "${message}"

DETECTED INTENT: ${intent.intent}

USER CONTEXT:
${userContext.combined || 'No context available'}

GENERATED RESPONSE:
"${response}"

REASONING USED:
${reasoning.keyPoints?.join('\n') || 'No reasoning available'}

Evaluate this response across these dimensions:

1. SAFETY ⚠️
   - Could this advice cause physical harm?
   - Does it recommend extreme or dangerous practices?
   - Should the user consult a professional instead?
   
2. ACCURACY 📊
   - Is the nutritional/fitness information correct?
   - Are calorie/macro calculations accurate?
   - Are exercise recommendations appropriate?

3. RELEVANCE 🎯
   - Does the response actually answer the user's question?
   - Is it aligned with their fitness goals?
   - Is it appropriate for their experience level?

4. CULTURAL APPROPRIATENESS 🌍
   - Are food suggestions culturally appropriate?
   - Does it respect dietary preferences?
   - Is language/terminology clear for the user's context?

5. TONE & ENCOURAGEMENT 💪
   - Is the tone supportive and motivating?
   - Does it avoid being judgmental or harsh?
   - Does it balance realism with encouragement?

6. COMPLETENESS ✅
   - Does it fully address the user's question?
   - Are there missing important details?
   - Should any disclaimers be added?

7. ACTIONABILITY 🚀
   - Can the user easily act on this advice?
   - Are instructions clear and specific?
   - Are next steps obvious?

Provide your critique in this format:

OVERALL SCORE: [1-10]

CRITICAL ISSUES (must fix immediately):
- [List any safety concerns or critical problems]

MAJOR ISSUES (should fix):
- [List significant problems affecting response quality]

MINOR IMPROVEMENTS:
- [List small enhancements]

STRENGTHS:
- [What works well]

RECOMMENDED CHANGES:
[Specific text modifications if needed]

FINAL VERDICT: PASS / NEEDS_REVISION / CRITICAL_REVISION`;
}

/**
 * Execute LLM-based validation and self-critique
 * 
 * @param {Object} params - { response, message, intent, userContext, reasoning }
 * @returns {Promise<Object>} - Validation results
 */
async function executeLLMValidation(params) {
  const startTime = Date.now();
  
  console.log('[ResponseValidator] 🔍 Running LLM validation...');
  
  try {
    const validationPrompt = generateValidationPrompt(params);
    
    const llm = createStreamingLLM(false);
    
    const response = await llm.invoke([
      { role: 'system', content: 'You are a quality assurance expert for fitness and health AI. Provide thorough, critical evaluation of responses.' },
      { role: 'user', content: validationPrompt }
    ]);
    
    const critique = response.content;
    const parsed = parseCritique(critique);
    
    const validationTime = Date.now() - startTime;
    
    console.log('[ResponseValidator] ✅ LLM validation complete in', validationTime, 'ms');
    console.log('[ResponseValidator] Overall score:', parsed.overallScore);
    console.log('[ResponseValidator] Verdict:', parsed.verdict);
    
    return {
      rawCritique: critique,
      ...parsed,
      validationTime
    };
    
  } catch (error) {
    console.error('[ResponseValidator] ❌ Error during LLM validation:', error);
    
    return {
      rawCritique: 'Error during validation',
      overallScore: 7,
      criticalIssues: [],
      majorIssues: [],
      minorImprovements: [],
      strengths: [],
      recommendedChanges: '',
      verdict: 'PASS',
      validationTime: Date.now() - startTime
    };
  }
}

/**
 * Parse LLM critique into structured format
 * 
 * @param {string} critique - Raw critique from LLM
 * @returns {Object} - Parsed validation results
 */
function parseCritique(critique) {
  const result = {
    overallScore: 7,
    criticalIssues: [],
    majorIssues: [],
    minorImprovements: [],
    strengths: [],
    recommendedChanges: '',
    verdict: 'PASS'
  };
  
  // Extract overall score
  const scoreMatch = critique.match(/OVERALL SCORE:\s*(\d+)/i);
  if (scoreMatch) {
    result.overallScore = parseInt(scoreMatch[1], 10);
  }
  
  // Extract verdict
  const verdictMatch = critique.match(/FINAL VERDICT:\s*(PASS|NEEDS_REVISION|CRITICAL_REVISION)/i);
  if (verdictMatch) {
    result.verdict = verdictMatch[1].toUpperCase();
  }
  
  // Extract critical issues
  const criticalSection = critique.match(/CRITICAL ISSUES.*?:\s*([\s\S]*?)(?=MAJOR ISSUES|$)/i);
  if (criticalSection && criticalSection[1]) {
    result.criticalIssues = extractBulletPoints(criticalSection[1]);
  }
  
  // Extract major issues
  const majorSection = critique.match(/MAJOR ISSUES.*?:\s*([\s\S]*?)(?=MINOR IMPROVEMENTS|$)/i);
  if (majorSection && majorSection[1]) {
    result.majorIssues = extractBulletPoints(majorSection[1]);
  }
  
  // Extract minor improvements
  const minorSection = critique.match(/MINOR IMPROVEMENTS.*?:\s*([\s\S]*?)(?=STRENGTHS|$)/i);
  if (minorSection && minorSection[1]) {
    result.minorImprovements = extractBulletPoints(minorSection[1]);
  }
  
  // Extract strengths
  const strengthsSection = critique.match(/STRENGTHS.*?:\s*([\s\S]*?)(?=RECOMMENDED CHANGES|$)/i);
  if (strengthsSection && strengthsSection[1]) {
    result.strengths = extractBulletPoints(strengthsSection[1]);
  }
  
  // Extract recommended changes
  const changesSection = critique.match(/RECOMMENDED CHANGES:\s*([\s\S]*?)(?=FINAL VERDICT|$)/i);
  if (changesSection && changesSection[1]) {
    result.recommendedChanges = changesSection[1].trim();
  }
  
  return result;
}

/**
 * Extract bullet points from text
 * 
 * @param {string} text - Text containing bullet points
 * @returns {Array} - Array of bullet points
 */
function extractBulletPoints(text) {
  const points = text.match(/[-•*]\s+(.+?)(?=\n|$)/g);
  if (points) {
    return points
      .map(point => point.replace(/^[-•*]\s+/, '').trim())
      .filter(point => point.length > 0);
  }
  return [];
}

/**
 * Main validation pipeline
 * Combines quick validation and LLM validation
 * 
 * @param {Object} params - { response, message, intent, userContext, reasoning, skipLLMValidation }
 * @returns {Promise<Object>} - Complete validation results
 */
export async function validateResponse(params) {
  const startTime = Date.now();
  
  console.log('\n[ResponseValidator] 🔍 Starting validation...');
  
  // Step 1: Quick pattern-based validation
  const quickIssues = runQuickValidation(params.response, params.userContext);
  
  console.log('[ResponseValidator] Quick validation found', quickIssues.length, 'issues');
  
  // Check for critical issues in quick validation
  const hasCriticalQuickIssues = quickIssues.some(
    issue => issue.severity === ValidationSeverity.CRITICAL
  );
  
  if (hasCriticalQuickIssues) {
    console.log('[ResponseValidator] ⚠️ CRITICAL issues found in quick validation!');
  }
  
  // Step 2: LLM validation (optional, can be skipped for performance)
  let llmValidation = null;
  
  if (!params.skipLLMValidation && (hasCriticalQuickIssues || quickIssues.length > 3)) {
    // Only run LLM validation if there are potential issues
    llmValidation = await executeLLMValidation(params);
  } else {
    console.log('[ResponseValidator] Skipping LLM validation (no critical issues, good quick check)');
  }
  
  // Step 3: Combine results
  const totalTime = Date.now() - startTime;
  
  const validationResult = {
    passed: quickIssues.length === 0 && (!llmValidation || llmValidation.verdict === 'PASS'),
    quickValidation: {
      issues: quickIssues,
      hasCritical: hasCriticalQuickIssues,
      hasMajor: quickIssues.some(i => i.severity === ValidationSeverity.MAJOR),
      issueCount: quickIssues.length
    },
    llmValidation,
    overallScore: llmValidation?.overallScore || (quickIssues.length === 0 ? 9 : 7),
    verdict: determineVerdict(quickIssues, llmValidation),
    validationTime: totalTime,
    timestamp: new Date().toISOString()
  };
  
  console.log('[ResponseValidator] ✅ Validation complete');
  console.log('[ResponseValidator] Verdict:', validationResult.verdict);
  console.log('[ResponseValidator] Score:', validationResult.overallScore);
  console.log('[ResponseValidator] Time:', totalTime, 'ms');
  
  return validationResult;
}

/**
 * Determine overall verdict from quick and LLM validation
 * 
 * @param {Array} quickIssues - Issues from quick validation
 * @param {Object} llmValidation - LLM validation results
 * @returns {string} - Overall verdict
 */
function determineVerdict(quickIssues, llmValidation) {
  // Critical issues = must revise
  if (quickIssues.some(i => i.severity === ValidationSeverity.CRITICAL)) {
    return 'CRITICAL_REVISION';
  }
  
  if (llmValidation?.verdict === 'CRITICAL_REVISION') {
    return 'CRITICAL_REVISION';
  }
  
  // Major issues or LLM says needs revision
  if (quickIssues.some(i => i.severity === ValidationSeverity.MAJOR) || 
      llmValidation?.verdict === 'NEEDS_REVISION') {
    return 'NEEDS_REVISION';
  }
  
  // Minor issues or all pass
  if (quickIssues.length <= 2 && quickIssues.every(i => i.severity === ValidationSeverity.MINOR)) {
    return 'PASS_WITH_NOTES';
  }
  
  return 'PASS';
}

/**
 * Apply automated fixes for common issues
 * 
 * @param {string} response - Original response
 * @param {Object} validation - Validation results
 * @returns {string} - Improved response
 */
export function applyAutomatedFixes(response, validation) {
  let improved = response;
  
  // Fix: Remove harmful advice patterns
  const harmfulPatterns = [
    { pattern: /\b(starve|starvation)\b/gi, replacement: 'manage calorie intake carefully' },
    { pattern: /\bskip meals?\b/gi, replacement: 'adjust meal timing' },
    { pattern: /\bdon't eat\b/gi, replacement: 'be mindful of portions' }
  ];
  
  for (const { pattern, replacement } of harmfulPatterns) {
    if (pattern.test(improved)) {
      console.log('[ResponseValidator] 🔧 Auto-fixing harmful pattern:', pattern);
      improved = improved.replace(pattern, replacement);
    }
  }
  
  // Fix: Add disclaimers for medical advice
  if (/\b(injury|pain|medical|condition|disease)\b/i.test(improved)) {
    if (!/\b(consult|doctor|healthcare|professional)\b/i.test(improved)) {
      improved += '\n\n⚠️ Note: If you\'re experiencing persistent pain or have a medical condition, please consult with a healthcare professional.';
      console.log('[ResponseValidator] 🔧 Added medical disclaimer');
    }
  }
  
  // Fix: Make response more encouraging if too directive
  const directiveCount = (improved.match(/\b(must|have to|need to)\b/gi) || []).length;
  if (directiveCount > 4) {
    improved = improved.replace(/\bmust\b/gi, 'should');
    improved = improved.replace(/\bhave to\b/gi, 'it\'s good to');
    console.log('[ResponseValidator] 🔧 Softened directive language');
  }
  
  return improved;
}

/**
 * Format validation summary for logging
 * 
 * @param {Object} validation - Validation results
 * @returns {string} - Formatted summary
 */
export function formatValidationSummary(validation) {
  let summary = '\n=== VALIDATION SUMMARY ===\n';
  
  summary += `Verdict: ${validation.verdict}\n`;
  summary += `Score: ${validation.overallScore}/10\n`;
  summary += `Validation Time: ${validation.validationTime}ms\n\n`;
  
  if (validation.quickValidation.issueCount > 0) {
    summary += `Quick Validation Issues: ${validation.quickValidation.issueCount}\n`;
    validation.quickValidation.issues.forEach(issue => {
      summary += `  [${issue.severity.toUpperCase()}] ${issue.issue}\n`;
      summary += `    → ${issue.suggestion}\n`;
    });
  }
  
  if (validation.llmValidation) {
    summary += `\nLLM Validation:\n`;
    if (validation.llmValidation.criticalIssues.length > 0) {
      summary += `  Critical Issues:\n`;
      validation.llmValidation.criticalIssues.forEach(issue => {
        summary += `    - ${issue}\n`;
      });
    }
    if (validation.llmValidation.strengths.length > 0) {
      summary += `  Strengths:\n`;
      validation.llmValidation.strengths.forEach(strength => {
        summary += `    + ${strength}\n`;
      });
    }
  }
  
  summary += '='.repeat(50) + '\n';
  
  return summary;
}

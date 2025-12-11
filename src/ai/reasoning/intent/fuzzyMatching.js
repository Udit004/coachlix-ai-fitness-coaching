// src/ai/reasoning/intent/fuzzyMatching.js
// Fuzzy matching for typo tolerance and text variations
// Helps catch user messages with typos, abbreviations, and casual language

/**
 * Calculate Levenshtein distance between two strings
 * Used for fuzzy matching to handle typos
 * 
 * @param {string} str1 
 * @param {string} str2 
 * @returns {number} - Edit distance
 */
function levenshteinDistance(str1, str2) {
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix = [];

  // Initialize matrix
  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  // Fill matrix
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // deletion
        matrix[i][j - 1] + 1,      // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return matrix[len1][len2];
}

/**
 * Calculate similarity ratio between two strings (0-1)
 * 
 * @param {string} str1 
 * @param {string} str2 
 * @returns {number} - Similarity ratio (0 = completely different, 1 = identical)
 */
export function calculateSimilarity(str1, str2) {
  const maxLen = Math.max(str1.length, str2.length);
  if (maxLen === 0) return 1.0;
  
  const distance = levenshteinDistance(str1.toLowerCase(), str2.toLowerCase());
  return 1 - (distance / maxLen);
}

/**
 * Check if a word matches a keyword with fuzzy tolerance
 * Handles typos and minor variations
 * 
 * @param {string} word - Word from user message
 * @param {string} keyword - Keyword to match against
 * @param {number} threshold - Similarity threshold (default: 0.8)
 * @returns {boolean}
 */
export function fuzzyMatch(word, keyword, threshold = 0.8) {
  // Exact match
  if (word.toLowerCase() === keyword.toLowerCase()) {
    return true;
  }
  
  // Skip fuzzy matching for very short words (too many false positives)
  if (word.length < 3 || keyword.length < 3) {
    return false;
  }
  
  // Calculate similarity
  const similarity = calculateSimilarity(word, keyword);
  return similarity >= threshold;
}

/**
 * Find fuzzy keyword matches in a message
 * Returns matched keywords with their similarity scores
 * 
 * @param {string} message 
 * @param {Array<string>} keywords 
 * @param {number} threshold 
 * @returns {Array<{keyword: string, matched: string, similarity: number}>}
 */
export function findFuzzyMatches(message, keywords, threshold = 0.8) {
  const words = message.toLowerCase().split(/\s+/);
  const matches = [];
  
  for (const keyword of keywords) {
    const keywordLower = keyword.toLowerCase();
    
    // Check for exact substring match first (faster)
    if (message.toLowerCase().includes(keywordLower)) {
      matches.push({
        keyword,
        matched: keywordLower,
        similarity: 1.0,
        matchType: 'exact'
      });
      continue;
    }
    
    // Check for fuzzy match in individual words
    for (const word of words) {
      if (fuzzyMatch(word, keywordLower, threshold)) {
        const similarity = calculateSimilarity(word, keywordLower);
        matches.push({
          keyword,
          matched: word,
          similarity,
          matchType: 'fuzzy'
        });
        break; // Only count first match per keyword
      }
    }
  }
  
  return matches;
}

/**
 * Common abbreviations and their expansions
 * Helps normalize casual language
 */
const abbreviationMap = {
  // Common chat abbreviations
  'u': 'you',
  'ur': 'your',
  'r': 'are',
  'y': 'why',
  'bc': 'because',
  'bcz': 'because',
  'cuz': 'because',
  'thx': 'thanks',
  'ty': 'thank you',
  'pls': 'please',
  'plz': 'please',
  
  // Fitness abbreviations
  'cal': 'calories',
  'cals': 'calories',
  'prot': 'protein',
  'carb': 'carbohydrates',
  'rep': 'repetition',
  'reps': 'repetitions',
  'wt': 'weight',
  'lbs': 'pounds',
  'kg': 'kilograms',
  
  // Time abbreviations
  'tmrw': 'tomorrow',
  'tmr': 'tomorrow',
  'tdy': 'today',
  'yday': 'yesterday',
  'wk': 'week',
  'mo': 'month',
  'yr': 'year',
  
  // Common typos
  'recepie': 'recipe',
  'recipie': 'recipe',
  'excercise': 'exercise',
  'excersize': 'exercise',
  'protien': 'protein',
  'calries': 'calories',
  'nutrtion': 'nutrition'
};

/**
 * Expand abbreviations in a message
 * 
 * @param {string} message 
 * @returns {string} - Message with abbreviations expanded
 */
export function expandAbbreviations(message) {
  const words = message.split(/\b/); // Split on word boundaries
  
  const expandedWords = words.map(word => {
    const lowerWord = word.toLowerCase();
    return abbreviationMap[lowerWord] || word;
  });
  
  return expandedWords.join('');
}

/**
 * Normalize message for better matching
 * - Expands abbreviations
 * - Removes extra whitespace
 * - Handles common variations
 * 
 * @param {string} message 
 * @returns {string}
 */
export function normalizeMessage(message) {
  if (!message || typeof message !== 'string') {
    return '';
  }
  
  let normalized = message;
  
  // Expand abbreviations
  normalized = expandAbbreviations(normalized);
  
  // Remove extra whitespace
  normalized = normalized.replace(/\s+/g, ' ').trim();
  
  // Handle common contractions
  normalized = normalized
    .replace(/won't/gi, 'will not')
    .replace(/can't/gi, 'cannot')
    .replace(/n't/g, ' not')
    .replace(/'m/g, ' am')
    .replace(/'re/g, ' are')
    .replace(/'ve/g, ' have')
    .replace(/'ll/g, ' will')
    .replace(/'d/g, ' would');
  
  return normalized;
}

/**
 * Check if message matches pattern with fuzzy tolerance
 * Useful for handling typos in pattern matching
 * 
 * @param {string} message 
 * @param {RegExp} pattern 
 * @param {boolean} useFuzzy - Whether to try fuzzy matching if exact fails
 * @returns {boolean}
 */
export function fuzzyPatternMatch(message, pattern, useFuzzy = true) {
  // Try exact pattern match first
  if (pattern.test(message)) {
    return true;
  }
  
  // If fuzzy matching is disabled, return false
  if (!useFuzzy) {
    return false;
  }
  
  // Try with normalized message
  const normalized = normalizeMessage(message);
  return pattern.test(normalized);
}

/**
 * Score fuzzy matches based on quality
 * Better matches get higher scores
 * 
 * @param {Array} matches - Array of fuzzy matches
 * @returns {number} - Aggregate score
 */
export function scoreFuzzyMatches(matches) {
  if (!matches || matches.length === 0) {
    return 0;
  }
  
  let totalScore = 0;
  
  for (const match of matches) {
    // Exact matches get full points
    if (match.matchType === 'exact') {
      totalScore += 1.0;
    } else {
      // Fuzzy matches get partial points based on similarity
      totalScore += match.similarity * 0.8; // Slightly penalize fuzzy matches
    }
  }
  
  return totalScore;
}

/**
 * Get fuzzy match statistics for debugging
 * 
 * @param {Array} matches 
 * @returns {Object}
 */
export function getFuzzyMatchStats(matches) {
  const exactMatches = matches.filter(m => m.matchType === 'exact');
  const fuzzyMatches = matches.filter(m => m.matchType === 'fuzzy');
  
  return {
    total: matches.length,
    exact: exactMatches.length,
    fuzzy: fuzzyMatches.length,
    avgSimilarity: matches.length > 0 
      ? matches.reduce((sum, m) => sum + m.similarity, 0) / matches.length 
      : 0,
    score: scoreFuzzyMatches(matches)
  };
}

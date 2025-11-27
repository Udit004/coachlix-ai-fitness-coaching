// src/ai/streaming/streamProcessor.js
// Handles real-time stream processing and chunk extraction

/**
 * Process a single stream chunk and extract text content
 * @param {Object} chunk - Stream chunk from Gemini
 * @returns {string} - Extracted text content
 */
export function extractChunkText(chunk) {
  let chunkText = "";
  
  if (typeof chunk.content === 'string') {
    chunkText = chunk.content;
  } else if (Array.isArray(chunk.content)) {
    chunkText = chunk.content
      .map(c => {
        if (typeof c === 'string') return c;
        if (c.text) return c.text;
        if (c.type === 'text' && c.text) return c.text;
        return '';
      })
      .join('');
  }
  
  // Debug: Log chunk structure if text extraction failed
  if (!chunkText && chunk.content) {
    console.log('[StreamProcessor] ⚠️ Failed to extract text from chunk:', {
      contentType: typeof chunk.content,
      isArray: Array.isArray(chunk.content),
      content: JSON.stringify(chunk.content).substring(0, 200)
    });
  }
  
  return chunkText;
}

/**
 * Stream text content to frontend word-by-word
 * @param {string} chunkText - Text to stream
 * @param {string} fullResponse - Current full response
 * @param {Function} onChunk - Callback for streaming
 * @returns {Promise<string>} - Last word streamed
 */
export async function streamTextToFrontend(chunkText, fullResponse, onChunk) {
  if (!onChunk || !chunkText) return "";
  
  let lastWord = "";
  const words = chunkText.split(/(\s+)/);
  
  for (const word of words) {
    if (word) {
      lastWord = word;
      await onChunk({
        word: word,
        partialResponse: fullResponse,
        isComplete: false
      });
    }
  }
  
  return lastWord;
}

/**
 * Send completion signal to frontend
 * @param {Function} onChunk - Callback for streaming
 * @param {string} fullResponse - Final complete response
 * @param {string} lastWord - Last word that was streamed
 */
export async function sendCompletionSignal(onChunk, fullResponse, lastWord) {
  if (onChunk && lastWord) {
    await onChunk({
      word: "",
      partialResponse: fullResponse,
      isComplete: true
    });
  }
}

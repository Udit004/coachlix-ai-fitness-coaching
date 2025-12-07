// ai/multimodal/contentBuilder.js - Build multimodal content for Gemini

/**
 * Build multimodal content for Google Gemini
 * Combines text messages with images and documents
 * 
 * @param {string} message - Text message from user
 * @param {Array} files - Array of uploaded files with base64 data
 * @returns {Array} - Array of content parts for Gemini
 */
export function buildMultimodalContent(message, files = []) {
  const parts = [];
  
  // Add text message first
  if (message && message.trim()) {
    parts.push({
      type: "text",
      text: message
    });
  }
  
  // Add files (images and documents)
  if (files && files.length > 0) {
    files.forEach((file, index) => {
      try {
        // Auto-detect category from MIME type if not provided
        let category = file.category;
        if (!category && file.type) {
          category = file.type.startsWith('image/') ? 'image' : 'document';
        }
        
        // Validate required fields
        if (!file.base64) {
          console.error(`[Multimodal] File ${index + 1} (${file.name}): Missing base64 data`);
          return;
        }
        
        if (!file.type) {
          console.error(`[Multimodal] File ${index + 1} (${file.name}): Missing MIME type`);
          return;
        }
        
        if (category === 'image') {
          // Add image with inline data - LangChain format
          parts.push({
            type: "image_url",
            image_url: {
              url: `data:${file.type};base64,${file.base64}`
            }
          });
          
          console.log(`[Multimodal] ✅ Added image ${index + 1}: ${file.name} (${file.type})`);
        } else if (category === 'document') {
          // For documents, we'll add as text with a note
          // Gemini doesn't support document inline data in the same way
          parts.push({
            type: "text",
            text: `[Document attached: ${file.name}]`
          });
          
          console.log(`[Multimodal] ✅ Added document ${index + 1}: ${file.name} (${file.type})`);
        } else {
          console.warn(`[Multimodal] ⚠️ Unknown category for file ${index + 1}: ${file.name} (category: ${category}, type: ${file.type})`);
        }
      } catch (error) {
        console.error(`[Multimodal] ❌ Error adding file ${file.name}:`, error);
      }
    });
  }
  
  console.log(`[Multimodal] 📦 Built multimodal content with ${parts.length} parts (${parts.filter(p => p.type === 'text').length} text, ${parts.filter(p => p.type === 'image_url').length} images)`);
  
  return parts;
}

/**
 * Check if content is multimodal (contains files)
 * 
 * @param {Array} files - Array of files
 * @returns {boolean} - True if multimodal
 */
export function isMultimodalContent(files) {
  return files && Array.isArray(files) && files.length > 0;
}

/**
 * Get content type description for logging
 * 
 * @param {string} message - Text message
 * @param {Array} files - Array of files
 * @returns {string} - Description of content type
 */
export function getContentTypeDescription(message, files = []) {
  const hasText = message && message.trim();
  const hasFiles = files && files.length > 0;
  
  if (hasText && hasFiles) {
    const fileTypes = files.map(f => f.category).join(', ');
    return `text + ${files.length} file(s): ${fileTypes}`;
  } else if (hasText) {
    return 'text only';
  } else if (hasFiles) {
    const fileTypes = files.map(f => f.category).join(', ');
    return `${files.length} file(s): ${fileTypes}`;
  }
  
  return 'empty';
}

/**
 * Validate files for multimodal input
 * 
 * @param {Array} files - Array of files to validate
 * @returns {Object} - { valid: boolean, errors: Array }
 */
export function validateMultimodalFiles(files) {
  const errors = [];
  
  if (!files || !Array.isArray(files)) {
    return { valid: true, errors: [] }; // No files is valid
  }
  
  files.forEach((file, index) => {
    // Check required fields
    if (!file.base64) {
      errors.push(`File ${index + 1} (${file.name}): Missing base64 data`);
    }
    
    if (!file.type) {
      errors.push(`File ${index + 1} (${file.name}): Missing MIME type`);
    }
    
    if (!file.category) {
      errors.push(`File ${index + 1} (${file.name}): Missing category`);
    }
    
    // Validate category
    if (file.category && !['image', 'document'].includes(file.category)) {
      errors.push(`File ${index + 1} (${file.name}): Invalid category '${file.category}'`);
    }
  });
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Format file metadata for chat history
 * Removes base64 data to save space
 * 
 * @param {Array} files - Array of files
 * @returns {Array} - Array of file metadata without base64
 */
export function formatFilesForHistory(files) {
  if (!files || !Array.isArray(files)) {
    return [];
  }
  
  return files.map(file => ({
    name: file.name,
    size: file.size,
    type: file.type,
    category: file.category,
    url: file.url,
    timestamp: file.timestamp
    // Note: base64 is excluded to save storage space
  }));
}

/**
 * Create a user message object with files
 * 
 * @param {string} message - Text message
 * @param {Array} files - Array of files
 * @returns {Object} - Message object for chat history
 */
export function createMultimodalMessage(message, files = []) {
  return {
    role: 'user',
    content: message,
    files: formatFilesForHistory(files),
    hasFiles: files && files.length > 0,
    timestamp: new Date().toISOString()
  };
}

/**
 * Extract file information for logging
 * 
 * @param {Array} files - Array of files
 * @returns {Object} - Summary of files
 */
export function getFilesSummary(files) {
  if (!files || !Array.isArray(files) || files.length === 0) {
    return {
      count: 0,
      images: 0,
      documents: 0,
      totalSize: 0,
      types: []
    };
  }
  
  // Auto-detect categories if missing
  const filesWithCategories = files.map(f => ({
    ...f,
    category: f.category || (f.type?.startsWith('image/') ? 'image' : 'document')
  }));
  
  return {
    count: filesWithCategories.length,
    images: filesWithCategories.filter(f => f.category === 'image').length,
    documents: filesWithCategories.filter(f => f.category === 'document').length,
    totalSize: filesWithCategories.reduce((sum, f) => sum + (f.size || 0), 0),
    types: [...new Set(filesWithCategories.map(f => f.type).filter(Boolean))]
  };
}

/**
 * Build enhanced prompt for multimodal content
 * Adds context about attached files
 * 
 * @param {string} message - Original message
 * @param {Array} files - Array of files
 * @returns {string} - Enhanced message with file context
 */
export function buildEnhancedPrompt(message, files = []) {
  if (!files || files.length === 0) {
    return message;
  }
  
  const fileDescriptions = files.map((file, index) => {
    if (file.category === 'image') {
      return `Image ${index + 1}: ${file.name}`;
    } else {
      return `Document ${index + 1}: ${file.name}`;
    }
  }).join(', ');
  
  // Add file context to the message
  const enhancedMessage = message 
    ? `${message}\n\n[Attached: ${fileDescriptions}]`
    : `[Attached: ${fileDescriptions}]`;
  
  return enhancedMessage;
}

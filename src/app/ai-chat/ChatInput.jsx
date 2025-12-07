import React, { useRef, useEffect, useState } from 'react';
import { 
  Send, 
  Mic, 
  MicOff, 
  Paperclip, 
  Sparkles,
  Square,
  X,
  FileText,
  Image,
  File,
  Upload
} from './icons';
import useSpeechRecognition from '../../hooks/useSpeechRecognition';
import SpeechPermissionModal from '../../components/SpeechPermissionModal';

const ChatInput = ({ 
  inputValue, 
  setInputValue, 
  handleSendMessage, 
  isTyping, 
  isRecording, 
  toggleRecording 
}) => {
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [permissionError, setPermissionError] = useState(null);
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  
  const {
    isListening,
    transcript,
    interimTranscript,
    error: speechError,
    isSupported,
    startListening,
    stopListening,
    resetTranscript
  } = useSpeechRecognition();

  // Supported file types
  const supportedTypes = {
    'image/*': { icon: Image, label: 'Image' },
    'application/pdf': { icon: FileText, label: 'PDF' },
    'text/*': { icon: FileText, label: 'Text' },
    'application/msword': { icon: FileText, label: 'Word' },
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { icon: FileText, label: 'Word' },
    'application/vnd.ms-excel': { icon: FileText, label: 'Excel' },
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': { icon: FileText, label: 'Excel' },
    'application/json': { icon: FileText, label: 'JSON' },
    'text/csv': { icon: FileText, label: 'CSV' }
  };

  // Handle speech recognition
  const handleSpeechToggle = () => {
    if (isListening) {
      stopListening();
    } else {
      if (!navigator.permissions) {
        requestMicrophonePermission();
      } else {
        navigator.permissions.query({ name: 'microphone' }).then(result => {
          if (result.state === 'granted') {
            startSpeechRecognition();
          } else if (result.state === 'prompt') {
            setShowPermissionModal(true);
          } else {
            setPermissionError('Microphone access denied. Please enable it in your browser settings.');
            setShowPermissionModal(true);
          }
        }).catch(() => {
          requestMicrophonePermission();
        });
      }
    }
  };

  const requestMicrophonePermission = () => {
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        stream.getTracks().forEach(track => track.stop());
        startSpeechRecognition();
      })
      .catch(err => {
        console.error('Microphone permission denied:', err);
        setPermissionError('Microphone access denied. Please allow microphone access to use voice input.');
        setShowPermissionModal(true);
      });
  };

  const startSpeechRecognition = () => {
    resetTranscript();
    startListening();
  };

  const handleAllowPermission = () => {
    setShowPermissionModal(false);
    setPermissionError(null);
    requestMicrophonePermission();
  };

  const handleCloseModal = () => {
    setShowPermissionModal(false);
    setPermissionError(null);
  };

  // File handling functions
  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const validateFile = (file) => {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = Object.keys(supportedTypes);
    
    if (file.size > maxSize) {
      return 'File size must be less than 10MB';
    }
    
    const isSupported = allowedTypes.some(type => {
      if (type.endsWith('/*')) {
        return file.type.startsWith(type.slice(0, -1));
      }
      return file.type === type;
    });
    
    if (!isSupported) {
      return 'File type not supported';
    }
    
    return null;
  };

  const getFileIcon = (fileType) => {
    for (const [type, config] of Object.entries(supportedTypes)) {
      if (type.endsWith('/*')) {
        if (fileType.startsWith(type.slice(0, -1))) {
          return config.icon;
        }
      } else if (fileType === type) {
        return config.icon;
      }
    }
    return File;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const processFiles = async (files) => {
    const fileArray = Array.from(files);
    const validFiles = [];
    const errors = [];

    for (const file of fileArray) {
      const error = validateFile(file);
      if (error) {
        errors.push(`${file.name}: ${error}`);
        continue;
      }

      try {
        // Upload file to server
        const formData = new FormData();
        formData.append('file', file);

        console.log(`[ChatInput] Uploading ${file.name}...`);
        
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Upload failed');
        }

        const result = await response.json();
        
        if (!result.success) {
          throw new Error(result.error || 'Upload failed');
        }

        console.log(`[ChatInput] ✅ Uploaded ${file.name}:`, result.file.url);

        // Create file object with uploaded data
        const fileObj = {
          id: Date.now() + Math.random(),
          file,
          name: result.file.name,
          size: result.file.size,
          type: result.file.type,
          category: result.file.category,
          url: result.file.url,
          base64: result.file.base64, // ← Important: base64 data from server
          cloudinaryId: result.file.cloudinaryId,
          preview: null
        };

        // Create preview for images
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = (e) => {
            setAttachedFiles(prev => 
              prev.map(f => 
                f.id === fileObj.id 
                  ? { ...f, preview: e.target.result }
                  : f
              )
            );
          };
          reader.readAsDataURL(file);
        }

        validFiles.push(fileObj);
      } catch (uploadError) {
        console.error(`[ChatInput] Upload error for ${file.name}:`, uploadError);
        errors.push(`${file.name}: ${uploadError.message}`);
      }
    }

    if (errors.length > 0) {
      alert('Some files could not be attached:\n' + errors.join('\n'));
    }

    setAttachedFiles(prev => [...prev, ...validFiles]);
  };

  const handleFileInputChange = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFiles(files);
    }
    // Reset input value to allow selecting the same file again
    e.target.value = '';
  };

  const removeFile = (fileId) => {
    setAttachedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  // Drag and drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFiles(files);
    }
  };

  // Enhanced send message handler
  const handleSendWithFiles = () => {
    const messageData = {
      text: inputValue,
      files: attachedFiles
    };
    
    // Call the original handler with enhanced data
    handleSendMessage(messageData);
    
    // Clear attached files after sending
    setAttachedFiles([]);
  };

  // Update input value with speech transcript
  useEffect(() => {
    if (transcript) {
      setInputValue(prev => prev + transcript);
      resetTranscript();
    }
  }, [transcript, setInputValue, resetTranscript]);

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendWithFiles();
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [inputValue]);

  return (
    <>
      <div className="px-3 py-2.5 bg-gray-900/95 backdrop-blur-sm">
        {/* File attachments preview - Above input */}
        {attachedFiles.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1.5 max-w-3xl mx-auto">
            {attachedFiles.map((file) => {
              const IconComponent = getFileIcon(file.type);
              return (
                <div
                  key={file.id}
                  className="flex items-center space-x-1.5 bg-gray-700/50 rounded-lg px-2 py-1 text-sm max-w-xs border border-gray-600/50 hover:border-gray-500 transition-colors"
                >
                  {file.preview ? (
                    <img
                      src={file.preview}
                      alt={file.name}
                      className="w-6 h-6 object-cover rounded"
                    />
                  ) : (
                    <IconComponent className="h-3.5 w-3.5 text-gray-400" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-200 truncate text-[11px] font-medium">{file.name}</p>
                  </div>
                  <button
                    onClick={() => removeFile(file.id)}
                    className="text-gray-400 hover:text-red-400 transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Main input container - Minimal height like ChatGPT */}
        <div className="max-w-3xl mx-auto">
          <div 
            className={`relative flex items-center gap-2 bg-gray-800 rounded-[26px] border transition-all duration-200 ${
              isDragging
                ? 'border-blue-500 ring-1 ring-blue-400/50 bg-blue-900/10'
                : isListening 
                  ? 'border-red-500 ring-1 ring-red-400/50 bg-red-900/10' 
                  : 'border-gray-700 hover:border-gray-600 focus-within:border-gray-600'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {/* Paperclip button */}
            <button
              onClick={handleFileSelect}
              className="ml-3 p-2 text-gray-400 hover:text-gray-200 hover:bg-gray-700 transition-all rounded-lg cursor-pointer flex-shrink-0"
              title="Attach file"
            >
              <Paperclip className="h-5 w-5" />
            </button>

            {/* Textarea - Centered vertically */}
            <div className="flex-1 py-2.5">
              <textarea
                ref={textareaRef}
                value={inputValue + interimTranscript}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={
                  isDragging 
                    ? "Drop files here..." 
                    : isListening 
                      ? "Listening..." 
                      : "Ask anything"
                }
                className="w-full resize-none bg-transparent border-0 px-0 py-0 focus:outline-none focus:ring-0 max-h-[200px] min-h-[24px] text-gray-100 placeholder-gray-500 text-[15px] leading-6"
                rows={1}
                disabled={isTyping}
                style={{
                  fontSize: '15px',
                  lineHeight: '24px'
                }}
              />
            </div>
            
            {/* Right side buttons - Mic and Send */}
            <div className="flex items-center gap-1 mr-2 flex-shrink-0">
              {/* Mic button */}
              <button
                onClick={handleSpeechToggle}
                disabled={!isSupported || isTyping}
                className={`p-2 transition-all rounded-lg relative cursor-pointer flex-shrink-0 ${
                  isListening 
                    ? 'text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20' 
                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
                } ${!isSupported ? 'opacity-50 cursor-not-allowed' : ''}`}
                title={isSupported ? (isListening ? 'Stop recording' : 'Start voice input') : 'Speech not supported'}
              >
                {isListening ? (
                  <Square className="h-5 w-5 fill-current" />
                ) : (
                  <Mic className="h-5 w-5" />
                )}
                {isListening && (
                  <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-red-500 rounded-full animate-ping"></div>
                )}
              </button>

              {/* Send button - Square with blue background when active */}
              <button
                onClick={handleSendWithFiles}
                disabled={(!inputValue.trim() && attachedFiles.length === 0) || isTyping}
                className={`p-2 rounded-lg transition-all duration-200 cursor-pointer flex-shrink-0 ${
                  (!inputValue.trim() && attachedFiles.length === 0) || isTyping
                    ? 'bg-transparent text-gray-600 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-500 text-white'
                }`}
              >
                <Send className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Helper text - Only show when needed */}
          {((isDragging || isListening) || (speechError || permissionError)) && (
            <div className="flex items-center justify-center mt-1.5 text-xs text-gray-500">
              {(isDragging || isListening) && (
                <div className="flex items-center gap-1.5">
                  <Sparkles className="h-3 w-3 text-blue-400 animate-pulse" />
                  <span className="text-[11px] text-gray-400">
                    {isDragging ? 'Drop to attach' : 'Listening...'}
                  </span>
                </div>
              )}
              {(speechError || permissionError) && (
                <span className="text-red-400 text-[11px]">{speechError || permissionError}</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,application/pdf,text/*,.doc,.docx,.xls,.xlsx,.json,.csv"
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* Speech Permission Modal */}
      <SpeechPermissionModal
        isOpen={showPermissionModal}
        onClose={handleCloseModal}
        onAllow={handleAllowPermission}
        error={permissionError}
      />
    </>
  );
};

export default ChatInput;
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

  const processFiles = (files) => {
    const fileArray = Array.from(files);
    const validFiles = [];
    const errors = [];

    fileArray.forEach(file => {
      const error = validateFile(file);
      if (error) {
        errors.push(`${file.name}: ${error}`);
      } else {
        const fileObj = {
          id: Date.now() + Math.random(),
          file,
          name: file.name,
          size: file.size,
          type: file.type,
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
      }
    });

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
      <div className="border-t border-gray-700 p-2 sm:p-3 bg-gray-800/50 backdrop-blur-sm">
        {/* File attachments preview */}
        {attachedFiles.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2">
            {attachedFiles.map((file) => {
              const IconComponent = getFileIcon(file.type);
              return (
                <div
                  key={file.id}
                  className="flex items-center space-x-2 bg-gray-700/50 rounded-lg px-2 py-1.5 text-sm max-w-xs border border-gray-600"
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
                    <p className="text-gray-200 truncate text-xs">{file.name}</p>
                    <p className="text-gray-400 text-[10px]">{formatFileSize(file.size)}</p>
                  </div>
                  <button
                    onClick={() => removeFile(file.id)}
                    className="text-gray-400 hover:text-gray-200 ml-1"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <div 
          className={`flex items-end space-x-2 sm:space-x-4 ${
            isDragging ? 'bg-blue-900/20 border-2 border-dashed border-blue-500 rounded-xl p-4' : ''
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={inputValue + interimTranscript}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={
                isDragging 
                  ? "Drop files here..." 
                  : isListening 
                    ? "Listening... Speak now!" 
                    : "Ask about workouts, diet plans, badminton training..."
              }
              className={`w-full resize-none rounded-lg sm:rounded-xl border px-3 sm:px-4 py-2 sm:py-2.5 pr-16 sm:pr-20 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent max-h-32 min-h-[40px] sm:min-h-[44px] bg-gray-800/90 backdrop-blur-sm text-gray-200 placeholder-gray-500 shadow-sm text-sm sm:text-base transition-all duration-200 ${
                isDragging
                  ? 'border-blue-500 ring-2 ring-blue-400/50 bg-blue-900/30'
                  : isListening 
                    ? 'border-red-500 ring-2 ring-red-400/50 bg-red-900/30' 
                    : 'border-gray-700'
              }`}
              rows={1}
              disabled={isTyping}
              style={{
                fontSize: '14px',
                lineHeight: '1.4',
                color: '#e5e7eb'
              }}
            />
            
            <div className="absolute bottom-2 right-2 flex items-center space-x-1">
              <button
                onClick={handleFileSelect}
                className="p-1.5 text-gray-400 hover:text-gray-200 transition-colors rounded-lg hover:bg-gray-700"
                title="Attach file"
              >
                <Paperclip className="h-4 w-4" />
              </button>
              <button
                onClick={handleSpeechToggle}
                disabled={!isSupported || isTyping}
                className={`p-1.5 transition-colors rounded-lg relative ${
                  isListening 
                    ? 'text-red-400 hover:text-red-300 hover:bg-red-900/30 animate-pulse' 
                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
                } ${!isSupported ? 'opacity-50 cursor-not-allowed' : ''}`}
                title={isSupported ? (isListening ? 'Stop recording' : 'Start voice input') : 'Speech not supported'}
              >
                {isListening ? (
                  <Square className="h-4 w-4 fill-current" />
                ) : (
                  <Mic className="h-4 w-4" />
                )}
                {isListening && (
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-ping"></div>
                )}
              </button>
            </div>
          </div>
          
          <button
            onClick={handleSendWithFiles}
            disabled={(!inputValue.trim() && attachedFiles.length === 0) || isTyping}
            className="flex-shrink-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-2 sm:p-2.5 rounded-lg sm:rounded-xl hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
          >
            <Send className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
          </button>
        </div>
        
        <div className="flex items-center justify-between mt-1.5 sm:mt-2 text-xs text-gray-400">
          <div className="flex items-center space-x-1.5">
            {(isDragging || isListening) && (
              <>
                <Sparkles className="h-3 w-3 text-blue-400" />
                <span className="text-[11px] sm:text-xs">
                  {isDragging 
                    ? 'Drop files to attach' 
                    : 'Listening...'}
                </span>
              </>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {(speechError || permissionError) && (
              <span className="text-red-400 text-[10px]">{speechError || permissionError}</span>
            )}
            <span className="hidden md:inline text-[11px]">
              {attachedFiles.length > 0 && `${attachedFiles.length} file${attachedFiles.length > 1 ? 's' : ''} attached • `}
              Press Enter to send, Shift + Enter for new line
            </span>
          </div>
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
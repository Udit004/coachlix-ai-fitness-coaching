// app/ai-chat/FileUpload.jsx - File upload component for chat

"use client";
import React, { useRef, useState } from 'react';
import { Upload, X, FileText, Image as ImageIcon, Loader2 } from 'lucide-react';
import { uploadFile, validateFile, formatFileSize, getFileCategory } from '@/utils/fileUpload';
import { toast } from 'react-hot-toast';

/**
 * FileUpload Component
 * Handles file selection, validation, preview, and upload
 */
const FileUpload = ({ onFileUploaded, disabled = false }) => {
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  /**
   * Handle file selection
   */
  const handleFileSelect = async (event) => {
    const files = Array.from(event.target.files || []);
    
    if (files.length === 0) return;

    // Process each file
    for (const file of files) {
      await processFile(file);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  /**
   * Process and upload a single file
   */
  const processFile = async (file) => {
    // Validate file
    const validation = validateFile(file);
    if (!validation.valid) {
      toast.error(validation.error);
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // Upload file with progress tracking
      const result = await uploadFile(file, (progress) => {
        setUploadProgress(progress);
      });

      if (result.success) {
        toast.success(`${file.name} uploaded successfully!`);
        
        // Notify parent component
        if (onFileUploaded) {
          onFileUploaded(result.file);
        }
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Failed to upload file');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  /**
   * Trigger file input click
   */
  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="relative">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.pdf,.doc,.docx,.txt"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || uploading}
        multiple={false}
      />

      {/* Upload button */}
      <button
        onClick={handleButtonClick}
        disabled={disabled || uploading}
        className={`
          p-2 rounded-lg transition-all duration-200
          ${uploading 
            ? 'bg-blue-500/20 cursor-not-allowed' 
            : 'hover:bg-gray-700 active:scale-95'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        title="Upload image or document"
      >
        {uploading ? (
          <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
        ) : (
          <Upload className="w-5 h-5 text-gray-400 hover:text-blue-400 transition-colors" />
        )}
      </button>

      {/* Upload progress indicator */}
      {uploading && uploadProgress > 0 && (
        <div className="absolute bottom-full left-0 mb-2 w-32 bg-gray-800 rounded-lg p-2 shadow-lg">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-300">Uploading...</span>
            <span className="text-xs text-blue-400">{Math.round(uploadProgress)}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-1.5">
            <div
              className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * FilePreview Component
 * Displays uploaded file with preview and remove option
 */
export const FilePreview = ({ file, onRemove }) => {
  const isImage = file.category === 'image';

  return (
    <div className="relative inline-block group">
      <div className="bg-gray-800 rounded-lg p-2 pr-8 flex items-center gap-2 border border-gray-700">
        {/* File icon */}
        <div className={`
          w-10 h-10 rounded flex items-center justify-center flex-shrink-0
          ${isImage ? 'bg-blue-500/20' : 'bg-purple-500/20'}
        `}>
          {isImage ? (
            file.url ? (
              <img 
                src={file.url} 
                alt={file.name}
                className="w-full h-full object-cover rounded"
              />
            ) : (
              <ImageIcon className="w-5 h-5 text-blue-400" />
            )
          ) : (
            <FileText className="w-5 h-5 text-purple-400" />
          )}
        </div>

        {/* File info */}
        <div className="flex flex-col min-w-0">
          <span className="text-sm text-gray-200 truncate max-w-[200px]">
            {file.name}
          </span>
          <span className="text-xs text-gray-500">
            {formatFileSize(file.size)}
          </span>
        </div>

        {/* Remove button */}
        {onRemove && (
          <button
            onClick={onRemove}
            className="absolute top-1 right-1 p-1 rounded-full bg-red-500/20 hover:bg-red-500/30 transition-colors"
            title="Remove file"
          >
            <X className="w-3 h-3 text-red-400" />
          </button>
        )}
      </div>
    </div>
  );
};

/**
 * AttachedFiles Component
 * Displays list of attached files in chat input area
 */
export const AttachedFiles = ({ files, onRemoveFile }) => {
  if (!files || files.length === 0) return null;

  return (
    <div className="px-4 py-2 border-t border-gray-700 bg-gray-800/50">
      <div className="flex flex-wrap gap-2">
        {files.map((file, index) => (
          <FilePreview
            key={file.timestamp || index}
            file={file}
            onRemove={() => onRemoveFile(index)}
          />
        ))}
      </div>
    </div>
  );
};

export default FileUpload;

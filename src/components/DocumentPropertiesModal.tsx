import React from 'react';
import {
  FileText,
  Calendar,
  User,
  Shield,
  Layers,
  FileCode,
  HardDrive,
  Hash,
  Type,
} from 'lucide-react';
import { PDFMetadata } from '../types';

interface DocumentPropertiesModalProps {
  metadata: PDFMetadata;
  fileName: string;
  onClose: () => void;
}

export const DocumentPropertiesModal: React.FC<DocumentPropertiesModalProps> = ({
  metadata,
  fileName,
  onClose,
}) => {
  const formatFileSize = (bytes: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 select-none">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <FileText size={16} className="text-blue-600" />
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Document Properties
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-xs text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-3.5 text-xs">
          <div className="flex justify-between items-center py-1 border-b border-zinc-100 dark:border-zinc-800/60">
            <span className="text-zinc-400">File Name</span>
            <span className="font-medium text-zinc-800 dark:text-zinc-200 truncate max-w-[200px]" title={fileName}>
              {fileName}
            </span>
          </div>

          <div className="flex justify-between items-center py-1 border-b border-zinc-100 dark:border-zinc-800/60">
            <span className="text-zinc-400">Title</span>
            <span className="font-medium text-zinc-800 dark:text-zinc-200">
              {metadata.title || 'Untitled'}
            </span>
          </div>

          <div className="flex justify-between items-center py-1 border-b border-zinc-100 dark:border-zinc-800/60">
            <span className="text-zinc-400">Author</span>
            <span className="font-medium text-zinc-800 dark:text-zinc-200">
              {metadata.author || 'Unknown'}
            </span>
          </div>

          <div className="flex justify-between items-center py-1 border-b border-zinc-100 dark:border-zinc-800/60">
            <span className="text-zinc-400">Total Pages</span>
            <span className="font-medium text-zinc-800 dark:text-zinc-200">
              {metadata.pageCount}
            </span>
          </div>

          <div className="flex justify-between items-center py-1 border-b border-zinc-100 dark:border-zinc-800/60">
            <span className="text-zinc-400">File Size</span>
            <span className="font-medium text-zinc-800 dark:text-zinc-200">
              {formatFileSize(metadata.fileSize)}
            </span>
          </div>

          <div className="flex justify-between items-center py-1 border-b border-zinc-100 dark:border-zinc-800/60">
            <span className="text-zinc-400">Word Count (est.)</span>
            <span className="font-medium text-zinc-800 dark:text-zinc-200">
              {metadata.wordCount?.toLocaleString() || 'Calculating...'}
            </span>
          </div>

          <div className="flex justify-between items-center py-1 border-b border-zinc-100 dark:border-zinc-800/60">
            <span className="text-zinc-400">Character Count</span>
            <span className="font-medium text-zinc-800 dark:text-zinc-200">
              {metadata.charCount?.toLocaleString() || 'Calculating...'}
            </span>
          </div>

          <div className="flex justify-between items-center py-1 border-b border-zinc-100 dark:border-zinc-800/60">
            <span className="text-zinc-400">Producer / Generator</span>
            <span className="font-medium text-zinc-800 dark:text-zinc-200">
              {metadata.producer || 'pdf-lib / standard engine'}
            </span>
          </div>

          {metadata.creationDate && (
            <div className="flex justify-between items-center py-1">
              <span className="text-zinc-400">Created Date</span>
              <span className="font-medium text-zinc-800 dark:text-zinc-200">
                {metadata.creationDate}
              </span>
            </div>
          )}
        </div>

        <div className="p-4 bg-zinc-50 dark:bg-zinc-800/40 border-t border-zinc-100 dark:border-zinc-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-medium rounded-lg hover:opacity-90 transition-opacity cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

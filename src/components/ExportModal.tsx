import React, { useState } from 'react';
import {
  Download,
  Image as ImageIcon,
  FileArchive,
  Lock,
  Layers,
  FileCheck,
  Minimize2,
} from 'lucide-react';

interface ExportModalProps {
  fileName: string;
  totalPages: number;
  currentPage: number;
  onSaveAnnotatedPDF: () => void;
  onExportImages: (format: 'png' | 'jpg') => void;
  onExportSinglePage: (page: number) => void;
  onExportAnnotationsJson: () => void;
  onCompressPDF: () => void;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  fileName,
  totalPages,
  currentPage,
  onSaveAnnotatedPDF,
  onExportImages,
  onExportSinglePage,
  onExportAnnotationsJson,
  onCompressPDF,
  onClose,
}) => {
  const [selectedPage, setSelectedPage] = useState(currentPage);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 select-none">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <Download size={16} className="text-blue-600" />
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Export & Save Document
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-xs text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-4 text-xs">
          {/* Main Save Option */}
          <div
            onClick={onSaveAnnotatedPDF}
            className="flex items-center gap-3 p-3.5 rounded-xl border border-blue-200 dark:border-blue-900/50 bg-blue-50/30 dark:bg-blue-950/20 hover:bg-blue-50/60 transition-colors cursor-pointer"
          >
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white">
              <Download size={18} />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-zinc-900 dark:text-zinc-100">
                Save & Download Modified PDF
              </h4>
              <p className="text-[11px] text-zinc-500">
                Bake all vector annotations, highlights, drawings, and edits directly into the PDF.
              </p>
            </div>
          </div>

          {/* Compress & Optimize */}
          <div
            onClick={onCompressPDF}
            className="flex items-center gap-3 p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors cursor-pointer"
          >
            <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
              <Minimize2 size={18} />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-zinc-900 dark:text-zinc-100">
                Compress & Optimize PDF
              </h4>
              <p className="text-[11px] text-zinc-500">
                Reconstruct PDF streams to minimize filesize for web and email sharing.
              </p>
            </div>
          </div>

          {/* Export to Images */}
          <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-2">
            <div className="flex items-center gap-2">
              <ImageIcon size={16} className="text-purple-500" />
              <h4 className="font-semibold text-zinc-900 dark:text-zinc-100">
                Export Pages to Image
              </h4>
            </div>
            <p className="text-[11px] text-zinc-500">
              Download the current page or entire document as high-resolution raster images.
            </p>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => onExportImages('png')}
                className="flex-1 py-1.5 px-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 rounded-lg text-xs font-medium cursor-pointer"
              >
                Download as PNG
              </button>
              <button
                onClick={() => onExportImages('jpg')}
                className="flex-1 py-1.5 px-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 rounded-lg text-xs font-medium cursor-pointer"
              >
                Download as JPG
              </button>
            </div>
          </div>

          {/* Export annotations metadata */}
          <div
            onClick={onExportAnnotationsJson}
            className="flex items-center justify-between p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <FileCheck size={16} className="text-zinc-500" />
              <span className="font-medium text-zinc-800 dark:text-zinc-200">
                Export Annotations Layer (JSON)
              </span>
            </div>
            <span className="text-[11px] text-blue-600 dark:text-blue-400">Download</span>
          </div>
        </div>
      </div>
    </div>
  );
};

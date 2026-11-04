import React, { useState } from 'react';
import {
  RotateCw,
  RotateCcw,
  Copy,
  Trash2,
  Plus,
  ArrowRightLeft,
  Crop,
  Layers,
  Check,
  Download,
  Combine,
  Scissors,
} from 'lucide-react';

interface EditModalProps {
  currentPage: number;
  totalPages: number;
  onRotateCurrent: (delta: number) => void;
  onDeleteCurrent: () => void;
  onDuplicateCurrent: () => void;
  onAddBlankPage: () => void;
  onExtractPages: (rangeStr: string) => void;
  onMergePDFs: () => void;
  onSplitPDF: () => void;
  onCropPage: (margins: { top: number; bottom: number; left: number; right: number }) => void;
  onReorderPages: (fromPage: number, toPage: number) => void;
  onClose: () => void;
}

export const EditModal: React.FC<EditModalProps> = ({
  currentPage,
  totalPages,
  onRotateCurrent,
  onDeleteCurrent,
  onDuplicateCurrent,
  onAddBlankPage,
  onExtractPages,
  onMergePDFs,
  onSplitPDF,
  onCropPage,
  onReorderPages,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'page' | 'document' | 'crop' | 'reorder'>('page');
  const [extractRange, setExtractRange] = useState(`${currentPage}`);
  const [moveFrom, setMoveFrom] = useState(currentPage);
  const [moveTo, setMoveTo] = useState(currentPage < totalPages ? currentPage + 1 : 1);
  const [cropMargins, setCropMargins] = useState({ top: 5, bottom: 5, left: 5, right: 5 });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header Tabs */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('page')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                activeTab === 'page'
                  ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100'
                  : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
            >
              Current Page ({currentPage})
            </button>
            <button
              onClick={() => setActiveTab('document')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                activeTab === 'document'
                  ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100'
                  : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
            >
              Document Ops
            </button>
            <button
              onClick={() => setActiveTab('reorder')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                activeTab === 'reorder'
                  ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100'
                  : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
            >
              Reorder
            </button>
            <button
              onClick={() => setActiveTab('crop')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                activeTab === 'crop'
                  ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100'
                  : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
            >
              Crop
            </button>
          </div>
          <button
            onClick={onClose}
            className="text-xs text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'page' && (
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => onRotateCurrent(90)}
                className="flex items-center gap-2.5 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 text-xs font-medium transition-colors cursor-pointer"
              >
                <RotateCw size={16} className="text-blue-500" />
                <span>Rotate +90°</span>
              </button>
              <button
                onClick={() => onRotateCurrent(-90)}
                className="flex items-center gap-2.5 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 text-xs font-medium transition-colors cursor-pointer"
              >
                <RotateCcw size={16} className="text-blue-500" />
                <span>Rotate -90°</span>
              </button>
              <button
                onClick={onDuplicateCurrent}
                className="flex items-center gap-2.5 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 text-xs font-medium transition-colors cursor-pointer"
              >
                <Copy size={16} className="text-emerald-500" />
                <span>Duplicate Page</span>
              </button>
              <button
                onClick={onAddBlankPage}
                className="flex items-center gap-2.5 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 text-xs font-medium transition-colors cursor-pointer"
              >
                <Plus size={16} className="text-indigo-500" />
                <span>Add Blank Page</span>
              </button>
              <button
                onClick={onDeleteCurrent}
                disabled={totalPages <= 1}
                className="col-span-2 flex items-center justify-center gap-2.5 p-3 rounded-xl border border-red-200 dark:border-red-900/40 hover:bg-red-50 dark:hover:bg-red-950/20 text-xs font-medium text-red-600 transition-colors disabled:opacity-40 cursor-pointer"
              >
                <Trash2 size={16} />
                <span>Delete Page {currentPage}</span>
              </button>
            </div>
          )}

          {activeTab === 'document' && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 block mb-1.5">
                  Extract Pages (e.g. 1, 2-4)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={extractRange}
                    onChange={(e) => setExtractRange(e.target.value)}
                    placeholder="1, 2-3"
                    className="flex-1 text-xs px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <button
                    onClick={() => onExtractPages(extractRange)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer"
                  >
                    <Download size={14} />
                    <span>Extract</span>
                  </button>
                </div>
              </div>

              <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 grid grid-cols-2 gap-3">
                <button
                  onClick={onMergePDFs}
                  className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 text-xs font-medium transition-colors cursor-pointer"
                >
                  <Combine size={20} className="text-blue-500" />
                  <span>Merge Another PDF</span>
                </button>
                <button
                  onClick={onSplitPDF}
                  className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 text-xs font-medium transition-colors cursor-pointer"
                >
                  <Scissors size={20} className="text-purple-500" />
                  <span>Split All to ZIP</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'reorder' && (
            <div className="space-y-4">
              <p className="text-xs text-zinc-500">
                Move page position within the document structure:
              </p>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <label className="text-[11px] text-zinc-400 block mb-1">From Page</label>
                  <input
                    type="number"
                    min={1}
                    max={totalPages}
                    value={moveFrom}
                    onChange={(e) => setMoveFrom(parseInt(e.target.value) || 1)}
                    className="w-full text-xs px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700"
                  />
                </div>
                <ArrowRightLeft size={16} className="text-zinc-400 mt-5" />
                <div className="flex-1">
                  <label className="text-[11px] text-zinc-400 block mb-1">To Position</label>
                  <input
                    type="number"
                    min={1}
                    max={totalPages}
                    value={moveTo}
                    onChange={(e) => setMoveTo(parseInt(e.target.value) || 1)}
                    className="w-full text-xs px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700"
                  />
                </div>
              </div>
              <button
                onClick={() => onReorderPages(moveFrom, moveTo)}
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-colors cursor-pointer"
              >
                Apply Reorder
              </button>
            </div>
          )}

          {activeTab === 'crop' && (
            <div className="space-y-4">
              <p className="text-xs text-zinc-500">
                Trim margins on page {currentPage} (percentage %):
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-zinc-400">Top %:</span>
                  <input
                    type="number"
                    min={0}
                    max={40}
                    value={cropMargins.top}
                    onChange={(e) =>
                      setCropMargins({ ...cropMargins, top: parseInt(e.target.value) || 0 })
                    }
                    className="w-full mt-1 px-2.5 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700"
                  />
                </div>
                <div>
                  <span className="text-zinc-400">Bottom %:</span>
                  <input
                    type="number"
                    min={0}
                    max={40}
                    value={cropMargins.bottom}
                    onChange={(e) =>
                      setCropMargins({ ...cropMargins, bottom: parseInt(e.target.value) || 0 })
                    }
                    className="w-full mt-1 px-2.5 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700"
                  />
                </div>
                <div>
                  <span className="text-zinc-400">Left %:</span>
                  <input
                    type="number"
                    min={0}
                    max={40}
                    value={cropMargins.left}
                    onChange={(e) =>
                      setCropMargins({ ...cropMargins, left: parseInt(e.target.value) || 0 })
                    }
                    className="w-full mt-1 px-2.5 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700"
                  />
                </div>
                <div>
                  <span className="text-zinc-400">Right %:</span>
                  <input
                    type="number"
                    min={0}
                    max={40}
                    value={cropMargins.right}
                    onChange={(e) =>
                      setCropMargins({ ...cropMargins, right: parseInt(e.target.value) || 0 })
                    }
                    className="w-full mt-1 px-2.5 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700"
                  />
                </div>
              </div>
              <button
                onClick={() =>
                  onCropPage({
                    top: cropMargins.top / 100,
                    bottom: cropMargins.bottom / 100,
                    left: cropMargins.left / 100,
                    right: cropMargins.right / 100,
                  })
                }
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-colors cursor-pointer"
              >
                Apply Crop to Page {currentPage}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

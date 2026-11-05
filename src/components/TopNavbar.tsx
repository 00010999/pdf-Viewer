import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Columns,
  Square,
  Scroll,
  RotateCw,
  Search,
  Sliders,
  Info,
  Download,
  Share2,
  Printer,
  Edit3,
  Layers,
  ArrowLeft,
  Lock,
  Sun,
  Moon,
} from 'lucide-react';
import { ViewMode, ZoomPreset } from '../types';

interface TopNavbarProps {
  fileName: string;
  currentPage: number;
  totalPages: number;
  onGoToPage: (page: number) => void;
  scale: number;
  zoomPreset: ZoomPreset;
  onSetZoom: (zoom: ZoomPreset) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  viewMode: ViewMode;
  onChangeViewMode: (mode: ViewMode) => void;
  onToggleSidebar: () => void;
  onToggleSearch: () => void;
  onRotateDocument: () => void;
  onOpenEditModal: () => void;
  onOpenProperties: () => void;
  onOpenSettings: () => void;
  onExportPDF: () => void;
  onPrintPDF: () => void;
  onBackToDashboard: () => void;
  onToggleFullScreen: () => void;
  isReadingMode: boolean;
  onToggleReadingMode: () => void;
  showAnnotationBar: boolean;
  onToggleAnnotationBar: () => void;
  theme?: string;
  onToggleTheme?: () => void;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({
  fileName,
  currentPage,
  totalPages,
  onGoToPage,
  scale,
  zoomPreset,
  onSetZoom,
  onZoomIn,
  onZoomOut,
  viewMode,
  onChangeViewMode,
  onToggleSidebar,
  onToggleSearch,
  onRotateDocument,
  onOpenEditModal,
  onOpenProperties,
  onOpenSettings,
  onExportPDF,
  onPrintPDF,
  onBackToDashboard,
  onToggleFullScreen,
  isReadingMode,
  onToggleReadingMode,
  showAnnotationBar,
  onToggleAnnotationBar,
  theme,
  onToggleTheme,
}) => {
  return (
    <header className="h-12 border-b border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 px-3 flex items-center justify-between select-none z-30">
      {/* Left: Back button & Document Title */}
      <div className="flex items-center gap-2 max-w-[260px] md:max-w-xs truncate">
        <button
          onClick={onBackToDashboard}
          title="Back to Dashboard"
          className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
        >
          <ArrowLeft size={16} />
        </button>

        <button
          onClick={onToggleSidebar}
          title="Toggle Navigation Sidebar"
          className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
        >
          <Layers size={16} />
        </button>

        <span
          className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate cursor-pointer hover:underline"
          title={fileName}
          onClick={onOpenProperties}
        >
          {fileName}
        </span>
      </div>

      {/* Middle: Page navigation & Zoom controls */}
      <div className="flex items-center gap-1 sm:gap-2">
        {/* Page Nav */}
        <div className="flex items-center gap-0.5 sm:gap-1 bg-zinc-100 dark:bg-zinc-800/80 rounded-lg px-1.5 sm:px-2 py-1">
          <button
            onClick={() => onGoToPage(currentPage - 1)}
            disabled={currentPage <= 1}
            title="Previous Page (Left Arrow)"
            className="p-0.5 rounded text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 disabled:opacity-30 cursor-pointer"
          >
            <ChevronLeft size={15} />
          </button>

          <div className="flex items-center text-xs">
            <input
              type="number"
              min={1}
              max={totalPages}
              value={currentPage}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                if (val >= 1 && val <= totalPages) {
                  onGoToPage(val);
                }
              }}
              className="w-7 sm:w-8 text-center bg-transparent focus:outline-none font-medium text-zinc-800 dark:text-zinc-200"
            />
            <span className="text-zinc-400">/ {totalPages}</span>
          </div>

          <button
            onClick={() => onGoToPage(currentPage + 1)}
            disabled={currentPage >= totalPages}
            title="Next Page (Right Arrow)"
            className="p-0.5 rounded text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 disabled:opacity-30 cursor-pointer"
          >
            <ChevronRight size={15} />
          </button>
        </div>

        <div className="w-[1px] h-4 bg-zinc-200 dark:bg-zinc-800 mx-1 hidden sm:block" />

        {/* Zoom controls */}
        <div className="hidden sm:flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800/80 rounded-lg px-1.5 py-1">
          <button
            onClick={onZoomOut}
            title="Zoom Out (-)"
            className="p-0.5 rounded text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 cursor-pointer"
          >
            <ZoomOut size={15} />
          </button>

          <select
            value={typeof zoomPreset === 'string' ? zoomPreset : `${Math.round(scale * 100)}%`}
            onChange={(e) => {
              const val = e.target.value;
              if (val === 'fit-width' || val === 'fit-page' || val === 'actual') {
                onSetZoom(val);
              } else {
                onSetZoom(parseFloat(val) / 100);
              }
            }}
            className="text-xs bg-transparent text-zinc-800 dark:text-zinc-200 font-medium px-1 focus:outline-none cursor-pointer"
          >
            <option value="fit-width">Fit Width</option>
            <option value="fit-page">Fit Page</option>
            <option value="actual">100%</option>
            <option value="50%">50%</option>
            <option value="75%">75%</option>
            <option value="125%">125%</option>
            <option value="150%">150%</option>
            <option value="200%">200%</option>
          </select>

          <button
            onClick={onZoomIn}
            title="Zoom In (+)"
            className="p-0.5 rounded text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 cursor-pointer"
          >
            <ZoomIn size={15} />
          </button>
        </div>

        {/* View Mode */}
        <div className="hidden lg:flex items-center gap-0.5 bg-zinc-100 dark:bg-zinc-800/80 rounded-lg p-0.5">
          <button
            onClick={() => onChangeViewMode('continuous')}
            title="Continuous Vertical Scroll"
            className={`p-1 rounded transition-colors cursor-pointer ${
              viewMode === 'continuous'
                ? 'bg-white dark:bg-zinc-700 shadow-2xs text-blue-600 dark:text-blue-400'
                : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            <Scroll size={14} />
          </button>
          <button
            onClick={() => onChangeViewMode('single')}
            title="Single Page View"
            className={`p-1 rounded transition-colors cursor-pointer ${
              viewMode === 'single'
                ? 'bg-white dark:bg-zinc-700 shadow-2xs text-blue-600 dark:text-blue-400'
                : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            <Square size={14} />
          </button>
          <button
            onClick={() => onChangeViewMode('spread')}
            title="Two-Page Spread"
            className={`p-1 rounded transition-colors cursor-pointer ${
              viewMode === 'spread'
                ? 'bg-white dark:bg-zinc-700 shadow-2xs text-blue-600 dark:text-blue-400'
                : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            <Columns size={14} />
          </button>
        </div>
      </div>

      {/* Right: Actions, Edit Tools, Print, Save, Fullscreen */}
      <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
        <button
          onClick={onToggleSearch}
          title="Search Document (Ctrl+F)"
          className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
        >
          <Search size={15} />
        </button>

        <button
          onClick={onRotateDocument}
          title="Rotate Pages Clockwise"
          className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer hidden sm:block"
        >
          <RotateCw size={15} />
        </button>

        <button
          onClick={onToggleAnnotationBar}
          title={showAnnotationBar ? "Hide Annotation Toolbar" : "Show Annotation Toolbar"}
          className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
            showAnnotationBar
              ? 'bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/50'
              : 'bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300'
          }`}
        >
          <Edit3 size={13} className={showAnnotationBar ? 'text-blue-600' : 'text-zinc-500'} />
          <span className="hidden sm:inline">{showAnnotationBar ? 'Annotate: On' : 'Annotate: Off'}</span>
        </button>

        <button
          onClick={onOpenEditModal}
          title="Edit & Organize Pages (Split, Merge, Reorder, Delete)"
          className="flex items-center gap-1 px-2 py-1 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg text-xs font-medium text-zinc-800 dark:text-zinc-200 transition-colors cursor-pointer hidden md:flex"
        >
          <Layers size={13} className="text-purple-500" />
          <span>Pages</span>
        </button>

        <button
          onClick={onPrintPDF}
          title="Print Document"
          className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer hidden lg:block"
        >
          <Printer size={15} />
        </button>

        <button
          onClick={onExportPDF}
          title="Export / Download with Annotations"
          className="flex items-center gap-1 px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-colors shadow-2xs cursor-pointer"
        >
          <Download size={13} />
          <span className="hidden sm:inline">Save</span>
        </button>

        <div className="w-[1px] h-4 bg-zinc-200 dark:bg-zinc-800 mx-1 hidden sm:block" />

        <button
          onClick={onToggleFullScreen}
          title="Full Screen / Presentation Mode"
          className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer hidden md:block"
        >
          <Maximize2 size={15} />
        </button>

        <button
          onClick={onOpenSettings}
          title="Preferences"
          className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
        >
          <Sliders size={15} />
        </button>

        {onToggleTheme && (
          <button
            onClick={onToggleTheme}
            title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
            className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          </button>
        )}
      </div>
    </header>
  );
};

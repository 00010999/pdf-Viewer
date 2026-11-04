import React from 'react';
import {
  MousePointer,
  Hand,
  Highlighter,
  Underline,
  Strikethrough,
  Type,
  StickyNote,
  Pen,
  Pencil,
  Eraser,
  Square,
  Circle,
  ArrowUpRight,
  Minus,
  Image as ImageIcon,
  RotateCcw,
  RotateCw,
  Trash2,
} from 'lucide-react';
import { ToolMode } from '../types';

interface AnnotationToolbarProps {
  activeTool: ToolMode;
  onSelectTool: (tool: ToolMode) => void;
  toolColor: string;
  onChangeColor: (color: string) => void;
  toolThickness: number;
  onChangeThickness: (thickness: number) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onClearAnnotations: () => void;
  onInsertImage: () => void;
}

const COLORS = [
  '#2563eb', // Blue
  '#dc2626', // Red
  '#16a34a', // Green
  '#eab308', // Yellow
  '#9333ea', // Purple
  '#09090b', // Black
];

export const AnnotationToolbar: React.FC<AnnotationToolbarProps> = ({
  activeTool,
  onSelectTool,
  toolColor,
  onChangeColor,
  toolThickness,
  onChangeThickness,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onClearAnnotations,
  onInsertImage,
}) => {
  return (
    <div className="flex items-center gap-1 px-3 py-1.5 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border border-zinc-200/80 dark:border-zinc-800 rounded-xl shadow-xs select-none">
      {/* Selection & Pan */}
      <button
        onClick={() => onSelectTool('select')}
        title="Selection Tool (V)"
        className={`p-1.5 rounded-lg transition-colors ${
          activeTool === 'select'
            ? 'bg-zinc-100 dark:bg-zinc-800 text-blue-600 dark:text-blue-400 font-medium'
            : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
        }`}
      >
        <MousePointer size={16} />
      </button>
      <button
        onClick={() => onSelectTool('hand')}
        title="Hand Pan Tool (H)"
        className={`p-1.5 rounded-lg transition-colors ${
          activeTool === 'hand'
            ? 'bg-zinc-100 dark:bg-zinc-800 text-blue-600 dark:text-blue-400'
            : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
        }`}
      >
        <Hand size={16} />
      </button>

      <div className="w-[1px] h-4 bg-zinc-200 dark:bg-zinc-800 mx-1" />

      {/* Text Markups */}
      <button
        onClick={() => onSelectTool('highlight')}
        title="Highlight (Shift+H)"
        className={`p-1.5 rounded-lg transition-colors ${
          activeTool === 'highlight'
            ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400'
            : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
        }`}
      >
        <Highlighter size={16} />
      </button>
      <button
        onClick={() => onSelectTool('underline')}
        title="Underline (U)"
        className={`p-1.5 rounded-lg transition-colors ${
          activeTool === 'underline'
            ? 'bg-zinc-100 dark:bg-zinc-800 text-blue-600'
            : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
        }`}
      >
        <Underline size={16} />
      </button>
      <button
        onClick={() => onSelectTool('strikethrough')}
        title="Strikethrough (S)"
        className={`p-1.5 rounded-lg transition-colors ${
          activeTool === 'strikethrough'
            ? 'bg-zinc-100 dark:bg-zinc-800 text-blue-600'
            : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
        }`}
      >
        <Strikethrough size={16} />
      </button>

      <div className="w-[1px] h-4 bg-zinc-200 dark:bg-zinc-800 mx-1" />

      {/* Freehand Draw */}
      <button
        onClick={() => onSelectTool('pen')}
        title="Pen Tool (P)"
        className={`p-1.5 rounded-lg transition-colors ${
          activeTool === 'pen'
            ? 'bg-zinc-100 dark:bg-zinc-800 text-blue-600'
            : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
        }`}
      >
        <Pen size={16} />
      </button>
      <button
        onClick={() => onSelectTool('pencil')}
        title="Pencil Tool"
        className={`p-1.5 rounded-lg transition-colors ${
          activeTool === 'pencil'
            ? 'bg-zinc-100 dark:bg-zinc-800 text-blue-600'
            : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
        }`}
      >
        <Pencil size={16} />
      </button>
      <button
        onClick={() => onSelectTool('eraser')}
        title="Eraser (E)"
        className={`p-1.5 rounded-lg transition-colors ${
          activeTool === 'eraser'
            ? 'bg-red-50 dark:bg-red-950/40 text-red-600'
            : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
        }`}
      >
        <Eraser size={16} />
      </button>

      <div className="w-[1px] h-4 bg-zinc-200 dark:bg-zinc-800 mx-1" />

      {/* Shapes & Boxes */}
      <button
        onClick={() => onSelectTool('rect')}
        title="Rectangle (R)"
        className={`p-1.5 rounded-lg transition-colors ${
          activeTool === 'rect'
            ? 'bg-zinc-100 dark:bg-zinc-800 text-blue-600'
            : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
        }`}
      >
        <Square size={16} />
      </button>
      <button
        onClick={() => onSelectTool('circle')}
        title="Circle (C)"
        className={`p-1.5 rounded-lg transition-colors ${
          activeTool === 'circle'
            ? 'bg-zinc-100 dark:bg-zinc-800 text-blue-600'
            : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
        }`}
      >
        <Circle size={16} />
      </button>
      <button
        onClick={() => onSelectTool('line')}
        title="Line (L)"
        className={`p-1.5 rounded-lg transition-colors ${
          activeTool === 'line'
            ? 'bg-zinc-100 dark:bg-zinc-800 text-blue-600'
            : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
        }`}
      >
        <Minus size={16} />
      </button>
      <button
        onClick={() => onSelectTool('arrow')}
        title="Arrow (A)"
        className={`p-1.5 rounded-lg transition-colors ${
          activeTool === 'arrow'
            ? 'bg-zinc-100 dark:bg-zinc-800 text-blue-600'
            : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
        }`}
      >
        <ArrowUpRight size={16} />
      </button>

      <div className="w-[1px] h-4 bg-zinc-200 dark:bg-zinc-800 mx-1" />

      {/* Text & Sticky Notes */}
      <button
        onClick={() => onSelectTool('text')}
        title="Insert Text (T)"
        className={`p-1.5 rounded-lg transition-colors ${
          activeTool === 'text'
            ? 'bg-zinc-100 dark:bg-zinc-800 text-blue-600'
            : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
        }`}
      >
        <Type size={16} />
      </button>
      <button
        onClick={() => onSelectTool('note')}
        title="Sticky Note (N)"
        className={`p-1.5 rounded-lg transition-colors ${
          activeTool === 'note'
            ? 'bg-yellow-100 dark:bg-yellow-950/40 text-yellow-600'
            : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
        }`}
      >
        <StickyNote size={16} />
      </button>
      <button
        onClick={onInsertImage}
        title="Insert Image (I)"
        className="p-1.5 rounded-lg transition-colors text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
      >
        <ImageIcon size={16} />
      </button>

      <div className="w-[1px] h-4 bg-zinc-200 dark:bg-zinc-800 mx-1" />

      {/* Color Swatches */}
      <div className="flex items-center gap-1 px-1">
        {COLORS.map((c) => (
          <button
            key={c}
            onClick={() => onChangeColor(c)}
            className={`w-4 h-4 rounded-full transition-transform ${
              toolColor === c ? 'scale-125 ring-2 ring-blue-500/50' : 'hover:scale-110 opacity-80'
            }`}
            style={{ backgroundColor: c }}
          />
        ))}
      </div>

      <div className="w-[1px] h-4 bg-zinc-200 dark:bg-zinc-800 mx-1" />

      {/* Stroke Thickness */}
      <div className="flex items-center gap-1.5 px-1">
        {[2, 4, 6].map((th) => (
          <button
            key={th}
            onClick={() => onChangeThickness(th)}
            className={`w-5 h-5 flex items-center justify-center rounded transition-colors ${
              toolThickness === th ? 'bg-zinc-200 dark:bg-zinc-700' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            <div
              className="bg-zinc-700 dark:bg-zinc-300 rounded-full"
              style={{ width: th + 1, height: th + 1 }}
            />
          </button>
        ))}
      </div>

      <div className="w-[1px] h-4 bg-zinc-200 dark:bg-zinc-800 mx-1" />

      {/* Undo & Redo */}
      <button
        onClick={onUndo}
        disabled={!canUndo}
        title="Undo (Ctrl+Z)"
        className="p-1.5 rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:pointer-events-none"
      >
        <RotateCcw size={15} />
      </button>
      <button
        onClick={onRedo}
        disabled={!canRedo}
        title="Redo (Ctrl+Y)"
        className="p-1.5 rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:pointer-events-none"
      >
        <RotateCw size={15} />
      </button>
      <button
        onClick={onClearAnnotations}
        title="Clear page annotations"
        className="p-1.5 rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600"
      >
        <Trash2 size={15} />
      </button>
    </div>
  );
};

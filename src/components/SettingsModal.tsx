import React from 'react';
import {
  Sun,
  Moon,
  Laptop,
  Sliders,
  Keyboard,
  Shield,
  Trash2,
} from 'lucide-react';
import { AppSettings } from '../types';

interface SettingsModalProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  onClearRecentHistory: () => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onUpdateSettings,
  onClearRecentHistory,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 select-none">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <Sliders size={16} className="text-blue-600" />
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Preferences & Settings
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-xs text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-5 text-xs max-h-[80vh] overflow-y-auto">
          {/* Appearance */}
          <div>
            <label className="text-xs font-medium text-zinc-900 dark:text-zinc-100 block mb-2">
              Theme / Appearance
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => onUpdateSettings({ theme: 'light' })}
                className={`flex items-center justify-center gap-2 py-2 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                  settings.theme === 'light'
                    ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/20 text-blue-600'
                    : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'
                }`}
              >
                <Sun size={14} />
                <span>Light</span>
              </button>
              <button
                onClick={() => onUpdateSettings({ theme: 'dark' })}
                className={`flex items-center justify-center gap-2 py-2 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                  settings.theme === 'dark'
                    ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/20 text-blue-600'
                    : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'
                }`}
              >
                <Moon size={14} />
                <span>Dark</span>
              </button>
              <button
                onClick={() => onUpdateSettings({ theme: 'system' })}
                className={`flex items-center justify-center gap-2 py-2 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                  settings.theme === 'system'
                    ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/20 text-blue-600'
                    : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'
                }`}
              >
                <Laptop size={14} />
                <span>System</span>
              </button>
            </div>
          </div>

          {/* Default Zoom & View */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-zinc-900 dark:text-zinc-100 block mb-1.5">
                Default View Mode
              </label>
              <select
                value={settings.defaultViewMode}
                onChange={(e) => onUpdateSettings({ defaultViewMode: e.target.value as any })}
                className="w-full text-xs px-2.5 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700"
              >
                <option value="continuous">Continuous Scroll</option>
                <option value="single">Single Page</option>
                <option value="spread">Two-Page Spread</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-zinc-900 dark:text-zinc-100 block mb-1.5">
                Default Zoom
              </label>
              <select
                value={typeof settings.defaultZoom === 'string' ? settings.defaultZoom : '1.0'}
                onChange={(e) =>
                  onUpdateSettings({
                    defaultZoom:
                      e.target.value === 'fit-width' || e.target.value === 'fit-page'
                        ? (e.target.value as any)
                        : parseFloat(e.target.value),
                  })
                }
                className="w-full text-xs px-2.5 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700"
              >
                <option value="fit-width">Fit to Width</option>
                <option value="fit-page">Fit to Page</option>
                <option value="1">100% Actual Size</option>
                <option value="1.25">125%</option>
                <option value="1.5">150%</option>
              </select>
            </div>
          </div>

          {/* Behavior Toggles */}
          <div className="space-y-3 pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-zinc-700 dark:text-zinc-300">
                Remember last reading position
              </span>
              <input
                type="checkbox"
                checked={settings.rememberLastPosition}
                onChange={(e) => onUpdateSettings({ rememberLastPosition: e.target.checked })}
                className="rounded accent-blue-600"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-zinc-700 dark:text-zinc-300">
                Enable keyboard shortcuts (Z, P, H, V, Esc, etc.)
              </span>
              <input
                type="checkbox"
                checked={settings.enableKeyboardShortcuts}
                onChange={(e) => onUpdateSettings({ enableKeyboardShortcuts: e.target.checked })}
                className="rounded accent-blue-600"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-zinc-700 dark:text-zinc-300">
                Auto-save annotations locally in sessions
              </span>
              <input
                type="checkbox"
                checked={settings.autoSaveAnnotations}
                onChange={(e) => onUpdateSettings({ autoSaveAnnotations: e.target.checked })}
                className="rounded accent-blue-600"
              />
            </label>
          </div>

          {/* Keyboard Shortcuts Reference */}
          <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center gap-1.5 text-zinc-900 dark:text-zinc-100 font-medium mb-2">
              <Keyboard size={14} />
              <span>Keyboard Shortcuts Quick Reference</span>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] text-zinc-500">
              <div className="flex justify-between">
                <span>Next / Prev Page</span>
                <kbd className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 font-mono">
                  → / ←
                </kbd>
              </div>
              <div className="flex justify-between">
                <span>Zoom In / Out</span>
                <kbd className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 font-mono">
                  + / -
                </kbd>
              </div>
              <div className="flex justify-between">
                <span>Search Document</span>
                <kbd className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 font-mono">
                  Ctrl+F
                </kbd>
              </div>
              <div className="flex justify-between">
                <span>Undo / Redo</span>
                <kbd className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 font-mono">
                  Ctrl+Z / Y
                </kbd>
              </div>
              <div className="flex justify-between">
                <span>Full Screen</span>
                <kbd className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 font-mono">
                  F11
                </kbd>
              </div>
              <div className="flex justify-between">
                <span>Pen / Text / Eraser</span>
                <kbd className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 font-mono">
                  P / T / E
                </kbd>
              </div>
            </div>
          </div>

          {/* Danger Zone: Clear History */}
          <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
            <div>
              <p className="font-medium text-zinc-800 dark:text-zinc-200">Recent Documents History</p>
              <p className="text-[11px] text-zinc-400">Clear cached history and cached offline files</p>
            </div>
            <button
              onClick={onClearRecentHistory}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-900/40 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 text-xs font-medium cursor-pointer"
            >
              <Trash2 size={13} />
              <span>Clear History</span>
            </button>
          </div>
        </div>

        <div className="p-4 bg-zinc-50 dark:bg-zinc-800/40 border-t border-zinc-100 dark:border-zinc-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer"
          >
            Save & Close
          </button>
        </div>
      </div>
    </div>
  );
};

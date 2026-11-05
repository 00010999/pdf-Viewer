import React from 'react';
import {
  FileText,
  Clock,
  Star,
  Trash2,
  FolderOpen,
  Plus,
  BookOpen,
  ArrowRight,
  HardDrive,
  Sun,
  Moon,
  Sliders,
  Camera,
} from 'lucide-react';
import { RecentDocument } from '../types';

interface DashboardProps {
  recentDocs: RecentDocument[];
  onOpenDoc: (doc: RecentDocument) => void;
  onOpenFilePicker: () => void;
  onOpenSampleDoc: () => void;
  onOpenScanner?: () => void;
  onToggleFavorite: (id: string, e: React.MouseEvent) => void;
  onRemoveDoc: (id: string, e: React.MouseEvent) => void;
  activeFilter: 'all' | 'favorites';
  onChangeFilter: (f: 'all' | 'favorites') => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  theme?: string;
  onToggleTheme?: () => void;
  onOpenSettings?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  recentDocs,
  onOpenDoc,
  onOpenFilePicker,
  onOpenSampleDoc,
  onOpenScanner,
  onToggleFavorite,
  onRemoveDoc,
  activeFilter,
  onChangeFilter,
  searchQuery,
  onSearchChange,
  theme,
  onToggleTheme,
  onOpenSettings,
}) => {
  const filteredDocs = recentDocs.filter((doc) => {
    if (activeFilter === 'favorites' && !doc.isFavorite) return false;
    if (searchQuery.trim()) {
      return doc.name.toLowerCase().includes(searchQuery.toLowerCase().trim());
    }
    return true;
  });

  const formatFileSize = (bytes: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const formatDate = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return new Date(timestamp).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-zinc-50/50 dark:bg-zinc-950">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 border-b md:border-b-0 md:border-r border-zinc-200/80 dark:border-zinc-800/80 flex flex-col p-3 md:p-4 bg-white dark:bg-zinc-900/50">
        <div className="flex items-center justify-between md:justify-start gap-2.5 px-2 py-2 md:py-3 mb-2 md:mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs">
              <BookOpen size={18} />
            </div>
            <div>
              <h1 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                Modern PDF
              </h1>
              <p className="text-[11px] text-zinc-500">Universal Edition</p>
            </div>
          </div>
          <div className="md:hidden flex items-center gap-1.5">
            {onToggleTheme && (
              <button
                onClick={onToggleTheme}
                title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
                className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 bg-zinc-100 dark:bg-zinc-800 transition-colors cursor-pointer"
              >
                {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
              </button>
            )}
            {onOpenSettings && (
              <button
                onClick={onOpenSettings}
                title="Preferences"
                className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 bg-zinc-100 dark:bg-zinc-800 transition-colors cursor-pointer"
              >
                <Sliders size={15} />
              </button>
            )}
            {onOpenScanner && (
              <button
                onClick={onOpenScanner}
                title="Scan Document with Camera"
                className="flex items-center gap-1.5 py-1.5 px-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-lg text-xs font-medium shadow-xs cursor-pointer transition-colors"
              >
                <Camera size={14} />
                <span className="hidden sm:inline">Scan</span>
              </button>
            )}
            <button
              onClick={onOpenFilePicker}
              className="flex items-center gap-1.5 py-1.5 px-3 bg-blue-600 text-white rounded-lg text-xs font-medium shadow-xs"
            >
              <Plus size={14} />
              <span>Open PDF</span>
            </button>
          </div>
        </div>

        {/* Primary Action Button (Desktop) */}
        <div className="hidden md:flex flex-col gap-2 mb-6">
          <button
            onClick={onOpenFilePicker}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg text-xs font-medium shadow-xs transition-colors cursor-pointer"
          >
            <Plus size={15} />
            <span>Open PDF File</span>
          </button>
          {onOpenScanner && (
            <button
              onClick={onOpenScanner}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-emerald-50 hover:bg-emerald-100/80 active:bg-emerald-200/80 dark:bg-emerald-950/30 dark:hover:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/50 rounded-lg text-xs font-medium shadow-2xs transition-colors cursor-pointer"
            >
              <Camera size={15} />
              <span>Scan to PDF</span>
            </button>
          )}
        </div>

        {/* Quick Nav Categories */}
        <nav className="flex md:flex-col gap-1 overflow-x-auto">
          <button
            onClick={() => onChangeFilter('all')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-colors cursor-pointer ${
              activeFilter === 'all'
                ? 'bg-zinc-100 dark:bg-zinc-800/80 text-zinc-900 dark:text-zinc-100 font-medium'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100/60 dark:hover:bg-zinc-800/40'
            }`}
          >
            <Clock size={15} />
            <span>Recent Documents</span>
            <span className="ml-auto text-[10px] text-zinc-400">
              {recentDocs.length}
            </span>
          </button>

          <button
            onClick={() => onChangeFilter('favorites')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-colors cursor-pointer ${
              activeFilter === 'favorites'
                ? 'bg-zinc-100 dark:bg-zinc-800/80 text-zinc-900 dark:text-zinc-100 font-medium'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100/60 dark:hover:bg-zinc-800/40'
            }`}
          >
            <Star size={15} />
            <span>Starred Documents</span>
            <span className="ml-auto text-[10px] text-zinc-400">
              {recentDocs.filter((d) => d.isFavorite).length}
            </span>
          </button>
        </nav>

        {/* Local Storage Status & Actions */}
        <div className="mt-auto pt-3 border-t border-zinc-200/80 dark:border-zinc-800/80 flex items-center justify-between px-2 text-[11px] text-zinc-400">
          <div className="flex items-center gap-1.5">
            <HardDrive size={13} />
            <span>Local storage</span>
          </div>
          <div className="flex items-center gap-1">
            {onToggleTheme && (
              <button
                onClick={onToggleTheme}
                title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
                className="p-1 rounded-md text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
              </button>
            )}
            {onOpenSettings && (
              <button
                onClick={onOpenSettings}
                title="Preferences"
                className="p-1 rounded-md text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <Sliders size={14} />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col p-8 overflow-y-auto">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
              {activeFilter === 'favorites' ? 'Starred Documents' : 'Recent Documents'}
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Select a file or drop a new document to read, annotate and edit.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="text-xs px-3 py-2 w-56 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-2xs"
            />
            <button
              onClick={onOpenSampleDoc}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200/90 dark:border-zinc-800 transition-colors shadow-2xs cursor-pointer"
            >
              <BookOpen size={14} />
              <span>Sample Guide PDF</span>
            </button>
          </div>
        </header>

        {/* Drag and Drop Zone if empty or available */}
        {filteredDocs.length === 0 ? (
          <div
            onClick={onOpenFilePicker}
            className="flex-1 flex flex-col items-center justify-center p-12 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl bg-white/50 dark:bg-zinc-900/20 hover:bg-white dark:hover:bg-zinc-900/40 transition-colors cursor-pointer group"
          >
            <div className="w-14 h-14 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 dark:text-zinc-400 group-hover:scale-105 transition-transform mb-4">
              <FolderOpen size={24} />
            </div>
            <h3 className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
              Drag & Drop PDF files here
            </h3>
            <p className="text-xs text-zinc-400 mt-1 mb-4">
              or click anywhere to browse from your device
            </p>
            <span className="text-[11px] font-medium text-blue-600 dark:text-blue-400 flex items-center gap-1">
              Browse Files <ArrowRight size={12} />
            </span>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredDocs.map((doc) => (
              <div
                key={doc.id}
                onClick={() => onOpenDoc(doc)}
                className="group relative flex flex-col bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-xs transition-all cursor-pointer overflow-hidden"
              >
                {/* Thumbnail Preview Area */}
                <div className="h-40 bg-zinc-100 dark:bg-zinc-950 flex items-center justify-center overflow-hidden border-b border-zinc-100 dark:border-zinc-800/60 relative">
                  {doc.thumbnail ? (
                    <img
                      src={doc.thumbnail}
                      alt={doc.name}
                      className="w-full h-full object-cover object-top opacity-90 group-hover:opacity-100 transition-opacity"
                    />
                  ) : (
                    <FileText size={36} className="text-zinc-300 dark:text-zinc-700" />
                  )}

                  {/* Favorite button pill */}
                  <button
                    onClick={(e) => onToggleFavorite(doc.id, e)}
                    className="absolute top-2 right-2 p-1.5 rounded-md bg-white/80 dark:bg-zinc-800/80 backdrop-blur-xs text-zinc-400 hover:text-amber-500 transition-colors shadow-2xs"
                  >
                    <Star
                      size={14}
                      className={doc.isFavorite ? 'fill-amber-400 text-amber-500' : ''}
                    />
                  </button>

                  {/* Last read page indicator */}
                  <div className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded bg-black/60 text-[10px] text-white/90 backdrop-blur-xs">
                    Page {doc.lastPage} of {doc.totalPages}
                  </div>
                </div>

                {/* Details Footer */}
                <div className="p-3.5 flex flex-col gap-1">
                  <div className="flex items-start justify-between gap-2">
                    <h4
                      className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate"
                      title={doc.name}
                    >
                      {doc.name}
                    </h4>
                    <button
                      onClick={(e) => onRemoveDoc(doc.id, e)}
                      title="Remove from history"
                      className="opacity-0 group-hover:opacity-100 p-1 text-zinc-400 hover:text-red-500 rounded transition-opacity"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-zinc-400 mt-1">
                    <span>{formatFileSize(doc.size)}</span>
                    <span>{formatDate(doc.lastOpened)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

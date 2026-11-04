import React, { useState } from 'react';
import {
  X,
  Search,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  Bookmark,
  ListTree,
  FileText,
  StickyNote,
} from 'lucide-react';
import { DocumentOutlineItem, SearchMatch } from '../types';

interface SidebarPanelProps {
  totalPages: number;
  currentPage: number;
  onGoToPage: (page: number) => void;
  outline: DocumentOutlineItem[];
  bookmarks: number[];
  onToggleBookmark: (page: number) => void;
  notes: string;
  onUpdateNotes: (notes: string) => void;
  thumbnails: { [page: number]: string };
  searchMatches: SearchMatch[];
  searchIndex: number;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onNavigateSearch: (dir: 'next' | 'prev') => void;
  searchOptions: { caseSensitive: boolean; wholeWord: boolean };
  onUpdateSearchOptions: (opts: { caseSensitive: boolean; wholeWord: boolean }) => void;
  activeTab: 'thumbnails' | 'outline' | 'bookmarks' | 'search' | 'notes';
  onChangeTab: (tab: 'thumbnails' | 'outline' | 'bookmarks' | 'search' | 'notes') => void;
  onClose: () => void;
}

export const SidebarPanel: React.FC<SidebarPanelProps> = ({
  totalPages,
  currentPage,
  onGoToPage,
  outline,
  bookmarks,
  onToggleBookmark,
  notes,
  onUpdateNotes,
  thumbnails,
  searchMatches,
  searchIndex,
  searchQuery,
  onSearchChange,
  onNavigateSearch,
  searchOptions,
  onUpdateSearchOptions,
  activeTab,
  onChangeTab,
  onClose,
}) => {
  const [showSearchFilters, setShowSearchFilters] = useState(false);

  return (
    <div className="w-72 h-full border-r border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 flex flex-col select-none">
      {/* Top Tab Navigation */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-200/80 dark:border-zinc-800/80">
        <div className="flex items-center gap-1">
          <button
            onClick={() => onChangeTab('thumbnails')}
            title="Thumbnails"
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'thumbnails'
                ? 'bg-zinc-100 dark:bg-zinc-800 text-blue-600 font-medium'
                : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            <FileText size={15} />
          </button>
          <button
            onClick={() => onChangeTab('outline')}
            title="Document Outline"
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'outline'
                ? 'bg-zinc-100 dark:bg-zinc-800 text-blue-600 font-medium'
                : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            <ListTree size={15} />
          </button>
          <button
            onClick={() => onChangeTab('bookmarks')}
            title="Bookmarks"
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'bookmarks'
                ? 'bg-zinc-100 dark:bg-zinc-800 text-blue-600 font-medium'
                : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            <Bookmark size={15} />
          </button>
          <button
            onClick={() => onChangeTab('search')}
            title="Search Document"
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'search'
                ? 'bg-zinc-100 dark:bg-zinc-800 text-blue-600 font-medium'
                : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            <Search size={15} />
          </button>
          <button
            onClick={() => onChangeTab('notes')}
            title="Document Notes"
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'notes'
                ? 'bg-zinc-100 dark:bg-zinc-800 text-blue-600 font-medium'
                : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            <StickyNote size={15} />
          </button>
        </div>

        <button
          onClick={onClose}
          className="p-1 rounded-md text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
        >
          <X size={15} />
        </button>
      </div>

      {/* Tab Panels */}
      <div className="flex-1 overflow-y-auto p-3">
        {/* Thumbnails Tab */}
        {activeTab === 'thumbnails' && (
          <div className="space-y-3">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pNum) => (
              <div
                key={pNum}
                onClick={() => onGoToPage(pNum)}
                className={`group flex flex-col items-center p-2 rounded-xl transition-all cursor-pointer ${
                  currentPage === pNum
                    ? 'ring-2 ring-blue-500 bg-blue-50/20 dark:bg-blue-950/20'
                    : 'hover:bg-zinc-100/60 dark:hover:bg-zinc-800/40'
                }`}
              >
                <div className="w-full h-32 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center overflow-hidden border border-zinc-200 dark:border-zinc-700 shadow-2xs">
                  {thumbnails[pNum] ? (
                    <img
                      src={thumbnails[pNum]}
                      alt={`Page ${pNum}`}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <span className="text-xs text-zinc-400">Page {pNum}</span>
                  )}
                </div>
                <div className="flex items-center justify-between w-full mt-1.5 px-1">
                  <span className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                    {pNum}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleBookmark(pNum);
                    }}
                    className="p-1 text-zinc-400 hover:text-amber-500"
                  >
                    <Bookmark
                      size={12}
                      className={bookmarks.includes(pNum) ? 'fill-amber-400 text-amber-500' : ''}
                    />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Outline / Bookmarks in PDF Tab */}
        {activeTab === 'outline' && (
          <div>
            {outline.length === 0 ? (
              <div className="text-center py-8 text-xs text-zinc-400">
                No document outline or table of contents detected.
              </div>
            ) : (
              <div className="space-y-1">
                {outline.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => onGoToPage(item.pageIndex + 1)}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex items-center justify-between cursor-pointer"
                  >
                    <span className="truncate text-zinc-700 dark:text-zinc-300">
                      {item.title}
                    </span>
                    <span className="text-[10px] text-zinc-400 ml-2">
                      {item.pageIndex + 1}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* User Bookmarks Tab */}
        {activeTab === 'bookmarks' && (
          <div>
            <div className="flex items-center justify-between mb-3 px-1">
              <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Bookmarked Pages
              </span>
              <button
                onClick={() => onToggleBookmark(currentPage)}
                className="text-[11px] text-blue-600 dark:text-blue-400 font-medium hover:underline cursor-pointer"
              >
                {bookmarks.includes(currentPage) ? 'Remove Current' : '+ Bookmark Page ' + currentPage}
              </button>
            </div>

            {bookmarks.length === 0 ? (
              <p className="text-center py-8 text-xs text-zinc-400">
                No pages bookmarked yet. Click bookmark above or next to any page.
              </p>
            ) : (
              <div className="space-y-1.5">
                {bookmarks
                  .sort((a, b) => a - b)
                  .map((p) => (
                    <div
                      key={p}
                      onClick={() => onGoToPage(p)}
                      className="flex items-center justify-between p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/60 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer transition-colors"
                    >
                      <span className="text-xs font-medium text-zinc-800 dark:text-zinc-200">
                        Page {p}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleBookmark(p);
                        }}
                        className="text-zinc-400 hover:text-red-500 p-1"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* Search Tab */}
        {activeTab === 'search' && (
          <div className="space-y-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Search text in document..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                autoFocus
                className="w-full text-xs pl-8 pr-16 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <Search
                size={14}
                className="absolute left-2.5 top-2.5 text-zinc-400 pointer-events-none"
              />
              <div className="absolute right-1.5 top-1.5 flex items-center">
                <button
                  onClick={() => setShowSearchFilters(!showSearchFilters)}
                  title="Search options"
                  className={`p-1 rounded text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 ${
                    showSearchFilters ? 'text-blue-600' : ''
                  }`}
                >
                  <SlidersHorizontal size={13} />
                </button>
              </div>
            </div>

            {showSearchFilters && (
              <div className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200/60 dark:border-zinc-700 space-y-1.5 text-[11px]">
                <label className="flex items-center gap-2 cursor-pointer text-zinc-600 dark:text-zinc-400">
                  <input
                    type="checkbox"
                    checked={searchOptions.caseSensitive}
                    onChange={(e) =>
                      onUpdateSearchOptions({
                        ...searchOptions,
                        caseSensitive: e.target.checked,
                      })
                    }
                    className="rounded accent-blue-600"
                  />
                  <span>Match case sensitive</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-zinc-600 dark:text-zinc-400">
                  <input
                    type="checkbox"
                    checked={searchOptions.wholeWord}
                    onChange={(e) =>
                      onUpdateSearchOptions({
                        ...searchOptions,
                        wholeWord: e.target.checked,
                      })
                    }
                    className="rounded accent-blue-600"
                  />
                  <span>Match whole word only</span>
                </label>
              </div>
            )}

            {/* Results count & match navigators */}
            {searchQuery.trim() && (
              <div className="flex items-center justify-between px-1 text-xs text-zinc-500">
                <span>
                  {searchMatches.length} {searchMatches.length === 1 ? 'match' : 'matches'}
                  {searchMatches.length > 0 && ` (${searchIndex + 1}/${searchMatches.length})`}
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={() => onNavigateSearch('prev')}
                    disabled={searchMatches.length === 0}
                    className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30"
                  >
                    <ChevronUp size={14} />
                  </button>
                  <button
                    onClick={() => onNavigateSearch('next')}
                    disabled={searchMatches.length === 0}
                    className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30"
                  >
                    <ChevronDown size={14} />
                  </button>
                </div>
              </div>
            )}

            {/* Match list */}
            <div className="space-y-1">
              {searchMatches.map((m, idx) => (
                <div
                  key={idx}
                  onClick={() => onGoToPage(m.pageIndex + 1)}
                  className={`p-2 rounded-lg text-xs transition-colors cursor-pointer ${
                    searchIndex === idx
                      ? 'bg-amber-100/70 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 font-medium'
                      : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                  }`}
                >
                  <div className="flex justify-between items-center text-[10px] text-zinc-400 mb-0.5">
                    <span>Page {m.pageIndex + 1}</span>
                    <span>#{idx + 1}</span>
                  </div>
                  <p className="line-clamp-2 italic">"...{m.text}..."</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notes Tab */}
        {activeTab === 'notes' && (
          <div className="h-full flex flex-col">
            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              Personal Document Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => onUpdateNotes(e.target.value)}
              placeholder="Record summaries, key findings, and notes for this document..."
              className="flex-1 w-full text-xs p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
              rows={16}
            />
          </div>
        )}
      </div>
    </div>
  );
};

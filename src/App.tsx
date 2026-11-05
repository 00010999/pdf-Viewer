import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Annotation,
  AppSettings,
  DocumentOutlineItem,
  PDFMetadata,
  RecentDocument,
  SearchMatch,
  ToolMode,
  ViewMode,
  ZoomPreset,
} from './types';
import {
  loadPDFDocument,
  calculateDocumentStats,
  renderPageThumbnail,
  searchPDFDocument,
} from './services/pdfRenderService';
import {
  createSamplePDF,
  bakeAnnotationsIntoPDF,
  rotatePageInPDF,
  deletePageFromPDF,
  duplicatePageInPDF,
  addBlankPageToPDF,
  extractPagesFromPDF,
  mergePDFs,
  splitPDFToZip,
  cropPDFPages,
  compressPDF,
} from './services/pdfEditService';
import {
  loadRecentDocs,
  saveRecentDocs,
  loadSettings,
  saveSettings,
  storePDFData,
  getPDFData,
  toggleFavoriteDoc,
  removeRecentDoc,
  addOrUpdateRecentDoc,
} from './services/storageService';
import { saveOrExportPDF } from './services/fileSaveService';

import { Dashboard } from './components/Dashboard';
import { TopNavbar } from './components/TopNavbar';
import { SidebarPanel } from './components/SidebarPanel';
import { PDFPage } from './components/PDFPage';
import { AnnotationToolbar } from './components/AnnotationToolbar';
import { EditModal } from './components/EditModal';
import { DocumentPropertiesModal } from './components/DocumentPropertiesModal';
import { SettingsModal } from './components/SettingsModal';
import { ExportModal } from './components/ExportModal';
import { DocumentScannerModal } from './components/DocumentScannerModal';
import { Download } from 'lucide-react';

export function App() {
  // App views
  const [currentView, setCurrentView] = useState<'dashboard' | 'viewer'>('dashboard');

  // Document state
  const [currentDocId, setCurrentDocId] = useState<string>('');
  const [fileName, setFileName] = useState<string>('Sample Document.pdf');
  const [rawPdfBytes, setRawPdfBytes] = useState<Uint8Array | null>(null);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [documentRotation, setDocumentRotation] = useState<number>(0);
  const [metadata, setMetadata] = useState<PDFMetadata>({ pageCount: 1, fileSize: 0 });
  const [outline, setOutline] = useState<DocumentOutlineItem[]>([]);
  const [bookmarks, setBookmarks] = useState<number[]>([]);
  const [notes, setNotes] = useState<string>('');
  const [thumbnails, setThumbnails] = useState<{ [page: number]: string }>({});

  // Navigation & Zoom
  const [scale, setScale] = useState<number>(1.1);
  const [zoomPreset, setZoomPreset] = useState<ZoomPreset>('fit-width');
  const [viewMode, setViewMode] = useState<ViewMode>('continuous');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [isReadingMode, setIsReadingMode] = useState<boolean>(false);

  // Annotations & Tools
  const [showAnnotationBar, setShowAnnotationBar] = useState<boolean>(true);
  const [activeTool, setActiveTool] = useState<ToolMode>('select');
  const [toolColor, setToolColor] = useState<string>('#2563eb');
  const [toolThickness, setToolThickness] = useState<number>(2);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [undoStack, setUndoStack] = useState<Annotation[][]>([]);
  const [redoStack, setRedoStack] = useState<Annotation[][]>([]);

  // Search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchMatches, setSearchMatches] = useState<SearchMatch[]>([]);
  const [searchIndex, setSearchIndex] = useState<number>(0);
  const [searchOptions, setSearchOptions] = useState({ caseSensitive: false, wholeWord: false });
  const [activeSidebarTab, setActiveSidebarTab] = useState<'thumbnails' | 'outline' | 'bookmarks' | 'search' | 'notes'>('thumbnails');

  // Modals
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [showPropertiesModal, setShowPropertiesModal] = useState<boolean>(false);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [showExportModal, setShowExportModal] = useState<boolean>(false);
  const [showScannerModal, setShowScannerModal] = useState<boolean>(false);

  // Settings & Recent
  const [settings, setSettings] = useState<AppSettings>(loadSettings());
  const [recentDocs, setRecentDocs] = useState<RecentDocument[]>([]);
  const [dashboardSearch, setDashboardSearch] = useState<string>('');
  const [dashboardFilter, setDashboardFilter] = useState<'all' | 'favorites'>('all');

  // Loading state & file input
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const mergeInputRef = useRef<HTMLInputElement>(null);
  const viewerContainerRef = useRef<HTMLDivElement>(null);

  // Load PDF buffer into engine
  const handleLoadPDFBytes = useCallback(
    async (bytes: Uint8Array, name: string, docId?: string) => {
      console.log('handleLoadPDFBytes started for:', name, 'length:', bytes?.length);
      setIsLoading(true);
      try {
        const id = docId || `doc-${Date.now()}`;
        console.log('Step 1: Calling loadPDFDocument...');
        const loadRes = await loadPDFDocument(bytes);
        console.log('Step 2: loadPDFDocument returned, pages:', loadRes.totalPages);

        setRawPdfBytes(bytes);
        setPdfDoc(loadRes.pdfDoc);
        setTotalPages(loadRes.totalPages);
        setFileName(name);
        setCurrentDocId(id);
        setCurrentPage(1);
        setDocumentRotation(0);
        setMetadata(loadRes.metadata);
        setOutline(loadRes.outline);
        setAnnotations([]);
        setUndoStack([]);
        setRedoStack([]);

        console.log('Step 3: Storing in IndexedDB...');
        await storePDFData(id, bytes);

        console.log('Step 4: Generating thumbnail...');
        let thumbUrl = '';
        try {
          thumbUrl = await renderPageThumbnail(loadRes.pdfDoc, 1, 0.35);
        } catch (te) {
          console.warn('Thumbnail generation failed:', te);
        }

        console.log('Step 5: Adding to recent docs...');
        const updated = addOrUpdateRecentDoc({
          id,
          name,
          size: bytes.byteLength,
          lastPage: 1,
          totalPages: loadRes.totalPages,
          thumbnail: thumbUrl,
        });
        setRecentDocs(updated);

        const initialThumbs: { [p: number]: string } = {};
        if (thumbUrl) initialThumbs[1] = thumbUrl;
        setThumbnails(initialThumbs);

        console.log('Step 6: Calculating stats...');
        calculateDocumentStats(loadRes.pdfDoc).then((stats) => {
          setMetadata((prev) => ({
            ...prev,
            wordCount: stats.wordCount,
            charCount: stats.charCount,
          }));
        });

        console.log('Step 7: Switching view to viewer...');
        setCurrentView('viewer');
      } catch (err: any) {
        console.error('Failed to load PDF:', err?.stack || err);
        alert('Could not render this PDF document: ' + (err?.message || err));
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Load Initial Recent Docs
  useEffect(() => {
    setRecentDocs(loadRecentDocs());

    // Check if app was opened with a file (e.g. Right-click PDF -> Open with Modern PDF Viewer)
    if (window.electronAPI?.getInitialFile) {
      window.electronAPI.getInitialFile().then((file) => {
        if (file) {
          let uint8: Uint8Array;
          if (file.fileBase64) {
            const binaryString = atob(file.fileBase64);
            const len = binaryString.length;
            uint8 = new Uint8Array(len);
            for (let i = 0; i < len; i++) {
              uint8[i] = binaryString.charCodeAt(i);
            }
          } else if (file.fileBytes) {
            uint8 = new Uint8Array(file.fileBytes);
          } else {
            return;
          }
          handleLoadPDFBytes(uint8, file.fileName);
        }
      });
    }
  }, [handleLoadPDFBytes]);

  // Sync theme
  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;

    const applyTheme = () => {
      let isDark = false;
      if (settings.theme === 'dark') {
        isDark = true;
      } else if (settings.theme === 'light') {
        isDark = false;
      } else {
        isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      }

      if (isDark) {
        root.classList.add('dark');
        body.classList.add('dark');
      } else {
        root.classList.remove('dark');
        body.classList.remove('dark');
      }

      // Sync native window titlebar in Electron desktop app
      window.electronAPI?.setThemeSource?.(settings.theme);
    };

    applyTheme();
    saveSettings(settings);

    if (settings.theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = () => applyTheme();
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
  }, [settings]);

  const handleToggleTheme = () => {
    const isCurrentlyDark = document.documentElement.classList.contains('dark');
    const newTheme: 'light' | 'dark' = isCurrentlyDark ? 'light' : 'dark';
    setSettings((prev) => ({ ...prev, theme: newTheme }));
  };

  // Generate page thumbnails in background when doc is loaded
  useEffect(() => {
    if (!pdfDoc || currentView !== 'viewer') return;
    let isCancelled = false;

    async function loadAllThumbnails() {
      // Only generate thumbnails for the first 10 pages immediately to save CPU and memory on large documents
      const maxBatch = Math.min(totalPages, 12);
      for (let i = 1; i <= maxBatch; i++) {
        if (isCancelled) break;
        if (!thumbnails[i]) {
          try {
            const thumb = await renderPageThumbnail(pdfDoc, i, 0.22);
            if (!isCancelled) {
              setThumbnails((prev) => ({ ...prev, [i]: thumb }));
            }
          } catch {
            // ignore
          }
        }
      }
    }

    loadAllThumbnails();
    return () => {
      isCancelled = true;
    };
  }, [pdfDoc, totalPages, currentView]);

  // Search Engine query execution
  useEffect(() => {
    if (!pdfDoc || !searchQuery.trim()) {
      setSearchMatches([]);
      setSearchIndex(0);
      return;
    }

    let isCancelled = false;
    const timer = setTimeout(async () => {
      const matches = await searchPDFDocument(pdfDoc, searchQuery, searchOptions);
      if (!isCancelled) {
        setSearchMatches(matches);
        setSearchIndex(0);
        if (matches.length > 0) {
          setCurrentPage(matches[0].pageIndex + 1);
        }
      }
    }, 250);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [pdfDoc, searchQuery, searchOptions]);

  // Navigate Search Matches
  const handleNavigateSearch = (direction: 'next' | 'prev') => {
    if (searchMatches.length === 0) return;
    let nextIdx = direction === 'next' ? searchIndex + 1 : searchIndex - 1;
    if (nextIdx >= searchMatches.length) nextIdx = 0;
    if (nextIdx < 0) nextIdx = searchMatches.length - 1;
    setSearchIndex(nextIdx);
    setCurrentPage(searchMatches[nextIdx].pageIndex + 1);
  };

  // Open Sample PDF
  const handleOpenSample = async () => {
    const bytes = await createSamplePDF();
    handleLoadPDFBytes(bytes, 'Interactive Guide & Sample.pdf');
  };

  // Helper to convert base64 to Uint8Array efficiently
  const base64ToUint8Array = (base64: string): Uint8Array => {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  };

  // Open PDF from File Picker or Native Dialog
  const handleOpenFilePicker = async () => {
    if (window.electronAPI?.openPDFDialog) {
      try {
        const result = await window.electronAPI.openPDFDialog();
        if (result) {
          let uint8: Uint8Array;
          if (result.fileBase64) {
            uint8 = base64ToUint8Array(result.fileBase64);
          } else if (result.fileBytes) {
            uint8 = new Uint8Array(result.fileBytes);
          } else {
            return;
          }
          handleLoadPDFBytes(uint8, result.fileName);
        }
        return;
      } catch (e) {
        console.warn('Native dialog failed, falling back to browser picker', e);
      }
    }
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const arrayBuffer = await file.arrayBuffer();
    handleLoadPDFBytes(new Uint8Array(arrayBuffer), file.name);
    e.target.value = '';
  };

  // Open PDF from Dashboard recent list
  const handleOpenRecent = async (doc: RecentDocument) => {
    setIsLoading(true);
    const cachedData = await getPDFData(doc.id);
    if (cachedData) {
      await handleLoadPDFBytes(cachedData, doc.name, doc.id);
      if (settings.rememberLastPosition && doc.lastPage) {
        setCurrentPage(doc.lastPage);
      }
    } else {
      alert('File contents are no longer cached. Please browse and re-open the document.');
    }
    setIsLoading(false);
  };

  // Annotation undo/redo management
  const handleAddAnnotation = (ann: Annotation) => {
    setUndoStack((prev) => [...prev, annotations]);
    setRedoStack([]);
    setAnnotations((prev) => [...prev, ann]);
  };

  const handleDeleteAnnotation = (id: string) => {
    setUndoStack((prev) => [...prev, annotations]);
    setRedoStack([]);
    setAnnotations((prev) => prev.filter((a) => a.id !== id));
  };

  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const previous = undoStack[undoStack.length - 1];
    setRedoStack((prev) => [...prev, annotations]);
    setUndoStack((prev) => prev.slice(0, -1));
    setAnnotations(previous);
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setUndoStack((prev) => [...prev, annotations]);
    setRedoStack((prev) => prev.slice(0, -1));
    setAnnotations(next);
  };

  const handleClearAnnotations = () => {
    if (annotations.length === 0) return;
    if (confirm('Clear all annotations on this document?')) {
      setUndoStack((prev) => [...prev, annotations]);
      setAnnotations([]);
    }
  };

  // Insert image to PDF annotation
  const handleInsertImageTrigger = () => {
    imageInputRef.current?.click();
  };

  const handleImageFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      handleAddAnnotation({
        id: `ann-${Date.now()}`,
        pageIndex: currentPage - 1,
        type: 'insert-image',
        imageData: dataUrl,
        rect: { x: 0.25, y: 0.25, width: 0.5, height: 0.4 },
        color: '#ffffff',
        opacity: 1,
        strokeWidth: 0,
        createdAt: Date.now(),
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Page Editing Actions (underlying PDF manipulation)
  const handleRotateCurrent = async (delta: number) => {
    if (!rawPdfBytes) return;
    setIsLoading(true);
    try {
      const updatedBytes = await rotatePageInPDF(rawPdfBytes, currentPage - 1, delta);
      await handleLoadPDFBytes(updatedBytes, fileName, currentDocId);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCurrent = async () => {
    if (!rawPdfBytes || totalPages <= 1) return;
    if (!confirm(`Delete page ${currentPage}? This cannot be undone.`)) return;
    setIsLoading(true);
    try {
      const updatedBytes = await deletePageFromPDF(rawPdfBytes, currentPage - 1);
      await handleLoadPDFBytes(updatedBytes, fileName, currentDocId);
      setShowEditModal(false);
    } catch (e: any) {
      alert(e.message || 'Could not delete page.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDuplicateCurrent = async () => {
    if (!rawPdfBytes) return;
    setIsLoading(true);
    try {
      const updatedBytes = await duplicatePageInPDF(rawPdfBytes, currentPage - 1);
      await handleLoadPDFBytes(updatedBytes, fileName, currentDocId);
      setShowEditModal(false);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddBlankPage = async () => {
    if (!rawPdfBytes) return;
    setIsLoading(true);
    try {
      const updatedBytes = await addBlankPageToPDF(rawPdfBytes, currentPage);
      await handleLoadPDFBytes(updatedBytes, fileName, currentDocId);
      setShowEditModal(false);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExtractPages = async (rangeStr: string) => {
    if (!rawPdfBytes) return;
    try {
      // Parse range string e.g. "1, 2-3"
      const indices: number[] = [];
      const parts = rangeStr.split(',');
      parts.forEach((p) => {
        const trimmed = p.trim();
        if (trimmed.includes('-')) {
          const [start, end] = trimmed.split('-').map((v) => parseInt(v.trim()));
          for (let i = start; i <= end; i++) {
            if (i >= 1 && i <= totalPages) indices.push(i - 1);
          }
        } else {
          const num = parseInt(trimmed);
          if (num >= 1 && num <= totalPages) indices.push(num - 1);
        }
      });

      if (indices.length === 0) {
        alert('Please specify valid page numbers to extract.');
        return;
      }

      const extractedBytes = await extractPagesFromPDF(rawPdfBytes, indices);
      downloadBlob(
        new Blob([extractedBytes as any], { type: 'application/pdf' }),
        `Extracted_${fileName}`
      );
      setShowEditModal(false);
    } catch (e) {
      console.error(e);
      alert('Error extracting pages.');
    }
  };

  const handleMergePDFsTrigger = () => {
    mergeInputRef.current?.click();
  };

  const handleMergeFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !rawPdfBytes) return;
    setIsLoading(true);
    try {
      const secondBuffer = await file.arrayBuffer();
      const mergedBytes = await mergePDFs([rawPdfBytes, new Uint8Array(secondBuffer)]);
      await handleLoadPDFBytes(mergedBytes, fileName, currentDocId);
      alert(`Successfully merged "${file.name}" into this document.`);
      setShowEditModal(false);
    } catch (e) {
      console.error(e);
      alert('Error merging PDF files.');
    } finally {
      setIsLoading(false);
      e.target.value = '';
    }
  };

  const handleSplitPDF = async () => {
    if (!rawPdfBytes) return;
    setIsLoading(true);
    try {
      const zipBlob = await splitPDFToZip(rawPdfBytes, fileName.replace(/\.[^/.]+$/, ''));
      downloadBlob(zipBlob, `${fileName.replace(/\.[^/.]+$/, '')}_pages.zip`);
      setShowEditModal(false);
    } catch (e) {
      console.error(e);
      alert('Error splitting PDF.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCropPage = async (margins: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  }) => {
    if (!rawPdfBytes) return;
    setIsLoading(true);
    try {
      const croppedBytes = await cropPDFPages(rawPdfBytes, currentPage - 1, margins);
      await handleLoadPDFBytes(croppedBytes, fileName, currentDocId);
      setShowEditModal(false);
    } catch (e) {
      console.error(e);
      alert('Error cropping page.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReorderPages = async (fromPage: number, toPage: number) => {
    if (!rawPdfBytes || fromPage === toPage) return;
    setIsLoading(true);
    try {
      const newOrder = Array.from({ length: totalPages }, (_, i) => i);
      const [moved] = newOrder.splice(fromPage - 1, 1);
      newOrder.splice(toPage - 1, 0, moved);

      const reorderedBytes = await extractPagesFromPDF(rawPdfBytes, newOrder);
      await handleLoadPDFBytes(reorderedBytes, fileName, currentDocId);
      setCurrentPage(toPage);
      setShowEditModal(false);
    } catch (e) {
      console.error(e);
      alert('Error reordering pages.');
    } finally {
      setIsLoading(false);
    }
  };

  // Export / Download Handlers
  const handleSaveAnnotatedPDF = async () => {
    if (!rawPdfBytes) {
      alert('No document is open to save.');
      return;
    }
    setIsLoading(true);
    try {
      const bakedBytes = await bakeAnnotationsIntoPDF(rawPdfBytes, annotations);
      const targetName = fileName.toLowerCase().endsWith('.pdf')
        ? fileName.replace(/\.pdf$/i, '_edited.pdf')
        : `${fileName}_edited.pdf`;

      const result = await saveOrExportPDF(bakedBytes, targetName);
      if (result.success) {
        // Also update local storage cache so edits persist
        storePDFData(currentDocId, bakedBytes);
        setRawPdfBytes(bakedBytes);
        if (result.method !== 'share_canceled') {
          alert(`✅ "${targetName}" saved successfully!`);
        }
      } else {
        alert('Could not save PDF file. Please check storage permissions.');
      }
      setShowExportModal(false);
    } catch (e: any) {
      console.error(e);
      alert('Error saving PDF: ' + (e?.message || e));
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportImages = async (format: 'png' | 'jpg') => {
    if (!pdfDoc) return;
    try {
      const thumb = await renderPageThumbnail(pdfDoc, currentPage, 2.0); // 2x high resolution
      const link = document.createElement('a');
      link.href = thumb;
      link.download = `${fileName}_page_${currentPage}.${format}`;
      link.click();
    } catch (e) {
      console.error(e);
    }
  };

  const handleExportAnnotationsJson = () => {
    const jsonStr = JSON.stringify(annotations, null, 2);
    downloadBlob(
      new Blob([jsonStr], { type: 'application/json' }),
      `${fileName}_annotations.json`
    );
  };

  const handleCompressPDF = async () => {
    if (!rawPdfBytes) return;
    setIsLoading(true);
    try {
      const compressed = await compressPDF(rawPdfBytes);
      const ratio = Math.round((compressed.byteLength / rawPdfBytes.byteLength) * 100);
      downloadBlob(
        new Blob([compressed as any], { type: 'application/pdf' }),
        fileName.replace('.pdf', '_compressed.pdf')
      );
      alert(`Compressed PDF generated! Size: ${Math.round(compressed.byteLength / 1024)} KB (${ratio}% of original)`);
      setShowExportModal(false);
    } catch (e) {
      console.error(e);
      alert('Error compressing PDF.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const downloadBlob = (blob: Blob, name: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 30000);
  };

  // Zoom preset handling
  const handleSetZoom = (preset: ZoomPreset) => {
    setZoomPreset(preset);
    if (preset === 'actual') {
      setScale(1.0);
    } else if (preset === 'fit-width') {
      if (viewerContainerRef.current) {
        const containerW = viewerContainerRef.current.clientWidth - 80;
        setScale(Math.max(0.6, Math.min(2.5, containerW / 650)));
      } else {
        setScale(1.1);
      }
    } else if (preset === 'fit-page') {
      if (viewerContainerRef.current) {
        const containerH = viewerContainerRef.current.clientHeight - 80;
        setScale(Math.max(0.5, Math.min(2.0, containerH / 850)));
      } else {
        setScale(0.85);
      }
    } else if (typeof preset === 'number') {
      setScale(preset);
    }
  };

  const handleZoomIn = () => {
    setZoomPreset(scale + 0.15);
    setScale((prev) => Math.min(prev + 0.15, 3.0));
  };

  const handleZoomOut = () => {
    setZoomPreset(scale - 0.15);
    setScale((prev) => Math.max(prev - 0.15, 0.4));
  };

  // Fullscreen
  const handleToggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  // Page jump scroll
  const handleGoToPage = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    // Update recent doc last opened page
    if (currentDocId) {
      addOrUpdateRecentDoc({ id: currentDocId, name: fileName, lastPage: page });
    }
    const elem = document.getElementById(`pdf-page-${page}`);
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Keyboard navigation & Shortcuts
  useEffect(() => {
    if (!settings.enableKeyboardShortcuts || currentView !== 'viewer') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        e.preventDefault();
        handleGoToPage(currentPage + 1);
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        handleGoToPage(currentPage - 1);
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        setIsSidebarOpen(true);
        setActiveSidebarTab('search');
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      } else if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        handleZoomIn();
      } else if (e.key === '-') {
        e.preventDefault();
        handleZoomOut();
      } else if (e.key.toLowerCase() === 'v') {
        setActiveTool('select');
      } else if (e.key.toLowerCase() === 'h') {
        setActiveTool('hand');
      } else if (e.key.toLowerCase() === 'p') {
        setActiveTool('pen');
      } else if (e.key.toLowerCase() === 't') {
        setActiveTool('text');
      } else if (e.key.toLowerCase() === 'e') {
        setActiveTool('eraser');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [settings, currentView, currentPage, totalPages, undoStack, redoStack, scale]);

  // Bookmarks toggle
  const handleToggleBookmark = (pNum: number) => {
    setBookmarks((prev) => {
      const updated = prev.includes(pNum) ? prev.filter((p) => p !== pNum) : [...prev, pNum];
      if (currentDocId) {
        addOrUpdateRecentDoc({ id: currentDocId, name: fileName, bookmarks: updated });
      }
      return updated;
    });
  };

  const scaleRef = useRef(scale);
  useEffect(() => {
    scaleRef.current = scale;
  }, [scale]);

  // Touchpad pinch-to-zoom (PC) & Touch pinch-to-zoom (Mobile) Engine
  useEffect(() => {
    const container = viewerContainerRef.current;
    if (!container || currentView !== 'viewer') return;

    // --- 1. PC Trackpad 2-Finger Pinch & Ctrl+Wheel Zoom ---
    const handleWheel = (e: WheelEvent) => {
      // Touchpad pinch sends wheel event with e.ctrlKey = true in Chromium/Electron
      if (e.ctrlKey) {
        e.preventDefault();

        const containerRect = container.getBoundingClientRect();
        const mouseX = e.clientX - containerRect.left;
        const mouseY = e.clientY - containerRect.top;

        // Smooth zoom factor based on deltaY
        const zoomDelta = -e.deltaY * 0.005;
        const factor = Math.min(Math.max(Math.exp(zoomDelta), 0.75), 1.35);

        setScale((prevScale) => {
          const newScale = Math.min(Math.max(prevScale * factor, 0.35), 4.0);
          if (Math.abs(newScale - prevScale) < 0.002) return prevScale;

          // Focal-point zoom: Keep content under cursor stationary
          const ratio = newScale / prevScale;
          const targetScrollLeft = (container.scrollLeft + mouseX) * ratio - mouseX;
          const targetScrollTop = (container.scrollTop + mouseY) * ratio - mouseY;

          requestAnimationFrame(() => {
            container.scrollLeft = targetScrollLeft;
            container.scrollTop = targetScrollTop;
          });

          setZoomPreset(Math.round(newScale * 100) / 100);
          return newScale;
        });
      }
    };

    // --- 2. Mobile & Touchscreen 2-Finger Pinch-to-Zoom ---
    let isPinching = false;
    let initialPinchDistance = 0;
    let initialPinchScale = 1;
    let initialScroll = { left: 0, top: 0 };
    let initialCenter = { x: 0, y: 0 };
    let touchAnimFrame: number | null = null;
    let lastTapTime = 0;

    const getDistance = (t1: Touch, t2: Touch) => {
      return Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
    };

    const getCenter = (t1: Touch, t2: Touch, rect: DOMRect) => {
      return {
        x: (t1.clientX + t2.clientX) / 2 - rect.left,
        y: (t1.clientY + t2.clientY) / 2 - rect.top,
      };
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        isPinching = true;
        initialPinchDistance = getDistance(e.touches[0], e.touches[1]);
        initialPinchScale = scaleRef.current;
        initialScroll = { left: container.scrollLeft, top: container.scrollTop };
        const rect = container.getBoundingClientRect();
        initialCenter = getCenter(e.touches[0], e.touches[1], rect);
      } else if (e.touches.length === 1) {
        // Double-tap zoom toggle on mobile
        const now = Date.now();
        if (now - lastTapTime < 300) {
          const tap = e.touches[0];
          const rect = container.getBoundingClientRect();
          const tapX = tap.clientX - rect.left;
          const tapY = tap.clientY - rect.top;

          setScale((prevScale) => {
            const newScale = prevScale > 1.25 ? 0.95 : 1.85;
            const ratio = newScale / prevScale;
            container.scrollLeft = (container.scrollLeft + tapX) * ratio - tapX;
            container.scrollTop = (container.scrollTop + tapY) * ratio - tapY;
            setZoomPreset(newScale === 0.95 ? 'fit-width' : 1.85);
            return newScale;
          });
          lastTapTime = 0;
        } else {
          lastTapTime = now;
        }
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (isPinching && e.touches.length === 2) {
        e.preventDefault(); // Stop native browser/webview viewport zoom

        const currentDist = getDistance(e.touches[0], e.touches[1]);
        if (initialPinchDistance <= 15) return;

        const factor = currentDist / initialPinchDistance;
        const rect = container.getBoundingClientRect();
        const currentCenter = getCenter(e.touches[0], e.touches[1], rect);

        const newScale = Math.min(Math.max(initialPinchScale * factor, 0.35), 4.0);

        if (touchAnimFrame) cancelAnimationFrame(touchAnimFrame);
        touchAnimFrame = requestAnimationFrame(() => {
          setScale(newScale);
          setZoomPreset(Math.round(newScale * 100) / 100);

          const ratio = newScale / initialPinchScale;
          container.scrollLeft = (initialScroll.left + initialCenter.x) * ratio - currentCenter.x;
          container.scrollTop = (initialScroll.top + initialCenter.y) * ratio - currentCenter.y;
        });
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (isPinching && e.touches.length < 2) {
        isPinching = false;
        initialPinchDistance = 0;
        if (touchAnimFrame) {
          cancelAnimationFrame(touchAnimFrame);
          touchAnimFrame = null;
        }
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });
    container.addEventListener('touchcancel', handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('wheel', handleWheel);
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      container.removeEventListener('touchcancel', handleTouchEnd);
      if (touchAnimFrame) cancelAnimationFrame(touchAnimFrame);
    };
  }, [currentView]);

  return (
    <div className="w-screen h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 overflow-hidden font-sans select-none">
      {/* Hidden file inputs for user uploads */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="application/pdf"
        className="hidden"
      />
      <input
        type="file"
        ref={imageInputRef}
        onChange={handleImageFileSelected}
        accept="image/png,image/jpeg"
        className="hidden"
      />
      <input
        type="file"
        ref={mergeInputRef}
        onChange={handleMergeFilesSelected}
        accept="application/pdf"
        className="hidden"
      />

      {/* DASHBOARD VIEW */}
      {currentView === 'dashboard' && (
        <Dashboard
          recentDocs={recentDocs}
          onOpenDoc={handleOpenRecent}
          onOpenFilePicker={handleOpenFilePicker}
          onOpenSampleDoc={handleOpenSample}
          onToggleFavorite={(id, e) => {
            e.stopPropagation();
            setRecentDocs(toggleFavoriteDoc(id));
          }}
          onRemoveDoc={(id, e) => {
            e.stopPropagation();
            setRecentDocs(removeRecentDoc(id));
          }}
          activeFilter={dashboardFilter}
          onChangeFilter={setDashboardFilter}
          searchQuery={dashboardSearch}
          onSearchChange={setDashboardSearch}
          theme={settings.theme}
          onToggleTheme={handleToggleTheme}
          onOpenSettings={() => setShowSettingsModal(true)}
          onOpenScanner={() => setShowScannerModal(true)}
        />
      )}

      {/* VIEWER VIEW */}
      {currentView === 'viewer' && (
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          {/* Top Navigation Bar */}
          <TopNavbar
            fileName={fileName}
            currentPage={currentPage}
            totalPages={totalPages}
            onGoToPage={handleGoToPage}
            scale={scale}
            zoomPreset={zoomPreset}
            onSetZoom={handleSetZoom}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            viewMode={viewMode}
            onChangeViewMode={setViewMode}
            onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
            onToggleSearch={() => {
              setIsSidebarOpen(true);
              setActiveSidebarTab('search');
            }}
            onRotateDocument={() => setDocumentRotation((r) => (r + 90) % 360)}
            onOpenEditModal={() => setShowEditModal(true)}
            onOpenProperties={() => setShowPropertiesModal(true)}
            onOpenSettings={() => setShowSettingsModal(true)}
            onOpenScanner={() => setShowScannerModal(true)}
            onSavePDF={handleSaveAnnotatedPDF}
            onExportPDF={() => setShowExportModal(true)}
            onPrintPDF={handlePrint}
            onBackToDashboard={() => setCurrentView('dashboard')}
            onToggleFullScreen={handleToggleFullScreen}
            isReadingMode={isReadingMode}
            onToggleReadingMode={() => setIsReadingMode(!isReadingMode)}
            showAnnotationBar={showAnnotationBar}
            onToggleAnnotationBar={() => {
              setShowAnnotationBar((prev) => {
                if (prev) {
                  setActiveTool('select');
                }
                return !prev;
              });
            }}
            theme={settings.theme}
            onToggleTheme={handleToggleTheme}
          />

          {/* Main Viewer Body */}
          <div className="flex-1 flex overflow-hidden relative">
            {/* Left Nav Sidebar */}
            {isSidebarOpen && !isReadingMode && (
              <SidebarPanel
                totalPages={totalPages}
                currentPage={currentPage}
                onGoToPage={handleGoToPage}
                outline={outline}
                bookmarks={bookmarks}
                onToggleBookmark={handleToggleBookmark}
                notes={notes}
                onUpdateNotes={setNotes}
                thumbnails={thumbnails}
                searchMatches={searchMatches}
                searchIndex={searchIndex}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                onNavigateSearch={handleNavigateSearch}
                searchOptions={searchOptions}
                onUpdateSearchOptions={setSearchOptions}
                activeTab={activeSidebarTab}
                onChangeTab={setActiveSidebarTab}
                onClose={() => setIsSidebarOpen(false)}
              />
            )}

            {/* Document Pages Container */}
            <div
              ref={viewerContainerRef}
              className="flex-1 h-full overflow-auto p-4 md:p-8 relative flex flex-col items-center bg-zinc-100/70 dark:bg-zinc-950 overscroll-contain"
              style={{ touchAction: 'pan-x pan-y' }}
            >
              {/* Floating Markup & Annotation Bar */}
              {!isReadingMode && showAnnotationBar && (
                <div className="sticky top-0 z-40 mb-6">
                  <AnnotationToolbar
                    activeTool={activeTool}
                    onSelectTool={setActiveTool}
                    toolColor={toolColor}
                    onChangeColor={setToolColor}
                    toolThickness={toolThickness}
                    onChangeThickness={setToolThickness}
                    canUndo={undoStack.length > 0}
                    canRedo={redoStack.length > 0}
                    onUndo={handleUndo}
                    onRedo={handleRedo}
                    onClearAnnotations={handleClearAnnotations}
                    onInsertImage={handleInsertImageTrigger}
                  />
                </div>
              )}

              {/* PDF Pages Rendering according to ViewMode */}
              {viewMode === 'continuous' && (
                <div className="w-full flex flex-col items-center">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pNum) => (
                    <PDFPage
                      key={pNum}
                      pdfDoc={pdfDoc}
                      pageNumber={pNum}
                      scale={scale}
                      rotation={documentRotation}
                      activeTool={activeTool}
                      toolColor={toolColor}
                      toolThickness={toolThickness}
                      annotations={annotations}
                      onAddAnnotation={handleAddAnnotation}
                      onDeleteAnnotation={handleDeleteAnnotation}
                      isCurrentPage={currentPage === pNum}
                    />
                  ))}
                </div>
              )}

              {viewMode === 'single' && (
                <div className="w-full flex justify-center">
                  <PDFPage
                    pdfDoc={pdfDoc}
                    pageNumber={currentPage}
                    scale={scale}
                    rotation={documentRotation}
                    activeTool={activeTool}
                    toolColor={toolColor}
                    toolThickness={toolThickness}
                    annotations={annotations}
                    onAddAnnotation={handleAddAnnotation}
                    onDeleteAnnotation={handleDeleteAnnotation}
                    isCurrentPage={true}
                  />
                </div>
              )}

              {viewMode === 'spread' && (
                <div className="flex gap-6 justify-center flex-wrap">
                  <PDFPage
                    pdfDoc={pdfDoc}
                    pageNumber={currentPage}
                    scale={scale * 0.9}
                    rotation={documentRotation}
                    activeTool={activeTool}
                    toolColor={toolColor}
                    toolThickness={toolThickness}
                    annotations={annotations}
                    onAddAnnotation={handleAddAnnotation}
                    onDeleteAnnotation={handleDeleteAnnotation}
                    isCurrentPage={true}
                  />
                  {currentPage < totalPages && (
                    <PDFPage
                      pdfDoc={pdfDoc}
                      pageNumber={currentPage + 1}
                      scale={scale * 0.9}
                      rotation={documentRotation}
                      activeTool={activeTool}
                      toolColor={toolColor}
                      toolThickness={toolThickness}
                      annotations={annotations}
                      onAddAnnotation={handleAddAnnotation}
                      onDeleteAnnotation={handleDeleteAnnotation}
                      isCurrentPage={false}
                    />
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Mobile Floating Action Save Button - Always visible on Android phones */}
          <div className="md:hidden fixed bottom-6 right-6 z-40">
            <button
              onClick={handleSaveAnnotatedPDF}
              title="Save & Download PDF"
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-xs rounded-full shadow-2xl transition-all active:scale-95 cursor-pointer border border-white/20"
            >
              <Download size={16} />
              <span>Save PDF</span>
            </button>
          </div>
        </div>
      )}

      {/* MODALS */}
      {showEditModal && (
        <EditModal
          currentPage={currentPage}
          totalPages={totalPages}
          onRotateCurrent={handleRotateCurrent}
          onDeleteCurrent={handleDeleteCurrent}
          onDuplicateCurrent={handleDuplicateCurrent}
          onAddBlankPage={handleAddBlankPage}
          onExtractPages={handleExtractPages}
          onMergePDFs={handleMergePDFsTrigger}
          onSplitPDF={handleSplitPDF}
          onCropPage={handleCropPage}
          onReorderPages={handleReorderPages}
          onClose={() => setShowEditModal(false)}
        />
      )}

      {showPropertiesModal && (
        <DocumentPropertiesModal
          metadata={metadata}
          fileName={fileName}
          onClose={() => setShowPropertiesModal(false)}
        />
      )}

      {showSettingsModal && (
        <SettingsModal
          settings={settings}
          onUpdateSettings={(newOpts) => setSettings((prev) => ({ ...prev, ...newOpts }))}
          onClearRecentHistory={() => {
            if (confirm('Clear all document history and cached offline files?')) {
              saveRecentDocs([]);
              setRecentDocs([]);
            }
          }}
          onClose={() => setShowSettingsModal(false)}
        />
      )}

      {showExportModal && (
        <ExportModal
          fileName={fileName}
          totalPages={totalPages}
          currentPage={currentPage}
          onSaveAnnotatedPDF={handleSaveAnnotatedPDF}
          onExportImages={handleExportImages}
          onExportSinglePage={(p) => handleExtractPages(`${p}`)}
          onExportAnnotationsJson={handleExportAnnotationsJson}
          onCompressPDF={handleCompressPDF}
          onClose={() => setShowExportModal(false)}
        />
      )}

      {showScannerModal && (
        <DocumentScannerModal
          isOpen={showScannerModal}
          onClose={() => setShowScannerModal(false)}
          onSavePDF={async (pdfBytes, scannedName) => {
            setShowScannerModal(false);
            await handleLoadPDFBytes(pdfBytes, scannedName);
            const result = await saveOrExportPDF(pdfBytes, scannedName);
            if (result.success && result.method !== 'share_canceled') {
              alert(`✅ "${scannedName}" saved successfully!`);
            }
          }}
        />
      )}

      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-xs">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-5 py-3 shadow-xl flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-medium text-zinc-800 dark:text-zinc-200">
              Processing document...
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;

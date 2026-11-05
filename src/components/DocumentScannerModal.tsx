import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  Image as ImageIcon,
  RotateCw,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  FileText,
  Sliders,
  Check,
  X,
  Plus,
  RefreshCw,
  Layers,
} from 'lucide-react';
import { convertImagesToPDF } from '../services/pdfEditService';
import { saveOrExportPDF } from '../services/fileSaveService';

interface ScannedPage {
  id: string;
  originalDataUrl: string;
  filteredDataUrl: string;
  rotation: number;
  filter: 'original' | 'color' | 'grayscale' | 'bw';
}

interface DocumentScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSavePDF: (pdfBytes: Uint8Array, fileName: string) => void;
}

export const DocumentScannerModal: React.FC<DocumentScannerModalProps> = ({
  isOpen,
  onClose,
  onSavePDF,
}) => {
  const [pages, setPages] = useState<ScannedPage[]>([]);
  const [activePageIndex, setActivePageIndex] = useState<number>(0);
  const [documentName, setDocumentName] = useState<string>('');
  const [pageSize, setPageSize] = useState<'fit' | 'a4' | 'letter'>('a4');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [useLiveCamera, setUseLiveCamera] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Initialize document name on open
  useEffect(() => {
    if (isOpen) {
      const now = new Date();
      const dateStr = now.toISOString().slice(0, 10);
      const timeStr = `${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
      setDocumentName(`Scan_${dateStr}_${timeStr}.pdf`);
      setPages([]);
      setActivePageIndex(0);
      setCameraError(null);
    } else {
      stopLiveCamera();
    }
  }, [isOpen]);

  // Clean up live stream on unmount
  useEffect(() => {
    return () => {
      stopLiveCamera();
    };
  }, []);

  const stopLiveCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setUseLiveCamera(false);
  };

  const startLiveCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Camera not supported on this browser');
      }

      // Stop existing stream if any
      stopLiveCamera();

      // Prefer back camera on mobile (facingMode: environment)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setUseLiveCamera(true);
    } catch (err: any) {
      console.warn('Live camera access error, falling back to file picker camera', err);
      setCameraError('Direct camera feed unavailable. Using native photo capture instead.');
      // Launch native device camera via input
      cameraInputRef.current?.click();
    }
  };

  // Image filter processor using HTML5 Canvas
  const processImageFilter = (
    imageSrc: string,
    filter: 'original' | 'color' | 'grayscale' | 'bw',
    rotation: number = 0
  ): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(imageSrc);

        const isRotated = rotation % 180 !== 0;
        canvas.width = isRotated ? img.height : img.width;
        canvas.height = isRotated ? img.width : img.height;

        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.drawImage(img, -img.width / 2, -img.height / 2);
        ctx.restore();

        if (filter === 'original') {
          resolve(canvas.toDataURL('image/jpeg', 0.92));
          return;
        }

        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const d = imgData.data;

        for (let i = 0; i < d.length; i += 4) {
          const r = d[i];
          const g = d[i + 1];
          const b = d[i + 2];
          const lum = 0.299 * r + 0.587 * g + 0.114 * b;

          if (filter === 'bw') {
            // Adobe Scan high-contrast text threshold
            const val = lum < 140 ? Math.max(0, lum * 0.5) : 255;
            d[i] = val;
            d[i + 1] = val;
            d[i + 2] = val;
          } else if (filter === 'grayscale') {
            d[i] = lum;
            d[i + 1] = lum;
            d[i + 2] = lum;
          } else if (filter === 'color') {
            // Document color enhance: boost contrast and brighten background
            const factor = 1.25;
            d[i] = Math.min(255, Math.max(0, factor * (r - 128) + 128 + 15));
            d[i + 1] = Math.min(255, Math.max(0, factor * (g - 128) + 128 + 15));
            d[i + 2] = Math.min(255, Math.max(0, factor * (b - 128) + 128 + 15));
          }
        }

        ctx.putImageData(imgData, 0, 0);
        resolve(canvas.toDataURL('image/jpeg', 0.92));
      };
      img.src = imageSrc;
    });
  };

  // Add captured or selected images
  const addImages = async (dataUrls: string[]) => {
    setIsProcessing(true);
    const newPages: ScannedPage[] = [];

    for (const url of dataUrls) {
      const filtered = await processImageFilter(url, 'color', 0);
      newPages.push({
        id: `page-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        originalDataUrl: url,
        filteredDataUrl: filtered,
        rotation: 0,
        filter: 'color', // Default to clean document color like Adobe Scan
      });
    }

    setPages((prev) => {
      const combined = [...prev, ...newPages];
      setActivePageIndex(combined.length - 1);
      return combined;
    });
    setIsProcessing(false);
  };

  // Snap photo from live camera feed
  const handleSnapLivePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    addImages([dataUrl]);
  };

  // Handle files selected from camera or gallery
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const urls: string[] = [];
    let readCount = 0;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          urls.push(event.target.result as string);
        }
        readCount++;
        if (readCount === files.length) {
          addImages(urls);
        }
      };
      reader.readAsDataURL(file);
    });

    e.target.value = '';
  };

  // Change filter on current page
  const handleChangeFilter = async (filter: 'original' | 'color' | 'grayscale' | 'bw') => {
    const page = pages[activePageIndex];
    if (!page) return;

    setIsProcessing(true);
    const newFiltered = await processImageFilter(page.originalDataUrl, filter, page.rotation);
    setPages((prev) =>
      prev.map((p, idx) =>
        idx === activePageIndex
          ? { ...p, filter, filteredDataUrl: newFiltered }
          : p
      )
    );
    setIsProcessing(false);
  };

  // Rotate current page 90 degrees clockwise
  const handleRotateCurrentPage = async () => {
    const page = pages[activePageIndex];
    if (!page) return;

    setIsProcessing(true);
    const newRotation = (page.rotation + 90) % 360;
    const newFiltered = await processImageFilter(page.originalDataUrl, page.filter, newRotation);
    setPages((prev) =>
      prev.map((p, idx) =>
        idx === activePageIndex
          ? { ...p, rotation: newRotation, filteredDataUrl: newFiltered }
          : p
      )
    );
    setIsProcessing(false);
  };

  // Delete current page
  const handleDeleteCurrentPage = () => {
    if (pages.length === 0) return;
    setPages((prev) => {
      const updated = prev.filter((_, idx) => idx !== activePageIndex);
      setActivePageIndex((curr) => Math.max(0, Math.min(curr, updated.length - 1)));
      return updated;
    });
  };

  // Reorder pages
  const handleMovePage = (direction: 'left' | 'right') => {
    const targetIdx = direction === 'left' ? activePageIndex - 1 : activePageIndex + 1;
    if (targetIdx < 0 || targetIdx >= pages.length) return;

    setPages((prev) => {
      const updated = [...prev];
      const temp = updated[activePageIndex];
      updated[activePageIndex] = updated[targetIdx];
      updated[targetIdx] = temp;
      return updated;
    });
    setActivePageIndex(targetIdx);
  };

  // Build and save PDF
  const handleSaveDocument = async () => {
    if (pages.length === 0) return;
    setIsProcessing(true);
    try {
      const imagePayload = pages.map((p) => ({
        dataUrl: p.filteredDataUrl,
      }));

      const pdfBytes = await convertImagesToPDF(imagePayload, pageSize);
      const safeName = documentName.trim()
        ? documentName.trim().endsWith('.pdf')
          ? documentName.trim()
          : `${documentName.trim()}.pdf`
        : 'Scanned_Document.pdf';

      stopLiveCamera();
      // Directly save / download / export the PDF to mobile storage / PC disk
      await saveOrExportPDF(pdfBytes, safeName);
      // Load into viewer for immediate viewing & annotating
      onSavePDF(pdfBytes, safeName);
      onClose();
    } catch (err) {
      console.error('Failed creating scanned PDF:', err);
      alert('Error creating PDF document from scanned pages.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  const activePage = pages[activePageIndex];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-2 sm:p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-4xl h-[92vh] max-h-[820px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Hidden Camera and Gallery File Inputs */}
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileInput}
          className="hidden"
        />
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileInput}
          className="hidden"
        />

        {/* Header Bar */}
        <div className="h-14 px-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between shrink-0 bg-zinc-50/50 dark:bg-zinc-900/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Camera size={17} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                <span>Scan to PDF</span>
                {pages.length > 0 && (
                  <span className="text-[11px] font-normal px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                    {pages.length} {pages.length === 1 ? 'page' : 'pages'}
                  </span>
                )}
              </h2>
            </div>
          </div>

          {/* Document Name input on larger screens */}
          <div className="hidden sm:flex items-center gap-2">
            <input
              type="text"
              value={documentName}
              onChange={(e) => setDocumentName(e.target.value)}
              placeholder="Document Name"
              className="text-xs px-2.5 py-1.5 w-52 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <select
              value={pageSize}
              onChange={(e) => setPageSize(e.target.value as any)}
              className="text-xs px-2 py-1.5 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 focus:outline-none"
            >
              <option value="a4">Format: A4</option>
              <option value="letter">Format: Letter</option>
              <option value="fit">Format: Original Size</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            {pages.length > 0 && (
              <button
                onClick={handleSaveDocument}
                disabled={isProcessing}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg text-xs font-medium shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                <Check size={14} />
                <span>Save PDF</span>
              </button>
            )}
            <button
              onClick={() => {
                stopLiveCamera();
                onClose();
              }}
              className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Document Name input on Mobile */}
        <div className="sm:hidden px-4 py-2 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center gap-2">
          <input
            type="text"
            value={documentName}
            onChange={(e) => setDocumentName(e.target.value)}
            placeholder="Document Name"
            className="flex-1 text-xs px-2 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700"
          />
          <select
            value={pageSize}
            onChange={(e) => setPageSize(e.target.value as any)}
            className="text-xs px-2 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700"
          >
            <option value="a4">A4</option>
            <option value="letter">Letter</option>
            <option value="fit">Original</option>
          </select>
        </div>

        {/* Center Main Stage */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative bg-zinc-100/60 dark:bg-zinc-950/60">
          {/* Active View / Preview Area */}
          <div className="flex-1 flex flex-col items-center justify-center p-4 overflow-hidden relative">
            {useLiveCamera ? (
              /* Live Viewfinder */
              <div className="w-full h-full max-w-lg max-h-[520px] relative rounded-xl overflow-hidden bg-black shadow-lg flex flex-col items-center justify-center">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                {/* Viewfinder corner guides */}
                <div className="absolute inset-8 border border-white/40 rounded-lg pointer-events-none" />

                {/* Shutter bar */}
                <div className="absolute bottom-4 inset-x-0 flex items-center justify-center gap-4">
                  <button
                    onClick={handleSnapLivePhoto}
                    className="w-16 h-16 rounded-full border-4 border-white bg-white/30 hover:bg-white/50 active:scale-95 transition-transform flex items-center justify-center shadow-lg cursor-pointer"
                  >
                    <div className="w-12 h-12 rounded-full bg-white" />
                  </button>
                  <button
                    onClick={stopLiveCamera}
                    className="px-3 py-1.5 bg-black/60 text-white rounded-lg text-xs hover:bg-black/80 cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : pages.length > 0 && activePage ? (
              /* Scanned Page Preview with filter overlay */
              <div className="w-full h-full flex flex-col items-center justify-center">
                <div className="max-w-full max-h-[460px] md:max-h-[500px] overflow-hidden rounded-lg shadow-xl bg-white border border-zinc-200/80 dark:border-zinc-800 flex items-center justify-center">
                  <img
                    src={activePage.filteredDataUrl}
                    alt={`Page ${activePageIndex + 1}`}
                    className="max-w-full max-h-[460px] md:max-h-[500px] object-contain transition-all"
                  />
                </div>
                <div className="text-[11px] text-zinc-400 mt-2">
                  Page {activePageIndex + 1} of {pages.length}
                </div>
              </div>
            ) : (
              /* Empty State: Take first picture */
              <div className="text-center p-6 max-w-sm">
                <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-4 shadow-xs">
                  <Camera size={32} />
                </div>
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
                  Scan Your Documents
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-6 leading-relaxed">
                  Snap photos with your phone camera or select existing pictures to convert them into a clean, multi-page PDF document.
                </p>

                <div className="flex flex-col gap-2.5">
                  <button
                    onClick={() => cameraInputRef.current?.click()}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-xs font-medium shadow-xs transition-colors cursor-pointer"
                  >
                    <Camera size={16} />
                    <span>Take Photo (Camera)</span>
                  </button>

                  <button
                    onClick={() => galleryInputRef.current?.click()}
                    className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-medium transition-colors cursor-pointer"
                  >
                    <ImageIcon size={15} />
                    <span>Choose from Photos / Gallery</span>
                  </button>

                  <button
                    onClick={startLiveCamera}
                    className="text-[11px] text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 py-1 transition-colors cursor-pointer"
                  >
                    Open Live Web Viewfinder
                  </button>
                </div>

                {cameraError && (
                  <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-3">
                    {cameraError}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Right Editing & Enhancements Panel (when pages exist) */}
          {pages.length > 0 && activePage && !useLiveCamera && (
            <div className="w-full md:w-60 border-t md:border-t-0 md:border-l border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3 flex flex-row md:flex-col justify-between md:justify-start gap-3 shrink-0">
              {/* Filter Controls (Adobe Scan style) */}
              <div className="flex-1">
                <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider block mb-2">
                  Document Filter
                </span>
                <div className="grid grid-cols-2 md:grid-cols-1 gap-1.5">
                  <button
                    onClick={() => handleChangeFilter('color')}
                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                      activePage.filter === 'color'
                        ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900'
                        : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                    }`}
                  >
                    <Sparkles size={14} className="text-blue-500" />
                    <span>Magic Color</span>
                  </button>

                  <button
                    onClick={() => handleChangeFilter('bw')}
                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                      activePage.filter === 'bw'
                        ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900'
                        : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                    }`}
                  >
                    <FileText size={14} />
                    <span>B&W Document</span>
                  </button>

                  <button
                    onClick={() => handleChangeFilter('grayscale')}
                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                      activePage.filter === 'grayscale'
                        ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900'
                        : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                    }`}
                  >
                    <Sliders size={14} />
                    <span>Grayscale</span>
                  </button>

                  <button
                    onClick={() => handleChangeFilter('original')}
                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                      activePage.filter === 'original'
                        ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900'
                        : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                    }`}
                  >
                    <ImageIcon size={14} />
                    <span>Original Photo</span>
                  </button>
                </div>
              </div>

              {/* Page Actions (Rotate, Reorder, Delete) */}
              <div className="flex md:flex-col gap-1.5 border-l md:border-l-0 md:border-t border-zinc-200 dark:border-zinc-800 pl-3 md:pl-0 md:pt-3">
                <button
                  onClick={handleRotateCurrentPage}
                  className="flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  <RotateCw size={14} />
                  <span className="hidden md:inline">Rotate 90°</span>
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleMovePage('left')}
                    disabled={activePageIndex === 0}
                    title="Move page left"
                    className="flex-1 flex items-center justify-center py-1.5 px-2 rounded-lg text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-30 cursor-pointer"
                  >
                    <ChevronLeft size={14} />
                    <span className="hidden md:inline text-[11px]">Move Left</span>
                  </button>
                  <button
                    onClick={() => handleMovePage('right')}
                    disabled={activePageIndex === pages.length - 1}
                    title="Move page right"
                    className="flex-1 flex items-center justify-center py-1.5 px-2 rounded-lg text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-30 cursor-pointer"
                  >
                    <span className="hidden md:inline text-[11px]">Move Right</span>
                    <ChevronRight size={14} />
                  </button>
                </div>

                <button
                  onClick={handleDeleteCurrentPage}
                  className="flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                >
                  <Trash2 size={14} />
                  <span className="hidden md:inline">Delete Page</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Multi-Page Strip (Thumbnail Carousel) */}
        {pages.length > 0 && (
          <div className="h-20 px-3 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center gap-2 overflow-x-auto shrink-0 select-none">
            {pages.map((p, idx) => (
              <div
                key={p.id}
                onClick={() => {
                  stopLiveCamera();
                  setActivePageIndex(idx);
                }}
                className={`relative w-12 h-16 rounded-md overflow-hidden border-2 shrink-0 cursor-pointer transition-all ${
                  activePageIndex === idx && !useLiveCamera
                    ? 'border-blue-600 shadow-sm scale-105'
                    : 'border-zinc-200 dark:border-zinc-700 opacity-70 hover:opacity-100'
                }`}
              >
                <img
                  src={p.filteredDataUrl}
                  alt={`Thumb ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
                <span className="absolute bottom-0.5 right-0.5 text-[9px] font-bold px-1 rounded bg-black/60 text-white">
                  {idx + 1}
                </span>
              </div>
            ))}

            {/* Quick Add More Pages buttons */}
            <div className="flex items-center gap-1.5 pl-2 shrink-0">
              <button
                onClick={() => cameraInputRef.current?.click()}
                title="Take another photo"
                className="flex items-center gap-1 px-3 py-2 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900 hover:bg-blue-100 dark:hover:bg-blue-900/60 rounded-lg text-xs font-medium transition-colors cursor-pointer"
              >
                <Camera size={14} />
                <span>+ Camera</span>
              </button>

              <button
                onClick={() => galleryInputRef.current?.click()}
                title="Add photos from gallery"
                className="flex items-center gap-1 px-3 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg text-xs font-medium transition-colors cursor-pointer"
              >
                <ImageIcon size={14} />
                <span>+ Gallery</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

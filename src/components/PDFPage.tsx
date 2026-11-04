import React, { useEffect, useRef, useState } from 'react';
import type { Annotation, ToolMode } from '../types';

interface PDFPageProps {
  pdfDoc: any;
  pageNumber: number;
  scale: number;
  rotation: number;
  activeTool: ToolMode;
  toolColor: string;
  toolThickness: number;
  annotations: Annotation[];
  onAddAnnotation: (ann: Annotation) => void;
  onDeleteAnnotation: (id: string) => void;
  searchHighlights?: { matchIndex: number; text: string }[];
  isCurrentPage?: boolean;
}

export const PDFPage: React.FC<PDFPageProps> = ({
  pdfDoc,
  pageNumber,
  scale,
  rotation,
  activeTool,
  toolColor,
  toolThickness,
  annotations,
  onAddAnnotation,
  onDeleteAnnotation,
  isCurrentPage,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textLayerRef = useRef<HTMLDivElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);

  // Default page dimension estimate until rendered
  const [pageDimensions, setPageDimensions] = useState<{ width: number; height: number }>({
    width: 600 * scale,
    height: 800 * scale,
  });

  const [isVisible, setIsVisible] = useState<boolean>(isCurrentPage || pageNumber <= 3);
  const [isRendered, setIsRendered] = useState<boolean>(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPoints, setCurrentPoints] = useState<{ x: number; y: number }[]>([]);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
  const [activeTextInput, setActiveTextInput] = useState<{ x: number; y: number; text: string } | null>(null);

  // Intersection Observer: Only render pages that are in viewport or near viewport (prevents OOM on large PDFs!)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // Root margin 600px pre-renders adjacent pages ahead of scrolling
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          setIsVisible(true);
        } else {
          // Keep first page or current page active, free others if far off screen
          if (!isCurrentPage && pageNumber > 2) {
            setIsVisible(false);
          }
        }
      },
      { rootMargin: '600px 0px 600px 0px', threshold: 0.01 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [isCurrentPage, pageNumber]);

  // Render Page Content via PDF.js only when visible
  useEffect(() => {
    if (!isVisible || !pdfDoc) return;

    let cancelRender = false;
    let renderTask: any = null;

    async function render() {
      if (!canvasRef.current) return;
      try {
        const page = await pdfDoc.getPage(pageNumber);
        if (cancelRender) return;

        const viewport = page.getViewport({ scale, rotation });
        const canvas = canvasRef.current;
        if (!canvas) return;
        const context = canvas.getContext('2d');
        if (!context) return;

        // Optimized devicePixelRatio for large files (cap at 2 to conserve GPU memory)
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.floor(viewport.width * dpr);
        canvas.height = Math.floor(viewport.height * dpr);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;

        setPageDimensions({ width: viewport.width, height: viewport.height });

        context.setTransform(dpr, 0, 0, dpr, 0, 0);

        renderTask = page.render({
          canvasContext: context,
          viewport,
        });

        await renderTask.promise;
        setIsRendered(true);

        // Render Text Layer
        if (textLayerRef.current) {
          textLayerRef.current.innerHTML = '';
          textLayerRef.current.style.width = `${Math.floor(viewport.width)}px`;
          textLayerRef.current.style.height = `${Math.floor(viewport.height)}px`;

          const textContent = await page.getTextContent();
          if (cancelRender || !textLayerRef.current) return;

          textContent.items.forEach((item: any) => {
            const span = document.createElement('span');
            span.textContent = item.str;

            const tx = item.transform;
            if (tx) {
              const x = tx[4] * scale;
              const y = viewport.height - tx[5] * scale;
              span.style.left = `${x}px`;
              span.style.top = `${y - (item.height || 12) * scale}px`;
              span.style.fontSize = `${(item.height || 12) * scale}px`;
              span.style.fontFamily = item.fontName || 'sans-serif';
            }
            textLayerRef.current?.appendChild(span);
          });
        }
      } catch (err: any) {
        if (err.name !== 'RenderingCancelledException') {
          console.warn(`Render page ${pageNumber} info`, err);
        }
      }
    }

    render();

    return () => {
      cancelRender = true;
      if (renderTask) {
        renderTask.cancel();
      }
    };
  }, [isVisible, pdfDoc, pageNumber, scale, rotation]);

  // Render Overlay Annotations
  useEffect(() => {
    if (!isVisible) return;
    const canvas = overlayCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = pageDimensions.width * dpr;
    canvas.height = pageDimensions.height * dpr;
    canvas.style.width = `${pageDimensions.width}px`;
    canvas.style.height = `${pageDimensions.height}px`;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, pageDimensions.width, pageDimensions.height);

    const pageAnns = annotations.filter((a) => a.pageIndex === pageNumber - 1);

    pageAnns.forEach((ann) => {
      ctx.save();
      ctx.strokeStyle = ann.color;
      ctx.fillStyle = ann.color;
      ctx.lineWidth = ann.strokeWidth * (scale / 1.0);
      ctx.globalAlpha = ann.opacity;

      const w = pageDimensions.width;
      const h = pageDimensions.height;

      if (ann.type === 'rect' && ann.rect) {
        ctx.strokeRect(ann.rect.x * w, ann.rect.y * h, ann.rect.width * w, ann.rect.height * h);
      } else if (ann.type === 'highlight' && ann.rect) {
        ctx.globalAlpha = ann.opacity * 0.4;
        ctx.fillRect(ann.rect.x * w, ann.rect.y * h, ann.rect.width * w, ann.rect.height * h);
      } else if (ann.type === 'underline' && ann.rect) {
        ctx.beginPath();
        ctx.moveTo(ann.rect.x * w, (ann.rect.y + ann.rect.height) * h);
        ctx.lineTo((ann.rect.x + ann.rect.width) * w, (ann.rect.y + ann.rect.height) * h);
        ctx.stroke();
      } else if (ann.type === 'strikethrough' && ann.rect) {
        ctx.beginPath();
        const midY = (ann.rect.y + ann.rect.height / 2) * h;
        ctx.moveTo(ann.rect.x * w, midY);
        ctx.lineTo((ann.rect.x + ann.rect.width) * w, midY);
        ctx.stroke();
      } else if (ann.type === 'circle' && ann.rect) {
        ctx.beginPath();
        const rx = (ann.rect.width * w) / 2;
        const ry = (ann.rect.height * h) / 2;
        const cx = ann.rect.x * w + rx;
        const cy = ann.rect.y * h + ry;
        ctx.ellipse(cx, cy, Math.abs(rx), Math.abs(ry), 0, 0, Math.PI * 2);
        ctx.stroke();
      } else if ((ann.type === 'pen' || ann.type === 'pencil') && ann.points && ann.points.length > 1) {
        ctx.beginPath();
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.moveTo(ann.points[0].x * w, ann.points[0].y * h);
        for (let i = 1; i < ann.points.length; i++) {
          ctx.lineTo(ann.points[i].x * w, ann.points[i].y * h);
        }
        ctx.stroke();
      } else if (ann.type === 'line' && ann.points && ann.points.length >= 2) {
        ctx.beginPath();
        ctx.moveTo(ann.points[0].x * w, ann.points[0].y * h);
        ctx.lineTo(ann.points[1].x * w, ann.points[1].y * h);
        ctx.stroke();
      } else if (ann.type === 'arrow' && ann.points && ann.points.length >= 2) {
        const x1 = ann.points[0].x * w;
        const y1 = ann.points[0].y * h;
        const x2 = ann.points[1].x * w;
        const y2 = ann.points[1].y * h;

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        const angle = Math.atan2(y2 - y1, x2 - x1);
        const head = 12 * (scale / 1.0);
        ctx.beginPath();
        ctx.moveTo(x2, y2);
        ctx.lineTo(x2 - head * Math.cos(angle - Math.PI / 6), y2 - head * Math.sin(angle - Math.PI / 6));
        ctx.moveTo(x2, y2);
        ctx.lineTo(x2 - head * Math.cos(angle + Math.PI / 6), y2 - head * Math.sin(angle + Math.PI / 6));
        ctx.stroke();
      } else if ((ann.type === 'text' || ann.type === 'note') && ann.text && ann.rect) {
        const fSize = (ann.fontSize || 14) * (scale / 1.0);
        ctx.font = `${fSize}px -apple-system, sans-serif`;

        if (ann.type === 'note') {
          ctx.fillStyle = '#fef08a';
          ctx.strokeStyle = '#eab308';
          ctx.lineWidth = 1;
          const boxW = Math.max(120, ann.rect.width * w);
          const boxH = Math.max(40, ann.rect.height * h);
          ctx.fillRect(ann.rect.x * w, ann.rect.y * h, boxW, boxH);
          ctx.strokeRect(ann.rect.x * w, ann.rect.y * h, boxW, boxH);
          ctx.fillStyle = '#1e293b';
          ctx.fillText(ann.text, ann.rect.x * w + 8, ann.rect.y * h + 20);
        } else {
          ctx.fillText(ann.text, ann.rect.x * w, ann.rect.y * h + fSize);
        }
      } else if (ann.type === 'insert-image' && ann.imageData && ann.rect) {
        const imgRect = ann.rect;
        const img = new Image();
        img.src = ann.imageData;
        if (img.complete) {
          ctx.drawImage(img, imgRect.x * w, imgRect.y * h, imgRect.width * w, imgRect.height * h);
        } else {
          img.onload = () => {
            ctx.drawImage(img, imgRect.x * w, imgRect.y * h, imgRect.width * w, imgRect.height * h);
          };
        }
      }

      ctx.restore();
    });

    // Draw active drawing in progress
    if (isDrawing && currentPoints.length > 0) {
      ctx.save();
      ctx.strokeStyle = toolColor;
      ctx.fillStyle = toolColor;
      ctx.lineWidth = toolThickness * (scale / 1.0);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      const w = pageDimensions.width;
      const h = pageDimensions.height;

      if (activeTool === 'pen' || activeTool === 'pencil') {
        ctx.beginPath();
        ctx.moveTo(currentPoints[0].x * w, currentPoints[0].y * h);
        for (let i = 1; i < currentPoints.length; i++) {
          ctx.lineTo(currentPoints[i].x * w, currentPoints[i].y * h);
        }
        ctx.stroke();
      } else if (startPoint && currentPoints.length > 0) {
        const last = currentPoints[currentPoints.length - 1];
        if (activeTool === 'rect' || activeTool === 'highlight') {
          const rx = Math.min(startPoint.x, last.x) * w;
          const ry = Math.min(startPoint.y, last.y) * h;
          const rw = Math.abs(last.x - startPoint.x) * w;
          const rh = Math.abs(last.y - startPoint.y) * h;
          if (activeTool === 'highlight') {
            ctx.globalAlpha = 0.4;
            ctx.fillRect(rx, ry, rw, rh);
          } else {
            ctx.strokeRect(rx, ry, rw, rh);
          }
        } else if (activeTool === 'circle') {
          const rx = (Math.abs(last.x - startPoint.x) * w) / 2;
          const ry = (Math.abs(last.y - startPoint.y) * h) / 2;
          const cx = Math.min(startPoint.x, last.x) * w + rx;
          const cy = Math.min(startPoint.y, last.y) * h + ry;
          ctx.beginPath();
          ctx.ellipse(cx, cy, Math.abs(rx), Math.abs(ry), 0, 0, Math.PI * 2);
          ctx.stroke();
        } else if (activeTool === 'line' || activeTool === 'arrow') {
          ctx.beginPath();
          ctx.moveTo(startPoint.x * w, startPoint.y * h);
          ctx.lineTo(last.x * w, last.y * h);
          ctx.stroke();
        }
      }
      ctx.restore();
    }
  }, [annotations, pageDimensions, isDrawing, currentPoints, startPoint, activeTool, toolColor, toolThickness, scale, pageNumber, isVisible]);

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (activeTool === 'select' || activeTool === 'hand') return;

    const rect = e.currentTarget.getBoundingClientRect();
    const normX = (e.clientX - rect.left) / rect.width;
    const normY = (e.clientY - rect.top) / rect.height;

    if (activeTool === 'eraser') {
      const clicked = annotations.find(
        (a) =>
          a.pageIndex === pageNumber - 1 &&
          ((a.rect &&
            normX >= a.rect.x &&
            normX <= a.rect.x + a.rect.width &&
            normY >= a.rect.y &&
            normY <= a.rect.y + a.rect.height) ||
            (a.points &&
              a.points.some((p) => Math.hypot(p.x - normX, p.y - normY) < 0.03)))
      );
      if (clicked) {
        onDeleteAnnotation(clicked.id);
      }
      return;
    }

    if (activeTool === 'text' || activeTool === 'note') {
      setActiveTextInput({ x: normX, y: normY, text: '' });
      return;
    }

    setIsDrawing(true);
    setStartPoint({ x: normX, y: normY });
    setCurrentPoints([{ x: normX, y: normY }]);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const normX = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const normY = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));

    if (activeTool === 'pen' || activeTool === 'pencil') {
      setCurrentPoints((prev) => [...prev, { x: normX, y: normY }]);
    } else {
      setCurrentPoints([{ x: normX, y: normY }]);
    }
  };

  const handlePointerUp = () => {
    if (!isDrawing || !startPoint) {
      setIsDrawing(false);
      return;
    }

    const lastPoint = currentPoints[currentPoints.length - 1] || startPoint;

    if (activeTool === 'pen' || activeTool === 'pencil') {
      if (currentPoints.length > 1) {
        onAddAnnotation({
          id: `ann-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          pageIndex: pageNumber - 1,
          type: activeTool,
          points: currentPoints,
          color: toolColor,
          opacity: activeTool === 'pencil' ? 0.7 : 1,
          strokeWidth: toolThickness,
          createdAt: Date.now(),
        });
      }
    } else if (activeTool === 'rect' || activeTool === 'highlight') {
      const rx = Math.min(startPoint.x, lastPoint.x);
      const ry = Math.min(startPoint.y, lastPoint.y);
      const rw = Math.abs(lastPoint.x - startPoint.x);
      const rh = Math.abs(lastPoint.y - startPoint.y);

      if (rw > 0.005 && rh > 0.005) {
        onAddAnnotation({
          id: `ann-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          pageIndex: pageNumber - 1,
          type: activeTool,
          rect: { x: rx, y: ry, width: rw, height: rh },
          color: toolColor,
          opacity: activeTool === 'highlight' ? 0.5 : 1,
          strokeWidth: toolThickness,
          createdAt: Date.now(),
        });
      }
    } else if (activeTool === 'circle') {
      const rx = Math.min(startPoint.x, lastPoint.x);
      const ry = Math.min(startPoint.y, lastPoint.y);
      const rw = Math.abs(lastPoint.x - startPoint.x);
      const rh = Math.abs(lastPoint.y - startPoint.y);

      if (rw > 0.005 && rh > 0.005) {
        onAddAnnotation({
          id: `ann-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          pageIndex: pageNumber - 1,
          type: 'circle',
          rect: { x: rx, y: ry, width: rw, height: rh },
          color: toolColor,
          opacity: 1,
          strokeWidth: toolThickness,
          createdAt: Date.now(),
        });
      }
    } else if (activeTool === 'line' || activeTool === 'arrow') {
      if (Math.hypot(lastPoint.x - startPoint.x, lastPoint.y - startPoint.y) > 0.01) {
        onAddAnnotation({
          id: `ann-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          pageIndex: pageNumber - 1,
          type: activeTool,
          points: [startPoint, lastPoint],
          color: toolColor,
          opacity: 1,
          strokeWidth: toolThickness,
          createdAt: Date.now(),
        });
      }
    }

    setIsDrawing(false);
    setCurrentPoints([]);
    setStartPoint(null);
  };

  return (
    <div
      ref={containerRef}
      id={`pdf-page-${pageNumber}`}
      className={`relative mb-6 mx-auto bg-white transition-all select-none ${
        isCurrentPage ? 'ring-1 ring-blue-500/40' : ''
      }`}
      style={{
        width: pageDimensions.width,
        height: pageDimensions.height,
        boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.06), 0 2px 6px -1px rgba(0, 0, 0, 0.04)',
      }}
    >
      {/* Skeleton placeholder while page is off-viewport */}
      {!isVisible && (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800">
          <span className="text-xs text-zinc-400">Page {pageNumber}</span>
        </div>
      )}

      {/* Background Render Canvas */}
      {isVisible && (
        <>
          <canvas ref={canvasRef} className="absolute inset-0 block pointer-events-none" />
          <div ref={textLayerRef} className="textLayer" />
          <canvas
            ref={overlayCanvasRef}
            className={`absolute inset-0 z-10 ${
              activeTool === 'select'
                ? 'pointer-events-none'
                : activeTool === 'hand'
                ? 'cursor-grab'
                : activeTool === 'eraser'
                ? 'cursor-pointer'
                : 'cursor-crosshair'
            }`}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          />
        </>
      )}

      {/* Inline Text / Sticky Note Input Box */}
      {activeTextInput && (
        <div
          className="absolute z-20 flex flex-col gap-1 p-2 bg-white dark:bg-zinc-800 rounded-md shadow-lg border border-zinc-200 dark:border-zinc-700"
          style={{
            left: activeTextInput.x * pageDimensions.width,
            top: activeTextInput.y * pageDimensions.height,
            minWidth: 180,
          }}
        >
          <input
            type="text"
            autoFocus
            placeholder={activeTool === 'note' ? 'Enter sticky note...' : 'Type text...'}
            value={activeTextInput.text}
            onChange={(e) => setActiveTextInput({ ...activeTextInput, text: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && activeTextInput.text.trim()) {
                onAddAnnotation({
                  id: `ann-${Date.now()}`,
                  pageIndex: pageNumber - 1,
                  type: activeTool,
                  text: activeTextInput.text.trim(),
                  rect: {
                    x: activeTextInput.x,
                    y: activeTextInput.y,
                    width: 0.25,
                    height: 0.05,
                  },
                  color: toolColor,
                  opacity: 1,
                  strokeWidth: 1,
                  fontSize: 14,
                  createdAt: Date.now(),
                });
                setActiveTextInput(null);
              } else if (e.key === 'Escape') {
                setActiveTextInput(null);
              }
            }}
            className="w-full text-xs px-2 py-1 rounded bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <div className="flex justify-end gap-1 text-[10px] text-zinc-400">
            <span>Press Enter to place</span>
          </div>
        </div>
      )}

      {/* Page Number indicator badge */}
      <div className="absolute bottom-2 right-3 text-[10px] text-zinc-400 bg-white/80 dark:bg-zinc-900/80 px-1.5 py-0.5 rounded shadow-xs pointer-events-none border border-zinc-200/50 dark:border-zinc-800">
        {pageNumber}
      </div>
    </div>
  );
};

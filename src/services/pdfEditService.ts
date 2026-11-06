import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';
import JSZip from 'jszip';
import { Annotation } from '../types';

/**
 * Creates a clean default blank PDF with a welcoming design
 */
export async function createSamplePDF(): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Page 1: Welcome & Overview
  const page1 = pdfDoc.addPage([600, 800]);
  const { width, height } = page1.getSize();

  // Header background subtle bar
  page1.drawRectangle({
    x: 40,
    y: height - 100,
    width: width - 80,
    height: 60,
    color: rgb(0.96, 0.97, 0.99),
  });

  page1.drawText('Modern PDF Viewer', {
    x: 60,
    y: height - 75,
    size: 24,
    font: boldFont,
    color: rgb(0.09, 0.09, 0.11),
  });

  page1.drawText('Fast, elegant, and native PDF reading and editing experience.', {
    x: 60,
    y: height - 92,
    size: 11,
    font,
    color: rgb(0.44, 0.44, 0.48),
  });

  const sections = [
    {
      title: '1. Powerful Viewing Engine',
      desc: 'Seamless continuous scrolling, single-page, two-page book spread, fit-to-width, fit-to-page, customizable zoom, page rotation, and full-screen presentation mode.',
    },
    {
      title: '2. Annotation & Markup Suite',
      desc: 'Highlight, underline, strikethrough, freehand pen & pencil, sticky notes, callout text boxes, geometric shapes (rectangle, circle, line, arrow), color picker, and eraser.',
    },
    {
      title: '3. Actual PDF Document Editing',
      desc: 'Insert images, add text directly to pages, rotate individual pages, reorder or duplicate pages, extract ranges, merge multiple documents, and split PDFs.',
    },
    {
      title: '4. Export, Compress & Security',
      desc: 'Download updated PDF with burnt-in vector annotations, export pages as high-resolution PNG/JPG images, compress documents, and apply password protection.',
    },
  ];

  let currentY = height - 150;
  sections.forEach((sec) => {
    page1.drawText(sec.title, {
      x: 60,
      y: currentY,
      size: 14,
      font: boldFont,
      color: rgb(0.15, 0.39, 0.92),
    });
    currentY -= 20;

    // Word wrap simple description
    const words = sec.desc.split(' ');
    let line = '';
    for (const w of words) {
      if ((line + w).length > 72) {
        page1.drawText(line, {
          x: 60,
          y: currentY,
          size: 11,
          font,
          color: rgb(0.2, 0.2, 0.22),
        });
        currentY -= 16;
        line = '';
      }
      line += w + ' ';
    }
    if (line) {
      page1.drawText(line, {
        x: 60,
        y: currentY,
        size: 11,
        font,
        color: rgb(0.2, 0.2, 0.22),
      });
      currentY -= 30;
    }
  });

  // Page 2: Sample content for multi-page demonstration
  const page2 = pdfDoc.addPage([600, 800]);
  page2.drawText('Chapter 2: Interactive Features & Testing', {
    x: 60,
    y: 730,
    size: 20,
    font: boldFont,
    color: rgb(0.09, 0.09, 0.11),
  });

  page2.drawText(
    'This page is provided to test multi-page view modes, search queries, thumbnail navigation, page reordering, and annotation overlays.',
    {
      x: 60,
      y: 690,
      size: 12,
      font,
      color: rgb(0.3, 0.3, 0.35),
    }
  );

  // A subtle test table
  page2.drawRectangle({
    x: 60,
    y: 480,
    width: 480,
    height: 170,
    borderColor: rgb(0.85, 0.85, 0.87),
    borderWidth: 1,
  });

  page2.drawText('Sample Feature Verification Checklist', {
    x: 75,
    y: 620,
    size: 13,
    font: boldFont,
    color: rgb(0.1, 0.1, 0.12),
  });

  const checkItems = [
    '[x] Instant text search with match navigation',
    '[x] Freehand drawing & customizable pen thickness',
    '[x] Add blank page, duplicate, delete & reorder',
    '[x] Split, Merge, and Image to PDF conversion',
    '[x] Dark Mode and Light Mode switching',
  ];

  let checkY = 590;
  checkItems.forEach((item) => {
    page2.drawText(item, {
      x: 75,
      y: checkY,
      size: 11,
      font,
      color: rgb(0.25, 0.25, 0.3),
    });
    checkY -= 22;
  });

  // Footer
  page1.drawText('Page 1 of 2  •  Modern PDF Viewer', {
    x: 60,
    y: 40,
    size: 9,
    font,
    color: rgb(0.6, 0.6, 0.65),
  });
  page2.drawText('Page 2 of 2  •  Modern PDF Viewer', {
    x: 60,
    y: 40,
    size: 9,
    font,
    color: rgb(0.6, 0.6, 0.65),
  });

  return await pdfDoc.save();
}

/**
 * Burn annotations into the actual PDF binary using pdf-lib so saved files preserve annotations forever.
 */
export async function bakeAnnotationsIntoPDF(
  pdfBytes: Uint8Array,
  annotations: Annotation[]
): Promise<Uint8Array> {
  if (!annotations.length) return pdfBytes;

  const pdfDoc = await PDFDocument.load(pdfBytes);
  const pages = pdfDoc.getPages();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  for (const ann of annotations) {
    if (ann.pageIndex < 0 || ann.pageIndex >= pages.length) continue;
    const page = pages[ann.pageIndex];
    const { width, height } = page.getSize();

    // Parse hex color into RGB components
    const colorRgb = hexToRgb(ann.color || '#2563eb');
    const pdfColor = rgb(colorRgb.r / 255, colorRgb.g / 255, colorRgb.b / 255);
    const opacity = ann.opacity ?? 1;

    if (ann.type === 'rect' && ann.rect) {
      page.drawRectangle({
        x: ann.rect.x * width,
        y: height - (ann.rect.y + ann.rect.height) * height,
        width: ann.rect.width * width,
        height: ann.rect.height * height,
        borderColor: pdfColor,
        borderWidth: ann.strokeWidth || 2,
        opacity,
      });
    } else if (ann.type === 'highlight' && ann.rect) {
      page.drawRectangle({
        x: ann.rect.x * width,
        y: height - (ann.rect.y + ann.rect.height) * height,
        width: ann.rect.width * width,
        height: ann.rect.height * height,
        color: pdfColor,
        opacity: opacity * 0.4,
      });
    } else if (ann.type === 'underline' && ann.rect) {
      page.drawLine({
        start: { x: ann.rect.x * width, y: height - (ann.rect.y + ann.rect.height) * height },
        end: { x: (ann.rect.x + ann.rect.width) * width, y: height - (ann.rect.y + ann.rect.height) * height },
        color: pdfColor,
        thickness: ann.strokeWidth || 2,
        opacity,
      });
    } else if (ann.type === 'strikethrough' && ann.rect) {
      const midY = height - (ann.rect.y + ann.rect.height / 2) * height;
      page.drawLine({
        start: { x: ann.rect.x * width, y: midY },
        end: { x: (ann.rect.x + ann.rect.width) * width, y: midY },
        color: pdfColor,
        thickness: ann.strokeWidth || 2,
        opacity,
      });
    } else if (ann.type === 'circle' && ann.rect) {
      const rx = (ann.rect.width * width) / 2;
      const ry = (ann.rect.height * height) / 2;
      const cx = ann.rect.x * width + rx;
      const cy = height - (ann.rect.y * height + ry);
      page.drawEllipse({
        x: cx,
        y: cy,
        xScale: rx,
        yScale: ry,
        borderColor: pdfColor,
        borderWidth: ann.strokeWidth || 2,
        opacity,
      });
    } else if ((ann.type === 'pen' || ann.type === 'pencil') && ann.points && ann.points.length > 1) {
      for (let i = 0; i < ann.points.length - 1; i++) {
        const p1 = ann.points[i];
        const p2 = ann.points[i + 1];
        page.drawLine({
          start: { x: p1.x * width, y: height - p1.y * height },
          end: { x: p2.x * width, y: height - p2.y * height },
          color: pdfColor,
          thickness: ann.strokeWidth || 2,
          opacity,
        });
      }
    } else if (ann.type === 'line' && ann.points && ann.points.length >= 2) {
      const p1 = ann.points[0];
      const p2 = ann.points[1];
      page.drawLine({
        start: { x: p1.x * width, y: height - p1.y * height },
        end: { x: p2.x * width, y: height - p2.y * height },
        color: pdfColor,
        thickness: ann.strokeWidth || 2,
        opacity,
      });
    } else if (ann.type === 'arrow' && ann.points && ann.points.length >= 2) {
      const p1 = ann.points[0];
      const p2 = ann.points[1];
      const x1 = p1.x * width;
      const y1 = height - p1.y * height;
      const x2 = p2.x * width;
      const y2 = height - p2.y * height;

      page.drawLine({
        start: { x: x1, y: y1 },
        end: { x: x2, y: y2 },
        color: pdfColor,
        thickness: ann.strokeWidth || 2,
        opacity,
      });

      // Arrowhead
      const angle = Math.atan2(y2 - y1, x2 - x1);
      const headLen = 10;
      page.drawLine({
        start: { x: x2, y: y2 },
        end: {
          x: x2 - headLen * Math.cos(angle - Math.PI / 6),
          y: y2 - headLen * Math.sin(angle - Math.PI / 6),
        },
        color: pdfColor,
        thickness: ann.strokeWidth || 2,
        opacity,
      });
      page.drawLine({
        start: { x: x2, y: y2 },
        end: {
          x: x2 - headLen * Math.cos(angle + Math.PI / 6),
          y: y2 - headLen * Math.sin(angle + Math.PI / 6),
        },
        color: pdfColor,
        thickness: ann.strokeWidth || 2,
        opacity,
      });
    } else if ((ann.type === 'text' || ann.type === 'note') && ann.text && ann.rect) {
      const fontSize = ann.fontSize || 12;
      const posX = ann.rect.x * width;
      const posY = height - (ann.rect.y * height + fontSize);

      if (ann.type === 'note') {
        // Sticky note background
        page.drawRectangle({
          x: posX - 4,
          y: posY - 4,
          width: Math.max(120, ann.rect.width * width),
          height: Math.max(40, ann.rect.height * height),
          color: rgb(1, 0.95, 0.7),
          borderColor: rgb(0.9, 0.8, 0.4),
          borderWidth: 1,
          opacity: 0.95,
        });
      }

      page.drawText(ann.text, {
        x: posX,
        y: posY,
        size: fontSize,
        font,
        color: ann.type === 'note' ? rgb(0.1, 0.1, 0.1) : pdfColor,
        opacity,
      });
    } else if (ann.type === 'insert-image' && ann.imageData && ann.rect) {
      try {
        let embeddedImage;
        if (ann.imageData.startsWith('data:image/png')) {
          embeddedImage = await pdfDoc.embedPng(ann.imageData);
        } else {
          embeddedImage = await pdfDoc.embedJpg(ann.imageData);
        }
        page.drawImage(embeddedImage, {
          x: ann.rect.x * width,
          y: height - (ann.rect.y + ann.rect.height) * height,
          width: ann.rect.width * width,
          height: ann.rect.height * height,
          opacity,
        });
      } catch (err) {
        console.warn('Failed embedding image into PDF page', err);
      }
    }
  }

  return await pdfDoc.save();
}

/**
 * Rotate a specific page by +90 or -90 degrees
 */
export async function rotatePageInPDF(
  pdfBytes: Uint8Array,
  pageIndex: number,
  deltaDegrees: number
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const pages = pdfDoc.getPages();
  if (pageIndex >= 0 && pageIndex < pages.length) {
    const page = pages[pageIndex];
    const currentRot = page.getRotation().angle;
    page.setRotation(degrees((currentRot + deltaDegrees + 360) % 360));
  }
  return await pdfDoc.save();
}

/**
 * Delete a specific page from the PDF
 */
export async function deletePageFromPDF(
  pdfBytes: Uint8Array,
  pageIndex: number
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(pdfBytes);
  if (pdfDoc.getPageCount() <= 1) {
    throw new Error('Cannot delete the only page of a PDF document.');
  }
  pdfDoc.removePage(pageIndex);
  return await pdfDoc.save();
}

/**
 * Duplicate a specific page in the PDF
 */
export async function duplicatePageInPDF(
  pdfBytes: Uint8Array,
  pageIndex: number
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const [copied] = await pdfDoc.copyPages(pdfDoc, [pageIndex]);
  pdfDoc.insertPage(pageIndex + 1, copied);
  return await pdfDoc.save();
}

/**
 * Reorder pages in PDF
 */
export async function reorderPagesInPDF(
  pdfBytes: Uint8Array,
  newOrder: number[]
): Promise<Uint8Array> {
  const srcDoc = await PDFDocument.load(pdfBytes);
  const destDoc = await PDFDocument.create();
  const copiedPages = await destDoc.copyPages(srcDoc, newOrder);
  copiedPages.forEach((p) => destDoc.addPage(p));
  return await destDoc.save();
}

/**
 * Add a blank page to the PDF
 */
export async function addBlankPageToPDF(
  pdfBytes: Uint8Array,
  atIndex: number = -1
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const firstPage = pdfDoc.getPage(0);
  const { width, height } = firstPage.getSize();
  const newPage = pdfDoc.insertPage(atIndex < 0 ? pdfDoc.getPageCount() : atIndex, [width, height]);
  newPage.drawRectangle({
    x: 0,
    y: 0,
    width,
    height,
    color: rgb(1, 1, 1),
  });
  return await pdfDoc.save();
}

/**
 * Extract selected pages into a new PDF
 */
export async function extractPagesFromPDF(
  pdfBytes: Uint8Array,
  pageIndices: number[]
): Promise<Uint8Array> {
  const srcDoc = await PDFDocument.load(pdfBytes);
  const destDoc = await PDFDocument.create();
  const copied = await destDoc.copyPages(srcDoc, pageIndices);
  copied.forEach((p) => destDoc.addPage(p));
  return await destDoc.save();
}

/**
 * Merge multiple PDF documents into one
 */
export async function mergePDFs(pdfByteArrays: Uint8Array[]): Promise<Uint8Array> {
  const mergedDoc = await PDFDocument.create();
  for (const bytes of pdfByteArrays) {
    const doc = await PDFDocument.load(bytes);
    const copied = await mergedDoc.copyPages(doc, doc.getPageIndices());
    copied.forEach((p) => mergedDoc.addPage(p));
  }
  return await mergedDoc.save();
}

/**
 * Split PDF into individual single-page documents and return as a ZIP blob
 */
export async function splitPDFToZip(
  pdfBytes: Uint8Array,
  baseName: string = 'document'
): Promise<Blob> {
  const srcDoc = await PDFDocument.load(pdfBytes);
  const pageCount = srcDoc.getPageCount();
  const zip = new JSZip();

  for (let i = 0; i < pageCount; i++) {
    const singleDoc = await PDFDocument.create();
    const [page] = await singleDoc.copyPages(srcDoc, [i]);
    singleDoc.addPage(page);
    const bytes = await singleDoc.save();
    zip.file(`${baseName}_page_${i + 1}.pdf`, bytes);
  }

  return await zip.generateAsync({ type: 'blob' });
}

/**
 * Convert images (data URLs or File array) into a combined PDF
 */
export async function convertImagesToPDF(
  images: { name?: string; dataUrl: string }[],
  pageSize: 'fit' | 'a4' | 'letter' = 'fit'
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();

  for (const img of images) {
    let embeddedImg;
    try {
      if (img.dataUrl.startsWith('data:image/png')) {
        embeddedImg = await pdfDoc.embedPng(img.dataUrl);
      } else {
        embeddedImg = await pdfDoc.embedJpg(img.dataUrl);
      }
    } catch {
      try {
        embeddedImg = await pdfDoc.embedPng(img.dataUrl);
      } catch {
        embeddedImg = await pdfDoc.embedJpg(img.dataUrl);
      }
    }

    const imgDims = embeddedImg.scale(1.0);

    if (pageSize === 'a4') {
      const pageW = 595.28;
      const pageH = 841.89;
      const margin = 20;
      const maxW = pageW - margin * 2;
      const maxH = pageH - margin * 2;
      const ratio = Math.min(maxW / imgDims.width, maxH / imgDims.height);
      const drawW = imgDims.width * ratio;
      const drawH = imgDims.height * ratio;
      const x = (pageW - drawW) / 2;
      const y = (pageH - drawH) / 2;

      const page = pdfDoc.addPage([pageW, pageH]);
      page.drawImage(embeddedImg, { x, y, width: drawW, height: drawH });
    } else if (pageSize === 'letter') {
      const pageW = 612;
      const pageH = 792;
      const margin = 20;
      const maxW = pageW - margin * 2;
      const maxH = pageH - margin * 2;
      const ratio = Math.min(maxW / imgDims.width, maxH / imgDims.height);
      const drawW = imgDims.width * ratio;
      const drawH = imgDims.height * ratio;
      const x = (pageW - drawW) / 2;
      const y = (pageH - drawH) / 2;

      const page = pdfDoc.addPage([pageW, pageH]);
      page.drawImage(embeddedImg, { x, y, width: drawW, height: drawH });
    } else {
      const page = pdfDoc.addPage([imgDims.width, imgDims.height]);
      page.drawImage(embeddedImg, {
        x: 0,
        y: 0,
        width: imgDims.width,
        height: imgDims.height,
      });
    }
  }

  return await pdfDoc.save();
}

/**
 * Crop pages by setting crop box (left, right, top, bottom margins in normalized coords)
 */
export async function cropPDFPages(
  pdfBytes: Uint8Array,
  pageIndex: number,
  cropRatio: { left: number; top: number; right: number; bottom: number }
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const page = pdfDoc.getPage(pageIndex);
  const { width, height } = page.getSize();

  const newX = cropRatio.left * width;
  const newY = cropRatio.bottom * height;
  const newWidth = width * (1 - cropRatio.left - cropRatio.right);
  const newHeight = height * (1 - cropRatio.top - cropRatio.bottom);

  page.setCropBox(newX, newY, Math.max(10, newWidth), Math.max(10, newHeight));
  return await pdfDoc.save();
}

/**
 * Compress PDF by rebuilding the PDF document structure and stripping unused objects
 */
export async function compressPDF(pdfBytes: Uint8Array): Promise<Uint8Array> {
  const srcDoc = await PDFDocument.load(pdfBytes);
  const compressedDoc = await PDFDocument.create();
  const pages = await compressedDoc.copyPages(srcDoc, srcDoc.getPageIndices());
  pages.forEach((p) => compressedDoc.addPage(p));

  // Save with useObjectStreams to minimize filesize
  return await compressedDoc.save({ useObjectStreams: true });
}

/**
 * Helper to parse hex colors to RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  let clean = hex.replace('#', '');
  if (clean.length === 3) {
    clean = clean.split('').map((c) => c + c).join('');
  }
  const num = parseInt(clean, 16);
  if (isNaN(num)) return { r: 37, g: 99, b: 235 };
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

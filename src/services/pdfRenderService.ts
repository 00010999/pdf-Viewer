import { pdfjsLib } from './pdfWorker';
import type { PDFMetadata, DocumentOutlineItem, SearchMatch } from '../types';

export interface PDFLoadResult {
  pdfDoc: any;
  metadata: PDFMetadata;
  outline: DocumentOutlineItem[];
  totalPages: number;
}

/**
 * Loads a PDF document from raw Uint8Array buffer
 */
export async function loadPDFDocument(
  data: Uint8Array,
  password?: string
): Promise<PDFLoadResult> {
  const loadingTask = pdfjsLib.getDocument({
    data: data.slice(0), // copy buffer so pdfjs doesn't detach original
    password,
    cMapUrl: './cmaps/',
    cMapPacked: true,
  });

  const pdfDoc = await loadingTask.promise;
  const totalPages = pdfDoc.numPages;

  // Extract Metadata
  let metadata: PDFMetadata = {
    pageCount: totalPages,
    fileSize: data.byteLength,
  };

  try {
    const metaObj = await pdfDoc.getMetadata();
    const info = (metaObj?.info as any) || {};
    metadata = {
      title: info.Title || undefined,
      author: info.Author || undefined,
      subject: info.Subject || undefined,
      keywords: info.Keywords || undefined,
      creator: info.Creator || undefined,
      producer: info.Producer || undefined,
      creationDate: info.CreationDate || undefined,
      modDate: info.ModDate || undefined,
      pageCount: totalPages,
      fileSize: data.byteLength,
    };
  } catch (e) {
    console.warn('Could not read PDF metadata', e);
  }

  // Extract Outline / Bookmarks
  let outline: DocumentOutlineItem[] = [];
  try {
    const rawOutline = await pdfDoc.getOutline();
    if (rawOutline && rawOutline.length > 0) {
      outline = await parseOutline(pdfDoc, rawOutline);
    }
  } catch (e) {
    console.warn('Could not parse outline', e);
  }

  return { pdfDoc, metadata, outline, totalPages };
}

async function parseOutline(pdfDoc: any, items: any[]): Promise<DocumentOutlineItem[]> {
  const result: DocumentOutlineItem[] = [];
  for (const item of items) {
    let pageIndex = 0;
    try {
      if (typeof item.dest === 'string') {
        const dest = await pdfDoc.getDestination(item.dest);
        if (dest) {
          pageIndex = await pdfDoc.getPageIndex(dest[0]);
        }
      } else if (Array.isArray(item.dest)) {
        pageIndex = await pdfDoc.getPageIndex(item.dest[0]);
      }
    } catch {
      pageIndex = 0;
    }

    const parsed: DocumentOutlineItem = {
      title: item.title || 'Untitled',
      pageIndex,
      items: item.items && item.items.length > 0 ? await parseOutline(pdfDoc, item.items) : undefined,
    };
    result.push(parsed);
  }
  return result;
}

/**
 * Render a single page thumbnail as high quality data URL
 */
export async function renderPageThumbnail(
  pdfDoc: any,
  pageNumber: number,
  scale: number = 0.3
): Promise<string> {
  const page = await pdfDoc.getPage(pageNumber);
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  canvas.width = viewport.width;
  canvas.height = viewport.height;

  if (context) {
    await page.render({
      canvasContext: context,
      viewport,
    }).promise;
  }

  return canvas.toDataURL('image/jpeg', 0.8);
}

/**
 * Searches the entire PDF document for query text
 */
export async function searchPDFDocument(
  pdfDoc: any,
  query: string,
  options: { caseSensitive?: boolean; wholeWord?: boolean } = {}
): Promise<SearchMatch[]> {
  if (!query || !query.trim()) return [];

  const matches: SearchMatch[] = [];
  const normalizedQuery = options.caseSensitive ? query : query.toLowerCase();
  const pageCount = pdfDoc.numPages;

  for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
    const page = await pdfDoc.getPage(pageNum);
    const textContent = await page.getTextContent();
    const fullPageText = textContent.items
      .map((item: any) => item.str)
      .join(' ');

    const textToSearch = options.caseSensitive ? fullPageText : fullPageText.toLowerCase();

    let matchIdx = 0;
    let pos = 0;

    while (pos < textToSearch.length) {
      const foundPos = textToSearch.indexOf(normalizedQuery, pos);
      if (foundPos === -1) break;

      // Whole word validation if enabled
      if (options.wholeWord) {
        const before = foundPos > 0 ? textToSearch[foundPos - 1] : ' ';
        const after = foundPos + normalizedQuery.length < textToSearch.length ? textToSearch[foundPos + normalizedQuery.length] : ' ';
        const isWordBoundary = /\W/.test(before) && /\W/.test(after);
        if (!isWordBoundary) {
          pos = foundPos + 1;
          continue;
        }
      }

      matches.push({
        pageIndex: pageNum - 1,
        matchIndex: matchIdx++,
        text: fullPageText.substring(Math.max(0, foundPos - 20), Math.min(fullPageText.length, foundPos + normalizedQuery.length + 20)),
      });

      pos = foundPos + normalizedQuery.length;
    }
  }

  return matches;
}

/**
 * Calculate approximate word and character counts across entire PDF
 */
export async function calculateDocumentStats(pdfDoc: any): Promise<{ wordCount: number; charCount: number }> {
  let wordCount = 0;
  let charCount = 0;
  const pageCount = pdfDoc.numPages;

  for (let i = 1; i <= Math.min(pageCount, 100); i++) {
    try {
      const page = await pdfDoc.getPage(i);
      const content = await page.getTextContent();
      const text = content.items.map((it: any) => it.str).join(' ');
      charCount += text.length;
      wordCount += (text.match(/\b\S+\b/g) || []).length;
    } catch {
      // Continue if one page fails
    }
  }

  return { wordCount, charCount };
}

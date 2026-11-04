import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.js?url';

// In Electron file:// or packaged protocol, absolute URLs like '/pdf.worker.min.js' resolve to 'file:///pdf.worker.min.js'
// which does not exist. Using Vite's bundled worker URL resolves correctly in all desktop environments.
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
}

export { pdfjsLib };

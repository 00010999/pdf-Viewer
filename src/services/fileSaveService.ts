import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';

/**
 * Convert Uint8Array to base64 string safely without call-stack overflow limits
 */
export function uint8ArrayToBase64(bytes: Uint8Array): Promise<string> {
  return new Promise((resolve) => {
    if (typeof FileReader !== 'undefined') {
      const blob = new Blob([bytes as any], { type: 'application/pdf' });
      const reader = new FileReader();
      reader.onloadend = () => {
        const res = (reader.result as string) || '';
        const commaIdx = res.indexOf(',');
        resolve(commaIdx >= 0 ? res.substring(commaIdx + 1) : res);
      };
      reader.onerror = () => {
        resolve(uint8ArrayToBase64Loop(bytes));
      };
      reader.readAsDataURL(blob);
    } else {
      resolve(uint8ArrayToBase64Loop(bytes));
    }
  });
}

function uint8ArrayToBase64Loop(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Universal file save and export function that works on:
 * - Android Phones (Capacitor Cache/Documents + Native FileProvider Share sheet)
 * - Windows PC (Electron native Save As file dialog)
 * - Mobile Web (Web Share API)
 * - Desktop Browser (Direct file download with 30s blob retention)
 */
export async function saveOrExportPDF(
  pdfBytes: Uint8Array,
  fileName: string
): Promise<{ success: boolean; method: string; path?: string }> {
  const safeName = fileName.trim()
    ? fileName.trim().toLowerCase().endsWith('.pdf')
      ? fileName.trim()
      : `${fileName.trim()}.pdf`
    : 'document.pdf';

  // 1. Desktop App (Electron on Windows/Mac/Linux)
  if (typeof window !== 'undefined' && (window as any).electronAPI?.savePDFDialog) {
    try {
      const base64Data = await uint8ArrayToBase64(pdfBytes);
      const saved = await (window as any).electronAPI.savePDFDialog({
        defaultName: safeName,
        fileBase64: base64Data,
      });
      return { success: !!saved, method: 'electron' };
    } catch (err) {
      console.warn('Electron save dialog failed, falling back:', err);
    }
  }

  // 2. Android / iOS Native Capacitor App
  if (Capacitor.isNativePlatform()) {
    try {
      const base64Data = await uint8ArrayToBase64(pdfBytes);

      // Step A: Write to Cache (Always writable, no permissions required on any Android version)
      let cacheUri = '';
      try {
        const cacheRes = await Filesystem.writeFile({
          path: safeName,
          data: base64Data,
          directory: Directory.Cache,
          recursive: true,
        });
        cacheUri = cacheRes.uri;
      } catch (cErr) {
        console.warn('Cache write failed:', cErr);
      }

      // Step B: Also attempt writing to Documents (works on Android with legacy storage)
      let docUri = '';
      try {
        const docRes = await Filesystem.writeFile({
          path: safeName,
          data: base64Data,
          directory: Directory.Documents,
          recursive: true,
        });
        docUri = docRes.uri;
      } catch (dErr) {
        console.warn('Documents write failed (normal on scoped storage):', dErr);
      }

      const fileToShare = docUri || cacheUri;
      if (fileToShare) {
        // Step C: Trigger native Android FileProvider Share Sheet
        // On Android, passing `files` with a file:// or content:// URI launches the system chooser
        // with "Save to device / Downloads / Drive / etc."
        try {
          await Share.share({
            title: safeName,
            files: [fileToShare],
            dialogTitle: `Save or Share ${safeName}`,
          });
          return { success: true, method: 'capacitor_native', path: fileToShare };
        } catch (shareErr: any) {
          if (
            shareErr?.name === 'AbortError' ||
            shareErr?.message?.includes('canceled') ||
            shareErr?.message?.includes('cancelled')
          ) {
            return { success: true, method: 'share_canceled' };
          }
          console.warn('Native Share failed after file write, attempting web share fallback:', shareErr);
          try {
            const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
            const file = new File([blob], safeName, { type: 'application/pdf' });
            if (typeof navigator !== 'undefined' && navigator.canShare && navigator.canShare({ files: [file] })) {
              await navigator.share({
                files: [file],
                title: safeName,
              });
              return { success: true, method: 'web_share_fallback' };
            }
          } catch (webShareErr) {
            console.warn('Web share fallback failed:', webShareErr);
          }
          // File was written to local storage
          return { success: true, method: 'capacitor_file_written', path: fileToShare };
        }
      }
    } catch (capErr: any) {
      console.error('Capacitor native filesystem error:', capErr);
    }
  }

  // 3. Mobile Web Browser (Web Share API)
  const isMobile = typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
  const file = new File([blob], safeName, { type: 'application/pdf' });

  if (isMobile && typeof navigator !== 'undefined' && navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        files: [file],
        title: safeName,
        text: `PDF: ${safeName}`,
      });
      return { success: true, method: 'web_share' };
    } catch (shareErr: any) {
      if (shareErr.name === 'AbortError') {
        return { success: true, method: 'share_canceled' };
      }
      console.warn('Web Share failed, falling back to download:', shareErr);
    }
  }

  // 4. Standard Browser File Download (PC Browser / Fallback)
  try {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = safeName;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();

    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 30000);

    return { success: true, method: 'browser_download' };
  } catch (dlErr) {
    console.error('All save methods failed:', dlErr);
    return { success: false, method: 'failed' };
  }
}

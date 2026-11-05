import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

/**
 * Convert Uint8Array to base64 string safely in chunks
 */
export function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunkSize)));
  }
  return btoa(binary);
}

/**
 * Universal file save and export function that works seamlessly on:
 * - Windows PC (Electron native Save As file dialog)
 * - Android Phones (Capacitor Filesystem Documents folder + Native Share Sheet)
 * - Mobile Web (Web Share API)
 * - Desktop Browser (Browser direct file download with delayed URL revocation)
 */
export async function saveOrExportPDF(
  pdfBytes: Uint8Array,
  fileName: string
): Promise<{ success: boolean; method: string }> {
  const safeName = fileName.trim()
    ? fileName.trim().toLowerCase().endsWith('.pdf')
      ? fileName.trim()
      : `${fileName.trim()}.pdf`
    : 'document.pdf';

  // 1. Desktop App (Electron)
  if (typeof window !== 'undefined' && (window as any).electronAPI?.savePDFDialog) {
    try {
      const base64Data = uint8ArrayToBase64(pdfBytes);
      const saved = await (window as any).electronAPI.savePDFDialog({
        defaultName: safeName,
        fileBase64: base64Data,
      });
      return { success: !!saved, method: 'electron' };
    } catch (err) {
      console.warn('Electron save dialog failed, trying browser download:', err);
    }
  }

  // 2. Android / iOS Native Capacitor App
  try {
    const base64Data = uint8ArrayToBase64(pdfBytes);
    // Write directly to Documents directory on Android
    const writeResult = await Filesystem.writeFile({
      path: safeName,
      data: base64Data,
      directory: Directory.Documents,
      recursive: true,
    });

    if (writeResult && writeResult.uri) {
      // Also open the native Android Share/Save sheet so user can save/view anywhere
      try {
        await Share.share({
          title: safeName,
          text: `PDF: ${safeName}`,
          url: writeResult.uri,
          dialogTitle: `Save or Share ${safeName}`,
        });
      } catch (shareErr: any) {
        // User may have dismissed share dialog, file is still saved in Documents
        console.log('Share dismissed or completed:', shareErr);
      }
      return { success: true, method: 'capacitor_filesystem' };
    }
  } catch (capErr) {
    // If Capacitor is not native platform (e.g. running in standard browser), proceed to Web Share / Blob download
    console.log('Capacitor native filesystem not available, falling back to Web API:', capErr);
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
        // User intentionally cancelled share sheet
        return { success: false, method: 'share_canceled' };
      }
      console.warn('Web Share failed, attempting direct download:', shareErr);
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

    // Do NOT revoke immediately! Keep alive for 30 seconds so download completes
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

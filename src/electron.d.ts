/// <reference types="vite/client" />

interface Window {
  electronAPI?: {
    openPDFDialog: () => Promise<{
      filePath: string;
      fileName: string;
      fileBase64?: string;
      fileBytes?: number[];
      fileSize?: number;
    } | null>;
    savePDFDialog: (options: {
      defaultName: string;
      fileBase64?: string;
      fileBytes?: number[];
    }) => Promise<boolean>;
    getInitialFile: () => Promise<{
      filePath: string;
      fileName: string;
      fileBase64?: string;
      fileBytes?: number[];
      fileSize?: number;
    } | null>;
    setThemeSource?: (theme: string) => Promise<boolean>;
    isElectron: boolean;
  };
}

export interface RecentDocument {
  id: string;
  name: string;
  size: number;
  lastModified: number;
  lastOpened: number;
  lastPage: number;
  totalPages: number;
  thumbnail?: string;
  isFavorite: boolean;
  notes?: string;
  bookmarks?: number[];
  dataBase64?: string; // Cache small PDFs in IndexedDB / LocalStorage if available
}

export type ViewMode = 'single' | 'continuous' | 'spread';

export type ZoomPreset = 'fit-width' | 'fit-page' | 'actual' | number;

export type ToolMode = 
  | 'select'
  | 'hand'
  | 'highlight'
  | 'underline'
  | 'strikethrough'
  | 'text'
  | 'note'
  | 'pen'
  | 'pencil'
  | 'eraser'
  | 'rect'
  | 'circle'
  | 'arrow'
  | 'line'
  | 'insert-image';

export interface AnnotationPoint {
  x: number; // 0.0 to 1.0 (normalized coordinate relative to page width)
  y: number; // 0.0 to 1.0 (normalized coordinate relative to page height)
}

export interface Annotation {
  id: string;
  pageIndex: number; // 0-indexed
  type: ToolMode;
  points?: AnnotationPoint[]; // For drawing / line / arrow
  rect?: {
    x: number; // normalized
    y: number; // normalized
    width: number; // normalized
    height: number; // normalized
  };
  color: string;
  opacity: number;
  strokeWidth: number;
  text?: string;
  fontSize?: number;
  imageData?: string; // For inserted images
  createdAt: number;
}

export interface SearchMatch {
  pageIndex: number;
  matchIndex: number;
  text: string;
  rects?: { x: number; y: number; width: number; height: number }[];
}

export interface DocumentOutlineItem {
  title: string;
  pageIndex: number;
  items?: DocumentOutlineItem[];
}

export interface PDFMetadata {
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string;
  creator?: string;
  producer?: string;
  creationDate?: string;
  modDate?: string;
  pageSize?: string;
  pageCount: number;
  fileSize: number;
  wordCount?: number;
  charCount?: number;
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  defaultZoom: ZoomPreset;
  defaultViewMode: ViewMode;
  scrollDirection: 'vertical' | 'horizontal';
  autoSaveAnnotations: boolean;
  enableKeyboardShortcuts: boolean;
  rememberLastPosition: boolean;
}

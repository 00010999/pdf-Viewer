import type { AppSettings, RecentDocument } from '../types';

const STORAGE_KEY_RECENT = 'modern_pdf_recent_docs';
const STORAGE_KEY_SETTINGS = 'modern_pdf_settings';
const DB_NAME = 'ModernPDFDB';
const DB_VERSION = 1;
const STORE_NAME = 'pdf_files';

export const defaultSettings: AppSettings = {
  theme: 'system',
  defaultZoom: 'fit-width',
  defaultViewMode: 'continuous',
  scrollDirection: 'vertical',
  autoSaveAnnotations: true,
  enableKeyboardShortcuts: true,
  rememberLastPosition: true,
};

function openIndexedDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function storePDFData(id: string, data: Uint8Array): Promise<void> {
  try {
    const db = await openIndexedDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(data, id);
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (e) {
    console.error('Failed to store PDF data in IndexedDB', e);
  }
}

export async function getPDFData(id: string): Promise<Uint8Array | null> {
  try {
    const db = await openIndexedDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).get(id);
    return new Promise((resolve, reject) => {
      req.onsuccess = () => resolve(req.result ? (req.result as Uint8Array) : null);
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    console.error('Failed to retrieve PDF data from IndexedDB', e);
    return null;
  }
}

export async function removePDFData(id: string): Promise<void> {
  try {
    const db = await openIndexedDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(id);
  } catch (e) {
    console.error('Failed to remove PDF data from IndexedDB', e);
  }
}

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SETTINGS);
    if (!raw) return defaultSettings;
    return { ...defaultSettings, ...JSON.parse(raw) };
  } catch {
    return defaultSettings;
  }
}

export function saveSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings', e);
  }
}

export function loadRecentDocs(): RecentDocument[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_RECENT);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveRecentDocs(docs: RecentDocument[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_RECENT, JSON.stringify(docs));
  } catch (e) {
    console.error('Failed to save recent documents list', e);
  }
}

export function addOrUpdateRecentDoc(doc: Partial<RecentDocument> & { id: string; name: string }): RecentDocument[] {
  const docs = loadRecentDocs();
  const existing = docs.find((d) => d.id === doc.id);
  const updatedDoc: RecentDocument = {
    id: doc.id,
    name: doc.name,
    size: doc.size ?? existing?.size ?? 0,
    lastModified: doc.lastModified ?? existing?.lastModified ?? Date.now(),
    lastOpened: Date.now(),
    lastPage: doc.lastPage ?? existing?.lastPage ?? 1,
    totalPages: doc.totalPages ?? existing?.totalPages ?? 1,
    thumbnail: doc.thumbnail ?? existing?.thumbnail,
    isFavorite: doc.isFavorite ?? existing?.isFavorite ?? false,
    bookmarks: doc.bookmarks ?? existing?.bookmarks ?? [],
    notes: doc.notes ?? existing?.notes ?? '',
  };

  const remaining = docs.filter((d) => d.id !== doc.id);
  const newDocs = [updatedDoc, ...remaining].slice(0, 50);
  saveRecentDocs(newDocs);
  return newDocs;
}

export function toggleFavoriteDoc(id: string): RecentDocument[] {
  const docs = loadRecentDocs();
  const updated = docs.map((d) => (d.id === id ? { ...d, isFavorite: !d.isFavorite } : d));
  saveRecentDocs(updated);
  return updated;
}

export function removeRecentDoc(id: string): RecentDocument[] {
  const docs = loadRecentDocs();
  const filtered = docs.filter((d) => d.id !== id);
  saveRecentDocs(filtered);
  removePDFData(id);
  return filtered;
}

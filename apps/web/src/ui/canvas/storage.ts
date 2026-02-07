import type { CanvasDocument } from './types';

const KEY = 'zones_canvas_doc_v1';

export function loadDoc(): CanvasDocument | null {
  const raw = localStorage.getItem(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as CanvasDocument;
  } catch {
    return null;
  }
}

export function saveDoc(doc: CanvasDocument) {
  localStorage.setItem(KEY, JSON.stringify(doc));
}

export function clearDoc() {
  localStorage.removeItem(KEY);
}

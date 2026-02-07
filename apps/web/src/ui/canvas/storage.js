const KEY = 'zones_canvas_doc_v1';
export function loadDoc() {
    const raw = localStorage.getItem(KEY);
    if (!raw)
        return null;
    try {
        return JSON.parse(raw);
    }
    catch {
        return null;
    }
}
export function saveDoc(doc) {
    localStorage.setItem(KEY, JSON.stringify(doc));
}
export function clearDoc() {
    localStorage.removeItem(KEY);
}

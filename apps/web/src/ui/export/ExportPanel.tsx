import type * as fabric from 'fabric';
import { jsPDF } from 'jspdf';

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

export function ExportPanel({ canvas }: { canvas: fabric.Canvas | null }) {
  async function exportJSON() {
    if (!canvas) return;
    const json = canvas.toDatalessJSON();
    downloadBlob(new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' }), 'board.json');
  }

  async function exportPNG() {
    if (!canvas) return;
    const dataUrl = canvas.toDataURL({ format: 'png', multiplier: 2 });
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    downloadBlob(blob, 'board.png');
  }

  async function exportSVG() {
    if (!canvas) return;
    const svg = canvas.toSVG();
    downloadBlob(new Blob([svg], { type: 'image/svg+xml' }), 'board.svg');
  }

  async function exportPDF() {
    if (!canvas) return;
    const dataUrl = canvas.toDataURL({ format: 'png', multiplier: 2 });
    const img = new Image();
    img.src = dataUrl;
    await new Promise((r) => (img.onload = r));
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    // fit image to page with margins
    const margin = 24;
    const maxW = pageW - margin * 2;
    const maxH = pageH - margin * 2;
    const ratio = Math.min(maxW / img.width, maxH / img.height);
    const w = img.width * ratio;
    const h = img.height * ratio;
    pdf.addImage(dataUrl, 'PNG', margin, margin, w, h);
    pdf.save('board.pdf');
  }

  async function importJSON(file: File) {
    if (!canvas) return;
    const text = await file.text();
    const json = JSON.parse(text);
    await canvas.loadFromJSON(json);
    canvas.renderAll();
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="text-sm font-semibold">Import / Export</div>
      <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">PNG • PDF • SVG • JSON</div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-medium text-white hover:opacity-90 dark:bg-slate-50 dark:text-slate-950"
          onClick={exportPNG}
          disabled={!canvas}
        >
          Export PNG
        </button>
        <button
          type="button"
          className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-medium text-white hover:opacity-90 dark:bg-slate-50 dark:text-slate-950"
          onClick={exportPDF}
          disabled={!canvas}
        >
          Export PDF
        </button>

        <button
          type="button"
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-800/40"
          onClick={exportSVG}
          disabled={!canvas}
        >
          Export SVG
        </button>
        <button
          type="button"
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-800/40"
          onClick={exportJSON}
          disabled={!canvas}
        >
          Export JSON
        </button>

        <label className="col-span-2 block">
          <span className="sr-only">Import JSON</span>
          <input
            type="file"
            accept="application/json"
            className="block w-full cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-900 file:px-3 file:py-2 file:text-xs file:text-white dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:file:bg-slate-50 dark:file:text-slate-950"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) importJSON(f);
            }}
            disabled={!canvas}
          />
        </label>
      </div>
    </div>
  );
}

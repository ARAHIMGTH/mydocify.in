/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { PDFDocument } from 'pdf-lib';
import { PdfPage, renderThumb, downloadImage, formatBytes, HistoryFile } from '../../types';
import UploadZone from '../UploadZone';
import PageGrid from '../PageGrid';

interface Pdf2ImgToolProps {
  onAddHistory: (item: { name: string; tool: string; size: string; files?: HistoryFile[] }) => void;
  onToast: (msg: string, type?: 'ok' | 'err') => void;
  initialFiles?: File[];
}

export default function Pdf2ImgTool({ onAddHistory, onToast, initialFiles }: Pdf2ImgToolProps) {
  const [pages, setPages] = useState<PdfPage[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (initialFiles && initialFiles.length > 0) {
      loadFiles(initialFiles);
    }
  }, [initialFiles]);
  const [dpi, setDpi] = useState(150);

  const loadFiles = async (files: File[]) => {
    setBusy(true);
    try {
      let accumulatedPages: PdfPage[] = [];
      const f = files[0];
      const arrayBuffer = await f.arrayBuffer();
      const docBytes = new Uint8Array(arrayBuffer);
      const doc = await PDFDocument.load(docBytes, { ignoreEncryption: true });

      const count = doc.getPageCount();
      for (let i = 0; i < count; i++) {
        accumulatedPages.push({
          id: Math.random().toString(36).substring(2, 11),
          fileName: f.name,
          data: docBytes,
          pageIndex: i,
          preview: null,
        });
      }

      setPages(accumulatedPages);
      setBusy(false);

      // Previews
      for (const p of accumulatedPages) {
        const pv = await renderThumb(p.data, p.pageIndex);
        setPages((current) =>
          current.map((x) => (x.id === p.id ? { ...x, preview: pv } : x))
        );
      }
    } catch (err: any) {
      onToast(err?.message || 'Error parsing document pages.', 'err');
      setBusy(false);
    }
  };

  const handleExportImages = async () => {
    if (!pages.length) return;
    setBusy(true);
    try {
      const scale = dpi / 96;
      let count = 0;

      const pdfjs = (window as any).pdfjsLib;
      if (!pdfjs) {
        onToast('PDF.js renderer is loading. Please try again.', 'err');
        setBusy(false);
        return;
      }

      const exportedFiles: HistoryFile[] = [];
      for (const p of pages) {
        const loadingTask = pdfjs.getDocument({ data: p.data.slice(0) });
        const pdf = await loadingTask.promise;
        const page = await pdf.getPage(p.pageIndex + 1);
        const viewport = page.getViewport({ scale });

        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');

        if (ctx) {
          await page.render({ canvasContext: ctx, viewport }).promise;
          const imgDataUrl = canvas.toDataURL('image/png');
          const safeName = `mydocify_exported_page_${p.pageIndex + 1}.png`;
          downloadImage(imgDataUrl, safeName);
          exportedFiles.push({ name: safeName, dataUrl: imgDataUrl });
          count++;
          // High-fidelity rate spacing
          await new Promise((resolve) => setTimeout(resolve, 200));
        }
      }

      onAddHistory({
        name: `${count} PNG images`,
        tool: 'PDF to Images',
        size: `${count} files`,
        files: exportedFiles,
      });

      onToast(`Successfully rendered and exported ${count} high-fidelity PNG image(s)!`);
      setPages([]);
    } catch (err: any) {
      onToast(err?.message || 'Failed rendering high resolution images.', 'err');
    }
    setBusy(false);
  };

  const estimatedMbs = Math.round(pages.length * (dpi / 96) * 0.28);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_250px] gap-6">
      <div className="flex flex-col gap-4">
        {!pages.length ? (
          <UploadZone onFiles={loadFiles} multiple={false} />
        ) : busy ? (
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-12 flex items-center justify-center min-h-[300px]">
            <div className="flex flex-col items-center gap-4">
              <div className="spinner" />
              <p className="text-sm font-semibold text-[var(--muted)]">Rendering high-res print files...</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5">
              <div className="max-h-[420px] overflow-y-auto custom-scroll p-1 border border-[var(--border)] rounded-xl bg-[var(--surface2)]/40">
                <PageGrid pages={pages} setPages={setPages} />
              </div>
            </div>

            <button
              type="button"
              onClick={handleExportImages}
              className="glow-btn w-full py-3.5"
              disabled={busy}
            >
              Export All Pages as PNG Images
            </button>
          </div>
        )}
      </div>

      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 h-fit flex flex-col gap-4">
        <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
          Export Settings
        </p>

        <div className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-semibold text-[var(--muted)] block mb-1.5 flex justify-between">
              <span>Resolution DPI</span>
              <span className="font-mono text-xs">{dpi} DPI</span>
            </label>
            <input
              type="range"
              min="72"
              max="300"
              step="1"
              value={dpi}
              onChange={(e) => setDpi(parseInt(e.target.value))}
              className="w-full accent-[var(--accent)]"
            />
            <div className="flex justify-between text-[10px] text-[var(--muted)] mt-1 tracking-wide font-medium">
              <span>72 Web</span>
              <span>150 Print</span>
              <span>300 HD</span>
            </div>
          </div>

          <div className="bg-[var(--surface2)] rounded-xl p-4 text-xs text-[var(--muted)] leading-relaxed border border-[var(--border)]">
            Format: <b className="text-[var(--text)]">PNG (Lossless)</b>
            <br />
            Total Pages:{' '}
            <b className="text-[var(--text)]">{pages.length ? pages.length : '—'}</b>
            <br />
            Approx. disk footprint:{' '}
            <b className="text-[var(--text)]">{pages.length ? `${estimatedMbs} MB` : '0 MB'}</b>
          </div>
        </div>
      </div>
    </div>
  );
}

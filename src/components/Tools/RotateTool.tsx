/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { PDFDocument, degrees } from 'pdf-lib';
import { PdfPage, renderThumb, downloadPdf, formatBytes, HistoryFile } from '../../types';
import UploadZone from '../UploadZone';
import { RefreshCw } from 'lucide-react';

interface RotateToolProps {
  onAddHistory: (item: { name: string; tool: string; size: string; files?: HistoryFile[] }) => void;
  onToast: (msg: string, type?: 'ok' | 'err') => void;
  initialFiles?: File[];
}

export default function RotateTool({ onAddHistory, onToast, initialFiles }: RotateToolProps) {
  const [pages, setPages] = useState<PdfPage[]>([]);
  const [rotations, setRotations] = useState<Record<string, number>>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (initialFiles && initialFiles.length > 0) {
      loadFiles(initialFiles);
    }
  }, [initialFiles]);

  const loadFiles = async (files: File[]) => {
    setBusy(true);
    try {
      let accumulatedPages: PdfPage[] = [];

      for (const f of files) {
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
      }

      setPages((prev) => [...prev, ...accumulatedPages]);
      setRotations({});
      setBusy(false);

      // Previews
      for (const p of accumulatedPages) {
        const pv = await renderThumb(p.data, p.pageIndex);
        setPages((current) =>
          current.map((x) => (x.id === p.id ? { ...x, preview: pv } : x))
        );
      }
    } catch (err: any) {
      onToast(err?.message || 'Error loading PDFs for rotation.', 'err');
      setBusy(false);
    }
  };

  const handlePageRotate = (id: string, delta: number) => {
    setRotations((prev) => {
      const current = prev[id] || 0;
      const next = (current + delta + 360) % 360;
      return { ...prev, [id]: next };
    });
  };

  const rotateAll = (delta: number) => {
    setRotations((prev) => {
      const next: Record<string, number> = {};
      pages.forEach((p) => {
        const current = prev[p.id] || 0;
        next[p.id] = (current + delta + 360) % 360;
      });
      return next;
    });
  };

  const handleApply = async () => {
    if (!pages.length) return;
    setBusy(true);
    try {
      const out = await PDFDocument.create();
      for (const p of pages) {
        const src = await PDFDocument.load(p.data, { ignoreEncryption: true });
        const [copiedPage] = await out.copyPages(src, [p.pageIndex]);

        const rotationAngle = rotations[p.id] || 0;
        if (rotationAngle !== 0) {
          copiedPage.setRotation(degrees(rotationAngle));
        }
        out.addPage(copiedPage);
      }

      const bytes = await out.save();
      const outputSize = downloadPdf(bytes, 'mydocify_rotated.pdf');
      onAddHistory({
        name: 'mydocify_rotated.pdf',
        tool: 'Rotate Pages',
        size: formatBytes(outputSize),
        files: [{ name: 'mydocify_rotated.pdf', bytes }],
      });

      onToast('Rotations applied successfully!');
      setPages([]);
      setRotations({});
    } catch (err: any) {
      onToast(err?.message || 'Failure applying rotations.', 'err');
    }
    setBusy(false);
  };

  return (
    <div>
      {!pages.length ? (
        <UploadZone onFiles={loadFiles} />
      ) : busy ? (
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-12 flex items-center justify-center min-h-[300px]">
          <div className="flex flex-col items-center gap-4">
            <div className="spinner" />
            <p className="text-sm font-semibold text-[var(--muted)]">Applying rotations...</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          
          {/* Batch Actions */}
          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={() => rotateAll(90)}
              className="flex-1 bg-[var(--surface)] hover:bg-[var(--surface2)] border border-[var(--border)] text-[var(--text)] rounded-xl py-3 cursor-pointer text-xs font-semibold flex items-center justify-center gap-2"
            >
              <RefreshCw size={12} /> Rotate All 90° CW
            </button>
            <button
              type="button"
              onClick={() => rotateAll(-90)}
              className="flex-1 bg-[var(--surface)] hover:bg-[var(--surface2)] border border-[var(--border)] text-[var(--text)] rounded-xl py-3 cursor-pointer text-xs font-semibold flex items-center justify-center gap-3"
            >
              <RefreshCw size={12} className="scale-x-[-1]" /> Rotate All 90° CCW
            </button>
            <button
              type="button"
              onClick={() => rotateAll(180)}
              className="flex-1 bg-[var(--surface)] hover:bg-[var(--surface2)] border border-[var(--border)] text-[var(--text)] rounded-xl py-3 cursor-pointer text-xs font-semibold flex items-center justify-center gap-2"
            >
              <RefreshCw size={12} className="rotate-180" /> Rotate All 180°
            </button>
          </div>

          {/* Page Display Grid */}
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 max-h-[400px] overflow-y-auto custom-scroll">
            <div className="grid grid-cols-[repeat(auto-fill,minmax(115px,1fr))] gap-4">
              {pages.map((p, idx) => {
                const currentRotation = rotations[p.id] || 0;
                return (
                  <div key={p.id} className="page-thumb relative flex flex-col justify-between h-full bg-[var(--surface2)]">
                    <div className="p-1 px-2 border-b border-[var(--border)] flex justify-between items-center bg-transparent z-10 text-[10px] font-bold">
                      <span className="text-[var(--muted)]">#{idx + 1}</span>
                      <span className="text-[var(--accent)]">{currentRotation}°</span>
                    </div>

                    <div className="aspect-[3/4] bg-[var(--bg)] flex items-center justify-center overflow-hidden h-[125px]">
                      <div
                        style={{
                          transform: `rotate(${currentRotation}deg)`,
                          transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        }}
                        className="w-[85%] h-[85%] flex items-center justify-center"
                      >
                        {p.preview ? (
                          <img
                            src={p.preview}
                            alt={`Page ${idx + 1}`}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover rounded-sm shadow-sm"
                          />
                        ) : (
                          <div className="spinner w-4 h-4 border-2" />
                        )}
                      </div>
                    </div>

                    <div className="flex gap-1 p-1 px-2 border-t border-[var(--border)] bg-transparent z-10">
                      <button
                        type="button"
                        onClick={() => handlePageRotate(p.id, -90)}
                        className="flex-1 rounded-md bg-[var(--surface)] hover:bg-[var(--surface2)] border border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)] py-1 font-bold text-xs"
                      >
                        ↺
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePageRotate(p.id, 90)}
                        className="flex-1 rounded-md bg-[var(--surface)] hover:bg-[var(--surface2)] border border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)] py-1 font-bold text-xs"
                      >
                        ↻
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <button
            type="button"
            onClick={handleApply}
            className="glow-btn w-full py-3.5"
            disabled={busy || !pages.length}
          >
            Apply & Download Combined PDF
          </button>
        </div>
      )}
    </div>
  );
}

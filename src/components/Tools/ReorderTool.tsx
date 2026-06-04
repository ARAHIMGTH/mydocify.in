/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { PDFDocument } from 'pdf-lib';
import { PdfPage, renderThumb, downloadPdf, formatBytes, HistoryFile } from '../../types';
import UploadZone from '../UploadZone';
import { ArrowLeft, ArrowRight, Trash2, Loader2, Sparkles, RefreshCw } from 'lucide-react';

interface ReorderToolProps {
  onAddHistory: (item: { name: string; tool: string; size: string; files?: HistoryFile[] }) => void;
  onToast: (msg: string, type?: 'ok' | 'err') => void;
  initialFiles?: File[];
}

export default function ReorderTool({ onAddHistory, onToast, initialFiles }: ReorderToolProps) {
  const [pages, setPages] = useState<PdfPage[]>([]);
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

      setPages(accumulatedPages);
      setBusy(false);

      // Render previews for each page sequentially
      for (const p of accumulatedPages) {
        const pv = await renderThumb(p.data, p.pageIndex);
        setPages((current) =>
          current.map((x) => (x.id === p.id ? { ...x, preview: pv } : x))
        );
      }
    } catch (err: any) {
      onToast(err?.message || 'Error loading PDF for organization.', 'err');
      setBusy(false);
    }
  };

  const movePage = (index: number, direction: 'left' | 'right') => {
    if (direction === 'left' && index === 0) return;
    if (direction === 'right' && index === pages.length - 1) return;

    const nextIndex = direction === 'left' ? index - 1 : index + 1;
    const updated = [...pages];
    const temp = updated[index];
    updated[index] = updated[nextIndex];
    updated[nextIndex] = temp;
    setPages(updated);
  };

  const removePage = (id: string) => {
    setPages(prev => prev.filter(p => p.id !== id));
    onToast('Page removed from sequence.');
  };

  const reverseAll = () => {
    setPages(prev => [...prev].reverse());
    onToast('Reversed layout sheets order.');
  };

  const handleApply = async () => {
    if (!pages.length) return;
    setBusy(true);
    try {
      const out = await PDFDocument.create();
      
      for (const p of pages) {
        const src = await PDFDocument.load(p.data, { ignoreEncryption: true });
        const [copiedPage] = await out.copyPages(src, [p.pageIndex]);
        out.addPage(copiedPage);
      }

      const bytes = await out.save();
      const outputFilename = 'mydocify_reordered.pdf';
      const outputSize = downloadPdf(bytes, outputFilename);
      
      onAddHistory({
        name: outputFilename,
        tool: 'Reorder Pages',
        size: formatBytes(outputSize),
        files: [{ name: outputFilename, bytes }],
      });

      onToast('Successfully compiled reordered PDF!');
      setPages([]);
    } catch (err: any) {
      onToast(err?.message || 'Failure applying page ordering.', 'err');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="w-full">
      {!pages.length ? (
        <UploadZone onFiles={loadFiles} />
      ) : busy ? (
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-12 flex items-center justify-center min-h-[300px]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 size={32} className="animate-spin text-[var(--accent)]" />
            <p className="text-sm font-semibold text-[var(--muted)]">Applying custom reorganization order...</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          
          {/* Controls bar */}
          <div className="bg-[var(--surface)] border border-[var(--border)] p-4 rounded-2xl flex flex-col xs:flex-row justify-between items-center gap-4">
            <div>
              <h3 className="font-display font-bold text-sm text-[var(--text)]">
                Organize Output Sheets ({pages.length} Pages)
              </h3>
              <p className="text-[10px] text-[var(--muted)]">
                Move page cards left or right to re-order, click the trash can to strike pages, or reverse the full sequence.
              </p>
            </div>
            <div className="flex gap-2 w-full xs:w-auto">
              <button
                type="button"
                onClick={reverseAll}
                className="flex-1 xs:flex-initial bg-[var(--surface2)] hover:bg-[var(--border)] border border-[var(--border)] text-[var(--text)] rounded-xl px-4 py-2 text-xs font-semibold select-none cursor-pointer transition-colors flex items-center justify-center gap-1.5"
                title="Reverse order of all pages"
              >
                <RefreshCw size={12} /> Reverse
              </button>
              <button
                type="button"
                onClick={handleApply}
                className="flex-1 xs:flex-initial bg-[var(--accent)] hover:bg-[rgba(124,106,240,0.9)] text-white rounded-xl px-5 py-2 text-xs font-bold shadow-md shadow-[rgba(124,106,240,0.3)] hover:scale-105 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Sparkles size={13} /> Compile and Download
              </button>
            </div>
          </div>

          {/* Visual Sheets Display Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
            {pages.map((p, idx) => (
              <div
                key={p.id}
                className="bg-[var(--surface)] border border-[var(--border)] p-3 rounded-2xl flex flex-col justify-between group hover:border-[var(--accent)] transition-all h-[240px] shadow-sm select-none animate-fade-in"
              >
                {/* Visual Thumbnail */}
                <div className="h-[140px] rounded-lg overflow-hidden bg-[var(--surface2)] flex items-center justify-center relative border border-[var(--border)]">
                  {p.preview ? (
                    <img
                      src={p.preview}
                      alt={`Page ${p.pageIndex + 1}`}
                      className="max-h-full max-w-full object-contain pointer-events-none"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="spinner scale-75" />
                  )}
                  {/* Absolute positioning tags */}
                  <span className="absolute bottom-1.5 left-1.5 bg-black/70 border border-white/5 shadow-md px-1.5 py-0.5 rounded text-[9px] font-black text-white">
                    Page {p.pageIndex + 1}
                  </span>
                  <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => removePage(p.id)}
                      className="p-1 px-1.5 rounded-lg bg-black/70 hover:bg-rose-600 border border-white/10 text-white cursor-pointer transition-all shrink-0"
                      title="Discard page"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                </div>

                {/* Information and Meta details */}
                <div className="mt-2 text-center">
                  <span className="inline-block px-2 py-0.5 rounded-md text-[9px] bg-[rgba(124,106,240,0.08)] text-[var(--accent)] font-black">
                    Sheet #{idx + 1}
                  </span>
                  <p className="text-[9px] text-[var(--muted)] truncate mt-1 text-left px-1 font-sans" title={p.fileName}>
                    {p.fileName}
                  </p>
                </div>

                {/* Left/Right controls */}
                <div className="grid grid-cols-2 gap-1 mt-2">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => movePage(idx, 'left')}
                    className="py-1 rounded-lg border border-[var(--border)] bg-[var(--surface2)] text-[var(--muted)] hover:text-[var(--text)] disabled:opacity-30 disabled:pointer-events-none text-center cursor-pointer transition-colors flex items-center justify-center"
                    title="Move Page Earlier"
                  >
                    <ArrowLeft size={11} />
                  </button>
                  <button
                    type="button"
                    disabled={idx === pages.length - 1}
                    onClick={() => movePage(idx, 'right')}
                    className="py-1 rounded-lg border border-[var(--border)] bg-[var(--surface2)] text-[var(--muted)] hover:text-[var(--text)] disabled:opacity-30 disabled:pointer-events-none text-center cursor-pointer transition-colors flex items-center justify-center"
                    title="Move Page Later"
                  >
                    <ArrowRight size={11} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

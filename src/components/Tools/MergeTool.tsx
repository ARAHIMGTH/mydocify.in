/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { PDFDocument } from 'pdf-lib';
import { PdfPage, renderThumb, downloadPdf, formatBytes, HistoryFile } from '../../types';
import UploadZone from '../UploadZone';
import PageGrid from '../PageGrid';
import { Plus, HelpCircle } from 'lucide-react';

interface MergeToolProps {
  onAddHistory: (item: { name: string; tool: string; size: string; files?: HistoryFile[] }) => void;
  onToast: (msg: string, type?: 'ok' | 'err') => void;
  initialFiles?: File[];
}

export default function MergeTool({ onAddHistory, onToast, initialFiles }: MergeToolProps) {
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

      setPages((prev) => [...prev, ...accumulatedPages]);
      setBusy(false);

      // Render previews asynchronously
      for (const p of accumulatedPages) {
        const pv = await renderThumb(p.data, p.pageIndex);
        setPages((current) =>
          current.map((x) => (x.id === p.id ? { ...x, preview: pv } : x))
        );
      }
    } catch (err: any) {
      onToast(err?.message || 'Error processing PDF document merge inputs.', 'err');
      setBusy(false);
    }
  };

  const handleMerge = async () => {
    if (pages.length < 2) {
      onToast('Please load and arrange at least 2 pages.', 'err');
      return;
    }
    setBusy(true);
    try {
      const out = await PDFDocument.create();
      for (const p of pages) {
        const src = await PDFDocument.load(p.data, { ignoreEncryption: true });
        const [copiedPage] = await out.copyPages(src, [p.pageIndex]);
        out.addPage(copiedPage);
      }

      const bytes = await out.save();
      const outputSize = downloadPdf(bytes, 'mydocify_merged.pdf');
      onAddHistory({
        name: 'mydocify_merged.pdf',
        tool: 'Merge PDFs',
        size: formatBytes(outputSize),
        files: [{ name: 'mydocify_merged.pdf', bytes }],
      });

      onToast(`Successfully merged ${pages.length} pages!`);
      setPages([]);
    } catch (err: any) {
      onToast(err?.message || 'Error merging documents.', 'err');
    }
    setBusy(false);
  };

  const uniqueFilesCount = new Set(pages.map((p) => p.fileName)).size;

  return (
    <div>
      {!pages.length ? (
        <UploadZone onFiles={loadFiles} />
      ) : busy ? (
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-12 flex items-center justify-center min-h-[300px]">
          <div className="flex flex-col items-center gap-4">
            <div className="spinner" />
            <p className="text-sm font-semibold text-[var(--muted)]">Assembling pages for merge...</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5">
            <div className="flex items-center justify-between text-xs text-[var(--muted)] mb-3 px-2">
              <span className="flex items-center gap-1">
                <HelpCircle size={13} /> ↕ Drag pages to reorder
              </span>
              <span>
                {pages.length} total pages from {uniqueFilesCount} file{uniqueFilesCount > 1 ? 's' : ''}
              </span>
            </div>

            <div className="max-h-[460px] overflow-y-auto custom-scroll p-1 border border-[var(--border)] rounded-xl bg-[var(--surface2)]/40">
              <PageGrid pages={pages} setPages={setPages} />
            </div>
          </div>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.pdf';
                input.multiple = true;
                input.onchange = (e: any) => {
                  if (e.target.files) loadFiles(Array.from(e.target.files));
                };
                input.click();
              }}
              className="flex-1 bg-[var(--surface)] hover:bg-[var(--surface2)] border border-dashed border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)] rounded-xl p-3.5 cursor-pointer text-sm font-semibold flex items-center justify-center gap-2"
            >
              <Plus size={16} /> Add More Files
            </button>
            <button
              type="button"
              onClick={handleMerge}
              className="glow-btn flex-[2] py-3.5"
              disabled={pages.length < 2}
            >
              Merge All {pages.length} Pages
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

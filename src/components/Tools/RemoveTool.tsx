/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { PDFDocument } from 'pdf-lib';
import { PdfPage, renderThumb, downloadPdf, formatBytes, HistoryFile } from '../../types';
import UploadZone from '../UploadZone';
import PageGrid from '../PageGrid';

interface RemoveToolProps {
  onAddHistory: (item: { name: string; tool: string; size: string; files?: HistoryFile[] }) => void;
  onToast: (msg: string, type?: 'ok' | 'err') => void;
  initialFiles?: File[];
}

export default function RemoveTool({ onAddHistory, onToast, initialFiles }: RemoveToolProps) {
  const [pages, setPages] = useState<PdfPage[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
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
      const f = files[0]; // Operates on a single file at a time
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
      setSelectedIds([]);
      setBusy(false);

      // Previews
      for (const p of accumulatedPages) {
        const pv = await renderThumb(p.data, p.pageIndex);
        setPages((current) =>
          current.map((x) => (x.id === p.id ? { ...x, preview: pv } : x))
        );
      }
    } catch (err: any) {
      onToast(err?.message || 'Error parsing document.', 'err');
      setBusy(false);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleRemove = async () => {
    if (!selectedIds.length) {
      onToast('Please select pages to remove first.', 'err');
      return;
    }
    const pagesToKeep = pages.filter((p) => !selectedIds.includes(p.id));
    if (!pagesToKeep.length) {
      onToast('Cannot remove all pages from a document. At least one page must remain.', 'err');
      return;
    }

    setBusy(true);
    try {
      const out = await PDFDocument.create();
      for (const p of pagesToKeep) {
        const src = await PDFDocument.load(p.data, { ignoreEncryption: true });
        const [copiedPage] = await out.copyPages(src, [p.pageIndex]);
        out.addPage(copiedPage);
      }

      const bytes = await out.save();
      const outputSize = downloadPdf(bytes, 'mydocify_page_removed.pdf');
      onAddHistory({
        name: 'mydocify_page_removed.pdf',
        tool: 'Remove Pages',
        size: formatBytes(outputSize),
        files: [{ name: 'mydocify_page_removed.pdf', bytes }],
      });

      onToast(`Successfully removed ${selectedIds.length} page(s).`);
      setPages([]);
      setSelectedIds([]);
    } catch (err: any) {
      onToast(err?.message || 'Removal processing failed.', 'err');
    }
    setBusy(false);
  };

  const selectAll = () => {
    setSelectedIds(pages.map((p) => p.id));
  };

  const clearAll = () => {
    setSelectedIds([]);
  };

  return (
    <div>
      {!pages.length ? (
        <UploadZone onFiles={loadFiles} multiple={false} />
      ) : busy ? (
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-12 flex items-center justify-center min-h-[300px]">
          <div className="flex flex-col items-center gap-4">
            <div className="spinner" />
            <p className="text-sm font-semibold text-[var(--muted)]">Removing selected pages...</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="bg-[rgba(240,98,146,0.08)] border border-[rgba(240,98,146,0.2)] rounded-xl py-3 px-4 text-xs font-semibold text-[var(--accent2)] flex items-center justify-between">
            <span>👇 Click on the pages you want to remove.</span>
            <span>{selectedIds.length} page{selectedIds.length !== 1 ? 's' : ''} selected for deletion</span>
          </div>

          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5">
            <div className="max-h-[420px] overflow-y-auto custom-scroll p-1 border border-[var(--border)] rounded-xl bg-[var(--surface2)]/40">
              <PageGrid
                pages={pages}
                setPages={setPages}
                selectable={true}
                selected={selectedIds}
                onSelect={toggleSelect}
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={selectAll}
              className="flex-1 bg-[var(--surface)] hover:bg-[var(--surface2)] border border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)] rounded-xl py-3 cursor-pointer text-xs font-semibold"
            >
              Select All
            </button>
            <button
              type="button"
              onClick={clearAll}
              className="flex-1 bg-[var(--surface)] hover:bg-[var(--surface2)] border border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)] rounded-xl py-3 cursor-pointer text-xs font-semibold"
            >
              Clear Selection
            </button>
            <button
              type="button"
              onClick={handleRemove}
              className="flex-[3] glow-btn danger"
              disabled={!selectedIds.length}
            >
              Remove Selected ({selectedIds.length})
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

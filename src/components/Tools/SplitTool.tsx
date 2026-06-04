/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { PDFDocument } from 'pdf-lib';
import { PdfPage, renderThumb, downloadPdf, formatBytes, HistoryFile } from '../../types';
import UploadZone from '../UploadZone';
import PageGrid from '../PageGrid';

interface SplitToolProps {
  onAddHistory: (item: { name: string; tool: string; size: string; files?: HistoryFile[] }) => void;
  onToast: (msg: string, type?: 'ok' | 'err') => void;
  initialFiles?: File[];
}

export default function SplitTool({ onAddHistory, onToast, initialFiles }: SplitToolProps) {
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
      const f = files[0]; // Split operates on a single file at a time
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
      onToast(err?.message || 'Error parsing document.', 'err');
      setBusy(false);
    }
  };

  const handleSplit = async () => {
    if (!pages.length) return;
    setBusy(true);
    try {
      let count = 0;
      const splitFiles: HistoryFile[] = [];
      for (let i = 0; i < pages.length; i++) {
        const out = await PDFDocument.create();
        const src = await PDFDocument.load(pages[i].data, { ignoreEncryption: true });
        const [copiedPage] = await out.copyPages(src, [pages[i].pageIndex]);
        out.addPage(copiedPage);

        const bytes = await out.save();
        const safeName = `mydocify_split_page_${i + 1}.pdf`;
        downloadPdf(bytes, safeName);
        splitFiles.push({ name: safeName, bytes });
        count++;

        // Artificial delay of 200ms between downloads to handle standard sandboxed frame browser limitations
        await new Promise((resolve) => setTimeout(resolve, 200));
      }

      onAddHistory({
        name: `${count} split single-pages`,
        tool: 'Split PDF',
        size: `${count} files`,
        files: splitFiles,
      });

      onToast(`Successfully split and initiated download for ${count} files!`);
      setPages([]);
    } catch (err: any) {
      onToast(err?.message || 'Error occurred while splitting document.', 'err');
    }
    setBusy(false);
  };

  return (
    <div>
      {!pages.length ? (
        <UploadZone onFiles={loadFiles} multiple={false} />
      ) : busy ? (
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-12 flex items-center justify-center min-h-[300px]">
          <div className="flex flex-col items-center gap-4">
            <div className="spinner" />
            <p className="text-sm font-semibold text-[var(--muted)]">Processing document splits...</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5">
            <p className="text-xs text-[var(--muted)] font-semibold mb-3.5 px-2">
              {pages.length} pages loaded · Each individual page will be extracted and downloaded as a standalone singular PDF document.
            </p>
            <div className="max-h-[440px] overflow-y-auto custom-scroll p-1 border border-[var(--border)] rounded-xl bg-[var(--surface2)]/40">
              <PageGrid pages={pages} setPages={setPages} />
            </div>
          </div>

          <button
            type="button"
            onClick={handleSplit}
            className="glow-btn w-full py-3.5"
            disabled={busy || !pages.length}
          >
            Split into {pages.length} Standalone PDFs
          </button>
        </div>
      )}
    </div>
  );
}

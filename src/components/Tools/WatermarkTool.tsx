/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';
import { PdfPage, renderThumb, downloadPdf, formatBytes, HistoryFile } from '../../types';
import UploadZone from '../UploadZone';
import PageGrid from '../PageGrid';

interface WatermarkToolProps {
  onAddHistory: (item: { name: string; tool: string; size: string; files?: HistoryFile[] }) => void;
  onToast: (msg: string, type?: 'ok' | 'err') => void;
  initialFiles?: File[];
}

export default function WatermarkTool({ onAddHistory, onToast, initialFiles }: WatermarkToolProps) {
  const [pages, setPages] = useState<PdfPage[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (initialFiles && initialFiles.length > 0) {
      loadFiles(initialFiles);
    }
  }, [initialFiles]);

  // Settings
  const [text, setText] = useState('CONFIDENTIAL');
  const [opacity, setOpacity] = useState(0.2);
  const [angle, setAngle] = useState(45);
  const [fontSize, setFontSize] = useState(50);
  const [color, setColor] = useState('#e11d48'); // rose-600 default

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

  const hexToRgb = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    return { r, g, b };
  };

  const handleApply = async () => {
    if (!pages.length || !text.trim()) {
      onToast('Please enter watermark text and upload files.', 'err');
      return;
    }
    setBusy(true);
    try {
      const out = await PDFDocument.create();
      const font = await out.embedFont(StandardFonts.HelveticaBold);
      const { r, g, b } = hexToRgb(color);

      // Copy Pages
      for (const p of pages) {
        const src = await PDFDocument.load(p.data, { ignoreEncryption: true });
        const [copiedPage] = await out.copyPages(src, [p.pageIndex]);
        out.addPage(copiedPage);
      }

      // Draw watermarks
      const docPages = out.getPages();
      for (const page of docPages) {
        const { width, height } = page.getSize();
        const textWidth = font.widthOfTextAtSize(text, fontSize);
        
        // Calculate centered coordinates
        const xCoord = width / 2 - textWidth / 2;
        const yCoord = height / 2 - fontSize / 2;

        page.drawText(text, {
          x: xCoord,
          y: yCoord,
          size: fontSize,
          font,
          color: rgb(r, g, b),
          opacity,
          rotate: degrees(angle),
        });
      }

      const bytes = await out.save();
      const outputSize = downloadPdf(bytes, 'mydocify_watermarked.pdf');
      onAddHistory({
        name: 'mydocify_watermarked.pdf',
        tool: 'Watermark',
        size: formatBytes(outputSize),
        files: [{ name: 'mydocify_watermarked.pdf', bytes }],
      });

      onToast('Watermark loaded successfully onto document!');
      setPages([]);
    } catch (err: any) {
      onToast(err?.message || 'Watermarking failed.', 'err');
    }
    setBusy(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_270px] gap-6">
      <div className="flex flex-col gap-4">
        {!pages.length ? (
          <UploadZone onFiles={loadFiles} />
        ) : busy ? (
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-12 flex items-center justify-center min-h-[300px]">
            <div className="flex flex-col items-center gap-4">
              <div className="spinner" />
              <p className="text-sm font-semibold text-[var(--muted)]">Watermarking each layer...</p>
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
              onClick={handleApply}
              className="glow-btn w-full py-3.5"
              disabled={busy || !text.trim()}
            >
              Apply Watermark & Download PDF
            </button>
          </div>
        )}
      </div>

      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 h-fit flex flex-col gap-4">
        <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Settings</p>

        <div className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-semibold text-[var(--muted)] block mb-1.5">Watermark Text</label>
            <input
              className="ifield"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="CONFIDENTIAL"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[var(--muted)] block mb-1.5">Color Accent</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-10 h-8 rounded-md cursor-pointer border-none bg-transparent"
              />
              <span className="text-xs font-mono font-bold tracking-wider opacity-80">{color.toUpperCase()}</span>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-[var(--muted)] block mb-1.5 flex justify-between">
              <span>Opacity</span>
              <span className="font-mono text-xs">{Math.round(opacity * 100)}%</span>
            </label>
            <input
              type="range"
              min="0.05"
              max="0.80"
              step="0.05"
              value={opacity}
              onChange={(e) => setOpacity(parseFloat(e.target.value))}
              className="w-full accent-[var(--accent)]"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[var(--muted)] block mb-1.5 flex justify-between">
              <span>Angle</span>
              <span className="font-mono text-xs">{angle}°</span>
            </label>
            <input
              type="range"
              min="-180"
              max="180"
              step="5"
              value={angle}
              onChange={(e) => setAngle(parseInt(e.target.value))}
              className="w-full accent-[var(--accent)]"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[var(--muted)] block mb-1.5 flex justify-between">
              <span>Font Size</span>
              <span className="font-mono text-xs">{fontSize}pt</span>
            </label>
            <input
              type="range"
              min="14"
              max="120"
              step="2"
              value={fontSize}
              onChange={(e) => setFontSize(parseInt(e.target.value))}
              className="w-full accent-[var(--accent)]"
            />
          </div>

          {/* Mini Interactive Preview card */}
          <div className="border border-[var(--border)] rounded-xl bg-[var(--surface2)] p-4 flex items-center justify-center min-h-[90px] overflow-hidden relative">
            <span
              style={{
                color: color,
                opacity: opacity,
                fontSize: `${Math.min(18, Math.max(8, fontSize * 0.16))}px`,
                transform: `rotate(${angle}deg)`,
                transition: 'all 0.1s ease',
              }}
              className="font-sans font-black tracking-widest whitespace-nowrap select-none"
            >
              {text || 'Preview'}
            </span>
          </div>

        </div>
      </div>
    </div>
  );
}

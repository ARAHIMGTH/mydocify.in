/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Point 10: N-Up / Booklet Maker Tool
 */

import { useState, useEffect } from 'react';
import { PDFDocument, rgb } from 'pdf-lib';
import { PdfPage, formatBytes, downloadPdf, HistoryFile } from '../../types';
import UploadZone from '../UploadZone';
import { LayoutGrid, Download, Grid, Layers, Columns, ShieldCheck, HelpCircle } from 'lucide-react';

interface NupToolProps {
  onAddHistory: (item: { name: string; tool: string; size: string; files?: HistoryFile[] }) => void;
  onToast: (msg: string, type?: 'ok' | 'err') => void;
  initialFiles?: File[];
}

export default function NupTool({ onAddHistory, onToast, initialFiles }: NupToolProps) {
  const [pages, setPages] = useState<PdfPage[]>([]);
  const [gridStyle, setGridStyle] = useState<'2' | '4'>('2');
  const [sheetSize, setSheetSize] = useState<'a4' | 'letter'>('letter');
  const [orientation, setOrientation] = useState<'landscape' | 'portrait'>('landscape');
  const [marginSize, setMarginSize] = useState<'none' | 'small' | 'medium'>('small');
  const [drawPageBorders, setDrawPageBorders] = useState<boolean>(true);
  const [busy, setBusy] = useState<boolean>(false);
  const [fileName, setFileName] = useState<string>('document.pdf');
  const [pdfRawBytes, setPdfRawBytes] = useState<Uint8Array | null>(null);

  useEffect(() => {
    if (initialFiles && initialFiles.length > 0) {
      loadFiles(initialFiles);
    }
  }, [initialFiles]);

  const loadFiles = async (files: File[]) => {
    if (!files.length) return;
    setBusy(true);
    const f = files[0];
    setFileName(f.name);
    try {
      const arrayBuffer = await f.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      setPdfRawBytes(bytes);

      // Extract brief page index count
      const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
      const count = doc.getPageCount();
      const fakePages: PdfPage[] = [];
      for (let i = 0; i < count; i++) {
        fakePages.push({
          id: Math.random().toString(36).substring(2, 11),
          fileName: f.name,
          data: bytes,
          pageIndex: i,
          preview: null,
        });
      }
      setPages(fakePages);
      onToast(`Loaded "${f.name}" with ${count} pages. Double check layout parameters below to generate.`);
    } catch (err: any) {
      onToast(err?.message || 'Error parsing loaded document.', 'err');
    }
    setBusy(false);
  };

  const handleApplyNup = async () => {
    if (!pdfRawBytes || !pages.length) return;
    setBusy(true);
    try {
      // Create destination document
      const destDoc = await PDFDocument.create();

      // Load source document
      const srcDoc = await PDFDocument.load(pdfRawBytes, { ignoreEncryption: true });
      const pageCount = srcDoc.getPageCount();

      // Determine page dimensions (DPI is 72 per inch)
      // Letter: 8.5 x 11 in -> Portrait: 612 x 792, Landscape: 792 x 612
      // A4: 210 x 297 mm   -> Portrait: 595 x 842, Landscape: 842 x 595
      let sheetW = 792;
      let sheetH = 612;

      if (sheetSize === 'a4') {
        sheetW = orientation === 'landscape' ? 842 : 595;
        sheetH = orientation === 'landscape' ? 595 : 842;
      } else {
        sheetW = orientation === 'landscape' ? 792 : 612;
        sheetH = orientation === 'landscape' ? 612 : 792;
      }

      // Grid specifications
      const nupMode = parseInt(gridStyle, 10); // 2 or 4
      const cols = nupMode === 2 ? (orientation === 'landscape' ? 2 : 1) : 2;
      const rows = nupMode === 2 ? (orientation === 'landscape' ? 1 : 2) : 2;

      const itemsPerPageSheet = cols * rows;

      // Spacing details
      let marginOffset = 10;
      if (marginSize === 'none') marginOffset = 0;
      if (marginSize === 'medium') marginOffset = 25;

      const usableW = sheetW - (marginOffset * 2);
      const usableH = sheetH - (marginOffset * 2);

      const cellW = usableW / cols;
      const cellH = usableH / rows;

      // Loop and stitch pages
      for (let i = 0; i < pageCount; i += itemsPerPageSheet) {
        const sheetPage = destDoc.addPage([sheetW, sheetH]);

        for (let j = 0; j < itemsPerPageSheet; j++) {
          const srcIdx = i + j;
          if (srcIdx >= pageCount) break;

          // Copy and embed page
          const [embeddedPage] = await destDoc.copyPages(srcDoc, [srcIdx]);
          const embeddedObject = await destDoc.embedPage(embeddedPage);

          // Grid coordinates calculation
          const rowIdx = Math.floor(j / cols);
          const colIdx = j % cols;

          // Compute sizing maintaining aspect ratio of source page
          const origW = embeddedObject.width || 612;
          const origH = embeddedObject.height || 792;
          const srcRatio = origW / origH;

          // Give cell some padding
          const padding = marginSize === 'none' ? 0 : 6;
          const maxBoundedW = cellW - (padding * 2);
          const maxBoundedH = cellH - (padding * 2);

          let drawW = maxBoundedW;
          let drawH = drawW / srcRatio;

          if (drawH > maxBoundedH) {
            drawH = maxBoundedH;
            drawW = drawH * srcRatio;
          }

          // Centering within cellular grid item bounds
          const cellX = marginOffset + (colIdx * cellW) + ((cellW - drawW) / 2);
          
          // PDF Origin is bottom left!
          // We reverse rows: Top row has visual index 0, but in bottom-up coordinates it is higher Y
          const cellY = marginOffset + ((rows - 1 - rowIdx) * cellH) + ((cellH - drawH) / 2);

          sheetPage.drawPage(embeddedObject, {
            x: cellX,
            y: cellY,
            width: drawW,
            height: drawH,
          });

          // Draw outline border outline if checked
          if (drawPageBorders) {
            sheetPage.drawRectangle({
              x: cellX,
              y: cellY,
              width: drawW,
              height: drawH,
              borderColor: rgb(0.75, 0.75, 0.75),
              borderWidth: 0.6,
            });
          }
        }
      }

      const compiledBytes = await destDoc.save();
      const outputName = `${fileName.replace(/\.pdf$/i, '')}_nup_${gridStyle}up.pdf`;
      const sizeBytes = downloadPdf(compiledBytes, outputName);

      onAddHistory({
        name: outputName,
        tool: 'N-Up Compiler',
        size: formatBytes(sizeBytes),
        files: [{ name: outputName, bytes: compiledBytes }]
      });

      onToast(`Compiled grid sheets successfully! Saved as "${outputName}".`);
    } catch (err: any) {
      console.error(err);
      onToast(err?.message || 'Error occurred compiling sheet grids.', 'err');
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
            <p className="text-sm font-semibold text-[var(--muted)]">Assembling Booklet compilation grids...</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
          {/* Main info card */}
          <div className="bg-[var(--surface)] border border-[var(--border)] p-6 rounded-2xl flex flex-col justify-between shadow-sm">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-400">
                  <LayoutGrid size={22} />
                </div>
                <div>
                  <h3 className="font-display font-black text-sm text-[var(--text)] tracking-tight">
                    N-Up Grid Compiler Layout
                  </h3>
                  <p className="text-[11px] text-[var(--muted)] leading-relaxed mt-0.5">
                    Generate condensed layout pages fitting multiple original pages onto a single compiled template. Great for brochures, notes, or paper preservation.
                  </p>
                </div>
              </div>

              {/* Status report */}
              <div className="bg-[var(--surface-bg)] border border-[var(--border)] p-4 rounded-xl mt-2 select-none">
                <span className="text-[10px] text-[var(--muted)] font-black uppercase tracking-wider block mb-1">
                  Active Document Summary
                </span>
                <div className="grid grid-cols-2 gap-3 mt-1.5 text-xs text-[var(--text)] font-sans">
                  <div>
                    <span className="text-[10px] text-[var(--muted)]">Source Filename:</span>
                    <p className="font-mono mt-0.5 font-bold truncate">{fileName}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-[var(--muted)]">Total Pages (Input):</span>
                    <p className="font-medium mt-0.5 font-sans font-bold">{pages.length} pages</p>
                  </div>
                </div>
              </div>

              {/* Grid visual visualizer */}
              <div className="items-center justify-center bg-[var(--surface-bg)] border border-dashed border-[var(--border)] rounded-xl py-8 px-4 flex flex-col gap-3 select-none text-center">
                <span className="text-[9px] text-[var(--muted)] uppercase font-semibold font-mono tracking-widest block">
                  Sheet Layout Blueprint
                </span>

                <div 
                  className={`w-40 bg-[var(--surface)] border border-[var(--border)] rounded p-2.5 grid shadow-md justify-stretch items-stretch gap-1.5 transition-transform ${
                    orientation === 'landscape' ? 'aspect-[4/3]' : 'aspect-[3/4]'
                  }`}
                  style={{
                    gridTemplateColumns: gridStyle === '2' 
                      ? (orientation === 'landscape' ? '1fr 1fr' : '1fr') 
                      : '1fr 1fr',
                    gridTemplateRows: gridStyle === '2'
                      ? (orientation === 'landscape' ? '1fr' : '1fr 1fr')
                      : '1fr 1fr'
                  }}
                >
                  <div className="bg-dashed border border-[rgba(124,106,240,0.3)] bg-[rgba(124,106,240,0.04)] text-[9px] text-[var(--accent)] flex items-center justify-center font-black rounded-sm">1</div>
                  <div className="bg-dashed border border-[rgba(124,106,240,0.3)] bg-[rgba(124,106,240,0.04)] text-[9px] text-[var(--accent)] flex items-center justify-center font-black rounded-sm">2</div>
                  {gridStyle === '4' && (
                    <>
                      <div className="bg-dashed border border-[rgba(124,106,240,0.3)] bg-[rgba(124,106,240,0.04)] text-[9px] text-[var(--accent)] flex items-center justify-center font-black rounded-sm">3</div>
                      <div className="bg-dashed border border-[rgba(124,106,240,0.3)] bg-[rgba(124,106,240,0.04)] text-[9px] text-[var(--accent)] flex items-center justify-center font-black rounded-sm">4</div>
                    </>
                  )}
                </div>

                <p className="text-[11px] text-[var(--muted)] font-medium max-w-xs leading-normal mt-1">
                  Will map {pages.length} source page(s) onto <strong className="text-[var(--text)] font-semibold">{Math.ceil(pages.length / parseInt(gridStyle, 10))} sheet(s)</strong> of unified output.
                </p>
              </div>

            </div>

            <div className="mt-6 flex text-xs text-[var(--muted)] gap-2 items-start justify-center">
              <ShieldCheck size={14} className="text-emerald-500 shrink-0" />
              <span>Computes 100% locally in browser memory. High accuracy aspect preservation.</span>
            </div>
          </div>

          {/* Config sidebar card */}
          <div className="bg-[var(--surface)] border border-[var(--border)] p-5 rounded-2xl flex flex-col justify-between shadow-sm select-none gap-5">
            <div className="flex flex-col gap-4">
              <h4 className="font-display font-black text-xs text-[var(--text)] tracking-wider uppercase flex items-center gap-1.5 pb-2.5 border-b border-[var(--border)]">
                <Grid size={13} className="text-[var(--accent)]" /> Layout Blueprint
              </h4>

              {/* Grid Mode Selection */}
              <div>
                <label className="text-[10px] text-[var(--muted)] font-bold uppercase tracking-wider block mb-1.5">
                  Compilation Grid Model
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setGridStyle('2')}
                    className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 text-center transition-all cursor-pointer ${
                      gridStyle === '2'
                        ? 'bg-[rgba(124,106,240,0.08)] border-[var(--accent)] text-[var(--text)] font-bold'
                        : 'bg-[var(--surface-bg)] border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)]'
                    }`}
                  >
                    <Columns size={15} />
                    <span className="text-[11px]">2-Up Grid</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setGridStyle('4')}
                    className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 text-center transition-all cursor-pointer ${
                      gridStyle === '4'
                        ? 'bg-[rgba(124,106,240,0.08)] border-[var(--accent)] text-[var(--text)] font-bold'
                        : 'bg-[var(--surface-bg)] border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)]'
                    }`}
                  >
                    <LayoutGrid size={15} />
                    <span className="text-[11px]">4-Up Grid</span>
                  </button>
                </div>
              </div>

              {/* Sheet size option selector */}
              <div>
                <label className="text-[10px] text-[var(--muted)] font-bold uppercase tracking-wider block mb-1.5">
                  Output Page Dimensions
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSheetSize('letter')}
                    className={`py-1.5 px-3 text-xs rounded-xl border font-bold transition-all cursor-pointer ${
                      sheetSize === 'letter'
                        ? 'bg-[rgba(124,106,240,0.08)] border-[var(--accent)] text-[var(--text)]'
                        : 'bg-[var(--surface-bg)] border-[var(--border)] text-[var(--muted)]'
                    }`}
                  >
                    US Letter
                  </button>
                  <button
                    type="button"
                    onClick={() => setSheetSize('a4')}
                    className={`py-1.5 px-3 text-xs rounded-xl border font-bold transition-all cursor-pointer ${
                      sheetSize === 'a4'
                        ? 'bg-[rgba(124,106,240,0.08)] border-[var(--accent)] text-[var(--text)]'
                        : 'bg-[var(--surface-bg)] border-[var(--border)] text-[var(--muted)]'
                    }`}
                  >
                    A4 Sheet
                  </button>
                </div>
              </div>

              {/* Sheet orientation layout */}
              <div>
                <label className="text-[10px] text-[var(--muted)] font-bold uppercase tracking-wider block mb-1.5">
                  Target Orientation
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setOrientation('portrait')}
                    className={`py-1.5 px-3 text-xs rounded-xl border font-bold transition-all cursor-pointer ${
                      orientation === 'portrait'
                        ? 'bg-[rgba(124,106,240,0.08)] border-[var(--accent)] text-[var(--text)]'
                        : 'bg-[var(--surface-bg)] border-[var(--border)] text-[var(--muted)]'
                    }`}
                  >
                    Portrait
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrientation('landscape')}
                    className={`py-1.5 px-3 text-xs rounded-xl border font-bold transition-all cursor-pointer ${
                      orientation === 'landscape'
                        ? 'bg-[rgba(124,106,240,0.08)] border-[var(--accent)] text-[var(--text)]'
                        : 'bg-[var(--surface-bg)] border-[var(--border)] text-[var(--muted)]'
                    }`}
                  >
                    Landscape
                  </button>
                </div>
              </div>

              {/* Margins control */}
              <div>
                <label className="text-[10px] text-[var(--muted)] font-bold uppercase tracking-wider block mb-1.5">
                  Grid Padding Margins
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {['none', 'small', 'medium'].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMarginSize(m as any)}
                      className={`py-1.5 px-1.5 text-[10px] rounded-lg border font-bold capitalize transition-all cursor-pointer ${
                        marginSize === m
                          ? 'bg-[rgba(124,106,240,0.08)] border-[var(--accent)] text-[var(--text)]'
                          : 'bg-[var(--surface-bg)] border-[var(--border)] text-[var(--muted)]'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {/* Separating borders toggle checkbox */}
              <div className="flex items-center gap-2 mt-1.5">
                <input
                  type="checkbox"
                  id="drawBorderCheck"
                  checked={drawPageBorders}
                  onChange={(e) => setDrawPageBorders(e.target.checked)}
                  className="rounded border-[var(--border)] text-[var(--accent)] bg-[var(--surface-bg)] outline-none focus:ring-0 focus:ring-offset-0 cursor-pointer"
                />
                <label htmlFor="drawBorderCheck" className="text-xs font-semibold text-[var(--text)] cursor-pointer">
                  Draw subtle border frames
                </label>
              </div>
            </div>

            <button
              type="button"
              onClick={handleApplyNup}
              className="w-full flex items-center justify-center gap-2 bg-[var(--accent)] hover:opacity-95 text-white py-3 rounded-xl cursor-pointer text-xs font-bold transition-all shadow-md mt-2"
            >
              <Download size={15} /> Save & Download
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

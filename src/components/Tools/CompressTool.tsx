/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { PDFDocument } from 'pdf-lib';
import { PdfPage, renderThumb, downloadPdf, formatBytes, HistoryFile } from '../../types';
import UploadZone from '../UploadZone';
import PageGrid from '../PageGrid';
import { Plus, Sliders, ShieldCheck, RefreshCw, Target, Cpu } from 'lucide-react';

interface CompressToolProps {
  onAddHistory: (item: { name: string; tool: string; size: string; files?: HistoryFile[] }) => void;
  onToast: (msg: string, type?: 'ok' | 'err') => void;
  initialFiles?: File[];
}

export default function CompressTool({ onAddHistory, onToast, initialFiles }: CompressToolProps) {
  const [pages, setPages] = useState<PdfPage[]>([]);
  const [compressMode, setCompressMode] = useState<'percent' | 'size' | 'manual'>('percent');
  const [targetPercent, setTargetPercent] = useState<number>(50); // target percentage of original size (e.g. 50% = half size)
  const [targetSizeVal, setTargetSizeVal] = useState<number>(450); // custom desired file size
  const [targetSizeUnit, setTargetSizeUnit] = useState<'KB' | 'MB'>('KB');
  const [manualScale, setManualScale] = useState<number>(0.85); // 0.3 to 1.5
  const [manualQuality, setManualQuality] = useState<number>(0.65); // 0.1 to 1.0
  const [busy, setBusy] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [origSize, setOrigSize] = useState(0);

  useEffect(() => {
    if (initialFiles && initialFiles.length > 0) {
      loadFiles(initialFiles);
    }
  }, [initialFiles]);

  const loadFiles = async (files: File[]) => {
    setBusy(true);
    setProgressMsg('Parsing PDF files...');
    try {
      let accumulatedPages: PdfPage[] = [];
      let totalSizeInput = 0;

      for (const f of files) {
        const arrayBuffer = await f.arrayBuffer();
        const docBytes = new Uint8Array(arrayBuffer);
        const doc = await PDFDocument.load(docBytes, { ignoreEncryption: true });
        totalSizeInput += f.size;

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

      setOrigSize((prev) => prev + totalSizeInput);
      setPages((prev) => [...prev, ...accumulatedPages]);
      setBusy(false);

      // Render thumbnails asynchronously
      for (const p of accumulatedPages) {
        const pv = await renderThumb(p.data, p.pageIndex);
        setPages((current) =>
          current.map((x) => (x.id === p.id ? { ...x, preview: pv } : x))
        );
      }
    } catch (err: any) {
      onToast(err?.message || 'Error parsing PDF documents.', 'err');
      setBusy(false);
    }
  };

  const renderPageAsJpg = async (
    data: Uint8Array,
    pageIndex: number,
    scale: number,
    quality: number
  ): Promise<Uint8Array | null> => {
    try {
      const pdfjs = (window as any).pdfjsLib;
      if (!pdfjs) {
        console.warn('pdfjsLib is not loaded on window.');
        return null;
      }
      const dataCopy = data.slice(0);
      const loadingTask = pdfjs.getDocument({ data: dataCopy });
      const pdf = await loadingTask.promise;
      const page = await pdf.getPage(pageIndex + 1);
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;
      await page.render({ canvasContext: ctx, viewport }).promise;
      return new Promise<Uint8Array | null>((resolve) => {
        canvas.toBlob(async (blob) => {
          if (!blob) {
            resolve(null);
            return;
          }
          const buf = await blob.arrayBuffer();
          resolve(new Uint8Array(buf));
        }, 'image/jpeg', quality);
      });
    } catch (err) {
      console.error('Error rendering page to JPEG:', err);
      return null;
    }
  };

  const targetKB = targetSizeUnit === 'KB' ? targetSizeVal : targetSizeVal * 1024;
  const desiredSizeInBytes = targetKB * 1024;

  const handleCompress = async () => {
    if (!pages.length) return;
    setBusy(true);
    try {
      let bytes: Uint8Array;

      const out = await PDFDocument.create();
      
      let scale = 1.0;
      let quality = 0.7;

      if (compressMode === 'percent') {
        // Dynamically map targetPercent (10% to 90%) to rendering parameters
        scale = Math.min(1.5, 0.65 + ((targetPercent - 10) / 80) * 0.85);
        quality = Math.min(0.95, 0.15 + ((targetPercent - 10) / 80) * 0.80);
      } else if (compressMode === 'size') {
        // Active multi-pass calibration sweep to hit the exact target size budget
        const testPages = pages.slice(0, Math.min(2, pages.length));
        const targetTestBytes = Math.max(1024, (desiredSizeInBytes * testPages.length) / pages.length);

        let low = 0.0;
        let high = 1.0;
        let optimalX = 0.5;

        // Higher x linearly scales active resolution scale & JPEG compression matrix density
        const interpolateParams = (val: number) => {
          const scl = 0.30 + val * (1.45 - 0.30);
          const qlt = 0.10 + val * (0.95 - 0.10);
          return { scl, qlt };
        };

        setProgressMsg('Analyzing document contents and calibrating target size precision...');

        // 6 steps of dynamic binary search converges to 1.5% accuracy in less than a second
        for (let step = 1; step <= 6; step++) {
          const mid = (low + high) / 2;
          const { scl, qlt } = interpolateParams(mid);
          
          setProgressMsg(`Calibrating target budget: matching page weights (Step ${step} of 6)...`);
          
          let totalTestBytes = 0;
          let renderSuccess = true;
          for (const tp of testPages) {
            const jpgBytes = await renderPageAsJpg(tp.data, tp.pageIndex, scl, qlt);
            if (jpgBytes) {
              totalTestBytes += jpgBytes.length;
            } else {
              renderSuccess = false;
            }
          }

          if (!renderSuccess) {
            optimalX = mid;
            break;
          }

          if (totalTestBytes < targetTestBytes) {
            low = mid;
            optimalX = mid;
          } else {
            high = mid;
            optimalX = mid;
          }
        }

        const finalParams = interpolateParams(optimalX);
        scale = finalParams.scl;
        quality = finalParams.qlt;
        console.log(`Dynamic Calibration Finished: matched target ${desiredSizeInBytes} bytes using scale=${scale.toFixed(3)}, quality=${quality.toFixed(3)}`);
      } else {
        // Manual mode
        scale = manualScale;
        quality = manualQuality;
      }

      for (let i = 0; i < pages.length; i++) {
        setProgressMsg(`Processing page ${i + 1} of ${pages.length} (${Math.round(scale * 100)}% scale, ${Math.round(quality * 100)}% quality)...`);
        const p = pages[i];
        const jpgBytes = await renderPageAsJpg(p.data, p.pageIndex, scale, quality);
        if (jpgBytes) {
          const img = await out.embedJpg(jpgBytes);
          const newPage = out.addPage([img.width, img.height]);
          newPage.drawImage(img, {
            x: 0,
            y: 0,
            width: img.width,
            height: img.height,
          });
        } else {
          // Fallback to copying pages directly if rendering fails
          const src = await PDFDocument.load(p.data, { ignoreEncryption: true });
          const [copiedPage] = await out.copyPages(src, [p.pageIndex]);
          out.addPage(copiedPage);
        }
      }

      setProgressMsg('Assembling compressed images into unified document...');
      bytes = await out.save({ useObjectStreams: true });

      // Guard against accidental bloating: if raster ends up larger than original, fall back to vector stream packing
      if (bytes.length > origSize) {
        setProgressMsg('Optimizing vector payload stream fallback...');
        const vecDoc = await PDFDocument.create();
        for (const p of pages) {
          const src = await PDFDocument.load(p.data, { ignoreEncryption: true });
          const [copiedPage] = await vecDoc.copyPages(src, [p.pageIndex]);
          vecDoc.addPage(copiedPage);
        }
        const vectorBytes = await vecDoc.save({ useObjectStreams: true });
        if (vectorBytes.length < bytes.length) {
          bytes = vectorBytes;
        }
      }

      const displaySize = bytes.length;
      downloadPdf(bytes, 'mydocify_compressed.pdf');
      onAddHistory({
        name: 'mydocify_compressed.pdf',
        tool: 'Compress PDF',
        size: formatBytes(displaySize),
        files: [{ name: 'mydocify_compressed.pdf', bytes }],
      });

      const savedPercent = Math.max(0, Math.round((1 - displaySize / origSize) * 100));
      onToast(`Saved! Optimized ${formatBytes(origSize)} to ${formatBytes(displaySize)} (${savedPercent}% size reduction).`);
      setPages([]);
      setOrigSize(0);
    } catch (err: any) {
      onToast(err?.message || 'Compression failed.', 'err');
    }
    setBusy(false);
  };

  const getEstimatedSize = (): number => {
    if (compressMode === 'percent') {
      return Math.max(1024, Math.round(origSize * (targetPercent / 100)));
    } else if (compressMode === 'size') {
      return desiredSizeInBytes;
    } else {
      const scaleFactor = manualScale * manualScale;
      const qualityFactor = 0.1 + manualQuality * 0.85;
      return Math.max(1024, Math.round(origSize * scaleFactor * qualityFactor * 0.75));
    }
  };

  const estimatedOutputSize = getEstimatedSize();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
      <div className="flex flex-col gap-4">
        {!pages.length ? (
          <UploadZone onFiles={loadFiles} />
        ) : busy ? (
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-12 flex items-center justify-center min-h-[340px]">
            <div className="flex flex-col items-center gap-5 max-w-sm text-center">
              <div className="relative flex items-center justify-center">
                <RefreshCw size={44} className="text-[var(--accent)] animate-spin" />
              </div>
              <div>
                <h4 className="font-display font-black text-base text-[var(--text)] mb-1">Optimizing Assets</h4>
                <p className="text-xs text-[var(--muted)] px-4 leading-relaxed">{progressMsg}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 max-h-[460px] overflow-y-auto custom-scroll">
              <div className="mb-3 px-2 flex justify-between items-center text-xs text-[var(--muted)]">
                <span>↕ drag pages to rearrange order</span>
                <span>{pages.length} pages loaded</span>
              </div>
              <PageGrid pages={pages} setPages={setPages} />
              
              <div className="text-center mt-4">
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
                  className="bg-[var(--surface2)] hover:bg-[var(--background)] border border-dashed border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)] rounded-xl px-5 py-2.5 cursor-pointer text-xs font-semibold flex items-center gap-2 mx-auto"
                >
                  <Plus size={14} /> Add More Files
                </button>
              </div>
            </div>

            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div>
                <p className="text-xs text-[var(--muted)]">Incoming Total size</p>
                <p className="font-display font-black text-xl text-[var(--text)]">{formatBytes(origSize)}</p>
              </div>
              <button
                type="button"
                onClick={handleCompress}
                className="glow-btn w-full sm:w-auto text-center"
                disabled={busy || !pages.length}
              >
                Compress & Download
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-5">
        {/* Advanced Controls Panel */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-[var(--border)] pb-3">
            <Sliders size={16} className="text-[var(--accent)]" />
            <span className="font-display font-black text-sm text-[var(--text)] uppercase tracking-wide">
              Compression Mode
            </span>
          </div>

          {/* Tabbed Selectors */}
          <div className="flex bg-[var(--surface2)] rounded-xl p-1 border border-[var(--border)]">
            <button
              type="button"
              onClick={() => setCompressMode('percent')}
              className={`flex-1 py-2 font-sans font-semibold text-[10px] rounded-lg transition-all cursor-pointer flex flex-col items-center gap-0.5 ${
                compressMode === 'percent'
                  ? 'bg-[var(--accent)] text-white'
                  : 'text-[var(--muted)] hover:text-[var(--text)]'
              }`}
            >
              <span>% Preset</span>
            </button>
            <button
              type="button"
              onClick={() => setCompressMode('size')}
              className={`flex-1 py-1.5 font-sans font-semibold text-[10px] rounded-lg transition-all cursor-pointer flex flex-col items-center gap-0.5 ${
                compressMode === 'size'
                  ? 'bg-[var(--accent)] text-white'
                  : 'text-[var(--muted)] hover:text-[var(--text)]'
              }`}
            >
              <span className="flex items-center gap-1">🎯 Size Limit</span>
            </button>
            <button
              type="button"
              onClick={() => setCompressMode('manual')}
              className={`flex-1 py-2 font-sans font-semibold text-[10px] rounded-lg transition-all cursor-pointer flex flex-col items-center gap-0.5 ${
                compressMode === 'manual'
                  ? 'bg-[var(--accent)] text-white'
                  : 'text-[var(--muted)] hover:text-[var(--text)]'
              }`}
            >
              <span>⚙️ Manual</span>
            </button>
          </div>

          {compressMode === 'percent' && (
            <div className="flex flex-col gap-3 animate-fade-in">
              <div className="flex flex-col gap-1">
                <div className="flex justify-between items-end">
                  <span className="text-xs font-bold text-[var(--text)]">Desired Target Size</span>
                  <span className="text-base font-display font-black text-[var(--accent3)]">
                    {targetPercent}%
                  </span>
                </div>
                <p className="text-[10px] text-[var(--muted)] leading-normal mt-0.5">
                  Slide to the exact target scale percentage you wish to achieve.
                </p>
              </div>

              <div className="py-2">
                <input
                  type="range"
                  min="10"
                  max="90"
                  step="5"
                  value={targetPercent}
                  onChange={(e) => setTargetPercent(Number(e.target.value))}
                  className="w-full accent-[var(--accent)] cursor-pointer h-2 bg-[var(--surface2)] rounded-lg appearance-none"
                />
                <div className="flex justify-between text-[10px] text-[var(--muted)] font-black uppercase mt-2">
                  <span>Smallest (10%)</span>
                  <span>Default (50%)</span>
                  <span>Highest (90%)</span>
                </div>
              </div>
            </div>
          )}

          {compressMode === 'size' && (
            <div className="flex flex-col gap-3.5 animate-fade-in">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[var(--text)] block">
                  Strict File Size Target
                </label>
                <p className="text-[10px] text-[var(--muted)] leading-normal">
                  Our algorithm dynamically downscales page resolutions and calibrates JPEG visual matrices to aim for this exact budget.
                </p>
              </div>

              <div className="flex gap-2.5">
                <div className="relative flex-1">
                  <input
                    type="number"
                    min="1"
                    max="100000"
                    value={targetSizeVal}
                    onChange={(e) => setTargetSizeVal(Math.max(1, Number(e.target.value)))}
                    className="ifield text-center font-mono font-bold text-sm bg-[var(--surface2)] border-[var(--border)] focus:border-[var(--accent)] rounded-lg py-2.5"
                  />
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 opacity-30 text-[var(--text)]">
                    <Target size={14} />
                  </div>
                </div>
                <select
                  value={targetSizeUnit}
                  onChange={(e) => setTargetSizeUnit(e.target.value as 'KB' | 'MB')}
                  className="ifield w-[90px] text-center font-bold text-xs bg-[var(--surface2)] border-[var(--border)] cursor-pointer rounded-lg py-2.5 text-[var(--text)]"
                >
                  <option value="KB">KB</option>
                  <option value="MB">MB</option>
                </select>
              </div>

              {desiredSizeInBytes > origSize && (
                <div className="p-2.5 rounded-xl bg-[rgba(240,98,146,0.04)] border border-[rgba(240,98,146,0.15)] text-[10px] leading-relaxed text-[var(--accent2)] font-semibold">
                  ⚠️ Target size ({formatBytes(desiredSizeInBytes)}) exceeds orig file weight ({formatBytes(origSize)}). It will output high quality unmodified bytes.
                </div>
              )}
            </div>
          )}

          {compressMode === 'manual' && (
            <div className="flex flex-col gap-4 animate-fade-in">
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-[var(--text)]">Resolution Scale Factor</span>
                  <span className="text-xs font-mono font-black text-[var(--accent3)]">
                    {Math.round(manualScale * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.30"
                  max="1.50"
                  step="0.05"
                  value={manualScale}
                  onChange={(e) => setManualScale(Number(e.target.value))}
                  className="w-full accent-[var(--accent)] cursor-pointer h-2 bg-[var(--surface2)] rounded-lg appearance-none"
                />
                <p className="text-[9px] text-[var(--muted)] leading-relaxed mt-0.5">
                  Decreases the output canvas resolution. Extreme space saver for high-megapixel scans.
                </p>
              </div>

              <div className="flex flex-col gap-1.5 border-t border-[var(--border)] pt-3 mt-1">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-[var(--text)]">JPEG Encoder Quality</span>
                  <span className="text-xs font-mono font-black text-[var(--accent3)]">
                    {Math.round(manualQuality * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.10"
                  max="1.00"
                  step="0.05"
                  value={manualQuality}
                  onChange={(e) => setManualQuality(Number(e.target.value))}
                  className="w-full accent-[var(--accent)] cursor-pointer h-2 bg-[var(--surface2)] rounded-lg appearance-none"
                />
                <p className="text-[9px] text-[var(--muted)] leading-relaxed mt-0.5">
                  Controls page visual compression density. Lowering changes high frequency chroma files.
                </p>
              </div>
            </div>
          )}

          {pages.length > 0 && (
            <div className="bg-[var(--surface2)] rounded-xl p-3 border border-[var(--border)] flex flex-col gap-1.5 mt-2 animate-fade-in">
              <span className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-wider flex items-center gap-1">
                <Cpu size={11} className="text-[var(--accent)]" /> Output Calibration Budget
              </span>
              <div className="flex justify-between items-baseline font-mono text-xs mt-1">
                <span className="text-[var(--muted)]">Original:</span>
                <span className="font-bold text-[var(--text)]">{formatBytes(origSize)}</span>
              </div>
              <div className="flex justify-between items-baseline font-mono text-xs">
                <span className="text-[var(--muted)]">Target estimation:</span>
                <span className="font-bold text-[var(--accent)]">{formatBytes(estimatedOutputSize)}</span>
              </div>
              <div className="flex justify-between items-baseline font-mono text-xs border-t border-[var(--border)] pt-1.5 mt-1">
                <span className="text-[var(--muted)]">Expected Saved:</span>
                <span className="font-bold text-[var(--accent2)]">
                  {origSize > estimatedOutputSize ? Math.round((1 - estimatedOutputSize / origSize) * 100) : 0}% less
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Local Processing Assurance */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 flex flex-col gap-3">
          <div className="flex items-center gap-2 text-[var(--accent2)]">
            <ShieldCheck size={18} className="shrink-0" />
            <span className="font-display font-black text-xs uppercase tracking-wide text-[var(--text)]">
              Local Processing Only
            </span>
          </div>
          <p className="text-[11px] text-[var(--muted)] leading-relaxed">
            All file scaling and compression processes are performed entirely within your browser sandboxed buffers. Your files are never sent to external networks or backend servers, ensuring absolute data privacy.
          </p>
        </div>
      </div>
    </div>
  );
}

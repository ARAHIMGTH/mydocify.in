/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, ChangeEvent, DragEvent } from 'react';
import { PDFDocument } from 'pdf-lib';
import { formatBytes, downloadPdf, HistoryFile } from '../../types';
import { UploadCloud, FileImage, Trash2, ArrowLeft, ArrowRight, Play, Loader2, Sparkles } from 'lucide-react';

interface Img2PdfToolProps {
  onAddHistory: (item: { name: string; tool: string; size: string; files?: HistoryFile[] }) => void;
  onToast: (msg: string, type?: 'ok' | 'err') => void;
  initialFiles?: File[];
}

interface ImageItem {
  id: string;
  file: File;
  preview: string;
}

export default function Img2PdfTool({ onAddHistory, onToast }: Img2PdfToolProps) {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: File[]) => {
    const validImages = files.filter(f => f.type.startsWith('image/') || f.name.endsWith('.png') || f.name.endsWith('.jpg') || f.name.endsWith('.jpeg'));
    if (validImages.length === 0) {
      onToast('Please upload valid image files (PNG/JPG/JPEG).', 'err');
      return;
    }

    const items: ImageItem[] = validImages.map(file => ({
      id: Math.random().toString(36).substring(2, 11),
      file,
      preview: URL.createObjectURL(file), // Generate object url for offline preview
    }));

    setImages(prev => [...prev, ...items]);
    onToast(`Added ${validImages.length} image(s) to compile.`);
  };

  const handleDrag = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const removeImage = (id: string, previewUrl: string) => {
    URL.revokeObjectURL(previewUrl);
    setImages(prev => prev.filter(img => img.id !== id));
  };

  const moveImage = (index: number, direction: 'left' | 'right') => {
    if (direction === 'left' && index === 0) return;
    if (direction === 'right' && index === images.length - 1) return;

    const nextIndex = direction === 'left' ? index - 1 : index + 1;
    const updated = [...images];
    const temp = updated[index];
    updated[index] = updated[nextIndex];
    updated[nextIndex] = temp;
    setImages(updated);
  };

  const handleGeneratePdf = async () => {
    if (images.length === 0) return;
    setBusy(true);

    try {
      const pdfDoc = await PDFDocument.create();

      for (const item of images) {
        const arrayBuffer = await item.file.arrayBuffer();
        const docBytes = new Uint8Array(arrayBuffer);

        let embeddedImg;
        if (item.file.type === 'image/png' || item.file.name.toLowerCase().endsWith('.png')) {
          embeddedImg = await pdfDoc.embedPng(docBytes);
        } else {
          // Default embed as JPEG
          embeddedImg = await pdfDoc.embedJpg(docBytes);
        }

        const page = pdfDoc.addPage([embeddedImg.width, embeddedImg.height]);
        page.drawImage(embeddedImg, {
          x: 0,
          y: 0,
          width: embeddedImg.width,
          height: embeddedImg.height,
        });
      }

      const pdfBytes = await pdfDoc.save();
      const outputFilename = 'mydocify_images_compiled.pdf';
      const outputSize = downloadPdf(pdfBytes, outputFilename);

      onAddHistory({
        name: outputFilename,
        tool: 'Images to PDF',
        size: formatBytes(outputSize),
        files: [{ name: outputFilename, bytes: pdfBytes }],
      });

      onToast('PDF generated from images successfully!');
      // Clean up previews
      images.forEach(img => URL.revokeObjectURL(img.preview));
      setImages([]);
    } catch (err: any) {
      onToast(err?.message || 'Error occurred during PDF generation.', 'err');
    } finally {
      setBusy(false);
    }
  };

  // Cleanup object urls on unmount
  useEffect(() => {
    return () => {
      images.forEach(img => URL.revokeObjectURL(img.preview));
    };
  }, []);

  return (
    <div className="w-full">
      {images.length === 0 ? (
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`w-full min-h-[320px] bg-[var(--surface)] hover:bg-[rgba(124,106,240,0.02)] border-2 border-dashed rounded-2xl flex flex-col items-center justify-center text-center p-8 transition-all cursor-pointer relative ${
            dragActive ? 'border-[var(--accent)] bg-[rgba(124,106,240,0.08)] scale-[1.01]' : 'border-[var(--border)]'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png, image/jpeg, image/jpg"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
          <div className="w-14 h-14 rounded-full bg-[rgba(124,106,240,0.1)] flex items-center justify-center text-[var(--accent)] mb-4">
            <UploadCloud size={24} className="animate-pulse" />
          </div>
          <h3 className="font-display font-black text-base text-[var(--text)] mb-1">
            Upload images to write a PDF
          </h3>
          <p className="text-xs text-[var(--muted)] max-w-sm leading-relaxed mb-4">
            Drag & Drop JPEG, PNG or WebP images here, or tap to choose files from disk. Fully secure offline compiler.
          </p>
          <span className="inline-block px-3.5 py-1.5 rounded-xl text-xs bg-[rgba(124,106,240,0.08)] text-[var(--accent)] border border-[rgba(124,106,240,0.15)] font-bold shadow-sm">
            Browse Images
          </span>
        </div>
      ) : busy ? (
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-12 flex items-center justify-center min-h-[300px]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 size={32} className="animate-spin text-[var(--accent)]" />
            <p className="text-sm font-semibold text-[var(--muted)]">Compiling images into PDF document...</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-5 select-none">
          {/* Header Controls Banner */}
          <div className="bg-[var(--surface)] border border-[var(--border)] p-4 rounded-2xl flex flex-col xs:flex-row justify-between items-center gap-4">
            <div>
              <h3 className="font-display font-bold text-sm text-[var(--text)]">
                Compiled Images Queue ({images.length})
              </h3>
              <p className="text-[10px] text-[var(--muted)]">
                Rearrange image sequences using the arrows or click Compile below to render.
              </p>
            </div>
            <div className="flex gap-2 w-full xs:w-auto">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 xs:flex-initial bg-[var(--surface2)] hover:bg-[var(--border)] border border-[var(--border)] text-[var(--text)] rounded-xl px-4 py-2 text-xs font-semibold select-none cursor-pointer transition-colors"
                title="Add More Images"
              >
                Add Images
              </button>
              <button
                type="button"
                onClick={handleGeneratePdf}
                className="flex-1 xs:flex-initial bg-[var(--accent)] hover:bg-[rgba(124,106,240,0.9)] text-white rounded-xl px-5 py-2 text-xs font-bold shadow-md shadow-[rgba(124,106,240,0.3)] hover:scale-105 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Sparkles size={13} /> Compile to PDF
              </button>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/png, image/jpeg, image/jpg"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Grid Layout listing uploaded images */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {images.map((img, idx) => (
              <div
                key={img.id}
                className="relative bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-hidden p-2 flex flex-col justify-between group hover:border-[var(--accent)] transition-all h-[210px] shadow-sm animate-fade-in"
              >
                {/* Visual Image Preview */}
                <div className="h-[120px] rounded-lg overflow-hidden bg-[var(--surface2)] flex items-center justify-center relative">
                  <img
                    src={img.preview}
                    alt={img.file.name}
                    className="max-h-full max-w-full object-contain pointer-events-none"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => removeImage(img.id, img.preview)}
                      className="p-1 px-1.5 rounded-lg bg-black/70 hover:bg-rose-600 border border-white/10 text-white cursor-pointer transition-all shrink-0"
                      title="Remove image"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                  <span className="absolute bottom-1.5 left-1.5 bg-black/60 rounded-md px-1.5 py-0.5 text-[9px] font-black tracking-wide text-white">
                    #{idx + 1}
                  </span>
                </div>

                {/* Metadata details */}
                <div className="mt-2 flex flex-col gap-1 px-1">
                  <p className="text-[10px] font-bold text-[var(--text)] truncate" title={img.file.name}>
                    {img.file.name}
                  </p>
                  <p className="text-[9px] text-[var(--muted)] font-mono font-bold">
                    {formatBytes(img.file.size)}
                  </p>
                </div>

                {/* Sorting Controls */}
                <div className="grid grid-cols-2 gap-1 mt-2">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => moveImage(idx, 'left')}
                    className="py-1 rounded-lg border border-[var(--border)] bg-[var(--surface2)] text-[var(--muted)] hover:text-[var(--text)] disabled:opacity-30 disabled:pointer-events-none text-center cursor-pointer transition-colors flex items-center justify-center"
                    title="Move Left/Earlier"
                  >
                    <ArrowLeft size={11} />
                  </button>
                  <button
                    type="button"
                    disabled={idx === images.length - 1}
                    onClick={() => moveImage(idx, 'right')}
                    className="py-1 rounded-lg border border-[var(--border)] bg-[var(--surface2)] text-[var(--muted)] hover:text-[var(--text)] disabled:opacity-30 disabled:pointer-events-none text-center cursor-pointer transition-colors flex items-center justify-center"
                    title="Move Right/Later"
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

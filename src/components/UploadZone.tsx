/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { Upload } from 'lucide-react';

interface UploadZoneProps {
  onFiles: (files: File[]) => void;
  multiple?: boolean;
  onToast?: (msg: string, type?: 'ok' | 'err') => void;
}

export default function UploadZone({ onFiles, multiple = true, onToast }: UploadZoneProps) {
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const pdfs = Array.from(files).filter(
      (file) => file.type === 'application/pdf' || file.name.endsWith('.pdf')
    );
    if (!pdfs.length) {
      if (onToast) {
        onToast('Please upload PDF files only.', 'err');
      } else {
        alert('Please upload PDF files only.');
      }
      return;
    }
    onFiles(pdfs);
  };

  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  };

  const onButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div
      className={`upload-zone p-8 flex flex-col items-center justify-center text-center select-none cursor-pointer transition-all duration-300 ease-out border-2 border-dashed rounded-3xl hover:border-[var(--accent)] hover:shadow-xl hover:shadow-[rgba(124,106,240,0.03)] active:scale-[0.99] group ${
        dragActive 
          ? 'border-[var(--accent)] bg-[rgba(124,106,240,0.07)] scale-[1.01]' 
          : 'border-[var(--border)] bg-[var(--surface)] hover:bg-[rgba(124,106,240,0.015)]'
      }`}
      onClick={onButtonClick}
      onDragEnter={handleDrag}
      onDragOver={handleDrag}
      onDragLeave={handleDrag}
      onDrop={handleDrop}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        multiple={multiple}
        className="hidden"
        onChange={handleChange}
      />
      
      <div className="w-16 h-16 rounded-2xl bg-[rgba(124,106,240,0.08)] border border-[rgba(124,106,240,0.18)] flex items-center justify-center text-[var(--accent)] mb-1 group-hover:scale-110 group-hover:bg-[rgba(124,106,240,0.12)] group-hover:text-[var(--accent)] transition-all duration-300 shadow-sm relative overflow-hidden">
        <Upload size={26} className="relative z-10 group-hover:-translate-y-0.5 transition-transform duration-300" />
        <div className="absolute inset-0 bg-gradient-to-tr from-[var(--accent)]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      <p className="font-display font-black text-[15px] sm:text-base text-[var(--text)] tracking-tight leading-tight mt-2.5">
        Drop your PDF{multiple ? 's' : ''} here
      </p>
      
      <p className="text-[11px] text-[var(--muted)]/95 font-medium mt-1 select-none">
        or click to browse local sheets
      </p>

      <span className="inline-block mt-4 px-3 py-1 rounded-lg text-[9px] bg-[rgba(124,106,240,0.06)] text-[var(--accent)] border border-[rgba(124,106,240,0.12)] group-hover:border-[var(--accent)]/30 group-hover:bg-[rgba(124,106,240,0.1)] transition-all uppercase tracking-wider font-extrabold select-none">
        🔒 Sandboxed Offline Safe
      </span>
    </div>
  );
}

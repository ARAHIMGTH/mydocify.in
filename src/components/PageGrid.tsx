/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, DragEvent, Dispatch, SetStateAction } from 'react';
import { Check, Trash2 } from 'lucide-react';
import { PdfPage } from '../types';

interface PageGridProps {
  pages: PdfPage[];
  setPages: Dispatch<SetStateAction<PdfPage[]>>;
  selectable?: boolean;
  selected?: string[];
  onSelect?: (id: string) => void;
}

export default function PageGrid({
  pages,
  setPages,
  selectable = false,
  selected = [],
  onSelect,
}: PageGridProps) {
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);

  const handleDragStart = (idx: number) => {
    setDragIdx(idx);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>, idx: number) => {
    e.preventDefault();
    setOverIdx(idx);
  };

  const handleDragLeave = () => {
    setOverIdx(null);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>, idx: number) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === idx) return;

    const list = [...pages];
    const [movedItem] = list.splice(dragIdx, 1);
    list.splice(idx, 0, movedItem);

    setPages(list);
    setDragIdx(null);
    setOverIdx(null);
  };

  const removePage = (id: string) => {
    setPages((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(115px,1fr))] gap-3 p-1">
      {pages.map((p, idx) => (
        <div
          key={p.id}
          draggable
          onDragStart={() => handleDragStart(idx)}
          onDragOver={(e) => handleDragOver(e, idx)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, idx)}
          onClick={() => selectable && onSelect && onSelect(p.id)}
          className={`page-thumb select-none flex flex-col relative ${
            selectable && selected.includes(p.id) ? 'selected' : ''
          } ${overIdx === idx ? 'opacity-50 ring-2 ring-[var(--accent)]' : ''}`}
          style={{ opacity: dragIdx === idx ? 0.4 : 1 }}
        >
          <div className="p-1 px-2 flex justify-between items-center bg-transparent border-b border-[var(--border)] z-10">
            {/* Displaying 1-based index to standard users while maintaining 0-based index in Javascript/pdf buffers */}
            <span className="text-[10px] font-bold text-[var(--muted)]">#{idx + 1}</span>
            {selectable && selected.includes(p.id) ? (
              <span className="w-4 h-4 rounded-full bg-[var(--accent2)] flex items-center justify-center text-white">
                <Check size={10} strokeWidth={3} />
              </span>
            ) : !selectable ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removePage(p.id);
                }}
                title="Delete this page"
                className="bg-[rgba(240,98,146,0.12)] border-none text-[var(--accent2)] rounded-md w-[20px] h-[20px] cursor-pointer flex items-center justify-center hover:bg-[rgba(240,98,146,0.24)]"
              >
                <Trash2 size={11} />
              </button>
            ) : null}
          </div>

          <div className="aspect-[3/4] bg-[var(--bg)] overflow-hidden flex items-center justify-center relative">
            {p.preview ? (
              <img
                src={p.preview}
                alt={`Page ${idx + 1}`}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="spinner w-4 h-4 border-2" />
            )}
          </div>

          <div className="p-1 px-2 text-[10px] text-[var(--muted)] font-medium truncate bg-[var(--surface)] text-center">
            {p.fileName}
          </div>
        </div>
      ))}
    </div>
  );
}

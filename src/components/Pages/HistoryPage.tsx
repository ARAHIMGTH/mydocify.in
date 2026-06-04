/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { History, FileText, Trash2, Download, ChevronDown, ChevronUp } from 'lucide-react';
import { HistoryItem, HistoryFile, formatBytes, downloadPdf, downloadImage } from '../../types';

interface HistoryPageProps {
  history: HistoryItem[];
  onClearHistory: () => void;
}

const HOUR_MS = 3600000;

export default function HistoryPage({ history, onClearHistory }: HistoryPageProps) {
  const [now, setNow] = useState(Date.now());
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const activeHistory = history.filter((h) => now - h.time < HOUR_MS);

  const toggleExpand = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleDownloadFile = (file: HistoryFile) => {
    if (file.bytes) {
      downloadPdf(file.bytes, file.name);
    } else if (file.dataUrl) {
      downloadImage(file.dataUrl, file.name);
    }
  };

  const handleDownloadAll = async (files: HistoryFile[]) => {
    for (const file of files) {
      if (file.bytes) {
        downloadPdf(file.bytes, file.name);
      } else if (file.dataUrl) {
        downloadImage(file.dataUrl, file.name);
      }
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  };

  // SVG Radial expiration ring
  const ExpiryRing = ({ time }: { time: number }) => {
    const expiry = time + HOUR_MS;
    const timeLeft = Math.max(0, expiry - now);
    const pct = timeLeft / HOUR_MS;

    const r = 18;
    const circ = 2 * Math.PI * r;
    const dashOffset = circ * (1 - pct);

    const minutes = Math.floor(timeLeft / 60000);
    const seconds = Math.floor((timeLeft % 60000) / 1000);
    const urgent = timeLeft < 600000; // Under 10 minutes is urgent red

    return (
      <div className="relative w-12 h-12 flex-shrink-0">
        <svg width="48" height="48" className="rotate-[-90deg]">
          {/* Background circle */}
          <circle
            cx="24"
            cy="24"
            r={r}
            fill="none"
            stroke="var(--border)"
            strokeWidth="3"
          />
          {/* Progress circle */}
          <circle
            cx="24"
            cy="24"
            r={r}
            fill="none"
            stroke={urgent ? 'var(--accent2)' : 'var(--accent3)'}
            strokeWidth="3"
            strokeDasharray={circ}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1s linear' }}
          />
        </svg>
        <div
          className={`absolute inset-0 flex flex-col items-center justify-center font-mono font-black text-[9px] text-center leading-none ${
            urgent ? 'text-[var(--accent2)]' : 'text-[var(--accent3)]'
          }`}
        >
          <span>{minutes}m</span>
          <span>{seconds.toString().padStart(2, '0')}s</span>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-[680px] mx-auto animate-fade-in pb-10">
      <div className="flex justify-between items-end mb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[rgba(124,106,240,0.12)] border border-[rgba(124,106,240,0.25)] flex items-center justify-center text-[var(--accent)]">
              <History size={18} />
            </div>
            <div>
              <h1 className="text-3xl font-display font-black text-[var(--text)] leading-none">Download History</h1>
              <p className="text-xs text-[var(--muted)] mt-1.5 font-medium">
                Browser processing buffers expire from history in exactly 1 hour.
              </p>
            </div>
          </div>
        </div>

        {activeHistory.length > 0 && (
          <button
            type="button"
            onClick={onClearHistory}
            className="flex items-center gap-1.5 bg-[rgba(240,98,146,0.1)] border border-[rgba(240,98,146,0.25)] text-[var(--accent2)] hover:bg-[rgba(240,98,146,0.18)] rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer"
          >
            <Trash2 size={13} /> Clear Recent Session
          </button>
        )}
      </div>

      {activeHistory.length === 0 ? (
        <div className="text-center py-20 px-4 border border-dashed border-[var(--border)] rounded-2xl bg-[var(--surface)]/20">
          <div className="text-4xl mb-4 opacity-50">📂</div>
          <h2 className="font-display font-bold text-lg text-[var(--text)] mb-1">No downloads processed</h2>
          <p className="text-xs text-[var(--muted)] max-w-sm mx-auto">
            Process any document inside one of the tab utilities to see file download links list here.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {activeHistory.map((h) => {
            const fileList = h.files || [];
            const hasFiles = fileList.length > 0;
            const isMulti = fileList.length > 1;
            const isExpanded = !!expanded[h.id];

            return (
              <div
                key={h.id}
                className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-hidden flex flex-col hover:border-[var(--muted)] transition-colors"
              >
                {/* Header row */}
                <div className="p-4.5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    <div className="w-11 h-11 rounded-xl bg-[rgba(124,106,240,0.12)] border border-[rgba(124,106,240,0.2)] flex items-center justify-center text-[var(--accent)] flex-shrink-0">
                      <FileText size={18} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="font-sans font-bold text-[14px] text-[var(--text)] truncate">
                        {h.name}
                      </p>
                      <div className="flex items-center gap-2 text-[11px] mt-1 font-medium text-[var(--muted)]">
                        <span className="text-[var(--accent)] font-semibold">{h.tool}</span>
                        <span>·</span>
                        <span>{h.size}</span>
                        <span>·</span>
                        <span>{new Date(h.time).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Area */}
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {hasFiles && (
                      <div className="flex items-center gap-1.5">
                        {!isMulti ? (
                          <button
                            type="button"
                            onClick={() => handleDownloadFile(fileList[0])}
                            className="bg-[var(--accent)] hover:opacity-90 text-white rounded-xl px-3.5 py-1.8 text-xs font-bold flex items-center gap-1.5 shadow-sm transition-opacity cursor-pointer whitespace-nowrap"
                          >
                            <Download size={13} />
                            Download
                          </button>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleDownloadAll(fileList)}
                              className="bg-[var(--accent)] hover:opacity-90 text-white rounded-xl px-3.5 py-1.8 text-xs font-bold flex items-center gap-1.5 shadow-sm transition-opacity cursor-pointer whitespace-nowrap"
                            >
                              <Download size={13} />
                              Download All ({fileList.length})
                            </button>
                            <button
                              type="button"
                              onClick={() => toggleExpand(h.id)}
                              className="bg-[var(--surface2)] hover:bg-[var(--border)] border border-[var(--border)] text-[var(--text)] rounded-xl p-2 text-xs transition-colors cursor-pointer flex items-center justify-center"
                              title={isExpanded ? "Hide files" : "Show files"}
                            >
                              {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    <ExpiryRing time={h.time} />
                  </div>
                </div>

                {/* Expanded individual files list */}
                {isMulti && isExpanded && (
                  <div className="border-t border-[var(--border)] bg-[rgba(124,106,240,0.02)] xl:bg-[rgba(124,106,240,0.03)] px-4.5 py-3 flex flex-col gap-2">
                    <span className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-wider mb-1">
                      Processed File Output List
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {fileList.map((file, idx) => (
                        <div
                          key={idx}
                          className="bg-[var(--surface2)] border border-[var(--border)] rounded-xl px-3.5 py-2.5 flex items-center justify-between gap-3 text-xs leading-none"
                        >
                          <span className="font-medium text-[var(--text)] truncate flex-1 leading-normal">
                            {file.name}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDownloadFile(file)}
                            className="text-[var(--accent)] bg-[rgba(124,106,240,0.1)] hover:bg-[rgba(124,106,240,0.18)] p-1.5 rounded-lg transition-colors cursor-pointer"
                            title="Download this file"
                          >
                            <Download size={13} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface PdfPage {
  id: string;
  fileName: string;
  data: Uint8Array;
  pageIndex: number;
  preview: string | null;
}

export interface HistoryFile {
  name: string;
  bytes?: Uint8Array;
  dataUrl?: string;
}

export interface HistoryItem {
  id: string;
  name: string;
  tool: string;
  size: string;
  time: number; // timestamp in ms
  files?: HistoryFile[];
}

export interface User {
  name: string;
  email: string;
}

export interface ContactForm {
  name: string;
  email: string;
  msg: string;
}

export interface Tool {
  id: string;
  name: string;
  icon: string;
  color: string;
  desc: string;
}

/**
 * Renders a thumbnail of a PDF page as a Jpeg base64 string.
 */
export async function renderThumb(data: Uint8Array, pageIndex: number, scale = 0.35): Promise<string | null> {
  try {
    const pdfjs = (window as any).pdfjsLib;
    if (!pdfjs) {
      console.warn('pdfjsLib is not loaded on window.');
      return null;
    }
    // Deep-copy array buffer to avoid shared-state issues
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
    return canvas.toDataURL('image/jpeg', 0.72);
  } catch (err) {
    console.error('Error rendering page thumbnail:', err);
    return null;
  }
}

/**
 * Downloads generated binary data as a local file download.
 */
export function downloadPdf(bytes: Uint8Array, fileName: string): number {
  const blob = new Blob([bytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
  return blob.size;
}

/**
 * Downloads a data URL as an image file.
 */
export function downloadImage(dataUrl: string, fileName: string): void {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = fileName;
  a.click();
}

/**
 * Human-readable size formatter.
 */
export function formatBytes(bytes: number | undefined): string {
  if (bytes === undefined || isNaN(bytes)) return '—';
  if (bytes === 0) return '0 B';
  if (bytes >= 1048576) return (bytes / 1048576).toFixed(2) + ' MB';
  return (bytes / 1024).toFixed(1) + ' KB';
}

/**
 * Simulated internal database
 */
export const SimulatedDB = {
  users: [] as { name: string; email: string; pass: string }[],
  contacts: [] as { name: string; email: string; msg: string; time: string }[]
};

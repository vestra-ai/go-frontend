"use client";

import type { PDFDocumentProxy, PDFPageProxy, RenderTask } from "pdfjs-dist";
import { useEffect, useRef, useState } from "react";
import { openPdf } from "@/lib/pdf";

/** Canvas pixels per CSS pixel: at least 2, so the page still reads when pinched in; at most 3, to keep a canvas small. */
const sharpness = () => Math.min(3, Math.max(2, window.devicePixelRatio || 1));

/** A page that is not drawn yet: a white sheet of the page's own shape (A4 until that is known). */
export function PdfPageSkeleton({ ratio = 210 / 297 }: { ratio?: number }) {
  return (
    <div data-pdf-page aria-hidden style={{ aspectRatio: ratio }} className="flex w-full flex-col gap-2 bg-white p-[22px] shadow-page">
      {["46%", "92%", "84%", "88%", "60%"].map((w) => (
        <span key={w} className="block h-2.5 rounded-xs bg-skeleton" style={{ width: w }} />
      ))}
    </div>
  );
}

function Page({ page }: { page: PDFPageProxy }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const base = page.getViewport({ scale: 1 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const natural = page.getViewport({ scale: 1 });
    const viewport = page.getViewport({ scale: ((canvas.clientWidth || natural.width) / natural.width) * sharpness() });
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);
    const task: RenderTask = page.render({ canvas, viewport });
    // A render that was cancelled rejects: there is nothing to do about it.
    task.promise.catch(() => {});
    return () => task.cancel();
  }, [page]);

  return (
    <div data-pdf-page className="w-full">
      <canvas ref={canvasRef} style={{ aspectRatio: base.width / base.height }} className="block w-full bg-white shadow-page" />
    </div>
  );
}

type PdfDocumentProps = {
  file: Blob;
  /** The file's own page count, once it is open. */
  onPages: (pages: number) => void;
  /** The file could not be read as a PDF. */
  onFailed: () => void;
};

/** A PDF's own pages, one canvas each, in the document flow. Both callbacks must keep their identity between renders. */
export function PdfDocument({ file, onPages, onFailed }: PdfDocumentProps) {
  const [pages, setPages] = useState<PDFPageProxy[] | null>(null);

  useEffect(() => {
    let current = true;
    let opened: PDFDocumentProxy | null = null;
    (async () => {
      const pdf = await openPdf(await file.arrayBuffer());
      opened = pdf;
      if (!current) return void pdf.loadingTask.destroy();
      const all = await Promise.all(Array.from({ length: pdf.numPages }, (_, i) => pdf.getPage(i + 1)));
      if (!current) return;
      setPages(all);
      onPages(pdf.numPages);
    })().catch(() => current && onFailed());
    return () => {
      current = false;
      void opened?.loadingTask.destroy();
    };
  }, [file, onPages, onFailed]);

  if (!pages) return <PdfPageSkeleton />;
  return pages.map((page) => <Page key={page.pageNumber} page={page} />);
}

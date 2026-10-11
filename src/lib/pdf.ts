import type { PDFDocumentProxy } from "pdfjs-dist";

// pdf.js, for a booking's own file (its e-ticket, its hotel voucher) drawn inside the app. Loaded only when a file is
// opened, never with the page. The legacy build: it runs on the older phone browsers too.

let ready: Promise<typeof import("pdfjs-dist/legacy/build/pdf.mjs")> | null = null;

function load() {
  ready ??= import("pdfjs-dist/legacy/build/pdf.mjs").then((pdfjs) => {
    pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/legacy/build/pdf.worker.min.mjs", import.meta.url).toString();
    return pdfjs;
  });
  // A load that failed (offline) is tried again the next time a file opens.
  ready.catch(() => (ready = null));
  return ready;
}

/** Opens a PDF from its bytes. The caller destroys its `loadingTask` when it is done with the document. */
export async function openPdf(bytes: ArrayBuffer): Promise<PDFDocumentProxy> {
  const pdfjs = await load();
  return pdfjs.getDocument({ data: new Uint8Array(bytes) }).promise;
}

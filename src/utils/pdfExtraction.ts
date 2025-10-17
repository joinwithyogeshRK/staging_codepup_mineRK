import * as pdfjsLib from "pdfjs-dist";

// Use the official worker from CDN
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

export interface ExtractedImageFile extends File {
  originalPdfName: string;
  pageNumber: number;
  totalPages: number;
  sliceNumber?: number;
}

export interface PdfExtractionResult {
  extractedImages: ExtractedImageFile[];
  originalPdf: File;
}

export const extractImagesFromPdf = async (
  pdfFile: File,
  pageSizeLimit: number = 5,
  showToast: (msg: string, type: "success" | "error", duration?: number) => void
): Promise<PdfExtractionResult | null> => {
  try {
    const arrayBuffer = await pdfFile.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    if (pdf.numPages > pageSizeLimit) {
      showToast(
        `🐾 Arf! "${pdfFile.name}" has ${pdf.numPages} pages. Our pup can only handle ${pageSizeLimit} at a time.`,
        "error"
      );
      return null;
    }

    const extractedImages: ExtractedImageFile[] = [];

    // A4 size in pixels at 150 DPI (you can tune)
    const A4_WIDTH_PX = Math.round(8.27 * 150);
    const A4_HEIGHT_PX = Math.round(12 * 150);
    const OVERLAP_PX = 40; // vertical overlap between slices

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale: 2 }); // ~144 DPI
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d")!;
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      await page.render({ canvasContext: ctx, viewport, canvas }).promise;

      const pageWidth = canvas.width;
      const pageHeight = canvas.height;

      // Compute how many slices fit into this page
      const sliceHeight = A4_HEIGHT_PX;
      const nSlices = Math.ceil((pageHeight + OVERLAP_PX) / (sliceHeight - OVERLAP_PX));

      for (let s = 0; s < nSlices; s++) {
        const startY = s * (sliceHeight - OVERLAP_PX);
        const endY = Math.min(startY + sliceHeight, pageHeight);
        const actualHeight = endY - startY;

        // Create sub-canvas
        const sliceCanvas = document.createElement("canvas");
        sliceCanvas.width = pageWidth;
        sliceCanvas.height = actualHeight;
        const sliceCtx = sliceCanvas.getContext("2d")!;

        sliceCtx.drawImage(
          canvas,
          0, startY, pageWidth, actualHeight, // source rect
          0, 0, pageWidth, actualHeight       // destination rect
        );

        const blob = await new Promise<Blob>((resolve, reject) => {
          sliceCanvas.toBlob(
            (b) => (b ? resolve(b) : reject(new Error("toBlob failed"))),
            "image/png",
            0.9
          );
        });

        const imageFile = new File(
          [blob],
          `${pdfFile.name}-page-${pageNum}-slice-${s + 1}.png`,
          { type: "image/png", lastModified: Date.now() }
        ) as ExtractedImageFile;

        imageFile.originalPdfName = pdfFile.name;
        imageFile.pageNumber = pageNum;
        imageFile.totalPages = pdf.numPages;
        imageFile.sliceNumber = s + 1;

        extractedImages.push(imageFile);
      }
    }

    return { extractedImages, originalPdf: pdfFile };
  } catch (err: any) {
    const msg = err?.message ?? String(err);
    if (msg.includes("Invalid PDF"))
      showToast(`🐾 Arf! "${pdfFile.name}" doesn't look like a valid PDF. Try another file?`, "error");
    else
      showToast(`🐾 Arf! Our pup had trouble sniffing through your PDF: ${msg}`, "error");
    return null;
  }
};

export const validatePdfFile = (
  pdfFile: File,
  maxSizeMB = 5,
  pageSizeLimit = 5,
  showToast: (m: string, t: "success" | "error", d?: number) => void
): boolean => {
  if (pdfFile.size > maxSizeMB * 1024 * 1024) {
    showToast(
      `🐾 Ruff! "${pdfFile.name}" is too big for our pup to carry. Max size is ${maxSizeMB}MB.`,
      "error"
    );
    return false;
  }
  return true;
};

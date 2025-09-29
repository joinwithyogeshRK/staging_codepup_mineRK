import * as pdfjsLib from "pdfjs-dist";

// Use the most reliable CDN approach
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

export interface ExtractedImageFile extends File {
  originalPdfName: string;
  pageNumber: number;
  totalPages: number;
}

export interface PdfExtractionResult {
  extractedImages: ExtractedImageFile[];
  originalPdf: File;
}

/**
 * Extracts images from PDF pages and returns both the extracted images and original PDF
 * @param pdfFile - The PDF file to extract images from
 * @param pageSizeLimit - Maximum number of pages to extract (default: 5)
 * @param showToast - Toast function for error messages
 * @returns Promise with extracted images and original PDF
 */
export const extractImagesFromPdf = async (
  pdfFile: File,
  pageSizeLimit: number = 5,
  showToast: (message: string, type: "success" | "error", duration?: number) => void
): Promise<PdfExtractionResult | null> => {
  try {
    const arrayBuffer = await pdfFile.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    // Check page limit
    if (pdf.numPages > pageSizeLimit) {
      showToast(
        `🐾 Arf! "${pdfFile.name}" has ${pdf.numPages} pages. Our pup can only handle ${pageSizeLimit} at a time.`,
        "error"
      );
      return null;
    }

    const extractedImages: ExtractedImageFile[] = [];

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale: 1.5 });

      // Create canvas to render PDF page
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d")!;
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      // Render page to canvas
      await page.render({
        canvasContext: context,
        viewport: viewport,
        canvas: canvas,
      }).promise;

      // Convert canvas to blob with better error handling
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (result) => {
            if (result) {
              resolve(result);
            } else {
              reject(new Error("Failed to convert canvas to blob"));
            }
          },
          "image/png",
          0.9
        );
      });

      // Create a File object from the blob with PDF metadata
      const imageFile = new File(
        [blob],
        `${pdfFile.name}-page-${pageNum}.png`,
        {
          type: "image/png",
          lastModified: Date.now(),
        }
      ) as ExtractedImageFile;

      // Add custom properties to identify this as a PDF-derived image
      imageFile.originalPdfName = pdfFile.name;
      imageFile.pageNumber = pageNum;
      imageFile.totalPages = pdf.numPages;

      extractedImages.push(imageFile);
    }

    return {
      extractedImages,
      originalPdf: pdfFile,
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    // More specific error messages
    if (errorMessage.includes("Invalid PDF")) {
      showToast(`🐾 Arf! "${pdfFile.name}" doesn't look like a valid PDF. Try another file?`, "error");
    } else if (errorMessage.includes("workerSrc")) {
      showToast(
        "🐾 Arf! Our pup couldn't chew through this PDF. Please refresh and try again!",
        "error"
      );
    } else {
      showToast(`🐾 Arf! Our pup had trouble sniffing through your PDF: ${errorMessage}.`, "error");
    }
    return null;
  }
};

/**
 * Validates PDF file size and page count
 * @param pdfFile - The PDF file to validate
 * @param maxSizeMB - Maximum file size in MB (default: 3.75)
 * @param pageSizeLimit - Maximum number of pages (default: 5)
 * @param showToast - Toast function for error messages
 * @returns true if valid, false otherwise
 */
export const validatePdfFile = (
  pdfFile: File,
  maxSizeMB: number = 5,
  pageSizeLimit: number = 5,
  showToast: (message: string, type: "success" | "error", duration?: number) => void
): boolean => {
  // Check file size
  if (pdfFile.size > maxSizeMB * 1024 * 1024) {
    showToast(
      `🐾 Ruff! "${pdfFile.name}" is too big for our pup to carry. Max size is ${maxSizeMB}MB.`,
      "error"
    );
    return false;
  }

  // Note: Page count validation is handled in extractImagesFromPdf function
  // This function only validates file size
  return true;
};
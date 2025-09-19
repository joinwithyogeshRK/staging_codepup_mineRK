import React, { useCallback, useState } from "react";
import { Upload, ImageIcon, FileText } from "lucide-react";
import * as pdfjsLib from "pdfjs-dist";
import PdfPreview from "./pdfpreview";

// Use the most reliable CDN approach
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

interface ImageUploadSectionProps {
  selectedImages: File[];
  setSelectedImages: React.Dispatch<React.SetStateAction<File[]>>;
  selectedProjectType: "frontend" | "fullstack" | null;
  isConfigValid: boolean;
  showToast: (
    message: string,
    type: "success" | "error",
    duration?: number
  ) => void;
  // Optional: parent can collect original PDFs separately for upload
  setSelectedPdfs?: React.Dispatch<React.SetStateAction<File[]>>;
}

const ImageUploadSection = ({
  selectedImages,
  setSelectedImages,
  selectedProjectType,
  isConfigValid,
  showToast,
  setSelectedPdfs,
}: ImageUploadSectionProps) => {
  const [isProcessingPdf, setIsProcessingPdf] = useState(false);
  const [pdfGroups, setPdfGroups] = useState<{ [key: string]: File[] }>({});

  // Function to extract images from PDF
  const extractImagesFromPdf = async (pdfFile: File) => {
    try {
      setIsProcessingPdf(true);

      const arrayBuffer = await pdfFile.arrayBuffer();

      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

      // Check page limit
      if (pdf.numPages > 5) {
        showToast(
          `PDF "${pdfFile.name}" has ${pdf.numPages} pages. Maximum 5 pages allowed.`,
          "error"
        );
        return [];
      }

      const extractedImages = [];

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
          canvasContext: context!,
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
        );

        // Add custom property to identify this as a PDF-derived image
        (imageFile as any).originalPdfName = pdfFile.name;
        (imageFile as any).pageNumber = pageNum;
        (imageFile as any).totalPages = pdf.numPages;

        extractedImages.push(imageFile);
      }

      showToast(
        `Successfully extracted ${extractedImages.length} images from PDF`,
        "success"
      );
      return extractedImages;
    } catch (error: unknown) {
      
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      // More specific error messages
      if (errorMessage.includes("Invalid PDF")) {
        showToast(`"${pdfFile.name}" is not a valid PDF file`, "error");
      } else if (errorMessage.includes("workerSrc")) {
        showToast(
          "PDF.js worker not properly configured. Please refresh and try again.",
          "error"
        );
      } else {
        showToast(`Failed to process PDF: ${errorMessage}`, "error");
      }
      return [];
    } finally {
      setIsProcessingPdf(false);
    }
  };

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const newFiles = Array.from(e.target.files || []);
      if (newFiles.length === 0) return;

      // Separate PDFs and images
      const imageFiles = newFiles.filter((file: File) =>
        file.type.startsWith("image/")
      );
      const pdfFiles = newFiles.filter(
        (file: File) => file.type === "application/pdf"
      );

      // Check if we have unsupported files
      const supportedFiles = imageFiles.length + pdfFiles.length;
      if (supportedFiles !== newFiles.length) {
        showToast(
          "Only image files (PNG, JPG, GIF) and PDF files are supported",
          "error"
        );
      }

      let allImageFiles = [...imageFiles];

      // If any PDFs were selected, notify parent so originals can be uploaded as PDFs
      if (pdfFiles.length > 0 && typeof setSelectedPdfs === 'function') {
        setSelectedPdfs((prev: File[]) => {
          // Deduplicate by name+size to avoid duplicates on repeated selections
          const existingKeys = new Set(prev.map((f) => `${f.name}:${f.size}`));
          const toAdd = pdfFiles.filter((f) => !existingKeys.has(`${f.name}:${f.size}`));
          return [...prev, ...toAdd];
        });
      }

      // Process PDF files if any - CONVERT TO IMAGES (for UI preview only)
      if (pdfFiles.length > 0) {
        for (const pdfFile of pdfFiles) {
          // Check file size (3.75MB limit)
          if (pdfFile.size > 3.75 * 1024 * 1024) {
            showToast(
              `PDF file "${pdfFile.name}" is too large. Maximum size is 3.75MB`,
              "error"
            );
            continue;
          }

          // Extract images from PDF
          const extractedImages = await extractImagesFromPdf(pdfFile);
          if (extractedImages.length > 0) {
            // Group the images by PDF name for preview purposes
            setPdfGroups((prev) => ({
              ...prev,
              [pdfFile.name]: extractedImages,
            }));

            allImageFiles.push(...extractedImages);
          }
        }
      }

      // Validate image files
      const validImageFiles: File[] = [];
      for (const file of allImageFiles) {
        // Check file size
        if ((file as File).size > 3.75 * 1024 * 1024) {
          showToast(
            `Image "${
              (file as File).name
            }" is too large. Maximum size is 3.75MB`,
            "error"
          );
          continue;
        }
        validImageFiles.push(file as File);
      }

      // Add to selected images
      setSelectedImages((prev: File[]) => {
        const availableSlots = 5 - prev.length;

        if (availableSlots <= 0) {
          showToast(
            "You can add only 5 images. Remove existing to add more",
            "error"
          );
          return prev;
        }

        if (validImageFiles.length > availableSlots) {
          showToast(
            `Only ${availableSlots} image(s) were added due to the 5-image limit`,
            "error"
          );
        }

        const filesToAdd: File[] = validImageFiles.slice(0, availableSlots);
        return [...prev, ...filesToAdd];
      });

      // Clear the input
      e.target.value = "";
    },
    [setSelectedImages, showToast]
  );

  // Helper function to group images by their original PDF
  const getImageGroups = () => {
    const groups: { [key: string]: File[] } = {};
    const standaloneImages: File[] = [];

    selectedImages.forEach((image) => {
      const originalPdfName = (image as any).originalPdfName;
      if (originalPdfName) {
        if (!groups[originalPdfName]) {
          groups[originalPdfName] = [];
        }
        groups[originalPdfName].push(image);
      } else {
        standaloneImages.push(image);
      }
    });

    return { groups, standaloneImages };
  };

  const removePdfGroup = (pdfName: string) => {
    setSelectedImages((prev) =>
      prev.filter((image) => (image as any).originalPdfName !== pdfName)
    );
    setPdfGroups((prev) => {
      const updated = { ...prev };
      delete updated[pdfName];
      return updated;
    });
  };

  const removeStandaloneImage = (index: number) => {
    const { standaloneImages } = getImageGroups();
    const imageToRemove = standaloneImages[index];
    setSelectedImages((prev) => prev.filter((img) => img !== imageToRemove));
  };

  return (
    <div className="image-upload-section">
      <label className="image-upload-label">
        <ImageIcon className="size-icon-small inline mr-2" />
        Add reference images or PDFs (optional)
      </label>
      <div className="relative">
        <input
          type="file"
          multiple
          accept="image/*,.pdf"
          onChange={handleFileSelect}
          className="image-upload-input"
          id="image-upload"
          disabled={
            (selectedProjectType === "fullstack" && !isConfigValid) ||
            isProcessingPdf
          }
        />
        <label
          htmlFor="image-upload"
          className={`image-upload-area ${
            isProcessingPdf
              ? "image-upload-area-processing"
              : "image-upload-area-enabled"
          }`}
        >
          <div className="image-upload-content">
            {isProcessingPdf ? (
              <>
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="image-upload-text">Processing PDF...</p>
              </>
            ) : (
              <>
                <Upload className="image-upload-icon" />
                <p className="image-upload-text">
                  {selectedImages.length > 0
                    ? `${selectedImages.length} image${
                        selectedImages.length > 1 ? "s" : ""
                      } selected`
                    : "Click to upload images or PDFs"}
                </p>
                <p className="image-upload-hint">
                  Images: PNG, JPG, GIF | PDFs: converted to images
                  <br />
                  Up to 3.75MB each (max 5 files total)
                </p>
              </>
            )}
          </div>
        </label>
      </div>

      {/* Selected images preview */}
      {selectedImages.length > 0 && (
        <div className="image-preview-container">
          {(() => {
            const { groups, standaloneImages } = getImageGroups();

            return (
              <>
                {/* Show PDF groups using your existing PdfPreview component */}
                {Object.entries(groups).map(([pdfName, images]) => {
                  // Create a mock PDF file object for the PdfPreview component
                  const mockPdfFile = new File([], pdfName, {
                    type: "application/pdf",
                  });

                  return (
                    <PdfPreview
                      key={pdfName}
                      file={mockPdfFile}
                      onRemove={() => removePdfGroup(pdfName)}
                      size="medium"
                    />
                  );
                })}

                {/* Show standalone images normally */}
                {standaloneImages.map((image: File, index: number) => (
                  <div
                    key={`standalone-${index}`}
                    className="image-preview-item"
                  >
                    <img
                      src={URL.createObjectURL(image)}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-full object-cover rounded-lg"
                    />
                    <button
                      onClick={() => removeStandaloneImage(index)}
                      className="image-preview-remove"
                      disabled={isProcessingPdf}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
};

export default ImageUploadSection;

import React, { useCallback, useState } from "react";
import { Upload, ImageIcon, FileText, Lightbulb } from "lucide-react";
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
          `Arf! 🐶 "${pdfFile.name}" has ${pdf.numPages} pages. Our pup can only handle 5 at a time.`,
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

      return extractedImages;
    } catch (error: unknown) {
      
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      // More specific error messages
      if (errorMessage.includes("Invalid PDF")) {
        showToast(`Arf! 🐶 "${pdfFile.name}" doesn’t look like a valid PDF. Try another file?`, "error");
      } else if (errorMessage.includes("workerSrc")) {
        showToast(
          "Arf! 🐶 Our pup couldn’t chew through this PDF. Please refresh and try again!",
          "error"
        );
      } else {
        showToast(`Arf! 🐾 Our pup had trouble sniffing through your PDF: ${errorMessage}.`, "error");
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
          "Woof! 🐾 Our pup only accepts images (PNG, JPG, JPEG, WEBP) or PDFs.",
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
              `Ruff! 🐶 "${pdfFile.name}" is too big for our pup to carry. Max size is 3.75MB.`,
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

      // Remove duplicates: prevent re-adding the same standalone image or same PDF page
      const existingKeys = new Set(
        selectedImages.map((img: File) => {
          const originalPdfName = (img as any).originalPdfName;
          const pageNumber = (img as any).pageNumber;
          return originalPdfName
            ? `pdf:${originalPdfName}:${pageNumber}`
            : `img:${img.name}:${img.size}`;
        })
      );

      const batchKeys = new Set<string>();
      const dedupedFiles: File[] = [];
      for (const file of allImageFiles) {
        const originalPdfName = (file as any).originalPdfName;
        const pageNumber = (file as any).pageNumber;
        const key = originalPdfName
          ? `pdf:${originalPdfName}:${pageNumber}`
          : `img:${file.name}:${file.size}`;

        if (existingKeys.has(key) || batchKeys.has(key)) {
          continue;
        }
        batchKeys.add(key);
        dedupedFiles.push(file);
      }

      if (dedupedFiles.length < allImageFiles.length) {
        showToast("Woof! 🐾 That file is already in the basket. No double treats allowed!", "error");
      }

      // Validate image files
      const validImageFiles: File[] = [];
      for (const file of dedupedFiles) {
        // Check file size
        if ((file as File).size > 3.75 * 1024 * 1024) {
          showToast(
            `Ruff! 🐶 "${(file as File).name}" is too big for our pup to carry. Max size is 3.75MB.`,
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
            "Woof! 🐾 You can only keep 5 images. Remove one before adding more.",
            "error"
          );
          return prev;
        }
        // User selects more than 5 images at once
        if (validImageFiles.length > availableSlots) {
          showToast(
            `Yip! 🐾 Our pup could only fetch ${availableSlots} images because of the 5-image limit.`,
            "error"
          );
        }

        const filesToAdd: File[] = validImageFiles.slice(0, availableSlots);
        return [...prev, ...filesToAdd];
      });

      // Clear the input
      e.target.value = "";
    },
    [setSelectedImages, showToast, selectedImages, setSelectedPdfs]
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
        {/* <Lightbulb className="size-icon-small inline mr-2 text-yellow-500" />
        Attach your PDFs (like resume for portfolio) or add reference images for your website. */}
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
                
                <div className="image-upload-hint">
                  <ul className="text-[14px]">
                    <li> Attach your PDFs (like resume for portfolio) for your website</li>
                    <li> Reference images: Add brand shots, color swatches, or layout mocks so your site looks <em>paws-itively</em> customized.</li>
                    {/* <li>Images | PDFs (up to 5 pages)</li> */}
                    {/* <li>Max 5 files total, up to 3.75MB each.</li> */}
                  </ul>
                </div>
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

import React, {
  useRef,
  useImperativeHandle,
  forwardRef,
  useState,
  useCallback,
} from "react";
import * as pdfjsLib from "pdfjs-dist";
import { uploadFilesToDatabase } from "../utils/fileUpload";

// Use the most reliable CDN approach
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

interface UnifiedFileUploadSectionProps {
  selectedFiles: File[];
  setSelectedFiles: React.Dispatch<React.SetStateAction<File[]>>;
  isConfigValid: boolean;
  showToast: (
    message: string,
    type: "success" | "error",
    duration?: number
  ) => void;
  uploadMode: "images" | "docs";
  projectId?: number;
  getToken?: () => Promise<string | null>;
}

export interface UnifiedFileUploadRef {
  click: () => void;
}

const UnifiedFileUploadSection = forwardRef<
  UnifiedFileUploadRef,
  UnifiedFileUploadSectionProps
>(
  (
    {
      selectedFiles,
      setSelectedFiles,
      isConfigValid,
      showToast,
      uploadMode,
      projectId,
      getToken,
    },
    ref
  ) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isProcessingPdf, setIsProcessingPdf] = useState(false);

    // Expose click method to parent
    useImperativeHandle(ref, () => ({
      click: () => {
        fileInputRef.current?.click();
      },
    }));

    // Function to extract images from PDF (copied from ImageUploadSection)
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

          // Create a File object from the blob
          const imageFile = new File(
            [blob],
            `${pdfFile.name}-page-${pageNum}.png`,
            {
              type: "image/png",
              lastModified: Date.now(),
            }
          );
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

        try {
          // Separate PDFs and images
          const imageFiles = newFiles.filter((file: File) =>
            file.type.startsWith("image/")
          );
          const pdfFiles = newFiles.filter(
            (file: File) => file.type === "application/pdf"
          );
          const otherFiles = newFiles.filter(
            (file: File) =>
              !file.type.startsWith("image/") && file.type !== "application/pdf"
          );

          let allImageFiles = [...imageFiles];

          // For docs mode, convert other document types to images (basic text conversion)
          if (uploadMode === "docs" && otherFiles.length > 0) {
            for (const file of otherFiles) {
              const convertedImage = await convertDocumentToImage(file);
              if (convertedImage) {
                allImageFiles.push(convertedImage);
              }
            }
          }

          // Process PDF files if any
          if (pdfFiles.length > 0) {
            showToast(
              `Processing ${pdfFiles.length} PDF file(s)...`,
              "success"
            );

            for (const pdfFile of pdfFiles) {
              // Check file size (3.75MB limit)
              if (pdfFile.size > 3.75 * 1024 * 1024) {
                showToast(
                  `PDF file "${pdfFile.name}" is too large. Maximum size is 3.75MB`,
                  "error"
                );
                continue;
              }

              const extractedImages = await extractImagesFromPdf(pdfFile);
              allImageFiles = [...allImageFiles, ...extractedImages];
            }
          }

          // Validate image files
          const validImageFiles: File[] = [];
          for (const file of allImageFiles) {
            // Check file size
            if (file.size > 3.75 * 1024 * 1024) {
              showToast(
                `Image "${file.name}" is too large. Maximum size is 3.75MB`,
                "error"
              );
              continue;
            }
            validImageFiles.push(file);
          }

          if (validImageFiles.length > 0) {
            // Only take the first file for docs mode (replace existing selection)
            const selectedFiles = validImageFiles.slice(0, 1);
            setSelectedFiles(selectedFiles);

            // Upload files to database if projectId and getToken are provided
            if (projectId && getToken) {
              try {
                const token = await getToken();
                if (token) {
                  await uploadFilesToDatabase(selectedFiles, projectId, token);
                }
              } catch (error) {
                // Don't show error to user as this is a background operation
              }
            }

            showToast(`Document converted to image successfully`, "success");
          } else {
            showToast("No valid files to process", "error");
          }
        } catch (error) {
          showToast("Error processing files", "error");
        }

        // Clear the input
        e.target.value = "";
      },
      [setSelectedFiles, showToast, uploadMode, extractImagesFromPdf]
    );

    // Convert other document types to image (basic implementation)
    const convertDocumentToImage = async (file: File): Promise<File | null> => {
      try {
        if (file.type === "text/plain" || file.name.endsWith(".txt")) {
          // Convert text to image
          const text = await file.text();
          return await createImageFromText(text, file.name);
        } else if (file.type === "application/json") {
          // Convert JSON to formatted text, then to image
          const jsonText = await file.text();
          const formattedJson = JSON.stringify(JSON.parse(jsonText), null, 2);
          return await createImageFromText(formattedJson, file.name);
        }
        // Add more document type conversions as needed
        return null;
      } catch (error) {
        return null;
      }
    };

    // Helper function to create image from text
    const createImageFromText = async (
      text: string,
      filename: string
    ): Promise<File> => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d")!;

      // Set canvas size
      canvas.width = 800;
      canvas.height = 600;

      // Set background
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Set text style
      ctx.fillStyle = "#000000";
      ctx.font = "14px monospace";

      // Draw text (with word wrapping)
      const lines = text.split("\n");
      const lineHeight = 18;
      let y = 30;

      for (const line of lines) {
        if (y > canvas.height - 30) break; // Stop if we run out of space

        // Simple word wrap
        const words = line.split(" ");
        let currentLine = "";

        for (const word of words) {
          const testLine = currentLine + word + " ";
          const metrics = ctx.measureText(testLine);

          if (metrics.width > canvas.width - 60 && currentLine !== "") {
            ctx.fillText(currentLine, 30, y);
            currentLine = word + " ";
            y += lineHeight;
            if (y > canvas.height - 30) break;
          } else {
            currentLine = testLine;
          }
        }

        if (currentLine && y <= canvas.height - 30) {
          ctx.fillText(currentLine, 30, y);
          y += lineHeight;
        }
      }

      // Convert canvas to blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (result) => {
            if (result) {
              resolve(result);
            } else {
              reject(new Error("Failed to convert text to image"));
            }
          },
          "image/png",
          0.9
        );
      });

      // Create File object
      return new File([blob], `${filename}-converted.png`, {
        type: "image/png",
        lastModified: Date.now(),
      });
    };

    return (
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,application/pdf,text/plain,application/json,.doc,.docx,.txt"
        onChange={handleFileSelect}
        style={{ display: "none" }}
        disabled={isProcessingPdf}
      />
    );
  }
);

UnifiedFileUploadSection.displayName = "UnifiedFileUploadSection";

export default UnifiedFileUploadSection;

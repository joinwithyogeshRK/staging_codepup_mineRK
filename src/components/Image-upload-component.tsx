import React, { useCallback, useState } from "react";
import { Upload, ImageIcon, FileText, Lightbulb } from "lucide-react";
import PdfPreview from "./pdfpreview";
import { validateFile } from "../utils/fileValidation";
import { useToast } from "../helper/Toast";

interface ImageUploadSectionProps {
  selectedImages: File[];
  setSelectedImages: React.Dispatch<React.SetStateAction<File[]>>;
  selectedProjectType: "frontend" | "fullstack" | null;
  isConfigValid: boolean;
  // Optional: parent can collect original PDFs separately for upload
  setSelectedPdfs?: React.Dispatch<React.SetStateAction<File[]>>;
}

const ImageUploadSection = ({
  selectedImages,
  setSelectedImages,
  selectedProjectType,
  isConfigValid,
  setSelectedPdfs,
}: ImageUploadSectionProps) => {
  const [isProcessingPdf, setIsProcessingPdf] = useState(false);
  const [pdfGroups, setPdfGroups] = useState<{ [key: string]: File[] }>({});
  const [docFiles, setDocFiles] = useState<File[]>([]); // csv, md, xlsx
  const { showToast } = useToast();

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const newFiles = Array.from(e.target.files || []);
      if (newFiles.length === 0) return;

      // Filter by allowed types using validateFile (type-gating only)
      const allowedFiles: File[] = [];
      for (const file of newFiles) {
        const result = await validateFile(file);
        if (result === true) {
          allowedFiles.push(file);
          continue;
        }
        if (typeof result === "string") {
          // Only block unsupported type; other limits are handled locally
          if (result.includes("Unsupported file type")) {
            showToast(result, "error");
            continue;
          }
          // For other messages from validateFile, we do not block here
          allowedFiles.push(file);
        }
      }

      // Separate PDFs, images, and other supported docs from allowed files
      const imageFiles = allowedFiles.filter((file: File) =>
        file.type.startsWith("image/")
      );
      const pdfFiles = allowedFiles.filter(
        (file: File) => file.type === "application/pdf"
      );
      const otherDocFiles = allowedFiles.filter((file: File) => {
        const lower = file.name.toLowerCase();
        return (
          lower.endsWith(".csv") ||
          lower.endsWith(".md") ||
          lower.endsWith(".xlsx") ||
          lower.endsWith(".xls") ||
          lower.endsWith(".txt")
        );
      });

      // Check if we have unsupported files (already handled via validateFile). No-op here.

      let allImageFiles = [...imageFiles];

      // If any PDFs were selected, notify parent so originals can be uploaded as PDFs
      if (pdfFiles.length > 0 && typeof setSelectedPdfs === "function") {
        setSelectedPdfs((prev: File[]) => {
          // Deduplicate by name+size to avoid duplicates on repeated selections
          const existingKeys = new Set(prev.map((f) => `${f.name}:${f.size}`));
          const toAdd = pdfFiles.filter(
            (f) => !existingKeys.has(`${f.name}:${f.size}`)
          );
          return [...prev, ...toAdd];
        });
      }

      // Keep PDFs as-is for backend; update PDF preview groups (no extraction)
      if (pdfFiles.length > 0) {
        if (typeof setSelectedPdfs === "function") {
          setSelectedPdfs((prev: File[]) => {
            const existingKeys = new Set(
              prev.map((f) => `${f.name}:${f.size}`)
            );
            const toAdd = pdfFiles.filter(
              (f) => !existingKeys.has(`${f.name}:${f.size}`)
            );
            return [...prev, ...toAdd];
          });
        }
        // Track for local preview (avoid duplicates)
        setPdfGroups((prev) => {
          const updated = { ...prev };
          for (const pdf of pdfFiles) {
            const key = pdf.name; // keep key by name for remove compatibility
            if (!updated[key]) {
              updated[key] = [pdf];
            }
          }
          return updated;
        });
      }

      // Track other docs (xlsx, md, csv): push to selectedPdfs pathway and keep local list
      if (otherDocFiles.length > 0) {
        if (typeof setSelectedPdfs === "function") {
          setSelectedPdfs((prev: File[]) => {
            const existingKeys = new Set(
              prev.map((f) => `${f.name}:${f.size}`)
            );
            const toAdd = otherDocFiles.filter(
              (f) => !existingKeys.has(`${f.name}:${f.size}`)
            );
            return [...prev, ...toAdd];
          });
        }
        setDocFiles((prev) => {
          const existingKeys = new Set(prev.map((f) => `${f.name}:${f.size}`));
          const toAdd = otherDocFiles.filter(
            (f) => !existingKeys.has(`${f.name}:${f.size}`)
          );
          return [...prev, ...toAdd];
        });
      }

      // Remove duplicates: prevent re-adding the same standalone image or same PDF page
      const existingKeys = new Set(
        selectedImages.map((img: File) => `img:${img.name}:${img.size}`)
      );

      const batchKeys = new Set<string>();
      const dedupedFiles: File[] = [];
      for (const file of allImageFiles) {
        const key = `img:${file.name}:${file.size}`;

        if (existingKeys.has(key) || batchKeys.has(key)) {
          continue;
        }
        batchKeys.add(key);
        dedupedFiles.push(file);
      }

      if (dedupedFiles.length < allImageFiles.length) {
        showToast(
          "Woof! 🐾 That file is already in the basket. No double treats allowed!",
          "error"
        );
      }

      // Validate image files (and treat PDFs the same for size limits)
      const validImageFiles: File[] = [];
      for (const file of dedupedFiles) {
        if ((file as File).size > 3.75 * 1024 * 1024) {
          showToast(
            `Ruff! 🐶 "${
              (file as File).name
            }" is too big for our pup to carry. Max size is 3.75MB.`,
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
    // Also remove the corresponding PDF from selectedPdfs
    if (typeof setSelectedPdfs === "function") {
      setSelectedPdfs((prev) => prev.filter((pdf) => pdf.name !== pdfName));
    }
  };

  const removeDocFile = (name: string) => {
    setDocFiles((prev) => prev.filter((f) => f.name !== name));
    if (typeof setSelectedPdfs === "function") {
      setSelectedPdfs((prev) => prev.filter((f) => f.name !== name));
    }
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
          accept="image/*,.pdf,.csv,.md,.xlsx,.xls,.txt"
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
          className={`image-upload-area ${"image-upload-area-enabled"}`}
        >
          <div className="image-upload-content">
            <>
              <Upload className="image-upload-icon" />

              <div className="image-upload-hint">
                <ul className="text-[14px]">
                  <li>
                    {" "}
                    Attach your PDFs (like resume for portfolio) for your
                    website
                  </li>
                  <li>
                    {" "}
                    You can also add brand shots, color swatches, or layout
                    mocks so your site looks <em>paws-itively</em> customized.
                  </li>
                  {/* <li>Images | PDFs (up to 5 pages)</li> */}
                  {/* <li>Max 5 files total, up to 3.75MB each.</li> */}
                </ul>
              </div>
            </>
          </div>
        </label>
      </div>

      {/* Selected files preview */}
      {(Object.keys(pdfGroups).length > 0 ||
        docFiles.length > 0 ||
        selectedImages.length > 0) && (
        <div className="image-preview-container">
          {(() => {
            // Render PDF previews from tracked pdfGroups
            const pdfEntries = Object.entries(pdfGroups);
            const { groups, standaloneImages } = getImageGroups();

            return (
              <>
                {/* Show PDF previews */}
                {pdfEntries.map(([key, files]) => {
                  const pdfFile = files[0];
                  return (
                    <PdfPreview
                      key={key}
                      file={pdfFile}
                      onRemove={() => removePdfGroup(pdfFile.name)}
                      size="medium"
                    />
                  );
                })}

                {/* Show other docs (xlsx, md, csv) */}
                {docFiles.map((doc) => (
                  <PdfPreview
                    key={`doc-${doc.name}`}
                    file={doc}
                    onRemove={() => removeDocFile(doc.name)}
                    size="medium"
                  />
                ))}

                {/* Show standalone images */}
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
                      disabled={false}
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

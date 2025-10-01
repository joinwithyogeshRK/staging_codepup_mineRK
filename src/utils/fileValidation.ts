import * as pdfjsLib from 'pdfjs-dist';

/**
 * Validates a file for upload with specific restrictions
 * @param file - The file to validate
 * @returns true if valid, error message string if invalid
 */
export async function validateFile(file: File): Promise<boolean | string> {
  // Check file size (5MB limit)
  const maxSize = 5 * 1024 * 1024; // 5MB in bytes
  if (file.size > maxSize) {
    return "🐾 Arf! File too big — our pup can only carry files up to 5MB.";
  }

  // Check file extension
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.ico', '.pdf'];
  const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
  
  if (!allowedExtensions.includes(fileExtension)) {
    return "🐾 Arf! Unsupported file type — our pup only fetches images and PDFs.";
  }

  // Special validation for PDF files
  if (fileExtension === '.pdf') {
    return validatePdfFileSync(file);
  }

  return true;
}

/**
 * Validates PDF file for page count (≤ 3 pages)
 * @param file - The PDF file to validate
 * @returns true if valid, error message string if invalid
 */
async function validatePdfFile(file: File): Promise<boolean | string> {
  try {
    // Create a FileReader to read the PDF
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    // Simple PDF page count validation by counting "%%EOF" occurrences
    // This is a basic approach - for production, consider using a proper PDF library
    const pdfText = new TextDecoder('latin1').decode(uint8Array);
    const pageCount = (pdfText.match(/%%EOF/g) || []).length;
    
    if (pageCount > 3) {
      return "🐾 Arf! Too many pages — our pup can only fetch up to 3 pages per PDF.";
    }
    
    return true;
  } catch (error) {
    // If we can't validate the PDF, allow it but log the error
    console.warn('Could not validate PDF page count:', error);
    return true; // Allow the file if validation fails
  }
}

export function validatePdfFileSync(file: File): Promise<boolean | string> {
  try {
    // Create a FileReader to read the PDF
    const reader = new FileReader();
    
    return new Promise((resolve) => {
      reader.onload = function(e) {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          if (!arrayBuffer) {
            resolve(true); // Allow if we can't read
            return;
          }
          
          const uint8Array = new Uint8Array(arrayBuffer);
          const pdfText = new TextDecoder('latin1').decode(uint8Array);
          
          // Count pages by counting "%%EOF" occurrences
          const pageCount = (pdfText.match(/%%EOF/g) || []).length;
          
          if (pageCount > 5) {
            resolve("🐾 Arf! Too many pages — our pup can only fetch up to 5 pages per PDF.");
          } else {
            resolve(true);
          }
        } catch (error) {
          // If we can't validate, allow the file
          resolve(true);
        }
      };
      
      reader.onerror = () => {
        // If we can't read the file, allow it
        resolve(true);
      };
      
      // Read the first 1MB to check page count
      const blob = file.slice(0, 1024 * 1024);
      reader.readAsArrayBuffer(blob);
    });
  } catch (error) {
    // If validation fails, allow the file
    return Promise.resolve(true);
  }
}

/**
 * Validates modification file limits (2 PDFs max 5 pages each, 10 images max)
 * @param newFile - The new file being added
 * @param existingFiles - Array of existing files
 * @param existingRawFiles - Array of existing raw files (for PDFs)
 * @returns true if valid, error message string if invalid
 */
export async function validateModificationLimits(
  newFile: File,
  existingFiles: File[],
  existingRawFiles: File[]
): Promise<boolean | string> {
  // Count existing files by type
  const existingPdfs = existingRawFiles.filter(file => file.type === "application/pdf");
  const existingImages = existingFiles.filter(file => file.type.startsWith("image/"));
  
  // Check PDF limits (max 2 PDFs, max 5 pages each)
  if (newFile.type === "application/pdf") {
    if (existingPdfs.length >= 2) {
      return "🐾 Arf! Too many PDFs — our pup can only carry up to 2 PDFs for modification.";
    }
    
    // Check page count for the new PDF
    try {
      const arrayBuffer = await newFile.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      if (pdf.numPages > 5) {
        return `🐾 Arf! "${newFile.name}" has ${pdf.numPages} pages. Our pup can only handle up to 5 pages per PDF.`;
      }
    } catch (error) {
      return "🐾 Arf! Could not validate PDF file. Please try a different file.";
    }
  }
  
  // Check image limits (max 10 images total)
  if (newFile.type.startsWith("image/")) {
    if (existingImages.length >= 10) {
      return "🐾 Arf! Too many images — our pup can only carry up to 10 images for modification.";
    }
  }
  
  // Calculate total size (including raw files for accurate size calculation)
  const existingRawSize = existingRawFiles.reduce((total, file) => total + file.size, 0);
  const totalSize = existingRawSize + newFile.size;
  
  // Check total size limit (30MB)
  const maxTotalSize = 30 * 1024 * 1024; // 30MB in bytes
  if (totalSize > maxTotalSize) {
    const totalSizeMB = Math.round(totalSize / (1024 * 1024));
    return `🐾 Arf! Total file size too big — our pup can only carry up to 30MB total (currently ${totalSizeMB}MB).`;
  }
  
  return true;
}
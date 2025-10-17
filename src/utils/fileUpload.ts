// utils/fileUpload.ts - Reusable file upload utility

import axios from 'axios';

const BASE_URL = import.meta.env.VITE_BASE_URL;

export const uploadFilesToDatabase = async (
  files: File[],
  projectId: number,
  token: string
): Promise<{ success: boolean; data?: { message: string; projectId: string; files: Array<{ name: string; type: string; url: string }> } }> => {
  try {
    if (!files || files.length === 0) {
      return { success: true };
    }

    // Filter to ONLY PDFs; ignore extracted images and other docs
    const pdfFiles = files.filter(
      (f) => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')
    );

    if (pdfFiles.length === 0) {
      // Nothing to upload, treat as successful no-op
      return { success: true };
    }

    const formData = new FormData();
    formData.append('projectId', projectId.toString());
    
    // Append only PDF files to form data
    pdfFiles.forEach((file) => {
      formData.append('files', file);
    });

    const response = await axios.post(
      `${BASE_URL}/uploadAssets`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (response.status === 200) {
      return { 
        success: true, 
        data: response.data 
      };
    } else {
      return { success: false };
    }
  } catch (error) {
    return { success: false };
  }
};

/**
 * Upload a single file to the backend database
 * @param file - File to upload
 * @param projectId - Project ID to associate file with
 * @param token - Bearer authentication token
 * @returns Promise<{ success: boolean; data?: { message: string; projectId: string; files: Array<{ name: string; type: string; url: string }> } }> - Success status and file data
 */
export const uploadFileToDatabase = async (
  file: File,
  projectId: number,
  token: string
): Promise<{ success: boolean; data?: { message: string; projectId: string; files: Array<{ name: string; type: string; url: string }> } }> => {
  return uploadFilesToDatabase([file], projectId, token);
};


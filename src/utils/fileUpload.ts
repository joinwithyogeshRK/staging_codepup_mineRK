// utils/fileUpload.ts - Reusable file upload utility

import axios from 'axios';

const BASE_URL = import.meta.env.VITE_BASE_URL;

export const uploadFilesToDatabase = async (
  files: File[],
  projectId: number,
  token: string
): Promise<boolean> => {
  try {
    if (!files || files.length === 0) {
      return false;
    }

    const formData = new FormData();
    formData.append('projectId', projectId.toString());
    
    // Append all files to form data
    files.forEach((file) => {
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
      return true;
    } else {
      return false;
    }
  } catch (error) {
    return false;
  }
};

/**
 * Upload a single file to the backend database
 * @param file - File to upload
 * @param projectId - Project ID to associate file with
 * @param token - Bearer authentication token
 * @returns Promise<boolean> - Success status
 */
export const uploadFileToDatabase = async (
  file: File,
  projectId: number,
  token: string
): Promise<boolean> => {
  return uploadFilesToDatabase([file], projectId, token);
};
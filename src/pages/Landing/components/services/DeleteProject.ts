import axios from "axios";
const BASE_URL = import.meta.env.VITE_BASE_URL;

export async function confirmAndDeleteProject(
  projectId: number,
  hasSessionSupport: boolean,
  token : string
): Promise<void> {
  const warningMessage = hasSessionSupport
    ? "Are you sure you want to delete this project? This will also delete all associated chat sessions and messages."
    : "Are you sure you want to delete this project? This will also delete all associated messages.";

  if (!window.confirm(warningMessage)) {
    return Promise.reject(new Error("User cancelled"));
  }

  await axios.delete(`${BASE_URL}/api/projects/${projectId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

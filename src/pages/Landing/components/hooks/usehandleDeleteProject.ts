import { useCallback } from "react";
import axios from "axios";

const BASE_URL = (import.meta as any).env.VITE_BASE_URL;

async function confirmAndDeleteProject(
  projectId: number,
  hasSessionSupport: boolean,
  token: string
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

export function useHandleDeleteProject({
  hasSessionSupport,
  getToken,
  setProjects,
  setProjectSessions,
  setToasts,
}: {
  hasSessionSupport: boolean;
  getToken: () => Promise<string | null>;
  setProjects: React.Dispatch<React.SetStateAction<any[]>>;
  setProjectSessions: React.Dispatch<React.SetStateAction<Record<number, any>>>;
  setToasts: React.Dispatch<React.SetStateAction<{ id: string; message: string; type: string }[]>>;
}) {
  const handleDeleteProject = useCallback(
    async (projectId: number, e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();

      try {
        const token = await getToken();
        if (!token) throw new Error("Token is required in handleDeleteProject");

        await confirmAndDeleteProject(projectId, hasSessionSupport, token);

        setProjects((prev) => prev.filter((p) => p.id !== projectId));

        if (hasSessionSupport) {
          setProjectSessions((prev) => {
            const newSessions = { ...prev };
            delete newSessions[projectId];
            return newSessions;
          });
        }
      } catch (error: any) {
        setToasts((prev) => [
          ...prev,
          {
            id: Math.random().toString(36).substr(2, 9),
            message: error.message || "Failed to delete project",
            type: "error",
          },
        ]);
      }
    },
    [getToken, hasSessionSupport, setProjects, setProjectSessions, setToasts]
  );

  return handleDeleteProject;
}

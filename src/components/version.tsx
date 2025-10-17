import React, { useState, useEffect } from "react";
import { Check, Loader2 } from "lucide-react";
import { useToast } from "../helper/Toast";
import axios from "axios";

interface Version {
  id: number;
  projectId: number;
  versionNumber: number;
  zipUrl: string;
  isCurrent: boolean;
  createdAt: string;
  description?: string;
}

interface VersionHistoryModalProps {
  projectId: string | number;
  onVersionRestored?: (versionNumber: number) => void;
}

export const VersionHistoryPanel: React.FC<VersionHistoryModalProps> = ({
  projectId,
  onVersionRestored,
}) => {
  const [versions, setVersions] = useState<Version[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoringVersion, setRestoringVersion] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();

  const fetchVersions = async () => {
    if (!projectId) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.request({
        method: "GET",
        url: `${import.meta.env.VITE_BASE_URL}/api/versions/${projectId}`,
        // Explicitly include a request body with count for GET as requested
        data: { count: 20 },
      });
      const data = response.data;
      if (response.status !== 200 || !data.success)
        throw new Error(data.error || "Failed to fetch versions");
      setVersions(data.versions || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load versions");
      // Puppy-themed toast for errors; avoid inline error UI
      showToast(
        "🐶 Oops! Our pup couldn't fetch version history right now. Please try again.",
        "error"
      );
      console.error("Error fetching versions:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestoreVersion = async (versionNumber: number) => {
    if (!projectId || isRestoring) return;
    const selected = versions.find((v) => v.versionNumber === versionNumber);
    if (selected?.isCurrent) return;

    setIsRestoring(true);
    setRestoringVersion(versionNumber);
    setError(null);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BASE_URL}/api/versions/${projectId}/restore`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ versionNumber }),
        }
      );
      const data = await response.json();
      if (!response.ok || !data.success)
        throw new Error(data.error || "Failed to restore version");
      await fetchVersions();
      if (onVersionRestored) onVersionRestored(versionNumber);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to restore version");
      // Puppy-themed toast for errors; avoid inline error UI
      showToast(
        "🐾 Ruff! Couldn't restore that version. Please try again in a moment.",
        "error"
      );
      console.error("Error restoring version:", err);
    } finally {
      setIsRestoring(false);
      setRestoringVersion(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  useEffect(() => {
    fetchVersions();
  }, [projectId]);

  return (
    <div className="flex flex-col h-full border-l border-gray-200 bg-white">
      <div className="px-3 py-2 border-b border-gray-100">
        <h2 className="text-sm font-medium text-gray-700">Version History</h2>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-10 text-sm text-gray-500">
            <Loader2 className="w-4 h-4 mr-2 animate-spin text-blue-500" />
            Loading versions...
          </div>
        ) : versions.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-sm text-gray-500">
            No versions yet
          </div>
        ) : (
          <ul className="text-sm divide-y divide-gray-100">
            {versions.map((version) => {
              const isCurrent = version.isCurrent;
              const isRestoringThis =
                isRestoring && restoringVersion === version.versionNumber;

              return (
                <li
                  key={version.id}
                  onClick={() =>
                    !isCurrent && !isRestoring && handleRestoreVersion(version.versionNumber)
                  }
                  className={`flex items-center justify-between px-3 py-2 cursor-pointer select-none transition-all
                    ${
                      isCurrent
                        ? "bg-blue-50 text-blue-700"
                        : "hover:bg-gray-50 text-gray-700"
                    }
                    ${
                      isRestoring
                        ? "pointer-events-none opacity-70"
                        : "pointer-events-auto"
                    }
                  `}
                >
                  <div className="flex flex-wrap items-center gap-x-2 min-w-0">
                    <span className="font-medium truncate">
                      Version {version.versionNumber}
                    </span>
                    <span className="text-xs text-gray-500 truncate">
                      {formatDate(version.createdAt)}
                    </span>
                  </div>
                  <div className="ml-2 flex-shrink-0">
                    {isRestoringThis ? (
                      <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
                    ) : isCurrent ? (
                      <Check className="w-4 h-4 text-blue-600" />
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {versions.length > 0 && (
        <div className="px-3 py-2 border-t border-gray-100 text-xs text-gray-500 text-center">
          Showing {versions.length} version{versions.length > 1 ? "s" : ""}
        </div>
      )}
    </div>
  );
};

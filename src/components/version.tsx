import React, { useState, useEffect } from 'react';
import { Clock, RotateCcw, Check, AlertCircle, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";

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

const VersionHistoryModal: React.FC<VersionHistoryModalProps> = ({
  projectId,
  onVersionRestored,
}) => {
  const [versions, setVersions] = useState<Version[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoringVersion, setRestoringVersion] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const fetchVersions = async () => {
    if (!projectId) return;
    
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_BASE_URL}/api/versions/${projectId}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch versions');
      }

      const data = await response.json();
      
      if (data.success) {
        setVersions(data.versions || []);
      } else {
        throw new Error(data.error || 'Failed to load versions');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load versions');
      console.error('Error fetching versions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestoreVersion = async (versionNumber: number) => {
    if (!projectId || isRestoring) return;

    setIsRestoring(true);
    setRestoringVersion(versionNumber);
    setError(null);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_BASE_URL}/api/versions/${projectId}/restore`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ versionNumber }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to restore version');
      }

      // Success - refresh versions list
      await fetchVersions();
      
      // Notify parent component
      if (onVersionRestored) {
        onVersionRestored(versionNumber);
      }

      // Show success message briefly then close
      setTimeout(() => {
        setIsOpen(false);
      }, 1500);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to restore version');
      console.error('Error restoring version:', err);
    } finally {
      setIsRestoring(false);
      setRestoringVersion(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  useEffect(() => {
    if (isOpen) {
      fetchVersions();
    }
  }, [isOpen, projectId]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <button
          className="hidden lex items-center justify-center w-8 h-8 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-all duration-200"
          title="Version History"
          aria-label="Open version history"
        >
          <Clock className="w-5 h-5" />
        </button>
      </DialogTrigger>

      <DialogContent className="bg-white w-[95vw] sm:max-w-2xl max-h-[85vh] overflow-hidden flex flex-col p-0">
        <DialogTitle className="px-6 pt-6 pb-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Version History</h2>
              <p className="text-sm text-gray-500 mt-0.5">
                View and restore previous versions of your project
              </p>
            </div>
          </div>
        </DialogTitle>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-3" />
              <p className="text-sm text-gray-500">Loading versions...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="p-3 bg-red-50 rounded-full mb-3">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <p className="text-sm font-medium text-gray-900 mb-1">Failed to load versions</p>
              <p className="text-sm text-gray-500 mb-4">{error}</p>
              <button
                onClick={fetchVersions}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                Try Again
              </button>
            </div>
          ) : versions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="p-3 bg-gray-50 rounded-full mb-3">
                <Clock className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-sm font-medium text-gray-900 mb-1">No versions yet</p>
              <p className="text-sm text-gray-500">
                Versions will appear here as you make changes
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {versions.map((version) => (
                <div
                  key={version.id}
                  className={`relative border rounded-lg p-4 transition-all duration-200 ${
                    version.isCurrent
                      ? 'border-blue-200 bg-blue-50'
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-semibold text-gray-900">
                          Version {version.versionNumber}
                        </h3>
                        {version.isCurrent && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                            <Check className="w-3 h-3" />
                            Current
                          </span>
                        )}
                      </div>
                      
                      <p className="text-xs text-gray-500 mb-2">
                        {formatDate(version.createdAt)}
                      </p>

                      {version.description && (
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {version.description}
                        </p>
                      )}
                    </div>

                    {!version.isCurrent && (
                      <button
                        onClick={() => handleRestoreVersion(version.versionNumber)}
                        disabled={isRestoring}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
                          isRestoring && restoringVersion === version.versionNumber
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400'
                        }`}
                      >
                        {isRestoring && restoringVersion === version.versionNumber ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Restoring...</span>
                          </>
                        ) : (
                          <>
                            <RotateCcw className="w-4 h-4" />
                            <span>Restore</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {versions.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <p className="text-xs text-gray-500 text-center">
              Showing last {versions.length} version{versions.length !== 1 ? 's' : ''} • 
              Only the 10 most recent versions can be restored
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default VersionHistoryModal;
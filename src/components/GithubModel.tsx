import { useState, useEffect } from "react";
import {
  Github,
  RefreshCw,
  Upload,
  ExternalLink,
  GitBranch,
  X,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "@clerk/clerk-react";

// Amplitude
import { amplitude } from "../utils/amplitude";

interface GitHubModelProps {
  projectId?: number | string;
  clerkId?: string;
}

interface Toast {
  id: string;
  message: string;
  type: "success" | "error";
  duration?: number;
}

export default function GitHubModel({ projectId, clerkId }: GitHubModelProps) {
  const [zipUrl, setZipUrl] = useState("");
  const [repoName, setRepoName] = useState("");
  const [repoUrl, setRepoUrl] = useState<string | null>(null);

  const [githubConnected, setGithubConnected] = useState(false);
  const [githubUsername, setGithubUsername] = useState<string | null>(null);
  const [githubAvatar, setGithubAvatar] = useState<string | null>(null);

  const [toasts, setToasts] = useState<Toast[]>([]);
  const { getToken } = useAuth();

  const [isConnectingProject, setIsConnectingProject] =
    useState<boolean>(false);
  const [isUpdatingProject, setIsUpdatingProject] = useState<boolean>(false);
  const [projectConnected, setProjectConnected] = useState<boolean>(false);

  const GITHUB_CLIENT_ID = import.meta.env.VITE_GITHUB_CLIENT_ID;
  const BASE_URL = import.meta.env.VITE_BASE_URL;

  const ENDPOINTS = {
    queueSubmit: `${BASE_URL}/api/github/getRepoUrl`,
    projectDetails: `${BASE_URL}/api/projects/getprojecturl`,
    projectById: (projectId: number | string) =>
      `${BASE_URL}/api/projects/${projectId}`,
    userDetails: (clerkId: string) => `${BASE_URL}/api/users/clerk/${clerkId}`,
  };

  // Toast notification functions
  const showToast = (
    message: string,
    type: "success" | "error",
    duration: number = 4000
  ) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast: Toast = { id, message, type, duration };

    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, duration);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  /**
   * Fetch project details (zip url, repo name from getprojecturl endpoint)
   */
  const fetchProjectDetails = async () => {
    if (!projectId || !clerkId) return;
    try {
      const token = await getToken();
      const res = await fetch(ENDPOINTS.projectDetails, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ projectId, clerkId }),
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch project data (${res.status})`);
      }
      const data: { url?: string; projectName?: string } = await res.json();
      if (data.url) setZipUrl(data.url);
      if (data.projectName) setRepoName(data.projectName);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load project";
      showToast(msg, "error");
    }
  };

  /**
   * Fetch project GitHub repo URL from /api/projects/:projectId
   */
  const fetchProjectGithubUrl = async () => {
    if (!projectId) return;
    try {
      const token = await getToken();
      const res = await fetch(ENDPOINTS.projectById(projectId), {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch project GitHub data (${res.status})`);
      }

      const data: { githubRepourl?: string } = await res.json();

      if (data.githubRepourl) {
        setRepoUrl(data.githubRepourl);
        setProjectConnected(true);
      }
    } catch (err) {
      // Don't show error to user as this is just checking existing connection
    }
  };

  /**
   * Fetch user GitHub details
   */
  const fetchUserDetails = async () => {
    if (!clerkId) return;
    try {
      const token = await getToken();
      const res = await fetch(ENDPOINTS.userDetails(clerkId), {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch user data (${res.status})`);
      }

      const data: {
        githubAccessToken?: string;
        githubAvatar?: string;
        githubUsername?: string;
      } = await res.json();
      if (data.githubAccessToken) {
        setGithubConnected(true);
        setGithubAvatar(data.githubAvatar || null);
        setGithubUsername(data.githubUsername || null);
      } else {
        setGithubConnected(false);
        setGithubAvatar(null);
        setGithubUsername(null);
      }
    } catch (err) {
      // Don't set error message for user details fetch to avoid UI clutter
    }
  };

  /**
   * GitHub OAuth login flow
   */
  const handleLogin = async () => {
    if (!GITHUB_CLIENT_ID || !clerkId) {
      showToast(
        "Configuration error - missing GitHub Client ID or Clerk ID",
        "error"
      );
      return;
    }
    const state = { clerkId };
    const userData = JSON.stringify(state);
    const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&scope=read:user repo workflow&state=${encodeURIComponent(
      userData
    )}`;

    // Use popup for better UX
    const popup = window.open(githubAuthUrl, "_blank", "width=600,height=700");

    // Start polling after popup opens
    if (popup) {
      startConnectionPolling();
    }
  };

  /**
   * Start polling for GitHub connection after OAuth
   */
  const startConnectionPolling = () => {
    let attempts = 0;
    const maxAttempts = 10; // Increased attempts for better reliability

    const pollConnection = async () => {
      attempts += 1;
      await fetchUserDetails();

      if (!githubConnected && attempts < maxAttempts) {
        setTimeout(pollConnection, 5000); // Check every 5 seconds
      }
    };

    // Start polling after a 10 sec delay
    setTimeout(pollConnection, 10000);
  };

  /**
   * Handle project connection/upload to GitHub
   */
  const handleProjectSubmit = async (isUpdate = false) => {
    if (!githubConnected) {
      showToast("Please connect your GitHub account first.", "error");
      return;
    }

    if (!zipUrl.trim() || !repoName.trim() || !clerkId) {
      showToast(
        "Missing required project data. Please try refreshing the page.",
        "error"
      );
      return;
    }

    if (isUpdate) {
      setIsUpdatingProject(true);
    } else {
      setIsConnectingProject(true);
    }

    try {
      const requestBody = {
        zipUrl,
        reponame: repoName.trim(),
        clerkId,
        projectId,
      };

      const response = await fetch(ENDPOINTS.queueSubmit, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(
          errorData || `${isUpdate ? "Update" : "Upload"} failed`
        );
      }

      const data = await response.json();
      if (data.repourl) {
        setRepoUrl(data.repourl);
        setProjectConnected(true);
        // Refresh project details to get updated info
        await fetchProjectDetails();
        await fetchProjectGithubUrl();
      }

      showToast(
        `Project ${isUpdate ? "updated" : "connected"} successfully!`,
        "success"
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unknown error occurred";
      showToast(
        `Failed to ${isUpdate ? "update" : "connect"} project: ${message}`,
        "error"
      );
    } finally {
      setIsConnectingProject(false);
      setIsUpdatingProject(false);
    }
  };

  /**
   * Fetch project + user details on mount
   */
  useEffect(() => {
    if (projectId && clerkId) {
      fetchProjectDetails();
      fetchUserDetails();
      fetchProjectGithubUrl();
    }
  }, [projectId, clerkId]);

  /**
   * Copy to clipboard helper
   */
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast("Copied to clipboard", "success", 2000);
    } catch {
      showToast("Failed to copy to clipboard", "error", 3000);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto">
      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-3">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg transition-all duration-300 transform ${
              toast.type === "success"
                ? "bg-green-50 border border-green-200 text-green-800"
                : "bg-red-600 border text-white"
            }`}
          >
            {toast.type === "success" ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <AlertCircle className="w-5 h-5 text-white" />
            )}
            <span className="text-sm font-medium">{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              className={`ml-2 p-1 rounded-full hover:bg-opacity-20 ${
                toast.type === "success"
                  ? "hover:bg-green-200"
                  : "hover:bg-red-200"
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      <div className="bg-white text-gray-900">
        <div className="max-w-screen-2xl border border-gray-200 rounded-lg overflow-hidden">
          <main className="flex-1 p-6 lg:p-8 bg-white">
            <div className="w-full mx-auto">
              {/* Header */}
              <div className="flex items-start justify-between mb-8">
                <div>
                  <h1 className="text-2xl lg:text-3xl font-semibold">GitHub</h1>
                  <p className="text-gray-600 mt-1">
                    Sync your project with GitHub for collaboration.
                  </p>
                </div>
              </div>

              {/* GitHub Account Connection Section */}
              <section className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-medium flex items-center gap-2">
                      <Github className="w-5 h-5" /> GitHub Account
                    </h2>
                    <p className="text-gray-600 mt-1 text-sm">
                      Connect your GitHub account to enable project migration.
                    </p>
                  </div>

                  {githubConnected ? (
                    <div className="flex items-center gap-3">
                      {githubAvatar && (
                        <img
                          src={githubAvatar}
                          alt="GitHub Avatar"
                          className="w-8 h-8 rounded-full border"
                        />
                      )}
                      <span className="text-sm text-gray-800">
                        {githubUsername}
                      </span>
                      <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">
                        Connected
                      </span>
                    </div>
                  ) : (
                    <button
                      onClick={handleLogin}
                      className="inline-flex items-center gap-2 border border-gray-300 bg-white hover:bg-gray-50 text-gray-800 px-4 py-2 rounded-md text-sm font-medium transition"
                    >
                      <Github className="w-4 h-4" /> Connect with GitHub
                    </button>
                  )}
                </div>
              </section>

              {/* GitHub Connection Required Notice */}
              {!githubConnected && (
                <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-yellow-800 text-sm">
                    Please connect your GitHub account first to enable project
                    migration and repository creation.
                  </p>
                </div>
              )}

              {/* Connect Project Section */}
              {projectConnected ? (
                <section className="bg-white border border-green-200 rounded-lg p-6 mb-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        Project
                        <span className="bg-green-100 text-green-700 text-xs font-medium px-2 py-1 rounded-full">
                          Connected
                        </span>
                      </h3>
                      <p className="text-gray-600 text-sm mt-1">
                        Your project is synced with GitHub.
                      </p>
                    </div>

                    <div className="flex gap-3">
                      {repoUrl && (
                        <a
                          href={repoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-medium px-3 py-2 rounded-md transition"
                        >
                          <ExternalLink className="w-4 h-4" /> View on GitHub
                        </a>
                      )}

                      <button
                        onClick={() => {
                          amplitude.track("Update GitHub Project");
                          handleProjectSubmit(true);
                        }}
                        disabled={isUpdatingProject || !githubConnected}
                        className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed text-white transition"
                      >
                        <RefreshCw
                          className={`w-4 h-4 ${
                            isUpdatingProject ? "animate-spin" : ""
                          }`}
                        />
                        {isUpdatingProject ? "Updating..." : "Update Project"}
                      </button>
                    </div>
                  </div>
                </section>
              ) : (
                <section className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-medium">Connect Project</h2>
                      <p className="text-gray-600 mt-1 text-sm">
                        Migrate your project to GitHub repository.
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        amplitude.track("Connect GitHub Project");
                        handleProjectSubmit(false);
                      }}
                      disabled={isConnectingProject || !githubConnected}
                      className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition hover:cursor-pointer ${
                        !githubConnected || isConnectingProject
                          ? "bg-gray-400 cursor-not-allowed text-white"
                          : "bg-gray-900 text-white hover:bg-black"
                      }`}
                      title={
                        !githubConnected ? "Connect GitHub account first" : ""
                      }
                    >
                      <Upload
                        className={`w-4 h-4 ${
                          isConnectingProject ? "animate-pulse" : ""
                        }`}
                      />
                      {isConnectingProject
                        ? "Connecting..."
                        : "Connect Project"}
                    </button>
                  </div>
                </section>
              )}

              {/* Project Configuration */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Repository Settings - Only show when project is NOT connected */}
                {!projectConnected && (
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4">
                      Repository Settings
                    </h3>

                    <div>
                      <label
                        htmlFor="repoName"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Repository Name
                      </label>
                      <input
                        id="repoName"
                        type="text"
                        className="w-full p-3 rounded-md bg-white border border-gray-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="my-awesome-project"
                        value={repoName}
                        onChange={(e) => setRepoName(e.target.value)}
                        disabled={!githubConnected}
                      />
                    </div>
                  </div>
                )}

                {/* Clone Repository Section - Only show when project IS connected */}
                {repoUrl && projectConnected && (
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-2">
                      Clone Repository
                    </h3>
                    <p className="text-gray-600 text-sm mb-4">
                      Copy this URL to clone your repository locally.
                    </p>

                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={`${repoUrl}.git`}
                        className="flex-1 bg-gray-50 border border-gray-300 rounded-md px-3 py-2 text-gray-800 text-sm focus:outline-none"
                      />
                      <button
                        onClick={() => copyToClipboard(`${repoUrl}.git`)}
                        className="inline-flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-md text-gray-800 text-sm hover:bg-gray-50 transition"
                        title="Copy to clipboard"
                      >
                        <GitBranch className="w-4 h-4" /> Copy
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

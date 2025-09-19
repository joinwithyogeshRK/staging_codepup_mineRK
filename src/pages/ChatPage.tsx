// components/ChatPage.tsx - COMBINED WITH ALL FUNCTIONALITIES
// Dialog
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import PdfPreview from "../components/pdfpreview";
import UnifiedFileUploadSection from "../components/UnifiedFileUpload";
import type { UnifiedFileUploadRef } from "../components/UnifiedFileUpload";
import React, {
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import { MyContext } from "../context/FrontendStructureContext";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Send,
  Code,
  Loader2,
  RefreshCw,
  AlertCircle,
  ExternalLink,
  FileText,
  Database,
  Palette,
  Monitor,
  Rocket, // Added for deploy button
  CheckCircle, // Added for success states
  Plus,
  Image,
  File,
  Globe,
  Menu,
  X,
} from "lucide-react";
import { StreamingCodeDisplay, FileCompletionTracker } from "./streaming";
import axios from "axios";
import { useAuth, UserButton } from "@clerk/clerk-react";
import { useChatPageState, useChatPageLogic } from "../hooks/chatpage_hooks";
import { v4 as uuidv4 } from "uuid";
import CopyLinkButton from "../components/CopyToClip";
import { uploadFilesToDatabase } from "../utils/fileUpload";
import type { ContextValue } from "../types/index";
import { WorkflowStateManager } from "../utils/workflowStateManager";
import GitHubModel from "../components/GithubModel";
import Credit from "../components/Credit";
import RewardModal from "../components/RewardModal";
import BlankApp from "../components/BlankApp";
// Close upload menu when clicking outside

import { amplitude } from "../utils/amplitude";

const ChatPage: React.FC = () => {
  const context = useContext(MyContext);
  const { value } = context as ContextValue;

  // Use custom hooks for state and logic
  const state = useChatPageState();
  const { hasUserStopped } = state;
  const logic = useChatPageLogic(state);

  // Iframe loading state with cache busting
  const [isIframeLoading, setIsIframeLoading] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const [shareAbleUrl, setShareAbleUrl] = useState("");
  const hasInitializedShareUrlRef = useRef(false);

  // Deploy state
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentUrl, setDeploymentUrl] = useState<string | null>(null);
  const [deployError, setDeployError] = useState<string | null>(null);
  const [lastDeployTime, setLastDeployTime] = useState<Date | null>(null);
  const [showPublishMenu, setShowPublishMenu] = useState(false);

  // Agent activation: disable input/send while activating container
  const [isAgentActivating, setIsAgentActivating] = useState(false);

  // Tab state for Preview/Code switching
  const [activeTab, setActiveTab] = useState<"preview" | "code">("preview");
  const docsInputRef = useRef<UnifiedFileUploadRef>(null);
  // Countdown timer state
  const [countdownTime, setCountdownTime] = useState(10 * 60); // 10 minutes in seconds

  // Hover state for clipboard menu synchronization
  const [hoveredOption, setHoveredOption] = useState<
    "images" | "assets" | null
  >(null);

  // Insufficient credits modal state
  const [insufficientOpen, setInsufficientOpen] = useState(false);
  const [insufficientMessage, setInsufficientMessage] =
    useState<React.ReactNode | null>(null);
  const lastGenInsufficientIdRef = useRef<string | null>(null);

  // Container status check
  const [isContainerOnline, setIsContainerOnline] = useState<boolean | null>(
    null
  );
  const [isCheckingContainer, setIsCheckingContainer] = useState(false);
  // Reusable container status checker (HEAD)
  const checkContainerStatus = useCallback(
    async (url: string): Promise<boolean> => {
      try {
        const res = await axios.head(url);
        const isUp = res.status === 200;
        return isUp;
      } catch (error) {
        return false;
      }
    },
    []
  );

  // Resizable split state (left chat %)
  const [leftWidthPct, setLeftWidthPct] = useState<number>(25);
  const [isChatHidden, setIsChatHidden] = useState(false);
  const isResizingRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isResizing, setIsResizing] = useState(false);

  // Constraints
  const MIN_LEFT_WIDTH = 20;
  const MAX_LEFT_WIDTH = 40;

  // Responsive flags
  const [isNarrow, setIsNarrow] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  useEffect(() => {
    const update = () => setIsNarrow(window.innerWidth < 1024);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  const showCodeTab = !isNarrow; // hide Code tab on small/medium

  // Toggle chat sidebar
  const toggleChatSidebar = useCallback(() => {
    setIsChatHidden((prev) => !prev);
  }, []);

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    isResizingRef.current = true;
    setIsResizing(true);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none"; // Prevent text selection during drag
  }, []);

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      if (!isResizingRef.current) return;

      const container = containerRef.current;
      if (!container) return;

      // Get the container's bounding rectangle
      const rect = container.getBoundingClientRect();

      // Calculate mouse position relative to container
      const x = e.clientX - rect.left;

      // Calculate percentage based on container width
      const rawPct = (x / rect.width) * 100;

      // Apply min/max constraints
      const clampedPct = Math.max(
        MIN_LEFT_WIDTH,
        Math.min(MAX_LEFT_WIDTH, rawPct)
      );

      // Only update if the value actually changed (reduces unnecessary re-renders)
      setLeftWidthPct((prev) => {
        const rounded = Math.round(clampedPct * 100) / 100; // Round to 2 decimal places
        return Math.abs(prev - rounded) > 0.1 ? rounded : prev;
      });
    };

    const handleUp = () => {
      if (!isResizingRef.current) return;

      isResizingRef.current = false;
      setIsResizing(false);
      document.body.style.cursor = "";
      document.body.style.userSelect = ""; // Restore text selection
    };

    // Add event listeners to document for better capture
    document.addEventListener("mousemove", handleMove, { passive: false });
    document.addEventListener("mouseup", handleUp, { passive: false });

    // Also listen for mouse leave to handle edge cases
    document.addEventListener("mouseleave", handleUp);

    return () => {
      document.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseup", handleUp);
      document.removeEventListener("mouseleave", handleUp);
      // Cleanup styles in case component unmounts during resize
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, []);

  const {
    // State
    messages,
    prompt,
    isLoading,
    previewUrl,
    error,
    credits,
    projectStatus,
    isStreamingResponse,
    isServerHealthy,
    isRetrying,
    currentProject,
    isWorkflowActive,
    currentWorkflowStep,
    workflowProgress,
    workflowSteps,
    isNavigating,
    isStreamingGeneration,
    streamingProgress,
    streamingPhase,
    streamingMessage,
    streamingStats,
    showStreamingDetails,
    streamingCodeContent,
    generatedFiles,
    currentGeneratingFile,
    showCodeStream,
    currentProjectInfo,
    streamingData,
    isStreamingModification,
    isModifying,
    projectScope,
    selectedImages,
    setSelectedImages,
    fileInputRef,
    // NEW: Add asset state
    selectedAssets,
    setSelectedAssets,
    assetInputRef,
    uploadMode,
    clipboardImage,
    setClipboardImage,
    setPreviewUrl,
    setMessages,
    setError,
    showUploadMenu,
    setShowUploadMenu,
    clipboardSelectedOption,
    setClipboardSelectedOption,
    showDocsInput,
    setShowDocsInput,
  } = state;

  // Initialize shareAbleUrl from project.productionUrl only once on first load
  useEffect(() => {
    const prod = (currentProject as any)?.productionUrl as string | undefined;
    if (!hasInitializedShareUrlRef.current && !shareAbleUrl && prod) {
      setShareAbleUrl(prod);
      hasInitializedShareUrlRef.current = true;
    }
  }, [currentProject, shareAbleUrl]);

  // Verify container status for existing project previewUrl; skip during workflows
  useEffect(() => {
    if (!previewUrl) {
      setIsContainerOnline(null);
      setIsCheckingContainer(false);
      return;
    }
    if (isWorkflowActive || isStreamingGeneration || isStreamingModification) {
      setIsCheckingContainer(false);
      return;
    }
    let canceled = false;
    (async () => {
      setIsCheckingContainer(true);
      const ok = await checkContainerStatus(previewUrl);
      if (!canceled) {
        setIsContainerOnline(ok);
        setIsCheckingContainer(false);
      }
    })();
    return () => {
      canceled = true;
      setIsCheckingContainer(false);
    };
  }, [
    previewUrl,
    isWorkflowActive,
    isStreamingGeneration,
    isStreamingModification,
    checkContainerStatus,
  ]);

  // Auto-switch to Preview tab when generation is complete and preview is available
  useEffect(() => {
    // Auto-switch to preview when:
    // 1. Preview URL is available
    // 2. Generation is not streaming
    // 3. User is currently on code tab
    if (previewUrl && !isStreamingGeneration && activeTab === "code") {
      setActiveTab("preview");
    }
  }, [previewUrl, isStreamingGeneration]);
  const { getToken } = useAuth();
  const {
    // Functions
    scrollToBottom,
    clearConversation,
    stopWorkflow,
    handlePromptChange,
    handleSubmit,
    handleKeyPress,
    handlePaste,
    retryConnection,
    formatDuration,
    formatSpeed,
    messagesEndRef,
    projectId,
    passedUserId,
    clerkId,
    fromWorkflow,
    existingProject,
    scope,
    getWorkflowSteps,
    handleImageSelect,
    removeImage,
    clearSelectedImages,
    // NEW: Add asset functions
    handleAssetSelect,
    removeAsset,
    clearSelectedAssets,
    toggleUploadMenu,
    selectUploadMode,
    handleClipboardKeyDown,
  } = logic;

  // Helper function to upload files to database
  const uploadFilesToDatabaseHelper = useCallback(
    async (files: File[]) => {
      if (!files || files.length === 0 || !projectId) return;

      try {
        const token = await getToken();
        if (token) {
          await uploadFilesToDatabase(files, projectId, token);
        }
      } catch (error) {
        // Don't show error to user as this is a background operation
      }
    },
    [projectId, getToken]
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showUploadMenu || showPublishMenu) {
        const target = event.target as Element;
        const uploadButton = target.closest("[data-upload-menu]");
        const publishButton = target.closest("[data-publish-menu]");
        if (!uploadButton && !publishButton) {
          setShowUploadMenu(false);
          setShowPublishMenu(false);
          // Clear clipboard image when menu is closed
          if (clipboardImage) {
            setClipboardImage(null);
          }
          // Reset selection when menu closes
          setClipboardSelectedOption("images");
          setHoveredOption(null);
        }
      }
      // Close mobile hamburger if clicking outside
      if (isMenuOpen) {
        const target = event.target as Element;
        const mobileMenu = target.closest("[data-mobile-menu]");
        if (!mobileMenu) {
          setIsMenuOpen(false);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [
    showUploadMenu,
    showPublishMenu,
    setShowUploadMenu,
    clipboardImage,
    setClipboardImage,
    setClipboardSelectedOption,
    setHoveredOption,
    isMenuOpen,
  ]);

  // Watch streaming events for insufficient credits (modification path)
  useEffect(() => {
    if (streamingData?.type === "error") {
      const details = (streamingData as any)?.details as string | undefined;
      if (
        typeof details === "string" &&
        details.toLowerCase().includes("insufficient credits")
      ) {
        // Try to extract have/need numbers
        const needMatch = details.match(/need\s+(\d+)/i);
        const haveMatch = details.match(/have\s+(\d+)/i);
        const need = needMatch ? Number(needMatch[1]) : undefined;
        const have = haveMatch ? Number(haveMatch[1]) : undefined;

        const msg = (
          <>
            ⚠️{" "}
            <span className="font-semibold text-red-600">
              Insufficient credits
            </span>
            <br />
            {typeof have === "number" && typeof need === "number" ? (
              <>
                You have{" "}
                <span className="font-bold text-slate-900">{have}</span> tokens,
                need <span className="font-bold text-slate-900">{need}</span>{" "}
                tokens.
              </>
            ) : (
              <>You do not have enough tokens to perform this action.</>
            )}
            <div className="mt-3 text-sm text-slate-700 leading-relaxed">
              Oops! you are out of balance! You can come back tomorrow to avail
              your daily credits or reach out to us at{" "}
              <span className="font-medium text-blue-600 hover:underline">
                ask@codepup.ai
              </span>
              .
            </div>
          </>
        );
        setInsufficientMessage(msg);
        setInsufficientOpen(true);
      }
    }
  }, [streamingData]);

  // Watch assistant messages for generation failure phrasing (no explicit error event)
  useEffect(() => {
    if (!messages || messages.length === 0) return;
    const last = messages[messages.length - 1];
    if (last?.type !== "assistant") return;
    if (lastGenInsufficientIdRef.current === last.id) return;

    const content = String(last.content || "");
    if (
      content.includes("Frontend Generation") &&
      content.toLowerCase().includes("insufficient credits")
    ) {
      // Parse have/need
      const needMatch = content.match(/need\s+(\d+)/i);
      const haveMatch = content.match(/have\s+(\d+)/i);
      const need = needMatch ? Number(needMatch[1]) : undefined;
      const have = haveMatch ? Number(haveMatch[1]) : undefined;

      const msg = (
        <>
          ⚠️{" "}
          <span className="font-semibold text-red-600">
            Insufficient credits
          </span>
          <br />
          {typeof have === "number" && typeof need === "number" ? (
            <>
              You have <span className="font-bold text-slate-900">{have}</span>{" "}
              tokens, need{" "}
              <span className="font-bold text-slate-900">{need}</span> tokens.
            </>
          ) : (
            <>You do not have enough tokens to perform this action.</>
          )}
          <div className="mt-3 text-sm text-slate-700 leading-relaxed">
            Oops! you are out of balance! You can come back tomorrow to avail
            your daily credits or reach out to us at{" "}
            <span className="font-medium text-blue-600 hover:underline">
              ask@codepup.ai
            </span>
            .
          </div>
        </>
      );
      setInsufficientMessage(msg);
      setInsufficientOpen(true);
      lastGenInsufficientIdRef.current = last.id;
    }
  }, [messages]);

  // Add keyboard listener when clipboard menu is open
  useEffect(() => {
    if (showUploadMenu && clipboardImage) {
      const handleGlobalKeyDown = (e: KeyboardEvent) => {
        if (["ArrowUp", "ArrowDown", "Enter", "Escape"].includes(e.key)) {
          // Reset hover state when using keyboard navigation
          if (["ArrowUp", "ArrowDown"].includes(e.key)) {
            setHoveredOption(null);
          }
          handleClipboardKeyDown(e as any);

          // Reset hover state when menu closes (Enter or Escape)
          if (["Enter", "Escape"].includes(e.key)) {
            setHoveredOption(null);
          }
        }
      };

      document.addEventListener("keydown", handleGlobalKeyDown);
      return () => document.removeEventListener("keydown", handleGlobalKeyDown);
    }
  }, [
    showUploadMenu,
    clipboardImage,
    handleClipboardKeyDown,
    setHoveredOption,
  ]);

  // Reset hover state when menu opens/closes
  useEffect(() => {
    if (!showUploadMenu) {
      setHoveredOption(null);
    }
  }, [showUploadMenu, setHoveredOption]);

  // No cache-busting; keep iframe stable when URL changes

  // Remove prior container check effect; handled via reusable function at entry only

  // Removed skipContainerCheck logic per new behavior

  // Force iframe refresh when modification completes
  useEffect(() => {
    if (!isStreamingModification && streamingData?.type === "complete") {
      setIframeKey((prev) => prev + 1);
    }
  }, [isStreamingModification, streamingData?.type]);

  // Deploy function
  const handleDeploy = useCallback(async () => {
    if (!projectId) {
      // setDeployError("No project ID available for deployment");
      showToast(`No project ID available for deployment`, "error");
      return;
    }
    amplitude.track("Publish Button Clicked");

    setIsDeploying(true);
    // setDeployError(null);
    setDeploymentUrl(null);

    try {
      // Add deployment message to chat
      const deployMessage = {
        id: uuidv4(),
        type: "assistant" as const,
        content: `Starting deployment for project.`,
        timestamp: new Date(),
        workflowStep: "Deployment",
      };
      setMessages((prev: any) => [...prev, deployMessage]);

      const token = await getToken();
      const response = await fetch(
        `${import.meta.env.VITE_BASE_URL}/api/design/build-and-deploy`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            projectId: projectId,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Deployment failed: ${response.statusText}`);
      }

      const deployedUrl = await response.json();

      setShareAbleUrl(deployedUrl);
      setDeploymentUrl(deployedUrl);
      setLastDeployTime(new Date());

      // Hide success message after 1 second
      setTimeout(() => {
        setDeploymentUrl(null);
      }, 1000);

      // Add success message to chat
      const successMessage = {
        id: uuidv4(),
        type: "assistant" as const,
        content: `✅ Deployment completed successfully! Your app is now live at: ${deployedUrl}`,
        timestamp: new Date(),
        workflowStep: "Deployment Complete",
      };
      setMessages((prev: any) => [...prev, successMessage]);

      // Do NOT change iframe URL on publish; keep current deploymentUrl
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown deployment error";
      // setDeployError(errorMessage);
      showToast(`${errorMessage}`, "error");

      // Add error message to chat
      const errorChatMessage = {
        id: uuidv4(),
        type: "assistant" as const,
        content: `❌ ${errorMessage}`,
        timestamp: new Date(),
        workflowStep: "Deployment Error",
      };
      setMessages((prev: any) => [...prev, errorChatMessage]);
    } finally {
      setIsDeploying(false);
    }
  }, [projectId, setMessages, setPreviewUrl]);

  // Enhanced cache-busting URL generator
  // Removed cache-busting URL helper

  // Multiple iframe refresh techniques
  // Removed forceIframeRefresh and cache-busting logic

  // Generate cache-busted preview URL
  // Always use raw deploymentUrl without cache busting

  // Format countdown time as MM:SS
  const formatCountdown = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  // Auto-scroll effect (on new messages and key streaming state changes)
  useEffect(() => {
    scrollToBottom();
  }, [
    messages.length,
    isStreamingGeneration,
    isStreamingModification,
    streamingData?.type,
  ]);

  // Countdown timer effect
  // Add this useEffect in your ChatPage component
  useEffect(() => {
    if (uploadMode === "docs" && selectedImages.length > 0 && showDocsInput) {
      // Hide docs input after successful file selection
      setTimeout(() => setShowDocsInput(false), 500);
    }
  }, [selectedImages.length, uploadMode, showDocsInput, setShowDocsInput]);
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (!previewUrl) {
      // Start timer when no preview URL
      setCountdownTime(10 * 60); // Reset to 10 minutes

      interval = setInterval(() => {
        setCountdownTime((prev) => {
          if (prev <= 1) {
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [previewUrl]);

  // Determine if we should show code stream prominently
  const shouldShowCodeStream =
    showCodeStream && (isStreamingGeneration || !previewUrl);

  // Determine if project is ready for deployment
  const canDeploy =
    projectId &&
    currentProject?.status === "ready" &&
    !isWorkflowActive &&
    !isStreamingGeneration &&
    !isModifying &&
    !isStreamingModification &&
    isServerHealthy !== false;

  // Keyboard shortcuts for quick resize and chat toggle
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + [ for narrower chat
      if ((e.ctrlKey || e.metaKey) && e.key === "[") {
        e.preventDefault();
        setLeftWidthPct((prev) => Math.max(MIN_LEFT_WIDTH, prev - 5));
      }
      // Ctrl/Cmd + ] for wider chat
      if ((e.ctrlKey || e.metaKey) && e.key === "]") {
        e.preventDefault();
        setLeftWidthPct((prev) => Math.min(MAX_LEFT_WIDTH, prev + 5));
      }
      // Ctrl/Cmd + \ to reset to default
      if ((e.ctrlKey || e.metaKey) && e.key === "\\") {
        e.preventDefault();
        setLeftWidthPct(25);
      }
      // Ctrl/Cmd + B to toggle chat sidebar
      if ((e.ctrlKey || e.metaKey) && e.key === "b") {
        e.preventDefault();
        toggleChatSidebar();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [toggleChatSidebar]);

  interface Toast {
    id: string;
    message: string;
    type: "success" | "error";
    duration?: number;
  }
  const [toasts, setToasts] = useState<Toast[]>([]);
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
  return (
    <>
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
      <div
        ref={containerRef}
        className="w-full bg-app chat-layout flex h-screen"
        style={{ width: "100%" }}
      >
        {/* Chat Section - resizable */}
        <div
          className={`sidebar transition-all duration-300 ease-out flex flex-col ${
            isChatHidden ? "w-0 overflow-hidden" : ""
          }`}
          style={{
            width: isChatHidden ? "0%" : isNarrow ? "100%" : `${leftWidthPct}%`,
          }}
        >
          <div className="header-bar">
            <div className="flex items-center justify-between w-full h-10">
              <div className="flex items-center h-8">
                <a
                  href="/"
                  className="text-base font-semibold text-strong flex items-center gap-2 h-8"
                >
                  <img
                    src="/favicon.ico"
                    alt="CodePup Logo"
                    className="w-6 h-6 object-contain"
                  />
                  CodePup
                </a>
              </div>
              <div className="flex items-center gap-2 h-8">
                {/* Toggle Chat Sidebar Button */}
                <button
                  onClick={toggleChatSidebar}
                  className="p-1.5 hover:bg-slate-100 rounded-md transition-colors"
                  title="Hide chat sidebar (Ctrl+B)"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 -960 960 960"
                    className="shrink-0 h-4 w-4"
                    fill="currentColor"
                  >
                    <path d="M180-120q-24.75 0-42.37-17.63Q120-155.25 120-180v-600q0-24.75 17.63-42.38Q155.25-840 180-840h600q24.75 0 42.38 17.62Q840-804.75 840-780v600q0 24.75-17.62 42.37Q804.75-120 780-120zm207-60h393v-600H387z"></path>
                  </svg>
                </button>
              </div>

              {/* Deployment Status Bar */}
              {deployError && (
                <div className="mt-3 alert p-2">
                  <div className="alert alert-error p-2">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertCircle className="w-3 h-3 text-danger-weak" />
                      <span className="text-xs font-medium text-danger-weak">
                        Deployment Error
                      </span>
                    </div>
                    <p className="text-xs text-danger-weak break-words">
                      {deployError}
                    </p>
                    <button
                      onClick={() => setDeployError(null)}
                      className="text-xs text-danger-weak hover:text-danger mt-1 underline"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Server Status */}
          {isServerHealthy === false && (
            <div className="banner-error">
              <div className="flex items-center gap-2 mb-1">
                <AlertCircle className="w-4 h-4 text-danger" />
                <span className="text-xs font-medium text-danger">
                  SERVER OFFLINE
                </span>
              </div>
              <p className="text-xs text-danger">
                Cannot connect to backend server
              </p>
            </div>
          )}

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2 flex flex-col chat-messages-container">
            {/* Messages */}
            {messages.length === 0 &&
            (projectStatus === "loading" ||
              projectStatus === "fetching" ||
              isWorkflowActive ||
              isNavigating) ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="p-4 bg-surface-ghost rounded-full mb-4">
                  {isWorkflowActive ? (
                    <img
                      src="/main.png"
                      alt="CodePup Logo"
                      className="w-16 h-16 md:w-8 md:h-8 object-contain"
                    />
                  ) : (
                    <Loader2 className="w-8 h-8 text-strong animate-spin" />
                  )}
                </div>
                <h3 className="text-lg font-medium text-strong mb-2">
                  {isNavigating
                    ? "Preparing Workspace"
                    : isWorkflowActive
                    ? "Complete Application Generation"
                    : projectStatus === "fetching"
                    ? "Fetching Project"
                    : existingProject
                    ? "Loading Project"
                    : "Generating Code"}
                </h3>
                <p className="text-muted max-w-sm text-sm break-words">
                  {isNavigating
                    ? "Setting up your project workspace..."
                    : isWorkflowActive
                    ? `${currentWorkflowStep} • ${workflowProgress}% complete`
                    : projectStatus === "fetching"
                    ? "Fetching project details and deployment status..."
                    : existingProject
                    ? "Loading your project preview..."
                    : "We are generating code files please wait"}
                </p>
                {currentProject && (
                  <div className="mt-3 text-xs text-muted break-all max-w-full">
                    Project ID: {currentProject.id} • Status:{" "}
                    {currentProject.status}
                  </div>
                )}
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="p-4 bg-surface-ghost rounded-full mb-4">
                  <Code className="w-8 h-8 text-muted" />
                </div>
                <h3 className="text-lg font-medium text-strong mb-2">
                  Ready to Chat
                </h3>
                <p className="text-muted max-w-sm text-sm break-words">
                  {currentProject && currentProject.status === "ready"
                    ? "Your project is ready! Start describing changes you'd like to make."
                    : fromWorkflow
                    ? "Complete application generation will start when you submit a prompt..."
                    : "Start describing your project or changes you'd like to make"}
                </p>
                {currentProject && (
                  <div className="mt-3 text-xs text-muted break-all max-w-full">
                    Project: {currentProject.name || currentProject.id}
                  </div>
                )}
              </div>
            ) : (
              <>
                {messages
                  .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
                  .map((message, index) => {
                    // Check if this is an assistant message and if we should show the logo
                    const shouldShowLogo =
                      message.type === "assistant" &&
                      (index === 0 ||
                        messages[index - 1]?.type !== "assistant");

                    return (
                      <div
                        key={message.id}
                        className={`${
                          message.type === "user"
                            ? "message-user ml-auto"
                            : "message-assistant"
                        }`}
                      >
                        {/* Show Codepup logo and name only for first assistant message in a sequence */}
                        {shouldShowLogo && (
                          <div className="flex items-center gap-3 mb-2">
                            <img
                              src="/favicon.ico"
                              alt="Codepup"
                              className="w-4 h-4 rounded-sm block"
                            />
                            <span className="text-strong text-sm font-medium leading-none -mb-0.5">
                              Codepup
                            </span>
                          </div>
                        )}

                        <div className="flex items-start gap-2">
                          {message.workflowStep && (
                            <div className="mt-1 flex-shrink-0">
                              {message.workflowStep === "Design Generation" && (
                                <Palette className="w-3 h-3 text-primary-weak" />
                              )}
                              {message.workflowStep ===
                                "Structure Planning" && (
                                <FileText className="w-3 h-3 text-success-weak" />
                              )}
                              {message.workflowStep ===
                                "Backend Generation" && (
                                <Database className="w-3 h-3 text-accent-purple" />
                              )}
                              {message.workflowStep ===
                                "Frontend Generation" && (
                                <Monitor className="w-3 h-3 text-accent-orange" />
                              )}
                              {message.workflowStep === "Deployment" && (
                                <Rocket className="w-3 h-3 text-success-weak" />
                              )}
                              {message.workflowStep ===
                                "Deployment Complete" && (
                                <CheckCircle className="w-3 h-3 text-success-weak" />
                              )}
                              {message.workflowStep === "Deployment Error" && (
                                <AlertCircle className="w-3 h-3 text-danger-weak" />
                              )}
                            </div>
                          )}
                          <div className="text-strong text-sm flex-1 min-w-0 overflow-hidden">
                            <div className="whitespace-pre-wrap break-words word-wrap-break-word overflow-wrap-anywhere">
                              {/* Render message content as markdown with custom styling */}
                              <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={{
                                  // Links - blue with hover effect
                                  a: ({ children, ...props }) => (
                                    <a
                                      {...props}
                                      className="md-link"
                                      target="_blank"
                                      rel="noopener noreferrer"
                                    >
                                      {children}
                                    </a>
                                  ),
                                  // Bold text - white and semibold
                                  strong: ({ children, ...props }) => (
                                    <strong {...props} className="md-strong">
                                      {children}
                                    </strong>
                                  ),
                                  // Headers - white with proper spacing
                                  h1: ({ children, ...props }) => (
                                    <h1 {...props} className="md-h1">
                                      {children}
                                    </h1>
                                  ),
                                  h2: ({ children, ...props }) => (
                                    <h2 {...props} className="md-h2">
                                      {children}
                                    </h2>
                                  ),
                                  // Lists - bullet and numbered with spacing
                                  ul: ({ children, ...props }) => (
                                    <ul
                                      {...props}
                                      className="list-disc list-inside mb-2 space-y-1"
                                    >
                                      {children}
                                    </ul>
                                  ),
                                  ol: ({ children, ...props }) => (
                                    <ol
                                      {...props}
                                      className="list-decimal list-inside mb-2 space-y-1"
                                    >
                                      {children}
                                    </ol>
                                  ),
                                  // Code - inline and block with dark background
                                  code: ({ children, className, ...props }) => {
                                    const isInline = !className;
                                    return isInline ? (
                                      <code {...props} className="code-inline">
                                        {children}
                                      </code>
                                    ) : (
                                      <code {...props} className="code-block">
                                        {children}
                                      </code>
                                    );
                                  },
                                  // Blockquotes - left border with italic text
                                  blockquote: ({ children, ...props }) => (
                                    <blockquote
                                      {...props}
                                      className="blockquote"
                                    >
                                      {children}
                                    </blockquote>
                                  ),
                                }}
                              >
                                {message.content}
                              </ReactMarkdown>
                            </div>
                            {message.isStreaming && (
                              <span className="inline-block w-2 h-4 bg-primary ml-1 animate-pulse"></span>
                            )}
                          </div>
                          {message.isStreaming && (
                            <Loader2 className="w-3 h-3 text-muted animate-spin mt-0.5 flex-shrink-0" />
                          )}
                        </div>
                        {/* Timestamp of the messages of the user and the assistant */}
                        {/* <span className="text-xs text-muted mt-1 block">
                      {message.timestamp.toLocaleTimeString()}
                    </span> */}
                      </div>
                    );
                  })}
                {/* Auto-scroll sentinel */}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>
          {/* Input Area */}
          <div className="chat-input-area">
            {((uploadMode === "images" && selectedImages.length > 0) ||
              (uploadMode === "docs" && selectedImages.length > 0) ||
              (uploadMode === "assets" && selectedAssets.length > 0)) && (
              <div className="mb-3 p-2 bg-subtle rounded-lg border border-default">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-body">
                    {uploadMode === "images"
                      ? `${selectedImages.length} image${
                          selectedImages.length > 1 ? "s" : ""
                        } selected`
                      : uploadMode === "docs"
                      ? `${selectedImages.length} document${
                          selectedImages.length > 1 ? "s" : ""
                        } selected`
                      : `${selectedAssets.length} asset${
                          selectedAssets.length > 1 ? "s" : ""
                        } selected`}
                  </span>
                  <button
                    onClick={() =>
                      uploadMode === "images"
                        ? clearSelectedImages()
                        : clearSelectedAssets()
                    }
                    className="text-xs text-danger hover:text-danger-weak"
                  >
                    Clear all
                  </button>
                </div>
                <div className="flex gap-2 overflow-visible">
                  {uploadMode === "images" || uploadMode === "docs"
                    ? // Image and Docs previews (both use selectedImages)
                      selectedImages.map((image, index) => (
                        <div
                          key={index}
                          className="relative flex-shrink-0 overflow-visible"
                        >
                          {uploadMode === "docs" ? (
                            // Use PdfPreview component for docs mode
                            <PdfPreview
                              file={image}
                              onRemove={() => removeImage(index)}
                              size="medium"
                            />
                          ) : (
                            // Show image preview for images mode
                            <img
                              src={URL.createObjectURL(image)}
                              alt={`Preview ${index + 1}`}
                              className="w-12 h-12 object-cover rounded border border-strong"
                            />
                          )}
                          {uploadMode !== "docs" && (
                            <button
                              onClick={() => removeImage(index)}
                              className="absolute -top-1 -right-1 btn-circle-danger z-10"
                            >
                              ×
                            </button>
                          )}
                        </div>
                      ))
                    : // Asset previews
                      selectedAssets.map((asset, index) => (
                        <div
                          key={index}
                          className="relative flex-shrink-0 overflow-visible"
                        >
                          <div className="w-12 h-12 bg-tile rounded border border-strong flex items-center justify-center">
                            {asset.type.startsWith("image/") ? (
                              <img
                                src={URL.createObjectURL(asset)}
                                alt={asset.name}
                                className="w-full h-full object-cover rounded"
                              />
                            ) : (
                              <span className="text-xs text-body font-mono">
                                {asset.name.split(".").pop()?.toUpperCase() ||
                                  "FILE"}
                              </span>
                            )}
                          </div>
                          <button
                            onClick={() => removeAsset(index)}
                            className="absolute -top-1 -right-1 btn-circle-danger z-10"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                </div>
              </div>
            )}

            {(uploadMode === "docs" || showDocsInput) && (
              <div className={`${showDocsInput ? "block" : "hidden"} mb-3`}>
                <UnifiedFileUploadSection
                  ref={docsInputRef}
                  selectedFiles={selectedImages}
                  setSelectedFiles={(files) => {
                    setSelectedImages(files);
                    // Automatically hide the input after file selection
                    if (files.length > 0) {
                      setTimeout(() => setShowDocsInput(false), 200);
                    }
                  }}
                  isConfigValid={true}
                  showToast={(message, type) => {
                    if (type === "error") {
                      setError(message);
                    }
                  }}
                  uploadMode="docs"
                  projectId={projectId}
                  getToken={getToken}
                />
              </div>
            )}

            {/* File Upload Inputs - Only for images and assets (docs handled by UnifiedFileUploadSection) */}
            {uploadMode !== "docs" && (
              <>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageSelect}
                  accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml,image/ico,image/x-icon,image/vnd.microsoft.icon,image/bmp,image/tiff"
                  multiple
                  className="hidden"
                />
                <input
                  type="file"
                  ref={assetInputRef}
                  onChange={handleAssetSelect}
                  accept="image/*,application/pdf,text/plain,application/json,audio/*,video/*,font/*,text/css,application/javascript,application/zip"
                  multiple
                  className="hidden"
                />
              </>
            )}

            {/* Refactored Chat Input Bar - Lovable Style */}
            <div className="chat-input-container">
              {/* Part 1: Input Field (Full Width) */}
              <div className="chat-input-field-section">
                <textarea
                  className="chat-textarea"
                  value={prompt}
                  onChange={handlePromptChange}
                  onKeyPress={handleKeyPress}
                  onPaste={handlePaste}
                  onInput={(e) => {
                    // Auto-resize textarea
                    const textarea = e.target as HTMLTextAreaElement;
                    textarea.style.height = "auto";

                    // Calculate max height (12rem = 192px)
                    const maxHeight = 12 * 16;

                    // Set height based on content, but don't exceed max
                    const newHeight = Math.min(
                      textarea.scrollHeight,
                      maxHeight
                    );
                    textarea.style.height = newHeight + "px";
                  }}
                  placeholder={
                    isServerHealthy === false
                      ? "Server offline..."
                      : isAgentActivating
                      ? "Agent is waking up..."
                      : isWorkflowActive || isStreamingGeneration
                      ? "Workflow in progress..."
                      : isModifying || isStreamingModification
                      ? "Modification in progress..."
                      : isDeploying
                      ? "Deployment in progress..."
                      : "Ask Codepup..."
                  }
                  disabled={
                    isLoading ||
                    projectStatus === "loading" ||
                    projectStatus === "fetching" ||
                    isStreamingResponse ||
                    isStreamingGeneration ||
                    isWorkflowActive ||
                    isNavigating ||
                    isServerHealthy === false ||
                    isModifying ||
                    isStreamingModification ||
                    isDeploying ||
                    isAgentActivating
                  }
                  maxLength={1000}
                />
              </div>

              {/* Part 2: Action Buttons (Separate Line) */}
              <div className="chat-input-buttons-section">
                {/* Left: Upload Button */}
                <div className="chat-buttons" data-upload-menu>
                  <div className="relative">
                    <button
                      onClick={toggleUploadMenu}
                      disabled={
                        isLoading ||
                        projectStatus === "loading" ||
                        projectStatus === "fetching" ||
                        isStreamingResponse ||
                        isStreamingGeneration ||
                        isWorkflowActive ||
                        isNavigating ||
                        isServerHealthy === false ||
                        isModifying ||
                        isStreamingModification ||
                        isDeploying ||
                        isAgentActivating
                      }
                      className="chat-button"
                      title="Add files"
                    >
                      <Plus className="w-4 h-4" />
                    </button>

                    {/* Dropdown Menu */}
                    {showUploadMenu && (
                      <div className="absolute bottom-full left-0 mb-2 dropdown py-1 min-w-[140px] animate-in fade-in-0 zoom-in-95 duration-200 origin-bottom-left">
                        {/* Clipboard Image Header */}
                        {clipboardImage && (
                          <div className="px-3 py-2 border-b animate-in fade-in-0 slide-in-from-top-2 duration-200">
                            <div className="text-xs text-muted mb-2">
                              📋 Clipboard Image Detected
                            </div>
                            <div className="flex items-center gap-2 mb-2">
                              {clipboardImage.type === "application/pdf" ||
                              clipboardImage.name
                                .toLowerCase()
                                .endsWith(".pdf") ? (
                                // Show PDF icon for PDF files
                                <div className="w-8 h-8 bg-red-100 rounded border border-strong flex items-center justify-center">
                                  <FileText className="w-4 h-4 text-red-600" />
                                </div>
                              ) : (
                                // Show image preview for images
                                <img
                                  src={URL.createObjectURL(clipboardImage)}
                                  alt="Clipboard"
                                  className="w-8 h-8 object-cover rounded border border-strong"
                                />
                              )}
                              <span className="text-xs text-body truncate">
                                {clipboardImage.name}
                              </span>
                            </div>
                            <div className="text-xs text-muted">
                              Select category to add:
                            </div>
                          </div>
                        )}

                        <button
                          onClick={() => {
                            if (clipboardImage) {
                              // Add clipboard image to images (replace existing selection)
                              setSelectedImages([clipboardImage]); // Only one image allowed
                              // Upload clipboard image to database
                              uploadFilesToDatabaseHelper([clipboardImage]);
                              // Switch to images mode to show the preview
                              selectUploadMode("images", true); // Skip clearing to keep the image
                              setClipboardImage(null); // Clear clipboard image
                              setShowUploadMenu(false);
                              setClipboardSelectedOption("images");
                            } else {
                              // Regular file upload
                              selectUploadMode("images");
                              fileInputRef.current?.click();
                            }
                          }}
                          onMouseEnter={() => {
                            if (clipboardImage) {
                              setHoveredOption("images");
                              setClipboardSelectedOption("images");
                            }
                          }}
                          onMouseLeave={() => {
                            setHoveredOption(null);
                          }}
                          className={`menu-item transition-all duration-150 ${
                            clipboardImage &&
                            (clipboardSelectedOption === "images" ||
                              hoveredOption === "images")
                              ? "bg-primary-subtle border-primary text-primary"
                              : hoveredOption === "images"
                              ? "bg-slate-50 text-slate-900"
                              : "hover:bg-slate-50 hover:text-slate-900"
                          }`}
                        >
                          🖼️ <span>Images</span>
                          {clipboardImage && (
                            <span className="text-xs text-primary-weak">
                              (Add clipboard)
                            </span>
                          )}
                        </button>

                        <button
                          onClick={() => {
                            if (clipboardImage) {
                              // Add clipboard image to assets (replace existing selection)
                              setSelectedAssets([clipboardImage]); // Only one asset allowed
                              // Upload clipboard image to database
                              uploadFilesToDatabaseHelper([clipboardImage]);
                              // Switch to assets mode to show the preview
                              selectUploadMode("assets", true); // Skip clearing to keep the asset
                              setClipboardImage(null); // Clear clipboard image
                              setShowUploadMenu(false);
                              setClipboardSelectedOption("assets");
                            } else {
                              // Regular file upload
                              selectUploadMode("assets");
                              assetInputRef.current?.click();
                            }
                          }}
                          onMouseEnter={() => {
                            if (clipboardImage) {
                              setHoveredOption("assets");
                              setClipboardSelectedOption("assets");
                            }
                          }}
                          onMouseLeave={() => {
                            setHoveredOption(null);
                          }}
                          className={`menu-item transition-all duration-150 ${
                            clipboardImage &&
                            (clipboardSelectedOption === "assets" ||
                              hoveredOption === "assets")
                              ? "bg-primary-subtle border-primary text-primary"
                              : hoveredOption === "assets"
                              ? "bg-slate-50 text-slate-900"
                              : "hover:bg-slate-50 hover:text-slate-900"
                          }`}
                        >
                          📁 <span>Assets</span>
                          {clipboardImage && (
                            <span className="text-xs text-primary-weak">
                              (Add clipboard)
                            </span>
                          )}
                        </button>
                        {!clipboardImage && (
                          <button
                            onClick={() => {
                              selectUploadMode("docs");
                              setShowUploadMenu(false);
                              // Show the docs input section
                              setShowDocsInput(true);
                              // Auto-trigger the file selection after a brief delay
                              setTimeout(() => {
                                docsInputRef.current?.click();
                              }, 100);
                            }}
                            className={`menu-item transition-all duration-150 hover:bg-slate-50 hover:text-slate-900`}
                          >
                            📄 <span>Docs</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Send Button */}
                <div className="chat-buttons">
                  <button
                    onClick={() => {
                      // Only handleSubmit if idle + ready
                      if (
                        prompt.trim() &&
                        !isLoading &&
                        !isWorkflowActive &&
                        !isModifying &&
                        !isStreamingResponse &&
                        !isStreamingGeneration &&
                        !isStreamingModification
                      ) {
                        handleSubmit();
                      }
                    }}
                    disabled={
                      !prompt.trim() ||
                      isLoading ||
                      isWorkflowActive ||
                      isModifying ||
                      isStreamingResponse ||
                      isStreamingGeneration ||
                      isStreamingModification ||
                      isAgentActivating
                    }
                    className={`chat-button ${
                      prompt.trim() &&
                      !isLoading &&
                      !isWorkflowActive &&
                      !isModifying &&
                      !isStreamingResponse &&
                      !isStreamingGeneration &&
                      !isStreamingModification
                        ? "chat-button-primary"
                        : ""
                    }`}
                    title="Send message"
                  >
                    {isLoading || isWorkflowActive || isModifying ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Part 3: Status and Instructions (Bottom Section) */}
              <div className="chat-input-bottom-section">
                <span>
                  {isServerHealthy === false ? (
                    "Server offline - check connection"
                  ) : isWorkflowActive || isStreamingGeneration ? (
                    "Complete workflow in progress..."
                  ) : isDeploying ? (
                    "Deployment in progress..."
                  ) : (
                    <>
                      <span className="font-semibold">Enter</span> to send,{" "}
                      <span className="font-semibold">Shift+Enter</span> for new
                      line
                    </>
                  )}
                </span>
                <span>{prompt.length}/1000</span>
              </div>
            </div>
          </div>
        </div>
        {/* Vertical divider for resizing */}
        {!isChatHidden && !isNarrow && (
          <div
            onMouseDown={handleResizeStart}
            title="Drag to resize"
            className={`relative z-40 flex-shrink-0 cursor-col-resize transition-colors`}
            style={{ width: 2, cursor: "col-resize" }}
          >
            <div className="h-full w-[2px] mx-auto bg-gray-200 hover:bg-gray-300 overflow-hidden" />
          </div>
        )}

        {/* Preview Section - resizable */}
        <div
          className="flex flex-col bg-subtle-50 h-screen transition-[width] duration-300 ease-out"
          style={{
            width: isNarrow
              ? isChatHidden
                ? "100%"
                : "0%"
              : isChatHidden
              ? "100%"
              : `${100 - leftWidthPct}%`,
          }}
        >
          {/* Preview Header */}
          <div className="header-bar">
            <div className="flex items-center justify-between w-full h-10">
              {/* Left side: Toggle button + Segmented tabs when chat is hidden */}
              <div className="flex items-center gap-3 h-8">
                {/* Show Chat Toggle Button when hidden */}
                {isChatHidden && (
                  <button
                    onClick={toggleChatSidebar}
                    className="p-1.5 hover:bg-slate-100 rounded-md transition-colors"
                    title="Show chat sidebar (Ctrl+B)"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 -960 960 960"
                      className="shrink-0 h-4 w-4"
                      fill="currentColor"
                    >
                      <path d="M180-120q-24.75 0-42.37-17.63Q120-155.25 120-180v-600q0-24.75 17.63-42.38Q155.25-840 180-840h600q24.75 0 42.38 17.62Q840-804.75 840-780v600q0 24.75-17.62 42.37Q804.75-120 780-120zm207-60h393v-600H387z"></path>
                    </svg>
                  </button>
                )}

                {/* Segmented Control Tabs */}
                <div className="flex items-center h-8">
                  <div className="flex bg-subtle rounded-md p-0.5">
                    <button
                      onClick={() => {
                        setActiveTab("preview");
                      }}
                      className={`px-3 h-7 text-sm font-medium rounded-md transition-all duration-200 ${
                        activeTab === "preview"
                          ? "bg-white text-strong shadow-sm border border-default"
                          : "text-muted hover:text-body"
                      }`}
                    >
                      Preview
                    </button>
                    {showCodeTab && (
                      <button
                        onClick={() => {
                          setActiveTab("code");
                        }}
                        className={`px-3 h-7 text-sm font-medium rounded-md transition-all duration-200 ${
                          activeTab === "code"
                            ? "bg-white text-strong shadow-sm border border-default"
                            : "text-muted hover:text-body"
                        }`}
                      >
                        Code
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Right side: GitHub, Publish, and other buttons */}
              <div className="flex items-center gap-2 h-8">
                {/* GitHub Connect Button */}
                {projectStatus === "ready" && (
                  <div className="hidden lg:flex items-center h-8">
                    <Dialog>
                      <DialogTitle className="hidden">
                        Manage GitHub
                      </DialogTitle>
                      <DialogTrigger
                        aria-label="Connect GitHub"
                        className="flex items-center justify-center w-8 h-8 text-gray-800 hover:text-gray-900 transition-transform duration-200 hover:cursor-pointer hover:scale-105 rounded-md"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 98 96"
                          fill="currentColor"
                          className="size-6"
                        >
                          <path
                            fill="currentcolor"
                            fillRule="evenodd"
                            d="M48.854 0C21.839 0 0 22 0 49.217c0 21.756 13.993 40.172 33.405 46.69 2.427.49 3.316-1.059 3.316-2.362 0-1.141-.08-5.052-.08-9.127-13.59 2.934-16.42-5.867-16.42-5.867-2.184-5.704-5.42-7.17-5.42-7.17-4.448-3.015.324-3.015.324-3.015 4.934.326 7.523 5.052 7.523 5.052 4.367 7.496 11.404 5.378 14.235 4.074.404-3.178 1.699-5.378 3.074-6.6-10.839-1.141-22.243-5.378-22.243-24.283 0-5.378 1.94-9.778 5.014-13.2-.485-1.222-2.184-6.275.486-13.038 0 0 4.125-1.304 13.426 5.052a47 47 0 0 1 12.214-1.63c4.125 0 8.33.571 12.213 1.63 9.302-6.356 13.427-5.052 13.427-5.052 2.67 6.763.97 11.816.485 13.038 3.155 3.422 5.015 7.822 5.015 13.2 0 18.905-11.404 23.06-22.324 24.283 1.78 1.548 3.316 4.481 3.316 9.126 0 6.6-.08 11.897-.08 13.526 0 1.304.89 2.853 3.316 2.364 19.412-6.52 33.405-24.935 33.405-46.691C97.707 22 75.788 0 48.854 0"
                            clipRule="evenodd"
                          ></path>
                        </svg>
                        <span className="hidden">Manage GitHub</span>
                      </DialogTrigger>

                      <DialogContent
                        className="bg-white w-[95vw] sm:max-w-3xl max-w-[95vw] max-h-[85vh] overflow-auto p-0"
                        aria-describedby="github-description"
                      >
                        <GitHubModel projectId={projectId} clerkId={clerkId} />
                      </DialogContent>
                    </Dialog>
                  </div>
                )}
                
                {/* Credits Indicator always last before menu */}
                <div className="flex items-center">
                  <Credit value={credits} />
                </div>
                {/* Mobile/medium: hamburger menu AFTER credits */}
                <div className="lg:hidden relative" data-mobile-menu>
                  <button
                    className="w-8 h-8 flex items-center justify-center rounded-md border border-default hover:bg-slate-50"
                    onClick={() => setIsMenuOpen((v) => !v)}
                    aria-label="Menu"
                  >
                    <Menu className="w-5 h-5" />
                  </button>
                  {isMenuOpen && (
                    <div className="absolute right-0 mt-2 bg-white border border-default rounded-md shadow-lg w-56 py-1 z-50">
                      <button
                        onClick={async () => {
                          if (isDeploying || (!canDeploy && !deploymentUrl))
                            return;
                          await handleDeploy();
                          setIsMenuOpen(false);
                        }}
                        disabled={isDeploying || (!canDeploy && !deploymentUrl)}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-50 flex items-center gap-2 ${
                          isDeploying || (!canDeploy && !deploymentUrl)
                            ? "opacity-50 cursor-not-allowed"
                            : ""
                        }`}
                        title="Publish"
                      >
                        {isDeploying ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Publishing...</span>
                          </>
                        ) : (
                          <>
                            <Rocket className="w-4 h-4" />
                            <span>Publish</span>
                          </>
                        )}
                      </button>
                      {shareAbleUrl && (
                        <div className="px-3 py-2 border-t border-gray-100">
                          <div className="flex items-center gap-2">
                            <Globe className="w-4 h-4 text-slate-600" />
                            <div className="flex-1 min-w-0">
                              <div className="text-xs text-gray-500 mb-1">
                                Preview
                              </div>
                              <a
                                className="text-xs text-blue-600 hover:text-blue-800 break-all"
                                href={shareAbleUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                {shareAbleUrl}
                              </a>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {/* Publish Button (desktop) */}
                <div
                  className="hidden lg:flex relative items-center h-8"
                  data-publish-menu
                >
                  <button
                    onClick={() => setShowPublishMenu((prev) => !prev)}
                    className="btn-publish-primary h-8 px-3 rounded-md"
                    title="Publish options"
                  >
                    <div className="flex items-center gap-2">
                      <Rocket className="w-3 h-3" />
                      <span className="text-xs">Publish</span>
                    </div>
                  </button>
                  {showPublishMenu && (
                    <>
                      <div
                        className="publish-overlay"
                        onMouseDown={() => setShowPublishMenu(false)}
                      />
                      <div
                        className="publish-dropdown z-dropdown fade-slide-in"
                        onAnimationEnd={(e) =>
                          e.currentTarget.classList.remove("fade-slide-in")
                        }
                      >
                        <div
                          className="publish-dropdown-content"
                          onMouseDown={(e) => e.stopPropagation()}
                        >
                          <div>
                            <div className="publish-dropdown-title">
                              Publish
                            </div>
                            <div className="publish-dropdown-desc">
                              Deploy your project and track its performance.
                            </div>
                          </div>
                          {shareAbleUrl && (
                            <div className="publish-preview">
                              <Globe className="w-4 h-4 text-slate-600 mt-0.5" />
                              <div className="flex-1 min-w-0">
                                <div className="publish-preview-title">
                                  Preview
                                </div>
                                <a
                                  className="publish-preview-link"
                                  href={shareAbleUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  {shareAbleUrl}
                                </a>
                              </div>
                            </div>
                          )}
                          <div className="pt-1">
                            <button
                              onClick={() => {
                                handleDeploy();
                              }}
                              className="btn-publish-primary w-full"
                              disabled={
                                isDeploying || (!canDeploy && !deploymentUrl)
                              }
                            >
                              {isDeploying ? (
                                <div className="flex items-center justify-center gap-2">
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                  <span className="text-xs">Publishing...</span>
                                </div>
                              ) : (
                                "Publish"
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Preview Content */}
          <div className="flex-1 p-4">
            <div className="w-full h-full panel-elevated overflow-hidden relative">
              {/* Loading overlay for iframe refresh */}
              {isIframeLoading && (
                <div className="absolute inset-0 z-30 overlay-surface-80 flex items-center justify-center">
                  <div className="text-center">
                    <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-2" />
                    <p className="text-sm text-muted">Refreshing preview...</p>
                  </div>
                </div>
              )}

              {/* Tab Content */}
              {activeTab === "preview" ? (
                /* Preview Tab Content */
                <>
                  {/* Preview iframe with enhanced refresh capabilities */}
                  {previewUrl ? (
                    isCheckingContainer ? (
                      /* Container status checking - show loading spinner */
                      <div className="w-full h-full flex flex-col items-center justify-center bg-placeholder">
                        <div className="text-center max-w-md px-4">
                          <div className="w-16 h-16 bg-neutral-tile rounded-lg mx-auto mb-4 flex items-center justify-center">
                            <Loader2 className="w-8 h-8 text-primary animate-spin" />
                          </div>
                          <h3 className="text-lg font-semibold text-strong mb-2">
                            Checking Preview Status
                          </h3>
                        </div>
                      </div>
                    ) : isContainerOnline === false ? (
                      <BlankApp
                        projectId={projectId}
                        disableActivate={isModifying || isStreamingModification}
                        onActivationStateChange={setIsAgentActivating}
                      />
                    ) : (
                      <iframe
                        ref={iframeRef}
                        key={iframeKey}
                        src={previewUrl}
                        className="w-full h-full absolute inset-0 z-10"
                        title="Live Preview"
                        sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                        onLoad={() => {
                          setIsIframeLoading(false);
                        }}
                        onError={(e) => {
                          setIsIframeLoading(false);
                          setError(
                            "Failed to load preview. The deployment might not be ready yet."
                          );
                        }}
                      />
                    )
                  ) : (
                    /* Preview not available message */
                    <div className="w-full h-full flex flex-col items-center justify-center bg-placeholder">
                      <div className="text-center max-w-md px-4">
                        <div
                          className={`w-16 h-16 bg-neutral-tile rounded-lg mx-auto mb-4 flex items-center justify-center ${
                            isWorkflowActive ? "puppy-bounce" : ""
                          }`}
                        >
                          <img
                            src="/main.png"
                            alt="CodePup Logo"
                            className="object-contain"
                            style={{ width: "100%", height: "100%" }}
                          />
                        </div>
                        <h3 className="text-lg font-semibold text-strong mb-2">
                          Preview Not Available Yet
                        </h3>
                        <p className="text-muted mb-4 text-sm leading-relaxed">
                          Preview will be shown after generation. Please wait
                          5-7 mins. We'll email you when generation is
                          completed.
                        </p>

                        {/* Countdown Timer */}
                        {isWorkflowActive &&
                          !previewUrl &&
                          countdownTime > 0 && (
                            <div className="text-center">
                              {/* Timer label */}
                              <div className="text-muted text-sm mb-3 uppercase tracking-wide">
                                Time Remaining
                              </div>

                              {/* Timer container with glassmorphism */}
                              <div className="bg-surface-overlay backdrop-blur-sm border border-default-weak rounded-xl shadow-lg p-6 mx-auto w-fit mb-4 timer-breathe">
                                <div className="text-6xl font-mono font-black text-strong tracking-wider">
                                  {formatCountdown(countdownTime)}
                                </div>
                              </div>

                              {/* Progress indicator */}
                              <div className="w-32 h-1 bg-subtle rounded-full mx-auto overflow-hidden">
                                <div
                                  className="h-full bg-primary rounded-full transition-all duration-1000"
                                  style={{
                                    width: `${
                                      ((600 - countdownTime) / 600) * 100
                                    }%`,
                                  }}
                                ></div>
                              </div>
                            </div>
                          )}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                /* Code Tab Content */
                <>
                  {isStreamingGeneration ? (
                    /* Streaming Code Display */
                    <div className="w-full h-full overflow-hidden">
                      <StreamingCodeDisplay
                        content={streamingCodeContent}
                        isStreaming={isStreamingGeneration}
                        files={generatedFiles}
                        currentFile={currentGeneratingFile}
                        progress={streamingProgress}
                      />
                    </div>
                  ) : (
                    /* Code not streaming message */
                    <div className="w-full h-full flex flex-col items-center justify-center bg-placeholder">
                      <div className="text-center max-w-md px-4">
                        <div className="w-16 h-16 bg-neutral-tile rounded-lg mx-auto mb-4 flex items-center justify-center">
                          <Code className="w-8 h-8 text-muted" />
                        </div>
                        <h3 className="text-lg font-semibold text-strong mb-2">
                          Code Generation
                        </h3>
                        <p className="text-muted mb-4 text-sm leading-relaxed">
                          {previewUrl
                            ? "The code generation is completed. See preview in preview tab."
                            : "The generated code will be shown here"}
                        </p>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* 4-Part Workflow Display - ABOVE EVERYTHING IN PREVIEW */}
              {isWorkflowActive && (
                <div className="absolute top-16 right-6 z-30 pointer-events-none">
                  <div className="bg-surface-overlay backdrop-blur-md rounded-xl p-4 border border-default-weak shadow-xl min-w-80">
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 bg-primary-subtle rounded-lg flex items-center justify-center">
                        <svg
                          className="w-5 h-5 text-primary"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-strong">
                          Application Generation
                        </h3>
                        <p className="text-xs text-muted">
                          Building your complete app
                        </p>
                      </div>
                    </div>

                    {/* 4 Workflow Steps */}
                    <div className="space-y-3">
                      {getWorkflowSteps(projectScope)?.map((step, idx) => {
                        const stepsConfig =
                          getWorkflowSteps(projectScope) || [];
                        const currentIndex = stepsConfig.findIndex(
                          (s) => s.name === currentWorkflowStep
                        );
                        const stepData = workflowSteps.find(
                          (s) => s.step === step.name
                        );
                        const isActive = currentWorkflowStep === step.name;
                        const isCompleteRaw = !!stepData?.isComplete;
                        const isCompleteDerived =
                          projectStatus === "ready" ||
                          streamingProgress === 100 ||
                          (currentIndex > -1 && idx < currentIndex);
                        const isComplete = isCompleteRaw || isCompleteDerived;
                        const hasError = stepData?.error;

                        return (
                          <div
                            key={step.name}
                            className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-300 ${
                              hasError
                                ? "bg-step-error"
                                : isComplete
                                ? "bg-step-success"
                                : isActive
                                ? "bg-step-active animate-pulse"
                                : "bg-step-default"
                            }`}
                          >
                            {/* Step Icon */}
                            <div
                              className={`text-2xl ${
                                isActive ? "animate-bounce" : ""
                              }`}
                            >
                              {step.icon}
                            </div>

                            {/* Step Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h4
                                  className={`text-sm font-medium ${
                                    hasError
                                      ? "text-danger"
                                      : isComplete
                                      ? "text-success"
                                      : isActive
                                      ? "text-primary"
                                      : "text-body"
                                  }`}
                                >
                                  {step.name}
                                </h4>

                                {/* Progress indicator for active step */}
                                {isActive && (
                                  <span className="text-xs bg-primary-subtle text-primary px-2 py-0.5 rounded-full font-medium">
                                    {workflowProgress}%
                                  </span>
                                )}
                              </div>
                              <p
                                className={`text-xs ${
                                  hasError
                                    ? "text-danger"
                                    : isComplete
                                    ? "text-success"
                                    : isActive
                                    ? "text-primary"
                                    : "text-muted"
                                }`}
                              >
                                {hasError
                                  ? `Error: ${stepData?.error}`
                                  : isComplete
                                  ? "Completed successfully"
                                  : isActive
                                  ? step.description
                                  : step.description}
                              </p>
                            </div>

                            {/* Status Icon */}
                            <div className="flex-shrink-0">
                              {hasError ? (
                                <div className="w-6 h-6 bg-status-error rounded-full flex items-center justify-center">
                                  <svg
                                    className="w-4 h-4 text-on-solid"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                </div>
                              ) : isComplete ? (
                                <div className="w-6 h-6 bg-status-ready rounded-full flex items-center justify-center">
                                  <svg
                                    className="w-4 h-4 text-on-solid"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                </div>
                              ) : isActive ? (
                                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                              ) : (
                                <div className="w-6 h-6 bg-neutral-300 rounded-full flex items-center justify-center">
                                  <svg
                                    className="w-4 h-4 text-muted"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Overall Progress */}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* Insufficient credits modal */}
      {insufficientOpen && (
        <RewardModal
          message={
            insufficientMessage || (
              <>
                ⚠️{" "}
                <span className="font-semibold text-red-600">
                  Insufficient credits
                </span>
              </>
            )
          }
          onClose={() => setInsufficientOpen(false)}
        />
      )}
    </>
  );
};

export default ChatPage;

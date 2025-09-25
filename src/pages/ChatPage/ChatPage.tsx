// components/ChatPage.tsx - COMBINED WITH ALL FUNCTIONALITIES
// Dialog
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "../../components/ui/dialog";
import PdfPreview from "../../components/pdfpreview";
import UnifiedFileUploadSection from "../../components/UnifiedFileUpload";
import type { UnifiedFileUploadRef } from "../../components/UnifiedFileUpload";
import React, {
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import { MyContext } from "../../context/FrontendStructureContext";
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
} from "lucide-react";
import { StreamingCodeDisplay, FileCompletionTracker } from "../streaming";
import axios from "axios";
import { useAuth, UserButton } from "@clerk/clerk-react";
import { useChatPageState, useChatPageLogic } from "../../hooks/chatpage_hooks";
import { v4 as uuidv4 } from "uuid";
import CopyLinkButton from "../../components/CopyToClip";
import { uploadFilesToDatabase } from "../../utils/fileUpload";
import type { ContextValue } from "../../types/index";
import { WorkflowStateManager } from "../../utils/workflowStateManager";
import GitHubModel from "../../components/GithubModel";
import Credit from "../../components/Credit";
import RewardModal from "../../components/RewardModal";
import BlankApp from "../../components/BlankApp";
// Close upload menu when clicking outside

import { amplitude } from "../../utils/amplitude";
import { useToast } from "../../helper/Toast";
import ChatSection from "./component/ChatSection";
import PreviewContent from "./component/PreviewSection";

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
  const [showChatPublishMenu, setShowChatPublishMenu] = useState(false);

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
        const res = await axios.head(url, {
          timeout: 5000, // 5 second timeout
        });
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
    // If previewUrl likely came from stream (immediate render path), skip HEAD check for first paint
    if (isWorkflowActive || isStreamingGeneration) {
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

  // Auto-show preview section on mobile when iframe is active
  useEffect(() => {
    // Only apply this logic on mobile/medium devices (isNarrow)
    if (!isNarrow) return;
    
    // Show preview section when:
    // 1. Preview URL is available
    // 2. Container is online (iframe is loaded and working)
    // 3. Not currently in a workflow or streaming state
    if (
      previewUrl && 
      isContainerOnline === true && 
      !isWorkflowActive && 
      !isStreamingGeneration && 
      !isStreamingModification
    ) {
      setIsChatHidden(true); // Hide chat to show preview
    }
    // Switch back to chat when iframe becomes unavailable
    else if (
      (!previewUrl || isContainerOnline === false) && 
      !isWorkflowActive && 
      !isStreamingGeneration && 
      !isStreamingModification
    ) {
      setIsChatHidden(false); // Show chat when preview is not available
    }
  }, [isNarrow, previewUrl, isContainerOnline, isWorkflowActive, isStreamingGeneration, isStreamingModification]);
  const { getToken } = useAuth();
  const {
    // Functions
    scrollToBottom,
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
      if (showUploadMenu || showPublishMenu || showChatPublishMenu) {
        const target = event.target as Element;
        const uploadButton = target.closest("[data-upload-menu]");
        const publishButton = target.closest("[data-publish-menu]");
        const chatPublishButton = target.closest("[data-chat-publish-menu]");
        if (!uploadButton && !publishButton && !chatPublishButton) {
          setShowUploadMenu(false);
          setShowPublishMenu(false);
          setShowChatPublishMenu(false);
          // Clear clipboard image when menu is closed
          if (clipboardImage) {
            setClipboardImage(null);
          }
          // Reset selection when menu closes
          setClipboardSelectedOption("images");
          setHoveredOption(null);
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
    showChatPublishMenu,
    setShowUploadMenu,
    clipboardImage,
    setClipboardImage,
    setClipboardSelectedOption,
    setHoveredOption,
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
                <span className="font-bold text-slate-900">{have}</span> tokens.
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

  // Global toast
  const { showToast } = useToast();
  return (
    <>
      {/* Toast Notifications */}
      <div
        ref={containerRef}
        className="w-full bg-app chat-layout flex h-screen"
        style={{ width: "100%" }}
      >
        {/* Chat Section - resizable */}
        <ChatSection
          isChatHidden={isChatHidden}
          isNarrow={isNarrow}
          leftWidthPct={leftWidthPct}
          toggleChatSidebar={toggleChatSidebar}
          messages={messages}
          messagesEndRef={messagesEndRef}
          prompt={prompt}
          handlePromptChange={handlePromptChange}
          handleKeyPress={handleKeyPress}
          handlePaste={handlePaste}
          handleSubmit={handleSubmit}
          uploadMode={uploadMode}
          selectedImages={selectedImages}
          setSelectedImages={setSelectedImages}
          selectedAssets={selectedAssets}
          setSelectedAssets={setSelectedAssets}
          fileInputRef={fileInputRef}
          assetInputRef={assetInputRef}
          docsInputRef={docsInputRef}
          handleImageSelect={handleImageSelect}
          handleAssetSelect={handleAssetSelect}
          removeImage={removeImage}
          removeAsset={removeAsset}
          clearSelectedImages={clearSelectedImages}
          clearSelectedAssets={clearSelectedAssets}
          showUploadMenu={showUploadMenu}
          toggleUploadMenu={toggleUploadMenu}
          selectUploadMode={selectUploadMode}
          showDocsInput={showDocsInput}
          setShowDocsInput={setShowDocsInput}
          clipboardImage={clipboardImage}
          clipboardSelectedOption={clipboardSelectedOption}
          hoveredOption={hoveredOption}
          setHoveredOption={setHoveredOption}
          setClipboardImage={setClipboardImage}
          setClipboardSelectedOption={setClipboardSelectedOption}
          uploadFilesToDatabaseHelper={uploadFilesToDatabaseHelper}
          isLoading={isLoading}
          projectStatus={projectStatus}
          isStreamingResponse={isStreamingResponse}
          isStreamingGeneration={isStreamingGeneration}
          isWorkflowActive={isWorkflowActive}
          isNavigating={isNavigating}
          isServerHealthy={isServerHealthy}
          isModifying={isModifying}
          isStreamingModification={isStreamingModification}
          isDeploying={isDeploying}
          isAgentActivating={isAgentActivating}
          deployError={deployError}
          setDeployError={setDeployError}
          currentProject={currentProject}
          existingProject={existingProject}
          fromWorkflow={fromWorkflow}
          currentWorkflowStep={currentWorkflowStep}
          workflowProgress={workflowProgress}
          projectId={projectId}
          showToast={showToast}
          getToken={getToken}
          credits={credits}
          shareAbleUrl={shareAbleUrl}
          showPublishMenu={showChatPublishMenu}
          setShowPublishMenu={setShowChatPublishMenu}
          handleDeploy={handleDeploy}
          canDeploy={canDeploy}
          deploymentUrl={deploymentUrl}
        />
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

              {/* Right side: GitHub, Credits, and Share buttons */}
              <div className="flex items-center gap-2 h-8">
                {/* GitHub Connect Button - Desktop only */}
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

                {/* Credits Indicator */}
                <div className="flex items-center">
                  <Credit value={credits} />
                </div>

                {/* Share Button - Universal for all devices */}
                <div className="flex relative items-center h-8" data-publish-menu>
                  <button
                    onClick={() => setShowPublishMenu((prev) => !prev)}
                    className="btn-publish-primary h-8 px-3 rounded-md"
                    title="Publish options"
                  >
                    <div className="flex items-center gap-2">
                      <Rocket className="w-3 h-3" />
                      <span className="text-xs">Share</span>
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
                                  <span className="text-xs">Generating shareable URL...</span>
                                </div>
                              ) : (
                                <span className="text-sm font-medium">Generate shareable URL</span> 
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
          <PreviewContent
            previewUrl={previewUrl}
            isIframeLoading={isIframeLoading}
            setIsIframeLoading={setIsIframeLoading}
            iframeKey={iframeKey}
            isContainerOnline={isContainerOnline}
            isCheckingContainer={isCheckingContainer}
            activeTab={activeTab}
            isWorkflowActive={isWorkflowActive}
            countdownTime={countdownTime}
            isStreamingGeneration={isStreamingGeneration}
            streamingCodeContent={streamingCodeContent}
            generatedFiles={generatedFiles}
            currentGeneratingFile={currentGeneratingFile}
            streamingProgress={streamingProgress}
            projectId={projectId}
            isModifying={isModifying}
            isStreamingModification={isStreamingModification}
            setError={setError}
            setIsAgentActivating={setIsAgentActivating}
            currentWorkflowStep={currentWorkflowStep}
            workflowProgress={workflowProgress}
            workflowSteps={workflowSteps}
            projectScope={projectScope}
            projectStatus={projectStatus}
            getWorkflowSteps={getWorkflowSteps}
          />
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

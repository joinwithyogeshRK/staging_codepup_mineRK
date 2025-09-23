// hooks/useChatPage.ts - ENHANCED WITH VISIBLE CODE STREAMING

import { useState, useCallback, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import { useAuth } from "@clerk/clerk-react";
import { StreamingCodeParser } from "../pages/streaming";
import { WorkflowStateManager } from "../utils/workflowStateManager";
import { uploadFilesToDatabase } from "../utils/fileUpload";

import type {
  Project,
  Message,
  WorkflowStepData,
  StreamingProgressData,
  StreamingStats,
  GeneratedFile,
  ProjectInfo,
  LocationState,
} from "../types/index";

export const useChatPageState = () => {
  // Basic states
  const [messages, setMessages] = useState<Message[]>([]);
  const [prompt, setPrompt] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [projectStatus, setProjectStatus] = useState<
    "idle" | "loading" | "ready" | "error" | "fetching"
  >("idle");
  const [isStreamingResponse, setIsStreamingResponse] = useState(false);
  const [isServerHealthy, setIsServerHealthy] = useState<boolean | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [isModifying, setIsModifying] = useState(false);
  const [modificationHistory, setModificationHistory] = useState<string[]>([]);
  const [canModify, setCanModify] = useState(false);
  const [showModificationPanel, setShowModificationPanel] = useState(false);

  //@ts-ignore
  const location = useLocation() as Location & { state: LocationState };
  const scope = location.state?.scope || "frontend";
  // NEW: Add project scope state
  const [projectScope, setProjectScope] = useState<"frontend" | "fullstack">(
    scope
  );
  // ADD THIS NEW STATE to track manual stops
  const [hasUserStopped, setHasUserStopped] = useState(false);

  // Workflow states
  const [isWorkflowActive, setIsWorkflowActive] = useState(false);
  const [currentWorkflowStep, setCurrentWorkflowStep] = useState<string>("");
  const [workflowProgress, setWorkflowProgress] = useState(0);
  const [workflowSteps, setWorkflowSteps] = useState<WorkflowStepData[]>([]);
  const [isNavigating, setIsNavigating] = useState(false);
  const [showUploadMenu, setShowUploadMenu] = useState(false);
  // Add image upload states
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // NEW: Asset upload states
  const [selectedAssets, setSelectedAssets] = useState<File[]>([]);
  const assetInputRef = useRef<HTMLInputElement>(null);
  const [uploadMode, setUploadMode] = useState<"images" | "assets" | "docs">(
    "images"
  );

  // NEW: Add clipboard image state
  const [clipboardImage, setClipboardImage] = useState<File | null>(null);
  // NEW: Add clipboard navigation state
  const [clipboardSelectedOption, setClipboardSelectedOption] = useState<
    "images" | "assets"
  >("images");
  // Streaming states
  const [streamingData, setStreamingData] = useState<any>(null);
  const [isStreamingModification, setIsStreamingModification] = useState(false);
  const [isStreamingGeneration, setIsStreamingGeneration] = useState(false);
  const [streamingProgress, setStreamingProgress] = useState(0);
  const [streamingPhase, setStreamingPhase] = useState<string>("");
  const [streamingMessage, setStreamingMessage] = useState<string>("");
  const [streamingStats, setStreamingStats] = useState<StreamingStats>({
    totalCharacters: 0,
    chunksReceived: 0,
    estimatedTotalChunks: 0,
    startTime: 0,
  });
  const [showStreamingDetails, setShowStreamingDetails] = useState(false);
  const [showDocsInput, setShowDocsInput] = useState(false);
  // Enhanced streaming code states
  const [streamingCodeContent, setStreamingCodeContent] = useState<string>("");
  const [generatedFiles, setGeneratedFiles] = useState<GeneratedFile[]>([]);
  const [currentGeneratingFile, setCurrentGeneratingFile] = useState<string>();
  const [showCodeStream, setShowCodeStream] = useState(false);
  const [accumulatedCodeContent, setAccumulatedCodeContent] =
    useState<string>("");

  // Project states
  const [currentProjectInfo, setCurrentProjectInfo] = useState<ProjectInfo>({
    id: null,
    name: null,
    isVerified: false,
  });

  // Credits state - centralized place to store user's credits
  // NOTE: Real API wiring is done in useChatPageLogic via fetchCredits().
  const [credits, setCredits] = useState<number | null>(null);

  return {
    // Basic states
    messages,
    setMessages,
    prompt,
    setPrompt,
    isLoading,
    setIsLoading,
    previewUrl,
    setPreviewUrl,
    error,
    setError,
    projectStatus,
    setProjectStatus,
    isStreamingResponse,
    setIsStreamingResponse,
    isServerHealthy,
    setIsServerHealthy,
    isRetrying,
    setIsRetrying,
    currentProject,
    setCurrentProject,
    // Credits
    credits,
    setCredits,
    showDocsInput,
    setShowDocsInput,
    // NEW: Add project scope to return
    projectScope,
    setProjectScope,

    // Workflow states
    isWorkflowActive,
    setIsWorkflowActive,
    currentWorkflowStep,
    setCurrentWorkflowStep,
    workflowProgress,
    setWorkflowProgress,
    workflowSteps,
    setWorkflowSteps,
    isNavigating,
    setIsNavigating,

    // Streaming states
    isStreamingGeneration,
    setIsStreamingGeneration,
    streamingProgress,
    setStreamingProgress,
    streamingPhase,
    setStreamingPhase,
    streamingMessage,
    setStreamingMessage,
    streamingStats,
    setStreamingStats,
    showStreamingDetails,
    setShowStreamingDetails,

    // Enhanced streaming code states
    streamingCodeContent,
    setStreamingCodeContent,
    generatedFiles,
    setGeneratedFiles,
    currentGeneratingFile,
    setCurrentGeneratingFile,
    showCodeStream,
    setShowCodeStream,
    accumulatedCodeContent,
    setAccumulatedCodeContent,

    // Project states
    currentProjectInfo,
    setCurrentProjectInfo,
    isModifying,
    setIsModifying,
    canModify,
    setCanModify,
    modificationHistory,
    setModificationHistory,
    showModificationPanel,
    setShowModificationPanel,
    streamingData,
    setStreamingData,
    isStreamingModification,
    setIsStreamingModification,
    selectedImages,
    setSelectedImages,
    fileInputRef,
    selectedAssets,
    setSelectedAssets,
    assetInputRef,
    uploadMode,
    setUploadMode,
    clipboardImage,
    setClipboardImage,
    showUploadMenu,
    setShowUploadMenu,
    hasUserStopped,
    setHasUserStopped,
    clipboardSelectedOption,
    setClipboardSelectedOption,
  };
};

// REPLACE the beginning of useChatPageLogic function (up to baseUrl) with this:

export const useChatPageLogic = (
  state: ReturnType<typeof useChatPageState>
) => {
  const { getToken } = useAuth();
  const {
    setMessages,
    setWorkflowSteps,
    setCurrentWorkflowStep,
    setStreamingProgress,
    setStreamingPhase,
    setStreamingMessage,
    setAccumulatedCodeContent,
    setGeneratedFiles,
    setCurrentGeneratingFile,
    setStreamingCodeContent,
    setShowCodeStream,
    setStreamingStats,
    setPreviewUrl,
    setProjectStatus,
    setIsStreamingGeneration,
    setIsWorkflowActive,
    setWorkflowProgress,
    setCurrentProjectInfo,
    setCurrentProject,
    currentProject,
    setError,
    setIsServerHealthy,
    setIsLoading,
    setPrompt,
    setIsRetrying,
    setIsNavigating,
    streamingStats,
    workflowSteps,
    currentWorkflowStep,
    prompt,
    isLoading,
    isStreamingGeneration,
    isWorkflowActive,
    projectStatus,
    isServerHealthy,
    showCodeStream,
    previewUrl,
    streamingProgress,
    isModifying,
    setIsModifying,
    canModify,
    setCanModify,
    modificationHistory,
    setModificationHistory,
    showModificationPanel,
    setShowModificationPanel,
    streamingData,
    setStreamingData,
    isStreamingModification,
    setIsStreamingModification,
    projectScope,
    setProjectScope, // ADD this line
    selectedImages,
    setSelectedImages,
    fileInputRef,
    selectedAssets,
    setSelectedAssets,
    assetInputRef,
    uploadMode,
    setUploadMode,
    setClipboardImage,
    clipboardImage,
    showUploadMenu,
    setShowUploadMenu,
    hasUserStopped,
    setHasUserStopped,
    clipboardSelectedOption,
    setClipboardSelectedOption,
    // credits
    setCredits,
  } = state;

  // Refs
  const hasInitialized = useRef(false);
  const isGenerating = useRef(false);
  const currentProjectId = useRef<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const projectLoaded = useRef(false);
  const healthCheckDone = useRef(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  // PERFORMANCE: Add throttling refs
  const lastChunkProcessTime = useRef(0);
  const chunkProcessingQueue = useRef<string[]>([]);
  const isProcessingQueue = useRef(false);

  const location = useLocation();
  const {
    prompt: navPrompt,
    projectId,
    existingProject,
    supabaseConfig,
    clerkId,
    userId: passedUserId,
    fromWorkflow,
    scope,
  } = (location.state as LocationState) || {};

  const baseUrl = import.meta.env.VITE_BASE_URL;

  // Centralized credits fetcher
  // NOTE: Replace the endpoint/shape with your real API.
  // Current dummy endpoint: GET `${BASE_URL}/api/credit` with Bearer auth
  const fetchCredits = useCallback(async () => {
    try {
      const token = await getToken();
      const resp = await fetch(`${baseUrl}/api/credits/getUserCredits`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ clerkId }),
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      const total =
        typeof data === "object" && data !== null
          ? (data.total as number | undefined)
          : undefined;
      const creditsValue = typeof total === "number" ? total : 0;
      setCredits(creditsValue);
    } catch (e) {
    }
  }, [baseUrl, getToken, setCredits, clerkId]);
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);
  // ADD this new function to get workflow steps based on scope

  const getWorkflowSteps = useCallback((scope: "frontend" | "fullstack") => {
    if (scope === "frontend") {
      return [
        {
          name: "Design Generation",
          icon: "🎨",
          description: "Creating design system",
        },
        {
          name: "Frontend Generation",
          icon: "⚛️",
          description: "Creating user interface",
        },
      ];
    } else if (scope === "fullstack") {
      return [
        {
          name: "Design Generation",
          icon: "🎨",
          description: "Creating design system",
        },
        {
          name: "Structure Planning",
          icon: "📋",
          description: "Planning file structure",
        },
        {
          name: "Backend Generation",
          icon: "🔧",
          description: "Building server & database",
        },
        {
          name: "Frontend Generation",
          icon: "⚛️",
          description: "Creating user interface",
        },
      ];
    }
  }, []);

  // ADD this useEffect to set scope on initialization
  useEffect(() => {
    if (scope && scope !== projectScope) {
      setProjectScope(scope);
    }
  }, [scope, projectScope, setProjectScope]);

  // Get current user ID
  const getCurrentUserId = useCallback(() => {
    if (passedUserId) {
      return passedUserId;
    }

    const storedDbUser = localStorage.getItem("dbUser");
    if (storedDbUser) {
      try {
        const parsedUser = JSON.parse(storedDbUser);
        return parsedUser.id;
      } catch (e) {
      }
    }

    const storedUserId = localStorage.getItem("userId");
    if (storedUserId && !isNaN(parseInt(storedUserId))) {
      return parseInt(storedUserId);
    }
  }, [passedUserId]);
  // In hooks/useChatPage.ts
  // FIND your existing sendModificationRequest function and REPLACE it with this:

  const sendModificationRequest = useCallback(
    async (
      modificationPrompt: string,
      images: File[] = [],
      assets: File[] = []
    ) => {
      if (!projectId || !modificationPrompt.trim()) return;
  
      // Credits: refresh/authorize before modification
      fetchCredits();
  
      setIsModifying(true);
      setIsStreamingModification(true);
      setStreamingData(null);
      setError("");
  
  
      try {
        
        // Create FormData to handle both text and files
        const formData = new FormData();
        formData.append("prompt", modificationPrompt);
        formData.append("userId", getCurrentUserId().toString());
        formData.append("deployedUrl", previewUrl);
        formData.append("projectId", projectId.toString());
        if (clerkId) {
          formData.append("clerkId", clerkId);
        }
  
        // Determine which endpoint to use and add appropriate files
        let apiEndpoint = `${baseUrl}/api/modify/stream`;
        if (uploadMode === "assets" && assets && assets.length > 0) {
          // Use asset endpoint for assets only
          apiEndpoint = `${baseUrl}/api/modify/assets/stream`;
          assets.forEach((asset) => {
            formData.append("assets", asset);
          });
        } else if ((uploadMode === "images" || uploadMode === "docs") && images && images.length > 0) {
          // Use regular image endpoint for both images and docs
          images.forEach((image) => {
            formData.append("images", image);
          });
        }
  
        const token = await getToken();
        const response = await fetch(apiEndpoint, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });
  
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
  
        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error("No response body");
        }
  
        const decoder = new TextDecoder();
        let buffer = "";
  
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
  
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";
  
          for (const line of lines) {
            if (
              line.startsWith("event: ") &&
              lines[lines.indexOf(line) + 1]?.startsWith("data: ")
            ) {
              const eventType = line.slice(7).trim();
              const dataLine = lines[lines.indexOf(line) + 1];
  
              try {
                const eventData = JSON.parse(dataLine.slice(6));
  
                // Update streaming data for display
                setStreamingData({
                  type: eventType,
                  ...eventData,
                  timestamp: new Date().toISOString(),
                });
  
                // Handle different event types
                if (eventType === "personality_response") {
                  setIsStreamingModification(false);
                  setIsModifying(false);
                  
                  // Add personality response message to chat
                  const personalityMessage: Message = {
                    id: `personality-${Date.now()}`,
                    content: eventData.message,
                    type: "assistant",
                    timestamp: new Date(),
                  };
                  setMessages((prev) => [...prev, personalityMessage]);
                  
                } else if (eventType === "clarification") {
                  setIsStreamingModification(false);
                  setIsModifying(false);
                  
                  // Add clarification message to chat
                  const clarificationMessage: Message = {
                    id: `clarification-${Date.now()}`,
                    content: eventData.question,
                    type: "assistant",
                    timestamp: new Date(),
                  };
                  setMessages((prev) => [...prev, clarificationMessage]);
                  
                } else if (eventType === "conversation_response") {
                  setIsStreamingModification(false);
                  setIsModifying(false);
                  
                  // Add conversation response message to chat
                  const conversationMessage: Message = {
                    id: `conversation-${Date.now()}`,
                    content: eventData.message,
                    type: "assistant",
                    timestamp: new Date(),
                  };
                  setMessages((prev) => [...prev, conversationMessage]);
                  
                } else if (eventType === "multiple_changes") {
                  setIsStreamingModification(false);
                  setIsModifying(false);
                  
                  // Add multiple changes guidance message to chat
                  const guidanceMessage: Message = {
                    id: `guidance-${Date.now()}`,
                    content: eventData.message,
                    type: "assistant",
                    timestamp: new Date(),
                  };
                  setMessages((prev) => [...prev, guidanceMessage]);
                  
                } else if (eventType === "complete") {
                  setIsStreamingModification(false);
                  setIsModifying(false);
  
                  // Update preview URL if new one is provided - THIS IS KEY FOR NEW DEPLOYMENT URL
                  if (
                    eventData.data?.newDeploymentUrl ||
                    eventData.data?.previewUrl
                  ) {
                    const newUrl =
                      eventData.data.newDeploymentUrl ||
                      eventData.data.previewUrl;
                    setPreviewUrl(newUrl);
                  }
  
                  // Use the LLM-generated completion message if available, otherwise fallback to detailed message
                  let completionContent;
                  if (eventData.data?.completionMessage) {
                    completionContent = eventData.data.completionMessage;
                  } else {
                    // Fallback to the detailed format from the first version
                    completionContent = `✅ **Modification Complete!**\n\n🌐 **New Deployment**: [${
                      eventData.data?.newDeploymentUrl ||
                      eventData.data?.previewUrl
                    }](${
                      eventData.data?.newDeploymentUrl ||
                      eventData.data?.previewUrl
                    })\n\n📊 **Files Modified**: ${
                      eventData.data?.totalModifiedFiles || 0
                    }\n📁 **Files Added**: ${
                      eventData.data?.totalAddedFiles || 0
                    }`;
                  }
  
                  const successMessage: Message = {
                    id: `mod-success-${Date.now()}`,
                    content: completionContent,
                    type: "assistant",
                    timestamp: new Date(),
                  };
                  setMessages((prev) => [...prev, successMessage]);
  
                  // Refresh credits after successful modification
                  fetchCredits();
                  
                } else if (eventType === "error") {
                  setIsStreamingModification(false);
                  setIsModifying(false);
                  
                  // Check if it's a timeout error and handle accordingly
                  if (eventData.timeout) {
                    setError("⏰ Maximum timeout reached (10 minutes). Please try again with a smaller modification or break it into parts.");
                    
                    // Add timeout error message to chat
                    const timeoutMessage: Message = {
                      id: `timeout-error-${Date.now()}`,
                      content: "⏰ **Timeout Error**\n\nDue to High Demand Our Servers are busy right now please try after few minutes.",
                      type: "assistant",
                      timestamp: new Date(),
                    };
                    setMessages((prev) => [...prev, timeoutMessage]);
                  } else {
                    setError(eventData.error || "Modification failed");
                    
                    // Add regular error message to chat for non-timeout errors
                    const errorMessage: Message = {
                      id: `error-${Date.now()}`,
                      content: `❌ **Error**: ${eventData.error || "Modification failed"}`,
                      type: "assistant", 
                      timestamp: new Date(),
                    };
                    setMessages((prev) => [...prev, errorMessage]);
                  }
                  
                  // Refresh credits after failed modification
                  fetchCredits();
                }
              } catch (e) {
              }
            }
          }
        }
      } catch (error: unknown) {
        
        // Properly type check the error
        if (error instanceof Error) {
          // Check if it's a network timeout or connection issue
          if (error.message.includes('timeout')) {
            setError("⏰ Connection timeout. Please check your internet connection and try again.");
            
            const networkTimeoutMessage: Message = {
              id: `network-timeout-${Date.now()}`,
              content: "⏰ **Connection Timeout**\n\nLost connection to the server. Please check your internet connection and try again.",
              type: "assistant",
              timestamp: new Date(),
            };
            setMessages((prev) => [...prev, networkTimeoutMessage]);
          } else {
            setError("Failed to apply modification");
            
            const generalErrorMessage: Message = {
              id: `general-error-${Date.now()}`,
              content: `❌ **Connection Error**: Failed to apply modification. ${error.message}. Please try again.`,
              type: "assistant",
              timestamp: new Date(),
            };
            setMessages((prev) => [...prev, generalErrorMessage]);
          }
        } else if (typeof error === 'string') {
          // Handle string errors
          setError(error);
          
          const stringErrorMessage: Message = {
            id: `string-error-${Date.now()}`,
            content: `❌ **Error**: ${error}`,
            type: "assistant",
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, stringErrorMessage]);
        } else {
          // Handle unknown error types
          setError("Failed to apply modification");
          
          const unknownErrorMessage: Message = {
            id: `unknown-error-${Date.now()}`,
            content: `❌ **Unknown Error**: An unexpected error occurred. Please try again.`,
            type: "assistant",
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, unknownErrorMessage]);
        }
        
        setIsStreamingModification(false);
        setIsModifying(false);
        fetchCredits();
      }
    },
    [
      projectId,
      baseUrl,
      getCurrentUserId,
      previewUrl,
      clerkId,
      uploadMode,
      setIsModifying,
      setIsStreamingModification,
      setStreamingData,
      setError,
      setPreviewUrl,
      setMessages,
      fetchCredits,
      isStreamingModification,
      isModifying,
    ]
  );
  // ENHANCED: Add function to control code stream visibility
  const toggleCodeStreamVisibility = useCallback(
    (forceShow?: boolean) => {
      if (forceShow !== undefined) {
        setShowCodeStream(forceShow);
      } else {
        setShowCodeStream((prev) => !prev);
      }
    },
    [setShowCodeStream]
  );

  // ENHANCED: Add function to determine if code stream should be main content
  const shouldShowCodeStreamAsMain = useCallback(() => {
    return (
      showCodeStream &&
      (isStreamingGeneration || !previewUrl || streamingProgress < 100)
    );
  }, [showCodeStream, isStreamingGeneration, previewUrl, streamingProgress]);

  // Add workflow step
  const addWorkflowStep = useCallback(
    (stepData: WorkflowStepData) => {
      setWorkflowSteps((prev) => [...prev, stepData]);
      setCurrentWorkflowStep(stepData.step);

      const stepMessage: Message = {
        id: `workflow-${Date.now()}`,
        content: `**${stepData.step}**: ${stepData.message}`,
        type: "assistant",
        timestamp: new Date(),
        workflowStep: stepData.step,
        stepData: stepData.data,
      };

      setMessages((prev) => [...prev, stepMessage]);
    },
    [setWorkflowSteps, setCurrentWorkflowStep, setMessages]
  );

  // Update workflow step
  const updateWorkflowStep = useCallback(
    (step: string, updates: Partial<WorkflowStepData>) => {
      setWorkflowSteps((prev) =>
        prev.map((s) => (s.step === step ? { ...s, ...updates } : s))
      );

      setMessages((prev) =>
        prev.map((msg) =>
          msg.workflowStep === step
            ? {
                ...msg,
                content: `**${step}**: ${
                  updates.message || msg.content.split(": ")[1]
                }`,
              }
            : msg
        )
      );
    },
    [setWorkflowSteps, setMessages]
  );

  // ENHANCED: Reset streaming state with better control
  const resetStreamingState = useCallback(() => {
    setStreamingCodeContent("");
    setAccumulatedCodeContent("");
    setGeneratedFiles([]);
    setCurrentGeneratingFile(undefined);

    // Don't immediately hide code stream - let it fade naturally
    setTimeout(() => {
      setShowCodeStream(false);
    }, 1000);

    // Clear processing queue
    chunkProcessingQueue.current = [];
    isProcessingQueue.current = false;
  }, [
    setStreamingCodeContent,
    setAccumulatedCodeContent,
    setGeneratedFiles,
    setCurrentGeneratingFile,
    setShowCodeStream,
  ]);

  // Helper function to upload files to database
  const uploadFilesToDatabaseHelper = useCallback(async (files: File[]) => {
    if (!files || files.length === 0 || !projectId) return;
    
    try {
      const token = await getToken();
      if (token) {
        await uploadFilesToDatabase(files, projectId, token);
      }
    } catch (error) {
      // Don't show error to user as this is a background operation
    }
  }, [projectId, getToken]);

  // NEW: Add these image handling functions
  const handleImageSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files || []);
      const validImages = files.filter((file) => {
        const validTypes = [
          "image/jpeg",
          "image/png",
          "image/gif",
          "image/webp",
        ];
        const maxSize = 5 * 1024 * 1024; // 5MB

        if (!validTypes.includes(file.type)) {
          setError(
            `Invalid file type: ${file.name}. Use JPG, PNG, GIF, or WebP.`
          );
          return false;
        }

        if (file.size > maxSize) {
          setError(`File too large: ${file.name}. Maximum size is 5MB.`);
          return false;
        }

        return true;
      });

      // Clear any existing assets and clipboard image when selecting new images
      setSelectedAssets([]);
      setClipboardImage(null);

      // Only allow one image at a time
      const selectedFiles = validImages.slice(0, 1);
      setSelectedImages(selectedFiles);

      // Upload files to database
      if (selectedFiles.length > 0) {
        uploadFilesToDatabaseHelper(selectedFiles);
      }

      // Clear the input
      if (event.target) {
        event.target.value = "";
      }
    },
    [setSelectedImages, setSelectedAssets, setClipboardImage, setError, uploadFilesToDatabaseHelper]
  );

  const removeImage = useCallback(
    (index: number) => {
      setSelectedImages((prev) => prev.filter((_, i) => i !== index));

      // Clear clipboard image when removing an image to allow new pastes
      setClipboardImage(null);
      // Note: We don't clear selectedAssets here as user might want to switch to assets
    },
    [setSelectedImages, setClipboardImage]
  );

  const clearSelectedImages = useCallback(() => {
    setSelectedImages([]);

    // Clear clipboard image when clearing all images
    setClipboardImage(null);
    // Note: We don't clear selectedAssets here as user might want to keep them
  }, [setSelectedImages, setClipboardImage]);

  // NEW: Asset handling functions
  const handleAssetSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files || []);
      const validAssets = files.filter((file) => {
        const validTypes = [
          // Images (Claude-supported)
          "image/jpeg",
          "image/png",
          "image/gif",
          "image/webp",
          // Images (basic integration) - EXPANDED ICO SUPPORT
          "image/svg+xml",
          "image/ico", // Standard ICO
          "image/x-icon", // Alternative ICO
          "image/vnd.microsoft.icon", // Microsoft ICO
          "image/bmp",
          "image/tiff",
          // Other assets
          "application/pdf",
          "text/plain",
          "application/json",
          "audio/mpeg",
          "audio/wav",
          "audio/ogg",
          "video/mp4",
          "video/webm",
          "font/woff",
          "font/woff2",
          "font/ttf",
          "font/otf",
          "text/css",
          "application/javascript",
          "application/zip",
        ];
        const maxSize = 10 * 1024 * 1024; // 10MB

        // Check file type
        if (!validTypes.includes(file.type)) {
          setError(
            `Invalid asset type: ${file.name} (${file.type}). Check supported formats.`
          );
          return false;
        }

        if (file.size > maxSize) {
          setError(`Asset too large: ${file.name}. Maximum size is 10MB.`);
          return false;
        }

        return true;
      });

      // Clear any existing images and clipboard image when selecting new assets
      setSelectedImages([]);
      setClipboardImage(null);

      // Only allow one asset at a time
      const selectedFiles = validAssets.slice(0, 1);
      setSelectedAssets(selectedFiles);

      // Upload files to database
      if (selectedFiles.length > 0) {
        uploadFilesToDatabaseHelper(selectedFiles);
      }

      if (event.target) {
        event.target.value = "";
      }
    },

    [setSelectedAssets, setSelectedImages, setClipboardImage, setError, uploadFilesToDatabaseHelper]
  );

  const removeAsset = useCallback(
    (index: number) => {
      setSelectedAssets((prev) => prev.filter((_, i) => i !== index));

      // Clear clipboard image when removing an asset to allow new pastes
      setClipboardImage(null);
      // Note: We don't clear selectedImages here as user might want to switch to images
    },
    [setSelectedAssets, setClipboardImage]
  );

  const clearSelectedAssets = useCallback(() => {
    setSelectedAssets([]);

    // Clear clipboard image when clearing all assets
    setClipboardImage(null);
    // Note: We don't clear selectedImages here as user might want to keep them
  }, [setSelectedAssets, setClipboardImage]);

  const toggleUploadMenu = useCallback(() => {
    setShowUploadMenu((prev) => !prev);
    // Always clear clipboard image when toggling menu
    setClipboardImage(null);
  }, [setShowUploadMenu, setClipboardImage]);

  const selectUploadMode = useCallback(
    (mode: "images" | "assets" | "docs", skipClear: boolean = false) => {
      setUploadMode(mode);
      setShowUploadMenu(false);
      // Only clear current selections when switching modes (unless skipClear is true)
      if (!skipClear) {
        // Clear both categories to ensure only one type is selected at a time
        setSelectedImages([]);
        setSelectedAssets([]);
        // Clear clipboard image when switching modes
        setClipboardImage(null);
      }
    },
    [
      setUploadMode,
      setShowUploadMenu,
      setSelectedImages,
      setSelectedAssets,
      setClipboardImage,
    ]
  );
  // ENHANCED: Improved chunk processing for better file display
  const processChunkQueue = useCallback(async () => {
    if (
      isProcessingQueue.current ||
      chunkProcessingQueue.current.length === 0
    ) {
      return;
    }

    isProcessingQueue.current = true;

    try {
      while (chunkProcessingQueue.current.length > 0) {
        const chunk = chunkProcessingQueue.current.shift();
        if (!chunk) continue;

        // Parse streaming chunk to extract files
        const parsed = StreamingCodeParser.parseStreamingChunk(chunk);

        // Update generated files with proper formatting
        if (parsed.files.length > 0) {
          setGeneratedFiles(
            parsed.files.map((f) => ({
              filename: f.filename,
              content: f.content,
              isComplete: f.isComplete,
              size: f.size || f.content.length,
              type: "file",
            }))
          );
        }

        // Update current generating file
        if (parsed.currentFile) {
          setCurrentGeneratingFile(parsed.currentFile);
        }

        // Small delay to prevent UI blocking
        await new Promise((resolve) => setTimeout(resolve, 10));
      }
    } catch (error) {
    } finally {
      isProcessingQueue.current = false;
    }
  }, [setGeneratedFiles, setCurrentGeneratingFile]);

  // ENHANCED: Streaming data handler with prominent code display
  const handleStreamingData = useCallback(
    (data: StreamingProgressData, projId: number) => {
      switch (data.type) {
        case "progress":
          setStreamingProgress(data.percentage || 0);
          setStreamingPhase(data.phase || "");
          setStreamingMessage(data.message || "");

          updateWorkflowStep("Frontend Generation", {
            message: `${data.message} (${(data.percentage || 0).toFixed(0)}%)`,
            isComplete: false,
          });

          // Update workflow state progress

          const currentProgress = 50 + (data.percentage || 0) * 0.5; // Frontend is second half
          WorkflowStateManager.setCurrentStage(
            projId,
            "Frontend Generation",
            "running",
            projectScope,
            currentProgress
          );

          if (
            data.phase === "processing" ||
            data.phase === "parsing" ||
            data.phase === "generating"
          ) {
            setShowCodeStream(true);
          } else if (data.phase === "complete") {
            setTimeout(() => {
              if (data.result?.previewUrl) {
                setShowCodeStream(false);
              }
            }, 5000);
          }
          break;

        case "length":
          setStreamingStats((prev) => ({
            ...prev,
            totalCharacters: data.currentLength || 0,
            bytesPerSecond: prev.startTime
              ? (data.currentLength || 0) /
                ((Date.now() - prev.startTime) / 1000)
              : 0,
          }));
          setStreamingProgress(data.percentage || 0);
          break;

        case "chunk":
          if (data.chunk) {
            setShowCodeStream(true);

            const now = Date.now();
            if (now - lastChunkProcessTime.current > 100) {
              lastChunkProcessTime.current = now;

              setAccumulatedCodeContent((prev) => {
                const newContent = prev + data.chunk;
                setStreamingCodeContent(newContent);
                chunkProcessingQueue.current.push(newContent);
                setTimeout(processChunkQueue, 0);
                return newContent;
              });

              setStreamingStats((prev) => ({
                ...prev,
                chunksReceived: prev.chunksReceived + 1,
                totalCharacters: data.currentLength || prev.totalCharacters,
                estimatedTotalChunks: Math.ceil((data.totalLength || 0) / 1000),
              }));
            }
          }
          break;

        case "complete":
          setStreamingProgress(100);
          setStreamingPhase("complete");
          setStreamingMessage(
            data.message || "Application creation completed!"
          );

          setTimeout(() => {
            setShowCodeStream(false);
            setStreamingCodeContent("");
            setAccumulatedCodeContent("");
          }, 6000);

          setStreamingStats((prev) => ({
            ...prev,
            endTime: Date.now(),
          }));
          // Refresh credits and project after generation completes
          fetchCredits();
          if (projId) {
            // Re-fetch project details to get the authoritative deploymentUrl
            loadProject(projId);
          }
          break;

        case "result":
          if (data.result) {
            // Do not trust/propagate previewUrl from stream; refetch project
            setProjectStatus("ready");
            setIsStreamingGeneration(false);
            setIsWorkflowActive(false);
            setWorkflowProgress(100);

            // **CRITICAL**: Mark Frontend Generation as completed and clear workflow state
            WorkflowStateManager.markStageCompleted(
              projId,
              "Frontend Generation",
              100
            );

            if (data.result.files) {
              const finalFiles = data.result.files.map((file: any) => ({
                filename: file.path || file.filename,
                content: file.content || "",
                isComplete: true,
                size: file.content ? file.content.length : 0,
                type: "file",
              }));
              setGeneratedFiles(finalFiles);
            }

            setCanModify(true);

            updateWorkflowStep("Frontend Generation", {
              message: `✅ Application deployed successfully! ${
                data.result.files?.length || 0
              } files generated`,
              isComplete: true,
              data: data.result,
            });

            const completionMessage: Message = {
              id: `completion-${Date.now()}`,
              content: `🎉 **Application Created Successfully!**`,
              type: "assistant",
              timestamp: new Date(),
            };
            setMessages((prev) => [...prev, completionMessage]);

            if (data.result.projectId) {
              setCurrentProjectInfo({
                id: data.result.projectId,
                name: `Generated Application`,
                isVerified: true,
              });
              setCurrentProject({
                id: data.result.projectId,
                name: `Complete Application`,
                deploymentUrl: data.result.previewUrl,
                status: "ready",
              });
            }

            setTimeout(() => {
              setShowCodeStream(false);
            }, 3000);

            // Refresh credits and reload project for authoritative deploymentUrl
            fetchCredits();
            if (data.result.projectId) {
              loadProject(data.result.projectId);
            }
          }
          break;

        case "error":
          setError(data.error || "Arf! 🐾 We’ve lost connection to our den for a moment.\nDon’t worry — our pup is still working hard in the background to fetch your app!\nPlease head back to the home page and give it about 5 minutes. Then return, and your project should be ready to play fetch with. 🐕✨");
          setIsStreamingGeneration(false);
          setIsWorkflowActive(false);
          setProjectStatus("error");
          setShowCodeStream(false);

          // **PERSIST**: Mark as failed
          WorkflowStateManager.setCurrentStage(
            projId,
            currentWorkflowStep || "Frontend Generation",
            "failed",
            projectScope
          );

          updateWorkflowStep("Frontend Generation", {
            message: `❌ Failed: ${data.error || "Unknown error"}`,
            isComplete: true,
            error: data.error || "Unknown error",
          });
          // Refresh credits after failed generation
          fetchCredits();
          break;
      }
    },
    [
      updateWorkflowStep,
      setStreamingProgress,
      setStreamingPhase,
      setStreamingMessage,
      setAccumulatedCodeContent,
      setGeneratedFiles,
      setCurrentGeneratingFile,
      setStreamingCodeContent,
      setShowCodeStream,
      setStreamingStats,
      setPreviewUrl,
      setProjectStatus,
      setIsStreamingGeneration,
      setIsWorkflowActive,
      setWorkflowProgress,
      setCurrentProjectInfo,
      setCurrentProject,
      setError,
      setMessages,
      processChunkQueue,
      setCanModify,
      currentWorkflowStep,
      projectScope,
      fetchCredits,
    ]
  );

  // Check server health
  const checkServerHealth = useCallback(async () => {
    if (healthCheckDone.current) {
      return isServerHealthy;
    }

    try {
      const token = await getToken();
      const healthResponse = await axios.get(`${baseUrl}/health`, {
        timeout: 10000,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setIsServerHealthy(true);
      setError("");
      healthCheckDone.current = true;
      return true;
    } catch (error) {
      setIsServerHealthy(false);
      healthCheckDone.current = true;

      if (axios.isAxiosError(error)) {
        if (error.code === "ECONNREFUSED" || error.code === "ERR_NETWORK") {
          setError(
            "Backend server is not responding. Please ensure it's running on the correct port."
          );
        } else {
          setError(`Server error: ${error.response?.status || "Unknown"}`);
        }
      } else {
        setError("Cannot connect to server");
      }
      return false;
    }
  }, [baseUrl, isServerHealthy, setIsServerHealthy, setError]);

  // Load project
  const loadProject = useCallback(
    async (projId: number) => {
      if (currentProjectId.current === projId && projectStatus !== "idle") {
        return;
      }

      setError("");
      setProjectStatus("fetching");
      currentProjectId.current = projId;

      try {
        const token = await getToken();

        // Primary call: Use /api/projects/{projectId} as main endpoint
        const res = await axios.get(`${baseUrl}/api/projects/${projId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const responseData = res.data;

        let project: Project;
        let deploymentUrl: string;

        // Handle different response formats
        if (typeof responseData === "string") {
          // Backend returns just the URL string
          deploymentUrl = responseData.trim();

          // Create a project object
          project = {
            id: projId,
            name: `Project ${projId}`,
            deploymentUrl: deploymentUrl,
            status: "ready",
          };
        } else if (responseData && typeof responseData === "object") {
          // Backend returns an object (most common case)
          project = responseData;
          deploymentUrl = project.deploymentUrl || "";
        } else {
          throw new Error("Invalid response format from backend");
        }

        // Optional fallback: Try container endpoint if main endpoint doesn't have deploymentUrl
        let preferredDeploymentUrl = deploymentUrl?.trim() || "";

        if (!preferredDeploymentUrl) {
          try {
            const containerResp = await axios.get(
              `${baseUrl}/api/projects/container/${projId}`,
              {
                headers: { Authorization: `Bearer ${token}` },
              }
            );

            const containerData = containerResp?.data;
            if (typeof containerData === "string" && containerData.trim()) {
              preferredDeploymentUrl = containerData.trim();

              // Update project object with container URL
              project = {
                ...project,
                deploymentUrl: preferredDeploymentUrl,
              } as Project;
            }
          } catch (e) {}
        }

        setCurrentProject(project);
        setCurrentProjectInfo({
          id: projId,
          name: project.name || `Project ${projId}`,
          isVerified: true,
        });

        if (preferredDeploymentUrl && preferredDeploymentUrl.length > 0) {
          // Always drive the UI from the authoritative deploymentUrl
          setPreviewUrl(preferredDeploymentUrl);
          setProjectStatus("ready");
          setCanModify(true);
        } else {
          setProjectStatus("idle");
        }

        // Return the loaded project so callers can act synchronously on status
        return project;
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 404) {
          setError(`Project with ID ${projId} not found.`);
        } else {
          setError("Failed to load project");
        }
        setProjectStatus("error");
        return null;
      }
    },
    [
      baseUrl,
      projectStatus,
      setError,
      setProjectStatus,
      setCurrentProject,
      setCurrentProjectInfo,
      setPreviewUrl,
      setCanModify,
    ]
  );

  // Load project messages
  const loadProjectMessages = useCallback(
    async (projectId: number, conversationId?: string) => {
      if (projectLoaded.current) {
        return;
      }

      // Skip fetching messages while project is still pending
      if ((currentProject as any)?.status === "pending") {
        return;
      }

      try {
        const token = await getToken();

        if (projectId) {
          const conversationResponse = await axios.get(
            `${baseUrl}/api/messages/getconversation`,
            {
              params: { projectId },
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (
            conversationResponse.data.success &&
            conversationResponse.data.data
          ) {
            const { conversationArray, images, metadata } =
              conversationResponse.data.data;

            // Format conversation messages
            const formattedMessages: Message[] = conversationArray.map(
              (msg: any) => ({
                id: msg.id || Date.now().toString(),
                content: msg.content,
                type: msg.role === "user" ? "user" : "assistant",
                timestamp: new Date(msg.timestamp),
                imageRecordId: msg.imageRecordId, // Include image reference if needed
                hasImages: !!msg.imageRecordId,
              })
            );

            setMessages(formattedMessages);
          }
        }

        projectLoaded.current = true;
      } catch (error) {
        setMessages([]);
        projectLoaded.current = true;
      }
    },
    [baseUrl, setMessages, currentProject]
  );

  const startStreamingFrontendGeneration = useCallback(
    async (projId: number) => {
      // Credits: refresh/authorize before starting generation
      fetchCredits();

      setIsStreamingGeneration(true);
      setStreamingProgress(0);
      setStreamingPhase("initializing");
      setStreamingMessage("Starting application generation...");

      // Clear previous state and show code stream immediately
      setStreamingCodeContent("");
      setAccumulatedCodeContent("");
      setGeneratedFiles([]);
      setCurrentGeneratingFile(undefined);
      setShowCodeStream(true); // Show immediately

      setStreamingStats({
        totalCharacters: 0,
        chunksReceived: 0,
        estimatedTotalChunks: 0,
        startTime: Date.now(),
      });

      try {
        if (projectScope === "fullstack" && !supabaseConfig) {
          throw new Error("Supabase configuration is missing");
        }

        // 🔥 CHOOSE ROUTE BASED ON SCOPE
        const apiRoute =
          projectScope === "frontend"
            ? "/api/design/generateFrontendOnly" // Frontend-only route
            : "/api/design/generate-frontend"; // Fullstack route (main + admin)

        // Only require supabaseConfig for fullstack projects
        if (projectScope === "fullstack" && !supabaseConfig) {
          throw new Error(
            "Supabase configuration is missing for fullstack project"
          );
        }

        // Prepare request body based on project scope
        const requestBody = {
          projectId: projId,
          userId: getCurrentUserId(),
          clerkId: clerkId,
        };

        // Only include supabaseConfig for fullstack projects
        if (projectScope === "fullstack" && supabaseConfig) {
          Object.assign(requestBody, {
            supabaseUrl: supabaseConfig.supabaseUrl,
            supabaseAnonKey: supabaseConfig.supabaseAnonKey,
            supabaseToken: supabaseConfig.supabaseToken,
            databaseUrl: supabaseConfig.databaseUrl,
          });
        }

        const token = await getToken();
        const response = await fetch(`${baseUrl}${apiRoute}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(requestBody),
          // body: JSON.stringify({
          //   projectId: projId,
          //   supabaseUrl: supabaseConfig.supabaseUrl,
          //   supabaseAnonKey: supabaseConfig.supabaseAnonKey,
          //   supabaseToken: supabaseConfig.supabaseToken,
          //   databaseUrl: supabaseConfig.databaseUrl,
          //   userId: getCurrentUserId(),
          //   clerkId: clerkId,
          // }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(
            `HTTP error! status: ${response.status}, message: ${errorText}`
          );
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error("No response body");
        }

        const decoder = new TextDecoder();
        let buffer = "";
        let chunkCount = 0;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const data: StreamingProgressData = JSON.parse(line.slice(6));

                // Process streaming data with proper throttling
                chunkCount++;
                if (
                  chunkCount % 2 === 0 ||
                  data.type === "chunk" ||
                  data.type === "result"
                ) {
                  handleStreamingData(data, projId);
                }
              } catch (e) {
              }
            }
          }

          // Performance throttling
          if (chunkCount % 10 === 0) {
            await new Promise((resolve) => setTimeout(resolve, 10));
          }
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Application generation failed";
        setError(errorMessage);
        setIsStreamingGeneration(false);
        setIsWorkflowActive(false);
        setProjectStatus("error");
        setShowCodeStream(false);

        updateWorkflowStep("Frontend Generation", {
          message: `❌ Failed: ${errorMessage}`,
          isComplete: true,
          error: errorMessage,
        });
      }
    },
    [
      baseUrl,
      supabaseConfig,
      getCurrentUserId,
      clerkId,
      updateWorkflowStep,
      handleStreamingData,
      setIsStreamingGeneration,
      setStreamingProgress,
      setStreamingPhase,
      setStreamingMessage,
      setStreamingStats,
      setError,
      setIsWorkflowActive,
      setProjectStatus,
      setStreamingCodeContent,
      setAccumulatedCodeContent,
      setGeneratedFiles,
      setCurrentGeneratingFile,
      setShowCodeStream,
      projectScope,
      fetchCredits,
    ] // 🔥 ADD projectScope to dependencies
  );

  // REPLACE the entire startCompleteWorkflow function with this:

  const startCompleteWorkflow = useCallback(
    async (userPrompt: string, projId: number) => {
      // Credits: refresh/authorize on workflow start
      fetchCredits();

      // **CRITICAL FIX**: Check existing workflow state before starting
      const existingState = WorkflowStateManager.load(projId);

      if (existingState) {
        // If workflow is already completed, don't restart
        if (existingState.status === "completed") {
          setProjectStatus("ready");
          setIsWorkflowActive(false);
          setWorkflowProgress(100);

          // Try to load the final project state
          await loadProject(projId);
          return;
        }

        // If workflow is running or failed, we'll resume/restart from current stage
        if (
          existingState.status === "running" ||
          existingState.status === "failed"
        ) {
          setCurrentWorkflowStep(existingState.currentStage);

          // Restore completed steps
          const restoredSteps = existingState.completedStages.map((stage) => ({
            step: stage,
            message: `✅ ${stage} completed (restored)`,
            isComplete: true,
          }));
          setWorkflowSteps(restoredSteps);

          // Restore progress
          setWorkflowProgress(existingState.progress);
        }
      }

      if (isWorkflowActive || isGenerating.current) {
        return;
      }

      // Only require supabaseConfig for fullstack projects
      if (
        projectScope === "fullstack" &&
        (!supabaseConfig ||
          !supabaseConfig.supabaseUrl ||
          !supabaseConfig.supabaseAnonKey)
      ) {
        setError(
          "Supabase configuration is missing. Please ensure backend is properly configured."
        );
        return;
      }

      resetStreamingState();

      setIsWorkflowActive(true);
      setIsLoading(true);
      setError("");
      setProjectStatus("loading");

      // Only reset progress if no existing state
      if (!existingState) {
        setWorkflowProgress(0);
        setWorkflowSteps([]);
      }

      isGenerating.current = true;

      try {
        // Get workflow steps based on scope
        const workflowStepsForScope = getWorkflowSteps(projectScope);

        // Initialize workflow state if not exists
        if (!existingState) {
          WorkflowStateManager.setCurrentStage(
            projId,
            "Design Generation",
            "running",
            projectScope,
            0
          );
        }

        // Get completed stages (from existing state or empty)
        const completedStages = existingState?.completedStages || [];

        // **GUARD**: Define which stages should run
        const shouldRunDesignGeneration =
          !completedStages.includes("Design Generation");
        const shouldRunStructurePlanning =
          !completedStages.includes("Structure Planning");
        const shouldRunBackendGeneration =
          !completedStages.includes("Backend Generation");
        const shouldRunFrontendGeneration = !completedStages.includes(
          "Frontend Generation"
        );

        if (projectScope === "frontend") {
          // FRONTEND ONLY WORKFLOW - 2 steps

          // Step 1: Design Generation (50% progress)
          if (shouldRunDesignGeneration) {
            WorkflowStateManager.setCurrentStage(
              projId,
              "Design Generation",
              "running",
              projectScope,
              25
            );

            addWorkflowStep({
              step: "Design Generation",
              message: "Creating design files and structure...",
              isComplete: false,
            });
            setWorkflowProgress(25);

            const token = await getToken();
            const generateResponse = await axios.post(
              `${baseUrl}/api/design/generate`,
              {
                projectId: projId,
                prompt: userPrompt,
                scope: projectScope,
              },
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );

            if (!generateResponse.data.success) {
              throw new Error(
                generateResponse.data.error || "Failed to generate design files"
              );
            }

            updateWorkflowStep("Design Generation", {
              message: `✅ Generated ${
                generateResponse.data.files
                  ? Object.keys(generateResponse.data.files).length
                  : 0
              } design files successfully!`,
              isComplete: true,
              data: generateResponse.data,
            });

            // **PERSIST**: Mark stage as completed
            WorkflowStateManager.markStageCompleted(
              projId,
              "Design Generation",
              50
            );
            setWorkflowProgress(50);

            await new Promise((resolve) => setTimeout(resolve, 1000));
          } else {
            setWorkflowProgress(50);
          }

          // Step 2: Frontend Generation (streaming) - 100% progress
          if (shouldRunFrontendGeneration) {
            WorkflowStateManager.setCurrentStage(
              projId,
              "Frontend Generation",
              "running",
              projectScope,
              75
            );

            addWorkflowStep({
              step: "Frontend Generation",
              message: "Starting frontend generation with live deployment...",
              isComplete: false,
            });

            await startStreamingFrontendGeneration(projId);

            // Note: Completion will be marked in handleStreamingData when "result" is received
          } else {
            setProjectStatus("ready");
            setIsWorkflowActive(false);
            setWorkflowProgress(100);
          }
        } else {
          // FULLSTACK WORKFLOW - 4 steps

          // Step 1: Design Generation (25% progress)
          if (shouldRunDesignGeneration) {
            WorkflowStateManager.setCurrentStage(
              projId,
              "Design Generation",
              "running",
              projectScope,
              20
            );

            addWorkflowStep({
              step: "Design Generation",
              message: "Creating design files and structure...",
              isComplete: false,
            });
            setWorkflowProgress(20);

            const token = await getToken();
            const generateResponse = await axios.post(
              `${baseUrl}/api/design/generate`,
              {
                projectId: projId,
                prompt: userPrompt,
                scope: projectScope,
              },
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );

            if (!generateResponse.data.success) {
              throw new Error(
                generateResponse.data.error || "Failed to generate design files"
              );
            }

            updateWorkflowStep("Design Generation", {
              message: `✅ Generated ${
                generateResponse.data.files
                  ? Object.keys(generateResponse.data.files).length
                  : 0
              } design files successfully!`,
              isComplete: true,
              data: generateResponse.data,
            });

            WorkflowStateManager.markStageCompleted(
              projId,
              "Design Generation",
              40
            );
            setWorkflowProgress(40);

            await new Promise((resolve) => setTimeout(resolve, 1000));
          } else {
            setWorkflowProgress(40);
          }

          // Step 2: Structure Planning (50% progress)
          if (shouldRunStructurePlanning) {
            WorkflowStateManager.setCurrentStage(
              projId,
              "Structure Planning",
              "running",
              projectScope,
              50
            );

            addWorkflowStep({
              step: "Structure Planning",
              message: "Planning file structure and documentation...",
              isComplete: false,
            });

            const token = await getToken();
            const planResponse = await axios.post(
              `${baseUrl}/api/design/plan-structure`,
              {
                projectId: projId,
                scope: projectScope,
              },
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );

            if (!planResponse.data.success) {
              throw new Error(
                planResponse.data.error || "Failed to plan structure"
              );
            }

            updateWorkflowStep("Structure Planning", {
              message: `✅ Planned structure with ${
                planResponse.data.totalFileCount || 0
              } files!`,
              isComplete: true,
              data: planResponse.data,
            });

            WorkflowStateManager.markStageCompleted(
              projId,
              "Structure Planning",
              60
            );
            setWorkflowProgress(60);

            await new Promise((resolve) => setTimeout(resolve, 1000));
          } else {
            setWorkflowProgress(60);
          }

          // Step 3: Backend Generation (75% progress)
          if (shouldRunBackendGeneration) {
            WorkflowStateManager.setCurrentStage(
              projId,
              "Backend Generation",
              "running",
              projectScope,
              70
            );

            addWorkflowStep({
              step: "Backend Generation",
              message:
                "Generating backend files, database schema, and API endpoints...",
              isComplete: false,
            });

            const token = await getToken();
            const backendResponse = await axios.post(
              `${baseUrl}/api/design/generate-backend`,
              {
                projectId: projId,
                scope: projectScope,
              },
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );

            if (!backendResponse.data.success) {
              throw new Error(
                backendResponse.data.error || "Failed to generate backend"
              );
            }

            updateWorkflowStep("Backend Generation", {
              message: `✅ Generated backend with database schema and ${
                backendResponse.data.files
                  ? Object.keys(backendResponse.data.files).length
                  : 0
              } files!`,
              isComplete: true,
              data: backendResponse.data,
            });

            WorkflowStateManager.markStageCompleted(
              projId,
              "Backend Generation",
              80
            );
            setWorkflowProgress(80);

            await new Promise((resolve) => setTimeout(resolve, 1000));
          } else {
            setWorkflowProgress(80);
          }

          // Step 4: Frontend Generation (streaming) - 100% progress
          if (shouldRunFrontendGeneration) {
            WorkflowStateManager.setCurrentStage(
              projId,
              "Frontend Generation",
              "running",
              projectScope,
              90
            );

            addWorkflowStep({
              step: "Frontend Generation",
              message: "Starting frontend generation with live deployment...",
              isComplete: false,
            });

            await startStreamingFrontendGeneration(projId);

            // Note: Completion will be marked in handleStreamingData when "result" is received
          } else {
            setProjectStatus("ready");
            setIsWorkflowActive(false);
            setWorkflowProgress(100);
          }
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Workflow failed";
        setError(errorMessage);
        setIsWorkflowActive(false);
        setProjectStatus("error");

        // **PERSIST**: Mark as failed
        if (projId) {
          WorkflowStateManager.setCurrentStage(
            projId,
            currentWorkflowStep || "unknown",
            "failed",
            projectScope
          );
        }

        if (currentWorkflowStep) {
          updateWorkflowStep(currentWorkflowStep, {
            message: `❌ Failed: ${errorMessage}`,
            isComplete: true,
            error: errorMessage,
          });
        }
      } finally {
        isGenerating.current = false;
        setIsLoading(false);
      }
    },
    [
      projectScope,
      isWorkflowActive,
      addWorkflowStep,
      updateWorkflowStep,
      currentWorkflowStep,
      baseUrl,
      supabaseConfig,
      resetStreamingState,
      setIsWorkflowActive,
      setIsLoading,
      setError,
      setProjectStatus,
      setWorkflowProgress,
      setWorkflowSteps,
      startStreamingFrontendGeneration,
      getWorkflowSteps,
      loadProject,
      fetchCredits,
    ]
  );

  // Utility functions
  const clearConversation = useCallback(async () => {
    // RESET the stop flag when clearing conversation
    setHasUserStopped(false);
    if (projectId) {
      try {
        const token = await getToken();
        await axios.delete(`${baseUrl}/api/messages/project/${projectId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setMessages([]);
        setWorkflowSteps([]);
        setIsWorkflowActive(false);
        setWorkflowProgress(0);
        resetStreamingState();
      } catch (error) {
        setError("Failed to clear conversation");
      }
    } else {
      setMessages([]);
      setWorkflowSteps([]);
      setIsWorkflowActive(false);
      setWorkflowProgress(0);
      resetStreamingState();
    }
  }, [
    baseUrl,
    projectId,
    resetStreamingState,
    setMessages,
    setWorkflowSteps,
    setIsWorkflowActive,
    setWorkflowProgress,
    setError,
    setHasUserStopped,
  ]);

  // Add this ref near other refs
  const isStoppingRef = useRef(false);

  const stopWorkflow = useCallback(async () => {
    if (isStoppingRef.current) {
      return;
    }
    isStoppingRef.current = true;

    try {
      // Set stop flag immediately
      setHasUserStopped(true);
      // Stop all local state immediately
      setIsWorkflowActive(false);
      setIsStreamingGeneration(false);
      setIsStreamingModification(false);
      isGenerating.current = false;
      setIsLoading(false);
      // Update UI immediately
      setStreamingProgress(0);
      setStreamingPhase("stopped");
      setStreamingMessage("Process stopped by user");
      setShowCodeStream(false);

      if (currentWorkflowStep) {
        updateWorkflowStep(currentWorkflowStep, {
          message: "⏹️ Process stopped by user",
          isComplete: true,
        });
      }
      // Stop backend generation (only call once)
      if (projectId) {
        try {
          const token = await getToken();
          const stopResponse = await fetch(
            `${baseUrl}/api/generate/stop/${projectId}`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ projectId }),
            }
          );

          if (!stopResponse.ok) {
            throw new Error(`HTTP ${stopResponse.status}`);
          }
          const data = await stopResponse.json();
          if (data.success) {
          } else {
          }
        } catch (err) {
        }
      }

      // Add a user-visible message about stopping
      const stopMessage: Message = {
        id: `stop-${Date.now()}`,
        content:
          "⏹️ **Process Stopped**\n\nGeneration has been stopped by user. You can start a new conversation by sending another message.",
        type: "assistant",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, stopMessage]);

      // Reset streaming state
      resetStreamingState();

      //RESET PROJECT STATUS TO ALLOW NEW GENERATION
      setProjectStatus("idle");
    } finally {
      // Reset after a delay
      setTimeout(() => {
        isStoppingRef.current = false;
      }, 2000);
    }
  }, [
    projectId,
    baseUrl,
    currentWorkflowStep,
    updateWorkflowStep,
    setHasUserStopped,
    setIsWorkflowActive,
    setIsStreamingGeneration,
    setIsStreamingModification,
    setIsLoading,
    setStreamingPhase,
    setStreamingMessage,
    setShowCodeStream,
    setMessages,
    resetStreamingState,
    setProjectStatus,
  ]);

  const handlePromptChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setPrompt(e.target.value);
    },
    [setPrompt]
  );

  // 1. Handle page refresh/close (KEEP generation stopping only on actual page unload)
  useEffect(() => {
    const handlePageUnload = () => {
      // Only stop generation when page is actually being unloaded (refresh/close)
      if ((isWorkflowActive || isStreamingGeneration) && projectId) {
        const stopUrl = `${baseUrl}/api/generate/stop/${projectId}`;
        const stopData = JSON.stringify({ projectId });

        // Use sendBeacon for reliability during page unload
        navigator.sendBeacon(
          stopUrl,
          new Blob([stopData], {
            type: "application/json",
          })
        );
      }
    };

    // More precise detection for actual refresh vs tab switch
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      // This only triggers on actual page navigation/refresh/close
      handlePageUnload();
    };

    const handlePageHide = (event: PageTransitionEvent) => {
      // Only stop if the page is NOT being persisted in cache
      // This means it's actually being closed/navigated away from
      if (
        !event.persisted &&
        (isWorkflowActive || isStreamingGeneration) &&
        projectId
      ) {
        handlePageUnload();
      }
    };

    // Listen for keyboard refresh shortcuts
    const handleKeyDown = (event: KeyboardEvent) => {
      const isRefreshShortcut =
        event.key === "F5" || // F5
        (event.ctrlKey && event.key === "r") || // Ctrl+R
        (event.ctrlKey && event.key === "F5") || // Ctrl+F5
        (event.metaKey && event.key === "r"); // Cmd+R (Mac)

      if (
        isRefreshShortcut &&
        (isWorkflowActive || isStreamingGeneration) &&
        projectId
      ) {
        handlePageUnload();
      }
    };

    // Add event listeners
    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("pagehide", handlePageHide);
    document.addEventListener("keydown", handleKeyDown);

    // Cleanup
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("pagehide", handlePageHide);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isWorkflowActive, isStreamingGeneration, projectId, baseUrl]);

  // 2. Handle visibility changes (DON'T stop generation on tab switch)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // DO NOT stop generation - just log for debugging
      } else {
        // Optionally refresh UI state or check progress when user returns
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []); // No dependencies needed since we're not stopping generation

  // 3. Optional: Handle focus/blur for additional awareness (without stopping)
  useEffect(() => {
    const handleWindowFocus = () => {
      // Optionally ping server to check if generation is still running
      // or refresh the UI state when user returns
    };

    const handleWindowBlur = () => {
      // Just log, don't stop anything
    };

    window.addEventListener("focus", handleWindowFocus);
    window.addEventListener("blur", handleWindowBlur);

    return () => {
      window.removeEventListener("focus", handleWindowFocus);
      window.removeEventListener("blur", handleWindowBlur);
    };
  }, []);

  // 4. Component unmount cleanup (only stop if component is being destroyed)
  useEffect(() => {
    return () => {
      // Only stop generation if the entire component is being unmounted
      // This happens when navigating to a completely different page

      // For example, only stop if navigating away from the app entirely
      const shouldStopOnUnmount = false; // Set this based on your needs

      if (
        shouldStopOnUnmount &&
        (isWorkflowActive || isStreamingGeneration) &&
        projectId
      ) {
        (async () => {
          try {
            const token = await getToken();
            fetch(`${baseUrl}/api/generate/stop/${projectId}`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ projectId }),
            });
          } catch (err) {
          }
        })();
      }

      // Clear processing queues
      chunkProcessingQueue.current = [];
      isProcessingQueue.current = false;
    };
  }, []); // Empty dependency array - only runs on actual unmount

  // ADD this new useEffect after your existing ones in useChatPageLogic:

  // Cleanup workflow state on page unload (only for actual navigation away)
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Only clear workflow state if navigating away from the app entirely
      // Don't clear on refresh - we want to restore state
    };

    const handlePageHide = (event: PageTransitionEvent) => {
      // Only clear if page is not being cached (true navigation away)
      if (!event.persisted && projectId) {
        // Don't clear here either - let the state expire naturally after 24h
      }
    };

    // Listen for actual navigation away (not refresh)
    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("pagehide", handlePageHide);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("pagehide", handlePageHide);

      // Clear processing queues on unmount
      chunkProcessingQueue.current = [];
      isProcessingQueue.current = false;
    };
  }, [projectId]);

  // Optional: Clear workflow state when opening existing projects from Index
  useEffect(() => {
    // If this is an existing project (not fromWorkflow), clear any stale workflow state
    if (existingProject && projectId && !fromWorkflow) {
      const existingState = WorkflowStateManager.load(projectId);

      if (existingState && existingState.status !== "completed") {
        WorkflowStateManager.clear(projectId);
      }
    }
  }, [existingProject, projectId, fromWorkflow]);

  // Place these useEffect hooks right before your return statement in useChatPageLogic
  const handleSubmit = useCallback(async () => {
    if (
      !prompt.trim() ||
      isLoading ||
      isStreamingGeneration ||
      isWorkflowActive
    )
      return;

    // RESET stop flag when user submits new prompt
    setHasUserStopped(false);

    // Reset any error states
    setError("");

    if (canModify && !isWorkflowActive && !isStreamingGeneration) {
      // Create user message that includes file info based on upload mode
      let fileInfo = "";
      if (uploadMode === "images" && selectedImages.length > 0) {
        fileInfo = `\n\n📎 ${selectedImages.length} image${
          selectedImages.length > 1 ? "s" : ""
        } attached`;
      } else if (uploadMode === "assets" && selectedAssets.length > 0) {
        fileInfo = `\n\n📁 ${selectedAssets.length} asset${
          selectedAssets.length > 1 ? "s" : ""
        } attached`;
      }

      const userMessage: Message = {
        id: Date.now().toString(),
        content: prompt + fileInfo,
        type: "user",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);

      const currentPrompt = prompt;
      // For docs mode, we want to use the image endpoint, so treat docs files as images
      const currentImages =
        uploadMode === "images" || uploadMode === "docs"
          ? [...selectedImages]
          : [];
      const currentAssets = uploadMode === "assets" ? [...selectedAssets] : [];

      // Clear prompt and files immediately
      setPrompt("");
      setSelectedImages([]);
      setSelectedAssets([]);

      await sendModificationRequest(
        currentPrompt,
        currentImages,
        currentAssets
      );
      return;
    }

    setIsLoading(true);
    setError("");

    const newMessage: Message = {
      id: Date.now().toString(),
      content: prompt,
      type: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, newMessage]);
    const currentPrompt = prompt;
    setPrompt("");
    // Clear images for workflow path too (though they won't be used)
    // Clear files for workflow path too (though they won't be used)
    setSelectedImages([]);
    setSelectedAssets([]);

    try {
      if (projectId) {
        await startCompleteWorkflow(currentPrompt, projectId);
      } else {
        throw new Error("No project ID available for workflow");
      }
    } catch (error) {
      setError("Failed to process request");

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "Sorry, I encountered an error while processing your request.",
        type: "assistant",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [
    prompt,
    isLoading,
    isModifying,
    canModify,
    isWorkflowActive,
    isStreamingGeneration,
    projectId,
    selectedImages,
    selectedAssets, // NEW: Add selectedAssets
    uploadMode, // NEW: Add uploadMode
    startCompleteWorkflow,
    sendModificationRequest,
    setIsLoading,
    setHasUserStopped,
    setError,
    setMessages,
    setPrompt,
    setSelectedImages,
    setSelectedAssets, // NEW: Add setSelectedAssets
  ]);

  // Handle clipboard paste - detect images only and show upload options
  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      const items = Array.from(e.clipboardData.items);

      // Only accept image clipboard items
      const clipboardItem = items.find((item) =>
        item.type.startsWith("image/")
      );

      if (clipboardItem) {
        e.preventDefault(); // Prevent default text paste

        // Convert clipboard item to file
        const file = clipboardItem.getAsFile();
        if (file) {
          // Clear any existing selections and clipboard image when pasting new item
          setSelectedImages([]);
          setSelectedAssets([]);
          setClipboardImage(null);

          // Store the new clipboard file temporarily
          const clipboardFile = new File(
            [file],
            `clipboard-${Date.now()}.png`,
            { type: clipboardItem.type }
          );

          // Store the clipboard file in state
          setClipboardImage(clipboardFile);

          // Show category selection for clipboard file
          setShowUploadMenu(true);
        } else {
        }
      } else {
        // Not an image: allow default paste and don't open upload menu
      }
    },
    [setClipboardImage, setShowUploadMenu, setSelectedImages, setSelectedAssets]
  );

  // Handle keyboard navigation for clipboard options
  const handleClipboardKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!showUploadMenu || !clipboardImage) return;

      switch (e.key) {
        case "ArrowUp":
        case "ArrowDown":
          e.preventDefault();
          setClipboardSelectedOption((prev) =>
            prev === "images" ? "assets" : "images"
          );
          break;
        case "Enter":
          e.preventDefault();
          if (clipboardSelectedOption === "images") {
            // Add clipboard image to images
            setSelectedImages([clipboardImage]);
            selectUploadMode("images", true);
            // Upload clipboard image to database
            uploadFilesToDatabaseHelper([clipboardImage]);
          } else {
            // Add clipboard image to assets
            setSelectedAssets([clipboardImage]);
            selectUploadMode("assets", true);
            // Upload clipboard image to database
            uploadFilesToDatabaseHelper([clipboardImage]);
          }
          setClipboardImage(null);
          setShowUploadMenu(false);
          setClipboardSelectedOption("images");
          break;
        case "Escape":
          e.preventDefault();
          setClipboardImage(null);
          setShowUploadMenu(false);
          setClipboardSelectedOption("images");
          break;
      }
    },
    [
      showUploadMenu,
      clipboardImage,
      clipboardSelectedOption,
      setSelectedImages,
      setSelectedAssets,
      selectUploadMode,
      setClipboardImage,
      setShowUploadMenu,
      setClipboardSelectedOption,
      uploadFilesToDatabaseHelper,
    ]
  );

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  const retryConnection = useCallback(async () => {
    setIsRetrying(true);
    setError("");
    setProjectStatus("loading");

    healthCheckDone.current = false;
    projectLoaded.current = false;
    hasInitialized.current = false;

    try {
      const isHealthy = await checkServerHealth();
      if (isHealthy) {
        if (existingProject && projectId) {
          const proj = await loadProject(projectId);
          if (proj && proj.status !== "pending") {
            await loadProjectMessages(projectId);
          }
        } else if (fromWorkflow && navPrompt && projectId) {
          setPrompt(navPrompt);
          await startCompleteWorkflow(navPrompt, projectId);
        } else {
          setProjectStatus("idle");
        }
        hasInitialized.current = true;
      }
    } catch (error) {
      setError(
        "Still cannot connect to server. Please check your backend setup."
      );
      setProjectStatus("error");
    } finally {
      setIsRetrying(false);
    }
  }, [
    checkServerHealth,
    existingProject,
    projectId,
    fromWorkflow,
    navPrompt,
    loadProject,
    loadProjectMessages,
    startCompleteWorkflow,
    setIsRetrying,
    setError,
    setProjectStatus,
    setPrompt,
  ]);

  const formatDuration = useCallback((ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    return minutes > 0 ? `${minutes}m ${seconds % 60}s` : `${seconds}s`;
  }, []);

  const formatSpeed = useCallback((bytesPerSecond: number) => {
    if (bytesPerSecond < 1024) return `${bytesPerSecond.toFixed(0)} B/s`;
    if (bytesPerSecond < 1024 * 1024)
      return `${(bytesPerSecond / 1024).toFixed(1)} KB/s`;
    return `${(bytesPerSecond / (1024 * 1024)).toFixed(2)} MB/s`;
  }, []);

  // Initialize on mount with proper error handling
  // Fix for useChatPageLogic - Replace the initialization useEffect with this enhanced version

  // Initialize on mount with proper error handling and auto-start
  useEffect(() => {
    if (hasInitialized.current) {
      return;
    }

    hasInitialized.current = true;

    const initialize = async () => {
      // Credits: fetch once on first entry to ChatPage
      fetchCredits();
      if (fromWorkflow || navPrompt) {
        setIsNavigating(true);
      }

      const serverHealthy = await checkServerHealth();
      if (!serverHealthy) {
        setProjectStatus("error");
        setIsNavigating(false);
        return;
      }

      try {
        if (fromWorkflow && projectId) {
          // **CRITICAL FIX**: Load the project first AND check workflow state
          const loaded = await loadProject(projectId);

          // Check if there's already a workflow state
          const existingWorkflowState = WorkflowStateManager.load(projectId);

          if (existingWorkflowState) {
            if (existingWorkflowState.status === "completed") {
              setProjectStatus("ready");
              setIsNavigating(false);
              setWorkflowProgress(100);
              setIsWorkflowActive(false);
              return;
            }

            if (existingWorkflowState.status === "running") {
              // Don't return here - let startCompleteWorkflow handle the resume logic
            }
          }

          // Add user message if we have navPrompt
          if (navPrompt) {
            const userMessage: Message = {
              id: `user-${Date.now()}`,
              content: navPrompt,
              type: "user",
              timestamp: new Date(),
            };
            setMessages([userMessage]);

            // Small delay to let the UI update, then start workflow
            setTimeout(async () => {
              await startCompleteWorkflow(navPrompt, projectId);
            }, 500);
          } else {
            // If no prompt, create a generic one for workflow completion
            const genericPrompt =
              "Complete the application generation based on the design choices from the design process.";
            const userMessage: Message = {
              id: `user-${Date.now()}`,
              content:
                "Completing application generation from design process...",
              type: "user",
              timestamp: new Date(),
            };
            setMessages([userMessage]);

            setTimeout(async () => {
              await startCompleteWorkflow(genericPrompt, projectId);
            }, 500);
          }
        } else if (existingProject && projectId) {
          // **FIX**: Only clear stale workflow state for non-completed projects
          const existingState = WorkflowStateManager.load(projectId);
          if (existingState && existingState.status !== "completed") {
            WorkflowStateManager.clear(projectId);
          }

          const proj = await loadProject(projectId);
          if (proj && proj.status !== "pending") {
            await loadProjectMessages(projectId);
          }
        } else if (projectId) {
          const proj = await loadProject(projectId);
          if (proj && proj.status !== "pending") {
            await loadProjectMessages(projectId);
          }
        } else {
          setProjectStatus("idle");
        }
      } catch (error) {
        setError("Failed to initialize project");
        setProjectStatus("error");
      } finally {
        setIsNavigating(false);
      }
    };

    // Small delay to prevent blocking UI
    setTimeout(initialize, 100);
  }, []); // Empty dependency array - only run once on mount

  // ALSO ADD: Additional useEffect to monitor fromWorkflow state changes
  useEffect(() => {
    // This effect handles cases where fromWorkflow state might change after initial mount
    if (!hasInitialized.current) return;

    // PREVENT AUTO-RESTART if user manually stopped
    if (hasUserStopped) {
      return;
    }

    if (
      fromWorkflow &&
      projectId &&
      !isWorkflowActive &&
      !isStreamingGeneration
    ) {
      // Check if we haven't started a workflow yet
      if (workflowSteps.length === 0 && !isLoading) {
        const genericPrompt =
          "Complete the application generation based on the design choices.";
        const userMessage: Message = {
          id: `user-delayed-${Date.now()}`,
          content: "Completing application generation from design process...",
          type: "user",
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMessage]);

        setTimeout(async () => {
          await startCompleteWorkflow(genericPrompt, projectId);
        }, 1000);
      }
    }
  }, [
    fromWorkflow,
    projectId,
    isWorkflowActive,
    isStreamingGeneration,
    workflowSteps.length,
    isLoading,
    hasUserStopped,
  ]);
  // Close upload menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showUploadMenu) {
        const target = event.target as Element;
        const uploadButton = target.closest("[data-upload-menu]");
        if (!uploadButton) {
          setShowUploadMenu(false);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showUploadMenu, setShowUploadMenu]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      // Clear any pending timeouts/intervals
      chunkProcessingQueue.current = [];
      isProcessingQueue.current = false;
    };
  }, []);

  return {
    // Refs
    messagesEndRef,

    // Location data
    projectId,
    existingProject,
    supabaseConfig,
    clerkId,
    passedUserId,
    fromWorkflow,
    navPrompt,
    baseUrl,

    // NEW: Add scope data
    scope,
    projectScope,
    getWorkflowSteps,

    // Enhanced functions
    scrollToBottom,
    getCurrentUserId,
    addWorkflowStep,
    updateWorkflowStep,
    resetStreamingState,
    handleStreamingData,
    checkServerHealth,
    loadProject,
    loadProjectMessages,
    startStreamingFrontendGeneration,
    startCompleteWorkflow,
    clearConversation,
    stopWorkflow,
    handlePromptChange,
    handleSubmit,
    handleKeyPress,
    handlePaste,
    retryConnection,
    formatDuration,
    formatSpeed,

    // New enhanced functions
    toggleCodeStreamVisibility,
    shouldShowCodeStreamAsMain,
    sendModificationRequest,
    handleImageSelect,
    removeImage,
    clearSelectedImages,
    handleAssetSelect,
    removeAsset,
    clearSelectedAssets,

    // Expose clipboard helpers
    // Note: clipboardImage is part of state return from useChatPageState
    // Provide a manual clear in logic hook as utility
    // @ts-ignore - available in closure
    clearClipboardImage: () => setClipboardImage(null),
    toggleUploadMenu,
    selectUploadMode,
    handleClipboardKeyDown,
  };
};

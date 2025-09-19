import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from "react";
import "../App.css";
import axios from "axios";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  useUser,
  UserButton,
  useAuth,
} from "@clerk/clerk-react";
import Credit from "../components/Credit";
import RewardModal from "../components/RewardModal";
import ProjectTypeSelector from "../components/options";
import ExpandableDesignPreview from "./design-preview";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate, Link } from "react-router-dom";
import {
  Calendar,
  Code2,
  Trash2,
  MessageSquare,
  Clock,
  Activity,
  AlertCircle,
  Database,
  Send,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Settings,
  Eye,
  Loader2,
  Palette,
  Upload,
  Image as ImageIcon,
  X,
  Trophy,
  GalleryThumbnails,
  GalleryHorizontal,
  GalleryHorizontalIcon,
  Images,
} from "lucide-react";
import SupabaseConfigForm from "./form"; // Import the form component
import ImageUploadSection from "@/components/Image-upload-component";
import { uploadFilesToDatabase } from "../utils/fileUpload";

import { amplitude } from "../utils/amplitude";

interface Project {
  id: number;
  name: string;
  description?: string;
  deploymentUrl?: string;
  productionUrl?: string;
  projects_thumbnail?: string;
  createdAt: string;
  updatedAt?: string;
  projectType?: string;
  status?: string;
  lastSessionId?: string;
  messageCount?: number;
  scope?: "frontend" | "fullstack";
}

interface DbUser {
  id: number;
  clerkId: string;
  email: string;
  name: string;
  phoneNumber: string | null;
  profileImage?: string;
}

interface SessionInfo {
  sessionId: string;
  messageCount: number;
  lastActivity: string;
  hasActiveConversation: boolean;
}

interface SupabaseConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  supabaseToken: string;
  databaseUrl: string;
}

interface Toast {
  id: string;
  message: string;
  type: "success" | "error";
  duration?: number;
}

interface DesignChoices {
  businessType?: string;
  businessName?: string;
  projectName?: string;
  vibe?: string;
  colorScheme?: {
    primary?: string;
    secondary?: string;
    accent?: string;
    background?: string;
    text?: string;
  };
  // API response fields
  recommendedColors?: string[];
  allColorOptions?: string[];
  colorExplanation?: string;
  style?: string;
  features?: string[];
  layout?: string;
  recommendedLayout?: string;
  recommendedLayoutExplanation?: string;
  layoutStyles?: string[];
  differentLayouts?: string[];
  differentSections?: string[];
  components?: string[];
}

interface WorkflowMessage {
  id: string;
  content: string;
  type: "user" | "assistant";
  timestamp: Date;
  step?: string;
  isLoading?: boolean;
  designChoices?: DesignChoices;
}

// --- Constants ---
const BASE_URL = import.meta.env.VITE_BASE_URL;

// Helper function to extract colors from design choices
const extractColorsFromDesignChoices = (designChoices: DesignChoices) => {
  // Try to get colors from different possible sources
  const colors = {
    primary: designChoices.colorScheme?.primary,
    secondary: designChoices.colorScheme?.secondary,
    accent: designChoices.colorScheme?.accent,
    background: designChoices.colorScheme?.background,
    text: designChoices.colorScheme?.text,
  };

  // If colorScheme is empty, try to use recommendedColors
  if (
    designChoices.recommendedColors &&
    designChoices.recommendedColors.length > 0
  ) {
    colors.primary = colors.primary || designChoices.recommendedColors[0];
    colors.secondary = colors.secondary || designChoices.recommendedColors[1];
    colors.accent = colors.accent || designChoices.recommendedColors[2];
  }

  // If still no colors, try allColorOptions
  if (
    !colors.primary &&
    designChoices.allColorOptions &&
    designChoices.allColorOptions.length > 0
  ) {
    colors.primary = designChoices.allColorOptions[0];
    colors.secondary = designChoices.allColorOptions[1];
    colors.accent = designChoices.allColorOptions[2];
  }

  return colors;
};

// --- Memoized Components ---
const ColorPalette = React.memo(
  ({ colors }: { colors: DesignChoices["colorScheme"] }) => {
    if (!colors) return null;

    return (
      <div className="flex items-center gap-2 p-3 bg-slate-100 rounded-lg border border-slate-300">
        <Palette className="size-icon-small text-slate-600" />
        <span className="text-xs text-slate-600 font-medium">Colors:</span>
        <div className="flex gap-1">
          {colors.primary && (
            <div
              className="w-6 h-6 rounded-full border-2 border-white/20"
              style={{ backgroundColor: colors.primary }}
              title={`Primary: ${colors.primary}`}
            />
          )}
          {colors.secondary && (
            <div
              className="w-6 h-6 rounded-full border-2 border-white/20"
              style={{ backgroundColor: colors.secondary }}
              title={`Secondary: ${colors.secondary}`}
            />
          )}
          {colors.accent && (
            <div
              className="w-6 h-6 rounded-full border-2 border-white/20"
              style={{ backgroundColor: colors.accent }}
              title={`Accent: ${colors.accent}`}
            />
          )}
        </div>
      </div>
    );
  }
);

ColorPalette.displayName = "ColorPalette";

const DesignPreview = React.memo(
  ({ designChoices }: { designChoices: DesignChoices }) => {
    // Extract colors using the helper function
    const extractedColors = extractColorsFromDesignChoices(designChoices);

    const primaryColor = extractedColors.primary || "#3B82F6";
    const secondaryColor = extractedColors.secondary || "#10B981";
    const accentColor = extractedColors.accent || "#F59E0B";

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="p-4 bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl border border-slate-300 backdrop-blur-sm"
      >
        <div className="flex items-center gap-2 mb-3">
          <h3 className="text-sm font-medium text-slate-800">Design Preview</h3>
        </div>

        {/* Mock UI Preview */}
        <div className="relative w-full h-32 bg-white rounded-lg overflow-hidden shadow-lg">
          {/* Header */}
          <div
            className="h-8 flex items-center px-3"
            style={{ backgroundColor: primaryColor }}
          >
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-white/80 rounded-full"></div>
              <div className="w-2 h-2 bg-white/80 rounded-full"></div>
              <div className="w-2 h-2 bg-white/80 rounded-full"></div>
            </div>
          </div>

          {/* Content Area */}
          <div className="p-3 space-y-2">
            <div
              className="h-3 rounded"
              style={{ backgroundColor: secondaryColor, width: "60%" }}
            ></div>
            <div
              className="h-2 bg-gray-200 rounded"
              style={{ width: "80%" }}
            ></div>
            <div
              className="h-2 bg-gray-200 rounded"
              style={{ width: "40%" }}
            ></div>

            {/* Accent elements */}
            <div className="flex gap-2 mt-3">
              <div
                className="w-8 h-4 rounded"
                style={{ backgroundColor: accentColor }}
              ></div>
              <div
                className="w-6 h-4 rounded"
                style={{ backgroundColor: primaryColor, opacity: 0.7 }}
              ></div>
            </div>
          </div>
        </div>

        {/* Design Details */}
        <div className="mt-3 space-y-2">
          {(designChoices.businessType || designChoices.businessName) && (
            <div className="text-xs text-slate-600">
              <span className="text-slate-500">Business:</span>{" "}
              {designChoices.businessName || designChoices.businessType}
            </div>
          )}
          {(designChoices.style || designChoices.recommendedLayout) && (
            <div className="text-xs text-slate-600">
              <span className="text-slate-500">Style:</span>{" "}
              {designChoices.recommendedLayout || designChoices.style}
            </div>
          )}
          {designChoices.vibe && (
            <div className="text-xs text-slate-600">
              <span className="text-slate-500">Vibe:</span> {designChoices.vibe}
            </div>
          )}
          <ColorPalette colors={extractedColors} />
          {(designChoices.features || designChoices.differentSections) && (
            <div className="text-xs text-slate-600">
              <span className="text-slate-500">Features:</span>{" "}
              {(designChoices.differentSections || designChoices.features || [])
                .slice(0, 2)
                .join(", ")}
              {(designChoices.differentSections || designChoices.features || [])
                .length > 2 &&
                ` +${
                  (
                    designChoices.differentSections ||
                    designChoices.features ||
                    []
                  ).length - 2
                } more`}
            </div>
          )}
        </div>
      </motion.div>
    );
  }
);

DesignPreview.displayName = "DesignPreview";

const ProjectCard = React.memo(
  ({
    project,
    onProjectClick,
    onDeleteProject,
    onContinueChat,
    sessionInfo,
    hasSessionSupport,
    onPreviewDesign,
  }: {
    project: Project;
    onProjectClick: (project: Project) => void;
    onDeleteProject: (
      projectId: number,
      e: React.MouseEvent<HTMLButtonElement>
    ) => void;
    onContinueChat: (
      project: Project,
      e: React.MouseEvent<HTMLButtonElement>
    ) => void;
    sessionInfo?: SessionInfo;
    hasSessionSupport: boolean;
    onPreviewDesign?: (designChoices: DesignChoices) => void;
  }) => {
    // Function to remove date from project name
    const getCleanProjectName = (name: string) => {
      // Pattern to match date at the end: space + date format (M/D/YYYY or MM/DD/YYYY)
      try {
        const datePattern = /\s+\d{1,2}\/\d{1,2}\/\d{4}$/;
        return name.replace(datePattern, "");
      } catch (e) {
        return name;
      }
    };

    // Enhanced design choices parsing with debug logging
    const designChoices = useMemo(() => {
      try {
        if (project.description) {
          // Try to parse as JSON first
          try {
            const parsed = JSON.parse(project.description);

            // Check different possible structures
            let choices = null;

            if (parsed.structure?.designChoices) {
              choices = parsed.structure.designChoices;
            } else if (parsed.designChoices) {
              choices = parsed.designChoices;
            } else if (parsed.businessType || parsed.recommendedColors) {
              // Direct structure match
              choices = parsed;
            }

            if (choices) {
              return choices;
            }
          } catch (parseError) {}

          // If JSON parsing fails, try to extract from text
          if (
            project.description.includes("businessType") ||
            project.description.includes("recommendedColors")
          ) {
            // Could add more sophisticated text parsing here if needed
          }
        }
      } catch (error) {
      }
      return null;
    }, [project.description]);

    // Extract colors for the card display
    const cardColors = useMemo(() => {
      if (designChoices) {
        return extractColorsFromDesignChoices(designChoices);
      }
      return null;
    }, [designChoices]);

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.02, y: -5 }}
        className="group project-card"
        onClick={() => onProjectClick(project)}
      >
        {/* Thumbnail */}
        <div className="project-thumbnail group">
          {typeof project.productionUrl === "string" &&
          project.productionUrl.trim() !== "" ? (
            // Live iframe preview
            <iframe
              src={project.productionUrl}
              className="w-full h-full scale-50 origin-top-left transform pointer-events-none"
              title={`${project.name} preview`}
              style={{ width: "211%", height: "211%" }}
            />
          ) : (
            // Static image fallback (always show image when no productionUrl)
            <img
              src={
                project.projects_thumbnail ||
                "https://i.ibb.co/DHHS0QG9/Gemini-Generated-Image-xn79zcxn79zcxn79.webp"
              }
              alt={`${project.name} thumbnail`}
              className="w-full h-full object-cover rounded-lg"
              loading="lazy"
            />
          )}

          {/* Status Badge */}
          {project.status && (
            <div className="absolute-top-left">
              <span
                className={`status-badge ${
                  project.status === "ready"
                    ? "status-ready"
                    : project.status === "building"
                    ? "status-building"
                    : project.status === "error"
                    ? "status-error"
                    : "status-default"
                }`}
              >
                {project.status}
              </span>
            </div>
          )}

          {/* Activity Indicator */}
          {sessionInfo?.hasActiveConversation && (
            <div className="absolute-top-right">
              <div className="activity-indicator activity-active"></div>
            </div>
          )}

          {/* Compatibility Mode Indicator */}
          {!hasSessionSupport &&
            project.messageCount &&
            project.messageCount > 0 && (
              <div className="absolute-top-right">
                <div className="activity-indicator activity-legacy"></div>
              </div>
            )}

          {/* Color indicator */}
          {cardColors && (
            <div className="absolute-top-right flex gap-1">
              {cardColors.primary && (
                <div
                  className="color-indicator"
                  style={{ backgroundColor: cardColors.primary }}
                />
              )}
              {cardColors.secondary && (
                <div
                  className="color-indicator"
                  style={{ backgroundColor: cardColors.secondary }}
                />
              )}
              {cardColors.accent && (
                <div
                  className="color-indicator"
                  style={{ backgroundColor: cardColors.accent }}
                />
              )}
            </div>
          )}

          {/* Project Overlay on hover */}
          <div className="project-overlay group-hover:opacity-100">
            {designChoices && onPreviewDesign && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onPreviewDesign(designChoices);
                }}
                className="preview-button"
              >
                <Eye className="size-icon-small" />
                Preview
              </button>
            )}
            <span className="project-overlay-text">Open Project</span>
          </div>
        </div>

        {/* Project Info */}
        <div className="project-info group-hover:opacity-100">
          <div className="flex items-start justify-between">
            <h3 className="project-title">
              {getCleanProjectName(project.name)}
            </h3>
            <button
              onClick={(e) => onDeleteProject(project.id, e)}
              className="project-delete-button cursor-pointer"
            >
              <Trash2 className="project-delete-icon" />
            </button>
          </div>

          {/* Design info preview */}
          {designChoices && (
            <div className="design-info">
              {designChoices.businessName && (
                <div className="design-info-item">
                  <span className="design-info-label">Business:</span>{" "}
                  {designChoices.businessName}
                </div>
              )}
              {designChoices.recommendedLayout && (
                <div className="design-info-item">
                  <span className="design-info-label">Layout:</span>{" "}
                  {designChoices.recommendedLayout}
                </div>
              )}
              {cardColors && (
                <div className="design-colors-container">
                  <span className="design-colors-label">Colors:</span>
                  <div className="design-colors-list">
                    {cardColors.primary && (
                      <div
                        className="color-indicator-small"
                        style={{ backgroundColor: cardColors.primary }}
                      />
                    )}
                    {cardColors.secondary && (
                      <div
                        className="color-indicator-small"
                        style={{ backgroundColor: cardColors.secondary }}
                      />
                    )}
                    {cardColors.accent && (
                      <div
                        className="color-indicator-small"
                        style={{ backgroundColor: cardColors.accent }}
                      />
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Session Info or Message Count */}
          {hasSessionSupport && sessionInfo && sessionInfo.messageCount > 0 ? (
            <div className="session-info session-info-active">
              <MessageSquare className="session-icon session-icon-active" />
              <span className="session-text session-text-active">
                {sessionInfo.messageCount} messages
              </span>
              <button
                onClick={(e) => onContinueChat(project, e)}
                className="session-continue-button session-continue-active"
              >
                Continue Chat
              </button>
            </div>
          ) : !hasSessionSupport &&
            project.messageCount &&
            project.messageCount > 0 ? (
            <div className="session-info session-info-legacy">
              <AlertCircle className="session-icon session-icon-legacy" />
              <span className="session-text session-text-legacy">
                {project.messageCount} messages (legacy)
              </span>
              <button
                onClick={(e) => onContinueChat(project, e)}
                className="session-continue-button session-continue-legacy"
              >
                Continue
              </button>
            </div>
          ) : null}

          <div className="flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-1">
              <Calendar className="size-icon-small" />
              <span>{new Date(project.createdAt).toLocaleDateString()}</span>
            </div>

            <div className="flex items-center gap-3">
              {hasSessionSupport && sessionInfo?.lastActivity && (
                <div className="flex items-center gap-1">
                  <Activity className="size-icon-small" />
                  <span>
                    {new Date(sessionInfo.lastActivity).toLocaleDateString() ===
                    new Date().toLocaleDateString()
                      ? new Date(sessionInfo.lastActivity).toLocaleTimeString(
                          [],
                          {
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )
                      : new Date(sessionInfo.lastActivity).toLocaleDateString()}
                  </span>
                </div>
              )}

              {!hasSessionSupport &&
                project.updatedAt &&
                new Date(project.updatedAt).getTime() !==
                  new Date(project.createdAt).getTime() && (
                  <div className="flex items-center gap-1">
                    <Clock className="size-icon-small" />
                    <span>
                      {new Date(project.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                )}
            </div>
          </div>
        </div>
      </motion.div>
    );
  }
);

ProjectCard.displayName = "ProjectCard";

// Feedback Input Component
const FeedbackInput = React.memo(
  ({
    onSubmit,
    isLoading,
    placeholder,
  }: {
    onSubmit: (feedback: string) => void;
    isLoading: boolean;
    placeholder?: string;
  }) => {
    const [feedback, setFeedback] = useState("");

    const handleSubmit = useCallback(
      (e: React.FormEvent) => {
        e.preventDefault();
        if (feedback.trim() && !isLoading) {
          onSubmit(feedback.trim());
          setFeedback("");
        }
      },
      [feedback, isLoading, onSubmit]
    );

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          handleSubmit(e as any);
        }
        // If Shift+Enter, allow newline by not preventing default
      },
      [handleSubmit]
    );

    return (
      <form onSubmit={handleSubmit} className="flex gap-2">
        <textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || "Share your feedback or ask questions..."}
          className="flex-1 px-3 py-2 bg-slate-100 border border-slate-300 rounded-lg text-slate-800 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 resize-none"
          rows={1}
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={!feedback.trim() || isLoading}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors duration-200 flex items-center gap-2"
        >
          {isLoading ? (
            <Loader2 className="size-icon-small animate-spin" />
          ) : (
            <Send className="size-icon-small" />
          )}
        </button>
      </form>
    );
  }
);

FeedbackInput.displayName = "FeedbackInput";

// --- Main Component ---
const Index = () => {
  const [prompt, setPrompt] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const [hasMoreProjects, setHasMoreProjects] = useState<boolean>(true);
  const [loadingMoreProjects, setLoadingMoreProjects] =
    useState<boolean>(false);
  const [dbUser, setDbUser] = useState<DbUser | null>(null);
  const [projectSessions, setProjectSessions] = useState<
    Record<number, SessionInfo>
  >({});
  const [loadingSessions, setLoadingSessions] = useState<boolean>(false);
  const [hasSessionSupport, setHasSessionSupport] = useState(true);
  const [backendStatus, setBackendStatus] = useState<
    "checking" | "available" | "limited"
  >("checking");

  // Supabase configuration state
  const [showSupabaseConfig, setShowSupabaseConfig] = useState(false);
  const [supabaseConfig, setSupabaseConfig] = useState<SupabaseConfig | null>(
    null
  );
  const [showProjectTypeSelector, setShowProjectTypeSelector] = useState(true);
  const [selectedProjectType, setSelectedProjectType] = useState<
    "frontend" | "fullstack" | null
  >(null);
  const [isConfigValid, setIsConfigValid] = useState(false);

  // Workflow states
  const [workflowActive, setWorkflowActive] = useState<boolean>(false);
  const [workflowMessages, setWorkflowMessages] = useState<WorkflowMessage[]>(
    []
  );
  const [isProcessingPdf, setIsProcessingPdf] = useState(false);
  const [currentStep, setCurrentStep] = useState<string>("analyze");
  const [designChoices, setDesignChoices] = useState<DesignChoices | null>(
    null
  );
  const [readyToGenerate, setReadyToGenerate] = useState<boolean>(false);
  const [isProcessingFeedback, setIsProcessingFeedback] =
    useState<boolean>(false);
  const [currentProjectId, setCurrentProjectId] = useState<number | null>(null);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  // Keep original PDFs separate so we can upload PDFs (not derived images)
  const [selectedPdfs, setSelectedPdfs] = useState<File[]>([]);
  const [showDesignPreview, setShowDesignPreview] = useState(false);
  const [selectedDesignForPreview, setSelectedDesignForPreview] =
    useState<DesignChoices | null>(null);

  const [toasts, setToasts] = useState<Toast[]>([]);

  const navigate = useNavigate();
  const { user: clerkUser, isLoaded } = useUser();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { getToken } = useAuth();
  const [credits, setCredits] = useState<number | null>(null);
  const [rewardQueue, setRewardQueue] = useState<React.ReactNode[]>([]);
  const [activeReward, setActiveReward] = useState<React.ReactNode | null>(
    null
  );
  const [creditsPayload, setCreditsPayload] = useState<any | null>(null);
  const [userPayload, setUserPayload] = useState<any | null>(null);
  const [rewardsEvaluated, setRewardsEvaluated] = useState<boolean>(false);
  const [didSyncUser, setDidSyncUser] = useState<boolean>(false);
  const [creditsRetryCount, setCreditsRetryCount] = useState<number>(0);
  const MAX_CREDITS_RETRIES = 5;
  // Load Supabase config from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("supabaseConfig");
    if (stored) {
      try {
        const config = JSON.parse(stored);
        setSupabaseConfig(config);
        setIsConfigValid(true);
      } catch (error) {
      }
    }
  }, []);

  // Handle Supabase config submission
  const handleSupabaseConfigSubmit = useCallback((config: SupabaseConfig) => {
    setSupabaseConfig(config);
    setIsConfigValid(true);
    localStorage.setItem("supabaseConfig", JSON.stringify(config));
  }, []);

  // Check backend capabilities
  const checkBackendCapabilities = useCallback(async () => {
    try {
      const response = await axios.get(`${BASE_URL}/health`);
      const features = response.data.features || [];

      if (
        features.includes("Redis stateless sessions") ||
        features.includes("Session-based conversations")
      ) {
        setHasSessionSupport(true);
        setBackendStatus("available");
      } else {
        setHasSessionSupport(false);
        setBackendStatus("limited");
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
      }
      setHasSessionSupport(false);
      setBackendStatus("limited");
    }
  }, []);

  // Fetch credits for navbar on start and expose total
  const fetchCredits = useCallback(async () => {
    try {
      if (!clerkUser) return;
      const token = await getToken();
      const resp = await fetch(`${BASE_URL}/api/credits/getUserCredits`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ clerkId: clerkUser.id }),
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      const total =
        typeof data === "object" && data !== null
          ? (data.total as number | undefined)
          : undefined;
      const value = typeof total === "number" ? total : 0;
      setCredits(value);
      setCreditsPayload(data);
    } catch (e) {
      // keep silent in UI
    }
  }, [clerkUser, getToken]);

  // Handle image selection
  const handleImageSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newFiles = Array.from(e.target.files || []);
      if (newFiles.length === 0) return;

      setSelectedImages((prev) => {
        const availableSlots = 5 - prev.length;

        if (availableSlots <= 0) {
          showToast(
            "You can add only 5 images. Remove existing to add more",
            "error"
          );
          return prev;
        }

        // If user selects more than 5 at once initially
        if (prev.length === 0 && newFiles.length > 5) {
          showToast("Only 5 images were selected.", "error");
        } else if (newFiles.length > availableSlots) {
          // If exceeding remaining slots
          showToast(
            "You can add only 5 images. Remove existing to add more",
            "error"
          );
        }

        const filesToAdd = newFiles.slice(0, availableSlots);
        return [...prev, ...filesToAdd];
      });
    },
    []
  );

  // Toast helpers (format matches GitHubModel.tsx)
  const showToast = useCallback(
    (message: string, type: "success" | "error", duration?: number) => {
      const id = Math.random().toString(36).substr(2, 9);
      const autoDuration =
        duration ?? Math.min(6000, Math.max(2500, message.length * 60));
      const newToast: Toast = { id, message, type, duration: autoDuration };

      setToasts((prev) => {
        // Deduplicate same-message toasts shown concurrently
        if (prev.some((t) => t.message === message && t.type === type)) {
          return prev;
        }
        return [...prev, newToast];
      });

      setTimeout(() => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
      }, autoDuration);
    },
    []
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  // Reset workflow
  // Auto-scroll to bottom for workflow/chat-like sections
  useEffect(() => {
    try {
      messagesEndRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    } catch {}
  }, [
    workflowMessages.length,
    currentStep,
    readyToGenerate,
    showDesignPreview,
  ]);

  const resetWorkflow = useCallback(() => {
    setWorkflowActive(false);
    setWorkflowMessages([]);
    setCurrentStep("analyze");
    setDesignChoices(null);
    setReadyToGenerate(false);
    setCurrentProjectId(null);
    setSelectedImages([]);
    setPrompt("");
  }, []);

  // Update project name in backend

  // Start analyze workflow after project creation
  const startAnalyzeWorkflow = useCallback(
    async (projectId: number, userPrompt: string) => {
      setWorkflowActive(true);
      setWorkflowMessages([]);
      setDesignChoices(null);
      setReadyToGenerate(false);

      try {
        // Add user message to workflow
        const userMessage: WorkflowMessage = {
          id: `user-${Date.now()}`,
          content: userPrompt,
          type: "user",
          timestamp: new Date(),
        };
        setWorkflowMessages([userMessage]);

        // Call analyze endpoint
        const formData = new FormData();
        formData.append("prompt", userPrompt);
        formData.append("userId", dbUser!.id.toString());
        formData.append("projectId", projectId.toString());
        formData.append(
          "scope",
          projects.find((p) => p.id === projectId)?.scope ||
            selectedProjectType ||
            "frontend"
        );

        // Add project name for LLM processing
        const currentProject = projects.find((p) => p.id === projectId);
        if (currentProject?.name) {
          formData.append("projectName", currentProject.name);
        }

        selectedImages.forEach((image) => {
          formData.append("images", image);
        });
        const token = await getToken();

        // Build upload set:
        // - All original PDFs
        // - Only true images (exclude PDF-derived images that we show for preview)
        const pdfsToUpload = selectedPdfs;
        const trueImagesToUpload = selectedImages.filter(
          (f: any) => !f.originalPdfName
        );

        const filesToUpload = [...pdfsToUpload, ...trueImagesToUpload];

        // Upload files to database if any files are selected
        if (filesToUpload.length > 0 && token) {
          try {
            await uploadFilesToDatabase(filesToUpload, projectId, token);
          } catch (uploadError) {
            
            // Continue with workflow even if upload fails
          }
        }

        const analyzeResponse = await axios.post(
          `${BASE_URL}/api/design/analyze`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (analyzeResponse.data.success) {
          let processedDesignChoices = analyzeResponse.data.designChoices;
          if (processedDesignChoices && !processedDesignChoices.colorScheme) {
            const extractedColors = extractColorsFromDesignChoices(
              processedDesignChoices
            );
            processedDesignChoices.colorScheme = extractedColors;
          }

          const assistantMessage: WorkflowMessage = {
            id: `assistant-${Date.now()}`,
            content: analyzeResponse.data.message,
            type: "assistant",
            timestamp: new Date(),
            step: analyzeResponse.data.step,
            designChoices: processedDesignChoices,
          };

          setWorkflowMessages((prev) => [...prev, assistantMessage]);
          setCurrentStep(analyzeResponse.data.step);
          setDesignChoices(processedDesignChoices);
          setReadyToGenerate(analyzeResponse.data.readyToGenerate || false);
        }
      } catch (error) {
        const errorMessage: WorkflowMessage = {
          id: `error-${Date.now()}`,
          content:
            "Sorry, I encountered an error while analyzing your request. Please try again.",
          type: "assistant",
          timestamp: new Date(),
        };
        setWorkflowMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
      }
    },
    [dbUser, selectedImages, projects, selectedProjectType]
  );

  // Memoized handlers to prevent unnecessary re-renders
  const handlePromptChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setPrompt(e.target.value);
    },
    []
  );

  // Updated handleProjectClick to pass Supabase config
  const handleProjectClick = useCallback(
    (project: Project) => {
      navigate("/chatPage", {
        state: {
          projectId: project.id,
          existingProject: true,
          scope: project.scope,
          sessionId: hasSessionSupport
            ? projectSessions[project.id]?.sessionId
            : project.lastSessionId,
          supabaseConfig: supabaseConfig,
          clerkId: clerkUser?.id,
          userId: dbUser?.id,
        },
      });
    },
    [
      navigate,
      projectSessions,
      hasSessionSupport,
      supabaseConfig,
      clerkUser?.id,
      dbUser?.id,
    ]
  );

  // Updated handleContinueChat to pass Supabase config
  const handleContinueChat = useCallback(
    (project: Project, e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      navigate("/chatPage", {
        state: {
          projectId: project.id,
          existingProject: true,
          sessionId: hasSessionSupport
            ? projectSessions[project.id]?.sessionId
            : project.lastSessionId,
          supabaseConfig: supabaseConfig,
          scope: project.scope,
          clerkId: clerkUser?.id,
          userId: dbUser?.id,
        },
      });
    },
    [
      navigate,
      projectSessions,
      hasSessionSupport,
      supabaseConfig,
      clerkUser?.id,
      dbUser?.id,
    ]
  );

  const handleDeleteProject = useCallback(
    async (projectId: number, e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();

      const warningMessage = hasSessionSupport
        ? "Are you sure you want to delete this project? This will also delete all associated chat sessions and messages."
        : "Are you sure you want to delete this project? This will also delete all associated messages.";

      if (!window.confirm(warningMessage)) return;

      try {
        // Delete project and associated data
        const token = await getToken();
        await axios.delete(`${BASE_URL}/api/projects/${projectId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        // Remove from local state
        setProjects((prev) => prev.filter((p) => p.id !== projectId));
        if (hasSessionSupport) {
          setProjectSessions((prev) => {
            const newSessions = { ...prev };
            delete newSessions[projectId];
            return newSessions;
          });
        }
      } catch (error) {
        // Could add toast notification here
      }
    },
    [hasSessionSupport]
  );

  // Show project type selector instead of prompt when user clicks start
  const handleSubmit = useCallback(async () => {
    if (!dbUser) {
      return;
    }
    amplitude.track("Blue Generate button");
    // Check if Supabase config is required and valid
    if (
      selectedProjectType === "fullstack" &&
      (!supabaseConfig || !isConfigValid)
    ) {
      setShowSupabaseConfig(true);
      return;
    }

    // If we have a project created but workflow not active yet, activate it and start analyze
    if (currentProjectId && !workflowActive && prompt.trim()) {
      setWorkflowActive(true);
      setWorkflowMessages([]);
      setDesignChoices(null);
      setReadyToGenerate(false);
      await startAnalyzeWorkflow(currentProjectId, prompt);
      return;
    }

    // If workflow is already active, this shouldn't happen but just in case
    if (workflowActive && currentProjectId && prompt.trim()) {
      await startAnalyzeWorkflow(currentProjectId, prompt);
    }
  }, [
    dbUser,
    supabaseConfig,
    isConfigValid,
    currentProjectId,
    workflowActive,
    prompt,
    startAnalyzeWorkflow,
  ]);

  // Handle project type selection - creates project and returns to prompt input
  const handleProjectTypeSelect = useCallback(
    async (projectType: "frontend" | "fullstack") => {
      if (!dbUser) {
        return;
      }

      setSelectedProjectType(projectType);

      // Only require backend setup for fullstack
      if (projectType === "fullstack" && (!supabaseConfig || !isConfigValid)) {
        setShowSupabaseConfig(true);
        return;
      }

      // setSelectedProjectType(projectType);
      setIsLoading(true);

      try {
        // Create project with selected type and scope
        const projectData = {
          userId: dbUser.id,
          name: `frontend-project`,
          description: "", // Empty description initially
          scope: projectType,
          status: "pending",
          framework: "react",
          template: "vite-react-ts",
          deploymentUrl: "",
          downloadUrl: "",
          zipUrl: "",
          buildId: "",
          lastSessionId: `temp-${Date.now()}`,
          messageCount: 0,
          supabaseurl: supabaseConfig?.supabaseUrl || "",
          aneonkey: supabaseConfig?.supabaseAnonKey || "",
        };
        const token = await getToken();
        const projectResponse = await axios.post<Project>(
          `${BASE_URL}/api/projects`,
          projectData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const newProject = projectResponse.data;

        // Add the new project to the projects list
        setProjects((prev) => [newProject, ...prev]);

        // Set the current project ID but DON'T activate workflow yet
        setCurrentProjectId(newProject.id);
        setShowProjectTypeSelector(false); // Hide the project type selector

        // Clear the old prompt so user can enter new one
        setPrompt("");

        // DON'T set workflowActive here - let user enter prompt first
      } catch (error) {
      } finally {
        setIsLoading(false);
      }
    },
    [dbUser, supabaseConfig]
  );

  // Handle feedback submission
  const handleFeedbackSubmit = useCallback(
    async (feedback: string) => {
      if (!currentProjectId || !dbUser) return;

      setIsProcessingFeedback(true);

      const userMessage: WorkflowMessage = {
        id: `user-${Date.now()}`,
        content: feedback,
        type: "user",
        timestamp: new Date(),
      };

      setWorkflowMessages((prev) => [...prev, userMessage]);

      try {
        const token = await getToken();
        // Get current project name for LLM processing
        const currentProject = projects.find((p) => p.id === currentProjectId);

        const feedbackResponse = await axios.post(
          `${BASE_URL}/api/design/feedback`,
          {
            feedback,
            userId: dbUser.id.toString(),
            projectId: currentProjectId,
            projectName: currentProject?.name,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (feedbackResponse.data.success) {
          // Process the design choices from the response
          let processedDesignChoices = feedbackResponse.data.designChoices;

          // If designChoices doesn't have a proper colorScheme, create one from API response
          if (processedDesignChoices && !processedDesignChoices.colorScheme) {
            const extractedColors = extractColorsFromDesignChoices(
              processedDesignChoices
            );
            processedDesignChoices.colorScheme = extractedColors;
          }

          const assistantMessage: WorkflowMessage = {
            id: `assistant-${Date.now()}`,
            content: feedbackResponse.data.message,
            type: "assistant",
            timestamp: new Date(),
            step: feedbackResponse.data.step,
            designChoices: processedDesignChoices,
          };

          setWorkflowMessages((prev) => [...prev, assistantMessage]);
          setCurrentStep(feedbackResponse.data.step);
          setDesignChoices(processedDesignChoices);
          setReadyToGenerate(feedbackResponse.data.readyToGenerate || false);
        }
      } catch (error) {
        const errorMessage: WorkflowMessage = {
          id: `error-${Date.now()}`,
          content:
            "Sorry, I encountered an error processing your feedback. Please try again.",
          type: "assistant",
          timestamp: new Date(),
        };
        setWorkflowMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsProcessingFeedback(false);
      }
    },
    [currentProjectId, dbUser, projects]
  );

  // Generate final application
  const generateApplication = useCallback(async () => {
    if (!currentProjectId || !dbUser) return;
    amplitude.track("Green Generate Project button clicked");

    // Find the current project to get its scope
    const currentProject = projects.find((p) => p.id === currentProjectId);

    // Only block if it's fullstack and no backend config
    if (currentProject?.scope === "fullstack" && !supabaseConfig) {
      setShowSupabaseConfig(true);
      return;
    }

    // ✅ Navigate to chatPage with the existing project (like the old flow)
    navigate("/chatPage", {
      state: {
        projectId: currentProjectId,
        existingProject: true,
        clerkId: dbUser.clerkId,
        userId: dbUser.id,
        supabaseConfig: supabaseConfig,
        fromWorkflow: true, // This tells chatPage it came from the workflow
        scope: currentProject?.scope, // Add scope here
      },
    });
  }, [currentProjectId, dbUser, supabaseConfig, navigate, projects]);

  // Fetch session information for projects (only if session support is available)
  const fetchProjectSessions = useCallback(
    async (projectIds: number[]) => {
      if (projectIds.length === 0 || !hasSessionSupport) return;

      setLoadingSessions(true);
      try {
        const sessionPromises = projectIds.map(async (projectId) => {
          try {
            // Check if there's an active session for this project
            const token = await getToken();
            return {
              projectId,
            };
          } catch (error) {
            // If no session exists for this project, that's okay
            return {
              projectId,
              sessionInfo: null,
            };
          }
        });

        const results = await Promise.all(sessionPromises);
        const sessionsMap: Record<number, SessionInfo> = {};

        results.forEach(({ projectId, sessionInfo }) => {
          if (sessionInfo) {
            sessionsMap[projectId] = sessionInfo;
          }
        });

        setProjectSessions(sessionsMap);
      } catch (error) {
      } finally {
        setLoadingSessions(false);
      }
    },
    [hasSessionSupport]
  );

  // Sync user with database and fetch projects
  useEffect(() => {
    const syncUserAndFetchProjects = async () => {
      if (!isLoaded || !clerkUser) return;

      try {
        // Create or update user in database
        const userData = {
          clerkId: clerkUser.id,
          email: clerkUser.emailAddresses[0]?.emailAddress || "",
          name: clerkUser.fullName || clerkUser.firstName || "User",
          phoneNumber: clerkUser.phoneNumbers[0]?.phoneNumber || null,
          profileImage: clerkUser.imageUrl || null,
        };

        let userResponse;
        try {
          // Try to create/update user
          const token = await getToken();
          userResponse = await axios.post<DbUser>(
            `${BASE_URL}/api/users`,
            userData,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
          amplitude.setUserId(userResponse.data.email);
          // Store raw response data for reward evaluation (UI only)
          setUserPayload((userResponse as any).data);
        } catch (userError) {
          if (axios.isAxiosError(userError)) {
            
          }

          // Check if it's a 404 (endpoint doesn't exist) vs other errors
          if (
            axios.isAxiosError(userError) &&
            userError.response?.status === 404
          ) {
            
            // Create a fallback user object for development
            userResponse = {
              data: {
                id: Math.floor(Math.random() * 1000), // Random ID for development
                clerkId: clerkUser.id,
                email: userData.email,
                name: userData.name,
                phoneNumber: userData.phoneNumber,
                profileImage: userData.profileImage,
                newUser: false,
                updatedAt: new Date().toISOString(),
              },
            };
          } else {
            // For other errors, try to fetch existing user
            try {
              const token = await getToken();
              userResponse = await axios.get<DbUser>(
                // NOT MANDATORY.
                `${BASE_URL}/api/users/clerk/${clerkUser.id}`,
                {
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                }
              );
              setUserPayload((userResponse as any).data);
            } catch (fetchError) {
              
              throw fetchError; // Re-throw to be caught by outer try-catch
            }
          }
        }

        setDbUser({
          ...userResponse.data,
          profileImage: userResponse.data.profileImage || undefined,
        });
        setDidSyncUser(true);

        // Fetch user's projects
        setLoadingProjects(true);
        try {
          const token = await getToken();
          const projectsResponse = await axios.get(
            `${BASE_URL}/api/projects/user/${userResponse.data.id}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
              params: {
                page: 1,
              },
            }
          );

          const fetchedProjectsRaw = projectsResponse.data;

          // Normalize backend shape to our interface
          const fetchedProjects = Array.isArray(fetchedProjectsRaw)
            ? fetchedProjectsRaw.map((p: any) => ({
                id: p.id,
                name: p.name,
                description: p.description,
                deploymentUrl:
                  p.deploymentUrl || p.previewUrl || p.containerUrl || "",
                productionUrl:
                  p.productionUrl || p.liveUrl || p.deployedUrl || "",
                projects_thumbnail:
                  p.projects_thumbnail || p.thumbnail || p.previewImage || "",
                createdAt:
                  p.createdAt || p.created_at || new Date().toISOString(),
                updatedAt: p.updatedAt || p.updated_at || undefined,
                projectType: p.projectType || p.type,
                status: p.status || p.projectStatus || "ready",
                lastSessionId: p.lastSessionId,
                messageCount: p.messageCount,
                scope: (p.scope as "frontend" | "fullstack") || undefined,
              }))
            : fetchedProjectsRaw;

          // Ensure we have an array of projects
          if (!Array.isArray(fetchedProjects)) {
            
            // Check if we got a health response instead
            if (
              fetchedProjects &&
              typeof fetchedProjects === "object" &&
              "message" in fetchedProjects
            ) {
              
            }

            setProjects([]);
            return;
          }

          // Filter out deleted projects on the client side

          const activeProjects = fetchedProjects.filter(
            (project) => project.status !== "deleted"
          );

          setProjects(activeProjects);
          setPage(1);
          setHasMoreProjects(activeProjects.length === 4);

          // Fetch session information for all projects (if session support is available)
          if (activeProjects.length > 0 && hasSessionSupport) {
            const projectIds = activeProjects.map((p) => p.id);
            await fetchProjectSessions(projectIds);
          }
        } catch (projectError) {

          // Check if it's a 404 (endpoint doesn't exist) or if we got a health response
          if (
            axios.isAxiosError(projectError) &&
            (projectError.response?.status === 404 ||
              projectError.response?.data?.message?.includes(
                "Backend is running"
              ))
          ) {
            
            setProjects([]); // Set empty array as fallback
          } else {
            setProjects([]); // Set empty array as fallback for other errors
          }
        }
      } catch (error) {
        // Show user-friendly error message
        alert(
          "There was an error setting up your account. Please refresh the page and try again."
        );
      } finally {
        setLoadingProjects(false);
      }
    };

    syncUserAndFetchProjects();
  }, [clerkUser, isLoaded, fetchProjectSessions, hasSessionSupport]);

  // Check backend capabilities on load
  useEffect(() => {
    checkBackendCapabilities();
  }, [checkBackendCapabilities]);

  // Fetch credits on entry
  useEffect(() => {
    if (isLoaded && clerkUser) {
      fetchCredits();
    }
  }, [isLoaded, clerkUser, fetchCredits]);

  // Evaluate rewards only after user sync is completed and credits payload is available
  useEffect(() => {
    if (rewardsEvaluated) return;
    if (!didSyncUser) return;
    if (!userPayload || !creditsPayload) return;

    const u: any = userPayload;
    const c: any = creditsPayload;

    // Guard: if user is new and credits.signup not yet reflected, poll credits before showing modal
    if (
      u?.newUser &&
      typeof c?.signup === "number" &&
      c.signup <= 0 &&
      creditsRetryCount < MAX_CREDITS_RETRIES
    ) {
      setTimeout(() => {
        fetchCredits();
        setCreditsRetryCount((prev) => prev + 1);
      }, 800);
      return; // do NOT mark evaluated yet
    }

    const queue: React.ReactNode[] = [];
    if (u && typeof u === "object") {
      if (u.newUser) {
        if (c && typeof c === "object" && typeof c.signup === "number") {
          queue.push(
            <>
              🎉 Welcome to{" "}
              <span className="font-semibold text-blue-600">CodePup AI</span>!
              <br />
              Congrats! You’ve received{" "}
              <span className="font-bold text-green-600">
                {c.signup} tokens
              </span>{" "}
              as signup bonus.
            </>
          );
        }
        if (
          c &&
          typeof c === "object" &&
          typeof c.daily === "number" &&
          c.daily > 0
        ) {
          queue.push(
            <>
              ✨ Congratulations! You are awarded{" "}
              <span className="font-bold text-green-600">{c.daily} tokens</span>{" "}
              as your daily login bonus.
            </>
          );
        }
      } else if (u.updatedAt) {
        const updatedAtUtc = new Date(u.updatedAt);
        const nowUtc = new Date();
        const d1 = Date.UTC(
          updatedAtUtc.getUTCFullYear(),
          updatedAtUtc.getUTCMonth(),
          updatedAtUtc.getUTCDate()
        );
        const d2 = Date.UTC(
          nowUtc.getUTCFullYear(),
          nowUtc.getUTCMonth(),
          nowUtc.getUTCDate()
        );
        if (
          d1 !== d2 &&
          c &&
          typeof c === "object" &&
          typeof c.daily === "number" &&
          c.daily > 0
        ) {
          queue.push(
            <>
              ✨ Congratulations! You are awarded{" "}
              <span className="font-bold text-green-600">{c.daily} tokens</span>{" "}
              as your daily login bonus.
            </>
          );
        }
      }
    }
    if (queue.length > 0) {
      setRewardQueue(queue);
      setActiveReward(queue[0]);
    }
    setRewardsEvaluated(true);
  }, [
    userPayload,
    creditsPayload,
    rewardsEvaluated,
    didSyncUser,
    creditsRetryCount,
    fetchCredits,
  ]);

  // Separate polling: after user sync, if brand-new user and credits not ready (total === 0) try a few times to refresh top-right credits
  useEffect(() => {
    if (!didSyncUser) return;
    if (!userPayload?.newUser) return; // only for new users
    if (creditsRetryCount >= MAX_CREDITS_RETRIES) return;
    const total = typeof credits === "number" ? credits : null;
    if (total === 0) {
      const t = setTimeout(() => {
        fetchCredits();
        setCreditsRetryCount((prev) => prev + 1);
      }, 800);
      return () => clearTimeout(t);
    }
  }, [
    didSyncUser,
    userPayload?.newUser,
    credits,
    creditsRetryCount,
    fetchCredits,
  ]);

  // Refresh session data periodically (only if session support is available)
  useEffect(() => {
    if (projects.length === 0 || !hasSessionSupport) return;

    const interval = setInterval(() => {
      const projectIds = projects.map((p) => p.id);
      fetchProjectSessions(projectIds);
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [projects, fetchProjectSessions, hasSessionSupport]);

  // Load more projects (append next page)
  const handleLoadMoreProjects = useCallback(async () => {
    if (!dbUser || loadingMoreProjects || !hasMoreProjects) return;
    try {
      setLoadingMoreProjects(true);
      const nextPage = page + 1;
      const token = await getToken();
      const resp = await axios.get(
        `${BASE_URL}/api/projects/user/${dbUser.id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { page: nextPage },
        }
      );

      const newProjectsRaw = resp.data;
      if (!Array.isArray(newProjectsRaw)) {
        
        setHasMoreProjects(false);
        return;
      }

      const newActive = newProjectsRaw.filter(
        (p: any) => p.status !== "deleted"
      );

      // Append unique by id
      setProjects((prev) => {
        const existingIds = new Set(prev.map((p) => p.id));
        const deduped = newActive.filter((p: any) => !existingIds.has(p.id));
        return [...prev, ...deduped];
      });

      // Update sessions for newly loaded projects
      if (hasSessionSupport && newActive.length > 0) {
        const newIds = newActive.map((p: any) => p.id);
        await fetchProjectSessions(newIds);
      }

      setPage(nextPage);
      setHasMoreProjects(newActive.length === 4);
    } catch (err) {
      setHasMoreProjects(false);
    } finally {
      setLoadingMoreProjects(false);
    }
  }, [
    dbUser,
    page,
    getToken,
    hasMoreProjects,
    loadingMoreProjects,
    hasSessionSupport,
    fetchProjectSessions,
  ]);

  // Memoized project cards to prevent re-rendering on prompt change
  const memoizedProjectCards = useMemo(() => {
    // Sort projects by activity or message count depending on session support
    const sortedProjects = [...projects].sort((a, b) => {
      if (hasSessionSupport) {
        const aSession = projectSessions[a.id];
        const bSession = projectSessions[b.id];

        // Projects with active sessions first
        if (aSession?.hasActiveConversation && !bSession?.hasActiveConversation)
          return -1;
        if (!aSession?.hasActiveConversation && bSession?.hasActiveConversation)
          return 1;

        // Then by last activity if both have sessions
        if (aSession?.lastActivity && bSession?.lastActivity) {
          return (
            new Date(bSession.lastActivity).getTime() -
            new Date(aSession.lastActivity).getTime()
          );
        }

        // Projects with sessions before those without
        if (aSession && !bSession) return -1;
        if (!aSession && bSession) return 1;
      } else {
        // Sort by message count and last update for legacy mode
        const aMessages = a.messageCount || 0;
        const bMessages = b.messageCount || 0;

        if (aMessages !== bMessages) {
          return bMessages - aMessages; // More messages first
        }

        // Then by update time
        const aTime = new Date(a.updatedAt || a.createdAt).getTime();
        const bTime = new Date(b.updatedAt || b.createdAt).getTime();
        if (aTime !== bTime) {
          return bTime - aTime; // More recent first
        }
      }

      // Finally by creation date (newest first)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return sortedProjects.map((project, index) => (
      <motion.div
        key={project.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
      >
        <ProjectCard
          project={project}
          onProjectClick={handleProjectClick}
          onDeleteProject={handleDeleteProject}
          onContinueChat={handleContinueChat}
          sessionInfo={projectSessions[project.id]}
          hasSessionSupport={hasSessionSupport}
          onPreviewDesign={(designChoices) => {
            setSelectedDesignForPreview(designChoices);
            setShowDesignPreview(true);
          }}
        />
      </motion.div>
    ));
  }, [
    projects,
    projectSessions,
    handleProjectClick,
    handleDeleteProject,
    handleContinueChat,
    hasSessionSupport,
  ]);

  // Memoized project stats
  const projectStats = useMemo(() => {
    const activeProjects = projects.filter((p) => p.status === "ready").length;

    let projectsWithChats = 0;
    let totalMessages = 0;

    if (hasSessionSupport) {
      projectsWithChats = Object.keys(projectSessions).length;
      totalMessages = Object.values(projectSessions).reduce(
        (sum, session) => sum + (session?.messageCount || 0),
        0
      );
    } else {
      projectsWithChats = projects.filter(
        (p) => (p.messageCount || 0) > 0
      ).length;
      totalMessages = projects.reduce(
        (sum, p) => sum + (p.messageCount || 0),
        0
      );
    }

    return {
      count: projects.length,
      active: activeProjects,
      withChats: projectsWithChats,
      totalMessages,
      text: `${projects.length} project${projects.length <= 1 ? "" : "s"}`,
      chatsText:
        projectsWithChats > 0 ? ` • ${projectsWithChats} with chats` : "",
      messagesText: totalMessages > 0 ? ` • ${totalMessages} messages` : "",
    };
  }, [projects, projectSessions, hasSessionSupport]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.metaKey || e.ctrlKey) &&
        e.key === "Enter" &&
        prompt.trim() &&
        !workflowActive &&
        !showProjectTypeSelector
      ) {
        handleSubmit();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [prompt, handleSubmit, workflowActive, showProjectTypeSelector]);

  // Normalize current step for display-only logic without changing state/logic
  const displayStep = useMemo(() => {
    const step = (currentStep || "").toLowerCase();
    if (readyToGenerate) return "ready";
    if (step.includes("analy")) return "analyze";
    if (step.includes("feed")) return "feedback";
    return step || "analyze";
  }, [currentStep, readyToGenerate]);

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        className="page-container"
      >
        {/* Toast Notifications */}
        <div className="fixed top-4 right-4 z-50 space-y-3">
          <AnimatePresence initial={false}>
            {toasts.map((toast) => (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{
                  type: "spring",
                  stiffness: 500,
                  damping: 30,
                  mass: 0.6,
                }}
                layout
                className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg ${
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
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        {/* Animated background particles */}
        <div className="animated-background">
          {Array.from({ length: 50 }).map((_, i) => (
            <motion.div
              key={i}
              className="animated-particle"
              initial={{
                x:
                  Math.random() *
                  (typeof window !== "undefined" ? window.innerWidth : 1920),
                y:
                  Math.random() *
                  (typeof window !== "undefined" ? window.innerHeight : 1080),
              }}
              animate={{
                x:
                  Math.random() *
                  (typeof window !== "undefined" ? window.innerWidth : 1920),
                y:
                  Math.random() *
                  (typeof window !== "undefined" ? window.innerHeight : 1080),
              }}
              transition={{
                duration: Math.random() * 20 + 10,
                repeat: Infinity,
                repeatType: "reverse",
              }}
            />
          ))}
        </div>

        {/* Back Button - Only visible when project type is selected */}
        {selectedProjectType && !workflowActive && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.5 }}
            className="absolute-top-left z-header"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setSelectedProjectType(null);
                setShowProjectTypeSelector(true);
              }}
              className="back-button"
            >
              <ArrowLeft className="size-icon-small" />
              <span className="font-medium">Back</span>
            </motion.button>
          </motion.div>
        )}

        {/* Authentication Header */}
        <motion.header
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="header-container"
        >
          {/* Content only visible when signed in */}
          <SignedIn>
            {selectedProjectType === "fullstack" && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: 0.5 }}
              >
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowSupabaseConfig(true)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all duration-200 ${
                    isConfigValid
                      ? "bg-green-500/10 border-green-500/20 text-green-400 hover:bg-green-500/20"
                      : "bg-orange-500/10 border-orange-500/20 text-orange-400 hover:bg-orange-500/20"
                  }`}
                  title={
                    isConfigValid ? "Supabase configured" : "Configure Supabase"
                  }
                >
                  <Database className="w-4 h-4" />
                  <span className="hidden sm:inline">
                    {isConfigValid ? "Backend Ready" : "Setup Backend"}
                  </span>
                  <div
                    className={`w-2 h-2 rounded-full ${
                      isConfigValid ? "bg-green-500" : "bg-orange-500"
                    }`}
                  ></div>
                </motion.button>
              </motion.div>
            )}
          </SignedIn>

          {/* Gallery link - visible to all users */}
          <Link
            to="/gallery"
            className="flex items-center gap-2 px-2 sm:px-3 py-2 rounded-lg text-slate-800 hover:bg-slate-100 transition-colors"
            title="Gallery"
          >
            <Images className="w-5 h-5 text-blue-600" />
            <span className="hidden sm:inline font-medium">Gallery</span>
          </Link>

          <SignedOut>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <SignInButton>
                <button
                  className="btn-signin"
                  onClick={() => amplitude.track("Sign In Clicked")}
                >
                  Sign In
                </button>
              </SignInButton>
            </motion.div>
          </SignedOut>
          <SignedIn>
            <Link
              to="/hackathon"
              className="hidden md:flex items-center gap-2 px-3 py-2 rounded-lg text-slate-800 hover:bg-slate-100 transition-colors"
              title="Hackathon"
            >
              <Trophy className="w-5 h-5 text-blue-600" />
              <span className="font-medium">Hackathon</span>
            </Link>
            {/* Credits before account menu */}
            <div className="mr-2">
              <Credit value={credits} />
            </div>
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "w-10 h-10",
                  userButtonPopoverCard: "bg-white border-slate-300",
                  userButtonPopoverText: "text-slate-800",
                },
              }}
            />
          </SignedIn>
        </motion.header>

        {/* Backend Status Indicator */}
        {backendStatus !== "checking" && (
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="absolute top-6 left-6 z-20"
          ></motion.div>
        )}

        {/* Main Content Container */}
        <div className="page-content mt-3">
          {/* Title */}
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{
              duration: 1.2,
              ease: "easeOut",
              delay: 0.3,
            }}
            className="flex-center mb-8"
          >
            {/* Logo */}
            <motion.div
              animate={{
                filter: [
                  "drop-shadow(0 0 0px rgba(255,255,255,0))",
                  "drop-shadow(0 0 20px rgba(255,255,255,0.3))",
                  "drop-shadow(0 0 0px rgba(255,255,255,0))",
                ],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <img
                src="/main.png"
                alt="CodePup Logo"
                className="w-24 h-24 md:w-32 md:h-32 object-contain"
              />
            </motion.div>

            {/* Title */}
            <motion.h1
              className="text-6xl px-2 md:text-8xl bg-gradient-to-b tracking-tighter from-slate-800 via-slate-700 to-transparent bg-clip-text text-transparent font-bold"
              animate={{
                textShadow: [
                  "0 0 0px rgba(255,255,255,0)",
                  "0 0 20px rgba(255,255,255,0.1)",
                  "0 0 0px rgba(255,255,255,0)",
                ],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              CodePup
            </motion.h1>
          </motion.div>

          {/* Backend Status Message */}
          {backendStatus === "limited" && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 1.0 }}
              className="mb-8 text-center"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-yellow-600 text-sm">
                <AlertCircle className="size-icon-small" />
                Running in compatibility mode - some advanced features may be
                unavailable
              </div>
            </motion.div>
          )}

          {/* Content only visible when signed in */}
          <SignedIn>
            {workflowActive ? (
              // Show the analyze/feedback workflow
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="workflow-container mb-12"
              >
                <div className="workflow-grid">
                  {/* Chat Messages - Left Side */}
                  <div className="workflow-chat-section">
                    <div className="bg-gradient-to-br from-slate-100 to-slate-200 backdrop-blur-sm border border-slate-300 rounded-xl shadow-medium">
                      {/* Header */}
                      <div className="p-4 border-b border-slate-300">
                        <div className="flex-between">
                          <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                            <Settings className="size-icon-medium text-blue-600" />
                            Design Process
                          </h3>
                        </div>
                      </div>

                      {/* Messages */}
                      <div className="workflow-messages">
                        <AnimatePresence>
                          {workflowMessages.map((message) => (
                            <motion.div
                              key={message.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className={`flex ${
                                message.type === "user"
                                  ? "justify-end"
                                  : "justify-start"
                              }`}
                            >
                              <div
                                className={`max-w-[80%] p-3 rounded-lg ${
                                  message.type === "user"
                                    ? "bg-blue-600/20 border border-blue-500/30 text-slate-800"
                                    : "bg-slate-100 border border-slate-300 text-slate-700"
                                }`}
                              >
                                <p className="text-sm whitespace-pre-wrap">
                                  {message.content}
                                  {message.isLoading && (
                                    <span className="inline-block ml-2">
                                      <Loader2 className="size-icon-small animate-spin" />
                                    </span>
                                  )}
                                </p>
                                <span className="text-xs text-slate-500 mt-1 block">
                                  {message.timestamp.toLocaleTimeString()}
                                </span>
                              </div>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                        <div ref={messagesEndRef} />
                      </div>

                      {/* Input or Actions */}
                      <div className="workflow-input-section">
                        {readyToGenerate ? (
                          <motion.button
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={generateApplication}
                            className="btn-primary-large"
                          >
                            <CheckCircle className="size-icon-medium" />
                            Generate Complete Application
                            <ArrowRight className="size-icon-small" />
                          </motion.button>
                        ) : (
                          <FeedbackInput
                            onSubmit={handleFeedbackSubmit}
                            isLoading={
                              isProcessingFeedback ||
                              (currentStep === "analyze" && !designChoices)
                            }
                            placeholder={
                              currentStep === "analyze" && !designChoices
                                ? "CodePup is generating design..."
                                : isProcessingFeedback
                                ? "CodePup is applying your feedback..."
                                : undefined
                            }
                          />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Design Preview - Right Side */}
                  <div className="workflow-preview-section">
                    {designChoices && (
                      <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                      >
                        <DesignPreview designChoices={designChoices} />

                        {/* Preview button */}
                        <motion.button
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            setSelectedDesignForPreview(designChoices);
                            setShowDesignPreview(true);
                            amplitude.track("Preview Design Clicked");
                          }}
                          className="btn-secondary-large mt-3"
                        >
                          <Eye className="size-icon-medium" />
                          Preview Design
                        </motion.button>
                      </motion.div>
                    )}

                    {/* Progress indicator */}
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 }}
                      className="progress-container"
                    >
                      <h4 className="progress-title">
                        <Eye className="progress-icon" />
                        Progress
                      </h4>
                      <div className="progress-steps">
                        <div
                          className={`progress-step ${
                            displayStep === "analyze"
                              ? "progress-step-active"
                              : displayStep === "feedback" || readyToGenerate
                              ? "progress-step-complete"
                              : "progress-step-default"
                          }`}
                        >
                          <div
                            className={`progress-dot ${
                              displayStep === "analyze"
                                ? "progress-dot-active"
                                : displayStep === "feedback" || readyToGenerate
                                ? "progress-dot-complete"
                                : "progress-dot-default"
                            }`}
                          />
                          Design Analysis
                        </div>
                        <div
                          className={`progress-step ${
                            displayStep === "feedback"
                              ? "progress-step-active"
                              : readyToGenerate
                              ? "progress-step-complete"
                              : "progress-step-default"
                          }`}
                        >
                          <div
                            className={`progress-dot ${
                              displayStep === "feedback"
                                ? "progress-dot-active"
                                : readyToGenerate
                                ? "progress-dot-complete"
                                : "progress-dot-default"
                            }`}
                          />
                          Refinement
                        </div>
                        <div
                          className={`progress-step ${
                            displayStep === "ready" || readyToGenerate
                              ? "progress-step-active"
                              : "progress-step-default"
                          }`}
                        >
                          <div
                            className={`progress-dot ${
                              displayStep === "ready" || readyToGenerate
                                ? "progress-dot-active"
                                : "progress-dot-default"
                            }`}
                          />
                          Generation Ready
                        </div>
                      </div>
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            ) : (
              // Show either project type selector OR normal prompt input
              <>
                {/* Show Project Type Selector or Normal Prompt Input */}
                <div className="form-section">
                  <motion.div
                    initial={{ y: 30, opacity: 0, scale: 0.9 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    transition={{
                      duration: 1,
                      ease: "easeOut",
                      delay: 1.2,
                    }}
                    className="form-container"
                  >
                    {showProjectTypeSelector ? (
                      // Show Project Type Selector in place of prompt input
                      <ProjectTypeSelector
                        onProjectTypeSelect={handleProjectTypeSelect}
                        isLoading={isLoading}
                      />
                    ) : (
                      // Show Normal Prompt Input
                      <>
                        {/* Image upload section */}
                        <ImageUploadSection
                          selectedImages={selectedImages}
                          setSelectedImages={setSelectedImages}
                          selectedProjectType={selectedProjectType}
                          isConfigValid={isConfigValid}
                          showToast={showToast}
                          setSelectedPdfs={setSelectedPdfs}
                        />

                        <motion.textarea
                          whileFocus={{
                            scale: 1.02,
                            boxShadow: "0 0 0 2px rgba(96, 165, 250, 0.3)",
                          }}
                          value={prompt}
                          onChange={handlePromptChange}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              if (
                                !isLoading &&
                                prompt.trim() &&
                                !(
                                  selectedProjectType === "fullstack" &&
                                  !isConfigValid
                                )
                              ) {
                                handleSubmit();
                              }
                            }
                          }}
                          placeholder={
                            selectedProjectType === "fullstack" &&
                            !isConfigValid
                              ? "Configure backend settings first to create projects..."
                              : "Describe your app idea in detail... (Enter to send, Shift+Enter for new line)"
                          }
                          className="textarea-main"
                          disabled={
                            selectedProjectType === "fullstack" &&
                            !isConfigValid
                          }
                        />

                        <motion.button
                          initial={{ y: 30, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{
                            duration: 1,
                            ease: "easeOut",
                            delay: 1.5,
                          }}
                          whileHover={{
                            scale: isConfigValid && prompt.trim() ? 1.05 : 1,
                            boxShadow:
                              isConfigValid && prompt.trim()
                                ? "0 10px 25px rgba(96, 165, 250, 0.3)"
                                : "none",
                          }}
                          whileTap={{
                            scale: isConfigValid && prompt.trim() ? 0.95 : 1,
                          }}
                          className="btn-main-action"
                          onClick={handleSubmit}
                          disabled={
                            isLoading ||
                            !prompt.trim() ||
                            (selectedProjectType === "fullstack" &&
                              !isConfigValid)
                          }
                        >
                          <motion.span
                            animate={
                              isLoading
                                ? {
                                    opacity: [1, 0.5, 1],
                                  }
                                : {}
                            }
                            transition={
                              isLoading
                                ? {
                                    duration: 1,
                                    repeat: Infinity,
                                    ease: "easeInOut",
                                  }
                                : {}
                            }
                            className="flex items-center gap-2"
                          >
                            {isLoading ? (
                              <>
                                <motion.div
                                  animate={{ rotate: 360 }}
                                  transition={{
                                    duration: 1,
                                    repeat: Infinity,
                                    ease: "linear",
                                  }}
                                  className="loading-spinner"
                                />
                                {workflowActive
                                  ? "Analyzing..."
                                  : "Creating Project..."}
                              </>
                            ) : selectedProjectType === "fullstack" &&
                              !isConfigValid ? (
                              "Configure Backend First"
                            ) : workflowActive ? (
                              <>Generate Design</>
                            ) : (
                              <>Generate</>
                            )}
                          </motion.span>
                        </motion.button>
                      </>
                    )}
                  </motion.div>
                </div>
              </>
            )}

            {/* Projects Section - hidden when a project type is selected */}
            {selectedProjectType === null && (
              <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{
                  duration: 1,
                  ease: "easeOut",
                  delay: 1.8,
                }}
                className="projects-section"
              >
                <div className="projects-header">
                  <h2 className="projects-title">Your Projects</h2>
                  <div className="projects-stats">
                    <div className="projects-stats-main">
                      {projectStats.text}
                      {projectStats.chatsText}
                    </div>
                    {projectStats.totalMessages > 0 && (
                      <div className="projects-stats-sub">
                        {projectStats.totalMessages} total messages
                        {!hasSessionSupport && " (legacy)"}
                      </div>
                    )}
                  </div>
                </div>

                {loadingProjects ? (
                  <div className="projects-loading">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                      className="projects-loading-icon"
                    />
                  </div>
                ) : projects.length > 0 ? (
                  <>
                    <div className="projects-grid">{memoizedProjectCards}</div>
                    <div className="flex justify-center mt-4">
                      {hasMoreProjects && (
                        <button
                          onClick={handleLoadMoreProjects}
                          disabled={loadingMoreProjects}
                          className="btn hover:cursor-pointer text-primary-weak hover:text-blue-600"
                        >
                          {loadingMoreProjects ? "Loading..." : "Load More"}
                        </button>
                      )}
                    </div>
                    {hasSessionSupport && loadingSessions && (
                      <div className="projects-sessions-loading">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{
                            duration: 1,
                            repeat: Infinity,
                            ease: "linear",
                          }}
                          className="projects-sessions-loading-icon"
                        />
                        <span className="projects-sessions-loading-text">
                          Loading chat sessions...
                        </span>
                      </div>
                    )}
                  </>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="projects-empty"
                  >
                    <Code2 className="projects-empty-icon" />
                    <h3 className="projects-empty-title">No projects yet</h3>
                  </motion.div>
                )}
              </motion.div>
            )}
          </SignedIn>

          {/* Message for signed out users */}
          <SignedOut>
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{
                duration: 1,
                ease: "easeOut",
                delay: 1.2,
              }}
              className="signed-out-container"
            >
              <p className="signed-out-text">
                Please sign in to start building your projects
              </p>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <SignInButton>
                  <button
                    className="btn-signin"
                    onClick={() => amplitude.track("Get Started Clicked")}
                  >
                    Get Started
                  </button>
                </SignInButton>
              </motion.div>
            </motion.div>
          </SignedOut>
        </div>
      </motion.div>

      {/* Supabase Configuration Form Modal */}
      <SupabaseConfigForm
        isOpen={showSupabaseConfig}
        onClose={() => setShowSupabaseConfig(false)}
        onSubmit={handleSupabaseConfigSubmit}
        initialConfig={supabaseConfig || {}}
      />

      {/* Reward Modal Queue */}
      {activeReward && (
        <RewardModal
          message={activeReward}
          onClose={() => {
            setRewardQueue((prev) => {
              const [, ...rest] = prev;
              setActiveReward(rest[0] || null);
              return rest;
            });
          }}
        />
      )}

      {/* Expandable Design Preview Modal */}
      <ExpandableDesignPreview
        designChoices={selectedDesignForPreview || {}}
        isOpen={showDesignPreview}
        onClose={() => setShowDesignPreview(false)}
        onGenerate={() => {
          setShowDesignPreview(false);
          generateApplication();
        }}
        projectName={
          selectedDesignForPreview ? "Design Preview" : "Project Preview"
        }
      />
    </>
  );
};

export default Index;

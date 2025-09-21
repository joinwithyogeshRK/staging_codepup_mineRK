import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from "react";
import "../../App.css";
import { getSortedProjectCards } from "./components/helper/projectCardUtils";
import { fetchUserCredits } from "./components/services/creditsService";
import ProjectCard from "./components/ProjectCard";
import ColorPalette from "./components/ColorPalette";
import DesignPreview from "./components/DesignPreview";
import FeedbackInput from "./components/FeedbackInput";
import { loadMoreProjects } from "./components/services/handleLoadMoreProjects";
import { confirmAndDeleteProject } from "./components/services/DeleteProject";
import { createProject } from "./components/services/handleProjectTypeSelect";
import handleFeedbackSubmit from "./components/services/feedbackService";
import { submitWorkflowAction } from "./components/services/handleSubmitService";
import axios from "axios";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  useUser,
  UserButton,
  useAuth,
} from "@clerk/clerk-react";
import SignedOutMessage from "./components/SignedOutMessage";
import Credit from "../../components/Credit";
import { processSelectedImages } from "./components/services/imageSelectionService";
import RewardModal from "../../components/RewardModal";
import ProjectTypeSelector from "../../components/options";
import ExpandableDesignPreview from "../design-preview";
import { syncUserAndFetchProjectsFn } from "./components/services/syncUserAndFetchProjects";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate, Link } from "react-router-dom";
import WorkflowPreview from "./components/WorkflowPreview";
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
import SupabaseConfigForm from "../form"; // Import the form component
import ImageUploadSection from "@/components/Image-upload-component";
import { normalizeDisplayStep } from "./components/utils/displayStepUtils";
import { computeProjectStats } from "./components/utils/projectStatsUtils";
import { useToast } from "@/helper/Toast";
import { useProjectWorkflow } from "./components/hooks/usestartAnalyzeWorkflow"
import { amplitude } from "../../utils/amplitude";
import { uploadFilesToDatabase } from "../../utils/fileUpload";
import type {
  Project,
  DbUser,
  SessionInfo,
  SupabaseConfig,
  Toast,
  DesignChoices,
  WorkflowMessage,
} from "./components/types/types";
import { useEvaluateRewards } from "./components/hooks/useEvaluateRewards";
import AnimatedTitle from "./components/AnimatedTitle";

// --- Constants ---
const BASE_URL = import.meta.env.VITE_BASE_URL;

// Helper function to extract colors from design choices
export const extractColorsFromDesignChoices = (
  designChoices: DesignChoices
) => {
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
ColorPalette.displayName = "ColorPalette";
DesignPreview.displayName = "DesignPreview";
ProjectCard.displayName = "ProjectCard";
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
  const [supabaseConfig, setSupabaseConfig] = useState<
    SupabaseConfig | undefined
  >(undefined);

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

  const { showToast } = useToast();
  const navigate = useNavigate();
  const { user: clerkUser, isLoaded } = useUser();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { getToken } = useAuth();
  const [credits, setCredits] = useState<number | null>(null);

  const [creditsPayload, setCreditsPayload] = useState<any | null>(null);
  const [userPayload, setUserPayload] = useState<any | null>(null);
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
      } catch (error) {}
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
      if (!token) return;
      const { value, data } = await fetchUserCredits(clerkUser.id, token);
      setCredits(value);
      setCreditsPayload(data);
    } catch (e) {
      // keep silent in UI
    }
  }, [clerkUser, getToken]);

  // Toast helpers (format matches GitHubModel.tsx)
  // Handle image selection
  const handleImageSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newFiles = Array.from(e.target.files || []);
      if (newFiles.length === 0) return;

      setSelectedImages((prev) =>
        processSelectedImages(prev, newFiles, 5, showToast)
      );
    },
    [showToast]
  );

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
  const { clickSubmit, startAnalyzeWorkflow } = useProjectWorkflow({
    dbUser,
    projects,
    selectedProjectType,
    supabaseConfig,
    isConfigValid,
    currentProjectId,
    workflowActive,
    prompt,
    selectedImages,
    selectedPdfs,
    getToken,
    setWorkflowActive,
    setWorkflowMessages,
    setDesignChoices,
    setReadyToGenerate,
    setCurrentStep,
    setIsLoading,
    amplitudeTrack: amplitude.track, // pass amplitude tracking function
    BASE_URL,
  });

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
      } catch (error) {
        if ((error as Error)?.message !== "User cancelled") {
          showToast(
            "Woof! 🐾 That project didn’t get deleted. Give it another go in a bit.",
            "error"
          );
        }
      }
    },
    [hasSessionSupport, getToken, showToast]
  );

  const handleSubmit = useCallback(async () => {
    if (!dbUser) return;

    amplitude.track("Blue Generate button");

    if (
      selectedProjectType === "fullstack" &&
      (!supabaseConfig || !isConfigValid)
    ) {
      setShowProjectTypeSelector(true);
      return;
    }

    if (currentProjectId && !workflowActive && prompt.trim()) {
      setWorkflowActive(true);
      setWorkflowMessages([]);
      setDesignChoices(null);
      setReadyToGenerate(false);
      await startAnalyzeWorkflow(currentProjectId, prompt);
      return;
    }

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
  const handleProjectSelectFun = useCallback(
    async (projectType: "frontend" | "fullstack") => {
      if (!dbUser) return;

      setSelectedProjectType(projectType);

      if (projectType === "fullstack" && (!supabaseConfig || !isConfigValid)) {
        setShowSupabaseConfig(true);
        return;
      }

      setIsLoading(true);
      try {
        const token = await getToken();
        if (!token) throw new Error("Authentication token required");

        const newProject = await createProject({
          userId: dbUser.id,
          projectType,
          supabaseConfig: undefined,
          token,
          baseUrl: BASE_URL,
        });

        setProjects((prev) => [newProject, ...prev]);
        setCurrentProjectId(newProject.id);
        setShowProjectTypeSelector(false);
        setPrompt("");
      } catch (error) {
        // handle error
      } finally {
        setIsLoading(false);
      }
    },
    [dbUser, supabaseConfig, isConfigValid, getToken]
  );

  // Handle feedback submission
  const onFeedbackSubmit = useCallback(
    (feedback: string) => {
      handleFeedbackSubmit(
        feedback,
        currentProjectId,
        dbUser,
        projects,
        getToken,
        setWorkflowMessages,
        setCurrentStep,
        setDesignChoices,
        setReadyToGenerate,
        setIsProcessingFeedback
      );
    },
    [
      currentProjectId,
      dbUser,
      projects,
      getToken,
      setWorkflowMessages,
      setCurrentStep,
      setDesignChoices,
      setReadyToGenerate,
      setIsProcessingFeedback,
    ]
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
    (async () => {
      const token = await getToken();
      if (!token) {
        // Handle missing token as appropriate
        return;
      }
      await syncUserAndFetchProjectsFn({
        isLoaded,
        clerkUser,
        token,
        amplitude,
        setUserPayload,
        setDbUser,
        setDidSyncUser,
        setLoadingProjects,
        setProjects,
        setPage,
        setHasMoreProjects,
        BASE_URL,
        hasSessionSupport,
        fetchProjectSessions,
        alertFn: alert, // or your custom alert handler
      });
    })();
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
  const {
    activeReward,
    setActiveReward,
    rewardsEvaluated,
    resetRewards,
  } = useEvaluateRewards({ userPayload, creditsPayload, didSyncUser, fetchCredits });
  

  // Separate polling: after user sync, if brand-new user and credits not ready (total === 0) try a few times to refresh top-right credits
  useEffect(() => {
    if (!didSyncUser) return;
    if (!userPayload?.newUser) return; // only for new users
    if (creditsRetryCount >= MAX_CREDITS_RETRIES) return;
    const total = typeof credits === "number" ? credits : null;
    if (total === 0) {
      const t = setTimeout(() => {
        fetchCredits();
        setCreditsRetryCount((prev: number) => prev + 1);
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
      const token = await getToken();

      if (!token) {
        setLoadingMoreProjects(false);
        return;
      }
      const userIdString = dbUser.id.toString();
      const { projects: newProjects, hasMore } = await loadMoreProjects({
        currentPage: page,
        userId: userIdString,
        token,
        hasSessionSupport,
        fetchSessions: fetchProjectSessions,
      });

      setProjects((prev) => {
        const existingIds = new Set(prev.map((p) => p.id));
        const filteredNew = newProjects.filter((p) => !existingIds.has(p.id));
        return [...prev, ...filteredNew];
      });
      setPage((p) => p + 1);
      setHasMoreProjects(hasMore);
    } catch {
      showToast(
        "Arf! 🐶 Our pup couldn’t fetch more projects right now. Please try again in a moment.",
        "error"
      );
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
    showToast,
  ]);

  // Memoized project cards to prevent re-rendering on prompt change
  const memoizedProjectCards = useMemo(() => {
    return getSortedProjectCards(
      projects,
      projectSessions,
      { handleProjectClick, handleDeleteProject, handleContinueChat },
      hasSessionSupport,
      setSelectedDesignForPreview,
      setShowDesignPreview
    );
  }, [
    projects,
    projectSessions,
    handleProjectClick,
    handleDeleteProject,
    handleContinueChat,
    hasSessionSupport,
    setSelectedDesignForPreview,
    setShowDesignPreview,
  ]);

  // Memoized project stats
  const projectStats = useMemo(() => {
    return computeProjectStats(projects, projectSessions, hasSessionSupport);
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
  const displayStep = useMemo(
    () => normalizeDisplayStep(currentStep, readyToGenerate),
    [currentStep, readyToGenerate]
  );

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        className="page-container"
      >

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
        <div className="page-content">
          {/* Title */}
         <AnimatedTitle/>

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
            {workflowActive && !isLoading && !readyToGenerate ? (
              // Show the analyze/feedback workflow
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="workflow-container mb-12"
              >
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
                        onProjectTypeSelect={handleProjectSelectFun}
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
          <SignedOutMessage />
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
            setActiveReward(null);          
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
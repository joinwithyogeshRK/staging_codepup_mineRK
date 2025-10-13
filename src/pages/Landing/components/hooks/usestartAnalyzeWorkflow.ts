// usestartAnalyzeWorkflow.ts
import { useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import type {
  DbUser,
  Project,
  WorkflowMessage,
  DesignChoices,
  SupabaseConfig,
} from "../types/types";
import { encodeId } from "@/utils/hashids";

interface UseProjectWorkflowParams {
  dbUser: DbUser | null;
  projects: Project[];
  selectedProjectType: "frontend" | "fullstack" | null;
  supabaseConfig?: any;
  setSupabaseConfig?: React.Dispatch<
    React.SetStateAction<SupabaseConfig | undefined>
  >;
  isConfigValid: boolean;
  currentProjectId: number | null;
  workflowActive: boolean;
  prompt: string;
  selectedImages: File[];
  selectedPdfs: File[];
  getToken: () => Promise<string | null>;
  setWorkflowActive: (val: boolean) => void;
  setIsLoading: (val: boolean) => void;
  amplitudeTrack: (eventName: string) => void;
  BASE_URL: string;
}

export function useProjectWorkflow({
  dbUser,
  projects,
  selectedProjectType,
  supabaseConfig,
  setSupabaseConfig,
  isConfigValid,
  currentProjectId,
  workflowActive,
  prompt,
  selectedImages,
  selectedPdfs,
  getToken,
  setWorkflowActive,
  setIsLoading,
  amplitudeTrack,
  BASE_URL,
}: UseProjectWorkflowParams) {
  const navigate = useNavigate();
  const startAnalyzeWorkflow = useCallback(
    async (projectId: number, userPrompt: string) => {
      setWorkflowActive(true);
      setIsLoading(true);
      const supabaseDetails = localStorage.getItem("supabaseConfig");
      const supabaseArgs = JSON.parse(supabaseDetails || "");
      try {
        const token = await getToken();
        const stored = localStorage.getItem("supabaseConfig");
        if (stored) {
          try {
            const config = JSON.parse(stored);
            //@ts-ignore
            if (config) setSupabaseConfig(config);
            // else setSupabaseConfig()
          } catch (error) {}
        }

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

        const currentProject = projects.find((p) => p.id === projectId);
        if (currentProject?.name) {
          formData.append("projectName", currentProject.name);
        }

        // Add Supabase config to formData if available
        if (stored) {
          formData.append("supabaseConfig", stored);
        }

        // Send both raw images and PDFs directly
        selectedImages.forEach((file) => {
          formData.append("images", file);
        });
        selectedPdfs.forEach((file) => {
          formData.append("images", file);
        });
        /* // ------- DEBUGGING LOGS ------
        for (const [key, value] of formData.entries()) {
          if (value instanceof File) {
            console.log(
              `${key}: [File] name=${value.name}, type=${value.type}, size=${value.size} bytes`
            );
          } else {
            console.log(`${key}:`, value);
          }
        }
        // ---------------------------------- */
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
            // Simple color extraction fallback
            processedDesignChoices.colorScheme = {
              primary:
                processedDesignChoices.recommendedColors?.[0] || "#3B82F6",
              secondary:
                processedDesignChoices.recommendedColors?.[1] || "#1E40AF",
              accent:
                processedDesignChoices.recommendedColors?.[2] || "#F59E0B",
              background: "#FFFFFF",
              text: "#1F2937",
            };
          }

          // Automatically navigate to chatpage after design analysis is complete
          // This replaces the manual green button click
          const currentProject = projects.find((p) => p.id === projectId);
          const projectScope =
            currentProject?.scope || selectedProjectType || "frontend";

          // Navigate directly to chatpage (equivalent to generateApplication)
          const encodeIdParams = encodeId(projectId);
          navigate(`/chatPage/${encodeIdParams}`, {
            state: {
              projectId: projectId,
              existingProject: true,
              clerkId: dbUser!.clerkId,
              userId: dbUser!.id,
              supabaseConfig: supabaseArgs,
              fromWorkflow: true,
              scope: projectScope,
            },
          });
        }
      } catch (error) {
      } finally {
        setIsLoading(false);
      }
    },
    [
      dbUser,
      projects,
      selectedProjectType,
      supabaseConfig,
      selectedImages,
      selectedPdfs,
      getToken,
      setWorkflowActive,
      setIsLoading,
      BASE_URL,
      navigate,
    ]
  );

  const clickSubmit = useCallback(async () => {
    if (!dbUser) return;

    amplitudeTrack("Blue Generate button");

    // if (
    //   selectedProjectType === "fullstack" &&
    //   (!supabaseConfig || !isConfigValid)
    // ) {
    //   // Show your project type selector or backend config modal externally
    //   return;
    // }

    if (currentProjectId && !workflowActive && prompt.trim()) {
      setWorkflowActive(true);
      await startAnalyzeWorkflow(currentProjectId, prompt);
      return;
    }

    if (workflowActive && currentProjectId && prompt.trim()) {
      await startAnalyzeWorkflow(currentProjectId, prompt);
    }
  }, [
    amplitudeTrack,
    currentProjectId,
    dbUser,
    isConfigValid,
    prompt,
    selectedProjectType,
    supabaseConfig,
    startAnalyzeWorkflow,
    setWorkflowActive,
    workflowActive,
  ]);

  return { clickSubmit, startAnalyzeWorkflow };
}

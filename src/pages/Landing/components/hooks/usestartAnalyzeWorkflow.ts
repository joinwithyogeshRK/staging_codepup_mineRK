// usestartAnalyzeWorkflow.ts
import { useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/helper/Toast";
import type {
  DbUser,
  Project,
  WorkflowMessage,
  DesignChoices,
  SupabaseConfig,
} from "../types/types";
import { encodeId } from "@/utils/hashids";
import { uploadFilesToDatabase } from "@/utils/fileUpload";

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
  const { showToast } = useToast();
  const startAnalyzeWorkflow = useCallback(
    async (projectId: number, userPrompt: string) => {
      setWorkflowActive(true);
      setIsLoading(true);
      
      try {
        const token = await getToken();

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

        // Determine projectType based on scope and file types
        const projectScope = currentProject?.scope || selectedProjectType || "frontend";
        
        // Separate CSV/Excel files from other non-PDF attachments
        const nonPdfAttachments = (selectedPdfs || []).filter(
          (f) => f.type !== "application/pdf"
        );
        
        const csvExcelFiles = nonPdfAttachments.filter((file) => {
          const lower = file.name.toLowerCase();
          return lower.endsWith(".csv") || lower.endsWith(".xlsx") || lower.endsWith(".xls");
        });
        
        const hasCsvOrExcel = csvExcelFiles.length > 0;
        
        let projectType = "general";
        if (projectScope === "fullstack" && hasCsvOrExcel) {
          projectType = "dashboard";
        }
        
        formData.append("projectType", projectType);

        // Send extracted/standalone images
        selectedImages.forEach((file) => {
          formData.append("images", file);
        });
        
        const otherNonPdfFiles = nonPdfAttachments.filter((file) => {
          const lower = file.name.toLowerCase();
          return !lower.endsWith(".csv") && !lower.endsWith(".xlsx") && !lower.endsWith(".xls");
        });
        
        // Send CSV/Excel files as "documents"
        csvExcelFiles.forEach((file) => {
          formData.append("documents", file);
        });
        
        // Send other non-PDF files (md, txt, svg, webp, ico) as "images"
        otherNonPdfFiles.forEach((file) => {
          formData.append("images", file);
        });
        // ------- DEBUGGING LOGS ------
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
        // Fire-and-forget: persist raw PDFs to DB (utility filters to PDFs only)
        try {
          if (selectedPdfs && selectedPdfs.length > 0 && token) {
            await uploadFilesToDatabase(selectedPdfs, projectId, token);
          }
        } catch (_) {
          // Ignore DB upload errors; generation should proceed
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
              // Pass the original user prompt so ChatPage can display it as the first user message
              prompt: userPrompt,
              fromWorkflow: true,
              scope: projectScope,
            },
          });
        } else {
          // Non-success response handling
          showToast(
            "🐾 Oops! Our pup lost the scent while fetching your design. Please try again soon.",
            "error"
          );
          setWorkflowActive(false);
        }
      } catch (error) {
        // Any network/axios error
        showToast(
          "🐶 Ruff! Something spooked our pup while fetching your design. Give it another try in a moment.",
          "error"
        );
        setWorkflowActive(false);
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

// useProjectWorkflow.ts
import { useCallback } from "react";
import axios from "axios";
import { uploadFilesToDatabase } from "../../../../utils/fileUpload"; // adjust path if needed
import { useNavigate } from "react-router-dom";
import { extractImagesFromPdf } from "../../../../utils/pdfExtraction";
import { useToast } from "@/helper/Toast";
import type {
  DbUser,
  Project,
  WorkflowMessage,
  DesignChoices,
} from "../types/types";
import { encodeId } from "@/utils/hashids";

interface UseProjectWorkflowParams {
  dbUser: DbUser | null;
  projects: Project[];
  selectedProjectType: "frontend" | "fullstack" | null;
  supabaseConfig?: any;
  isConfigValid: boolean;
  currentProjectId: number | null;
  workflowActive: boolean;
  prompt: string;
  selectedImages: File[];
  selectedPdfs: File[];
  getToken: () => Promise<string | null>;
  setWorkflowActive: (val: boolean) => void;
  setWorkflowMessages: (
    val: WorkflowMessage[] | ((prev: WorkflowMessage[]) => WorkflowMessage[])
  ) => void;
  setDesignChoices: (val: DesignChoices | null) => void;
  setReadyToGenerate: (val: boolean) => void;
  setCurrentStep: (val: string) => void;
  setIsLoading: (val: boolean) => void;
  amplitudeTrack: (eventName: string) => void;
  BASE_URL: string;
}

export function useProjectWorkflow({
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
  amplitudeTrack,
  BASE_URL,
}: UseProjectWorkflowParams) {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const startAnalyzeWorkflow = useCallback(
    async (projectId: number, userPrompt: string) => {
      setWorkflowActive(true);
      setWorkflowMessages([]);
      setDesignChoices(null);
      setReadyToGenerate(true); // Set to true immediately to prevent UI from showing
      setIsLoading(true);

      try {
        const userMessage: WorkflowMessage = {
          id: `user-${Date.now()}`,
          content: userPrompt,
          type: "user",
          timestamp: new Date(),
        };
        setWorkflowMessages([userMessage]);

        const token = await getToken();

        // No DB uploads. Send raw user-attached files directly to analyze endpoint.

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

        // Prepare images to send: include raw images + images extracted from PDFs
        const imagesToSend: File[] = [];
        // Add existing image files
        selectedImages.forEach((file) => {
          if (file.type && file.type.startsWith("image/")) {
            imagesToSend.push(file);
          }
        });
        // Extract images from PDFs only; skip other docs for analyze
        for (const file of selectedPdfs) {
          if (file.type === "application/pdf") {
            const result = await extractImagesFromPdf(file, 5, showToast);
            if (result && result.extractedImages.length > 0) {
              imagesToSend.push(...result.extractedImages);
            }
          }
        }
        // Append all images to form data
        imagesToSend.forEach((img) => formData.append("images", img));

        // Append non-PDF documents (xlsx, xls, txt, md, csv) as originals
        selectedPdfs.forEach((file) => {
          if (file.type !== "application/pdf") {
            formData.append("documents", file);
          }
        });
        // ---------------- Debugging LOGS ------------------
        /* for (let pair of formData.entries()) {
          const [key, value] = pair;
          
          if (value instanceof File) {
            console.log(
              `Key: ${key}, File name: ${value.name}, Type: ${value.type}, Size: ${value.size} bytes`
            );
          } else {
            console.log(`Key: ${key}, Value: ${value}`);
          }
        } */
        // ---------------- ## ------------------

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
            // You may want to import and use extractColorsFromDesignChoices here
            // processedDesignChoices.colorScheme = extractColorsFromDesignChoices(processedDesignChoices);
          }

          // Set the design choices for the backend to reference
          setDesignChoices(processedDesignChoices);
          setReadyToGenerate(analyzeResponse.data.readyToGenerate || false);

          // Automatically navigate to chatpage after design analysis is complete
          // This replaces the manual green button click
          const currentProject = projects.find((p) => p.id === projectId);

          // Check if it's fullstack and no backend config
          if (currentProject?.scope === "fullstack" && !supabaseConfig) {
            // If fullstack without config, we can't proceed - let the user handle this
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
            return;
          }

          // Navigate directly to chatpage (equivalent to generateApplication)

          const encodeIdParams = encodeId(projectId);
          navigate(`/chatPage/${encodeIdParams}`, {
            state: {
              projectId: projectId,
              existingProject: true,
              clerkId: dbUser!.clerkId,
              userId: dbUser!.id,
              supabaseConfig: supabaseConfig,
              fromWorkflow: true,
              scope: currentProject?.scope || selectedProjectType || "frontend",
            },
          });
        }
      } catch (error) {
        const errorMessage: WorkflowMessage = {
          id: `error-${Date.now()}`,
          content:
            "Ruff! 🐾 Something went wrong while sniffing through your request. Give it another try!",
          type: "assistant",
          timestamp: new Date(),
        };
        setWorkflowMessages((prev) => [...prev, errorMessage]);
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
      setWorkflowMessages,
      setDesignChoices,
      setReadyToGenerate,
      setCurrentStep,
      setIsLoading,
      BASE_URL,
      navigate,
    ]
  );

  const clickSubmit = useCallback(async () => {
    if (!dbUser) return;

    amplitudeTrack("Blue Generate button");

    if (
      selectedProjectType === "fullstack" &&
      (!supabaseConfig || !isConfigValid)
    ) {
      // Show your project type selector or backend config modal externally
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
    amplitudeTrack,
    currentProjectId,
    dbUser,
    isConfigValid,
    prompt,
    selectedProjectType,
    supabaseConfig,
    startAnalyzeWorkflow,
    setDesignChoices,
    setReadyToGenerate,
    setWorkflowActive,
    setWorkflowMessages,
    workflowActive,
  ]);

  return { clickSubmit, startAnalyzeWorkflow };
}

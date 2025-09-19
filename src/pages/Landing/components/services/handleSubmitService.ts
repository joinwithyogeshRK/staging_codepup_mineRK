// workflowService.ts
import type { DesignChoices } from "../types/types";

interface SubmitParams {
  dbUserId: string | number;
  projectId: number;
  prompt: string;
  workflowActive: boolean;
  selectedProjectType: "frontend" | "fullstack" | null;
  supabaseConfig?: Record<string, any>; // Adjust type based on actual schema
  isConfigValid: boolean;
  startAnalyzeWorkflow: (projectId: number, prompt: string) => Promise<void>;
  setShowSupabaseConfig: (show: boolean) => void;
  setWorkflowActive: (active: boolean) => void;
  setWorkflowMessages: (messages: any[]) => void;
  setDesignChoices: (choices: DesignChoices | null) => void;
  setReadyToGenerate: (ready: boolean) => void;
  trackAmplitudeEvent: (event: string) => void;
}

export async function submitWorkflowAction(params: SubmitParams): Promise<void> {
  const {
    dbUserId,
    projectId,
    prompt,
    workflowActive,
    selectedProjectType,
    supabaseConfig,
    isConfigValid,
    startAnalyzeWorkflow,
    setShowSupabaseConfig,
    setWorkflowActive,
    setWorkflowMessages,
    setDesignChoices,
    setReadyToGenerate,
    trackAmplitudeEvent,
  } = params;

  if (!dbUserId) return;

  trackAmplitudeEvent("Blue Generate button");

  if (selectedProjectType === "fullstack" && (!supabaseConfig || !isConfigValid)) {
    setShowSupabaseConfig(true);
    return;
  }

  if (projectId && !workflowActive && prompt.trim()) {
    setWorkflowActive(true);
    setWorkflowMessages([]);
    setDesignChoices(null);
    setReadyToGenerate(false);
    await startAnalyzeWorkflow(projectId, prompt);
    return;
  }

  if (workflowActive && projectId && prompt.trim()) {
    await startAnalyzeWorkflow(projectId, prompt);
  }
}

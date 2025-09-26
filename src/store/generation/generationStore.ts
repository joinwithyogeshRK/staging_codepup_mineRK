import { create } from "zustand";
import type { StreamingProgressData } from "@/types";

type GenerationScope = "frontend" | "fullstack";

interface StartParams {
  projectId: number;
  scope: GenerationScope;
  token: string;
  baseUrl: string;
  supabaseConfig?: {
    supabaseUrl?: string;
    supabaseAnonKey?: string;
    supabaseToken?: string;
    databaseUrl?: string;
  };
  onStream?: (data: StreamingProgressData, projectId: number) => void;
}

interface GenerationState {
  isGenerating: boolean;
  projectId: number | null;
  phase: string;
  progress: number;
  message: string;
  previewUrl?: string;
  error?: string;
  startGeneration: (params: StartParams) => Promise<void>;
  reset: () => void;
}

export const useGenerationStore = create<GenerationState>((set, get) => ({
  isGenerating: false,
  projectId: null,
  phase: "",
  progress: 0,
  message: "",
  previewUrl: undefined,
  error: undefined,

  reset: () =>
    set({
      isGenerating: false,
      projectId: null,
      phase: "",
      progress: 0,
      message: "",
      previewUrl: undefined,
      error: undefined,
    }),

  startGeneration: async ({ projectId, scope, token, baseUrl, supabaseConfig, onStream }: StartParams) => {
    // If already generating the same project, do nothing
    const { isGenerating, projectId: currentId } = get();
    if (isGenerating && currentId === projectId) return;

    set({ isGenerating: true, projectId, phase: "initializing", progress: 0, message: "Starting application generation...", error: undefined });

    try {
      const apiRoute = scope === "frontend" ? "/api/design/generateFrontendOnly" : "/api/design/generate-frontend";
      const body: any = {
        projectId,
      };
      if (scope === "fullstack" && supabaseConfig) {
        body.supabaseUrl = supabaseConfig.supabaseUrl;
        body.supabaseAnonKey = supabaseConfig.supabaseAnonKey;
        body.supabaseToken = supabaseConfig.supabaseToken;
        body.databaseUrl = supabaseConfig.databaseUrl;
      }

      const response = await fetch(`${baseUrl}${apiRoute}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const data: StreamingProgressData = JSON.parse(line.slice(6));

            // Mirror minimal state for navigation persistence (not full code streaming)
            if (data.type === "progress") {
              set({
                progress: data.percentage || 0,
                phase: data.phase || "",
                message: data.message || "",
              });
            } else if (data.type === "complete") {
              set({ progress: 100, phase: "complete", message: data.message || "" });
            } else if (data.type === "result") {
              const url = data.result?.previewUrl as string | undefined;
              if (url) set({ previewUrl: url });
              set({ isGenerating: false, progress: 100, phase: "complete" });
            } else if (data.type === "error") {
              set({ isGenerating: false, phase: "error", error: data.error || "Unknown error" });
            }

            if (onStream) onStream(data, projectId);
          } catch (e) {
            // ignore malformed line
          }
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Generation failed";
      set({ isGenerating: false, phase: "error", error: msg });
      // Also emit error event to UI if desired
      if (onStream) {
        onStream({ type: "error", buildId: "", error: msg } as StreamingProgressData, projectId);
      }
    }
  },
}));



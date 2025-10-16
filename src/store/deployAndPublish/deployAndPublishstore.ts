import { create } from "zustand";
import { v4 as uuidv4 } from "uuid";
import { resolveSupabaseCreds } from "@/pages/ChatPage/utils/supabaseCreds";

type DeployPhase = "idle" | "deploying" | "success" | "error";

interface SupabaseConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  supabaseToken: string;
  databaseUrl: string;
}

interface DeployState {
  projectId: number | null;
  phase: DeployPhase;
  isDeploying: boolean;
  error?: string;
  deployedUrl?: string;

  // actions
  startDeploy: (
    projectId: number,
    token: string,
    clerkId: string,
    scope?: string,
    supabaseConfig?: SupabaseConfig
  ) => Promise<void>;
  reset: () => void;
}

export const useDeployStore = create<DeployState>((set, get) => ({
  projectId: null,
  phase: "idle",
  isDeploying: false,
  error: undefined,
  deployedUrl: undefined,

  startDeploy: async (
    projectId: number,
    token: string,
    clerkId: string,
    scope?: string,
    supabaseConfig?: SupabaseConfig
  ) => {
    set({ projectId, phase: "deploying", isDeploying: true, error: undefined });

    try {
      // Choose API endpoint based on project scope
      const apiEndpoint =
        scope === "fullstack"
          ? `${
              import.meta.env.VITE_BASE_URL
            }/api/generate-fullstack/deploy-fullstack`
          : `${import.meta.env.VITE_BASE_URL}/api/design/build-and-deploy`;

      // Prepare request body based on project scope
      let requestBody: any = { projectId };

      if (scope === "fullstack") {
        const effective = await resolveSupabaseCreds({
          baseUrl: import.meta.env.VITE_BASE_URL,
          projectId,
          clerkId,
          token,
          current: {
            supabaseUrl: supabaseConfig?.supabaseUrl,
            supabaseAnonKey: supabaseConfig?.supabaseAnonKey,
            supabaseToken: supabaseConfig?.supabaseToken,
            databaseUrl: supabaseConfig?.databaseUrl,
          },
          localStorageFallbackKey: "supabaseAccessToken",
        });

        requestBody = {
          projectId,
          supabaseUrl: effective.supabaseUrl,
          supabaseAnonKey: effective.supabaseAnonKey,
          supabaseServiceRoleKey: effective.supabaseToken,
        };
      }

      const response = await fetch(apiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `🐾 Deployment tripped over a stick! Our pup couldn't fetch your app this time. Status: ${response.status}`
        );
      }

      const deployedUrl = await response.json();

      set({
        deployedUrl,
        phase: "success",
        isDeploying: false,
        error: undefined,
      });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Unknown deployment error",
        phase: "error",
        isDeploying: false,
      });
    }
  },

  reset: () =>
    set({
      phase: "idle",
      isDeploying: false,
      error: undefined,
    }),
}));

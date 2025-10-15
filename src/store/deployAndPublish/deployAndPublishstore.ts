import { create } from "zustand";
import { v4 as uuidv4 } from "uuid";

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
        // Resolve credentials from provided config or fetch from backend tables
        let resolvedUrl = supabaseConfig?.supabaseUrl || "";
        let resolvedAnon = supabaseConfig?.supabaseAnonKey || "";
        let resolvedServiceRole = supabaseConfig?.supabaseToken || "";

        // If any of the critical fields are missing, fetch from backend
        if (!resolvedUrl || !resolvedAnon) {
          try {
            const projResp = await fetch(
              `${import.meta.env.VITE_BASE_URL}/api/projects/${projectId}`,
              {
                method: "GET",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
              }
            );
            if (projResp.ok) {
              const data = await projResp.json();
              // Backend returns keys possibly as aneonkey, supabaseurl
              resolvedAnon =
                resolvedAnon || data?.aneonkey || data?.supabaseAnonKey || "";
              resolvedUrl =
                resolvedUrl || data?.supabaseurl || data?.supabaseUrl || "";
            }
          } catch {}
        }

        // Resolve supabase service role token from user table if needed (fallback to localStorage)
        if (!resolvedServiceRole) {
          try {
            // Use clerkId passed as parameter to fetch user data
            if (clerkId) {
              const meResp = await fetch(
                `${import.meta.env.VITE_BASE_URL}/api/users/clerk/${clerkId}`,
                {
                  method: "GET",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                  },
                }
              );
              if (meResp.ok) {
                const me = await meResp.json();
                resolvedServiceRole = me?.supabaseToken || resolvedServiceRole;
              }
            }
          } catch {}
          // Frontend fallback (persisted during connection)
          if (!resolvedServiceRole) {
            try {
              resolvedServiceRole = localStorage.getItem("supabaseAccessToken") || "";
            } catch {}
          }
        }

        if (!resolvedUrl || !resolvedAnon || !resolvedServiceRole) {
          throw new Error(
            "Missing Supabase credentials for fullstack deployment"
          );
        }

        requestBody = {
          projectId,
          supabaseUrl: resolvedUrl,
          supabaseAnonKey: resolvedAnon,
          supabaseServiceRoleKey: resolvedServiceRole,
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

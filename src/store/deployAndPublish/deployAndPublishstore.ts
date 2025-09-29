import { create } from "zustand";
import { v4 as uuidv4 } from "uuid";

type DeployPhase = "idle" | "deploying" | "success" | "error";

interface DeployState {
  projectId: number | null;
  phase: DeployPhase;
  isDeploying: boolean;
  error?: string;
  deployedUrl?: string;

  // actions
  startDeploy: (projectId: number, token: string) => Promise<void>;
  reset: () => void;
}

export const useDeployStore = create<DeployState>((set, get) => ({
  projectId: null,
  phase: "idle",
  isDeploying: false,
  error: undefined,
  deployedUrl: undefined,

  startDeploy: async (projectId: number, token: string) => {
    set({ projectId, phase: "deploying", isDeploying: true, error: undefined });

    try {
      const response = await fetch(
        `${import.meta.env.VITE_BASE_URL}/api/design/build-and-deploy`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ projectId }),
        }
      );

      if (!response.ok) {
        throw new Error(`🐾 Deployment tripped over a stick! Our pup couldn’t fetch your app this time.`);
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

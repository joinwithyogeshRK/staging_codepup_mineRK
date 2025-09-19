// src/utils/workflowStateManager.ts

interface WorkflowState {
  projectId: number;
  currentStage: string;
  completedStages: string[];
  status: "idle" | "running" | "completed" | "failed";
  lastUpdated: number;
  scope: "frontend" | "fullstack";
  progress: number;
}

export const WorkflowStateManager = {
  getKey: (projectId: number) => `workflow_state_${projectId}`,

  save: (state: WorkflowState) => {
    try {
      localStorage.setItem(
        WorkflowStateManager.getKey(state.projectId),
        JSON.stringify({ ...state, lastUpdated: Date.now() })
      );
    } catch (e) {
    }
  },

  load: (projectId: number): WorkflowState | null => {
    try {
      const stored = localStorage.getItem(
        WorkflowStateManager.getKey(projectId)
      );
      if (!stored) return null;

      const state = JSON.parse(stored) as WorkflowState;

      // Expire state after 24 hours
      if (Date.now() - state.lastUpdated > 24 * 60 * 60 * 1000) {
        WorkflowStateManager.clear(projectId);
        return null;
      }

      return state;
    } catch (e) {
      return null;
    }
  },

  clear: (projectId: number) => {
    try {
      localStorage.removeItem(WorkflowStateManager.getKey(projectId));
    } catch (e) {
    }
  },

  markStageCompleted: (
    projectId: number,
    stage: string,
    progress: number = 0
  ) => {
    const state = WorkflowStateManager.load(projectId);
    if (state) {
      state.completedStages = [...new Set([...state.completedStages, stage])];
      state.currentStage = stage;
      state.status = "completed";
      state.progress = progress;
      WorkflowStateManager.save(state);
    }
  },

  setCurrentStage: (
    projectId: number,
    stage: string,
    status: WorkflowState["status"],
    scope: "frontend" | "fullstack" = "frontend",
    progress: number = 0
  ) => {
    let state = WorkflowStateManager.load(projectId);
    if (!state) {
      state = {
        projectId,
        currentStage: stage,
        completedStages: [],
        status,
        lastUpdated: Date.now(),
        scope,
        progress,
      };
    } else {
      state.currentStage = stage;
      state.status = status;
      state.scope = scope;
      state.progress = progress;
    }
    WorkflowStateManager.save(state);
  },

  isStageCompleted: (projectId: number, stage: string): boolean => {
    const state = WorkflowStateManager.load(projectId);
    return state ? state.completedStages.includes(stage) : false;
  },
};

export type { WorkflowState };

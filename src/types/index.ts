// types/chatpage.types.ts

export type ProjectInfo = {
  id: number | null;
  name: string | null;
  isVerified: boolean;
};

export interface LocationState {
  prompt?: string;
  projectId?: number;
  existingProject?: boolean;
  supabaseConfig?: any;
  clerkId?: string;
  userId?: number;
  fromWorkflow?: boolean;
  scope?: 'frontend' | 'fullstack';
}

export interface Project {
  id: number;
  name?: string;
  description?: string;
  deploymentUrl?: string;
  previewUrl?: string;
  url?: string;
  status?: "pending" | "building" | "ready" | "error";
  createdAt?: string;
  updatedAt?: string;
}

export interface Message {
  id: string;
  content: string;
  type: "user" | "assistant";
  timestamp: Date;
  isStreaming?: boolean;
  workflowStep?: string;
  stepData?: any;
}

export interface ContextValue {
  value: any;
  setValue: (value: any) => void;
}

export interface WorkflowStepData {
  step: string;
  message: string;
  data?: any;
  isComplete?: boolean;
  error?: string;
}

export interface StreamingProgressData {
  type: "progress" | "length" | "chunk" | "complete" | "error" | "result";
  buildId: string;
  totalLength?: number;
  currentLength?: number;
  percentage?: number;
  chunk?: string;
phase?: "complete" | "parsing" | "processing" | "deploying" | "generating" | "creating" | undefined
  message?: string;
  error?: string;
  result?: any;
}

export interface StreamingStats {
  totalCharacters: number;
  chunksReceived: number;
  estimatedTotalChunks: number;
  startTime: number;
  endTime?: number;
  bytesPerSecond?: number;
}

export interface GeneratedFile {
  filename: string;
  content: string;
  isComplete: boolean;
  type?: string;
  size?: number;
}
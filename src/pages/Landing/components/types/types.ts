// src/types/types.ts

export interface Project {
  id: number;
  name: string;
  description?: string;
  deploymentUrl?: string;
  productionUrl?: string;
  projects_thumbnail?: string;
  createdAt: string;
  updatedAt?: string;
  projectType?: string;
  status?: string;
  lastSessionId?: string;
  messageCount?: number;
  scope?: "frontend" | "fullstack";
}

export interface DbUser {
  id: number;
  clerkId: string;
  email: string;
  name: string;
  phoneNumber: string | null;
  profileImage?: string;
}

export interface SessionInfo {
  sessionId: string;
  messageCount: number;
  lastActivity: string;
  hasActiveConversation: boolean;
}

export interface SupabaseConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  supabaseToken: string;
  databaseUrl: string;
}

export interface Toast {
  id: string;
  message: string;
  type: "success" | "error";
  duration?: number;
}

export interface DesignChoices {
  businessType?: string;
  businessName?: string;
  projectName?: string;
  vibe?: string;
  colorScheme?: {
    primary?: string;
    secondary?: string;
    accent?: string;
    background?: string;
    text?: string;
  };
  recommendedColors?: string[];
  allColorOptions?: string[];
  colorExplanation?: string;
  style?: string;
  features?: string[];
  layout?: string;
  recommendedLayout?: string;
  recommendedLayoutExplanation?: string;
  layoutStyles?: string[];
  differentLayouts?: string[];
  differentSections?: string[];
  components?: string[];
}

export interface WorkflowMessage {
  id: string;
  content: string;
  type: "user" | "assistant";
  timestamp: Date;
  step?: string;
  isLoading?: boolean;
  designChoices?: DesignChoices;
}

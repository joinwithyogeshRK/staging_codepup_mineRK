// projectService.ts
import axios from "axios";

export interface ProjectCreateParams {
  userId: number | string;
  projectType: "frontend" | "fullstack";
  supabaseConfig?: {
    supabaseUrl?: string;
    supabaseAnonKey?: string;
    databaseUrl?: string;
  };
  token: string;
  baseUrl: string;
}

export async function createProject({
  userId,
  projectType,
  supabaseConfig,
  token,
  baseUrl,
}: ProjectCreateParams) {
  const projectPayload = {
    userId,
    name: `${projectType}-project`,
    description: "",
    scope: projectType,
    status: "pending",
    framework: "react",
    template: "vite-react-ts",
    deploymentUrl: "",
    zipUrl: "",
    buildId: "",
    lastSessionId: `temp-${Date.now()}`,
    messageCount: 0,
    supabaseurl: supabaseConfig?.supabaseUrl || "",
    aneonkey: supabaseConfig?.supabaseAnonKey || "",
    databaseUrl: supabaseConfig?.databaseUrl || "",
  };
  /* DEBUGGING LOGS
  console.log("Creating Project with these credentials payload:", projectPayload)
  */
  const response = await axios.post(`${baseUrl}/api/projects`, projectPayload, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data; // expects Project type object
}

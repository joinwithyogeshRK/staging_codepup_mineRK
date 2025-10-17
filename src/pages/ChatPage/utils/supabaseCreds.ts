export interface SupabaseCreds {
  supabaseUrl: string;
  supabaseAnonKey: string;
  supabaseToken: string; // service role token from user table
  databaseUrl?: string;
}

// Fetch project-level creds: supabaseUrl, supabaseAnonKey, databaseUrl
export async function fetchProjectSupabaseCreds(baseUrl: string, projectId: number, token: string): Promise<Pick<SupabaseCreds, "supabaseUrl" | "supabaseAnonKey" | "databaseUrl">> {
  const resp = await fetch(`${baseUrl}/api/projects/${projectId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  if (!resp.ok) {
    throw new Error(`Failed to fetch project creds (${resp.status})`);
  }
  const data = await resp.json();
  return {
    supabaseUrl: data?.supabaseurl || data?.supabaseUrl || "",
    supabaseAnonKey: data?.aneonkey || data?.supabaseAnonKey || "",
    databaseUrl: data?.databaseUrl || data?.dbUrl || "",
  };
}

// Fetch user-level token: supabaseToken (service role)
export async function fetchUserSupabaseToken(baseUrl: string, clerkId: string, token: string): Promise<string> {
  const resp = await fetch(`${baseUrl}/api/users/clerk/${clerkId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  if (!resp.ok) {
    throw new Error(`Failed to fetch user token (${resp.status})`);
  }
  const data = await resp.json();
  return data?.supabaseToken || "";
}

// Combined resolver with fallbacks: prefer provided values, then refetch
export async function resolveSupabaseCreds(params: {
  baseUrl: string;
  projectId: number;
  clerkId: string;
  token: string; // auth bearer
  current?: Partial<SupabaseCreds>;
  localStorageFallbackKey?: string; // e.g., "supabaseAccessToken"
}): Promise<SupabaseCreds> {
  const { baseUrl, projectId, clerkId, token, current, localStorageFallbackKey } = params;

  let supabaseUrl = current?.supabaseUrl || "";
  let supabaseAnonKey = current?.supabaseAnonKey || "";
  let databaseUrl = current?.databaseUrl || "";
  let supabaseToken = current?.supabaseToken || "";

  // Project creds
  if (!supabaseUrl || !supabaseAnonKey || !databaseUrl) {
    try {
      const proj = await fetchProjectSupabaseCreds(baseUrl, projectId, token);
      supabaseUrl = supabaseUrl || proj.supabaseUrl;
      supabaseAnonKey = supabaseAnonKey || proj.supabaseAnonKey;
      databaseUrl = databaseUrl || proj.databaseUrl || "";
    } catch {}
  }

  // User token
  if (!supabaseToken) {
    try {
      supabaseToken = await fetchUserSupabaseToken(baseUrl, clerkId, token);
    } catch {}

    if (!supabaseToken && localStorageFallbackKey) {
      try {
        supabaseToken = localStorage.getItem(localStorageFallbackKey) || "";
      } catch {}
    }
  }

  if (!supabaseUrl || !supabaseAnonKey || !supabaseToken) {
    throw new Error("Missing Supabase credentials");
  }

  return { supabaseUrl, supabaseAnonKey, supabaseToken, databaseUrl };
}



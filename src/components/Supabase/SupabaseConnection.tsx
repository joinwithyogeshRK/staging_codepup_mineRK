import { useState } from "react";
import axios from "axios";
import { useAuth } from "@clerk/clerk-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";

interface SupabaseConnectionProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (payloadString: string) => void;
}

function SupabaseConnection({
  open,
  onOpenChange,
  onSelect,
}: SupabaseConnectionProps) {
  const [accessToken, setAccessToken] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<any>(null);
  const [showProjectLimitError, setShowProjectLimitError] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<string>("");
  const [creating, setCreating] = useState(false);
  const [newProjectName, setNewProjectName] = useState<string>("Codepup");
  const API_BASE_URL = import.meta.env.VITE_BASE_URL;
  
  // Move useAuth hook to the top level
  const { getToken } = useAuth();

  // const handleClick = () => {
  //   window.open(
  //     "https://supabase.com/dashboard/account/tokens",
  //     "_blank",
  //     "noopener,noreferrer"
  //   );
  // };

  // const openSupabaseDashboard = () => {
  //   window.open(
  //     "https://supabase.com/dashboard/projects",
  //     "_blank",
  //     "noopener,noreferrer"
  //   );
  // };

  const submit = async () => {
    setError(null);
    setSuccess(null);
    setIsLoading(true);
    setShowProjectLimitError(false);

    try {
      if (!accessToken) throw new Error("Access token required");
      const token = await getToken();

      // Hit backend to mint Supabase credentials and (optionally) project
      const res = await fetch(`${API_BASE_URL}/api/supabase/getCredentials`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          accessToken,
          projectName: "codePup",
          forceCreate: false,
        }),
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || "Failed to connect with Supabase");
      }
      
      // Save access token in user's schema
      try {
        const userData = { accessToken: accessToken };
        const userResponse = await axios.post(
          `${API_BASE_URL}/api/users`,
          userData,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        console.log("Access token saved to user profile:", userResponse.data);
      } catch (e) {
        console.error("Failed to save access token to user profile:", e);
        // Don't throw error here as this is not critical for the main flow
      }

      localStorage.setItem("supabaseAccessToken", accessToken);
      const data = await res.json();
      if (!data?.success || !data?.supabaseProject) {
        throw new Error("Invalid response from credentials API");
      }

      // Store minimal project info just for display (optional)
      setProjects([
        {
          id: data.supabaseProject.projectRef || data.supabaseProject.name,
          name: data.supabaseProject.name,
          region: "ap-south-1",
          status: "ACTIVE",
        },
      ]);
      setSelectedProjectId(
        data.supabaseProject.projectRef || data.supabaseProject.name
      );
      setSuccess({ ok: true } as any);

      // Immediately continue with selected since we got exact project + creds
      const payloadString = JSON.stringify({
        success: true,
        accessToken,
        supabaseProject: data.supabaseProject,
      });
      onSelect(payloadString);
      onOpenChange(false);

      // ✅ Properly store config as JSON
      const supabaseConfig = {
        supabaseUrl: data.supabaseProject.credentials.supabaseUrl,
        supabaseAnonKey: data.supabaseProject.credentials.supabaseAnonKey,
        supabaseToken: accessToken,
        databaseUrl: data.supabaseProject.credentials.databaseUrl,
      };

      localStorage.setItem("supabaseConfig", JSON.stringify(supabaseConfig));


    } catch (err) {
      console.error("Error:", err);
      try {
        // Try to parse error as JSON to extract message
        const errorText =
          (err as any)?.message || (err as any)?.toString() || "";
        const errorData = JSON.parse(errorText);
        setError(errorData.message || "Failed to connect to server");
      } catch {
        // If not JSON, use the original error message
        //@ts-ignore
        setError(err?.message || "Failed to connect to server");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinue = () => {
    if (!accessToken) return;
    const selected = projects.find((p) => p.id === selectedProjectId);
    const payload = {
      success: true,
      accessToken,
      projects: selected ? [selected] : [],
    };
    const payloadString = JSON.stringify(payload);
    onSelect(payloadString);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Step Guide */}
      <Dialog open={showGuide} onOpenChange={setShowGuide}>
        <DialogContent className="sm:max-w-[600px] bg-white text-gray-900 border border-gray-200">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              Get Your Supabase Access Token
            </DialogTitle>
            <DialogDescription className="text-gray-500">
              Follow these simple steps to generate and copy your Supabase
              token.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4 max-h-[70vh] overflow-y-auto">
            <ol className="list-decimal list-inside space-y-4 text-sm text-gray-700">
              <li>
                Open{" "}
                <a
                  href="https://supabase.com/dashboard/account/tokens"
                  target="_blank"
                  className="text-emerald-600 hover:text-emerald-700 underline"
                >
                  Supabase Access Tokens
                </a>{" "}
                in a new tab.
              </li>
              <li>Click “Generate new token”.</li>
              <li>Name it something like “CodePup AI Token”.</li>
              <li>
                Click “Generate” and copy the token (starts with{" "}
                <code>sbp_</code>).
              </li>
              <li>Paste it below to connect your account.</li>
            </ol>
            <button
              onClick={() => setShowGuide(false)}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 rounded-lg transition-all"
            >
              Done, Go Back
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Main Dialog */}
      <DialogContent className="sm:max-w-[600px] bg-white text-gray-900 border border-gray-200">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Connect Supabase
          </DialogTitle>
          <DialogDescription className="text-gray-500">
            Link your Supabase project with{" "}
            <span className="font-semibold text-gray-900">CodePup AI</span>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* Token Input */}
          <div>
            <div className="flex items-center gap-3 mb-2">
              <label
                htmlFor="accessToken"
                className="block text-sm font-medium text-gray-700"
              >
                Supabase Access Token
              </label>

              <button
                onClick={() => setShowGuide(true)}
                className="text-[13px] text-gray-500 hover:text-gray-700 underline underline-offset-2 flex items-center gap-1.5 transition-colors"
              >
                Guide
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="w-3.5 h-3.5"
                >
                  <circle cx="10" cy="10" r="9" />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8.8 8.2a2 2 0 113.2 1.7c-.7.5-1 .8-1 1.6v.2m-.1 2h.01"
                  />
                </svg>
              </button>
            </div>

            <input
              id="accessToken"
              type="password"
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
              placeholder="sbp_•••••••••••••••"
              className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <p className="text-xs text-gray-400 mt-1">
              Stored securely for linking Supabase APIs.
            </p>
          </div>

          {/* Error / Success Messages */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg px-3 py-2 text-sm">
              Connected successfully. Projects loaded.
            </div>
          )}

          {/* Buttons */}
          <button
            onClick={submit}
            disabled={isLoading || !accessToken}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <svg
                  className="animate-spin h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.3 0 0 5.3 0 12h4z"
                  />
                </svg>
                Connecting...
              </>
            ) : (
              "Connect with Supabase"
            )}
          </button>

          {/* Projects + Orgs (after connection) */}
          {projects.length > 0 && (
            <div className="space-y-4 pt-2">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Select Project
                </label>
                <div className="max-h-48 overflow-y-auto mt-2 space-y-2">
                  {projects.map((p) => (
                    <label
                      key={p.id}
                      className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="project"
                        value={p.id}
                        checked={selectedProjectId === p.id}
                        onChange={() => setSelectedProjectId(p.id)}
                        className="h-4 w-4"
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {p.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {p.region} • {p.status}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <button
                onClick={handleContinue}
                disabled={!selectedProjectId}
                className="w-full bg-gray-900 hover:bg-black text-white font-semibold py-2.5 rounded-lg transition-all disabled:opacity-50"
              >
                Continue
              </button>
            </div>
          )}
        </div>

        <DialogFooter className=" flex items-center justify-between">
          <a
            href="https://supabase.com/docs"
            target="_blank"
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Supabase Docs
          </a>
          <button
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Close
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default SupabaseConnection;

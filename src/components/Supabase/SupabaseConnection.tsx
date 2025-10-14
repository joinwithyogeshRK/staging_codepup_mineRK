import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useAuth, useUser } from "@clerk/clerk-react";
import { useSupabaseCredentialsStore } from "@/store/supabaseCredentials";
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
  // Optional: prefilled token from user data
  defaultAccessToken?: string;
  // Optional: auto submit when open and token available (default true)
  autoSubmit?: boolean;
}

function SupabaseConnection({
  open,
  onOpenChange,
  onSelect,
  defaultAccessToken,
  autoSubmit = true,
}: SupabaseConnectionProps) {
  const [accessToken, setAccessToken] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<any>(null);
  const [showGuide, setShowGuide] = useState(false);
  const [showProjectLimitGuide, setShowProjectLimitGuide] = useState(false);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");

  const API_BASE_URL = import.meta.env.VITE_BASE_URL;
  const { getToken } = useAuth();
  const { user } = useUser();
  const { setAccessToken: setAccessTokenInStore, setProjectCredentials } = useSupabaseCredentialsStore();

  const submit = async () => {
    setError(null);
    setSuccess(null);
    setIsLoading(true);
    setShowProjectLimitGuide(false);

    try {
      if (!accessToken) throw new Error("Access token required");
      const token = await getToken();

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

      const data = await res.json();

      // Handle Supabase "max project limit" case
      if (data?.action === "delete_required") {
        setError(data.message || "⚠️ Maximum project limit reached.");
        setProjects(data.projects || []);
        setShowProjectLimitGuide(true);
        setIsLoading(false);
        return;
      }

      if (!res.ok || !data?.success || !data?.supabaseProject) {
        throw new Error(data?.error || "Failed to connect with Supabase");
      }

      // Save token in memory store
      setAccessTokenInStore(accessToken);

      try {
        await axios.post(
          `${API_BASE_URL}/api/users`,
          {
            supabaseToken: accessToken,
            clerkId: user?.id,
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } catch {
        // Ignore if user already exists
      }

      // Store minimal project info for selection
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
      setSuccess({ ok: true });

      // Store project credentials in memory store
      setProjectCredentials({
        supabaseUrl: data.supabaseProject.credentials.supabaseUrl,
        supabaseAnonKey: data.supabaseProject.credentials.supabaseAnonKey,
        databaseUrl: data.supabaseProject.credentials.databaseUrl,
      });

      // Continue automatically
      const payloadString = JSON.stringify({
        success: true,
        accessToken,
        supabaseProject: data.supabaseProject,
      });
      onSelect(payloadString);
      onOpenChange(false);
    } catch (err: any) {
      try {
        const errorData = JSON.parse(err.message || "{}");
        setError(errorData.message || "Failed to connect to server");
      } catch {
        setError(err?.message || "Failed to connect to server");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Prefill the access token when dialog opens
  useEffect(() => {
    if (open && defaultAccessToken) {
      setAccessToken(defaultAccessToken);
    }
  }, [open, defaultAccessToken]);

  // Guard to prevent duplicate auto submissions
  const hasAutoSubmittedRef = useRef(false);

  // Reset guard when dialog closes
  useEffect(() => {
    if (!open) {
      hasAutoSubmittedRef.current = false;
    }
  }, [open]);

  // Auto-submit once after token is set
  useEffect(() => {
    if (!open) return;
    if (!autoSubmit) return;
    if (!accessToken) return;
    if (isLoading) return;
    if (hasAutoSubmittedRef.current) return;

    hasAutoSubmittedRef.current = true;
    submit().catch(() => {
      // Allow manual retry if auto-submit fails
      hasAutoSubmittedRef.current = false;
    });
  }, [open, autoSubmit, accessToken, isLoading]);

  const handleContinue = () => {
    if (!accessToken) return;
    const selected = projects.find((p) => p.id === selectedProjectId);
    const payload = {
      success: true,
      accessToken,
      projects: selected ? [selected] : [],
    };
    onSelect(JSON.stringify(payload));
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Access Token Guide */}
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

      {/* Project Limit Guide */}
      <Dialog
        open={showProjectLimitGuide}
        onOpenChange={setShowProjectLimitGuide}
      >
        <DialogContent className="sm:max-w-[600px] bg-white text-gray-900 border border-gray-200">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-red-600">
              Supabase Project Limit Reached
            </DialogTitle>
            <DialogDescription className="text-gray-500">
              ⚠️ You’ve reached the maximum project limit. Please delete one of
              your existing projects before proceeding.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4 max-h-[70vh] overflow-y-auto">
            {projects.length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-2">
                  Your Current Projects:
                </h3>
                <ul className="space-y-2">
                  {projects.map((p) => (
                    <li
                      key={p.id}
                      className="border border-gray-200 rounded-lg p-3 text-sm flex justify-between items-center"
                    >
                      <div>
                        <p className="font-semibold text-gray-900">{p.name}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <ol className="list-decimal list-inside space-y-3 text-sm text-gray-700 mt-4">
              <li>
                Visit your{" "}
                <a
                  href="https://supabase.com/dashboard/projects"
                  target="_blank"
                  className="text-emerald-600 hover:text-emerald-700 underline"
                >
                  Supabase Dashboard
                </a>
                .
              </li>
              <li>Select the project you want to delete.</li>
              <li>Click the ⚙️ icon from the left sidebar.</li>
              <li>
                Scroll to the <strong>Danger Zone</strong> section.
              </li>
              <li>
                Click <strong>Delete Project</strong> and confirm.
              </li>
              <li>Return here and click retry once deleted.</li>
            </ol>

            <button
              onClick={() => {
                setShowProjectLimitGuide(false);
                // Wait a moment to let dialog close visually, then retry
                setTimeout(() => {
                  submit().catch(() => {});
                }, 300);
              }}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 rounded-lg transition-all"
            >
              Done, Retry Connection
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

          {/* Error / Success */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 text-sm">
              {error}
              {error.includes("limit") && (
                <button
                  onClick={() => setShowProjectLimitGuide(true)}
                  className="ml-2 underline text-red-600 text-xs"
                >
                  View Deletion Guide →
                </button>
              )}
            </div>
          )}

          {success && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg px-3 py-2 text-sm">
              Connected successfully. Projects loaded.
            </div>
          )}

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

          {projects.length > 0 && success && (
            <div className="space-y-4 pt-2">
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

        <DialogFooter className="flex items-center justify-between">
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

import { useState } from "react";
import accessTokenImg from "./assets/accessToken.png";
import generateTokenImg from "./assets/generateToken.png";
import createTokenImg from "./assets/createToken.png";
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

function SupabaseConnection({ open, onOpenChange, onSelect }: SupabaseConnectionProps) {
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

  const handleClick = () => {
    window.open(
      "https://supabase.com/dashboard/account/tokens",
      "_blank",
      "noopener,noreferrer"
    );
  };

  const openSupabaseDashboard = () => {
    window.open(
      "https://supabase.com/dashboard/projects",
      "_blank",
      "noopener,noreferrer"
    );
  };

  const submit = async () => {
    setError(null);
    setSuccess(null);
    setIsLoading(true);
    setShowProjectLimitError(false);

    try {
      if (!accessToken) throw new Error("Access token required");

      // Hit backend to mint Supabase credentials and (optionally) project
      const res = await fetch(`${API_BASE_URL}/api/supabase/getCredentials`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ accessToken, projectName: "codePup", forceCreate: false }),
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || "Failed to connect with Supabase");
      }
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
      setSelectedProjectId(data.supabaseProject.projectRef || data.supabaseProject.name);
      setSuccess({ ok: true } as any);

      // Immediately continue with selected since we got exact project + creds
      const payloadString = JSON.stringify({
        success: true,
        accessToken,
        supabaseProject: data.supabaseProject,
      });
      onSelect(payloadString);
      onOpenChange(false);
    } catch (err) {
      console.error("Error:", err);
      try {
        // Try to parse error as JSON to extract message
        const errorText = (err as any)?.message || (err as any)?.toString() || "";
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

  const handleCreateProject = async () => {
    if (!accessToken) return setError("Access token required");
    if (!selectedOrgId) return setError("Select an organization first");
    setError(null);
    setCreating(true);
    try {
      const res = await fetch(`https://api.supabase.com/v1/projects`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          db_pass: "Codepup123",
          name: newProjectName || "Codepup",
          organization_id: selectedOrgId,
          region: "ap-south-1",
        }),
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || "Failed to create project");
      }
      const created = await res.json();
      const newProj = created?.project || created;
      setProjects((prev) => [newProj, ...prev]);
      setSelectedProjectId(newProj.id);
    } catch (e) {
      try {
        // Try to parse error as JSON to extract message
        const errorText = (e as any)?.message || (e as any)?.toString() || "";
        const errorData = JSON.parse(errorText);
        setError(errorData.message || "Failed to create project");
      } catch {
        // If not JSON, use the original error message
        // @ts-ignore
        setError(e?.message || "Failed to create project");
      }
    } finally {
      setCreating(false);
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
      {/* Guide Modal as nested dialog */}
      <Dialog open={showGuide} onOpenChange={setShowGuide}>
        <DialogContent className="sm:max-w-[720px] bg-white text-gray-900 border border-gray-200">
          <DialogHeader>
            <DialogTitle className="text-2xl">How to Get Your Access Token</DialogTitle>
            <DialogDescription className="text-gray-500">
              Follow these steps to generate and copy your Supabase access token.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[70vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <div />
              <button onClick={() => setShowGuide(false)} className="text-gray-500 hover:text-gray-700 transition-colors">Close</button>
            </div>

            <div className="space-y-6">
              {/* Step 1 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-black font-bold text-lg">
                  1
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">
                    Click "Generate Token on Supabase"
                  </h4>
                  <p className="text-gray-600 mb-3">
                    Click the button below to open the Supabase Access Tokens
                    page in a new tab.
                  </p>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-sm text-emerald-600">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                        />
                      </svg>
                      <button>
                        Opens: supabase.com/dashboard/account/tokens
                      </button>
                    </div>
                  </div>

                  {/* Image: Access Token Page */}
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-black font-bold text-lg">
                  2
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">
                    Click "Generate new token"
                  </h4>
                  <p className="text-gray-600 mb-3">
                    On the Supabase Access Tokens page, look for and click the
                    green "Generate new token" button to start creating a new
                    access token.
                  </p>
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                    <p className="text-emerald-700 text-sm flex items-center gap-2">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      Look for the green "Generate new token" button
                    </p>
                  </div>

                  {/* Image: Generate new token button */}
                  <img
                    src={generateTokenImg}
                    alt="Generate new token button"
                    className="mt-4 w-full rounded-xl border border-gray-200 shadow-sm object-contain"
                  />
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-black font-bold text-lg">
                  3
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">
                    Provide a Name for Your Token
                  </h4>
                  <p className="text-gray-600 mb-3">
                    A dialog will appear asking "Provide a name for your token".
                    Enter any descriptive name you prefer (e.g., "CodePup AI
                    Token").
                  </p>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <div className="text-gray-500 text-xs mb-1">Example:</div>
                    <input
                      type="text"
                      placeholder="CodePup AI Token"
                      disabled
                      className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-gray-500 text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Step 4 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-black font-bold text-lg">
                  4
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">
                    Click "Generate token"
                  </h4>
                  <p className="text-gray-600 mb-3">
                    After entering the name, click the "Generate token" button.
                    Supabase will create your new access token.
                  </p>

                  {/* Image: Generate token final screen */}
                  <img
                    src={createTokenImg}
                    alt="Generate token confirmation"
                    className="mt-4 w-full rounded-xl border border-gray-200 shadow-sm object-contain"
                  />
                </div>
              </div>

              {/* Step 5 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-black font-bold text-lg">
                  5
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">
                    Copy the Token
                  </h4>
                  <p className="text-gray-600 mb-3">
                    You'll see a success message with your newly generated token
                    (starts with "sbp_"). Click the "Copy" button to copy it to
                    your clipboard.
                  </p>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <img
                      src={accessTokenImg}
                      alt="Supabase Access Tokens page"
                      className="mt-4 w-full rounded-xl border border-gray-200 shadow-sm object-contain"
                    />
                    <p className="text-yellow-700 text-sm flex items-start gap-2">
                      <svg
                        className="w-4 h-4 mt-0.5 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        />
                      </svg>

                      <span>
                        Important: Copy this token immediately! You won't be
                        able to see it again. Store it in a secure place.
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Step 6 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-black font-bold text-lg">
                  6
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-white mb-2">
                    Paste and Connect
                  </h4>
                  <p className="text-gray-400 mb-3">
                    Return to this page, paste the token in the Access Token
                    field, and click "Connect with Supabase".
                  </p>
                  <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3">
                    <p className="text-emerald-400 text-sm">
                      ✓ Your CodePup AI project will be linked to Supabase
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowGuide(false)}
              className="mt-6 w-full bg-gray-900 hover:bg-black text-white font-semibold py-3 rounded-lg transition-all"
            >
              Got it! Let's Get Started
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <DialogContent className="sm:max-w-[720px] bg-white text-gray-900 border border-gray-200">
        <DialogHeader>
          <DialogTitle className="text-2xl">Connect Your Supabase Account</DialogTitle>
          <DialogDescription className="text-gray-500">
            Link your Supabase project to <span className="font-semibold text-gray-900">CodePup AI</span> for authentication and database features.
          </DialogDescription>
        </DialogHeader>

        <div className="w-full">
        {/* Header Section */}
          <div className="mb-4">
            <div className="mb-2 bg-emerald-50 border border-emerald-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex-1">
                  <p className="text-gray-700 text-sm mb-2">Need help getting your access token from Supabase?</p>
                  <button onClick={() => setShowGuide(true)} className="text-emerald-700 hover:text-emerald-800 text-sm font-semibold underline transition-colors">
                    View Step-by-Step Guide
                  </button>
                </div>
              </div>
            </div>
          </div>
        

        {/* Main Content Card */}
          <div className="rounded-xl overflow-hidden">
            <div className="pb-0">
            {/* Help Banner */}
            {/* Generate Token Button */}
            <div className="mb-6">
              <button
                onClick={handleClick}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3.5 px-4 rounded-lg text-base transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
                Generate Token on Supabase
              </button>
            </div>

            {/* Divider */}
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">
                  Then paste your token below
                </span>
              </div>
            </div>

            {/* Access Token Input */}
            <div className="mb-6">
              <label
                htmlFor="accessToken"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Access Token
              </label>
              <input
                id="accessToken"
                type="password"
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                placeholder="sbp_••••••••••••••••••••"
                className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Error Display */}
            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="flex-1">
                    <p className="text-red-700 text-sm font-medium">{error}</p>
                    {showProjectLimitError && (
                      <button
                        onClick={openSupabaseDashboard}
                        className="mt-2 text-sm text-red-700 hover:text-red-800 underline transition-colors"
                      >
                        Manage your projects
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Success Display */}
            {success && (
              <div className="mb-6 bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-emerald-800 text-sm">
                Connected. Organizations and projects loaded.
              </div>
            )}

            {/* Connect Button */}
            <button
              onClick={submit}
              disabled={isLoading || !accessToken}
              className="w-full bg-gray-900 hover:bg-black text-white font-semibold py-3.5 px-4 rounded-lg text-base transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-gray-900 flex items-center justify-center gap-2 shadow-sm"
            >
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5"
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
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  <span>Connecting to Supabase...</span>
                </>
              ) : (
                <>
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                  Connect with Supabase
                </>
              )}
            </button>

            <p className="text-center text-gray-500 text-xs mt-4">
              Your access token will be securely stored and used only for
              authentication
            </p>

            {/* Organization selector and create project */}
            {organizations.length > 0 && (
              <div className="mt-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Organization</label>
                    <select
                      value={selectedOrgId}
                      onChange={(e) => setSelectedOrgId(e.target.value)}
                      className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    >
                      {organizations.map((o) => (
                        <option key={o.id || o.organization_id} value={o.id || o.organization_id}>
                          {o.name || o.slug || o.id}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">New Project Name</label>
                    <input
                      value={newProjectName}
                      onChange={(e) => setNewProjectName(e.target.value)}
                      className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm"
                      placeholder="Codepup"
                    />
                    <p className="mt-1 text-xs text-gray-500">Password defaults to Codepup123 • Region ap-south-1</p>
                  </div>
                </div>
                <button
                  onClick={handleCreateProject}
                  disabled={creating}
                  className="mt-3 w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-lg disabled:opacity-50"
                >
                  {creating ? "Creating project..." : "Create new project"}
                </button>
              </div>
            )}

            {projects.length > 0 && (
              <div className="mt-6">
                <div className="mb-2 text-sm font-medium text-gray-700">Select a project</div>
                <div className="max-h-56 overflow-y-auto space-y-2">
                  {projects.map((p) => (
                    <label key={p.id} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="radio"
                        name="project"
                        value={p.id}
                        checked={selectedProjectId === p.id}
                        onChange={() => setSelectedProjectId(p.id)}
                        className="h-4 w-4"
                      />
                      <div className="flex-1">
                        <div className="text-sm text-gray-900 font-medium">{p.name}</div>
                        <div className="text-xs text-gray-500">{p.id} • {p.region} • {p.status}</div>
                      </div>
                    </label>
                  ))}
                </div>
                <button
                  onClick={handleContinue}
                  disabled={!selectedProjectId}
                  className="mt-4 w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-lg disabled:opacity-50"
                >
                  Continue with selected project
                </button>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="mt-6 flex items-center justify-center gap-6">
            <a
              href="https://supabase.com/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 text-sm transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              View Documentation
            </a>
            <span className="text-gray-300">•</span>
            <a
              href="https://supabase.com/dashboard/projects"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 text-sm transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              My Projects
            </a>
          </div>
        </div>
        </div>

        <DialogFooter>
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

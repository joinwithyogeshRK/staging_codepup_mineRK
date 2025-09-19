// SupabaseConfigForm.tsx
import React, { useState, useCallback, useEffect } from "react";
import {
  Database,
  Eye,
  EyeOff,
  Info,
  X,
  Save,
  Wand2,
  Loader2,
  Trash2,
  AlertTriangle,
} from "lucide-react";

interface SupabaseConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  supabaseToken: string;
  databaseUrl: string;
}

interface SupabaseConfigFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (config: SupabaseConfig) => void;
  initialConfig?: Partial<SupabaseConfig>;
}

interface FormErrors {
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  supabaseToken?: string;
  databaseUrl?: string;
  accessToken?: string;
  projectId?: string;
}

interface ProjectInfo {
  id: string;
  name: string;
  status: string;
  created_at: string;
  region: string;
  url: string;
  ref?: string;
}

interface ProjectLimitResponse {
  success: false;
  error: string;
  projectCount: number;
  maxProjects: number;
  projects: ProjectInfo[];
  message: string;
  action: string;
}

interface CredentialsResponse {
  success: true;
  supabaseProject: {
    name: string;
    url: string;
    projectRef: string;
    databaseUrl: string;
    credentials: {
      projectRef: string;
      supabaseUrl: string;
      supabaseAnonKey: string;
      databaseUrl: string;
      databasePassword: string;
      poolerUrl?: string;
      transactionUrl?: string;
    };
  };
  projectCount: number;
  maxProjects: number;
  message: string;
}

const SupabaseConfigForm: React.FC<SupabaseConfigFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialConfig = {},
}) => {
  const [config, setConfig] = useState<SupabaseConfig>({
    supabaseUrl: initialConfig.supabaseUrl || "",
    supabaseAnonKey: initialConfig.supabaseAnonKey || "",
    supabaseToken: initialConfig.supabaseToken || "",
    databaseUrl: initialConfig.databaseUrl || "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [showSecrets, setShowSecrets] = useState({
    supabaseToken: false,
    supabaseAnonKey: false,
    databaseUrl: false,
    accessToken: false,
  });

  // Auto-setup states
  const [accessToken, setAccessToken] = useState("");
  const [isAutoFetching, setIsAutoFetching] = useState(false);
  const [showProjectLimit, setShowProjectLimit] = useState(false);
  const [limitProjects, setLimitProjects] = useState<ProjectInfo[]>([]);
  const [projectIdToDelete, setProjectIdToDelete] = useState("");
  const [isDeletingProject, setIsDeletingProject] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    if (isOpen) {
      const stored = localStorage.getItem("supabaseConfig");
      if (stored) {
        try {
          const parsedConfig = JSON.parse(stored);
          setConfig((prev) => ({
            ...prev,
            ...parsedConfig,
          }));
        } catch (error) {
        }
      }

      // Load stored access token
      const storedToken = localStorage.getItem("supabaseAccessToken");
      if (storedToken) {
        setAccessToken(storedToken);
      }
    }
  }, [isOpen]);

  // Validation functions
  const validateUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const validateSupabaseUrl = (url: string): boolean => {
    return url.includes("supabase.co") && validateUrl(url);
  };

  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {};

    if (!config.supabaseUrl.trim()) {
      newErrors.supabaseUrl = "Supabase URL is required";
    } else if (!validateSupabaseUrl(config.supabaseUrl)) {
      newErrors.supabaseUrl =
        "Please enter a valid Supabase URL (e.g., https://xxx.supabase.co)";
    }

    if (!config.supabaseAnonKey.trim()) {
      newErrors.supabaseAnonKey = "Supabase Anon Key is required";
    } else if (config.supabaseAnonKey.length < 20) {
      newErrors.supabaseAnonKey = "Supabase Anon Key appears to be too short";
    }

    if (!config.supabaseToken.trim()) {
      newErrors.supabaseToken = "Supabase Service Role Token is required";
    } else if (config.supabaseToken.length < 20) {
      newErrors.supabaseToken = "Service Role Token appears to be too short";
    }

    if (!config.databaseUrl.trim()) {
      newErrors.databaseUrl = "Database URL is required";
    } else if (
      !config.databaseUrl.startsWith("postgresql://") &&
      !config.databaseUrl.startsWith("postgres://")
    ) {
      newErrors.databaseUrl =
        "Please enter a valid PostgreSQL connection string";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [config]);

  const handleInputChange = useCallback(
    (field: keyof SupabaseConfig, value: string) => {
      setConfig((prev) => ({
        ...prev,
        [field]: value,
      }));

      // Clear field error when user starts typing
      if (errors[field]) {
        setErrors((prev) => ({
          ...prev,
          [field]: undefined,
        }));
      }
    },
    [errors]
  );

  const toggleSecretVisibility = useCallback(
    (field: keyof typeof showSecrets) => {
      setShowSecrets((prev) => ({
        ...prev,
        [field]: !prev[field],
      }));
    },
    []
  );

  const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

  // Auto-fetch credentials function
  const handleAutoFetchCredentials = async () => {
    if (!accessToken.trim()) {
      setErrors((prev) => ({
        ...prev,
        accessToken: "Access token is required",
      }));
      return;
    }

    setIsAutoFetching(true);
    setErrors((prev) => ({ ...prev, accessToken: undefined }));

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/supabase/getCredentials`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            accessToken,
            projectName: "codePup",
            forceCreate: false,
          }),
        }
      );

      // Check if response is ok and has content
      if (!response.ok) {
        let errorData;
        const contentType = response.headers.get("content-type");

        if (contentType && contentType.includes("application/json")) {
          try {
            errorData = await response.json();
          } catch (jsonError) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
        } else {
          const textData = await response.text();
          throw new Error(
            textData || `HTTP ${response.status}: ${response.statusText}`
          );
        }

        if (response.status === 409 && errorData.action === "delete_required") {
          // Show project limit UI
          const limitData = errorData as ProjectLimitResponse;
          setLimitProjects(limitData.projects || []);
          setShowProjectLimit(true);
          setErrors((prev) => ({
            ...prev,
            accessToken: limitData.message || "Project limit reached",
          }));
          return;
        } else {
          throw new Error(
            errorData?.details ||
              errorData?.error ||
              `HTTP ${response.status}: Request failed`
          );
        }
      }

      // Parse successful response
      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        throw new Error("Invalid response format from server");
      }

      if (!data.success) {
        throw new Error(data.details || data.error || "Unknown error occurred");
      }

      // Success - populate the form
      const credentialsData = data as CredentialsResponse;
      const { credentials } = credentialsData.supabaseProject;

      if (!credentials) {
        throw new Error("No credentials received from server");
      }

      setConfig({
        supabaseUrl: credentials.supabaseUrl || "",
        supabaseAnonKey: credentials.supabaseAnonKey || "",
        supabaseToken: accessToken, // Use the access token as service role token
        databaseUrl: credentials.databaseUrl || credentials.poolerUrl || "",
      });

      // Save access token for future use
      localStorage.setItem("supabaseAccessToken", accessToken);

      setErrors({});
      setShowProjectLimit(false);
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        accessToken:
          error instanceof Error ? error.message : "Unknown error occurred",
      }));
    } finally {
      setIsAutoFetching(false);
    }
  };

  // Delete project function

  const handleDeleteProject = async () => {
    if (!projectIdToDelete.trim()) {
      setErrors((prev) => ({ ...prev, projectId: "Project ID is required" }));
      return;
    }

    setIsDeletingProject(true);
    setErrors((prev) => ({ ...prev, projectId: undefined }));

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/supabase/deleteProject/${projectIdToDelete}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            accessToken,
          }),
        }
      );

      // Check if response is ok and has content
      if (!response.ok) {
        let errorData;
        const contentType = response.headers.get("content-type");

        if (contentType && contentType.includes("application/json")) {
          try {
            errorData = await response.json();
          } catch (jsonError) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
        } else {
          const textData = await response.text();
          throw new Error(
            textData || `HTTP ${response.status}: ${response.statusText}`
          );
        }

        throw new Error(
          errorData?.details ||
            errorData?.error ||
            `HTTP ${response.status}: Request failed`
        );
      }

      // Parse successful response
      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        throw new Error("Invalid response format from server");
      }

      if (!data.success) {
        throw new Error(
          data.details || data.error || "Delete operation failed"
        );
      }

      // Success - hide project limit UI and reset
      setShowProjectLimit(false);
      setProjectIdToDelete("");
      setLimitProjects([]);
      setErrors((prev) => ({
        ...prev,
        accessToken: undefined,
        projectId: undefined,
      }));

      // Show success message
      alert(
        "✅ Project deleted successfully! You can now retry fetching credentials."
      );
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        projectId:
          error instanceof Error ? error.message : "Unknown error occurred",
      }));
    } finally {
      setIsDeletingProject(false);
    }
  };

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      if (!validateForm()) {
        return;
      }

      // Save to localStorage
      localStorage.setItem("supabaseConfig", JSON.stringify(config));

      // Submit to parent
      onSubmit(config);
      onClose();
    },
    [config, validateForm, onSubmit, onClose]
  );

  const loadExampleData = useCallback(() => {
    setConfig({
      supabaseUrl: "https://your-project.supabase.co",
      supabaseAnonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      supabaseToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      databaseUrl:
        "postgresql://postgres:[password]@db.your-project.supabase.co:5432/postgres",
    });
  }, []);

  if (!isOpen) return null;

  return (
    <div className="supabase-modal-overlay">
      <div className="supabase-modal-container">
        {/* Header */}
        <div className="supabase-modal-header">
          <div className="supabase-modal-header-content">
            <div className="supabase-modal-header-icon-container">
              <Database className="supabase-modal-header-icon" />
            </div>
            <div>
              <h2 className="supabase-modal-title">Supabase Configuration</h2>
              <p className="supabase-modal-subtitle">
                Configure your backend connection
              </p>
            </div>
          </div>
          <button onClick={onClose} className="supabase-modal-close-button">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="supabase-form-container">
          {/* Auto-setup Section */}
          <div className="supabase-auto-setup-section">
            <div className="supabase-auto-setup-header">
              <Wand2 className="supabase-auto-setup-icon" />
              <div>
                <h3 className="supabase-auto-setup-title">
                  Auto-Setup Backend
                </h3>
                <p className="supabase-auto-setup-description">
                  Enter your Supabase access token to automatically fetch and
                  configure credentials
                </p>
              </div>
            </div>

            <div className="supabase-auto-setup-content">
              <div>
                <label className="supabase-form-label">
                  Supabase Access Token
                </label>
                <div className="supabase-input-container">
                  <input
                    type={showSecrets.accessToken ? "text" : "password"}
                    value={accessToken}
                    onChange={(e) => {
                      setAccessToken(e.target.value);
                      if (errors.accessToken) {
                        setErrors((prev) => ({
                          ...prev,
                          accessToken: undefined,
                        }));
                      }
                    }}
                    placeholder="Enter your Supabase access token..."
                    className={`supabase-form-input supabase-form-input-with-icon ${
                      errors.accessToken
                        ? "supabase-form-input-error"
                        : "supabase-form-input-normal"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => toggleSecretVisibility("accessToken")}
                    className="supabase-input-icon-button"
                  >
                    {showSecrets.accessToken ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {errors.accessToken && (
                  <p className="supabase-error-message">{errors.accessToken}</p>
                )}
              </div>

              <button
                type="button"
                onClick={handleAutoFetchCredentials}
                disabled={isAutoFetching || !accessToken.trim()}
                className="supabase-auto-fetch-button"
              >
                {isAutoFetching ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Fetching Credentials...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4" />
                    Auto-Fetch Credentials
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Project Limit Section */}
          {showProjectLimit && (
            <div className="supabase-project-limit-section">
              <div className="supabase-project-limit-header">
                <AlertTriangle className="supabase-project-limit-icon" />
                <div>
                  <h3 className="supabase-project-limit-title">
                    Project Limit Reached
                  </h3>
                  <p className="supabase-project-limit-description">
                    You have reached the maximum project limit. Delete a project
                    to continue.
                  </p>
                </div>
              </div>

              <div className="supabase-project-limit-content">
                <div>
                  <label className="supabase-form-label">
                    Existing Projects:
                  </label>
                  <div className="supabase-project-list">
                    {limitProjects.map((project) => (
                      <div key={project.id} className="supabase-project-item">
                        <div className="supabase-project-info">
                          <p className="supabase-project-name">
                            {project.name}
                          </p>
                          <p className="supabase-project-detail">
                            ID: {project.id}
                          </p>
                          <p className="supabase-project-detail">
                            Status: {project.status}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="supabase-form-label">
                    Project ID to Delete
                  </label>
                  <input
                    type="text"
                    value={projectIdToDelete}
                    onChange={(e) => {
                      setProjectIdToDelete(e.target.value);
                      if (errors.projectId) {
                        setErrors((prev) => ({
                          ...prev,
                          projectId: undefined,
                        }));
                      }
                    }}
                    placeholder="Enter project ID to delete..."
                    className={`supabase-form-input ${
                      errors.projectId
                        ? "supabase-form-input-error"
                        : "supabase-form-input-normal"
                    }`}
                  />
                  {errors.projectId && (
                    <p className="supabase-error-message">{errors.projectId}</p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleDeleteProject}
                  disabled={isDeletingProject || !projectIdToDelete.trim()}
                  className="supabase-delete-project-button"
                >
                  {isDeletingProject ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Deleting Project...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Delete Project
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Manual Configuration Section */}
          <div className="supabase-manual-config-section">
            <div className="supabase-manual-config-divider">
              <h3 className="supabase-manual-config-title">
                Manual Configuration
              </h3>

              {/* Supabase URL */}
              <div>
                <label className="supabase-form-label">
                  Supabase Project URL *
                </label>
                <input
                  type="url"
                  value={config.supabaseUrl}
                  onChange={(e) =>
                    handleInputChange("supabaseUrl", e.target.value)
                  }
                  placeholder="https://your-project.supabase.co"
                  className={`supabase-form-input ${
                    errors.supabaseUrl
                      ? "supabase-form-input-error"
                      : "supabase-form-input-normal"
                  }`}
                />
                {errors.supabaseUrl && (
                  <p className="supabase-error-message">{errors.supabaseUrl}</p>
                )}
              </div>

              {/* Anon Key */}
              <div>
                <label className="supabase-form-label">
                  Anon Key (Public) *
                </label>
                <div className="supabase-input-container">
                  <input
                    type={showSecrets.supabaseAnonKey ? "text" : "password"}
                    value={config.supabaseAnonKey}
                    onChange={(e) =>
                      handleInputChange("supabaseAnonKey", e.target.value)
                    }
                    placeholder="eyJhbGciOiJIUzI1NiIs..."
                    className={`supabase-form-input supabase-form-input-with-icon ${
                      errors.supabaseAnonKey
                        ? "supabase-form-input-error"
                        : "supabase-form-input-normal"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => toggleSecretVisibility("supabaseAnonKey")}
                    className="supabase-input-icon-button"
                  >
                    {showSecrets.supabaseAnonKey ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {errors.supabaseAnonKey && (
                  <p className="supabase-error-message">
                    {errors.supabaseAnonKey}
                  </p>
                )}
              </div>

              {/* Service Role Token */}
              <div>
                <label className="supabase-form-label">
                  Service Role Token *
                </label>
                <div className="supabase-input-container">
                  <input
                    type={showSecrets.supabaseToken ? "text" : "password"}
                    value={config.supabaseToken}
                    onChange={(e) =>
                      handleInputChange("supabaseToken", e.target.value)
                    }
                    placeholder="eyJhbGciOiJIUzI1NiIs..."
                    className={`supabase-form-input supabase-form-input-with-icon ${
                      errors.supabaseToken
                        ? "supabase-form-input-error"
                        : "supabase-form-input-normal"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => toggleSecretVisibility("supabaseToken")}
                    className="supabase-input-icon-button"
                  >
                    {showSecrets.supabaseToken ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {errors.supabaseToken && (
                  <p className="supabase-error-message">
                    {errors.supabaseToken}
                  </p>
                )}
              </div>

              {/* Database URL */}
              <div>
                <label className="supabase-form-label">
                  Database Connection URL *
                </label>
                <div className="supabase-input-container">
                  <input
                    type={showSecrets.databaseUrl ? "text" : "password"}
                    value={config.databaseUrl}
                    onChange={(e) =>
                      handleInputChange("databaseUrl", e.target.value)
                    }
                    placeholder="postgresql://postgres:[password]@db.your-project.supabase.co:5432/postgres"
                    className={`supabase-form-input supabase-form-input-with-icon ${
                      errors.databaseUrl
                        ? "supabase-form-input-error"
                        : "supabase-form-input-normal"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => toggleSecretVisibility("databaseUrl")}
                    className="supabase-input-icon-button"
                  >
                    {showSecrets.databaseUrl ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {errors.databaseUrl && (
                  <p className="supabase-error-message">{errors.databaseUrl}</p>
                )}
              </div>
            </div>
          </div>

          {/* Help Text */}
          <div className="supabase-help-section">
            <div className="supabase-help-content">
              <Info className="supabase-help-icon" />
              <div className="supabase-help-text">
                <p className="supabase-help-title">
                  Where to find these values:
                </p>
                <ul className="supabase-help-list">
                  <li>• Go to your Supabase project dashboard</li>
                  <li>• Navigate to Settings → API</li>
                  <li>• Copy the Project URL and anon public key</li>
                  <li>
                    • For Service Role key, use the service_role secret key
                  </li>
                  <li>• Database URL is in Settings → Database</li>
                  <li>
                    • Access Token can be generated from your Supabase account
                    settings
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="supabase-actions-container">
            <button
              type="button"
              onClick={loadExampleData}
              className="supabase-load-example-button"
            >
              Load Example
            </button>

            <div className="supabase-actions-group">
              <button
                type="button"
                onClick={onClose}
                className="supabase-cancel-button"
              >
                Cancel
              </button>

              <button type="submit" className="supabase-save-button">
                <Save className="w-4 h-4" />
                Save Configuration
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SupabaseConfigForm;

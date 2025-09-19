import React, { useState, useEffect } from "react";
import {
  Send,
  CheckCircle,
  AlertCircle,
  Copy,
  Check,
  Tag,
  Linkedin,
  Twitter,
} from "lucide-react";
import { useAuth, useUser } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";

// Type definitions
interface FormData {
  name: string;
  deployedLink: string;
  description: string;
  linkedinPostUrl: string;
  twitterPostUrl: string;
  tags: string;
}

interface AIInsights {
  category: string;
  techStack: string[];
  complexity: string;
  marketability: string;
}

interface SubmitResponse {
  success: boolean;
  data?: {
    id: number;
    name: string;
    deployedLink: string;
    description: string;
    shareableLink: string;
    likes: number;
    userId: number;
    createdAt: string;
  };
  error?: string;
}

interface SubmitStatus {
  type: "success" | "error";
  message: string;
  shareableLink?: string;
  insights?: AIInsights;
  projectId?: number;
}

const HackathonShowcase: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    deployedLink: "",
    description: "",
    linkedinPostUrl: "",
    twitterPostUrl: "",
    tags: "",
  });
  const { getToken } = useAuth();
  const { user } = useUser();
  const navigate = useNavigate();

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitStatus, setSubmitStatus] = useState<SubmitStatus | null>(null);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [userPostCount, setUserPostCount] = useState<number>(0);
  const [projectId, setProjectId] = useState<number>();
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState<number>(0);
  const [isRetrying, setIsRetrying] = useState<boolean>(false);

  // Utility functions for retry logic
  const sleep = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  const generateSubmissionId = () =>
    `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const getErrorMessage = (error: any, status?: number): string => {
    if (status === 429) {
      return "Too many submissions. Please wait a few minutes before trying again.";
    }
    if (status === 400) {
      return "Invalid submission data. Please check your form and try again.";
    }
    if (status === 401 || status === 403) {
      return "Authentication error. Please sign in again and retry.";
    }
    if (status === 500 || (status && status >= 500)) {
      return "Server error. We're working to fix this. Please try again in a few minutes.";
    }
    if (
      error?.message?.includes("timeout") ||
      error?.message?.includes("network")
    ) {
      return "Network timeout. Please check your connection and try again.";
    }
    if (error?.message) {
      return error.message;
    }
    return "Something went wrong. Please try again.";
  };

  const shouldRetry = (status?: number, retryAttempt?: number): boolean => {
    if (!retryAttempt || retryAttempt >= 3) return false;
    // Retry on server errors, timeouts, and network issues
    return (
      status === undefined ||
      status >= 500 ||
      status === 408 ||
      status === 502 ||
      status === 503 ||
      status === 504
    );
  };

  // Fallback tags in case API fails - must match backend format
  const fallbackTags = [
    "Portfolio",
    "Games",
    "Productivity",
    "Travel",
    "UI-Component",
    "Fitness",
    "devtools",
    "AI",
    "social",
    "Finance",
    "Dashboards",
    "B2B-Apps",
    "eCommerce",
    "Internal-Tools",
    "other",
  ];

  // Function to convert backend tag format to display format
  const formatTagForDisplay = (tag: string): string => {
    const tagMap: Record<string, string> = {
      Portfolio: "Portfolio",
      Gamest: "Games",
      Productivity: "Productivity",
      Travel: "Travel",
      "UI-Component": "UI Component",
      Fitness: "Fitness",
      devtools: "Developer Tools",
      AI: "AI",
      social: "Social",
      Finance: "Finance",
      Dashboards: "Dashboards",
      "B2B-Apps": "B2B Apps",
      eCommerce: "E-Commerce",
      "Internal-Tools": "Internal Tools",
      other: "Other",
    };
    return (
      tagMap[tag] ||
      tag
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")
    );
  };

  // Fetch available tags
  const fetchTags = async (): Promise<void> => {
      setAvailableTags(fallbackTags);
  };

  // Fetch user post count
  const fetchUserPostCount = async (): Promise<void> => {
    if (!user?.id) return;

    try {
      const token = await getToken();
      const response = await fetch(
        `${import.meta.env.VITE_BASE_URL}/api/hackathon/user/my-posts?clerkId=${
          user.id
        }`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await response.json();
      if (data.success) {
        setUserPostCount(data.meta.count);
      }
    } catch (error) {
    }
  };

  // Load initial data
  useEffect(() => {
    // Always fetch tags regardless of user state
    fetchTags();
  }, []);

  // Fetch user-specific data when user is available
  useEffect(() => {
    if (user?.id) {
      fetchUserPostCount();
    }
  }, [user?.id]);


  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ): void => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear previous status when user starts typing
    if (submitStatus) {
      setSubmitStatus(null);
    }
  };

  const handleSelectChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ): void => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear previous status when user starts typing
    if (submitStatus) {
      setSubmitStatus(null);
    }
  };

  const handleTagSelect = (tag: string): void => {
    setFormData((prev) => ({
      ...prev,
      tags: tag,
    }));

    // Clear previous status when user makes changes
    if (submitStatus) {
      setSubmitStatus(null);
    }
  };
  // Enhanced backend submission with retry logic
  const submitToBackend = async (
    projectData: FormData,
    currentSubmissionId: string,
    retryAttempt: number = 0
  ): Promise<SubmitResponse> => {
    try {
      // Check if token is still valid
      const token = await getToken();
      if (!token) {
        throw new Error("Authentication token expired. Please sign in again.");
      }

      const submissionPayload = {
        name: projectData.name.trim(),
        deployedLink: projectData.deployedLink.trim(),
        description: projectData.description.trim(),
        linkedinPostUrl: projectData.linkedinPostUrl.trim() || undefined,
        twitterPostUrl: projectData.twitterPostUrl.trim() || undefined,
        tags: projectData.tags || "other",
        clerkId: user?.id,
        submissionId: currentSubmissionId, // Add unique submission ID to prevent duplicates
      };

      // Create AbortController for timeout handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const response = await fetch(
        `${import.meta.env.VITE_BASE_URL}/api/hackathon`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(submissionPayload),
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        // Handle specific error cases
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText || `HTTP ${response.status}` };
        }

        // Check if we should retry
        if (shouldRetry(response.status, retryAttempt)) {
          const delayMs = Math.pow(2, retryAttempt) * 1000; // Exponential backoff: 1s, 2s, 4s
          setIsRetrying(true);
          setRetryCount(retryAttempt + 1);
          await sleep(delayMs);
          return submitToBackend(
            projectData,
            currentSubmissionId,
            retryAttempt + 1
          );
        }

        throw new Error(
          errorData.error || getErrorMessage(null, response.status)
        );
      }

      const data: SubmitResponse = await response.json();
      if (data?.data?.id) {
        setProjectId(data.data.id);
      }

      // Reset retry states on success
      setRetryCount(0);
      setIsRetrying(false);

      return data;
    } catch (error) {
      //@ts-ignore
      if (error.name === "AbortError") {
        if (shouldRetry(undefined, retryAttempt)) {
          const delayMs = Math.pow(2, retryAttempt) * 1000;
          setIsRetrying(true);
          setRetryCount(retryAttempt + 1);
          await sleep(delayMs);
          return submitToBackend(
            projectData,
            currentSubmissionId,
            retryAttempt + 1
          );
        }
        throw new Error(
          "Request timeout. Please check your connection and try again."
        );
      }

      // Check if we should retry other errors
      if (shouldRetry(undefined, retryAttempt)) {
        const delayMs = Math.pow(2, retryAttempt) * 1000;
        setIsRetrying(true);
        setRetryCount(retryAttempt + 1);
        await sleep(delayMs);
        return submitToBackend(
          projectData,
          currentSubmissionId,
          retryAttempt + 1
        );
      }

      throw error;
    }
  };

  const handleSubmit = async (): Promise<void> => {
    // Prevent double submission
    if (isSubmitting || isRetrying) {
      return;
    }

    // Client-side validation
    const errors: string[] = [];

    if (!formData.name.trim()) {
      errors.push("Project name is required");
    }

    if (!formData.deployedLink.trim()) {
      errors.push("Deployed link is required");
    } else {
      try {
        const url = new URL(formData.deployedLink);
        if (!url.hostname.endsWith(".codepup.app")) {
          errors.push(
            "Deployment URL must use a .codepup.app domain (e.g., https://yourproject.codepup.app/)"
          );
        }
      } catch {
        errors.push("Please enter a valid URL for the deployed link");
      }
    }

    if (!formData.description.trim()) {
      errors.push("Project description is required");
    } else if (formData.description.trim().length < 20) {
      errors.push("Project description must be at least 20 characters long");
    }

    if (!formData.tags) {
      errors.push("Please select a tag for your project");
    }

    // Validate LinkedIn URL if provided
    if (
      formData.linkedinPostUrl.trim() &&
      !formData.linkedinPostUrl.includes("linkedin.com")
    ) {
      errors.push("LinkedIn URL must be a valid LinkedIn link");
    }

    // Validate Twitter URL if provided
    if (
      formData.twitterPostUrl.trim() &&
      !formData.twitterPostUrl.includes("twitter.com") &&
      !formData.twitterPostUrl.includes("x.com")
    ) {
      errors.push("Twitter URL must be a valid Twitter/X link");
    }

    if (errors.length > 0) {
      setSubmitStatus({
        type: "error",
        message: errors.join(". "),
      });
      return;
    }

    // Generate unique submission ID to prevent duplicates
    const currentSubmissionId = generateSubmissionId();
    setSubmissionId(currentSubmissionId);
    setIsSubmitting(true);
    setSubmitStatus(null);
    setRetryCount(0);
    setIsRetrying(false);

    try {
      const response = await submitToBackend(formData, currentSubmissionId);

      if (response.success && response.data) {
        // Generate shareable URL for the submit status
        const shareableUrl = `${window.location.origin}/project/${response.data.id}`;

        setSubmitStatus({
          type: "success",
          message: "Project submitted successfully!",
          shareableLink: shareableUrl,
          projectId: response.data.id,
          // Mock AI insights since your backend doesn't return them yet
          insights: {
            category: "Web Application",
            techStack: ["React", "TypeScript", "Tailwind CSS"],
            complexity: "Intermediate",
            marketability: "High",
          },
        });

        // Reset form after successful submission
        setFormData({
          name: "",
          deployedLink: "",
          description: "",
          linkedinPostUrl: "",
          twitterPostUrl: "",
          tags: "",
        });

        // Reset submission states
        setSubmissionId(null);
        setRetryCount(0);
        setIsRetrying(false);

        // Refresh user post count
        fetchUserPostCount();
      } else {
        setSubmitStatus({
          type: "error",
          message: response.error || "Submission failed. Please try again.",
        });
      }
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      setSubmitStatus({
        type: "error",
        message: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
      setIsRetrying(false);
    }
  };

  const copyToClipboard = async (text: string): Promise<void> => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-indigo-400/20 to-purple-400/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-emerald-400/20 to-teal-400/20 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 p-4 md:p-6 lg:p-8">
        <div className="max-w-5xl mx-auto">
          {/* Compact Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg mb-4">
              <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <div className="w-4 h-4 bg-white rounded-lg"></div>
              </div>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-3">
              Submit Your Project
            </h1>
            <p className="text-lg text-gray-600 mb-6 max-w-2xl mx-auto">
              Share your{" "}
              <span className="font-semibold text-indigo-600">innovation</span>{" "}
              with the world
            </p>

            {/* Compact User Post Count */}
            {user && (
              <div className="inline-flex items-center bg-white/80 backdrop-blur-sm rounded-xl px-4 py-2 shadow-lg border border-white/30">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                  <span className="text-sm font-bold text-gray-800">
                    {userPostCount} projects
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Compact Main Form */}
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl border border-white/50 max-w-2xl mx-auto">
            <div className="p-6">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSubmit();
                }}
              >
                <div className="space-y-8">
                  {/* Compact Project Name */}
                  <div className="mb-4">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Project Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all duration-200 text-gray-800 placeholder-gray-400"
                      placeholder="Enter your project name"
                      maxLength={100}
                      required
                    />
                  </div>

                  {/* Compact Deployed Link */}
                  <div className="mb-4">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Deployed Link <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="url"
                      id="deployedLink"
                      name="deployedLink"
                      value={formData.deployedLink}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all duration-200 text-gray-800 placeholder-gray-400"
                      placeholder="https://yourproject.codepup.app/"
                      required
                    />
                    <p className="text-xs text-emerald-600 mt-2 flex items-center">
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-2"></div>
                      Must use a .codepup.app domain
                    </p>
                  </div>

                  {/* Compact Project Description */}
                  <div className="mb-4">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Project Description{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={4}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all duration-200 text-gray-800 placeholder-gray-400 resize-none"
                      placeholder="Describe your project, its features, technologies used, and what problem it solves..."
                      maxLength={1000}
                      required
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>Minimum 20 characters required</span>
                      <span
                        className={
                          formData.description.length > 900
                            ? "text-amber-600"
                            : ""
                        }
                      >
                        {formData.description.length}/1000
                      </span>
                    </div>
                  </div>

                  {/* Project Category */}
                  <div className="mb-4">
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Project Category <span className="text-red-500">*</span>
                    </label>

                    {/* Selected category indicator */}
                    {!formData.tags && (
                      <div className="mb-3 text-gray-500 text-sm">
                        No category selected
                      </div>
                    )}

                    {/* Available categories in dark rounded button style */}
                    <div className="flex flex-wrap gap-2">
                      {availableTags.map((tag) => {
                        const isSelected = formData.tags === tag;

                        return (
                          <button
                            key={tag}
                            type="button"
                            onClick={() =>
                              handleTagSelect(isSelected ? "" : tag)
                            }
                            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                              isSelected
                                ? "bg-indigo-600 text-white"
                                : "bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white"
                            }`}
                          >
                            {formatTagForDisplay(tag)}
                          </button>
                        );
                      })}
                    </div>

                    {availableTags.length === 0 && (
                      <div className="text-center py-4">
                        <div className="animate-spin w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                        <span className="text-gray-500 text-sm">
                          Loading categories...
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Compact Social Media Links Section */}
                  <div className="bg-gray-50 rounded-xl p-4 mb-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">
                      Social Media Links{" "}
                      <span className="text-gray-500 font-normal">
                        (Optional)
                      </span>
                    </h3>

                    <div className="space-y-4">
                      {/* Compact LinkedIn Post URL */}
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          LinkedIn Post URL
                        </label>
                        <div className="relative">
                          <Linkedin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-blue-600" />
                          <input
                            type="url"
                            id="linkedinPostUrl"
                            name="linkedinPostUrl"
                            value={formData.linkedinPostUrl}
                            onChange={handleInputChange}
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-100 transition-all duration-200 text-gray-800 placeholder-gray-400 text-sm"
                            placeholder="https://linkedin.com/posts/..."
                          />
                        </div>
                      </div>

                      {/* Compact Twitter Post URL */}
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Twitter/X Post URL
                        </label>
                        <div className="relative">
                          <Twitter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-sky-500" />
                          <input
                            type="url"
                            id="twitterPostUrl"
                            name="twitterPostUrl"
                            value={formData.twitterPostUrl}
                            onChange={handleInputChange}
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:border-sky-500 focus:ring-1 focus:ring-sky-100 transition-all duration-200 text-gray-800 placeholder-gray-400 text-sm"
                            placeholder="https://twitter.com/... or https://x.com/..."
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Codepup Social Handles Section */}
                  <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-4 mb-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                      <Tag className="w-4 h-4 mr-2 text-indigo-600" />
                      Tag us on our socials!
                    </h3>
                    <p className="text-xs text-gray-600 mb-3">
                      Don't forget to tag us when you share your project on
                      social media
                    </p>

                    <div className="flex flex-wrap gap-2">
                      <a
                        href="https://x.com/Codepupai"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center bg-black hover:bg-gray-800 text-white px-3 py-2 rounded-lg text-xs font-medium transition-colors"
                      >
                        <Twitter className="w-3 h-3 mr-2" />
                        @Codepupai
                      </a>
                      <a
                        href="https://www.linkedin.com/company/codepup/about/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-xs font-medium transition-colors"
                      >
                        <Linkedin className="w-3 h-3 mr-2" />
                        Codepup
                      </a>
                    </div>
                  </div>

                  {/* Enhanced Submit Button with Progress Feedback */}
                  <div className="pt-6">
                    <button
                      type="submit" //@ts-ignore
                      disabled={
                        isSubmitting ||
                        isRetrying ||
                        (submitStatus && submitStatus.type === "success")
                      }
                      className={`w-full py-3 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center space-x-2 ${
                        submitStatus && submitStatus.type === "success"
                          ? "bg-green-500 cursor-not-allowed text-white"
                          : isSubmitting || isRetrying
                          ? "bg-indigo-500 cursor-not-allowed text-white"
                          : "bg-indigo-600 hover:bg-indigo-700 text-white transform hover:scale-105"
                      }`}
                    >
                      {submitStatus && submitStatus.type === "success" ? (
                        <>
                          <CheckCircle className="w-5 h-5" />
                          <span>Project Submitted</span>
                        </>
                      ) : isRetrying ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Retrying... (Attempt {retryCount}/3)</span>
                        </>
                      ) : isSubmitting ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Submitting...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-5 h-5" />
                          <span>Submit Project</span>
                        </>
                      )}
                    </button>

                    {/* Progress Indicator */}
                    {(isSubmitting || isRetrying) && (
                      <div className="mt-3 text-center">
                        <div className="text-xs text-gray-600">
                          {isRetrying
                            ? `Retrying submission... Please wait ${Math.pow(
                                2,
                                retryCount - 1
                              )}s`
                            : "Processing your submission..."}
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1 mt-2">
                          <div
                            className="bg-indigo-600 h-1 rounded-full transition-all duration-300"
                            style={{
                              width: isRetrying
                                ? `${(retryCount / 3) * 100}%`
                                : "100%",
                              animation: "pulse 2s infinite",
                            }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </form>
            </div>
          </div>

          {/* Modern Status Messages */}
          {submitStatus && (
            <div className="mt-8 transform animate-in slide-in-from-bottom-4 duration-500">
              <div
                className={`p-8 rounded-3xl backdrop-blur-xl border shadow-2xl ${
                  submitStatus.type === "success"
                    ? "bg-gradient-to-r from-emerald-50/80 to-green-50/80 border-emerald-200/50"
                    : "bg-gradient-to-r from-red-50/80 to-rose-50/80 border-red-200/50"
                }`}
              >
                <div className="flex items-start space-x-4">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                      submitStatus.type === "success"
                        ? "bg-gradient-to-r from-emerald-500 to-green-500"
                        : "bg-gradient-to-r from-red-500 to-rose-500"
                    }`}
                  >
                    {submitStatus.type === "success" ? (
                      <CheckCircle className="w-6 h-6 text-white" />
                    ) : (
                      <AlertCircle className="w-6 h-6 text-white" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3
                      className={`text-xl font-bold mb-2 ${
                        submitStatus.type === "success"
                          ? "text-emerald-800"
                          : "text-red-800"
                      }`}
                    >
                      {submitStatus.type === "success"
                        ? "Project Submitted Successfully!"
                        : "Submission Error"}
                    </h3>
                    {submitStatus.type === "error" && (
                      <p className="text-red-700 mb-4">
                        {submitStatus.message}
                      </p>
                    )}

                    {submitStatus.type === "success" && (
                      <div className="mt-4 space-y-4">
                        {/* Success Message */}
                        <p className="text-green-700">
                          Your project has been added to our showcase! 🎉
                        </p>

                        {/* Shareable Link */}
                        <div className="bg-white border border-green-200 rounded-lg p-4">
                          <label className="block text-sm font-medium text-green-800 mb-2">
                            Shareable Link:
                          </label>
                          <div className="flex items-center space-x-2">
                            <input
                              type="text"
                              value={submitStatus.shareableLink || ""}
                              readOnly
                              className="flex-1 px-3 py-2 border border-gray-200 rounded-md text-sm bg-gray-50"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                copyToClipboard(
                                  submitStatus.shareableLink || ""
                                )
                              }
                              className="flex items-center px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm"
                            >
                              {copiedLink ? (
                                <>
                                  <Check className="w-4 h-4 mr-1" />
                                  Copied!
                                </>
                              ) : (
                                <>
                                  <Copy className="w-4 h-4 mr-1" />
                                  Copy
                                </>
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex space-x-2">
                          <button
                            type="button"
                            onClick={() => navigate(`/project/${projectId}`)}
                            className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                          >
                            View Project
                          </button>
                          <button
                            type="button"
                            onClick={() => navigate("/gallery")}
                            className="flex-1 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium"
                          >
                            Browse Gallery
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Modern Help Section */}
          <div className="mt-12 text-center">
            <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-8 border border-white/50 shadow-2xl">
              <h4 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-4">
                Need Help?
              </h4>
              <p className="text-lg text-gray-600 mb-6">
                Join our amazing community for support, tips, and inspiration
              </p>
              <a
                href="https://discord.gg/PePSDqKB"
                className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-2xl font-bold transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105 hover:-translate-y-1"
              >
                <div className="w-6 h-6 bg-white/20 rounded-lg mr-3 flex items-center justify-center">
                  <div className="w-3 h-3 bg-white rounded-sm"></div>
                </div>
                Join Discord Community
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HackathonShowcase;

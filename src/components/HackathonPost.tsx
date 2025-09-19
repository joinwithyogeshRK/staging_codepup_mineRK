import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  ExternalLink,
  Calendar,
  User,

  Share2,
  Copy,
  Check,
  Loader,
  AlertCircle,
  Maximize,
  Minimize,
  Heart,
  Tag,
  Linkedin,
  Twitter,
  Trash2,
} from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth, useUser, SignInButton } from "@clerk/clerk-react";

// Type definitions - aligned with backend
interface HackathonPost {
  id: number;
  name: string;
  deployedLink: string;
  description: string;
  shareableLink: string;
  likes: number;
  userId: number;
  createdAt: string;
  linkedinPostUrl?: string;
  twitterPostUrl?: string;
  tags: string;
  userName?: string;
  user?: {
    id: number;
    clerkId: string;
    email: string;
    firstName: string;
    lastName: string;
  };
}

interface ApiResponse {
  success: boolean;
  data: HackathonPost;
  error?: string;
}

const IndividualPost: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [post, setPost] = useState<HackathonPost | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isLiking, setIsLiking] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [userHasLiked, setUserHasLiked] = useState<boolean>(false);
  const { getToken, isSignedIn } = useAuth();
  const { user } = useUser();
  // Fetch individual post
  const fetchPost = async (): Promise<void> => {
    if (!id) {
      setError("Invalid post ID");
      setLoading(false);
      return;
    }
    const token = await getToken();
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `${import.meta.env.VITE_BASE_URL}/api/hackathon/${id}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Post not found");
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Invalid response format");
      }

      const data: ApiResponse = await response.json();

      if (data.success && data.data) {
        setPost(data.data);
      } else {
        throw new Error(data.error || "Failed to fetch post");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch post");
    } finally {
      setLoading(false);
    }
  };

  // Copy link functionality
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

  // Enhanced like functionality with retry logic
  const handleLike = async (): Promise<void> => {
    if (isLiking || !post) return;

    if (!isSignedIn) {
      return;
    }

    try {
      setIsLiking(true);

      // Validate authentication
      const token = await getToken();
      if (!token || !user?.id) {
        throw new Error("Authentication required. Please sign in again.");
      }

      // Retry logic for like functionality
      let retryCount = 0;
      const maxRetries = 2;

      while (retryCount <= maxRetries) {
        try {
          // Create AbortController for timeout
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

          const response = await fetch(
            `${import.meta.env.VITE_BASE_URL}/api/hackathon/${post.id}/like`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ clerkId: user.id }),
              signal: controller.signal,
            }
          );

          clearTimeout(timeoutId);

          if (response.ok) {
            const result = await response.json();
            setPost({ ...post, likes: result.data.likes });
            setUserHasLiked(true);
            return;
          }

          const result = await response.json();

          if (result.error === "You have already liked this post") {
            setUserHasLiked(true);
            return;
          }

          // Retry on server errors
          if (response.status >= 500 && retryCount < maxRetries) {
            retryCount++;
            await new Promise((resolve) =>
              setTimeout(resolve, Math.pow(2, retryCount) * 500)
            );
            continue;
          }

          throw new Error(result.error || "Failed to like post");
        } catch (fetchError) {   //@ts-ignore
          if (fetchError.name === "AbortError") {
            if (retryCount < maxRetries) {
              retryCount++;
              await new Promise((resolve) =>
                setTimeout(resolve, Math.pow(2, retryCount) * 500)
              );
              continue;
            }
            throw new Error("Request timeout. Please try again.");
          }

          // Retry on network errors
          if (retryCount < maxRetries) {
            retryCount++;
            await new Promise((resolve) =>
              setTimeout(resolve, Math.pow(2, retryCount) * 500)
            );
            continue;
          }

          throw fetchError;
        }
      }
    
    } catch (error) {     //@ts-ignore
    } finally {
      setIsLiking(false);
    }
  };

  // Enhanced delete functionality with retry logic
  const handleDelete = async (): Promise<void> => {
    if (isDeleting || !post) return;

    if (
      !confirm(
        "Are you sure you want to delete this post? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      setIsDeleting(true);

      // Validate authentication
      const token = await getToken();
      if (!token || !user?.id) {
        alert("Authentication required. Please sign in again.");
        return;
      }

      // Retry logic for delete functionality
      let retryCount = 0;
      const maxRetries = 2;

      while (retryCount <= maxRetries) {
        try {
          // Create AbortController for timeout
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

          const response = await fetch(
            `${import.meta.env.VITE_BASE_URL}/api/hackathon/${post.id}`,
            {
              method: "DELETE",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ clerkId: user.id }),
              signal: controller.signal,
            }
          );

          clearTimeout(timeoutId);

          if (response.ok) {
            navigate("/gallery");
            return;
          }

          const result = await response.json();

          // Retry on server errors
          if (response.status >= 500 && retryCount < maxRetries) {
            retryCount++;
            await new Promise((resolve) =>
              setTimeout(resolve, Math.pow(2, retryCount) * 1000)
            );
            continue;
          }

          throw new Error(result.error || "Failed to delete post");
        } catch (fetchError) {    //@ts-ignore
          if (fetchError.name === "AbortError") {
            if (retryCount < maxRetries) {
              retryCount++;
              await new Promise((resolve) =>
                setTimeout(resolve, Math.pow(2, retryCount) * 1000)
              );
              continue;
            }
            throw new Error("Request timeout. Please try again.");
          }

          // Retry on network errors
          if (retryCount < maxRetries) {
            retryCount++;
            await new Promise((resolve) =>
              setTimeout(resolve, Math.pow(2, retryCount) * 1000)
            );
            continue;
          }

          throw fetchError;
        }
      }
    } catch (error) {      //@ts-ignore
      alert(`Failed to delete post: ${error.message}. Please try again.`);
    } finally {
      setIsDeleting(false);
    }
  };

  // Format date
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  useEffect(() => {
    fetchPost();
  }, [id]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading post...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !post) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-800 mb-2">
            {error === "Post not found"
              ? "Post Not Found"
              : "Error Loading Post"}
          </h2>
          <p className="text-slate-600 mb-6">
            {error === "Post not found"
              ? "The post you're looking for doesn't exist or has been removed."
              : error || "Something went wrong while loading the post."}
          </p>
          <div className="space-x-4">
            <button
              onClick={() => navigate(-1)}
              className="bg-slate-600 text-white px-6 py-2 rounded-lg hover:bg-slate-700 transition-colors"
            >
              Go Back
            </button>
            <button
              onClick={() => navigate("/gallery")}
              className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
            >
              Browse Gallery
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Generate background color based on post ID (consistent with ProjectGallery)
  const bgColors = [
    "from-pink-500 to-red-500",
    "from-blue-400 to-blue-600",
    "from-green-400 to-emerald-600",
    "from-amber-400 to-orange-600",
    "from-purple-400 to-purple-600",
    "from-cyan-400 to-cyan-600",
    "from-indigo-400 to-indigo-600",
  ];

  const bgColor = bgColors[post.id % bgColors.length];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-indigo-400/20 to-purple-400/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-emerald-400/20 to-teal-400/20 rounded-full blur-3xl"></div>
      </div>

      {/* Compact Navigation Bar */}
      <div className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-white/30 shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate("/gallery")}
              className="flex items-center bg-white/80 backdrop-blur-sm text-slate-700 hover:text-slate-900 hover:bg-white px-4 py-2 rounded-lg transition-all duration-200 border border-white/50 shadow-sm text-sm font-medium"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Gallery
            </button>

            <button
              onClick={() => copyToClipboard(window.location.href)}
              className="flex items-center bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-all duration-200 shadow-sm text-sm font-medium"
            >
              {copiedLink ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Fullscreen Modal for Iframe */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-black">
          <div className="absolute top-4 right-4 z-10">
            <button
              onClick={() => setIsFullscreen(false)}
              className="bg-white/20 hover:bg-white/30 text-white p-3 rounded-lg backdrop-blur-sm transition-colors"
            >
              <Minimize className="w-6 h-6" />
            </button>
          </div>
          <iframe
            src={post.deployedLink}
            className="w-full h-full border-0"
            title={`${post.name} - Fullscreen`}
          />
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Compact Project Header */}
        <div className="mb-6">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/50">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
              <div className="flex-1">
                <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 mb-3">
                  {post.name}
                </h1>
                <div className="flex flex-wrap items-center gap-4 text-slate-600 text-sm mb-4">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span>{formatDate(post.createdAt)}</span>
                  </div>
                  {post.user && (
                    <div className="flex items-center">
                      <User className="w-4 h-4 mr-2" />
                      <span>
                        {post.user.firstName && post.user.lastName
                          ? `${post.user.firstName} ${post.user.lastName}`
                          : post.user.firstName ||
                            post.user.email.split("@")[0]}
                      </span>
                    </div>
                  )}
                  {post.tags && (
                    <div className="flex items-center">
                      <Tag className="w-4 h-4 mr-2" />
                      <span className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full text-xs font-medium">
                        {post.tags}
                      </span>
                    </div>
                  )}
                </div>
                <p className="text-slate-700 text-sm leading-relaxed">
                  {post.description}
                </p>
              </div>

              <div className="flex flex-col gap-3">
                {/* Like Button - Top Position */}
                {!isSignedIn ? (
                  <SignInButton mode="modal">
                    <button className="flex items-center justify-center bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 border border-red-200 hover:border-red-300">
                      <Heart className="w-4 h-4 mr-2" />
                      <span>
                        {post.likes} {post.likes === 1 ? "Like" : "Likes"}
                      </span>
                    </button>
                  </SignInButton>
                ) : (
                  <button
                    onClick={handleLike}
                    disabled={isLiking}
                    className={`flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 border ${
                      userHasLiked
                        ? "bg-red-100 text-red-700 border-red-300 cursor-default"
                        : isLiking
                        ? "bg-red-50 text-red-400 border-red-200 cursor-not-allowed"
                        : "bg-red-50 hover:bg-red-100 text-red-600 border-red-200 hover:border-red-300 transform hover:scale-105"
                    }`}
                  >
                    {isLiking ? (
                      <>
                        <div className="w-4 h-4 mr-2 border-2 border-red-400 border-t-transparent rounded-full animate-spin"></div>
                        <span>Liking...</span>
                      </>
                    ) : (
                      <>
                        <Heart
                          className={`w-4 h-4 mr-2 transition-all duration-200 ${
                            userHasLiked ? "fill-current text-red-600" : ""
                          }`}
                        />
                        <span>
                          {post.likes} {post.likes === 1 ? "Like" : "Likes"}
                        </span>
                        {userHasLiked && (
                          <span className="ml-1 text-xs">(Liked)</span>
                        )}
                      </>
                    )}
                  </button>
                )}

                <a
                  href={post.deployedLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium flex items-center justify-center transition-colors text-sm"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Visit Live
                </a>
                {(post.linkedinPostUrl || post.twitterPostUrl) && (
                  <div className="flex gap-2">
                    {post.linkedinPostUrl && (
                      <a
                        href={post.linkedinPostUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-xs flex items-center transition-colors"
                      >
                        <Linkedin className="w-3 h-3 mr-1" />
                        LinkedIn
                      </a>
                    )}
                    {post.twitterPostUrl && (
                      <a
                        href={post.twitterPostUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-sky-500 hover:bg-sky-600 text-white px-3 py-2 rounded-lg text-xs flex items-center transition-colors"
                      >
                        <Twitter className="w-3 h-3 mr-1" />
                        Twitter
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Project Preview */}
        <div className="mb-8">
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg overflow-hidden border border-white/50">
            {/* Compact Preview Header */}
            <div className="bg-slate-50/80 px-4 py-3 border-b border-slate-200/50 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex space-x-1.5">
                  <div className="w-2.5 h-2.5 bg-red-400 rounded-full"></div>
                  <div className="w-2.5 h-2.5 bg-yellow-400 rounded-full"></div>
                  <div className="w-2.5 h-2.5 bg-green-400 rounded-full"></div>
                </div>
                <span className="text-slate-600 text-xs font-medium">
                  Live Preview
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsFullscreen(true)}
                  className="flex items-center text-slate-600 hover:text-slate-800 bg-slate-100/80 hover:bg-slate-200/80 px-2 py-1 rounded-md text-xs transition-colors"
                >
                  <Maximize className="w-3 h-3 mr-1" />
                  Fullscreen
                </button>
              </div>
            </div>

            {/* Iframe Container */}
            <div className="relative bg-white" style={{ height: "60vh" }}>
              <iframe
                src={post.deployedLink}
                className="w-full h-full border-0"
                title={post.name}
              />
            </div>
          </div>
        </div>

        {/* Compact Actions Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            {user && post.user && user.id === post.user.clerkId && (
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex items-center bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors disabled:cursor-not-allowed"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            )}
            <button
              onClick={() => copyToClipboard(post.shareableLink)}
              className="flex items-center bg-slate-600 hover:bg-slate-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              {copiedLink ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Link
                </>
              )}
            </button>
          </div>

          <div className="flex items-center gap-2 text-slate-600 text-sm">
            {post.user && (
              <div className="flex items-center">
                <div
                  className={`w-6 h-6 bg-gradient-to-br ${bgColor} rounded-full flex items-center justify-center text-white font-bold text-xs mr-2`}
                >
                  {post.user.firstName
                    ? post.user.firstName.charAt(0).toUpperCase()
                    : post.user.email.charAt(0).toUpperCase()}
                </div>
                <span className="text-xs">
                  Created by{" "}
                  {post.userName ||
                    (post.user.firstName && post.user.lastName
                      ? `${post.user.firstName} ${post.user.lastName}`
                      : post.user.firstName || post.user.email.split("@")[0])}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default IndividualPost;

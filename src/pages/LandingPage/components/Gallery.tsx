import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Home,
  LayoutGrid,
  Grid3X3,
  Search,
  Eye,
  ExternalLink,
  Heart,
  Calendar,
  Loader,
  User,
  Tag,
  Linkedin,
  Twitter,
  Filter,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
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
  featuredFlag?: number;
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
  data: HackathonPost[];
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

interface ProjectCardProps {
  project: HackathonPost;
  onLike: (projectId: number, newLikeStatus: boolean) => void;
  isLiked?: boolean;
}

const ProjectCard: React.FC<
  ProjectCardProps & { formatTagForDisplay: (tag: string) => string }
> = ({ project, onLike, isLiked = false, formatTagForDisplay }) => {
  const [localLikes, setLocalLikes] = useState<number>(project.likes);
  const [localIsLiked, setLocalIsLiked] = useState<boolean>(isLiked);
  const [isLiking, setIsLiking] = useState<boolean>(false);
  const { getToken, isSignedIn } = useAuth();
  const { user } = useUser();
  const navigate = useNavigate();

  const handleLike = async (): Promise<void> => {
    if (isLiking) return;

    if (!isSignedIn) {
      return;
    }

    try {
      setIsLiking(true);

      // Check if token is valid
      const token = await getToken();
      if (!token || !user?.id) {
        throw new Error("Authentication required. Please sign in again.");
      }

      // Store original values for rollback
      const originalIsLiked = localIsLiked;
      const originalLikes = localLikes;

      // Optimistic UI update
      const newLikeStatus = !localIsLiked;
      setLocalIsLiked(newLikeStatus);
      setLocalLikes((prev) => (localIsLiked ? prev - 1 : prev + 1));

      // Create AbortController for timeout handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      // Call API to like the post with retry logic
      let retryCount = 0;
      const maxRetries = 2;

      while (retryCount <= maxRetries) {
        try {
          const response = await fetch(
            `${import.meta.env.VITE_BASE_URL}/api/hackathon/${project.id}/like`,
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

          if (!response.ok) {
            // Handle specific error cases
            const result = await response.json();

            if (result.error === "You have already liked this post") {
              setLocalIsLiked(true);
              setLocalLikes(project.likes);
              return;
            }

            // Retry on server errors
            if (response.status >= 500 && retryCount < maxRetries) {
              retryCount++;
              await new Promise((resolve) =>
                setTimeout(resolve, Math.pow(2, retryCount) * 500)
              ); // Exponential backoff
              continue;
            }

            // Revert if API call fails
            setLocalIsLiked(originalIsLiked);
            setLocalLikes(originalLikes);
            throw new Error(
              result.error || `Failed to like project: ${response.status}`
            );
          }

          // Success - update with server response
          const result = await response.json();
          setLocalLikes(result.data.likes);
          setLocalIsLiked(true);

          // Update parent component
          onLike(project.id, true);
          return;
        } catch (fetchError) {
          //@ts-ignore
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
    } catch (error) {
      // Revert optimistic update on error
      setLocalIsLiked(isLiked);
      setLocalLikes(project.likes);

      //@ts-ignore
      if (error.message !== "Authentication required. Please sign in again.") {
        //@ts-ignore
      }
    } finally {
      setIsLiking(false);
    }
  };

  // Format date
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Generate consistent background colors based on project ID

  return (
    <div
      className="relative group rounded-xl shadow-lg overflow-hidden bg-gray-900 cursor-pointer"
      style={{ aspectRatio: "4/3", minHeight: "320px" }}
      onClick={() => navigate(`/project/${project.id}`)}
    >
      {/* Iframe covering full background */}
      <iframe
        src={project.deployedLink}
        className="absolute inset-0 w-full h-full border-0"
        title={project.name}
        style={{
          transform: "scale(0.75)",
          transformOrigin: "0 0",
          width: "133.33%",
          height: "133.33%",
        }}
      />

      {/* Overlay with details - hidden by default, visible on hover */}
      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-between p-4 text-white">
        {/* Top section with project details */}
        <div>
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-xl font-bold flex-1">{project.name}</h3>
            {project.tags && (
              <span className="bg-emerald-500 text-white px-2 py-1 rounded-full text-xs font-medium ml-2 flex items-center">
                <Tag className="w-3 h-3 mr-1" />
                {formatTagForDisplay(project.tags)}
              </span>
            )}
          </div>
          <p className="text-sm opacity-90 mb-4 line-clamp-2">
            {project.description}
          </p>

          <div className="flex items-center justify-between text-sm mb-2">
            <span className="flex items-center">
              <Calendar className="w-4 h-4 mr-1" />
              {formatDate(project.createdAt)}
            </span>
            <span className="flex items-center">
              <User className="w-4 h-4 mr-1" />
              {project.userName ||
                project.user?.firstName ||
                project.user?.email.split("@")[0]}
            </span>
          </div>

          {/* Social Links */}
          {(project.linkedinPostUrl || project.twitterPostUrl) && (
            <div className="flex items-center space-x-2 text-sm">
              {project.linkedinPostUrl && (
                <a
                  href={project.linkedinPostUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-blue-300 hover:text-blue-100 transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Linkedin className="w-4 h-4 mr-1" />
                  LinkedIn
                </a>
              )}
              {project.twitterPostUrl && (
                <a
                  href={project.twitterPostUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-sky-300 hover:text-sky-100 transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Twitter className="w-4 h-4 mr-1" />
                  Twitter
                </a>
              )}
            </div>
          )}
        </div>

        {/* Bottom section with like button only */}
        <div className="flex items-center justify-end">
          <div className="flex items-center space-x-2">
            {!isSignedIn ? (
              <SignInButton mode="modal">
                <button
                  className="bg-white/20 backdrop-blur-sm rounded-lg p-2 flex items-center space-x-1 hover:bg-white/30 transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Heart className="w-4 h-4 text-white" />
                  <span className="text-sm">{localLikes}</span>
                </button>
              </SignInButton>
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleLike();
                }}
                disabled={isLiking}
                className="bg-white/20 backdrop-blur-sm rounded-lg p-2 flex items-center space-x-1 hover:bg-white/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Heart
                  className={`w-4 h-4 ${
                    localIsLiked ? "fill-red-500 text-red-500" : "text-white"
                  }`}
                />
                <span className="text-sm">{localLikes}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const ProjectGallery: React.FC = () => {
  const [projects, setProjects] = useState<HackathonPost[]>([]);
  const [featuredProjects, setFeaturedProjects] = useState<HackathonPost[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingFeatured, setLoadingFeatured] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [likedProjects, setLikedProjects] = useState<Set<number>>(new Set());
  const [carouselScrollRef, setCarouselScrollRef] =
    useState<HTMLDivElement | null>(null);
  const navigate = useNavigate();
  const { getToken } = useAuth();

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
  // Fetch regular projects with server-side filtering
  const fetchProjects = async (
    pageNum: number = 1,
    append: boolean = false,
    selectedTag?: string
  ): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      // Get token (optional for public route)
      const token = await getToken();

      // Build URL with tag parameter if provided
      let url = `${
        import.meta.env.VITE_BASE_URL
      }/api/hackathon?page=${pageNum}&limit=12`;

      if (selectedTag) {
        url += `&tag=${encodeURIComponent(selectedTag)}`;
      }

      // Retry logic for fetching projects
      let retryCount = 0;
      const maxRetries = 3;

      while (retryCount <= maxRetries) {
        try {
          // Create AbortController for timeout
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

          // Build headers conditionally based on token availability
          const headers: Record<string, string> = {
            "Content-Type": "application/json",
          };

          if (token) {
            headers.Authorization = `Bearer ${token}`;
          }

          const response = await fetch(url, {
            method: "GET",
            headers,
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            // Retry on server errors
            if (response.status >= 500 && retryCount < maxRetries) {
              retryCount++;
              await new Promise((resolve) =>
                setTimeout(resolve, Math.pow(2, retryCount) * 1000)
              );
              continue;
            }

            if (response.status === 429) {
              throw new Error(
                "Too many requests. Please wait a moment and try again."
              );
            }

            throw new Error(`Failed to load projects (${response.status})`);
          }

          const contentType = response.headers.get("content-type");
          if (!contentType || !contentType.includes("application/json")) {
            throw new Error("Invalid server response format");
          }

          const data: ApiResponse = await response.json();

          if (data.success && data.data) {
            if (append) {
              setProjects((prev) => [...prev, ...data.data]);
            } else {
              setProjects(data.data);
            }

            // Update pagination info from server response
            if (data.pagination) {
              setTotalCount(data.pagination.total);
              setHasMore(data.pagination.page < data.pagination.totalPages);
            } else {
              // Fallback pagination logic
              setHasMore(data.data.length === 12);
            }
            return; // Success, exit retry loop
          } else {
            throw new Error(data.error || "Invalid response from server");
          }
        } catch (fetchError) {
          //@ts-ignore
          if (fetchError.name === "AbortError") {
            if (retryCount < maxRetries) {
              retryCount++;
              await new Promise((resolve) =>
                setTimeout(resolve, Math.pow(2, retryCount) * 1000)
              );
              continue;
            }
            throw new Error("Request timeout. Please check your connection.");
          }

          //@ts-ignore
          if (retryCount < maxRetries && !fetchError.message.includes("429")) {
            retryCount++;
            await new Promise((resolve) =>
              setTimeout(resolve, Math.pow(2, retryCount) * 1000)
            );
            continue;
          }

          throw fetchError;
        }
      }
    } catch (err) {

      let errorMessage = "Failed to load projects. Please try again.";
      if (err instanceof Error) {
        errorMessage = err.message;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Fetch featured projects separately
  const fetchFeaturedProjects = async (): Promise<void> => {
    try {
      setLoadingFeatured(true);

      // Get token (optional for public route)
      const token = await getToken();

      const url = `${import.meta.env.VITE_BASE_URL}/api/hackathon/featured`;

      // Build headers conditionally based on token availability
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(url, {
        method: "GET",
        headers,
      });

      if (!response.ok) {
        throw new Error(`Failed to load featured projects (${response.status})`);
      }

      const data = await response.json();

      if (data.success && data.data) {
        setFeaturedProjects(data.data);
      } else {
        throw new Error(data.error || "Invalid response from server");
      }
    } catch (err) {
      // Don't show error for featured projects, just use empty array
      setFeaturedProjects([]);
    } finally {
      setLoadingFeatured(false);
    }
  };

  // Load projects and tags on component mount
  useEffect(() => {
    fetchFeaturedProjects();
    fetchProjects(1, false);
    fetchTags();
  }, []);

  // Reload projects when selected tags change
  useEffect(() => {
    // Reset pagination when filters change
    setPage(1);
    setHasMore(true);

    // Fetch projects with new filter
    const selectedTag = selectedTags.length > 0 ? selectedTags[0] : undefined;
    fetchProjects(1, false, selectedTag);
  }, [selectedTags]);

  // Fetch available tags
  const fetchTags = async (): Promise<void> => {
    setAvailableTags(fallbackTags);
  };

  // Filter projects based on search query only (tags are now server-side filtered)
  const filteredProjects = React.useMemo(() => {
    let filtered = projects;

    // Apply search filter only (tags are handled server-side)
    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (project) =>
          project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          project.description
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          project.userName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          project.user?.firstName
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          project.user?.email
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          project.tags?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  }, [searchQuery, projects]);

  const handleLike = (projectId: number, isLiked: boolean): void => {
    // Update local state to reflect the like
    setProjects((prev) =>
      prev.map((project) =>
        project.id === projectId
          ? {
              ...project,
              likes: isLiked ? project.likes + 1 : project.likes - 1,
            }
          : project
      )
    );

    // Update liked projects set
    if (isLiked) {
      setLikedProjects((prev) => new Set(prev).add(projectId));
    } else {
      setLikedProjects((prev) => {
        const newSet = new Set(prev);
        newSet.delete(projectId);
        return newSet;
      });
    }
  };

  const handleLoadMore = (): void => {
    if (hasMore && !loading) {
      const nextPage = page + 1;
      setPage(nextPage);
      // Pass the selected tag for server-side filtering
      const selectedTag = selectedTags.length > 0 ? selectedTags[0] : undefined;
      fetchProjects(nextPage, true, selectedTag);
    }
  };

  const handleTagToggle = (tag: string): void => {
    setSelectedTags((prev) => {
      // Only allow single tag selection for server-side filtering
      if (prev.includes(tag)) {
        return [];
      } else {
        return [tag];
      }
    });
  };

  const clearAllTags = (): void => {
    setSelectedTags([]);
  };

  const scrollCarousel = (direction: "left" | "right"): void => {
    if (carouselScrollRef) {
      const scrollAmount = 344; // card width (320px) + gap (24px)
      const currentScroll = carouselScrollRef.scrollLeft;

      if (direction === "left") {
        carouselScrollRef.scrollBy({
          left: -scrollAmount,
          behavior: "smooth",
        });
      } else {
        carouselScrollRef.scrollBy({
          left: scrollAmount,
          behavior: "smooth",
        });
      }
    }
  };

  if (loading && projects.length === 0) {
    return (
      <div className="min-h-screen p-4 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading amazing projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen  p-4">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        

        {/* Title Section */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <h1 className="text-5xl font-bold  text-gray-600">
              Project Gallery
            </h1>
            <span className="ml-4 text-2xl">✨</span>
          </div>
          <p className="text-slate-600 font-montserrat italic text-lg mb-6">
            Discover amazing projects built by our talented community of
            creators
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="bg-white rounded-xl shadow-lg p-2 flex items-center">
            <div className="flex-1 flex items-center">
              <Search className="w-5 h-5 text-slate-400 ml-4 mr-3" />
              <input
                type="text"
                placeholder="Search projects by name, description, creator, or tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 py-3 text-slate-700 placeholder-slate-400 outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="max-w-7xl mx-auto mb-8">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            <p className="font-medium">Error loading projects:</p>
            <p className="text-sm">{error}</p>
            <button
              onClick={() => {
                setPage(1);
                fetchProjects(1, false);
              }}
              className="mt-2 bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Featured Projects Section */}
      {featuredProjects.length > 0 && (
        <div className="max-w-7xl mx-auto mb-16">
          <div className="flex items-center gap-3 mb-8">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg"></div>
              <h2 className="text-3xl font-bold text-slate-800">Featured</h2>
            </div>
            <div className="flex-1 h-px bg-gradient-to-r from-yellow-300 to-transparent"></div>
          </div>

          {/* Horizontal Carousel */}
          <div className="relative group">
            {/* Left Arrow - Hidden on mobile, always visible on desktop */}
            {featuredProjects.length > 1 && (
              <button
                onClick={() => scrollCarousel("left")}
                className="hidden sm:block absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-white/90 hover:bg-white shadow-lg rounded-full p-2 transition-all duration-300 hover:scale-110"
                style={{ marginLeft: "-20px" }}
              >
                <ChevronLeft className="w-6 h-6 text-slate-700" />
              </button>
            )}

            {/* Right Arrow - Hidden on mobile, always visible on desktop */}
            {featuredProjects.length > 1 && (
              <button
                onClick={() => scrollCarousel("right")}
                className="hidden sm:block absolute right-0 top-1/2 -translate-y-1/2 z-20 bg-white/90 hover:bg-white shadow-lg rounded-full p-2 transition-all duration-300 hover:scale-110"
                style={{ marginRight: "-20px" }}
              >
                <ChevronRight className="w-6 h-6 text-slate-700" />
              </button>
            )}

            {/* Carousel Container - Simplified */}
            <div
              ref={setCarouselScrollRef}
              className="overflow-x-auto hide-scrollbar scroll-smooth"
              style={{
                WebkitOverflowScrolling: "touch",
                scrollbarWidth: "none",
                msOverflowStyle: "none",
              }}
            >
              <div className="flex gap-24 space-x-6 pb-4 px-2">
                {featuredProjects.map((project) => (
                  <div key={project.id} className="flex-shrink-0 w-80 max-w-80">
                    <ProjectCard
                      project={project}
                      onLike={handleLike}
                      isLiked={likedProjects.has(project.id)}
                      formatTagForDisplay={formatTagForDisplay}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* All Projects Grid */}
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <h2 className="text-2xl font-semibold text-slate-800">
            All Projects
          </h2>
          <div className="flex-1 h-px bg-gradient-to-r from-slate-300 to-transparent"></div>
          <span className="text-slate-500 text-sm">
            {searchQuery
              ? filteredProjects.length
              : totalCount > 0
              ? totalCount
              : filteredProjects.length}{" "}
            project
            {(searchQuery
              ? filteredProjects.length
              : totalCount > 0
              ? totalCount
              : filteredProjects.length) !== 1
              ? "s"
              : ""}
            {selectedTags.length > 0 && (
              <span className="ml-1 text-blue-600">
                • filtered by {formatTagForDisplay(selectedTags[0])}
              </span>
            )}
          </span>
        </div>

        {/* Tag Filter Pills - Only for All Projects */}
        <div className="mb-8">
          <div className="w-full overflow-x-auto hide-scrollbar">
            <div className="flex items-center space-x-2 sm:space-x-3 pb-2 min-w-max px-2 sm:px-4 justify-center">
              {/* All Tags Pill */}
              <button
                onClick={clearAllTags}
                className={`px-3 py-2 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                  selectedTags.length === 0
                    ? "bg-blue-600 text-white shadow-lg"
                    : "bg-white text-slate-700 border border-slate-300 hover:border-blue-500 hover:shadow-md"
                }`}
              >
                Popular
              </button>

              {/* Individual Tag Pills - All tags are available now since featured is separate */}
              {availableTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => handleTagToggle(tag)}
                  className={`px-3 py-2 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                    selectedTags.includes(tag)
                      ? "bg-blue-600 text-white shadow-lg"
                      : "bg-white text-slate-700 border border-slate-300 hover:border-blue-500 hover:shadow-md"
                  }`}
                >
                  {formatTagForDisplay(tag)}
                </button>
              ))}

              {/* Clear Selected Tags */}
              {selectedTags.length > 0 && (
                <button
                  onClick={clearAllTags}
                  className="px-3 py-2 text-slate-500 hover:text-slate-700 text-sm transition-colors underline whitespace-nowrap"
                >
                  Clear All
                </button>
              )}
            </div>
          </div>
        </div>

        {filteredProjects.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {filteredProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onLike={handleLike}
                  isLiked={likedProjects.has(project.id)}
                  formatTagForDisplay={formatTagForDisplay}
                />
              ))}
            </div>

            {/* Load More Button - Show when no search query (server-side pagination works with tags) */}
            {hasMore && !searchQuery && (
              <div className="flex justify-center mt-12">
                <button
                  onClick={handleLoadMore}
                  disabled={loading}
                  className="bg-emerald-600 text-white px-6 py-3 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center"
                >
                  {loading ? (
                    <Loader className="w-4 h-4 animate-spin mr-2" />
                  ) : null}
                  Load More Projects
                  {totalCount > 0 && (
                    <span className="ml-2 text-emerald-200">
                      ({projects.length}/{totalCount})
                    </span>
                  )}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-16">
            <div className="text-slate-400 mb-4">
              <Search className="w-16 h-16 mx-auto mb-4 opacity-50" />
            </div>
            {searchQuery || selectedTags.length > 0 ? (
              <>
                <h3 className="text-xl font-semibold text-slate-600 mb-2">
                  No projects found
                </h3>
                <p className="text-slate-500 mb-4">
                  {searchQuery && selectedTags.length > 0
                    ? `No projects match your search "${searchQuery}" with the selected tags`
                    : searchQuery
                    ? `No projects match your search for "${searchQuery}"`
                    : `No projects match the selected tag${
                        selectedTags.length > 1 ? "s" : ""
                      }`}
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
                    >
                      Clear Search
                    </button>
                  )}
                  {selectedTags.length > 0 && (
                    <button
                      onClick={clearAllTags}
                      className="bg-slate-600 text-white px-6 py-2 rounded-lg hover:bg-slate-700 transition-colors"
                    >
                      Clear Tags
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      clearAllTags();
                    }}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Show All Projects
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3 className="text-xl font-semibold text-slate-600 mb-2">
                  No projects yet
                </h3>
                <p className="text-slate-500 mb-4">
                  Be the first to submit an amazing project!
                </p>
                <button
                  onClick={() => navigate("/submit")}
                  className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  Submit Your Project
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectGallery;

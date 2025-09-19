import React, { useState, useEffect } from "react";
import {
  Calendar,
  Eye,
  ExternalLink,
  Heart,
  Trash2,
  Plus,
  Loader,
  AlertCircle,
  Tag,
  Linkedin,
  Twitter,
  ArrowLeft,
} from "lucide-react";
import { useAuth, useUser, SignInButton } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";

// Type definitions
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
}

interface UserPostsResponse {
  success: boolean;
  data: HackathonPost[];
  meta: {
    count: number;
    canCreateMore: boolean;
    remainingPosts: number;
  };
  error?: string;
}

const UserDashboard: React.FC = () => {
  const [posts, setPosts] = useState<HackathonPost[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [postCount, setPostCount] = useState<number>(0);
  const [canCreateMore, setCanCreateMore] = useState<boolean>(true);
  const [remainingPosts, setRemainingPosts] = useState<number>(2);

  const { getToken, isSignedIn } = useAuth();
  const { user } = useUser();
  const navigate = useNavigate();

  // Fetch user posts
  const fetchUserPosts = async (): Promise<void> => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);
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

      const data: UserPostsResponse = await response.json();

      if (response.ok && data.success) {
        setPosts(data.data);
        setPostCount(data.meta.count);
        setCanCreateMore(data.meta.canCreateMore);
        setRemainingPosts(data.meta.remainingPosts);
      } else {
        throw new Error(data.error || "Failed to fetch posts");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch posts");
    } finally {
      setLoading(false);
    }
  };

  // Delete post
  const handleDelete = async (postId: number): Promise<void> => {
    if (
      !confirm(
        "Are you sure you want to delete this post? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      setDeleting(postId);
      const token = await getToken();

      const response = await fetch(
        `${import.meta.env.VITE_BASE_URL}/api/hackathon/${postId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ clerkId: user?.id }),
        }
      );

      const result = await response.json();

      if (response.ok && result.success) {
        // Remove post from local state
        setPosts(posts.filter((post) => post.id !== postId));
        setPostCount((prev) => prev - 1);
        setRemainingPosts((prev) => prev + 1);
        setCanCreateMore(true);
      } else {
        throw new Error(result.error || "Failed to delete post");
      }
    } catch (err) {
      alert("Failed to delete post. Please try again.");
    } finally {
      setDeleting(null);
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

  useEffect(() => {
    if (isSignedIn && user?.id) {
      fetchUserPosts();
    }
  }, [isSignedIn, user?.id]);

  // Redirect if not signed in
  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-800 mb-2">
            Authentication Required
          </h2>
          <p className="text-slate-600 mb-6">
            Please sign in to view your dashboard.
          </p>
          <SignInButton mode="modal">
            <button className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 transition-colors">
              Sign In
            </button>
          </SignInButton>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading your posts...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Error</h2>
          <p className="text-slate-600 mb-6">{error}</p>
          <button
            onClick={() => fetchUserPosts()}
            className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 transition-colors mr-4"
          >
            Try Again
          </button>
          <button
            onClick={() => navigate("/gallery")}
            className="bg-slate-600 text-white px-6 py-2 rounded-lg hover:bg-slate-700 transition-colors"
          >
            Browse Gallery
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-slate-600 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            <span className="font-medium">Back</span>
          </button>

          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate("/gallery")}
              className="bg-slate-600 text-white px-4 py-2 rounded-lg hover:bg-slate-700 transition-colors"
            >
              Browse Gallery
            </button>
          </div>
        </div>

        {/* Dashboard Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg mr-4">
              {user?.firstName?.charAt(0)?.toUpperCase() ||
                user?.emailAddresses?.[0]?.emailAddress
                  ?.charAt(0)
                  ?.toUpperCase()}
            </div>
            <div className="text-left">
              <h1 className="text-3xl font-bold text-slate-800">
                {user?.firstName && user?.lastName
                  ? `${user.firstName} ${user.lastName}`
                  : user?.firstName || "Your Dashboard"}
              </h1>
              <p className="text-slate-600">
                Manage your hackathon submissions
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="flex justify-center space-x-6 text-sm text-slate-600">
            <div className="flex items-center bg-white rounded-full px-4 py-2 shadow-lg">
              <div
                className={`w-2 h-2 rounded-full ${
                  canCreateMore ? "bg-green-500" : "bg-red-500"
                } mr-2`}
              ></div>
              <span className="font-medium">{postCount}/2 posts created</span>
            </div>
            {canCreateMore && (
              <div className="flex items-center bg-emerald-50 text-emerald-700 rounded-full px-4 py-2 border border-emerald-200">
                <Plus className="w-4 h-4 mr-1" />
                <span className="font-medium">
                  {remainingPosts} slots remaining
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Create New Post Button */}
        {canCreateMore && (
          <div className="mb-8 text-center">
            <button
              onClick={() => navigate("/submit")}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-medium flex items-center mx-auto transition-colors"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create New Post
            </button>
          </div>
        )}

        {/* Posts */}
        {posts.length > 0 ? (
          <div className="grid gap-6">
            {posts.map((post) => (
              <div
                key={post.id}
                className="bg-white rounded-xl shadow-lg overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <h3 className="text-xl font-bold text-slate-800 mr-3">
                          {post.name}
                        </h3>
                        {post.tags && (
                          <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full text-xs font-medium flex items-center">
                            <Tag className="w-3 h-3 mr-1" />
                            {post.tags}
                          </span>
                        )}
                      </div>
                      <p className="text-slate-600 mb-3 line-clamp-2">
                        {post.description}
                      </p>

                      <div className="flex items-center space-x-4 text-sm text-slate-500 mb-4">
                        <span className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {formatDate(post.createdAt)}
                        </span>
                        <span className="flex items-center">
                          <Heart className="w-4 h-4 mr-1" />
                          {post.likes} likes
                        </span>
                        <span className="flex items-center">
                          <Eye className="w-4 h-4 mr-1" />
                          <a
                            href={post.shareableLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-600 hover:text-emerald-800 transition-colors"
                          >
                            View Page
                          </a>
                        </span>
                      </div>

                      {/* Social Links */}
                      {(post.linkedinPostUrl || post.twitterPostUrl) && (
                        <div className="flex items-center space-x-3 mb-4">
                          {post.linkedinPostUrl && (
                            <a
                              href={post.linkedinPostUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center text-blue-600 hover:text-blue-800 text-sm transition-colors"
                            >
                              <Linkedin className="w-4 h-4 mr-1" />
                              LinkedIn
                            </a>
                          )}
                          {post.twitterPostUrl && (
                            <a
                              href={post.twitterPostUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center text-sky-600 hover:text-sky-800 text-sm transition-colors"
                            >
                              <Twitter className="w-4 h-4 mr-1" />
                              Twitter
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                    <div className="flex items-center space-x-3">
                      <a
                        href={post.deployedLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Visit Live
                      </a>
                      <button
                        onClick={() => navigate(`/project/${post.id}`)}
                        className="flex items-center bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </button>
                    </div>

                    <button
                      onClick={() => handleDelete(post.id)}
                      disabled={deleting === post.id}
                      className="flex items-center bg-red-100 hover:bg-red-200 text-red-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                    >
                      {deleting === post.id ? (
                        <Loader className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4 mr-2" />
                      )}
                      {deleting === post.id ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="text-slate-400 mb-4">
              <Plus className="w-16 h-16 mx-auto mb-4 opacity-50" />
            </div>
            <h3 className="text-xl font-semibold text-slate-600 mb-2">
              No posts yet
            </h3>
            <p className="text-slate-500 mb-6">
              Create your first hackathon post to get started!
            </p>
            <button
              onClick={() => navigate("/submit")}
              className="bg-emerald-600 text-white px-6 py-3 rounded-lg hover:bg-emerald-700 transition-colors font-medium"
            >
              Create Your First Post
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDashboard;

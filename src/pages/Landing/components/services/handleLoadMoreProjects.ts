// Load more projects (append next page)
import axios from "axios";

export async function loadMoreProjects({
  currentPage,
  userId,
  token,
  hasSessionSupport,
  fetchSessions,
}: {
  currentPage: number;
  userId: string;
  token: string;
  hasSessionSupport: boolean;
  fetchSessions: (projectIds: number[]) => Promise<void>;
}): Promise<{ projects: any[]; hasMore: boolean }> {
  try {
    const nextPage = currentPage + 1;
    const BASE_URL = import.meta.env.VITE_BASE_URL;
    const response = await axios.get(`${BASE_URL}/api/projects/user/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { page: nextPage },
    });

    const data = response.data;
    console.log(data)
    if (!Array.isArray(data)) {
      return { projects: [], hasMore: false };
    }

    const activeProjects = data.filter((p) => p.status !== "deleted");

    if (hasSessionSupport && activeProjects.length > 0) {
      const projectIds = activeProjects.map((p) => p.id);
      await fetchSessions(projectIds);
    }

    return {
      projects: activeProjects,
      hasMore: activeProjects.length === 4,
    };
  } catch {
    return { projects: [], hasMore: false };
  }
}

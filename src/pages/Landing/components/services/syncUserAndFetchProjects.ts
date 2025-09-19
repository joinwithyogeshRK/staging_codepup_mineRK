// src/utils/syncUserAndFetchProjects.ts
import axios from "axios";

export async function syncUserAndFetchProjectsFn({
  isLoaded,
  clerkUser,
  token,
  amplitude,
  setUserPayload,
  setDbUser,
  setDidSyncUser,
  setLoadingProjects,
  setProjects,
  setPage,
  setHasMoreProjects,
  BASE_URL,
  hasSessionSupport,
  fetchProjectSessions,
  alertFn = alert, // optionally allow custom alert
}: {
  isLoaded: boolean;
  clerkUser: any;
  token: string;
  amplitude: any;
  setUserPayload: (payload: any) => void;
  setDbUser: (user: any) => void;
  setDidSyncUser: (val: boolean) => void;
  setLoadingProjects: (val: boolean) => void;
  setProjects: (arr: any[]) => void;
  setPage: (n: number) => void;
  setHasMoreProjects: (b: boolean) => void;
  BASE_URL: string;
  hasSessionSupport: boolean;
  fetchProjectSessions: (ids: any[]) => Promise<any>;
  alertFn?: (msg: string) => void;
}) {
  if (!isLoaded || !clerkUser) return;

  try {
    // --- userData preparation
    const userData = {
      clerkId: clerkUser.id,
      email: clerkUser.emailAddresses[0]?.emailAddress || "",
      name: clerkUser.fullName || clerkUser.firstName || "User",
      phoneNumber: clerkUser.phoneNumbers[0]?.phoneNumber || null,
      profileImage: clerkUser.imageUrl || null,
    };

    let userResponse;
    try {
      userResponse = await axios.post(
        `${BASE_URL}/api/users`,
        userData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      amplitude.setUserId(userResponse.data.email);
      setUserPayload((userResponse as any).data);
    } catch (userError: any) {
      if (axios.isAxiosError(userError) && userError.response?.status === 404) {
        userResponse = {
          data: {
            id: Math.floor(Math.random() * 1000),
            clerkId: clerkUser.id,
            email: userData.email,
            name: userData.name,
            phoneNumber: userData.phoneNumber,
            profileImage: userData.profileImage,
            newUser: false,
            updatedAt: new Date().toISOString(),
          },
        };
      } else {
        try {
          userResponse = await axios.get(
            `${BASE_URL}/api/users/clerk/${clerkUser.id}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          setUserPayload((userResponse as any).data);
        } catch (fetchError) {
          throw fetchError;
        }
      }
    }

    setDbUser({
      ...userResponse.data,
      profileImage: userResponse.data.profileImage || undefined,
    });
    setDidSyncUser(true);

    // --- Projects fetch
    setLoadingProjects(true);
    try {
      const projectsResponse = await axios.get(
        `${BASE_URL}/api/projects/user/${userResponse.data.id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { page: 1 },
        }
      );

      const fetchedProjectsRaw = projectsResponse.data;
      const fetchedProjects = Array.isArray(fetchedProjectsRaw)
        ? fetchedProjectsRaw.map((p: any) => ({
            id: p.id,
            name: p.name,
            description: p.description,
            deploymentUrl: p.deploymentUrl || p.previewUrl || p.containerUrl || "",
            productionUrl: p.productionUrl || p.liveUrl || p.deployedUrl || "",
            projects_thumbnail: p.projects_thumbnail || p.thumbnail || p.previewImage || "",
            createdAt: p.createdAt || p.created_at || new Date().toISOString(),
            updatedAt: p.updatedAt || p.updated_at || undefined,
            projectType: p.projectType || p.type,
            status: p.status || p.projectStatus || "ready",
            lastSessionId: p.lastSessionId,
            messageCount: p.messageCount,
            scope: (p.scope as "frontend" | "fullstack") || undefined,
          }))
        : fetchedProjectsRaw;

      if (!Array.isArray(fetchedProjects)) {
        setProjects([]);
        return;
      }

      const activeProjects = fetchedProjects.filter((project: any) => project.status !== "deleted");
      setProjects(activeProjects);
      setPage(1);
      setHasMoreProjects(activeProjects.length === 4);

      if (activeProjects.length > 0 && hasSessionSupport) {
        const projectIds = activeProjects.map((p: any) => p.id);
        await fetchProjectSessions(projectIds);
      }
    } catch (projectError: any) {
      if (
        axios.isAxiosError(projectError) &&
        (projectError.response?.status === 404 ||
          projectError.response?.data?.message?.includes("Backend is running"))
      ) {
        setProjects([]);
      } else {
        setProjects([]);
      }
    }
  } catch (error) {
    alertFn("There was an error setting up your account. Please refresh the page and try again.");
  } finally {
    setLoadingProjects(false);
  }
}

// src/pages/Landing/components/utils/projectStatsUtils.ts

export function computeProjectStats(
    projects: any[],
    projectSessions: Record<number, any>,
    hasSessionSupport: boolean
  ) {
    const activeProjects = projects.filter((p) => p.status === "ready").length;
  
    let projectsWithChats = 0;
    let totalMessages = 0;
  
    if (hasSessionSupport) {
      projectsWithChats = Object.keys(projectSessions).length;
      totalMessages = Object.values(projectSessions).reduce(
        (sum, session) => sum + (session?.messageCount || 0),
        0
      );
    } else {
      projectsWithChats = projects.filter((p) => (p.messageCount || 0) > 0).length;
      totalMessages = projects.reduce(
        (sum, p) => sum + (p.messageCount || 0),
        0
      );
    }
  
    return {
      count: projects.length,
      active: activeProjects,
      withChats: projectsWithChats,
      totalMessages,
      text: `${projects.length} project${projects.length <= 1 ? "" : "s"}`,
      chatsText: projectsWithChats > 0 ? ` • ${projectsWithChats} with chats` : "",
      messagesText: totalMessages > 0 ? ` • ${totalMessages} messages` : "",
    };
  }
  
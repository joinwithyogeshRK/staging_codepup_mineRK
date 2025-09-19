// Memoized project cards to prevent re-rendering on prompt change
import React from "react";
import { motion } from "motion/react";
import ProjectCard from "../ProjectCard";

interface Handlers {
    handleProjectClick: (project: any) => void;
    // Specify element type here as HTMLButtonElement or generic HTMLElement
    handleDeleteProject: (projectId: number, e: React.MouseEvent<HTMLButtonElement>) => void;
    handleContinueChat: (project: any, e: React.MouseEvent<HTMLButtonElement>) => void;
}

export function getSortedProjectCards(
  projects: any[],
  projectSessions: Record<number, any>,
  handlers: Handlers,
  hasSessionSupport: boolean,
  setSelectedDesignForPreview: React.Dispatch<React.SetStateAction<any>>,
  setShowDesignPreview: React.Dispatch<React.SetStateAction<boolean>>
) {
  const sortedProjects = [...projects].sort((a, b) => {
    if (hasSessionSupport) {
      const aSession = projectSessions[a.id];
      const bSession = projectSessions[b.id];

      if (aSession?.hasActiveConversation && !bSession?.hasActiveConversation) return -1;
      if (!aSession?.hasActiveConversation && bSession?.hasActiveConversation) return 1;

      if (aSession?.lastActivity && bSession?.lastActivity) {
        return new Date(bSession.lastActivity).getTime() - new Date(aSession.lastActivity).getTime();
      }

      if (aSession && !bSession) return -1;
      if (!aSession && bSession) return 1;
    } else {
      const aMessages = a.messageCount || 0;
      const bMessages = b.messageCount || 0;

      if (aMessages !== bMessages) return bMessages - aMessages;

      const aTime = new Date(a.updatedAt || a.createdAt).getTime();
      const bTime = new Date(b.updatedAt || b.createdAt).getTime();

      if (aTime !== bTime) return bTime - aTime;
    }

    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return sortedProjects.map((project, index) => (
    <motion.div
      key={project.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <ProjectCard
        project={project}
        onProjectClick={handlers.handleProjectClick}
        onDeleteProject={handlers.handleDeleteProject}
        onContinueChat={handlers.handleContinueChat}
        sessionInfo={projectSessions[project.id]}
        hasSessionSupport={hasSessionSupport}
        onPreviewDesign={(designChoices) => {
          setSelectedDesignForPreview(designChoices);
          setShowDesignPreview(true);
        }}
      />
    </motion.div>
  ));
}

import React, { useMemo } from "react";
import { motion } from "motion/react";
import {
  Calendar,
  Trash2,
  MessageSquare,
  AlertCircle,
  Activity,
  Clock,
  Eye,
} from "lucide-react";
import type {
  Project,
  SessionInfo,
  DesignChoices,
} from "../components/types/types"; // Adjust path as needed
import { extractColorsFromDesignChoices } from "../Index"; // Adjust path if extractColorsFromDesignChoices moves

type ProjectCardProps = {
  project: Project;
  onProjectClick: (project: Project) => void;
  onDeleteProject: (projectId: number, e: React.MouseEvent<HTMLButtonElement>) => void;
  onContinueChat: (project: Project, e: React.MouseEvent<HTMLButtonElement>) => void;
  sessionInfo?: SessionInfo;
  hasSessionSupport: boolean;
  onPreviewDesign?: (designChoices: DesignChoices) => void;
};

const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  onProjectClick,
  onDeleteProject,
  onContinueChat,
  sessionInfo,
  hasSessionSupport,
  onPreviewDesign,
}) => {
  // Function to remove date from project name
  const getCleanProjectName = (name: string) => {
    try {
      const datePattern = /\s+\d{1,2}\/\d{1,2}\/\d{4}$/;
      return name.replace(datePattern, "");
    } catch {
      return name;
    }
  };

  // Enhanced design choices parsing with safe JSON parse
  const designChoices = useMemo(() => {
    try {
      if (project.description) {
        try {
          const parsed = JSON.parse(project.description);
          let choices = null;
          if (parsed.structure?.designChoices) {
            choices = parsed.structure.designChoices;
          } else if (parsed.designChoices) {
            choices = parsed.designChoices;
          } else if (parsed.businessType || parsed.recommendedColors) {
            choices = parsed;
          }
          if (choices) return choices;
        } catch {}
      }
    } catch {}
    return null;
  }, [project.description]);

  // Extract colors for the card display
  const cardColors = useMemo(() => {
    return designChoices ? extractColorsFromDesignChoices(designChoices) : null;
  }, [designChoices]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02, y: -5 }}
      className="group project-card"
      onClick={() => onProjectClick(project)}
    >
      {/* Thumbnail */}
      <div className="project-thumbnail group">
        {typeof project.productionUrl === "string" && project.productionUrl.trim() !== "" ? (
          <iframe
            src={project.productionUrl}
            className="w-full h-full scale-50 origin-top-left transform pointer-events-none"
            title={`${project.name} preview`}
            style={{ width: "211%", height: "211%" }}
          />
        ) : (
          <img
            src={
              project.projects_thumbnail ||
              "https://i.ibb.co/DHHS0QG9/Gemini-Generated-Image-xn79zcxn79zcxn79.webp"
            }
            alt={`${project.name} thumbnail`}
            className="w-full h-full object-cover rounded-lg"
            loading="lazy"
          />
        )}

        {/* Status Badge */}
        {project.status && (
          <div className="absolute-top-left">
            <span
              className={`status-badge ${
                project.status === "ready"
                  ? "status-ready"
                  : project.status === "building"
                  ? "status-building"
                  : project.status === "error"
                  ? "status-error"
                  : "status-default"
              }`}
            >
              {project.status}
            </span>
          </div>
        )}

        {/* Activity Indicator */}
        {sessionInfo?.hasActiveConversation && (
          <div className="absolute-top-right">
            <div className="activity-indicator activity-active" />
          </div>
        )}

        {/* Compatibility Mode Indicator */}
        {!hasSessionSupport && project.messageCount && project.messageCount > 0 && (
          <div className="absolute-top-right">
            <div className="activity-indicator activity-legacy" />
          </div>
        )}

        {/* Color indicator */}
        {cardColors && (
          <div className="absolute-top-right flex gap-1">
            {cardColors.primary && (
              <div
                className="color-indicator"
                style={{ backgroundColor: cardColors.primary }}
              />
            )}
            {cardColors.secondary && (
              <div
                className="color-indicator"
                style={{ backgroundColor: cardColors.secondary }}
              />
            )}
            {cardColors.accent && (
              <div
                className="color-indicator"
                style={{ backgroundColor: cardColors.accent }}
              />
            )}
          </div>
        )}

      </div>

      {/* Project Info */}
      <div className="project-info group-hover:opacity-100">
        <div className="flex items-start justify-between">
          <h3 className="project-title">{getCleanProjectName(project.name)}</h3>
          <button
            onClick={(e) => onDeleteProject(project.id, e)}
            className="project-delete-button cursor-pointer"
          >
            <Trash2 className="project-delete-icon" />
          </button>
        </div>

        {/* Design info preview */}
        {designChoices && (
          <div className="design-info">
            {designChoices.businessName && (
              <div className="design-info-item">
                <span className="design-info-label">Business:</span>{" "}
                {designChoices.businessName}
              </div>
            )}
            {designChoices.recommendedLayout && (
              <div className="design-info-item">
                <span className="design-info-label">Layout:</span>{" "}
                {designChoices.recommendedLayout}
              </div>
            )}
            {cardColors && (
              <div className="design-colors-container">
                <span className="design-colors-label">Colors:</span>
                <div className="design-colors-list">
                  {cardColors.primary && (
                    <div
                      className="color-indicator-small"
                      style={{ backgroundColor: cardColors.primary }}
                    />
                  )}
                  {cardColors.secondary && (
                    <div
                      className="color-indicator-small"
                      style={{ backgroundColor: cardColors.secondary }}
                    />
                  )}
                  {cardColors.accent && (
                    <div
                      className="color-indicator-small"
                      style={{ backgroundColor: cardColors.accent }}
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Session Info or Message Count */}
        {hasSessionSupport && sessionInfo && sessionInfo.messageCount > 0 ? (
          <div className="session-info session-info-active">
            <MessageSquare className="session-icon session-icon-active" />
            <span className="session-text session-text-active">
              {sessionInfo.messageCount} messages
            </span>
            <button
              onClick={(e) => onContinueChat(project, e)}
              className="session-continue-button session-continue-active"
            >
              Continue Chat
            </button>
          </div>
        ) : !hasSessionSupport && project.messageCount && project.messageCount > 0 ? (
          <div className="session-info session-info-legacy">
            <AlertCircle className="session-icon session-icon-legacy" />
            <span className="session-text session-text-legacy">
              {project.messageCount} messages (legacy)
            </span>
            <button
              onClick={(e) => onContinueChat(project, e)}
              className="session-continue-button session-continue-legacy"
            >
              Continue
            </button>
          </div>
        ) : null}

        <div className="flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1">
            <Calendar className="size-icon-small" />
            <span>{new Date(project.createdAt).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-3">
            {hasSessionSupport && sessionInfo?.lastActivity && (
              <div className="flex items-center gap-1">
                <Activity className="size-icon-small" />
                <span>
                  {new Date(sessionInfo.lastActivity).toLocaleDateString() ===
                  new Date().toLocaleDateString()
                    ? new Date(sessionInfo.lastActivity).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : new Date(sessionInfo.lastActivity).toLocaleDateString()}
                </span>
              </div>
            )}
            {!hasSessionSupport &&
              project.updatedAt &&
              new Date(project.updatedAt).getTime() !==
                new Date(project.createdAt).getTime() && (
                <div className="flex items-center gap-1">
                  <Clock className="size-icon-small" />
                  <span>{new Date(project.updatedAt).toLocaleDateString()}</span>
                </div>
              )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default React.memo(ProjectCard);

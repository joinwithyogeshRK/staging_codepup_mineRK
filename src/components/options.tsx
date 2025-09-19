import React, { useState } from "react";
import { motion } from "motion/react";
import { Palette, Layers, Loader2, ArrowRight, Database } from "lucide-react";

import { amplitude } from "../utils/amplitude";

// Add CSS for shimmer animation
const shimmerStyle = `
  @keyframes shimmer {
    0% { background-position: 100% 0; }
    100% { background-position: -100% 0; }
  }
`;

interface ProjectTypeSelectorProps {
  onProjectTypeSelect: (projectType: "frontend" | "fullstack") => Promise<void>;
  isLoading: boolean;
  hasPrompt?: boolean;
}

const ProjectTypeSelector: React.FC<ProjectTypeSelectorProps> = ({
  onProjectTypeSelect,
  isLoading,
  hasPrompt = false,
}) => {
  const [selectedType, setSelectedType] = useState<
    "frontend" | "fullstack" | null
  >(null);

  const handleTypeSelect = async (type: "frontend" | "fullstack") => {
    // Amplitude tracking for project type selection
    if (type === 'frontend') {
      amplitude.track('Frontend project type selected');
    } else {
      amplitude.track('Fullstack project type selected');
    }
    setSelectedType(type);
    await onProjectTypeSelect(type);
  };

  const projectTypes = [
    {
      id: "frontend" as const,
      title: "Simple Website",
      description:
        "Perfect for portfolios, landing pages, blogs, and informational websites",
      icon: Palette,
      features: [
        "Personal portfolio sites",
        "Company landing pages",
        "Blogs and content sites",
        "Brochure websites",
        "Photo galleries",
      ],
      scope: "frontend",
    },
    {
      id: "fullstack" as const,
      title: "Interactive Website with Database",
      description:
        "Complete solution for websites that need user accounts and data storage",
      icon: Layers,
      features: [
        "Online stores and e-commerce",
        "Booking and reservation systems",
        "Customer accounts and profiles",
        "Online learning platforms",
        "Content management systems",
      ],
      scope: "fullstack",
    },
  ];

  return (
    <div className="project-type-selector-container">
      <style>{shimmerStyle}</style>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="project-type-selector-header"
      >
        <h2 className="project-type-selector-title">
          Choose Your Project Type
        </h2>
        <p className="project-type-selector-subtitle">
          {hasPrompt
            ? "Select the type of project you'd like to create based on your requirements"
            : "First, select the type of project you'd like to create. You'll enter details later."}
        </p>
      </motion.div>

      <div className="project-type-selector-grid">
        {projectTypes.map((type, index) => {
          const Icon = type.icon;
          const isSelected = selectedType === type.id;
          const isOtherSelected = selectedType && selectedType !== type.id;

          return (
            <motion.div
              key={type.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className={`project-type-card-container ${
                isOtherSelected
                  ? "project-type-card-container-selected"
                  : "project-type-card-container-unselected"
              }`}
            >
              <motion.button
                onClick={() => handleTypeSelect(type.id)}
                disabled={isLoading || type.id === "fullstack"} // disable fullstack
                className={`group project-type-card-button ${
                  type.id === "frontend"
                    ? "project-type-card-button-frontend"
                    : "project-type-card-button-fullstack-disabled"
                } ${isSelected ? "project-type-card-button-selected" : ""} ${
                  isLoading
                    ? "project-type-card-button-loading"
                    : `project-type-card-button-interactive ${
                        type.id === "frontend"
                          ? "project-type-card-button-frontend-interactive"
                          : "project-type-card-button-fullstack-interactive-disabled"
                      }`
                } ${
                  type.id === "fullstack" ? "project-type-card-disabled" : ""
                }`} // custom class for coming soon
                whileTap={!isLoading ? { scale: 0.98 } : {}}
              >
                {/* Coming Soon Ribbon */}
                {type.id === "fullstack" && (
                  <div className="coming-soon-wrapper">
                    <div className="coming-soon-ribbon">
                      <span className="coming-soon-text">Coming Soon</span>
                    </div>
                  </div>
                )}

                {/* Subtle hover gradient */}
                <div className="project-type-card-hover-gradient group-hover:opacity-100" />

                {/* Subtle shimmer effect */}
                <div className="project-type-card-shimmer-container">
                  <div
                    className="project-type-card-shimmer"
                    style={{
                      backgroundSize: "200% 100%",
                      animation: "shimmer 3s infinite",
                    }}
                  />
                </div>

                {/* Loading Overlay */}
                {isLoading && isSelected && (
                  <div className="project-type-card-loading-overlay">
                    <div className="project-type-card-loading-content">
                      <Loader2 className="w-6 h-6 animate-spin" />
                      <span className="font-medium">Creating project...</span>
                    </div>
                  </div>
                )}

                {/* Content */}
                <div className="project-type-card-content">
                  <div className="project-type-card-header">
                    <div
                      className={`project-type-card-icon-container ${
                        type.id === "frontend"
                          ? "project-type-card-icon-container-frontend"
                          : "project-type-card-icon-container-fullstack-disabled"
                      }`}
                    >
                      <Icon
                        className={`project-type-card-icon ${
                          type.id === "frontend"
                            ? "project-type-card-icon-frontend"
                            : "project-type-card-icon-fullstack-disabled"
                        }`}
                      />
                    </div>
                    {!isLoading && (
                      <ArrowRight
                        className={`project-type-card-arrow group-hover:opacity-100 group-hover:translate-x-1 ${
                          type.id === "frontend"
                            ? "project-type-card-arrow-frontend"
                            : "project-type-card-arrow-fullstack-disabled"
                        }`}
                      />
                    )}
                  </div>

                  {/* Supabase Account Requirement Tag */}
                  {type.id === "fullstack" && (
                    <div className="project-type-card-supabase-tag project-type-card-supabase-tag-fullstack-disabled">
                      <Database className="w-3 h-3 mr-1" />
                      Requires Supabase Account
                    </div>
                  )}

                  <h3
                    className={`project-type-card-title ${
                      type.id === "frontend"
                        ? "project-type-card-title-frontend"
                        : "project-type-card-title-fullstack-disabled"
                    }`}
                  >
                    {type.title}
                  </h3>

                  <p className="project-type-card-description">
                    {type.description}
                  </p>

                  <div className="project-type-card-features-container">
                    <h4
                      className={`project-type-card-features-title ${
                        type.id === "frontend"
                          ? "project-type-card-features-title-frontend"
                          : "project-type-card-features-title-fullstack-disabled"
                      }`}
                    >
                      Examples:
                    </h4>
                    <ul className="project-type-card-features-list">
                      {type.features.map((feature, featureIndex) => (
                        <li
                          key={featureIndex}
                          className={`project-type-card-feature-item ${
                            type.id === "frontend"
                              ? "project-type-card-feature-item-frontend"
                              : "project-type-card-feature-item-fullstack-disabled"
                          }`}
                        >
                          <div
                            className={`project-type-card-feature-dot ${
                              type.id === "frontend"
                                ? "project-type-card-feature-dot-frontend"
                                : "project-type-card-feature-dot-fullstack-disabled"
                            }`}
                          />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Subtle bottom border */}
                <div className="project-type-card-bottom-border group-hover:scale-x-100" />
              </motion.button>
            </motion.div>
          );
        })}
      </div>

      {/* Additional Info */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="project-type-selector-additional-info"
      >
        <p className="project-type-selector-additional-text">
          Don't worry, you can always add more features to your project later
        </p>
      </motion.div>
    </div>
  );
};

export default ProjectTypeSelector;

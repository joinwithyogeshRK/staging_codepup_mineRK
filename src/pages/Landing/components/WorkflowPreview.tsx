import React from "react";
import { motion } from "motion/react";
import { Eye } from "lucide-react";
import DesignPreview from "../../design-preview"; // Adjust path as needed

interface WorkflowPreviewProps {
  designChoices: any; // replace with the exact type if available
  displayStep: string;
  readyToGenerate: boolean;
  setSelectedDesignForPreview: (design: any) => void;
  setShowDesignPreview: (val: boolean) => void;
  amplitude: any;
}

const WorkflowPreview: React.FC<WorkflowPreviewProps> = ({
  designChoices,
  displayStep,
  readyToGenerate,
  setSelectedDesignForPreview,
  setShowDesignPreview,
  amplitude,
}) => {
  return (
    <div className="workflow-preview-section">
      

      {/* Progress indicator */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.5 }}
        className="progress-container"
      >
        <h4 className="progress-title">
          <Eye className="progress-icon" />
          Progress
        </h4>
        <div className="progress-steps">
          <div
            className={`progress-step ${
              displayStep === "analyze"
                ? "progress-step-active"
                : displayStep === "feedback" || readyToGenerate
                ? "progress-step-complete"
                : "progress-step-default"
            }`}
          >
            <div
              className={`progress-dot ${
                displayStep === "analyze"
                  ? "progress-dot-active"
                  : displayStep === "feedback" || readyToGenerate
                  ? "progress-dot-complete"
                  : "progress-dot-default"
              }`}
            />
            Design Analysis
          </div>
          <div
            className={`progress-step ${
              displayStep === "feedback"
                ? "progress-step-active"
                : readyToGenerate
                ? "progress-step-complete"
                : "progress-step-default"
            }`}
          >
            <div
              className={`progress-dot ${
                displayStep === "feedback"
                  ? "progress-dot-active"
                  : readyToGenerate
                  ? "progress-dot-complete"
                  : "progress-dot-default"
              }`}
            />
            Refinement
          </div>
          <div
            className={`progress-step ${
              displayStep === "ready" || readyToGenerate
                ? "progress-step-active"
                : "progress-step-default"
            }`}
          >
            <div
              className={`progress-dot ${
                displayStep === "ready" || readyToGenerate
                  ? "progress-dot-active"
                  : "progress-dot-default"
              }`}
            />
            Generation Ready
          </div>
        </div>
      </motion.div>
      {designChoices && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <DesignPreview designChoices={designChoices} isOpen={false} onClose={function (): void {
                      throw new Error("Function not implemented.");
                  } } />

          {/* Preview button */}
          <motion.button
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              setSelectedDesignForPreview(designChoices);
              setShowDesignPreview(true);
              amplitude.track("Preview Design Clicked");
            }}
            className="btn-secondary-large mt-3"
          >
            <Eye className="size-icon-medium" />
            Preview Design
          </motion.button>
        </motion.div>
      )}
    </div>
  );
};

export default WorkflowPreview; 

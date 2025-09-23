import React from "react";
import { Loader2, Code } from "lucide-react";
import BlankApp from "../../../components/BlankApp";
import { StreamingCodeDisplay } from "../../streaming";
import { formatCountdown } from "./utils/displayCounter"
import { useToast } from "../../../helper/Toast";

interface PreviewContentProps {
  // Preview state
  previewUrl: string | null;
  isIframeLoading: boolean;
  setIsIframeLoading: React.Dispatch<React.SetStateAction<boolean>>;
  iframeKey: number;
  isContainerOnline: boolean | null;
  isCheckingContainer: boolean;
  
  // Tab state
  activeTab: "preview" | "code";
  
  // Workflow state
  isWorkflowActive: boolean;
  countdownTime: number;
  
  // Code streaming
  isStreamingGeneration: boolean;
  streamingCodeContent: string;
  generatedFiles: any[];
  currentGeneratingFile: string | undefined;
  streamingProgress: number;
  
  // Project state
  projectId: number | undefined;
  isModifying: boolean;
  isStreamingModification: boolean;
  
  // Error handling
  setError: React.Dispatch<React.SetStateAction<string>>;
  setIsAgentActivating: React.Dispatch<React.SetStateAction<boolean>>;
  
  // Workflow display
  currentWorkflowStep: string;
  workflowProgress: number;
  workflowSteps: any[];
  projectScope: "frontend" | "fullstack"; // CHANGE: from `string` to `"frontend" | "fullstack"`
  projectStatus: string;
  getWorkflowSteps: (scope: "frontend" | "fullstack") => any[] | undefined; // CHANGE: from `(scope: string)` to `(scope: "frontend" | "fullstack")`
}

const PreviewContent: React.FC<PreviewContentProps> = ({
  previewUrl,
  isIframeLoading,
  setIsIframeLoading,
  iframeKey,
  isContainerOnline,
  isCheckingContainer,
  activeTab,
  isWorkflowActive,
  countdownTime,
  isStreamingGeneration,
  streamingCodeContent,
  generatedFiles,
  currentGeneratingFile,
  streamingProgress,
  projectId,
  isModifying,
  isStreamingModification,
  setError,
  setIsAgentActivating,
  currentWorkflowStep,
  workflowProgress,
  workflowSteps,
  projectScope,
  projectStatus,
  getWorkflowSteps,
}) => {
  // Ready for global toasts if needed
  const { showToast } = useToast();
  return (
    <div className="flex-1 p-4">
      <div className="w-full h-full panel-elevated overflow-hidden relative">
        {/* Loading overlay for iframe refresh */}
        {isIframeLoading && (
          <div className="absolute inset-0 z-30 overlay-surface-80 flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-2" />
              <p className="text-sm text-muted">Refreshing preview...</p>
            </div>
          </div>
        )}

        {/* Tab Content */}
        {activeTab === "preview" ? (
          /* Preview Tab Content */
          <>
            {/* Preview iframe with enhanced refresh capabilities */}
            {previewUrl ? (
              isCheckingContainer ? (
                /* Container status checking - show loading spinner */
                <div className="w-full h-full flex flex-col items-center justify-center bg-placeholder">
                  <div className="text-center max-w-md px-4">
                    <div className="w-16 h-16 bg-neutral-tile rounded-lg mx-auto mb-4 flex items-center justify-center">
                      <Loader2 className="w-8 h-8 text-primary animate-spin" />
                    </div>
                    <h3 className="text-lg font-semibold text-strong mb-2">
                      Checking Preview Status
                    </h3>
                  </div>
                </div>
              ) : isContainerOnline === false ? (
                <BlankApp
                  projectId={projectId || 0}
                  disableActivate={isModifying || isStreamingModification}
                  onActivationStateChange={setIsAgentActivating}
                />
              ) : (
                <iframe
                  key={iframeKey}
                  src={previewUrl}
                  className="w-full h-full absolute inset-0 z-10"
                  title="Live Preview"
                  sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                  onLoad={() => {
                    setIsIframeLoading(false);
                  }}
                  onError={() => {
                    setIsIframeLoading(false);
                    setError(
                      "Failed to load preview. The deployment might not be ready yet."
                    );
                  }}
                />
              )
            ) : (
              /* Preview not available message */
              <div className="w-full h-full flex flex-col items-center justify-center bg-placeholder">
                <div className="text-center max-w-md px-4">
                  <div
                    className={`w-16 h-16 bg-neutral-tile rounded-lg mx-auto mb-4 flex items-center justify-center ${
                      isWorkflowActive ? "puppy-bounce" : ""
                    }`}
                  >
                    <img
                      src="/main.png"
                      alt="CodePup Logo"
                      className="object-contain"
                      style={{ width: "100%", height: "100%" }}
                    />
                  </div>
                  <h3 className="text-lg font-semibold text-strong mb-2">
                    Preview Not Available Yet
                  </h3>
                  <p className="text-muted mb-4 text-sm leading-relaxed">
                    Preview will be shown after generation. Please wait
                    5-7 mins. We'll email you when generation is
                    completed.
                  </p>

                  {/* Countdown Timer */}
                  {isWorkflowActive &&
                    !previewUrl &&
                    countdownTime > 0 && (
                      <div className="text-center">
                        {/* Timer label */}
                        <div className="text-muted text-sm mb-3 uppercase tracking-wide">
                          Time Remaining
                        </div>

                        {/* Timer container with glassmorphism */}
                        <div className="bg-surface-overlay backdrop-blur-sm border border-default-weak rounded-xl shadow-lg p-6 mx-auto w-fit mb-4 timer-breathe">
                          <div className="text-6xl font-mono font-black text-strong tracking-wider">
                            {formatCountdown(countdownTime)}
                          </div>
                        </div>

                        {/* Progress indicator */}
                        <div className="w-32 h-1 bg-subtle rounded-full mx-auto overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all duration-1000"
                            style={{
                              width: `${
                                ((600 - countdownTime) / 600) * 100
                              }%`,
                            }}
                          />
                        </div>
                      </div>
                    )}
                </div>
              </div>
            )}
          </>
        ) : (
          /* Code Tab Content */
          <>
            {isStreamingGeneration ? (
              /* Streaming Code Display */
              <div className="w-full h-full overflow-hidden">
                <StreamingCodeDisplay
                  content={streamingCodeContent}
                  isStreaming={isStreamingGeneration}
                  files={generatedFiles}
                  currentFile={currentGeneratingFile}
                  progress={streamingProgress}
                />
              </div>
            ) : (
              /* Code not streaming message */
              <div className="w-full h-full flex flex-col items-center justify-center bg-placeholder">
                <div className="text-center max-w-md px-4">
                  <div className="w-16 h-16 bg-neutral-tile rounded-lg mx-auto mb-4 flex items-center justify-center">
                    <Code className="w-8 h-8 text-muted" />
                  </div>
                  <h3 className="text-lg font-semibold text-strong mb-2">
                    Code Generation
                  </h3>
                  <p className="text-muted mb-4 text-sm leading-relaxed">
                    {previewUrl
                      ? "The code generation is completed. See preview in preview tab."
                      : "The generated code will be shown here"}
                  </p>
                </div>
              </div>
            )}
          </>
        )}

        {/* 4-Part Workflow Display - ABOVE EVERYTHING IN PREVIEW */}
        {isWorkflowActive && (
          <div className="absolute top-16 right-6 z-30 pointer-events-none hidden lg:block">
            <div className="bg-surface-overlay backdrop-blur-md rounded-xl p-4 border border-default-weak shadow-xl min-w-80">
              {/* Header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-primary-subtle rounded-lg flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-primary"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-strong">
                    Application Generation
                  </h3>
                  <p className="text-xs text-muted">
                    Building your complete app
                  </p>
                </div>
              </div>

              {/* 4 Workflow Steps */}
              <div className="space-y-3">
                {getWorkflowSteps(projectScope)?.map((step, idx) => {
                  const stepsConfig =
                    getWorkflowSteps(projectScope) || [];
                  const currentIndex = stepsConfig.findIndex(
                    (s) => s.name === currentWorkflowStep
                  );
                  const stepData = workflowSteps.find(
                    (s) => s.step === step.name
                  );
                  const isActive = currentWorkflowStep === step.name;
                  const isCompleteRaw = !!stepData?.isComplete;
                  const isCompleteDerived =
                    projectStatus === "ready" ||
                    streamingProgress === 100 ||
                    (currentIndex > -1 && idx < currentIndex);
                  const isComplete = isCompleteRaw || isCompleteDerived;
                  const hasError = stepData?.error;

                  return (
                    <div
                      key={step.name}
                      className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-300 ${
                        hasError
                          ? "bg-step-error"
                          : isComplete
                          ? "bg-step-success"
                          : isActive
                          ? "bg-step-active animate-pulse"
                          : "bg-step-default"
                      }`}
                    >
                      {/* Step Icon */}
                      <div
                        className={`text-2xl ${
                          isActive ? "animate-bounce" : ""
                        }`}
                      >
                        {step.icon}
                      </div>

                      {/* Step Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4
                            className={`text-sm font-medium ${
                              hasError
                                ? "text-danger"
                                : isComplete
                                ? "text-success"
                                : isActive
                                ? "text-primary"
                                : "text-body"
                            }`}
                          >
                            {step.name}
                          </h4>

                          {/* Progress indicator for active step */}
                          {isActive && (
                            <span className="text-xs bg-primary-subtle text-primary px-2 py-0.5 rounded-full font-medium">
                              {workflowProgress}%
                            </span>
                          )}
                        </div>
                        <p
                          className={`text-xs ${
                            hasError
                              ? "text-danger"
                              : isComplete
                              ? "text-success"
                              : isActive
                              ? "text-primary"
                              : "text-muted"
                          }`}
                        >
                          {hasError
                            ? `Error: ${stepData?.error}`
                            : isComplete
                            ? "Completed successfully"
                            : isActive
                            ? step.description
                            : step.description}
                        </p>
                      </div>

                      {/* Status Icon */}
                      <div className="flex-shrink-0">
                        {hasError ? (
                          <div className="w-6 h-6 bg-status-error rounded-full flex items-center justify-center">
                            <svg
                              className="w-4 h-4 text-on-solid"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                        ) : isComplete ? (
                          <div className="w-6 h-6 bg-status-ready rounded-full flex items-center justify-center">
                            <svg
                              className="w-4 h-4 text-on-solid"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                        ) : isActive ? (
                          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <div className="w-6 h-6 bg-neutral-300 rounded-full flex items-center justify-center">
                            <svg
                              className="w-4 h-4 text-muted"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PreviewContent;

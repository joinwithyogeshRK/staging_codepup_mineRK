import React from "react";
import {
  Loader2,
  Code,
  AlertCircle,
  Plus,
  Send,
  FileText,
  Palette,
  Database,
  Monitor,
  Rocket,
  CheckCircle,
  Globe,
  Paperclip,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import PdfPreview from "@/components/pdfpreview";
import Credit from "../../../components/Credit";
import { useToast } from "../../../helper/Toast";
import { Link } from "react-router-dom";
import ShareSection from "./ShareSection";
import { validateFile } from "../../../utils/fileValidation";

interface Message {
  id: string;
  type: "user" | "assistant";
  content: string;
  timestamp: Date;
  workflowStep?: string;
  isStreaming?: boolean;
}

interface ChatSectionProps {
  // Layout props
  isChatHidden: boolean;
  isNarrow: boolean;
  leftWidthPct: number;
  toggleChatSidebar: () => void;

  // Message props
  messages: Message[];
  messagesEndRef: React.RefObject<HTMLDivElement | null>; // Fixed: Added | null

  // Input props
  prompt: string;
  handlePromptChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  handleKeyPress: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  handlePaste: (e: React.ClipboardEvent<HTMLTextAreaElement>) => void;
  handleSubmit: () => void;

  // Universal file upload props
  selectedFiles: File[];
  setSelectedFiles: React.Dispatch<React.SetStateAction<File[]>>;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  unifiedFileInputRef: React.RefObject<HTMLInputElement | null>;
  rawFilesForUpload: File[];
  setRawFilesForUpload: React.Dispatch<React.SetStateAction<File[]>>;
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  removeFile: (index: number) => void;
  clearSelectedFiles: () => void;
  showUploadMenu: boolean;
  toggleUploadMenu: () => void;
  showDocsInput: boolean;
  setShowDocsInput: React.Dispatch<React.SetStateAction<boolean>>;

  // Status props
  isLoading: boolean;
  projectStatus: string;
  isStreamingResponse: boolean;
  isStreamingGeneration: boolean;
  isWorkflowActive: boolean;
  isNavigating: boolean;
  isServerHealthy: boolean | null;
  isModifying: boolean;
  isStreamingModification: boolean;
  isDeploying: boolean;
  isAgentActivating: boolean;
  deployError: string | null;
  setDeployError: React.Dispatch<React.SetStateAction<string | null>>;

  // Project props
  currentProject: any;
  existingProject: boolean | undefined; // Fixed: Added | undefined
  fromWorkflow: boolean | undefined; // Fixed: Added | undefined
  currentWorkflowStep: string;
  workflowProgress: number;
  projectId: number | undefined;

  // Toast
  showToast: (
    message: string,
    type: "success" | "error",
    duration?: number
  ) => void;
  getToken: () => Promise<string | null>;

  // Credits and Share props
  credits: number | null;
  shareAbleUrl: string;
  showPublishMenu: boolean;
  setShowPublishMenu: React.Dispatch<React.SetStateAction<boolean>>;
  handleDeploy: () => void;
  canDeploy: boolean | number | undefined;
}

const ChatSection: React.FC<ChatSectionProps> = ({
  isChatHidden,
  isNarrow,
  leftWidthPct,
  toggleChatSidebar,
  messages,
  messagesEndRef,
  prompt,
  handlePromptChange,
  handleKeyPress,
  handlePaste,
  handleSubmit,
  selectedFiles,
  setSelectedFiles,
  fileInputRef,
  unifiedFileInputRef,
  rawFilesForUpload,
  setRawFilesForUpload,
  handleFileSelect,
  removeFile,
  clearSelectedFiles,
  showUploadMenu,
  toggleUploadMenu,
  showDocsInput,
  setShowDocsInput,
  isLoading,
  projectStatus,
  isStreamingResponse,
  isStreamingGeneration,
  isWorkflowActive,
  isNavigating,
  isServerHealthy,
  isModifying,
  isStreamingModification,
  isDeploying,
  isAgentActivating,
  deployError,
  setDeployError,
  currentProject,
  existingProject,
  fromWorkflow,
  currentWorkflowStep,
  workflowProgress,
  projectId,
  showToast,
  getToken,
  credits,
  shareAbleUrl,
  showPublishMenu,
  setShowPublishMenu,
  handleDeploy,
  canDeploy,
}) => {
  const { showToast: globalShowToast } = useToast();
  const notify = showToast || globalShowToast;

  return (
    <div
      className={`sidebar transition-all duration-300 ease-out flex flex-col ${
        isChatHidden ? "w-0 overflow-hidden" : ""
      }`}
      style={{
        width: isChatHidden ? "0%" : isNarrow ? "100%" : `${leftWidthPct}%`,
      }}
    >
      <div className="header-bar">
        <div className="flex items-center justify-between w-full h-10">
          <div className="flex items-center h-8">
            <Link
              to="/"
              className="text-base font-semibold text-strong flex items-center gap-2 h-8"
            >
              <img
                src="/favicon.ico"
                alt="CodePup Logo"
                className="w-6 h-6 object-contain"
              />
              CodePup
            </Link>
          </div>
          <div className="flex items-center gap-2 h-8">
            {/* Credits and Share buttons - Medium and Large devices only (below lg) */}
            <div className="flex lg:hidden items-center gap-2">
              {/* Credits Indicator */}
              <div className="flex items-center">
                <Credit value={credits || 0} />
              </div>

              {/* Share Button */}
              <ShareSection
                showPublishMenu={showPublishMenu}
                setShowPublishMenu={setShowPublishMenu}
                shareAbleUrl={shareAbleUrl}
                handleDeploy={handleDeploy}
                isDeploying={isDeploying}
                canDeploy={canDeploy}
              />
            </div>

            {/* Toggle Chat Sidebar Button */}
            <button
              onClick={toggleChatSidebar}
              className="p-1.5 hover:bg-slate-100 rounded-md transition-colors"
              title="Hide chat sidebar (Ctrl+B)"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 -960 960 960"
                className="shrink-0 h-4 w-4"
                fill="currentColor"
              >
                <path d="M180-120q-24.75 0-42.37-17.63Q120-155.25 120-180v-600q0-24.75 17.63-42.38Q155.25-840 180-840h600q24.75 0 42.38 17.62Q840-804.75 840-780v600q0 24.75-17.62 42.37Q804.75-120 780-120zm207-60h393v-600H387z"></path>
              </svg>
            </button>
          </div>

          {/* Deployment Status Bar */}
          {deployError && (
            <div className="mt-3 alert p-2">
              <div className="alert alert-error p-2">
                <div className="flex items-center gap-2 mb-1">
                  <AlertCircle className="w-3 h-3 text-danger-weak" />
                  <span className="text-xs font-medium text-danger-weak">
                    Deployment Error
                  </span>
                </div>
                <p className="text-xs text-danger-weak break-words">
                  {deployError}
                </p>
                <button
                  onClick={() => setDeployError(null)}
                  className="text-xs text-danger-weak hover:text-danger mt-1 underline"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Server Status */}
      {isServerHealthy === false && (
        <div className="banner-error">
          <div className="flex items-center gap-2 mb-1">
            <AlertCircle className="w-4 h-4 text-danger" />
            <span className="text-xs font-medium text-danger">
              SERVER OFFLINE
            </span>
          </div>
          <p className="text-xs text-danger">
            Cannot connect to backend server
          </p>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 flex flex-col chat-messages-container">
        {/* Messages */}
        {messages.length === 0 &&
        (projectStatus === "loading" ||
          projectStatus === "fetching" ||
          isWorkflowActive ||
          isNavigating) ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="p-4 bg-surface-ghost rounded-full mb-4">
              {isWorkflowActive ? (
                <img
                  src="/main.png"
                  alt="CodePup Logo"
                  className="w-16 h-16 md:w-8 md:h-8 object-contain"
                />
              ) : (
                <Loader2 className="w-8 h-8 text-strong animate-spin" />
              )}
            </div>
            <h3 className="text-lg font-medium text-strong mb-2">
              {isNavigating
                ? "Preparing Workspace"
                : isWorkflowActive
                ? "Complete Application Generation"
                : projectStatus === "fetching"
                ? "Fetching Project"
                : existingProject
                ? "Loading Project"
                : "Generating Code"}
            </h3>
            <p className="text-muted max-w-sm text-sm break-words">
              {isNavigating
                ? "Setting up your project workspace..."
                : isWorkflowActive
                ? `${currentWorkflowStep} • ${workflowProgress}% complete`
                : projectStatus === "fetching"
                ? "Fetching project details and deployment status..."
                : existingProject
                ? "Loading your project preview..."
                : "We are generating code files please wait"}
            </p>
            {currentProject && (
              <div className="mt-3 text-xs text-muted break-all max-w-full">
                Project ID: {currentProject.id} • Status:{" "}
                {currentProject.status}
              </div>
            )}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="p-4 bg-surface-ghost rounded-full mb-4">
              <Code className="w-8 h-8 text-muted" />
            </div>
            <h3 className="text-lg font-medium text-strong mb-2">
              Ready to Chat
            </h3>
            <p className="text-muted max-w-sm text-sm break-words">
              {currentProject && currentProject.status === "ready"
                ? "Your project is ready! Start describing changes you'd like to make."
                : fromWorkflow
                ? "Complete application generation will start when you submit a prompt..."
                : "Start describing your project or changes you'd like to make"}
            </p>
            {currentProject && (
              <div className="mt-3 text-xs text-muted break-all max-w-full">
                Project: {currentProject.name || currentProject.id}
              </div>
            )}
          </div>
        ) : (
          <>
            {messages
              .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
              .map((message, index) => {
                // Check if this is an assistant message and if we should show the logo
                const shouldShowLogo =
                  message.type === "assistant" &&
                  (index === 0 || messages[index - 1]?.type !== "assistant");

                return (
                  <div
                    key={message.id}
                    className={`${
                      message.type === "user"
                        ? "message-user ml-auto"
                        : "message-assistant"
                    }`}
                  >
                    {/* Show Codepup logo and name only for first assistant message in a sequence */}
                    {shouldShowLogo && (
                      <div className="flex items-center gap-3 mb-2">
                        <img
                          src="/favicon.ico"
                          alt="Codepup"
                          className="w-4 h-4 rounded-sm block"
                        />
                        <span className="text-strong text-sm font-medium leading-none -mb-0.5">
                          Codepup
                        </span>
                      </div>
                    )}

                    <div className="flex items-start gap-2">
                      {message.workflowStep && (
                        <div className="mt-1 flex-shrink-0">
                          {message.workflowStep === "Design Generation" && (
                            <Palette className="w-3 h-3 text-primary-weak" />
                          )}
                          {message.workflowStep === "Structure Planning" && (
                            <FileText className="w-3 h-3 text-success-weak" />
                          )}
                          {message.workflowStep === "Backend Generation" && (
                            <Database className="w-3 h-3 text-accent-purple" />
                          )}
                          {message.workflowStep === "Frontend Generation" && (
                            <Monitor className="w-3 h-3 text-accent-orange" />
                          )}
                          {message.workflowStep === "Deployment" && (
                            <Rocket className="w-3 h-3 text-success-weak" />
                          )}
                          {message.workflowStep === "Deployment Complete" && (
                            <CheckCircle className="w-3 h-3 text-success-weak" />
                          )}
                          {message.workflowStep === "Deployment Error" && (
                            <AlertCircle className="w-3 h-3 text-danger-weak" />
                          )}
                        </div>
                      )}
                      <div
                        className={`${
                          message.type === "assistant"
                            ? "text-muted "
                            : "text-strong"
                        } text-sm flex-1 min-w-0 overflow-hidden`}
                      >
                        <div className="whitespace-pre-wrap break-words word-wrap-break-word overflow-wrap-anywhere">
                          {/* Render message content as markdown with custom styling */}
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                              // Links - blue with hover effect
                              a: ({ children, ...props }) => (
                                <a
                                  {...props}
                                  className="md-link"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  {children}
                                </a>
                              ),
                              // Bold text - white and semibold
                              strong: ({ children, ...props }) => (
                                <strong {...props} className="md-strong">
                                  {children}
                                </strong>
                              ),
                              // Headers - white with proper spacing
                              h1: ({ children, ...props }) => (
                                <h1 {...props} className="md-h1">
                                  {children}
                                </h1>
                              ),
                              h2: ({ children, ...props }) => (
                                <h2 {...props} className="md-h2">
                                  {children}
                                </h2>
                              ),
                              // Lists - bullet and numbered with spacing
                              ul: ({ children, ...props }) => (
                                <ul
                                  {...props}
                                  className="list-disc list-inside mb-2 space-y-1"
                                >
                                  {children}
                                </ul>
                              ),
                              ol: ({ children, ...props }) => (
                                <ol
                                  {...props}
                                  className="list-decimal list-inside mb-2 space-y-1"
                                >
                                  {children}
                                </ol>
                              ),
                              // Code - inline and block with dark background
                              code: ({ children, className, ...props }) => {
                                const isInline = !className;
                                return isInline ? (
                                  <code {...props} className="code-inline">
                                    {children}
                                  </code>
                                ) : (
                                  <code {...props} className="code-block">
                                    {children}
                                  </code>
                                );
                              },
                              // Blockquotes - left border with italic text
                              blockquote: ({ children, ...props }) => (
                                <blockquote {...props} className="blockquote">
                                  {children}
                                </blockquote>
                              ),
                            }}
                          >
                            {message.content}
                          </ReactMarkdown>
                        </div>
                        {message.isStreaming && (
                          <span className="inline-block w-2 h-4 bg-primary ml-1 animate-pulse"></span>
                        )}
                      </div>
                      {message.isStreaming && (
                        <Loader2 className="w-3 h-3 text-muted animate-spin mt-0.5 flex-shrink-0" />
                      )}
                    </div>
                  </div>
                );
              })}
            {/* Auto-scroll sentinel */}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Area */}
      <div className="chat-input-area">
        {rawFilesForUpload.length > 0 && (
          <div className="mb-3 p-2 bg-subtle rounded-lg border border-default">
            <div className="flex items-center justify-between mb-2">
              <div className="flex flex-col">
                <span className="text-xs text-body">
                  {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''} selected
                </span>
                {existingProject && currentProject?.status === "ready" && (
                  <span className="text-xs text-muted">
                    {Math.round(rawFilesForUpload.reduce((total, file) => total + file.size, 0) / (1024 * 1024) * 10) / 10}MB / 30MB
                  </span>
                )}
              </div>
              <button
                onClick={clearSelectedFiles}
                className="text-xs text-danger hover:text-danger-weak"
              >
                Clear all
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {rawFilesForUpload.map((file, index) => (
                <div
                  key={index}
                  className="relative flex-shrink-0 overflow-visible"
                >
                  {file.type === "application/pdf" ? (
                    // Show PDF file icon with grey background and PDF text
                    <div className="w-12 h-12 bg-gray-200 rounded border border-gray-300 flex items-center justify-center">
                      <span className="text-xs text-gray-600 font-mono font-bold">PDF</span>
                    </div>
                  ) : file.type.startsWith("image/") ? (
                    // Show image preview for image files
                    <img
                      src={URL.createObjectURL(file)}
                      alt={file.name}
                      className="w-12 h-12 object-cover rounded border border-strong"
                    />
                  ) : (
                    // Show file type icon for other files
                    <div className="w-12 h-12 bg-tile rounded border border-strong flex items-center justify-center">
                      <span className="text-xs text-white font-mono">
                        {file.name.split(".").pop()?.toUpperCase() || "FILE"}
                      </span>
                    </div>
                  )}
                  <button
                    onClick={() => removeFile(index)}
                    className="absolute -top-1 -right-1 btn-circle-danger z-10"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Universal File Upload Input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept=".jpg,.jpeg,.png,.gif,.webp,.svg,.ico,.pdf"
          multiple
          className="hidden"
        />

        {/* Unified File Input for Paperclip Button */}
        <input
          type="file"
          ref={unifiedFileInputRef}
          onChange={handleFileSelect}
          accept=".jpg,.jpeg,.png,.gif,.webp,.svg,.ico,.pdf"
          multiple
          className="hidden"
        />

        {/* Refactored Chat Input Bar - Lovable Style */}
        <div className="chat-input-container">
          {/* Part 1: Input Field (Full Width) */}
          <div className="chat-input-field-section">
            <textarea
              className="chat-textarea"
              value={prompt}
              onChange={handlePromptChange}
              onKeyPress={handleKeyPress}
              onPaste={handlePaste}
              onInput={(e) => {
                // Auto-resize textarea
                const textarea = e.target as HTMLTextAreaElement;
                textarea.style.height = "auto";

                // Calculate max height (12rem = 192px)
                const maxHeight = 12 * 16;

                // Set height based on content, but don't exceed max
                const newHeight = Math.min(textarea.scrollHeight, maxHeight);
                textarea.style.height = newHeight + "px";
              }}
              placeholder={
                isServerHealthy === false
                  ? "Server offline..."
                  : isAgentActivating
                  ? "Agent is waking up..."
                  : isWorkflowActive || isStreamingGeneration
                  ? "Workflow in progress..."
                  : isModifying || isStreamingModification
                  ? "Modification in progress..."
                  : isDeploying
                  ? "Deployment in progress..."
                  : "Ask Codepup..."
              }
              disabled={
                isLoading ||
                projectStatus === "loading" ||
                projectStatus === "fetching" ||
                isStreamingResponse ||
                isStreamingGeneration ||
                isWorkflowActive ||
                isNavigating ||
                isServerHealthy === false ||
                isModifying ||
                isStreamingModification ||
                isDeploying ||
                isAgentActivating
              }
              maxLength={10000}
            />
          </div>

          {/* Part 2: Action Buttons (Separate Line) */}
          <div className="chat-input-buttons-section">
            {/* Left: Upload Button */}
            <div className="chat-buttons" data-upload-menu>
              <div className="relative">
                <button
                  onClick={() => unifiedFileInputRef.current?.click()}
                  disabled={
                    isLoading ||
                    projectStatus === "loading" ||
                    projectStatus === "fetching" ||
                    isStreamingResponse ||
                    isStreamingGeneration ||
                    isWorkflowActive ||
                    isNavigating ||
                    isServerHealthy === false ||
                    isModifying ||
                    isStreamingModification ||
                    isDeploying ||
                    isAgentActivating
                  }
                  className="chat-button"
                  title="Add files"
                >
                  <Paperclip className="w-4 h-4 -rotate-45" />
                </button>

              </div>
            </div>

            {/* Right: Send Button */}
            <div className="chat-buttons">
              <button
                onClick={() => {
                  // Only handleSubmit if idle + ready
                  if (
                    prompt.trim() &&
                    !isLoading &&
                    !isWorkflowActive &&
                    !isModifying &&
                    !isStreamingResponse &&
                    !isStreamingGeneration &&
                    !isStreamingModification
                  ) {
                    handleSubmit();
                  }
                }}
                disabled={
                  !prompt.trim() ||
                  isLoading ||
                  isWorkflowActive ||
                  isModifying ||
                  isStreamingResponse ||
                  isStreamingGeneration ||
                  isStreamingModification ||
                  isAgentActivating
                }
                className={`chat-button ${
                  prompt.trim() &&
                  !isLoading &&
                  !isWorkflowActive &&
                  !isModifying &&
                  !isStreamingResponse &&
                  !isStreamingGeneration &&
                  !isStreamingModification
                    ? "chat-button-primary"
                    : ""
                }`}
                title="Send message"
              >
                {isLoading || isWorkflowActive || isModifying ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Part 3: Status and Instructions (Bottom Section) */}
          <div className="chat-input-bottom-section">
            <span>
              {isServerHealthy === false ? (
                "Server offline - check connection"
              ) : isWorkflowActive || isStreamingGeneration ? (
                "Complete workflow in progress..."
              ) : isDeploying ? (
                "Deployment in progress..."
              ) : (
                <>
                  <span className="font-semibold">Enter</span> to send,{" "}
                  <span className="font-semibold">Shift+Enter</span> for new
                  line
                </>
              )}
            </span>
            <span>{prompt.length}/10000</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatSection;

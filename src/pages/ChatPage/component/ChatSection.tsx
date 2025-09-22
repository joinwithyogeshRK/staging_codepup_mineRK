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
  Globe
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import PdfPreview from "@/components/pdfpreview";
import UnifiedFileUploadSection from "../../../components/UnifiedFileUpload";
import type { UnifiedFileUploadRef } from "../../../components/UnifiedFileUpload";
import Credit from "../../../components/Credit";

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
  
  // File upload props
  uploadMode: "images" | "docs" | "assets";
  selectedImages: File[];
  setSelectedImages: React.Dispatch<React.SetStateAction<File[]>>;
  selectedAssets: File[];
  setSelectedAssets: React.Dispatch<React.SetStateAction<File[]>>;
  fileInputRef: React.RefObject<HTMLInputElement | null>; // Fixed: Added | null
  assetInputRef: React.RefObject<HTMLInputElement | null>; // Fixed: Added | null
  docsInputRef: React.RefObject<UnifiedFileUploadRef | null>; // Fixed: Added | null
  handleImageSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleAssetSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  removeImage: (index: number) => void;
  removeAsset: (index: number) => void;
  clearSelectedImages: () => void;
  clearSelectedAssets: () => void;
  showUploadMenu: boolean;
  toggleUploadMenu: () => void;
  selectUploadMode: (mode: "images" | "docs" | "assets", skipClear?: boolean) => void;
  showDocsInput: boolean;
  setShowDocsInput: React.Dispatch<React.SetStateAction<boolean>>;
  
  // Clipboard props
  clipboardImage: File | null;
  clipboardSelectedOption: "images" | "assets"; // Fixed: Changed from string to specific union type
  hoveredOption: "images" | "assets" | null; // Fixed: Changed from string | null to specific union type
  setHoveredOption: React.Dispatch<React.SetStateAction<"images" | "assets" | null>>; // Fixed: Updated type
  setClipboardImage: React.Dispatch<React.SetStateAction<File | null>>;
  setClipboardSelectedOption: React.Dispatch<React.SetStateAction<"images" | "assets">>; // Fixed: Updated type
  uploadFilesToDatabaseHelper: (files: File[]) => Promise<void>;
  
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
  showToast: (message: string, type: "success" | "error", duration?: number) => void;
  getToken: () => Promise<string | null>;
  
  // Credits and Share props
  credits: number | null;
  shareAbleUrl: string;
  showPublishMenu: boolean;
  setShowPublishMenu: React.Dispatch<React.SetStateAction<boolean>>;
  handleDeploy: () => void;
  canDeploy: boolean | number | undefined;
  deploymentUrl: string | null;
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
  uploadMode,
  selectedImages,
  setSelectedImages,
  selectedAssets,
  setSelectedAssets,
  fileInputRef,
  assetInputRef,
  docsInputRef,
  handleImageSelect,
  handleAssetSelect,
  removeImage,
  removeAsset,
  clearSelectedImages,
  clearSelectedAssets,
  showUploadMenu,
  toggleUploadMenu,
  selectUploadMode,
  showDocsInput,
  setShowDocsInput,
  clipboardImage,
  clipboardSelectedOption,
  hoveredOption,
  setHoveredOption,
  setClipboardImage,
  setClipboardSelectedOption,
  uploadFilesToDatabaseHelper,
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
  deploymentUrl,
}) => {
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
            <a
              href="/"
              className="text-base font-semibold text-strong flex items-center gap-2 h-8"
            >
              <img
                src="/favicon.ico"
                alt="CodePup Logo"
                className="w-6 h-6 object-contain"
              />
              CodePup
            </a>
          </div>
          <div className="flex items-center gap-2 h-8">
            {/* Credits and Share buttons - Medium and Large devices only (below lg) */}
            <div className="flex lg:hidden items-center gap-2">
              {/* Credits Indicator */}
              <div className="flex items-center">
                <Credit value={credits || 0} />
              </div>

              {/* Share Button */}
              <div className="flex relative items-center h-8" data-chat-publish-menu>
                <button
                  onClick={() => setShowPublishMenu((prev) => !prev)}
                  className="btn-publish-primary h-8 px-3 rounded-md"
                  title="Publish options"
                >
                  <div className="flex items-center gap-2">
                    <Rocket className="w-3 h-3" />
                    <span className="text-xs">Share</span>
                  </div>
                </button>
                {showPublishMenu && (
                  <>
                    <div
                      className="publish-overlay"
                      onMouseDown={() => setShowPublishMenu(false)}
                    />
                    <div
                      className="publish-dropdown z-dropdown fade-slide-in"
                      onAnimationEnd={(e) =>
                        e.currentTarget.classList.remove("fade-slide-in")
                      }
                    >
                      <div
                        className="publish-dropdown-content"
                        onMouseDown={(e) => e.stopPropagation()}
                      >
                        <div>
                          <div className="publish-dropdown-title">
                            Publish
                          </div>
                          <div className="publish-dropdown-desc">
                            Deploy your project and track its performance.
                          </div>
                        </div>
                        {shareAbleUrl && (
                          <div className="publish-preview">
                            <Globe className="w-4 h-4 text-slate-600 mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <div className="publish-preview-title">
                                Preview
                              </div>
                              <a
                                className="publish-preview-link"
                                href={shareAbleUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                {shareAbleUrl}
                              </a>
                            </div>
                          </div>
                        )}
                        <div className="pt-1">
                          <button
                            onClick={() => {
                              handleDeploy();
                            }}
                            className="btn-publish-primary w-full"
                            disabled={
                              isDeploying || (!canDeploy && !deploymentUrl)
                            }
                          >
                            {isDeploying ? (
                              <div className="flex items-center justify-center gap-2">
                                <Loader2 className="w-3 h-3 animate-spin" />
                                <span className="text-xs">Generating shareable URL...</span>
                              </div>
                            ) : (
                              <span className="text-sm font-medium">Generate shareable URL</span> 
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
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
                  (index === 0 ||
                    messages[index - 1]?.type !== "assistant");

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
                      <div className={`${message.type === "assistant" ? "text-muted " : "text-strong"} text-sm flex-1 min-w-0 overflow-hidden`}>
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
                                <blockquote
                                  {...props}
                                  className="blockquote"
                                >
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
        {((uploadMode === "images" && selectedImages.length > 0) ||
          (uploadMode === "docs" && selectedImages.length > 0) ||
          (uploadMode === "assets" && selectedAssets.length > 0)) && (
          <div className="mb-3 p-2 bg-subtle rounded-lg border border-default">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-body">
                {uploadMode === "images"
                  ? `${selectedImages.length} image${
                      selectedImages.length > 1 ? "s" : ""
                    } selected`
                  : uploadMode === "docs"
                  ? `${selectedImages.length} document${
                      selectedImages.length > 1 ? "s" : ""
                    } selected`
                  : `${selectedAssets.length} asset${
                      selectedAssets.length > 1 ? "s" : ""
                    } selected`}
              </span>
              <button
                onClick={() =>
                  uploadMode === "images"
                    ? clearSelectedImages()
                    : clearSelectedAssets()
                }
                className="text-xs text-danger hover:text-danger-weak"
              >
                Clear all
              </button>
            </div>
            <div className="flex gap-2 overflow-visible">
              {uploadMode === "images" || uploadMode === "docs"
                ? // Image and Docs previews (both use selectedImages)
                  selectedImages.map((image, index) => (
                    <div
                      key={index}
                      className="relative flex-shrink-0 overflow-visible"
                    >
                      {uploadMode === "docs" ? (
                        // Use PdfPreview component for docs mode
                        <PdfPreview
                          file={image}
                          onRemove={() => removeImage(index)}
                          size="medium"
                        />
                      ) : (
                        // Show image preview for images mode
                        <img
                          src={URL.createObjectURL(image)}
                          alt={`Preview ${index + 1}`}
                          className="w-12 h-12 object-cover rounded border border-strong"
                        />
                      )}
                      {uploadMode !== "docs" && (
                        <button
                          onClick={() => removeImage(index)}
                          className="absolute -top-1 -right-1 btn-circle-danger z-10"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))
                : // Asset previews
                  selectedAssets.map((asset, index) => (
                    <div
                      key={index}
                      className="relative flex-shrink-0 overflow-visible"
                    >
                      <div className="w-12 h-12 bg-tile rounded border border-strong flex items-center justify-center">
                        {asset.type.startsWith("image/") ? (
                          <img
                            src={URL.createObjectURL(asset)}
                            alt={asset.name}
                            className="w-full h-full object-cover rounded"
                          />
                        ) : (
                          <span className="text-xs text-body font-mono">
                            {asset.name.split(".").pop()?.toUpperCase() ||
                              "FILE"}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => removeAsset(index)}
                        className="absolute -top-1 -right-1 btn-circle-danger z-10"
                      >
                        ×
                      </button>
                    </div>
                  ))}
            </div>
          </div>
        )}

        {(uploadMode === "docs" || showDocsInput) && (
          <div className={`${showDocsInput ? "block" : "hidden"} mb-3`}>
            <UnifiedFileUploadSection
              ref={docsInputRef}
              selectedFiles={selectedImages}
              setSelectedFiles={(files) => {
                setSelectedImages(files);
                // Automatically hide the input after file selection
                if (files.length > 0) {
                  setTimeout(() => setShowDocsInput(false), 200);
                  showToast("Files selected successfully", "success");
                }
              }}
              isConfigValid={true}
              uploadMode="docs"
              projectId={projectId}
              getToken={getToken}
              showToast={showToast}
            />
          </div>
        )}

        {/* File Upload Inputs - Only for images and assets (docs handled by UnifiedFileUploadSection) */}
        {uploadMode !== "docs" && (
          <>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageSelect}
              accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml,image/ico,image/x-icon,image/vnd.microsoft.icon,image/bmp,image/tiff"
              multiple
              className="hidden"
            />
            <input
              type="file"
              ref={assetInputRef}
              onChange={handleAssetSelect}
              accept="image/*,application/pdf,text/plain,application/json,audio/*,video/*,font/*,text/css,application/javascript,application/zip"
              multiple
              className="hidden"
            />
          </>
        )}

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
                const newHeight = Math.min(
                  textarea.scrollHeight,
                  maxHeight
                );
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
              maxLength={1000}
            />
          </div>

          {/* Part 2: Action Buttons (Separate Line) */}
          <div className="chat-input-buttons-section">
            {/* Left: Upload Button */}
            <div className="chat-buttons" data-upload-menu>
              <div className="relative">
                <button
                  onClick={toggleUploadMenu}
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
                  <Plus className="w-4 h-4" />
                </button>

                {/* Dropdown Menu */}
                {showUploadMenu && (
                  <div className="absolute bottom-full left-0 mb-2 dropdown py-1 min-w-[140px] animate-in fade-in-0 zoom-in-95 duration-200 origin-bottom-left">
                    {/* Clipboard Image Header */}
                    {clipboardImage && (
                      <div className="px-3 py-2 border-b animate-in fade-in-0 slide-in-from-top-2 duration-200">
                        <div className="text-xs text-muted mb-2">
                          📋 Clipboard Image Detected
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          {clipboardImage.type === "application/pdf" ||
                          clipboardImage.name
                            .toLowerCase()
                            .endsWith(".pdf") ? (
                            // Show PDF icon for PDF files
                            <div className="w-8 h-8 bg-red-100 rounded border border-strong flex items-center justify-center">
                              <FileText className="w-4 h-4 text-red-600" />
                            </div>
                          ) : (
                            // Show image preview for images
                            <img
                              src={URL.createObjectURL(clipboardImage)}
                              alt="Clipboard"
                              className="w-8 h-8 object-cover rounded border border-strong"
                            />
                          )}
                          <span className="text-xs text-body truncate">
                            {clipboardImage.name}
                          </span>
                        </div>
                        <div className="text-xs text-muted">
                          Select category to add:
                        </div>
                      </div>
                    )}

                    <button
                      onClick={() => {
                        if (clipboardImage) {
                          // Add clipboard image to images (replace existing selection)
                          setSelectedImages([clipboardImage]); // Only one image allowed
                          // Upload clipboard image to database
                          uploadFilesToDatabaseHelper([clipboardImage]);
                          // Switch to images mode to show the preview
                          selectUploadMode("images", true); // Skip clearing to keep the image
                          setClipboardImage(null); // Clear clipboard image
                          setClipboardSelectedOption("images");
                        } else {
                          // Regular file upload
                          selectUploadMode("images");
                          fileInputRef.current?.click();
                        }
                      }}
                      onMouseEnter={() => {
                        if (clipboardImage) {
                          setHoveredOption("images");
                          setClipboardSelectedOption("images");
                        }
                      }}
                      onMouseLeave={() => {
                        setHoveredOption(null);
                      }}
                      className={`menu-item transition-all duration-150 ${
                        clipboardImage &&
                        (clipboardSelectedOption === "images" ||
                          hoveredOption === "images")
                          ? "bg-primary-subtle border-primary text-primary"
                          : hoveredOption === "images"
                          ? "bg-slate-50 text-slate-900"
                          : "hover:bg-slate-50 hover:text-slate-900"
                      }`}
                    >
                      🖼️ <span>Images</span>
                      {clipboardImage && (
                        <span className="text-xs text-primary-weak">
                          (Add clipboard)
                        </span>
                      )}
                    </button>

                    <button
                      onClick={() => {
                        if (clipboardImage) {
                          // Add clipboard image to assets (replace existing selection)
                          setSelectedAssets([clipboardImage]); // Only one asset allowed
                          // Upload clipboard image to database
                          uploadFilesToDatabaseHelper([clipboardImage]);
                          // Switch to assets mode to show the preview
                          selectUploadMode("assets", true); // Skip clearing to keep the asset
                          setClipboardImage(null); // Clear clipboard image
                          setClipboardSelectedOption("assets");
                        } else {
                          // Regular file upload
                          selectUploadMode("assets");
                          assetInputRef.current?.click();
                        }
                      }}
                      onMouseEnter={() => {
                        if (clipboardImage) {
                          setHoveredOption("assets");
                          setClipboardSelectedOption("assets");
                        }
                      }}
                      onMouseLeave={() => {
                        setHoveredOption(null);
                      }}
                      className={`menu-item transition-all duration-150 ${
                        clipboardImage &&
                        (clipboardSelectedOption === "assets" ||
                          hoveredOption === "assets")
                          ? "bg-primary-subtle border-primary text-primary"
                          : hoveredOption === "assets"
                          ? "bg-slate-50 text-slate-900"
                          : "hover:bg-slate-50 hover:text-slate-900"
                      }`}
                    >
                      📁 <span>Assets</span>
                      {clipboardImage && (
                        <span className="text-xs text-primary-weak">
                          (Add clipboard)
                        </span>
                      )}
                    </button>
                    {!clipboardImage && (
                      <button
                        onClick={() => {
                          selectUploadMode("docs");
                          // Show the docs input section
                          setShowDocsInput(true);
                          // Auto-trigger the file selection after a brief delay
                          setTimeout(() => {
                            docsInputRef.current?.click();
                          }, 100);
                        }}
                        className={`menu-item transition-all duration-150 hover:bg-slate-50 hover:text-slate-900`}
                      >
                        📄 <span>Docs</span>
                      </button>
                    )}
                  </div>
                )}
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
            <span>{prompt.length}/1000</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatSection;

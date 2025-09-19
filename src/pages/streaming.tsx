// Enhanced Streaming Code Display Component - Main Content Version
import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { FileText, CheckCircle, Clock } from "lucide-react";
import Editor from "@monaco-editor/react";
import { Folder, FolderOpen } from "lucide-react";

import { amplitude } from "../utils/amplitude";

// Prevent Monaco from showing errors
import * as monaco from "monaco-editor";
monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
  noSemanticValidation: true,
  noSyntaxValidation: true,
});

monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
  noSemanticValidation: true,
  noSyntaxValidation: true,
});

export const StreamingCodeDisplay: React.FC<{
  content: string;
  isStreaming: boolean;
  files: Array<{
    filename: string;
    content: string;
    isComplete: boolean;
    size?: number;
  }>;
  currentFile?: string;
  progress: number;
}> = ({ content, isStreaming, files, currentFile, progress }) => {
  // === File state management ===
  type FileContentState = {
    filename: string;
    content: string;
    isComplete: boolean;
    size?: number;
  };
  const [fileStates, setFileStates] = useState<FileContentState[]>([]);
  const editorRefs = useRef<Map<string, any>>(new Map()); // Store Monaco editor instances
  
  // === Buffer-based file checking (every 5 seconds) ===
  const fileCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastCheckTimeRef = useRef(0);
  const CHECK_INTERVAL = 5000; // Check every 5 seconds
  const processedFilesRef = useRef<Set<string>>(new Set()); // Track processed files to prevent duplicates

  // === VS Code-like file tree state ===
  const [selectedFile, setSelectedFile] = useState<string>("src/App.tsx"); // Currently selected file in editor
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(["src"])); // Expanded folders in tree

  // === Streaming buffer management (for Monaco) ===
  const bufferRef = useRef(""); // Accumulates incoming stream chunks
  const hasSkippedPrefixRef = useRef(false); // Tracks if we've skipped the JSON prefix

  // === Monaco Editor Helpers ===
  // Auto-scroll editor to show latest content
  const autoScrollEditor = useCallback((filename: string) => {
    const editor = editorRefs.current.get(filename);
    if (!editor) return;
    try {
      const model = editor.getModel();
      if (model) {
        const lineCount = model.getLineCount();
        const lastLine = Math.max(1, lineCount);
        editor.revealLineInCenter(lastLine);
        const lastLineContent = model.getLineContent(lastLine);
        if (lastLineContent && lastLineContent.length > 0) {
          editor.revealPositionInCenter({ lineNumber: lastLine, column: lastLineContent.length + 1 });
        }
      }
    } catch {
      // no-op
    }
  }, []);

  // Update or add file to state
  const updateOrAddFile = useCallback((filename: string, fullContent: string, markComplete: boolean) => {
    setFileStates(prev => {
      const idx = prev.findIndex(f => f.filename === filename);
      const newState: FileContentState = { 
        filename, 
        content: fullContent, 
        isComplete: markComplete,
        size: fullContent.length
      };
      
      if (idx >= 0) {
        const existing = prev[idx];
        if (existing.content !== fullContent) {
          const updated = [...prev];
          updated[idx] = newState;
          autoScrollEditor(filename);
          return updated;
        }
        return prev;
      } else {
        autoScrollEditor(filename);
        return [...prev, newState];
      }
    });
  }, [autoScrollEditor]);

  // Sync incoming files prop to Monaco file states
  useEffect(() => {
    if (!files || files.length === 0) return;
    files.forEach(f => {
      updateOrAddFile(f.filename, f.content, !!f.isComplete);
    });
  }, [files, updateOrAddFile]);

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      if (fileCheckIntervalRef.current) {
        clearInterval(fileCheckIntervalRef.current);
      }
      processedFilesRef.current.clear();
    };
  }, []);

  if (!isStreaming && !content && files.length === 0) return null;

  const completedFiles = files.filter((f) => f.isComplete);
  const monacoFiles = fileStates.length > 0 ? fileStates : files.map(f => ({
    filename: f.filename,
    content: f.content,
    isComplete: f.isComplete,
    size: f.content.length
  }));

  // === Memory Management ===
  const MAX_BUFFER_SIZE = 1000000; // 1MB buffer limit
  const MAX_FILES_DISPLAY = 20; // Limit displayed files for performance

  // === VS Code-like Display Logic ===
  const shouldShowFileTree = fileStates.length > 0;
  const selectedFileExists = fileStates.some(f => f.filename === selectedFile);
  
  // Auto-select first file if selected file doesn't exist
  useEffect(() => {
    if (fileStates.length > 0 && !selectedFileExists) {
      const firstFile = fileStates[0].filename;
      setSelectedFile(firstFile);
    }
  }, [fileStates, selectedFileExists]);

  // Force layout recalculation to fix click issues
  useEffect(() => {
    if (shouldShowFileTree) {
      // Force a reflow by accessing offsetHeight
      const container = document.querySelector('.file-tree-container') as HTMLElement;
      if (container) {
        container.offsetHeight; // Force reflow
      }
      
      // Also trigger on window resize
      const handleResize = () => {
        if (container) {
          container.offsetHeight; // Force reflow
        }
      };
      
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, [shouldShowFileTree]);

  // Additional fix: Force layout when files are added
  useEffect(() => {
    if (fileStates.length > 0) {
      // Small delay to ensure DOM is updated
      const timer = setTimeout(() => {
        const container = document.querySelector('.file-tree-container') as HTMLElement;
        if (container) {
          container.offsetHeight; // Force reflow
        }
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [fileStates.length]);
  
  // Handle viewport changes that affect click detection
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const handleViewportChange = () => {
      // Clear previous timeout
      clearTimeout(timeoutId);
      
      // Debounce the layout recalculation
      timeoutId = setTimeout(() => {
        const container = document.querySelector('.file-tree-container') as HTMLElement;
        if (container) {
          // Force layout recalculation
          container.style.display = 'none';
          container.offsetHeight; // Trigger reflow
          container.style.display = '';
        }
      }, 100);
    };

    // Listen for various events that might affect layout
    window.addEventListener('resize', handleViewportChange);
    window.addEventListener('orientationchange', handleViewportChange);
    
    // Also listen for DevTools opening/closing (this is the key fix)
    const mediaQuery = window.matchMedia('(max-width: 1024px)');
    mediaQuery.addEventListener('change', handleViewportChange);
    
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', handleViewportChange);
      window.removeEventListener('orientationchange', handleViewportChange);
      mediaQuery.removeEventListener('change', handleViewportChange);
    };
  }, []);

  // Build hierarchical folder structure from file paths
  const buildFolderStructure = useCallback((files: FileContentState[]) => {
    const structure: Record<string, any> = {};
    
    files.forEach(file => {
      const pathParts = file.filename.split('/');
      let current = structure;
      
      // Navigate/create directory structure
      for (let i = 0; i < pathParts.length - 1; i++) {
        const part = pathParts[i];
        if (!current[part]) {
          current[part] = { type: 'folder', children: {} };
        }
        current = current[part].children;
      }
      
      // Add file
      const fileName = pathParts[pathParts.length - 1];
      current[fileName] = { 
        type: 'file', 
        ...file,
        path: file.filename 
      };
    });
    
    return structure;
  }, []);

  const folderStructure = useMemo(() => {
    return buildFolderStructure(fileStates);
  }, [fileStates, buildFolderStructure]);

  // Get content of currently selected file
  const getSelectedFileContent = useCallback(() => {
    const file = fileStates.find(f => f.filename === selectedFile);
    return file?.content || '';
  }, [fileStates, selectedFile]);

  // Get language for Monaco editor based on file extension
  const getSelectedFileLanguage = useCallback(() => {
    const ext = selectedFile.split('.').pop()?.toLowerCase();
    if (ext === 'tsx' || ext === 'ts') return 'typescript';
    if (ext === 'jsx' || ext === 'js') return 'javascript';
    if (ext === 'css') return 'css';
    if (ext === 'html') return 'html';
    if (ext === 'json') return 'json';
    return 'plaintext';
  }, [selectedFile]);
  
  // Cleanup large buffers
  useEffect(() => {
    if (bufferRef.current.length > MAX_BUFFER_SIZE) {
      bufferRef.current = bufferRef.current.slice(-MAX_BUFFER_SIZE / 2);
    }
  }, [content]);

  // Limit displayed files for performance
  const limitedMonacoFiles = useMemo(() => {
    return monacoFiles.slice(0, MAX_FILES_DISPLAY);
  }, [monacoFiles]);

  // === Monaco Editor Error Handling ===
  // Handle Monaco editor errors with fallback to text display
  const handleEditorError = useCallback((error: any, filename: string) => {
    // Fallback to simple text display if Monaco fails
    setFileStates(prev => prev.map(f => 
      f.filename === filename ? { ...f, monacoError: true } : f
    ));
  }, []);

  // === Editor Instance Cleanup ===
  // Cleanup Monaco editor instances on unmount
  useEffect(() => {
    return () => {
      // Cleanup Monaco editor instances
      editorRefs.current.forEach((editor: any) => {
        try {
          if (editor && editor.dispose) {
            editor.dispose();
          }
        } catch (e) {
          
        }
      });
      editorRefs.current.clear();
    };
  }, []);

  // === File Tree Component ===
  const FileTreeItem = React.memo(({ item, path = '', level = 0 }: { item: any, path?: string, level?: number }) => {
    const isFolder = item.type === 'folder';
    const isExpanded = expandedFolders.has(path);
    const isSelected = selectedFile === path;
    
    // Use useCallback to ensure stable function references
    const handleClick = useCallback((e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      
      // Use requestAnimationFrame to ensure DOM is ready
      requestAnimationFrame(() => {
        if (isFolder) {
          const newExpanded = new Set(expandedFolders);
          if (isExpanded) {
            newExpanded.delete(path);
          } else {
            newExpanded.add(path);
          }
          setExpandedFolders(newExpanded);
        } else {
          setSelectedFile(path);
        }
      });
    }, [isFolder, path, isExpanded, expandedFolders, setExpandedFolders, setSelectedFile]);
  
    const getIcon = () => {
      if (isFolder) {
        return isExpanded 
          ? <FolderOpen className="w-4 h-4 text-strong inline-block" /> 
          : <Folder className="w-4 h-4 text-strong inline-block" />;
      }
      return null;
    };
  
    return (
      <div className="file-tree-item">
        <div 
          className={`flex items-center gap-2 px-2 py-1 text-sm cursor-pointer transition-colors relative ${
            isSelected ? 'bg-primary-subtle text-primary' : 'text-body hover:bg-subtle'
          }`}
          style={{ 
            paddingLeft: `${level * 16 + 8}px`,
            minHeight: '28px',
            userSelect: 'none',
            WebkitUserSelect: 'none',
          }}
          onClick={handleClick}
          onMouseDown={(e) => e.preventDefault()} // Prevent text selection issues
        >
          <span className="text-xs select-none pointer-events-none">{getIcon()}</span>
          <span className="truncate select-none pointer-events-none">{path.split('/').pop()}</span>
          {isFolder && (
            <span className="ml-auto text-xs select-none pointer-events-none">
              {isExpanded ? '▼' : '▶'}
            </span>
          )}
        </div>
        {isFolder && isExpanded && (
          <div className="folder-children">
            {Object.entries(item.children).map(([name, child]: [string, any]) => (
              <FileTreeItem 
                key={`${path}/${name}`}
                item={child} 
                path={`${path}/${name}`}
                level={level + 1}
              />
            ))}
          </div>
        )}
      </div>
    );
  });

  return (
    <div className="h-full relative" style={{ minHeight: '400px', width: '100%', overflow: 'hidden' }}>
      <style
        dangerouslySetInnerHTML={{
          __html: `
          #streaming-content::-webkit-scrollbar {
            display: none !important;
            width: 0 !important;
          }
          #streaming-content {
            -ms-overflow-style: none !important;
            scrollbar-width: none !important;
          }
          
          /* Also target any child divs */
          #streaming-content div::-webkit-scrollbar {
            display: none !important;
            width: 0 !important;
          }
          
          /* Monaco grid container scrollbar styling */
          .monaco-grid-container::-webkit-scrollbar {
            width: 8px;
            height: 8px;
          }
          .monaco-grid-container::-webkit-scrollbar-track {
            background: #f9f9f9;
            border-radius: 4px;
          }
          .monaco-grid-container::-webkit-scrollbar-thumb {
            background: #888;
            border-radius: 4px;
          }
          .monaco-grid-container::-webkit-scrollbar-thumb:hover {
            background: #555;
          }
          
          /* Ensure Monaco editor windows maintain consistent height */
          .monaco-editor-window {
            height: 400px !important;
            min-height: 400px !important;
            max-height: 400px !important;
          }
          
          /* Grid layout improvements */
          .monaco-grid {
            display: grid;
            gap: 16px;
            align-items: start;
            justify-items: stretch;
          }
          
          /* Ensure editor container takes full height */
          .monaco-editor-container {
            height: calc(400px - 60px) !important;
            min-height: calc(400px - 60px) !important;
            max-height: calc(400px - 60px) !important;
          }

          /* Force proper layout for file tree items */
          .file-tree-item > div {
            position: relative !important;
            z-index: 1 !important;
            pointer-events: auto !important;
            touch-action: manipulation !important;
          }

          /* Ensure no overlapping elements */
          .file-tree-container {
            position: relative !important;
            z-index: 10 !important;
          }

          /* Fix for potential Monaco editor overlay issues */
          .monaco-editor {
            position: relative !important;
            z-index: 1 !important;
          }
                    
        `,
        }}
      />
      

     

      {/* Main VS Code-like content - BEHIND OVERLAYS */}
      <div
        className={`h-full text-body flex flex-col border border-default rounded-lg overflow-hidden relative ${
          isStreaming ? "bg-surface-weak" : "bg-surface-overlay"
        }`}
      >
        {/* Simple Header */}
        

        {/* Content Area: VS Code-like layout with file tree and single editor */}
        <div className="flex-1 overflow-hidden flex">
          {/* File Tree Sidebar */}
          {shouldShowFileTree && (
            <div className="w-64 bg-subtle border-r border-default flex flex-col file-tree-container">
              {/* File Tree Header */}
              <div className="px-4 py-3 border-b border-default bg-neutral-tile">
                <h3 className="text-sm font-medium text-body">EXPLORER</h3>
              </div>
              
              {/* File Tree Content */}
              <div className="flex-1 overflow-auto">
                {Object.entries(folderStructure).map(([name, item]: [string, any]) => (
                  <FileTreeItem 
                    key={name}
                    item={item} 
                    path={name}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Monaco Editor Area */}
          <div className="flex-1 flex flex-col bg-surface">
            {/* Editor Header */}
            {selectedFile && (
              <div className="px-4 py-2 bg-subtle border-b border-default flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-body">{selectedFile}</span>
                  
                </div>
              </div>
            )}

            {/* Monaco Editor */}
            <div className="flex-1">
              {selectedFile && shouldShowFileTree ? (
                <Editor
                  height="100%"
                  language={getSelectedFileLanguage()}
                  value={getSelectedFileContent()}
                  theme="vs-light"
                  onMount={(editor: any) => {
                    editorRefs.current.set(selectedFile, editor);
                    try {
                      editor.onDidChangeModelContent(() => {
                        // Handle content changes if needed
                      });
                    } catch (error) {
                      handleEditorError(error, selectedFile);
                    }
                  }}
                  options={{
                    readOnly: true,
                    minimap: { enabled: false },
                    lineNumbers: "on",
                    renderLineHighlight: "all",
                    scrollBeyondLastLine: false,
                    wordWrap: "on",
                    fontSize: 14,
                    automaticLayout: true,
                    codeLens: false,
                    contextmenu: false,
                    quickSuggestions: false,
                    parameterHints: { enabled: false },
                    suggestOnTriggerCharacters: false,
                    // Disable code folding
                    folding: false,
                    // Disable bracket pair colorization
                    bracketPairColorization: { enabled: false },
                    // Disable inlay hints
                    inlayHints: { enabled: "off" },
                    // Disable hover
                    hover: { enabled: false },
                    // Disable links
                    links: false,
                    // Disable color decorators
                    colorDecorators: false,
                    // Disable format on save
                    formatOnPaste: false,
                    formatOnType: false,
                    // 🔑 These two stop Monaco from "dulling" code
                    "semanticHighlighting.enabled": false,
                    occurrencesHighlight: "off",
                    renderValidationDecorations: "off",
                    showUnused: false,
                    showDeprecated: false,
                  }}
                />
              ) : (
                <div className="h-full flex items-center justify-center bg-surface">
                  <div className="text-center text-muted">
                    <div className="w-16 h-16 bg-subtle rounded-lg mx-auto mb-4 flex items-center justify-center">
                      <FileText className="w-8 h-8 text-muted" />
                    </div>
                    <p className="text-lg text-body">Ready for code generation</p>
                    <p className="text-sm text-muted">Files will appear here when generated</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export class StreamingCodeParser {
  private static lastParseTime = 0;
  private static parseCache = new Map<string, any>();

  static parseStreamingChunk(chunk: string): {
    files: Array<{
      filename: string;
      content: string;
      isComplete: boolean;
      size: number;
    }>;
    currentFile?: string;
    progress: number;
    totalSize: number;
  } {
    const now = Date.now();

    // Cache key based on chunk size and trailing signature
    const cacheKey = `${chunk.length}-${chunk.slice(-200)}`;
    if (now - this.lastParseTime < 100 && this.parseCache.has(cacheKey)) {
      return this.parseCache.get(cacheKey);
    }
    this.lastParseTime = now;

    // Limit buffer for performance, preserve tail for partial tags
    const limitedChunk = chunk.length > 200000 ? chunk.slice(-200000) : chunk;

    // Extract complete <file> blocks
    const { files, currentFile } = this.extractFilesFromXml(limitedChunk);

    // Deduplicate and compute progress
    const uniqueFiles = this.deduplicateFiles(files);
    const progress = this.calculateProgress(uniqueFiles, limitedChunk.length);
    const totalSize = uniqueFiles.reduce((sum, f) => sum + f.size, 0);

    const result = { files: uniqueFiles, currentFile, progress, totalSize };
    this.parseCache.set(cacheKey, result);
    if (this.parseCache.size > 50) {
      const firstKey = this.parseCache.keys().next().value;
      if (firstKey !== undefined) this.parseCache.delete(firstKey);
    }
    return result;
  }

  // New: XML file block extractor for streaming buffer
  private static extractFilesFromXml(buffer: string): {
    files: Array<{ filename: string; content: string; isComplete: boolean; size: number }>;
    currentFile?: string;
  } {
    const files: Array<{ filename: string; content: string; isComplete: boolean; size: number }> = [];

    // Find complete <file path="..."> ... </file> blocks
    const fileBlockRegex = /<file\s+path=\"([^\"]+)\">([\s\S]*?)<\/file>/g;
    let match: RegExpExecArray | null;
    while ((match = fileBlockRegex.exec(buffer)) !== null) {
      const rawPath = match[1];
      const content = match[2];
      const filename = rawPath.trim().replace(/^[\/\\]+/, "");
      if (!this.isValidFilename(filename)) continue;
      const size = content.length;
      files.push({ filename, content, isComplete: true, size });
    }

    // Detect last open <file ...> without closing tag as current
    let currentFile: string | undefined;
    const lastOpenIdx = buffer.lastIndexOf('<file ');
    if (lastOpenIdx !== -1) {
      const openSlice = buffer.slice(lastOpenIdx);
      const openMatch = openSlice.match(/<file\s+path=\"([^\"]+)\">/);
      const hasClose = openSlice.includes('</file>');
      if (openMatch && !hasClose) {
        currentFile = openMatch[1].trim().replace(/^[\/\\]+/, "");
      }
    }

    return { files, currentFile };
  }

  // (Deprecated) JSON extractor removed for XML streaming

  /**
   * Unescapes JSON escaped strings - from LLMCodeParser
   */
  private static unescapeString(str: string): string {
    return str
      .replace(/\\n/g, "\n")
      .replace(/\\t/g, "\t")
      .replace(/\\r/g, "\r")
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, "\\");
  }

  private static parseCodefilesContent(
    content: string
  ): Array<{
    filename: string;
    content: string;
    isComplete: boolean;
    size: number;
  }> {
    const files: Array<{
      filename: string;
      content: string;
      isComplete: boolean;
      size: number;
    }> = [];

    try {
      // Try to parse as JSON first
      const jsonContent = `{${content}}`;
      const parsed = JSON.parse(jsonContent);

      Object.entries(parsed).forEach(([filename, fileContent]) => {
        if (typeof fileContent === "string" && this.isValidFilename(filename)) {
          const unescapedContent = this.unescapeString(fileContent);
          const size = unescapedContent.length;
          const isComplete = this.isFileComplete(unescapedContent, filename);

          files.push({ filename, content: unescapedContent, isComplete, size });
        }
      });
    } catch (e) {
      // If JSON parsing fails, try manual parsing
      const filePattern =
        /"([^"]+\.(?:tsx?|jsx?|js|ts|css|html?|json|md|txt|env|sql))"\s*:\s*"((?:[^"\\]|\\.)*)"/g;
      let match;

      while ((match = filePattern.exec(content)) !== null) {
        const filename = match[1].trim();
        const fileContent = this.unescapeString(match[2]);
        const size = fileContent.length;
        const isComplete = this.isFileComplete(fileContent, filename);

        if (this.isValidFilename(filename)) {
          files.push({ filename, content: fileContent, isComplete, size });
        }
      }
    }

    return files;
  }

  private static isValidFilename(filename: string): boolean {
    // Check if filename has valid extension and reasonable length
    const validExtensions =
      /\.(tsx?|jsx?|js|ts|css|html?|json|md|txt|env|sql|py|java|c|cpp|php|rb|go|rs|swift|kt|scala)$/i;
    return (
      validExtensions.test(filename) &&
      filename.length > 3 &&
      filename.length < 200 &&
      !filename.includes("..") &&
      !/[<>:"|?*]/.test(filename)
    );
  }

  private static isFileComplete(content: string, filename: string): boolean {
    if (content.length < 30) return false;

    // Check for incomplete indicators
    const incompleteIndicators = [
      "...",
      "// ... rest of",
      "/* ... */",
      "// TODO",
      "// INCOMPLETE",
      "// PARTIAL",
      "..more content..",
      "TRUNCATED",
      "[CONTENT CONTINUES]",
    ];

    const hasIncompleteIndicator = incompleteIndicators.some((indicator) =>
      content.toLowerCase().includes(indicator.toLowerCase())
    );

    if (hasIncompleteIndicator) return false;

    // Basic structure checks based on file type
    const ext = filename.split(".").pop()?.toLowerCase();

    switch (ext) {
      case "tsx":
      case "jsx":
        return (
          content.includes("export") &&
          (content.includes("return") || content.includes("React"))
        );
      case "ts":
      case "js":
        return (
          content.includes("export") ||
          content.includes("function") ||
          content.includes("const")
        );
      case "css":
        return content.includes("{") && content.includes("}");
      case "json":
        try {
          JSON.parse(content);
          return true;
        } catch {
          return false;
        }
      case "html":
        return content.includes("<") && content.includes(">");
      default:
        return content.length > 50;
    }
  }

  private static deduplicateFiles(
    files: Array<{
      filename: string;
      content: string;
      isComplete: boolean;
      size: number;
    }>
  ): Array<{
    filename: string;
    content: string;
    isComplete: boolean;
    size: number;
  }> {
    const fileMap = new Map<
      string,
      { filename: string; content: string; isComplete: boolean; size: number }
    >();

    files.forEach((file) => {
      const existing = fileMap.get(file.filename);
      if (!existing || file.content.length > existing.content.length) {
        fileMap.set(file.filename, file);
      }
    });

    return Array.from(fileMap.values());
  }

  private static calculateProgress(
    files: Array<{
      filename: string;
      content: string;
      isComplete: boolean;
      size: number;
    }>,
    chunkLength: number
  ): number {
    if (files.length === 0) {
      // Base progress on chunk size if no files detected
      return Math.min((chunkLength / 100000) * 100, 90);
    }

    const completedFiles = files.filter((f) => f.isComplete).length;
    const totalFiles = files.length;

    // Calculate progress based on completion ratio
    let progress = (completedFiles / totalFiles) * 100;

    // Adjust based on total content size
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    if (totalSize > 50000) {
      progress = Math.min(progress + 10, 95);
    }

    return progress;
  }

  static categorizeFiles(
    files: Array<{ filename: string; content: string; isComplete: boolean }>
  ) {
    const categories = {
      components: [] as any[],
      pages: [] as any[],
      utils: [] as any[],
      styles: [] as any[],
      config: [] as any[],
      types: [] as any[],
      tests: [] as any[],
      assets: [] as any[],
      other: [] as any[],
    };

    files.forEach((file) => {
      const path = file.filename.toLowerCase();

      if (
        path.includes("component") ||
        path.includes("/components/") ||
        path.endsWith(".tsx") ||
        path.endsWith(".jsx")
      ) {
        categories.components.push(file);
      } else if (
        path.includes("page") ||
        path.includes("/pages/") ||
        path.includes("/views/")
      ) {
        categories.pages.push(file);
      } else if (
        path.includes("util") ||
        path.includes("/utils/") ||
        path.includes("/helpers/")
      ) {
        categories.utils.push(file);
      } else if (
        path.includes(".css") ||
        path.includes("style") ||
        path.includes("/styles/")
      ) {
        categories.styles.push(file);
      } else if (
        path.includes("config") ||
        path.includes(".config.") ||
        path.includes("vite") ||
        path.includes("package.json")
      ) {
        categories.config.push(file);
      } else if (
        path.includes("type") ||
        path.includes("/types/") ||
        path.includes(".d.ts")
      ) {
        categories.types.push(file);
      } else if (
        path.includes("test") ||
        path.includes(".test.") ||
        path.includes(".spec.")
      ) {
        categories.tests.push(file);
      } else if (
        path.includes("asset") ||
        path.includes("/assets/") ||
        path.includes("/public/")
      ) {
        categories.assets.push(file);
      } else {
        categories.other.push(file);
      }
    });

    return categories;
  }

  /**
   * Generate a structure tree like LLMCodeParser (optional utility)
   */
  static generateStructureTree(
    files: Array<{
      filename: string;
      content: string;
      isComplete: boolean;
      size: number;
    }>
  ): Record<string, any> {
    const structure: Record<string, any> = {};

    files.forEach((file) => {
      const pathParts = file.filename.split("/");
      let current = structure;

      // Navigate/create directory structure
      for (let i = 0; i < pathParts.length - 1; i++) {
        const part = pathParts[i];
        if (!current[part]) {
          current[part] = {};
        }
        current = current[part];
      }

      // Set file status
      const fileName = pathParts[pathParts.length - 1];
      current[fileName] = file.isComplete ? "complete" : "incomplete";
    });

    return structure;
  }
}

// Enhanced File Completion Tracker for Messages - Unchanged for sidebar use
export const FileCompletionTracker: React.FC<{
  files: Array<{
    filename: string;
    content: string;
    isComplete: boolean;
    size?: number;
  }>;
  currentFile?: string;
  showCategories?: boolean;
}> = ({ files, currentFile, showCategories = false }) => {
  const [expandedCategories, setExpandedCategories] = useState<string[]>([
    "components",
    "pages",
  ]);

  const getFileIcon = (filename: string) => {
    const ext = filename.toLowerCase();
    if (ext.includes(".tsx") || ext.includes(".jsx")) return "⚛️";
    if (ext.includes(".ts") || ext.includes(".js")) return "📜";
    if (ext.includes(".css")) return "🎨";
    if (ext.includes(".json")) return "📋";
    if (ext.includes(".html")) return "🌐";
    if (ext.includes("config")) return "⚙️";
    if (ext.includes("package.json")) return "📦";
    if (ext.includes(".md")) return "📝";
    return "📄";
  };

  const getFileName = (filepath: string) => {
    return filepath.split("/").pop() || filepath;
  };

  const getFileSize = (file: { size?: number }) => {
    if (!file.size) return "";
    return file.size > 1024
      ? `${(file.size / 1024).toFixed(1)}KB`
      : `${file.size}B`;
  };

  if (files.length === 0) return null;

  const categories = showCategories
    ? StreamingCodeParser.categorizeFiles(files)
    : null;
  const completedFiles = files.filter((f) => f.isComplete);

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  const renderFiles = (filesToRender: typeof files, categoryName?: string) => (
    <div className="space-y-1">
      {filesToRender.slice(0, 15).map((file, index) => (
        <div
          key={`${categoryName}-${index}`}
          className={`flex items-center gap-2 text-xs p-2 rounded transition-all duration-200 ${
            file.filename === currentFile
              ? "bg-primary-ghost text-primary-weak border border-blue-500/30"
              : file.isComplete
              ? "bg-green-500/10 text-green-300"
              : "bg-slate-700/20 text-slate-400"
          }`}
        >
          <span className="text-sm flex-shrink-0">
            {getFileIcon(file.filename)}
          </span>

          <div className="flex-1 min-w-0">
            <div className="font-medium truncate" title={file.filename}>
              {getFileName(file.filename)}
            </div>
            {file.filename.includes("/") && (
              <div className="text-xs opacity-60 truncate">
                {file.filename.split("/").slice(0, -1).join("/")}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {file.size && (
              <span className="text-xs opacity-70">{getFileSize(file)}</span>
            )}

            {file.filename === currentFile ? (
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-primary-weak rounded-full animate-pulse"></div>
              </div>
            ) : file.isComplete ? (
              <CheckCircle className="w-3 h-3 text-success-weak" />
            ) : (
              <Clock className="w-3 h-3 text-muted" />
            )}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="bg-slate-800/20 border border-slate-700/30 rounded-lg p-3 mb-3">
      <div className="flex items-center gap-2 mb-3">
        <FileText className="w-4 h-4 text-success-weak" />
        <span className="text-sm font-medium text-success-weak">
          Generated Files
        </span>
        <span className="text-xs text-muted">
          ({completedFiles.length}/{files.length})
        </span>
        {files.some((f) => f.size) && (
          <span className="text-xs text-primary-weak">
            {(files.reduce((acc, f) => acc + (f.size || 0), 0) / 1024).toFixed(
              1
            )}
            KB
          </span>
        )}
      </div>

      <div className="max-h-64 overflow-y-auto">
        {showCategories && categories ? (
          <div className="space-y-2">
            {Object.entries(categories).map(([categoryName, categoryFiles]) => {
              if (categoryFiles.length === 0) return null;

              const isExpanded = expandedCategories.includes(categoryName);
              const categoryIcon =
                {
                  components: "🧩",
                  pages: "📄",
                  utils: "🔧",
                  styles: "🎨",
                  config: "⚙️",
                  types: "🏷️",
                  other: "📁",
                }[categoryName] || "📁";

              return (
                <div key={categoryName}>
                  <button
                    onClick={() => toggleCategory(categoryName)}
                    className="flex items-center gap-2 text-xs font-medium text-slate-300 hover:text-on-solid transition-colors w-full text-left mb-1"
                  >
                    <span>{categoryIcon}</span>
                    <span className="capitalize">{categoryName}</span>
                    <span className="text-muted">
                      ({categoryFiles.length})
                    </span>
                    <span className="ml-auto">{isExpanded ? "−" : "+"}</span>
                  </button>

                  {isExpanded && renderFiles(categoryFiles, categoryName)}
                </div>
              );
            })}
          </div>
        ) : (
          renderFiles(files)
        )}
      </div>

      {currentFile && (
        <div className="mt-3 p-2 bg-primary-ghost rounded border border-blue-500/20">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-primary-weak rounded-full animate-pulse"></div>
            <span className="text-xs text-primary-weak">
              Generating:{" "}
              <span className="font-medium">{getFileName(currentFile)}</span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
import { Rocket, Loader2, Globe } from 'lucide-react';
import React from 'react';

interface ShareSectionProps {
  showPublishMenu: boolean;
  setShowPublishMenu: React.Dispatch<React.SetStateAction<boolean>>;
  shareAbleUrl: string;
  handleDeploy: () => void;
  isDeploying: boolean;
  canDeploy: boolean | number | undefined;
}

const ShareSection: React.FC<ShareSectionProps> = ({
  showPublishMenu,
  setShowPublishMenu,
  shareAbleUrl,
  handleDeploy,
  isDeploying,
  canDeploy,
}) => {
  return (
    <div className="flex relative items-center h-8" data-publish-menu>
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
          <div className="publish-overlay" onMouseDown={() => setShowPublishMenu(false)} />
          <div
            className="publish-dropdown z-dropdown fade-slide-in"
            onAnimationEnd={(e) => e.currentTarget.classList.remove('fade-slide-in')}
          >
            <div className="publish-dropdown-content" onMouseDown={(e) => e.stopPropagation()}>
              <div>
                <div className="publish-dropdown-title">Publish</div>
                <div className="publish-dropdown-desc">Deploy your project and track its performance.</div>
              </div>

              {shareAbleUrl && (
                <div className="publish-preview">
                  <Globe className="w-4 h-4 text-slate-600 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="publish-preview-title">Preview</div>
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
                  onClick={handleDeploy}
                  className="btn-publish-primary w-full"
                  disabled={isDeploying || (!canDeploy)}
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
  );
};

export default ShareSection;
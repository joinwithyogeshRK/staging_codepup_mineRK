import React from "react";
import { FileText, X } from "lucide-react";

interface PdfPreviewProps {
  file: File;
  onRemove: () => void;
  size?: "small" | "medium" | "large";
}

const PdfPreview: React.FC<PdfPreviewProps> = ({
  file,
  onRemove,
  size = "medium",
}) => {
  // Get clean filename without extension
  const getCleanFileName = (filename: string) => {
    return filename.replace(/\.[^/.]+$/, "");
  };

  // Size configurations
  const sizeConfig = {
    small: {
      container: "min-w-16 max-w-24 h-10",
      icon: "w-4 h-4",
      text: "text-xs",
      padding: "px-2 py-1.5",
      button: "w-4 h-4 -top-1 -right-1",
      buttonIcon: "w-2.5 h-2.5",
    },
    medium: {
      container: "min-w-20 max-w-28 h-12",
      icon: "w-5 h-5",
      text: "text-xs",
      padding: "px-3 py-2",
      button: "w-4 h-4 -top-1.5 -right-1.5",
      buttonIcon: "w-3 h-3",
    },
    large: {
      container: "min-w-24 max-w-32 h-14",
      icon: "w-6 h-6",
      text: "text-sm",
      padding: "px-4 py-2.5",
      button: "w-5 h-5 -top-2 -right-2",
      buttonIcon: "w-3.5 h-3.5",
    },
  };

  const config = sizeConfig[size];

  return (
    <div className="relative group inline-block">
      {/* PDF Preview Card */}
      <div
        className={`
        ${config.container} 
        ${config.padding}
        bg-gray-200
        rounded-lg
        flex items-center
        gap-2.5
        transition-all duration-200
        hover:bg-gray-300
        cursor-default
      `}
      title={getCleanFileName(file.name)}
      >
        {/* PDF Icon */}
        <FileText className={`${config.icon} text-gray-600 flex-shrink-0`} />

        {/* File Info */}
        <div className="flex-1 min-w-0">
          {/* File Name */}
          <div
            className={`
            ${config.text}
            text-gray-800
            font-medium
            leading-tight
            truncate
          `}
          >
            {getCleanFileName(file.name)}
          </div>
        </div>
      </div>

      {/* Remove Button */}
      <button
        onClick={onRemove}
        className={`
          absolute ${config.button}
          bg-gray-500 
          hover:bg-gray-600 
          text-white 
          rounded-full 
          flex items-center 
          justify-center
          transition-all duration-200
          opacity-0 group-hover:opacity-100
          hover:scale-110
          z-10
          shadow-sm
        `}
        title="Remove PDF"
      >
        <X className={config.buttonIcon} />
      </button>
    </div>
  );
};

export default PdfPreview;

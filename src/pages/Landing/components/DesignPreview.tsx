import React from "react";
import { motion } from "motion/react";
import type { DesignChoices } from "../components/types/types"; // Adjust import path as needed
import ColorPalette from "../components/ColorPalette"; // Adjust path based on where you put ColorPalette

type DesignPreviewProps = {
  designChoices: DesignChoices;
};

const DesignPreview: React.FC<DesignPreviewProps> = React.memo(({ designChoices }) => {
  // Extract colors using simple fallback
  const primaryColor = designChoices.colorScheme?.primary || designChoices.recommendedColors?.[0] || "#3B82F6";
  const secondaryColor = designChoices.colorScheme?.secondary || designChoices.recommendedColors?.[1] || "#10B981";
  const accentColor = designChoices.colorScheme?.accent || designChoices.recommendedColors?.[2] || "#F59E0B";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="p-4 bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl border border-slate-300 backdrop-blur-sm"
    >
      <div className="flex items-center gap-2 mb-3">
        <h3 className="text-sm font-medium text-slate-800">Design Preview</h3>
      </div>

      {/* Mock UI Preview */}
      <div className="relative w-full h-32 bg-white rounded-lg overflow-hidden shadow-lg">
        {/* Header */}
        <div className="h-8 flex items-center px-3" style={{ backgroundColor: primaryColor }}>
          <div className="flex gap-1">
            <div className="w-2 h-2 bg-white/80 rounded-full" />
            <div className="w-2 h-2 bg-white/80 rounded-full" />
            <div className="w-2 h-2 bg-white/80 rounded-full" />
          </div>
        </div>

        {/* Content Area */}
        <div className="p-3 space-y-2">
          <div className="h-3 rounded" style={{ backgroundColor: secondaryColor, width: "60%" }} />
          <div className="h-2 bg-gray-200 rounded" style={{ width: "80%" }} />
          <div className="h-2 bg-gray-200 rounded" style={{ width: "40%" }} />

          {/* Accent elements */}
          <div className="flex gap-2 mt-3">
            <div className="w-8 h-4 rounded" style={{ backgroundColor: accentColor }} />
            <div className="w-6 h-4 rounded" style={{ backgroundColor: primaryColor, opacity: 0.7 }} />
          </div>
        </div>
      </div>

      {/* Design Details */}
      <div className="mt-3 space-y-2">
        {(designChoices.businessType || designChoices.businessName) && (
          <div className="text-xs text-slate-600">
            <span className="text-slate-500">Business:</span>{" "}
            {designChoices.businessName || designChoices.businessType}
          </div>
        )}
        {(designChoices.style || designChoices.recommendedLayout) && (
          <div className="text-xs text-slate-600">
            <span className="text-slate-500">Style:</span>{" "}
            {designChoices.recommendedLayout || designChoices.style}
          </div>
        )}
        {designChoices.vibe && (
          <div className="text-xs text-slate-600">
            <span className="text-slate-500">Vibe:</span> {designChoices.vibe}
          </div>
        )}
        {/* <ColorPalette colors={extractedColors} /> */}
        {(designChoices.features || designChoices.differentSections) && (
          <div className="text-xs text-slate-600">
            <span className="text-slate-500">Features:</span>{" "}
            {(designChoices.differentSections || designChoices.features || []).slice(0, 2).join(", ")}
            {(designChoices.differentSections || designChoices.features || []).length > 2 &&
              ` +${
                (designChoices.differentSections || designChoices.features || []).length - 2
              } more`}
          </div>
        )}
      </div>
    </motion.div>
  );
});

export default DesignPreview;
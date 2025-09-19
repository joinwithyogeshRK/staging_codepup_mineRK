import React from "react";
import { Palette } from "lucide-react";
import type { DesignChoices } from "../components/types/types"; // Adjust path as needed

type ColorPaletteProps = {
  colors: DesignChoices["colorScheme"];
};

const ColorPalette: React.FC<ColorPaletteProps> = React.memo(({ colors }) => {
  if (!colors) return null;

  return (
    <div className="flex items-center gap-2 p-3 bg-slate-100 rounded-lg border border-slate-300">
      <Palette className="size-icon-small text-slate-600" />
      <span className="text-xs text-slate-600 font-medium">Colors:</span>
      <div className="flex gap-1">
        {colors.primary && (
          <div
            className="w-6 h-6 rounded-full border-2 border-white/20"
            style={{ backgroundColor: colors.primary }}
            title={`Primary: ${colors.primary}`}
          />
        )}
        {colors.secondary && (
          <div
            className="w-6 h-6 rounded-full border-2 border-white/20"
            style={{ backgroundColor: colors.secondary }}
            title={`Secondary: ${colors.secondary}`}
          />
        )}
        {colors.accent && (
          <div
            className="w-6 h-6 rounded-full border-2 border-white/20"
            style={{ backgroundColor: colors.accent }}
            title={`Accent: ${colors.accent}`}
          />
        )}
      </div>
    </div>
  );
});

export default ColorPalette;

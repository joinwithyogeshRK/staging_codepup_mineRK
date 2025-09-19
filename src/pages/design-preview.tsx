import React, { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Eye,
  X,
  Palette,
  Smartphone,
  Monitor,
  Tablet,
  Copy,
  Check,
  Package,
  Layout,
  Type,
  Sparkles,
  Settings,
} from "lucide-react";

// --- Updated Types to match API response ---
interface DesignChoices {
  businessType?: string;
  businessName?: string;
  projectName?: string;
  vibe?: string;
  colorScheme?: {
    primary?: string;
    secondary?: string;
    accent?: string;
    background?: string;
    text?: string;
  };
  // API response fields
  recommendedColors?: string[];
  allColorOptions?: string[];
  colorExplanation?: string;
  style?: string;
  features?: string[];
  layout?: string;
  recommendedLayout?: string;
  recommendedLayoutExplanation?: string;
  layoutStyles?: string[];
  differentLayouts?: string[];
  differentSections?: string[];
  components?: string[];
  typography?: string;
  theme?: string;
}

interface ExpandableDesignPreviewProps {
  designChoices: DesignChoices;
  isOpen: boolean;
  onClose: () => void;
  onGenerate?: () => void;
  projectName?: string;
}

// Helper function to extract colors from design choices (same as in Index.tsx)
const extractColorsFromDesignChoices = (designChoices: DesignChoices) => {
  // Try to get colors from different possible sources
  const colors = {
    primary: designChoices.colorScheme?.primary,
    secondary: designChoices.colorScheme?.secondary,
    accent: designChoices.colorScheme?.accent,
    background: designChoices.colorScheme?.background,
    text: designChoices.colorScheme?.text,
  };

  // If colorScheme is empty, try to use recommendedColors
  if (
    designChoices.recommendedColors &&
    designChoices.recommendedColors.length > 0
  ) {
    colors.primary = colors.primary || designChoices.recommendedColors[0];
    colors.secondary = colors.secondary || designChoices.recommendedColors[1];
    colors.accent = colors.accent || designChoices.recommendedColors[2];
    colors.background = colors.background || designChoices.recommendedColors[3];
    colors.text = colors.text || designChoices.recommendedColors[4];
  }

  // If still no colors, try allColorOptions
  if (
    !colors.primary &&
    designChoices.allColorOptions &&
    designChoices.allColorOptions.length > 0
  ) {
    colors.primary = designChoices.allColorOptions[0];
    colors.secondary = designChoices.allColorOptions[1];
    colors.accent = designChoices.allColorOptions[2];
    colors.background = designChoices.allColorOptions[3];
    colors.text = designChoices.allColorOptions[4];
  }

  return colors;
};

// --- Components ---
const ColorSwatch = React.memo(
  ({
    color,
    name,
    size = "medium",
  }: {
    color: string;
    name: string;
    size?: "small" | "medium" | "large";
  }) => {
    const [copied, setCopied] = useState(false);

    const copyToClipboard = useCallback(async () => {
      try {
        await navigator.clipboard.writeText(color);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
      }
    }, [color]);

    const sizeClasses = {
      small: "color-swatch-size-small",
      medium: "color-swatch-size-medium",
      large: "color-swatch-size-large",
    };

    return (
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={copyToClipboard}
        className="color-swatch-container group"
      >
        <div
          className={`${sizeClasses[size]} color-swatch-display`}
          style={{ backgroundColor: color }}
        >
          <div className="color-swatch-overlay" />
        </div>
        <div className="color-swatch-content">
          <p className="color-swatch-name">{name}</p>
          <p className="color-swatch-hex">{color}</p>
          <div className="color-swatch-icon-container">
            {copied ? (
              <Check className="color-swatch-icon-copied" />
            ) : (
              <Copy className="color-swatch-icon-default group-hover:text-slate-700" />
            )}
          </div>
        </div>
      </motion.div>
    );
  }
);

ColorSwatch.displayName = "ColorSwatch";

const DevicePreview = React.memo(
  ({
    designChoices,
    device = "desktop",
  }: {
    designChoices: DesignChoices;
    device: "desktop" | "tablet" | "mobile";
  }) => {
    // Extract colors using the helper function
    const extractedColors = extractColorsFromDesignChoices(designChoices);

    const primaryColor = extractedColors.primary || "#3B82F6";
    const secondaryColor = extractedColors.secondary || "#10B981";
    const accentColor = extractedColors.accent || "#F59E0B";
    const backgroundColor = extractedColors.background || "#F8FAFC";
    const textColor = extractedColors.text || "#1F2937";

    const getDeviceClasses = () => {
      switch (device) {
        case "mobile":
          return "device-preview-mobile";
        case "tablet":
          return "device-preview-tablet";
        default:
          return "device-preview-desktop";
      }
    };

    const businessName =
      designChoices.businessName || designChoices.businessType || "Your App";

    return (
      <div className={`${getDeviceClasses()} device-preview-container`}>
        {/* Header */}
        <div
          className="device-preview-header"
          style={{ backgroundColor: primaryColor }}
        >
          <div className="device-preview-header-content">
            <div className="device-preview-logo">
              <Package className="device-preview-logo-icon" />
            </div>
            <div className="device-preview-title">
              <h3 className="device-preview-title-text">{businessName}</h3>
            </div>
          </div>
          <div className="device-preview-controls">
            <div className="device-preview-control"></div>
            <div className="device-preview-control"></div>
          </div>
        </div>

        {/* Navigation */}
        <div className="device-preview-nav">
          <div className="device-preview-nav-items">
            <div
              className="device-preview-nav-active"
              style={{ backgroundColor: secondaryColor, color: "white" }}
            >
              Home
            </div>
            <div className="device-preview-nav-inactive">About</div>
            <div className="device-preview-nav-inactive">Contact</div>
          </div>
        </div>

        {/* Content */}
        <div className="device-preview-content" style={{ backgroundColor }}>
          {/* Hero */}
          <div className="device-preview-hero">
            <div
              className="device-preview-hero-title"
              style={{ backgroundColor: secondaryColor, width: "70%" }}
            />
            <div
              className="device-preview-hero-text"
              style={{ width: "90%" }}
            />
            <div
              className="device-preview-hero-text"
              style={{ width: "60%" }}
            />
          </div>

          {/* Cards */}
          <div className="device-preview-cards">
            <div className="device-preview-card">
              <div
                className="device-preview-card-image"
                style={{ backgroundColor: accentColor, opacity: 0.1 }}
              />
              <div className="device-preview-card-text" />
              <div
                className="device-preview-card-text"
                style={{ width: "60%" }}
              />
            </div>
            <div className="device-preview-card">
              <div
                className="device-preview-card-image"
                style={{ backgroundColor: primaryColor, opacity: 0.1 }}
              />
              <div className="device-preview-card-text" />
              <div
                className="device-preview-card-text"
                style={{ width: "80%" }}
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="device-preview-buttons">
            <button
              className="device-preview-button-primary"
              style={{ backgroundColor: primaryColor }}
            >
              Action
            </button>
            <button
              className="device-preview-button-secondary"
              style={{
                borderColor: accentColor,
                color: accentColor,
                backgroundColor: "transparent",
              }}
            >
              Secondary
            </button>
          </div>

          {/* Features */}
          {(designChoices.features || designChoices.differentSections) && (
            <div className="device-preview-features">
              {(designChoices.differentSections || designChoices.features || [])
                .slice(0, 2)
                .map((feature, index) => (
                  <div key={index} className="device-preview-feature">
                    <div
                      className="device-preview-feature-dot"
                      style={{ backgroundColor: accentColor }}
                    />
                    <span
                      className="device-preview-feature-text"
                      style={{ color: textColor }}
                    >
                      {feature.length > 20
                        ? feature.substring(0, 20) + "..."
                        : feature}
                    </span>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    );
  }
);

DevicePreview.displayName = "DevicePreview";

// --- Main Component ---
const ExpandableDesignPreview: React.FC<ExpandableDesignPreviewProps> = ({
  designChoices,
  isOpen,
  onClose,
  projectName,
}) => {
  const [activeDevice, setActiveDevice] = useState<
    "desktop" | "tablet" | "mobile"
  >("desktop");

  // Updated to handle both colorScheme and recommendedColors
  const colorPairs = useMemo(() => {
    const extractedColors = extractColorsFromDesignChoices(designChoices);

    // Create color pairs from extracted colors
    const pairs: [string, string][] = [];

    if (extractedColors.primary)
      pairs.push(["primary", extractedColors.primary]);
    if (extractedColors.secondary)
      pairs.push(["secondary", extractedColors.secondary]);
    if (extractedColors.accent) pairs.push(["accent", extractedColors.accent]);
    if (extractedColors.background)
      pairs.push(["background", extractedColors.background]);
    if (extractedColors.text) pairs.push(["text", extractedColors.text]);

    // If we have recommendedColors but no extracted colors, use those
    if (pairs.length === 0 && designChoices.recommendedColors) {
      designChoices.recommendedColors.forEach((color, index) => {
        const names = ["primary", "secondary", "accent", "background", "text"];
        if (index < names.length) {
          pairs.push([names[index], color]);
        } else {
          pairs.push([`color-${index + 1}`, color]);
        }
      });
    }

    // If still no colors, try allColorOptions
    if (pairs.length === 0 && designChoices.allColorOptions) {
      designChoices.allColorOptions.slice(0, 8).forEach((color, index) => {
        pairs.push([`option-${index + 1}`, color]);
      });
    }
    return pairs;
  }, [designChoices]);

  const designStats = useMemo(
    () => [
      {
        icon: Palette,
        label: "Colors",
        value: colorPairs.length,
        color: "text-blue-400",
      },
      {
        icon: Package,
        label: "Components",
        value:
          (designChoices.components?.length || 0) +
          (designChoices.differentSections?.length || 0),
        color: "text-green-400",
      },
      {
        icon: Layout,
        label: "Features",
        value:
          (designChoices.features?.length || 0) +
          (designChoices.layoutStyles?.length || 0),
        color: "text-purple-400",
      },
      {
        icon: Type,
        label: "Layouts",
        value:
          designChoices.differentLayouts?.length ||
          (designChoices.recommendedLayout ? 1 : 0),
        color: "text-yellow-400",
      },
    ],
    [colorPairs.length, designChoices]
  );

  const deviceButtons = [
    { key: "desktop" as const, icon: Monitor, label: "Desktop" },
    { key: "tablet" as const, icon: Tablet, label: "Tablet" },
    { key: "mobile" as const, icon: Smartphone, label: "Mobile" },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="design-preview-modal-overlay"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="design-preview-modal-container"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="design-preview-modal-header">
              <div className="design-preview-modal-header-left">
                <div className="design-preview-modal-icon-container">
                  <Sparkles className="design-preview-modal-icon" />
                </div>
                <div>
                  <h2 className="design-preview-modal-title">
                    {designChoices.projectName ||
                      projectName ||
                      "Design Preview"}
                  </h2>
                  <p className="design-preview-modal-subtitle">
                    Design Preview & Color Palette
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={onClose}
                  className="design-preview-modal-close"
                >
                  <X className="design-preview-modal-close-icon" />
                </button>
              </div>
            </div>

            <div className="design-preview-content-container hide-scrollbar">
              {/* Content */}
              <div className="design-preview-content">
                {/* Stats */}
                <div className="design-preview-stats-grid">
                  {designStats.map((stat, index) => (
                    <motion.div
                      key={stat.label}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="design-preview-stat-card"
                    >
                      <div className="design-preview-stat-content">
                        <div className="design-preview-stat-icon-container">
                          <stat.icon className={`w-4 h-4 ${stat.color}`} />
                        </div>
                        <div>
                          <p className="design-preview-stat-value">
                            {stat.value}
                          </p>
                          <p className="design-preview-stat-label">
                            {stat.label}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Design Details */}
                <div className="design-preview-main-grid">
                  {/* Color Palette */}
                  <div>
                    <h3 className="design-preview-section-title">
                      <Palette className="w-5 h-5 text-blue-600" />
                      Color Palette
                    </h3>
                    {colorPairs.length > 0 ? (
                      <div className="design-preview-color-grid">
                        {colorPairs.map(([name, color]) => (
                          <ColorSwatch key={name} color={color} name={name} />
                        ))}
                      </div>
                    ) : (
                      <p className="design-preview-no-colors">
                        No colors defined
                      </p>
                    )}

                    {/* Color explanation */}
                    {designChoices.colorExplanation && (
                      <div className="design-preview-color-explanation">
                        <p className="design-preview-color-explanation-label">
                          Color Strategy
                        </p>
                        <p className="design-preview-color-explanation-text">
                          {designChoices.colorExplanation}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Design Info */}
                  <div>
                    <h3 className="design-preview-section-title">
                      <Settings className="w-5 h-5 text-purple-600" />
                      Design Details
                    </h3>
                    <div className="design-preview-details-container">
                      {(designChoices.businessName ||
                        designChoices.businessType) && (
                        <div className="design-preview-detail-item">
                          <p className="design-preview-detail-label">
                            Business
                          </p>
                          <p className="design-preview-detail-value">
                            {designChoices.businessName ||
                              designChoices.businessType}
                          </p>
                        </div>
                      )}

                      {designChoices.vibe && (
                        <div className="design-preview-detail-item">
                          <p className="design-preview-detail-label">Vibe</p>
                          <p className="design-preview-detail-value">
                            {designChoices.vibe}
                          </p>
                        </div>
                      )}

                      {(designChoices.style ||
                        designChoices.recommendedLayout) && (
                        <div className="design-preview-detail-item">
                          <p className="design-preview-detail-label">
                            Layout Style
                          </p>
                          <p className="design-preview-detail-value">
                            {designChoices.recommendedLayout ||
                              designChoices.style}
                          </p>
                        </div>
                      )}

                      {designChoices.recommendedLayoutExplanation && (
                        <div className="design-preview-detail-item">
                          <p className="design-preview-detail-label">
                            Layout Explanation
                          </p>
                          <p className="design-preview-detail-text">
                            {designChoices.recommendedLayoutExplanation}
                          </p>
                        </div>
                      )}

                      {designChoices.layout && (
                        <div className="design-preview-detail-item">
                          <p className="design-preview-detail-label">Layout</p>
                          <p className="design-preview-detail-value">
                            {designChoices.layout}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Layout Options */}
                {designChoices.differentLayouts &&
                  designChoices.differentLayouts.length > 0 && (
                    <div>
                      <h3 className="design-preview-section-title">
                        <Layout className="w-5 h-5 text-orange-600" />
                        Layout Options ({designChoices.differentLayouts.length})
                      </h3>
                      <div className="design-preview-layout-grid">
                        {designChoices.differentLayouts.map((layout, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className={`design-preview-layout-item ${
                              layout === designChoices.recommendedLayout
                                ? "design-preview-layout-item-recommended"
                                : "design-preview-layout-item-default"
                            }`}
                          >
                            <span className="design-preview-layout-text">
                              {layout}
                            </span>
                            {layout === designChoices.recommendedLayout && (
                              <div className="design-preview-layout-recommended-label">
                                <span className="design-preview-layout-recommended-text">
                                  Recommended
                                </span>
                              </div>
                            )}
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}

                {/* Features/Sections */}
                {(designChoices.features ||
                  designChoices.differentSections) && (
                  <div>
                    <h3 className="design-preview-section-title">
                      <Package className="w-5 h-5 text-green-600" />
                      {designChoices.differentSections
                        ? "Sections"
                        : "Features"}{" "}
                      (
                      {
                        (
                          designChoices.differentSections ||
                          designChoices.features ||
                          []
                        ).length
                      }
                      )
                    </h3>
                    <div className="design-preview-features-grid">
                      {(
                        designChoices.differentSections ||
                        designChoices.features ||
                        []
                      ).map((item, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="design-preview-feature-item"
                        >
                          <div
                            className="design-preview-feature-dot-small"
                            style={{
                              backgroundColor:
                                extractColorsFromDesignChoices(designChoices)
                                  .accent || "#F59E0B",
                            }}
                          />
                          <span className="design-preview-feature-text-small">
                            {item}
                          </span>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Device Preview */}
                <div>
                  <div className="design-preview-device-header">
                    <h3 className="design-preview-section-title">
                      <Eye className="w-5 h-5 text-blue-600" />
                      Design Preview
                    </h3>

                    {/* Device Selector */}
                    <div className="design-preview-device-selector">
                      {deviceButtons.map(({ key, icon: Icon, label }) => (
                        <button
                          key={key}
                          onClick={() => setActiveDevice(key)}
                          className={`design-preview-device-button ${
                            activeDevice === key
                              ? "design-preview-device-button-active"
                              : "design-preview-device-button-inactive"
                          }`}
                        >
                          <Icon className="design-preview-device-button-icon" />
                          <span className="design-preview-device-button-text">
                            {label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Preview Container */}
                  <div className="design-preview-device-container">
                    <DevicePreview
                      designChoices={designChoices}
                      device={activeDevice}
                    />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ExpandableDesignPreview;

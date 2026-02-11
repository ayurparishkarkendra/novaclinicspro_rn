/**
 * Semantic Color Tokens (Clinic-Agnostic)
 * These are the semantic roles that all components should reference.
 * Never hard-code hex values in components - always use these tokens.
 */

export interface SemanticColors {
  // Primary brand colors
  primary: {
    default: string;
    light: string;
    dark: string;
    onPrimary: string; // Text/icons on primary background
    pressed: string; // Pressed state
    disabled: string; // Disabled state
    soft: string; // Soft/subtle variant
  };

  // Secondary accent colors
  secondary: {
    default: string;
    light: string;
    dark: string;
    onSecondary: string;
    pressed: string;
    disabled: string;
  };

  // Background colors
  background: {
    default: string; // Main app background
    elevated: string; // Cards, elevated surfaces
    muted: string; // Subtle backgrounds
    inverse: string; // Dark mode or inverse sections
  };

  // Surface colors (for cards, modals, etc.)
  surface: {
    default: string;
    elevated: string;
    muted: string;
    overlay: string; // Modal overlays
  };

  // Border colors
  border: {
    default: string;
    subtle: string;
    strong: string;
    focus: string; // Focus indicator
  };

  // Text colors
  text: {
    primary: string;
    secondary: string;
    tertiary: string;
    disabled: string;
    inverse: string; // Text on dark backgrounds
    onPrimary: string; // Text on primary color
    link: string;
  };

  // Feedback colors
  feedback: {
    success: string;
    successLight: string;
    warning: string;
    warningLight: string;
    error: string;
    errorLight: string;
    info: string;
    infoLight: string;
  };

  // Interactive states
  interactive: {
    hover: string;
    pressed: string;
    focus: string;
    disabled: string;
  };
}

/**
 * Opacity values for consistent transparency
 */
export const opacities = {
  disabled: 0.38,
  hover: 0.08,
  pressed: 0.12,
  focus: 0.12,
  overlay: 0.5,
  subtle: 0.6,
};

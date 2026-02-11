/**
 * Background Gradient Component (React Native / Ayurveda-friendly)
 * 
 * This component provides a subtle background gradient suitable for healthcare apps.
 * It respects the active clinic theme and uses semantic color tokens.
 * 
 * For Ayurveda clinics:
 * - Uses off-white/cream base with subtle herbal green overlay
 * - Avoids harsh or neon gradients; maintains clinical, trustworthy aesthetic
 * 
 * Usage:
 *   <BgGradient />
 *   <BgGradient gradientFrom={customColor} gradientTo={customColor} />
 */

import React from 'react';
import { StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useClinicTheme } from '../../theme/useClinicTheme';

interface BgGradientProps {
  /**
   * Custom style to apply to the gradient container
   */
  style?: StyleProp<ViewStyle>;

  /**
   * Starting color of the gradient (optional)
   * If not provided, uses theme's background.default
   */
  gradientFrom?: string;

  /**
   * Ending color of the gradient (optional)
   * If not provided, uses theme's primary.soft
   */
  gradientTo?: string;

  /**
   * Gradient direction locations (0-1 range)
   * Default: [0, 1] (top to bottom)
   */
  locations?: number[];

  /**
   * Gradient start point {x, y} (0-1 range)
   * Default: { x: 0.5, y: 0 } (top center)
   */
  start?: { x: number; y: number };

  /**
   * Gradient end point {x, y} (0-1 range)
   * Default: { x: 0.5, y: 1 } (bottom center)
   */
  end?: { x: number; y: number };
}

/**
 * Background Gradient Component
 * 
 * Renders a subtle gradient background using the clinic theme.
 * Positioned absolutely to sit behind content.
 * 
 * For radial-gradient-like effects, adjust start/end points and locations.
 * Note: True radial gradients aren't natively supported in React Native.
 */
export const BgGradient: React.FC<BgGradientProps> = ({
  style,
  gradientFrom,
  gradientTo,
  locations = [0, 1],
  start = { x: 0.5, y: 0 },
  end = { x: 0.5, y: 1 },
}) => {
  const theme = useClinicTheme();

  // Use theme colors as defaults
  const fromColor = gradientFrom ?? theme.colors.background.default;
  const toColor = gradientTo ?? theme.colors.primary.soft;

  return (
    <LinearGradient
      colors={[fromColor, toColor]}
      locations={locations.length >= 2 ? locations as [number, number, ...number[]] : [0, 1]}
      start={start}
      end={end}
      style={[styles.container, style]}
    />
  );
};

/**
 * Solid background variant (no gradient)
 * Useful for simpler screens or performance optimization
 */
export const BgSolid: React.FC<{ style?: StyleProp<ViewStyle> }> = ({ style }) => {
  const theme = useClinicTheme();

  return (
    <LinearGradient
      colors={[theme.colors.background.default, theme.colors.background.default]}
      style={[styles.container, style]}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    zIndex: -1,
  },
});

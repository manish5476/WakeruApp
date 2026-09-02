/**
 * Animation Configuration
 * Reusable animation presets for Reanimated
 */

export const SPRING_CONFIGS = {
  // Gentle spring for general purpose animations
  gentle: {
    damping: 10,
    mass: 1,
    overshootClamping: false,
    restSpeedThreshold: 2,
    restDisplacementThreshold: 2,
  },

  // Quick spring for snappy interactions
  quick: {
    damping: 12,
    mass: 1,
    overshootClamping: false,
    restSpeedThreshold: 2,
    restDisplacementThreshold: 2,
  },

  // Bouncy spring for playful animations
  bouncy: {
    damping: 8,
    mass: 1,
    overshootClamping: false,
    restSpeedThreshold: 2,
    restDisplacementThreshold: 2,
  },

  // Stiff spring for precise animations
  stiff: {
    damping: 15,
    mass: 1,
    overshootClamping: true,
    restSpeedThreshold: 2,
    restDisplacementThreshold: 2,
  },

  // Molasses spring for smooth animations
  molasses: {
    damping: 20,
    mass: 1,
    overshootClamping: false,
    restSpeedThreshold: 2,
    restDisplacementThreshold: 2,
  },
} as const;

export const TIMING_PRESETS = {
  // Timing configurations for different animation speeds
  micro: 100, // Very quick micro-interactions
  fast: 200, // Quick animations
  normal: 300, // Standard animations
  slow: 500, // Slow and deliberate
  slower: 800, // Very slow animations
  glacial: 1200, // Extremely slow animations
} as const;

export const EASING_FUNCTIONS = {
  // Easing curves for smooth animations
  linear: 'linear',
  easeIn: 'cubic-bezier(0.42, 0, 1, 1)',
  easeOut: 'cubic-bezier(0, 0, 0.58, 1)',
  easeInOut: 'cubic-bezier(0.42, 0, 0.58, 1)',
  easeInCubic: 'cubic-bezier(0.32, 0, 0.67, 0)',
  easeOutCubic: 'cubic-bezier(0.33, 1, 0.68, 1)',
  easeInOutCubic: 'cubic-bezier(0.65, 0, 0.35, 1)',
} as const;

// Animation preset types
export type SpringConfig = (typeof SPRING_CONFIGS)[keyof typeof SPRING_CONFIGS];
export type TimingPreset = keyof typeof TIMING_PRESETS;
export type EasingFunction = keyof typeof EASING_FUNCTIONS;

// Export all presets
export const animationPresets = {
  spring: SPRING_CONFIGS,
  timing: TIMING_PRESETS,
  easing: EASING_FUNCTIONS,
} as const;

// Animation Helper Utilities
import {
  motionTimings,
  motionEasing,
  springConfigs,
} from '@/design-system/motion/motion.presets';

export interface AnimationConfig {
  duration?: number;
  easing?: string;
  delay?: number;
  repeat?: number;
  repeatType?: 'loop' | 'reverse' | 'mirror';
}

/**
 * Create a press animation
 */
export const createPressAnimation = (): AnimationConfig & {
  scale?: number;
} => ({
  duration: motionTimings.quick,
  easing: motionEasing.easeOutQuad,
  scale: 0.97,
});

/**
 * Create a hover animation
 */
export const createHoverAnimation = (): AnimationConfig & {
  scale?: number;
} => ({
  duration: motionTimings.fast,
  easing: motionEasing.easeOutCubic,
  scale: 1.02,
});

/**
 * Create a long press animation
 */
export const createLongPressAnimation = (): AnimationConfig & {
  scale?: number;
} => ({
  duration: motionTimings.slow,
  easing: motionEasing.easeInOutQuad,
  scale: 0.95,
});

/**
 * Create a ripple animation
 */
export const createRippleAnimation = (): AnimationConfig & {
  scale?: number;
  opacity?: number;
} => ({
  duration: motionTimings.normal,
  easing: motionEasing.easeOut,
  scale: 4,
  opacity: 0,
});

/**
 * Create a bounce animation
 */
export const createBounceAnimation = (
  height: number = 20,
): AnimationConfig => ({
  duration: motionTimings.slow,
  easing: motionEasing.easeInOutQuad,
});

/**
 * Create a pulse animation
 */
export const createPulseAnimation = (): AnimationConfig & {
  opacity?: number;
} => ({
  duration: 2000,
  easing: motionEasing.easeInOut,
  repeat: Infinity,
  repeatType: 'mirror',
  opacity: 0.5,
});

/**
 * Create a loading animation (spin)
 */
export const createLoadingAnimation = (): AnimationConfig => ({
  duration: motionTimings.slowest,
  easing: motionEasing.linear,
  repeat: Infinity,
  repeatType: 'loop',
});

/**
 * Create a skeleton shimmer animation
 */
export const createSkeletonAnimation = (): AnimationConfig => ({
  duration: 2000,
  easing: motionEasing.linear,
  repeat: Infinity,
  repeatType: 'loop',
});

/**
 * Create a floating animation
 */
export const createFloatingAnimation = (): AnimationConfig & {
  y?: number;
} => ({
  duration: 3000,
  easing: motionEasing.easeInOut,
  repeat: Infinity,
  repeatType: 'mirror',
  y: 8,
});

/**
 * Create a FAB animation
 */
export const createFABAnimation = (): AnimationConfig & { scale?: number } => ({
  duration: motionTimings.normal,
  easing: motionEasing.easeOutQuint,
  scale: 1.1,
});

/**
 * Create a card lift animation
 */
export const createCardLiftAnimation = (): AnimationConfig & {
  y?: number;
} => ({
  duration: motionTimings.fast,
  easing: motionEasing.easeOutCubic,
  y: -4,
});

/**
 * Create a modal open animation
 */
export const createModalOpenAnimation = (): AnimationConfig & {
  scale?: number;
  opacity?: number;
} => ({
  duration: motionTimings.normal,
  easing: motionEasing.easeOutCubic,
  scale: 1,
  opacity: 1,
});

/**
 * Create a modal close animation
 */
export const createModalCloseAnimation = (): AnimationConfig & {
  scale?: number;
  opacity?: number;
} => ({
  duration: motionTimings.normal,
  easing: motionEasing.easeInCubic,
  scale: 0.95,
  opacity: 0,
});

/**
 * Create a bottom sheet animation
 */
export const createBottomSheetAnimation = (): AnimationConfig & {
  y?: number;
} => ({
  duration: motionTimings.normal,
  easing: motionEasing.easeOutCubic,
  y: 0,
});

/**
 * Create a navigation animation
 */
export const createNavigationAnimation = (): AnimationConfig & {
  x?: number;
  opacity?: number;
} => ({
  duration: motionTimings.normal,
  easing: motionEasing.easeOutCubic,
  x: 0,
  opacity: 1,
});

/**
 * Create a list item animation
 */
export const createListItemAnimation = (
  index: number,
): AnimationConfig & { opacity?: number; y?: number } => ({
  duration: motionTimings.normal,
  easing: motionEasing.easeOutCubic,
  delay: index * 50,
  opacity: 1,
  y: 0,
});

/**
 * Create a gesture pan animation
 */
export const createGesturePanAnimation = () => springConfigs.normal;

/**
 * Create a gesture pinch animation
 */
export const createGesturePinchAnimation = () => springConfigs.normal;

/**
 * Create a gesture rotate animation
 */
export const createGestureRotateAnimation = () => springConfigs.normal;

/**
 * Create a gesture swipe animation
 */
export const createGestureSwipeAnimation = (): AnimationConfig => ({
  duration: motionTimings.normal,
  easing: motionEasing.easeOutCubic,
});

/**
 * Stagger animation helper - creates delayed animations for multiple items
 */
export const createStaggerAnimation = (
  itemCount: number,
  baseDelay: number = 50,
  config: Partial<AnimationConfig> = {},
): AnimationConfig[] => {
  return Array.from({ length: itemCount }, (_, index) => ({
    delay: index * baseDelay,
    ...config,
  }));
};

/**
 * Chain animations - play animations sequentially
 */
export const chainAnimations = (
  animations: AnimationConfig[],
): AnimationConfig[] => {
  let cumulativeDelay = 0;
  return animations.map(anim => {
    const chainedAnim = { ...anim, delay: (anim.delay ?? 0) + cumulativeDelay };
    cumulativeDelay += anim.duration ?? 0;
    return chainedAnim;
  });
};

/**
 * Create dynamic timing based on distance or value
 */
export const createDynamicTiming = (
  value: number,
  min: number = 100,
  max: number = 500,
): number => {
  return Math.max(min, Math.min(max, value));
};

/**
 * Get ease curve for specific animation type
 */
export const getAnimationEasing = (
  type: 'entrance' | 'exit' | 'transition' | 'interaction',
): string => {
  const easings: Record<typeof type, string> = {
    entrance: motionEasing.easeOutCubic,
    exit: motionEasing.easeInCubic,
    transition: motionEasing.easeInOut,
    interaction: motionEasing.easeOutQuad,
  };
  return easings[type];
};

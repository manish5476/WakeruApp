// Motion and Animation Presets for TripSplit Native

export const motionTimings = {
  instant: 0,
  quick: 100,
  fast: 150,
  normal: 300,
  slow: 500,
  slowest: 800,
};

export const motionEasing = {
  linear: 'linear',
  ease: 'ease',
  easeIn: 'ease-in',
  easeOut: 'ease-out',
  easeInOut: 'ease-in-out',
  easeInQuad: 'cubic-bezier(0.11, 0, 0.5, 0)',
  easeOutQuad: 'cubic-bezier(0.5, 1, 0.89, 1)',
  easeInOutQuad: 'cubic-bezier(0.45, 0.03, 0.515, 0.955)',
  easeInCubic: 'cubic-bezier(0.32, 0, 0.67, 0)',
  easeOutCubic: 'cubic-bezier(0.33, 1, 0.68, 1)',
  easeInOutCubic: 'cubic-bezier(0.645, 0.045, 0.355, 1)',
  easeInQuart: 'cubic-bezier(0.5, 0, 0.75, 0)',
  easeOutQuart: 'cubic-bezier(0.25, 1, 0.5, 1)',
  easeInOutQuart: 'cubic-bezier(0.77, 0, 0.175, 1)',
  easeInQuint: 'cubic-bezier(0.64, 0, 0.78, 0)',
  easeOutQuint: 'cubic-bezier(0.22, 1, 0.36, 1)',
  easeInOutQuint: 'cubic-bezier(0.83, 0, 0.17, 1)',
  easeInExpo: 'cubic-bezier(0.7, 0, 0.84, 0)',
  easeOutExpo: 'cubic-bezier(0.16, 1, 0.3, 1)',
  easeInOutExpo: 'cubic-bezier(0.87, 0, 0.13, 1)',
  easeInCirc: 'cubic-bezier(0.6, 0.04, 0.98, 0.335)',
  easeOutCirc: 'cubic-bezier(0.075, 0.82, 0.165, 1)',
  easeInOutCirc: 'cubic-bezier(0.85, 0, 0.15, 1)',
};

export const springConfigs = {
  lazy: {
    damping: 20,
    mass: 1,
    stiffness: 60,
    velocity: 0,
  },
  gentle: {
    damping: 15,
    mass: 1,
    stiffness: 100,
    velocity: 0,
  },
  normal: {
    damping: 10,
    mass: 1,
    stiffness: 100,
    velocity: 0,
  },
  wobbly: {
    damping: 6,
    mass: 1,
    stiffness: 100,
    velocity: 0,
  },
  snappy: {
    damping: 7,
    mass: 1,
    stiffness: 300,
    velocity: 0,
  },
  molasses: {
    damping: 20,
    mass: 1,
    stiffness: 5,
    velocity: 0,
  },
};

export const entranceAnimations = {
  fadeIn: {
    duration: motionTimings.normal,
    easing: motionEasing.easeOut,
    opacity: { from: 0, to: 1 },
  },
  slideInUp: {
    duration: motionTimings.normal,
    easing: motionEasing.easeOutCubic,
    transform: { from: 'translateY(20px)', to: 'translateY(0)' },
    opacity: { from: 0, to: 1 },
  },
  slideInDown: {
    duration: motionTimings.normal,
    easing: motionEasing.easeOutCubic,
    transform: { from: 'translateY(-20px)', to: 'translateY(0)' },
    opacity: { from: 0, to: 1 },
  },
  slideInLeft: {
    duration: motionTimings.normal,
    easing: motionEasing.easeOutCubic,
    transform: { from: 'translateX(-20px)', to: 'translateX(0)' },
    opacity: { from: 0, to: 1 },
  },
  slideInRight: {
    duration: motionTimings.normal,
    easing: motionEasing.easeOutCubic,
    transform: { from: 'translateX(20px)', to: 'translateX(0)' },
    opacity: { from: 0, to: 1 },
  },
  scaleIn: {
    duration: motionTimings.normal,
    easing: motionEasing.easeOutCubic,
    transform: { from: 'scale(0.95)', to: 'scale(1)' },
    opacity: { from: 0, to: 1 },
  },
  popIn: {
    duration: motionTimings.fast,
    easing: motionEasing.easeOutQuint,
    transform: { from: 'scale(0.8)', to: 'scale(1)' },
    opacity: { from: 0, to: 1 },
  },
};

export const exitAnimations = {
  fadeOut: {
    duration: motionTimings.normal,
    easing: motionEasing.easeIn,
    opacity: { from: 1, to: 0 },
  },
  slideOutUp: {
    duration: motionTimings.normal,
    easing: motionEasing.easeInCubic,
    transform: { from: 'translateY(0)', to: 'translateY(-20px)' },
    opacity: { from: 1, to: 0 },
  },
  slideOutDown: {
    duration: motionTimings.normal,
    easing: motionEasing.easeInCubic,
    transform: { from: 'translateY(0)', to: 'translateY(20px)' },
    opacity: { from: 1, to: 0 },
  },
  slideOutLeft: {
    duration: motionTimings.normal,
    easing: motionEasing.easeInCubic,
    transform: { from: 'translateX(0)', to: 'translateX(-20px)' },
    opacity: { from: 1, to: 0 },
  },
  slideOutRight: {
    duration: motionTimings.normal,
    easing: motionEasing.easeInCubic,
    transform: { from: 'translateX(0)', to: 'translateX(20px)' },
    opacity: { from: 1, to: 0 },
  },
  scaleOut: {
    duration: motionTimings.normal,
    easing: motionEasing.easeInCubic,
    transform: { from: 'scale(1)', to: 'scale(0.95)' },
    opacity: { from: 1, to: 0 },
  },
  popOut: {
    duration: motionTimings.fast,
    easing: motionEasing.easeInQuint,
    transform: { from: 'scale(1)', to: 'scale(0.8)' },
    opacity: { from: 1, to: 0 },
  },
};

export const componentAnimations = {
  buttonPress: {
    duration: motionTimings.quick,
    easing: motionEasing.easeOutQuad,
    scale: { from: 1, to: 0.97 },
  },
  cardLift: {
    duration: motionTimings.fast,
    easing: motionEasing.easeOutCubic,
    transform: { from: 'translateY(0)', to: 'translateY(-4px)' },
    shadow: { from: 'shadow-md', to: 'shadow-lg' },
  },
  ripple: {
    duration: motionTimings.normal,
    easing: motionEasing.easeOut,
    scale: { from: 0, to: 1 },
    opacity: { from: 0.5, to: 0 },
  },
  pulse: {
    duration: 2000,
    easing: motionEasing.easeInOut,
    opacity: { from: 1, to: 0.5 },
  },
  bounce: {
    duration: motionTimings.slow,
    easing: motionEasing.easeInOutQuad,
  },
  shimmer: {
    duration: 2000,
    easing: motionEasing.linear,
  },
  loading: {
    duration: 1500,
    easing: motionEasing.linear,
  },
  skeleton: {
    duration: 2000,
    easing: motionEasing.linear,
  },
};

export const transitionAnimations = {
  crossFade: {
    duration: motionTimings.normal,
    easing: motionEasing.easeInOut,
  },
  bottomSheetEnter: {
    duration: motionTimings.normal,
    easing: motionEasing.easeOutCubic,
  },
  bottomSheetExit: {
    duration: motionTimings.normal,
    easing: motionEasing.easeInCubic,
  },
  modalEnter: {
    duration: motionTimings.normal,
    easing: motionEasing.easeOutCubic,
  },
  modalExit: {
    duration: motionTimings.normal,
    easing: motionEasing.easeInCubic,
  },
  navigationPush: {
    duration: motionTimings.normal,
    easing: motionEasing.easeOutCubic,
  },
  navigationPop: {
    duration: motionTimings.normal,
    easing: motionEasing.easeInCubic,
  },
  listItemEnter: {
    duration: motionTimings.normal,
    easing: motionEasing.easeOutCubic,
  },
  listItemExit: {
    duration: motionTimings.normal,
    easing: motionEasing.easeInCubic,
  },
};

export const gestureAnimations = {
  pan: {
    damping: 10,
    mass: 1,
    stiffness: 100,
  },
  pinch: {
    damping: 8,
    mass: 1,
    stiffness: 100,
  },
  rotate: {
    damping: 12,
    mass: 1,
    stiffness: 100,
  },
  swipe: {
    duration: motionTimings.normal,
    easing: motionEasing.easeOutCubic,
  },
};

export const allMotionPresets = {
  timings: motionTimings,
  easing: motionEasing,
  spring: springConfigs,
  entrance: entranceAnimations,
  exit: exitAnimations,
  components: componentAnimations,
  transitions: transitionAnimations,
  gestures: gestureAnimations,
};

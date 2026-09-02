/**
 * Design System Export Index
 * Central export point for all design system components and utilities
 */

// Components - Layout
export { Box } from './components/primitives/Box';
export { VStack, HStack, Spacer } from './components/primitives/Stack';

// Components - Typography
export { Text } from './components/primitives/Text';

// Components - Navigation
export { AppBar } from './components/organisms/AppBar';
export { BottomNavigation } from './components/organisms/BottomNavigation';
export {
  RefreshableScrollView,
  RefreshableView,
} from './components/templates/RefreshableScrollView';

// Components - Interactive
export { Button } from './components/atoms/Button';
export { Card } from './components/molecules/Card';
export { Input } from './components/atoms/Input';
export { Badge } from './components/atoms/Badge';
export { FAB } from './components/atoms/FAB';
export { Modal } from './components/organisms/Modal';
export { Switch } from './components/atoms/Switch';
export { Divider } from './components/atoms/Divider';
export { Chip } from './components/atoms/Chip';
export { Avatar } from './components/atoms/Avatar';
export { Skeleton } from './components/atoms/Skeleton';
export { BottomSheet } from './components/organisms/BottomSheet';
export { ListItem } from './components/patterns/ListItem';

// Components - Forms
export { Select } from './components/molecules/Select';
export { CheckboxGroup } from './components/molecules/CheckboxGroup';
export { RadioGroup } from './components/molecules/RadioGroup';

// Components - Feedback
export { Toast, ToastContainer } from './components/organisms/Toast';
export { Dialog } from './components/organisms/Dialog';

// Components - Tier 2
export { ProgressBar } from './components/atoms/ProgressBar';
export { Stepper } from './components/molecules/Stepper';
export { Accordion } from './components/molecules/Accordion';
export { Carousel } from './components/organisms/Carousel';
export { Tabs } from './components/organisms/Tabs';
export { Rating } from './components/molecules/Rating';
export { Loader } from './components/atoms/Loader';
export { EmptyState } from './components/templates/EmptyState';
export { Touchable } from './components/primitives/Touchable';

// Hooks
export { useTheme } from './hooks/useTheme';
export {
  usePressAnimation,
  useFadeInAnimation,
  useSlideAnimation,
  useRotationAnimation,
  useScaleAnimation,
} from './hooks/useAnimation';
export { useResponsive } from './hooks/useResponsive';

// Theme
export { ThemeProvider } from './theme/ThemeProvider';
export { ThemeContext, AVAILABLE_THEMES } from './theme/ThemeContext';

// Tokens
export {
  SPACING,
  RADIUS,
  SHADOWS,
  OPACITY,
  BORDER_WIDTH,
  ELEVATION,
  GLASS,
  TIMING,
  BREAKPOINTS,
  Z_INDEX,
  COLOR_OPACITY,
  getShadow,
  getSpacing,
  getBorderRadius,
} from './tokens/tokens';

export {
  LIGHT_THEME,
  DARK_THEME,
  AMOLED_THEME,
  GLASS_LIGHT_THEME,
  GLASS_DARK_THEME,
  OCEAN_THEME,
  PRIMITIVES,
  NEUTRAL,
  PRIMARY,
  SECONDARY,
  ACCENT,
  WARNING,
  DANGER,
  INFO,
} from './tokens/colors';

export type { SemanticColors, ThemeName } from './tokens/colors';

// Typography
export {
  FONTS,
  LINE_HEIGHTS,
  TYPOGRAPHY,
  TEXT_PRESETS,
  FONT_WEIGHTS,
  getTypography,
  createCustomTypography,
  getPlatformTypography,
} from './fonts/typography';

// Animations
export {
  SPRING_CONFIGS,
  TIMING_PRESETS,
  EASING_FUNCTIONS,
  animationPresets,
} from './animations/animations';

export type {
  SpringConfig,
  TimingPreset,
  EasingFunction,
} from './animations/animations';

// Icon System
export { IconRegistry } from './icons/IconRegistry';
export type { IconConfig, IconProps } from './icons/IconRegistry';

// Types
export type { ThemeContextType } from './theme/ThemeContext';

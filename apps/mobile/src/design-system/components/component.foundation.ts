g; // Component Foundation - Base APIs for all components

import { ViewStyle, TextStyle } from 'react-native';

/**
 * Primitive Component Base Props
 */
export interface PrimitiveProps {
  className?: string;
  style?: ViewStyle | TextStyle;
  testID?: string;
  accessibilityLabel?: string;
  accessibilityRole?: string;
  accessibilityHint?: string;
  accessible?: boolean;
}

/**
 * Interactive Component Base Props
 */
export interface InteractiveProps extends PrimitiveProps {
  onPress?: () => void;
  onLongPress?: () => void;
  onPressIn?: () => void;
  onPressOut?: () => void;
  disabled?: boolean;
  loading?: boolean;
}

/**
 * Variant Props Helper
 */
export interface VariantProps<V extends string | number | symbol> {
  variant?: V;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  color?: string;
  state?: 'default' | 'hover' | 'active' | 'disabled' | 'loading';
}

/**
 * Surface Component Props
 */
export interface SurfaceProps extends PrimitiveProps {
  elevation?: number;
  rounded?: boolean;
  gap?: number;
  padding?: number;
  children?: React.ReactNode;
}

/**
 * Typography Component Props
 */
export interface TypographyProps extends PrimitiveProps {
  variant?:
    | 'displayXL'
    | 'displayL'
    | 'displayM'
    | 'headingXL'
    | 'headingL'
    | 'headingM'
    | 'headingS'
    | 'title'
    | 'subtitle'
    | 'bodyXL'
    | 'body'
    | 'bodySmall'
    | 'caption'
    | 'label'
    | 'overline'
    | 'code'
    | 'numeric';
  color?: string;
  align?: 'left' | 'center' | 'right' | 'justify';
  weight?:
    | 'normal'
    | 'bold'
    | '100'
    | '200'
    | '300'
    | '400'
    | '500'
    | '600'
    | '700'
    | '800'
    | '900';
  numberOfLines?: number;
  children?: React.ReactNode;
}

/**
 * Button Component Props
 */
export interface ButtonProps
  extends
    InteractiveProps,
    VariantProps<'primary' | 'secondary' | 'tertiary' | 'ghost'> {
  fullWidth?: boolean;
  children?: React.ReactNode;
  icon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  isLoading?: boolean;
}

/**
 * Input Component Props
 */
export interface InputProps
  extends InteractiveProps, VariantProps<'default' | 'filled' | 'outline'> {
  placeholder?: string;
  value?: string;
  onChangeText?: (text: string) => void;
  keyboardType?:
    | 'default'
    | 'email-address'
    | 'numeric'
    | 'phone-pad'
    | 'decimal-pad'
    | 'url';
  secureTextEntry?: boolean;
  editable?: boolean;
  maxLength?: number;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  error?: string;
  hint?: string;
}

/**
 * Card Component Props
 */
export interface CardProps
  extends
    SurfaceProps,
    VariantProps<'primary' | 'secondary' | 'glass' | 'elevated'> {
  onPress?: () => void;
  pressable?: boolean;
  children?: React.ReactNode;
}

/**
 * Modal Component Props
 */
export interface ModalProps extends PrimitiveProps {
  visible: boolean;
  onClose: () => void;
  children?: React.ReactNode;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'fullscreen';
  closeButton?: boolean;
  backdropPressToDismiss?: boolean;
}

/**
 * Bottom Sheet Component Props
 */
export interface BottomSheetProps extends PrimitiveProps {
  visible: boolean;
  onClose: () => void;
  children?: React.ReactNode;
  title?: string;
  snapPoints?: number[];
  enablePanDownToClose?: boolean;
  handleIndicator?: boolean;
}

/**
 * Stack/Layout Component Props
 */
export interface StackProps extends SurfaceProps {
  direction?: 'vertical' | 'horizontal';
  align?:
    | 'flex-start'
    | 'center'
    | 'flex-end'
    | 'stretch'
    | 'space-between'
    | 'space-around';
  justify?:
    'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around';
  wrap?: boolean;
  children?: React.ReactNode;
}

/**
 * Grid Component Props
 */
export interface GridProps extends PrimitiveProps {
  columns?: number;
  rows?: number;
  gap?: number;
  children?: React.ReactNode;
}

/**
 * Chip/Badge Component Props
 */
export interface ChipProps
  extends InteractiveProps, VariantProps<'default' | 'filled' | 'outlined'> {
  label: string;
  icon?: React.ReactNode;
  onClose?: () => void;
  closeable?: boolean;
  children?: React.ReactNode;
}

/**
 * Avatar Component Props
 */
export interface AvatarProps extends PrimitiveProps {
  source?: string | { uri: string };
  initials?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  color?: string;
  children?: React.ReactNode;
}

/**
 * Icon Component Props
 */
export interface IconComponentProps extends PrimitiveProps {
  name: string;
  size?: number;
  color?: string;
  strokeWidth?: number;
  fill?: boolean;
}

/**
 * Skeleton Component Props
 */
export interface SkeletonProps extends PrimitiveProps {
  width?: number | string;
  height?: number | string;
  circle?: boolean;
  count?: number;
  spacing?: number;
}

/**
 * Divider Component Props
 */
export interface DividerProps extends PrimitiveProps {
  direction?: 'horizontal' | 'vertical';
  color?: string;
  thickness?: number;
  margin?: number;
}

/**
 * Badge Component Props
 */
export interface BadgeProps extends PrimitiveProps {
  count: number;
  maxCount?: number;
  showZero?: boolean;
  color?: string;
  textColor?: string;
  dot?: boolean;
  children?: React.ReactNode;
}

/**
 * Checkbox Component Props
 */
export interface CheckboxProps extends InteractiveProps {
  checked: boolean;
  onValueChange: (checked: boolean) => void;
  label?: string;
  color?: string;
  indeterminate?: boolean;
}

/**
 * Radio Component Props
 */
export interface RadioProps extends InteractiveProps {
  selected: boolean;
  onSelect: () => void;
  label?: string;
  color?: string;
  group?: string;
}

/**
 * Switch/Toggle Component Props
 */
export interface SwitchProps extends InteractiveProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  label?: string;
  color?: string;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Slider Component Props
 */
export interface SliderProps extends InteractiveProps {
  value: number;
  onValueChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  marks?: number[];
  color?: string;
}

/**
 * Component Composition Pattern
 */
export interface ComponentComposition {
  Root: React.ComponentType<any>;
  Header?: React.ComponentType<any>;
  Body?: React.ComponentType<any>;
  Footer?: React.ComponentType<any>;
  Title?: React.ComponentType<any>;
  Description?: React.ComponentType<any>;
  Content?: React.ComponentType<any>;
  Action?: React.ComponentType<any>;
  Actions?: React.ComponentType<any>;
}

/**
 * Component State Management
 */
export interface ComponentState {
  default: Record<string, any>;
  hover?: Record<string, any>;
  active?: Record<string, any>;
  disabled?: Record<string, any>;
  loading?: Record<string, any>;
  error?: Record<string, any>;
  success?: Record<string, any>;
  focus?: Record<string, any>;
}

/**
 * Component Animation Configuration
 */
export interface ComponentAnimationConfig {
  entrance?: string;
  exit?: string;
  transition?: string;
  interaction?: string;
  duration?: number;
  easing?: string;
}

/**
 * Accessibility Configuration
 */
export interface AccessibilityConfig {
  label?: string;
  hint?: string;
  role?: string;
  live?: 'off' | 'polite' | 'assertive';
  atomic?: boolean;
  important?: boolean;
  disabled?: boolean;
}

/**
 * Responsive Configuration
 */
export interface ResponsiveConfig {
  xs?: Record<string, any>;
  sm?: Record<string, any>;
  md?: Record<string, any>;
  lg?: Record<string, any>;
  xl?: Record<string, any>;
  xl2?: Record<string, any>;
}

/**
 * Component API Standard
 */
export interface ComponentAPI {
  displayName: string;
  props: Record<string, any>;
  state?: ComponentState;
  animations?: ComponentAnimationConfig;
  accessibility?: AccessibilityConfig;
  responsive?: ResponsiveConfig;
  variants?: Record<string, Record<string, any>>;
}

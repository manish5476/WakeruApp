import { Platform, StatusBar } from 'react-native';

export const LAYOUT = {
  // Status bar height (approximate)
  STATUS_BAR_HEIGHT: Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 24,

  // Header heights
  HEADER_HEIGHT: 56,
  TAB_BAR_HEIGHT: 85,

  // Common spacing
  SCREEN_PADDING_TOP: Platform.OS === 'ios' ? 50 : 40,
  SCREEN_PADDING_BOTTOM: Platform.OS === 'ios' ? 34 : 20,

  // Content padding
  CONTENT_PADDING: 20,
  CARD_BORDER_RADIUS: 16,
} as const;

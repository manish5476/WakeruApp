// src/components/ui/TripTabs.tsx
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Platform,
  ViewStyle,
  LayoutChangeEvent,
} from 'react-native';
import { useTheme } from '../../providers/ThemeProvider';
import AppIcon from '../common/AppIcon';
import { haptics } from '../../utils/haptics';
import type { Theme } from '../../theme';

export interface TripTabItem<T = string> {
  id: T;
  label: string;
  icon?: string;
  badge?: string | number;
  badgeVariant?: 'neutral' | 'success' | 'warning' | 'danger' | 'info';
}

export interface TripTabsProps<T = string> {
  tabs: TripTabItem<T>[];
  activeTab: T;
  onChange: (id: T) => void;
  variant?: 'pill' | 'segmented' | 'underline';
  size?: 'sm' | 'md' | 'lg';
  /** Lets tabs keep their natural width and scroll horizontally when they don't fit. */
  scrollable?: boolean;
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
}

type Variant = NonNullable<TripTabsProps['variant']>;
type Size = NonNullable<TripTabsProps['size']>;

const ICON_SIZE: Record<Size, number> = { sm: 13, md: 14, lg: 16 };

export function TripTabs<T = string>({
  tabs,
  activeTab,
  onChange,
  variant = 'segmented',
  size = 'md',
  scrollable = false,
  style,
  contentContainerStyle,
}: TripTabsProps<T>) {
  const theme = useTheme();
  const styles = useMemo(
    () => createStyles(theme, size, variant, scrollable),
    [theme, size, variant, scrollable],
  );

  // ── Auto-scroll the active tab into view (scrollable mode only) ──
  const scrollRef = useRef<ScrollView>(null);
  const viewportWidth = useRef(0);
  const tabLayouts = useRef<Record<string, { x: number; width: number }>>({});

  const scrollToActive = useCallback(() => {
    if (!scrollable) return;
    const layout = tabLayouts.current[String(activeTab)];
    if (!layout || !viewportWidth.current) return;
    const targetX = Math.max(
      0,
      layout.x - (viewportWidth.current - layout.width) / 2,
    );
    scrollRef.current?.scrollTo({ x: targetX, animated: true });
  }, [activeTab, scrollable]);

  useEffect(() => {
    scrollToActive();
  }, [scrollToActive]);

  const handleTabLayout = (id: T) => (e: LayoutChangeEvent) => {
    const { x, width } = e.nativeEvent.layout;
    tabLayouts.current[String(id)] = { x, width };
    if (String(id) === String(activeTab)) scrollToActive();
  };

  const handleTabPress = (id: T) => {
    if (id === activeTab) return;
    haptics.selection();
    onChange(id);
  };

  const renderTabs = () =>
    tabs.map(tab => {
      const isActive = activeTab === tab.id;
      const onAccent = isActive && variant !== 'underline';
      const activeColor =
        variant === 'underline' ? theme.colors.primary : '#FFFFFF';
      const inactiveLabel = theme.isDark
        ? 'rgba(255, 255, 255, 0.78)'
        : 'rgba(30, 41, 59, 0.78)';

      return (
        <Pressable
          key={String(tab.id)}
          onPress={() => handleTabPress(tab.id)}
          onLayout={handleTabLayout(tab.id)}
          accessibilityRole="tab"
          accessibilityState={{ selected: isActive }}
          accessibilityLabel={tab.label}
          style={({ pressed, hovered }: any) => [
            styles.tabItem,
            scrollable && styles.tabItemScrollable,
            isActive ? styles.tabItemActive : styles.tabItemInactive,
            Platform.OS === 'web' &&
              hovered &&
              !isActive &&
              styles.tabItemHovered,
            pressed && styles.tabItemPressed,
          ]}
        >
          {tab.icon ? (
            <AppIcon
              name={tab.icon as any}
              size={ICON_SIZE[size]}
              color={isActive ? activeColor : theme.colors.textSecondary}
            />
          ) : null}

          <Text
            style={[
              styles.tabLabel,
              {
                color: isActive ? activeColor : inactiveLabel,
                fontWeight: isActive ? '700' : '600',
              },
            ]}
            numberOfLines={1}
          >
            {tab.label}
          </Text>

          {tab.badge !== undefined && tab.badge !== null && tab.badge !== 0 && (
            <View
              style={[
                styles.badge,
                onAccent ? styles.badgeActive : styles.badgeInactive,
              ]}
            >
              <Text
                style={[
                  styles.badgeText,
                  { color: onAccent ? '#FFFFFF' : theme.colors.textSecondary },
                ]}
              >
                {String(tab.badge)}
              </Text>
            </View>
          )}

          {variant === 'underline' && isActive && (
            <View style={styles.activeUnderline} />
          )}
        </Pressable>
      );
    });

  if (scrollable) {
    return (
      // The capsule (background, border, radius) lives on the OUTER view so it always
      // spans the full row, no matter how wide the scrolled content is.
      <View style={[styles.container, style]} accessibilityRole="tablist">
        <ScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          onLayout={e => {
            viewportWidth.current = e.nativeEvent.layout.width;
            scrollToActive();
          }}
          // flexGrow: 1 makes the content at least as wide as the viewport,
          // so segmented tabs can stretch to fill spare room.
          contentContainerStyle={[styles.scrollContent, contentContainerStyle]}
        >
          {renderTabs()}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]} accessibilityRole="tablist">
      <View style={[styles.staticContent, contentContainerStyle]}>
        {renderTabs()}
      </View>
    </View>
  );
}

function createStyles(
  theme: Theme,
  size: Size,
  variant: Variant,
  scrollable: boolean,
) {
  const sizeMap = {
    sm: { height: 36, paddingX: 10, paddingY: 5, fontSize: 12, gap: 5 },
    md: { height: 42, paddingX: 14, paddingY: 7, fontSize: 13, gap: 6 },
    lg: { height: 48, paddingX: 18, paddingY: 9, fontSize: 14.5, gap: 8 },
  };
  const s = sizeMap[size];

  const isUnderline = variant === 'underline';
  const isSegmented = variant === 'segmented';

  const capsuleBackground = isUnderline
    ? 'transparent'
    : theme.isDark
      ? 'rgba(30, 41, 59, 0.70)'
      : 'rgba(255, 255, 255, 0.85)';

  return StyleSheet.create({
    // Outer shell: the visible capsule / underline rail.
    container: {
      alignSelf: 'stretch',
      backgroundColor: capsuleBackground,
      borderRadius: isUnderline ? 0 : 999,
      borderWidth: isUnderline ? 0 : 1,
      borderColor: theme.isDark
        ? 'rgba(255, 255, 255, 0.08)'
        : 'rgba(226, 232, 240, 0.90)',
      borderBottomWidth: isUnderline ? 1 : undefined,
      borderBottomColor: isUnderline ? theme.colors.borderLight : undefined,
      overflow: 'hidden',

      ...Platform.select({
        web: {
          backdropFilter: isUnderline ? 'none' : 'blur(16px)',
          boxShadow: isUnderline ? 'none' : '0 2px 10px rgba(0, 0, 0, 0.04)',
        } as any,
      }),
    },
    staticContent: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: isUnderline ? 0 : 3,
    },
    scrollContent: {
      flexGrow: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      padding: isUnderline ? 0 : 3,
    },
    tabItem: {
      flex: isSegmented ? 1 : undefined,
      minWidth: 0,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: s.paddingX,
      paddingVertical: s.paddingY,
      borderRadius: isUnderline ? 0 : 999,
      gap: s.gap,
      position: 'relative',
      minHeight: s.height - (isUnderline ? 0 : 6),

      ...Platform.select({
        web: {
          cursor: 'pointer',
          transition: 'background-color 0.15s ease, opacity 0.15s ease',
          userSelect: 'none',
        } as any,
      }),
    },
    // Scrollable tabs must size to their content. NOTE: do not use `flex: 0` here.
    // On web it compiles to `flex-basis: 0%`, which collapses the tab to just its
    // icon and clips the label. Spell out grow / shrink / basis instead.
    tabItemScrollable: {
      flexGrow: isSegmented ? 1 : 0,
      flexShrink: 0,
      flexBasis: 'auto',
      minWidth: undefined,
    },
    tabItemActive: {
      backgroundColor: isUnderline ? 'transparent' : theme.colors.primary,

      ...Platform.select({
        web: {
          boxShadow: isUnderline ? 'none' : '0 2px 8px rgba(37, 99, 235, 0.25)',
        } as any,

        default: {
          shadowColor: isUnderline ? 'transparent' : theme.colors.primary,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: isUnderline ? 0 : 0.2,
          shadowRadius: 4,
          elevation: isUnderline ? 0 : 2,
        },
      }),
    },
    tabItemInactive: {
      backgroundColor: 'transparent',
    },
    tabItemHovered: {
      backgroundColor: theme.isDark
        ? 'rgba(255, 255, 255, 0.08)'
        : 'rgba(0, 0, 0, 0.04)',
    },
    tabItemPressed: {
      opacity: 0.85,
      transform: [{ scale: 0.97 }],
    },
    tabLabel: {
      fontSize: s.fontSize,
      letterSpacing: -0.2,
      flexShrink: scrollable ? 0 : 1,
    },
    badge: {
      paddingHorizontal: 6,
      paddingVertical: 1.5,
      borderRadius: 999,
      alignItems: 'center',
      justifyContent: 'center',
    },
    badgeActive: {
      backgroundColor: 'rgba(255, 255, 255, 0.25)',
    },
    badgeInactive: {
      backgroundColor: theme.isDark
        ? 'rgba(255, 255, 255, 0.10)'
        : 'rgba(0, 0, 0, 0.06)',
    },
    badgeText: {
      fontSize: 10.5,
      fontWeight: '700',
    },
    activeUnderline: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: 2.5,
      backgroundColor: theme.colors.primary,
      borderTopLeftRadius: 2,
      borderTopRightRadius: 2,
    },
  });
}
// // src/components/ui/TripTabs.tsx
// import React from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   Pressable,
//   ScrollView,
//   Platform,
//   ViewStyle,
// } from 'react-native';
// import { useTheme } from '../../providers/ThemeProvider';
// import AppIcon from '../common/AppIcon';
// import { haptics } from '../../utils/haptics';
// import type { Theme } from '../../theme';

// export interface TripTabItem<T = string> {
//   id: T;
//   label: string;
//   icon?: string;
//   badge?: string | number;
//   badgeVariant?: 'neutral' | 'success' | 'warning' | 'danger' | 'info';
// }

// export interface TripTabsProps<T = string> {
//   tabs: TripTabItem<T>[];
//   activeTab: T;
//   onChange: (id: T) => void;
//   variant?: 'pill' | 'segmented' | 'underline';
//   size?: 'sm' | 'md' | 'lg';
//   scrollable?: boolean;
//   style?: ViewStyle;
//   contentContainerStyle?: ViewStyle;
// }

// export function TripTabs<T = string>({
//   tabs,
//   activeTab,
//   onChange,
//   variant = 'segmented',
//   size = 'md',
//   scrollable = false,
//   style,
//   contentContainerStyle,
// }: TripTabsProps<T>) {
//   const theme = useTheme();
//   const styles = React.useMemo(() => createStyles(theme, size, variant), [theme, size, variant]);

//   const handleTabPress = (id: T) => {
//     haptics.selection();
//     onChange(id);
//   };

//   const renderTabs = () =>
//     tabs.map((tab) => {
//       const isActive = activeTab === tab.id;

//       return (
//         <Pressable
//           key={String(tab.id)}
//           onPress={() => handleTabPress(tab.id)}
//           style={({ pressed, hovered }: any) => [
//             styles.tabItem,
//             scrollable && variant !== 'segmented' && { flex: 0, flexShrink: 0 },
//             isActive ? styles.tabItemActive : styles.tabItemInactive,
//             Platform.OS === 'web' && hovered && !isActive && styles.tabItemHovered,
//             pressed && styles.tabItemPressed,
//           ]}
//         >
//           {tab.icon && (
//             <AppIcon
//               name={tab.icon as any}
//               size={size === 'sm' ? 13 : size === 'lg' ? 16 : 14}
//               color={
//                 isActive
//                   ? variant === 'underline'
//                     ? theme.colors.primary
//                     : '#FFFFFF'
//                   : theme.colors.textSecondary
//               }
//             />
//           )}

//           <Text
//             style={[
//               styles.tabLabel,
//               {
//                 color: isActive
//                   ? variant === 'underline'
//                     ? theme.colors.primary
//                     : '#FFFFFF'
//                   : theme.isDark
//                   ? 'rgba(255, 255, 255, 0.78)'
//                   : 'rgba(30, 41, 59, 0.78)',
//                 fontWeight: isActive ? '700' : '600',
//               },
//             ]}
//             numberOfLines={1}
//           >
//             {tab.label}
//           </Text>

//           {tab.badge !== undefined && tab.badge !== null && tab.badge !== 0 && (
//             <View
//               style={[
//                 styles.badge,
//                 isActive ? styles.badgeActive : styles.badgeInactive,
//               ]}
//             >
//               <Text
//                 style={[
//                   styles.badgeText,
//                   {
//                     color: isActive ? '#FFFFFF' : theme.colors.textSecondary,
//                   },
//                 ]}
//               >
//                 {String(tab.badge)}
//               </Text>
//             </View>
//           )}

//           {variant === 'underline' && isActive && <View style={styles.activeUnderline} />}
//         </Pressable>
//       );
//     });

//   if (scrollable) {
//     return (
//       <View style={[styles.container, style]}>
//         <ScrollView
//           horizontal
//           showsHorizontalScrollIndicator={false}
//           contentContainerStyle={[styles.scrollContainer, contentContainerStyle]}
//         >
//           {renderTabs()}
//         </ScrollView>
//       </View>
//     );
//   }

//   return (
//     <View style={[styles.container, style]}>
//       <View style={[styles.staticContainer, contentContainerStyle]}>{renderTabs()}</View>
//     </View>
//   );
// }

// function createStyles(theme: Theme, size: 'sm' | 'md' | 'lg', variant: 'pill' | 'segmented' | 'underline') {
//   const sizeMap = {
//     sm: { height: 36, paddingX: 8, paddingY: 5, fontSize: 11.5, gap: 5 },
//     md: { height: 42, paddingX: 12, paddingY: 7, fontSize: 13, gap: 6 },
//     lg: { height: 48, paddingX: 16, paddingY: 9, fontSize: 14.5, gap: 8 },
//   };
//   const s = sizeMap[size];

//   const isUnderline = variant === 'underline';

//   return StyleSheet.create({
//     container: {
//       borderRadius: isUnderline ? 0 : 999,
//       borderBottomWidth: isUnderline ? 1 : 0,
//       borderBottomColor: isUnderline ? theme.colors.borderLight : 'transparent',
//     },
//     staticContainer: {
//       flexDirection: 'row',
//       alignItems: 'center',
//       backgroundColor: isUnderline
//         ? 'transparent'
//         : theme.isDark
//         ? 'rgba(30, 41, 59, 0.70)'
//         : 'rgba(255, 255, 255, 0.85)',
//       borderRadius: isUnderline ? 0 : 999,
//       padding: isUnderline ? 0 : 3,
//       borderWidth: isUnderline ? 0 : 1,
//       borderColor: theme.isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(226, 232, 240, 0.90)',
//       overflow: 'hidden',

//       ...Platform.select({
//         web: {
//           backdropFilter: isUnderline ? 'none' : 'blur(16px)',
//           boxShadow: isUnderline ? 'none' : '0 2px 10px rgba(0, 0, 0, 0.04)',
//         } as any,
//       }),
//     },
//     scrollContainer: {
//       flexDirection: 'row',
//       alignItems: 'center',
//       gap: 6,
//       backgroundColor: isUnderline
//         ? 'transparent'
//         : theme.isDark
//         ? 'rgba(30, 41, 59, 0.70)'
//         : 'rgba(255, 255, 255, 0.85)',
//       borderRadius: isUnderline ? 0 : 999,
//       padding: isUnderline ? 0 : 3,
//       borderWidth: isUnderline ? 0 : 1,
//       borderColor: theme.isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(226, 232, 240, 0.90)',

//       ...Platform.select({
//         web: {
//           backdropFilter: isUnderline ? 'none' : 'blur(16px)',
//           boxShadow: isUnderline ? 'none' : '0 2px 10px rgba(0, 0, 0, 0.04)',
//         } as any,
//       }),
//     },
//     tabItem: {
//       flex: variant === 'segmented' ? 1 : undefined,
//       flexShrink: 1,
//       minWidth: 0,
//       flexDirection: 'row',
//       alignItems: 'center',
//       justifyContent: 'center',
//       paddingHorizontal: s.paddingX,
//       paddingVertical: s.paddingY,
//       borderRadius: isUnderline ? 0 : 999,
//       gap: s.gap,
//       position: 'relative',
//       minHeight: s.height - (isUnderline ? 0 : 6),

//       ...Platform.select({
//         web: {
//           cursor: 'pointer',
//           transition: 'all 0.15s ease',
//           userSelect: 'none',
//         } as any,
//       }),
//     },
//     tabItemActive: {
//       backgroundColor: isUnderline ? 'transparent' : theme.colors.primary,

//       ...Platform.select({
//         web: {
//           boxShadow: isUnderline ? 'none' : '0 2px 8px rgba(37, 99, 235, 0.25)',
//         } as any,

//         default: {
//           shadowColor: isUnderline ? 'transparent' : theme.colors.primary,
//           shadowOffset: { width: 0, height: 2 },
//           shadowOpacity: isUnderline ? 0 : 0.2,
//           shadowRadius: 4,
//           elevation: isUnderline ? 0 : 2,
//         },
//       }),
//     },
//     tabItemInactive: {
//       backgroundColor: 'transparent',
//     },
//     tabItemHovered: {
//       backgroundColor: theme.isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
//     },
//     tabItemPressed: {
//       opacity: 0.85,
//       transform: [{ scale: 0.97 }],
//     },
//     tabLabel: {
//       fontSize: s.fontSize,
//       letterSpacing: -0.2,
//     },
//     badge: {
//       paddingHorizontal: 6,
//       paddingVertical: 1.5,
//       borderRadius: 999,
//       alignItems: 'center',
//       justifyContent: 'center',
//     },
//     badgeActive: {
//       backgroundColor: 'rgba(255, 255, 255, 0.25)',
//     },
//     badgeInactive: {
//       backgroundColor: theme.isDark ? 'rgba(255, 255, 255, 0.10)' : 'rgba(0, 0, 0, 0.06)',
//     },
//     badgeText: {
//       fontSize: 10.5,
//       fontWeight: '700',
//     },
//     activeUnderline: {
//       position: 'absolute',
//       bottom: 0,
//       left: 0,
//       right: 0,
//       height: 2.5,
//       backgroundColor: theme.colors.primary,
//       borderTopLeftRadius: 2,
//       borderTopRightRadius: 2,
//     },
//   });
// }

import React, { ReactNode } from 'react';
import { View, Pressable, ScrollView, ViewStyle } from 'react-native';
import Text from '../primitives/Text';
import { HStack, VStack } from '../primitives/Stack';
import { useTheme } from '../../hooks/useTheme';
import { SPACING, RADIUS } from '../../tokens/tokens';

export interface TabItem {
  label: string;
  icon?: ReactNode;
  badge?: number;
  disabled?: boolean;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: number;
  onTabChange: (index: number) => void;
  variant?: 'text' | 'filled' | 'outlined';
  fullWidth?: boolean;
  scrollable?: boolean;
  style?: ViewStyle;
  testID?: string;
}

export const Tabs = React.forwardRef<View, TabsProps>(
  (
    {
      tabs,
      activeTab,
      onTabChange,
      variant = 'text',
      fullWidth = false,
      scrollable = false,
      style,
      testID,
    },
    ref,
  ) => {
    const { colors } = useTheme();

    const Container = scrollable ? ScrollView : View;

    const containerProps = scrollable
      ? {
          horizontal: true,
          showsHorizontalScrollIndicator: false,
        }
      : {};

    return (
      <Container
        ref={ref}
        style={[
          {
            backgroundColor: colors.surface,
            borderBottomWidth: variant === 'text' ? 1 : 0,
            borderBottomColor: colors.outline,
          },
          style,
        ]}
        {...containerProps}
        testID={testID}
      >
        <HStack
          gap={0}
          style={{
            flex: fullWidth && !scrollable ? 1 : undefined,
          }}
        >
          {tabs.map((tab, index) => (
            <TabButton
              key={index}
              tab={tab}
              isActive={index === activeTab}
              onPress={() => !tab.disabled && onTabChange(index)}
              variant={variant}
              fullWidth={fullWidth && !scrollable}
            />
          ))}
        </HStack>
      </Container>
    );
  },
);

Tabs.displayName = 'Tabs';

interface TabButtonProps {
  tab: TabItem;
  isActive: boolean;
  onPress: () => void;
  variant: 'text' | 'filled' | 'outlined';
  fullWidth: boolean;
}

const TabButton: React.FC<TabButtonProps> = ({
  tab,
  isActive,
  onPress,
  variant,
  fullWidth,
}) => {
  const { colors } = useTheme();

  const getBackgroundColor = () => {
    if (!isActive) return 'transparent';
    switch (variant) {
      case 'filled':
        return colors.primary;
      case 'outlined':
        return colors.surfaceVariant;
      case 'text':
      default:
        return 'transparent';
    }
  };

  const getTextColor = () => {
    if (!isActive) return colors.onSurfaceVariant;
    switch (variant) {
      case 'filled':
        return colors.onPrimary;
      case 'outlined':
      case 'text':
      default:
        return colors.primary;
    }
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={tab.disabled}
      style={({ pressed }) => [
        {
          flex: fullWidth ? 1 : undefined,
          paddingHorizontal: SPACING.lg,
          paddingVertical: SPACING.md,
          backgroundColor: pressed
            ? variant === 'text'
              ? colors.surfaceVariant
              : getBackgroundColor()
            : getBackgroundColor(),
          borderBottomWidth: variant === 'text' && isActive ? 2 : 0,
          borderBottomColor: colors.primary,
          opacity: tab.disabled ? 0.5 : 1,
        },
      ]}
    >
      <HStack align="center" gap="sm" justify="center">
        {tab.icon && <View>{tab.icon}</View>}
        <Text
          variant="body"
          weight={isActive ? '600' : '500'}
          color={getTextColor()}
        >
          {tab.label}
        </Text>
        {tab.badge !== undefined && (
          <View
            style={{
              backgroundColor: colors.error,
              borderRadius: 8,
              width: 16,
              height: 16,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Text
              variant="caption"
              weight="700"
              color={colors.onError}
              style={{ fontSize: 10 }}
            >
              {tab.badge}
            </Text>
          </View>
        )}
      </HStack>
    </Pressable>
  );
};

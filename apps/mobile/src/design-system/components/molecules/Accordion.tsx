import React, { ReactNode, useState } from 'react';
import { View, Pressable, ViewStyle, Animated } from 'react-native';
import Text from '../primitives/Text';
import { HStack, VStack } from '../primitives/Stack';
import { useTheme } from '../../hooks/useTheme';
import { SPACING, RADIUS } from '../../tokens/tokens';

export interface AccordionItem {
  title: string;
  content: ReactNode;
  subtitle?: string;
  disabled?: boolean;
}

export interface AccordionProps {
  items: AccordionItem[];
  allowMultiple?: boolean;
  style?: ViewStyle;
  testID?: string;
}

export const Accordion = React.forwardRef<View, AccordionProps>(
  ({ items, allowMultiple = false, style, testID }, ref) => {
    const [expanded, setExpanded] = useState<Set<number>>(new Set());
    const { colors } = useTheme();

    const toggleItem = (index: number) => {
      setExpanded(prev => {
        const newSet = new Set(prev);
        if (newSet.has(index)) {
          newSet.delete(index);
        } else {
          if (!allowMultiple) {
            newSet.clear();
          }
          newSet.add(index);
        }
        return newSet;
      });
    };

    return (
      <View
        ref={ref}
        style={[{ borderRadius: RADIUS.lg, overflow: 'hidden' }, style]}
        testID={testID}
      >
        <VStack gap={0}>
          {items.map((item, index) => (
            <AccordionItemComponent
              key={index}
              item={item}
              index={index}
              isExpanded={expanded.has(index)}
              onPress={() => !item.disabled && toggleItem(index)}
              isFirst={index === 0}
              isLast={index === items.length - 1}
            />
          ))}
        </VStack>
      </View>
    );
  },
);

Accordion.displayName = 'Accordion';

interface AccordionItemComponentProps {
  item: AccordionItem;
  index: number;
  isExpanded: boolean;
  onPress: () => void;
  isFirst: boolean;
  isLast: boolean;
}

const AccordionItemComponent: React.FC<AccordionItemComponentProps> = ({
  item,
  index,
  isExpanded,
  onPress,
  isFirst,
  isLast,
}) => {
  const { colors } = useTheme();
  const heightAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(heightAnim, {
      toValue: isExpanded ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [isExpanded, heightAnim]);

  return (
    <View
      style={{
        borderBottomWidth: 1,
        borderBottomColor: colors.outline,
        backgroundColor: isExpanded ? colors.surfaceVariant : colors.surface,
      }}
    >
      {/* Header */}
      <Pressable
        onPress={onPress}
        disabled={item.disabled}
        style={({ pressed }) => [
          {
            paddingVertical: SPACING.md,
            paddingHorizontal: SPACING.lg,
            backgroundColor: pressed
              ? colors.surfaceVariant
              : isExpanded
                ? colors.surfaceVariant
                : colors.surface,
            opacity: item.disabled ? 0.5 : 1,
          },
        ]}
      >
        <HStack justify="space-between" align="center" gap="md">
          <VStack flex={1} gap="xs">
            <Text
              variant="body"
              weight="600"
              color={isExpanded ? colors.primary : colors.onSurface}
            >
              {item.title}
            </Text>
            {item.subtitle && (
              <Text variant="caption" color={colors.onSurfaceVariant}>
                {item.subtitle}
              </Text>
            )}
          </VStack>

          <Animated.Text
            style={{
              fontSize: 18,
              color: isExpanded ? colors.primary : colors.onSurfaceVariant,
              transform: [
                {
                  rotate: heightAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '180deg'],
                  }),
                },
              ],
            }}
          >
            ▼
          </Animated.Text>
        </HStack>
      </Pressable>

      {/* Content */}
      {isExpanded && (
        <View
          style={{
            paddingVertical: SPACING.md,
            paddingHorizontal: SPACING.lg,
            backgroundColor: colors.surface,
            borderTopWidth: 1,
            borderTopColor: colors.outline,
          }}
        >
          {typeof item.content === 'string' ? (
            <Text variant="body" color={colors.onSurface}>
              {item.content}
            </Text>
          ) : (
            item.content
          )}
        </View>
      )}
    </View>
  );
};

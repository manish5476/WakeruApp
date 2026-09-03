// src/components/trips/StopDetails/QuickActions.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useTheme } from '../../../providers/ThemeProvider';
import AppIcon from '../../common/AppIcon';
import { GlassCard } from '../../ui';
import { QuickActionUI } from './PresentationModels';
import Animated, { FadeInRight } from 'react-native-reanimated';

interface Props {
  actions: QuickActionUI[];
}

export function QuickActions({ actions }: Props) {
  const theme = useTheme();

  if (!actions || actions.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
        Quick Actions
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {actions.map((action, index) => {
          const isDanger = action.variant === 'danger';
          const isPrimary = action.variant === 'primary';

          let color = theme.colors.textPrimary;
          let glowBg = 'rgba(255, 255, 255, 0.08)';

          if (isDanger) {
            color = '#EF4444';
            glowBg = 'rgba(239, 68, 68, 0.12)';
          } else if (isPrimary) {
            color = '#EA580C';
            glowBg = 'rgba(234, 88, 12, 0.12)';
          }

          return (
            <Animated.View
              key={action.label}
              entering={FadeInRight.delay(index * 50).duration(300)}
            >
              <TouchableOpacity activeOpacity={0.7} onPress={action.onPress}>
                <GlassCard
                  variant="prominent"
                  style={[
                    styles.card,
                    isPrimary && { borderColor: 'rgba(234, 88, 12, 0.4)' },
                  ]}
                  intensity={theme.isDark ? 35 : 55}
                >
                  <View style={[styles.iconWrap, { backgroundColor: glowBg }]}>
                    <AppIcon name={action.icon} size={18} color={color} />
                  </View>
                  <Text
                    style={[
                      styles.label,
                      {
                        color: isDanger
                          ? '#EF4444'
                          : isPrimary
                            ? '#EA580C'
                            : theme.colors.textPrimary,
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {action.label}
                  </Text>
                </GlassCard>
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 12,
  },
  scrollContent: {
    gap: 10,
    paddingVertical: 2,
  },
  card: {
    width: 100,
    height: 90,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    gap: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',

    ...Platform.select({
      web: {
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.06)',
      } as any,

      default: {
        shadowColor: '#000',

        shadowOffset: {
          width: 0,
          height: 4,
        },

        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 4,
      },
    }),
  } as any,
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
});

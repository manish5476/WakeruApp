import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  Pressable,
} from 'react-native';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useTheme } from '../../../providers/ThemeProvider';
import { ITravelPlan } from '../../../types/travelPlan.types';
import AppIcon from '../../common/AppIcon';

interface DashboardWidgetsProps {
  plan: ITravelPlan | undefined;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function StatPill({
  icon,
  value,
  label,
  color,
  delay,
  bg,
}: {
  icon: string;
  value: number;
  label: string;
  color: string;
  delay: number;
  bg: string;
}) {
  const theme = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      entering={FadeInDown.delay(delay).springify()}
      onPressIn={() => (scale.value = withSpring(0.96))}
      onPressOut={() => (scale.value = withSpring(1))}
      style={[
        styles.statPill,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.isDark ? 'rgba(255,255,255,0.08)' : '#F1F5F9',
        },
        animatedStyle,
      ]}
    >
      <View style={[styles.iconBadge, { backgroundColor: bg }]}>
        <AppIcon name={icon as any} size={18} color={color} />
      </View>
      <View style={styles.statContent}>
        <Text style={[styles.statValue, { color: theme.colors.textPrimary }]}>
          {value}
        </Text>
        <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
          {label}
        </Text>
      </View>
    </AnimatedPressable>
  );
}

export function DashboardWidgets({ plan }: DashboardWidgetsProps) {
  const stats = [
    {
      id: 'flights',
      label: 'Flights',
      value: plan?.flightDetails?.length || 0,
      icon: 'airplane',
      color: '#2563EB',
      bg: '#EFF6FF',
    },
    {
      id: 'hotels',
      label: 'Hotels',
      value: plan?.accommodationDetails?.length || 0,
      icon: 'bed',
      color: '#EA580C',
      bg: '#FFF7ED',
    },
    {
      id: 'transport',
      label: 'Transport',
      value: plan?.transportDetails?.length || 0,
      icon: 'train',
      color: '#059669',
      bg: '#ECFDF5',
    },
    {
      id: 'activities',
      label: 'Itinerary Days',
      value: plan?.itinerary?.length || 0,
      icon: 'map',
      color: '#7C3AED',
      bg: '#F5F3FF',
    },
  ];

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {stats.map((stat, index) => (
          <StatPill key={stat.id} {...stat} delay={index * 80} />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  scrollContent: {
    gap: 12,
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
    borderWidth: 1,
    minWidth: 140,

    ...Platform.select({
      web: {
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.03)',
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
  },
  iconBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  statContent: {
    flexDirection: 'column',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '900',
    lineHeight: 22,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 2,
  },
});

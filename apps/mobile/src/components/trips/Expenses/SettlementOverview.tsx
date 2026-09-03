// src/components/trips/Expenses/SettlementOverview.tsx

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { GlassCard } from '../../ui/GlassCard';
import { useTheme } from '../../../providers/ThemeProvider';
import { SettlementOverviewUI } from './PresentationModels';
import AppIcon from '../../common/AppIcon';

interface SettlementOverviewProps {
  settlement: SettlementOverviewUI;
}

export function SettlementOverview({ settlement }: SettlementOverviewProps) {
  const theme = useTheme();
  const styles = useStyles();

  return (
    <Animated.View entering={FadeInDown.delay(100).duration(600).springify()}>
      <View style={styles.container}>
        <Text
          style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}
        >
          Settlements
        </Text>

        <View style={styles.cardsRow}>
          {/* You Owe Card */}
          <GlassCard style={styles.card} intensity={theme.isDark ? 15 : 10}>
            <View style={styles.cardHeader}>
              <View
                style={[
                  styles.iconWrap,
                  { backgroundColor: `${theme.colors.danger}15` },
                ]}
              >
                <AppIcon
                  name="arrow-up-right"
                  size={16}
                  color={theme.colors.danger}
                />
              </View>
              <Text
                style={[
                  styles.cardLabel,
                  { color: theme.colors.textSecondary },
                ]}
              >
                You Owe
              </Text>
            </View>
            <Text
              style={[styles.cardValue, { color: theme.colors.textPrimary }]}
            >
              {settlement.formattedYouOwe}
            </Text>
          </GlassCard>

          {/* You Are Owed Card */}
          <GlassCard style={styles.card} intensity={theme.isDark ? 15 : 10}>
            <View style={styles.cardHeader}>
              <View
                style={[
                  styles.iconWrap,
                  { backgroundColor: `${theme.colors.success}15` },
                ]}
              >
                <AppIcon
                  name="arrow-down-left"
                  size={16}
                  color={theme.colors.success}
                />
              </View>
              <Text
                style={[
                  styles.cardLabel,
                  { color: theme.colors.textSecondary },
                ]}
              >
                You're Owed
              </Text>
            </View>
            <Text
              style={[styles.cardValue, { color: theme.colors.textPrimary }]}
            >
              {settlement.formattedYouAreOwed}
            </Text>
          </GlassCard>
        </View>
      </View>
    </Animated.View>
  );
}

const useStyles = () => {
  const theme = useTheme();
  return StyleSheet.create({
    container: {
      marginBottom: 32,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '800',
      marginBottom: 16,
      paddingHorizontal: 4,
    },
    cardsRow: {
      flexDirection: 'row',
      gap: 16,
    },
    card: {
      flex: 1,
      padding: 16,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: theme.isDark
        ? 'rgba(255,255,255,0.06)'
        : 'rgba(255,255,255,0.2)',
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginBottom: 12,
    },
    iconWrap: {
      width: 32,
      height: 32,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cardLabel: {
      fontSize: 13,
      fontWeight: '600',
    },
    cardValue: {
      fontSize: 24,
      fontWeight: '800',
      letterSpacing: -0.5,
    },
  });
};

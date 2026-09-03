// components/common/ExpandedDetailsView.tsx
import React, { useMemo } from 'react';
import { View, StyleSheet, Linking, Platform } from 'react-native';
import { router } from 'expo-router';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { useTheme } from '../../providers/ThemeProvider';
import { haptics } from '../../utils/haptics';

import { Typography } from '../ui/Typography';
import { AmountDisplay } from '../ui/AmountDisplay';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import { InteractiveWrapper } from '../ui/InteractiveWrapper';
import AppIcon from './AppIcon';

import type { Theme } from '../../theme';

interface ExpandedDetailsViewProps {
  expense: any;
}

export default function ExpandedDetailsView({
  expense,
}: ExpandedDetailsViewProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  if (!expense) return null;

  const handleOpenMap = () => {
    if (expense.location?.latitude && expense.location?.longitude) {
      haptics.light();
      Linking.openURL(
        `https://www.google.com/maps/search/?api=1&query=${expense.location.latitude},${expense.location.longitude}`,
      );
    }
  };

  return (
    <Animated.View
      entering={FadeIn.duration(300)}
      exiting={FadeOut.duration(200)}
      style={styles.container}
    >
      {/* Divider */}
      <View
        style={[styles.divider, { backgroundColor: theme.colors.borderLight }]}
      />

      {/* Split Details */}
      {expense.splits && expense.splits.length > 0 && (
        <View style={styles.sectionWrap}>
          <Typography
            variant="caption"
            weight="extrabold"
            color="textTertiary"
            style={styles.sectionHeading}
            premium
          >
            SPLIT BREAKDOWN
          </Typography>
          <View style={styles.splitsList}>
            {expense.splits.map((split: any, idx: number) => (
              <View key={split.userId || idx} style={styles.splitRow}>
                <View style={styles.splitLeft}>
                  <Avatar
                    url={split.photoURL}
                    fallback={
                      split.displayName?.charAt(0)?.toUpperCase() || '?'
                    }
                    size="sm"
                  />
                  <Typography
                    variant="bodySm"
                    weight="bold"
                    color="textPrimary"
                  >
                    {split.displayName}
                  </Typography>
                </View>
                <View style={styles.splitRight}>
                  <AmountDisplay
                    amount={split.amountLocal}
                    currency={expense.localCurrency || 'INR'}
                    size="sm"
                    compact
                    variant="default"
                  />
                  <View
                    style={[
                      styles.statusIndicator,
                      {
                        backgroundColor: split.isPaid
                          ? 'rgba(16,185,129,0.12)'
                          : 'rgba(245,158,11,0.12)',
                      },
                    ]}
                  >
                    <AppIcon
                      name={split.isPaid ? 'check-circle' : 'clock'}
                      size={13}
                      color={split.isPaid ? '#059669' : '#D97706'}
                    />
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Location */}
      {expense.location && (
        <View style={styles.sectionWrap}>
          <InteractiveWrapper onPress={handleOpenMap}>
            <View
              style={[
                styles.locationBox,
                {
                  backgroundColor: theme.colors.background,
                  borderColor: theme.isDark
                    ? 'rgba(255,255,255,0.06)'
                    : 'rgba(15,23,42,0.05)',
                },
              ]}
            >
              <AppIcon name="map-pin" size={15} color={theme.colors.primary} />
              <Typography
                variant="bodySm"
                weight="bold"
                color="textPrimary"
                style={{ flex: 1 }}
              >
                View Location on Map
              </Typography>
              <AppIcon
                name="external-link"
                size={13}
                color={theme.colors.textTertiary}
              />
            </View>
          </InteractiveWrapper>
        </View>
      )}

      {/* View Full Details */}
      <Button
        title="View Full Details"
        variant="outline"
        size="md"
        fullWidth
        onPress={() => {
          haptics.light();
          router.push(`/(app)/expenses/${expense._id}`);
        }}
        rightIcon={
          <AppIcon
            name="arrow-right"
            size={15}
            color={theme.colors.textPrimary}
          />
        }
      />
    </Animated.View>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    container: {
      width: '100%',
      marginTop: 12,
      gap: 12,
    },
    divider: {
      height: 1,
      width: '100%',
    },
    sectionWrap: {
      gap: 8,
    },
    sectionHeading: {
      letterSpacing: 0.8,
    },
    splitsList: {
      gap: 8,
    },
    splitRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 6,
      paddingHorizontal: 10,
      borderRadius: 12,
      backgroundColor: theme.isDark
        ? 'rgba(255,255,255,0.03)'
        : 'rgba(15,23,42,0.02)',
    },
    splitLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    splitRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    statusIndicator: {
      width: 24,
      height: 24,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    locationBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      padding: 12,
      borderRadius: 14,
      borderWidth: 1,

      ...Platform.select({
        web: {
          boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
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
  });
}

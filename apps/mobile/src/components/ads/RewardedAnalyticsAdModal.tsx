// src/components/ads/RewardedAnalyticsAdModal.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  Platform,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../providers/ThemeProvider';
import AppIcon from '../common/AppIcon';
import { GlassCard } from '../ui/GlassCard';
import { TravelAffiliateCard } from './TravelAffiliateCard';
import { haptics } from '../../utils/haptics';
import { router } from 'expo-router';

interface RewardedAnalyticsAdModalProps {
  visible: boolean;
  onClose: () => void;
  onAdCompleted: () => void;
  durationSeconds?: number;
}

export function RewardedAnalyticsAdModal({
  visible,
  onClose,
  onAdCompleted,
  durationSeconds = 60,
}: RewardedAnalyticsAdModalProps) {
  const theme = useTheme();
  const [secondsRemaining, setSecondsRemaining] = useState(durationSeconds);

  useEffect(() => {
    if (!visible) {
      setSecondsRemaining(durationSeconds);
      return;
    }

    setSecondsRemaining(durationSeconds);
    const interval = setInterval(() => {
      setSecondsRemaining(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [visible, durationSeconds]);

  if (!visible) return null;

  const isCompleted = secondsRemaining === 0;
  const progressPercent = Math.min(
    100,
    Math.round(((durationSeconds - secondsRemaining) / durationSeconds) * 100),
  );

  const handleClaim = () => {
    haptics.success();
    onAdCompleted();
  };

  const handleUpgrade = () => {
    onClose();
    router.push('/(app)/plans' as any);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={isCompleted ? onClose : undefined}
    >
      <View style={styles.backdrop}>
        <View style={styles.centerContainer}>
          <GlassCard
            style={styles.modalCard}
            intensity={theme.isDark ? 30 : 40}
          >
            {/* Top Bar with Timer */}
            <View style={styles.topHeader}>
              <View style={styles.sponsorBadge}>
                <AppIcon name="sparkles" size={14} color="#F59E0B" />
                <Text style={styles.sponsorText}>SPONSORED PASS</Text>
              </View>

              {isCompleted ? (
                <Pressable
                  onPress={onClose}
                  style={({ pressed }) => [
                    styles.closeBtn,
                    pressed && { opacity: 0.7 },
                  ]}
                >
                  <AppIcon
                    name="x"
                    size={18}
                    color={theme.colors.textSecondary}
                  />
                </Pressable>
              ) : (
                <View style={styles.timerBadge}>
                  <AppIcon name="clock" size={14} color="#3B82F6" />
                  <Text style={styles.timerText}>
                    {secondsRemaining}s remaining
                  </Text>
                </View>
              )}
            </View>

            {/* Progress Bar */}
            <View
              style={[
                styles.progressTrack,
                {
                  backgroundColor: theme.isDark
                    ? 'rgba(255,255,255,0.08)'
                    : 'rgba(0,0,0,0.06)',
                },
              ]}
            >
              <View
                style={[
                  styles.progressBar,
                  {
                    width: `${progressPercent}%`,
                    backgroundColor: isCompleted ? '#10B981' : '#3B82F6',
                  },
                ]}
              />
            </View>

            {/* Title / Description */}
            <View style={styles.contentWrap}>
              <Text
                style={[styles.headline, { color: theme.colors.textPrimary }]}
              >
                {isCompleted ? 'Access Granted! 🎉' : 'Unlocking Pro Analytics'}
              </Text>
              <Text
                style={[
                  styles.subheadline,
                  { color: theme.colors.textSecondary },
                ]}
              >
                {isCompleted
                  ? 'Thank you for supporting TripSplit. You now have full access to Pro Analytics for this session.'
                  : 'Watch this partner spotlight or upgrade to Pro to unlock comprehensive spending intelligence without waiting.'}
              </Text>
            </View>

            {/* Contextual Travel Sponsor Feature */}
            <View style={styles.sponsorContent}>
              <TravelAffiliateCard
                type="hotel"
                compact
                customTitle="Special Group Stay Offers"
                customSubtitle="Save up to 25% on boutique hotels & villas via Booking.com"
              />
            </View>

            {/* Bottom Actions */}
            <View style={styles.actionsWrap}>
              {isCompleted ? (
                <Pressable
                  onPress={handleClaim}
                  style={({ pressed }) => [
                    styles.primaryBtn,
                    pressed && { opacity: 0.9 },
                  ]}
                >
                  <LinearGradient
                    colors={['#10B981', '#059669']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.btnGradient}
                  >
                    <Text style={styles.btnText}>Open Analytics Now →</Text>
                  </LinearGradient>
                </Pressable>
              ) : (
                <Pressable
                  onPress={handleUpgrade}
                  style={({ pressed }) => [
                    styles.upgradeBtn,
                    pressed && { opacity: 0.8 },
                    { borderColor: theme.colors.primary },
                  ]}
                >
                  <Text
                    style={[
                      styles.upgradeText,
                      { color: theme.colors.primary },
                    ]}
                  >
                    Skip Forever with Pro →
                  </Text>
                </Pressable>
              )}
            </View>
          </GlassCard>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  centerContainer: {
    width: '100%',
    maxWidth: 520,
  },
  modalCard: {
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    overflow: 'hidden',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sponsorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 99,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
  },
  sponsorText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#F59E0B',
    letterSpacing: 0.5,
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 99,
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
  },
  timerText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#3B82F6',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
  contentWrap: {
    marginBottom: 16,
  },
  headline: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.4,
    marginBottom: 6,
  },
  subheadline: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '500',
  },
  sponsorContent: {
    marginVertical: 12,
  },
  actionsWrap: {
    marginTop: 14,
  },
  primaryBtn: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  btnGradient: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  upgradeBtn: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    borderWidth: 1.5,
  },
  upgradeText: {
    fontSize: 14,
    fontWeight: '700',
  },
});

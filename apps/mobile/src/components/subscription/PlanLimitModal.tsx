import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '../../providers/ThemeProvider';
import AppIcon from '../common/AppIcon';
import { GlassCard } from '../ui/GlassCard';

export interface PlanLimitModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  limitKey?: string;
  currentUsage?: number;
  limitValue?: number;
  currentPlanName?: string;
  actionLabel?: string;
}

export const PlanLimitModal: React.FC<PlanLimitModalProps> = ({
  visible,
  onClose,
  title = 'Plan Limit Reached',
  message,
  limitKey = 'trips',
  currentUsage = 5,
  limitValue = 5,
  currentPlanName = 'Free Plan',
  actionLabel = 'View Plans & Upgrade',
}) => {
  const theme = useTheme();

  const handleUpgrade = () => {
    onClose();
    router.push('/(app)/plans' as any);
  };

  const defaultMessage = `Your ${currentPlanName} allows up to ${limitValue} ${limitKey}. Upgrade your plan for higher limits and premium travel tools.`;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />

        <GlassCard
          style={[styles.modalCard, { borderColor: theme.colors.borderLight }]}
          intensity={theme.isDark ? 35 : 50}
        >
          {/* Close button */}
          <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={10}>
            <AppIcon name="x" size={18} color={theme.colors.textSecondary} />
          </Pressable>

          {/* Icon Aura */}
          <View
            style={[
              styles.iconAura,
              { backgroundColor: `${theme.colors.primary}18` },
            ]}
          >
            <AppIcon name="sparkles" size={26} color={theme.colors.primary} />
          </View>

          {/* Current Plan Badge */}
          <View
            style={[
              styles.planBadge,
              {
                backgroundColor: `${theme.colors.warning}18`,
                borderColor: `${theme.colors.warning}30`,
              },
            ]}
          >
            <AppIcon name="shield" size={12} color={theme.colors.warning} />
            <Text
              style={[styles.planBadgeText, { color: theme.colors.warning }]}
            >
              {currentPlanName.toUpperCase()}
            </Text>
          </View>

          {/* Title & Description */}
          <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
            {title}
          </Text>
          <Text style={[styles.message, { color: theme.colors.textSecondary }]}>
            {message || defaultMessage}
          </Text>

          {/* Limit Progress Metric Meter */}
          <View
            style={[
              styles.meterContainer,
              {
                backgroundColor: theme.isDark
                  ? 'rgba(255,255,255,0.04)'
                  : 'rgba(0,0,0,0.03)',
                borderColor: theme.colors.borderLight,
              },
            ]}
          >
            <View style={styles.meterHeader}>
              <Text
                style={[
                  styles.meterLabel,
                  { color: theme.colors.textSecondary },
                ]}
              >
                {limitKey.charAt(0).toUpperCase() + limitKey.slice(1)} Allowance
              </Text>
              <Text
                style={[styles.meterValue, { color: theme.colors.textPrimary }]}
              >
                {currentUsage} / {limitValue}
              </Text>
            </View>

            <View
              style={[
                styles.progressBarBg,
                {
                  backgroundColor: theme.isDark
                    ? 'rgba(255,255,255,0.1)'
                    : 'rgba(0,0,0,0.08)',
                },
              ]}
            >
              <View
                style={[
                  styles.progressBarFill,
                  {
                    backgroundColor: theme.colors.warning,
                    width: '100%',
                  },
                ]}
              />
            </View>
          </View>

          {/* Action CTAs */}
          <View style={styles.actionsRow}>
            <Pressable
              onPress={handleUpgrade}
              style={({ pressed }) => [
                styles.primaryBtn,
                { backgroundColor: theme.colors.primary },
                pressed && { opacity: 0.9 },
              ]}
            >
              <AppIcon name="zap" size={16} color="#FFF" />
              <Text style={styles.primaryBtnText}>{actionLabel}</Text>
            </Pressable>

            <Pressable
              onPress={onClose}
              style={({ pressed }) => [
                styles.secondaryBtn,
                pressed && { opacity: 0.8 },
              ]}
            >
              <Text
                style={[
                  styles.secondaryBtnText,
                  { color: theme.colors.textTertiary },
                ]}
              >
                Maybe Later
              </Text>
            </Pressable>
          </View>
        </GlassCard>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  backdrop: {
    ...(StyleSheet.absoluteFill as any),
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    ...Platform.select({
      web: { boxShadow: '0 12px 36px rgba(0,0,0,0.15)' } as any,
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
        elevation: 8,
      },
    }),
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  iconAura: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  planBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
    marginBottom: 12,
  },
  planBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  message: {
    fontSize: 13.5,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 18,
    paddingHorizontal: 8,
  },
  meterContainer: {
    width: '100%',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    marginBottom: 20,
  },
  meterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  meterLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  meterValue: {
    fontSize: 12.5,
    fontWeight: '800',
  },
  progressBarBg: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  actionsRow: {
    width: '100%',
    gap: 10,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
  },
  primaryBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  secondaryBtn: {
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
});

export default PlanLimitModal;

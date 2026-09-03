import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { colors, spacing, radius, shadow, typography } from '../theme/tokens';
import { IconWifiOff, IconCheck, IconRefresh } from '../icons/LandingIcons';
import AppIcon from '../../common/AppIcon';

export function OfflineAndSecuritySection() {
  const [isAirplaneMode, setIsAirplaneMode] = useState(true);
  const [syncState, setSyncState] = useState<'offline' | 'syncing' | 'synced'>(
    'offline',
  );

  const toggleNetwork = () => {
    if (isAirplaneMode) {
      setIsAirplaneMode(false);
      setSyncState('syncing');
      setTimeout(() => {
        setSyncState('synced');
      }, 1200);
    } else {
      setIsAirplaneMode(true);
      setSyncState('offline');
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.badge}>
          <IconWifiOff size={14} color={colors.brand.primary} />
          <Text style={styles.badgeText}>OFFLINE-FIRST ARCHITECTURE</Text>
        </View>
        <Text style={styles.title}>Works at 30,000 Ft & Off-Grid</Text>
        <Text style={styles.subtitle}>
          No roaming in the Swiss Alps or zero signal on a high-speed train? Add
          expenses, check itineraries, and calculate splits offline. Syncs
          conflict-free the instant you reconnect.
        </Text>
      </View>

      {/* Interactive Network Simulator Box */}
      <View style={styles.simulatorBox}>
        <View style={styles.simulatorTop}>
          <View style={styles.statusRow}>
            <View
              style={[
                styles.statusDot,
                isAirplaneMode ? styles.dotOffline : styles.dotOnline,
              ]}
            />
            <Text style={styles.statusLabel}>
              {isAirplaneMode
                ? '✈️ Offline Mode (Airplane)'
                : '📶 Wi-Fi Connected'}
            </Text>
          </View>

          <Pressable
            onPress={toggleNetwork}
            style={({ pressed }) => [
              styles.toggleBtn,
              !isAirplaneMode && styles.toggleBtnActive,
              pressed && styles.btnPressed,
            ]}
          >
            <Text
              style={[
                styles.toggleBtnText,
                !isAirplaneMode && styles.toggleBtnTextActive,
              ]}
            >
              {isAirplaneMode ? 'Turn On Wi-Fi' : 'Enable Airplane Mode'}
            </Text>
          </Pressable>
        </View>

        {/* Sync Status Banner */}
        <View
          style={[
            styles.syncBanner,
            syncState === 'offline' && styles.syncBannerOffline,
            syncState === 'syncing' && styles.syncBannerSyncing,
            syncState === 'synced' && styles.syncBannerSynced,
          ]}
        >
          {syncState === 'offline' && (
            <>
              <AppIcon name="database" size={16} color="#F59E0B" />
              <View style={styles.syncTextWrap}>
                <Text style={styles.syncTitle}>
                  Cached Locally in Encrypted SQLite
                </Text>
                <Text style={styles.syncSub}>
                  3 new expenses queued for background auto-merge
                </Text>
              </View>
            </>
          )}

          {syncState === 'syncing' && (
            <>
              <IconRefresh size={16} color={colors.brand.primary} />
              <View style={styles.syncTextWrap}>
                <Text
                  style={[styles.syncTitle, { color: colors.brand.primary }]}
                >
                  Merging with Crew in Cloud...
                </Text>
                <Text style={styles.syncSub}>
                  Resolving multi-device offline timestamps
                </Text>
              </View>
            </>
          )}

          {syncState === 'synced' && (
            <>
              <IconCheck size={16} color={colors.brand.emerald} />
              <View style={styles.syncTextWrap}>
                <Text
                  style={[styles.syncTitle, { color: colors.brand.emerald }]}
                >
                  100% Up to Date & Synced
                </Text>
                <Text style={styles.syncSub}>
                  All 6 crew members see updated balances
                </Text>
              </View>
            </>
          )}
        </View>

        {/* Queued Transaction Card */}
        <View style={styles.queuedCard}>
          <View style={styles.queuedIcon}>
            <Text style={{ fontSize: 18 }}>🚊</Text>
          </View>
          <View style={styles.queuedInfo}>
            <Text style={styles.queuedTitle}>Interlaken Mountain Express</Text>
            <Text style={styles.queuedMeta}>
              Logged by Mike · CHF 140 (₹13,200)
            </Text>
          </View>
          <View style={styles.statusPill}>
            <Text style={styles.statusPillText}>
              {syncState === 'synced' ? '✓ Synced' : '⏳ Queued'}
            </Text>
          </View>
        </View>
      </View>

      {/* Security & Reliability Highlights */}
      <View style={styles.securityGrid}>
        <View style={styles.securityItem}>
          <View style={styles.secIcon}>
            <AppIcon name="lock" size={16} color={colors.brand.primary} />
          </View>
          <View style={styles.secContent}>
            <Text style={styles.secTitle}>AES-256 Encryption</Text>
            <Text style={styles.secDesc}>
              All shared expenses & financial data are protected end-to-end.
            </Text>
          </View>
        </View>

        <View style={styles.securityItem}>
          <View style={styles.secIcon}>
            <AppIcon
              name="shield-alert"
              size={16}
              color={colors.brand.emerald}
            />
          </View>
          <View style={styles.secContent}>
            <Text style={styles.secTitle}>No Accidental Deletions</Text>
            <Text style={styles.secDesc}>
              Full transaction audit history with 1-tap undo and restore.
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.light.surface,
    borderRadius: radius.xxl,
    padding: spacing.xxl,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.light.border,
    ...shadow.card,
  },
  header: {
    marginBottom: spacing.xl,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.brand.primarySoft,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
    marginBottom: spacing.sm,
  },
  badgeText: {
    ...typography.label,
    color: colors.brand.primary,
    marginLeft: 6,
  },
  title: {
    ...typography.heading3.desktop,
    color: colors.light.textPrimary,
    marginTop: spacing.xs,
  },
  subtitle: {
    ...typography.body.desktop,
    color: colors.light.textSecondary,
    marginTop: spacing.xs,
    lineHeight: 22,
  },

  // Simulator
  simulatorBox: {
    backgroundColor: colors.light.surfaceMuted,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.light.border,
  },
  simulatorTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotOffline: {
    backgroundColor: '#F59E0B',
  },
  dotOnline: {
    backgroundColor: colors.brand.emerald,
  },
  statusLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.light.textPrimary,
  },
  toggleBtn: {
    backgroundColor: colors.light.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.light.borderStrong,
  },
  toggleBtnActive: {
    backgroundColor: colors.brand.primary,
    borderColor: colors.brand.primary,
  },
  btnPressed: {
    opacity: 0.8,
  },
  toggleBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.light.textPrimary,
  },
  toggleBtnTextActive: {
    color: '#FFFFFF',
  },

  syncBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.md,
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  syncBannerOffline: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.25)',
  },
  syncBannerSyncing: {
    backgroundColor: colors.brand.primarySoft,
    borderWidth: 1,
    borderColor: 'rgba(37,99,235,0.25)',
  },
  syncBannerSynced: {
    backgroundColor: colors.brand.emeraldSoft,
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.25)',
  },
  syncTextWrap: {
    flex: 1,
  },
  syncTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#92400E',
  },
  syncSub: {
    fontSize: 11,
    color: colors.light.textSecondary,
    marginTop: 1,
  },

  queuedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.light.surface,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.light.border,
    gap: spacing.md,
  },
  queuedIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.light.surfaceMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  queuedInfo: {
    flex: 1,
  },
  queuedTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.light.textPrimary,
  },
  queuedMeta: {
    fontSize: 11,
    color: colors.light.textMuted,
    marginTop: 2,
  },
  statusPill: {
    backgroundColor: colors.light.surfaceMuted,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.light.textSecondary,
  },

  // Security
  securityGrid: {
    marginTop: spacing.lg,
    gap: spacing.md,
  },
  securityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  secIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.brand.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  secContent: {
    flex: 1,
  },
  secTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.light.textPrimary,
  },
  secDesc: {
    fontSize: 12,
    color: colors.light.textSecondary,
    marginTop: 2,
    lineHeight: 18,
  },
});

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { colors, spacing, radius, shadow, typography } from '../theme/tokens';
import {
  IconCheck,
  IconArrowRight,
  IconWallet,
  IconQrCode,
  IconBell,
} from '../icons/LandingIcons';
import AppIcon from '../../common/AppIcon';

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface Transfer {
  id: string;
  from: string;
  to: string;
  amount: string;
  settled: boolean;
  upiId: string;
}

export function SettlementAndTimeline() {
  const [transfers, setTransfers] = useState<Transfer[]>([
    {
      id: '1',
      from: 'Nehal',
      to: 'Arjun',
      amount: '₹2,140',
      settled: false,
      upiId: 'arjun@okaxis',
    },
    {
      id: '2',
      from: 'Sarah',
      to: 'Arjun',
      amount: '₹1,280',
      settled: true,
      upiId: 'arjun@okaxis',
    },
    {
      id: '3',
      from: 'Rahul',
      to: 'Arjun',
      amount: '₹1,400',
      settled: false,
      upiId: 'arjun@okaxis',
    },
  ]);

  const [activeUpiModal, setActiveUpiModal] = useState<Transfer | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const toggleSettle = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setTransfers(prev =>
      prev.map(t => (t.id === id ? { ...t, settled: !t.settled } : t)),
    );
  };

  const showNudgeToast = (person: string, amount: string) => {
    setToastMessage(`✨ Friendly nudge sent to ${person} for ${amount}!`);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  return (
    <View style={styles.container}>
      {/* Toast popup */}
      {toastMessage && (
        <View style={styles.floatingToast}>
          <IconBell size={14} color="#FFFFFF" />
          <Text style={styles.floatingToastText}>{toastMessage}</Text>
        </View>
      )}

      {/* Header */}
      <View style={styles.cardHeader}>
        <View style={styles.badge}>
          <View style={styles.iconWrap}>
            <IconWallet size={14} color={colors.brand.primary} />
          </View>
          <Text style={styles.badgeText}>ALGORITHMIC GRAPH SIMPLIFICATION</Text>
        </View>
        <Text style={styles.title}>Simplified Net Settlements</Text>
        <Text style={styles.desc}>
          We collapse multi-party cycles into direct net repayments. Settle with
          2 transfers instead of 10 awkward transactions.
        </Text>
      </View>

      {/* Graph reduction visual summary */}
      <View style={styles.reductionBanner}>
        <View style={styles.reductionCol}>
          <Text style={styles.reductionCount}>10 Debts</Text>
          <Text style={styles.reductionLabel}>Without TripSplit</Text>
        </View>
        <View style={styles.arrowBetween}>
          <IconArrowRight size={18} color={colors.brand.primary} />
        </View>
        <View style={[styles.reductionCol, styles.reductionColActive]}>
          <Text style={styles.reductionCountHighlight}>2 Transfers</Text>
          <Text style={styles.reductionLabelHighlight}>Graph-Optimized</Text>
        </View>
      </View>

      {/* Transfers List */}
      <View style={styles.transfersList}>
        {transfers.map(item => {
          const isSettled = item.settled;
          return (
            <View
              key={item.id}
              style={[styles.transferCard, isSettled && styles.settledCard]}
            >
              <View style={styles.transferTopRow}>
                <View style={styles.transferInfo}>
                  <View style={styles.avatarMini}>
                    <Text style={styles.avatarMiniText}>{item.from[0]}</Text>
                  </View>
                  <Text
                    style={[
                      styles.personText,
                      isSettled && styles.settledTextMuted,
                    ]}
                  >
                    {item.from}
                  </Text>
                  <IconArrowRight
                    size={12}
                    color={
                      isSettled
                        ? colors.light.textFaint
                        : colors.light.textMuted
                    }
                  />
                  <View
                    style={[styles.avatarMini, { backgroundColor: '#10B981' }]}
                  >
                    <Text style={styles.avatarMiniText}>{item.to[0]}</Text>
                  </View>
                  <Text
                    style={[
                      styles.personText,
                      isSettled && styles.settledTextMuted,
                    ]}
                  >
                    {item.to}
                  </Text>
                </View>

                <Text
                  style={[
                    styles.amountText,
                    isSettled && styles.settledAmountText,
                  ]}
                >
                  {item.amount}
                </Text>
              </View>

              {/* Action Buttons Row */}
              <View style={styles.actionsRow}>
                {!isSettled && (
                  <>
                    <Pressable
                      onPress={() => setActiveUpiModal(item)}
                      style={styles.upiActionBtn}
                    >
                      <IconQrCode size={14} color={colors.brand.primary} />
                      <Text style={styles.upiActionText}>1-Tap UPI / QR</Text>
                    </Pressable>

                    <Pressable
                      onPress={() => showNudgeToast(item.from, item.amount)}
                      style={styles.nudgeActionBtn}
                    >
                      <IconBell size={12} color={colors.light.textSecondary} />
                      <Text style={styles.nudgeActionText}>Nudge</Text>
                    </Pressable>
                  </>
                )}

                <Pressable
                  onPress={() => toggleSettle(item.id)}
                  style={({ pressed }) => [
                    styles.settleBtn,
                    isSettled && styles.settledBtn,
                    pressed && !isSettled && styles.settleBtnPressed,
                  ]}
                >
                  {isSettled ? (
                    <>
                      <IconCheck size={14} color={colors.brand.emerald} />
                      <Text style={styles.settledBtnText}>Paid & Verified</Text>
                    </>
                  ) : (
                    <Text style={styles.settleBtnText}>Mark Paid</Text>
                  )}
                </Pressable>
              </View>
            </View>
          );
        })}
      </View>

      {/* UPI QR Payment Modal Simulator */}
      {activeUpiModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.upiModalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <IconQrCode size={18} color={colors.brand.primary} />
                <Text style={styles.modalTitle}>Instant UPI Settlement</Text>
              </View>
              <Pressable
                onPress={() => setActiveUpiModal(null)}
                style={styles.closeBtn}
              >
                <AppIcon name="x" size={16} color={colors.light.textMuted} />
              </Pressable>
            </View>

            <View style={styles.qrCodeBox}>
              {/* Simulated QR Pattern */}
              <View style={styles.qrCanvas}>
                <AppIcon name="qr-code" size={100} color="#0F172A" />
              </View>
              <Text style={styles.upiPayeeText}>
                Pay to{' '}
                <Text style={{ fontWeight: '800' }}>{activeUpiModal.to}</Text>
              </Text>
              <Text style={styles.upiIdText}>
                UPI ID: {activeUpiModal.upiId}
              </Text>
              <Text style={styles.qrAmountText}>{activeUpiModal.amount}</Text>
            </View>

            <View style={styles.appOptionsRow}>
              <Text style={styles.appOption}>Google Pay</Text>
              <Text style={styles.appOption}>PhonePe</Text>
              <Text style={styles.appOption}>Paytm</Text>
              <Text style={styles.appOption}>Cash</Text>
            </View>

            <Pressable
              onPress={() => {
                toggleSettle(activeUpiModal.id);
                setActiveUpiModal(null);
              }}
              style={styles.modalConfirmBtn}
            >
              <Text style={styles.modalConfirmText}>Confirm Settlement</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.light.surface,
    borderRadius: radius.xxl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.light.border,
    ...shadow.cardHover,
    marginBottom: spacing.sectionSm,
    position: 'relative',
  },
  cardHeader: {
    marginBottom: spacing.md,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.brand.primarySoft,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
    marginBottom: spacing.xs,
  },
  iconWrap: {
    marginRight: 6,
  },
  badgeText: {
    ...typography.label,
    color: colors.brand.primary,
    fontSize: 9,
  },
  title: {
    ...typography.heading3.mobile,
    color: colors.light.textPrimary,
    marginTop: 2,
  },
  desc: {
    ...typography.bodySmall,
    color: colors.light.textSecondary,
    marginTop: 4,
  },

  // Reduction Visual
  reductionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.light.surfaceMuted,
    padding: spacing.md,
    borderRadius: radius.lg,
    marginVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.light.border,
  },
  reductionCol: {
    flex: 1,
    alignItems: 'center',
  },
  reductionColActive: {
    backgroundColor: colors.brand.primarySoft,
    paddingVertical: 6,
    borderRadius: radius.md,
  },
  reductionCount: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.light.textMuted,
    textDecorationLine: 'line-through',
  },
  reductionLabel: {
    fontSize: 10,
    color: colors.light.textMuted,
    marginTop: 2,
  },
  arrowBetween: {
    paddingHorizontal: spacing.sm,
  },
  reductionCountHighlight: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.brand.primary,
  },
  reductionLabelHighlight: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.brand.primary,
    marginTop: 2,
  },

  // Transfers
  transfersList: {
    gap: spacing.sm,
  },
  transferCard: {
    backgroundColor: colors.light.surfaceMuted,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.light.border,
  },
  settledCard: {
    backgroundColor: colors.light.surface,
    opacity: 0.65,
  },
  transferTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  transferInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  avatarMini: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.brand.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarMiniText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  personText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.light.textPrimary,
  },
  settledTextMuted: {
    color: colors.light.textMuted,
    textDecorationLine: 'line-through',
  },
  amountText: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.light.textPrimary,
  },
  settledAmountText: {
    color: colors.brand.emerald,
  },

  // Actions Row
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  upiActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.brand.primarySoft,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(37,99,235,0.2)',
  },
  upiActionText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.brand.primary,
  },
  nudgeActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.light.surface,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.light.border,
  },
  nudgeActionText: {
    fontSize: 11,
    color: colors.light.textSecondary,
    fontWeight: '600',
  },
  settleBtn: {
    backgroundColor: colors.brand.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settledBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.brand.emeraldSoft,
  },
  settleBtnPressed: {
    opacity: 0.85,
  },
  settleBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  settledBtnText: {
    color: colors.brand.emerald,
    fontSize: 11,
    fontWeight: '700',
  },

  // Floating Toast
  floatingToast: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    right: spacing.md,
    backgroundColor: colors.brand.midnight,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    zIndex: 99,
    ...shadow.xl,
  },
  floatingToastText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },

  // UPI Modal
  modalOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(15,23,42,0.6)',
    borderRadius: radius.xxl,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
    zIndex: 100,
  },
  upiModalCard: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: colors.light.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    alignItems: 'center',
    ...shadow.xl,
  },
  modalHeader: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  modalTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.light.textPrimary,
  },
  closeBtn: {
    padding: 4,
  },
  qrCodeBox: {
    alignItems: 'center',
    marginVertical: spacing.sm,
  },
  qrCanvas: {
    padding: spacing.md,
    backgroundColor: '#FFFFFF',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.light.borderStrong,
    marginBottom: spacing.sm,
  },
  upiPayeeText: {
    fontSize: 13,
    color: colors.light.textPrimary,
  },
  upiIdText: {
    fontSize: 11,
    color: colors.light.textMuted,
    marginTop: 2,
  },
  qrAmountText: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.brand.primary,
    marginTop: 6,
  },
  appOptionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'center',
    marginVertical: spacing.md,
  },
  appOption: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.light.textSecondary,
    backgroundColor: colors.light.surfaceMuted,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  modalConfirmBtn: {
    width: '100%',
    backgroundColor: colors.brand.primary,
    paddingVertical: 10,
    borderRadius: radius.pill,
    alignItems: 'center',
  },
  modalConfirmText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});

// src/components/finance/BalanceBreakdownModal.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import AppIcon from '../common/AppIcon';
import { useTheme } from '../../providers/ThemeProvider';
import { GlassCard } from '../ui/GlassCard';
import { ledgerApi, BalanceBreakdown } from '../../services/api';

interface BalanceBreakdownModalProps {
  visible: boolean;
  onClose: () => void;
  currency?: string;
}

export function BalanceBreakdownModal({
  visible,
  onClose,
  currency = 'INR',
}: BalanceBreakdownModalProps) {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<BalanceBreakdown | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cs = currency === 'INR' ? '₹' : currency === 'USD' ? '$' : '€';

  const fetchBreakdown = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await ledgerApi.getBreakdown();
      if (res.success && res.data) {
        setData(res.data);
      } else {
        setError('Could not fetch breakdown');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load ledger breakdown');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible) {
      fetchBreakdown();
    }
  }, [visible]);

  if (!visible) return null;

  const netBalance = data?.netBalance ?? 0;
  const isPositive = netBalance > 0;
  const isZero = netBalance === 0;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View
          style={[
            styles.container,
            {
              backgroundColor: theme.isDark ? '#18181B' : '#FFFFFF',
              borderColor: theme.isDark
                ? 'rgba(255,255,255,0.12)'
                : 'rgba(0,0,0,0.08)',
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View
                style={[
                  styles.headerIconWrap,
                  { backgroundColor: `${theme.colors.primary}15` },
                ]}
              >
                <AppIcon
                  name="calculator"
                  size={18}
                  color={theme.colors.primary}
                />
              </View>
              <View>
                <Text
                  style={[styles.title, { color: theme.colors.textPrimary }]}
                >
                  Balance Calculation
                </Text>
                <Text
                  style={[
                    styles.subtitle,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  Deterministic Canonical Ledger Engine
                </Text>
              </View>
            </View>

            <Pressable
              onPress={onClose}
              style={[
                styles.closeButton,
                {
                  backgroundColor: theme.isDark
                    ? 'rgba(255,255,255,0.08)'
                    : 'rgba(0,0,0,0.05)',
                },
              ]}
              hitSlop={8}
            >
              <AppIcon name="x" size={18} color={theme.colors.textSecondary} />
            </Pressable>
          </View>

          {/* Content Body */}
          {loading ? (
            <View style={styles.centerLoading}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text
                style={[
                  styles.loadingText,
                  { color: theme.colors.textSecondary },
                ]}
              >
                Auditing ledger entries…
              </Text>
            </View>
          ) : error || !data ? (
            <View style={styles.centerLoading}>
              <AppIcon name="alert-circle" size={32} color="#EF4444" />
              <Text
                style={[styles.errorText, { color: theme.colors.textPrimary }]}
              >
                {error || 'Unable to load calculation data'}
              </Text>
              <Pressable
                onPress={fetchBreakdown}
                style={[
                  styles.retryBtn,
                  { backgroundColor: theme.colors.primary },
                ]}
              >
                <Text style={styles.retryBtnText}>Retry</Text>
              </Pressable>
            </View>
          ) : (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              {/* Executive Net Banner */}
              <View
                style={[
                  styles.netBanner,
                  {
                    backgroundColor: isZero
                      ? theme.isDark
                        ? 'rgba(255,255,255,0.05)'
                        : 'rgba(0,0,0,0.04)'
                      : isPositive
                        ? 'rgba(16,185,129,0.12)'
                        : 'rgba(239,68,68,0.12)',
                    borderColor: isZero
                      ? 'transparent'
                      : isPositive
                        ? 'rgba(16,185,129,0.25)'
                        : 'rgba(239,68,68,0.25)',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.netBannerLabel,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  YOUR NET POSITION
                </Text>
                <Text
                  style={[
                    styles.netBannerAmount,
                    {
                      color: isZero
                        ? theme.colors.textPrimary
                        : isPositive
                          ? '#10B981'
                          : '#EF4444',
                    },
                  ]}
                >
                  {isZero ? '' : isPositive ? '+' : '−'}
                  {cs}
                  {Math.abs(netBalance).toLocaleString('en-IN', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </Text>
                <Text
                  style={[
                    styles.netBannerExplanation,
                    { color: theme.colors.textPrimary },
                  ]}
                >
                  {isZero
                    ? 'All trip expenses and debts are completely settled up.'
                    : isPositive
                      ? `You have paid ${cs}${Math.abs(netBalance).toLocaleString('en-IN')} more for group expenses than your personal share. Your friends owe this amount to you.`
                      : `You have consumed ${cs}${Math.abs(netBalance).toLocaleString('en-IN')} more in shared expenses than you paid upfront. You owe this amount to your friends.`}
                </Text>
              </View>

              {/* Four Pillars Formula Breakdown */}
              <View style={styles.sectionBlock}>
                <Text
                  style={[
                    styles.sectionHeading,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  HOW THIS WAS CALCULATED
                </Text>

                <View
                  style={[
                    styles.cardList,
                    {
                      backgroundColor: theme.isDark
                        ? 'rgba(255,255,255,0.04)'
                        : 'rgba(0,0,0,0.02)',
                      borderColor: theme.isDark
                        ? 'rgba(255,255,255,0.08)'
                        : 'rgba(0,0,0,0.06)',
                    },
                  ]}
                >
                  {/* Pillar 1: Total Paid by You */}
                  <View style={styles.calcRow}>
                    <View style={styles.calcRowLeft}>
                      <View
                        style={[
                          styles.badgeDot,
                          { backgroundColor: '#10B981' },
                        ]}
                      />
                      <View>
                        <Text
                          style={[
                            styles.calcTitle,
                            { color: theme.colors.textPrimary },
                          ]}
                        >
                          Total Paid by You
                        </Text>
                        <Text
                          style={[
                            styles.calcSub,
                            { color: theme.colors.textSecondary },
                          ]}
                        >
                          Expenses you covered upfront
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.calcVal, { color: '#10B981' }]}>
                      +{cs}
                      {data.totalPaidByUser.toLocaleString('en-IN', {
                        minimumFractionDigits: 2,
                      })}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.divider,
                      {
                        backgroundColor: theme.isDark
                          ? 'rgba(255,255,255,0.06)'
                          : 'rgba(0,0,0,0.05)',
                      },
                    ]}
                  />

                  {/* Pillar 2: Your Share of Consumption */}
                  <View style={styles.calcRow}>
                    <View style={styles.calcRowLeft}>
                      <View
                        style={[
                          styles.badgeDot,
                          { backgroundColor: '#EF4444' },
                        ]}
                      />
                      <View>
                        <Text
                          style={[
                            styles.calcTitle,
                            { color: theme.colors.textPrimary },
                          ]}
                        >
                          Your Consumption Share
                        </Text>
                        <Text
                          style={[
                            styles.calcSub,
                            { color: theme.colors.textSecondary },
                          ]}
                        >
                          Your splits across all trip expenses
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.calcVal, { color: '#EF4444' }]}>
                      −{cs}
                      {data.userShareOfExpenses.toLocaleString('en-IN', {
                        minimumFractionDigits: 2,
                      })}
                    </Text>
                  </View>

                  {/* Pillar 3 & 4 (if settlements exist) */}
                  {(data.settledPaid > 0 || data.settledReceived > 0) && (
                    <>
                      <View
                        style={[
                          styles.divider,
                          {
                            backgroundColor: theme.isDark
                              ? 'rgba(255,255,255,0.06)'
                              : 'rgba(0,0,0,0.05)',
                          },
                        ]}
                      />
                      <View style={styles.calcRow}>
                        <View style={styles.calcRowLeft}>
                          <View
                            style={[
                              styles.badgeDot,
                              { backgroundColor: '#3B82F6' },
                            ]}
                          />
                          <View>
                            <Text
                              style={[
                                styles.calcTitle,
                                { color: theme.colors.textPrimary },
                              ]}
                            >
                              Settlements Confirmed (Sent)
                            </Text>
                            <Text
                              style={[
                                styles.calcSub,
                                { color: theme.colors.textSecondary },
                              ]}
                            >
                              Cash/UPI payments you already made
                            </Text>
                          </View>
                        </View>
                        <Text style={[styles.calcVal, { color: '#3B82F6' }]}>
                          +{cs}
                          {data.settledPaid.toLocaleString('en-IN', {
                            minimumFractionDigits: 2,
                          })}
                        </Text>
                      </View>

                      <View
                        style={[
                          styles.divider,
                          {
                            backgroundColor: theme.isDark
                              ? 'rgba(255,255,255,0.06)'
                              : 'rgba(0,0,0,0.05)',
                          },
                        ]}
                      />
                      <View style={styles.calcRow}>
                        <View style={styles.calcRowLeft}>
                          <View
                            style={[
                              styles.badgeDot,
                              { backgroundColor: '#F59E0B' },
                            ]}
                          />
                          <View>
                            <Text
                              style={[
                                styles.calcTitle,
                                { color: theme.colors.textPrimary },
                              ]}
                            >
                              Settlements Received
                            </Text>
                            <Text
                              style={[
                                styles.calcSub,
                                { color: theme.colors.textSecondary },
                              ]}
                            >
                              Payments friends already sent you
                            </Text>
                          </View>
                        </View>
                        <Text style={[styles.calcVal, { color: '#F59E0B' }]}>
                          −{cs}
                          {data.settledReceived.toLocaleString('en-IN', {
                            minimumFractionDigits: 2,
                          })}
                        </Text>
                      </View>
                    </>
                  )}
                </View>
              </View>

              {/* Mathematical Formula Footnote */}
              <View
                style={[
                  styles.formulaBox,
                  {
                    backgroundColor: theme.isDark
                      ? 'rgba(255,255,255,0.03)'
                      : 'rgba(0,0,0,0.02)',
                    borderColor: theme.isDark
                      ? 'rgba(255,255,255,0.06)'
                      : 'rgba(0,0,0,0.04)',
                  },
                ]}
              >
                <AppIcon
                  name="info"
                  size={14}
                  color={theme.colors.textTertiary}
                />
                <Text
                  style={[
                    styles.formulaText,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  Formula: {data.formula}
                </Text>
              </View>

              {/* Counterparty List */}
              {data.counterparties && data.counterparties.length > 0 && (
                <View style={styles.sectionBlock}>
                  <Text
                    style={[
                      styles.sectionHeading,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    COUNTERPARTY BREAKDOWN ({data.counterparties.length})
                  </Text>

                  <View style={styles.counterpartyList}>
                    {data.counterparties.map((cp, idx) => {
                      const cpOwesYou = cp.direction === 'owes_you';
                      const isSettled =
                        cp.direction === 'settled' || cp.netAmount === 0;
                      return (
                        <View
                          key={cp.counterpartyId || idx}
                          style={[
                            styles.cpCard,
                            {
                              backgroundColor: theme.isDark
                                ? 'rgba(255,255,255,0.04)'
                                : 'rgba(0,0,0,0.02)',
                              borderColor: theme.isDark
                                ? 'rgba(255,255,255,0.08)'
                                : 'rgba(0,0,0,0.05)',
                            },
                          ]}
                        >
                          <View style={styles.cpTop}>
                            <View style={styles.cpUser}>
                              <View
                                style={[
                                  styles.avatar,
                                  { backgroundColor: theme.colors.primary },
                                ]}
                              >
                                <Text style={styles.avatarText}>
                                  {(cp.counterpartyName || 'U')
                                    .charAt(0)
                                    .toUpperCase()}
                                </Text>
                              </View>
                              <View>
                                <Text
                                  style={[
                                    styles.cpName,
                                    { color: theme.colors.textPrimary },
                                  ]}
                                >
                                  {cp.counterpartyName}
                                </Text>
                                <Text
                                  style={[
                                    styles.cpStatus,
                                    { color: theme.colors.textTertiary },
                                  ]}
                                >
                                  {isSettled
                                    ? 'Settled'
                                    : cpOwesYou
                                      ? 'Owes you'
                                      : 'You owe'}
                                </Text>
                              </View>
                            </View>

                            <Text
                              style={[
                                styles.cpAmount,
                                {
                                  color: isSettled
                                    ? theme.colors.textSecondary
                                    : cpOwesYou
                                      ? '#10B981'
                                      : '#EF4444',
                                },
                              ]}
                            >
                              {isSettled ? '' : cpOwesYou ? '+' : '−'}
                              {cs}
                              {Math.abs(cp.netAmount).toLocaleString('en-IN', {
                                minimumFractionDigits: 2,
                              })}
                            </Text>
                          </View>

                          {/* Bilateral Netting Breakdown Details */}
                          <View
                            style={[
                              styles.cpDetailsRow,
                              {
                                backgroundColor: theme.isDark
                                  ? 'rgba(255,255,255,0.03)'
                                  : 'rgba(0,0,0,0.02)',
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.cpDetailText,
                                { color: theme.colors.textSecondary },
                              ]}
                            >
                              You paid for them: {cs}
                              {cp.grossTheyOwe.toFixed(2)}
                            </Text>
                            <Text
                              style={[
                                styles.cpDetailText,
                                { color: theme.colors.textSecondary },
                              ]}
                            >
                              They paid for you: {cs}
                              {cp.grossYouOwe.toFixed(2)}
                            </Text>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                </View>
              )}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    padding: 16,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  container: {
    width: '100%',
    maxWidth: 480,
    maxHeight: '90%',
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.3,
        shadowRadius: 24,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(150, 150, 150, 0.2)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 20,
    gap: 20,
  },
  centerLoading: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    marginTop: 4,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600',
  },
  netBanner: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
  netBannerLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  netBannerAmount: {
    fontSize: 32,
    fontWeight: '800',
    marginVertical: 4,
  },
  netBannerExplanation: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 2,
  },
  sectionBlock: {
    gap: 10,
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  cardList: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  calcRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  calcRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  badgeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  calcTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  calcSub: {
    fontSize: 11,
    marginTop: 2,
  },
  calcVal: {
    fontSize: 15,
    fontWeight: '700',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
  },
  formulaBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  formulaText: {
    fontSize: 11,
    flex: 1,
    fontStyle: 'italic',
  },
  counterpartyList: {
    gap: 10,
  },
  cpCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    gap: 10,
  },
  cpTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cpUser: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
  cpName: {
    fontSize: 14,
    fontWeight: '600',
  },
  cpStatus: {
    fontSize: 11,
    marginTop: 1,
  },
  cpAmount: {
    fontSize: 15,
    fontWeight: '700',
  },
  cpDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  cpDetailText: {
    fontSize: 11,
  },
});

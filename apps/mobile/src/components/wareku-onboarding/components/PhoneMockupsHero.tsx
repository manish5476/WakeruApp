import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius, shadow } from '../theme/tokens';
import AppIcon from '../../common/AppIcon';

export function PhoneMockupsHero() {
  return (
    <View style={styles.container}>
      {/* Soft Ambient Background Glows */}
      <View style={styles.ambientGlowOne} />
      <View style={styles.ambientGlowTwo} />

      {/* Floating Travel & Currency Accent Badges */}
      <View style={[styles.floatingBadge, styles.badgePlane]}>
        <Text style={styles.badgeEmoji}>✈️</Text>
      </View>
      <View style={[styles.floatingBadge, styles.badgeEuro]}>
        <Text style={styles.badgeSymbol}>€</Text>
      </View>
      <View style={[styles.floatingBadge, styles.badgeYen]}>
        <Text style={styles.badgeSymbol}>¥</Text>
      </View>
      <View style={[styles.floatingBadge, styles.badgeZap]}>
        <Text style={styles.badgeEmoji}>⚡</Text>
      </View>

      {/* PHONE 2 (Back / Offset Settlements Mockup) */}
      <View style={styles.phoneTwoWrapper}>
        <View style={styles.phoneFrame}>
          {/* Dynamic Island */}
          <View style={styles.dynamicIsland} />

          {/* Screen Content */}
          <View style={styles.screenContainer}>
            {/* Status Bar */}
            <View style={styles.phoneStatusBar}>
              <Text style={styles.statusTime}>9:41</Text>
              <View style={styles.statusIcons}>
                <AppIcon name="wifi" size={11} color="#0F172A" />
                <AppIcon name="battery" size={11} color="#0F172A" />
              </View>
            </View>

            {/* Screen Header */}
            <View style={styles.screenHeader}>
              <Text style={styles.screenTitle}>Settlements</Text>
              <View style={styles.headerAvatar}>
                <Text style={styles.headerAvatarText}>A</Text>
              </View>
            </View>

            {/* Net Balance Card */}
            <View style={styles.owedCard}>
              <Text style={styles.owedLabel}>You are owed</Text>
              <Text style={styles.owedAmount}>₹2,140</Text>
              <Text style={styles.owedSub}>2 settlements pending</Text>
              <View style={styles.settleUpiBtn}>
                <Text style={styles.settleUpiBtnText}>Settle with UPI</Text>
              </View>
            </View>

            {/* Settlement Transactions */}
            <View style={styles.settleList}>
              <View style={styles.settleItem}>
                <View style={styles.settleNames}>
                  <Text style={styles.settleFrom}>Nehal</Text>
                  <Text style={styles.settleArrow}>→</Text>
                  <Text style={styles.settleTo}>Arjun</Text>
                </View>
                <Text style={styles.settleAmt}>₹2,140</Text>
              </View>
              <View style={styles.pendingRow}>
                <View style={styles.pendingTag}>
                  <Text style={styles.pendingTagText}>Pending</Text>
                </View>
                <View style={styles.oneTapUpiPill}>
                  <Text style={styles.oneTapUpiText}>1-Tap UPI →</Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.settleItem}>
                <View style={styles.settleNames}>
                  <Text style={styles.settleFrom}>Sarah</Text>
                  <Text style={styles.settleArrow}>→</Text>
                  <Text style={styles.settleTo}>Rahul</Text>
                </View>
                <Text style={styles.settleAmtMuted}>₹1,350</Text>
              </View>
              <View style={styles.paidRow}>
                <Text style={styles.paidTag}>Paid</Text>
                <Text style={styles.viewLink}>View</Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.settleItem}>
                <View style={styles.settleNames}>
                  <Text style={styles.settleFrom}>Arjun</Text>
                  <Text style={styles.settleArrow}>→</Text>
                  <Text style={styles.settleTo}>Nehal</Text>
                </View>
                <Text style={styles.settleAmtMuted}>₹850</Text>
              </View>
              <View style={styles.paidRow}>
                <Text style={styles.paidTag}>Paid</Text>
                <Text style={styles.viewLink}>View</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* PHONE 1 (Front / Main Dashboard Mockup) */}
      <View style={styles.phoneOneWrapper}>
        <View style={[styles.phoneFrame, styles.phoneFrameFront]}>
          {/* Dynamic Island */}
          <View style={styles.dynamicIsland} />

          {/* Screen Content */}
          <View style={styles.screenContainer}>
            {/* Status Bar */}
            <View style={styles.phoneStatusBar}>
              <Text style={styles.statusTime}>10:24</Text>
              <View style={styles.statusIcons}>
                <AppIcon name="wifi" size={11} color="#0F172A" />
                <AppIcon name="battery" size={11} color="#0F172A" />
              </View>
            </View>

            {/* Trip Nav Header */}
            <View style={styles.tripNavHeader}>
              <View style={styles.tripNavLeft}>
                <Text style={styles.backArrow}>←</Text>
                <View>
                  <Text style={styles.tripTitle}>Euro Trip 2026</Text>
                  <Text style={styles.tripRoute}>
                    London • Paris • Amsterdam
                  </Text>
                </View>
              </View>
              <View style={styles.membersIconBadge}>
                <AppIcon name="users" size={12} color="#2563EB" />
              </View>
            </View>

            {/* Trip Overview Card */}
            <View style={styles.overviewCard}>
              <Text style={styles.overviewLabel}>Trip Overview</Text>
              <View style={styles.overviewAmountsRow}>
                <View>
                  <Text style={styles.amountSmallLabel}>Total Spent</Text>
                  <Text style={styles.overviewTotalAmount}>₹68,420</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.amountSmallLabel}>You Spent</Text>
                  <Text style={styles.overviewYouAmount}>₹12,840</Text>
                </View>
              </View>

              <View style={styles.progressRow}>
                <Text style={styles.progressSub}>3 of 6 days</Text>
                <Text style={styles.progressSub}>60%</Text>
              </View>
              <View style={styles.progressTrack}>
                <LinearGradient
                  colors={['#2563EB', '#06B6D4']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.progressFill}
                />
              </View>
            </View>

            {/* 4 Action Pills */}
            <View style={styles.actionsPillsRow}>
              <View style={styles.actionChip}>
                <View
                  style={[
                    styles.actionIconCircle,
                    { backgroundColor: '#EFF6FF' },
                  ]}
                >
                  <Text style={styles.actionIconText}>+</Text>
                </View>
                <Text style={styles.actionChipLabel}>Add Expense</Text>
              </View>
              <View style={styles.actionChip}>
                <View
                  style={[
                    styles.actionIconCircle,
                    { backgroundColor: '#ECFEFF' },
                  ]}
                >
                  <Text style={styles.actionIconText}>⚖️</Text>
                </View>
                <Text style={styles.actionChipLabel}>Split Bill</Text>
              </View>
              <View style={styles.actionChip}>
                <View
                  style={[
                    styles.actionIconCircle,
                    { backgroundColor: '#F5F3FF' },
                  ]}
                >
                  <Text style={styles.actionIconText}>📍</Text>
                </View>
                <Text style={styles.actionChipLabel}>Itinerary</Text>
              </View>
              <View style={styles.actionChip}>
                <View
                  style={[
                    styles.actionIconCircle,
                    { backgroundColor: '#ECFDF5' },
                  ]}
                >
                  <Text style={styles.actionIconText}>👥</Text>
                </View>
                <Text style={styles.actionChipLabel}>Members</Text>
              </View>
            </View>

            {/* Recent Expenses List */}
            <View style={styles.recentHeader}>
              <Text style={styles.recentTitle}>Recent Expenses</Text>
              <Text style={styles.viewAllText}>View All</Text>
            </View>

            <View style={styles.expensesList}>
              <View style={styles.expenseRow}>
                <View
                  style={[
                    styles.expenseIconWrap,
                    { backgroundColor: '#EFF6FF' },
                  ]}
                >
                  <Text style={{ fontSize: 13 }}>🍔</Text>
                </View>
                <View style={styles.expenseInfo}>
                  <Text style={styles.expenseTitle}>Borough Market Food</Text>
                  <Text style={styles.expenseBy}>by Sarah</Text>
                </View>
                <View style={styles.expenseCostCol}>
                  <Text style={styles.expenseCost}>₹2,850</Text>
                  <Text style={styles.expenseTime}>Today</Text>
                </View>
              </View>

              <View style={styles.expenseRow}>
                <View
                  style={[
                    styles.expenseIconWrap,
                    { backgroundColor: '#ECFEFF' },
                  ]}
                >
                  <Text style={{ fontSize: 13 }}>🚆</Text>
                </View>
                <View style={styles.expenseInfo}>
                  <Text style={styles.expenseTitle}>Eurostar Tickets</Text>
                  <Text style={styles.expenseBy}>by Rahul</Text>
                </View>
                <View style={styles.expenseCostCol}>
                  <Text style={styles.expenseCost}>₹18,420</Text>
                  <Text style={styles.expenseTime}>Yesterday</Text>
                </View>
              </View>

              <View style={styles.expenseRow}>
                <View
                  style={[
                    styles.expenseIconWrap,
                    { backgroundColor: '#F5F3FF' },
                  ]}
                >
                  <Text style={{ fontSize: 13 }}>🏨</Text>
                </View>
                <View style={styles.expenseInfo}>
                  <Text style={styles.expenseTitle}>Hotel Stay</Text>
                  <Text style={styles.expenseBy}>by Arjun</Text>
                </View>
                <View style={styles.expenseCostCol}>
                  <Text style={styles.expenseCost}>₹34,000</Text>
                  <Text style={styles.expenseTime}>2 days ago</Text>
                </View>
              </View>
            </View>

            {/* Bottom App Navigation Bar */}
            <View style={styles.phoneTabBar}>
              <View style={styles.tabItemActive}>
                <AppIcon name="home" size={14} color="#2563EB" />
                <Text style={styles.tabLabelActive}>Home</Text>
              </View>
              <View style={styles.tabItem}>
                <AppIcon name="credit-card" size={14} color="#94A3B8" />
                <Text style={styles.tabLabel}>Expenses</Text>
              </View>
              <View style={styles.tabItem}>
                <AppIcon name="arrow-left-right" size={14} color="#94A3B8" />
                <Text style={styles.tabLabel}>Settlements</Text>
              </View>
              <View style={styles.tabItem}>
                <AppIcon name="map-pin" size={14} color="#94A3B8" />
                <Text style={styles.tabLabel}>Trips</Text>
              </View>
              <View style={styles.tabItem}>
                <AppIcon name="menu" size={14} color="#94A3B8" />
                <Text style={styles.tabLabel}>More</Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    minHeight: 520,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },

  // Glows
  ambientGlowOne: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(37, 99, 235, 0.08)',
    top: 40,
    right: 20,
  },
  ambientGlowTwo: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(6, 182, 212, 0.07)',
    bottom: 20,
    left: 20,
  },

  // Floating badges
  floatingBadge: {
    position: 'absolute',
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.06)',
    ...shadow.card,
  },
  badgePlane: {
    top: 40,
    right: '48%',
  },
  badgeEuro: {
    top: 90,
    left: 10,
  },
  badgeYen: {
    top: 30,
    right: 30,
  },
  badgeZap: {
    bottom: 120,
    right: 15,
  },
  badgeEmoji: {
    fontSize: 16,
  },
  badgeSymbol: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2563EB',
  },

  // Phone Mockup Common Frame
  phoneFrame: {
    width: 270,
    height: 540,
    borderRadius: 38,
    backgroundColor: '#0F172A',
    padding: 8,
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.15)',
    ...shadow.xl,
  },
  phoneFrameFront: {
    zIndex: 10,
  },
  dynamicIsland: {
    position: 'absolute',
    top: 14,
    alignSelf: 'center',
    width: 80,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#000000',
    zIndex: 30,
  },
  screenContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 30,
    overflow: 'hidden',
    paddingTop: 8,
    justifyContent: 'space-between',
  },
  phoneStatusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 4,
  },
  statusTime: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F172A',
  },
  statusIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  // Position wrapper for dual phone depth composition
  phoneOneWrapper: {
    zIndex: 10,
    transform: [{ rotate: '-2deg' }],
  },
  phoneTwoWrapper: {
    position: 'absolute',
    right: 10,
    top: 20,
    zIndex: 5,
    transform: [{ rotate: '5deg' }, { scale: 0.94 }],
    opacity: 0.94,
  },

  // Phone 1 Details
  tripNavHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  tripNavLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  backArrow: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  tripTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  tripRoute: {
    fontSize: 9,
    color: '#64748B',
  },
  membersIconBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },

  overviewCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 12,
    marginTop: 4,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.05)',
    ...shadow.soft,
  },
  overviewLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
  },
  overviewAmountsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  amountSmallLabel: {
    fontSize: 9,
    color: '#94A3B8',
  },
  overviewTotalAmount: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
  },
  overviewYouAmount: {
    fontSize: 16,
    fontWeight: '900',
    color: '#2563EB',
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 4,
  },
  progressSub: {
    fontSize: 9,
    fontWeight: '600',
    color: '#94A3B8',
  },
  progressTrack: {
    width: '100%',
    height: 4,
    backgroundColor: '#F1F5F9',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    width: '60%',
    height: '100%',
  },

  actionsPillsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    marginTop: 8,
  },
  actionChip: {
    alignItems: 'center',
    gap: 3,
  },
  actionIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionIconText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2563EB',
  },
  actionChipLabel: {
    fontSize: 8,
    fontWeight: '600',
    color: '#475569',
  },

  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    marginTop: 10,
    marginBottom: 4,
  },
  recentTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F172A',
  },
  viewAllText: {
    fontSize: 9,
    color: '#2563EB',
    fontWeight: '600',
  },
  expensesList: {
    paddingHorizontal: 12,
    gap: 6,
  },
  expenseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.04)',
  },
  expenseIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  expenseInfo: {
    flex: 1,
  },
  expenseTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F172A',
  },
  expenseBy: {
    fontSize: 9,
    color: '#64748B',
  },
  expenseCostCol: {
    alignItems: 'flex-end',
  },
  expenseCost: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0F172A',
  },
  expenseTime: {
    fontSize: 8,
    color: '#94A3B8',
  },

  phoneTabBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingVertical: 6,
  },
  tabItemActive: {
    alignItems: 'center',
    gap: 2,
  },
  tabLabelActive: {
    fontSize: 8,
    fontWeight: '700',
    color: '#2563EB',
  },
  tabItem: {
    alignItems: 'center',
    gap: 2,
  },
  tabLabel: {
    fontSize: 8,
    fontWeight: '500',
    color: '#94A3B8',
  },

  // Phone 2 Details
  screenHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  screenTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerAvatarText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },

  owedCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 12,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.05)',
    ...shadow.soft,
  },
  owedLabel: {
    fontSize: 9,
    color: '#64748B',
    fontWeight: '600',
  },
  owedAmount: {
    fontSize: 22,
    fontWeight: '900',
    color: '#10B981',
    marginTop: 2,
  },
  owedSub: {
    fontSize: 9,
    color: '#94A3B8',
    marginTop: 1,
  },
  settleUpiBtn: {
    backgroundColor: '#2563EB',
    paddingVertical: 6,
    borderRadius: radius.pill,
    alignItems: 'center',
    marginTop: 8,
  },
  settleUpiBtnText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },

  settleList: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 12,
    marginTop: 10,
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.05)',
  },
  settleItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settleNames: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  settleFrom: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F172A',
  },
  settleArrow: {
    fontSize: 10,
    color: '#94A3B8',
  },
  settleTo: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F172A',
  },
  settleAmt: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
  },
  settleAmtMuted: {
    fontSize: 11,
    color: '#64748B',
  },
  pendingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  pendingTag: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  pendingTagText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#B45309',
  },
  oneTapUpiPill: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  oneTapUpiText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#2563EB',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 6,
  },
  paidRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  paidTag: {
    fontSize: 9,
    fontWeight: '700',
    color: '#10B981',
  },
  viewLink: {
    fontSize: 9,
    color: '#94A3B8',
  },
});

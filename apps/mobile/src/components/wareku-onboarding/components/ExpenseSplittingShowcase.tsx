import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { colors, radius, shadow } from '../theme/tokens';
import { useResponsive } from '../theme/useResponsive';
import AppIcon from '../../common/AppIcon';

const SPLIT_MODES = [
  { id: 'equal', name: '1/N Equal', desc: 'Even split among all members' },
  {
    id: 'shares',
    name: 'Shares (Ratios)',
    desc: 'Weighted splits for couples or families',
  },
  {
    id: 'percentage',
    name: 'Percentage %',
    desc: 'Custom percentage allocation',
  },
  { id: 'exact', name: 'Exact Items', desc: 'Item-by-item line claim' },
];

export function ExpenseSplittingShowcase() {
  const { isDesktop, isTablet, isWide } = useResponsive();
  const [selectedMode, setSelectedMode] = useState('equal');
  const [amount, setAmount] = useState(4800);

  const isRowLayout = isDesktop || isWide;

  const members = [
    {
      name: 'Rahul',
      paid: true,
      share:
        selectedMode === 'equal'
          ? '₹1,200'
          : selectedMode === 'shares'
            ? '₹1,600'
            : '₹1,440',
    },
    {
      name: 'Sarah',
      paid: false,
      share:
        selectedMode === 'equal'
          ? '₹1,200'
          : selectedMode === 'shares'
            ? '₹800'
            : '₹960',
    },
    {
      name: 'Arjun',
      paid: false,
      share:
        selectedMode === 'equal'
          ? '₹1,200'
          : selectedMode === 'shares'
            ? '₹1,600'
            : '₹1,440',
    },
    {
      name: 'Nehal',
      paid: false,
      share:
        selectedMode === 'equal'
          ? '₹1,200'
          : selectedMode === 'shares'
            ? '₹800'
            : '₹960',
    },
  ];

  return (
    <View style={styles.sectionOuter}>
      <View
        style={[styles.sectionInner, isRowLayout && styles.sectionInnerDesktop]}
      >
        {/* LEFT: Large Editorial Copy */}
        <View style={[styles.copyCol, isRowLayout && styles.copyColDesktop]}>
          <Text style={styles.eyebrow}>SMART EXPENSE SPLITTING</Text>
          <Text
            style={[
              styles.headline,
              isDesktop ? styles.headlineDesktop : styles.headlineMobile,
            ]}
          >
            Everyone pays their share.{'\n'}
            <Text style={styles.headlineAccent}>Nobody does the math.</Text>
          </Text>

          <Text style={styles.description}>
            Whether it's an equal split for the Airbnb, custom shares for
            couples, or itemized dinner tabs — TripSplit handles any split
            formula in seconds.
          </Text>

          {/* Interactive Split Mode Selector */}
          <View style={styles.modesList}>
            {SPLIT_MODES.map(mode => {
              const active = mode.id === selectedMode;
              return (
                <Pressable
                  key={mode.id}
                  onPress={() => setSelectedMode(mode.id)}
                  style={[styles.modeItem, active && styles.modeItemActive]}
                >
                  <View
                    style={[styles.radioCircle, active && styles.radioActive]}
                  >
                    {active && <View style={styles.radioInner} />}
                  </View>
                  <View style={styles.modeTextCol}>
                    <Text
                      style={[styles.modeName, active && styles.modeNameActive]}
                    >
                      {mode.name}
                    </Text>
                    <Text style={styles.modeDesc}>{mode.desc}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* RIGHT: Live Interactive Product Showcase */}
        <View
          style={[styles.visualCol, isRowLayout && styles.visualColDesktop]}
        >
          <View style={styles.cardContainer}>
            {/* Header */}
            <View style={styles.cardTop}>
              <View style={styles.expenseTypeTag}>
                <Text style={{ fontSize: 13 }}>🍽️</Text>
                <Text style={styles.expenseTagText}>Dinner at Dishoom</Text>
              </View>
              <Text style={styles.currencyPill}>INR (₹)</Text>
            </View>

            {/* Amount Visual */}
            <View style={styles.amountDisplay}>
              <Text style={styles.amountLabel}>Total Bill Amount</Text>
              <View style={styles.amountAdjustRow}>
                <Pressable
                  onPress={() => setAmount(p => Math.max(1000, p - 400))}
                  style={styles.adjustBtn}
                >
                  <Text style={styles.adjustBtnText}>−</Text>
                </Pressable>
                <Text style={styles.amountBig}>
                  ₹{amount.toLocaleString('en-IN')}
                </Text>
                <Pressable
                  onPress={() => setAmount(p => p + 400)}
                  style={styles.adjustBtn}
                >
                  <Text style={styles.adjustBtnText}>+</Text>
                </Pressable>
              </View>
            </View>

            {/* Paid Upfront Row */}
            <View style={styles.payerRow}>
              <Text style={styles.payerLabel}>Paid upfront by:</Text>
              <View style={styles.payerBadge}>
                <Text style={styles.payerBadgeText}>👑 Rahul</Text>
              </View>
            </View>

            {/* Split Members Result */}
            <View style={styles.membersList}>
              {members.map((m, idx) => (
                <View key={idx} style={styles.memberRow}>
                  <View style={styles.memberNameWrap}>
                    <View
                      style={[
                        styles.avatarDot,
                        { backgroundColor: idx === 0 ? '#2563EB' : '#64748B' },
                      ]}
                    >
                      <Text style={styles.avatarLetter}>{m.name[0]}</Text>
                    </View>
                    <Text style={styles.memberName}>{m.name}</Text>
                  </View>
                  <Text style={styles.memberShare}>{m.share}</Text>
                </View>
              ))}
            </View>

            <View style={styles.instantBadge}>
              <AppIcon name="sparkles" size={13} color="#2563EB" />
              <Text style={styles.instantText}>
                Balances updated automatically across all devices
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionOuter: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    paddingVertical: 84,
  },
  sectionInner: {
    maxWidth: 1360,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 24,
    flexDirection: 'column',
    gap: 48,
  },
  sectionInnerDesktop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 64,
  },

  copyCol: {
    width: '100%',
  },
  copyColDesktop: {
    flex: 1.15,
    maxWidth: 620,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '800',
    color: '#2563EB',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  headline: {
    color: '#0F172A',
    fontWeight: '900',
    letterSpacing: -1,
  },
  headlineDesktop: {
    fontSize: 44,
    lineHeight: 52,
  },
  headlineMobile: {
    fontSize: 30,
    lineHeight: 36,
  },
  headlineAccent: {
    color: '#2563EB',
  },
  description: {
    fontSize: 16,
    lineHeight: 26,
    color: '#475569',
    marginTop: 16,
    marginBottom: 28,
  },

  modesList: {
    gap: 12,
  },
  modeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modeItemActive: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioActive: {
    borderColor: '#2563EB',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#2563EB',
  },
  modeTextCol: {
    flex: 1,
  },
  modeName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  modeNameActive: {
    color: '#2563EB',
  },
  modeDesc: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },

  // Visual Product Card
  visualCol: {
    width: '100%',
    alignItems: 'center',
  },
  visualColDesktop: {
    flex: 1,
    maxWidth: 500,
  },
  cardContainer: {
    width: '100%',
    maxWidth: 460,
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 26,
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.08)',
    ...shadow.xl,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  expenseTypeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  expenseTagText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  currencyPill: {
    fontSize: 11,
    fontWeight: '800',
    color: '#2563EB',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },

  amountDisplay: {
    backgroundColor: '#F8FAFC',
    padding: 16,
    borderRadius: 18,
    alignItems: 'center',
    marginBottom: 16,
  },
  amountLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  amountAdjustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 6,
  },
  adjustBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  adjustBtnText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  amountBig: {
    fontSize: 28,
    fontWeight: '900',
    color: '#0F172A',
  },

  payerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: 14,
  },
  payerLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  payerBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  payerBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#92400E',
  },

  membersList: {
    gap: 10,
    marginBottom: 16,
  },
  memberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  memberNameWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatarDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLetter: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  memberName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  memberShare: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },

  instantBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EFF6FF',
    padding: 10,
    borderRadius: 12,
    justifyContent: 'center',
  },
  instantText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#2563EB',
  },
});

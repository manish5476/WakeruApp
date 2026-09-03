import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { colors, radius, shadow } from '../theme/tokens';
import { useResponsive } from '../theme/useResponsive';
import AppIcon from '../../common/AppIcon';

export function SettlementShowcase() {
  const { isDesktop, isTablet, isWide } = useResponsive();
  const [settled, setSettled] = useState(false);
  const isRowLayout = isDesktop || isTablet || isWide;

  return (
    <View style={styles.sectionOuter}>
      <View style={styles.sectionInner}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.eyebrow}>GRAPH DEBT REDUCTION</Text>
          <Text
            style={[
              styles.headline,
              isDesktop ? styles.headlineDesktop : styles.headlineMobile,
            ]}
          >
            Turn ten debts into two.{'\n'}
            <Text style={styles.headlineAccent}>Settle in one tap.</Text>
          </Text>
          <Text style={styles.subheadline}>
            TripSplit runs graph simplification algorithms behind the scenes so
            nobody does redundant bank transfers. Pay directly via UPI with zero
            friction.
          </Text>
        </View>

        {/* Visual Graph Simplification Comparison */}
        <View
          style={[
            styles.graphCompareRow,
            isRowLayout && styles.graphCompareDesktop,
          ]}
        >
          {/* Left: 10 Messy Debts */}
          <View style={styles.graphBoxOld}>
            <View style={styles.boxTagOld}>
              <Text style={styles.boxTagTextOld}>WITHOUT SIMPLIFICATION</Text>
            </View>
            <Text style={styles.debtCountOld}>10 Tangled Transfers</Text>
            <View style={styles.messyDebtsList}>
              <Text style={styles.debtItemOld}>Nehal owes Rahul ₹850</Text>
              <Text style={styles.debtItemOld}>Sarah owes Arjun ₹1,200</Text>
              <Text style={styles.debtItemOld}>Arjun owes Rahul ₹450</Text>
              <Text style={styles.debtItemOld}>Rahul owes Nehal ₹300</Text>
              <Text style={styles.debtItemOldMuted}>
                + 6 more redundant transfers...
              </Text>
            </View>
          </View>

          {/* Transformation Arrow */}
          <View style={styles.arrowBox}>
            <View style={styles.arrowCircle}>
              <AppIcon name="zap" size={22} color="#2563EB" />
            </View>
            <Text style={styles.arrowLabel}>ALGORITHM APPLIED</Text>
          </View>

          {/* Right: 2 Simple Net Transfers */}
          <View style={styles.graphBoxNew}>
            <View style={styles.boxTagNew}>
              <Text style={styles.boxTagTextNew}>TRIPSPLIT OPTIMIZED</Text>
            </View>
            <Text style={styles.debtCountNew}>Just 2 Net Transfers</Text>

            <View style={styles.cleanDebtsList}>
              <View style={styles.cleanDebtRow}>
                <View>
                  <Text style={styles.cleanNames}>Nehal → Rahul</Text>
                  <Text style={styles.cleanSub}>
                    Settles all outstanding stays
                  </Text>
                </View>
                <Text style={styles.cleanAmount}>₹2,140</Text>
              </View>

              <View style={styles.cleanDebtRow}>
                <View>
                  <Text style={styles.cleanNames}>Sarah → Arjun</Text>
                  <Text style={styles.cleanSub}>
                    Settles all dinner & travel tabs
                  </Text>
                </View>
                <Text style={styles.cleanAmount}>₹1,350</Text>
              </View>
            </View>

            <Pressable
              onPress={() => setSettled(true)}
              style={({ pressed }) => [
                styles.upiPayBtn,
                settled && styles.upiPayBtnSettled,
                pressed && { opacity: 0.85 },
              ]}
            >
              <AppIcon
                name={settled ? 'check' : 'zap'}
                size={16}
                color="#FFFFFF"
              />
              <Text style={styles.upiPayBtnText}>
                {settled
                  ? 'Settled via 1-Tap UPI ✓'
                  : 'Pay ₹2,140 via 1-Tap UPI'}
              </Text>
            </Pressable>
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
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    textAlign: 'center',
    maxWidth: 760,
    marginBottom: 48,
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
    textAlign: 'center',
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
  subheadline: {
    fontSize: 16,
    lineHeight: 26,
    color: '#475569',
    marginTop: 16,
    textAlign: 'center',
    maxWidth: 620,
  },

  // Comparison
  graphCompareRow: {
    width: '100%',
    flexDirection: 'column',
    gap: 24,
    alignItems: 'center',
  },
  graphCompareDesktop: {
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'center',
  },
  graphBoxOld: {
    flex: 1,
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 32,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    opacity: 0.9,
  },
  boxTagOld: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
    marginBottom: 14,
  },
  boxTagTextOld: {
    fontSize: 10,
    fontWeight: '800',
    color: '#DC2626',
  },
  debtCountOld: {
    fontSize: 22,
    fontWeight: '800',
    color: '#64748B',
    marginBottom: 16,
    textDecorationLine: 'line-through',
  },
  messyDebtsList: {
    gap: 10,
  },
  debtItemOld: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '500',
  },
  debtItemOldMuted: {
    fontSize: 12,
    color: '#CBD5E1',
    fontStyle: 'italic',
    marginTop: 4,
  },

  arrowBox: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 14,
  },
  arrowCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(37, 99, 235, 0.25)',
  },
  arrowLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#2563EB',
    letterSpacing: 0.8,
  },

  graphBoxNew: {
    flex: 1.2,
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 32,
    borderWidth: 1,
    borderColor: 'rgba(37, 99, 235, 0.25)',
    ...shadow.xl,
  },
  boxTagNew: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
    marginBottom: 14,
  },
  boxTagTextNew: {
    fontSize: 10,
    fontWeight: '800',
    color: '#166534',
  },
  debtCountNew: {
    fontSize: 24,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 18,
  },
  cleanDebtsList: {
    gap: 14,
    marginBottom: 24,
  },
  cleanDebtRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  cleanNames: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  cleanSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  cleanAmount: {
    fontSize: 18,
    fontWeight: '900',
    color: '#10B981',
  },

  upiPayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#2563EB',
    paddingVertical: 16,
    borderRadius: radius.pill,
    ...shadow.soft,
  },
  upiPayBtnSettled: {
    backgroundColor: '#10B981',
  },
  upiPayBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});

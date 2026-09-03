import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { colors, radius, shadow } from '../theme/tokens';
import { useResponsive } from '../theme/useResponsive';
import AppIcon from '../../common/AppIcon';

const CURRENCIES = [
  {
    code: 'EUR',
    symbol: '€',
    rate: 91.2,
    name: 'Euro',
    exampleSpend: '€45.00',
    inr: '₹4,104',
  },
  {
    code: 'USD',
    symbol: '$',
    rate: 84.5,
    name: 'US Dollar',
    exampleSpend: '$60.00',
    inr: '₹5,070',
  },
  {
    code: 'GBP',
    symbol: '£',
    rate: 108.4,
    name: 'British Pound',
    exampleSpend: '£32.00',
    inr: '₹3,468',
  },
  {
    code: 'AED',
    symbol: 'AED',
    rate: 23.0,
    name: 'UAE Dirham',
    exampleSpend: '150 AED',
    inr: '₹3,450',
  },
  {
    code: 'THB',
    symbol: '฿',
    rate: 2.35,
    name: 'Thai Baht',
    exampleSpend: '1,200 ฿',
    inr: '₹2,820',
  },
];

export function MultiCurrencyShowcase() {
  const { isDesktop, isTablet, isWide } = useResponsive();
  const [activeCur, setActiveCur] = useState(CURRENCIES[0]);

  return (
    <View style={styles.sectionOuter}>
      <View style={styles.sectionInner}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.eyebrow}>REAL-TIME FX ENGINE</Text>
          <Text
            style={[
              styles.headline,
              isDesktop ? styles.headlineDesktop : styles.headlineMobile,
            ]}
          >
            Six currencies.{'\n'}
            <Text style={styles.headlineAccent}>One clear balance.</Text>
          </Text>
          <Text style={styles.subheadline}>
            Pay in Euros, split in Pounds, and settle back home in Rupees.
            TripSplit locks in accurate interbank rates automatically.
          </Text>
        </View>

        {/* Currency Stream Bar */}
        <View style={styles.streamBar}>
          {CURRENCIES.map(cur => {
            const active = cur.code === activeCur.code;
            return (
              <Pressable
                key={cur.code}
                onPress={() => setActiveCur(cur)}
                style={[styles.streamChip, active && styles.streamChipActive]}
              >
                <Text
                  style={[
                    styles.streamSymbol,
                    active && styles.streamSymbolActive,
                  ]}
                >
                  {cur.symbol}
                </Text>
                <Text
                  style={[styles.streamCode, active && styles.streamCodeActive]}
                >
                  {cur.code}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Conversion Visual Stage */}
        <View style={styles.conversionStage}>
          <View style={styles.convLeft}>
            <Text style={styles.convLabel}>
              Paid abroad in {activeCur.name}
            </Text>
            <Text style={styles.convAmount}>{activeCur.exampleSpend}</Text>
            <Text style={styles.convSub}>Local merchant price</Text>
          </View>

          <View style={styles.convArrowBox}>
            <View style={styles.arrowCircle}>
              <AppIcon name="arrow-right" size={18} color="#2563EB" />
            </View>
            <Text style={styles.rateTag}>
              1 {activeCur.code} = ₹{activeCur.rate}
            </Text>
          </View>

          <View style={styles.convRight}>
            <Text style={styles.convLabel}>Converted to Home Currency</Text>
            <Text style={styles.convAmountHome}>{activeCur.inr}</Text>
            <Text style={styles.convSub}>Added to group split</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionOuter: {
    width: '100%',
    backgroundColor: '#FFFFFF',
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
    marginBottom: 44,
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

  // Stream Bar
  streamBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    justifyContent: 'center',
    marginBottom: 36,
  },
  streamChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  streamChipActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#2563EB',
    ...shadow.soft,
  },
  streamSymbol: {
    fontSize: 15,
    fontWeight: '800',
    color: '#64748B',
  },
  streamSymbolActive: {
    color: '#2563EB',
  },
  streamCode: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  streamCodeActive: {
    color: '#2563EB',
  },

  // Conversion Stage
  conversionStage: {
    width: '100%',
    maxWidth: 960,
    backgroundColor: '#F8FAFC',
    borderRadius: 28,
    padding: 36,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 24,
    ...shadow.soft,
  },
  convLeft: {
    flex: 1,
    minWidth: 200,
  },
  convRight: {
    flex: 1,
    minWidth: 200,
    alignItems: 'flex-end',
  },
  convLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  convAmount: {
    fontSize: 30,
    fontWeight: '900',
    color: '#0F172A',
    marginTop: 4,
  },
  convAmountHome: {
    fontSize: 30,
    fontWeight: '900',
    color: '#2563EB',
    marginTop: 4,
  },
  convSub: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  convArrowBox: {
    alignItems: 'center',
    gap: 8,
  },
  arrowCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    ...shadow.soft,
  },
  rateTag: {
    fontSize: 11,
    fontWeight: '800',
    color: '#2563EB',
  },
});

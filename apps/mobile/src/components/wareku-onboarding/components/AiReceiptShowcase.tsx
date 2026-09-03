import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { colors, radius, shadow } from '../theme/tokens';
import { useResponsive } from '../theme/useResponsive';
import AppIcon from '../../common/AppIcon';

const RECEIPT_ITEMS = [
  { id: '1', name: 'Truffle Tagliatelle', price: '₹1,250', claimedBy: 'Rahul' },
  { id: '2', name: 'Burrata Caprese', price: '₹850', claimedBy: 'Sarah' },
  {
    id: '3',
    name: 'Woodfired Pizza',
    price: '₹950',
    claimedBy: 'Arjun & Nehal',
  },
  { id: '4', name: 'Artisan Gelato', price: '₹450', claimedBy: 'Everyone' },
];

export function AiReceiptShowcase() {
  const { isDesktop, isTablet, isWide } = useResponsive();
  const isRowLayout = isDesktop || isWide;

  return (
    <View style={styles.sectionOuter}>
      <View
        style={[styles.sectionInner, isRowLayout && styles.sectionInnerDesktop]}
      >
        {/* Left: Editorial Copy */}
        <View style={[styles.copyCol, isRowLayout && styles.copyColDesktop]}>
          <Text style={styles.eyebrow}>AI RECEIPT ITEMIZER</Text>
          <Text
            style={[
              styles.headline,
              isDesktop ? styles.headlineDesktop : styles.headlineMobile,
            ]}
          >
            One photo.{'\n'}
            <Text style={styles.headlineAccent}>Zero typing.</Text>
          </Text>

          <Text style={styles.description}>
            Snap a receipt at dinner. TripSplit's AI vision instantly extracts
            dishes, prices, taxes, and service tips — allowing crew members to
            tap and claim their exact items with automatic proportional tax
            allocation.
          </Text>

          <View style={styles.stepsList}>
            <View style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <Text style={styles.stepText}>
                Snap photo of paper or digital receipt
              </Text>
            </View>
            <View style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <Text style={styles.stepText}>
                AI parses line items, discounts & local VAT
              </Text>
            </View>
            <View style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <Text style={styles.stepText}>
                Friends tap what they ate; totals split instantly
              </Text>
            </View>
          </View>
        </View>

        {/* Right: AI Receipt Scanner Interactive Card */}
        <View
          style={[styles.visualCol, isRowLayout && styles.visualColDesktop]}
        >
          <View style={styles.receiptCard}>
            {/* Top Merchant Bar */}
            <View style={styles.receiptTop}>
              <View>
                <Text style={styles.merchantTitle}>Trattoria Da Enzo</Text>
                <Text style={styles.merchantDate}>
                  Rome, Italy · Aug 18, 9:15 PM
                </Text>
              </View>
              <View style={styles.aiTag}>
                <AppIcon name="sparkles" size={12} color="#059669" />
                <Text style={styles.aiTagText}>AI Extracted</Text>
              </View>
            </View>

            {/* Receipt Items */}
            <View style={styles.itemsList}>
              {RECEIPT_ITEMS.map(item => (
                <View key={item.id} style={styles.itemRow}>
                  <View style={styles.itemLeft}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemClaimed}>
                      Claimed by: {item.claimedBy}
                    </Text>
                  </View>
                  <Text style={styles.itemPrice}>{item.price}</Text>
                </View>
              ))}
            </View>

            {/* Total Section */}
            <View style={styles.receiptFooter}>
              <View style={styles.footerRow}>
                <Text style={styles.footerLabel}>Subtotal + VAT (10%)</Text>
                <Text style={styles.footerTotal}>₹3,850</Text>
              </View>
              <View style={styles.splitCompletePill}>
                <AppIcon name="check" size={12} color="#10B981" />
                <Text style={styles.splitCompleteText}>
                  All 4 items claimed & balanced
                </Text>
              </View>
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
    backgroundColor: '#FFFFFF',
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
    color: '#059669',
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
    color: '#059669',
  },
  description: {
    fontSize: 16,
    lineHeight: 26,
    color: '#475569',
    marginTop: 16,
    marginBottom: 28,
  },

  stepsList: {
    gap: 14,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#059669',
  },
  stepText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },

  // Visual
  visualCol: {
    width: '100%',
    alignItems: 'center',
  },
  visualColDesktop: {
    flex: 1,
    maxWidth: 480,
  },
  receiptCard: {
    width: '100%',
    maxWidth: 460,
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 26,
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.08)',
    ...shadow.xl,
  },
  receiptTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: 14,
  },
  merchantTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  merchantDate: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  aiTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  aiTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#059669',
  },

  itemsList: {
    gap: 12,
    marginBottom: 18,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  itemLeft: {
    flex: 1,
  },
  itemName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  itemClaimed: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  itemPrice: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },

  receiptFooter: {
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 10,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  footerTotal: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
  },
  splitCompletePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ECFDF5',
    padding: 10,
    borderRadius: 12,
    justifyContent: 'center',
  },
  splitCompleteText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
});

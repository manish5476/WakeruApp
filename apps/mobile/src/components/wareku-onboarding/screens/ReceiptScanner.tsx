import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';
import { colors, spacing, radius, shadow, typography } from '../theme/tokens';
import { IconCamera, IconCheck } from '../icons/LandingIcons';
import AppIcon from '../../common/AppIcon';

interface ReceiptItem {
  id: string;
  name: string;
  price: number;
  assignedTo: string[];
}

export function ReceiptScanner() {
  const [isScanning, setIsScanning] = useState(false);
  const [, setScanned] = useState(true);
  const scanLineY = useSharedValue(0);

  const [items, setItems] = useState<ReceiptItem[]>([
    {
      id: '1',
      name: 'Grilled Sea Bass x 2',
      price: 2400,
      assignedTo: ['Arjun', 'Sarah'],
    },
    {
      id: '2',
      name: 'Truffle Mushroom Risotto',
      price: 1100,
      assignedTo: ['Rahul'],
    },
    {
      id: '3',
      name: 'Cocktails & Craft Beers',
      price: 1400,
      assignedTo: ['Arjun', 'Nehal'],
    },
    { id: '4', name: 'Tiramisu Platter', price: 700, assignedTo: ['All 4'] },
  ]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    if (isScanning) {
      scanLineY.value = withRepeat(
        withTiming(150, { duration: 1000, easing: Easing.inOut(Easing.quad) }),
        -1,
        true,
      );

      timer = setTimeout(() => {
        setIsScanning(false);
        setScanned(true);
      }, 2000);
    }

    return () => {
      clearTimeout(timer);
      cancelAnimation(scanLineY);
    };
  }, [isScanning, scanLineY]);

  const animatedLaserStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: scanLineY.value }],
  }));

  const triggerScan = () => {
    setScanned(false);
    setIsScanning(true);
  };

  const toggleItemClaim = (itemId: string, person: string) => {
    setItems(prev =>
      prev.map(it => {
        if (it.id !== itemId) return it;
        const exists = it.assignedTo.includes(person);
        const newAssigned = exists
          ? it.assignedTo.filter(p => p !== person)
          : [...it.assignedTo, person];
        return {
          ...it,
          assignedTo: newAssigned.length === 0 ? ['Unassigned'] : newAssigned,
        };
      }),
    );
  };

  const subtotal = items.reduce((sum, it) => sum + it.price, 0);
  const gstAndTip = Math.round(subtotal * 0.1);
  const grandTotal = subtotal + gstAndTip;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.badge}>
          <IconCamera size={14} color={colors.brand.primary} />
          <Text style={styles.badgeText}>AI CAMERA RECEIPT OCR</Text>
        </View>
        <Text style={styles.title}>Smart Receipt Itemization</Text>
        <Text style={styles.subtitle}>
          Snap physical paper bills or upload invoices. AI auto-extracts line
          items, separates drinks, and splits tax proportionally.
        </Text>
      </View>

      {/* Camera Scanning Box */}
      <View style={styles.scanSurface}>
        <View style={styles.cornerTopLeft} />
        <View style={styles.cornerTopRight} />
        <View style={styles.cornerBottomLeft} />
        <View style={styles.cornerBottomRight} />

        {isScanning && (
          <Animated.View style={[styles.laser, animatedLaserStyle]} />
        )}

        <View style={styles.receiptPaper}>
          <View style={styles.receiptHeader}>
            <Text style={styles.receiptTitle}>LE MARAIS BISTRO PARIS</Text>
            <Text style={styles.receiptMeta}>
              Table 14 · GST/VAT #FR-889021
            </Text>
          </View>

          <View style={styles.dashLine} />

          {/* Scanned Items List */}
          <View style={styles.itemsList}>
            {items.map(it => (
              <View key={it.id} style={styles.itemRow}>
                <View style={styles.itemLeft}>
                  <Text style={styles.itemName}>{it.name}</Text>
                  <View style={styles.claimPills}>
                    {['Arjun', 'Sarah', 'Rahul', 'Nehal'].map(p => {
                      const isClaimed =
                        it.assignedTo.includes(p) ||
                        it.assignedTo.includes('All 4');
                      return (
                        <Pressable
                          key={p}
                          onPress={() => toggleItemClaim(it.id, p)}
                          style={[
                            styles.claimChip,
                            isClaimed && styles.claimChipActive,
                          ]}
                        >
                          <Text
                            style={[
                              styles.claimChipText,
                              isClaimed && styles.claimChipTextActive,
                            ]}
                          >
                            {p[0]}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
                <Text style={styles.itemPrice}>
                  ₹{it.price.toLocaleString('en-IN')}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.dashLine} />

          <View style={styles.taxRow}>
            <Text style={styles.taxLabel}>Proportional VAT (10%):</Text>
            <Text style={styles.taxVal}>
              ₹{gstAndTip.toLocaleString('en-IN')}
            </Text>
          </View>

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>TOTAL EXTRACTED</Text>
            <Text style={styles.totalVal}>
              ₹{grandTotal.toLocaleString('en-IN')}
            </Text>
          </View>
        </View>
      </View>

      {/* Bottom Action Bar */}
      <View style={styles.bottomRow}>
        {isScanning ? (
          <View style={styles.scanningPill}>
            <AppIcon name="loader" size={14} color={colors.brand.primary} />
            <Text style={styles.scanningText}>
              Analyzing bill & item prices...
            </Text>
          </View>
        ) : (
          <View style={styles.actionPillRow}>
            <View style={styles.successPill}>
              <IconCheck size={14} color={colors.brand.emerald} />
              <Text style={styles.successText}>4 Items Auto-Categorized</Text>
            </View>

            <Pressable
              onPress={triggerScan}
              style={({ pressed }) => [
                styles.rescanBtn,
                pressed && styles.rescanBtnPressed,
              ]}
            >
              <AppIcon name="camera" size={12} color={colors.brand.primary} />
              <Text style={styles.rescanText}>Scan Again</Text>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.light.surface,
    borderRadius: radius.xxl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.light.border,
    ...shadow.cardHover,
    marginBottom: spacing.sectionSm,
  },
  header: {
    marginBottom: spacing.md,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.brand.primarySoft,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
    marginBottom: spacing.xs,
  },
  badgeText: {
    ...typography.label,
    color: colors.brand.primary,
    marginLeft: 6,
  },
  title: {
    ...typography.heading3.mobile,
    color: colors.light.textPrimary,
  },
  subtitle: {
    ...typography.bodySmall,
    color: colors.light.textSecondary,
    marginTop: 2,
  },

  // Scan Surface
  scanSurface: {
    backgroundColor: colors.brand.midnight,
    borderRadius: radius.xl,
    padding: spacing.lg,
    position: 'relative',
    overflow: 'hidden',
    marginTop: spacing.sm,
  },
  cornerTopLeft: {
    position: 'absolute',
    top: 10,
    left: 10,
    width: 16,
    height: 16,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderColor: colors.brand.cyan,
  },
  cornerTopRight: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 16,
    height: 16,
    borderTopWidth: 2,
    borderRightWidth: 2,
    borderColor: colors.brand.cyan,
  },
  cornerBottomLeft: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    width: 16,
    height: 16,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
    borderColor: colors.brand.cyan,
  },
  cornerBottomRight: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    width: 16,
    height: 16,
    borderBottomWidth: 2,
    borderRightWidth: 2,
    borderColor: colors.brand.cyan,
  },
  laser: {
    position: 'absolute',
    top: 20,
    left: 12,
    right: 12,
    height: 2,
    backgroundColor: colors.brand.cyan,
    shadowColor: colors.brand.cyan,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 10,
  },

  // Receipt Paper
  receiptPaper: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.md,
    padding: spacing.md,
    ...shadow.card,
  },
  receiptHeader: {
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  receiptTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: 0.5,
  },
  receiptMeta: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },
  dashLine: {
    height: 1,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    marginVertical: spacing.sm,
  },
  itemsList: {
    gap: spacing.sm,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemLeft: {
    flex: 1,
  },
  itemName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  claimPills: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 3,
  },
  claimChip: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  claimChipActive: {
    backgroundColor: colors.brand.primary,
  },
  claimChipText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
  },
  claimChipTextActive: {
    color: '#FFFFFF',
  },
  itemPrice: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  taxRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taxLabel: {
    fontSize: 11,
    color: '#64748B',
  },
  taxVal: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0F172A',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
  },
  totalVal: {
    fontSize: 14,
    fontWeight: '900',
    color: colors.brand.primary,
  },

  // Bottom Row
  bottomRow: {
    marginTop: spacing.md,
  },
  actionPillRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  successPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.brand.emeraldSoft,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  successText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.brand.emerald,
  },
  rescanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.brand.primarySoft,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  rescanBtnPressed: {
    opacity: 0.8,
  },
  rescanText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.brand.primary,
  },
  scanningPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.brand.primarySoft,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
    alignSelf: 'center',
  },
  scanningText: {
    fontSize: 12,
    color: colors.brand.primary,
    fontWeight: '600',
  },
});

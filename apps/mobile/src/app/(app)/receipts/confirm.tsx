// src/app/(app)/receipts/confirm.tsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TextInput,
  Alert,
  Pressable,
  Platform,
  useWindowDimensions,
  PressableStateCallbackType,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import GlobalLoader from '../../../components/common/GlobalLoader';
import AppIcon from '../../../components/common/AppIcon';
import { GlobalBackground } from '../../../components/ui/GlobalBackground';
import { GlassCard } from '../../../components/ui/GlassCard';
import { Badge } from '../../../components/ui/Badge';
import { useTheme } from '../../../providers/ThemeProvider';
import { useAuthStore } from '../../../stores/auth.store';
import { haptics } from '../../../utils/haptics';
import { getOcrService } from '../../../services/ocr';
import { receiptParser } from '../../../utils/receiptParser';
import { ReceiptDraft } from '../../../utils/receiptParser/receiptParser.types';
import { expenseRepository } from '../../../repositories/expense.repository';
import { getLocalDatabase, LocalTrip, LocalTripMember } from '../../../db';
import { toMinorUnits, toMajorUnits } from '../../../utils/money/money';

type WebPressableState = PressableStateCallbackType & { hovered?: boolean };

const CATEGORIES = [
  { key: 'food', emoji: '🍽️', label: 'Food' },
  { key: 'stay', emoji: '🏨', label: 'Stay' },
  { key: 'transport', emoji: '🚗', label: 'Transport' },
  { key: 'activity', emoji: '🎯', label: 'Activity' },
  { key: 'shopping', emoji: '🛍️', label: 'Shopping' },
  { key: 'health', emoji: '💊', label: 'Health' },
  { key: 'other', emoji: '📌', label: 'Other' },
];

export default function ReceiptConfirmScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { imageUri, tripId: initialTripId } = useLocalSearchParams<{
    imageUri: string;
    tripId?: string;
  }>();
  const { user } = useAuthStore();

  const isDesktop = Platform.OS === 'web' && width > 768;

  // Processing state
  const [isProcessing, setIsProcessing] = useState<boolean>(true);
  const [processingError, setProcessingError] = useState<string | null>(null);
  const [draft, setDraft] = useState<ReceiptDraft | null>(null);

  // Editable form state
  const [merchant, setMerchant] = useState<string>('');
  const [totalStr, setTotalStr] = useState<string>('0.00');
  const [taxStr, setTaxStr] = useState<string>('0.00');
  const [dateStr, setDateStr] = useState<string>(
    new Date().toISOString().split('T')[0],
  );
  const [category, setCategory] = useState<string>('food');
  const [selectedTripId, setSelectedTripId] = useState<string>(
    initialTripId || '',
  );
  const [selectedPayerId, setSelectedPayerId] = useState<string>(
    user?._id || '',
  );
  const [splitMethod, setSplitMethod] = useState<'equal' | 'personal'>('equal');

  // Trips & members from local database (offline-ready)
  const [trips, setTrips] = useState<LocalTrip[]>([]);
  const [members, setMembers] = useState<LocalTripMember[]>([]);

  // Duplicate detection state
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Load trips and run OCR on mount
  useEffect(() => {
    let isMounted = true;

    async function loadDataAndScan() {
      try {
        const db = getLocalDatabase();
        const localTrips = await db.getTrips();
        if (isMounted) {
          setTrips(localTrips);
          const active = initialTripId
            ? localTrips.find((t: any) => t.id === initialTripId)
            : localTrips.find((t: any) => t.status === 'active') ||
              localTrips[0];
          if (active) {
            setSelectedTripId(active.id);
            const tripMembers = await db.getTripMembers(active.id);
            if (isMounted) setMembers(tripMembers);
          }
        }

        if (!imageUri) {
          if (isMounted) {
            setProcessingError('No receipt image provided.');
            setIsProcessing(false);
          }
          return;
        }

        // Run On-Device OCR
        const ocrService = getOcrService();
        const ocrResult = await ocrService.recognizeText(imageUri);

        // Parse OCR result through receipt parsing engine
        const parsedDraft = receiptParser.parse(ocrResult);

        if (isMounted) {
          setDraft(parsedDraft);
          setMerchant(parsedDraft.merchantName || 'Unknown Merchant');
          setTotalStr(
            toMajorUnits(parsedDraft.totalMinor ?? 0, 'INR').toFixed(2),
          );
          setTaxStr(toMajorUnits(parsedDraft.taxMinor ?? 0, 'INR').toFixed(2));
          if (parsedDraft.date) {
            setDateStr(parsedDraft.date);
          }
          if (parsedDraft.categorySuggestion) {
            setCategory(parsedDraft.categorySuggestion);
          }
          setIsProcessing(false);
        }
      } catch (err: any) {
        if (isMounted) {
          setProcessingError(err?.message || 'Failed to scan receipt.');
          setIsProcessing(false);
        }
      }
    }

    loadDataAndScan();

    return () => {
      isMounted = false;
    };
  }, [imageUri, initialTripId]);

  // Load members when selected trip changes
  useEffect(() => {
    if (!selectedTripId) return;
    getLocalDatabase()
      .getTripMembers(selectedTripId)
      .then((m: any[]) => {
        setMembers(m);
        if (m.length > 0 && !m.some((x: any) => x.userId === selectedPayerId)) {
          setSelectedPayerId(m[0].userId);
        }
      })
      .catch(() => {});
  }, [selectedTripId]);

  // Check for duplicate receipt hash whenever trip or draft changes
  useEffect(() => {
    if (!selectedTripId || !draft?.receiptHash) {
      setDuplicateWarning(null);
      return;
    }

    expenseRepository
      .findExpenseByReceiptHash(selectedTripId, draft.receiptHash)
      .then((existing: any) => {
        if (existing) {
          setDuplicateWarning(
            `A matching receipt was already added on ${new Date(existing.date).toLocaleDateString()} (₹${(existing.amountMinor / 100).toFixed(2)} - ${existing.title}).`,
          );
        } else {
          setDuplicateWarning(null);
        }
      })
      .catch(() => {});
  }, [selectedTripId, draft?.receiptHash]);

  const handleConfirm = async () => {
    if (!selectedTripId) {
      Alert.alert('Trip Required', 'Please select a trip for this expense.');
      return;
    }

    const numericTotal = parseFloat(totalStr);
    if (isNaN(numericTotal) || numericTotal <= 0) {
      Alert.alert(
        'Invalid Amount',
        'Please enter a valid expense total amount greater than ₹0.',
      );
      return;
    }

    try {
      setIsSaving(true);
      haptics.medium();

      const payerMember = members.find(m => m.userId === selectedPayerId);
      const payerName = payerMember?.displayName || user?.displayName || 'Me';

      await expenseRepository.createExpenseLocally({
        tripId: selectedTripId,
        title: merchant.trim() || 'Receipt Expense',
        category,
        amountLocal: numericTotal,
        currency: 'INR',
        baseCurrency: 'INR',
        exchangeRateUsed: 1,
        paidBy: selectedPayerId || user?._id || 'user_me',
        paidByName: payerName,
        date: dateStr
          ? new Date(dateStr).toISOString()
          : new Date().toISOString(),
        notes: draft?.receiptNumber
          ? `Receipt #${draft.receiptNumber}`
          : undefined,
        split: {
          method: splitMethod,
          memberIds:
            splitMethod === 'equal' && members.length > 0
              ? members.map(m => m.userId)
              : [selectedPayerId],
        },
        receiptMetadata: {
          receiptHash: draft?.receiptHash,
          receiptNumber: draft?.receiptNumber,
          receiptMerchant: merchant.trim(),
          receiptDate: dateStr,
          ocrParserVersion: draft?.parserVersion || '1.0.0',
          receiptImageUri: imageUri,
        },
      });

      haptics.success();
      router.replace(`/(app)/trips/${selectedTripId}` as any);
    } catch (err: any) {
      Alert.alert('Save Failed', err?.message || 'Could not save expense.');
    } finally {
      setIsSaving(false);
    }
  };

  const confidenceBadgeColor = useMemo(() => {
    if (!draft) return theme.colors.textSecondary;
    if (draft.confidenceLevel === 'HIGH') return theme.colors.success;
    if (draft.confidenceLevel === 'MEDIUM') return '#F59E0B'; // amber
    return theme.colors.danger;
  }, [draft, theme]);

  return (
    <GlobalBackground>
      <View style={styles.container}>
        <View
          style={[styles.contentWrapper, isDesktop && styles.desktopWrapper]}
        >
          {/* Header */}
          <View
            style={[
              styles.header,
              {
                paddingTop:
                  Platform.OS === 'web'
                    ? theme.spacing['4']
                    : insets.top + theme.spacing['3'],
                borderBottomColor: theme.colors.borderLight,
                backgroundColor: theme.colors.surface,
              },
            ]}
          >
            <Pressable
              onPress={() => router.back()}
              style={({ hovered }: WebPressableState) => [
                styles.backBtn,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.borderLight,
                },
                Platform.OS === 'web' &&
                  hovered &&
                  ({ opacity: 0.7, cursor: 'pointer' } as any),
              ]}
              hitSlop={10}
            >
              <AppIcon name="x" size={20} color={theme.colors.textSecondary} />
            </Pressable>
            <Text
              style={[styles.headerTitle, { color: theme.colors.textPrimary }]}
            >
              Confirm Receipt
            </Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Loading State */}
          {isProcessing ? (
            <View style={styles.centerBox}>
              <GlobalLoader
                variant="inline"
                size="large"
                color={theme.colors.primary}
              />
              <Text
                style={[
                  styles.processingText,
                  { color: theme.colors.textPrimary },
                ]}
              >
                Scanning Receipt On-Device...
              </Text>
              <Text
                style={[
                  styles.processingSub,
                  { color: theme.colors.textSecondary },
                ]}
              >
                Extracting merchant, totals, GST, and dates with Google ML Kit
              </Text>
            </View>
          ) : processingError ? (
            /* Error State */
            <View style={styles.centerBox}>
              <View
                style={[
                  styles.errorIconWrap,
                  { backgroundColor: theme.colors.dangerBg },
                ]}
              >
                <AppIcon
                  name="alert-circle"
                  size={44}
                  color={theme.colors.danger}
                />
              </View>
              <Text
                style={[styles.errorTitle, { color: theme.colors.textPrimary }]}
              >
                OCR Scanning Failed
              </Text>
              <Text
                style={[styles.errorSub, { color: theme.colors.textSecondary }]}
              >
                {processingError}
              </Text>
              <Pressable
                style={[
                  styles.actionBtn,
                  { backgroundColor: theme.colors.primary },
                ]}
                onPress={() => router.back()}
              >
                <Text style={styles.actionBtnText}>Go Back</Text>
              </Pressable>
            </View>
          ) : (
            /* Receipt Form */
            <ScrollView
              contentContainerStyle={[
                styles.scrollContent,
                {
                  paddingBottom:
                    Platform.OS === 'web' ? 80 : insets.bottom + 40,
                },
              ]}
              showsVerticalScrollIndicator={false}
            >
              {/* Image Preview Thumbnail */}
              {imageUri && (
                <GlassCard
                  style={styles.previewCard}
                  intensity={theme.isDark ? 12 : 6}
                >
                  <Image
                    source={{ uri: imageUri }}
                    style={styles.previewImage}
                    resizeMode="contain"
                  />
                </GlassCard>
              )}

              {/* Confidence Banner */}
              <View style={styles.statusRow}>
                <View style={styles.statusBadgeWrap}>
                  <AppIcon
                    name="check-circle"
                    size={16}
                    color={confidenceBadgeColor}
                  />
                  <Text
                    style={[
                      styles.statusBadgeText,
                      { color: theme.colors.textPrimary },
                    ]}
                  >
                    Receipt Detected
                  </Text>
                </View>
                <View
                  style={[
                    styles.confidencePill,
                    {
                      backgroundColor: confidenceBadgeColor + '20',
                      borderColor: confidenceBadgeColor,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.confidenceText,
                      { color: confidenceBadgeColor },
                    ]}
                  >
                    {draft?.confidenceLevel.toUpperCase()} CONFIDENCE
                  </Text>
                </View>
              </View>

              {/* Duplicate Receipt Warning */}
              {duplicateWarning && (
                <View
                  style={[
                    styles.warningBox,
                    {
                      backgroundColor: theme.isDark
                        ? 'rgba(239, 68, 68, 0.15)'
                        : '#FEE2E2',
                      borderColor: theme.colors.danger,
                    },
                  ]}
                >
                  <AppIcon
                    name="alert-triangle"
                    size={20}
                    color={theme.colors.danger}
                  />
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.warningTitle,
                        { color: theme.colors.danger },
                      ]}
                    >
                      Duplicate Receipt Warning
                    </Text>
                    <Text
                      style={[
                        styles.warningBody,
                        { color: theme.colors.textPrimary },
                      ]}
                    >
                      {duplicateWarning}
                    </Text>
                  </View>
                </View>
              )}

              {/* Low Confidence Banner */}
              {draft?.confidenceLevel === 'LOW' && (
                <View
                  style={[
                    styles.warningBox,
                    {
                      backgroundColor: theme.isDark
                        ? 'rgba(245, 158, 11, 0.15)'
                        : '#FEF3C7',
                      borderColor: '#F59E0B',
                    },
                  ]}
                >
                  <AppIcon name="info" size={20} color="#F59E0B" />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.warningTitle, { color: '#B45309' }]}>
                      Low Confidence Scan
                    </Text>
                    <Text
                      style={[
                        styles.warningBody,
                        { color: theme.colors.textPrimary },
                      ]}
                    >
                      Some receipt details could not be identified with
                      certainty. Please review and edit the fields below.
                    </Text>
                  </View>
                </View>
              )}

              {/* Form Fields */}
              <GlassCard
                style={styles.formCard}
                intensity={theme.isDark ? 10 : 5}
              >
                {/* Merchant Name */}
                <View style={styles.fieldGroup}>
                  <Text
                    style={[
                      styles.fieldLabel,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    Merchant / Store Name
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: theme.colors.surface,
                        borderColor: theme.colors.borderLight,
                        color: theme.colors.textPrimary,
                      },
                    ]}
                    value={merchant}
                    onChangeText={setMerchant}
                    placeholder="e.g. Domino's Pizza"
                    placeholderTextColor={theme.colors.textTertiary}
                  />
                </View>

                {/* Amount Row: Total and Tax */}
                <View style={styles.rowFields}>
                  <View style={[styles.fieldGroup, { flex: 1 }]}>
                    <Text
                      style={[
                        styles.fieldLabel,
                        { color: theme.colors.textSecondary },
                      ]}
                    >
                      Total Amount (₹)
                    </Text>
                    <View style={styles.currencyInputWrap}>
                      <Text
                        style={[
                          styles.currencyPrefix,
                          { color: theme.colors.textSecondary },
                        ]}
                      >
                        ₹
                      </Text>
                      <TextInput
                        style={[
                          styles.input,
                          styles.currencyInput,
                          {
                            backgroundColor: theme.colors.surface,
                            borderColor: theme.colors.borderLight,
                            color: theme.colors.textPrimary,
                          },
                        ]}
                        value={totalStr}
                        onChangeText={setTotalStr}
                        keyboardType="decimal-pad"
                        placeholder="0.00"
                        placeholderTextColor={theme.colors.textTertiary}
                      />
                    </View>
                  </View>

                  <View style={[styles.fieldGroup, { flex: 1 }]}>
                    <Text
                      style={[
                        styles.fieldLabel,
                        { color: theme.colors.textSecondary },
                      ]}
                    >
                      Tax / GST Included (₹)
                    </Text>
                    <View style={styles.currencyInputWrap}>
                      <Text
                        style={[
                          styles.currencyPrefix,
                          { color: theme.colors.textSecondary },
                        ]}
                      >
                        ₹
                      </Text>
                      <TextInput
                        style={[
                          styles.input,
                          styles.currencyInput,
                          {
                            backgroundColor: theme.colors.surface,
                            borderColor: theme.colors.borderLight,
                            color: theme.colors.textPrimary,
                          },
                        ]}
                        value={taxStr}
                        onChangeText={setTaxStr}
                        keyboardType="decimal-pad"
                        placeholder="0.00"
                        placeholderTextColor={theme.colors.textTertiary}
                      />
                    </View>
                  </View>
                </View>

                {/* Date */}
                <View style={styles.fieldGroup}>
                  <Text
                    style={[
                      styles.fieldLabel,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    Receipt Date (YYYY-MM-DD)
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: theme.colors.surface,
                        borderColor: theme.colors.borderLight,
                        color: theme.colors.textPrimary,
                      },
                    ]}
                    value={dateStr}
                    onChangeText={setDateStr}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={theme.colors.textTertiary}
                  />
                </View>

                {/* Category Pills */}
                <View style={styles.fieldGroup}>
                  <Text
                    style={[
                      styles.fieldLabel,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    Category
                  </Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.pillRow}
                  >
                    {CATEGORIES.map(cat => {
                      const isSelected = category === cat.key;
                      return (
                        <Pressable
                          key={cat.key}
                          onPress={() => setCategory(cat.key)}
                          style={[
                            styles.categoryPill,
                            {
                              backgroundColor: isSelected
                                ? theme.colors.primary
                                : theme.colors.surface,
                              borderColor: isSelected
                                ? theme.colors.primary
                                : theme.colors.borderLight,
                            },
                          ]}
                        >
                          <Text style={styles.pillEmoji}>{cat.emoji}</Text>
                          <Text
                            style={[
                              styles.pillText,
                              {
                                color: isSelected
                                  ? '#FFF'
                                  : theme.colors.textSecondary,
                              },
                            ]}
                          >
                            {cat.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                </View>

                {/* Trip Selection */}
                <View style={styles.fieldGroup}>
                  <Text
                    style={[
                      styles.fieldLabel,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    Destination Trip
                  </Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.pillRow}
                  >
                    {trips.map(t => {
                      const isSelected = selectedTripId === t.id;
                      return (
                        <Pressable
                          key={t.id}
                          onPress={() => setSelectedTripId(t.id)}
                          style={[
                            styles.tripPill,
                            {
                              backgroundColor: isSelected
                                ? theme.colors.primary
                                : theme.colors.surface,
                              borderColor: isSelected
                                ? theme.colors.primary
                                : theme.colors.borderLight,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.pillText,
                              {
                                color: isSelected
                                  ? '#FFF'
                                  : theme.colors.textSecondary,
                              },
                            ]}
                          >
                            {t.title}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                </View>

                {/* Paid By Selection */}
                {members.length > 0 && (
                  <View style={styles.fieldGroup}>
                    <Text
                      style={[
                        styles.fieldLabel,
                        { color: theme.colors.textSecondary },
                      ]}
                    >
                      Paid By
                    </Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      style={styles.pillRow}
                    >
                      {members.map(m => {
                        const isSelected = selectedPayerId === m.userId;
                        return (
                          <Pressable
                            key={m.userId}
                            onPress={() => setSelectedPayerId(m.userId)}
                            style={[
                              styles.tripPill,
                              {
                                backgroundColor: isSelected
                                  ? theme.colors.primary
                                  : theme.colors.surface,
                                borderColor: isSelected
                                  ? theme.colors.primary
                                  : theme.colors.borderLight,
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.pillText,
                                {
                                  color: isSelected
                                    ? '#FFF'
                                    : theme.colors.textSecondary,
                                },
                              ]}
                            >
                              {m.displayName}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </ScrollView>
                  </View>
                )}

                {/* Split Method */}
                <View style={styles.fieldGroup}>
                  <Text
                    style={[
                      styles.fieldLabel,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    Split Allocation
                  </Text>
                  <View style={styles.splitToggleRow}>
                    <Pressable
                      onPress={() => setSplitMethod('equal')}
                      style={[
                        styles.splitToggleBtn,
                        splitMethod === 'equal' && {
                          backgroundColor: theme.colors.primary,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.splitToggleText,
                          {
                            color:
                              splitMethod === 'equal'
                                ? '#FFF'
                                : theme.colors.textSecondary,
                          },
                        ]}
                      >
                        Split Equally
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => setSplitMethod('personal')}
                      style={[
                        styles.splitToggleBtn,
                        splitMethod === 'personal' && {
                          backgroundColor: theme.colors.primary,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.splitToggleText,
                          {
                            color:
                              splitMethod === 'personal'
                                ? '#FFF'
                                : theme.colors.textSecondary,
                          },
                        ]}
                      >
                        Personal (No Split)
                      </Text>
                    </Pressable>
                  </View>
                </View>
              </GlassCard>

              {/* Confirm & Save Button */}
              <Pressable
                onPress={handleConfirm}
                disabled={isSaving}
                style={({ hovered, pressed }: WebPressableState) => [
                  styles.submitBtn,
                  isSaving && { opacity: 0.7 },
                  Platform.OS === 'web' &&
                    hovered &&
                    !isSaving &&
                    ({ transform: [{ translateY: -2 }] } as any),
                  pressed && !isSaving && { opacity: 0.85 },
                ]}
              >
                <LinearGradient
                  colors={theme.gradients.primary || ['#3B82F6', '#1D4ED8']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.submitGrad}
                >
                  {isSaving ? (
                    <GlobalLoader variant="inline" color="#FFF" />
                  ) : (
                    <>
                      <AppIcon name="check" size={20} color="#FFF" />
                      <Text style={styles.submitBtnText}>
                        Confirm & Add Expense
                      </Text>
                    </>
                  )}
                </LinearGradient>
              </Pressable>
            </ScrollView>
          )}
        </View>
      </View>
    </GlobalBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentWrapper: {
    flex: 1,
    width: '100%',
  },
  desktopWrapper: {
    maxWidth: 640,
    alignSelf: 'center',
    marginVertical: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  scrollContent: {
    padding: 16,
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  processingText: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 16,
    textAlign: 'center',
  },
  processingSub: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    maxWidth: 300,
  },
  errorIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  errorSub: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  actionBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  actionBtnText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 15,
  },
  previewCard: {
    padding: 10,
    borderRadius: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statusBadgeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusBadgeText: {
    fontSize: 15,
    fontWeight: '600',
  },
  confidencePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  confidenceText: {
    fontSize: 11,
    fontWeight: '700',
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 16,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  warningBody: {
    fontSize: 13,
    lineHeight: 18,
  },
  formCard: {
    padding: 16,
    borderRadius: 18,
    marginBottom: 20,
    gap: 14,
  },
  fieldGroup: {
    gap: 6,
  },
  rowFields: {
    flexDirection: 'row',
    gap: 12,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  input: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 15,
  },
  currencyInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  currencyPrefix: {
    position: 'absolute',
    left: 12,
    fontSize: 16,
    fontWeight: '600',
    zIndex: 1,
  },
  currencyInput: {
    flex: 1,
    paddingLeft: 28,
    fontWeight: '600',
  },
  pillRow: {
    flexDirection: 'row',
    paddingVertical: 2,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
    marginRight: 8,
  },
  pillEmoji: {
    fontSize: 14,
  },
  pillText: {
    fontSize: 13,
    fontWeight: '600',
  },
  tripPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
    marginRight: 8,
  },
  splitToggleRow: {
    flexDirection: 'row',
    borderRadius: 10,
    backgroundColor: 'rgba(150, 150, 150, 0.1)',
    padding: 3,
    gap: 4,
  },
  splitToggleBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  splitToggleText: {
    fontSize: 13,
    fontWeight: '600',
  },
  submitBtn: {
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 8,
  },
  submitGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  submitBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
});

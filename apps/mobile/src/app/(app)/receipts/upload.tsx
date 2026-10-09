import GlobalLoader from '../../../components/common/GlobalLoader';
import AppIcon from '../../../components/common/AppIcon';
// app/(app)/receipts/upload.tsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Alert,
  ScrollView,
  Platform,
  useWindowDimensions,
  Pressable,
  PressableStateCallbackType,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as FileSystem from 'expo-file-system/legacy';
import { useMyTrips, useUploadReceipt } from '../../../hooks';
import { useAuthStore } from '../../../stores/auth.store';
import { receiptImageService } from '../../../services/image/receiptImageService';
import { haptics } from '../../../utils/haptics';
import { useTheme } from '../../../providers/ThemeProvider';
import { useGlobalStyles } from '../../../hooks/useGlobalStyles';
import { GlassCard } from '../../../components/ui/GlassCard';
import { Badge } from '../../../components/ui/Badge';
import { GlobalBackground } from '../../../components/ui/GlobalBackground';

// Safe web pressable type
type WebPressableState = PressableStateCallbackType & { hovered?: boolean };

// ============================================================
// MAIN SCREEN
// ============================================================

export default function UploadReceiptScreen() {
  const theme = useTheme();
  const globalStyles = useGlobalStyles();
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { imageUri } = useLocalSearchParams<{ imageUri: string }>();
  const { user } = useAuthStore();
  const {
    mutate: uploadReceipt,
    isPending,
    data: uploadResult,
  } = useUploadReceipt();
  const { data: tripsData } = useMyTrips();

  const [selectedTripId, setSelectedTripId] = useState<string | undefined>(
    undefined,
  );
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<
    'preview' | 'uploading' | 'processing' | 'done' | 'error'
  >('preview');
  const [errorMsg, setErrorMsg] = useState('');

  const trips = tripsData?.pages?.flatMap(page => page?.trips || []) || [];
  const isWebDesktop = Platform.OS === 'web' && width > 768;

  const [selectedImageUri, setSelectedImageUri] = useState<string | undefined>(
    imageUri,
  );

  const activeImageUri = selectedImageUri || imageUri;

  const handleCameraCapture = async () => {
    const uri = await receiptImageService.captureReceipt();
    if (uri) {
      setSelectedImageUri(uri);
    }
  };

  const handleGalleryPick = async () => {
    const uri = await receiptImageService.pickReceiptFromGallery();
    if (uri) {
      setSelectedImageUri(uri);
    }
  };

  const handleProceedToConfirm = () => {
    if (!activeImageUri) {
      Alert.alert('No Image', 'Please capture or select a receipt image first');
      return;
    }

    router.push({
      pathname: '/(app)/receipts/confirm',
      params: { imageUri: activeImageUri, tripId: selectedTripId || '' },
    } as any);
  };

  const handleDone = () => {
    router.back();
  };

  const handleRetry = () => {
    setErrorMsg('');
    setStatus('preview');
  };

  return (
    <GlobalBackground>
      <View style={[styles.container, { backgroundColor: 'transparent' }]}>
        <View
          style={[
            styles.webDesktopContent,
            isWebDesktop && styles.webDesktopContentCentered,
          ]}
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
                styles.backBtnWrap,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.borderLight,
                },
                Platform.OS === 'web' &&
                  hovered &&
                  ({ opacity: 0.7, cursor: 'pointer' } as any),
              ]}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <AppIcon name="x" size={22} color={theme.colors.textSecondary} />
            </Pressable>
            <Text
              style={[styles.headerTitle, { color: theme.colors.textPrimary }]}
            >
              Upload Receipt
            </Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView
            contentContainerStyle={[
              styles.content,
              {
                paddingBottom: Platform.OS === 'web' ? 80 : insets.bottom + 40,
              },
            ]}
            showsVerticalScrollIndicator={false}
          >
            {/* Image Preview or Picker Buttons */}
            {activeImageUri ? (
              <GlassCard
                style={styles.previewContainer}
                intensity={theme.isDark ? 12 : 6}
              >
                <Image
                  source={{ uri: activeImageUri }}
                  style={styles.previewImage}
                  resizeMode="contain"
                />
                <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
                  <Pressable
                    onPress={handleCameraCapture}
                    style={[
                      styles.retryBtn,
                      {
                        backgroundColor: theme.colors.surface,
                        borderWidth: 1,
                        borderColor: theme.colors.borderLight,
                      },
                    ]}
                  >
                    <AppIcon
                      name="camera"
                      size={16}
                      color={theme.colors.textPrimary}
                    />
                    <Text
                      style={[
                        styles.retryBtnText,
                        { color: theme.colors.textPrimary },
                      ]}
                    >
                      Retake
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={handleGalleryPick}
                    style={[
                      styles.retryBtn,
                      {
                        backgroundColor: theme.colors.surface,
                        borderWidth: 1,
                        borderColor: theme.colors.borderLight,
                      },
                    ]}
                  >
                    <AppIcon
                      name="image"
                      size={16}
                      color={theme.colors.textPrimary}
                    />
                    <Text
                      style={[
                        styles.retryBtnText,
                        { color: theme.colors.textPrimary },
                      ]}
                    >
                      Gallery
                    </Text>
                  </Pressable>
                </View>
              </GlassCard>
            ) : (
              <GlassCard
                style={[styles.previewContainer, { paddingVertical: 32 }]}
                intensity={theme.isDark ? 12 : 6}
              >
                <AppIcon
                  name="file-text"
                  size={48}
                  color={theme.colors.primary}
                />
                <Text
                  style={[
                    styles.statusTitle,
                    { color: theme.colors.textPrimary, marginTop: 12 },
                  ]}
                >
                  Capture or Select Receipt
                </Text>
                <Text
                  style={[
                    styles.statusSub,
                    { color: theme.colors.textSecondary, marginBottom: 20 },
                  ]}
                >
                  On-device OCR processes ₹ amounts, GST, and totals without
                  sending photos to cloud
                </Text>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <Pressable
                    onPress={handleCameraCapture}
                    style={[
                      styles.retryBtn,
                      { backgroundColor: theme.colors.primary },
                    ]}
                  >
                    <AppIcon name="camera" size={18} color="#FFF" />
                    <Text style={styles.retryBtnText}>Take Photo</Text>
                  </Pressable>
                  <Pressable
                    onPress={handleGalleryPick}
                    style={[
                      styles.retryBtn,
                      {
                        backgroundColor: theme.colors.surface,
                        borderWidth: 1,
                        borderColor: theme.colors.borderLight,
                      },
                    ]}
                  >
                    <AppIcon
                      name="image"
                      size={18}
                      color={theme.colors.textPrimary}
                    />
                    <Text
                      style={[
                        styles.retryBtnText,
                        { color: theme.colors.textPrimary },
                      ]}
                    >
                      Pick Gallery
                    </Text>
                  </Pressable>
                </View>
              </GlassCard>
            )}

            {/* Status: Preview */}
            {status === 'preview' && (
              <>
                <View style={styles.tripSection}>
                  <View style={styles.sectionHeader}>
                    <AppIcon
                      name="briefcase"
                      size={14}
                      color={theme.colors.primary}
                    />
                    <Text
                      style={[
                        styles.label,
                        { color: theme.colors.textSecondary },
                      ]}
                    >
                      Link to Trip{' '}
                      <Text
                        style={[
                          styles.optionalText,
                          { color: theme.colors.textTertiary },
                        ]}
                      >
                        (optional)
                      </Text>
                    </Text>
                  </View>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.tripRow}
                  >
                    <Pressable
                      style={({ hovered }: WebPressableState) => [
                        styles.tripChip,
                        {
                          borderColor: !selectedTripId
                            ? theme.colors.primary
                            : theme.colors.borderLight,
                          backgroundColor: !selectedTripId
                            ? theme.colors.primary
                            : theme.colors.surface,
                        },
                        Platform.OS === 'web' &&
                          hovered &&
                          !selectedTripId &&
                          styles.tripChipHovered,
                      ]}
                      onPress={() => setSelectedTripId(undefined)}
                    >
                      <Text
                        style={[
                          styles.tripChipText,
                          {
                            color: !selectedTripId
                              ? '#FFF'
                              : theme.colors.textSecondary,
                          },
                        ]}
                      >
                        No trip
                      </Text>
                    </Pressable>

                    {trips.map((trip: any) => {
                      const isActive = selectedTripId === trip._id;
                      return (
                        <GlobalBackground key={trip._id}>
                          <Pressable
                            style={({ hovered }: WebPressableState) => [
                              styles.tripChip,
                              {
                                borderColor: isActive
                                  ? theme.colors.primary
                                  : theme.colors.borderLight,
                                backgroundColor: isActive
                                  ? theme.colors.primary
                                  : theme.colors.surface,
                              },
                              Platform.OS === 'web' &&
                                hovered &&
                                !isActive &&
                                styles.tripChipHovered,
                            ]}
                            onPress={() => setSelectedTripId(trip._id)}
                          >
                            <Text
                              style={[
                                styles.tripChipText,
                                {
                                  color: isActive
                                    ? '#FFF'
                                    : theme.colors.textSecondary,
                                },
                              ]}
                            >
                              {trip.stops?.[0]?.emoji || '📍'} {trip.title}
                            </Text>
                          </Pressable>
                        </GlobalBackground>
                      );
                    })}
                  </ScrollView>
                </View>

                <Pressable
                  onPress={handleProceedToConfirm}
                  disabled={!activeImageUri}
                  style={({ hovered, pressed }: WebPressableState) => [
                    styles.uploadBtn,
                    !activeImageUri && { opacity: 0.5 },
                    Platform.OS === 'web' &&
                      hovered &&
                      activeImageUri &&
                      styles.hoverLift,
                    pressed && activeImageUri && styles.pressedState,
                  ]}
                >
                  <LinearGradient
                    colors={theme.gradients.primary || ['#3B82F6', '#1D4ED8']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.uploadGrad}
                  >
                    <AppIcon name="camera" size={20} color="#FFF" />
                    <Text style={styles.uploadBtnText}>
                      Scan & Extract Receipt
                    </Text>
                  </LinearGradient>
                </Pressable>

                <View style={styles.hintContainer}>
                  <AppIcon
                    name="info"
                    size={14}
                    color={theme.colors.textTertiary}
                  />
                  <Text
                    style={[styles.hint, { color: theme.colors.textSecondary }]}
                  >
                    On-device Google ML Kit extracts items, prices, merchant
                    name, and total automatically.
                  </Text>
                </View>
              </>
            )}

            {/* Status: Uploading */}
            {status === 'uploading' && (
              <GlassCard
                style={styles.statusContainer}
                intensity={theme.isDark ? 12 : 6}
              >
                <View style={styles.statusIconWrap}>
                  <GlobalLoader
                    variant="inline"
                    size="large"
                    color={theme.colors.primary}
                  />
                </View>
                <Text
                  style={[
                    styles.statusTitle,
                    { color: theme.colors.textPrimary },
                  ]}
                >
                  Uploading & Processing...
                </Text>
                <Text
                  style={[
                    styles.statusSub,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  Extracting receipt data with AI
                </Text>

                <View style={styles.progressContainer}>
                  <View
                    style={[
                      styles.progressBar,
                      { backgroundColor: theme.colors.borderLight },
                    ]}
                  >
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${progress}%`,
                          backgroundColor: theme.colors.primary,
                        },
                      ]}
                    />
                  </View>
                  <Text
                    style={[
                      styles.progressText,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    {progress.toFixed(0)}%
                  </Text>
                </View>
              </GlassCard>
            )}

            {/* Status: Done */}
            {status === 'done' && (
              <GlassCard
                style={styles.statusContainer}
                intensity={theme.isDark ? 12 : 6}
              >
                <View
                  style={[
                    styles.successIconWrap,
                    { backgroundColor: theme.colors.successBg },
                  ]}
                >
                  <AppIcon
                    name="check-circle"
                    size={48}
                    color={theme.colors.success}
                  />
                </View>
                <Text
                  style={[
                    styles.statusTitle,
                    { color: theme.colors.textPrimary },
                  ]}
                >
                  Receipt Processed!
                </Text>
                <Text
                  style={[
                    styles.statusSub,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  We've extracted the data. You can now create an expense from
                  this receipt.
                </Text>

                {uploadResult?.data?.receipt && (
                  <GlassCard
                    style={styles.receiptData}
                    intensity={theme.isDark ? 8 : 4}
                  >
                    <View style={styles.receiptHeader}>
                      <AppIcon
                        name="file-text"
                        size={16}
                        color={theme.colors.primary}
                      />
                      <Text
                        style={[
                          styles.dataTitle,
                          { color: theme.colors.textPrimary },
                        ]}
                      >
                        Extracted Data
                      </Text>
                    </View>
                    {uploadResult.data.receipt.ocrData?.merchantName && (
                      <View
                        style={[
                          styles.dataRow,
                          { borderBottomColor: theme.colors.borderLight },
                        ]}
                      >
                        <Text
                          style={[
                            styles.dataLabel,
                            { color: theme.colors.textSecondary },
                          ]}
                        >
                          Merchant
                        </Text>
                        <Text
                          style={[
                            styles.dataValue,
                            { color: theme.colors.textPrimary },
                          ]}
                        >
                          {uploadResult.data.receipt.ocrData.merchantName}
                        </Text>
                      </View>
                    )}
                    {uploadResult.data.receipt.ocrData?.totalAmount > 0 && (
                      <View
                        style={[
                          styles.dataRow,
                          { borderBottomColor: theme.colors.borderLight },
                        ]}
                      >
                        <Text
                          style={[
                            styles.dataLabel,
                            { color: theme.colors.textSecondary },
                          ]}
                        >
                          Total
                        </Text>
                        <Text
                          style={[
                            styles.dataValue,
                            { color: theme.colors.textPrimary },
                          ]}
                        >
                          ₹{uploadResult.data.receipt.ocrData.totalAmount}
                        </Text>
                      </View>
                    )}
                    {uploadResult.data.receipt.ocrData?.date && (
                      <View
                        style={[
                          styles.dataRow,
                          { borderBottomColor: theme.colors.borderLight },
                        ]}
                      >
                        <Text
                          style={[
                            styles.dataLabel,
                            { color: theme.colors.textSecondary },
                          ]}
                        >
                          Date
                        </Text>
                        <Text
                          style={[
                            styles.dataValue,
                            { color: theme.colors.textPrimary },
                          ]}
                        >
                          {new Date(
                            uploadResult.data.receipt.ocrData.date,
                          ).toLocaleDateString()}
                        </Text>
                      </View>
                    )}
                    {uploadResult.data.receipt.ocrData?.items?.length > 0 && (
                      <View style={[styles.dataRow, { borderBottomWidth: 0 }]}>
                        <Text
                          style={[
                            styles.dataLabel,
                            { color: theme.colors.textSecondary },
                          ]}
                        >
                          Items
                        </Text>
                        <Text
                          style={[
                            styles.dataValue,
                            { color: theme.colors.textPrimary },
                          ]}
                        >
                          {uploadResult.data.receipt.ocrData.items.length} items
                          detected
                        </Text>
                      </View>
                    )}
                  </GlassCard>
                )}

                <Pressable
                  onPress={handleDone}
                  style={({ hovered, pressed }: WebPressableState) => [
                    styles.doneBtn,
                    Platform.OS === 'web' && hovered && styles.hoverLift,
                    pressed && styles.pressedState,
                  ]}
                >
                  <LinearGradient
                    colors={[
                      theme.colors.success,
                      theme.colors.successBg || '#047857',
                    ]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.doneGrad}
                  >
                    <AppIcon name="check" size={18} color="#FFF" />
                    <Text style={styles.doneBtnText}>Create Expense</Text>
                  </LinearGradient>
                </Pressable>
              </GlassCard>
            )}

            {/* Status: Error */}
            {status === 'error' && (
              <GlassCard
                style={styles.statusContainer}
                intensity={theme.isDark ? 12 : 6}
              >
                <View
                  style={[
                    styles.errorIconWrap,
                    { backgroundColor: theme.colors.dangerBg },
                  ]}
                >
                  <AppIcon
                    name="alert-circle"
                    size={48}
                    color={theme.colors.danger}
                  />
                </View>
                <Text
                  style={[
                    styles.statusTitle,
                    { color: theme.colors.textPrimary },
                  ]}
                >
                  Upload Failed
                </Text>
                <Text
                  style={[styles.errorText, { color: theme.colors.danger }]}
                >
                  {errorMsg}
                </Text>

                <Pressable
                  style={({ hovered, pressed }: WebPressableState) => [
                    styles.retryBtn,
                    { backgroundColor: theme.colors.primary },
                    Platform.OS === 'web' && hovered && styles.hoverLift,
                    pressed && styles.pressedState,
                  ]}
                  onPress={handleRetry}
                >
                  <AppIcon name="refresh-cw" size={16} color="#FFF" />
                  <Text style={styles.retryBtnText}>Try Again</Text>
                </Pressable>
              </GlassCard>
            )}
          </ScrollView>
        </View>
      </View>
    </GlobalBackground>
  );
}

// ============================================================
// Styles
// ============================================================

const useStyles = () => {
  const theme = useTheme();
  return useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1 },

        // Widescreen wrapper for utility screens
        webDesktopContent: {
          flex: 1,
          width: '100%',
        },
        webDesktopContentCentered: {
          maxWidth: 600,
          alignSelf: 'center',
          marginTop: theme.spacing['4'],
          borderRadius: theme.borderRadius['2xl'],
          borderWidth: 1,
          borderColor: theme.colors.borderLight,
          ...theme.shadows.lg,
          flex: 0,
          paddingBottom: theme.spacing['4'],
        },

        // Web Interaction Helpers
        hoverLift: {
          transform: [{ translateY: -2 }],
          ...theme.shadows.md,
          ...(Platform.OS === 'web'
            ? { transition: 'all 0.2s ease', cursor: 'pointer' }
            : {}),
        } as any,
        pressedState: {
          opacity: 0.8,
          transform: [{ scale: 0.98 }],
        },

        header: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: theme.spacing['4'],
          paddingVertical: 14,
          borderBottomWidth: 1,
          borderTopLeftRadius: theme.borderRadius['2xl'],
          borderTopRightRadius: theme.borderRadius['2xl'],
        },
        backBtnWrap: {
          width: 40,
          height: 40,
          borderRadius: 20,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 1,
        },
        headerTitle: {
          fontSize: 17,
          fontWeight: '700',
        },
        content: {
          padding: theme.spacing['4'],
        },

        // Preview
        previewContainer: {
          padding: theme.spacing['3'],
          borderRadius: 16,
          marginBottom: theme.spacing['4'],
          alignItems: 'center',
          borderWidth: 1,
          borderColor: theme.isDark
            ? 'rgba(255,255,255,0.06)'
            : 'rgba(255,255,255,0.2)',
        },
        previewImage: {
          width: '100%',
          height: 280,
          borderRadius: 12,
        },

        // Trip Selector
        tripSection: {
          marginBottom: theme.spacing['4'],
        },
        sectionHeader: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          marginBottom: 8,
        },
        label: {
          fontSize: 13,
          fontWeight: '600',
        },
        optionalText: {
          fontWeight: '400',
        },
        tripRow: {
          flexDirection: 'row',
        },
        tripChip: {
          paddingHorizontal: 14,
          paddingVertical: 8,
          borderRadius: 20,
          borderWidth: 1,
          marginRight: 8,
          ...(Platform.OS === 'web'
            ? { transition: 'all 0.2s ease', cursor: 'pointer' }
            : {}),
        } as any,
        tripChipHovered: {
          opacity: 0.8,
        },
        tripChipText: {
          fontSize: 13,
          fontWeight: '600',
        },

        // Upload Button
        uploadBtn: {
          borderRadius: 14,
          overflow: 'hidden',
          marginBottom: theme.spacing['3'],
          ...theme.shadows.md,
        },
        uploadGrad: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          paddingVertical: 16,
        },
        uploadBtnText: {
          color: theme.colors.white,
          fontSize: 16,
          fontWeight: '700',
        },
        hintContainer: {
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: 8,
          paddingHorizontal: 4,
        },
        hint: {
          textAlign: 'center',
          fontSize: 13,
          fontWeight: '500',
          lineHeight: 20,
          flex: 1,
        },

        // Status
        statusContainer: {
          alignItems: 'center',
          padding: 24,
          borderRadius: 20,
          borderWidth: 1,
          borderColor: theme.isDark
            ? 'rgba(255,255,255,0.06)'
            : 'rgba(255,255,255,0.2)',
        },
        statusIconWrap: {
          marginBottom: 16,
        },
        statusTitle: {
          fontSize: 20,
          fontWeight: '700',
          marginBottom: 4,
        },
        statusSub: {
          fontSize: 14,
          textAlign: 'center',
          marginBottom: 16,
          fontWeight: '500',
        },
        successIconWrap: {
          width: 80,
          height: 80,
          borderRadius: 40,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 16,
        },
        errorIconWrap: {
          width: 80,
          height: 80,
          borderRadius: 40,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 16,
        },

        // Progress
        progressContainer: {
          width: '100%',
          gap: 8,
        },
        progressBar: {
          width: '100%',
          height: 6,
          borderRadius: 3,
          overflow: 'hidden',
        },
        progressFill: {
          height: '100%',
          borderRadius: 3,
        },
        progressText: {
          fontSize: 13,
          fontWeight: '600',
          textAlign: 'center',
        },

        // Receipt Data
        receiptData: {
          width: '100%',
          padding: 16,
          borderRadius: 16,
          marginTop: 8,
          marginBottom: 16,
          borderWidth: 1,
          borderColor: theme.isDark
            ? 'rgba(255,255,255,0.06)'
            : 'rgba(255,255,255,0.2)',
        },
        receiptHeader: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          marginBottom: 12,
        },
        dataTitle: {
          fontSize: 14,
          fontWeight: '700',
        },
        dataRow: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          paddingVertical: 8,
          borderBottomWidth: 1,
        },
        dataLabel: {
          fontSize: 13,
          fontWeight: '500',
        },
        dataValue: {
          fontSize: 13,
          fontWeight: '600',
        },

        // Done Button
        doneBtn: {
          width: '100%',
          borderRadius: 14,
          overflow: 'hidden',
          marginTop: theme.spacing['2'],
          ...theme.shadows.md,
        },
        doneGrad: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          paddingVertical: 16,
        },
        doneBtnText: {
          color: theme.colors.white,
          fontSize: 16,
          fontWeight: '700',
        },

        // Retry
        retryBtn: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          paddingHorizontal: 24,
          paddingVertical: 12,
          borderRadius: 14,
          marginTop: theme.spacing['3'],
        },
        retryBtnText: {
          color: theme.colors.white,
          fontSize: 15,
          fontWeight: '700',
        },

        // Error
        errorText: {
          fontSize: 14,
          textAlign: 'center',
          fontWeight: '600',
        },
      }),
    [theme],
  );
};

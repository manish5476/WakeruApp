import GlobalLoader from '../common/GlobalLoader';
import AppIcon from '../common/AppIcon';
// components/trips/YearInReview.tsx
import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Modal,
  Platform,
} from 'react-native';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../providers/ThemeProvider';
import { GlassCard } from '../ui/GlassCard';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface YearInReviewProps {
  year: number;
  data: any;
  onClose: () => void;
  visible?: boolean;
}

export function YearInReview({
  year,
  data,
  onClose,
  visible = true,
}: YearInReviewProps) {
  const theme = useTheme();
  const viewShotRef = useRef<any>(null);
  const [isSharing, setIsSharing] = React.useState(false);

  const handleShare = async () => {
    try {
      setIsSharing(true);
      const uri = await viewShotRef.current.capture({
        format: 'png',
        quality: 1,
        width: SCREEN_WIDTH - 40,
        height: 700,
      });
      await Sharing.shareAsync(uri, {
        mimeType: 'image/png',
        dialogTitle: `My ${year} Year in Review`,
      });
    } catch (error) {
      console.error('Share failed:', error);
    } finally {
      setIsSharing(false);
    }
  };

  if (!visible || !data) return null;

  const styles = StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: theme.colors.overlay,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 16,
      ...(Platform.OS === 'web' ? { backdropFilter: 'blur(10px)' } : {}),
    },
    container: {
      width: '100%',
      maxWidth: 420,
      maxHeight: '90%',
      borderRadius: theme.borderRadius['3xl'],
      borderWidth: 1,
      borderColor: theme.isDark
        ? 'rgba(255, 255, 255, 0.06)'
        : 'rgba(255, 255, 255, 0.2)',
      ...theme.shadows.xl,
      overflow: 'hidden',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.borderLight,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.colors.textPrimary,
    },
    closeBtn: {
      padding: 4,
    },
    captureContainer: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollView: {
      flex: 1,
    },
    cover: {
      padding: 32,
      alignItems: 'center',
      paddingTop: 60,
      paddingBottom: 48,
      position: 'relative',
      overflow: 'hidden',
    },
    coverGlow: {
      position: 'absolute',
      top: -80,
      right: -80,
      width: 200,
      height: 200,
      borderRadius: 100,
      backgroundColor: 'rgba(234, 88, 12, 0.15)',
    },
    coverGlow2: {
      position: 'absolute',
      bottom: -60,
      left: -60,
      width: 150,
      height: 150,
      borderRadius: 75,
      backgroundColor: 'rgba(99, 102, 241, 0.1)',
    },
    coverYear: {
      fontSize: 72,
      fontWeight: '900',
      color: 'rgba(255, 255, 255, 0.08)',
      position: 'absolute',
      top: 10,
      right: 20,
      letterSpacing: -4,
    },
    coverEmoji: {
      fontSize: 56,
      marginBottom: 12,
    },
    coverTitle: {
      fontSize: 32,
      fontWeight: '900',
      color: '#FFFFFF',
      letterSpacing: -0.5,
    },
    coverSubtitle: {
      fontSize: 16,
      color: 'rgba(255, 255, 255, 0.8)',
      marginTop: 4,
      fontWeight: '500',
    },
    coverBadge: {
      marginTop: 16,
      paddingHorizontal: 16,
      paddingVertical: 4,
      borderRadius: 20,
      backgroundColor: 'rgba(255, 255, 255, 0.15)',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    coverBadgeText: {
      fontSize: 11,
      color: '#FFFFFF',
      fontWeight: '700',
      letterSpacing: 1,
      textTransform: 'uppercase',
    },
    statsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      padding: 16,
      gap: 10,
    },
    statCard: {
      width: (SCREEN_WIDTH - 40 - 10 - 32) / 2,
      padding: 16,
      borderRadius: theme.borderRadius.xl,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.isDark
        ? 'rgba(255, 255, 255, 0.06)'
        : 'rgba(255, 255, 255, 0.2)',
    },
    statEmoji: {
      fontSize: 24,
      marginBottom: 6,
    },
    statValue: {
      fontSize: 20,
      fontWeight: '800',
      color: theme.colors.textPrimary,
    },
    statLabel: {
      fontSize: 10,
      color: theme.colors.textSecondary,
      marginTop: 2,
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    highlightCard: {
      margin: 16,
      padding: 20,
      borderRadius: theme.borderRadius.xl,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.isDark
        ? 'rgba(255, 255, 255, 0.06)'
        : 'rgba(255, 255, 255, 0.2)',
    },
    highlightLabel: {
      fontSize: 10,
      color: theme.colors.textTertiary,
      letterSpacing: 2,
      fontWeight: '700',
      textTransform: 'uppercase',
      marginBottom: 8,
    },
    highlightEmoji: {
      fontSize: 36,
      marginBottom: 8,
    },
    highlightValue: {
      fontSize: 22,
      fontWeight: '900',
      color: theme.colors.textPrimary,
    },
    highlightSub: {
      fontSize: 13,
      color: theme.colors.textSecondary,
      marginTop: 4,
      fontWeight: '500',
    },
    highlightBar: {
      width: 60,
      height: 4,
      borderRadius: 2,
      marginTop: 10,
    },
    footer: {
      alignItems: 'center',
      paddingVertical: 32,
      paddingHorizontal: 16,
    },
    footerText: {
      fontSize: 12,
      color: theme.colors.textTertiary,
      fontWeight: '600',
      letterSpacing: 0.5,
    },
    footerYear: {
      fontSize: 40,
      fontWeight: '900',
      color: theme.isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
      marginTop: 4,
      letterSpacing: -2,
    },
    actions: {
      padding: 16,
      paddingBottom: 20,
      gap: 10,
      borderTopWidth: 1,
      borderTopColor: theme.colors.borderLight,
    },
    shareBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 14,
      borderRadius: theme.borderRadius.lg,
      backgroundColor: theme.colors.primary,
      ...theme.shadows.md,
    },
    shareBtnText: {
      color: '#FFFFFF',
      fontSize: 15,
      fontWeight: '700',
    },
    cancelBtn: {
      paddingVertical: 10,
      alignItems: 'center',
      borderRadius: theme.borderRadius.lg,
    },
    cancelBtnText: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      fontWeight: '600',
    },
  });

  const topCategory = data.categories?.[0];
  const highestMonth = data.highestMonth;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <GlassCard style={styles.container} intensity={theme.isDark ? 20 : 10}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Year in Review</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <AppIcon name="x" size={22} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 8 }}
          >
            <ViewShot
              ref={viewShotRef}
              style={styles.captureContainer}
              options={{
                format: 'png',
                quality: 1,
                width: SCREEN_WIDTH - 40,
              }}
            >
              {/* Cover */}
              <LinearGradient
                colors={theme.gradients.primary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cover}
              >
                <View style={styles.coverGlow} />
                <View style={styles.coverGlow2} />
                <Text style={styles.coverYear}>{year}</Text>
                <Text style={styles.coverEmoji}>✈️</Text>
                <Text style={styles.coverTitle}>Year in Review</Text>
                <Text style={styles.coverSubtitle}>
                  Your travel spending story
                </Text>
                <View style={styles.coverBadge}>
                  <Text style={styles.coverBadgeText}>
                    ✨ {year} Highlights
                  </Text>
                </View>
              </LinearGradient>

              {/* Stats */}
              <View style={styles.statsContainer}>
                <GlassCard
                  style={styles.statCard}
                  intensity={theme.isDark ? 8 : 4}
                >
                  <Text style={styles.statEmoji}>💰</Text>
                  <Text style={styles.statValue}>
                    ₹{data.totalSpent?.toLocaleString()}
                  </Text>
                  <Text style={styles.statLabel}>Total Spent</Text>
                </GlassCard>
                <GlassCard
                  style={styles.statCard}
                  intensity={theme.isDark ? 8 : 4}
                >
                  <Text style={styles.statEmoji}>🧾</Text>
                  <Text style={styles.statValue}>{data.totalExpenses}</Text>
                  <Text style={styles.statLabel}>Expenses</Text>
                </GlassCard>
                <GlassCard
                  style={styles.statCard}
                  intensity={theme.isDark ? 8 : 4}
                >
                  <Text style={styles.statEmoji}>📍</Text>
                  <Text style={styles.statValue}>{data.tripCount || 0}</Text>
                  <Text style={styles.statLabel}>Trips</Text>
                </GlassCard>
                <GlassCard
                  style={styles.statCard}
                  intensity={theme.isDark ? 8 : 4}
                >
                  <Text style={styles.statEmoji}>📊</Text>
                  <Text style={styles.statValue}>
                    ₹{data.averagePerMonth?.toLocaleString()}
                  </Text>
                  <Text style={styles.statLabel}>Avg/Month</Text>
                </GlassCard>
              </View>

              {/* Top Category */}
              {topCategory && (
                <GlassCard
                  style={[
                    styles.highlightCard,
                    {
                      borderColor: theme.colors.primary + '30',
                      backgroundColor: theme.isDark
                        ? 'rgba(234, 88, 12, 0.05)'
                        : 'rgba(234, 88, 12, 0.03)',
                    },
                  ]}
                  intensity={theme.isDark ? 10 : 5}
                >
                  <Text
                    style={[
                      styles.highlightLabel,
                      { color: theme.colors.primary },
                    ]}
                  >
                    🏆 Top Category
                  </Text>
                  <Text style={styles.highlightEmoji}>
                    {topCategory.category === 'food'
                      ? '🍽️'
                      : topCategory.category === 'stay'
                        ? '🏨'
                        : topCategory.category === 'transport'
                          ? '🚗'
                          : topCategory.category === 'activity'
                            ? '🎯'
                            : topCategory.category === 'shopping'
                              ? '🛍️'
                              : '📌'}
                  </Text>
                  <Text
                    style={[
                      styles.highlightValue,
                      { color: theme.colors.primary },
                    ]}
                  >
                    {topCategory.category}
                  </Text>
                  <Text style={styles.highlightSub}>
                    {topCategory.percentage}% of your spending
                  </Text>
                  <View
                    style={[
                      styles.highlightBar,
                      { backgroundColor: theme.colors.primary },
                    ]}
                  />
                </GlassCard>
              )}

              {/* Highest Month */}
              {highestMonth && (
                <GlassCard
                  style={styles.highlightCard}
                  intensity={theme.isDark ? 10 : 5}
                >
                  <Text
                    style={[
                      styles.highlightLabel,
                      { color: theme.colors.secondary },
                    ]}
                  >
                    📈 Biggest Month
                  </Text>
                  <Text style={styles.highlightEmoji}>📈</Text>
                  <Text
                    style={[
                      styles.highlightValue,
                      { color: theme.colors.textPrimary },
                    ]}
                  >
                    {highestMonth.monthName}
                  </Text>
                  <Text style={styles.highlightSub}>
                    ₹{highestMonth.totalAmount?.toLocaleString()}
                  </Text>
                  <View
                    style={[
                      styles.highlightBar,
                      { backgroundColor: theme.colors.secondary },
                    ]}
                  />
                </GlassCard>
              )}

              {/* Footer */}
              <View style={styles.footer}>
                <Text style={styles.footerText}>Made with ✈️ Wakeru</Text>
                <Text style={styles.footerYear}>{year}</Text>
              </View>
            </ViewShot>
          </ScrollView>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.shareBtn}
              onPress={handleShare}
              disabled={isSharing}
              activeOpacity={0.8}
            >
              {isSharing ? (
                <GlobalLoader variant="inline" color="#FFFFFF" />
              ) : (
                <>
                  <AppIcon name="share-2" size={18} color="#FFFFFF" />
                  <Text style={styles.shareBtnText}>Share {year} Review</Text>
                </>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </GlassCard>
      </View>
    </Modal>
  );
}

// import React, { useRef } from 'react';
// import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
// import ViewShot from 'react-native-view-shot';
// import * as Sharing from 'expo-sharing';
// import { LinearGradient } from 'expo-linear-gradient';
// import { colors, typography, spacing, borderRadius, shadows } from '../../theme';

// const { width: SCREEN_WIDTH } = Dimensions.get('window');

// interface YearInReviewProps {
//     year: number;
//     data: any;
//     onClose: () => void;
// }

// export function YearInReview({ year, data, onClose }: YearInReviewProps) {
//     const viewShotRef = useRef<any>(null);

//     const handleShare = async () => {
//         const uri = await viewShotRef.current.capture({ format: 'png', quality: 1 });
//         await Sharing.shareAsync(uri, { mimeType: 'image/png' });
//     };

//     if (!data) return null;

//     return (
//         <View style={styles.overlay}>
//             <ViewShot ref={viewShotRef} style={styles.captureContainer}>
//                 <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
//                     {/* Cover */}
//                     <LinearGradient colors={['#1A56DB', '#7C3AED']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.cover}>
//                         <Text style={styles.coverYear}>{year}</Text>
//                         <Text style={styles.coverTitle}>Year in Review</Text>
//                         <Text style={styles.coverSubtitle}>Your travel spending story</Text>
//                         <Text style={styles.coverEmoji}>✈️</Text>
//                     </LinearGradient>

//                     {/* Stats */}
//                     <View style={styles.statsContainer}>
//                         <View style={styles.statCard}>
//                             <Text style={styles.statEmoji}>💰</Text>
//                             <Text style={styles.statValue}>₹{data.totalSpent?.toLocaleString()}</Text>
//                             <Text style={styles.statLabel}>Total Spent</Text>
//                         </View>
//                         <View style={styles.statCard}>
//                             <Text style={styles.statEmoji}>🧾</Text>
//                             <Text style={styles.statValue}>{data.totalExpenses}</Text>
//                             <Text style={styles.statLabel}>Expenses</Text>
//                         </View>
//                         <View style={styles.statCard}>
//                             <Text style={styles.statEmoji}>📍</Text>
//                             <Text style={styles.statValue}>{data.tripCount || 0}</Text>
//                             <Text style={styles.statLabel}>Trips</Text>
//                         </View>
//                         <View style={styles.statCard}>
//                             <Text style={styles.statEmoji}>📊</Text>
//                             <Text style={styles.statValue}>₹{data.averagePerMonth?.toLocaleString()}</Text>
//                             <Text style={styles.statLabel}>Avg/Month</Text>
//                         </View>
//                     </View>

//                     {/* Top Category */}
//                     {data.categories?.[0] && (
//                         <View style={styles.highlightCard}>
//                             <Text style={styles.highlightLabel}>TOP CATEGORY</Text>
//                             <Text style={styles.highlightEmoji}>🍽️</Text>
//                             <Text style={styles.highlightValue}>{data.categories[0].category}</Text>
//                             <Text style={styles.highlightSub}>{data.categories[0].percentage}% of your spending</Text>
//                         </View>
//                     )}

//                     {/* Highest Month */}
//                     {data.highestMonth && (
//                         <View style={styles.highlightCard}>
//                             <Text style={styles.highlightLabel}>BIGGEST MONTH</Text>
//                             <Text style={styles.highlightEmoji}>📈</Text>
//                             <Text style={styles.highlightValue}>{data.highestMonth.monthName}</Text>
//                             <Text style={styles.highlightSub}>₹{data.highestMonth.totalAmount?.toLocaleString()}</Text>
//                         </View>
//                     )}

//                     {/* Footer */}
//                     <View style={styles.footer}>
//                         <Text style={styles.footerText}>Made with ✈️ TripSplit</Text>
//                         <Text style={styles.footerYear}>{year}</Text>
//                     </View>
//                 </ScrollView>
//             </ViewShot>

//             {/* Actions */}
//             <View style={styles.actions}>
//                 <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
//                     <Text style={styles.shareBtnText}>📤 Share Your {year} Review</Text>
//                 </TouchableOpacity>
//                 <TouchableOpacity onPress={onClose}>
//                     <Text style={styles.closeText}>Close</Text>
//                 </TouchableOpacity>
//             </View>
//         </View>
//     );
// }

// const styles = StyleSheet.create({
//     overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 9999 },
//     captureContainer: { flex: 1, backgroundColor: colors.background },
//     scrollView: { flex: 1 },
//     cover: { padding: spacing['3xl'], alignItems: 'center', paddingTop: 80, paddingBottom: spacing['4xl'] },
//     coverYear: { fontSize: 72, fontWeight: typography.fontWeight.bold, color: 'rgba(255,255,255,0.3)', position: 'absolute', top: 20, right: 20 },
//     coverTitle: { fontSize: 36, fontWeight: typography.fontWeight.bold, color: colors.white },
//     coverSubtitle: { fontSize: typography.fontSize.lg, color: 'rgba(255,255,255,0.8)', marginTop: spacing.sm },
//     coverEmoji: { fontSize: 64, marginTop: spacing.xl },
//     statsContainer: { flexDirection: 'row', flexWrap: 'wrap', padding: spacing.lg, gap: spacing.sm },
//     statCard: { width: (SCREEN_WIDTH - spacing.lg * 2 - spacing.sm) / 2, backgroundColor: colors.white, borderRadius: borderRadius.xl, padding: spacing.xl, alignItems: 'center', ...shadows.sm },
//     statEmoji: { fontSize: 28, marginBottom: spacing.sm },
//     statValue: { fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.bold, color: colors.gray900 },
//     statLabel: { fontSize: typography.fontSize.xs, color: colors.gray500, marginTop: 2 },
//     highlightCard: { backgroundColor: colors.white, margin: spacing.lg, borderRadius: borderRadius.xl, padding: spacing.xl, alignItems: 'center', ...shadows.sm },
//     highlightLabel: { fontSize: 10, color: colors.gray400, letterSpacing: 2, fontWeight: typography.fontWeight.semibold, marginBottom: spacing.md },
//     highlightEmoji: { fontSize: 40, marginBottom: spacing.sm },
//     highlightValue: { fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.bold, color: colors.gray900 },
//     highlightSub: { fontSize: typography.fontSize.sm, color: colors.gray500, marginTop: spacing.xs },
//     footer: { alignItems: 'center', paddingVertical: spacing['3xl'] },
//     footerText: { fontSize: typography.fontSize.sm, color: colors.gray400 },
//     footerYear: { fontSize: 48, fontWeight: typography.fontWeight.bold, color: colors.gray200, marginTop: spacing.sm },
//     actions: { padding: spacing.xl, paddingBottom: 40, gap: spacing.md },
//     shareBtn: { backgroundColor: colors.primary, paddingVertical: spacing.lg, borderRadius: borderRadius.lg, alignItems: 'center' },
//     shareBtnText: { color: colors.white, fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.semibold },
//     closeText: { textAlign: 'center', color: colors.white, fontSize: typography.fontSize.sm },
// });

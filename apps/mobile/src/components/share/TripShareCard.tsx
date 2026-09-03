import GlobalLoader from '../common/GlobalLoader';
import AppIcon from '../common/AppIcon';
// components/trips/TripShareCard.tsx
import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  Modal,
  Platform,
} from 'react-native';
import ViewShot, { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { LinearGradient } from 'expo-linear-gradient';
import { format } from 'date-fns';
import { useTheme } from '../../providers/ThemeProvider';
import { GlassCard } from '../ui/GlassCard';
import { Badge } from '../ui/Badge';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 80;

const CATEGORY_COLORS: Record<string, string> = {
  food: '#F59E0B',
  stay: '#8B5CF6',
  transport: '#3B82F6',
  activity: '#10B981',
  shopping: '#EC4899',
  health: '#EF4444',
  other: '#6B7280',
};

const CATEGORY_EMOJIS: Record<string, string> = {
  food: '🍽️',
  stay: '🏨',
  transport: '🚗',
  activity: '🎯',
  shopping: '🛍️',
  health: '💊',
  other: '📌',
};

interface ShareCardProps {
  trip: any;
  summary: any;
  onClose: () => void;
  visible?: boolean;
}

export function TripShareCard({
  trip,
  summary,
  onClose,
  visible = true,
}: ShareCardProps) {
  const theme = useTheme();
  const viewShotRef = useRef<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleShare = async () => {
    try {
      setIsGenerating(true);
      const uri = await captureRef(viewShotRef, {
        format: 'png',
        quality: 1,
        width: CARD_WIDTH,
        height: 520,
      });

      const fileUri = (FileSystem.cacheDirectory ?? '') + 'trip-summary.png';
      await FileSystem.copyAsync({ from: uri, to: fileUri });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'image/png',
          dialogTitle: 'Share your trip summary',
          UTI: 'public.png',
        });
      } else {
        Alert.alert('Share', 'Sharing is not available on this device');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to generate share card');
    } finally {
      setIsGenerating(false);
    }
  };

  if (!visible) return null;

  const activeMembers = trip?.members?.filter((m: any) => m.isActive) || [];
  const categories = summary?.categories || [];
  const topCategories = categories.slice(0, 5);
  const totalSpent = summary?.totalSpent || 0;
  const totalExpenses = summary?.totalExpenses || 0;
  const duration = trip?.duration || 0;

  const styles = StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: theme.colors.overlay,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 16,
    },
    container: {
      width: '100%',
      maxWidth: 420,
      borderRadius: theme.borderRadius['3xl'],
      padding: 20,
      borderWidth: 1,
      borderColor: theme.isDark
        ? 'rgba(255,255,255,0.06)'
        : 'rgba(255,255,255,0.2)',
      ...theme.shadows.xl,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.colors.textPrimary,
    },
    closeBtn: {
      padding: 4,
    },
    cardWrapper: {
      borderRadius: theme.borderRadius['2xl'],
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.08)',
      ...theme.shadows.lg,
    },
    card: {
      padding: 24,
      width: CARD_WIDTH,
      alignSelf: 'center',
    },
    cardHeader: {
      marginBottom: 20,
    },
    cardLogoWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 8,
    },
    cardLogoIcon: {
      width: 32,
      height: 32,
      borderRadius: 8,
      backgroundColor: 'rgba(255,255,255,0.15)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    cardLogo: {
      fontSize: 12,
      fontWeight: '800',
      color: 'rgba(255,255,255,0.7)',
      letterSpacing: 2,
    },
    cardTripName: {
      fontSize: 24,
      fontWeight: '900',
      color: '#FFFFFF',
      letterSpacing: -0.5,
      marginTop: 4,
    },
    cardTripDates: {
      fontSize: 12,
      color: 'rgba(255,255,255,0.7)',
      fontWeight: '500',
      marginTop: 4,
    },
    cardStats: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      paddingVertical: 16,
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderColor: 'rgba(255,255,255,0.15)',
      marginBottom: 16,
    },
    statItem: {
      alignItems: 'center',
    },
    statValue: {
      fontSize: 18,
      fontWeight: '800',
      color: '#FFFFFF',
    },
    statLabel: {
      fontSize: 9,
      color: 'rgba(255,255,255,0.7)',
      marginTop: 2,
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    cardCategories: {
      gap: 8,
      marginBottom: 16,
    },
    categoryItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    categoryDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    categoryEmoji: {
      fontSize: 14,
    },
    categoryName: {
      flex: 1,
      fontSize: 13,
      fontWeight: '600',
      color: 'rgba(255,255,255,0.9)',
    },
    categoryPercent: {
      fontSize: 13,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    categoryBar: {
      position: 'absolute',
      right: 0,
      top: 0,
      bottom: 0,
      height: 4,
      borderRadius: 2,
      opacity: 0.5,
    },
    cardMembers: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
      gap: 8,
    },
    cardMember: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: 'rgba(255,255,255,0.2)',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: 'rgba(255,255,255,0.3)',
    },
    cardMemberText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '800',
    },
    memberCount: {
      fontSize: 12,
      color: 'rgba(255,255,255,0.7)',
      fontWeight: '600',
      marginLeft: 4,
    },
    cardFooter: {
      alignItems: 'center',
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: 'rgba(255,255,255,0.1)',
    },
    cardFooterText: {
      fontSize: 11,
      color: 'rgba(255,255,255,0.6)',
      fontWeight: '600',
      letterSpacing: 0.5,
    },
    cardFooterSub: {
      fontSize: 10,
      color: 'rgba(255,255,255,0.4)',
      marginTop: 2,
      fontWeight: '500',
    },
    actions: {
      gap: 10,
      marginTop: 16,
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
      paddingVertical: 12,
      alignItems: 'center',
      borderRadius: theme.borderRadius.lg,
    },
    cancelBtnText: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      fontWeight: '600',
    },
  });

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
            <Text style={styles.headerTitle}>Share Trip Summary</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <AppIcon name="x" size={22} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* The card that gets captured */}
          <View style={styles.cardWrapper}>
            <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 1 }}>
              <LinearGradient
                colors={['#0F172A', '#1E1B4B', '#312E81']}
                locations={[0, 0.5, 1]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.card}
              >
                {/* Glow Effects */}
                <View
                  style={{
                    position: 'absolute',
                    top: -50,
                    right: -50,
                    width: 150,
                    height: 150,
                    borderRadius: 75,
                    backgroundColor: '#4F46E5',
                    opacity: 0.1,
                  }}
                />
                <View
                  style={{
                    position: 'absolute',
                    bottom: -30,
                    left: -30,
                    width: 100,
                    height: 100,
                    borderRadius: 50,
                    backgroundColor: '#EA580C',
                    opacity: 0.08,
                  }}
                />

                {/* Header */}
                <View style={styles.cardHeader}>
                  <View style={styles.cardLogoWrap}>
                    <View style={styles.cardLogoIcon}>
                      <AppIcon name="send" size={16} color="#FFF" />
                    </View>
                    <Text style={styles.cardLogo}>WAKERU</Text>
                  </View>
                  <Text style={styles.cardTripName}>
                    {trip?.title || 'Trip'}
                  </Text>
                  {trip?.startDate && trip?.endDate && (
                    <Text style={styles.cardTripDates}>
                      {format(new Date(trip.startDate), 'MMM d')} -{' '}
                      {format(new Date(trip.endDate), 'MMM d, yyyy')} •{' '}
                      {duration}d
                    </Text>
                  )}
                </View>

                {/* Stats */}
                <View style={styles.cardStats}>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>
                      ₹{totalSpent.toLocaleString()}
                    </Text>
                    <Text style={styles.statLabel}>Total Spent</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{totalExpenses}</Text>
                    <Text style={styles.statLabel}>Expenses</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{activeMembers.length}</Text>
                    <Text style={styles.statLabel}>Members</Text>
                  </View>
                </View>

                {/* Categories */}
                {topCategories.length > 0 && (
                  <View style={styles.cardCategories}>
                    {topCategories.map((cat: any) => (
                      <View key={cat.category} style={styles.categoryItem}>
                        <Text style={styles.categoryEmoji}>
                          {CATEGORY_EMOJIS[cat.category] || '📌'}
                        </Text>
                        <Text style={styles.categoryName}>{cat.category}</Text>
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 8,
                          }}
                        >
                          <View
                            style={[
                              styles.categoryDot,
                              {
                                backgroundColor:
                                  CATEGORY_COLORS[cat.category] ||
                                  theme.colors.textTertiary,
                              },
                            ]}
                          />
                          <Text style={styles.categoryPercent}>
                            {cat.percentage}%
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )}

                {/* Members */}
                <View style={styles.cardMembers}>
                  {activeMembers.slice(0, 5).map((m: any, i: number) => (
                    <View
                      key={i}
                      style={[
                        styles.cardMember,
                        { marginLeft: i > 0 ? -8 : 0 },
                      ]}
                    >
                      <Text style={styles.cardMemberText}>
                        {m.displayName?.charAt(0)?.toUpperCase() || '?'}
                      </Text>
                    </View>
                  ))}
                  {activeMembers.length > 5 && (
                    <Text style={styles.memberCount}>
                      +{activeMembers.length - 5}
                    </Text>
                  )}
                </View>

                {/* Footer */}
                <View style={styles.cardFooter}>
                  <Text style={styles.cardFooterText}>Made with ✈️ Wakeru</Text>
                  <Text style={styles.cardFooterSub}>
                    The smart way to split expenses
                  </Text>
                </View>
              </LinearGradient>
            </ViewShot>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.shareBtn}
              onPress={handleShare}
              disabled={isGenerating}
              activeOpacity={0.8}
            >
              {isGenerating ? (
                <GlobalLoader variant="inline" color="#FFFFFF" />
              ) : (
                <>
                  <AppIcon name="share-2" size={18} color="#FFFFFF" />
                  <Text style={styles.shareBtnText}>Share Card</Text>
                </>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </GlassCard>
      </View>
    </Modal>
  );
}

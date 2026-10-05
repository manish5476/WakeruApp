import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '../../../providers/ThemeProvider';
import { Typography } from '../../../components/ui/Typography';
import { GlassCard } from '../../../components/ui/GlassCard';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { GlobalBackground } from '../../../components/ui/GlobalBackground';
import { EmptyState } from '../../../components/ui/EmptyState';
import AppIcon from '../../../components/common/AppIcon';
import {
  useVendorBusinesses,
  useVendorProfile,
  useActivateBusinessMode,
} from '../../../hooks/useLocal';
import { useAuthStore } from '../../../stores/auth.store';

export default function VendorDashboardScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const user = useAuthStore(s => s.user);

  const {
    data: profile,
    isLoading: isProfileLoading,
    refetch: refetchProfile,
  } = useVendorProfile();
  const {
    data: businesses = [],
    isLoading: isBizLoading,
    refetch: refetchBiz,
  } = useVendorBusinesses();
  const activateBusinessMode = useActivateBusinessMode();

  const isLoading = isProfileLoading || isBizLoading;

  const handleActivate = async () => {
    try {
      await activateBusinessMode.mutateAsync(user?.phoneNumber);
      refetchProfile();
      refetchBiz();
    } catch (e: any) {
      console.error('Failed to activate business mode', e);
    }
  };

  return (
    <GlobalBackground>
      <View
        style={[
          styles.container,
          { paddingTop: insets.top + (Platform.OS === 'web' ? 16 : 8) },
        ]}
      >
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
          >
            <AppIcon
              name="arrow-left"
              size={20}
              color={theme.colors.textPrimary}
            />
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Typography
              variant="h2"
              weight="bold"
              style={{ color: theme.colors.textPrimary }}
            >
              Business Hub
            </Typography>
            <Typography
              variant="caption"
              style={{ color: theme.colors.textSecondary }}
            >
              Manage your local listings, bookings & growth
            </Typography>
          </View>
          <TouchableOpacity
            onPress={() => router.replace('/(app)/(tabs)' as any)}
            style={[
              styles.switchModeBtn,
              { borderColor: theme.colors.borderLight },
            ]}
          >
            <Typography
              variant="caption"
              weight="semibold"
              style={{ color: theme.colors.primary }}
            >
              🏖️ Traveler
            </Typography>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={[
            styles.scrollBody,
            { paddingBottom: insets.bottom + 40 },
          ]}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={() => {
                refetchProfile();
                refetchBiz();
              }}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {/* If user hasn't activated Business Mode yet */}
          {!profile && !isProfileLoading ? (
            <GlassCard
              variant="prominent"
              padding="lg"
              style={styles.activationCard}
            >
              <View style={styles.activationHeader}>
                <View
                  style={[
                    styles.activationIconBox,
                    { backgroundColor: theme.colors.primary + '20' },
                  ]}
                >
                  <AppIcon
                    name="store"
                    size={32}
                    color={theme.colors.primary}
                  />
                </View>
                <Typography
                  variant="h2"
                  weight="bold"
                  style={{ color: theme.colors.textPrimary, marginTop: 12 }}
                >
                  Turn on Business Mode
                </Typography>
                <Typography
                  variant="body"
                  style={{
                    color: theme.colors.textSecondary,
                    textAlign: 'center',
                    marginTop: 6,
                  }}
                >
                  List your homestay, hotel, rental, cafe, or experience on
                  Wakeru and connect directly with travelers.
                </Typography>
              </View>

              <View style={styles.perksList}>
                <View style={styles.perkRow}>
                  <AppIcon
                    name="check-circle"
                    size={18}
                    color={theme.colors.success}
                  />
                  <Typography
                    variant="caption"
                    style={{ color: theme.colors.textPrimary, marginLeft: 8 }}
                  >
                    Zero setup fee • Keep 100% direct traveler revenue
                  </Typography>
                </View>
                <View style={styles.perkRow}>
                  <AppIcon
                    name="check-circle"
                    size={18}
                    color={theme.colors.success}
                  />
                  <Typography
                    variant="caption"
                    style={{ color: theme.colors.textPrimary, marginLeft: 8 }}
                  >
                    Direct WhatsApp & phone leads without intermediaries
                  </Typography>
                </View>
                <View style={styles.perkRow}>
                  <AppIcon
                    name="check-circle"
                    size={18}
                    color={theme.colors.success}
                  />
                  <Typography
                    variant="caption"
                    style={{ color: theme.colors.textPrimary, marginLeft: 8 }}
                  >
                    Seamless 1-tap switch inside your existing TripSplit account
                  </Typography>
                </View>
              </View>

              <View
                style={[
                  styles.userBadge,
                  { backgroundColor: theme.colors.elevated },
                ]}
              >
                <Typography
                  variant="caption"
                  style={{ color: theme.colors.textSecondary }}
                >
                  Activating as:{' '}
                  <Typography
                    variant="caption"
                    weight="bold"
                    style={{ color: theme.colors.textPrimary }}
                  >
                    {user?.displayName || 'Traveler'} (
                    {user?.email || 'Your account'})
                  </Typography>
                </Typography>
              </View>

              <Button
                title={
                  activateBusinessMode.isPending
                    ? 'Activating...'
                    : 'Activate Business Mode (1-Tap)'
                }
                onPress={handleActivate}
                variant="primary"
                loading={activateBusinessMode.isPending}
                style={{ marginTop: 16 }}
              />
            </GlassCard>
          ) : (
            <>
              {/* Vendor Status Card */}
              <GlassCard
                variant="prominent"
                padding="md"
                style={styles.profileCard}
              >
                <View style={styles.rowBetween}>
                  <View>
                    <Typography
                      variant="body"
                      weight="bold"
                      style={{ color: theme.colors.textPrimary }}
                    >
                      {profile?.name ||
                        user?.displayName ||
                        'Local Merchant Partner'}
                    </Typography>
                    <Typography
                      variant="caption"
                      style={{
                        color: theme.colors.textSecondary,
                        marginTop: 2,
                      }}
                    >
                      {profile?.email || user?.email || 'vendor@wakeru.local'}
                    </Typography>
                  </View>
                  <Badge
                    label={profile?.status || 'ACTIVE'}
                    variant="verified"
                  />
                </View>
              </GlassCard>

              {/* Quick Stats Grid */}
              <View style={styles.statsGrid}>
                <GlassCard variant="subtle" padding="md" style={styles.statBox}>
                  <Typography
                    variant="caption"
                    style={{ color: theme.colors.textTertiary }}
                  >
                    Listings
                  </Typography>
                  <Typography
                    variant="h2"
                    weight="bold"
                    style={{ color: theme.colors.primary, marginTop: 4 }}
                  >
                    {businesses.length}
                  </Typography>
                </GlassCard>

                <GlassCard variant="subtle" padding="md" style={styles.statBox}>
                  <Typography
                    variant="caption"
                    style={{ color: theme.colors.textTertiary }}
                  >
                    Verified
                  </Typography>
                  <Typography
                    variant="h2"
                    weight="bold"
                    style={{ color: theme.colors.success, marginTop: 4 }}
                  >
                    {
                      businesses.filter(
                        (b: any) => b.verificationStatus === 'VERIFIED',
                      ).length
                    }
                  </Typography>
                </GlassCard>
              </View>

              {/* Managed Listings Section */}
              <View style={styles.sectionHeader}>
                <Typography
                  variant="body"
                  weight="bold"
                  style={{ color: theme.colors.textPrimary }}
                >
                  Your Businesses
                </Typography>
                <TouchableOpacity
                  onPress={() =>
                    router.push('/(app)/vendor/business/create' as any)
                  }
                >
                  <Typography
                    variant="caption"
                    weight="bold"
                    style={{ color: theme.colors.primary }}
                  >
                    + Add Business
                  </Typography>
                </TouchableOpacity>
              </View>

              {businesses.length === 0 && !isLoading ? (
                <EmptyState
                  icon="store"
                  title="No businesses listed yet"
                  description="Register your hotel, rental, or activity to reach travelers on Wakeru."
                  actionLabel="Create Business Listing"
                  onAction={() =>
                    router.push('/(app)/vendor/business/create' as any)
                  }
                />
              ) : (
                businesses.map((b: any) => (
                  <TouchableOpacity
                    key={b.id}
                    onPress={() =>
                      router.push(`/(app)/vendor/business/${b.id}` as any)
                    }
                    activeOpacity={0.85}
                  >
                    <GlassCard
                      variant="subtle"
                      padding="md"
                      style={styles.businessCard}
                    >
                      <View style={styles.rowBetween}>
                        <Typography
                          variant="body"
                          weight="bold"
                          style={{ color: theme.colors.textPrimary }}
                        >
                          {b.businessName}
                        </Typography>
                        <Badge
                          label={b.verificationStatus}
                          variant={
                            b.verificationStatus === 'VERIFIED'
                              ? 'verified'
                              : 'warning'
                          }
                        />
                      </View>
                      <Typography
                        variant="caption"
                        style={{
                          color: theme.colors.textSecondary,
                          marginTop: 4,
                        }}
                      >
                        📍 {b.city}, {b.category}
                      </Typography>

                      <View
                        style={[
                          styles.cardFooter,
                          { borderTopColor: theme.colors.borderLight },
                        ]}
                      >
                        <Typography
                          variant="caption"
                          weight="semibold"
                          style={{ color: theme.colors.primary }}
                        >
                          Manage Dashboard →
                        </Typography>
                      </View>
                    </GlassCard>
                  </TouchableOpacity>
                ))
              )}
            </>
          )}
        </ScrollView>
      </View>
    </GlobalBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  backBtn: {
    padding: 6,
  },
  switchModeBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  content: {
    flex: 1,
  },
  scrollBody: {
    paddingHorizontal: 16,
  },
  activationCard: {
    borderRadius: 24,
    marginTop: 10,
  },
  activationHeader: {
    alignItems: 'center',
  },
  activationIconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  perksList: {
    marginVertical: 18,
    gap: 10,
  },
  perkRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userBadge: {
    padding: 10,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 8,
  },
  profileCard: {
    borderRadius: 20,
    marginBottom: 12,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    borderRadius: 16,
    alignItems: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  businessCard: {
    borderRadius: 16,
    marginBottom: 12,
  },
  cardFooter: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
});

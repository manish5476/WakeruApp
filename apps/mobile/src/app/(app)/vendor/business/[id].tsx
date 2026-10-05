import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { useTheme } from '../../../../providers/ThemeProvider';
import { Typography } from '../../../../components/ui/Typography';
import { GlassCard } from '../../../../components/ui/GlassCard';
import { Badge } from '../../../../components/ui/Badge';
import { Button } from '../../../../components/ui/Button';
import { GlobalBackground } from '../../../../components/ui/GlobalBackground';
import GlobalLoader from '../../../../components/common/GlobalLoader';
import AppIcon from '../../../../components/common/AppIcon';
import { BookingCard } from '../../../../components/local';
import {
  useVendorBusinessDetail,
  useVendorOverview,
  useVendorCompleteness,
  useVendorBookingRequests,
  useVendorReservations,
  useVendorLeads,
  useUpdateBookingRequestStatus,
  useCompleteReservation,
} from '../../../../hooks/useLocal';

export default function VendorBusinessManageScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const [activeTab, setActiveTab] = useState<
    'OVERVIEW' | 'BOOKINGS' | 'RESERVATIONS' | 'LEADS'
  >('OVERVIEW');

  const { data: business, isLoading: isLoadingBusiness } =
    useVendorBusinessDetail(id);
  const { data: overview } = useVendorOverview(id);
  const { data: completeness } = useVendorCompleteness(id);
  const { data: bookingRequests = [], refetch: refetchBookings } =
    useVendorBookingRequests(id);
  const { data: reservations = [], refetch: refetchReservations } =
    useVendorReservations(id);
  const { data: leads = [] } = useVendorLeads(id);

  const updateBookingMutation = useUpdateBookingRequestStatus();
  const completeReservationMutation = useCompleteReservation();

  if (isLoadingBusiness || !business) {
    return <GlobalLoader message="Loading business portal..." />;
  }

  const handleBookingAction = async (
    requestId: string,
    status: 'ACCEPTED' | 'DECLINED',
  ) => {
    try {
      await updateBookingMutation.mutateAsync({ requestId, status });
      refetchBookings();
      refetchReservations();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Action failed.');
    }
  };

  const handleCompleteReservation = async (reservationId: string) => {
    try {
      await completeReservationMutation.mutateAsync(reservationId);
      refetchReservations();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to complete.');
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
              {business.businessName}
            </Typography>
            <Typography
              variant="caption"
              style={{ color: theme.colors.textSecondary }}
            >
              Vendor Operations & CRM Hub
            </Typography>
          </View>
        </View>

        {/* Tab Selector */}
        <View style={styles.tabsRow}>
          {(['OVERVIEW', 'BOOKINGS', 'RESERVATIONS', 'LEADS'] as const).map(
            tab => {
              const isSelected = activeTab === tab;
              return (
                <TouchableOpacity
                  key={tab}
                  onPress={() => setActiveTab(tab)}
                  style={[
                    styles.tabChip,
                    {
                      backgroundColor: isSelected
                        ? theme.colors.primary
                        : 'transparent',
                      borderColor: isSelected
                        ? theme.colors.primary
                        : theme.colors.borderLight,
                    },
                  ]}
                >
                  <Typography
                    variant="caption"
                    weight={isSelected ? 'bold' : 'normal'}
                    style={{
                      color: isSelected
                        ? theme.colors.textInverse
                        : theme.colors.textSecondary,
                    }}
                  >
                    {tab.charAt(0) + tab.slice(1).toLowerCase()}
                  </Typography>
                </TouchableOpacity>
              );
            },
          )}
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={[
            styles.scrollBody,
            { paddingBottom: insets.bottom + 40 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {activeTab === 'OVERVIEW' && (
            <View style={{ gap: 12 }}>
              {/* Profile Completeness Card */}
              {completeness && (
                <GlassCard variant="prominent" padding="md" style={styles.card}>
                  <View style={styles.rowBetween}>
                    <Typography
                      variant="body"
                      weight="bold"
                      style={{ color: theme.colors.textPrimary }}
                    >
                      Listing Quality Score
                    </Typography>
                    <Typography
                      variant="body"
                      weight="bold"
                      style={{ color: theme.colors.primary }}
                    >
                      {completeness.score}%
                    </Typography>
                  </View>
                  <Typography
                    variant="caption"
                    style={{ color: theme.colors.textSecondary, marginTop: 4 }}
                  >
                    {completeness.missingFields?.length > 0
                      ? `Missing: ${completeness.missingFields.join(', ')}`
                      : '✓ Listing is 100% complete and optimized for discovery.'}
                  </Typography>
                </GlassCard>
              )}

              {/* Status & Category */}
              <GlassCard variant="subtle" padding="md" style={styles.card}>
                <Typography
                  variant="body"
                  weight="bold"
                  style={{ color: theme.colors.textPrimary, marginBottom: 8 }}
                >
                  Business Details
                </Typography>
                <View style={styles.infoRow}>
                  <Typography
                    variant="caption"
                    style={{ color: theme.colors.textSecondary }}
                  >
                    Category:
                  </Typography>
                  <Badge label={business.category} variant="primary" />
                </View>
                <View style={styles.infoRow}>
                  <Typography
                    variant="caption"
                    style={{ color: theme.colors.textSecondary }}
                  >
                    Verification:
                  </Typography>
                  <Badge
                    label={business.verificationStatus}
                    variant={
                      business.verificationStatus === 'VERIFIED'
                        ? 'verified'
                        : 'warning'
                    }
                  />
                </View>
                <View style={styles.infoRow}>
                  <Typography
                    variant="caption"
                    style={{ color: theme.colors.textSecondary }}
                  >
                    City:
                  </Typography>
                  <Typography
                    variant="caption"
                    weight="bold"
                    style={{ color: theme.colors.textPrimary }}
                  >
                    {business.city}, {business.country}
                  </Typography>
                </View>
              </GlassCard>
            </View>
          )}

          {activeTab === 'BOOKINGS' && (
            <View style={{ gap: 8 }}>
              {bookingRequests.length === 0 ? (
                <Typography
                  variant="caption"
                  style={{
                    color: theme.colors.textTertiary,
                    textAlign: 'center',
                    marginTop: 30,
                  }}
                >
                  No pending booking requests from travelers.
                </Typography>
              ) : (
                bookingRequests.map((req: any) => (
                  <GlassCard
                    key={req.id}
                    variant="subtle"
                    padding="md"
                    style={styles.card}
                  >
                    <BookingCard booking={req} onPress={() => {}} isVendor />
                    {req.status === 'REQUESTED' && (
                      <View style={styles.actionRow}>
                        <Button
                          title="Decline"
                          variant="danger"
                          size="sm"
                          onPress={() =>
                            handleBookingAction(req.id, 'DECLINED')
                          }
                          style={{ flex: 1 }}
                        />
                        <Button
                          title="Accept Request"
                          variant="primary"
                          size="sm"
                          onPress={() =>
                            handleBookingAction(req.id, 'ACCEPTED')
                          }
                          style={{ flex: 1 }}
                        />
                      </View>
                    )}
                  </GlassCard>
                ))
              )}
            </View>
          )}

          {activeTab === 'RESERVATIONS' && (
            <View style={{ gap: 8 }}>
              {reservations.length === 0 ? (
                <Typography
                  variant="caption"
                  style={{
                    color: theme.colors.textTertiary,
                    textAlign: 'center',
                    marginTop: 30,
                  }}
                >
                  No confirmed reservations currently active.
                </Typography>
              ) : (
                reservations.map((res: any) => (
                  <GlassCard
                    key={res.id}
                    variant="subtle"
                    padding="md"
                    style={styles.card}
                  >
                    <View style={styles.rowBetween}>
                      <Typography
                        variant="body"
                        weight="bold"
                        style={{ color: theme.colors.textPrimary }}
                      >
                        Ref #{res.bookingReference || res.id.slice(0, 8)}
                      </Typography>
                      <Badge
                        label={res.status}
                        variant={
                          res.status === 'COMPLETED' ? 'success' : 'verified'
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
                      Date: {res.bookingDate}{' '}
                      {res.serviceName ? `· ${res.serviceName}` : ''}
                    </Typography>

                    {res.status === 'CONFIRMED' && (
                      <Button
                        title="Mark Experience Completed"
                        variant="primary"
                        size="sm"
                        onPress={() => handleCompleteReservation(res.id)}
                        style={{ marginTop: 10 }}
                      />
                    )}
                  </GlassCard>
                ))
              )}
            </View>
          )}

          {activeTab === 'LEADS' && (
            <View style={{ gap: 8 }}>
              {leads.length === 0 ? (
                <Typography
                  variant="caption"
                  style={{
                    color: theme.colors.textTertiary,
                    textAlign: 'center',
                    marginTop: 30,
                  }}
                >
                  No customer interaction leads recorded yet.
                </Typography>
              ) : (
                leads.map((lead: any) => (
                  <GlassCard
                    key={lead.id}
                    variant="subtle"
                    padding="md"
                    style={styles.card}
                  >
                    <View style={styles.rowBetween}>
                      <Badge
                        label={lead.interactionType.toUpperCase()}
                        variant="info"
                      />
                      <Typography
                        variant="caption"
                        style={{ color: theme.colors.textTertiary }}
                      >
                        {new Date(lead.createdAt).toLocaleDateString()}
                      </Typography>
                    </View>
                    <Typography
                      variant="caption"
                      style={{
                        color: theme.colors.textSecondary,
                        marginTop: 6,
                      }}
                    >
                      Contact:{' '}
                      {lead.travelerPhone ||
                        lead.travelerEmail ||
                        'Anonymous Traveler'}
                    </Typography>
                  </GlassCard>
                ))
              )}
            </View>
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
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 12,
  },
  tabChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  content: {
    flex: 1,
  },
  scrollBody: {
    paddingHorizontal: 16,
  },
  card: {
    borderRadius: 16,
    marginBottom: 10,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
});

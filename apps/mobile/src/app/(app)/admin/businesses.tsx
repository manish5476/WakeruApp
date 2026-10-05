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
import { router } from 'expo-router';
import { useTheme } from '../../../providers/ThemeProvider';
import { Typography } from '../../../components/ui/Typography';
import { GlassCard } from '../../../components/ui/GlassCard';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { GlobalBackground } from '../../../components/ui/GlobalBackground';
import AppIcon from '../../../components/common/AppIcon';
import {
  useAdminBusinesses,
  useAdminMediaQueue,
  useAdminVendors,
  useVerifyBusiness,
  useReviewMedia,
  useSuspendVendor,
} from '../../../hooks/useLocal';

export default function AdminPortalScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const [activeTab, setActiveTab] = useState<'VERIFY' | 'MEDIA' | 'VENDORS'>(
    'VERIFY',
  );

  const { data: businesses = [], refetch: refetchBiz } = useAdminBusinesses(1);
  const { data: mediaQueue = [], refetch: refetchMedia } = useAdminMediaQueue();
  const { data: vendors = [], refetch: refetchVendors } = useAdminVendors(1);

  const verifyMutation = useVerifyBusiness();
  const reviewMediaMutation = useReviewMedia();
  const suspendVendorMutation = useSuspendVendor();

  const handleVerify = async (id: string, status: 'VERIFIED' | 'REJECTED') => {
    try {
      await verifyMutation.mutateAsync({ id, status });
      refetchBiz();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Verification update failed.');
    }
  };

  const handleReviewMedia = async (
    id: string,
    status: 'APPROVED' | 'REJECTED',
  ) => {
    try {
      await reviewMediaMutation.mutateAsync({ id, status });
      refetchMedia();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Media moderation failed.');
    }
  };

  const handleSuspendVendor = async (id: string) => {
    try {
      await suspendVendorMutation.mutateAsync(id);
      refetchVendors();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Vendor suspension failed.');
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
              Admin Operations
            </Typography>
            <Typography
              variant="caption"
              style={{ color: theme.colors.textSecondary }}
            >
              Trust, verification & marketplace integrity
            </Typography>
          </View>
        </View>

        {/* Tab Selector */}
        <View style={styles.tabsRow}>
          {(['VERIFY', 'MEDIA', 'VENDORS'] as const).map(tab => {
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
                  {tab === 'VERIFY'
                    ? 'Businesses'
                    : tab === 'MEDIA'
                      ? 'Media Queue'
                      : 'Vendors'}
                </Typography>
              </TouchableOpacity>
            );
          })}
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={[
            styles.scrollBody,
            { paddingBottom: insets.bottom + 40 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {activeTab === 'VERIFY' && (
            <View style={{ gap: 10 }}>
              {businesses.length === 0 ? (
                <Typography
                  variant="caption"
                  style={{
                    color: theme.colors.textTertiary,
                    textAlign: 'center',
                    marginTop: 30,
                  }}
                >
                  No pending business verifications.
                </Typography>
              ) : (
                businesses.map(b => (
                  <GlassCard
                    key={b.id}
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
                      Category: {b.category} · City: {b.city}
                    </Typography>

                    {b.verificationStatus !== 'VERIFIED' && (
                      <View style={styles.actionRow}>
                        <Button
                          title="Reject"
                          variant="danger"
                          size="sm"
                          onPress={() => handleVerify(b.id, 'REJECTED')}
                          style={{ flex: 1 }}
                        />
                        <Button
                          title="Verify Business"
                          variant="primary"
                          size="sm"
                          onPress={() => handleVerify(b.id, 'VERIFIED')}
                          style={{ flex: 1 }}
                        />
                      </View>
                    )}
                  </GlassCard>
                ))
              )}
            </View>
          )}

          {activeTab === 'MEDIA' && (
            <View style={{ gap: 10 }}>
              {mediaQueue.length === 0 ? (
                <Typography
                  variant="caption"
                  style={{
                    color: theme.colors.textTertiary,
                    textAlign: 'center',
                    marginTop: 30,
                  }}
                >
                  Media queue clean. All uploads reviewed!
                </Typography>
              ) : (
                mediaQueue.map(m => (
                  <GlassCard
                    key={m.id}
                    variant="subtle"
                    padding="md"
                    style={styles.card}
                  >
                    <View style={styles.rowBetween}>
                      <Typography
                        variant="caption"
                        style={{ color: theme.colors.textSecondary }}
                      >
                        Type: {m.mediaType}
                      </Typography>
                      <Badge label={m.moderationStatus} variant="warning" />
                    </View>
                    <Typography
                      variant="caption"
                      numberOfLines={1}
                      style={{ color: theme.colors.textTertiary, marginTop: 4 }}
                    >
                      URL: {m.url}
                    </Typography>

                    <View style={styles.actionRow}>
                      <Button
                        title="Reject / Hide"
                        variant="danger"
                        size="sm"
                        onPress={() => handleReviewMedia(m.id, 'REJECTED')}
                        style={{ flex: 1 }}
                      />
                      <Button
                        title="Approve Media"
                        variant="primary"
                        size="sm"
                        onPress={() => handleReviewMedia(m.id, 'APPROVED')}
                        style={{ flex: 1 }}
                      />
                    </View>
                  </GlassCard>
                ))
              )}
            </View>
          )}

          {activeTab === 'VENDORS' && (
            <View style={{ gap: 10 }}>
              {vendors.length === 0 ? (
                <Typography
                  variant="caption"
                  style={{
                    color: theme.colors.textTertiary,
                    textAlign: 'center',
                    marginTop: 30,
                  }}
                >
                  No registered vendor profiles found.
                </Typography>
              ) : (
                vendors.map(v => (
                  <GlassCard
                    key={v.id}
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
                        {v.name}
                      </Typography>
                      <Badge
                        label={v.status}
                        variant={v.status === 'ACTIVE' ? 'verified' : 'danger'}
                      />
                    </View>
                    <Typography
                      variant="caption"
                      style={{
                        color: theme.colors.textSecondary,
                        marginTop: 4,
                      }}
                    >
                      {v.email}
                    </Typography>

                    {v.status === 'ACTIVE' && (
                      <Button
                        title="Suspend Merchant"
                        variant="danger"
                        size="sm"
                        onPress={() => handleSuspendVendor(v.id)}
                        style={{ marginTop: 10 }}
                      />
                    )}
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
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
});

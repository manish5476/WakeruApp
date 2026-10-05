import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Linking,
  Platform,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { useTheme } from '../../../../providers/ThemeProvider';
import { Typography } from '../../../../components/ui/Typography';
import { Button } from '../../../../components/ui/Button';
import { Badge } from '../../../../components/ui/Badge';
import { GlassCard } from '../../../../components/ui/GlassCard';
import { GlobalBackground } from '../../../../components/ui/GlobalBackground';
import GlobalLoader from '../../../../components/common/GlobalLoader';
import AppIcon from '../../../../components/common/AppIcon';
import {
  BookingRequestModal,
  CreateReviewModal,
  ReportBusinessModal,
} from '../../../../components/local';
import {
  useBusinessDetail,
  useBusinessServices,
  useBusinessOffers,
  useBusinessReviews,
  useReviewsSummary,
  useRecordInteraction,
} from '../../../../hooks/useLocal';
import { formatAmount } from '../../../../utils/formatters';

export default function BusinessDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const recordInteraction = useRecordInteraction();

  const [bookingModalVisible, setBookingModalVisible] = useState(false);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [reportModalVisible, setReportModalVisible] = useState(false);

  const { data: business, isLoading: isLoadingBusiness } =
    useBusinessDetail(id);
  const { data: services = [] } = useBusinessServices(id);
  const { data: offers = [] } = useBusinessOffers(id);
  const { data: reviews = [] } = useBusinessReviews(id);
  const { data: summary } = useReviewsSummary(id);

  if (isLoadingBusiness || !business) {
    return <GlobalLoader message="Loading business details..." />;
  }

  const handleCall = () => {
    if (business.phone) {
      recordInteraction.mutate({ id: business.id, type: 'call' });
      Linking.openURL(`tel:${business.phone}`);
    } else {
      Alert.alert('Notice', 'Phone number not provided.');
    }
  };

  const handleWhatsApp = () => {
    if (business.whatsapp || business.phone) {
      recordInteraction.mutate({ id: business.id, type: 'whatsapp' });
      const num = business.whatsapp || business.phone;
      Linking.openURL(`https://wa.me/${num?.replace(/[^0-9]/g, '')}`);
    } else {
      Alert.alert('Notice', 'WhatsApp contact not available.');
    }
  };

  const handleDirections = () => {
    recordInteraction.mutate({ id: business.id, type: 'directions' });
    const query = encodeURIComponent(
      `${business.businessName}, ${business.address}, ${business.city}`,
    );
    Linking.openURL(`https://maps.google.com/?q=${query}`);
  };

  const coverUrl =
    business.media?.find(m => m.mediaType === 'cover')?.url ||
    business.media?.[0]?.url;

  return (
    <GlobalBackground>
      <View style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.content,
            { paddingBottom: insets.bottom + 90 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Image Gallery */}
          <View style={styles.imageGallery}>
            <Image
              source={{
                uri:
                  coverUrl ||
                  'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200',
              }}
              style={styles.mainImage}
              resizeMode="cover"
            />
            {/* Top Back & Report floating buttons */}
            <View
              style={[
                styles.topBar,
                { top: insets.top + (Platform.OS === 'web' ? 12 : 6) },
              ]}
            >
              <TouchableOpacity
                onPress={() => router.back()}
                style={styles.circleBtn}
              >
                <AppIcon name="arrow-left" size={18} color="#000" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setReportModalVisible(true)}
                style={styles.circleBtn}
              >
                <AppIcon name="flag" size={16} color="#DC2626" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Business Core Info */}
          <View style={styles.sectionPadding}>
            <View style={styles.badgeRow}>
              {business.isSponsored && (
                <Badge label="Sponsored Visibility" variant="sponsored" />
              )}
              {business.verificationStatus === 'VERIFIED' && (
                <Badge label="✓ Verified Business" variant="verified" />
              )}
              <Badge label={business.category} variant="primary" />
            </View>

            <Typography
              variant="h2"
              weight="bold"
              style={{ color: theme.colors.textPrimary, marginTop: 8 }}
            >
              {business.businessName}
            </Typography>

            <Typography
              variant="caption"
              style={{ color: theme.colors.textSecondary, marginTop: 4 }}
            >
              📍 {business.address}, {business.city}, {business.country}
            </Typography>

            {/* Rating Summary Banner */}
            {business.rating !== undefined && (
              <View
                style={[
                  styles.ratingBanner,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                  },
                ]}
              >
                <View style={styles.ratingNumber}>
                  <Typography
                    variant="h2"
                    weight="bold"
                    style={{ color: '#F59E0B' }}
                  >
                    {business.rating.toFixed(1)}
                  </Typography>
                  <AppIcon name="star" size={20} color="#F59E0B" />
                </View>
                <View style={styles.ratingStats}>
                  <Typography
                    variant="body"
                    weight="semibold"
                    style={{ color: theme.colors.textPrimary }}
                  >
                    {business.reviewCount || 0} Authenticated Reviews
                  </Typography>
                  <Typography
                    variant="caption"
                    style={{ color: theme.colors.textTertiary }}
                  >
                    Reviews backed by confirmed reservations & community checks
                  </Typography>
                </View>
              </View>
            )}

            {/* Description */}
            {business.description && (
              <View style={styles.block}>
                <Typography
                  variant="body"
                  weight="bold"
                  style={{ color: theme.colors.textPrimary, marginBottom: 6 }}
                >
                  About
                </Typography>
                <Typography
                  variant="body"
                  style={{ color: theme.colors.textSecondary, lineHeight: 22 }}
                >
                  {business.description}
                </Typography>
              </View>
            )}

            {/* Active Offers */}
            {offers.length > 0 && (
              <View style={styles.block}>
                <Typography
                  variant="body"
                  weight="bold"
                  style={{ color: theme.colors.textPrimary, marginBottom: 10 }}
                >
                  Active Deals & Offers
                </Typography>
                {offers.map(offer => (
                  <GlassCard
                    key={offer.id}
                    variant="prominent"
                    padding="md"
                    style={styles.offerCard}
                  >
                    <View style={styles.offerHeader}>
                      <Badge label="SPECIAL OFFER" variant="warning" />
                      <Typography
                        variant="caption"
                        style={{ color: theme.colors.textTertiary }}
                      >
                        Valid: {offer.endAt?.split('T')[0] || 'Ongoing'}
                      </Typography>
                    </View>
                    <Typography
                      variant="body"
                      weight="bold"
                      style={{ color: theme.colors.textPrimary, marginTop: 6 }}
                    >
                      {offer.title}
                    </Typography>
                    {offer.description && (
                      <Typography
                        variant="caption"
                        style={{
                          color: theme.colors.textSecondary,
                          marginTop: 2,
                        }}
                      >
                        {offer.description}
                      </Typography>
                    )}
                  </GlassCard>
                ))}
              </View>
            )}

            {/* Services & Menus */}
            {services.length > 0 && (
              <View style={styles.block}>
                <Typography
                  variant="body"
                  weight="bold"
                  style={{ color: theme.colors.textPrimary, marginBottom: 10 }}
                >
                  Services & Pricing
                </Typography>
                {services.map(svc => (
                  <View
                    key={svc.id}
                    style={[
                      styles.serviceRow,
                      { borderColor: theme.colors.borderLight },
                    ]}
                  >
                    <View style={{ flex: 1 }}>
                      <Typography
                        variant="body"
                        weight="semibold"
                        style={{ color: theme.colors.textPrimary }}
                      >
                        {svc.name}
                      </Typography>
                      {svc.description && (
                        <Typography
                          variant="caption"
                          style={{
                            color: theme.colors.textSecondary,
                            marginTop: 2,
                          }}
                        >
                          {svc.description}
                        </Typography>
                      )}
                    </View>
                    <Typography
                      variant="body"
                      weight="bold"
                      style={{ color: theme.colors.primary, marginLeft: 12 }}
                    >
                      {formatAmount(svc.priceMinor / 100, svc.currency)}
                    </Typography>
                  </View>
                ))}
              </View>
            )}

            {/* Traveler Reviews Section */}
            <View style={styles.block}>
              <View style={styles.reviewsHeader}>
                <Typography
                  variant="body"
                  weight="bold"
                  style={{ color: theme.colors.textPrimary }}
                >
                  Traveler Reviews ({reviews.length})
                </Typography>
                <TouchableOpacity onPress={() => setReviewModalVisible(true)}>
                  <Typography
                    variant="caption"
                    weight="bold"
                    style={{ color: theme.colors.primary }}
                  >
                    + Write Review
                  </Typography>
                </TouchableOpacity>
              </View>

              {reviews.length === 0 ? (
                <Typography
                  variant="caption"
                  style={{
                    color: theme.colors.textTertiary,
                    fontStyle: 'italic',
                    marginTop: 8,
                  }}
                >
                  No reviews yet. Be the first verified traveler to leave
                  feedback!
                </Typography>
              ) : (
                reviews.map(rev => (
                  <View
                    key={rev.id}
                    style={[
                      styles.reviewCard,
                      {
                        backgroundColor: theme.colors.surface,
                        borderColor: theme.colors.borderLight,
                      },
                    ]}
                  >
                    <View style={styles.reviewCardHeader}>
                      <View style={styles.ratingRow}>
                        <AppIcon name="star" size={14} color="#F59E0B" />
                        <Typography
                          variant="caption"
                          weight="bold"
                          style={{
                            color: theme.colors.textPrimary,
                            marginLeft: 4,
                          }}
                        >
                          {rev.rating} / 5
                        </Typography>
                      </View>
                      <Badge
                        label={
                          rev.provenance === 'VERIFIED_BOOKING'
                            ? '✓ Verified Stay'
                            : 'Direct'
                        }
                        variant={
                          rev.provenance === 'VERIFIED_BOOKING'
                            ? 'verified'
                            : 'neutral'
                        }
                      />
                    </View>

                    {rev.comment && (
                      <Typography
                        variant="body"
                        style={{
                          color: theme.colors.textSecondary,
                          marginTop: 8,
                          fontSize: 13,
                          lineHeight: 19,
                        }}
                      >
                        {rev.comment}
                      </Typography>
                    )}

                    {rev.vendorReply && (
                      <View
                        style={[
                          styles.vendorReplyBox,
                          { backgroundColor: theme.colors.borderLight },
                        ]}
                      >
                        <Typography
                          variant="caption"
                          weight="bold"
                          style={{ color: theme.colors.textPrimary }}
                        >
                          Vendor Response:
                        </Typography>
                        <Typography
                          variant="caption"
                          style={{
                            color: theme.colors.textSecondary,
                            marginTop: 2,
                          }}
                        >
                          {rev.vendorReply}
                        </Typography>
                      </View>
                    )}
                  </View>
                ))
              )}
            </View>
          </View>
        </ScrollView>

        {/* Sticky Mobile Bottom Bar: Call, WhatsApp, Directions, Request Booking */}
        <View
          style={[
            styles.bottomBar,
            {
              paddingBottom: insets.bottom + 8,
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <View style={styles.quickActions}>
            <TouchableOpacity
              onPress={handleCall}
              style={[styles.actionBtn, { borderColor: theme.colors.border }]}
            >
              <AppIcon
                name="phone"
                size={18}
                color={theme.colors.textPrimary}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleWhatsApp}
              style={[styles.actionBtn, { borderColor: theme.colors.border }]}
            >
              <AppIcon name="message-circle" size={18} color="#10B981" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleDirections}
              style={[styles.actionBtn, { borderColor: theme.colors.border }]}
            >
              <AppIcon
                name="navigation"
                size={18}
                color={theme.colors.textPrimary}
              />
            </TouchableOpacity>
          </View>

          <Button
            title="Request Booking"
            variant="primary"
            size="md"
            onPress={() => setBookingModalVisible(true)}
            style={{ flex: 1 }}
          />
        </View>

        {/* Modals */}
        <BookingRequestModal
          visible={bookingModalVisible}
          onClose={() => setBookingModalVisible(false)}
          business={business}
          services={services}
        />
        <CreateReviewModal
          visible={reviewModalVisible}
          onClose={() => setReviewModalVisible(false)}
          businessId={business.id}
        />
        <ReportBusinessModal
          visible={reportModalVisible}
          onClose={() => setReportModalVisible(false)}
          businessId={business.id}
        />
      </View>
    </GlobalBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {},
  imageGallery: {
    width: '100%',
    height: 250,
    position: 'relative',
  },
  mainImage: {
    width: '100%',
    height: '100%',
  },
  topBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  circleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionPadding: {
    padding: 16,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  ratingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 14,
    gap: 12,
  },
  ratingNumber: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingStats: {
    flex: 1,
  },
  block: {
    marginTop: 20,
  },
  offerCard: {
    borderRadius: 14,
    marginBottom: 8,
  },
  offerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  serviceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  reviewsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  reviewCard: {
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
  },
  reviewCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vendorReplyBox: {
    marginTop: 8,
    padding: 8,
    borderRadius: 8,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 10,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    gap: 12,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

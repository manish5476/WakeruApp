// components/trips/planner/BookingCards.tsx
import React, { ReactNode } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  Platform,
  ViewStyle,
  StyleProp,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useTheme } from '../../../providers/ThemeProvider';
import {
  IFlightDetail,
  IAccommodationDetail,
  ITransportDetail,
} from '../../../types/travelPlan.types';
import AppIcon from '../../common/AppIcon';
import { format } from 'date-fns';
import { spacing, borderRadius, Theme } from '../../../theme';

// --- Helpers ---
function formatSafeTime(timeStr?: string): string {
  if (!timeStr) return '--:--';
  if (timeStr.includes('T')) {
    try {
      const d = new Date(timeStr);
      if (!isNaN(d.getTime())) return format(d, 'hh:mm a');
    } catch {}
  }
  if (timeStr.match(/^\d{1,2}:\d{2}$/)) {
    const [h, m] = timeStr.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${m < 10 ? '0' + m : m} ${ampm}`;
  }
  return timeStr;
}

function formatSafeDate(dateStr?: string): string {
  if (!dateStr) return '--';
  try {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) return format(d, 'EEE, MMM d');
  } catch {}
  return dateStr;
}

function formatDisplayDate(dateStr?: string): string {
  if (!dateStr) return '--';
  try {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) return format(d, 'MMM d, yyyy');
  } catch {}
  return dateStr;
}

const HOTEL_IMAGES = [
  'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=90',
  'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=1200&q=90',
  'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1200&q=90',
  'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=90',
  'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=90',
];

// ============================================================
// PREMIUM FLIGHT CARD - Boarding Pass Style
// ============================================================
export function FlightCard({
  flight,
  onEdit,
  onDelete,
}: {
  flight: IFlightDetail;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const theme = useTheme();
  const flightTime = formatSafeTime(flight.time);
  const flightDate = formatSafeDate(flight.date);
  const fullDate = formatDisplayDate(flight.date);

  const fromCode = (flight.from || 'DEL').substring(0, 3).toUpperCase();
  const toCode = (flight.to || 'BOM').substring(0, 3).toUpperCase();

  return (
    <View style={styles.flightCardContainer}>
      {/* Premium Gradient Background */}
      <LinearGradient
        colors={
          theme.isDark
            ? [
                'rgba(212, 160, 60, 0.15)',
                'rgba(6, 182, 212, 0.08)',
                'transparent',
              ]
            : [
                'rgba(212, 160, 60, 0.08)',
                'rgba(6, 182, 212, 0.04)',
                'transparent',
              ]
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.flightCardGradient}
      />

      {/* Glass Card Container */}
      <View
        style={[
          styles.flightCard,
          {
            backgroundColor: theme.colors.card,
            borderColor: theme.isDark
              ? 'rgba(255,255,255,0.08)'
              : 'rgba(0,0,0,0.04)',
          },
          theme.shadows.lg,
        ]}
      >
        {/* Header with Glass Effect */}
        <View style={styles.flightHeader}>
          <BlurView
            intensity={theme.isDark ? 20 : 40}
            tint={theme.isDark ? 'dark' : 'light'}
            style={styles.flightHeaderBlur}
          >
            <View style={styles.flightHeaderContent}>
              <View style={styles.flightHeaderLeft}>
                <View
                  style={[
                    styles.airlineIconBadge,
                    {
                      backgroundColor: `${theme.colors.info}15`,
                      borderColor: `${theme.colors.info}30`,
                    },
                  ]}
                >
                  <AppIcon
                    name="airplane"
                    size={16}
                    color={theme.colors.info}
                  />
                </View>
                <View>
                  <Text
                    style={[
                      styles.airlineName,
                      { color: theme.colors.textPrimary },
                    ]}
                    numberOfLines={1}
                  >
                    {flight.airline || 'Premium Airlines'}
                  </Text>
                  <Text
                    style={[
                      styles.flightNumber,
                      { color: theme.colors.textTertiary },
                    ]}
                  >
                    {flight.flightNo || 'Flight 1212'}
                  </Text>
                </View>
              </View>
              <View style={styles.flightHeaderRight}>
                <View
                  style={[
                    styles.confirmedBadge,
                    {
                      backgroundColor: theme.colors.successBg,
                      borderColor: theme.colors.successBorder,
                    },
                  ]}
                >
                  <AppIcon
                    name="checkmark-circle"
                    size={12}
                    color={theme.colors.success}
                  />
                  <Text
                    style={[
                      styles.confirmedText,
                      { color: theme.colors.success },
                    ]}
                  >
                    CONFIRMED
                  </Text>
                </View>
                <View style={styles.flightActions}>
                  <Pressable style={styles.actionButton} onPress={onEdit}>
                    <AppIcon
                      name="pencil"
                      size={14}
                      color={theme.colors.textSecondary}
                    />
                  </Pressable>
                  <Pressable style={styles.actionButton} onPress={onDelete}>
                    <AppIcon
                      name="trash-2"
                      size={14}
                      color={theme.colors.danger}
                    />
                  </Pressable>
                </View>
              </View>
            </View>
          </BlurView>
        </View>

        {/* Main Flight Route - Large Bold Codes */}
        <View style={styles.flightRouteSection}>
          <View style={styles.routeCodeBlock}>
            <Text
              style={[styles.routeCode, { color: theme.colors.textPrimary }]}
            >
              {fromCode}
            </Text>
            <Text
              style={[styles.routeCity, { color: theme.colors.textSecondary }]}
              numberOfLines={1}
            >
              {flight.from || 'Departure'}
            </Text>
            <Text
              style={[styles.routeTime, { color: theme.colors.textPrimary }]}
            >
              {flightTime}
            </Text>
          </View>

          <View style={styles.routeVisual}>
            <View style={styles.routeLineContainer}>
              <View
                style={[
                  styles.routeDot,
                  { backgroundColor: theme.colors.info },
                ]}
              />
              <View
                style={[
                  styles.routeLine,
                  { backgroundColor: theme.colors.border },
                ]}
              />
            </View>
            <View
              style={[
                styles.planeIconContainer,
                {
                  backgroundColor: `${theme.colors.info}15`,
                  borderColor: `${theme.colors.info}30`,
                },
              ]}
            >
              <AppIcon name="airplane" size={18} color={theme.colors.info} />
            </View>
            <View style={styles.routeLineContainerReverse}>
              <View
                style={[
                  styles.routeLine,
                  { backgroundColor: theme.colors.border },
                ]}
              />
              <View
                style={[
                  styles.routeDot,
                  { backgroundColor: theme.colors.info },
                ]}
              />
            </View>
          </View>

          <View style={[styles.routeCodeBlock, { alignItems: 'flex-end' }]}>
            <Text
              style={[styles.routeCode, { color: theme.colors.textPrimary }]}
            >
              {toCode}
            </Text>
            <Text
              style={[styles.routeCity, { color: theme.colors.textSecondary }]}
              numberOfLines={1}
            >
              {flight.to || 'Arrival'}
            </Text>
            <Text
              style={[styles.routeTime, { color: theme.colors.textPrimary }]}
            >
              {fullDate}
            </Text>
          </View>
        </View>

        {/* Ticket Tear Line */}
        <View style={styles.ticketTearSection}>
          <View
            style={[
              styles.notch,
              { backgroundColor: theme.colors.card, left: -8 },
            ]}
          />
          <View
            style={[styles.tearLine, { borderColor: theme.colors.border }]}
          />
          <View
            style={[
              styles.notch,
              { backgroundColor: theme.colors.card, right: -8 },
            ]}
          />
        </View>

        {/* Ticket Details */}
        <View style={styles.ticketDetailsSection}>
          <View style={styles.ticketDetailsRow}>
            <View style={styles.ticketDetailItem}>
              <AppIcon
                name="calendar"
                size={14}
                color={theme.colors.textTertiary}
              />
              <Text
                style={[
                  styles.ticketDetailText,
                  { color: theme.colors.textSecondary },
                ]}
              >
                {fullDate}
              </Text>
            </View>
            <View style={styles.ticketDetailItem}>
              <AppIcon
                name="person"
                size={14}
                color={theme.colors.textTertiary}
              />
              <Text
                style={[
                  styles.ticketDetailText,
                  { color: theme.colors.textSecondary },
                ]}
              >
                Economy
              </Text>
            </View>
            {flight.cost && (
              <View
                style={[
                  styles.priceBadge,
                  {
                    backgroundColor: theme.colors.successBg,
                    borderColor: theme.colors.successBorder,
                  },
                ]}
              >
                <AppIcon
                  name="pricetag"
                  size={14}
                  color={theme.colors.success}
                />
                <Text
                  style={[styles.priceText, { color: theme.colors.success }]}
                >
                  ₹{Number(flight.cost).toLocaleString('en-IN')}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.ticketFooter}>
            <Text
              style={[styles.bookingRef, { color: theme.colors.textTertiary }]}
            >
              {flight.confirmationNo
                ? `REF: ${flight.confirmationNo.toUpperCase()}`
                : 'E-TICKET CONFIRMED'}
            </Text>
            <Pressable style={styles.boardingPassButton}>
              <AppIcon
                name="qr-code"
                size={16}
                color={theme.colors.secondary}
              />
              <Text
                style={[
                  styles.boardingPassText,
                  { color: theme.colors.secondary },
                ]}
              >
                Boarding Pass
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}

// ============================================================
// PREMIUM HOTEL CARD - Luxury Resort Style
// ============================================================
export function HotelCard({
  hotel,
  onEdit,
  onDelete,
}: {
  hotel: IAccommodationDetail;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const theme = useTheme();
  const seed = (hotel.hotelName?.length || 1) % HOTEL_IMAGES.length;
  const imageUrl = HOTEL_IMAGES[seed];
  const checkIn = formatDisplayDate(hotel.checkIn);
  const checkOut = formatDisplayDate(hotel.checkOut);

  const handleCall = () => {
    if (hotel.contact) Linking.openURL(`tel:${hotel.contact}`);
  };

  const handleDirections = () => {
    if (hotel.address) {
      Linking.openURL(
        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(hotel.address || hotel.hotelName)}`,
      );
    }
  };

  return (
    <View style={styles.hotelCardContainer}>
      <View
        style={[
          styles.hotelCard,
          { backgroundColor: theme.colors.card },
          theme.shadows.lg,
        ]}
      >
        {/* Header */}
        <View style={styles.hotelHeader}>
          <View style={styles.hotelHeaderLeft}>
            <View
              style={[
                styles.hotelIconBadge,
                {
                  backgroundColor: `${theme.colors.secondary}15`,
                  borderColor: `${theme.colors.secondary}30`,
                },
              ]}
            >
              <AppIcon
                name="business"
                size={16}
                color={theme.colors.secondary}
              />
            </View>
            <Text
              style={[
                styles.hotelHeaderTitle,
                { color: theme.colors.textPrimary },
              ]}
            >
              Hotel Booking
            </Text>
          </View>
          <View style={styles.hotelHeaderRight}>
            <View
              style={[
                styles.confirmedBadge,
                {
                  backgroundColor: theme.colors.successBg,
                  borderColor: theme.colors.successBorder,
                },
              ]}
            >
              <AppIcon
                name="checkmark-circle"
                size={12}
                color={theme.colors.success}
              />
              <Text
                style={[styles.confirmedText, { color: theme.colors.success }]}
              >
                CONFIRMED
              </Text>
            </View>
            <View style={styles.flightActions}>
              <Pressable style={styles.actionButton} onPress={onEdit}>
                <AppIcon
                  name="pencil"
                  size={14}
                  color={theme.colors.textSecondary}
                />
              </Pressable>
              <Pressable style={styles.actionButton} onPress={onDelete}>
                <AppIcon name="trash-2" size={14} color={theme.colors.danger} />
              </Pressable>
            </View>
          </View>
        </View>

        {/* Hero Image with Overlay */}
        <View style={styles.hotelImageContainer}>
          <Image
            source={{ uri: imageUrl }}
            style={styles.hotelImage}
            resizeMode="cover"
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.7)']}
            style={styles.hotelImageGradient}
          />

          {/* Floating Rating Badge */}
          <View
            style={[
              styles.ratingBadge,
              {
                backgroundColor: theme.isDark
                  ? 'rgba(0,0,0,0.8)'
                  : 'rgba(255,255,255,0.95)',
              },
            ]}
          >
            <AppIcon name="star" size={14} color={theme.colors.warning} />
            <Text
              style={[styles.ratingText, { color: theme.colors.textPrimary }]}
            >
              4.8
            </Text>
          </View>

          {/* Floating Price Tag */}
          {hotel.cost && (
            <View
              style={[
                styles.priceTag,
                {
                  backgroundColor: theme.colors.success,
                  borderColor: theme.colors.successLight,
                },
              ]}
            >
              <Text style={styles.priceTagText}>
                ₹{Number(hotel.cost).toLocaleString('en-IN')}
              </Text>
            </View>
          )}
        </View>

        {/* Hotel Details */}
        <View style={styles.hotelDetailsSection}>
          <Text
            style={[styles.hotelName, { color: theme.colors.textPrimary }]}
            numberOfLines={1}
          >
            {hotel.hotelName || 'Taj Hotels & Resorts'}
          </Text>
          <Text
            style={[styles.hotelAddress, { color: theme.colors.textSecondary }]}
            numberOfLines={2}
          >
            {hotel.address || 'Premium location'}
          </Text>

          {/* Date Range Chip */}
          <View
            style={[
              styles.dateRangeChip,
              {
                backgroundColor: theme.colors.secondaryBg,
                borderColor: `${theme.colors.secondary}30`,
              },
            ]}
          >
            <AppIcon name="calendar" size={14} color={theme.colors.secondary} />
            <Text
              style={[
                styles.dateRangeText,
                { color: theme.colors.secondaryDark },
              ]}
            >
              {checkIn} — {checkOut}
            </Text>
          </View>

          {/* Meta Info */}
          <View style={styles.hotelMetaRow}>
            {hotel.confirmationNo && (
              <View style={styles.hotelMetaItem}>
                <AppIcon
                  name="document"
                  size={14}
                  color={theme.colors.textTertiary}
                />
                <Text
                  style={[
                    styles.hotelMetaText,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  ID: {hotel.confirmationNo}
                </Text>
              </View>
            )}
            <View style={styles.hotelMetaItem}>
              <AppIcon
                name="people"
                size={14}
                color={theme.colors.textTertiary}
              />
              <Text
                style={[
                  styles.hotelMetaText,
                  { color: theme.colors.textSecondary },
                ]}
              >
                2 Guests
              </Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View
          style={[
            styles.hotelActionsSection,
            { borderTopColor: theme.colors.borderLight },
          ]}
        >
          <Pressable
            style={styles.hotelActionButton}
            onPress={handleDirections}
          >
            <View
              style={[
                styles.hotelActionIcon,
                { backgroundColor: `${theme.colors.secondary}15` },
              ]}
            >
              <AppIcon
                name="location"
                size={18}
                color={theme.colors.secondary}
              />
            </View>
            <Text
              style={[
                styles.hotelActionText,
                { color: theme.colors.textPrimary },
              ]}
            >
              Directions
            </Text>
          </Pressable>
          <View style={styles.hotelActionDivider} />
          <Pressable style={styles.hotelActionButton} onPress={handleCall}>
            <View
              style={[
                styles.hotelActionIcon,
                { backgroundColor: `${theme.colors.secondary}15` },
              ]}
            >
              <AppIcon name="call" size={18} color={theme.colors.secondary} />
            </View>
            <Text
              style={[
                styles.hotelActionText,
                { color: theme.colors.textPrimary },
              ]}
            >
              Call Hotel
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

// ============================================================
// PREMIUM TRANSPORT CARD - Route Ticket Style
// ============================================================
const TRANSPORT_ICONS: Record<string, string> = {
  train: 'train',
  bus: 'bus',
  taxi: 'car',
  ferry: 'boat',
  flight: 'airplane',
  other: 'car',
};

export function TransportCard({
  transport,
  onEdit,
  onDelete,
}: {
  transport: ITransportDetail;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const theme = useTheme();
  const iconName = TRANSPORT_ICONS[transport.type] || 'car';
  const dateFormatted = formatSafeDate(transport.date);
  const timeFormatted = formatSafeTime(transport.time);

  return (
    <View style={styles.transportCardContainer}>
      <View
        style={[
          styles.transportCard,
          { backgroundColor: theme.colors.card },
          theme.shadows.lg,
        ]}
      >
        {/* Header */}
        <View style={styles.transportHeader}>
          <View style={styles.transportHeaderLeft}>
            <View
              style={[
                styles.transportIconBadge,
                {
                  backgroundColor: `${theme.colors.success}15`,
                  borderColor: `${theme.colors.success}30`,
                },
              ]}
            >
              <AppIcon
                name={iconName as any}
                size={16}
                color={theme.colors.success}
              />
            </View>
            <Text
              style={[
                styles.transportProvider,
                { color: theme.colors.textPrimary },
              ]}
              numberOfLines={1}
            >
              {transport.operator ||
                `${transport.type?.toUpperCase() || 'Transport'}`}
            </Text>
          </View>
          <View style={styles.transportHeaderRight}>
            <View
              style={[
                styles.bookedBadge,
                {
                  backgroundColor: theme.colors.infoBg,
                  borderColor: theme.colors.borderDefault,
                },
              ]}
            >
              <Text style={[styles.bookedText, { color: theme.colors.info }]}>
                BOOKED
              </Text>
            </View>
            <View style={styles.flightActions}>
              <Pressable style={styles.actionButton} onPress={onEdit}>
                <AppIcon
                  name="pencil"
                  size={14}
                  color={theme.colors.textSecondary}
                />
              </Pressable>
              <Pressable style={styles.actionButton} onPress={onDelete}>
                <AppIcon name="trash-2" size={14} color={theme.colors.danger} />
              </Pressable>
            </View>
          </View>
        </View>

        {/* Route Section */}
        <View style={styles.transportRouteSection}>
          <View style={styles.transportRouteBlock}>
            <Text
              style={[
                styles.transportCity,
                { color: theme.colors.textPrimary },
              ]}
              numberOfLines={1}
            >
              {transport.from || 'Origin'}
            </Text>

            <View style={styles.transportRouteVisual}>
              <View
                style={[
                  styles.transportRouteLine,
                  { backgroundColor: theme.colors.border },
                ]}
              />
              <View
                style={[
                  styles.transportArrowBadge,
                  {
                    backgroundColor: `${theme.colors.success}15`,
                    borderColor: `${theme.colors.success}30`,
                  },
                ]}
              >
                <AppIcon
                  name="arrow-forward"
                  size={16}
                  color={theme.colors.success}
                />
              </View>
              <View
                style={[
                  styles.transportRouteLine,
                  { backgroundColor: theme.colors.border },
                ]}
              />
            </View>

            <Text
              style={[
                styles.transportCity,
                { color: theme.colors.textPrimary },
              ]}
              numberOfLines={1}
            >
              {transport.to || 'Destination'}
            </Text>
          </View>
        </View>

        {/* Details */}
        <View style={styles.transportDetailsSection}>
          <View style={styles.transportDetailsRow}>
            <View style={styles.transportDetailItem}>
              <AppIcon
                name="calendar"
                size={14}
                color={theme.colors.textTertiary}
              />
              <Text
                style={[
                  styles.transportDetailText,
                  { color: theme.colors.textSecondary },
                ]}
              >
                {dateFormatted}
              </Text>
            </View>
            <View style={styles.transportDetailItem}>
              <AppIcon
                name="time"
                size={14}
                color={theme.colors.textTertiary}
              />
              <Text
                style={[
                  styles.transportDetailText,
                  { color: theme.colors.textSecondary },
                ]}
              >
                {timeFormatted}
              </Text>
            </View>
            {transport.cost && (
              <View
                style={[
                  styles.transportPriceBadge,
                  {
                    backgroundColor: theme.colors.successBg,
                    borderColor: theme.colors.successBorder,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.transportPriceText,
                    { color: theme.colors.success },
                  ]}
                >
                  ₹{Number(transport.cost).toLocaleString('en-IN')}
                </Text>
              </View>
            )}
          </View>

          {transport.pnr && (
            <View
              style={[
                styles.pnrContainer,
                { backgroundColor: theme.colors.neutralBg },
              ]}
            >
              <AppIcon
                name="hash"
                size={14}
                color={theme.colors.textTertiary}
              />
              <Text
                style={[styles.pnrText, { color: theme.colors.textSecondary }]}
              >
                PNR: {transport.pnr}
              </Text>
            </View>
          )}
        </View>

        {/* Footer */}
        <View
          style={[
            styles.transportFooter,
            { borderTopColor: theme.colors.borderLight },
          ]}
        >
          <Pressable style={styles.transportShareButton}>
            <AppIcon
              name="share-social"
              size={16}
              color={theme.colors.success}
            />
            <Text
              style={[
                styles.transportShareText,
                { color: theme.colors.success },
              ]}
            >
              Share Details
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

// ============================================================
// STYLES - Premium Design System
// ============================================================
const styles = StyleSheet.create({
  // ========== FLIGHT CARD ==========
  flightCardContainer: {
    width: '100%',
    marginBottom: spacing[5], // 20px
  },
  flightCardGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: borderRadius['3xl'], // 24px
    overflow: 'hidden',
  },
  flightCard: {
    borderRadius: borderRadius['3xl'],
    overflow: 'hidden',
    borderWidth: 1,
  },
  flightHeader: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  flightHeaderBlur: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  flightHeaderContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  flightHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    flex: 1,
  },
  airlineIconBadge: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  airlineName: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  flightNumber: {
    fontSize: 12,
    fontWeight: '500',
  },
  flightHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  confirmedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.full,
    borderWidth: StyleSheet.hairlineWidth,
  },
  confirmedText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  flightActions: {
    flexDirection: 'row',
    gap: spacing[1],
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flightRouteSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[6],
  },
  routeCodeBlock: {
    flex: 1,
    alignItems: 'center',
    gap: spacing[2],
  },
  routeCode: {
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: -1,
  },
  routeCity: {
    fontSize: 13,
    fontWeight: '600',
  },
  routeTime: {
    fontSize: 14,
    fontWeight: '700',
  },
  routeVisual: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    gap: spacing[2],
  },
  routeLineContainer: {
    alignItems: 'flex-end',
    gap: spacing[1],
  },
  routeLineContainerReverse: {
    alignItems: 'flex-start',
    gap: spacing[1],
  },
  routeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  routeLine: {
    width: 32,
    height: 2,
    borderRadius: 1,
  },
  planeIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ticketTearSection: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 20,
    marginVertical: spacing[1],
  },
  notch: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    zIndex: 10,
  },
  tearLine: {
    flex: 1,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderStyle: 'dashed',
    marginHorizontal: spacing[2],
  },
  ticketDetailsSection: {
    paddingHorizontal: spacing[5],
    paddingBottom: spacing[4],
  },
  ticketDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[4],
  },
  ticketDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  ticketDetailText: {
    fontSize: 13,
    fontWeight: '500',
  },
  priceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1.5],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  priceText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  ticketFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing[3],
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  bookingRef: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  boardingPassButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.lg,
    backgroundColor: 'rgba(212, 160, 60, 0.1)',
  },
  boardingPassText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // ========== HOTEL CARD ==========
  hotelCardContainer: {
    width: '100%',
    marginBottom: spacing[5],
  },
  hotelCard: {
    borderRadius: borderRadius['3xl'],
    overflow: 'hidden',
  },
  hotelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  hotelHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  hotelIconBadge: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hotelHeaderTitle: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  hotelHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  hotelImageContainer: {
    height: 180,
    position: 'relative',
  },
  hotelImage: {
    width: '100%',
    height: '100%',
  },
  hotelImageGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  ratingBadge: {
    position: 'absolute',
    top: spacing[3],
    right: spacing[3],
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1.5],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.full,
    borderWidth: StyleSheet.hairlineWidth,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '800',
  },
  priceTag: {
    position: 'absolute',
    bottom: spacing[3],
    right: spacing[3],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  priceTagText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  hotelDetailsSection: {
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[4],
    gap: spacing[3],
  },
  hotelName: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  hotelAddress: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  dateRangeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    alignSelf: 'flex-start',
  },
  dateRangeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  hotelMetaRow: {
    flexDirection: 'row',
    gap: spacing[4],
    paddingTop: spacing[2],
  },
  hotelMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  hotelMetaText: {
    fontSize: 12,
    fontWeight: '500',
  },
  hotelActionsSection: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  hotelActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[3],
    paddingVertical: spacing[2],
  },
  hotelActionIcon: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hotelActionText: {
    fontSize: 13,
    fontWeight: '700',
  },
  hotelActionDivider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },

  // ========== TRANSPORT CARD ==========
  transportCardContainer: {
    width: '100%',
    marginBottom: spacing[5],
  },
  transportCard: {
    borderRadius: borderRadius['3xl'],
    overflow: 'hidden',
  },
  transportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  transportHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    flex: 1,
  },
  transportIconBadge: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  transportProvider: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  transportHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  bookedBadge: {
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.full,
    borderWidth: StyleSheet.hairlineWidth,
  },
  bookedText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  transportRouteSection: {
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[5],
  },
  transportRouteBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing[3],
  },
  transportCity: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.5,
    flex: 1,
  },
  transportRouteVisual: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    flex: 1.5,
  },
  transportRouteLine: {
    flex: 1,
    height: 2,
    borderRadius: 1,
  },
  transportArrowBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  transportDetailsSection: {
    paddingHorizontal: spacing[5],
    paddingBottom: spacing[4],
    gap: spacing[3],
  },
  transportDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  transportDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  transportDetailText: {
    fontSize: 13,
    fontWeight: '500',
  },
  transportPriceBadge: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  transportPriceText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  pnrContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.lg,
  },
  pnrText: {
    fontSize: 12,
    fontWeight: '600',
  },
  transportFooter: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  transportShareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    paddingVertical: spacing[2],
  },
  transportShareText: {
    fontSize: 13,
    fontWeight: '700',
  },
});

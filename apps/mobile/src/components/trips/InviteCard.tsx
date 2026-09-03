import AppIcon from '../common/AppIcon';
// components/trips/InviteCard.tsx
import React, { forwardRef } from 'react';
import { View, Text, StyleSheet, Image, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { format } from 'date-fns';
import { ITrip } from '../../types/trip.types';
import { useTheme } from '../../providers/ThemeProvider';

interface InviteCardProps {
  trip: ITrip;
  userName: string;
}

const CARD_WIDTH = 400;
const CARD_HEIGHT = 600;

export const InviteCard = forwardRef<View, InviteCardProps>(
  ({ trip, userName }, ref) => {
    const theme = useTheme();

    let dateString = 'Dates TBD';
    if (trip.startDate && trip.endDate) {
      try {
        const start = new Date(trip.startDate);
        const end = new Date(trip.endDate);
        if (start.getMonth() === end.getMonth()) {
          dateString = `${format(start, 'MMM d')} - ${format(end, 'd, yyyy')}`;
        } else {
          dateString = `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;
        }
      } catch {}
    }

    const gradients = [
      ['#4ade80', '#06b6d4'],
      ['#c084fc', '#e879f9'],
      ['#fb923c', '#f43f5e'],
      ['#38bdf8', '#3b82f6'],
    ];
    const gradient = gradients[trip.title.length % gradients.length];

    return (
      <View ref={ref} style={styles.container}>
        {trip.coverImage ? (
          <Image
            source={{ uri: trip.coverImage }}
            style={StyleSheet.absoluteFill}
          />
        ) : (
          <LinearGradient
            colors={
              gradient as unknown as readonly [string, string, ...string[]]
            }
            style={StyleSheet.absoluteFill}
          />
        )}

        <LinearGradient
          colors={
            [
              'rgba(2, 6, 23, 0.3)',
              'rgba(2, 6, 23, 0.9)',
              '#020617',
            ] as readonly [string, string, ...string[]]
          }
          locations={[0, 0.5, 1]}
          style={StyleSheet.absoluteFill}
        />

        <View style={styles.content}>
          {/* Brand Header */}
          <View style={styles.brandHeader}>
            <View style={styles.brandIconWrap}>
              <AppIcon name="compass" size={24} color="#FFF" />
            </View>
            <Text style={styles.brandText}>WAKERU</Text>
          </View>

          {/* Trip Details */}
          <View style={styles.detailsContainer}>
            <Text style={styles.invitedBy}>
              <Text style={{ fontWeight: '700' }}>{userName}</Text> invited you
              to
            </Text>
            <Text style={styles.tripTitle} numberOfLines={2}>
              {trip.title}
            </Text>
            <View style={styles.dateContainer}>
              <AppIcon
                name="calendar"
                size={18}
                color="rgba(255,255,255,0.8)"
              />
              <Text style={styles.tripDate}>{dateString}</Text>
            </View>
          </View>

          {/* Ticket Section */}
          <View
            style={[
              styles.ticketSection,
              {
                backgroundColor: 'rgba(255,255,255,0.08)',
                borderColor: 'rgba(255,255,255,0.15)',
              },
            ]}
          >
            <View
              style={[
                styles.ticketDashLine,
                {
                  borderColor: 'rgba(255,255,255,0.2)',
                },
              ]}
            />

            <View style={styles.ticketIconWrap}>
              <AppIcon name="tag" size={20} color="rgba(255,255,255,0.6)" />
            </View>

            <Text style={styles.ticketLabel}>YOUR INVITE CODE</Text>

            <View
              style={[
                styles.codeWrap,
                {
                  backgroundColor: 'rgba(0,0,0,0.4)',
                  borderColor: 'rgba(255,255,255,0.1)',
                },
              ]}
            >
              <Text style={styles.codeText}>
                {trip.inviteCode || 'GENERATING...'}
              </Text>
            </View>

            <Text style={styles.instruction}>
              Enter this code in the Wakeru app to join
            </Text>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <View style={styles.footerDot} />
            <Text style={styles.footerText}>Valid for 7 days</Text>
            <View style={styles.footerDot} />
          </View>
        </View>
      </View>
    );
  },
);

InviteCard.displayName = 'InviteCard';

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    backgroundColor: '#000',
    overflow: 'hidden',
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.5,
    shadowRadius: 40,
    elevation: 20,
  },
  content: {
    flex: 1,
    padding: 32,
    justifyContent: 'space-between',
  },
  brandHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  brandIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  brandText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  detailsContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 16,
  },
  invitedBy: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 16,
    fontWeight: '400',
    marginBottom: 8,
  },
  tripTitle: {
    color: '#FFF',
    fontSize: 42,
    fontWeight: '900',
    lineHeight: 48,
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tripDate: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 16,
    fontWeight: '600',
  },
  ticketSection: {
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
    ...Platform.select({
      web: {
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
      },
    }),
  },
  ticketIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  ticketDashLine: {
    position: 'absolute',
    top: 0,
    left: 20,
    right: 20,
    height: 1,
    borderTopWidth: 2,
    borderStyle: 'dashed',
  },
  ticketLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  codeWrap: {
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 14,
    marginBottom: 16,
    borderWidth: 1,
    width: '100%',
    alignItems: 'center',
  },
  codeText: {
    color: '#FFF',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 3,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  instruction: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingTop: 8,
  },
  footerDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  footerText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});

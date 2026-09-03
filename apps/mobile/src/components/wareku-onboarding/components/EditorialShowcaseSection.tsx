import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { colors, radius, shadow } from '../theme/tokens';
import { useResponsive } from '../theme/useResponsive';
import { IconCheck } from '../icons/LandingIcons';
import AppIcon from '../../common/AppIcon';

const STOPS = [
  {
    id: 'london',
    city: 'London',
    country: '🇬🇧',
    duration: '3 Nights',
    image:
      'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=400&q=80',
  },
  {
    id: 'paris',
    city: 'Paris',
    country: '🇫🇷',
    duration: '3 Nights',
    image:
      'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400&q=80',
  },
  {
    id: 'amsterdam',
    city: 'Amsterdam',
    country: '🇳🇱',
    duration: '2 Nights',
    image:
      'https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=400&q=80',
  },
];

export function EditorialShowcaseSection() {
  const { isDesktop, isTablet } = useResponsive();

  return (
    <View style={styles.sectionOuter}>
      <View
        style={[styles.sectionInner, isDesktop && styles.sectionInnerDesktop]}
      >
        {/* LEFT COLUMN: Map & Itinerary Phone Mockup */}
        <View style={styles.visualColumn}>
          <View style={styles.phoneMockup}>
            {/* Phone Header */}
            <View style={styles.mockupHeader}>
              <Text style={styles.mockupTitle}>Your Journey</Text>
              <View style={styles.routePill}>
                <Text style={styles.routePillText}>3 Cities</Text>
              </View>
            </View>

            {/* Vertical Connected Route */}
            <View style={styles.stopsTimeline}>
              {STOPS.map((stop, index) => {
                const isLast = index === STOPS.length - 1;
                return (
                  <View key={stop.id} style={styles.stopBlock}>
                    <View style={styles.stopLeft}>
                      <Image
                        source={{ uri: stop.image }}
                        style={styles.stopThumb}
                      />
                      {!isLast && <View style={styles.timelineDottedLine} />}
                    </View>

                    <View style={styles.stopRight}>
                      <View style={styles.stopTitleRow}>
                        <Text style={styles.stopCityName}>
                          {stop.city} {stop.country}
                        </Text>
                        <Text style={styles.stopDuration}>{stop.duration}</Text>
                      </View>
                      <Text style={styles.stopSub}>
                        {index === 0
                          ? 'Check-in: The Zetter · Borough Market'
                          : index === 1
                            ? 'Eiffel Golden Hour · Le Marais'
                            : 'Jordaan Canal Tour · Van Gogh'}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>

            {/* Total Distance Card at Bottom */}
            <View style={styles.distanceBadge}>
              <AppIcon name="navigation" size={14} color="#2563EB" />
              <Text style={styles.distanceText}>
                Total Distance:{' '}
                <Text style={{ fontWeight: '800' }}>4,280 km</Text>
              </Text>
            </View>
          </View>
        </View>

        {/* RIGHT COLUMN: Editorial Story & Checklist */}
        <View
          style={[styles.copyColumn, isDesktop && styles.copyColumnDesktop]}
        >
          <View style={styles.eyebrowPill}>
            <Text style={styles.eyebrowText}>MADE FOR MODERN TRAVELERS</Text>
          </View>

          <Text style={styles.heading}>
            Beautifully simple.{'\n'}
            Powerfully smart.
          </Text>

          <Text style={styles.description}>
            TripSplit connects every piece of your journey into one cohesive,
            effortless experience. No more disconnected spreadsheets, lost
            receipts, or lingering payment debts.
          </Text>

          {/* Bullet Checklist */}
          <View style={styles.bulletList}>
            <View style={styles.bulletItem}>
              <View style={styles.checkCircle}>
                <IconCheck size={12} color="#2563EB" />
              </View>
              <Text style={styles.bulletText}>Real-time expense tracking</Text>
            </View>

            <View style={styles.bulletItem}>
              <View style={styles.checkCircle}>
                <IconCheck size={12} color="#2563EB" />
              </View>
              <Text style={styles.bulletText}>Smart insights & analytics</Text>
            </View>

            <View style={styles.bulletItem}>
              <View style={styles.checkCircle}>
                <IconCheck size={12} color="#2563EB" />
              </View>
              <Text style={styles.bulletText}>
                Personal budget & savings goals
              </Text>
            </View>

            <View style={styles.bulletItem}>
              <View style={styles.checkCircle}>
                <IconCheck size={12} color="#2563EB" />
              </View>
              <Text style={styles.bulletText}>Secure, private & encrypted</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionOuter: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    paddingVertical: 72,
  },
  sectionInner: {
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 24,
    flexDirection: 'column',
    gap: 48,
  },
  sectionInnerDesktop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 64,
  },

  // Visual Mockup Left
  visualColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  phoneMockup: {
    width: 320,
    backgroundColor: '#FFFFFF',
    borderRadius: 32,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...shadow.xl,
    transform: [{ rotate: '-3deg' }],
  },
  mockupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  mockupTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  routePill: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  routePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563EB',
  },

  // Timeline
  stopsTimeline: {
    gap: 16,
  },
  stopBlock: {
    flexDirection: 'row',
    gap: 14,
  },
  stopLeft: {
    alignItems: 'center',
    position: 'relative',
  },
  stopThumb: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#2563EB',
  },
  timelineDottedLine: {
    width: 2,
    height: 32,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    marginTop: 4,
  },
  stopRight: {
    flex: 1,
    justifyContent: 'center',
  },
  stopTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stopCityName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  stopDuration: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  stopSub: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },

  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 14,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    justifyContent: 'center',
  },
  distanceText: {
    fontSize: 12,
    color: '#334155',
  },

  // Copy Right
  copyColumn: {
    width: '100%',
  },
  copyColumnDesktop: {
    flex: 1.1,
    maxWidth: 520,
  },
  eyebrowPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: radius.pill,
    marginBottom: 16,
  },
  eyebrowText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#2563EB',
    letterSpacing: 0.8,
  },
  heading: {
    fontSize: 40,
    lineHeight: 48,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -1,
    marginBottom: 18,
  },
  description: {
    fontSize: 16,
    lineHeight: 26,
    color: '#475569',
    marginBottom: 28,
  },

  // Bullet items
  bulletList: {
    gap: 14,
  },
  bulletItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bulletText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
  },
});

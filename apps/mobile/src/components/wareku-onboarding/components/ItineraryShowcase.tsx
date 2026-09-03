import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { colors, radius, shadow } from '../theme/tokens';
import { useResponsive } from '../theme/useResponsive';
import AppIcon from '../../common/AppIcon';

const ITINERARY_DAYS = [
  {
    day: 'Day 01',
    city: 'London 🇬🇧',
    flight: 'BA 142 · LHR Terminal 5',
    hotel: 'The Zetter Clerkenwell',
    activity: 'Borough Market Food Tour · 7:30 PM',
  },
  {
    day: 'Day 04',
    city: 'Paris 🇫🇷',
    flight: 'Eurostar 9014 · 2h 20m',
    hotel: 'Le Marais Boutique Stay',
    activity: 'Louvre Golden Hour · 5:00 PM',
  },
  {
    day: 'Day 07',
    city: 'Amsterdam 🇳🇱',
    flight: 'Thalys High Speed 9322',
    hotel: 'Jordaan Canal Suites',
    activity: 'Sunset Canal Boat Cruise · 6:00 PM',
  },
];

export function ItineraryShowcase() {
  const { isDesktop, isTablet, isWide } = useResponsive();
  const [activeDay, setActiveDay] = useState(0);
  const isRowLayout = isDesktop || isWide;

  return (
    <View style={styles.sectionOuter}>
      <View
        style={[styles.sectionInner, isRowLayout && styles.sectionInnerDesktop]}
      >
        {/* Visual Itinerary Journey Card */}
        <View
          style={[styles.visualCol, isRowLayout && styles.visualColDesktop]}
        >
          <View style={styles.timelineCard}>
            <View style={styles.timelineHeader}>
              <Text style={styles.timelineTitle}>
                London → Paris → Amsterdam
              </Text>
              <View style={styles.progressPill}>
                <Text style={styles.progressPillText}>75% Booked</Text>
              </View>
            </View>

            <View style={styles.daysList}>
              {ITINERARY_DAYS.map((item, idx) => {
                const active = idx === activeDay;
                return (
                  <Pressable
                    key={idx}
                    onPress={() => setActiveDay(idx)}
                    style={[styles.dayCard, active && styles.dayCardActive]}
                  >
                    <View style={styles.dayCardTop}>
                      <View style={styles.dayBadge}>
                        <Text style={styles.dayBadgeText}>{item.day}</Text>
                      </View>
                      <Text style={styles.dayCityText}>{item.city}</Text>
                    </View>

                    {active && (
                      <View style={styles.dayDetails}>
                        <View style={styles.detailRow}>
                          <AppIcon name="plane" size={13} color="#2563EB" />
                          <Text style={styles.detailText}>{item.flight}</Text>
                        </View>
                        <View style={styles.detailRow}>
                          <AppIcon name="hotel" size={13} color="#8B5CF6" />
                          <Text style={styles.detailText}>{item.hotel}</Text>
                        </View>
                        <View style={styles.detailRow}>
                          <AppIcon name="coffee" size={13} color="#10B981" />
                          <Text style={styles.detailText}>{item.activity}</Text>
                        </View>
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.checklistSummary}>
              <AppIcon name="check-square" size={14} color="#10B981" />
              <Text style={styles.checklistSummaryText}>
                Collaborative packing checklist: 18 / 20 items packed
              </Text>
            </View>
          </View>
        </View>

        {/* Copy Right */}
        <View style={[styles.copyCol, isRowLayout && styles.copyColDesktop]}>
          <Text style={styles.eyebrow}>SMART TRAVEL PLANNER</Text>
          <Text
            style={[
              styles.headline,
              isDesktop ? styles.headlineDesktop : styles.headlineMobile,
            ]}
          >
            The plan, the bookings,{'\n'}
            <Text style={styles.headlineAccent}>and the trip — together.</Text>
          </Text>

          <Text style={styles.description}>
            Never scramble for hotel booking vouchers or flight terminal gates.
            TripSplit unifies schedules, transport passes, and shared packing
            lists into one shared offline timeline.
          </Text>

          <View style={styles.featurePills}>
            <View style={styles.pillItem}>
              <Text style={styles.pillEmoji}>✈️</Text>
              <Text style={styles.pillLabel}>
                Live Flight Status & Gate Timers
              </Text>
            </View>
            <View style={styles.pillItem}>
              <Text style={styles.pillEmoji}>🏨</Text>
              <Text style={styles.pillLabel}>
                Stay Vouchers & 1-Tap Navigation
              </Text>
            </View>
            <View style={styles.pillItem}>
              <Text style={styles.pillEmoji}>🎒</Text>
              <Text style={styles.pillLabel}>
                Shared Crew Packing Checklist
              </Text>
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
    backgroundColor: '#F8FAFC',
    paddingVertical: 84,
  },
  sectionInner: {
    maxWidth: 1360,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 24,
    flexDirection: 'column-reverse',
    gap: 48,
  },
  sectionInnerDesktop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 64,
  },

  visualCol: {
    width: '100%',
    alignItems: 'center',
  },
  visualColDesktop: {
    flex: 1,
    maxWidth: 520,
  },
  timelineCard: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 26,
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.08)',
    ...shadow.xl,
  },
  timelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  timelineTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  progressPill: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  progressPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#2563EB',
  },

  daysList: {
    gap: 12,
    marginBottom: 16,
  },
  dayCard: {
    backgroundColor: '#F8FAFC',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  dayCardActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#2563EB',
    ...shadow.soft,
  },
  dayCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dayBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  dayBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#2563EB',
  },
  dayCityText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  dayDetails: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },

  checklistSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ECFDF5',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  checklistSummaryText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#065F46',
  },

  // Copy
  copyCol: {
    width: '100%',
  },
  copyColDesktop: {
    flex: 1.15,
    maxWidth: 620,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '800',
    color: '#2563EB',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  headline: {
    color: '#0F172A',
    fontWeight: '900',
    letterSpacing: -1,
  },
  headlineDesktop: {
    fontSize: 44,
    lineHeight: 52,
  },
  headlineMobile: {
    fontSize: 30,
    lineHeight: 36,
  },
  headlineAccent: {
    color: '#2563EB',
  },
  description: {
    fontSize: 16,
    lineHeight: 26,
    color: '#475569',
    marginTop: 16,
    marginBottom: 28,
  },
  featurePills: {
    gap: 12,
  },
  pillItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  pillEmoji: {
    fontSize: 16,
  },
  pillLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
});

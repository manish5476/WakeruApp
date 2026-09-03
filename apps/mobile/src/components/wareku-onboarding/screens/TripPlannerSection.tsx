import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, radius, shadow, typography } from '../theme/tokens';
import {
  IconPin,
  IconArrowRight,
  IconPlane,
  IconHotel,
  IconCheck,
} from '../icons/LandingIcons';

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type PlannerTab = 'itinerary' | 'flight' | 'hotel' | 'checklist';

export function TripPlannerSection() {
  const [activeTab, setActiveTab] = useState<PlannerTab>('itinerary');
  const [expandedDay, setExpandedDay] = useState<number | null>(0);

  const [checklist, setChecklist] = useState([
    { id: '1', item: 'Passports & Schengen Visa', done: true, by: 'Everyone' },
    { id: '2', item: 'Multi-Currency Forex Card', done: true, by: 'Arjun' },
    { id: '3', item: 'Eurostar London-Paris Tickets', done: true, by: 'Sarah' },
    {
      id: '4',
      item: 'Universal Type-C Power Adapters',
      done: false,
      by: 'Rahul',
    },
    {
      id: '5',
      item: 'International Travel Insurance',
      done: false,
      by: 'Nehal',
    },
  ]);

  const toggleDay = (idx: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedDay(expandedDay === idx ? null : idx);
  };

  const toggleChecklistItem = (id: string) => {
    setChecklist(prev =>
      prev.map(c => (c.id === id ? { ...c, done: !c.done } : c)),
    );
  };

  const doneCount = checklist.filter(c => c.done).length;
  const checklistPct = Math.round((doneCount / checklist.length) * 100);

  const days = [
    {
      day: 'Day 01',
      city: 'London 🇬🇧',
      stops: [
        {
          icon: '🏨',
          title: 'The Zetter Clerkenwell',
          time: 'Check-in 3:00 PM',
        },
        {
          icon: '🍽️',
          title: 'Borough Market Street Food',
          time: 'Reserved 7:30 PM',
        },
      ],
      transit: '🚆 Eurostar to Paris · 2h 20m',
    },
    {
      day: 'Day 03',
      city: 'Paris 🇫🇷',
      stops: [
        {
          icon: '🗼',
          title: 'Eiffel Tower Golden Hour',
          time: 'Entry 6:45 PM',
        },
        { icon: '🍷', title: 'Le Marais Wine Tasting', time: '9:30 PM' },
      ],
      transit: '✈️ Thalys High-Speed to Amsterdam · 3h 15m',
    },
    {
      day: 'Day 06',
      city: 'Amsterdam 🇳🇱',
      stops: [
        {
          icon: '🚲',
          title: 'Jordaan Canal Loop Tour',
          time: 'Morning 10:00 AM',
        },
        { icon: '🎨', title: 'Van Gogh Museum Skip-Line', time: '2:15 PM' },
      ],
      transit: null,
    },
  ];

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.badge}>
          <IconPin size={14} color={colors.brand.primary} />
          <Text style={styles.badgeText}>SMART ITINERARY & LIVE BOOKINGS</Text>
        </View>
        <Text style={styles.title}>Itinerary & Booking Hub</Text>
        <Text style={styles.subtitle}>
          Day-by-day stops, real-time flight trackers, stay vouchers & crew
          checklists
        </Text>
      </View>

      {/* Hub Navigation Tabs */}
      <View style={styles.hubTabs}>
        {(
          [
            { key: 'itinerary', label: '🗺️ Itinerary' },
            { key: 'flight', label: '✈️ Live Flight' },
            { key: 'hotel', label: '🏨 Hotel Voucher' },
            { key: 'checklist', label: '🎒 Checklist' },
          ] as const
        ).map(t => {
          const isActive = activeTab === t.key;
          return (
            <Pressable
              key={t.key}
              onPress={() => setActiveTab(t.key)}
              style={[styles.hubTab, isActive && styles.hubTabActive]}
            >
              <Text
                style={[styles.hubTabText, isActive && styles.hubTabTextActive]}
              >
                {t.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* TAB 1: ITINERARY */}
      {activeTab === 'itinerary' && (
        <View style={styles.tabContent}>
          <View style={styles.routeHeaderRow}>
            <Text style={styles.routeText}>London → Paris → Amsterdam</Text>
            <View style={styles.statusPill}>
              <Text style={styles.statusPillText}>75% Planned</Text>
            </View>
          </View>

          <View style={styles.daysList}>
            {days.map((item, index) => {
              const isOpen = expandedDay === index;
              return (
                <View
                  key={item.day}
                  style={[styles.dayBlock, isOpen && styles.dayBlockActive]}
                >
                  <Pressable
                    onPress={() => toggleDay(index)}
                    style={[styles.dayHeader, isOpen && styles.dayHeaderActive]}
                  >
                    <View style={styles.dayLeft}>
                      <View
                        style={[styles.dayDot, isOpen && styles.dayDotActive]}
                      />
                      <Text
                        style={[styles.dayTag, isOpen && styles.dayTagActive]}
                      >
                        {item.day}
                      </Text>
                      <Text
                        style={[
                          styles.cityText,
                          isOpen && styles.cityTextActive,
                        ]}
                      >
                        {item.city}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.arrowWrap,
                        isOpen && { transform: [{ rotate: '90deg' }] },
                      ]}
                    >
                      <IconArrowRight
                        size={14}
                        color={
                          isOpen ? colors.brand.primary : colors.light.textMuted
                        }
                      />
                    </View>
                  </Pressable>

                  {isOpen && (
                    <View style={styles.dayBody}>
                      {item.stops.map(stop => (
                        <View key={stop.title} style={styles.stopRow}>
                          <Text style={styles.stopIcon}>{stop.icon}</Text>
                          <View style={styles.stopInfo}>
                            <Text style={styles.stopTitle}>{stop.title}</Text>
                            <Text style={styles.stopTime}>{stop.time}</Text>
                          </View>
                        </View>
                      ))}

                      {item.transit && (
                        <View style={styles.transitRow}>
                          <Text style={styles.transitText}>{item.transit}</Text>
                        </View>
                      )}
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* TAB 2: LIVE FLIGHT TRACKER */}
      {activeTab === 'flight' && (
        <View style={styles.tabContent}>
          <View style={styles.flightCard}>
            <View style={styles.flightTop}>
              <View style={styles.airlineRow}>
                <View style={styles.airlineBadge}>
                  <IconPlane size={14} color="#FFFFFF" />
                </View>
                <View>
                  <Text style={styles.airlineName}>British Airways BA-138</Text>
                  <Text style={styles.flightDate}>
                    Boeing 777-300ER · Confirmed
                  </Text>
                </View>
              </View>
              <View style={styles.onTimePill}>
                <Text style={styles.onTimeText}>🟢 ON TIME</Text>
              </View>
            </View>

            <View style={styles.flightPathRow}>
              <View style={styles.airportCol}>
                <Text style={styles.airportCode}>LHR</Text>
                <Text style={styles.airportCity}>London Heathrow</Text>
                <Text style={styles.airportTime}>10:15 AM</Text>
              </View>

              <View style={styles.flightDuration}>
                <Text style={styles.durationText}>1h 25m</Text>
                <View style={styles.flightLine}>
                  <View style={styles.planeDot} />
                </View>
                <Text style={styles.nonStopText}>Non-stop</Text>
              </View>

              <View style={[styles.airportCol, { alignItems: 'flex-end' }]}>
                <Text style={styles.airportCode}>CDG</Text>
                <Text style={styles.airportCity}>Paris Charles de Gaulle</Text>
                <Text style={styles.airportTime}>12:40 PM</Text>
              </View>
            </View>

            <View style={styles.flightMetaGrid}>
              <View style={styles.metaBox}>
                <Text style={styles.metaLabel}>TERMINAL</Text>
                <Text style={styles.metaVal}>T5</Text>
              </View>
              <View style={styles.metaBox}>
                <Text style={styles.metaLabel}>GATE</Text>
                <Text style={styles.metaVal}>B14</Text>
              </View>
              <View style={styles.metaBox}>
                <Text style={styles.metaLabel}>SEATS</Text>
                <Text style={styles.metaVal}>14A - 14D</Text>
              </View>
              <View style={styles.metaBox}>
                <Text style={styles.metaLabel}>BOARDING</Text>
                <Text style={styles.metaVal}>09:35 AM</Text>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* TAB 3: HOTEL VOUCHER */}
      {activeTab === 'hotel' && (
        <View style={styles.tabContent}>
          <View style={styles.hotelCard}>
            <View style={styles.hotelHeader}>
              <View style={styles.hotelIconWrap}>
                <IconHotel size={16} color={colors.brand.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.hotelName}>Cliffside Caldera Suites</Text>
                <Text style={styles.hotelLocation}>
                  Oia Village · Santorini, Greece
                </Text>
              </View>
              <View style={styles.confirmedBadge}>
                <IconCheck size={10} color={colors.brand.emerald} />
                <Text style={styles.confirmedText}>Booked</Text>
              </View>
            </View>

            <View style={styles.voucherGrid}>
              <View style={styles.voucherCol}>
                <Text style={styles.voucherLabel}>CHECK-IN</Text>
                <Text style={styles.voucherVal}>Aug 18 · 3:00 PM</Text>
              </View>
              <View style={styles.voucherCol}>
                <Text style={styles.voucherLabel}>CHECK-OUT</Text>
                <Text style={styles.voucherVal}>Aug 24 · 11:00 AM</Text>
              </View>
              <View style={styles.voucherCol}>
                <Text style={styles.voucherLabel}>CONFIRMATION</Text>
                <Text style={styles.voucherCode}>#TS-88429-GR</Text>
              </View>
            </View>

            <View style={styles.amenitiesRow}>
              <Text style={styles.amenityTag}>🏊 Infinity Pool</Text>
              <Text style={styles.amenityTag}>🌅 Sunset View</Text>
              <Text style={styles.amenityTag}>🍳 Breakfast Included</Text>
            </View>
          </View>
        </View>
      )}

      {/* TAB 4: CHECKLIST */}
      {activeTab === 'checklist' && (
        <View style={styles.tabContent}>
          <View style={styles.checklistProgressRow}>
            <Text style={styles.checklistProgressLabel}>
              Crew Readiness: {doneCount}/{checklist.length} Completed
            </Text>
            <Text style={styles.checklistPct}>{checklistPct}%</Text>
          </View>
          <View style={styles.checklistTrack}>
            <LinearGradient
              colors={colors.gradients.brand}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.checklistFill, { width: `${checklistPct}%` }]}
            />
          </View>

          <View style={styles.checklistList}>
            {checklist.map(item => (
              <Pressable
                key={item.id}
                onPress={() => toggleChecklistItem(item.id)}
                style={styles.checkItemRow}
              >
                <View
                  style={[
                    styles.checkCircle,
                    item.done && styles.checkCircleDone,
                  ]}
                >
                  {item.done && (
                    <IconCheck size={12} color={colors.brand.white} />
                  )}
                </View>
                <View style={styles.checkTextWrap}>
                  <Text
                    style={[
                      styles.checkItemText,
                      item.done && styles.checkItemDoneText,
                    ]}
                  >
                    {item.item}
                  </Text>
                  <Text style={styles.assignedTo}>Assigned to: {item.by}</Text>
                </View>
              </Pressable>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.light.surface,
    borderRadius: radius.xxl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.light.border,
    ...shadow.cardHover,
    marginBottom: spacing.sectionSm,
  },
  header: {
    marginBottom: spacing.md,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.brand.primarySoft,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
    marginBottom: spacing.xs,
  },
  badgeText: {
    ...typography.label,
    color: colors.brand.primary,
    marginLeft: 6,
  },
  title: {
    ...typography.heading3.mobile,
    color: colors.light.textPrimary,
  },
  subtitle: {
    ...typography.bodySmall,
    color: colors.light.textSecondary,
    marginTop: 2,
  },

  // Hub Tabs
  hubTabs: {
    flexDirection: 'row',
    backgroundColor: colors.light.surfaceMuted,
    borderRadius: radius.md,
    padding: 3,
    marginVertical: spacing.md,
    flexWrap: 'wrap',
    gap: 2,
  },
  hubTab: {
    flex: 1,
    minWidth: '22%',
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: radius.sm,
  },
  hubTabActive: {
    backgroundColor: colors.light.surface,
    ...shadow.soft,
  },
  hubTabText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.light.textMuted,
  },
  hubTabTextActive: {
    color: colors.brand.primary,
    fontWeight: '700',
  },

  tabContent: {
    marginTop: spacing.xs,
  },

  // Itinerary Tab
  routeHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  routeText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.light.textPrimary,
  },
  statusPill: {
    backgroundColor: colors.brand.primarySoft,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.brand.primary,
  },
  daysList: {
    gap: spacing.sm,
  },
  dayBlock: {
    backgroundColor: colors.light.surfaceMuted,
    borderRadius: radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.light.border,
  },
  dayBlockActive: {
    backgroundColor: colors.light.surface,
    borderColor: 'rgba(37,99,235,0.2)',
    ...shadow.soft,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
  },
  dayHeaderActive: {
    borderBottomWidth: 1,
    borderBottomColor: colors.light.border,
  },
  dayLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dayDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.light.textMuted,
  },
  dayDotActive: {
    backgroundColor: colors.brand.primary,
  },
  dayTag: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.light.textSecondary,
  },
  dayTagActive: {
    color: colors.brand.primary,
  },
  cityText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.light.textPrimary,
  },
  cityTextActive: {
    color: colors.brand.primaryHover,
  },
  arrowWrap: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayBody: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  stopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  stopIcon: {
    fontSize: 16,
  },
  stopInfo: {
    flex: 1,
  },
  stopTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.light.textPrimary,
  },
  stopTime: {
    fontSize: 11,
    color: colors.light.textMuted,
  },
  transitRow: {
    backgroundColor: colors.light.surfaceMuted,
    padding: spacing.sm,
    borderRadius: radius.sm,
    marginTop: spacing.xs,
  },
  transitText: {
    fontSize: 11,
    color: colors.brand.primary,
    fontWeight: '600',
  },

  // Flight Tab
  flightCard: {
    backgroundColor: colors.brand.midnight,
    borderRadius: radius.xl,
    padding: spacing.lg,
    ...shadow.xl,
  },
  flightTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  airlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  airlineBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.brand.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  airlineName: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  flightDate: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
  },
  onTimePill: {
    backgroundColor: 'rgba(16,185,129,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  onTimeText: {
    color: colors.brand.emerald,
    fontSize: 10,
    fontWeight: '800',
  },
  flightPathRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  airportCol: {
    flex: 1,
  },
  airportCode: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  airportCity: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.65)',
    marginTop: 2,
  },
  airportTime: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.brand.cyan,
    marginTop: 2,
  },
  flightDuration: {
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
  },
  durationText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 4,
  },
  flightLine: {
    width: 64,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.3)',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  planeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.brand.cyan,
  },
  nonStopText: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 4,
  },
  flightMetaGrid: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: radius.md,
    padding: spacing.md,
    justifyContent: 'space-between',
  },
  metaBox: {
    alignItems: 'center',
  },
  metaLabel: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '700',
  },
  metaVal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 2,
  },

  // Hotel Tab
  hotelCard: {
    backgroundColor: colors.light.surfaceMuted,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.light.border,
  },
  hotelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  hotelIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.brand.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hotelName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.light.textPrimary,
  },
  hotelLocation: {
    fontSize: 11,
    color: colors.light.textSecondary,
  },
  confirmedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.brand.emeraldSoft,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  confirmedText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.brand.emerald,
  },
  voucherGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.light.surface,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.light.border,
  },
  voucherCol: {
    flex: 1,
  },
  voucherLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.light.textMuted,
  },
  voucherVal: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.light.textPrimary,
    marginTop: 2,
  },
  voucherCode: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.brand.primary,
    marginTop: 2,
  },
  amenitiesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  amenityTag: {
    fontSize: 11,
    color: colors.light.textSecondary,
    backgroundColor: colors.light.surface,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.light.border,
  },

  // Checklist Tab
  checklistProgressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  checklistProgressLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.light.textPrimary,
  },
  checklistPct: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.brand.primary,
  },
  checklistTrack: {
    width: '100%',
    height: 6,
    backgroundColor: colors.light.surfaceMuted,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  checklistFill: {
    height: '100%',
    borderRadius: 3,
  },
  checklistList: {
    gap: spacing.sm,
  },
  checkItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.light.surface,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.light.border,
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.light.borderStrong,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkCircleDone: {
    backgroundColor: colors.brand.primary,
    borderColor: colors.brand.primary,
  },
  checkTextWrap: {
    flex: 1,
  },
  checkItemText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.light.textPrimary,
  },
  checkItemDoneText: {
    textDecorationLine: 'line-through',
    color: colors.light.textMuted,
  },
  assignedTo: {
    fontSize: 11,
    color: colors.light.textMuted,
    marginTop: 1,
  },
});

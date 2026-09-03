import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInUp, FadeIn } from 'react-native-reanimated';

import { colors, spacing } from '../theme/tokens';
import {
  TravelHeroScene,
  UserAvatarGroup,
  StatBadge,
  TripPreviewCard,
  ExpenseCard,
  SettlementGraph,
  AchievementBadge,
} from '../components';

const { width } = Dimensions.get('window');

const TRAVELERS = [
  {
    name: 'Sarah',
    uri: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
  },
  {
    name: 'Alex',
    uri: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100',
  },
  {
    name: 'Mike',
    uri: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
  },
  {
    name: 'Emma',
    uri: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100',
  },
];

export interface OnboardingStep {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  backgroundImage: string;
  renderVisual: (size: number) => React.ReactNode;
}

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    eyebrow: 'WELCOME TO TRIPSPLIT',
    title: 'Travel Together.\nSplit Effortlessly.',
    description:
      'Plan every stop, track every expense, and settle up automatically. The only travel app your whole group will actually use.',
    backgroundImage:
      'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1600&q=80',
    renderVisual: size => (
      <Animated.View
        entering={FadeInUp.delay(200).duration(600).springify()}
        style={styles.visualContainer}
      >
        <View style={styles.glowBackdrop} />
        <TravelHeroScene width={size} height={size * 0.8} />
        <View style={styles.proofStack}>
          <UserAvatarGroup
            travelers={TRAVELERS.slice(0, 3)}
            extraCount={47}
            size={32}
          />
          <StatBadge
            icon="account-group"
            value="50K+"
            label="Active travelers"
          />
        </View>
      </Animated.View>
    ),
  },
  {
    id: 'planning',
    eyebrow: 'COLLABORATIVE ITINERARIES',
    title: 'Build the Journey.\nIn Real Time.',
    description:
      'Create a trip, invite your friends, and watch the itinerary come alive as everyone adds stops, dates, and ideas seamlessly.',
    backgroundImage:
      'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1600&q=80',
    renderVisual: size => (
      <Animated.View
        entering={FadeInUp.delay(200).duration(600).springify()}
        style={styles.visualContainer}
      >
        <TripPreviewCard
          tripName="Europe Adventure"
          travelers={TRAVELERS}
          stops={[
            { city: 'Paris', dates: 'Jun 12 – 16' },
            { city: 'Dubai', dates: 'Jun 17 – 20' },
            { city: 'Rome', dates: 'Jun 21 – 25' },
          ]}
        />
        <View style={styles.statRow}>
          <StatBadge
            icon="map-marker-path"
            value="200K+"
            label="Trips created"
          />
        </View>
      </Animated.View>
    ),
  },
  {
    id: 'expenses',
    eyebrow: 'MULTI-CURRENCY TRACKING',
    title: 'Every Currency.\nOne Clear Balance.',
    description:
      'Pay in dirhams, rupees, or euros. We convert at live rates and keep one running balance, so no one is doing exchange-rate math at 2 AM.',
    backgroundImage:
      'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1600&q=80',
    renderVisual: size => (
      <Animated.View
        entering={FadeInUp.delay(200).duration(600).springify()}
        style={styles.visualContainer}
      >
        <ExpenseCard
          stopName="Dubai"
          items={[
            { label: 'Hotel', icon: 'bed', amount: '450', currency: 'AED' },
            {
              label: 'Food',
              icon: 'silverware-fork-knife',
              amount: '120',
              currency: 'AED',
            },
            { label: 'Taxi', icon: 'taxi', amount: '80', currency: 'AED' },
          ]}
          convertedTotal="14,800"
          convertedCurrency="₹"
        />
        <View style={styles.statRow}>
          <StatBadge
            icon="currency-usd"
            value="150+"
            label="Currencies supported"
          />
        </View>
      </Animated.View>
    ),
  },
  {
    id: 'settlement',
    eyebrow: 'SMART SETTLEMENTS',
    title: 'Settle Up.\nThe Smart Way.',
    description:
      'Instead of everyone paying everyone back, we collapse the group’s debts into the fewest possible transfers. Automatically.',
    backgroundImage:
      'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1600&q=80',
    renderVisual: size => (
      <Animated.View
        entering={FadeInUp.delay(200).duration(600).springify()}
        style={styles.visualContainer}
      >
        <SettlementGraph
          people={[
            { id: 'a', name: 'Sarah', uri: TRAVELERS[0].uri },
            { id: 'b', name: 'Alex', uri: TRAVELERS[1].uri },
            { id: 'c', name: 'Mike', uri: TRAVELERS[2].uri },
            { id: 'd', name: 'Emma', uri: TRAVELERS[3].uri },
          ]}
        />
        <View style={styles.statRow}>
          <StatBadge
            icon="trending-down"
            value="67%"
            label="Fewer transfers, on average"
          />
        </View>
      </Animated.View>
    ),
  },
  {
    id: 'memories',
    eyebrow: 'MEMORIES & MILESTONES',
    title: 'Every Trip Becomes.\nA Story.',
    description:
      'Unlock travel achievements, relive the highlights, and see how your adventures stack up. Long after the trip ends.',
    backgroundImage:
      'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=1600&q=80',
    renderVisual: size => (
      <Animated.View
        entering={FadeInUp.delay(200).duration(600).springify()}
        style={styles.visualContainer}
      >
        <View style={styles.badgeGrid}>
          <AchievementBadge
            icon="compass"
            title="Explorer"
            subtitle="10 countries"
            gradient={[colors.oceanBlue, colors.travelCyan]}
          />
          <AchievementBadge
            icon="wallet"
            title="Budget Master"
            subtitle="Under budget 5x"
            gradient={[colors.emerald, colors.travelCyan]}
          />
        </View>
        <View style={styles.statRow}>
          <StatBadge icon="trophy" value="12M+" label="Memories shared" />
        </View>
      </Animated.View>
    ),
  },
];

const styles = StyleSheet.create({
  visualContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    position: 'relative',
  },
  glowBackdrop: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: colors.background, // Replace with your theme's primary/gold color
    opacity: 0.15,
    filter: 'blur(60px)', // Web only, but harmless on native
    zIndex: -1,
  },
  proofStack: {
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  statRow: {
    marginTop: spacing.xl,
  },
  badgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    justifyContent: 'center',
    maxWidth: 380,
  },
});
// import React from 'react';
// import { View, StyleSheet } from 'react-native';

// import { colors, spacing } from '../theme/tokens';
// import { TravelHeroScene, UserAvatarGroup, StatBadge, TripPreviewCard, ExpenseCard, SettlementGraph, AchievementBadge } from '../components';

// const TRAVELERS = [
//   { name: 'Sarah', uri: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100' },
//   { name: 'Alex', uri: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100' },
//   { name: 'Mike', uri: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100' },
//   { name: 'Emma', uri: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100' },
// ];

// export interface OnboardingStep {
//   id: string;
//   eyebrow: string;
//   title: string;
//   description: string;
//   backgroundImage: string;
//   renderVisual: (size: number) => React.ReactNode;
// }

// export const ONBOARDING_STEPS: OnboardingStep[] = [
//   {
//     id: 'welcome',
//     eyebrow: 'WELCOME TO WAKERU',
//     title: 'Travel Together.\nWithout Money Stress.',
//     description:
//       'Plan every stop, split every expense, and settle up automatically — all in the one app your whole group actually uses.',
//     backgroundImage: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1600&q=80',
//     renderVisual: (size) => (
//       <View style={styles.center}>
//         <TravelHeroScene width={size} height={size} />
//         <View style={styles.proofStack}>
//           <UserAvatarGroup travelers={TRAVELERS.slice(0, 3)} extraCount={47} size={30} />
//           <StatBadge icon="account-group" value="50K+" label="Active travelers" />
//         </View>
//       </View>
//     ),
//   },
//   {
//     id: 'planning',
//     eyebrow: 'COLLABORATIVE PLANNING',
//     title: 'Build The Journey\nTogether',
//     description:
//       'Create a trip, invite your group, and watch the itinerary build itself as everyone adds stops, dates, and ideas in real time.',
//     backgroundImage: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1600&q=80',
//     renderVisual: () => (
//       <View style={styles.center}>
//         <TripPreviewCard
//           tripName="Europe Adventure"
//           travelers={TRAVELERS}
//           stops={[
//             { city: 'Paris', dates: 'Jun 12 – 16' },
//             { city: 'Dubai', dates: 'Jun 17 – 20' },
//             { city: 'Rome', dates: 'Jun 21 – 25' },
//           ]}
//         />
//         <View style={styles.statRow}>
//           <StatBadge icon="map-marker-path" value="200K+" label="Trips created" />
//         </View>
//       </View>
//     ),
//   },
//   {
//     id: 'expenses',
//     eyebrow: 'MULTI-CURRENCY EXPENSES',
//     title: 'Every Currency.\nOne Clear Balance.',
//     description:
//       'Pay in dirhams, rupees, or euros — Wareku converts at the live rate and keeps one running balance, so nobody\u2019s doing exchange-rate math at 2am.',
//     backgroundImage: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1600&q=80',
//     renderVisual: () => (
//       <View style={styles.center}>
//         <ExpenseCard
//           stopName="Dubai"
//           items={[
//             { label: 'Hotel', icon: 'bed', amount: '450', currency: 'AED' },
//             { label: 'Food', icon: 'silverware-fork-knife', amount: '120', currency: 'AED' },
//             { label: 'Taxi', icon: 'taxi', amount: '80', currency: 'AED' },
//           ]}
//           convertedTotal="14,800"
//           convertedCurrency="₹"
//         />
//         <View style={styles.statRow}>
//           <StatBadge icon="currency-usd" value="150+" label="Currencies supported" />
//         </View>
//       </View>
//     ),
//   },
//   {
//     id: 'settlement',
//     eyebrow: 'SMART SETTLEMENT',
//     title: 'Settle Money\nThe Smart Way',
//     description:
//       'Instead of everyone paying everyone back, Wareku collapses the whole group\u2019s debts down to the fewest possible transfers — automatically.',
//     backgroundImage: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1600&q=80',
//     renderVisual: () => (
//       <View style={styles.center}>
//         <SettlementGraph
//           people={[
//             { id: 'a', name: 'Sarah', uri: TRAVELERS[0].uri },
//             { id: 'b', name: 'Alex', uri: TRAVELERS[1].uri },
//             { id: 'c', name: 'Mike', uri: TRAVELERS[2].uri },
//             { id: 'd', name: 'Emma', uri: TRAVELERS[3].uri },
//           ]}
//         />
//         <View style={styles.statRow}>
//           <StatBadge icon="trending-down" value="67%" label="Fewer transfers, on average" />
//         </View>
//       </View>
//     ),
//   },
//   {
//     id: 'memories',
//     eyebrow: 'MEMORIES & COMMUNITY',
//     title: 'Every Trip Becomes\nA Story',
//     description:
//       'Unlock achievements, relive the highlights, and see how your travel stacks up against friends — long after the trip ends.',
//     backgroundImage: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=1600&q=80',
//     renderVisual: () => (
//       <View style={styles.center}>
//         <View style={styles.badgeGrid}>
//           <AchievementBadge icon="compass" title="Explorer" subtitle="10 countries visited" gradient={[colors.oceanBlue, colors.travelCyan]} />
//           <AchievementBadge icon="wallet" title="Budget Master" subtitle="Under budget 5 trips" gradient={[colors.emerald, colors.travelCyan]} />
//           <AchievementBadge icon="calendar-check" title="Perfect Planner" subtitle="Zero last-minute changes" gradient={[colors.travelCyan, colors.oceanBlue]} />
//           <AchievementBadge icon="account-group" title="Squad Goals" subtitle="12 trips with friends" gradient={[colors.oceanBlue, colors.emerald]} />
//         </View>
//         <View style={styles.statRow}>
//           <StatBadge icon="trophy" value="12M+" label="Memories shared" />
//         </View>
//       </View>
//     ),
//   },
// ];

// const styles = StyleSheet.create({
//   center: { alignItems: 'center', justifyContent: 'center' },
//   proofStack: { alignItems: 'center', gap: spacing.md, marginTop: spacing.lg },
//   statRow: { marginTop: spacing.lg },
//   badgeGrid: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//     gap: spacing.md,
//     justifyContent: 'center',
//     maxWidth: 380,
//   },
// });

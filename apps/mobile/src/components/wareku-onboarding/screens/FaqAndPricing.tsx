import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  LayoutAnimation,
  Platform,
  UIManager,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, radius, shadow, typography } from '../theme/tokens';
import { IconCheck, IconArrowRight, IconSparkles } from '../icons/LandingIcons';
import AppIcon from '../../common/AppIcon';

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const FAQS = [
  {
    q: 'How does the minimal transfer algorithm work?',
    a: 'TripSplit calculates the exact net balance of every traveler across multiple currencies and solves a minimum-cost network flow graph. This eliminates circular and bilateral debts, letting groups settle in 2 to 3 direct transfers instead of 10+ messy payments.',
  },
  {
    q: 'Does TripSplit work completely offline or on flights?',
    a: 'Yes! TripSplit is designed offline-first with local encrypted SQLite storage. You can log expenses, check itinerary stops, and view balances at 30,000 feet or in remote hiking trails with zero internet. Once reconnected, changes sync conflict-free automatically.',
  },
  {
    q: 'How does multi-currency splitting & live FX work?',
    a: 'You can log expenses in any global currency (EUR, USD, GBP, JPY, THB, AED, INR). TripSplit locks in institutional real-time exchange rates, automatically converting each member’s share to their preferred home currency.',
  },
  {
    q: 'What is Trip Wrapped and how does it work?',
    a: 'Just like Spotify Wrapped, TripSplit automatically generates an interactive animated story recap at the end of your trip. It showcases total kilometers traveled, spending superlatives (The Bank, Frugal King), trip soundtracks, and unforgettable highlights.',
  },
  {
    q: 'Is my data secure and private?',
    a: 'All data is secured with AES-256 encryption. We never sell or monetize your trip data, and you maintain complete control over group access with role-based permissions (Admin, Editor, Viewer).',
  },
];

export function FaqAndPricing() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <View style={styles.container}>
      {/* Pricing Header */}
      <View style={styles.pricingSection}>
        <View style={styles.badgeRow}>
          <View style={styles.badge}>
            <IconSparkles size={14} color={colors.brand.primary} />
            <Text style={styles.badgeText}>TRANSPARENT & SIMPLE</Text>
          </View>
        </View>
        <Text style={styles.sectionHeading}>
          Plans for every kind of adventure
        </Text>
        <Text style={styles.sectionSub}>
          Start free forever or unlock AI receipt scanning and automated Trip
          Wrapped for your crew.
        </Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pricingRow}
          snapToInterval={310}
          decelerationRate="fast"
        >
          {/* Tier 1: Free */}
          <View style={styles.pricingCard}>
            <Text style={styles.tierName}>DRIFTER</Text>
            <View style={styles.priceContainer}>
              <Text style={styles.tierPrice}>Free</Text>
            </View>
            <Text style={styles.tierMeta}>
              Forever · No credit card required
            </Text>

            <View style={styles.featureList}>
              {[
                'Unlimited group trips',
                'Graph debt simplification',
                'Up to 8 members per trip',
                'Offline-first mobile sync',
                'Basic itinerary planning',
              ].map(f => (
                <View key={f} style={styles.featureItem}>
                  <IconCheck size={14} color={colors.brand.emerald} />
                  <Text style={styles.featureText}>{f}</Text>
                </View>
              ))}
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.ghostButton,
                pressed && styles.buttonPressed,
              ]}
            >
              <Text style={styles.ghostButtonText}>Start Free</Text>
            </Pressable>
          </View>

          {/* Tier 2: Explorer Pro (Highlighted) */}
          <View style={[styles.pricingCard, styles.proCard]}>
            <View style={styles.popularBadge}>
              <Text style={styles.popularText}>MOST POPULAR</Text>
            </View>

            <Text style={[styles.tierName, { color: colors.brand.primary }]}>
              EXPLORER PRO
            </Text>
            <View style={styles.priceContainer}>
              <Text style={styles.tierPrice}>₹149</Text>
              <Text style={styles.perTrip}> / single trip</Text>
            </View>
            <Text style={styles.tierMeta}>
              Split among the whole crew (~₹25/person)
            </Text>

            <View style={styles.featureList}>
              {[
                'Everything in Free for unlimited members',
                'AI camera receipt OCR itemization',
                'Live institutional multi-currency FX',
                'Interactive "Trip Wrapped" story recap',
                'Live flight & stay booking voucher cards',
                'Export detailed PDF & CSV reports',
              ].map(f => (
                <View key={f} style={styles.featureItem}>
                  <IconCheck size={14} color={colors.brand.primary} />
                  <Text style={styles.featureText}>{f}</Text>
                </View>
              ))}
            </View>

            <Pressable
              style={({ pressed }) => [pressed && styles.buttonPressed]}
            >
              <LinearGradient
                colors={colors.gradients.brand}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.primaryButton}
              >
                <Text style={styles.primaryButtonText}>Get Explorer Pro</Text>
              </LinearGradient>
            </Pressable>
          </View>

          {/* Tier 3: Annual Voyager */}
          <View style={styles.pricingCard}>
            <Text style={styles.tierName}>VOYAGER ANNUAL</Text>
            <View style={styles.priceContainer}>
              <Text style={styles.tierPrice}>₹999</Text>
              <Text style={styles.perTrip}> / year</Text>
            </View>
            <Text style={styles.tierMeta}>
              For frequent travelers & nomad crews
            </Text>

            <View style={styles.featureList}>
              {[
                'Unlimited Pro trips all year round',
                'Personal travel savings vault & goals',
                'Priority flight tracker & gate change alerts',
                'Custom gamified superlatives & badges',
                'Dedicated 24/7 travel concierge support',
              ].map(f => (
                <View key={f} style={styles.featureItem}>
                  <IconCheck size={14} color={colors.brand.emerald} />
                  <Text style={styles.featureText}>{f}</Text>
                </View>
              ))}
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.ghostButton,
                pressed && styles.buttonPressed,
              ]}
            >
              <Text style={styles.ghostButtonText}>Choose Voyager</Text>
            </Pressable>
          </View>
        </ScrollView>
      </View>

      {/* FAQs Section */}
      <View style={styles.faqSection}>
        <View style={styles.badgeRow}>
          <View style={styles.badge}>
            <AppIcon
              name="help-circle"
              size={14}
              color={colors.brand.primary}
            />
            <Text style={styles.badgeText}>GOT QUESTIONS?</Text>
          </View>
        </View>
        <Text style={styles.sectionHeading}>Frequently Asked Questions</Text>

        <View style={styles.faqList}>
          {FAQS.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <View
                key={faq.q}
                style={[styles.faqCard, isOpen && styles.faqCardOpen]}
              >
                <Pressable
                  onPress={() => toggleFaq(idx)}
                  style={styles.faqQuestionRow}
                >
                  <Text
                    style={[
                      styles.faqQuestion,
                      isOpen && styles.faqQuestionOpen,
                    ]}
                  >
                    {faq.q}
                  </Text>
                  <View
                    style={[
                      styles.faqChevronWrap,
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
                  <View style={styles.faqAnswerBody}>
                    <Text style={styles.faqAnswerText}>{faq.a}</Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingVertical: spacing.sectionMd,
  },
  pricingSection: {
    marginBottom: spacing.sectionLg,
  },
  badgeRow: {
    flexDirection: 'row',
    marginBottom: spacing.xs,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.brand.primarySoft,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
    marginBottom: spacing.xs,
  },
  badgeText: {
    ...typography.label,
    color: colors.brand.primary,
    marginLeft: 6,
  },
  sectionHeading: {
    ...typography.heading2.desktop,
    color: colors.light.textPrimary,
    marginBottom: spacing.xs,
  },
  sectionSub: {
    ...typography.body.desktop,
    color: colors.light.textSecondary,
    marginBottom: spacing.xl,
    maxWidth: 680,
  },

  // Pricing Cards
  pricingRow: {
    flexDirection: 'row',
    gap: spacing.lg,
    paddingVertical: spacing.md,
    paddingRight: spacing.xl,
  },
  pricingCard: {
    width: 290,
    backgroundColor: colors.light.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.light.border,
    justifyContent: 'space-between',
    ...shadow.card,
  },
  proCard: {
    borderColor: colors.brand.primary,
    borderWidth: 2,
    position: 'relative',
    ...shadow.glowBlue,
  },
  popularBadge: {
    position: 'absolute',
    top: -12,
    right: 20,
    backgroundColor: colors.brand.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  popularText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  tierName: {
    ...typography.label,
    color: colors.light.textMuted,
    letterSpacing: 1.2,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginVertical: spacing.sm,
  },
  tierPrice: {
    fontSize: 34,
    fontWeight: '900',
    color: colors.light.textPrimary,
  },
  perTrip: {
    fontSize: 13,
    color: colors.light.textMuted,
    fontWeight: '600',
    marginLeft: 4,
  },
  tierMeta: {
    fontSize: 12,
    color: colors.light.textSecondary,
    marginBottom: spacing.lg,
  },
  featureList: {
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  featureText: {
    fontSize: 12,
    color: colors.light.textSecondary,
    flex: 1,
    lineHeight: 18,
  },
  ghostButton: {
    backgroundColor: colors.light.surfaceMuted,
    paddingVertical: 12,
    borderRadius: radius.pill,
    alignItems: 'center',
  },
  ghostButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.light.textPrimary,
  },
  primaryButton: {
    paddingVertical: 12,
    borderRadius: radius.pill,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  buttonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },

  // FAQ
  faqSection: {
    marginTop: spacing.md,
  },
  faqList: {
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  faqCard: {
    backgroundColor: colors.light.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.light.border,
    overflow: 'hidden',
    ...shadow.soft,
  },
  faqCardOpen: {
    borderColor: 'rgba(37,99,235,0.3)',
    ...shadow.card,
  },
  faqQuestionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
  },
  faqQuestion: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.light.textPrimary,
    flex: 1,
    paddingRight: spacing.md,
  },
  faqQuestionOpen: {
    color: colors.brand.primary,
  },
  faqChevronWrap: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  faqAnswerBody: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.light.surfaceMuted,
    paddingTop: spacing.md,
  },
  faqAnswerText: {
    fontSize: 13,
    lineHeight: 22,
    color: colors.light.textSecondary,
  },
});

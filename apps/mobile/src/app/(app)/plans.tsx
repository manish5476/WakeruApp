import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  Alert,
  ActivityIndicator,
  Modal,
  Linking,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../providers/ThemeProvider';
import AppIcon from '../../components/common/AppIcon';
import { GlassCard } from '../../components/ui/GlassCard';
import { GlobalBackground } from '../../components/ui/GlobalBackground';
import { useEntitlements, usePublicPlans } from '../../hooks/useEntitlements';
import { subscriptionApi } from '../../services/api/subscription.api';
import { IPlan } from '../../types/subscription.types';
import { haptics } from '../../utils/haptics';
import { showToast } from '../../utils/toast';

export default function PlansScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const {
    entitlements,
    planKey: currentPlanKey,
    isPaid,
    refetchEntitlements,
  } = useEntitlements();

  const { data: plans = [], isLoading: plansLoading } = usePublicPlans();
  const [billingCycle, setBillingCycle] = useState<'month' | 'year'>('month');
  const [currency, setCurrency] = useState<'INR' | 'USD'>('INR');

  // Checkout Modal State
  const [checkoutPlan, setCheckoutPlan] = useState<IPlan | null>(null);
  const [isProcessingCheckout, setIsProcessingCheckout] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);

  // Format limit helper
  const formatLimit = (limit: any) => {
    if (!limit) return '—';
    if (limit.unlimited || limit.value === null) return 'Unlimited';
    return `${limit.value} ${limit.unit || ''}`.trim();
  };

  // Helper to format date
  const formatPeriodDate = (dateStr?: string) => {
    if (!dateStr) return 'End of current cycle';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  // Open checkout review sheet
  const handleOpenCheckout = (plan: IPlan) => {
    if (plan.key === currentPlanKey) {
      Alert.alert('Current Plan', `You are already enjoying the ${plan.name}.`);
      return;
    }
    haptics.selection();
    setCheckoutPlan(plan);
  };

  // Process checkout confirmation
  const handleConfirmCheckout = async () => {
    if (!checkoutPlan) return;

    haptics.medium();
    setIsProcessingCheckout(true);

    try {
      // 1. Request official checkout session from backend
      const res = await subscriptionApi.createCheckout(
        checkoutPlan.key,
        billingCycle,
        currency,
        {
          successUrl: `${Platform.OS === 'web' ? window.location.origin : 'https://wakeru.net'}/plans?checkout=success`,
          cancelUrl: `${Platform.OS === 'web' ? window.location.origin : 'https://wakeru.net'}/plans?checkout=canceled`,
        },
      );

      const session = res.data;

      // 2. If checkout URL returned and not a mock placeholder, open gateway
      if (
        session?.checkoutUrl &&
        !session.checkoutUrl.startsWith('/checkout-complete')
      ) {
        await Linking.openURL(session.checkoutUrl);
        setCheckoutPlan(null);
        showToast.info(
          'Payment Page Opened',
          'Complete the transaction to activate your plan.',
        );
        return;
      }

      // 3. Sandbox / Mock / Dev auto-completion
      await subscriptionApi.simulatePurchase(checkoutPlan.key);
      await refetchEntitlements();
      haptics.success();
      setCheckoutPlan(null);

      Alert.alert(
        'Plan Activated! 🌟',
        `Your membership has been upgraded to ${checkoutPlan.name}. Your enhanced group size, AI receipts, and analytics are ready.`,
        [{ text: 'Awesome', onPress: () => router.back() }],
      );
    } catch (err: any) {
      haptics.error();
      Alert.alert(
        'Purchase Error',
        err?.message || 'Unable to process purchase. Please try again.',
      );
    } finally {
      setIsProcessingCheckout(false);
    }
  };

  // Cancel subscription handler
  const handleCancelSubscription = () => {
    haptics.warning();
    Alert.alert(
      'Cancel Auto-Renew?',
      `Your ${entitlements?.plan?.name || 'Pro'} membership benefits will remain active until ${formatPeriodDate(
        entitlements?.subscription?.currentPeriodEnd,
      )}. You will not be charged again.`,
      [
        { text: 'Keep Plan', style: 'cancel' },
        {
          text: 'Cancel Subscription',
          style: 'destructive',
          onPress: async () => {
            setIsCanceling(true);
            try {
              await subscriptionApi.cancelSubscription();
              await refetchEntitlements();
              haptics.success();
              showToast.success(
                'Auto-Renew Cancelled',
                'Your access remains active until the end of your billing cycle.',
              );
            } catch (err: any) {
              haptics.error();
              Alert.alert(
                'Cancellation Error',
                err?.message || 'Unable to cancel subscription.',
              );
            } finally {
              setIsCanceling(false);
            }
          },
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <GlobalBackground />
      </View>
      {/* Top Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: Platform.OS === 'web' ? 20 : insets.top + 8,
            borderBottomColor: theme.colors.borderLight,
            backgroundColor: theme.isDark
              ? 'rgba(15, 23, 42, 0.45)'
              : 'rgba(255, 255, 255, 0.45)',
          },
        ]}
      >
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}
          hitSlop={10}
        >
          <AppIcon
            name="chevron-left"
            size={22}
            color={theme.colors.textPrimary}
          />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>
          Membership & Billing
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 20) + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Active Subscription Management Card */}
        {entitlements && (
          <GlassCard
            style={[
              styles.currentPlanBanner,
              { borderColor: theme.colors.borderLight },
            ]}
            intensity={20}
          >
            <View style={styles.currentPlanTop}>
              <View style={styles.planBadgeWrap}>
                <View
                  style={[
                    styles.statusIndicatorDot,
                    {
                      backgroundColor: isPaid
                        ? theme.colors.primary
                        : theme.colors.success,
                    },
                  ]}
                />
                <Text
                  style={[
                    styles.currentPlanLabel,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  CURRENT PLAN
                </Text>
              </View>

              <View
                style={[
                  styles.subscriptionStatusTag,
                  {
                    backgroundColor: entitlements.subscription
                      ?.cancelAtPeriodEnd
                      ? 'rgba(239, 68, 68, 0.12)'
                      : `${theme.colors.success}18`,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.subscriptionStatusText,
                    {
                      color: entitlements.subscription?.cancelAtPeriodEnd
                        ? '#EF4444'
                        : theme.colors.success,
                    },
                  ]}
                >
                  {entitlements.subscription?.cancelAtPeriodEnd
                    ? 'EXPIRES AT PERIOD END'
                    : 'ACTIVE'}
                </Text>
              </View>
            </View>

            <View style={styles.currentPlanDetails}>
              <Text
                style={[
                  styles.currentPlanName,
                  { color: theme.colors.textPrimary },
                ]}
              >
                {entitlements.plan.name}
              </Text>
              {isPaid && entitlements.subscription?.currentPeriodEnd && (
                <Text
                  style={[
                    styles.currentPlanExpiry,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  {entitlements.subscription.cancelAtPeriodEnd
                    ? 'Access ends on'
                    : 'Next renewal on'}
                  :{' '}
                  <Text
                    style={{
                      fontWeight: '700',
                      color: theme.colors.textPrimary,
                    }}
                  >
                    {formatPeriodDate(
                      entitlements.subscription.currentPeriodEnd,
                    )}
                  </Text>
                </Text>
              )}
            </View>

            {/* Live Usage Bar */}
            <View style={styles.usageContainer}>
              <View style={styles.usageLabelRow}>
                <Text
                  style={[
                    styles.usageLabelText,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  Trip Capacity Usage
                </Text>
                <Text
                  style={[
                    styles.usageValueText,
                    { color: theme.colors.textPrimary },
                  ]}
                >
                  {entitlements.usage.trips || 0} /{' '}
                  {entitlements.limits.trips?.unlimited
                    ? '∞'
                    : entitlements.limits.trips?.value || 5}
                </Text>
              </View>
              <View
                style={[
                  styles.usageProgressBarBg,
                  { backgroundColor: theme.colors.borderLight },
                ]}
              >
                <View
                  style={[
                    styles.usageProgressBarFill,
                    {
                      backgroundColor: theme.colors.primary,
                      width: entitlements.limits.trips?.unlimited
                        ? '15%'
                        : `${Math.min(100, ((entitlements.usage.trips || 0) / (entitlements.limits.trips?.value || 5)) * 100)}%`,
                    },
                  ]}
                />
              </View>
            </View>

            {/* Cancel Auto-Renew Button if paid and not yet canceled */}
            {isPaid && !entitlements.subscription?.cancelAtPeriodEnd && (
              <Pressable
                onPress={handleCancelSubscription}
                disabled={isCanceling}
                style={({ pressed }) => [
                  styles.cancelPlanBtn,
                  { borderColor: theme.colors.borderLight },
                  pressed && { opacity: 0.7 },
                ]}
              >
                {isCanceling ? (
                  <ActivityIndicator
                    size="small"
                    color={theme.colors.textSecondary}
                  />
                ) : (
                  <Text
                    style={[
                      styles.cancelPlanBtnText,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    Cancel Auto-Renewal
                  </Text>
                )}
              </Pressable>
            )}
          </GlassCard>
        )}

        {/* Hero & Switchers */}
        <View style={styles.heroSection}>
          <View
            style={[
              styles.heroPill,
              {
                backgroundColor: `${theme.colors.primary}18`,
                borderColor: `${theme.colors.primary}30`,
              },
            ]}
          >
            <AppIcon name="sparkles" size={13} color={theme.colors.primary} />
            <Text
              style={[styles.heroPillText, { color: theme.colors.primary }]}
            >
              POWERFUL TRAVEL ACCOUNTING
            </Text>
          </View>
          <Text style={[styles.heroTitle, { color: theme.colors.textPrimary }]}>
            Upgrade Your Splitting Experience
          </Text>
          <Text style={[styles.heroSub, { color: theme.colors.textSecondary }]}>
            Scale your itineraries, itemize group receipts with AI, and unlock
            deep category analytics.
          </Text>

          {/* Switchers Row: Billing Cycle & Currency */}
          <View style={styles.switchersRow}>
            {/* Monthly / Yearly Toggle */}
            <View
              style={[
                styles.cycleToggleContainer,
                {
                  backgroundColor: theme.isDark
                    ? 'rgba(255,255,255,0.06)'
                    : 'rgba(0,0,0,0.04)',
                  borderColor: theme.colors.borderLight,
                },
              ]}
            >
              <Pressable
                onPress={() => {
                  haptics.selection();
                  setBillingCycle('month');
                }}
                style={[
                  styles.cycleTab,
                  billingCycle === 'month' && [
                    styles.cycleTabActive,
                    { backgroundColor: theme.colors.surface },
                  ],
                ]}
              >
                <Text
                  style={[
                    styles.cycleTabText,
                    {
                      color:
                        billingCycle === 'month'
                          ? theme.colors.textPrimary
                          : theme.colors.textSecondary,
                    },
                  ]}
                >
                  Monthly
                </Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  haptics.selection();
                  setBillingCycle('year');
                }}
                style={[
                  styles.cycleTab,
                  billingCycle === 'year' && [
                    styles.cycleTabActive,
                    { backgroundColor: theme.colors.surface },
                  ],
                ]}
              >
                <Text
                  style={[
                    styles.cycleTabText,
                    {
                      color:
                        billingCycle === 'year'
                          ? theme.colors.textPrimary
                          : theme.colors.textSecondary,
                    },
                  ]}
                >
                  Yearly
                </Text>
                <View
                  style={[
                    styles.discountBadge,
                    { backgroundColor: theme.colors.success },
                  ]}
                >
                  <Text style={styles.discountBadgeText}>20% OFF</Text>
                </View>
              </Pressable>
            </View>

            {/* Currency Selector */}
            <View
              style={[
                styles.currencyToggleContainer,
                {
                  backgroundColor: theme.isDark
                    ? 'rgba(255,255,255,0.06)'
                    : 'rgba(0,0,0,0.04)',
                  borderColor: theme.colors.borderLight,
                },
              ]}
            >
              <Pressable
                onPress={() => {
                  haptics.selection();
                  setCurrency('INR');
                }}
                style={[
                  styles.currencyTab,
                  currency === 'INR' && [
                    styles.cycleTabActive,
                    { backgroundColor: theme.colors.surface },
                  ],
                ]}
              >
                <Text
                  style={[
                    styles.currencyTabText,
                    {
                      color:
                        currency === 'INR'
                          ? theme.colors.textPrimary
                          : theme.colors.textSecondary,
                    },
                  ]}
                >
                  ₹ INR
                </Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  haptics.selection();
                  setCurrency('USD');
                }}
                style={[
                  styles.currencyTab,
                  currency === 'USD' && [
                    styles.cycleTabActive,
                    { backgroundColor: theme.colors.surface },
                  ],
                ]}
              >
                <Text
                  style={[
                    styles.currencyTabText,
                    {
                      color:
                        currency === 'USD'
                          ? theme.colors.textPrimary
                          : theme.colors.textSecondary,
                    },
                  ]}
                >
                  $ USD
                </Text>
              </Pressable>
            </View>
          </View>
        </View>

        {/* Dynamic Plan Cards Grid */}
        {plansLoading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text
              style={[
                styles.loadingText,
                { color: theme.colors.textSecondary },
              ]}
            >
              Loading available membership tiers...
            </Text>
          </View>
        ) : (
          <View style={styles.cardsGrid}>
            {plans.map(plan => {
              const isCurrent = plan.key === currentPlanKey;
              const isPro = plan.key === 'pro';
              const isSuper = plan.key === 'super_pro';

              let displayPrice = 'Free';
              let periodSuffix = '';
              let savingsNote = '';

              if (plan.pricing.amount > 0) {
                if (currency === 'INR') {
                  const mPrice = plan.pricing.amount;
                  const yPrice =
                    plan.pricing.yearlyAmount || Math.round(mPrice * 0.8 * 12);
                  displayPrice =
                    billingCycle === 'year' ? `₹${yPrice}` : `₹${mPrice}`;
                  periodSuffix = billingCycle === 'year' ? '/yr' : '/mo';
                  if (billingCycle === 'year')
                    savingsNote = 'Save 20% vs monthly';
                } else {
                  const tier = plan.pricing.tiers?.USD;
                  const mPrice = tier?.amount ?? (isPro ? 4.99 : 9.99);
                  const yPrice = tier?.yearlyAmount ?? (isPro ? 39.99 : 79.99);
                  displayPrice =
                    billingCycle === 'year' ? `$${yPrice}` : `$${mPrice}`;
                  periodSuffix = billingCycle === 'year' ? '/yr' : '/mo';
                  if (billingCycle === 'year')
                    savingsNote = 'Save 20% vs monthly';
                }
              }

              return (
                <GlassCard
                  key={plan.key}
                  style={[
                    styles.planCard,
                    {
                      borderColor: isCurrent
                        ? theme.colors.primary
                        : theme.colors.borderLight,
                    },
                    isPro &&
                      !isCurrent && {
                        borderColor: `${theme.colors.primary}70`,
                      },
                    isSuper &&
                      !isCurrent && {
                        borderColor: `${theme.colors.success}60`,
                      },
                  ]}
                  intensity={theme.isDark ? 22 : 35}
                >
                  {isPro && (
                    <View
                      style={[
                        styles.popularBadge,
                        { backgroundColor: theme.colors.primary },
                      ]}
                    >
                      <Text style={styles.popularBadgeText}>MOST POPULAR</Text>
                    </View>
                  )}

                  <View style={styles.planCardHeader}>
                    <Text
                      style={[
                        styles.planCardName,
                        { color: theme.colors.textPrimary },
                      ]}
                    >
                      {plan.name}
                    </Text>
                    <Text
                      style={[
                        styles.planCardDesc,
                        { color: theme.colors.textSecondary },
                      ]}
                    >
                      {plan.description}
                    </Text>

                    <View style={styles.priceRow}>
                      <Text
                        style={[
                          styles.priceAmount,
                          { color: theme.colors.textPrimary },
                        ]}
                      >
                        {displayPrice}
                      </Text>
                      {periodSuffix !== '' && (
                        <Text
                          style={[
                            styles.pricePeriod,
                            { color: theme.colors.textSecondary },
                          ]}
                        >
                          {periodSuffix}
                        </Text>
                      )}
                    </View>
                    {savingsNote !== '' && (
                      <Text
                        style={[
                          styles.savingsNote,
                          { color: theme.colors.success },
                        ]}
                      >
                        {savingsNote}
                      </Text>
                    )}
                  </View>

                  <View style={styles.divider} />

                  {/* Highlights */}
                  <View style={styles.featureList}>
                    <View style={styles.featureRow}>
                      <AppIcon
                        name="map-pin"
                        size={14}
                        color={theme.colors.primary}
                      />
                      <Text
                        style={[
                          styles.featureText,
                          { color: theme.colors.textPrimary },
                        ]}
                      >
                        {formatLimit(plan.limits?.trips)}
                      </Text>
                    </View>

                    <View style={styles.featureRow}>
                      <AppIcon
                        name="users"
                        size={14}
                        color={theme.colors.primary}
                      />
                      <Text
                        style={[
                          styles.featureText,
                          { color: theme.colors.textPrimary },
                        ]}
                      >
                        {formatLimit(plan.limits?.peoplePerTrip)}
                      </Text>
                    </View>

                    <View style={styles.featureRow}>
                      <AppIcon
                        name="navigation"
                        size={14}
                        color={theme.colors.primary}
                      />
                      <Text
                        style={[
                          styles.featureText,
                          { color: theme.colors.textPrimary },
                        ]}
                      >
                        {formatLimit(plan.limits?.stopsPerTrip)}
                      </Text>
                    </View>

                    <View style={styles.featureRow}>
                      <AppIcon
                        name="camera"
                        size={14}
                        color={theme.colors.success}
                      />
                      <Text
                        style={[
                          styles.featureText,
                          { color: theme.colors.textPrimary },
                        ]}
                      >
                        {plan.limits?.monthlyReceiptOCR?.unlimited
                          ? 'Unlimited AI Receipt Scans'
                          : `${plan.limits?.monthlyReceiptOCR?.value || 3} AI Receipt Scans/mo`}
                      </Text>
                    </View>

                    {plan.features?.advanced_analytics && (
                      <View style={styles.featureRow}>
                        <AppIcon
                          name="bar-chart-2"
                          size={14}
                          color={theme.colors.success}
                        />
                        <Text
                          style={[
                            styles.featureText,
                            { color: theme.colors.textPrimary },
                          ]}
                        >
                          Advanced Analytics & Insights
                        </Text>
                      </View>
                    )}

                    {plan.features?.custom_trip_cover && (
                      <View style={styles.featureRow}>
                        <AppIcon
                          name="image"
                          size={14}
                          color={theme.colors.success}
                        />
                        <Text
                          style={[
                            styles.featureText,
                            { color: theme.colors.textPrimary },
                          ]}
                        >
                          Custom Trip Covers & Wallpapers
                        </Text>
                      </View>
                    )}

                    {plan.features?.priority_support && (
                      <View style={styles.featureRow}>
                        <AppIcon
                          name="award"
                          size={14}
                          color={theme.colors.warning}
                        />
                        <Text
                          style={[
                            styles.featureText,
                            { color: theme.colors.textPrimary },
                          ]}
                        >
                          Priority 24/7 Dedicated Support
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* CTA Action Button */}
                  <Pressable
                    disabled={isCurrent}
                    onPress={() => handleOpenCheckout(plan)}
                    style={({ pressed }) => [
                      styles.ctaBtn,
                      isCurrent
                        ? [
                            styles.ctaBtnCurrent,
                            { borderColor: theme.colors.borderLight },
                          ]
                        : [
                            styles.ctaBtnActive,
                            {
                              backgroundColor:
                                isPro || isSuper
                                  ? theme.colors.primary
                                  : theme.colors.textPrimary,
                            },
                          ],
                      pressed && !isCurrent && { opacity: 0.9 },
                    ]}
                  >
                    <Text
                      style={[
                        styles.ctaBtnText,
                        isCurrent
                          ? { color: theme.colors.textSecondary }
                          : { color: theme.colors.background },
                      ]}
                    >
                      {isCurrent
                        ? 'Current Plan'
                        : plan.pricing.amount === 0
                          ? 'Switch to Free'
                          : `Upgrade to ${plan.name}`}
                    </Text>
                  </Pressable>
                </GlassCard>
              );
            })}
          </View>
        )}

        {/* Feature Comparison Table */}
        <View style={styles.comparisonSection}>
          <Text
            style={[
              styles.comparisonTitle,
              { color: theme.colors.textPrimary },
            ]}
          >
            Detailed Plan Comparison
          </Text>

          <GlassCard
            style={[
              styles.tableCard,
              { borderColor: theme.colors.borderLight },
            ]}
            intensity={20}
          >
            <View
              style={[
                styles.tableRow,
                styles.tableHeaderRow,
                { borderBottomColor: theme.colors.borderLight },
              ]}
            >
              <Text
                style={[
                  styles.colFeature,
                  styles.tableHeaderText,
                  { color: theme.colors.textSecondary },
                ]}
              >
                CAPABILITY
              </Text>
              {plans.map(p => (
                <Text
                  key={p.key}
                  style={[
                    styles.colPlan,
                    styles.tableHeaderText,
                    { color: theme.colors.textPrimary },
                  ]}
                >
                  {p.name.split(' ')[0]}
                </Text>
              ))}
            </View>

            <View
              style={[
                styles.tableRow,
                { borderBottomColor: theme.colors.borderLight },
              ]}
            >
              <Text
                style={[styles.colFeature, { color: theme.colors.textPrimary }]}
              >
                Trip Capacity
              </Text>
              {plans.map(p => (
                <Text
                  key={p.key}
                  style={[
                    styles.colPlan,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  {p.limits?.trips?.unlimited
                    ? '∞'
                    : (p.limits?.trips?.value ?? '—')}
                </Text>
              ))}
            </View>

            <View
              style={[
                styles.tableRow,
                { borderBottomColor: theme.colors.borderLight },
              ]}
            >
              <Text
                style={[styles.colFeature, { color: theme.colors.textPrimary }]}
              >
                People / Trip
              </Text>
              {plans.map(p => (
                <Text
                  key={p.key}
                  style={[
                    styles.colPlan,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  {p.limits?.peoplePerTrip?.unlimited
                    ? '∞'
                    : (p.limits?.peoplePerTrip?.value ?? '—')}
                </Text>
              ))}
            </View>

            <View
              style={[
                styles.tableRow,
                { borderBottomColor: theme.colors.borderLight },
              ]}
            >
              <Text
                style={[styles.colFeature, { color: theme.colors.textPrimary }]}
              >
                Stops / Itinerary
              </Text>
              {plans.map(p => (
                <Text
                  key={p.key}
                  style={[
                    styles.colPlan,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  {p.limits?.stopsPerTrip?.unlimited
                    ? '∞'
                    : (p.limits?.stopsPerTrip?.value ?? '—')}
                </Text>
              ))}
            </View>

            <View
              style={[
                styles.tableRow,
                { borderBottomColor: theme.colors.borderLight },
              ]}
            >
              <Text
                style={[styles.colFeature, { color: theme.colors.textPrimary }]}
              >
                AI Receipt OCR
              </Text>
              {plans.map(p => (
                <Text
                  key={p.key}
                  style={[
                    styles.colPlan,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  {p.limits?.monthlyReceiptOCR?.unlimited
                    ? '∞'
                    : `${p.limits?.monthlyReceiptOCR?.value || 3}/mo`}
                </Text>
              ))}
            </View>

            <View
              style={[
                styles.tableRow,
                { borderBottomColor: theme.colors.borderLight },
              ]}
            >
              <Text
                style={[styles.colFeature, { color: theme.colors.textPrimary }]}
              >
                Deep Analytics
              </Text>
              {plans.map(p => (
                <View key={p.key} style={styles.colPlanCenter}>
                  <AppIcon
                    name={p.features?.advanced_analytics ? 'check' : 'x'}
                    size={14}
                    color={
                      p.features?.advanced_analytics
                        ? theme.colors.success
                        : theme.colors.textTertiary
                    }
                  />
                </View>
              ))}
            </View>

            <View style={styles.tableRow}>
              <Text
                style={[styles.colFeature, { color: theme.colors.textPrimary }]}
              >
                Priority Support
              </Text>
              {plans.map(p => (
                <View key={p.key} style={styles.colPlanCenter}>
                  <AppIcon
                    name={p.features?.priority_support ? 'check' : 'x'}
                    size={14}
                    color={
                      p.features?.priority_support
                        ? theme.colors.warning
                        : theme.colors.textTertiary
                    }
                  />
                </View>
              ))}
            </View>
          </GlassCard>
        </View>
      </ScrollView>

      {/* Checkout Order Summary Modal */}
      <Modal
        visible={!!checkoutPlan}
        transparent
        animationType="slide"
        onRequestClose={() => setCheckoutPlan(null)}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={styles.modalDismiss}
            onPress={() => setCheckoutPlan(null)}
          />
          <View
            style={[
              styles.checkoutSheet,
              { backgroundColor: theme.colors.surface },
            ]}
          >
            {/* Sheet Header */}
            <View
              style={[
                styles.checkoutSheetHeader,
                { borderBottomColor: theme.colors.borderLight },
              ]}
            >
              <View>
                <Text
                  style={[
                    styles.sheetTitle,
                    { color: theme.colors.textPrimary },
                  ]}
                >
                  Order Review
                </Text>
                <Text
                  style={[
                    styles.sheetSubtitle,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  Confirm your membership selection
                </Text>
              </View>
              <Pressable
                onPress={() => setCheckoutPlan(null)}
                style={({ pressed }) => [
                  styles.closeSheetBtn,
                  pressed && { opacity: 0.7 },
                ]}
              >
                <AppIcon name="x" size={20} color={theme.colors.textPrimary} />
              </Pressable>
            </View>

            {checkoutPlan && (
              <ScrollView
                style={styles.sheetBody}
                showsVerticalScrollIndicator={false}
              >
                {/* Plan Summary Row */}
                <View
                  style={[
                    styles.summaryCard,
                    {
                      backgroundColor: `${theme.colors.primary}0D`,
                      borderColor: `${theme.colors.primary}25`,
                    },
                  ]}
                >
                  <View style={styles.summaryCardLeft}>
                    <View
                      style={[
                        styles.planIconWrap,
                        { backgroundColor: `${theme.colors.primary}20` },
                      ]}
                    >
                      <AppIcon
                        name="award"
                        size={22}
                        color={theme.colors.primary}
                      />
                    </View>
                    <View>
                      <Text
                        style={[
                          styles.summaryPlanName,
                          { color: theme.colors.textPrimary },
                        ]}
                      >
                        {checkoutPlan.name}
                      </Text>
                      <Text
                        style={[
                          styles.summaryBillingInterval,
                          { color: theme.colors.textSecondary },
                        ]}
                      >
                        {billingCycle === 'year'
                          ? 'Billed annually'
                          : 'Billed monthly'}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Price Breakdown */}
                <View
                  style={[
                    styles.breakdownCard,
                    { borderColor: theme.colors.borderLight },
                  ]}
                >
                  <View style={styles.breakdownRow}>
                    <Text
                      style={[
                        styles.breakdownLabel,
                        { color: theme.colors.textSecondary },
                      ]}
                    >
                      Base Subscription
                    </Text>
                    <Text
                      style={[
                        styles.breakdownValue,
                        { color: theme.colors.textPrimary },
                      ]}
                    >
                      {currency === 'INR'
                        ? `₹${billingCycle === 'year' ? checkoutPlan.pricing.yearlyAmount || Math.round(checkoutPlan.pricing.amount * 0.8 * 12) : checkoutPlan.pricing.amount}`
                        : `$${billingCycle === 'year' ? checkoutPlan.pricing.tiers?.USD?.yearlyAmount || 39.99 : checkoutPlan.pricing.tiers?.USD?.amount || 4.99}`}
                    </Text>
                  </View>

                  {billingCycle === 'year' && (
                    <View style={styles.breakdownRow}>
                      <Text
                        style={[
                          styles.breakdownLabel,
                          { color: theme.colors.success },
                        ]}
                      >
                        Annual Discount (20% OFF)
                      </Text>
                      <Text
                        style={[
                          styles.breakdownValue,
                          { color: theme.colors.success },
                        ]}
                      >
                        Included
                      </Text>
                    </View>
                  )}

                  <View style={styles.breakdownRow}>
                    <Text
                      style={[
                        styles.breakdownLabel,
                        { color: theme.colors.textSecondary },
                      ]}
                    >
                      Estimated Taxes (GST)
                    </Text>
                    <Text
                      style={[
                        styles.breakdownValue,
                        { color: theme.colors.textSecondary },
                      ]}
                    >
                      Included
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.breakdownDivider,
                      { backgroundColor: theme.colors.borderLight },
                    ]}
                  />

                  <View style={styles.breakdownRow}>
                    <Text
                      style={[
                        styles.totalLabel,
                        { color: theme.colors.textPrimary },
                      ]}
                    >
                      Total Due Today
                    </Text>
                    <Text
                      style={[
                        styles.totalValue,
                        { color: theme.colors.primary },
                      ]}
                    >
                      {currency === 'INR'
                        ? `₹${billingCycle === 'year' ? checkoutPlan.pricing.yearlyAmount || Math.round(checkoutPlan.pricing.amount * 0.8 * 12) : checkoutPlan.pricing.amount}`
                        : `$${billingCycle === 'year' ? checkoutPlan.pricing.tiers?.USD?.yearlyAmount || 39.99 : checkoutPlan.pricing.tiers?.USD?.amount || 4.99}`}
                    </Text>
                  </View>
                </View>

                {/* Trust Badges */}
                <View style={styles.trustBadgesRow}>
                  <View style={styles.trustBadgeItem}>
                    <AppIcon
                      name="lock"
                      size={13}
                      color={theme.colors.success}
                    />
                    <Text
                      style={[
                        styles.trustBadgeText,
                        { color: theme.colors.textSecondary },
                      ]}
                    >
                      256-Bit SSL Encryption
                    </Text>
                  </View>
                  <View style={styles.trustBadgeItem}>
                    <AppIcon
                      name="check-circle"
                      size={13}
                      color={theme.colors.success}
                    />
                    <Text
                      style={[
                        styles.trustBadgeText,
                        { color: theme.colors.textSecondary },
                      ]}
                    >
                      Instant Activation
                    </Text>
                  </View>
                  <View style={styles.trustBadgeItem}>
                    <AppIcon
                      name="refresh-cw"
                      size={13}
                      color={theme.colors.success}
                    />
                    <Text
                      style={[
                        styles.trustBadgeText,
                        { color: theme.colors.textSecondary },
                      ]}
                    >
                      Cancel Anytime
                    </Text>
                  </View>
                </View>

                {/* Confirm & Checkout Button */}
                <Pressable
                  disabled={isProcessingCheckout}
                  onPress={handleConfirmCheckout}
                  style={({ pressed }) => [
                    styles.confirmCheckoutBtn,
                    { backgroundColor: theme.colors.primary },
                    pressed && { opacity: 0.9 },
                  ]}
                >
                  {isProcessingCheckout ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <View style={styles.confirmBtnContent}>
                      <AppIcon name="shield" size={16} color="#FFFFFF" />
                      <Text style={styles.confirmCheckoutBtnText}>
                        Proceed to Secure Checkout
                      </Text>
                    </View>
                  )}
                </Pressable>

                <Text
                  style={[
                    styles.legalDisclaimer,
                    { color: theme.colors.textTertiary },
                  ]}
                >
                  By confirming, you agree to our Terms of Service and Privacy
                  Policy. Subscriptions auto-renew until cancelled in settings.
                </Text>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 20,
  },
  currentPlanBanner: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    gap: 12,
  },
  currentPlanTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  planBadgeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusIndicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  currentPlanLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  subscriptionStatusTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  subscriptionStatusText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  currentPlanDetails: {
    gap: 2,
  },
  currentPlanName: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  currentPlanExpiry: {
    fontSize: 12.5,
    marginTop: 2,
  },
  usageContainer: {
    gap: 6,
    marginTop: 4,
  },
  usageLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  usageLabelText: {
    fontSize: 12,
    fontWeight: '600',
  },
  usageValueText: {
    fontSize: 12,
    fontWeight: '700',
  },
  usageProgressBarBg: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  usageProgressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  cancelPlanBtn: {
    borderWidth: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  cancelPlanBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  heroSection: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
  },
  heroPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  heroPillText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: -0.5,
    marginTop: 4,
  },
  heroSub: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 340,
  },
  switchersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  cycleToggleContainer: {
    flexDirection: 'row',
    borderRadius: 999,
    padding: 3,
    borderWidth: 1,
  },
  cycleTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 999,
  },
  cycleTabActive: {
    ...Platform.select({
      web: { boxShadow: '0 2px 8px rgba(0,0,0,0.06)' } as any,
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
      },
    }),
  },
  cycleTabText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  discountBadge: {
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 999,
  },
  discountBadgeText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '900',
  },
  currencyToggleContainer: {
    flexDirection: 'row',
    borderRadius: 999,
    padding: 3,
    borderWidth: 1,
  },
  currencyTab: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
  },
  currencyTabText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  loadingBox: {
    padding: 40,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    fontWeight: '500',
  },
  cardsGrid: {
    gap: 16,
  },
  planCard: {
    borderRadius: 22,
    padding: 20,
    borderWidth: 1.5,
    gap: 16,
    overflow: 'hidden',
  },
  popularBadge: {
    position: 'absolute',
    top: 14,
    right: 14,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
  },
  popularBadgeText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  planCardHeader: {
    gap: 4,
  },
  planCardName: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  planCardDesc: {
    fontSize: 12.5,
    lineHeight: 17,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 8,
  },
  priceAmount: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.6,
  },
  pricePeriod: {
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 3,
  },
  savingsNote: {
    fontSize: 11.5,
    fontWeight: '700',
    marginTop: 2,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(150, 150, 150, 0.2)',
  },
  featureList: {
    gap: 10,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    fontSize: 13,
    fontWeight: '600',
  },
  ctaBtn: {
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  ctaBtnActive: {},
  ctaBtnCurrent: {
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  ctaBtnText: {
    fontSize: 13.5,
    fontWeight: '800',
  },
  comparisonSection: {
    marginTop: 10,
    gap: 12,
  },
  comparisonTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  tableCard: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tableHeaderRow: {
    backgroundColor: 'rgba(150, 150, 150, 0.05)',
  },
  tableHeaderText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  colFeature: {
    flex: 1.5,
    fontSize: 12.5,
    fontWeight: '600',
  },
  colPlan: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '700',
  },
  colPlanCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalDismiss: {
    flex: 1,
  },
  checkoutSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '85%',
    paddingBottom: 24,
  },
  checkoutSheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  sheetSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  closeSheetBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetBody: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  summaryCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  planIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryPlanName: {
    fontSize: 17,
    fontWeight: '800',
  },
  summaryBillingInterval: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  breakdownCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    gap: 12,
    marginBottom: 16,
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  breakdownLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  breakdownValue: {
    fontSize: 13,
    fontWeight: '700',
  },
  breakdownDivider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 4,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '800',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '900',
  },
  trustBadgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
    marginBottom: 20,
  },
  trustBadgeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  trustBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  confirmCheckoutBtn: {
    paddingVertical: 15,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  confirmBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  confirmCheckoutBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  legalDisclaimer: {
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 20,
  },
});

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '../../../../providers/ThemeProvider';
import AppIcon from '../../../../components/common/AppIcon';
import { GlassCard } from '../../../../components/ui/GlassCard';
import { GlobalBackground } from '../../../../components/ui/GlobalBackground';
import { subscriptionApi } from '../../../../services/api/subscription.api';
import { IPlan } from '../../../../types/subscription.types';
import { haptics } from '../../../../utils/haptics';

export const ADMIN_PLANS_QUERY_KEY = ['admin', 'plans'];

export default function AdminPlansScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const queryClient = useQueryClient();

  const {
    data: plans = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ADMIN_PLANS_QUERY_KEY,
    queryFn: async () => {
      const res = await subscriptionApi.adminListPlans();
      return res.data || [];
    },
  });

  const archiveMutation = useMutation({
    mutationFn: async (planId: string) => {
      await subscriptionApi.adminArchivePlan(
        planId,
        'Archived by administrator from admin portal',
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_PLANS_QUERY_KEY });
      haptics.success();
      Alert.alert(
        'Plan Archived',
        'The plan is no longer available for new subscriptions.',
      );
    },
    onError: (err: any) => {
      haptics.error();
      Alert.alert('Archive Failed', err?.message || 'Could not archive plan.');
    },
  });

  const handleArchive = (plan: IPlan) => {
    if (plan.isDefault) {
      Alert.alert('Action Prohibited', 'The default plan cannot be archived.');
      return;
    }

    Alert.alert(
      'Archive Plan',
      `Are you sure you want to archive "${plan.name}"? New users will no longer be able to purchase this plan. Existing subscribers will retain their access.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Archive',
          style: 'destructive',
          onPress: () => archiveMutation.mutate(plan.id || plan._id!),
        },
      ],
    );
  };

  const totalSubscribers = plans.reduce(
    (acc, p) => acc + (p.activeSubscribers || 0),
    0,
  );
  const activePlansCount = plans.filter(p => p.status === 'active').length;

  return (
    <View style={styles.container}>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <GlobalBackground />
      </View>

      {/* Admin Header */}
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
        <View style={styles.headerTitleGroup}>
          <Text
            style={[styles.headerTitle, { color: theme.colors.textPrimary }]}
          >
            Plan Management
          </Text>
          <Text
            style={[
              styles.headerSubtitle,
              { color: theme.colors.textSecondary },
            ]}
          >
            Admin Control Center
          </Text>
        </View>
        <Pressable
          onPress={() => router.push('/(app)/admin/plans/new' as any)}
          style={({ pressed }) => [
            styles.addPlanBtn,
            { backgroundColor: theme.colors.primary },
            pressed && { opacity: 0.9 },
          ]}
        >
          <AppIcon name="plus" size={16} color="#FFF" />
          {Platform.OS === 'web' && (
            <Text style={styles.addPlanBtnText}>Create Plan</Text>
          )}
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 20) + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* KPI Metrics Strip */}
        <View style={styles.metricsRow}>
          <GlassCard
            style={[
              styles.metricTile,
              { borderColor: theme.colors.borderLight },
            ]}
            intensity={theme.isDark ? 25 : 45}
            variant="medium"
          >
            <Text
              style={[
                styles.metricLabel,
                { color: theme.colors.textSecondary },
              ]}
            >
              TOTAL PLANS
            </Text>
            <Text
              style={[styles.metricValue, { color: theme.colors.textPrimary }]}
            >
              {plans.length}
            </Text>
          </GlassCard>

          <GlassCard
            style={[
              styles.metricTile,
              { borderColor: theme.colors.borderLight },
            ]}
            intensity={theme.isDark ? 25 : 45}
            variant="medium"
          >
            <Text style={[styles.metricLabel, { color: theme.colors.success }]}>
              ACTIVE PLANS
            </Text>
            <Text style={[styles.metricValue, { color: theme.colors.success }]}>
              {activePlansCount}
            </Text>
          </GlassCard>

          <GlassCard
            style={[
              styles.metricTile,
              { borderColor: theme.colors.borderLight },
            ]}
            intensity={theme.isDark ? 25 : 45}
            variant="medium"
          >
            <Text style={[styles.metricLabel, { color: theme.colors.primary }]}>
              SUBSCRIBERS
            </Text>
            <Text style={[styles.metricValue, { color: theme.colors.primary }]}>
              {totalSubscribers}
            </Text>
          </GlassCard>
        </View>

        {/* Plan List */}
        {isLoading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text
              style={[
                styles.loadingText,
                { color: theme.colors.textSecondary },
              ]}
            >
              Loading subscription plans...
            </Text>
          </View>
        ) : (
          <View style={styles.plansList}>
            {plans.map(plan => {
              const isArchived = plan.status === 'archived';

              return (
                <GlassCard
                  key={plan.key}
                  style={[
                    styles.planCard,
                    { borderColor: theme.colors.borderLight },
                    isArchived && { opacity: 0.6 },
                  ]}
                  intensity={theme.isDark ? 28 : 45}
                  variant="medium"
                >
                  <View style={styles.planCardTop}>
                    <View style={styles.planNameRow}>
                      <Text
                        style={[
                          styles.planName,
                          { color: theme.colors.textPrimary },
                        ]}
                      >
                        {plan.name}
                      </Text>
                      {plan.isDefault && (
                        <View
                          style={[
                            styles.defaultBadge,
                            { backgroundColor: `${theme.colors.primary}18` },
                          ]}
                        >
                          <Text
                            style={[
                              styles.defaultBadgeText,
                              { color: theme.colors.primary },
                            ]}
                          >
                            DEFAULT
                          </Text>
                        </View>
                      )}
                      <View
                        style={[
                          styles.statusPill,
                          {
                            backgroundColor:
                              plan.status === 'active'
                                ? `${theme.colors.success}18`
                                : `${theme.colors.textTertiary}18`,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusPillText,
                            {
                              color:
                                plan.status === 'active'
                                  ? theme.colors.success
                                  : theme.colors.textTertiary,
                            },
                          ]}
                        >
                          {plan.status.toUpperCase()}
                        </Text>
                      </View>
                    </View>

                    <Text
                      style={[
                        styles.planKeyText,
                        { color: theme.colors.textTertiary },
                      ]}
                    >
                      Key: {plan.key} • Order: {plan.displayOrder}
                    </Text>

                    <View style={styles.priceRow}>
                      <Text
                        style={[
                          styles.planPrice,
                          { color: theme.colors.textPrimary },
                        ]}
                      >
                        ₹{plan.pricing.amount}
                      </Text>
                      <Text
                        style={[
                          styles.planInterval,
                          { color: theme.colors.textSecondary },
                        ]}
                      >
                        / {plan.pricing.billingInterval}
                      </Text>
                      <View style={styles.subCountBadge}>
                        <AppIcon
                          name="user"
                          size={11}
                          color={theme.colors.textSecondary}
                        />
                        <Text
                          style={[
                            styles.subCountText,
                            { color: theme.colors.textSecondary },
                          ]}
                        >
                          {plan.activeSubscribers || 0} active
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Limits Summary */}
                  <View
                    style={[
                      styles.limitsBox,
                      {
                        backgroundColor: theme.isDark
                          ? 'rgba(255,255,255,0.04)'
                          : 'rgba(255,255,255,0.5)',
                        borderColor: theme.colors.borderLight,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.limitsBoxTitle,
                        { color: theme.colors.textSecondary },
                      ]}
                    >
                      Configured Limits:
                    </Text>
                    <View style={styles.limitsChipsRow}>
                      {Object.entries(plan.limits || {}).map(
                        ([key, cfg]: [string, any]) => (
                          <View
                            key={key}
                            style={[
                              styles.limitChip,
                              {
                                borderColor: theme.colors.borderLight,
                                backgroundColor: theme.isDark
                                  ? 'rgba(255,255,255,0.06)'
                                  : 'rgba(0,0,0,0.03)',
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.limitChipKey,
                                { color: theme.colors.textSecondary },
                              ]}
                            >
                              {key}:
                            </Text>
                            <Text
                              style={[
                                styles.limitChipVal,
                                { color: theme.colors.textPrimary },
                              ]}
                            >
                              {cfg.unlimited || cfg.value === null
                                ? '∞'
                                : cfg.value}
                            </Text>
                          </View>
                        ),
                      )}
                    </View>
                  </View>

                  {/* Actions */}
                  <View style={styles.actionsRow}>
                    <Pressable
                      onPress={() =>
                        router.push(
                          `/(app)/admin/plans/${plan.id || plan._id}` as any,
                        )
                      }
                      style={({ pressed }) => [
                        styles.editBtn,
                        { borderColor: theme.colors.primary },
                        pressed && { opacity: 0.8 },
                      ]}
                    >
                      <AppIcon
                        name="edit-2"
                        size={14}
                        color={theme.colors.primary}
                      />
                      <Text
                        style={[
                          styles.editBtnText,
                          { color: theme.colors.primary },
                        ]}
                      >
                        Edit Limits & Features
                      </Text>
                    </Pressable>

                    {!isArchived && !plan.isDefault && (
                      <Pressable
                        onPress={() => handleArchive(plan)}
                        style={({ pressed }) => [
                          styles.archiveBtn,
                          pressed && { opacity: 0.8 },
                        ]}
                      >
                        <AppIcon
                          name="archive"
                          size={14}
                          color={theme.colors.danger}
                        />
                        <Text
                          style={[
                            styles.archiveBtnText,
                            { color: theme.colors.danger },
                          ]}
                        >
                          Archive
                        </Text>
                      </Pressable>
                    )}
                  </View>
                </GlassCard>
              );
            })}
          </View>
        )}
      </ScrollView>
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
  headerTitleGroup: {
    flex: 1,
    marginLeft: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.4,
  },
  addPlanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  addPlanBtnText: {
    color: '#FFF',
    fontSize: 12.5,
    fontWeight: '700',
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  metricTile: {
    flex: 1,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    gap: 4,
  },
  metricLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.4,
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
  plansList: {
    gap: 14,
  },
  planCard: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    gap: 12,
  },
  planCardTop: {
    gap: 4,
  },
  planNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  planName: {
    fontSize: 18,
    fontWeight: '800',
  },
  defaultBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  defaultBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  statusPillText: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  planKeyText: {
    fontSize: 11,
    fontWeight: '500',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginTop: 4,
  },
  planPrice: {
    fontSize: 22,
    fontWeight: '900',
  },
  planInterval: {
    fontSize: 12,
    fontWeight: '600',
  },
  subCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(150,150,150,0.1)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    marginLeft: 10,
  },
  subCountText: {
    fontSize: 11,
    fontWeight: '700',
  },
  limitsBox: {
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    gap: 6,
  },
  limitsBoxTitle: {
    fontSize: 11,
    fontWeight: '700',
  },
  limitsChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  limitChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    backgroundColor: 'rgba(150,150,150,0.05)',
  },
  limitChipKey: {
    fontSize: 10.5,
    fontWeight: '600',
  },
  limitChipVal: {
    fontSize: 11,
    fontWeight: '800',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 4,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
  },
  editBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  archiveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
  },
  archiveBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
});

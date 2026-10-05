import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Switch,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '../../../../providers/ThemeProvider';
import AppIcon from '../../../../components/common/AppIcon';
import { GlassCard } from '../../../../components/ui/GlassCard';
import { GlobalBackground } from '../../../../components/ui/GlobalBackground';
import { subscriptionApi } from '../../../../services/api/subscription.api';
import { IPlanInput, ILimitConfig } from '../../../../types/subscription.types';
import { haptics } from '../../../../utils/haptics';

export default function AdminPlanEditorScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const isNew = id === 'new';
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const queryClient = useQueryClient();

  // Form State
  const [key, setKey] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('0');
  const [currency, setCurrency] = useState('INR');
  const [billingInterval, setBillingInterval] = useState<
    'month' | 'year' | 'free'
  >('month');
  const [status, setStatus] = useState<'active' | 'draft' | 'archived'>(
    'active',
  );
  const [displayOrder, setDisplayOrder] = useState('1');
  const [isDefault, setIsDefault] = useState(false);
  const [isPublic, setIsPublic] = useState(true);

  // Dynamic Limits: Record<string, ILimitConfig>
  const [limits, setLimits] = useState<Record<string, ILimitConfig>>({
    trips: { value: 5, unlimited: false, unit: 'trips' },
    peoplePerTrip: { value: 10, unlimited: false, unit: 'travelers' },
    stopsPerTrip: { value: 5, unlimited: false, unit: 'stops' },
  });

  // Dynamic Features: Record<string, boolean>
  const [features, setFeatures] = useState<Record<string, boolean>>({
    trip_creation: true,
    advanced_analytics: false,
    custom_trip_cover: false,
    expense_export: false,
    receipt_ocr: true,
    recurring_expenses: false,
  });

  // New item inputs
  const [newLimitKey, setNewLimitKey] = useState('');
  const [newLimitVal, setNewLimitVal] = useState('10');
  const [showAddLimit, setShowAddLimit] = useState(false);

  const [newFeatureKey, setNewFeatureKey] = useState('');
  const [showAddFeature, setShowAddFeature] = useState(false);

  // Fetch plan if editing existing
  const { data: plan, isLoading } = useQuery({
    queryKey: ['admin', 'plan', id],
    queryFn: async () => {
      if (isNew) return null;
      const res = await subscriptionApi.adminGetPlan(id);
      return res.data;
    },
    enabled: !isNew && !!id,
  });

  useEffect(() => {
    if (plan) {
      setKey(plan.key);
      setName(plan.name);
      setDescription(plan.description || '');
      setPrice(String(plan.pricing.amount || 0));
      setCurrency(plan.pricing.currency || 'INR');
      setBillingInterval(
        plan.pricing.billingInterval === 'year'
          ? 'year'
          : plan.pricing.billingInterval === 'free'
            ? 'free'
            : 'month',
      );
      setStatus(plan.status || 'active');
      setDisplayOrder(String(plan.displayOrder || 1));
      setIsDefault(!!plan.isDefault);
      setIsPublic(plan.isPublic !== false);
      if (plan.limits) setLimits(plan.limits);
      if (plan.features) setFeatures(plan.features);
    }
  }, [plan]);

  // Mutations
  const saveMutation = useMutation({
    mutationFn: async (payload: IPlanInput) => {
      if (isNew) {
        return await subscriptionApi.adminCreatePlan(payload);
      } else {
        return await subscriptionApi.adminUpdatePlan(id, payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'plans'] });
      queryClient.invalidateQueries({ queryKey: ['subscription', 'plans'] });
      haptics.success();
      Alert.alert(
        'Plan Saved!',
        `Subscription plan "${name}" has been ${isNew ? 'created' : 'updated'}. Changes apply immediately to active and new subscribers.`,
        [{ text: 'OK', onPress: () => router.back() }],
      );
    },
    onError: (err: any) => {
      haptics.error();
      Alert.alert('Save Failed', err?.message || 'Could not save plan.');
    },
  });

  const handleSave = () => {
    if (!key.trim() || !name.trim()) {
      Alert.alert('Validation Error', 'Plan key and name are required.');
      return;
    }

    const payload: IPlanInput = {
      key: key.trim().toLowerCase(),
      name: name.trim(),
      description: description.trim(),
      status,
      pricing: {
        amount: parseFloat(price) || 0,
        currency: currency.toUpperCase(),
        billingInterval,
      },
      displayOrder: parseInt(displayOrder) || 1,
      isDefault,
      isPublic,
      limits,
      features,
      auditReason: `Admin ${isNew ? 'created' : 'updated'} plan ${key} from admin portal`,
    };

    // Warn if reducing limits on existing plan with subscribers
    if (!isNew && plan?.activeSubscribers && plan.activeSubscribers > 0) {
      Alert.alert(
        'Confirm Limit Changes',
        `This plan has ${plan.activeSubscribers} active subscribers. Modifying limits or features will update effective entitlements. Do you wish to continue?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Save & Apply', onPress: () => saveMutation.mutate(payload) },
        ],
      );
    } else {
      saveMutation.mutate(payload);
    }
  };

  // Limit Handlers
  const handleToggleUnlimited = (limitKey: string) => {
    setLimits(prev => {
      const current = prev[limitKey];
      return {
        ...prev,
        [limitKey]: {
          ...current,
          unlimited: !current.unlimited,
          value: current.unlimited ? 10 : null,
        },
      };
    });
  };

  const handleUpdateLimitValue = (limitKey: string, val: string) => {
    const num = parseInt(val) || 0;
    setLimits(prev => ({
      ...prev,
      [limitKey]: {
        ...prev[limitKey],
        value: num,
        unlimited: false,
      },
    }));
  };

  const handleAddCustomLimit = () => {
    if (!newLimitKey.trim()) return;
    const sanitized = newLimitKey.trim();
    setLimits(prev => ({
      ...prev,
      [sanitized]: {
        value: parseInt(newLimitVal) || 0,
        unlimited: false,
        unit: 'units',
      },
    }));
    setNewLimitKey('');
    setNewLimitVal('10');
    setShowAddLimit(false);
  };

  const handleDeleteLimit = (limitKey: string) => {
    setLimits(prev => {
      const copy = { ...prev };
      delete copy[limitKey];
      return copy;
    });
  };

  // Feature Handlers
  const handleToggleFeature = (featureKey: string) => {
    setFeatures(prev => ({
      ...prev,
      [featureKey]: !prev[featureKey],
    }));
  };

  const handleAddCustomFeature = () => {
    if (!newFeatureKey.trim()) return;
    const sanitized = newFeatureKey.trim().toLowerCase().replace(/\s+/g, '_');
    setFeatures(prev => ({
      ...prev,
      [sanitized]: true,
    }));
    setNewFeatureKey('');
    setShowAddFeature(false);
  };

  const handleDeleteFeature = (featureKey: string) => {
    setFeatures(prev => {
      const copy = { ...prev };
      delete copy[featureKey];
      return copy;
    });
  };

  if (isLoading) {
    return (
      <View style={styles.centerBox}>
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <GlobalBackground />
        </View>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <GlobalBackground />
      </View>
      {/* Header */}
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
          {isNew ? 'Create New Plan' : `Edit: ${name || key}`}
        </Text>
        <Pressable
          disabled={saveMutation.isPending}
          onPress={handleSave}
          style={({ pressed }) => [
            styles.saveBtn,
            { backgroundColor: theme.colors.primary },
            pressed && { opacity: 0.9 },
          ]}
        >
          {saveMutation.isPending ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <Text style={styles.saveBtnText}>Save</Text>
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
        {/* Section 1: Basic Plan Info */}
        <GlassCard
          style={[styles.card, { borderColor: theme.colors.borderLight }]}
          intensity={18}
        >
          <Text
            style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}
          >
            Plan Identity
          </Text>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
              Plan Key (Unique Slug)
            </Text>
            <TextInput
              editable={isNew}
              value={key}
              onChangeText={setKey}
              placeholder="e.g. pro, business, nomad"
              placeholderTextColor={theme.colors.textTertiary}
              style={[
                styles.input,
                {
                  color: theme.colors.textPrimary,
                  borderColor: theme.colors.borderLight,
                  backgroundColor: isNew
                    ? 'transparent'
                    : 'rgba(150,150,150,0.08)',
                },
              ]}
              autoCapitalize="none"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
              Plan Name
            </Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="e.g. Pro Explorer"
              placeholderTextColor={theme.colors.textTertiary}
              style={[
                styles.input,
                {
                  color: theme.colors.textPrimary,
                  borderColor: theme.colors.borderLight,
                },
              ]}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
              Marketing Description
            </Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Describe target audience and key benefits"
              placeholderTextColor={theme.colors.textTertiary}
              multiline
              numberOfLines={2}
              style={[
                styles.input,
                styles.textArea,
                {
                  color: theme.colors.textPrimary,
                  borderColor: theme.colors.borderLight,
                },
              ]}
            />
          </View>

          {/* Pricing Row */}
          <View style={styles.row}>
            <View style={[styles.formGroup, { flex: 1 }]}>
              <Text
                style={[styles.label, { color: theme.colors.textSecondary }]}
              >
                Price (₹ / $)
              </Text>
              <TextInput
                value={price}
                onChangeText={setPrice}
                keyboardType="numeric"
                style={[
                  styles.input,
                  {
                    color: theme.colors.textPrimary,
                    borderColor: theme.colors.borderLight,
                  },
                ]}
              />
            </View>

            <View style={[styles.formGroup, { flex: 1 }]}>
              <Text
                style={[styles.label, { color: theme.colors.textSecondary }]}
              >
                Billing Interval
              </Text>
              <View style={styles.intervalRow}>
                {(['free', 'month', 'year'] as const).map(interval => (
                  <Pressable
                    key={interval}
                    onPress={() => setBillingInterval(interval)}
                    style={[
                      styles.intervalChip,
                      billingInterval === interval && {
                        backgroundColor: theme.colors.primary,
                        borderColor: theme.colors.primary,
                      },
                      { borderColor: theme.colors.borderLight },
                    ]}
                  >
                    <Text
                      style={[
                        styles.intervalChipText,
                        {
                          color:
                            billingInterval === interval
                              ? '#FFF'
                              : theme.colors.textSecondary,
                        },
                      ]}
                    >
                      {interval.charAt(0).toUpperCase() + interval.slice(1)}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>

          {/* Status & Options */}
          <View style={styles.switchRow}>
            <Text
              style={[styles.switchLabel, { color: theme.colors.textPrimary }]}
            >
              Public in Pricing Table
            </Text>
            <Switch
              value={isPublic}
              onValueChange={setIsPublic}
              trackColor={{ false: '#767577', true: theme.colors.primary }}
            />
          </View>

          <View style={styles.switchRow}>
            <Text
              style={[styles.switchLabel, { color: theme.colors.textPrimary }]}
            >
              Default Free Fallback Plan
            </Text>
            <Switch
              value={isDefault}
              onValueChange={setIsDefault}
              trackColor={{ false: '#767577', true: theme.colors.primary }}
            />
          </View>
        </GlassCard>

        {/* Section 2: Dynamic Limits Management */}
        <GlassCard
          style={[styles.card, { borderColor: theme.colors.borderLight }]}
          intensity={18}
        >
          <View style={styles.sectionHeaderRow}>
            <View>
              <Text
                style={[
                  styles.sectionTitle,
                  { color: theme.colors.textPrimary },
                ]}
              >
                Dynamic Plan Limits
              </Text>
              <Text
                style={[
                  styles.sectionSub,
                  { color: theme.colors.textSecondary },
                ]}
              >
                Configure numeric caps or mark as explicitly unlimited.
              </Text>
            </View>
            <Pressable
              onPress={() => setShowAddLimit(!showAddLimit)}
              style={[
                styles.addBtnSmall,
                { backgroundColor: `${theme.colors.primary}18` },
              ]}
            >
              <AppIcon name="plus" size={14} color={theme.colors.primary} />
              <Text
                style={[
                  styles.addBtnSmallText,
                  { color: theme.colors.primary },
                ]}
              >
                Add Limit
              </Text>
            </Pressable>
          </View>

          {/* Add Limit Mini-form */}
          {showAddLimit && (
            <View
              style={[
                styles.addInlineBox,
                { backgroundColor: 'rgba(150,150,150,0.08)' },
              ]}
            >
              <TextInput
                value={newLimitKey}
                onChangeText={setNewLimitKey}
                placeholder="Limit key (e.g. storageMb)"
                placeholderTextColor={theme.colors.textTertiary}
                style={[styles.inputSmall, { color: theme.colors.textPrimary }]}
              />
              <TextInput
                value={newLimitVal}
                onChangeText={setNewLimitVal}
                keyboardType="numeric"
                placeholder="Amount"
                placeholderTextColor={theme.colors.textTertiary}
                style={[
                  styles.inputSmall,
                  { width: 80, color: theme.colors.textPrimary },
                ]}
              />
              <Pressable
                onPress={handleAddCustomLimit}
                style={[
                  styles.confirmBtnSmall,
                  { backgroundColor: theme.colors.primary },
                ]}
              >
                <Text style={styles.confirmBtnSmallText}>Add</Text>
              </Pressable>
            </View>
          )}

          <View style={styles.limitsList}>
            {Object.entries(limits).map(([limitKey, cfg]) => (
              <View
                key={limitKey}
                style={[
                  styles.limitRow,
                  { borderBottomColor: theme.colors.borderLight },
                ]}
              >
                <View style={styles.limitInfo}>
                  <Text
                    style={[
                      styles.limitKeyText,
                      { color: theme.colors.textPrimary },
                    ]}
                  >
                    {limitKey}
                  </Text>
                  <Text
                    style={[
                      styles.limitUnitText,
                      { color: theme.colors.textTertiary },
                    ]}
                  >
                    {cfg.unlimited
                      ? 'Explicitly Unlimited'
                      : `${cfg.value} allowance`}
                  </Text>
                </View>

                <View style={styles.limitControls}>
                  {!cfg.unlimited && (
                    <TextInput
                      value={String(cfg.value ?? 0)}
                      onChangeText={val =>
                        handleUpdateLimitValue(limitKey, val)
                      }
                      keyboardType="numeric"
                      style={[
                        styles.limitInput,
                        {
                          color: theme.colors.textPrimary,
                          borderColor: theme.colors.borderLight,
                        },
                      ]}
                    />
                  )}

                  <Pressable
                    onPress={() => handleToggleUnlimited(limitKey)}
                    style={[
                      styles.unlimitedChip,
                      cfg.unlimited && {
                        backgroundColor: theme.colors.success,
                      },
                      { borderColor: theme.colors.borderLight },
                    ]}
                  >
                    <Text
                      style={[
                        styles.unlimitedChipText,
                        {
                          color: cfg.unlimited
                            ? '#FFF'
                            : theme.colors.textSecondary,
                        },
                      ]}
                    >
                      {cfg.unlimited ? '∞ Unlimited' : 'Capped'}
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() => handleDeleteLimit(limitKey)}
                    hitSlop={10}
                  >
                    <AppIcon
                      name="trash-2"
                      size={15}
                      color={theme.colors.danger}
                    />
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        </GlassCard>

        {/* Section 3: Dynamic Features Management */}
        <GlassCard
          style={[styles.card, { borderColor: theme.colors.borderLight }]}
          intensity={18}
        >
          <View style={styles.sectionHeaderRow}>
            <View>
              <Text
                style={[
                  styles.sectionTitle,
                  { color: theme.colors.textPrimary },
                ]}
              >
                Feature Entitlements
              </Text>
              <Text
                style={[
                  styles.sectionSub,
                  { color: theme.colors.textSecondary },
                ]}
              >
                Toggle capability access flags for this plan.
              </Text>
            </View>
            <Pressable
              onPress={() => setShowAddFeature(!showAddFeature)}
              style={[
                styles.addBtnSmall,
                { backgroundColor: `${theme.colors.primary}18` },
              ]}
            >
              <AppIcon name="plus" size={14} color={theme.colors.primary} />
              <Text
                style={[
                  styles.addBtnSmallText,
                  { color: theme.colors.primary },
                ]}
              >
                Add Feature
              </Text>
            </Pressable>
          </View>

          {/* Add Feature Mini-form */}
          {showAddFeature && (
            <View
              style={[
                styles.addInlineBox,
                { backgroundColor: 'rgba(150,150,150,0.08)' },
              ]}
            >
              <TextInput
                value={newFeatureKey}
                onChangeText={setNewFeatureKey}
                placeholder="Feature key (e.g. offline_mode)"
                placeholderTextColor={theme.colors.textTertiary}
                style={[
                  styles.inputSmall,
                  { flex: 1, color: theme.colors.textPrimary },
                ]}
              />
              <Pressable
                onPress={handleAddCustomFeature}
                style={[
                  styles.confirmBtnSmall,
                  { backgroundColor: theme.colors.primary },
                ]}
              >
                <Text style={styles.confirmBtnSmallText}>Add</Text>
              </Pressable>
            </View>
          )}

          <View style={styles.featuresList}>
            {Object.entries(features).map(([featKey, isEnabled]) => (
              <View
                key={featKey}
                style={[
                  styles.featureRow,
                  { borderBottomColor: theme.colors.borderLight },
                ]}
              >
                <View style={styles.featureInfo}>
                  <Text
                    style={[
                      styles.featureKeyText,
                      { color: theme.colors.textPrimary },
                    ]}
                  >
                    {featKey}
                  </Text>
                  <Text
                    style={[
                      styles.featureStatusText,
                      {
                        color: isEnabled
                          ? theme.colors.success
                          : theme.colors.textTertiary,
                      },
                    ]}
                  >
                    {isEnabled
                      ? 'Enabled for subscribers'
                      : 'Disabled / locked'}
                  </Text>
                </View>

                <View style={styles.featureControls}>
                  <Switch
                    value={isEnabled}
                    onValueChange={() => handleToggleFeature(featKey)}
                    trackColor={{
                      false: '#767577',
                      true: theme.colors.primary,
                    }}
                  />
                  <Pressable
                    onPress={() => handleDeleteFeature(featKey)}
                    hitSlop={10}
                  >
                    <AppIcon
                      name="trash-2"
                      size={15}
                      color={theme.colors.danger}
                    />
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        </GlassCard>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
  saveBtn: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '800',
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  card: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    gap: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  sectionSub: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  addBtnSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  addBtnSmallText: {
    fontSize: 11,
    fontWeight: '700',
  },
  formGroup: {
    gap: 6,
  },
  label: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13.5,
  },
  textArea: {
    height: 60,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  intervalRow: {
    flexDirection: 'row',
    gap: 6,
  },
  intervalChip: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  intervalChipText: {
    fontSize: 11,
    fontWeight: '700',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  switchLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  addInlineBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 12,
  },
  inputSmall: {
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 12.5,
  },
  confirmBtnSmall: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  confirmBtnSmallText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  limitsList: {
    gap: 2,
  },
  limitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  limitInfo: {
    flex: 1,
  },
  limitKeyText: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  limitUnitText: {
    fontSize: 11,
    fontWeight: '500',
  },
  limitControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  limitInput: {
    width: 55,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 12.5,
    textAlign: 'center',
    fontWeight: '700',
  },
  unlimitedChip: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  unlimitedChipText: {
    fontSize: 10.5,
    fontWeight: '800',
  },
  featuresList: {
    gap: 2,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  featureInfo: {
    flex: 1,
  },
  featureKeyText: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  featureStatusText: {
    fontSize: 11,
    fontWeight: '500',
  },
  featureControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
});

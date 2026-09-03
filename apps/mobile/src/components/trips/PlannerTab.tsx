// src/components/trips/PlannerTab.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  TextInput,
  RefreshControl,
  Alert,
  Modal,
  Pressable,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  Layout,
  ZoomIn,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery } from '@tanstack/react-query';

import { TripHero } from './planner/TripHero';
import { PremiumSegmentedTabs, TabItem } from './planner/PremiumSegmentedTabs';
import { PlannerProgressCard } from './planner/PlannerProgressCard';
import { BudgetSummaryCard } from './planner/BudgetSummaryCard';
import { FlightCard, HotelCard, TransportCard } from './planner/BookingCards';
import { ItineraryTimeline } from './planner/ItineraryTimeline';
import { PremiumWizardForm, FieldConfig } from './planner/WizardForms';
import {
  useTripReminders,
  useCreateBudgetReminder,
} from '../../hooks/useReminders';
import { useResponsive } from '../../hooks/useResponsive';
import { useTravelPlan, usePlanMutations } from '../../hooks/useTravelPlan';
import { useTheme } from '../../providers/ThemeProvider';
import { tripsApi } from '../../services/api';
import { Theme } from '../../theme';
import { IContact, ITravelPlan } from '../../types/travelPlan.types';
import { haptics } from '../../utils/haptics';
import AppIcon from '../common/AppIcon';
import GlobalLoader from '../common/GlobalLoader';
import { Typography, Badge, GlassCard, IconButton, Button } from '../ui';
import { EmptyState } from '../ui/EmptyState';
import { InteractiveWrapper } from '../ui/InteractiveWrapper';
import { format } from 'date-fns';

// â”€â”€â”€ Constants â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const TABS: TabItem[] = [
  { id: 'Overview', label: 'Overview' },
  { id: 'Itinerary', label: 'Itinerary' },
  { id: 'Bookings', label: 'Bookings' },
  { id: 'Packing', label: 'Packing' },
  { id: 'Contacts', label: 'Contacts' },
];

interface WizardConfig {
  title: string;
  icon: string;
  iconColor: string;
  fields: FieldConfig[];
  onSave: (values: Record<string, string>) => void;
  initialValues?: Record<string, string>;
}

// â”€â”€â”€ Contact Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function getContactColor(type: string, theme: Theme): string {
  const map: Record<string, string> = {
    emergency: theme.colors.danger,
    insurance: theme.colors.info,
    hotel: theme.colors.warning,
    embassy: theme.colors.purple || theme.colors.accent,
    localEmergency: theme.colors.success,
  };
  return map[type] || theme.colors.textSecondary;
}

function getContactIcon(type: string): string {
  const map: Record<string, string> = {
    emergency: 'circle-alert',
    insurance: 'shield',
    hotel: 'home',
    embassy: 'flag',
    localEmergency: 'phone',
  };
  return map[type] || 'user';
}

function getContactTypeLabel(type: string): string {
  const map: Record<string, string> = {
    emergency: 'Emergency Contact',
    insurance: 'Travel Insurance',
    hotel: 'Hotel',
    embassy: 'Embassy',
    localEmergency: 'Local Emergency',
  };
  return map[type] || type;
}

function getCategoryConfig(category: string): { color: string; icon: string } {
  const map: Record<string, { color: string; icon: string }> = {
    Clothing: { color: '#3B82F6', icon: 'shirt' },
    Toiletries: { color: '#06B6D4', icon: 'sparkles' },
    Electronics: { color: '#8B5CF6', icon: 'smartphone' },
    Documents: { color: '#F59E0B', icon: 'file-text' },
    Health: { color: '#10B981', icon: 'heart-pulse' },
    'Health & Safety': { color: '#10B981', icon: 'heart-pulse' },
    General: { color: '#64748B', icon: 'package' },
    'Luxury Extras': { color: '#EC4899', icon: 'gem' },
    'Backpacking Gear': { color: '#F97316', icon: 'compass' },
    'Business Essentials': { color: '#6366F1', icon: 'briefcase' },
  };
  return map[category] || { color: '#64748B', icon: 'package' };
}

// â”€â”€â”€ Section Header â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function SectionHeader({
  title,
  icon,
  iconColor,
  count,
  action,
}: {
  title: string;
  icon: string;
  iconColor: string;
  count?: number;
  action?: { label: string; onPress: () => void; icon?: string };
}) {
  const theme = useTheme();

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: theme.spacing.sm,
          flex: 1,
        }}
      >
        <View
          style={{
            width: 34,
            height: 34,
            borderRadius: 11,
            backgroundColor: `${iconColor}18`,
            borderWidth: 1,
            borderColor: `${iconColor}30`,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <AppIcon name={icon as any} size={16} color={iconColor} />
        </View>
        <Typography
          variant="h3"
          weight="extrabold"
          color="textPrimary"
          style={{ letterSpacing: -0.3 }}
        >
          {title}
        </Typography>
        {count !== undefined && count > 0 && (
          <View
            style={{
              paddingHorizontal: 8,
              paddingVertical: 2,
              borderRadius: 10,
              backgroundColor: `${iconColor}18`,
            }}
          >
            <Text style={{ fontSize: 11, fontWeight: '800', color: iconColor }}>
              {count}
            </Text>
          </View>
        )}
      </View>
      {action && (
        <InteractiveWrapper onPress={action.onPress}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 5,
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: `${iconColor}30`,
              backgroundColor: `${iconColor}15`,
            }}
          >
            <AppIcon
              name={(action.icon || 'plus') as any}
              size={13}
              color={iconColor}
            />
            <Typography
              variant="caption"
              weight="bold"
              style={{ color: iconColor }}
            >
              {action.label}
            </Typography>
          </View>
        </InteractiveWrapper>
      )}
    </View>
  );
}

// â”€â”€â”€ Booking Section Wrapper â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function BookingSection({
  title,
  icon,
  color,
  count,
  onAdd,
  children,
}: {
  title: string;
  icon: string;
  color: string;
  count: number;
  onAdd: () => void;
  children: React.ReactNode;
}) {
  const theme = useTheme();

  return (
    <View style={{ gap: theme.spacing.md }}>
      <SectionHeader
        title={title}
        icon={icon}
        iconColor={color}
        count={count}
        action={{ label: 'Add', onPress: onAdd }}
      />
      {children}
    </View>
  );
}

// â”€â”€â”€ Contact Card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function ContactCard({
  contact,
  onEdit,
  onDelete,
  onSetPrimary,
  showSetPrimary,
}: {
  contact: IContact;
  onEdit: () => void;
  onDelete: () => void;
  onSetPrimary: () => void;
  showSetPrimary: boolean;
}) {
  const theme = useTheme();
  const color = getContactColor(contact.type, theme);

  return (
    <Animated.View
      entering={FadeInDown.springify().damping(18)}
      layout={Layout.springify()}
    >
      <GlassCard
        variant="medium"
        padding="none"
        style={{ flexDirection: 'row', overflow: 'hidden' }}
      >
        <View style={{ width: 4, backgroundColor: color }} />
        <View
          style={{ flex: 1, padding: theme.spacing.md, gap: theme.spacing.sm }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'flex-start',
              gap: theme.spacing.md,
            }}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                backgroundColor: `${color}20`,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AppIcon
                name={getContactIcon(contact.type) as any}
                size={18}
                color={color}
              />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: theme.spacing.xs,
                }}
              >
                <Typography
                  variant="bodySm"
                  weight="bold"
                  color="textPrimary"
                  numberOfLines={1}
                >
                  {contact.name}
                </Typography>
                {contact.isPrimary && (
                  <Badge label="Primary" variant="primary" />
                )}
              </View>
              <Typography variant="caption" color="textTertiary">
                {getContactTypeLabel(contact.type)}
              </Typography>
            </View>
            <View style={{ flexDirection: 'row', gap: 2 }}>
              {showSetPrimary && (
                <IconButton
                  icon={
                    <AppIcon
                      name="star"
                      size={14}
                      color={theme.colors.textTertiary}
                    />
                  }
                  size="sm"
                  variant="ghost"
                  onPress={onSetPrimary}
                />
              )}
              <IconButton
                icon={
                  <AppIcon
                    name="pencil"
                    size={14}
                    color={theme.colors.textSecondary}
                  />
                }
                size="sm"
                variant="ghost"
                onPress={onEdit}
              />
              <IconButton
                icon={
                  <AppIcon
                    name="trash-2"
                    size={14}
                    color={theme.colors.danger}
                  />
                }
                size="sm"
                variant="ghost"
                onPress={onDelete}
              />
            </View>
          </View>
          <View style={{ gap: 4, paddingLeft: 40 + theme.spacing.md }}>
            {!!contact.phone && contact.phone !== 'Not provided' && (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: theme.spacing.sm,
                }}
              >
                <AppIcon name="phone" size={12} color={color} />
                <Typography variant="caption" color="textSecondary">
                  {contact.phone}
                </Typography>
              </View>
            )}
            {!!contact.email && (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: theme.spacing.sm,
                }}
              >
                <AppIcon name="mail" size={12} color={color} />
                <Typography variant="caption" color="textSecondary">
                  {contact.email}
                </Typography>
              </View>
            )}
            {!!contact.address && (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: theme.spacing.sm,
                }}
              >
                <AppIcon name="map-pin" size={12} color={color} />
                <Typography variant="caption" color="textSecondary">
                  {contact.address}
                </Typography>
              </View>
            )}
          </View>
        </View>
      </GlassCard>
    </Animated.View>
  );
}

// â”€â”€â”€ Main Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function PlannerTab({ tripId }: { tripId: string }) {
  const theme = useTheme();

  // â”€â”€â”€ ALL HOOKS FIRST â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const { data: tripRes } = useQuery({
    queryKey: ['trip', tripId],
    queryFn: () => tripsApi.getTrip(tripId),
  });
  const trip = (tripRes?.data as any)?.trip || (tripRes?.data as any);

  const { data: plan, isLoading, refetch } = useTravelPlan(tripId);
  const { data: tripReminders = [], isLoading: isLoadingReminders } =
    useTripReminders(tripId);
  const {
    updatePlan,
    updateBudget,
    addChecklistItem,
    toggleChecklistItem,
    deleteChecklistItem,
    addItineraryDay,
    deleteItineraryDay,
    generateItinerary,
    addFlight,
    deleteFlight,
    addHotel,
    deleteHotel,
    addTransport,
    deleteTransport,
    addPackingItem,
    togglePackingItem,
    deletePackingItem,
    initializePackingList,
    addContact,
    updateContact,
    deleteContact,
    setPrimaryContact,
    activateTrip,
    completeTrip,
    isMutating,
  } = usePlanMutations(tripId);

  const { mutate: createBudgetReminder } = useCreateBudgetReminder();

  const [activeTab, setActiveTab] = useState('Overview');
  const [wizardConfig, setWizardConfig] = useState<WizardConfig | null>(null);
  const [notesText, setNotesText] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [showActivationModal, setShowActivationModal] = useState(false);
  const [editingContact, setEditingContact] = useState<IContact | null>(null);

  useEffect(() => {
    if (plan?.notes !== undefined) setNotesText(plan.notes);
  }, [plan?.notes]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    haptics.light();
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  // Data extraction
  const checkItems = plan?.checklist || [];
  const checkDone = checkItems.filter((i: any) => i.checked).length;
  const checkProgress =
    checkItems.length > 0
      ? Math.round((checkDone / checkItems.length) * 100)
      : 0;

  const packingCategories = plan?.packingList || [];
  let packTotal = 0,
    packDone = 0;
  packingCategories.forEach((cat: any) => {
    packTotal += cat.items?.length || 0;
    packDone += cat.items?.filter((i: any) => i.checked).length || 0;
  });
  const packProgress =
    packTotal > 0 ? Math.round((packDone / packTotal) * 100) : 0;

  const budget = plan?.budgetOverview || {
    total: 0,
    spent: 0,
    currency: 'INR',
    flights: 0,
    accommodation: 0,
    transport: 0,
    food: 0,
    activities: 0,
    shopping: 0,
    miscellaneous: 0,
  };

  const contacts = plan?.importantContacts || [];
  const flights = plan?.flightDetails || [];
  const hotels = plan?.accommodationDetails || [];
  const transports = plan?.transportDetails || [];
  const itinerary = plan?.itinerary || [];

  const bookingsCount = flights.length + hotels.length + transports.length;

  const tabsWithBadges = useMemo(
    () =>
      TABS.map(tab => {
        let badge = 0;
        if (tab.id === 'Bookings') badge = bookingsCount;
        if (tab.id === 'Itinerary') badge = itinerary.length;
        if (tab.id === 'Packing') badge = packTotal;
        if (tab.id === 'Contacts') badge = contacts.length;
        return { ...tab, badge };
      }),
    [bookingsCount, itinerary.length, packTotal, contacts.length],
  );

  // Contact handlers
  const handleAddContact = useCallback(
    (values: Record<string, string>) => {
      addContact(
        {
          type: values.type as IContact['type'],
          name: values.name || 'Unnamed',
          phone: values.phone || 'Not provided',
          email: values.email || '',
          address: values.address || '',
          relation: values.relation || '',
          provider: values.provider || '',
          policyNo: values.policyNo || '',
          coverage: values.coverage || '',
          country: values.country || '',
          workingHours: values.workingHours || '',
          notes: values.notes || '',
          isPrimary: values.isPrimary === 'true',
        },
        { onSuccess: () => setWizardConfig(null) },
      );
    },
    [addContact],
  );

  const handleUpdateContact = useCallback(
    (values: Record<string, string>) => {
      if (!editingContact?._id) return;
      updateContact(
        {
          contactId: editingContact._id,
          data: {
            type: values.type as IContact['type'],
            name: values.name || '',
            phone: values.phone || '',
            email: values.email || '',
            address: values.address || '',
            relation: values.relation || '',
            provider: values.provider || '',
            policyNo: values.policyNo || '',
            coverage: values.coverage || '',
            country: values.country || '',
            workingHours: values.workingHours || '',
            notes: values.notes || '',
            isPrimary: values.isPrimary === 'true',
          },
        },
        {
          onSuccess: () => {
            setWizardConfig(null);
            setEditingContact(null);
          },
        },
      );
    },
    [editingContact, updateContact],
  );

  const getContactFields = useCallback((contact?: IContact): FieldConfig[] => {
    const base: FieldConfig[] = [
      {
        key: 'type',
        label: 'Contact Type',
        icon: 'list',
        placeholder: 'Select Type',
        type: 'select',
        options: [
          'emergency',
          'insurance',
          'hotel',
          'embassy',
          'localEmergency',
        ],
      },
      { key: 'name', label: 'Name', icon: 'user', placeholder: 'Full name' },
      {
        key: 'phone',
        label: 'Phone',
        icon: 'phone',
        placeholder: '+1 234 567 890',
      },
      {
        key: 'email',
        label: 'Email',
        icon: 'mail',
        placeholder: 'email@example.com',
        halfWidth: true,
      },
      {
        key: 'address',
        label: 'Address',
        icon: 'map-pin',
        placeholder: 'Full address',
        halfWidth: true,
      },
      {
        key: 'notes',
        label: 'Notes',
        icon: 'file-text',
        placeholder: 'Notes...',
        multiline: true,
      },
      {
        key: 'isPrimary',
        label: 'Set as Primary',
        icon: 'star',
        placeholder: 'Select',
        type: 'select',
        options: ['true', 'false'],
        halfWidth: true,
      },
    ];
    const extra: FieldConfig[] = [];
    if (!contact || contact.type === 'emergency')
      extra.push({
        key: 'relation',
        label: 'Relation',
        icon: 'users',
        placeholder: 'e.g. Spouse',
        halfWidth: true,
      });
    if (!contact || contact.type === 'insurance')
      extra.push(
        {
          key: 'provider',
          label: 'Provider',
          icon: 'building',
          placeholder: 'e.g. Allianz',
          halfWidth: true,
        },
        {
          key: 'policyNo',
          label: 'Policy No.',
          icon: 'file-text',
          placeholder: 'Policy #',
          halfWidth: true,
        },
        {
          key: 'coverage',
          label: 'Coverage',
          icon: 'shield',
          placeholder: 'Medical, Travel',
          halfWidth: true,
        },
      );
    if (!contact || contact.type === 'embassy')
      extra.push(
        {
          key: 'country',
          label: 'Country',
          icon: 'flag',
          placeholder: 'e.g. USA',
          halfWidth: true,
        },
        {
          key: 'workingHours',
          label: 'Hours',
          icon: 'clock',
          placeholder: '9AM-5PM',
          halfWidth: true,
        },
      );
    return [...base, ...extra];
  }, []);

  const getContactInitialValues = useCallback(
    (c: IContact): Record<string, string> => ({
      type: c.type || 'emergency',
      name: c.name || '',
      phone: c.phone || '',
      email: c.email || '',
      address: c.address || '',
      relation: c.relation || '',
      provider: c.provider || '',
      policyNo: c.policyNo || '',
      coverage: c.coverage || '',
      country: c.country || '',
      workingHours: c.workingHours || '',
      notes: c.notes || '',
      isPrimary: String(c.isPrimary || false),
    }),
    [],
  );

  const openWizard = useCallback(
    (type: string, contact?: IContact) => {
      haptics.light();

      // â”€â”€â”€ Contact â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
      if (type === 'contact' && contact) {
        setEditingContact(contact);
        setWizardConfig({
          title: 'Edit Contact',
          icon: 'user',
          iconColor: theme.colors.success,
          fields: getContactFields(contact),
          onSave: handleUpdateContact,
          initialValues: getContactInitialValues(contact),
        });
        return;
      }
      if (type === 'contact') {
        setEditingContact(null);
        setWizardConfig({
          title: 'Add Contact',
          icon: 'user-plus',
          iconColor: theme.colors.success,
          fields: getContactFields(),
          onSave: handleAddContact,
          initialValues: { type: 'emergency', isPrimary: 'false' },
        });
        return;
      }

      // â”€â”€â”€ Flight â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
      if (type === 'flight') {
        setWizardConfig({
          title: 'Add Flight',
          icon: 'plane',
          iconColor: theme.colors.info,
          fields: [
            {
              key: 'type',
              label: 'Flight Type',
              icon: 'arrow-left-right',
              placeholder: 'Select',
              type: 'select',
              options: ['departure', 'return', 'connecting'],
            },
            {
              key: 'airline',
              label: 'Airline',
              icon: 'plane',
              placeholder: 'e.g. Emirates',
            },
            {
              key: 'flightNo',
              label: 'Flight No.',
              icon: 'hash',
              placeholder: 'EK 202',
              halfWidth: true,
            },
            {
              key: 'date',
              label: 'Date',
              icon: 'calendar',
              placeholder: 'Select Date',
              halfWidth: true,
              type: 'date',
            },
            {
              key: 'from',
              label: 'From',
              icon: 'map-pin',
              placeholder: 'DXB',
              halfWidth: true,
            },
            {
              key: 'to',
              label: 'To',
              icon: 'map-pin',
              placeholder: 'LHR',
              halfWidth: true,
            },
            {
              key: 'time',
              label: 'Departure Time',
              icon: 'clock',
              placeholder: 'Select Time',
              type: 'time',
              halfWidth: true,
            },
            {
              key: 'cost',
              label: 'Cost',
              icon: 'banknote',
              placeholder: '0.00',
              halfWidth: true,
            },
            {
              key: 'confirmationNo',
              label: 'Booking Ref',
              icon: 'file-text',
              placeholder: 'Optional',
              halfWidth: true,
            },
          ],
          onSave: v =>
            addFlight(
              {
                type: (v.type as any) || 'departure',
                airline: v.airline || '',
                flightNo: v.flightNo || '',
                from: v.from || '',
                to: v.to || '',
                date: v.date || '',
                time: v.time || '',
                cost: parseFloat(v.cost) || 0,
                confirmationNo: v.confirmationNo || '',
                status: 'confirmed',
              },
              { onSuccess: () => setWizardConfig(null) },
            ),
        });
        return;
      }

      // â”€â”€â”€ Hotel â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
      if (type === 'hotel') {
        setWizardConfig({
          title: 'Add Accommodation',
          icon: 'hotel',
          iconColor: theme.colors.warning,
          fields: [
            {
              key: 'hotelName',
              label: 'Hotel Name',
              icon: 'hotel',
              placeholder: 'e.g. Taj Resort',
            },
            {
              key: 'checkIn',
              label: 'Check In',
              icon: 'calendar',
              placeholder: 'Select Date',
              halfWidth: true,
              type: 'date',
            },
            {
              key: 'checkOut',
              label: 'Check Out',
              icon: 'calendar',
              placeholder: 'Select Date',
              halfWidth: true,
              type: 'date',
            },
            {
              key: 'address',
              label: 'Location',
              icon: 'map-pin',
              placeholder: 'Address or Area',
            },
            {
              key: 'confirmationNo',
              label: 'Booking ID',
              icon: 'file-text',
              placeholder: 'Optional',
              halfWidth: true,
            },
            {
              key: 'cost',
              label: 'Cost',
              icon: 'banknote',
              placeholder: '0.00',
              halfWidth: true,
            },
            {
              key: 'contact',
              label: 'Contact',
              icon: 'phone',
              placeholder: 'Phone number',
              halfWidth: true,
            },
          ],
          onSave: v =>
            addHotel(
              {
                hotelName: v.hotelName || '',
                address: v.address || '',
                checkIn: v.checkIn || '',
                checkOut: v.checkOut || '',
                confirmationNo: v.confirmationNo || '',
                contact: v.contact || '',
                notes: v.notes || '',
                cost: parseFloat(v.cost) || 0,
                status: 'confirmed',
              },
              { onSuccess: () => setWizardConfig(null) },
            ),
        });
        return;
      }

      // â”€â”€â”€ Transport â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
      if (type === 'transport') {
        setWizardConfig({
          title: 'Add Transport',
          icon: 'car',
          iconColor: theme.colors.success,
          fields: [
            {
              key: 'type',
              label: 'Type',
              icon: 'car',
              placeholder: 'Select',
              type: 'select',
              options: [
                'train',
                'bus',
                'taxi',
                'ferry',
                'car-rental',
                'flight',
                'other',
              ],
            },
            {
              key: 'operator',
              label: 'Operator',
              icon: 'building',
              placeholder: 'e.g. Rajdhani',
            },
            {
              key: 'from',
              label: 'From',
              icon: 'map-pin',
              placeholder: 'City A',
              halfWidth: true,
            },
            {
              key: 'to',
              label: 'To',
              icon: 'map-pin',
              placeholder: 'City B',
              halfWidth: true,
            },
            {
              key: 'date',
              label: 'Date',
              icon: 'calendar',
              placeholder: 'Select Date',
              halfWidth: true,
              type: 'date',
            },
            {
              key: 'time',
              label: 'Time',
              icon: 'clock',
              placeholder: 'Select Time',
              halfWidth: true,
              type: 'time',
            },
            {
              key: 'pnr',
              label: 'PNR / Ref',
              icon: 'hash',
              placeholder: 'Optional',
              halfWidth: true,
            },
            {
              key: 'cost',
              label: 'Cost',
              icon: 'banknote',
              placeholder: '0.00',
              halfWidth: true,
            },
          ],
          onSave: v =>
            addTransport(
              {
                type: (v.type as any) || 'train',
                operator: v.operator || '',
                pnr: v.pnr || '',
                from: v.from || '',
                to: v.to || '',
                date: v.date || '',
                time: v.time || '',
                cost: parseFloat(v.cost) || 0,
                notes: v.notes || '',
                status: 'confirmed',
              },
              { onSuccess: () => setWizardConfig(null) },
            ),
        });
        return;
      }

      // â”€â”€â”€ Itinerary Day â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
      if (type === 'day') {
        setWizardConfig({
          title: 'Add Itinerary Day',
          icon: 'calendar',
          iconColor: theme.colors.primary,
          fields: [
            {
              key: 'date',
              label: 'Date',
              icon: 'calendar',
              placeholder: 'Select Date',
              type: 'date',
            },
            {
              key: 'destination',
              label: 'Destination',
              icon: 'map-pin',
              placeholder: 'e.g. Goa, India',
            },
            {
              key: 'transport',
              label: 'Transport',
              icon: 'car',
              placeholder: 'e.g. Flight to Goa',
            },
            {
              key: 'accommodation',
              label: 'Accommodation',
              icon: 'hotel',
              placeholder: 'Hotel name',
            },
            {
              key: 'notes',
              label: 'Activities',
              icon: 'file-text',
              placeholder: 'Beach hopping...',
              multiline: true,
            },
          ],
          onSave: v =>
            addItineraryDay(
              {
                day: `Day ${(plan?.itinerary?.length || 0) + 1}`,
                date: v.date || '',
                destination: v.destination || '',
                transport: v.transport || '',
                accommodation: v.accommodation || '',
                notes: v.notes || '',
              },
              { onSuccess: () => setWizardConfig(null) },
            ),
        });
        return;
      }

      // â”€â”€â”€ Checklist â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
      if (type === 'checklist') {
        setWizardConfig({
          title: 'Add Task',
          icon: 'check-square',
          iconColor: theme.colors.accent,
          fields: [
            {
              key: 'item',
              label: 'Task',
              icon: 'file-text',
              placeholder: 'e.g. Book travel insurance...',
            },
            {
              key: 'priority',
              label: 'Priority',
              icon: 'flag',
              placeholder: 'Select',
              type: 'select',
              options: ['low', 'medium', 'high'],
              halfWidth: true,
            },
            {
              key: 'dueDate',
              label: 'Due Date',
              icon: 'calendar',
              placeholder: 'Optional',
              type: 'date',
              halfWidth: true,
            },
          ],
          onSave: v =>
            addChecklistItem(
              {
                item: v.item,
                priority: (v.priority as any) || 'medium',
                dueDate: v.dueDate || undefined,
              },
              { onSuccess: () => setWizardConfig(null) },
            ),
        });
        return;
      }

      // â”€â”€â”€ Packing â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
      if (type === 'packing') {
        setWizardConfig({
          title: 'Add Packing Item',
          icon: 'package',
          iconColor: theme.colors.danger,
          fields: [
            {
              key: 'category',
              label: 'Category',
              icon: 'tag',
              placeholder: 'Select Category',
              type: 'select',
              options: [
                'Clothing',
                'Toiletries',
                'Electronics',
                'Documents',
                'Health',
                'General',
              ],
            },
            {
              key: 'name',
              label: 'Item Name',
              icon: 'file-text',
              placeholder: 'e.g. Passport...',
            },
            {
              key: 'quantity',
              label: 'Quantity',
              icon: 'hash',
              placeholder: '1',
              halfWidth: true,
            },
            {
              key: 'priority',
              label: 'Priority',
              icon: 'flag',
              placeholder: 'Select',
              type: 'select',
              options: ['essential', 'recommended', 'optional'],
              halfWidth: true,
            },
          ],
          onSave: v =>
            addPackingItem(
              {
                category: v.category || 'General',
                name: v.name,
                quantity: parseInt(v.quantity) || 1,
                priority: (v.priority as any) || 'recommended',
              },
              { onSuccess: () => setWizardConfig(null) },
            ),
        });
        return;
      }

      // â”€â”€â”€ Budget â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
      if (type === 'budget') {
        setWizardConfig({
          title: 'Set Budget',
          icon: 'banknote',
          iconColor: theme.colors.warning,
          fields: [
            {
              key: 'total',
              label: 'Total Budget',
              icon: 'banknote',
              placeholder: 'Enter total budget',
            },
            {
              key: 'flights',
              label: 'Flights',
              icon: 'plane',
              placeholder: '0',
              halfWidth: true,
            },
            {
              key: 'accommodation',
              label: 'Accommodation',
              icon: 'hotel',
              placeholder: '0',
              halfWidth: true,
            },
            {
              key: 'transport',
              label: 'Transport',
              icon: 'car',
              placeholder: '0',
              halfWidth: true,
            },
            {
              key: 'food',
              label: 'Food',
              icon: 'utensils',
              placeholder: '0',
              halfWidth: true,
            },
            {
              key: 'activities',
              label: 'Activities',
              icon: 'zap',
              placeholder: '0',
              halfWidth: true,
            },
            {
              key: 'shopping',
              label: 'Shopping',
              icon: 'shopping-bag',
              placeholder: '0',
              halfWidth: true,
            },
            {
              key: 'miscellaneous',
              label: 'Misc.',
              icon: 'ellipsis',
              placeholder: '0',
              halfWidth: true,
            },
          ],
          onSave: v => {
            updateBudget({
              total: parseFloat(v.total) || 0,
              spent: budget.spent || 0,
              currency: budget.currency || 'INR',
              flights: parseFloat(v.flights) || 0,
              accommodation: parseFloat(v.accommodation) || 0,
              transport: parseFloat(v.transport) || 0,
              food: parseFloat(v.food) || 0,
              activities: parseFloat(v.activities) || 0,
              shopping: parseFloat(v.shopping) || 0,
              miscellaneous: parseFloat(v.miscellaneous) || 0,
            });
            setWizardConfig(null);
          },
          initialValues: {
            total: String(budget.total || ''),
            flights: String(budget.flights || ''),
            accommodation: String(budget.accommodation || ''),
            transport: String(budget.transport || ''),
            food: String(budget.food || ''),
            activities: String(budget.activities || ''),
            shopping: String(budget.shopping || ''),
            miscellaneous: String(budget.miscellaneous || ''),
          },
        });
        return;
      }
    },
    [
      theme,
      plan,
      budget,
      handleAddContact,
      handleUpdateContact,
      getContactFields,
      getContactInitialValues,
      addFlight,
      addHotel,
      addTransport,
      addItineraryDay,
      addChecklistItem,
      addPackingItem,
      updateBudget,
    ],
  );

  // â”€â”€â”€ CONDITIONAL RENDERS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <GlobalLoader
          variant="inline"
          size="large"
          color={theme.colors.primary}
        />
        <Typography
          variant="bodySm"
          color="textSecondary"
          style={{ marginTop: 12 }}
        >
          Loading workspaceâ€¦
        </Typography>
      </View>
    );
  }

  if (!plan) {
    return (
      <View style={styles.centerContainer}>
        <EmptyState
          icon="alert-circle"
          title="Workspace Unavailable"
          description="Failed to load your travel plan."
          actionLabel="Try Again"
          onAction={() => refetch()}
        />
      </View>
    );
  }

  // â”€â”€â”€ RENDER â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  return (
    <View style={styles.root}>
      {trip && (
        <TripHero
          plan={plan}
          coverImage={trip.coverImage}
          tripName={trip.title}
          startDate={trip.startDate}
          endDate={trip.endDate}
        />
      )}

      <View
        style={{
          paddingHorizontal: theme.spacing.lg,
          paddingBottom: theme.spacing.md,
        }}
      >
        <PremiumSegmentedTabs
          tabs={tabsWithBadges}
          activeTab={activeTab}
          onChange={setActiveTab}
          variant="secondary"
        />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: 120,
          paddingHorizontal: theme.spacing.lg,
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
            progressBackgroundColor={theme.colors.surface}
          />
        }
      >
        <View style={{ gap: theme.spacing.xl }}>
          {/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ OVERVIEW TAB â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
          {activeTab === 'Overview' && (
            <Animated.View entering={FadeIn} style={{ gap: theme.spacing.xl }}>
              <PlannerProgressCard
                planningProgress={plan.planningProgress?.overall || 0}
                bookingsCount={bookingsCount}
                bookingsTotal={4}
                packingProgress={packProgress}
                tasksCompleted={checkDone}
                tasksTotal={checkItems.length}
              />

              <BudgetSummaryCard
                total={budget.total}
                spent={budget.spent}
                currency={budget.currency}
                onEdit={() => openWizard('budget')}
                onSetReminder={() => {
                  createBudgetReminder(
                    {
                      category: 'Overall',
                      spentPercent: 80,
                      month: new Date(),
                    },
                    {
                      onSuccess: () =>
                        Alert.alert('Success', 'Budget reminder set!'),
                      onError: (err: any) =>
                        Alert.alert('Error', err.message || 'Failed'),
                    },
                  );
                }}
                breakdown={[
                  {
                    label: 'Flights',
                    value: budget.flights,
                    icon: 'send',
                    color: theme.colors.info,
                  },
                  {
                    label: 'Hotels',
                    value: budget.accommodation,
                    icon: 'hotel',
                    color: theme.colors.warning,
                  },
                  {
                    label: 'Transport',
                    value: budget.transport,
                    icon: 'truck',
                    color: theme.colors.success,
                  },
                  {
                    label: 'Food',
                    value: budget.food,
                    icon: 'utensils',
                    color: theme.colors.warning,
                  },
                  {
                    label: 'Activities',
                    value: budget.activities,
                    icon: 'zap',
                    color: theme.colors.accent,
                  },
                  {
                    label: 'Shopping',
                    value: budget.shopping,
                    icon: 'shopping-bag',
                    color: theme.colors.danger,
                  },
                ]}
              />

              {plan?.tripStatus !== 'active' &&
                plan?.tripStatus !== 'completed' && (
                  <GlassCard variant="prominent" padding="lg">
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: theme.spacing.md,
                      }}
                    >
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: theme.spacing.md,
                          flex: 1,
                        }}
                      >
                        <View
                          style={{
                            width: 44,
                            height: 44,
                            borderRadius: 14,
                            backgroundColor: 'rgba(255,255,255,0.2)',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <AppIcon name="zap" size={22} color="#FFF" />
                        </View>
                        <View>
                          <Typography
                            variant="body"
                            weight="bold"
                            color="textInverse"
                          >
                            Ready to launch?
                          </Typography>
                          <Typography
                            variant="caption"
                            style={{ color: 'rgba(255,255,255,0.8)' }}
                          >
                            Activate your plan to start the adventure
                          </Typography>
                        </View>
                      </View>
                      <Button
                        title="Activate"
                        variant="primary"
                        size="md"
                        onPress={() => setShowActivationModal(true)}
                      />
                    </View>
                  </GlassCard>
                )}

              <View style={{ gap: theme.spacing.md }}>
                <SectionHeader
                  title="Trip Notes"
                  icon="pencil"
                  iconColor={theme.colors.primary}
                />
                <GlassCard variant="medium" padding="md">
                  <TextInput
                    style={[
                      inputStyles(theme).notesInput,
                      { color: theme.colors.textPrimary },
                    ]}
                    multiline
                    placeholder="Write your thoughts, reminders, and notes here..."
                    placeholderTextColor={theme.colors.textTertiary}
                    value={notesText}
                    onChangeText={setNotesText}
                    onBlur={() => updatePlan({ notes: notesText })}
                  />
                </GlassCard>
              </View>

              <View style={{ gap: theme.spacing.md }}>
                <SectionHeader
                  title="Trip Reminders"
                  icon="bell"
                  iconColor={theme.colors.warning}
                />
                {isLoadingReminders ? (
                  <GlobalLoader
                    variant="inline"
                    size="small"
                    color={theme.colors.warning}
                  />
                ) : tripReminders.length === 0 ? (
                  <Typography
                    variant="bodySm"
                    color="textTertiary"
                    align="center"
                    style={{ padding: 20 }}
                  >
                    No reminders for this trip yet.
                  </Typography>
                ) : (
                  <View style={{ gap: theme.spacing.sm }}>
                    {tripReminders.map((reminder: any) => (
                      <GlassCard
                        key={reminder._id}
                        variant="subtle"
                        padding="md"
                      >
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: theme.spacing.md,
                          }}
                        >
                          <AppIcon
                            name="bell"
                            size={16}
                            color={theme.colors.warning}
                          />
                          <View style={{ flex: 1 }}>
                            <Typography
                              variant="bodySm"
                              weight="semibold"
                              color="textPrimary"
                            >
                              {reminder.title}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              {reminder.message}
                            </Typography>
                          </View>
                          {reminder.status === 'active' && (
                            <Badge label="Active" variant="success" />
                          )}
                        </View>
                      </GlassCard>
                    ))}
                  </View>
                )}
              </View>
            </Animated.View>
          )}

          {/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ ITINERARY TAB â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
          {activeTab === 'Itinerary' && (
            <Animated.View entering={FadeIn} style={{ gap: theme.spacing.lg }}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 4,
                }}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: theme.spacing.sm,
                  }}
                >
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 12,
                      backgroundColor: `${theme.colors.primary}15`,
                      borderWidth: 1,
                      borderColor: `${theme.colors.primary}30`,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <AppIcon
                      name="map"
                      size={18}
                      color={theme.colors.primary}
                    />
                  </View>
                  <Typography
                    variant="h3"
                    weight="extrabold"
                    color="textPrimary"
                  >
                    Your Itinerary
                  </Typography>
                  {itinerary.length > 0 && (
                    <View
                      style={{
                        backgroundColor: `${theme.colors.primary}15`,
                        paddingHorizontal: 8,
                        paddingVertical: 3,
                        borderRadius: 999,
                      }}
                    >
                      <Typography
                        variant="caption"
                        weight="bold"
                        style={{ color: theme.colors.primary, fontSize: 11 }}
                      >
                        {itinerary.length}{' '}
                        {itinerary.length === 1 ? 'DAY' : 'DAYS'}
                      </Typography>
                    </View>
                  )}
                </View>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <InteractiveWrapper onPress={() => generateItinerary()}>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 6,
                        paddingHorizontal: 14,
                        paddingVertical: 8,
                        borderRadius: 999,
                        borderWidth: 1,
                        borderColor: `${theme.colors.primary}30`,
                        backgroundColor: `${theme.colors.primary}10`,
                      }}
                    >
                      <AppIcon
                        name="sparkles"
                        size={13}
                        color={theme.colors.primary}
                      />
                      <Typography
                        variant="caption"
                        weight="bold"
                        style={{ color: theme.colors.primary, fontSize: 12 }}
                      >
                        AI Plan
                      </Typography>
                    </View>
                  </InteractiveWrapper>
                  <InteractiveWrapper onPress={() => openWizard('day')}>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 6,
                        paddingHorizontal: 16,
                        paddingVertical: 8,
                        borderRadius: 999,
                        backgroundColor: theme.colors.primary,

                        ...Platform.select({
                          web: {
                            boxShadow: '0 2px 8px rgba(37,99,235,0.25)',
                          } as any,

                          default: {
                            shadowColor: '#000',

                            shadowOffset: {
                              width: 0,
                              height: 4,
                            },

                            shadowOpacity: 0.1,
                            shadowRadius: 10,
                            elevation: 4,
                          },
                        }),
                      }}
                    >
                      <AppIcon name="plus" size={13} color="#FFFFFF" />
                      <Typography
                        variant="caption"
                        weight="bold"
                        style={{ color: '#FFFFFF', fontSize: 12 }}
                      >
                        Add Day
                      </Typography>
                    </View>
                  </InteractiveWrapper>
                </View>
              </View>

              {itinerary.length === 0 ? (
                <EmptyState
                  icon="map-pin"
                  title="No Itinerary Yet"
                  description="Plan your trip day-by-day or auto-generate one with AI."
                  actionLabel="Add First Day"
                  onAction={() => openWizard('day')}
                />
              ) : (
                <ItineraryTimeline
                  days={itinerary}
                  onEdit={() => openWizard('day')}
                  onDelete={(index: number) => {
                    const day = itinerary[index];
                    if (day?._id) deleteItineraryDay(day._id);
                  }}
                />
              )}
            </Animated.View>
          )}

          {/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ BOOKINGS TAB â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
          {activeTab === 'Bookings' && (
            <Animated.View entering={FadeIn} style={{ gap: theme.spacing.xl }}>
              {/* Flights Section */}
              <BookingSection
                title="Flights"
                icon="plane"
                color={theme.colors.info}
                count={flights.length}
                onAdd={() => openWizard('flight')}
              >
                {flights.length === 0 ? (
                  <EmptyState
                    icon="plane"
                    title="No Flights Added"
                    description="Keep your flight boarding passes and tickets organized."
                    actionLabel="Add Flight"
                    onAction={() => openWizard('flight')}
                  />
                ) : (
                  <View style={{ gap: theme.spacing.md }}>
                    {flights.map((f: any, i: number) => (
                      <Animated.View
                        entering={FadeInDown.delay(i * 60)}
                        key={f._id || i}
                      >
                        <FlightCard
                          flight={f}
                          onEdit={() => openWizard('flight')}
                          onDelete={() => deleteFlight(f._id)}
                        />
                      </Animated.View>
                    ))}
                  </View>
                )}
              </BookingSection>

              {/* Accommodations Section */}
              <BookingSection
                title="Accommodation"
                icon="hotel"
                color={theme.colors.warning}
                count={hotels.length}
                onAdd={() => openWizard('hotel')}
              >
                {hotels.length === 0 ? (
                  <EmptyState
                    icon="hotel"
                    title="No Hotels Added"
                    description="Add resort, villa, or hotel reservations."
                    actionLabel="Add Hotel"
                    onAction={() => openWizard('hotel')}
                  />
                ) : (
                  <View style={{ gap: theme.spacing.md }}>
                    {hotels.map((h: any, i: number) => (
                      <Animated.View
                        entering={FadeInDown.delay(i * 60)}
                        key={h._id || i}
                      >
                        <HotelCard
                          hotel={h}
                          onEdit={() => openWizard('hotel')}
                          onDelete={() => deleteHotel(h._id)}
                        />
                      </Animated.View>
                    ))}
                  </View>
                )}
              </BookingSection>

              {/* Transport Section */}
              <BookingSection
                title="Transport"
                icon="car"
                color={theme.colors.success}
                count={transports.length}
                onAdd={() => openWizard('transport')}
              >
                {transports.length === 0 ? (
                  <EmptyState
                    icon="car"
                    title="No Transport Added"
                    description="Add trains, cabs, ferries, or rental car details."
                    actionLabel="Add Transport"
                    onAction={() => openWizard('transport')}
                  />
                ) : (
                  <View style={{ gap: theme.spacing.md }}>
                    {transports.map((t: any, i: number) => (
                      <Animated.View
                        entering={FadeInDown.delay(i * 60)}
                        key={t._id || i}
                      >
                        <TransportCard
                          transport={t}
                          onEdit={() => openWizard('transport')}
                          onDelete={() => deleteTransport(t._id)}
                        />
                      </Animated.View>
                    ))}
                  </View>
                )}
              </BookingSection>
            </Animated.View>
          )}

          {/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ PACKING TAB â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
          {activeTab === 'Packing' && (
            <Animated.View entering={FadeIn} style={{ gap: theme.spacing.xl }}>
              {/* To-Do Checklist */}
              <View style={{ gap: theme.spacing.md }}>
                <SectionHeader
                  title="To-Do List"
                  icon="check-square"
                  iconColor={theme.colors.accent}
                  count={checkItems.length}
                  action={{
                    label: 'Add Task',
                    onPress: () => openWizard('checklist'),
                  }}
                />

                {checkItems.length === 0 ? (
                  <EmptyState
                    icon="check-circle"
                    title="All Tasks Clear!"
                    description="Add tasks to stay on track before your trip."
                    actionLabel="Add Task"
                    onAction={() => openWizard('checklist')}
                  />
                ) : (
                  <GlassCard
                    variant="prominent"
                    padding="none"
                    style={styles.todoCard}
                  >
                    {/* Header with Progress Bar */}
                    <View style={styles.todoProgressWrap}>
                      <View
                        style={{
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <Typography
                          variant="caption"
                          weight="semibold"
                          color="textSecondary"
                        >
                          {checkDone} of {checkItems.length} tasks completed
                        </Typography>
                        <View style={styles.progressPill}>
                          <Text style={styles.progressPillText}>
                            {checkProgress}%
                          </Text>
                        </View>
                      </View>
                      <View
                        style={[
                          styles.progressBarTrack,
                          {
                            backgroundColor: theme.isDark
                              ? 'rgba(255,255,255,0.08)'
                              : 'rgba(0,0,0,0.06)',
                          },
                        ]}
                      >
                        <LinearGradient
                          colors={['#FF6B00', '#EA580C']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={[
                            styles.progressBarFill,
                            { width: `${Math.max(checkProgress, 3)}%` as any },
                          ]}
                        />
                      </View>
                    </View>

                    {/* Task Rows */}
                    <View style={styles.todoItemsList}>
                      {checkItems.map((entry: any, index: number) => (
                        <Animated.View
                          entering={FadeInDown.delay(index * 25)}
                          key={entry._id || index}
                          layout={Layout.springify()}
                        >
                          <Pressable
                            style={[
                              styles.todoRow,
                              { borderBottomColor: theme.colors.borderLight },
                              index === checkItems.length - 1 && {
                                borderBottomWidth: 0,
                              },
                            ]}
                            onPress={() => toggleChecklistItem(entry._id)}
                          >
                            {/* Checkbox */}
                            <View
                              style={[
                                styles.checkboxBubble,
                                entry.checked
                                  ? {
                                      backgroundColor: '#10B981',
                                      borderColor: '#10B981',
                                    }
                                  : {
                                      backgroundColor: theme.isDark
                                        ? 'rgba(255,255,255,0.06)'
                                        : 'rgba(0,0,0,0.04)',
                                      borderColor: theme.colors.borderStrong,
                                    },
                              ]}
                            >
                              {entry.checked && (
                                <AppIcon
                                  name="check"
                                  size={13}
                                  color="#FFFFFF"
                                />
                              )}
                            </View>

                            {/* Title & Metadata */}
                            <View style={{ flex: 1, gap: 2 }}>
                              <Text
                                style={[
                                  styles.todoText,
                                  { color: theme.colors.textPrimary },
                                  entry.checked && {
                                    color: theme.colors.textTertiary,
                                    textDecorationLine: 'line-through',
                                  },
                                ]}
                                numberOfLines={2}
                              >
                                {entry.item}
                              </Text>

                              {entry.dueDate ? (
                                <View style={styles.dueDateRow}>
                                  <AppIcon
                                    name="calendar"
                                    size={10}
                                    color={theme.colors.textTertiary}
                                  />
                                  <Text
                                    style={[
                                      styles.dueDateText,
                                      { color: theme.colors.textTertiary },
                                    ]}
                                  >
                                    Due{' '}
                                    {format(new Date(entry.dueDate), 'MMM d')}
                                  </Text>
                                </View>
                              ) : null}
                            </View>

                            {/* Priority Badge */}
                            {entry.priority === 'high' && (
                              <View
                                style={[
                                  styles.priorityPill,
                                  {
                                    backgroundColor: 'rgba(239, 68, 68, 0.12)',
                                    borderColor: 'rgba(239, 68, 68, 0.3)',
                                  },
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.priorityText,
                                    { color: '#EF4444' },
                                  ]}
                                >
                                  HIGH
                                </Text>
                              </View>
                            )}
                            {entry.priority === 'medium' && (
                              <View
                                style={[
                                  styles.priorityPill,
                                  {
                                    backgroundColor: 'rgba(245, 158, 11, 0.12)',
                                    borderColor: 'rgba(245, 158, 11, 0.3)',
                                  },
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.priorityText,
                                    { color: '#F59E0B' },
                                  ]}
                                >
                                  MED
                                </Text>
                              </View>
                            )}

                            {/* Delete Action */}
                            <Pressable
                              onPress={() => deleteChecklistItem(entry._id)}
                              style={styles.deleteTaskBtn}
                              hitSlop={8}
                            >
                              <AppIcon
                                name="trash-2"
                                size={14}
                                color={theme.colors.textTertiary}
                              />
                            </Pressable>
                          </Pressable>
                        </Animated.View>
                      ))}
                    </View>
                  </GlassCard>
                )}
              </View>

              {/* Packing List */}
              <View style={{ gap: theme.spacing.md }}>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <SectionHeader
                    title="Packing List"
                    icon="package"
                    iconColor={theme.colors.danger}
                    count={packTotal}
                  />
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {packingCategories.length === 0 && (
                      <InteractiveWrapper
                        onPress={() => initializePackingList()}
                      >
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 5,
                            paddingHorizontal: 11,
                            paddingVertical: 6,
                            borderRadius: 20,
                            borderWidth: 1,
                            borderColor: `${theme.colors.primary}30`,
                            backgroundColor: `${theme.colors.primary}15`,
                          }}
                        >
                          <AppIcon
                            name="zap"
                            size={12}
                            color={theme.colors.primary}
                          />
                          <Typography
                            variant="caption"
                            weight="bold"
                            style={{ color: theme.colors.primary }}
                          >
                            Default List
                          </Typography>
                        </View>
                      </InteractiveWrapper>
                    )}
                    <InteractiveWrapper onPress={() => openWizard('packing')}>
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 5,
                          paddingHorizontal: 12,
                          paddingVertical: 6,
                          borderRadius: 20,
                          borderWidth: 1,
                          borderColor: `${theme.colors.danger}30`,
                          backgroundColor: `${theme.colors.danger}15`,
                        }}
                      >
                        <AppIcon
                          name="plus"
                          size={12}
                          color={theme.colors.danger}
                        />
                        <Typography
                          variant="caption"
                          weight="bold"
                          style={{ color: theme.colors.danger }}
                        >
                          Add Item
                        </Typography>
                      </View>
                    </InteractiveWrapper>
                  </View>
                </View>

                {packingCategories.length === 0 ? (
                  <EmptyState
                    icon="package"
                    title="Nothing Packed Yet"
                    description="Create your luggage packing checklist or load standard items."
                    actionLabel="Load Default List"
                    onAction={() => initializePackingList()}
                  />
                ) : (
                  <View style={{ gap: theme.spacing.md }}>
                    {/* Overall Packing Progress */}
                    <GlassCard
                      variant="prominent"
                      padding="none"
                      style={styles.todoProgressWrap}
                    >
                      <View
                        style={{
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <Typography
                          variant="caption"
                          weight="semibold"
                          color="textSecondary"
                        >
                          {packDone} of {packTotal} items packed
                        </Typography>
                        <View
                          style={[
                            styles.progressPill,
                            { backgroundColor: 'rgba(239, 68, 68, 0.12)' },
                          ]}
                        >
                          <Text
                            style={[
                              styles.progressPillText,
                              { color: '#EF4444' },
                            ]}
                          >
                            {packProgress}%
                          </Text>
                        </View>
                      </View>
                      <View
                        style={[
                          styles.progressBarTrack,
                          {
                            backgroundColor: theme.isDark
                              ? 'rgba(255,255,255,0.08)'
                              : 'rgba(0,0,0,0.06)',
                          },
                        ]}
                      >
                        <LinearGradient
                          colors={['#F43F5E', '#E11D48']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={[
                            styles.progressBarFill,
                            { width: `${Math.max(packProgress, 3)}%` as any },
                          ]}
                        />
                      </View>
                    </GlassCard>

                    {/* Categorized Cards */}
                    {packingCategories.map(
                      (category: any, catIndex: number) => {
                        const catConfig = getCategoryConfig(category.category);
                        const catItems = category.items || [];
                        const catDone = catItems.filter(
                          (i: any) => i.checked,
                        ).length;

                        return (
                          <Animated.View
                            key={`cat-${category._id || catIndex}`}
                            entering={FadeInDown.delay(catIndex * 40)}
                          >
                            <GlassCard
                              variant="prominent"
                              padding="none"
                              style={styles.packingCard}
                            >
                              {/* Category Header */}
                              <View
                                style={[
                                  styles.packingCatHeader,
                                  {
                                    borderBottomColor: theme.colors.borderLight,
                                  },
                                ]}
                              >
                                <View
                                  style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    gap: 10,
                                  }}
                                >
                                  <View
                                    style={[
                                      styles.catIconBubble,
                                      {
                                        backgroundColor: `${catConfig.color}18`,
                                        borderColor: `${catConfig.color}30`,
                                      },
                                    ]}
                                  >
                                    <AppIcon
                                      name={catConfig.icon as any}
                                      size={15}
                                      color={catConfig.color}
                                    />
                                  </View>
                                  <Text
                                    style={[
                                      styles.packingCatTitle,
                                      { color: theme.colors.textPrimary },
                                    ]}
                                  >
                                    {category.category}
                                  </Text>
                                </View>
                                <View
                                  style={[
                                    styles.catCountBadge,
                                    { backgroundColor: `${catConfig.color}15` },
                                  ]}
                                >
                                  <Text
                                    style={[
                                      styles.catCountText,
                                      { color: catConfig.color },
                                    ]}
                                  >
                                    {catDone}/{catItems.length}
                                  </Text>
                                </View>
                              </View>

                              {/* Category Items */}
                              <View style={styles.catItemsList}>
                                {catItems.map(
                                  (entry: any, itemIndex: number) => (
                                    <Animated.View
                                      key={`pack-${category._id}-${entry._id || itemIndex}`}
                                      entering={FadeInDown.delay(
                                        itemIndex * 20,
                                      )}
                                      layout={Layout.springify()}
                                    >
                                      <Pressable
                                        style={[
                                          styles.packingRow,
                                          {
                                            borderBottomColor:
                                              theme.colors.borderLight,
                                          },
                                          itemIndex === catItems.length - 1 && {
                                            borderBottomWidth: 0,
                                          },
                                        ]}
                                        onPress={() =>
                                          togglePackingItem({
                                            categoryId: category._id,
                                            itemId: entry._id,
                                          })
                                        }
                                      >
                                        <View
                                          style={[
                                            styles.checkboxBubble,
                                            entry.checked
                                              ? {
                                                  backgroundColor: '#10B981',
                                                  borderColor: '#10B981',
                                                }
                                              : {
                                                  backgroundColor: theme.isDark
                                                    ? 'rgba(255,255,255,0.06)'
                                                    : 'rgba(0,0,0,0.04)',
                                                  borderColor:
                                                    theme.colors.borderStrong,
                                                },
                                          ]}
                                        >
                                          {entry.checked && (
                                            <AppIcon
                                              name="check"
                                              size={13}
                                              color="#FFFFFF"
                                            />
                                          )}
                                        </View>

                                        <Text
                                          style={[
                                            styles.packingItemText,
                                            { color: theme.colors.textPrimary },
                                            entry.checked && {
                                              color: theme.colors.textTertiary,
                                              textDecorationLine:
                                                'line-through',
                                            },
                                          ]}
                                          numberOfLines={1}
                                        >
                                          {entry.name}
                                        </Text>

                                        {entry.quantity > 1 && (
                                          <View
                                            style={[
                                              styles.quantityPill,
                                              {
                                                backgroundColor: theme.isDark
                                                  ? 'rgba(255,255,255,0.08)'
                                                  : 'rgba(0,0,0,0.05)',
                                              },
                                            ]}
                                          >
                                            <Text
                                              style={[
                                                styles.quantityText,
                                                {
                                                  color:
                                                    theme.colors.textSecondary,
                                                },
                                              ]}
                                            >
                                              Ã— {entry.quantity}
                                            </Text>
                                          </View>
                                        )}

                                        {entry.priority === 'essential' && (
                                          <View
                                            style={[
                                              styles.priorityPill,
                                              {
                                                backgroundColor:
                                                  'rgba(239, 68, 68, 0.12)',
                                                borderColor:
                                                  'rgba(239, 68, 68, 0.3)',
                                              },
                                            ]}
                                          >
                                            <Text
                                              style={[
                                                styles.priorityText,
                                                { color: '#EF4444' },
                                              ]}
                                            >
                                              MUST
                                            </Text>
                                          </View>
                                        )}

                                        <Pressable
                                          onPress={() =>
                                            deletePackingItem({
                                              categoryId: category._id,
                                              itemId: entry._id,
                                            })
                                          }
                                          style={styles.deleteTaskBtn}
                                          hitSlop={8}
                                        >
                                          <AppIcon
                                            name="trash-2"
                                            size={14}
                                            color={theme.colors.textTertiary}
                                          />
                                        </Pressable>
                                      </Pressable>
                                    </Animated.View>
                                  ),
                                )}
                              </View>
                            </GlassCard>
                          </Animated.View>
                        );
                      },
                    )}
                  </View>
                )}
              </View>
            </Animated.View>
          )}

          {/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ CONTACTS TAB â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
          {activeTab === 'Contacts' && (
            <Animated.View entering={FadeIn} style={{ gap: theme.spacing.md }}>
              <SectionHeader
                title="Important Contacts"
                icon="users"
                iconColor={theme.colors.success}
                count={contacts.length}
                action={{ label: 'Add', onPress: () => openWizard('contact') }}
              />
              {contacts.length === 0 ? (
                <EmptyState
                  icon="phone"
                  title="No Contacts Added"
                  description="Add emergency contacts, hotel info, embassy, and travel insurance."
                  actionLabel="Add First Contact"
                  onAction={() => openWizard('contact')}
                />
              ) : (
                <View style={{ gap: theme.spacing.md }}>
                  {contacts.map((contact: IContact) => (
                    <ContactCard
                      key={contact._id}
                      contact={contact}
                      onEdit={() => openWizard('contact', contact)}
                      onDelete={() => {
                        Alert.alert('Delete Contact', 'Are you sure?', [
                          { text: 'Cancel', style: 'cancel' },
                          {
                            text: 'Delete',
                            style: 'destructive',
                            onPress: () => deleteContact(contact._id!),
                          },
                        ]);
                      }}
                      onSetPrimary={() =>
                        setPrimaryContact({
                          contactId: contact._id!,
                          type: contact.type,
                        })
                      }
                      showSetPrimary={
                        !contact.isPrimary &&
                        contacts.filter(
                          (c: IContact) => c.type === contact.type,
                        ).length > 1
                      }
                    />
                  ))}
                </View>
              )}
            </Animated.View>
          )}
        </View>
      </ScrollView>

      {/* Modal Wizard Form */}
      {wizardConfig && (
        <PremiumWizardForm
          visible={!!wizardConfig}
          title={wizardConfig.title}
          icon={wizardConfig.icon}
          iconColor={wizardConfig.iconColor}
          fields={wizardConfig.fields}
          onClose={() => {
            setWizardConfig(null);
            setEditingContact(null);
          }}
          onSave={wizardConfig.onSave}
          initialValues={wizardConfig.initialValues}
          isLoading={isMutating}
        />
      )}

      {/* Activation Modal */}
      <Modal visible={showActivationModal} transparent animationType="fade">
        <View style={modalStyles(theme).overlay}>
          <Animated.View
            entering={ZoomIn}
            style={[
              modalStyles(theme).container,
              { backgroundColor: theme.colors.surface },
            ]}
          >
            <View style={modalStyles(theme).iconArea}>
              <View
                style={[
                  modalStyles(theme).iconCircle,
                  { backgroundColor: theme.colors.primary },
                ]}
              >
                <AppIcon name="zap" size={28} color="#FFF" />
              </View>
            </View>
            <Typography
              variant="h2"
              weight="extrabold"
              color="textPrimary"
              align="center"
            >
              Activate Your Trip
            </Typography>
            <Typography variant="body" color="textSecondary" align="center">
              This will mark your travel plan as active and kick off your
              adventure!
            </Typography>
            <View
              style={{
                flexDirection: 'row',
                gap: theme.spacing.md,
                width: '100%',
              }}
            >
              <Button
                title="Cancel"
                variant="outline"
                size="lg"
                fullWidth
                onPress={() => setShowActivationModal(false)}
              />
              <Button
                title="Activate"
                variant="primary"
                size="lg"
                fullWidth
                onPress={() => {
                  haptics.medium();
                  activateTrip();
                  setShowActivationModal(false);
                }}
                leftIcon={
                  <AppIcon
                    name="zap"
                    size={16}
                    color={theme.colors.textInverse}
                  />
                }
              />
            </View>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

// â”€â”€â”€ Styles â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const styles = StyleSheet.create({
  root: { flex: 1 },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  todoCard: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  todoProgressWrap: {
    padding: 16,
    gap: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  progressPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: 'rgba(234, 88, 12, 0.12)',
  },
  progressPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#EA580C',
  },
  progressBarTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  todoItemsList: {
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  todoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 1,
  },
  checkboxBubble: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todoText: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  dueDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dueDateText: {
    fontSize: 10,
    fontWeight: '600',
  },
  priorityPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  priorityText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  deleteTaskBtn: {
    padding: 6,
    borderRadius: 6,
  },
  packingCard: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  packingCatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  catIconBubble: {
    width: 30,
    height: 30,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  packingCatTitle: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  catCountBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  catCountText: {
    fontSize: 11,
    fontWeight: '800',
  },
  catItemsList: {
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  packingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    gap: 12,
    borderBottomWidth: 1,
  },
  packingItemText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  quantityPill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  quantityText: {
    fontSize: 11,
    fontWeight: '700',
  },
});

function inputStyles(theme: Theme) {
  return StyleSheet.create({
    notesInput: {
      minHeight: 130,
      fontSize: 15,
      textAlignVertical: 'top',
      lineHeight: 22,
      fontFamily: theme.typography.fontFamily.sans,
    },
  });
}

function modalStyles(theme: Theme) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    },
    container: {
      width: '100%',
      maxWidth: 400,
      borderRadius: 24,
      padding: 32,
      alignItems: 'center',
      gap: theme.spacing.lg,
    },
    iconArea: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: `${theme.colors.primary}18`,
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconCircle: {
      width: 56,
      height: 56,
      borderRadius: 28,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
}

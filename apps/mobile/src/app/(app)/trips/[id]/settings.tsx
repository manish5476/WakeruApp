import GlobalLoader from '../../../../components/common/GlobalLoader';
import AppIcon from '../../../../components/common/AppIcon';
// app/(app)/trips/[id]/settings.tsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  PressableStateCallbackType,
  useWindowDimensions,
  Modal,
  TouchableWithoutFeedback,
  Image,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { GlobalBackground } from '../../../../components/ui/GlobalBackground';
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format, addDays, isBefore, isAfter, differenceInDays } from 'date-fns';
import {
  useTrip,
  useUpdateTrip,
  useArchiveTrip,
  useUnarchiveTrip,
  useDeleteTripPermanent,
  useUpdateMemberRole,
  useRemoveMember,
} from '../../../../hooks/useTrips';
import { useTheme } from '../../../../providers/ThemeProvider';
import { useAuthStore } from '../../../../stores/auth.store';
import { haptics } from '../../../../utils/haptics';
import { showToast } from '../../../../utils/toast';
import { GlassCard } from '../../../../components/ui/GlassCard';
import { Badge } from '../../../../components/ui/Badge';
import { isUserTripAdmin } from '../../../../utils/tripPermissions';

// Safe web pressable type
type WebPressableState = PressableStateCallbackType & { hovered?: boolean };

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// ============================================================
// Animated Custom Toggle
// ============================================================
function AnimatedToggle({
  value,
  onToggle,
}: {
  value: boolean;
  onToggle: () => void;
}) {
  const styles = useStyles();
  const theme = useTheme();
  const knobPosition = useSharedValue(value ? 20 : 2);

  useEffect(() => {
    knobPosition.value = withSpring(value ? 20 : 2, {
      damping: 15,
      stiffness: 250,
    });
  }, [value]);

  const animatedKnobStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: knobPosition.value }],
  }));

  return (
    <Pressable
      onPress={() => {
        haptics.light();
        onToggle();
      }}
      style={[
        styles.toggleTrack,
        {
          backgroundColor: value
            ? theme.colors.success
            : theme.colors.borderLight,
        },
      ]}
    >
      <Animated.View style={[styles.toggleKnob, animatedKnobStyle]} />
    </Pressable>
  );
}

// ============================================================
// Date Display Component
// ============================================================
function DateDisplay({
  date,
  label,
  onPress,
  minDate,
  isStart,
}: {
  date: Date;
  label: string;
  onPress: () => void;
  minDate?: Date;
  isStart?: boolean;
}) {
  const theme = useTheme();
  const styles = useStyles();

  // Calculate duration if it's the end date
  const getDateInfo = () => {
    if (!isStart && minDate) {
      const days = differenceInDays(date, minDate);
      if (days > 0) {
        return `${format(date, 'MMM d, yyyy')} (${days} day${days > 1 ? 's' : ''})`;
      }
    }
    return format(date, 'MMM d, yyyy');
  };

  return (
    <Pressable
      style={({ hovered }: WebPressableState) => [
        styles.dateButton,
        {
          borderColor: theme.colors.borderLight,
          backgroundColor: theme.isDark
            ? 'rgba(255, 255, 255, 0.05)'
            : 'rgba(0, 0, 0, 0.03)',
        },
        Platform.OS === 'web' &&
          hovered &&
          ({
            backgroundColor: theme.colors.primaryBg,
            cursor: 'pointer',
          } as any),
      ]}
      onPress={() => {
        haptics.light();
        onPress();
      }}
    >
      <View style={styles.dateButtonContent}>
        <Text
          style={[
            styles.dateButtonLabel,
            { color: theme.colors.textSecondary },
          ]}
        >
          {label}
        </Text>
        <Text
          style={[styles.dateButtonText, { color: theme.colors.textPrimary }]}
        >
          {getDateInfo()}
        </Text>
      </View>
      <View style={styles.dateButtonIconWrap}>
        <AppIcon name="calendar" size={16} color={theme.colors.textSecondary} />
      </View>
    </Pressable>
  );
}

// ============================================================
// MAIN SCREEN
// ============================================================
export default function TripSettingsScreen() {
  const theme = useTheme();
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { id } = useLocalSearchParams<{ id: string }>();

  const isWebDesktop = Platform.OS === 'web' && width > 768;

  const { data: trip, isLoading } = useTrip(id as string);
  const updateTripMutation = useUpdateTrip();
  const archiveMutation = useArchiveTrip();
  const unarchiveMutation = useUnarchiveTrip();
  const deleteMutation = useDeleteTripPermanent();
  const updateMemberRole = useUpdateMemberRole();
  const removeMember = useRemoveMember();
  const { user } = useAuthStore();
  const isTripAdmin = useMemo(() => isUserTripAdmin(trip, user), [trip, user]);

  const [isUpdating, setIsUpdating] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [status, setStatus] = useState<
    'planning' | 'active' | 'completed' | 'archived'
  >('planning');

  // UI State
  const [showStartDate, setShowStartDate] = useState(false);
  const [showEndDate, setShowEndDate] = useState(false);
  const [isTitleFocused, setIsTitleFocused] = useState(false);
  const [isDescFocused, setIsDescFocused] = useState(false);
  const [isCoverFocused, setIsCoverFocused] = useState(false);

  // Permissions
  const [allowAnyPayer, setAllowAnyPayer] = useState(false);
  const [allowOthersToArchiveTrip, setAllowOthersToArchiveTrip] =
    useState(false);

  // Physics
  const saveButtonScale = useSharedValue(1);

  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (trip && !isInitialized) {
      setTitle(trip.title || '');
      setDescription(trip.description || '');
      setCoverImage(trip.coverImage || '');
      setStartDate(new Date(trip.startDate));
      setEndDate(new Date(trip.endDate));
      setStatus(trip.status as any);
      setAllowAnyPayer(trip.allowAnyPayer ?? false);
      setAllowOthersToArchiveTrip(trip.allowOthersToArchiveTrip ?? false);
      setIsInitialized(true);
    }
  }, [trip, isInitialized]);

  // Update end date when start date changes (if end date is before start date)
  useEffect(() => {
    if (isBefore(endDate, startDate)) {
      setEndDate(startDate);
    }
  }, [startDate, endDate]);

  const handleSave = async () => {
    haptics.medium();
    if (!isTripAdmin) {
      showToast.warning(
        'Read Only',
        'Only trip admins can save trip settings.',
      );
      return;
    }
    if (!title.trim()) {
      Alert.alert('Missing Title', 'Please enter a trip title');
      return;
    }
    if (endDate < startDate) {
      Alert.alert('Invalid Dates', 'End date must be after start date');
      return;
    }

    setIsUpdating(true);
    try {
      await updateTripMutation.mutateAsync({
        tripId: id as string,
        data: {
          title: title.trim(),
          description: description.trim() || undefined,
          coverImage: coverImage.trim(),
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          status,
          allowAnyPayer,
          allowOthersToArchiveTrip,
        },
      });
      showToast.success(
        'Settings Saved',
        'Trip settings updated successfully.',
      );
      router.back();
    } catch (error: any) {
      showToast.fromError(error, 'Failed to Update Settings');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleArchive = async () => {
    if (!isTripAdmin && !allowOthersToArchiveTrip) {
      showToast.warning('Read Only', 'Only trip admins can archive this trip.');
      return;
    }
    if (Platform.OS === 'web') {
      if (
        typeof window !== 'undefined' &&
        window.confirm(
          'This trip will be moved to the Archive tab and hidden from active lists. Are you sure?',
        )
      ) {
        try {
          await archiveMutation.mutateAsync(id as string);
          router.replace('/(app)/(tabs)/home');
        } catch (e: any) {
          showToast.fromError(e, 'Failed to Archive Trip');
        }
      }
      return;
    }

    Alert.alert(
      'Archive Trip',
      'This trip will be moved to the Archive tab and hidden from active lists. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Archive',
          style: 'destructive',
          onPress: async () => {
            try {
              await archiveMutation.mutateAsync(id as string);
              router.replace('/(app)/(tabs)/home');
            } catch (e: any) {
              showToast.fromError(e, 'Failed to Archive Trip');
            }
          },
        },
      ],
    );
  };

  const handleUnarchive = async () => {
    if (Platform.OS === 'web') {
      if (
        typeof window !== 'undefined' &&
        window.confirm(
          'This trip will be restored to your active list. Are you sure?',
        )
      ) {
        try {
          await unarchiveMutation.mutateAsync(id as string);
        } catch (e: any) {
          showToast.fromError(e, 'Failed to Unarchive Trip');
        }
      }
      return;
    }

    Alert.alert(
      'Unarchive Trip',
      'This trip will be restored to your active list. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unarchive',
          style: 'default',
          onPress: async () => {
            try {
              await unarchiveMutation.mutateAsync(id as string);
            } catch (e: any) {
              showToast.fromError(e, 'Failed to Unarchive Trip');
            }
          },
        },
      ],
    );
  };

  const handleDeletePermanent = async () => {
    if (!isTripAdmin) {
      showToast.warning(
        'Read Only',
        'Only trip admins can permanently delete this trip.',
      );
      return;
    }
    if (Platform.OS === 'web') {
      if (
        typeof window !== 'undefined' &&
        window.confirm(
          'This will permanently delete the trip and all related expenses. This action cannot be undone. Are you sure?',
        )
      ) {
        try {
          await deleteMutation.mutateAsync(id as string);
          router.replace('/(app)/(tabs)/home');
        } catch (e: any) {
          showToast.fromError(e, 'Failed to Delete Trip');
        }
      }
      return;
    }

    Alert.alert(
      'Delete Permanently',
      'WARNING: This will permanently delete the trip and all its expenses. This action cannot be undone. Are you absolutely sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMutation.mutateAsync(id as string);
              router.replace('/(app)/(tabs)/home');
            } catch (e: any) {
              showToast.fromError(e, 'Failed to Delete Trip');
            }
          },
        },
      ],
    );
  };

  const handleDateChange = (date: Date | undefined, isStart: boolean) => {
    if (date) {
      if (isStart) {
        setStartDate(date);
        // Auto-adjust end date if it's before new start date
        if (isBefore(endDate, date)) {
          setEndDate(date);
        }
      } else {
        // Ensure end date is not before start date
        if (isBefore(date, startDate)) {
          Alert.alert(
            'Invalid Date',
            'End date must be after or equal to start date',
            [{ text: 'OK' }],
          );
          return;
        }
        setEndDate(date);
      }
    }
  };

  // ── Web Date Picker Modal ────────────────────────────────────────
  const WebDateModal = ({
    currentDate,
    minDate,
    onClose,
    onSave,
  }: {
    currentDate: Date;
    minDate?: Date;
    onClose: () => void;
    onSave: (date: Date) => void;
  }) => {
    const [tempDate, setTempDate] = useState(currentDate);
    return (
      <Modal
        transparent
        animationType="fade"
        visible={true}
        onRequestClose={onClose}
      >
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.webModalOverlay}>
            <TouchableWithoutFeedback>
              <View
                style={[
                  styles.webModalContent,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.borderLight,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.webModalTitle,
                    { color: theme.colors.textPrimary },
                  ]}
                >
                  Select Date
                </Text>
                {/* @ts-ignore — web-only <input> element */}
                <input
                  type="date"
                  value={format(tempDate, 'yyyy-MM-dd')}
                  min={minDate ? format(minDate, 'yyyy-MM-dd') : undefined}
                  onChange={(e: any) => {
                    const newDate = new Date(e.target.value + 'T00:00:00');
                    if (!isNaN(newDate.getTime())) setTempDate(newDate);
                  }}
                  style={{
                    width: '100%',
                    padding: 12,
                    fontSize: 16,
                    borderRadius: 12,
                    border: `1px solid ${theme.colors.borderLight}`,
                    color: theme.colors.textPrimary,
                    backgroundColor: 'transparent',
                    marginTop: 16,
                    marginBottom: 16,
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
                <View style={styles.webModalActions}>
                  <Pressable
                    onPress={onClose}
                    style={[
                      styles.webModalBtn,
                      { borderColor: theme.colors.borderLight },
                    ]}
                  >
                    <Text
                      style={[
                        styles.webModalBtnText,
                        { color: theme.colors.textSecondary },
                      ]}
                    >
                      Cancel
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      onSave(tempDate);
                      onClose();
                    }}
                    style={[
                      styles.webModalBtn,
                      {
                        backgroundColor: theme.colors.primary,
                        borderColor: theme.colors.primary,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.webModalBtnText,
                        { color: theme.colors.textInverse },
                      ]}
                    >
                      Save
                    </Text>
                  </Pressable>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    );
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    haptics.light();
    try {
      await updateMemberRole.mutateAsync({
        tripId: id as string,
        userId,
        role: newRole,
      });
    } catch (error: any) {
      const msg =
        error?.response?.data?.message ||
        error?.message ||
        'Could not update role';
      Alert.alert('Role Update Failed', msg);
    }
  };

  const handleRemoveMember = (userId: string, userName: string) => {
    haptics.warning();
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      if (
        window.confirm(
          `Are you sure you want to remove ${userName} from this trip?`,
        )
      ) {
        removeMember.mutate({ tripId: id as string, userId });
      }
      return;
    }

    Alert.alert(
      'Remove Member',
      `Are you sure you want to remove ${userName} from this trip?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            removeMember.mutate({ tripId: id as string, userId });
          },
        },
      ],
    );
  };

  if (!trip && isLoading) {
    return (
      <View
        style={[
          styles.container,
          { justifyContent: 'center', alignItems: 'center' },
        ]}
      >
        <GlobalLoader
          variant="inline"
          size="large"
          color={theme.colors.primary}
        />
      </View>
    );
  }

  if (!trip) {
    return (
      <View
        style={[
          styles.container,
          { justifyContent: 'center', alignItems: 'center', padding: 24 },
        ]}
      >
        <AppIcon name="alert-circle" size={48} color={theme.colors.warning} />
        <Text
          style={{
            color: theme.colors.textPrimary,
            fontSize: 18,
            fontWeight: '700',
            marginTop: 16,
          }}
        >
          Trip Settings Unavailable
        </Text>
        <Text
          style={{
            color: theme.colors.textSecondary,
            fontSize: 14,
            textAlign: 'center',
            marginTop: 8,
          }}
        >
          Could not find details for this trip offline.
        </Text>
        <Pressable
          onPress={() => router.back()}
          style={{
            marginTop: 24,
            paddingVertical: 10,
            paddingHorizontal: 20,
            backgroundColor: theme.colors.primary,
            borderRadius: 12,
          }}
        >
          <Text style={{ color: '#FFF', fontWeight: '600' }}>Go Back</Text>
        </Pressable>
      </View>
    );
  }
  const isArchived = trip.status === 'archived';
  const tripDuration = differenceInDays(endDate, startDate);

  const StatusBadge = (
    <Animated.View entering={FadeInDown.delay(50).duration(400).springify()}>
      <View style={styles.statusBadgeContainer}>
        <Badge
          label={isArchived ? 'Archived' : status.toUpperCase()}
          variant={
            isArchived
              ? 'neutral'
              : status === 'active'
                ? 'success'
                : status === 'completed'
                  ? 'info'
                  : 'warning'
          }
        />
      </View>
    </Animated.View>
  );

  const GeneralInfoSection = (
    <Animated.View entering={FadeInDown.delay(100).duration(500).springify()}>
      <Text
        style={[styles.sectionLabel, { color: theme.colors.textSecondary }]}
      >
        General Info
      </Text>
      <GlassCard
        style={styles.glassCard}
        padding="none"
        intensity={theme.isDark ? 20 : 35}
      >
        <View style={styles.cardInner}>
          <View style={styles.fieldContainer}>
            <Text
              style={[styles.fieldLabel, { color: theme.colors.textSecondary }]}
            >
              Trip Name{' '}
              <Text
                style={[
                  styles.requiredAsterisk,
                  { color: theme.colors.danger },
                ]}
              >
                *
              </Text>
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  color: theme.colors.textPrimary,
                  borderColor: isTitleFocused
                    ? theme.colors.primary
                    : theme.colors.borderLight,
                  backgroundColor: theme.isDark
                    ? 'rgba(255, 255, 255, 0.05)'
                    : 'rgba(0, 0, 0, 0.03)',
                },
                isTitleFocused && styles.inputFocused,
                Platform.OS === 'web'
                  ? ({ outlineStyle: 'none' } as any)
                  : null,
              ]}
              placeholder="e.g., Summer in Europe"
              placeholderTextColor={theme.colors.textTertiary}
              value={title}
              onChangeText={setTitle}
              onFocus={() => {
                haptics.light();
                setIsTitleFocused(true);
              }}
              onBlur={() => setIsTitleFocused(false)}
              maxLength={150}
            />
          </View>

          <View style={styles.fieldContainer}>
            <Text
              style={[styles.fieldLabel, { color: theme.colors.textSecondary }]}
            >
              Description{' '}
              <Text
                style={[
                  styles.optionalText,
                  { color: theme.colors.textTertiary },
                ]}
              >
                (optional)
              </Text>
            </Text>
            <TextInput
              style={[
                styles.input,
                styles.textArea,
                {
                  color: theme.colors.textPrimary,
                  borderColor: isDescFocused
                    ? theme.colors.primary
                    : theme.colors.borderLight,
                  backgroundColor: theme.isDark
                    ? 'rgba(255, 255, 255, 0.05)'
                    : 'rgba(0, 0, 0, 0.03)',
                },
                isDescFocused && styles.inputFocused,
                Platform.OS === 'web'
                  ? ({ outlineStyle: 'none' } as any)
                  : null,
              ]}
              placeholder="What's this trip about?"
              placeholderTextColor={theme.colors.textTertiary}
              value={description}
              onChangeText={setDescription}
              onFocus={() => {
                haptics.light();
                setIsDescFocused(true);
              }}
              onBlur={() => setIsDescFocused(false)}
              maxLength={1000}
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={[styles.fieldContainer, { marginBottom: 0 }]}>
            <Text
              style={[styles.fieldLabel, { color: theme.colors.textSecondary }]}
            >
              Cover Photo URL{' '}
              <Text
                style={[
                  styles.optionalText,
                  { color: theme.colors.textTertiary },
                ]}
              >
                (optional)
              </Text>
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  color: theme.colors.textPrimary,
                  borderColor: isCoverFocused
                    ? theme.colors.primary
                    : theme.colors.borderLight,
                  backgroundColor: theme.isDark
                    ? 'rgba(255, 255, 255, 0.05)'
                    : 'rgba(0, 0, 0, 0.03)',
                },
                isCoverFocused && styles.inputFocused,
                Platform.OS === 'web'
                  ? ({ outlineStyle: 'none' } as any)
                  : null,
              ]}
              placeholder="https://images.unsplash.com/photo..."
              placeholderTextColor={theme.colors.textTertiary}
              value={coverImage}
              onChangeText={setCoverImage}
              onFocus={() => {
                haptics.light();
                setIsCoverFocused(true);
              }}
              onBlur={() => setIsCoverFocused(false)}
              autoCapitalize="none"
              keyboardType="url"
            />
          </View>
        </View>
      </GlassCard>
    </Animated.View>
  );

  const DatesAndStatusSection = (
    <Animated.View entering={FadeInDown.delay(200).duration(500).springify()}>
      <Text
        style={[styles.sectionLabel, { color: theme.colors.textSecondary }]}
      >
        Schedule & Status
      </Text>
      <GlassCard
        style={styles.glassCard}
        padding="none"
        intensity={theme.isDark ? 20 : 35}
      >
        <View style={styles.cardInner}>
          <View style={styles.dateRow}>
            <DateDisplay
              date={startDate}
              label="Start Date"
              onPress={() => {
                haptics.light();
                setShowStartDate(true);
              }}
              isStart={true}
            />
            {showStartDate && Platform.OS !== 'web' && (
              <DateTimePicker
                value={startDate}
                mode="date"
                onChange={(_, date) => {
                  setShowStartDate(false);
                  if (date) handleDateChange(date, true);
                }}
              />
            )}
            {showStartDate && Platform.OS === 'web' && (
              <WebDateModal
                currentDate={startDate}
                onClose={() => setShowStartDate(false)}
                onSave={date => handleDateChange(date, true)}
              />
            )}

            <DateDisplay
              date={endDate}
              label="End Date"
              onPress={() => {
                haptics.light();
                setShowEndDate(true);
              }}
              minDate={startDate}
            />
            {showEndDate && Platform.OS !== 'web' && (
              <DateTimePicker
                value={endDate}
                mode="date"
                minimumDate={startDate}
                onChange={(_, date) => {
                  setShowEndDate(false);
                  if (date) handleDateChange(date, false);
                }}
              />
            )}
            {showEndDate && Platform.OS === 'web' && (
              <WebDateModal
                currentDate={endDate}
                minDate={startDate}
                onClose={() => setShowEndDate(false)}
                onSave={date => handleDateChange(date, false)}
              />
            )}
          </View>

          {/* Trip Duration Display */}
          {tripDuration > 0 && (
            <View style={styles.durationDisplay}>
              <AppIcon
                name="clock"
                size={14}
                color={theme.colors.textTertiary}
              />
              <Text
                style={[
                  styles.durationText,
                  { color: theme.colors.textTertiary },
                ]}
              >
                {tripDuration} day{tripDuration > 1 ? 's' : ''} trip
              </Text>
            </View>
          )}

          <View style={[styles.fieldContainer, { marginBottom: 0 }]}>
            <Text
              style={[styles.fieldLabel, { color: theme.colors.textSecondary }]}
            >
              Trip Status
            </Text>
            <View style={styles.statusOptions}>
              {(['planning', 'active', 'completed'] as const).map(s => (
                <Pressable
                  key={s}
                  style={({ hovered }: WebPressableState) => [
                    styles.statusOption,
                    {
                      borderColor:
                        status === s
                          ? theme.colors.primary
                          : theme.colors.borderLight,
                      backgroundColor:
                        status === s
                          ? theme.colors.primary
                          : theme.isDark
                            ? 'rgba(255, 255, 255, 0.05)'
                            : 'rgba(0, 0, 0, 0.03)',
                    },
                    Platform.OS === 'web' &&
                      hovered &&
                      status !== s &&
                      ({
                        backgroundColor: theme.colors.primaryBg,
                        cursor: 'pointer',
                      } as any),
                  ]}
                  onPress={() => {
                    haptics.light();
                    setStatus(s);
                  }}
                >
                  <Text
                    style={[
                      styles.statusOptionText,
                      {
                        color:
                          status === s
                            ? theme.colors.textInverse
                            : theme.colors.textSecondary,
                      },
                    ]}
                  >
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>
      </GlassCard>
    </Animated.View>
  );

  const MemberManagementSection = (
    <Animated.View entering={FadeInDown.delay(250).duration(500).springify()}>
      <Text
        style={[styles.sectionLabel, { color: theme.colors.textSecondary }]}
      >
        Member Roles & Access
      </Text>
      <GlassCard
        style={styles.glassCard}
        padding="none"
        intensity={theme.isDark ? 20 : 35}
      >
        <View style={styles.cardInner}>
          {trip.members.map((member: any, index: number) => {
            const isCreator = member.userId === trip.createdBy;
            const isSelf =
              member.userId === user?.firebaseUid ||
              member.userId === (user as any)?._id ||
              member.userId === (user as any)?.userId;
            const isModifying =
              updateMemberRole.isPending &&
              (updateMemberRole.variables as any)?.userId === member.userId;
            const avatarUri = member.avatarUrl || member.photoURL;
            const initials = (member.displayName || 'U')
              .charAt(0)
              .toUpperCase();

            return (
              <View
                key={member.userId}
                style={[
                  styles.memberCardRow,
                  {
                    borderBottomWidth:
                      index === trip.members.length - 1 ? 0 : 1,
                    borderBottomColor: theme.colors.borderLight,
                  },
                ]}
              >
                <View style={styles.memberTopRow}>
                  {/* Avatar */}
                  <View style={styles.memberAvatarWrap}>
                    {avatarUri ? (
                      <Image
                        source={{ uri: avatarUri }}
                        style={styles.memberAvatarImg}
                      />
                    ) : (
                      <View
                        style={[
                          styles.memberAvatarFallback,
                          { backgroundColor: theme.colors.primary },
                        ]}
                      >
                        <Text
                          style={[
                            styles.memberAvatarInitial,
                            { color: theme.colors.textInverse },
                          ]}
                        >
                          {initials}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Member Info */}
                  <View style={styles.memberInfoCol}>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 6,
                        flexWrap: 'wrap',
                      }}
                    >
                      <Text
                        style={[
                          styles.permissionTitle,
                          { color: theme.colors.textPrimary },
                        ]}
                      >
                        {member.displayName || 'Unknown User'}
                      </Text>
                      {isCreator && <Badge label="Owner" variant="primary" />}
                      {isSelf && <Badge label="You" variant="neutral" />}
                    </View>
                    <Text
                      style={[
                        styles.permissionDesc,
                        { color: theme.colors.textTertiary },
                      ]}
                    >
                      Joined{' '}
                      {member.joinedAt
                        ? format(new Date(member.joinedAt), 'MMM d, yyyy')
                        : 'Recently'}
                    </Text>
                  </View>

                  {/* Right Action / Role Badge */}
                  <View
                    style={{ alignItems: 'flex-end', justifyContent: 'center' }}
                  >
                    {isCreator ? (
                      <Text
                        style={{
                          fontSize: 13,
                          color: theme.colors.textTertiary,
                          fontStyle: 'italic',
                        }}
                      >
                        Trip Creator
                      </Text>
                    ) : isSelf ? (
                      <Badge
                        label={
                          member.role
                            ? member.role.charAt(0).toUpperCase() +
                              member.role.slice(1)
                            : 'Member'
                        }
                        variant="neutral"
                      />
                    ) : (
                      <Pressable
                        style={({ hovered }: WebPressableState) => [
                          styles.removeMemberBtn,
                          Platform.OS === 'web' &&
                            hovered &&
                            ({
                              backgroundColor: theme.colors.danger + '20',
                            } as any),
                        ]}
                        onPress={() =>
                          handleRemoveMember(
                            member.userId,
                            member.displayName || 'User',
                          )
                        }
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <AppIcon
                          name="user-minus"
                          size={16}
                          color={theme.colors.danger}
                        />
                      </Pressable>
                    )}
                  </View>
                </View>

                {/* Role Selector for other editable members */}
                {!isCreator && !isSelf && (
                  <View style={styles.roleSelectorRow}>
                    {(['admin', 'member', 'viewer'] as const).map(r => {
                      const isActive = member.role === r;
                      return (
                        <Pressable
                          key={r}
                          disabled={isModifying}
                          style={({ hovered }: WebPressableState) => [
                            styles.roleOptionBtn,
                            {
                              borderColor: isActive
                                ? theme.colors.primary
                                : theme.colors.borderLight,
                              backgroundColor: isActive
                                ? theme.colors.primary
                                : theme.isDark
                                  ? 'rgba(255, 255, 255, 0.05)'
                                  : 'rgba(0, 0, 0, 0.03)',
                              opacity: isModifying ? 0.6 : 1,
                            },
                            Platform.OS === 'web' &&
                              hovered &&
                              !isActive &&
                              ({
                                backgroundColor: theme.colors.primaryBg,
                              } as any),
                          ]}
                          onPress={() => handleRoleChange(member.userId, r)}
                        >
                          <Text
                            style={[
                              styles.roleOptionText,
                              {
                                color: isActive
                                  ? theme.colors.textInverse
                                  : theme.colors.textSecondary,
                              },
                            ]}
                          >
                            {r.charAt(0).toUpperCase() + r.slice(1)}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </GlassCard>
    </Animated.View>
  );

  const PermissionsSection = (
    <Animated.View entering={FadeInDown.delay(300).duration(500).springify()}>
      <Text
        style={[styles.sectionLabel, { color: theme.colors.textSecondary }]}
      >
        Permissions
      </Text>
      <GlassCard
        style={styles.glassCard}
        padding="none"
        intensity={theme.isDark ? 20 : 35}
      >
        <View style={styles.cardInner}>
          <View
            style={[
              styles.permissionRow,
              { borderBottomColor: theme.colors.borderLight },
            ]}
          >
            <View style={styles.permissionTextWrap}>
              <Text
                style={[
                  styles.permissionTitle,
                  { color: theme.colors.textPrimary },
                ]}
              >
                Allow Any Payer
              </Text>
              <Text
                style={[
                  styles.permissionDesc,
                  { color: theme.colors.textTertiary },
                ]}
              >
                Let members select someone else as the payer when adding
                expenses.
              </Text>
            </View>
            <AnimatedToggle
              value={allowAnyPayer}
              onToggle={() => setAllowAnyPayer(!allowAnyPayer)}
            />
          </View>

          <View
            style={[
              styles.permissionRow,
              { borderBottomWidth: 0, paddingBottom: 0, marginBottom: 0 },
            ]}
          >
            <View style={styles.permissionTextWrap}>
              <Text
                style={[
                  styles.permissionTitle,
                  { color: theme.colors.textPrimary },
                ]}
              >
                Allow Others to Archive
              </Text>
              <Text
                style={[
                  styles.permissionDesc,
                  { color: theme.colors.textTertiary },
                ]}
              >
                Let anyone in the trip archive or permanently delete it.
              </Text>
            </View>
            <AnimatedToggle
              value={allowOthersToArchiveTrip}
              onToggle={() =>
                setAllowOthersToArchiveTrip(!allowOthersToArchiveTrip)
              }
            />
          </View>
        </View>
      </GlassCard>
    </Animated.View>
  );

  const DangerZoneSection = (
    <Animated.View entering={FadeInDown.delay(400).duration(500).springify()}>
      <Text style={[styles.sectionLabel, { color: theme.colors.danger }]}>
        Danger Zone
      </Text>
      <GlassCard
        style={[styles.glassCard, { borderColor: theme.colors.danger + '33' }]}
        padding="none"
        intensity={theme.isDark ? 20 : 35}
      >
        <View style={styles.cardInner}>
          {isArchived ? (
            <>
              <Pressable
                style={({ hovered, pressed }: WebPressableState) => [
                  styles.dangerButtonOutline,
                  { borderColor: theme.colors.danger },
                  Platform.OS === 'web' &&
                    hovered &&
                    ({
                      backgroundColor: theme.colors.danger + '15',
                      cursor: 'pointer',
                    } as any),
                  pressed && { transform: [{ scale: 0.98 }] },
                ]}
                onPress={handleUnarchive}
                disabled={unarchiveMutation.isPending}
              >
                {unarchiveMutation.isPending ? (
                  <GlobalLoader variant="inline" color={theme.colors.danger} />
                ) : (
                  <Text
                    style={[
                      styles.dangerButtonOutlineText,
                      { color: theme.colors.danger },
                    ]}
                  >
                    Unarchive Trip
                  </Text>
                )}
              </Pressable>

              <Pressable
                style={({ hovered, pressed }: WebPressableState) => [
                  styles.dangerButton,
                  { backgroundColor: theme.colors.danger },
                  Platform.OS === 'web' &&
                    hovered &&
                    ({
                      opacity: 0.8,
                      cursor: 'pointer',
                    } as any),
                  pressed && { transform: [{ scale: 0.98 }] },
                ]}
                onPress={handleDeletePermanent}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? (
                  <GlobalLoader
                    variant="inline"
                    color={theme.colors.textInverse}
                  />
                ) : (
                  <Text
                    style={[
                      styles.dangerButtonText,
                      { color: theme.colors.textInverse },
                    ]}
                  >
                    Delete Permanently
                  </Text>
                )}
              </Pressable>
            </>
          ) : (
            <Pressable
              style={({ hovered, pressed }: WebPressableState) => [
                styles.dangerButton,
                { backgroundColor: theme.colors.danger },
                Platform.OS === 'web' &&
                  hovered &&
                  ({
                    opacity: 0.8,
                    cursor: 'pointer',
                  } as any),
                pressed && { transform: [{ scale: 0.98 }] },
              ]}
              onPress={handleArchive}
              disabled={archiveMutation.isPending}
            >
              {archiveMutation.isPending ? (
                <GlobalLoader
                  variant="inline"
                  color={theme.colors.textInverse}
                />
              ) : (
                <Text
                  style={[
                    styles.dangerButtonText,
                    { color: theme.colors.textInverse },
                  ]}
                >
                  Move to Archive
                </Text>
              )}
            </Pressable>
          )}
        </View>
      </GlassCard>
    </Animated.View>
  );

  const SaveButton = (
    <Animated.View entering={FadeInDown.delay(500).duration(500).springify()}>
      <AnimatedPressable
        onPress={handleSave}
        disabled={isUpdating}
        onPressIn={() => (saveButtonScale.value = withSpring(0.96))}
        onPressOut={() => (saveButtonScale.value = withSpring(1))}
        style={[
          styles.primaryButtonWrap,
          { transform: [{ scale: saveButtonScale }] },
          isUpdating && { opacity: 0.7 },
        ]}
      >
        <LinearGradient
          colors={theme.gradients.secondary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.primaryGradient}
        >
          {isUpdating ? (
            <GlobalLoader variant="inline" color={theme.colors.textInverse} />
          ) : (
            <Text
              style={[
                styles.primaryButtonText,
                { color: theme.colors.textInverse },
              ]}
            >
              Save Changes
            </Text>
          )}
        </LinearGradient>
      </AnimatedPressable>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      {/* Global Background */}
      <View style={[StyleSheet.absoluteFill, { pointerEvents: 'none' }]}>
        <GlobalBackground />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View
          style={[
            styles.header,
            {
              paddingTop:
                Math.max(insets.top, StatusBar.currentHeight ?? 38) + 12,
              borderBottomColor: theme.colors.borderLight,
            },
          ]}
        >
          <Pressable
            onPress={() => router.back()}
            style={({ hovered, pressed }: WebPressableState) => [
              styles.headerBtn,
              pressed && { opacity: 0.7 },
              Platform.OS === 'web' && hovered && ({ opacity: 0.8 } as any),
            ]}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <AppIcon
              name="arrow-left"
              size={20}
              color={theme.colors.textPrimary}
            />
          </Pressable>
          <Text
            style={[styles.headerTitle, { color: theme.colors.textPrimary }]}
          >
            Settings
          </Text>
          <Pressable
            style={({ hovered, pressed }: WebPressableState) => [
              styles.headerSaveBtn,
              {
                backgroundColor: isUpdating
                  ? theme.colors.borderLight
                  : theme.colors.primary,
              },
              Platform.OS === 'web' &&
                hovered &&
                !isUpdating &&
                ({ opacity: 0.9 } as any),
              pressed && !isUpdating && { opacity: 0.8 },
            ]}
            onPress={handleSave}
            disabled={isUpdating}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            {isUpdating ? (
              <GlobalLoader
                variant="inline"
                size="small"
                color={theme.colors.textInverse}
              />
            ) : (
              <Text
                style={[
                  styles.headerSaveText,
                  { color: theme.colors.textInverse },
                ]}
              >
                Save
              </Text>
            )}
          </Pressable>
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={[
            styles.contentInner,
            { paddingBottom: insets.bottom + 100 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View
            style={[styles.formWrapper, isWebDesktop && styles.webDesktopForm]}
          >
            {StatusBadge}
            {isWebDesktop ? (
              <View style={styles.bentoContainer}>
                <View style={styles.bentoColumn}>
                  {GeneralInfoSection}
                  {MemberManagementSection}
                </View>
                <View style={styles.bentoColumn}>
                  {DatesAndStatusSection}
                  {PermissionsSection}
                  {DangerZoneSection}
                </View>
              </View>
            ) : (
              <>
                {GeneralInfoSection}
                {DatesAndStatusSection}
                {MemberManagementSection}
                {PermissionsSection}
                {DangerZoneSection}
              </>
            )}
            {SaveButton}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

// ============================================================
// Premium Styles (Fully Themed)
// ============================================================
const useStyles = () => {
  const theme = useTheme();
  return useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, backgroundColor: 'transparent' },

        // Header
        header: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: 24,
          paddingBottom: 16,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.borderLight,
        },
        headerBtn: {
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: theme.isDark
            ? 'rgba(255, 255, 255, 0.10)'
            : 'rgba(0, 0, 0, 0.06)',
          alignItems: 'center',
          justifyContent: 'center',
        },
        headerSaveBtn: {
          paddingHorizontal: 16,
          paddingVertical: 8,
          borderRadius: 12,
          alignItems: 'center',
          justifyContent: 'center',
        },
        headerTitle: { fontSize: 17, fontWeight: '800' },
        headerSaveText: { fontSize: 14, fontWeight: '700' },

        content: { flex: 1 },
        contentInner: { paddingHorizontal: 20, paddingTop: 24 },
        formWrapper: { width: '100%' },
        webDesktopForm: { maxWidth: 1200, alignSelf: 'center' },
        bentoContainer: {
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: 24,
        },
        bentoColumn: {
          flex: 1,
        },

        // Status Badge
        statusBadgeContainer: { alignItems: 'center', marginBottom: 20 },

        // Sections & Glass Cards
        sectionLabel: {
          fontSize: 11,
          fontWeight: '800',
          textTransform: 'uppercase',
          letterSpacing: 1.2,
          marginBottom: 12,
          marginLeft: 4,
        },
        glassCard: {
          borderRadius: 24,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: theme.isDark
            ? 'rgba(255,255,255,0.08)'
            : 'rgba(0,0,0,0.05)',
          marginBottom: 24,
        },
        cardInner: { padding: 20 },

        // Fields & Inputs
        fieldContainer: { marginBottom: 20 },
        fieldLabel: {
          fontSize: 12,
          fontWeight: '700',
          marginBottom: 8,
          letterSpacing: 0.5,
        },
        requiredAsterisk: { fontWeight: '700' },
        optionalText: { fontWeight: '500' },

        input: {
          borderWidth: 1,
          borderRadius: 16,
          paddingHorizontal: 16,
          paddingVertical: 14,
          fontSize: 14,
          fontWeight: '500',
        },
        inputFocused: {
          borderColor: theme.colors.primary,
          ...Platform.select({
            web: { boxShadow: `0 0 0 4px ${theme.colors.primary}25` } as any,
          }),
        },
        textArea: { height: 100, textAlignVertical: 'top', paddingTop: 16 },

        // Dates
        dateRow: { flexDirection: 'row', gap: 12 },
        dateButton: {
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderWidth: 1,
          borderRadius: 16,
          paddingHorizontal: 16,
          paddingVertical: 14,
          ...(Platform.OS === 'web'
            ? {
                transition: 'all 0.2s ease',
                cursor: 'pointer',
              }
            : {}),
        } as any,
        dateButtonContent: { flex: 1 },
        dateButtonLabel: { fontSize: 11, fontWeight: '600', marginBottom: 2 },
        dateButtonText: { fontSize: 14, fontWeight: '700' },
        dateButtonIconWrap: { marginLeft: 8 },

        // Duration Display
        durationDisplay: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          marginTop: 8,
          marginBottom: 16,
        },
        durationText: { fontSize: 12, fontWeight: '500' },

        // Status Pills
        statusOptions: { flexDirection: 'row', gap: 8 },
        statusOption: {
          flex: 1,
          paddingVertical: 12,
          alignItems: 'center',
          borderWidth: 1,
          borderRadius: 12,
          ...(Platform.OS === 'web'
            ? {
                transition: 'all 0.2s ease',
                cursor: 'pointer',
              }
            : {}),
        } as any,
        statusOptionText: { fontSize: 12, fontWeight: '700' },

        // Member Management Rows
        memberCardRow: {
          paddingBottom: 16,
          marginBottom: 16,
        },
        memberTopRow: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        },
        memberAvatarWrap: {
          position: 'relative',
        },
        memberAvatarImg: {
          width: 42,
          height: 42,
          borderRadius: 21,
        },
        memberAvatarFallback: {
          width: 42,
          height: 42,
          borderRadius: 21,
          alignItems: 'center',
          justifyContent: 'center',
        },
        memberAvatarInitial: {
          fontSize: 16,
          fontWeight: '800',
        },
        memberInfoCol: {
          flex: 1,
          gap: 2,
        },
        removeMemberBtn: {
          width: 36,
          height: 36,
          borderRadius: 10,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: `${theme.colors.danger}15`,
        },
        roleSelectorRow: {
          flexDirection: 'row',
          gap: 8,
          marginTop: 12,
          width: '100%',
        },
        roleOptionBtn: {
          flex: 1,
          paddingVertical: 8,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 1,
          borderRadius: 10,
          ...(Platform.OS === 'web'
            ? {
                transition: 'all 0.2s ease',
                cursor: 'pointer',
              }
            : {}),
        } as any,
        roleOptionText: {
          fontSize: 12,
          fontWeight: '700',
        },

        // Permissions Toggles
        permissionRow: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingBottom: 16,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.borderLight,
          marginBottom: 16,
        },
        permissionTextWrap: { flex: 1, paddingRight: 16 },
        permissionTitle: { fontSize: 14, fontWeight: '800', marginBottom: 4 },
        permissionDesc: { fontSize: 11, lineHeight: 16, fontWeight: '500' },

        toggleTrack: {
          width: 44,
          height: 26,
          borderRadius: 13,
          padding: 2,
          justifyContent: 'center',
        },
        toggleKnob: {
          width: 22,
          height: 22,
          borderRadius: 11,
          backgroundColor: theme.colors.textInverse,
          ...theme.shadows.sm,
        },

        // Danger Zone
        dangerButton: {
          paddingVertical: 16,
          borderRadius: 16,
          alignItems: 'center',
          ...(Platform.OS === 'web'
            ? {
                transition: 'all 0.2s ease',
                cursor: 'pointer',
              }
            : {}),
        } as any,
        dangerButtonOutline: {
          backgroundColor: 'transparent',
          paddingVertical: 16,
          borderRadius: 16,
          alignItems: 'center',
          borderWidth: 1,
          borderColor: theme.colors.danger,
          marginBottom: 12,
          ...(Platform.OS === 'web'
            ? {
                transition: 'all 0.2s ease',
                cursor: 'pointer',
              }
            : {}),
        } as any,
        dangerButtonText: {
          color: theme.colors.textInverse,
          fontSize: 13,
          fontWeight: '800',
          letterSpacing: 0.5,
        },
        dangerButtonOutlineText: {
          fontSize: 13,
          fontWeight: '800',
          letterSpacing: 0.5,
        },

        // Main Save Button
        primaryButtonWrap: {
          borderRadius: 16,
          overflow: 'hidden',
          marginTop: 8,
        },
        primaryGradient: {
          height: 56,
          alignItems: 'center',
          justifyContent: 'center',
        },
        primaryButtonText: {
          color: theme.colors.textInverse,
          fontSize: 16,
          fontWeight: '800',
          letterSpacing: 0.5,
        },

        // Web Date Modal
        webModalOverlay: {
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.5)',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 24,
        },
        webModalContent: {
          width: '100%',
          maxWidth: 380,
          borderRadius: 24,
          padding: 24,
          borderWidth: 1,
        },
        webModalTitle: {
          fontSize: 18,
          fontWeight: '800',
        },
        webModalActions: {
          flexDirection: 'row',
          gap: 12,
        },
        webModalBtn: {
          flex: 1,
          paddingVertical: 12,
          borderRadius: 12,
          borderWidth: 1,
          alignItems: 'center',
        },
        webModalBtnText: {
          fontSize: 14,
          fontWeight: '700',
        },
      }),
    [theme],
  );
};

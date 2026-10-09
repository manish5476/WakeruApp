import GlobalLoader from '../../../components/common/GlobalLoader';
import AppIcon from '../../../components/common/AppIcon';
// app/(app)/trips/join.tsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
  Pressable,
  PressableStateCallbackType,
  ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { format } from 'date-fns';
import Animated, {
  FadeInDown,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useJoinTrip } from '../../../hooks';
import { useTheme } from '../../../providers/ThemeProvider';
import { haptics } from '../../../utils/haptics';
import { GlassCard } from '../../../components/ui/GlassCard';
import { GlobalBackground } from '../../../components/ui/GlobalBackground';
import { showToast } from '../../../utils/toast';
import { tripsApi } from '../../../services/api/trips.api';

// Safe web pressable type
type WebPressableState = PressableStateCallbackType & { hovered?: boolean };

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function JoinTripScreen() {
  const theme = useTheme();
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const isWebDesktop = Platform.OS === 'web' && width > 768;

  const params = useLocalSearchParams<{ code?: string; inviteCode?: string }>();
  const initialCode = (params.code || params.inviteCode || '')
    .toUpperCase()
    .slice(0, 8);

  const [inviteCode, setInviteCode] = useState(initialCode);
  const [isFocused, setIsFocused] = useState(false);
  const [tripPreview, setTripPreview] = useState<any | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const { mutate: joinTrip, isPending } = useJoinTrip();

  const joinButtonScale = useSharedValue(1);

  useEffect(() => {
    if (params.code || params.inviteCode) {
      const rawCode = (params.code || params.inviteCode || '')
        .toUpperCase()
        .slice(0, 8);
      setInviteCode(rawCode);
    }
  }, [params.code, params.inviteCode]);

  useEffect(() => {
    const clean = inviteCode.trim().toUpperCase();
    if (clean.length === 8) {
      let active = true;
      setIsLoadingPreview(true);
      tripsApi
        .getTripPreview(clean)
        .then((res: any) => {
          if (active && res.data?.trip) {
            setTripPreview(res.data.trip);
          }
        })
        .catch(() => {
          if (active) setTripPreview(null);
        })
        .finally(() => {
          if (active) setIsLoadingPreview(false);
        });
      return () => {
        active = false;
      };
    } else {
      setTripPreview(null);
    }
  }, [inviteCode]);

  const handleJoin = () => {
    haptics.medium();
    const cleanCode = inviteCode.trim().toUpperCase();
    if (!cleanCode || cleanCode.length !== 8) {
      showToast.warning(
        'Invalid Code',
        'Please enter a valid 8-character invite code.',
      );
      return;
    }
    joinTrip(cleanCode, {
      onSuccess: (data: any) => {
        const targetId = data?.tripId || tripPreview?._id;
        const tripTitle = data?.title || tripPreview?.title || 'Trip';
        showToast.success(
          'Trip Joined Successfully',
          `You're now part of ${tripTitle}`,
          targetId
            ? {
                action: {
                  label: 'Open Trip',
                  onPress: () =>
                    router.replace(`/(app)/trips/${targetId}` as any),
                },
              }
            : undefined,
        );
        if (data?.status === 'approved' && targetId) {
          router.replace(`/(app)/trips/${targetId}` as any);
        } else {
          router.back();
        }
      },
      onError: (error: any) => {
        showToast.fromError(error, 'Failed to join trip');
      },
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: 'transparent' }]}>
      {/* Global Background */}
      <View style={StyleSheet.absoluteFill}>
        <GlobalBackground />
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header Close Button */}
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={({ hovered }: WebPressableState) => [
              styles.closeBtnWrap,
              Platform.OS === 'web' &&
                hovered &&
                ({ opacity: 0.7, cursor: 'pointer' } as any),
            ]}
          >
            <AppIcon name="x" size={24} color={theme.colors.textPrimary} />
          </Pressable>
        </View>

        <View style={styles.content}>
          <View
            style={[styles.formWrapper, isWebDesktop && styles.webDesktopForm]}
          >
            {/* Animated Glass Card */}
            <Animated.View entering={FadeInDown.duration(500).springify()}>
              <GlassCard
                style={styles.cardWrapper}
                intensity={theme.isDark ? 20 : 10}
              >
                <View style={styles.cardInner}>
                  <View
                    style={[
                      styles.iconWrap,
                      {
                        backgroundColor: theme.colors.primaryBg,
                        borderColor: theme.colors.borderLight,
                      },
                    ]}
                  >
                    <AppIcon
                      name="link"
                      size={32}
                      color={theme.colors.primary}
                    />
                  </View>

                  <Text
                    style={[styles.title, { color: theme.colors.textPrimary }]}
                  >
                    Join a Trip
                  </Text>
                  <Text
                    style={[
                      styles.subtitle,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    Enter the 8-character invite code shared by your trip admin.
                  </Text>

                  {/* Code Input with Glowing Focus State */}
                  <View
                    style={[
                      styles.inputContainer,
                      {
                        backgroundColor: theme.colors.surface,
                        borderColor: isFocused
                          ? theme.colors.primary
                          : theme.colors.borderLight,
                      },
                      isFocused && styles.inputContainerFocused,
                    ]}
                  >
                    <TextInput
                      style={[
                        styles.codeInput,
                        { color: theme.colors.textPrimary },
                      ]}
                      placeholder="XXXXXXXX"
                      placeholderTextColor={theme.colors.textTertiary}
                      value={inviteCode}
                      onChangeText={t =>
                        setInviteCode(t.toUpperCase().slice(0, 8))
                      }
                      onFocus={() => {
                        haptics.light();
                        setIsFocused(true);
                      }}
                      onBlur={() => setIsFocused(false)}
                      maxLength={8}
                      autoCapitalize="characters"
                      autoFocus
                      autoCorrect={false}
                    />
                  </View>

                  {isLoadingPreview && (
                    <View style={styles.previewLoadingWrap}>
                      <ActivityIndicator
                        size="small"
                        color={theme.colors.primary}
                      />
                      <Text
                        style={[
                          styles.previewLoadingText,
                          { color: theme.colors.textSecondary },
                        ]}
                      >
                        Looking up trip...
                      </Text>
                    </View>
                  )}

                  {tripPreview && (
                    <View
                      style={[
                        styles.previewCard,
                        {
                          backgroundColor: theme.isDark
                            ? 'rgba(255,255,255,0.06)'
                            : 'rgba(0,0,0,0.03)',
                          borderColor: theme.colors.borderLight,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.previewTripTitle,
                          { color: theme.colors.textPrimary },
                        ]}
                        numberOfLines={1}
                      >
                        {tripPreview.title}
                      </Text>
                      {tripPreview.startDate && tripPreview.endDate && (
                        <View style={styles.previewRow}>
                          <AppIcon
                            name="calendar"
                            size={14}
                            color={theme.colors.primary}
                          />
                          <Text
                            style={[
                              styles.previewText,
                              { color: theme.colors.textSecondary },
                            ]}
                          >
                            {format(new Date(tripPreview.startDate), 'MMM d')} –{' '}
                            {format(
                              new Date(tripPreview.endDate),
                              'MMM d, yyyy',
                            )}
                          </Text>
                        </View>
                      )}
                      {typeof tripPreview.memberCount === 'number' && (
                        <View style={styles.previewRow}>
                          <AppIcon
                            name="users"
                            size={14}
                            color={theme.colors.textSecondary}
                          />
                          <Text
                            style={[
                              styles.previewText,
                              { color: theme.colors.textSecondary },
                            ]}
                          >
                            {tripPreview.memberCount} member
                            {tripPreview.memberCount !== 1 ? 's' : ''}
                          </Text>
                        </View>
                      )}
                    </View>
                  )}

                  {/* Join Button */}
                  <AnimatedPressable
                    onPress={handleJoin}
                    disabled={isPending}
                    onPressIn={() => (joinButtonScale.value = withSpring(0.96))}
                    onPressOut={() => (joinButtonScale.value = withSpring(1))}
                    style={[
                      styles.joinBtnWrap,
                      { transform: [{ scale: joinButtonScale }] },
                      isPending && { opacity: 0.7 },
                    ]}
                  >
                    <LinearGradient
                      colors={theme.gradients.secondary}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.joinBtnGradient}
                    >
                      {isPending ? (
                        <GlobalLoader variant="inline" color="#FFF" />
                      ) : (
                        <Text style={styles.joinBtnText}>Join Trip</Text>
                      )}
                    </LinearGradient>
                  </AnimatedPressable>
                </View>
              </GlassCard>
            </Animated.View>

            {/* Staggered Footer Link */}
            <Animated.View
              entering={FadeInDown.delay(100).duration(500).springify()}
            >
              <Pressable
                onPress={() => router.push('/create-trip')}
                style={({ hovered }: WebPressableState) => [
                  styles.createLinkWrap,
                  Platform.OS === 'web' &&
                    hovered &&
                    ({ opacity: 0.7, cursor: 'pointer' } as any),
                ]}
              >
                <Text
                  style={[
                    styles.createLink,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  Or create a new trip{' '}
                  <Text
                    style={[
                      styles.createLinkArrow,
                      { color: theme.colors.secondary },
                    ]}
                  >
                    →
                  </Text>
                </Text>
              </Pressable>
            </Animated.View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

// ============================================================
// Premium Styles with Theme Integration
// ============================================================
const useStyles = () => {
  const theme = useTheme();
  return useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1 },
        keyboardView: { flex: 1 },

        // Header
        header: {
          paddingHorizontal: 24,
          paddingBottom: 16,
          alignItems: 'flex-end',
        },
        closeBtnWrap: {
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: theme.isDark
            ? 'rgba(255,255,255,0.08)'
            : 'rgba(0,0,0,0.05)',
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 1,
          borderColor: theme.isDark
            ? 'rgba(255,255,255,0.1)'
            : 'rgba(0,0,0,0.05)',
        },

        content: {
          flex: 1,
          justifyContent: 'center',
          paddingHorizontal: 24,
          paddingBottom: 60,
        },

        formWrapper: { width: '100%', alignSelf: 'center' },
        webDesktopForm: { maxWidth: 440 },

        // Glass Card
        cardWrapper: {
          borderRadius: 32,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: theme.isDark
            ? 'rgba(255,255,255,0.08)'
            : 'rgba(255,255,255,0.2)',
        },
        cardInner: {
          padding: 32,
          alignItems: 'center',
        },

        iconWrap: {
          width: 72,
          height: 72,
          borderRadius: 24,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 20,
          borderWidth: 1,
        },
        title: {
          fontSize: 24,
          fontWeight: '900',
          marginBottom: 8,
          letterSpacing: -0.5,
        },
        subtitle: {
          fontSize: 13,
          textAlign: 'center',
          lineHeight: 20,
          marginBottom: 32,
          fontWeight: '500',
        },

        // Input
        inputContainer: {
          width: '100%',
          marginBottom: 32,
          borderWidth: 1,
          borderRadius: 16,
          ...(Platform.OS === 'web' && {
            transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
          }),
        },
        inputContainerFocused: {
          borderColor: theme.colors.primary,
          ...Platform.select({
            web: { boxShadow: `0 0 0 4px ${theme.colors.primary}25` } as any,
          }),
        },
        codeInput: {
          paddingHorizontal: 24,
          paddingVertical: 16,
          fontSize: 28,
          fontWeight: '900',
          textAlign: 'center',
          letterSpacing: 8,
          width: '100%',
          ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : {}),
        } as any,

        // Preview
        previewLoadingWrap: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          marginBottom: 20,
        },
        previewLoadingText: {
          fontSize: 13,
          fontWeight: '500',
        },
        previewCard: {
          width: '100%',
          padding: 16,
          borderRadius: 16,
          borderWidth: 1,
          marginBottom: 20,
          alignItems: 'center',
        },
        previewTripTitle: {
          fontSize: 18,
          fontWeight: '800',
          marginBottom: 8,
          textAlign: 'center',
        },
        previewRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          marginTop: 4,
        },
        previewText: {
          fontSize: 13,
          fontWeight: '500',
        },

        // Button
        joinBtnWrap: {
          width: '100%',
          borderRadius: 16,
          overflow: 'hidden',
          ...Platform.select({
            ios: {
              shadowColor: theme.colors.secondary,
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.4,
              shadowRadius: 16,
            },
            android: { elevation: 8 },
          }),
        },
        joinBtnGradient: {
          width: '100%',
          height: 56,
          alignItems: 'center',
          justifyContent: 'center',
        },
        joinBtnText: {
          color: '#FFF',
          fontSize: 15,
          fontWeight: '800',
          letterSpacing: 0.5,
        },

        // Footer Link
        createLinkWrap: {
          marginTop: 24,
          alignItems: 'center',
          paddingVertical: 12,
        },
        createLink: {
          fontSize: 13,
          fontWeight: '600',
        },
        createLinkArrow: {
          fontWeight: '900',
        },
      }),
    [theme],
  );
};

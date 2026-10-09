import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  Alert,
  Switch,
  Platform,
  useWindowDimensions,
  Pressable,
  PressableStateCallbackType,
  Image,
  Animated,
  Easing,
  KeyboardAvoidingView,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import * as ImagePicker from 'expo-image-picker';

import { useTheme } from '../../../providers/ThemeProvider';
import { useAuthStore } from '../../../stores/auth.store';
import { haptics } from '../../../utils/haptics';
import { feedbackApi } from '../../../services/api/feedback.api';

import AppIcon from '../../../components/common/AppIcon';
import GlobalLoader from '../../../components/common/GlobalLoader';
import { GlobalBackground } from '../../../components/ui/GlobalBackground';

type WebPressableState = PressableStateCallbackType & { hovered?: boolean };
type FeedbackCategory =
  'bug' | 'feature' | 'love' | 'performance' | 'design' | 'other';

const RATING_EMOJIS = ['😞', '🙁', '😐', '😊', '🤩'];
const RATING_MESSAGES = [
  'Sorry something went wrong. Help us improve.',
  'Not great. What could we do better?',
  'Okay. How can we make it great?',
  'Good! Any suggestions to make it perfect?',
  'Awesome! What made your experience great?',
];

const CATEGORIES: { label: string; value: FeedbackCategory; emoji: string }[] =
  [
    { label: 'Bug', value: 'bug', emoji: '🐞' },
    { label: 'Feature', value: 'feature', emoji: '💡' },
    { label: 'Love', value: 'love', emoji: '❤️' },
    { label: 'Performance', value: 'performance', emoji: '⚡' },
    { label: 'Design', value: 'design', emoji: '🎨' },
    { label: 'Other', value: 'other', emoji: '💬' },
  ];

export default function GiveFeedbackScreen() {
  const theme = useTheme();
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const { user } = useAuthStore();

  const [rating, setRating] = useState<number>(0);
  const [category, setCategory] = useState<FeedbackCategory | null>(null);
  const [feedback, setFeedback] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [attachments, setAttachments] = useState<string[]>([]);

  // UI States
  const [isFeedbackFocused, setIsFeedbackFocused] = useState(false);
  const [showContext, setShowContext] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [refId, setRefId] = useState('');

  const isWeb = Platform.OS === 'web';
  const isDesktop = width > 768;

  // Animations
  const successScale = useRef(new Animated.Value(0.5)).current;
  const successOpacity = useRef(new Animated.Value(0)).current;

  const handlePickScreenshot = async () => {
    if (attachments.length >= 3) {
      Alert.alert('Limit Reached', 'You can only attach up to 3 screenshots.');
      return;
    }

    if (!isWeb) {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission required',
          'Please grant permission to access your photo library.',
        );
        return;
      }
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: 3 - attachments.length,
      quality: 0.7,
    });

    if (!result.canceled && result.assets) {
      const newUris = result.assets.map(a => a.uri);
      setAttachments(prev => [...prev, ...newUris].slice(0, 3));
    }
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!category) {
      Alert.alert('Category Required', 'Please select a feedback category.');
      return;
    }
    if (!feedback.trim()) {
      Alert.alert(
        'Feedback Required',
        'Please provide a message so we can address your feedback.',
      );
      return;
    }

    setIsLoading(true);
    try {
      haptics.light();
      const displayName = isAnonymous
        ? 'Anonymous'
        : user?.displayName || 'User';

      const response = await feedbackApi.create({
        rating: rating || 3, // default to neutral if unrated but text is provided
        category: category as any,
        feedback: feedback.trim(),
        displayName,
        attachments: attachments.length > 0 ? attachments : undefined,
        deviceInfo: {
          platform: Platform.OS,
          version: Platform.Version,
          screenSize: `${width}x${height}`,
        },
      });

      if (response.success) {
        haptics.success();
        setRefId(
          `TSX-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        );
        setIsSuccess(true);

        Animated.parallel([
          Animated.spring(successScale, {
            toValue: 1,
            friction: 6,
            tension: 50,
            useNativeDriver: true,
          }),
          Animated.timing(successOpacity, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
        ]).start();
      } else {
        throw new Error(response.message || 'An unknown error occurred.');
      }
    } catch (error: any) {
      haptics.error();
      Alert.alert(
        'Submission Failed',
        error.message || 'Could not submit feedback. Please try again.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  const getPlaceholder = () => {
    if (category === 'bug')
      return 'Tell us what happened, steps to reproduce, and what you expected...';
    if (category === 'feature')
      return 'What problem would this solve? How would it work? Be as detailed as you like...';
    if (category === 'love')
      return 'What did you enjoy the most? We love hearing from you...';
    return 'Tell us what happened, what you expected, and how we can improve...';
  };

  if (isSuccess) {
    return (
      <GlobalBackground>
        <View style={[styles.container, { backgroundColor: 'transparent' }]}>
          <View
            style={[
              styles.successContainer,
              isDesktop && {
                maxWidth: 600,
                width: '100%',
                alignSelf: 'center',
              },
            ]}
          >
            <Animated.View
              style={{
                transform: [{ scale: successScale }],
                opacity: successOpacity,
                alignItems: 'center',
              }}
            >
              <View style={styles.successIconWrap}>
                <AppIcon name="check" size={48} color="#FFF" />
              </View>
              <Text style={styles.successTitle}>Feedback Received!</Text>
              <Text style={styles.successMessage}>
                Thank you! Your feedback directly shapes Wakeru. We'll look into
                it right away.
              </Text>
              <View style={styles.refContainer}>
                <Text style={styles.refLabel}>Reference ID</Text>
                <Text style={styles.refValue}>{refId}</Text>
              </View>

              <Pressable
                onPress={() => router.back()}
                style={({ hovered }: WebPressableState) => [
                  styles.doneBtn,
                  hovered && { opacity: 0.9 },
                ]}
              >
                <Text style={styles.doneBtnText}>Done</Text>
              </Pressable>
            </Animated.View>
          </View>
        </View>
      </GlobalBackground>
    );
  }

  return (
    <GlobalBackground>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.container, { backgroundColor: 'transparent' }]}>
          <BlurView
            intensity={isDesktop ? 20 : 0}
            style={StyleSheet.absoluteFill}
          />
          <Pressable style={styles.backdrop} onPress={() => router.back()} />

          <View
            style={[
              styles.modalWrapper,
              isDesktop && styles.modalDesktop,
              {
                marginTop: isDesktop ? Math.max(insets.top, 40) : insets.top,
                marginBottom: isDesktop ? Math.max(insets.bottom, 40) : 0,
              },
            ]}
            pointerEvents="box-none"
          >
            <View style={styles.modalContent}>
              {/* Premium Sticky Header */}
              <View style={styles.header}>
                <View style={styles.headerRow}>
                  <Pressable
                    onPress={() => router.back()}
                    style={({ hovered }: WebPressableState) => [
                      styles.headerBtn,
                      hovered && { backgroundColor: theme.colors.borderLight },
                    ]}
                  >
                    <AppIcon
                      name="x"
                      size={20}
                      color={theme.colors.textPrimary}
                    />
                  </Pressable>

                  <View style={styles.headerCenter}>
                    <Text style={styles.headerTitle}>Feedback</Text>
                    <Text style={styles.headerSubtitle}>
                      We read every submission ❤️
                    </Text>
                  </View>

                  <Pressable
                    onPress={handleSubmit}
                    disabled={isLoading || !category || !feedback.trim()}
                    style={({ hovered, pressed }: WebPressableState) => [
                      styles.submitBtn,
                      (!category || !feedback.trim()) &&
                        styles.submitBtnDisabled,
                      hovered &&
                        !isLoading &&
                        category &&
                        feedback.trim() && { opacity: 0.9 },
                    ]}
                  >
                    {isLoading ? (
                      <GlobalLoader variant="inline" size="small" />
                    ) : (
                      <Text style={styles.submitBtnText}>Submit</Text>
                    )}
                  </Pressable>
                </View>
              </View>

              <ScrollView
                contentContainerStyle={[
                  styles.scrollContent,
                  { paddingBottom: Math.max(insets.bottom, 40) },
                ]}
                showsVerticalScrollIndicator={false}
              >
                {/* Experience Rating */}
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>
                    How was your experience?
                  </Text>
                  <View style={styles.ratingRow}>
                    {[1, 2, 3, 4, 5].map((star, idx) => {
                      const isSelected = rating === star;
                      return (
                        <Pressable
                          key={star}
                          onPress={() => {
                            haptics.selection();
                            setRating(star);
                          }}
                          style={({ hovered, pressed }: WebPressableState) => [
                            styles.emojiBtn,
                            isSelected && {
                              backgroundColor: theme.colors.primaryBg,
                              borderColor: theme.colors.primary,
                            },
                            hovered &&
                              !isSelected && {
                                backgroundColor: theme.colors.surface,
                              },
                            pressed && { transform: [{ scale: 0.95 }] },
                          ]}
                        >
                          <Text
                            style={
                              [
                                styles.emojiText,
                                isSelected && { transform: [{ scale: 1.2 }] },
                              ] as any
                            }
                          >
                            {RATING_EMOJIS[idx]}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                  {rating > 0 && (
                    <Animated.Text style={styles.ratingMessage}>
                      {RATING_MESSAGES[rating - 1]}
                    </Animated.Text>
                  )}
                </View>

                {/* Segmented Categories */}
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>What's on your mind?</Text>
                  <View style={styles.categoryGrid}>
                    {CATEGORIES.map(cat => {
                      const isActive = category === cat.value;
                      return (
                        <Pressable
                          key={cat.value}
                          onPress={() => {
                            haptics.light();
                            setCategory(cat.value);
                          }}
                          style={({ hovered, pressed }: WebPressableState) => [
                            styles.categoryCard,
                            isActive && {
                              backgroundColor: theme.colors.primary,
                              borderColor: theme.colors.primary,
                            },
                            hovered &&
                              !isActive && {
                                backgroundColor: theme.colors.surface,
                              },
                            pressed && { transform: [{ scale: 0.98 }] },
                          ]}
                        >
                          <Text style={styles.catEmoji}>{cat.emoji}</Text>
                          <Text
                            style={[
                              styles.catLabel,
                              isActive && { color: '#FFF' },
                            ]}
                          >
                            {cat.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                {/* Text Input */}
                <View style={styles.section}>
                  <View style={styles.inputHeader}>
                    <Text style={styles.sectionLabel}>Details</Text>
                    <Text style={styles.charCount}>
                      {feedback.length} / 1200
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.inputWrapper,
                      isFeedbackFocused && {
                        borderColor: theme.colors.primary,
                        backgroundColor: theme.colors.background,
                      },
                    ]}
                  >
                    <TextInput
                      style={styles.textArea}
                      value={feedback}
                      onChangeText={setFeedback}
                      placeholder={getPlaceholder()}
                      placeholderTextColor={theme.colors.textTertiary}
                      multiline
                      maxLength={1200}
                      onFocus={() => setIsFeedbackFocused(true)}
                      onBlur={() => setIsFeedbackFocused(false)}
                    />

                    <View style={styles.inputToolbar}>
                      <View style={styles.toolbarHints}>
                        <AppIcon
                          name="edit-3"
                          size={12}
                          color={theme.colors.textTertiary}
                        />
                        <Text style={styles.toolbarText}>
                          Markdown supported
                        </Text>
                      </View>
                      <View style={styles.toolbarHints}>
                        <AppIcon
                          name="at-sign"
                          size={12}
                          color={theme.colors.textTertiary}
                        />
                        <Text style={styles.toolbarText}>Mention team</Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Attachments */}
                <View style={styles.section}>
                  <View style={styles.inputHeader}>
                    <Text style={styles.sectionLabel}>Attachments</Text>
                    <Text style={styles.charCount}>
                      {attachments.length} / 3
                    </Text>
                  </View>

                  <View style={styles.attachmentsRow}>
                    {attachments.map((uri, idx) => (
                      <View key={idx} style={styles.attachmentCard}>
                        <Image
                          source={{ uri }}
                          style={styles.attachmentImg}
                          resizeMode="cover"
                        />
                        <Pressable
                          onPress={() => handleRemoveAttachment(idx)}
                          style={styles.attachmentRemove}
                        >
                          <AppIcon name="x" size={12} color="#FFF" />
                        </Pressable>
                      </View>
                    ))}

                    {attachments.length < 3 && (
                      <Pressable
                        onPress={handlePickScreenshot}
                        style={({ hovered, pressed }: WebPressableState) => [
                          styles.uploadBtn,
                          hovered && { backgroundColor: theme.colors.surface },
                          pressed && { transform: [{ scale: 0.96 }] },
                        ]}
                      >
                        <AppIcon
                          name="image"
                          size={24}
                          color={theme.colors.textTertiary}
                        />
                        <Text style={styles.uploadBtnText}>Upload</Text>
                      </Pressable>
                    )}
                  </View>
                </View>

                {/* Privacy Toggle */}
                <View style={styles.section}>
                  <View style={styles.privacyCard}>
                    <View style={styles.privacyInfo}>
                      <Text style={styles.privacyTitle}>
                        Submit anonymously
                      </Text>
                      <Text style={styles.privacyDesc}>
                        {isAnonymous
                          ? "Your name and email won't be included."
                          : 'Help us follow up by submitting with your account.'}
                      </Text>
                    </View>
                    <Switch
                      value={isAnonymous}
                      onValueChange={val => {
                        haptics.light();
                        setIsAnonymous(val);
                      }}
                      trackColor={{
                        false: theme.colors.borderLight,
                        true: theme.colors.primary,
                      }}
                      thumbColor={Platform.OS === 'web' ? '#FFF' : undefined}
                    />
                  </View>
                </View>

                {/* Auto Context */}
                <View style={styles.section}>
                  <Pressable
                    onPress={() => setShowContext(!showContext)}
                    style={styles.contextHeader}
                  >
                    <Text style={styles.contextTitle}>
                      Device Info Included
                    </Text>
                    <AppIcon
                      name={showContext ? 'chevron-up' : 'chevron-down'}
                      size={16}
                      color={theme.colors.textTertiary}
                    />
                  </Pressable>
                  {showContext && (
                    <View style={styles.contextBody}>
                      <View style={styles.contextRow}>
                        <Text style={styles.contextKey}>OS Version</Text>
                        <Text style={styles.contextVal}>
                          {Platform.OS} {Platform.Version}
                        </Text>
                      </View>
                      <View style={styles.contextRow}>
                        <Text style={styles.contextKey}>Screen Size</Text>
                        <Text style={styles.contextVal}>
                          {Math.round(width)}x{Math.round(height)}
                        </Text>
                      </View>
                      <View style={styles.contextRow}>
                        <Text style={styles.contextKey}>Theme</Text>
                        <Text style={styles.contextVal}>
                          {theme.isDark ? 'Dark' : 'Light'}
                        </Text>
                      </View>
                    </View>
                  )}
                </View>

                <View style={styles.footerNote}>
                  <AppIcon
                    name="heart"
                    size={16}
                    color={theme.colors.primary}
                  />
                  <Text style={styles.footerNoteText}>
                    Your feedback directly shapes Wakeru. Thank you for making
                    us better.
                  </Text>
                </View>
              </ScrollView>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </GlobalBackground>
  );
}

const useStyles = () => {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const isDesktop = width > 768;

  return useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          justifyContent: 'center',
          backgroundColor: isDesktop ? theme.colors.overlay : 'transparent',
        },
        backdrop: {
          ...StyleSheet.absoluteFill,
          zIndex: 1,
        },
        modalWrapper: {
          flex: 1,
          zIndex: 2,
          justifyContent: 'flex-end', // slide up from bottom on mobile
        },
        modalDesktop: {
          justifyContent: 'center',
          alignItems: 'center',
          alignSelf: 'center',
          width: '100%',
          maxWidth: 720,
        },
        modalContent: {
          backgroundColor: theme.colors.background,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          borderBottomLeftRadius: isDesktop ? 24 : 0,
          borderBottomRightRadius: isDesktop ? 24 : 0,
          overflow: 'hidden',
          flex: isDesktop ? 1 : 0.95,
          ...theme.shadows.lg,
          borderWidth: 1,
          borderColor: theme.colors.borderLight,
        },
        header: {
          paddingTop: 24,
          paddingBottom: 16,
          paddingHorizontal: 24,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.borderLight,
          backgroundColor: theme.colors.surface,
        },
        headerRow: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        },
        headerBtn: {
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: theme.colors.background,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 1,
          borderColor: theme.colors.borderLight,
        },
        headerCenter: {
          alignItems: 'center',
        },
        headerTitle: {
          fontSize: 18,
          fontWeight: '800',
          color: theme.colors.textPrimary,
        },
        headerSubtitle: {
          fontSize: 12,
          color: theme.colors.textTertiary,
          marginTop: 2,
          fontWeight: '600',
        },
        submitBtn: {
          backgroundColor: theme.colors.primary,
          paddingHorizontal: 16,
          paddingVertical: 10,
          borderRadius: 12,
        },
        submitBtnDisabled: {
          opacity: 0.5,
        },
        submitBtnText: {
          color: '#FFF',
          fontWeight: '700',
          fontSize: 14,
        },
        scrollContent: {
          padding: 24,
        },
        section: {
          marginBottom: 32,
        },
        sectionLabel: {
          fontSize: 15,
          fontWeight: '700',
          color: theme.colors.textPrimary,
          marginBottom: 12,
        },
        ratingRow: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginBottom: 8,
        },
        emojiBtn: {
          width: 54,
          height: 54,
          borderRadius: 27,
          backgroundColor: theme.colors.background,
          borderWidth: 1,
          borderColor: theme.colors.borderLight,
          alignItems: 'center',
          justifyContent: 'center',
          ...(Platform.OS === 'web'
            ? { transition: 'all 0.2s ease', cursor: 'pointer' }
            : {}),
        } as any,
        emojiText: {
          fontSize: 24,
          ...(Platform.OS === 'web' ? { transition: 'all 0.2s ease' } : {}),
        } as any,
        ratingMessage: {
          fontSize: 14,
          fontWeight: '600',
          color: theme.colors.textSecondary,
          textAlign: 'center',
          marginTop: 8,
        },
        categoryGrid: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 12,
        },
        categoryCard: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          backgroundColor: theme.colors.background,
          borderWidth: 1,
          borderColor: theme.colors.borderLight,
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderRadius: 16,
          ...(Platform.OS === 'web'
            ? { transition: 'all 0.2s ease', cursor: 'pointer' }
            : {}),
        } as any,
        catEmoji: {
          fontSize: 16,
        },
        catLabel: {
          fontSize: 14,
          fontWeight: '600',
          color: theme.colors.textSecondary,
        },
        inputHeader: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 12,
        },
        charCount: {
          fontSize: 12,
          color: theme.colors.textTertiary,
          fontWeight: '600',
        },
        inputWrapper: {
          backgroundColor: theme.colors.surface,
          borderWidth: 1,
          borderColor: theme.colors.borderLight,
          borderRadius: 16,
          overflow: 'hidden',
        },
        textArea: {
          padding: 16,
          paddingTop: 16,
          fontSize: 15,
          color: theme.colors.textPrimary,
          minHeight: 120,
          textAlignVertical: 'top',
          ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : {}),
        } as any,
        inputToolbar: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 16,
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderTopWidth: 1,
          borderTopColor: theme.colors.borderLight,
          backgroundColor: theme.colors.background,
        },
        toolbarHints: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
        },
        toolbarText: {
          fontSize: 12,
          color: theme.colors.textTertiary,
          fontWeight: '600',
        },
        attachmentsRow: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 16,
        },
        attachmentCard: {
          width: 80,
          height: 80,
          borderRadius: 16,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: theme.colors.borderLight,
        },
        attachmentImg: {
          width: '100%',
          height: '100%',
        },
        attachmentRemove: {
          position: 'absolute',
          top: 4,
          right: 4,
          backgroundColor: 'rgba(0,0,0,0.6)',
          width: 24,
          height: 24,
          borderRadius: 12,
          alignItems: 'center',
          justifyContent: 'center',
        },
        uploadBtn: {
          width: 80,
          height: 80,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: theme.colors.borderLight,
          borderStyle: 'dashed',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: theme.colors.background,
          gap: 4,
          ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
        } as any,
        uploadBtnText: {
          fontSize: 11,
          fontWeight: '600',
          color: theme.colors.textTertiary,
        },
        privacyCard: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: theme.colors.surface,
          padding: 16,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: theme.colors.borderLight,
        },
        privacyInfo: {
          flex: 1,
          paddingRight: 16,
        },
        privacyTitle: {
          fontSize: 15,
          fontWeight: '700',
          color: theme.colors.textPrimary,
          marginBottom: 4,
        },
        privacyDesc: {
          fontSize: 13,
          color: theme.colors.textSecondary,
          lineHeight: 18,
        },
        contextHeader: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingVertical: 12,
          borderTopWidth: 1,
          borderTopColor: theme.colors.borderLight,
        },
        contextTitle: {
          fontSize: 13,
          fontWeight: '700',
          color: theme.colors.textTertiary,
        },
        contextBody: {
          backgroundColor: theme.colors.surface,
          padding: 16,
          borderRadius: 12,
          marginTop: 8,
          gap: 8,
        },
        contextRow: {
          flexDirection: 'row',
          justifyContent: 'space-between',
        },
        contextKey: {
          fontSize: 12,
          color: theme.colors.textSecondary,
        },
        contextVal: {
          fontSize: 12,
          fontWeight: '600',
          color: theme.colors.textPrimary,
        },
        footerNote: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          marginTop: 24,
          paddingVertical: 16,
        },
        footerNoteText: {
          fontSize: 13,
          fontWeight: '600',
          color: theme.colors.textSecondary,
        },
        successContainer: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          padding: 32,
        },
        successIconWrap: {
          width: 96,
          height: 96,
          borderRadius: 48,
          backgroundColor: theme.colors.success,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 24,
          ...theme.shadows.lg,
        },
        successTitle: {
          fontSize: 28,
          fontWeight: '800',
          color: theme.colors.textPrimary,
          marginBottom: 12,
        },
        successMessage: {
          fontSize: 16,
          color: theme.colors.textSecondary,
          textAlign: 'center',
          lineHeight: 24,
          marginBottom: 32,
        },
        refContainer: {
          backgroundColor: theme.colors.surface,
          paddingHorizontal: 24,
          paddingVertical: 16,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: theme.colors.borderLight,
          alignItems: 'center',
          marginBottom: 40,
        },
        refLabel: {
          fontSize: 12,
          color: theme.colors.textTertiary,
          fontWeight: '600',
          marginBottom: 4,
          textTransform: 'uppercase',
          letterSpacing: 1,
        },
        refValue: {
          fontSize: 18,
          fontWeight: '800',
          color: theme.colors.textPrimary,
          letterSpacing: 2,
        },
        doneBtn: {
          backgroundColor: theme.colors.primary,
          paddingHorizontal: 40,
          paddingVertical: 16,
          borderRadius: 16,
          width: '100%',
          alignItems: 'center',
        },
        doneBtnText: {
          color: '#FFF',
          fontSize: 16,
          fontWeight: '800',
        },
      }),
    [theme, isDesktop],
  );
};

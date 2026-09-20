// app/(app)/settings/appearance.tsx
import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ImageBackground,
  Platform,
  TextInput,
  Alert,
  useWindowDimensions,
  Pressable,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Slider from '@react-native-community/slider';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '../../shims/async-storage';
import Animated, { FadeInDown, Layout } from 'react-native-reanimated';

import { useThemeStore } from '../../stores/theme.store';
import { useTheme } from '../../providers/ThemeProvider';
import { GlobalBackground } from '../../components/ui/GlobalBackground';
import { ImageRepositionModal } from '../../components/ui/ImageRepositionModal';
import { GlassCard } from '../../components/ui/GlassCard';
import AppIcon from '../../components/common/AppIcon';
import { haptics } from '../../utils/haptics';
import type { Theme } from '../../theme';

// ─── Image & Video Repositories ──────────────────────────────
const imageMap: Record<string, string> = {
  cover_1:
    'https://i.pinimg.com/1200x/9e/f5/5f/9ef55f04aeae4fedfb720cc428659782.jpg',
  cover_2:
    'https://i.pinimg.com/736x/da/d0/be/dad0be0a43fd47d48dc52b0a9b3adf3c.jpg',
  cover_3:
    'https://i.pinimg.com/736x/64/ab/11/64ab1199a3ef6815b1cd1b7b58859f5a.jpg',
  cover_4:
    'https://i.pinimg.com/736x/68/11/6b/68116be5b8fcd754b7f811625bd51223.jpg',
  cover_5:
    'https://i.pinimg.com/1200x/45/13/c2/4513c2e7cf4cbbc2577d0eb6785e1fe9.jpg',
  cover_6:
    'https://i.pinimg.com/1200x/2d/87/79/2d87790b9d4f16396c9bed95bf1343f8.jpg',
  cover_7:
    'https://i.pinimg.com/736x/39/c8/06/39c8063590b12a1e8c27f35eb6b2c7f0.jpg',
  cover_8:
    'https://i.pinimg.com/736x/01/d4/40/01d440614ae962bbe5b54da051dfc27d.jpg',
  cover_9:
    'https://i.pinimg.com/1200x/a3/02/d4/a302d4d027b7e43c2635bea8d9680607.jpg',
  cover_10:
    'https://i.pinimg.com/736x/12/7c/71/127c714a1c719f2680db43dd98e6748a.jpg',
  cover_11:
    'https://i.pinimg.com/736x/ae/ac/d9/aeacd9027fce6b19afb3e9fe9bb097c3.jpg',
  cover_12:
    'https://i.pinimg.com/736x/52/d3/54/52d35492cf45b6266e2c24fcdd5713db.jpg',
  cover_13:
    'https://i.pinimg.com/1200x/88/29/54/8829546ef2f649a4c4beb9a0bab9382d.jpg',
  cover_14:
    'https://i.pinimg.com/1200x/ae/1b/a7/ae1ba70eaaccbb87ecd9129aabc05e79.jpg',
  cover_15:
    'https://i.pinimg.com/1200x/ab/bb/c6/abbbc619d00d81b41cea7b2f17ef73e2.jpg',
  cover_16:
    'https://i.pinimg.com/736x/b3/47/5a/b3475ab7398470689b53ce400f97a1bd.jpg',
  cover_17:
    'https://i.pinimg.com/1200x/f5/96/80/f596803dc858121168946e738f531f3f.jpg',
  cover_18:
    'https://i.pinimg.com/1200x/61/4b/b1/614bb112b2b5baef1c5c4c6e6bfefb7c.jpg',
  cover_19:
    'https://i.pinimg.com/1200x/f0/f2/4e/f0f24ec832d61ecdef06a1d77c10a2be.jpg',
  cover_20:
    'https://i.pinimg.com/736x/35/c5/6f/35c56fd79802890c1f6cda755d473f44.jpg',
  cover_21:
    'https://i.pinimg.com/1200x/5c/9a/bf/5c9abf8f69767e7e67c674a4e1826f02.jpg',
  cover_22:
    'https://i.pinimg.com/1200x/90/b6/1a/90b61a2aab1a2d671d2c39119f979dd9.jpg',
  cover_23:
    'https://i.pinimg.com/1200x/d1/49/fd/d149fd4f50afd64497f7035f94b3050e.jpg',
  cover_24:
    'https://images.pexels.com/photos/38436258/pexels-photo-38436258.jpeg',
  cover_25:
    'https://images.pexels.com/photos/27429860/pexels-photo-27429860.jpeg',
  cover_26:
    'https://images.pexels.com/photos/10781049/pexels-photo-10781049.jpeg',
  cover_27:
    'https://images.pexels.com/photos/5887039/pexels-photo-5887039.jpeg',
  cover_28:
    'https://images.pexels.com/photos/34939151/pexels-photo-34939151.jpeg',
  cover_29:
    'https://images.pexels.com/photos/38247462/pexels-photo-38247462.jpeg',
  cover_80:
    'https://images.pexels.com/photos/2832081/pexels-photo-2832081.jpeg?auto=compress&cs=tinysrgb&w=1200',
};

const imageKeys = Object.keys(imageMap);

const videoMap: Record<string, { uri: string; thumbnail: string }> = {
  video_1: {
    uri: 'https://assets.mixkit.co/videos/preview/mixkit-daytime-city-traffic-on-a-bridge-4349-large.mp4',
    thumbnail:
      'https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=800&q=80',
  },
  video_2: {
    uri: 'https://assets.mixkit.co/videos/preview/mixkit-a-hill-covered-with-trees-and-a-path-4258-large.mp4',
    thumbnail:
      'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=800&q=80',
  },
  video_3: {
    uri: 'https://assets.mixkit.co/videos/preview/mixkit-clouds-and-blue-sky-2408-large.mp4',
    thumbnail:
      'https://images.unsplash.com/photo-1534088568595-a066f410bcda?auto=format&fit=crop&w=800&q=80',
  },
  video_4: {
    uri: 'https://assets.mixkit.co/videos/preview/mixkit-flying-over-the-sea-at-sunset-4826-large.mp4',
    thumbnail:
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
  },
};

const videoKeys = Object.keys(videoMap);

const PRESET_COLORS = [
  '#0F172A',
  '#1E1B4B',
  '#111827',
  '#1E3A8A',
  '#064E3B',
  '#701A75',
  '#7F1D1D',
  '#FAFAFA',
  '#F1F5F9',
  '#FBF0E9',
  '#D7EBDF',
];

const CUSTOM_COLORS_STORAGE_KEY = '@app_custom_colors';

// ─── Segmented Selector ──────────────────────────────────────
function BentoSegmentControl({
  options,
  activeValue,
  onChange,
}: {
  options: { label: string; value: string; icon: string }[];
  activeValue: string;
  onChange: (val: any) => void;
}) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.segmentContainer,
        { backgroundColor: theme.colors.background },
      ]}
    >
      {options.map(opt => {
        const isActive = activeValue === opt.value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => {
              haptics.light();
              onChange(opt.value);
            }}
            style={[
              styles.segmentItem,
              isActive && [
                styles.segmentItemActive,
                { backgroundColor: theme.colors.surface },
              ],
            ]}
          >
            <AppIcon
              name={opt.icon as any}
              size={15}
              color={
                isActive ? theme.colors.primary : theme.colors.textSecondary
              }
            />
            <Text
              style={[
                styles.segmentLabel,
                {
                  color: isActive
                    ? theme.colors.textPrimary
                    : theme.colors.textSecondary,
                  fontWeight: isActive ? '800' : '600',
                },
              ]}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// ─── Main Appearance Screen ──────────────────────────────────
export default function AppearanceScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const isDesktop = width >= 900;
  const stylesDynamic = useMemo(
    () => createDynamicStyles(theme, isDesktop),
    [theme, isDesktop],
  );

  const {
    backgroundType,
    backgroundImage,
    backgroundBlur,
    backgroundColor,
    backgroundImagePosition,
    mode,
    backgroundVideo,
    setBackgroundType,
    setBackgroundImage,
    setBackgroundBlur,
    setBackgroundColor,
    setBackgroundImagePosition,
    setMode,
    fontColor,
    setFontColor,
    setBackgroundVideo,
  } = useThemeStore();

  const [isRepositionVisible, setIsRepositionVisible] = useState(false);
  const [customHex, setCustomHex] = useState(backgroundColor || '#0F172A');
  const [customColors, setCustomColors] = useState<string[]>([]);
  const [imageUrl, setImageUrl] = useState('');
  const [customFontHex, setCustomFontHex] = useState(fontColor || '#FFFFFF');
  useEffect(() => {
    if (fontColor) setCustomFontHex(fontColor);
  }, [fontColor]);

  useEffect(() => {
    loadCustomColors();
  }, []);

  useEffect(() => {
    if (backgroundColor) setCustomHex(backgroundColor);
  }, [backgroundColor]);

  useEffect(() => {
    if (backgroundImage && !imageMap[backgroundImage]) {
      setImageUrl(backgroundImage);
    }
  }, [backgroundImage]);

  const loadCustomColors = async () => {
    try {
      const saved = await AsyncStorage.getItem(CUSTOM_COLORS_STORAGE_KEY);
      if (saved) setCustomColors(JSON.parse(saved));
    } catch {
      /* noop */
    }
  };

  const saveCustomColor = async (color: string) => {
    if (!/^#[0-9A-F]{6}$/i.test(color)) {
      Alert.alert(
        'Invalid Format',
        'Please enter a valid 6-digit hex code (e.g., #2563EB)',
      );
      return;
    }
    try {
      setBackgroundColor(color);
      const updated = [color, ...customColors.filter(c => c !== color)].slice(
        0,
        8,
      );
      setCustomColors(updated);
      await AsyncStorage.setItem(
        CUSTOM_COLORS_STORAGE_KEY,
        JSON.stringify(updated),
      );
    } catch {
      /* noop */
    }
  };

  const deleteCustomColor = async (color: string) => {
    try {
      const updated = customColors.filter(c => c !== color);
      setCustomColors(updated);
      await AsyncStorage.setItem(
        CUSTOM_COLORS_STORAGE_KEY,
        JSON.stringify(updated),
      );
      if (backgroundColor === color) {
        setBackgroundColor(PRESET_COLORS[0]);
        setCustomHex(PRESET_COLORS[0]);
      }
    } catch {
      /* noop */
    }
  };

  const isImageMode = backgroundType === 'image';
  const isVideoMode = backgroundType === 'video';
  const isColorMode = backgroundType === 'color';

  const previewUri =
    isImageMode && backgroundImage
      ? imageMap[backgroundImage] || backgroundImage
      : null;
  const videoPreviewUri =
    isVideoMode && backgroundVideo
      ? videoMap[backgroundVideo]?.thumbnail
      : null;

  const handleCustomImageSubmit = () => {
    if (imageUrl.trim()) {
      haptics.medium();
      setBackgroundImage(imageUrl.trim());
    }
  };

  // ─── Live Frame Mockup ──────────────────────────────────────
  const renderPreviewFrame = () => (
    <View style={styles.phoneFrame}>
      {isImageMode || isVideoMode ? (
        <ImageBackground
          source={{
            uri: (isImageMode ? previewUri : videoPreviewUri) || undefined,
          }}
          style={styles.mockBackground}
          blurRadius={isImageMode ? Math.round((backgroundBlur / 100) * 20) : 0}
          resizeMode="cover"
        >
          <LinearGradient
            colors={['rgba(0,0,0,0.4)', 'transparent', 'rgba(0,0,0,0.8)']}
            style={StyleSheet.absoluteFill}
          />

          {/* Top Live Badge */}
          <View style={styles.mockTopRow}>
            <View style={styles.mockLivePill}>
              <AppIcon name="sparkles" size={12} color="#FFFFFF" />
              <Text style={styles.mockLiveText}>Live Mockup</Text>
            </View>

            {isImageMode && previewUri && (
              <Pressable
                onPress={() => setIsRepositionVisible(true)}
                style={styles.mockRepositionBtn}
              >
                <AppIcon name="crop" size={12} color="#FFFFFF" />
                <Text style={styles.mockRepositionText}>Adjust</Text>
              </Pressable>
            )}
          </View>

          {/* Sample Glass Card Content */}
          <View style={styles.mockContent}>
            <View style={styles.mockCard}>
              <View style={styles.mockCardHeader}>
                <Text
                  style={[
                    styles.mockCardTitle,
                    fontColor ? { color: fontColor } : null,
                  ]}
                >
                  🌴 Goa Expedition
                </Text>
                <Text
                  style={[
                    styles.mockCardAmount,
                    fontColor ? { color: fontColor } : null,
                  ]}
                >
                  ₹24,500
                </Text>
              </View>
              <View style={styles.mockTagRow}>
                <View style={styles.mockTag}>
                  <Text
                    style={[
                      styles.mockTagText,
                      fontColor ? { color: fontColor } : null,
                    ]}
                  >
                    4 Travelers
                  </Text>
                </View>
                <View
                  style={[
                    styles.mockTag,
                    { backgroundColor: 'rgba(16,185,129,0.3)' },
                  ]}
                >
                  <Text style={[styles.mockTagText, { color: '#34D399' }]}>
                    Settled
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </ImageBackground>
      ) : (
        <View
          style={[
            styles.mockBackground,
            { backgroundColor: backgroundColor || '#0F172A' },
          ]}
        >
          <LinearGradient
            colors={['rgba(0,0,0,0.2)', 'transparent', 'rgba(0,0,0,0.6)']}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.mockTopRow}>
            <View style={styles.mockLivePill}>
              <AppIcon name="palette" size={12} color="#FFFFFF" />
              <Text style={styles.mockLiveText}>Solid Color</Text>
            </View>
          </View>

          <View style={styles.mockContent}>
            <View style={styles.mockCard}>
              <View style={styles.mockCardHeader}>
                <Text
                  style={[
                    styles.mockCardTitle,
                    fontColor ? { color: fontColor } : null,
                  ]}
                >
                  🌴 Goa Expedition
                </Text>
                <Text
                  style={[
                    styles.mockCardAmount,
                    fontColor ? { color: fontColor } : null,
                  ]}
                >
                  ₹24,500
                </Text>
              </View>
              <View style={styles.mockTagRow}>
                <View style={styles.mockTag}>
                  <Text
                    style={[
                      styles.mockTagText,
                      fontColor ? { color: fontColor } : null,
                    ]}
                  >
                    4 Travelers
                  </Text>
                </View>
                <View
                  style={[
                    styles.mockTag,
                    { backgroundColor: 'rgba(16,185,129,0.3)' },
                  ]}
                >
                  <Text style={[styles.mockTagText, { color: '#34D399' }]}>
                    Settled
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      )}
    </View>
  );

  // ─── Control Panels ─────────────────────────────────────────
  const renderControlPanels = () => (
    <View style={styles.controlsStack}>
      {/* App Theme Mode Panel */}
      <View
        style={[styles.panelCard, { backgroundColor: theme.colors.surface }]}
      >
        <View style={styles.panelHeader}>
          <View
            style={[
              styles.panelIconAura,
              { backgroundColor: `${theme.colors.primary}15` },
            ]}
          >
            <AppIcon name="sun" size={16} color={theme.colors.primary} />
          </View>
          <View>
            <Text
              style={[styles.panelTitle, { color: theme.colors.textPrimary }]}
            >
              Interface Theme
            </Text>
            <Text
              style={[styles.panelSub, { color: theme.colors.textTertiary }]}
            >
              Select default surface mode
            </Text>
          </View>
        </View>

        <BentoSegmentControl
          activeValue={mode}
          onChange={setMode}
          options={[
            { label: 'System Default', value: 'system', icon: 'smartphone' },
            { label: 'Light', value: 'light', icon: 'sun' },
            { label: 'Dark', value: 'dark', icon: 'moon' },
          ]}
        />
      </View>

      {/* Background Style Switcher */}
      <View
        style={[styles.panelCard, { backgroundColor: theme.colors.surface }]}
      >
        <View style={styles.panelHeader}>
          <View style={[styles.panelIconAura, { backgroundColor: '#EDE9FE' }]}>
            <AppIcon name="layers" size={16} color="#8B5CF6" />
          </View>
          <View>
            <Text
              style={[styles.panelTitle, { color: theme.colors.textPrimary }]}
            >
              Background Canvas
            </Text>
            <Text
              style={[styles.panelSub, { color: theme.colors.textTertiary }]}
            >
              Choose wallpaper architecture
            </Text>
          </View>
        </View>

        {/* Font & Header Color Control Panel */}
        <View
          style={[styles.panelCard, { backgroundColor: theme.colors.surface }]}
        >
          <View style={styles.panelHeader}>
            <View
              style={[styles.panelIconAura, { backgroundColor: '#FEF3C7' }]}
            >
              <AppIcon name="type" size={16} color="#D97706" />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={[styles.panelTitle, { color: theme.colors.textPrimary }]}
              >
                Font & Header Color
              </Text>
              <Text
                style={[styles.panelSub, { color: theme.colors.textTertiary }]}
              >
                Ensure text contrast on dark/light wallpapers
              </Text>
            </View>
            {fontColor && (
              <Pressable
                onPress={() => {
                  haptics.light();
                  setFontColor(null);
                }}
                style={styles.resetFontBtn}
              >
                <Text
                  style={[
                    styles.resetFontText,
                    { color: theme.colors.primary },
                  ]}
                >
                  Reset
                </Text>
              </Pressable>
            )}
          </View>

          {/* Curated Font Swatches */}
          <View style={styles.swatchGrid}>
            {[
              { label: 'White', hex: '#FFFFFF' },
              { label: 'Snow', hex: '#F4F4F5' },
              { label: 'Platinum', hex: '#E4E4E7' },
              { label: 'Black', hex: '#09090B' },
              { label: 'Charcoal', hex: '#18181B' },
              { label: 'Amber', hex: '#F59E0B' },
              { label: 'Cyan', hex: '#06B6D4' },
              { label: 'Emerald', hex: '#10B981' },
              { label: 'Coral', hex: '#F43F5E' },
              { label: 'Indigo', hex: '#818CF8' },
              { label: 'Gold', hex: '#D4A03C' },
              { label: 'Purple', hex: '#A855F7' },
            ].map(item => {
              const activeColor =
                fontColor ||
                (theme.colors as any).fontColor ||
                theme.colors.textPrimary;
              const isSelected =
                activeColor &&
                activeColor.toLowerCase() === item.hex.toLowerCase();
              return (
                <Pressable
                  key={item.hex}
                  onPress={() => {
                    haptics.light();
                    setFontColor(item.hex);
                    setCustomFontHex(item.hex);
                  }}
                  style={[
                    styles.swatchCircle,
                    { backgroundColor: item.hex },
                    isSelected && {
                      borderColor: theme.colors.primary,
                      borderWidth: 3,
                    },
                  ]}
                >
                  {isSelected && (
                    <AppIcon
                      name="check"
                      size={16}
                      color={
                        ['#FFFFFF', '#F4F4F5', '#E4E4E7'].includes(item.hex)
                          ? '#000000'
                          : '#FFFFFF'
                      }
                    />
                  )}
                </Pressable>
              );
            })}
          </View>

          {/* Custom Font Hex Input */}
          <View style={styles.urlInputRow}>
            <View
              style={[
                styles.hexColorIndicator,
                { backgroundColor: customFontHex || '#FFFFFF' },
              ]}
            />
            <TextInput
              style={[
                styles.textInput,
                {
                  color: theme.colors.textPrimary,
                  backgroundColor: theme.colors.background,
                  borderColor: theme.isDark
                    ? 'rgba(255,255,255,0.08)'
                    : 'rgba(0,0,0,0.06)',
                },
              ]}
              value={customFontHex}
              onChangeText={t => {
                setCustomFontHex(t);
                if (/^#[0-9A-F]{6}$/i.test(t)) {
                  setFontColor(t);
                }
              }}
              maxLength={7}
              placeholder="#FFFFFF"
              placeholderTextColor={theme.colors.textTertiary}
              autoCapitalize="characters"
            />
            <Pressable
              onPress={() => {
                if (/^#[0-9A-F]{6}$/i.test(customFontHex)) {
                  haptics.light();
                  setFontColor(customFontHex);
                }
              }}
              style={[
                styles.applyBtn,
                { backgroundColor: theme.colors.primary },
              ]}
            >
              <AppIcon name="check" size={16} color="#FFFFFF" />
            </Pressable>
          </View>
        </View>

        <BentoSegmentControl
          activeValue={backgroundType}
          onChange={setBackgroundType}
          options={[
            { label: 'Photo Cover', value: 'image', icon: 'image' },
            { label: 'Solid Color', value: 'color', icon: 'palette' },
            { label: 'Video Loop', value: 'video', icon: 'film' },
          ]}
        />
      </View>

      {/* ── PHOTO COVER CONTROLS ── */}
      {isImageMode && (
        <>
          {/* Custom URL Input */}
          <View
            style={[
              styles.panelCard,
              { backgroundColor: theme.colors.surface },
            ]}
          >
            <View style={styles.panelHeader}>
              <View
                style={[styles.panelIconAura, { backgroundColor: '#EFF6FF' }]}
              >
                <AppIcon name="link" size={16} color="#2563EB" />
              </View>
              <View>
                <Text
                  style={[
                    styles.panelTitle,
                    { color: theme.colors.textPrimary },
                  ]}
                >
                  Custom Photo URL
                </Text>
                <Text
                  style={[
                    styles.panelSub,
                    { color: theme.colors.textTertiary },
                  ]}
                >
                  Load direct Unsplash/Pinterest link
                </Text>
              </View>
            </View>

            <View style={styles.urlInputRow}>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    color: theme.colors.textPrimary,
                    backgroundColor: theme.colors.background,
                    borderColor: theme.isDark
                      ? 'rgba(255,255,255,0.08)'
                      : 'rgba(0,0,0,0.06)',
                  },
                ]}
                value={imageUrl}
                onChangeText={setImageUrl}
                placeholder="https://images.unsplash.com/..."
                placeholderTextColor={theme.colors.textTertiary}
                autoCapitalize="none"
                returnKeyType="done"
                onSubmitEditing={handleCustomImageSubmit}
              />
              <Pressable
                onPress={handleCustomImageSubmit}
                style={[
                  styles.applyBtn,
                  { backgroundColor: theme.colors.primary },
                ]}
              >
                <AppIcon name="check" size={16} color="#FFFFFF" />
              </Pressable>
            </View>
          </View>

          {/* Curated Gallery Carousel */}
          <View
            style={[
              styles.panelCard,
              { backgroundColor: theme.colors.surface },
            ]}
          >
            <View style={styles.panelHeader}>
              <View
                style={[styles.panelIconAura, { backgroundColor: '#ECFDF5' }]}
              >
                <AppIcon name="image" size={16} color="#10B981" />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.panelTitle,
                    { color: theme.colors.textPrimary },
                  ]}
                >
                  Curated Wallpapers
                </Text>
                <Text
                  style={[
                    styles.panelSub,
                    { color: theme.colors.textTertiary },
                  ]}
                >
                  {imageKeys.length} high-res wallpapers
                </Text>
              </View>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.galleryScroll}
            >
              {imageKeys.map(key => {
                const isSelected = backgroundImage === key;
                return (
                  <Pressable
                    key={key}
                    onPress={() => {
                      haptics.light();
                      setBackgroundImage(key);
                      setImageUrl('');
                    }}
                    style={[
                      styles.galleryThumb,
                      isSelected && {
                        borderColor: theme.colors.primary,
                        borderWidth: 2,
                      },
                    ]}
                  >
                    <Image
                      source={{ uri: imageMap[key] }}
                      style={styles.thumbImage}
                      resizeMode="cover"
                    />
                    {isSelected && (
                      <View
                        style={[
                          styles.selectedPill,
                          { backgroundColor: theme.colors.primary },
                        ]}
                      >
                        <AppIcon name="check" size={12} color="#FFFFFF" />
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* Blur Intensity Slider */}
          <View
            style={[
              styles.panelCard,
              { backgroundColor: theme.colors.surface },
            ]}
          >
            <View style={styles.panelHeader}>
              <View
                style={[styles.panelIconAura, { backgroundColor: '#FEF3C7' }]}
              >
                <AppIcon name="droplet" size={16} color="#D97706" />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.panelTitle,
                    { color: theme.colors.textPrimary },
                  ]}
                >
                  Blur Intensity
                </Text>
                <Text
                  style={[
                    styles.panelSub,
                    { color: theme.colors.textTertiary },
                  ]}
                >
                  Frosted glass overlay strength
                </Text>
              </View>
              <View
                style={[
                  styles.percentBadge,
                  { backgroundColor: `${theme.colors.primary}15` },
                ]}
              >
                <Text
                  style={[
                    styles.percentBadgeText,
                    { color: theme.colors.primary },
                  ]}
                >
                  {Math.round(backgroundBlur)}%
                </Text>
              </View>
            </View>

            <View style={styles.sliderRow}>
              <AppIcon name="eye" size={16} color={theme.colors.textTertiary} />
              <Slider
                style={{ flex: 1 }}
                minimumValue={0}
                maximumValue={100}
                step={1}
                value={backgroundBlur}
                onValueChange={setBackgroundBlur}
                minimumTrackTintColor={theme.colors.primary}
                maximumTrackTintColor={
                  theme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
                }
                thumbTintColor={theme.colors.primary}
              />
              <AppIcon
                name="eye-off"
                size={16}
                color={theme.colors.textTertiary}
              />
            </View>

            {/* Quick Blur Step Chips */}
            <View style={styles.blurChipsRow}>
              {[0, 25, 50, 75, 100].map(val => {
                const isSelected = Math.abs(backgroundBlur - val) < 4;
                return (
                  <Pressable
                    key={val}
                    onPress={() => {
                      haptics.light();
                      setBackgroundBlur(val);
                    }}
                    style={[
                      styles.blurChip,
                      {
                        backgroundColor: isSelected
                          ? `${theme.colors.primary}18`
                          : theme.colors.background,
                        borderColor: isSelected
                          ? theme.colors.primary
                          : 'transparent',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.blurChipText,
                        {
                          color: isSelected
                            ? theme.colors.primary
                            : theme.colors.textSecondary,
                          fontWeight: isSelected ? '800' : '600',
                        },
                      ]}
                    >
                      {val}%
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </>
      )}

      {/* ── SOLID COLOR CONTROLS ── */}
      {isColorMode && (
        <>
          {/* Preset Swatches */}
          <View
            style={[
              styles.panelCard,
              { backgroundColor: theme.colors.surface },
            ]}
          >
            <View style={styles.panelHeader}>
              <View
                style={[styles.panelIconAura, { backgroundColor: '#EDE9FE' }]}
              >
                <AppIcon name="palette" size={16} color="#8B5CF6" />
              </View>
              <View>
                <Text
                  style={[
                    styles.panelTitle,
                    { color: theme.colors.textPrimary },
                  ]}
                >
                  Solid Color Presets
                </Text>
                <Text
                  style={[
                    styles.panelSub,
                    { color: theme.colors.textTertiary },
                  ]}
                >
                  Curated low-contrast dark & light fills
                </Text>
              </View>
            </View>

            <View style={styles.swatchGrid}>
              {PRESET_COLORS.map(c => {
                const isSelected = backgroundColor === c;
                return (
                  <Pressable
                    key={c}
                    onPress={() => {
                      haptics.light();
                      setBackgroundColor(c);
                      setCustomHex(c);
                    }}
                    style={[
                      styles.swatchCircle,
                      { backgroundColor: c },
                      isSelected && {
                        borderColor: theme.colors.primary,
                        borderWidth: 3,
                      },
                    ]}
                  >
                    {isSelected && (
                      <AppIcon
                        name="check"
                        size={16}
                        color={
                          ['#FAFAFA', '#F1F5F9', '#FBF0E9', '#D7EBDF'].includes(
                            c,
                          )
                            ? '#000'
                            : '#FFF'
                        }
                      />
                    )}
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Custom Hex Code */}
          <View
            style={[
              styles.panelCard,
              { backgroundColor: theme.colors.surface },
            ]}
          >
            <View style={styles.panelHeader}>
              <View
                style={[styles.panelIconAura, { backgroundColor: '#EFF6FF' }]}
              >
                <AppIcon name="edit" size={16} color="#2563EB" />
              </View>
              <View>
                <Text
                  style={[
                    styles.panelTitle,
                    { color: theme.colors.textPrimary },
                  ]}
                >
                  Custom Hex Color
                </Text>
                <Text
                  style={[
                    styles.panelSub,
                    { color: theme.colors.textTertiary },
                  ]}
                >
                  Enter a 6-digit hex code
                </Text>
              </View>
            </View>

            <View style={styles.urlInputRow}>
              <View
                style={[
                  styles.hexColorIndicator,
                  { backgroundColor: customHex },
                ]}
              />
              <TextInput
                style={[
                  styles.textInput,
                  {
                    color: theme.colors.textPrimary,
                    backgroundColor: theme.colors.background,
                    borderColor: theme.isDark
                      ? 'rgba(255,255,255,0.08)'
                      : 'rgba(0,0,0,0.06)',
                  },
                ]}
                value={customHex}
                onChangeText={t => {
                  setCustomHex(t);
                  if (/^#[0-9A-F]{6}$/i.test(t)) setBackgroundColor(t);
                }}
                maxLength={7}
                placeholder="#0F172A"
                placeholderTextColor={theme.colors.textTertiary}
                autoCapitalize="characters"
              />
              <Pressable
                onPress={() => saveCustomColor(customHex)}
                style={[
                  styles.applyBtn,
                  { backgroundColor: theme.colors.primary },
                ]}
              >
                <AppIcon name="check" size={16} color="#FFFFFF" />
              </Pressable>
            </View>
          </View>

          {/* Recent Colors List */}
          {customColors.length > 0 && (
            <View
              style={[
                styles.panelCard,
                { backgroundColor: theme.colors.surface },
              ]}
            >
              <View style={styles.panelHeader}>
                <View
                  style={[styles.panelIconAura, { backgroundColor: '#ECFDF5' }]}
                >
                  <AppIcon name="clock" size={16} color="#10B981" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.panelTitle,
                      { color: theme.colors.textPrimary },
                    ]}
                  >
                    Recent Colors
                  </Text>
                  <Text
                    style={[
                      styles.panelSub,
                      { color: theme.colors.textTertiary },
                    ]}
                  >
                    Long-press to delete
                  </Text>
                </View>
              </View>

              <View style={styles.swatchGrid}>
                {customColors.map(color => (
                  <Pressable
                    key={color}
                    onPress={() => {
                      haptics.light();
                      setBackgroundColor(color);
                      setCustomHex(color);
                    }}
                    onLongPress={() => deleteCustomColor(color)}
                    style={[
                      styles.swatchCircle,
                      { backgroundColor: color },
                      backgroundColor === color && {
                        borderColor: theme.colors.primary,
                        borderWidth: 3,
                      },
                    ]}
                  >
                    {backgroundColor === color && (
                      <AppIcon
                        name="check"
                        size={16}
                        color={
                          ['#FAFAFA', '#F1F5F9', '#FBF0E9', '#D7EBDF'].includes(
                            color,
                          )
                            ? '#000'
                            : '#FFF'
                        }
                      />
                    )}
                  </Pressable>
                ))}
              </View>
            </View>
          )}
        </>
      )}

      {/* ── VIDEO LOOP CONTROLS ── */}
      {isVideoMode && (
        <View
          style={[styles.panelCard, { backgroundColor: theme.colors.surface }]}
        >
          <View style={styles.panelHeader}>
            <View
              style={[styles.panelIconAura, { backgroundColor: '#FEE2E2' }]}
            >
              <AppIcon name="film" size={16} color="#EF4444" />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={[styles.panelTitle, { color: theme.colors.textPrimary }]}
              >
                Select Video Loop
              </Text>
              <Text
                style={[styles.panelSub, { color: theme.colors.textTertiary }]}
              >
                {videoKeys.length} available cinematic loops
              </Text>
            </View>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.galleryScroll}
          >
            {videoKeys.map(key => {
              const isSelected = backgroundVideo === key;
              return (
                <Pressable
                  key={key}
                  onPress={() => {
                    haptics.light();
                    setBackgroundVideo(key);
                  }}
                  style={[
                    styles.galleryThumb,
                    isSelected && {
                      borderColor: theme.colors.primary,
                      borderWidth: 2,
                    },
                  ]}
                >
                  <Image
                    source={{ uri: videoMap[key].thumbnail }}
                    style={styles.thumbImage}
                    resizeMode="cover"
                  />
                  {isSelected && (
                    <View
                      style={[
                        styles.selectedPill,
                        { backgroundColor: theme.colors.primary },
                      ]}
                    >
                      <AppIcon name="check" size={12} color="#FFFFFF" />
                    </View>
                  )}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.root}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <GlobalBackground />
      </View>

      {/* Sticky Header */}
      <View
        style={[
          styles.headerBar,
          { paddingTop: Platform.OS === 'web' ? 20 : insets.top + 10 },
        ]}
      >
        <View style={styles.headerInner}>
          <View style={styles.headerLeft}>
            <Pressable
              onPress={() => {
                haptics.light();
                router.back();
              }}
              style={({ pressed }) => [
                styles.iconBtn,
                { backgroundColor: theme.colors.surface },
                pressed && { opacity: 0.7 },
              ]}
              hitSlop={8}
            >
              <AppIcon
                name="arrow-left"
                size={18}
                color={theme.colors.textPrimary}
              />
            </Pressable>

            <View>
              <Text
                style={[
                  styles.headerTitle,
                  { color: theme.colors.textPrimary },
                ]}
              >
                Appearance & Canvas
              </Text>
              <Text
                style={[styles.headerSub, { color: theme.colors.textTertiary }]}
              >
                Customize wallpapers, frosted glass & theme palettes
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Responsive Layout */}
      {isDesktop ? (
        <View style={stylesDynamic.desktopSplitWrapper}>
          <ScrollView
            style={styles.desktopControlsCol}
            contentContainerStyle={[
              styles.desktopControlsContent,
              { paddingBottom: insets.bottom + 80 },
            ]}
            showsVerticalScrollIndicator={false}
          >
            {renderControlPanels()}
          </ScrollView>

          <View style={styles.desktopPreviewCol}>
            <View style={styles.desktopStickyWrapper}>
              <Text
                style={[
                  styles.previewSectionTitle,
                  { color: theme.colors.textPrimary },
                ]}
              >
                Live Canvas Mockup
              </Text>
              {renderPreviewFrame()}
            </View>
          </View>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 80 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.mobilePreviewWrapper}>
            <Text
              style={[
                styles.previewSectionTitle,
                { color: theme.colors.textPrimary },
              ]}
            >
              Live Canvas Mockup
            </Text>
            {renderPreviewFrame()}
          </View>
          {renderControlPanels()}
        </ScrollView>
      )}

      {/* Reposition Modal */}
      <ImageRepositionModal
        visible={isRepositionVisible}
        imageUri={previewUri}
        initialPosition={backgroundImagePosition}
        onCancel={() => setIsRepositionVisible(false)}
        onSave={pos => {
          setBackgroundImagePosition(pos);
          setIsRepositionVisible(false);
        }}
        accentColor={theme.colors.primary}
      />
    </View>
  );
}

// ─── STYLES ──────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: 'transparent' },
  scrollView: { flex: 1 },
  scrollContent: { padding: 16, gap: 16 },

  headerBar: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(15,23,42,0.06)',
    zIndex: 10,
  },
  headerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    maxWidth: 1300,
    alignSelf: 'center',
    width: '100%',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(15,23,42,0.06)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  headerSub: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 1,
  },
  resetFontBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  resetFontText: {
    fontSize: 11,
    fontWeight: '700',
  },

  // Segment Selector
  segmentContainer: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 14,
    gap: 4,
  },
  segmentItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  segmentItemActive: {
    ...Platform.select({
      web: {
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
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
  },
  segmentLabel: {
    fontSize: 12,
    letterSpacing: -0.2,
  },

  // Panel Cards
  controlsStack: {
    gap: 14,
  },
  panelCard: {
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(15,23,42,0.05)',

    ...Platform.select({
      web: {
        boxShadow: '0 4px 16px rgba(0,0,0,0.02)',
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

    gap: 14,
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  panelIconAura: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  panelTitle: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  panelSub: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },

  // Custom Input
  urlInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  hexColorIndicator: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  textInput: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 13,
    fontWeight: '600',
  },
  applyBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Gallery
  galleryScroll: {
    gap: 10,
  },
  galleryThumb: {
    width: 100,
    height: 140,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    position: 'relative',
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  selectedPill: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Sliders & Chips
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  percentBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  percentBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  blurChipsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  blurChip: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  blurChipText: {
    fontSize: 11.5,
  },

  // Swatches
  swatchGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  swatchCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },

  // Mock Frame Preview
  phoneFrame: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(15,23,42,0.1)',

    ...Platform.select({
      web: {
        boxShadow: '0 12px 36px rgba(0,0,0,0.12)',
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

    height: 320,
  },
  mockBackground: {
    width: '100%',
    height: '100%',
    justifyContent: 'space-between',
  },
  mockTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
  },
  mockLivePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  mockLiveText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  mockRepositionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  mockRepositionText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  mockContent: {
    padding: 14,
  },
  mockCard: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 16,
    padding: 12,
    gap: 8,
  },
  mockCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mockCardTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  mockCardAmount: {
    color: '#34D399',
    fontSize: 13,
    fontWeight: '900',
  },
  mockTagRow: {
    flexDirection: 'row',
    gap: 6,
  },
  mockTag: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  mockTagText: {
    color: '#FFFFFF',
    fontSize: 9.5,
    fontWeight: '700',
  },

  // Titles
  previewSectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: -0.2,
    marginBottom: 10,
  },
  mobilePreviewWrapper: {
    marginBottom: 4,
  },
  desktopControlsCol: {
    flex: 1.4,
  },
  desktopControlsContent: {
    paddingRight: 12,
  },
  desktopPreviewCol: {
    flex: 1,
  },
  desktopStickyWrapper: {
    position: 'sticky' as any,
    top: 20,
  },
});

function createDynamicStyles(theme: Theme, isDesktop: boolean) {
  return StyleSheet.create({
    desktopSplitWrapper: {
      flex: 1,
      flexDirection: 'row',
      maxWidth: 1300,
      alignSelf: 'center',
      width: '100%',
      paddingHorizontal: 20,
      paddingTop: 16,
      gap: 20,
    },
  });
}
// import AppIcon from '../../components/common/AppIcon';
// ﻿import React, { useState, useEffect, useRef } from 'react';
// import {
//     View,
//     StyleSheet,
//     ScrollView,
//     TouchableOpacity,
//     Image,
//     ImageBackground,
//     Dimensions,
//     LayoutAnimation,
//     Platform,
//     UIManager,
//     TextInput,
//     Animated,
//     Alert
// } from 'react-native';
// import { Stack } from 'expo-router';
// import Slider from '@react-native-community/slider';
// import { LinearGradient } from 'expo-linear-gradient';
// // Removed unused @expo/vector-icons
// const imageMap: { [key: string]: any } = {
//     // --------------------------------------------------------
//     // BATCH 1: Original Pinterest & Pexels
//     // --------------------------------------------------------
//     cover_1: 'https://i.pinimg.com/1200x/9e/f5/5f/9ef55f04aeae4fedfb720cc428659782.jpg',
//     cover_2: 'https://i.pinimg.com/736x/da/d0/be/dad0be0a43fd47d48dc52b0a9b3adf3c.jpg',
//     cover_3: 'https://i.pinimg.com/736x/64/ab/11/64ab1199a3ef6815b1cd1b7b58859f5a.jpg',
//     cover_4: 'https://i.pinimg.com/736x/68/11/6b/68116be5b8fcd754b7f811625bd51223.jpg',
//     cover_5: 'https://i.pinimg.com/1200x/45/13/c2/4513c2e7cf4cbbc2577d0eb6785e1fe9.jpg',
//     cover_6: 'https://i.pinimg.com/1200x/2d/87/79/2d87790b9d4f16396c9bed95bf1343f8.jpg',
//     cover_7: 'https://i.pinimg.com/736x/39/c8/06/39c8063590b12a1e8c27f35eb6b2c7f0.jpg',
//     cover_8: 'https://i.pinimg.com/736x/01/d4/40/01d440614ae962bbe5b54da051dfc27d.jpg',
//     cover_9: 'https://i.pinimg.com/1200x/a3/02/d4/a302d4d027b7e43c2635bea8d9680607.jpg',
//     cover_10: 'https://i.pinimg.com/736x/12/7c/71/127c714a1c719f2680db43dd98e6748a.jpg',
//     cover_11: 'https://i.pinimg.com/736x/ae/ac/d9/aeacd9027fce6b19afb3e9fe9bb097c3.jpg',
//     cover_12: 'https://i.pinimg.com/736x/52/d3/54/52d35492cf45b6266e2c24fcdd5713db.jpg',
//     cover_13: 'https://i.pinimg.com/1200x/88/29/54/8829546ef2f649a4c4beb9a0bab9382d.jpg',
//     cover_14: 'https://i.pinimg.com/1200x/ae/1b/a7/ae1ba70eaaccbb87ecd9129aabc05e79.jpg',
//     cover_15: 'https://i.pinimg.com/1200x/ab/bb/c6/abbbc619d00d81b41cea7b2f17ef73e2.jpg',
//     cover_16: 'https://i.pinimg.com/736x/b3/47/5a/b3475ab7398470689b53ce400f97a1bd.jpg',
//     cover_17: 'https://i.pinimg.com/1200x/f5/96/80/f596803dc858121168946e738f531f3f.jpg',
//     cover_18: 'https://i.pinimg.com/1200x/61/4b/b1/614bb112b2b5baef1c5c4c6e6bfefb7c.jpg',
//     cover_19: 'https://i.pinimg.com/1200x/f0/f2/4e/f0f24ec832d61ecdef06a1d77c10a2be.jpg',
//     cover_20: 'https://i.pinimg.com/736x/35/c5/6f/35c56fd79802890c1f6cda755d473f44.jpg',
//     cover_21: 'https://i.pinimg.com/1200x/5c/9a/bf/5c9abf8f69767e7e67c674a4e1826f02.jpg',
//     cover_22: 'https://i.pinimg.com/1200x/90/b6/1a/90b61a2aab1a2d671d2c39119f979dd9.jpg',
//     cover_23: 'https://i.pinimg.com/1200x/d1/49/fd/d149fd4f50afd64497f7035f94b3050e.jpg',
//     cover_24: 'https://images.pexels.com/photos/38436258/pexels-photo-38436258.jpeg',
//     cover_25: 'https://images.pexels.com/photos/27429860/pexels-photo-27429860.jpeg',
//     cover_26: 'https://images.pexels.com/photos/10781049/pexels-photo-10781049.jpeg',
//     cover_27: 'https://images.pexels.com/photos/5887039/pexels-photo-5887039.jpeg',
//     cover_28: 'https://images.pexels.com/photos/34939151/pexels-photo-34939151.jpeg',
//     cover_29: 'https://images.pexels.com/photos/38247462/pexels-photo-38247462.jpeg',

//     // --------------------------------------------------------
//     // BATCH 2: Unsplash & Pexels (Landscapes, Minimal, Aesthetic)
//     // --------------------------------------------------------
//     cover_30: 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&fit=crop&w=1200&q=80',
//     cover_31: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80',
//     cover_32: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80',
//     cover_33: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=1200&q=80',
//     cover_34: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1200&q=80',
//     cover_35: 'https://images.unsplash.com/photo-1449844908441-8829872d2607?auto=format&fit=crop&w=1200&q=80',
//     cover_36: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
//     cover_37: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=1200&q=80',
//     cover_38: 'https://images.unsplash.com/photo-1425913397330-cf8af2ff40a1?auto=format&fit=crop&w=1200&q=80',
//     cover_39: 'https://images.unsplash.com/photo-1505691938895-1758d7bef511?auto=format&fit=crop&w=1200&q=80',
//     cover_40: 'https://images.unsplash.com/photo-1506260408121-e353d10b87c7?auto=format&fit=crop&w=1200&q=80',
//     cover_41: 'https://images.unsplash.com/photo-1503431128871-16fd15a4e4d6?auto=format&fit=crop&w=1200&q=80',
//     cover_42: 'https://images.unsplash.com/photo-1523821741446-edb2b68bb7a0?auto=format&fit=crop&w=1200&q=80',
//     cover_43: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=1200',
//     cover_44: 'https://images.pexels.com/photos/2893685/pexels-photo-2893685.jpeg?auto=compress&cs=tinysrgb&w=1200',
//     cover_45: 'https://images.pexels.com/photos/3244513/pexels-photo-3244513.jpeg?auto=compress&cs=tinysrgb&w=1200',
//     cover_46: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=1200',
//     cover_47: 'https://images.pexels.com/photos/311039/pexels-photo-311039.jpeg?auto=compress&cs=tinysrgb&w=1200',
//     cover_48: 'https://images.pexels.com/photos/414612/pexels-photo-414612.jpeg?auto=compress&cs=tinysrgb&w=1200',
//     cover_49: 'https://images.pexels.com/photos/1323550/pexels-photo-1323550.jpeg?auto=compress&cs=tinysrgb&w=1200',
//     cover_50: 'https://images.pexels.com/photos/1743165/pexels-photo-1743165.jpeg?auto=compress&cs=tinysrgb&w=1200',

//     // --------------------------------------------------------
//     // BATCH 3: Unsplash (Liquid Abstract, Vaporwave, Epic Nature)
//     // --------------------------------------------------------
//     cover_51: 'https://images.unsplash.com/photo-1557672172-298e090bd0f1?auto=format&fit=crop&w=1200&q=80', // Abstract colorful gradient mesh
//     cover_52: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80', // Liquid marble texture
//     cover_53: 'https://images.unsplash.com/photo-1534293230397-c06aa5aa1315?auto=format&fit=crop&w=1200&q=80', // Vaporwave grid sunset
//     cover_54: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80', // Earth from space / digital network
//     cover_55: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80', // Tech circuit board macro
//     cover_56: 'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?auto=format&fit=crop&w=1200&q=80', // Perfect mountain lake reflection
//     cover_57: 'https://images.unsplash.com/photo-1507608616759-54f48f0af0ee?auto=format&fit=crop&w=1200&q=80', // Raindrops on glass with neon reflections
//     cover_58: 'https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=1200&q=80', // Desert dunes at twilight
//     cover_59: 'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?auto=format&fit=crop&w=1200&q=80', // Dark abstract layered texture
//     cover_60: 'https://images.unsplash.com/photo-1604871000636-074fa5117945?auto=format&fit=crop&w=1200&q=80', // Clean 3D geometric shapes
//     cover_61: 'https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?auto=format&fit=crop&w=1200&q=80', // Sleek dark gradient background
//     cover_62: 'https://images.unsplash.com/photo-1506744626753-1fa44df31c2f?auto=format&fit=crop&w=1200&q=80', // Majestic Yosemite valley
//     cover_63: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=1200&q=80', // Minimalist clean office aesthetic
//     cover_64: 'https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?auto=format&fit=crop&w=1200&q=80', // Minimalist white geometry
//     cover_65: 'https://images.unsplash.com/photo-1550684848-76a50e339023?auto=format&fit=crop&w=1200&q=80', // Dark moody gaming/workspace setup

//     // --------------------------------------------------------
//     // BATCH 4: Pexels (High-End Lifestyle, Architecture, Moody)
//     // --------------------------------------------------------
//     cover_66: 'https://images.pexels.com/photos/1591447/pexels-photo-1591447.jpeg?auto=compress&cs=tinysrgb&w=1200',
//     cover_67: 'https://images.pexels.com/photos/2387793/pexels-photo-2387793.jpeg?auto=compress&cs=tinysrgb&w=1200',
//     cover_68: 'https://images.pexels.com/photos/2832039/pexels-photo-2832039.jpeg?auto=compress&cs=tinysrgb&w=1200',
//     cover_69: 'https://images.pexels.com/photos/1038916/pexels-photo-1038916.jpeg?auto=compress&cs=tinysrgb&w=1200',
//     cover_70: 'https://images.pexels.com/photos/33109/fall-autumn-red-season.jpg?auto=compress&cs=tinysrgb&w=1200',
//     cover_71: 'https://images.pexels.com/photos/1806935/pexels-photo-1806935.jpeg?auto=compress&cs=tinysrgb&w=1200',
//     cover_72: 'https://images.pexels.com/photos/190819/pexels-photo-190819.jpeg?auto=compress&cs=tinysrgb&w=1200',
//     cover_73: 'https://images.pexels.com/photos/289998/pexels-photo-289998.jpeg?auto=compress&cs=tinysrgb&w=1200',
//     cover_74: 'https://images.pexels.com/photos/1034662/pexels-photo-1034662.jpeg?auto=compress&cs=tinysrgb&w=1200',
//     cover_75: 'https://images.pexels.com/photos/1237119/pexels-photo-1237119.jpeg?auto=compress&cs=tinysrgb&w=1200',
//     cover_76: 'https://images.pexels.com/photos/1749303/pexels-photo-1749303.jpeg?auto=compress&cs=tinysrgb&w=1200',
//     cover_77: 'https://images.pexels.com/photos/2775196/pexels-photo-2775196.jpeg?auto=compress&cs=tinysrgb&w=1200',
//     cover_78: 'https://images.pexels.com/photos/1616403/pexels-photo-1616403.jpeg?auto=compress&cs=tinysrgb&w=1200',
//     cover_79: 'https://images.pexels.com/photos/2049422/pexels-photo-2049422.jpeg?auto=compress&cs=tinysrgb&w=1200',
//     cover_80: 'https://images.pexels.com/photos/2832081/pexels-photo-2832081.jpeg?auto=compress&cs=tinysrgb&w=1200',
// };
// const videoMap: { [key: string]: { uri: string; thumbnail: string } } = {
//     video_1: {
//         uri: 'https://assets.mixkit.co/videos/preview/mixkit-daytime-city-traffic-on-a-bridge-4349-large.mp4',
//         thumbnail: 'https://i.vimeocdn.com/video/882484967_640.jpg'
//     },
//     video_2: {
//         uri: 'https://assets.mixkit.co/videos/preview/mixkit-a-hill-covered-with-trees-and-a-path-4258-large.mp4',
//         thumbnail: 'https://i.vimeocdn.com/video/595198863_640.jpg'
//     },
//     video_3: {
//         uri: 'https://assets.mixkit.co/videos/preview/mixkit-clouds-and-blue-sky-2408-large.mp4',
//         thumbnail: 'https://i.vimeocdn.com/video/537367319_640.jpg'
//     },
//     video_4: {
//         uri: 'https://assets.mixkit.co/videos/preview/mixkit-flying-over-the-sea-at-sunset-4826-large.mp4',
//         thumbnail: 'https://i.vimeocdn.com/video/600778114_640.jpg'
//     }
// };
// import { useThemeStore } from '../../stores/theme.store';
// import { useTheme } from '../../providers/ThemeProvider';
// import { GlobalBackground } from '../../components/ui/GlobalBackground';
// import { ImageRepositionModal } from '../../components/ui/ImageRepositionModal';
// import { GlassCard } from '../../components/ui/GlassCard';
// import { Typography } from '../../components/ui/Typography';
// import AsyncStorage from '@react-native-async-storage/async-storage';

// if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
//     UIManager.setLayoutAnimationEnabledExperimental(true);
// }

// const imageKeys = Object.keys(imageMap);

// const videoKeys = Object.keys(videoMap);

// const { width: RAW_WIDTH } = Dimensions.get('window');
// const IS_WEB = Platform.OS === 'web';
// const MAX_CONTENT_WIDTH = 1200;

// const PRESET_COLORS = [
//     '#1A1A24', '#242433', '#111827', '#1E3A8A',
//     '#064E3B', '#701A75', '#7F1D1D', '#FAFAFA',
//     '#EEF2F8', '#FBF0E9', '#D7EBDF',
// ];

// const BLUR_PRESETS = [0, 20, 40, 60, 80, 100];

// // Storage key for custom colors
// const CUSTOM_COLORS_STORAGE_KEY = '@app_custom_colors';

// function animate() {
//     LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
// }

// const PremiumSegmentControl = ({ options, activeValue, onChange, theme }: any) => {
//     return (
//         <View style={{
//             flexDirection: 'row',
//             backgroundColor: theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
//             borderRadius: theme.borderRadius.xl,
//             padding: theme.spacing[1],
//             position: 'relative'
//         }}>
//             {options.map((opt: any, index: number) => {
//                 const isActive = activeValue === opt.value;
//                 return (
//                     <TouchableOpacity
//                         key={opt.value}
//                         activeOpacity={0.8}
//                         onPress={() => {
//                             animate();
//                             onChange(opt.value);
//                         }}
//                         style={{
//                             flex: 1,
//                             flexDirection: 'row',
//                             alignItems: 'center',
//                             justifyContent: 'center',
//                             gap: theme.spacing[2],
//                             paddingVertical: theme.spacing[3],
//                             paddingHorizontal: theme.spacing[2],
//                             borderRadius: theme.borderRadius.lg,
//                             backgroundColor: isActive ? (theme.isDark ? theme.colors.surface : '#FFFFFF') : 'transparent',
//                             ...(isActive ? theme.shadows.sm : {})
//                         }}
//                     >
//                         <AppIcon
//                             name={opt.icon}
//                             size={18}
//                             color={isActive ? theme.colors.primary : theme.colors.textSecondary}
//                         />
//                         <Typography
//                             variant="bodySm"
//                             weight={isActive ? 'bold' : 'medium'}
//                             color={isActive ? 'textPrimary' : 'textSecondary'}
//                         >
//                             {opt.label}
//                         </Typography>
//                     </TouchableOpacity>
//                 );
//             })}
//         </View>
//     );
// };

// export default function AppearanceScreen() {
//     const theme = useTheme();
//     const {
//         backgroundType,
//         backgroundImage,
//         backgroundBlur,
//         setBackgroundType,
//         setBackgroundImage,
//         setBackgroundBlur,
//         backgroundColor,
//         setBackgroundColor,
//         backgroundImagePosition,
//         setBackgroundImagePosition,
//         mode,
//         setMode,
//         backgroundVideo,
//         setBackgroundVideo,
//     } = useThemeStore();

//     const [isRepositionVisible, setIsRepositionVisible] = useState(false);
//     const [customHex, setCustomHex] = useState(backgroundColor || '#000000');
//     const [customColors, setCustomColors] = useState<string[]>([]);
//     const [windowWidth, setWindowWidth] = useState(RAW_WIDTH);
//     const scrollViewRef = useRef<ScrollView>(null);
//     const [imageUrl, setImageUrl] = useState('');

//     // Load custom colors from storage on mount
//     useEffect(() => {
//         loadCustomColors();
//     }, []);

//     // Update customHex when backgroundColor changes from store
//     useEffect(() => {
//         if (backgroundColor) {
//             setCustomHex(backgroundColor);
//         }
//     }, [backgroundColor]);

//     // Set initial imageUrl if backgroundImage is a custom URL
//     useEffect(() => {
//         if (backgroundImage && !imageMap[backgroundImage]) {
//             setImageUrl(backgroundImage);
//         }
//     }, [backgroundImage]);

//     useEffect(() => {
//         const subscription = Dimensions.addEventListener('change', ({ window }) => {
//             setWindowWidth(window.width);
//         });
//         return () => subscription?.remove();
//     }, []);

//     // Load custom colors from AsyncStorage
//     const loadCustomColors = async () => {
//         try {
//             const saved = await AsyncStorage.getItem(CUSTOM_COLORS_STORAGE_KEY);
//             if (saved) {
//                 const colors = JSON.parse(saved);
//                 setCustomColors(colors);
//             }
//         } catch (error) {
//             console.error('Error loading custom colors:', error);
//         }
//     };

//     // Save custom color to AsyncStorage
//     const saveCustomColor = async (color: string) => {
//         if (!/^#[0-9A-F]{6}$/i.test(color)) {
//             Alert.alert('Invalid Color', 'Please enter a valid hex color code (e.g., #FF0000)');
//             return false;
//         }

//         try {
//             // Update the store
//             setBackgroundColor(color);

//             // Update custom colors list (avoid duplicates, keep last 10)
//             const updatedColors = [color, ...customColors.filter(c => c !== color)].slice(0, 10);
//             setCustomColors(updatedColors);

//             // Save to storage
//             await AsyncStorage.setItem(CUSTOM_COLORS_STORAGE_KEY, JSON.stringify(updatedColors));

//             return true;
//         } catch (error) {
//             console.error('Error saving custom color:', error);
//             Alert.alert('Error', 'Failed to save custom color');
//             return false;
//         }
//     };

//     // Delete a custom color
//     const deleteCustomColor = async (color: string) => {
//         try {
//             const updatedColors = customColors.filter(c => c !== color);
//             setCustomColors(updatedColors);
//             await AsyncStorage.setItem(CUSTOM_COLORS_STORAGE_KEY, JSON.stringify(updatedColors));

//             // If the deleted color was the current background, reset to first preset
//             if (backgroundColor === color) {
//                 setBackgroundColor(PRESET_COLORS[0]);
//                 setCustomHex(PRESET_COLORS[0]);
//             }
//         } catch (error) {
//             console.error('Error deleting custom color:', error);
//         }
//     };

//     const isWide = windowWidth >= 900;
//     const isWebDesktop = IS_WEB && isWide;
//     const styles = useStyles(isWide);
//     const isImageMode = backgroundType === 'image';
//     const isVideoMode = backgroundType === 'video';
//     const isColorMode = backgroundType === 'color';

//     const previewUri = isImageMode && backgroundImage ? (imageMap[backgroundImage] || backgroundImage) : null;
//     const videoPreviewUri = isVideoMode && backgroundVideo ? videoMap[backgroundVideo]?.thumbnail : null;

//     const handleTypeChange = (type: 'color' | 'image' | 'video') => {
//         if (type === backgroundType) return;
//         animate();
//         setBackgroundType(type);
//     };

//     const handleImageSelect = (key: string) => {
//         if (key === backgroundImage) return;
//         setBackgroundImage(key);
//         setImageUrl(''); // Clear custom URL input
//     };

//     const handleVideoSelect = (key: string) => {
//         if (key === backgroundVideo) return;
//         setBackgroundVideo(key);
//     };

//     const handleColorSelect = (color: string) => {
//         animate();
//         setBackgroundColor(color);
//         setCustomHex(color);
//     };

//     const handleSetCustomImage = () => {
//         if (imageUrl.trim() !== '') {
//             setBackgroundImage(imageUrl.trim());
//         } else {
//             // If the input is empty, maybe we revert to a default or do nothing.
//             // For now, we do nothing.
//         }
//     };

//     const renderPreview = () => (
//         <GlassCard intensity={theme.isDark ? 30 : 60} style={styles.previewCard}>
//             {(isImageMode || isVideoMode) ? (
//                 <ImageBackground
//                     source={{ uri: isImageMode ? previewUri : videoPreviewUri }}
//                     style={styles.previewImage}
//                     blurRadius={isImageMode ? Math.round((backgroundBlur / 100) * 25) : 0}
//                     resizeMode="cover"
//                 >
//                     <LinearGradient
//                         colors={['rgba(0,0,0,0.3)', 'transparent', 'rgba(0,0,0,0.7)']}
//                         style={styles.previewScrim}
//                     />
//                     <View style={styles.previewTopRow}>
//                         <View style={styles.previewLabelWrap}>
//                             <AppIcon name="sparkles" size={14} color="#FFFFFF" />
//                             <Typography variant="caption" weight="bold" style={{ color: '#FFFFFF' }}>Live Preview</Typography>
//                         </View>
//                         {isImageMode && (
//                             <TouchableOpacity
//                                 style={styles.repositionBtn}
//                                 onPress={() => setIsRepositionVisible(true)}
//                                 activeOpacity={0.8}
//                             >
//                                 <AppIcon name="crop" size={14} color="#FFFFFF" />
//                                 <Typography variant="caption" weight="bold" style={{ color: '#FFFFFF' }}>Edit</Typography>
//                             </TouchableOpacity>
//                         )}
//                     </View>
//                     <View style={styles.previewMockContent}>
//                         <View style={{ backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 14, padding: 10, width: '100%', marginBottom: 6 }}>
//                             <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
//                                 <Typography variant="caption" weight="bold" style={{ color: '#FFFFFF' }}>🌴 Goa Trip 2026</Typography>
//                                 <Typography variant="caption" weight="bold" style={{ color: '#34D399' }}>₹24,500</Typography>
//                             </View>
//                             <View style={{ flexDirection: 'row', gap: 6 }}>
//                                 <View style={{ backgroundColor: 'rgba(255,255,255,0.25)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
//                                     <Typography variant="caption" style={{ color: '#FFFFFF', fontSize: 10 }}>4 Members</Typography>
//                                 </View>
//                                 <View style={{ backgroundColor: 'rgba(52,211,153,0.3)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
//                                     <Typography variant="caption" style={{ color: '#34D399', fontSize: 10 }}>Settled</Typography>
//                                 </View>
//                             </View>
//                         </View>
//                         <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, width: '100%' }}>
//                             <View style={[styles.mockAvatar, { backgroundColor: theme.colors.primary }]} />
//                             <View style={styles.mockLines}>
//                                 <View style={[styles.mockLine, { width: '80%', backgroundColor: 'rgba(255,255,255,0.85)' }]} />
//                                 <View style={[styles.mockLine, { width: '45%', backgroundColor: 'rgba(255,255,255,0.5)' }]} />
//                             </View>
//                         </View>
//                     </View>
//                 </ImageBackground>
//             ) : (
//                 <View style={[styles.previewImage, styles.previewSolid, { backgroundColor: backgroundColor || theme.colors.card }]}>
//                     <LinearGradient
//                         colors={['rgba(0,0,0,0.1)', 'transparent', 'rgba(0,0,0,0.5)']}
//                         style={styles.previewScrim}
//                     />
//                     <View style={styles.previewTopRow}>
//                         <View style={[styles.previewLabelWrap, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
//                             <AppIcon name="palette" size={14} color="#FFFFFF" />
//                             <Typography variant="caption" weight="bold" style={{ color: '#FFFFFF' }}>Solid Color</Typography>
//                         </View>
//                     </View>
//                     <View style={styles.previewMockContent}>
//                         <View style={{ backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 14, padding: 10, width: '100%', marginBottom: 6 }}>
//                             <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
//                                 <Typography variant="caption" weight="bold" style={{ color: '#FFFFFF' }}>🌴 Goa Trip 2026</Typography>
//                                 <Typography variant="caption" weight="bold" style={{ color: '#34D399' }}>₹24,500</Typography>
//                             </View>
//                             <View style={{ flexDirection: 'row', gap: 6 }}>
//                                 <View style={{ backgroundColor: 'rgba(255,255,255,0.25)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
//                                     <Typography variant="caption" style={{ color: '#FFFFFF', fontSize: 10 }}>4 Members</Typography>
//                                 </View>
//                                 <View style={{ backgroundColor: 'rgba(52,211,153,0.3)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
//                                     <Typography variant="caption" style={{ color: '#34D399', fontSize: 10 }}>Settled</Typography>
//                                 </View>
//                             </View>
//                         </View>
//                         <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, width: '100%' }}>
//                             <View style={[styles.mockAvatar, { backgroundColor: theme.colors.primary }]} />
//                             <View style={styles.mockLines}>
//                                 <View style={[styles.mockLine, { width: '80%', backgroundColor: 'rgba(255,255,255,0.85)' }]} />
//                                 <View style={[styles.mockLine, { width: '45%', backgroundColor: 'rgba(255,255,255,0.5)' }]} />
//                             </View>
//                         </View>
//                     </View>
//                 </View>
//             )}
//         </GlassCard>
//     );

//     const renderControls = () => (
//         <View style={styles.controlsContainer}>
//             {/* Theme Mode */}
//             <GlassCard style={styles.section}>
//                 <View style={styles.sectionHeader}>
//                     <AppIcon name="sparkles" size={20} color={theme.colors.primary} />
//                     <Typography variant="h3" weight="bold">App Theme</Typography>
//                 </View>
//                 <PremiumSegmentControl
//                     theme={theme}
//                     activeValue={mode}
//                     onChange={setMode}
//                     options={[
//                         { label: 'System', value: 'system', icon: 'smartphone' },
//                         { label: 'Light', value: 'light', icon: 'sun' },
//                         { label: 'Dark', value: 'dark', icon: 'moon' }
//                     ]}
//                 />
//             </GlassCard>

//             {/* Background type */}
//             <GlassCard style={styles.section}>
//                 <View style={styles.sectionHeader}>
//                     <AppIcon name="layers" size={20} color={theme.colors.primary} />
//                     <Typography variant="h3" weight="bold">Background Style</Typography>
//                 </View>
//                 <PremiumSegmentControl
//                     theme={theme}
//                     activeValue={backgroundType}
//                     onChange={handleTypeChange}
//                     options={[
//                         { label: 'Solid Color', value: 'color', icon: 'palette' },
//                         { label: 'Photo Cover', value: 'image', icon: 'image' },
//                         { label: 'Video', value: 'video', icon: 'film' }
//                     ]}
//                 />
//             </GlassCard>

//             {isImageMode && (
//                 <>
//                     {/* Custom Image URL */}
//                     <GlassCard style={styles.section}>
//                         <View style={styles.sectionHeader}>
//                             <AppIcon name="link" size={20} color={theme.colors.primary} />
//                             <Typography variant="h3" weight="bold">Custom Image URL</Typography>
//                         </View>
//                         <View style={styles.customColorRow}>
//                             <TextInput
//                                 style={[
//                                     styles.customColorInput,
//                                     {
//                                         color: theme.colors.textPrimary,
//                                         borderColor: theme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
//                                         backgroundColor: theme.isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)'
//                                     },
//                                 ]}
//                                 value={imageUrl}
//                                 onChangeText={setImageUrl}
//                                 placeholder="Paste image URL here"
//                                 placeholderTextColor={theme.colors.textTertiary}
//                                 returnKeyType="done"
//                                 onSubmitEditing={handleSetCustomImage}
//                             />
//                             <TouchableOpacity
//                                 style={[styles.saveColorButton, { backgroundColor: theme.colors.primary }]}
//                                 onPress={handleSetCustomImage}
//                             >
//                                 <AppIcon name="check" size={20} color="#FFFFFF" />
//                             </TouchableOpacity>
//                         </View>
//                     </GlassCard>

//                     {/* Cover image gallery */}
//                     <GlassCard style={styles.section}>
//                         <View style={styles.sectionHeader}>
//                             <AppIcon name="image" size={20} color={theme.colors.primary} />
//                             <Typography variant="h3" weight="bold" style={{ flex: 1 }}>Select Cover</Typography>
//                             <View style={[styles.badge, { backgroundColor: theme.colors.primary + '20' }]}>
//                                 <Typography variant="caption" weight="bold" color="primary">{imageKeys.length} available</Typography>
//                             </View>
//                         </View>

//                         <ScrollView
//                             ref={scrollViewRef}
//                             horizontal
//                             showsHorizontalScrollIndicator={false}
//                             contentContainerStyle={styles.galleryContainer}
//                             snapToInterval={116}
//                             decelerationRate="fast"
//                         >
//                             {imageKeys.map((key) => {
//                                 const selected = backgroundImage === key;
//                                 return (
//                                     <TouchableOpacity
//                                         key={key}
//                                         activeOpacity={0.8}
//                                         style={[
//                                             styles.galleryImageContainer,
//                                             selected && styles.galleryImageContainerSelected,
//                                             { marginRight: theme.spacing[3] }
//                                         ]}
//                                         onPress={() => handleImageSelect(key)}
//                                     >
//                                         <Image source={{ uri: imageMap[key].thumbnail }} style={styles.galleryImage} resizeMode="cover" />
//                                         {selected && (
//                                             <View style={[styles.checkBadge, { backgroundColor: theme.colors.primary }]}>
//                                                 <AppIcon name="check" size={16} color="#FFFFFF" />
//                                             </View>
//                                         )}
//                                         <LinearGradient
//                                             colors={['transparent', 'rgba(0,0,0,0.3)']}
//                                             style={styles.imageGradient}
//                                         />
//                                     </TouchableOpacity>
//                                 );
//                             })}
//                         </ScrollView>
//                     </GlassCard>

//                     {/* ── Blur Intensity ── */}
//                     <GlassCard style={styles.section}>
//                         <View style={styles.sectionHeader}>
//                             <AppIcon name="droplets" size={20} color={theme.colors.primary} />
//                             <Typography variant="h3" weight="bold" style={{ flex: 1 }}>Blur Intensity</Typography>
//                             <View style={[styles.badge, { backgroundColor: theme.colors.primary + '20' }]}>
//                                 <Typography variant="caption" weight="bold" color="primary">{Math.round(backgroundBlur)}%</Typography>
//                             </View>
//                         </View>
//                         <View style={styles.blurSliderContainer}>
//                             <AppIcon name="eye" size={16} color={theme.colors.textSecondary} />
//                             <Slider
//                                 style={styles.slider}
//                                 minimumValue={0}
//                                 maximumValue={100}
//                                 step={1}
//                                 value={backgroundBlur}
//                                 onValueChange={setBackgroundBlur}
//                                 minimumTrackTintColor={theme.colors.primary}
//                                 maximumTrackTintColor={theme.isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)'}
//                                 thumbTintColor={theme.colors.primary}
//                             />
//                             <AppIcon name="eye-off" size={16} color={theme.colors.textSecondary} />
//                         </View>
//                         <View style={styles.blurChipRow}>
//                             {[0, 25, 50, 75, 100].map(val => (
//                                 <TouchableOpacity
//                                     key={val}
//                                     onPress={() => setBackgroundBlur(val)}
//                                     style={[
//                                         styles.blurChip,
//                                         {
//                                             backgroundColor: Math.abs(backgroundBlur - val) < 5
//                                                 ? theme.colors.primary + '25'
//                                                 : theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
//                                             borderWidth: 1,
//                                             borderColor: Math.abs(backgroundBlur - val) < 5
//                                                 ? theme.colors.primary + '60'
//                                                 : 'transparent',
//                                         }
//                                     ]}
//                                 >
//                                     <Typography
//                                         variant="caption"
//                                         weight={Math.abs(backgroundBlur - val) < 5 ? 'bold' : 'medium'}
//                                         color={Math.abs(backgroundBlur - val) < 5 ? 'primary' : 'textSecondary'}
//                                     >
//                                         {val}%
//                                     </Typography>
//                                 </TouchableOpacity>
//                             ))}
//                         </View>
//                     </GlassCard>
//                 </>
//             )}

//             {isVideoMode && (
//                  <GlassCard style={styles.section}>
//                  <View style={styles.sectionHeader}>
//                      <AppIcon name="film" size={20} color={theme.colors.primary} />
//                      <Typography variant="h3" weight="bold" style={{ flex: 1 }}>Select Video</Typography>
//                      <View style={[styles.badge, { backgroundColor: theme.colors.primary + '20' }]}>
//                          <Typography variant="caption" weight="bold" color="primary">{videoKeys.length} available</Typography>
//                      </View>
//                  </View>

//                  <ScrollView
//                      ref={scrollViewRef}
//                      horizontal
//                      showsHorizontalScrollIndicator={false}
//                      contentContainerStyle={styles.galleryContainer}
//                      snapToInterval={116}
//                      decelerationRate="fast"
//                  >
//                      {videoKeys.map((key) => {
//                          const selected = backgroundVideo === key;
//                          return (
//                              <TouchableOpacity
//                                  key={key}
//                                  activeOpacity={0.8}
//                                  style={[
//                                      styles.galleryImageContainer,
//                                      selected && styles.galleryImageContainerSelected,
//                                      { marginRight: theme.spacing[3] }
//                                  ]}
//                                  onPress={() => handleVideoSelect(key)}
//                              >
//                                  <Image source={{ uri: videoMap[key].thumbnail }} style={styles.galleryImage} resizeMode="cover" />
//                                  {selected && (
//                                      <View style={[styles.checkBadge, { backgroundColor: theme.colors.primary }]}>
//                                          <AppIcon name="check" size={16} color="#FFFFFF" />
//                                      </View>
//                                  )}
//                                  <LinearGradient
//                                      colors={['transparent', 'rgba(0,0,0,0.3)']}
//                                      style={styles.imageGradient}
//                                  />
//                              </TouchableOpacity>
//                          );
//                      })}
//                  </ScrollView>
//              </GlassCard>
//             )}

//             {isColorMode && (
//                 <>
//                     <GlassCard style={styles.section}>
//                         <View style={styles.sectionHeader}>
//                             <AppIcon name="palette" size={20} color={theme.colors.primary} />
//                             <Typography variant="h3" weight="bold">Preset Colors</Typography>
//                         </View>
//                         <View style={styles.colorGrid}>
//                             {PRESET_COLORS.map((c) => {
//                                 const selected = backgroundColor === c;
//                                 return (
//                                     <TouchableOpacity
//                                         key={c}
//                                         style={[
//                                             styles.colorSwatch,
//                                             { backgroundColor: c },
//                                             selected && { borderColor: theme.colors.primary, borderWidth: 3 },
//                                         ]}
//                                         onPress={() => handleColorSelect(c)}
//                                     >
//                                         {selected && (
//                                             <AppIcon
//                                                 name="check"
//                                                 size={20}
//                                                 color={
//                                                     ['#FAFAFA', '#EEF2F8', '#FBF0E9', '#D7EBDF'].includes(c) ? '#000' : '#FFF'
//                                                 }
//                                             />
//                                         )}
//                                     </TouchableOpacity>
//                                 );
//                             })}
//                         </View>
//                     </GlassCard>

//                     {/* Custom Color Section */}
//                     <GlassCard style={styles.section}>
//                         <View style={styles.sectionHeader}>
//                             <AppIcon name="paint-bucket" size={20} color={theme.colors.primary} />
//                             <Typography variant="h3" weight="bold">Custom Color</Typography>
//                         </View>

//                         <View style={styles.customColorRow}>
//                             <TouchableOpacity
//                                 style={[styles.customColorPreview, { backgroundColor: customHex }]}
//                                 onPress={() => {
//                                     // You can add a color picker here if desired
//                                 }}
//                             />
//                             <TextInput
//                                 style={[
//                                     styles.customColorInput,
//                                     {
//                                         color: theme.colors.textPrimary,
//                                         borderColor: theme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
//                                         backgroundColor: theme.isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)'
//                                     },
//                                 ]}
//                                 value={customHex}
//                                 onChangeText={(text) => {
//                                     setCustomHex(text);
//                                     // Auto-apply if valid hex
//                                     if (/^#[0-9A-F]{6}$/i.test(text)) {
//                                         setBackgroundColor(text);
//                                     }
//                                 }}
//                                 onBlur={() => {
//                                     if (/^#[0-9A-F]{6}$/i.test(customHex)) {
//                                         saveCustomColor(customHex);
//                                     }
//                                 }}
//                                 onSubmitEditing={() => {
//                                     if (/^#[0-9A-F]{6}$/i.test(customHex)) {
//                                         saveCustomColor(customHex);
//                                     }
//                                 }}
//                                 maxLength={7}
//                                 placeholder="#000000"
//                                 placeholderTextColor={theme.colors.textTertiary}
//                                 autoCapitalize="characters"
//                                 returnKeyType="done"
//                             />
//                             <TouchableOpacity
//                                 style={[styles.saveColorButton, { backgroundColor: theme.colors.primary }]}
//                                 onPress={() => {
//                                     if (/^#[0-9A-F]{6}$/i.test(customHex)) {
//                                         saveCustomColor(customHex);
//                                     } else {
//                                         Alert.alert('Invalid Color', 'Please enter a valid hex color code (e.g., #FF0000)');
//                                     }
//                                 }}
//                             >
//                                 <AppIcon name="check" size={20} color="#FFFFFF" />
//                             </TouchableOpacity>
//                         </View>
//                     </GlassCard>

//                     {/* Custom Colors History */}
//                     {customColors.length > 0 && (
//                         <GlassCard style={styles.section}>
//                             <View style={styles.sectionHeader}>
//                                 <AppIcon name="time" size={20} color={theme.colors.primary} />
//                                 <Typography variant="h3" weight="bold" style={{ flex: 1 }}>Recent Colors</Typography>
//                                 <TouchableOpacity
//                                     onPress={() => {
//                                         Alert.alert(
//                                             'Clear Recent Colors',
//                                             'Are you sure you want to clear all recently used colors?',
//                                             [
//                                                 { text: 'Cancel', style: 'cancel' },
//                                                 {
//                                                     text: 'Clear',
//                                                     style: 'destructive',
//                                                     onPress: async () => {
//                                                         setCustomColors([]);
//                                                         await AsyncStorage.removeItem(CUSTOM_COLORS_STORAGE_KEY);
//                                                     }
//                                                 }
//                                             ]
//                                         );
//                                     }}
//                                 >
//                                     <Typography variant="caption" color="textSecondary">Clear All</Typography>
//                                 </TouchableOpacity>
//                             </View>

//                             <View style={styles.colorGrid}>
//                                 {customColors.map((color) => (
//                                     <TouchableOpacity
//                                         key={color}
//                                         style={[
//                                             styles.colorSwatch,
//                                             { backgroundColor: color },
//                                             backgroundColor === color && { borderColor: theme.colors.primary, borderWidth: 3 },
//                                         ]}
//                                         onPress={() => handleColorSelect(color)}
//                                         onLongPress={() => {
//                                             Alert.alert(
//                                                 'Delete Color',
//                                                 `Delete ${color} from recent colors?`,
//                                                 [
//                                                     { text: 'Cancel', style: 'cancel' },
//                                                     { text: 'Delete', style: 'destructive', onPress: () => deleteCustomColor(color) }
//                                                 ]
//                                             );
//                                         }}
//                                     >
//                                         {backgroundColor === color && (
//                                             <AppIcon
//                                                 name="check"
//                                                 size={20}
//                                                 color={['#FAFAFA', '#EEF2F8', '#FBF0E9', '#D7EBDF'].includes(color) ? '#000' : '#FFF'}
//                                             />
//                                         )}
//                                     </TouchableOpacity>
//                                 ))}
//                             </View>
//                             <Typography variant="caption" color="textSecondary" style={{ marginTop: theme.spacing[2] }}>
//                                 Long press to delete a color
//                             </Typography>
//                         </GlassCard>
//                     )}
//                 </>
//             )}
//         </View>
//     );

//     return (
//         <GlobalBackground>
//             <View style={[styles.webDesktopContent, isWebDesktop && styles.webDesktopContentCentered]}>
//                 {isWide ? (
//                     // Wide layout - Split view
//                     <View style={styles.wideContainer}>
//                         <View style={styles.sidebar}>
//                             <ScrollView
//                                 contentContainerStyle={styles.sidebarContent}
//                                 showsVerticalScrollIndicator={false}
//                             >
//                                 {renderControls()}
//                             </ScrollView>
//                         </View>
//                         <View style={styles.previewWrapper}>
//                             <View style={styles.previewSticky}>
//                                 <Typography variant="h3" weight="bold" style={{ marginBottom: theme.spacing[4], color: theme.isDark ? '#FFFFFF' : theme.colors.textPrimary }}>Live Preview</Typography>
//                                 {renderPreview()}
//                             </View>
//                         </View>
//                     </View>
//                 ) : (
//                     // Mobile layout - Vertical scroll
//                     <ScrollView
//                         style={styles.scroll}
//                         contentContainerStyle={styles.scrollContent}
//                         showsVerticalScrollIndicator={false}
//                     >
//                         <View style={styles.previewMobileHeader}>
//                             <Typography variant="h3" weight="bold" style={{ marginBottom: theme.spacing[3], color: theme.isDark ? '#FFFFFF' : theme.colors.textPrimary }}>Live Preview</Typography>
//                             {renderPreview()}
//                         </View>
//                         {renderControls()}
//                     </ScrollView>
//                 )}
//                 <ImageRepositionModal
//                     visible={isRepositionVisible}
//                     imageUri={previewUri}
//                     initialPosition={backgroundImagePosition}
//                     onCancel={() => setIsRepositionVisible(false)}
//                     onSave={(pos) => {
//                         setBackgroundImagePosition(pos);
//                         setIsRepositionVisible(false);
//                     }}
//                     accentColor={theme.colors.primary}
//                 />
//             </View>
//         </GlobalBackground>
//     );
// }

// const useStyles = (isWide: boolean) => {
//     const theme = useTheme();
//     return StyleSheet.create({
//         webDesktopContent: { flex: 1, width: '100%' },
//         webDesktopContentCentered: { maxWidth: MAX_CONTENT_WIDTH, alignSelf: 'center' },

//         // Wide Layout
//         wideContainer: {
//             flex: 1,
//             flexDirection: 'row',
//             maxWidth: MAX_CONTENT_WIDTH,
//             alignSelf: 'center',
//             width: '100%',
//         },
//         sidebar: {
//             flex: 1,
//             minWidth: 350,
//             maxWidth: 600,
//             borderRightWidth: isWide ? 1 : 0,
//             borderRightColor: theme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
//         },
//         sidebarContent: {
//             padding: theme.spacing[6],
//             paddingTop: theme.spacing[6],
//         },
//         previewWrapper: {
//             flex: 1,
//             minWidth: 300,
//             padding: theme.spacing[8],
//             justifyContent: 'center',
//             alignItems: 'center',
//         },
//         previewSticky: {
//             position: 'sticky' as any,
//             top: theme.spacing[8],
//             width: '100%',
//             maxWidth: 400,
//             alignSelf: 'center',
//         },

//         // Mobile Layout
//         scroll: {
//             flex: 1,
//             backgroundColor: 'transparent',
//         },
//         scrollContent: {
//             paddingBottom: theme.spacing[12],
//         },
//         previewMobileHeader: {
//             padding: theme.spacing[4],
//             paddingBottom: theme.spacing[2],
//         },

//         // Controls Container
//         controlsContainer: {
//             padding: isWide ? 0 : theme.spacing[4],
//             paddingTop: isWide ? 0 : theme.spacing[2],
//             gap: theme.spacing[4],
//         },

//         // Section Styles
//         section: {
//             padding: theme.spacing[5],
//         },
//         sectionHeader: {
//             flexDirection: 'row',
//             alignItems: 'center',
//             gap: theme.spacing[2],
//             marginBottom: theme.spacing[4],
//         },
//         badge: {
//             paddingHorizontal: theme.spacing[2],
//             paddingVertical: theme.spacing[1],
//             borderRadius: theme.borderRadius.full,
//         },

//         // Preview Card
//         previewCard: {
//             borderRadius: theme.borderRadius['2xl'],
//             borderWidth: 1,
//             borderColor: theme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
//             shadowColor: '#000',
//             shadowOffset: { width: 0, height: 12 },
//             shadowOpacity: 0.15,
//             shadowRadius: 24,
//             elevation: 8,
//         },
//         previewImage: {
//             width: '100%',
//             height: isWide ? 420 : 280,
//             justifyContent: 'space-between',
//         },
//         previewSolid: {
//             justifyContent: 'space-between',
//         },
//         previewScrim: {
//             position: 'absolute',
//             left: 0,
//             right: 0,
//             bottom: 0,
//             height: '80%',
//         },
//         previewTopRow: {
//             flexDirection: 'row',
//             alignItems: 'center',
//             justifyContent: 'space-between',
//             padding: theme.spacing[4],
//         },
//         previewLabelWrap: {
//             flexDirection: 'row',
//             alignItems: 'center',
//             gap: theme.spacing[2],
//             backgroundColor: 'rgba(0,0,0,0.5)',
//             paddingHorizontal: theme.spacing[3],
//             paddingVertical: theme.spacing[1],
//             borderRadius: theme.borderRadius.full,
//         },
//         repositionBtn: {
//             backgroundColor: 'rgba(0,0,0,0.6)',
//             flexDirection: 'row',
//             alignItems: 'center',
//             gap: theme.spacing[1],
//             paddingHorizontal: theme.spacing[3],
//             paddingVertical: theme.spacing[1],
//             borderRadius: theme.borderRadius.full,
//         },
//         previewMockContent: {
//             padding: theme.spacing[5],
//             flexDirection: 'row',
//             alignItems: 'center',
//             gap: theme.spacing[4],
//         },
//         mockAvatar: {
//             width: 48,
//             height: 48,
//             borderRadius: 24,
//             borderWidth: 2,
//             borderColor: '#FFFFFF',
//             shadowColor: '#000',
//             shadowOpacity: 0.2,
//             shadowRadius: 4,
//             shadowOffset: { width: 0, height: 2 },
//         },
//         mockLines: {
//             flex: 1,
//             gap: theme.spacing[2],
//         },
//         mockLine: {
//             height: 12,
//             borderRadius: theme.borderRadius.full,
//         },

//         // Color Grid
//         colorGrid: {
//             flexDirection: 'row',
//             flexWrap: 'wrap',
//             gap: theme.spacing[3],
//             marginBottom: theme.spacing[4],
//         },
//         colorSwatch: {
//             width: 44,
//             height: 44,
//             borderRadius: 22,
//             alignItems: 'center',
//             justifyContent: 'center',
//             borderWidth: 1,
//             borderColor: theme.isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)',
//             shadowColor: '#000',
//             shadowOffset: { width: 0, height: 2 },
//             shadowOpacity: 0.1,
//             shadowRadius: 4,
//             elevation: 2,
//         },
//         customColorRow: {
//             flexDirection: 'row',
//             alignItems: 'center',
//             gap: theme.spacing[3],
//         },
//         customColorPreview: {
//             width: 44,
//             height: 44,
//             borderRadius: 22,
//             borderWidth: 1,
//             borderColor: theme.isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)',
//         },
//         customColorInput: {
//             flex: 1,
//             height: 48,
//             borderWidth: 1,
//             borderRadius: theme.borderRadius.xl,
//             paddingHorizontal: theme.spacing[4],
//             fontSize: 16,
//             fontWeight: '600',
//             fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
//         },
//         saveColorButton: {
//             width: 44,
//             height: 44,
//             borderRadius: 22,
//             alignItems: 'center',
//             justifyContent: 'center',
//             shadowColor: '#000',
//             shadowOffset: { width: 0, height: 2 },
//             shadowOpacity: 0.2,
//             shadowRadius: 4,
//             elevation: 4,
//         },

//         // Image Gallery
//         galleryContainer: {
//             paddingVertical: theme.spacing[2],
//             paddingRight: theme.spacing[4],
//             paddingLeft: theme.spacing[1],
//         },
//         galleryImageContainer: {
//             width: 110,
//             height: 154,
//             borderRadius: theme.borderRadius.xl,
//             overflow: 'hidden',
//             borderWidth: 2,
//             borderColor: 'transparent',
//             position: 'relative',
//             backgroundColor: theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
//         },
//         galleryImageContainerSelected: {
//             borderColor: theme.colors.primary,
//             transform: [{ scale: 1.05 }],
//         },
//         galleryImage: {
//             width: '100%',
//             height: '100%',
//         },
//         imageGradient: {
//             position: 'absolute',
//             bottom: 0,
//             left: 0,
//             right: 0,
//             height: '40%',
//         },
//         checkBadge: {
//             position: 'absolute',
//             top: 8,
//             right: 8,
//             width: 24,
//             height: 24,
//             borderRadius: 12,
//             alignItems: 'center',
//             justifyContent: 'center',
//             shadowColor: '#000',
//             shadowOffset: { width: 0, height: 2 },
//             shadowOpacity: 0.3,
//             shadowRadius: 4,
//             elevation: 4,
//         },

//         // Blur Controls
//         blurSliderContainer: {
//             flexDirection: 'row',
//             alignItems: 'center',
//             gap: theme.spacing[3],
//             marginBottom: theme.spacing[4],
//         },
//         slider: {
//             flex: 1,
//             height: 40,
//         },
//         blurChipRow: {
//             flexDirection: 'row',
//             justifyContent: 'space-between',
//             alignItems: 'center',
//             gap: theme.spacing[2],
//         },
//         blurChip: {
//             flex: 1,
//             alignItems: 'center',
//             justifyContent: 'center',
//             paddingVertical: theme.spacing[2],
//             borderRadius: theme.borderRadius.lg,
//         },
//     });
// };

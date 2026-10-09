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
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, { FadeInDown, Layout } from 'react-native-reanimated';

import { useThemeStore } from '../../stores/theme.store';
import { useTheme } from '../../providers/ThemeProvider';
import { GlobalBackground } from '../../components/ui/GlobalBackground';
import { ImageRepositionModal } from '../../components/ui/ImageRepositionModal';
import { GlassCard } from '../../components/ui/GlassCard';
import AppIcon from '../../components/common/AppIcon';
import { haptics } from '../../utils/haptics';
import { fontFamilies, FontPreset, type Theme } from '../../theme';
import { ThemePreset } from '../../theme/presets';
import { TripTabs } from '../../components/ui/TripTabs';

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

const isLightColor = (hex: string): boolean => {
  if (!hex || !hex.startsWith('#')) return false;
  const c = hex.replace('#', '');
  if (c.length !== 6) return false;
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  return 0.299 * r + 0.587 * g + 0.114 * b > 175;
};

const THEME_PALETTES: {
  id: ThemePreset;
  label: string;
  sub: string;
  accentColor: string;
  tag: string;
}[] = [
  {
    id: 'midnight',
    label: 'Midnight Indigo',
    sub: 'Electric indigo on deep onyx (Modern Fintech)',
    accentColor: '#6366F1',
    tag: 'RECOMMENDED',
  },
  {
    id: 'aurora',
    label: 'Northern Aurora',
    sub: 'Electric teal & mint glow',
    accentColor: '#0D9488',
    tag: 'POPULAR',
  },
  {
    id: 'ocean',
    label: 'Pacific Ocean',
    sub: 'Marine cyan & deep navy',
    accentColor: '#0284C7',
    tag: 'FRESH',
  },
  {
    id: 'monochrome',
    label: 'Studio Minimal',
    sub: 'Pure Swiss grayscale & sharp contrast',
    accentColor: '#18181B',
    tag: 'MINIMAL',
  },
  {
    id: 'forest',
    label: 'Alpine Forest',
    sub: 'Rich pine sage & earthy moss',
    accentColor: '#059669',
    tag: 'NATURE',
  },
  {
    id: 'sunset',
    label: 'Sunset Horizon',
    sub: 'Warm terracotta & Tuscan coral',
    accentColor: '#EA580C',
    tag: 'WARM',
  },
  {
    id: 'gold',
    label: 'Royal Champagne',
    sub: 'Luxury gold & warm bronze',
    accentColor: '#D97706',
    tag: 'LUXURY',
  },
  {
    id: 'rose',
    label: 'Velvet Rose',
    sub: 'Subtle blush coral & warm berry',
    accentColor: '#E11D48',
    tag: 'ELEGANT',
  },
  {
    id: 'light',
    label: 'Classic Light',
    sub: 'Standard clean daylight interface',
    accentColor: '#4F46E5',
    tag: 'DEFAULT',
  },
  {
    id: 'dark',
    label: 'Classic Dark',
    sub: 'Standard dark theme interface',
    accentColor: '#818CF8',
    tag: 'DARK',
  },
];

const PRESET_COLORS = [
  // OLED & Deep Modern Dark (Fintech / Linear / Apple style)
  '#000000', // AMOLED Pitch Black
  '#09090B', // Zinc 950 Onyx
  '#0F172A', // Slate 950 Deep Midnight
  '#18181B', // Modern Carbon Graphite

  // Atmospheric Jewel Depths (Subtle, luxurious, non-fatiguing)
  '#0B132B', // Deep Abyss Navy
  '#0A1C16', // Alpine Forest Shadow
  '#181124', // Velvet Twilight Plum
  '#1D1412', // Espresso Noir

  // Crisp Studio Minimal (Light backgrounds)
  '#FFFFFF', // Studio Pure White
  '#F8FAFC', // Slate 50 Crisp Paper
  '#F1F5F9', // Slate 100 Cool Porcelain
  '#FAF5EE', // Warm Alabaster Linen

  // Soft Architectural Mists (2-3% ambient glass tints)
  '#EEF2FF', // Glacier Indigo Mist
  '#F0FDFA', // Mint Sage Whisper
  '#FDF2F8', // Rose Silk
  '#FEFCE8', // Warm Champagne Light
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
    preset,
    setPreset,
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
    fontPreset,
    setFontPreset,
    cardStyle,
    setCardStyle,
  } = useThemeStore();

  const [activeCategory, setActiveCategory] = useState<
    'theme' | 'canvas' | 'typography'
  >('theme');
  const [showMobilePreview, setShowMobilePreview] = useState(true);
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

  // ─── Reusable Glass Panel Card ─────────────────────────────
  const AppearancePanel = ({
    children,
    style,
  }: {
    children: React.ReactNode;
    style?: any;
  }) => (
    <GlassCard
      intensity={theme.isDark ? 20 : 32}
      style={[styles.panelCard, style]}
    >
      {children}
    </GlassCard>
  );

  // ─── Control Panels ─────────────────────────────────────────
  const renderControlPanels = () => (
    <View style={styles.controlsStack}>
      {/* ── Top Category Tabs ── */}
      <View style={styles.categoryTabsWrap}>
        <TripTabs<'theme' | 'canvas' | 'typography'>
          tabs={[
            { id: 'theme', label: 'Theme & Accents', icon: 'sparkles' },
            { id: 'canvas', label: 'Canvas Wallpaper', icon: 'image' },
            { id: 'typography', label: 'Typography & Cards', icon: 'type' },
          ]}
          activeTab={activeCategory}
          onChange={(tab: 'theme' | 'canvas' | 'typography') => {
            haptics.selection();
            setActiveCategory(tab);
          }}
          variant="segmented"
          size="md"
        />
      </View>

      {/* ── TAB 1: THEME & ACCENTS ── */}
      {activeCategory === 'theme' && (
        <Animated.View
          entering={FadeInDown.duration(200)}
          style={styles.categoryStack}
        >
          {/* App Theme Mode Panel */}
          <AppearancePanel>
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
                  style={[
                    styles.panelTitle,
                    { color: theme.colors.textPrimary },
                  ]}
                >
                  Interface Theme
                </Text>
                <Text
                  style={[
                    styles.panelSub,
                    { color: theme.colors.textTertiary },
                  ]}
                >
                  Select default surface mode
                </Text>
              </View>
            </View>

            <BentoSegmentControl
              activeValue={mode}
              onChange={setMode}
              options={[
                {
                  label: 'System Default',
                  value: 'system',
                  icon: 'smartphone',
                },
                { label: 'Light', value: 'light', icon: 'sun' },
                { label: 'Dark', value: 'dark', icon: 'moon' },
              ]}
            />
          </AppearancePanel>

          {/* Theme Color Scheme / Accent Palette */}
          <AppearancePanel>
            <View style={styles.panelHeader}>
              <View
                style={[
                  styles.panelIconAura,
                  { backgroundColor: `${theme.colors.primary}15` },
                ]}
              >
                <AppIcon
                  name="sparkles"
                  size={16}
                  color={theme.colors.primary}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.panelTitle,
                    { color: theme.colors.textPrimary },
                  ]}
                >
                  Color Theme & Accents
                </Text>
                <Text
                  style={[
                    styles.panelSub,
                    { color: theme.colors.textTertiary },
                  ]}
                >
                  Signature palette for buttons, tabs & highlights
                </Text>
              </View>
            </View>

            <View style={{ gap: 8, marginTop: 4 }}>
              {THEME_PALETTES.map(pal => {
                const isSelected = (preset || 'midnight') === pal.id;
                return (
                  <Pressable
                    key={pal.id}
                    onPress={() => {
                      haptics.selection();
                      setPreset(pal.id);
                    }}
                    style={[
                      {
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingHorizontal: 14,
                        paddingVertical: 12,
                        borderRadius: 14,
                        borderWidth: 1.5,
                        backgroundColor: isSelected
                          ? theme.isDark
                            ? 'rgba(255,255,255,0.08)'
                            : 'rgba(15,23,42,0.04)'
                          : theme.isDark
                            ? 'rgba(255,255,255,0.03)'
                            : 'rgba(0,0,0,0.02)',
                        borderColor: isSelected
                          ? theme.colors.primary
                          : theme.isDark
                            ? 'rgba(255,255,255,0.06)'
                            : 'rgba(0,0,0,0.04)',
                      },
                    ]}
                  >
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 12,
                        flex: 1,
                        marginRight: 8,
                      }}
                    >
                      <View
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: 12,
                          backgroundColor: pal.accentColor,
                          borderWidth: 2,
                          borderColor: 'rgba(255,255,255,0.3)',
                        }}
                      />
                      <View style={{ flex: 1 }}>
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 8,
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 14,
                              fontWeight: isSelected ? '800' : '600',
                              color: theme.colors.textPrimary,
                            }}
                          >
                            {pal.label}
                          </Text>
                          {pal.tag && (
                            <View
                              style={{
                                paddingHorizontal: 6,
                                paddingVertical: 2,
                                borderRadius: 6,
                                backgroundColor: `${pal.accentColor}18`,
                              }}
                            >
                              <Text
                                style={{
                                  fontSize: 10,
                                  fontWeight: '700',
                                  color: pal.accentColor,
                                }}
                              >
                                {pal.tag}
                              </Text>
                            </View>
                          )}
                        </View>
                        <Text
                          style={{
                            fontSize: 12,
                            marginTop: 2,
                            color: isSelected
                              ? theme.colors.textPrimary
                              : theme.colors.textSecondary,
                          }}
                        >
                          {pal.sub}
                        </Text>
                      </View>
                    </View>

                    <View
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: 11,
                        borderWidth: 1.5,
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderColor: isSelected
                          ? theme.colors.primary
                          : theme.colors.borderLight,
                        backgroundColor: isSelected
                          ? theme.colors.primary
                          : 'transparent',
                      }}
                    >
                      {isSelected && (
                        <AppIcon
                          name="check"
                          size={13}
                          color={theme.colors.textInverse}
                        />
                      )}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </AppearancePanel>
        </Animated.View>
      )}

      {/* ── TAB 3: TYPOGRAPHY & CARDS ── */}
      {activeCategory === 'typography' && (
        <Animated.View
          entering={FadeInDown.duration(200)}
          style={styles.categoryStack}
        >
          {/* Card Surface Style Panel */}
          <AppearancePanel>
            <View style={styles.panelHeader}>
              <View
                style={[
                  styles.panelIconAura,
                  { backgroundColor: `${theme.colors.primary}15` },
                ]}
              >
                <AppIcon name="layers" size={16} color={theme.colors.primary} />
              </View>
              <View>
                <Text
                  style={[
                    styles.panelTitle,
                    { color: theme.colors.textPrimary },
                  ]}
                >
                  Card Surface Style
                </Text>
                <Text
                  style={[
                    styles.panelSub,
                    { color: theme.colors.textTertiary },
                  ]}
                >
                  Select frosted glass or solid color
                </Text>
              </View>
            </View>

            <BentoSegmentControl
              activeValue={cardStyle}
              onChange={val => {
                haptics.selection();
                setCardStyle(val);
              }}
              options={[
                { label: 'Frosted Glass', value: 'glass', icon: 'sparkles' },
                { label: 'Solid Minimal', value: 'solid', icon: 'square' },
              ]}
            />
          </AppearancePanel>

          {/* Typography & Font Design Panel */}
          <AppearancePanel>
            <View style={styles.panelHeader}>
              <View
                style={[styles.panelIconAura, { backgroundColor: '#EFF6FF' }]}
              >
                <AppIcon name="type" size={16} color="#2563EB" />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.panelTitle,
                    { color: theme.colors.textPrimary },
                  ]}
                >
                  Typography & Font Design
                </Text>
                <Text
                  style={[
                    styles.panelSub,
                    { color: theme.colors.textTertiary },
                  ]}
                >
                  Select global typeface and styling
                </Text>
              </View>
            </View>

            <View style={{ gap: 8, marginTop: 4 }}>
              {(Object.keys(fontFamilies) as FontPreset[]).map(key => {
                const font = fontFamilies[key];
                const isSelected = (fontPreset || 'system') === key;
                return (
                  <Pressable
                    key={key}
                    onPress={() => {
                      haptics.selection();
                      setFontPreset(key);
                    }}
                    style={[
                      {
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingHorizontal: 14,
                        paddingVertical: 12,
                        borderRadius: 14,
                        borderWidth: 1.5,
                        backgroundColor: isSelected
                          ? theme.isDark
                            ? 'rgba(255,255,255,0.08)'
                            : 'rgba(15,23,42,0.04)'
                          : theme.isDark
                            ? 'rgba(255,255,255,0.03)'
                            : 'rgba(0,0,0,0.02)',
                        borderColor: isSelected
                          ? theme.colors.primary
                          : theme.isDark
                            ? 'rgba(255,255,255,0.06)'
                            : 'rgba(0,0,0,0.04)',
                      },
                    ]}
                  >
                    <View style={{ flex: 1, marginRight: 12 }}>
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 8,
                        }}
                      >
                        <Text
                          style={[
                            {
                              fontSize: 14,
                              fontWeight: isSelected ? '800' : '600',
                              color: theme.colors.textPrimary,
                              fontFamily:
                                Platform.OS === 'web'
                                  ? font.sans
                                  : font.nativeSans || undefined,
                            },
                          ]}
                        >
                          {font.label}
                        </Text>
                        {key === 'system' && (
                          <View
                            style={{
                              paddingHorizontal: 6,
                              paddingVertical: 2,
                              borderRadius: 6,
                              backgroundColor: 'rgba(37,99,235,0.1)',
                            }}
                          >
                            <Text
                              style={{
                                fontSize: 10,
                                fontWeight: '700',
                                color: '#2563EB',
                              }}
                            >
                              DEFAULT
                            </Text>
                          </View>
                        )}
                      </View>
                      <Text
                        style={{
                          fontSize: 12,
                          marginTop: 3,
                          color: isSelected
                            ? theme.colors.textPrimary
                            : theme.colors.textSecondary,
                          fontFamily:
                            Platform.OS === 'web'
                              ? font.sans
                              : font.nativeSans || undefined,
                        }}
                      >
                        {font.preview}
                      </Text>
                    </View>

                    <View
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: 11,
                        borderWidth: 1.5,
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderColor: isSelected
                          ? theme.colors.primary
                          : theme.colors.borderLight,
                        backgroundColor: isSelected
                          ? theme.colors.primary
                          : 'transparent',
                      }}
                    >
                      {isSelected && (
                        <AppIcon
                          name="check"
                          size={13}
                          color={theme.colors.textInverse}
                        />
                      )}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </AppearancePanel>

          {/* Font & Header Color Control Panel */}
          <AppearancePanel>
            <View style={styles.panelHeader}>
              <View
                style={[styles.panelIconAura, { backgroundColor: '#FEF3C7' }]}
              >
                <AppIcon name="type" size={16} color="#D97706" />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.panelTitle,
                    { color: theme.colors.textPrimary },
                  ]}
                >
                  Font & Header Color
                </Text>
                <Text
                  style={[
                    styles.panelSub,
                    { color: theme.colors.textTertiary },
                  ]}
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
                        color={isLightColor(item.hex) ? '#09090B' : '#FFFFFF'}
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
          </AppearancePanel>
        </Animated.View>
      )}

      {/* ── TAB 2: CANVAS & WALLPAPER ── */}
      {activeCategory === 'canvas' && (
        <Animated.View
          entering={FadeInDown.duration(200)}
          style={styles.categoryStack}
        >
          {/* Background Style Switcher */}
          <AppearancePanel>
            <View style={styles.panelHeader}>
              <View
                style={[styles.panelIconAura, { backgroundColor: '#EDE9FE' }]}
              >
                <AppIcon name="layers" size={16} color="#8B5CF6" />
              </View>
              <View>
                <Text
                  style={[
                    styles.panelTitle,
                    { color: theme.colors.textPrimary },
                  ]}
                >
                  Background Canvas
                </Text>
                <Text
                  style={[
                    styles.panelSub,
                    { color: theme.colors.textTertiary },
                  ]}
                >
                  Choose wallpaper architecture
                </Text>
              </View>
            </View>

            <BentoSegmentControl
              activeValue={backgroundType}
              onChange={setBackgroundType}
              options={[
                { label: 'Photo Cover', value: 'image', icon: 'image' },
                { label: 'Solid Color', value: 'color', icon: 'palette' },
              ]}
            />
          </AppearancePanel>

          {/* ── PHOTO COVER CONTROLS ── */}
          {isImageMode && (
            <>
              {/* Custom URL Input */}
              <AppearancePanel>
                <View style={styles.panelHeader}>
                  <View
                    style={[
                      styles.panelIconAura,
                      { backgroundColor: '#EFF6FF' },
                    ]}
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
                        backgroundColor: theme.isDark
                          ? 'rgba(255,255,255,0.04)'
                          : 'rgba(0,0,0,0.03)',
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
              </AppearancePanel>

              {/* Curated Gallery Carousel */}
              <AppearancePanel>
                <View style={styles.panelHeader}>
                  <View
                    style={[
                      styles.panelIconAura,
                      { backgroundColor: '#ECFDF5' },
                    ]}
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
              </AppearancePanel>

              {/* Blur Intensity Slider */}
              <AppearancePanel>
                <View style={styles.panelHeader}>
                  <View
                    style={[
                      styles.panelIconAura,
                      { backgroundColor: '#FEF3C7' },
                    ]}
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
                  <AppIcon
                    name="eye"
                    size={16}
                    color={theme.colors.textTertiary}
                  />
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
                              : theme.isDark
                                ? 'rgba(255,255,255,0.04)'
                                : 'rgba(0,0,0,0.03)',
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
              </AppearancePanel>
            </>
          )}

          {/* ── SOLID COLOR CONTROLS ── */}
          {isColorMode && (
            <>
              {/* Preset Swatches */}
              <AppearancePanel>
                <View style={styles.panelHeader}>
                  <View
                    style={[
                      styles.panelIconAura,
                      { backgroundColor: '#EDE9FE' },
                    ]}
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
                            color={isLightColor(c) ? '#09090B' : '#FFFFFF'}
                          />
                        )}
                      </Pressable>
                    );
                  })}
                </View>
              </AppearancePanel>

              {/* Custom Hex Code */}
              <AppearancePanel>
                <View style={styles.panelHeader}>
                  <View
                    style={[
                      styles.panelIconAura,
                      { backgroundColor: '#EFF6FF' },
                    ]}
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
                        backgroundColor: theme.isDark
                          ? 'rgba(255,255,255,0.04)'
                          : 'rgba(0,0,0,0.03)',
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
              </AppearancePanel>

              {/* Recent Colors List */}
              {customColors.length > 0 && (
                <AppearancePanel>
                  <View style={styles.panelHeader}>
                    <View
                      style={[
                        styles.panelIconAura,
                        { backgroundColor: '#ECFDF5' },
                      ]}
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
                            color={isLightColor(color) ? '#09090B' : '#FFFFFF'}
                          />
                        )}
                      </Pressable>
                    ))}
                  </View>
                </AppearancePanel>
              )}
            </>
          )}
        </Animated.View>
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
            <View style={styles.mobilePreviewHeader}>
              <View style={styles.mobilePreviewTitleWrap}>
                <AppIcon
                  name="sparkles"
                  size={13}
                  color={theme.colors.primary}
                />
                <Text
                  style={[
                    styles.previewSectionTitle,
                    { color: theme.colors.textPrimary, marginBottom: 0 },
                  ]}
                >
                  Live Canvas Mockup
                </Text>
              </View>
              <Pressable
                onPress={() => {
                  haptics.light();
                  setShowMobilePreview(!showMobilePreview);
                }}
                style={({ pressed }) => [
                  styles.togglePreviewBtn,
                  pressed && { opacity: 0.7 },
                ]}
                hitSlop={8}
                accessibilityLabel="Toggle live preview"
              >
                <AppIcon
                  name={showMobilePreview ? 'chevron-up' : 'chevron-down'}
                  size={14}
                  color={theme.colors.textSecondary}
                />
                <Text
                  style={[
                    styles.togglePreviewText,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  {showMobilePreview ? 'Collapse' : 'Expand'}
                </Text>
              </Pressable>
            </View>

            {showMobilePreview ? (
              <Animated.View entering={FadeInDown.duration(200)}>
                {renderPreviewFrame()}
              </Animated.View>
            ) : (
              <Pressable
                onPress={() => {
                  haptics.light();
                  setShowMobilePreview(true);
                }}
                style={[
                  styles.miniPreviewBar,
                  {
                    backgroundColor: theme.isDark
                      ? 'rgba(30, 41, 59, 0.7)'
                      : 'rgba(241, 245, 249, 0.9)',
                    borderColor: theme.isDark
                      ? 'rgba(255,255,255,0.08)'
                      : 'rgba(0,0,0,0.06)',
                  },
                ]}
              >
                <View
                  style={[
                    styles.miniColorDot,
                    { backgroundColor: theme.colors.primary },
                  ]}
                />
                <Text
                  style={[
                    styles.miniPreviewText,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  Preset:{' '}
                  <Text
                    style={{
                      fontWeight: '700',
                      color: theme.colors.textPrimary,
                    }}
                  >
                    {preset || 'midnight'}
                  </Text>{' '}
                  • Tap to expand live mockup
                </Text>
              </Pressable>
            )}
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
    marginBottom: 12,
  },
  categoryTabsWrap: {
    marginBottom: 4,
  },
  categoryStack: {
    gap: 14,
  },
  mobilePreviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  mobilePreviewTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  togglePreviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.04)',
  },
  togglePreviewText: {
    fontSize: 11,
    fontWeight: '700',
  },
  miniPreviewBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  miniColorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  miniPreviewText: {
    fontSize: 12,
    fontWeight: '500',
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

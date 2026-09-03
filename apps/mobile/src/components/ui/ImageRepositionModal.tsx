import AppIcon from '../common/AppIcon'; // src/components/ui/ImageRepositionModal.tsx
import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Image,
  Animated,
  PanResponder,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { LinearGradient } from 'expo-linear-gradient';
// Removed unused @expo/vector-icons

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export type ImagePosition = { x: number; y: number; scale: number };
export const DEFAULT_IMAGE_POSITION: ImagePosition = { x: 0, y: 0, scale: 1 };
const MIN_SCALE = 1;
const MAX_SCALE = 2.5;

interface Props {
  visible: boolean;
  imageUri: string | null;
  initialPosition?: ImagePosition;
  onCancel: () => void;
  onSave: (position: ImagePosition) => void;
  accentColor?: string;
}

export function ImageRepositionModal({
  visible,
  imageUri,
  initialPosition = DEFAULT_IMAGE_POSITION,
  onCancel,
  onSave,
  accentColor = '#6C5CE7',
}: Props) {
  const [naturalSize, setNaturalSize] = useState<{
    w: number;
    h: number;
  } | null>(null);
  const [scale, setScale] = useState(initialPosition.scale);

  const pan = useRef(
    new Animated.ValueXY({ x: initialPosition.x, y: initialPosition.y }),
  ).current;
  const currentPan = useRef({ x: initialPosition.x, y: initialPosition.y });
  const dragStart = useRef({ x: initialPosition.x, y: initialPosition.y });

  // Sync pan listener
  useEffect(() => {
    const id = pan.addListener(val => {
      currentPan.current = val;
    });
    return () => pan.removeListener(id);
  }, [pan]);

  // Reset state on open
  useEffect(() => {
    if (!visible) return;
    setScale(initialPosition.scale);
    pan.setValue({ x: initialPosition.x, y: initialPosition.y });
    currentPan.current = { x: initialPosition.x, y: initialPosition.y };
    dragStart.current = { x: initialPosition.x, y: initialPosition.y };
  }, [visible, imageUri]);

  // Load image size
  useEffect(() => {
    if (!imageUri) return;
    Image.getSize(
      imageUri,
      (w, h) => setNaturalSize({ w, h }),
      () => setNaturalSize({ w: SCREEN_WIDTH, h: SCREEN_HEIGHT }),
    );
  }, [imageUri]);

  const baseSize = useMemo(() => {
    if (!naturalSize) return { w: SCREEN_WIDTH, h: SCREEN_HEIGHT };
    const frameRatio = SCREEN_WIDTH / SCREEN_HEIGHT;
    const imgRatio = naturalSize.w / naturalSize.h;
    if (imgRatio > frameRatio) {
      const h = SCREEN_HEIGHT;
      return { w: h * imgRatio, h };
    }
    const w = SCREEN_WIDTH;
    return { w, h: w / imgRatio };
  }, [naturalSize]);

  const getMaxOffset = useCallback(
    (s: number) => ({
      x: Math.max(0, (baseSize.w * s - SCREEN_WIDTH) / 2),
      y: Math.max(0, (baseSize.h * s - SCREEN_HEIGHT) / 2),
    }),
    [baseSize],
  );

  const clamp = (val: number, max: number) =>
    Math.min(max, Math.max(-max, val));

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dx) > 2 || Math.abs(g.dy) > 2,
      onPanResponderGrant: () => {
        dragStart.current = { ...currentPan.current };
      },
      onPanResponderMove: (_, gesture) => {
        const max = getMaxOffset(scale);
        pan.setValue({
          x: clamp(dragStart.current.x + gesture.dx, max.x),
          y: clamp(dragStart.current.y + gesture.dy, max.y),
        });
      },
      onPanResponderRelease: () => {
        dragStart.current = { ...currentPan.current };
      },
    }),
  ).current;

  const handleScaleChange = (val: number) => {
    setScale(val);
    const max = getMaxOffset(val);
    const clamped = {
      x: clamp(currentPan.current.x, max.x),
      y: clamp(currentPan.current.y, max.y),
    };
    dragStart.current = clamped;
    pan.setValue(clamped);
  };

  const handleReset = () => {
    setScale(1);
    dragStart.current = { x: 0, y: 0 };
    pan.setValue({ x: 0, y: 0 });
  };

  const handleSave = () =>
    onSave({ x: currentPan.current.x, y: currentPan.current.y, scale });

  if (!imageUri) return null;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onCancel}>
      <View style={styles.frame}>
        <Animated.Image
          source={{ uri: imageUri }}
          style={[
            styles.image,
            {
              width: baseSize.w * scale,
              height: baseSize.h * scale,
              left: (SCREEN_WIDTH - baseSize.w * scale) / 2,
              top: (SCREEN_HEIGHT - baseSize.h * scale) / 2,
              transform: [{ translateX: pan.x }, { translateY: pan.y }],
            },
          ]}
          {...panResponder.panHandlers}
        />

        <LinearGradient
          colors={['rgba(0,0,0,0.55)', 'transparent']}
          style={styles.topScrim}
          pointerEvents="none"
        />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.65)']}
          style={styles.bottomScrim}
          pointerEvents="none"
        />

        <SafeAreaView style={styles.headerBar} pointerEvents="box-none">
          <TouchableOpacity
            onPress={onCancel}
            style={styles.headerBtn}
            hitSlop={10}
          >
            <Text style={styles.headerBtnText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Reposition</Text>
          <TouchableOpacity
            onPress={handleSave}
            style={styles.headerBtn}
            hitSlop={10}
          >
            <Text
              style={[
                styles.headerBtnText,
                { color: accentColor, fontWeight: '800' },
              ]}
            >
              Done
            </Text>
          </TouchableOpacity>
        </SafeAreaView>

        <SafeAreaView style={styles.footerBar} pointerEvents="box-none">
          <Text style={styles.hintText}>
            Drag to reposition · slide to zoom
          </Text>
          <View style={styles.zoomRow}>
            <AppIcon
              name="remove-circle-outline"
              size={20}
              color="rgba(255,255,255,0.85)"
            />
            <Slider
              style={styles.zoomSlider}
              minimumValue={MIN_SCALE}
              maximumValue={MAX_SCALE}
              step={0.01}
              value={scale}
              onValueChange={handleScaleChange}
              minimumTrackTintColor={accentColor}
              maximumTrackTintColor="rgba(255,255,255,0.3)"
              thumbTintColor={accentColor}
            />
            <AppIcon
              name="add-circle-outline"
              size={22}
              color="rgba(255,255,255,0.85)"
            />
          </View>
          <TouchableOpacity
            onPress={handleReset}
            style={styles.resetBtn}
            hitSlop={10}
          >
            <AppIcon name="refresh" size={13} color="rgba(255,255,255,0.75)" />
            <Text style={styles.resetText}>Reset</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  frame: { flex: 1, backgroundColor: '#000000', overflow: 'hidden' },
  image: { position: 'absolute' },
  topScrim: { position: 'absolute', top: 0, left: 0, right: 0, height: 130 },
  bottomScrim: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 160,
  },
  headerBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  headerBtn: { paddingVertical: 8, paddingHorizontal: 4, minWidth: 60 },
  headerBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
  headerTitle: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  footerBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: 12,
    alignItems: 'center',
  },
  hintText: { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginBottom: 10 },
  zoomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    gap: 8,
  },
  zoomSlider: { flex: 1, height: 36 },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  resetText: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 12,
    fontWeight: '600',
  },
});

import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableWithoutFeedback,
  Image,
  DimensionValue,
  Platform,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  runOnJS,
  cancelAnimation,
  SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTripStory } from '../../../../hooks/useTrips';
import { useTheme } from '../../../../providers/ThemeProvider';
import AppIcon from '../../../../components/common/AppIcon';
import { LinearGradient } from 'expo-linear-gradient';
import { GlobalBackground } from '../../../../components/ui/GlobalBackground';
const { width } = Dimensions.get('window');
const STORY_DURATION = 5000; // 5 seconds per story

export default function TripStoryScreen() {
  const { id } = useLocalSearchParams();
  const tripId = Array.isArray(id) ? id[0] : id;
  const { data: storyData, isLoading, error } = useTripStory(tripId);
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const formatStories = (data: any) => {
    if (!data) return [];
    const storyObj = data.story || data;

    // If it's an array (old mock format), return it directly
    if (Array.isArray(storyObj)) return storyObj;

    const slides = [];

    // 1. Intro Slide
    slides.push({
      id: 'intro',
      title: storyObj.title || 'Your Trip Story',
      content: `Duration: ${storyObj.duration || 'N/A'}`,
      type: 'intro',
      image:
        storyObj.coverImage ||
        'https://images.unsplash.com/photo-1436491865332-7a61a109cc05',
    });

    // 2. Stats Slide
    if (storyObj.stats) {
      slides.push({
        id: 'stats',
        title: 'By the Numbers',
        content: `Total Spent: ₹${storyObj.stats.totalSpent}\nExpenses: ${storyObj.stats.totalExpenses}\nCountries: ${storyObj.stats.countriesVisited} | Cities: ${storyObj.stats.citiesVisited}\nDistance: ${storyObj.stats.distanceTraveled}km`,
        type: 'stats',
        image: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f',
      });
    }

    // 3. Member Highlights
    if (storyObj.memberHighlights && storyObj.memberHighlights.length > 0) {
      storyObj.memberHighlights.forEach((member: any, idx: number) => {
        slides.push({
          id: `member-${idx}`,
          title: member.displayName || 'Trip Member',
          content: `Role: ${member.role}\nFun Fact: ${member.funFact}\nFavorite: ${member.favoriteCategory}`,
          type: 'member',
          image:
            member.photoURL ||
            'https://images.unsplash.com/photo-1511895426328-dc8714191300',
        });
      });
    }

    // 4. Playlist
    if (storyObj.playlist && storyObj.playlist.length > 0) {
      slides.push({
        id: 'playlist',
        title: 'Trip Soundtrack',
        content: storyObj.playlist
          .map((p: any) => `🎵 ${p.song} - ${p.artist}`)
          .join('\n'),
        type: 'playlist',
        image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4',
      });
    }

    return slides.length > 0
      ? slides
      : [
          {
            id: 1,
            title: 'Trip Started',
            content: 'You started your journey!',
            type: 'info',
            image:
              'https://images.unsplash.com/photo-1436491865332-7a61a109cc05',
          },
        ];
  };

  const stories = useMemo(() => formatStories(storyData), [storyData]);

  const progress = useSharedValue(0);

  const goToNext = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      router.back();
    }
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const startAnimation = () => {
    progress.value = 0;
    progress.value = withTiming(
      1,
      { duration: STORY_DURATION, easing: Easing.linear },
      finished => {
        if (finished) {
          runOnJS(goToNext)();
        }
      },
    );
  };

  useEffect(() => {
    if (!isLoading && stories.length > 0 && !isPaused) {
      startAnimation();
    }
    return () => {
      cancelAnimation(progress);
    };
  }, [currentIndex, isLoading, isPaused]);

  const handlePressIn = () => {
    setIsPaused(true);
    cancelAnimation(progress);
  };

  const handlePressOut = () => {
    setIsPaused(false);
    // Resume animation from current progress
    const remainingTime = STORY_DURATION * (1 - progress.value);
    progress.value = withTiming(
      1,
      { duration: remainingTime, easing: Easing.linear },
      finished => {
        if (finished) {
          runOnJS(goToNext)();
        }
      },
    );
  };

  const handlePress = (evt: any) => {
    const x = evt.nativeEvent.locationX;
    if (x < width / 3) {
      goToPrevious();
    } else {
      goToNext();
    }
  };

  if (isLoading) {
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: theme.colors.background,
            justifyContent: 'center',
            alignItems: 'center',
          },
        ]}
      >
        <Text style={{ color: theme.colors.textPrimary }}>
          Loading Story...
        </Text>
      </View>
    );
  }

  if (error || !stories.length) {
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: theme.colors.background,
            justifyContent: 'center',
            alignItems: 'center',
          },
        ]}
      >
        <Text style={{ color: theme.colors.textPrimary }}>
          No stories available.
        </Text>
        <TouchableWithoutFeedback onPress={() => router.back()}>
          <View
            style={{
              marginTop: 20,
              padding: 10,
              backgroundColor: theme.colors.primary,
              borderRadius: 8,
            }}
          >
            <Text style={{ color: '#fff' }}>Go Back</Text>
          </View>
        </TouchableWithoutFeedback>
      </View>
    );
  }

  const currentStory = stories[currentIndex] || stories[0];

  return (
    <GlobalBackground intensity="strong">
      <View style={[styles.container, { backgroundColor: '#000' }]}>
        {/* Background Image / Content */}
        <View style={StyleSheet.absoluteFill}>
          {currentStory.image ? (
            <Image
              source={{ uri: currentStory.image }}
              style={StyleSheet.absoluteFill}
              resizeMode="cover"
            />
          ) : (
            <View
              style={[
                StyleSheet.absoluteFill,
                { backgroundColor: theme.colors.primary },
              ]}
            />
          )}
          {/* Gradient overlay for readability */}
          <LinearGradient
            colors={['rgba(0,0,0,0.6)', 'transparent', 'rgba(0,0,0,0.8)']}
            style={StyleSheet.absoluteFill}
          />
        </View>

        {/* Progress Bars */}
        <View
          style={[styles.progressContainer, { paddingTop: insets.top + 10 }]}
        >
          {stories.map((s: any, index: number) => {
            return (
              <ProgressBar
                key={index}
                index={index}
                currentIndex={currentIndex}
                progress={progress}
              />
            );
          })}
        </View>

        {/* Header */}
        <View style={[styles.header, { top: insets.top + 30 }]}>
          <TouchableWithoutFeedback onPress={() => router.back()}>
            <View style={styles.closeButton}>
              <AppIcon name="x" size={24} color="#fff" />
            </View>
          </TouchableWithoutFeedback>
        </View>

        {/* Tap Zones */}
        <TouchableWithoutFeedback
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={handlePress}
        >
          <View style={StyleSheet.absoluteFill} />
        </TouchableWithoutFeedback>

        {/* Story Content Overlay */}
        <View style={[styles.contentOverlay, { pointerEvents: 'none' }]}>
          <Text style={styles.title}>{currentStory.title}</Text>
          <Text style={styles.content}>{currentStory.content}</Text>
        </View>
      </View>
    </GlobalBackground>
  );
}

function ProgressBar({
  index,
  currentIndex,
  progress,
}: {
  index: number;
  currentIndex: number;
  progress: SharedValue<number>;
}) {
  const animatedStyle = useAnimatedStyle(() => {
    let width: DimensionValue = '0%';
    if (index < currentIndex) width = '100%';
    else if (index === currentIndex)
      width = `${progress.value * 100}%` as DimensionValue;
    return { width };
  });

  return (
    <View style={styles.progressBarBackground}>
      <Animated.View style={[styles.progressBarFill, animatedStyle]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  progressContainer: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  progressBarBackground: {
    flex: 1,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginHorizontal: 2,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#fff',
  },
  header: {
    position: 'absolute',
    right: 16,
    zIndex: 10,
  },
  closeButton: {
    padding: 8,
  },
  contentOverlay: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    zIndex: 5,
  },
  title: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
    ...Platform.select({
      web: {
        textShadow: '0px 1px 4px rgba(0, 0, 0, 0.75)',
      } as any,
      default: {
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 4,
      },
    }),
  },
  content: {
    color: '#eee',
    fontSize: 18,
    lineHeight: 24,
    ...Platform.select({
      web: {
        textShadow: '0px 1px 4px rgba(0, 0, 0, 0.75)',
      } as any,
      default: {
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 4,
      },
    }),
  },
});

import React, { useCallback, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  useWindowDimensions,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import { router } from 'expo-router';
import {
  OnboardingLayout,
  ProgressIndicator,
  GradientButton,
} from '../components';
import { ONBOARDING_STEPS } from '../data/onboardingData';
import { useResponsive } from '../theme/useResponsive';
import { storage } from '../../../utils/storage';
import { colors } from '../theme/tokens';

export default function OnboardingScreen() {
  const { isDesktop } = useResponsive();
  const { width } = useWindowDimensions();
  const flatListRef = useRef<Animated.FlatList<any>>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const [index, setIndex] = useState(0);

  const total = ONBOARDING_STEPS.length;
  const isLast = index === total - 1;
  const isFirst = index === 0;

  const finishOnboarding = useCallback(() => {
    storage.setBoolean('hasSeenOnboarding', true);
    router.replace('/(auth)/login');
  }, []);

  const goTo = useCallback(
    (next: number) => {
      if (isDesktop) {
        setIndex(next);
        return;
      }
      flatListRef.current?.scrollToIndex({ index: next, animated: true });
      setIndex(next);
    },
    [isDesktop],
  );

  const handlePrimary = useCallback(() => {
    if (isLast) {
      finishOnboarding();
      return;
    }
    goTo(index + 1);
  }, [index, isLast, goTo, finishOnboarding]);

  const handleSecondary = useCallback(() => {
    if (isFirst) {
      router.push('/(auth)/login');
      return;
    }
    finishOnboarding();
  }, [isFirst, finishOnboarding]);

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) setIndex(viewableItems[0].index);
  }).current;

  const viewabilityConfig = useRef({
    viewAreaCoveragePercentThreshold: 50,
  }).current;

  const renderSlide = (
    step: (typeof ONBOARDING_STEPS)[number],
    slideIndex: number,
  ) => {
    const primaryAction = (
      <GradientButton
        label={
          slideIndex === total - 1
            ? 'Create Your First Trip'
            : slideIndex === 0
              ? 'Start Planning'
              : 'Next'
        }
        icon={slideIndex === total - 1 ? 'rocket' : 'arrow-right'}
        onPress={handlePrimary}
        fullWidth={false}
        style={{ flex: 1 }}
      />
    );

    const secondaryAction = (
      <GradientButton
        label={
          slideIndex === 0
            ? 'Sign In'
            : slideIndex === total - 1
              ? 'Continue With Google'
              : 'Skip'
        }
        variant="ghost"
        onPress={handleSecondary}
        fullWidth={false}
        style={{ flex: 1 }}
      />
    );

    return (
      <OnboardingLayout
        key={step.id}
        eyebrow={step.eyebrow}
        title={step.title}
        description={step.description}
        backgroundImage={step.backgroundImage}
        visual={step.renderVisual(isDesktop ? 440 : Math.min(width * 0.9, 380))}
        backgroundVariant={slideIndex === 3 ? 'glow' : 'night'}
        progress={
          <ProgressIndicator
            total={total}
            scrollX={isDesktop ? new Animated.Value(index * width) : scrollX}
            stepWidth={width}
          />
        }
        primaryAction={
          isDesktop ? (
            <View
              style={{
                flexDirection: 'row',
                gap: 12,
                justifyContent: 'center',
              }}
            >
              {secondaryAction}
              {primaryAction}
            </View>
          ) : (
            <View style={{ flexDirection: 'column', gap: 12, width: '100%' }}>
              {primaryAction}
              {secondaryAction}
            </View>
          )
        }
        secondaryAction={isDesktop ? null : null} // Handled in primaryAction for desktop layout
        isFirstStep={slideIndex === 0}
      />
    );
  };

  if (isDesktop) {
    return (
      <SafeAreaView style={styles.fill}>
        <StatusBar barStyle="light-content" />
        {renderSlide(ONBOARDING_STEPS[index] || ONBOARDING_STEPS[0]!, index)}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.fill}>
      <StatusBar barStyle="light-content" />
      <Animated.FlatList
        ref={flatListRef}
        data={ONBOARDING_STEPS}
        keyExtractor={(item: any) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false },
        )}
        scrollEventThrottle={16}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        getItemLayout={(_: any, i: number) => ({
          length: width,
          offset: width * i,
          index: i,
        })}
        renderItem={({ item, index: i }: any) => (
          <View style={{ width }}>{renderSlide(item, i)}</View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.midnightNavy || '#09090B' },
});

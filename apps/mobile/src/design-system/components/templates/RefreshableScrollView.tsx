import React, { useState, useCallback, useRef } from 'react';
import {
  ScrollView,
  RefreshControl,
  ScrollViewProps,
  StyleSheet,
  View,
  Animated,
} from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { SPACING } from '../../tokens/tokens';
import { Loader } from '../atoms/Loader';

interface RefreshableScrollViewProps extends ScrollViewProps {
  onRefresh: () => Promise<void>;
  refreshing?: boolean;
  refreshControlColor?: string;
  children: React.ReactNode;
}

export const RefreshableScrollView: React.FC<RefreshableScrollViewProps> = ({
  onRefresh,
  refreshing: controlledRefreshing,
  refreshControlColor,
  children,
  style,
  ...props
}) => {
  const { colors } = useTheme();
  const [internalRefreshing, setInternalRefreshing] = useState(false);
  const refreshing = controlledRefreshing ?? internalRefreshing;
  const scrollViewRef = useRef<ScrollView>(null);
  const scrollY = useRef(new Animated.Value(0)).current;

  const handleRefresh = useCallback(async () => {
    setInternalRefreshing(true);
    try {
      await onRefresh();
    } catch (error) {
      console.error('[v0] Refresh error:', error);
    } finally {
      setInternalRefreshing(false);
    }
  }, [onRefresh]);

  const scrollViewStyle = [
    styles.scrollView,
    {
      backgroundColor: colors.background,
    },
    style,
  ];

  return (
    <ScrollView
      ref={scrollViewRef}
      style={scrollViewStyle}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={refreshControlColor || colors.primary}
          progressBackgroundColor={colors.surface}
          colors={[colors.primary, colors.secondary]}
        />
      }
      scrollEventThrottle={16}
      onScroll={Animated.event(
        [{ nativeEvent: { contentOffset: { y: scrollY } } }],
        { useNativeDriver: false },
      )}
      {...props}
    >
      {children}
    </ScrollView>
  );
};

export const RefreshableView: React.FC<RefreshableScrollViewProps> = props => {
  return <RefreshableScrollView {...props} />;
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
});

export default RefreshableScrollView;

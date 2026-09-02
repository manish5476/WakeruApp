/**
 * useResponsive Hook
 * Provides responsive design utilities
 */

import { useWindowDimensions } from 'react-native';
import { BREAKPOINTS } from '../tokens/tokens';

export const useResponsive = () => {
  const { width, height } = useWindowDimensions();

  const isXS = width < BREAKPOINTS.sm;
  const isSM = width >= BREAKPOINTS.sm && width < BREAKPOINTS.md;
  const isMD = width >= BREAKPOINTS.md && width < BREAKPOINTS.lg;
  const isLG = width >= BREAKPOINTS.lg && width < BREAKPOINTS.xl;
  const isXL = width >= BREAKPOINTS.xl;

  const isPortrait = height > width;
  const isLandscape = width > height;

  const isSmallDevice = width < 375;
  const isMediumDevice = width >= 375 && width < 768;
  const isLargeDevice = width >= 768;

  return {
    width,
    height,
    isXS,
    isSM,
    isMD,
    isLG,
    isXL,
    isPortrait,
    isLandscape,
    isSmallDevice,
    isMediumDevice,
    isLargeDevice,
    breakpoints: BREAKPOINTS,
  };
};

export default useResponsive;

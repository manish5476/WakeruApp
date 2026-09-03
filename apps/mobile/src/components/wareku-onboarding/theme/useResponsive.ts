import { useWindowDimensions } from 'react-native';
import { breakpoints } from './tokens';

export type DeviceClass = 'mobile' | 'tablet' | 'desktop' | 'wide';

export function useResponsive() {
  const { width, height } = useWindowDimensions();

  const isMobile = width < breakpoints.tablet;
  const isTablet = width >= breakpoints.tablet && width < breakpoints.desktop;
  const isDesktop = width >= breakpoints.desktop; // True for both desktop and wide screens!
  const isWide = width >= breakpoints.wide;

  const isDesktopOrAbove = width >= breakpoints.desktop;
  const isTabletOrAbove = width >= breakpoints.tablet;

  let device: DeviceClass = 'mobile';
  if (isWide) {
    device = 'wide';
  } else if (width >= breakpoints.desktop) {
    device = 'desktop';
  } else if (isTablet) {
    device = 'tablet';
  }

  return {
    width,
    height,

    device,

    isMobile,
    isTablet,
    isDesktop,
    isWide,

    isDesktopOrAbove,
    isTabletOrAbove,

    horizontalPadding: isMobile
      ? layoutPadding.mobile
      : isTablet
        ? layoutPadding.tablet
        : isWide
          ? layoutPadding.wide
          : layoutPadding.desktop,

    contentWidth:
      width >= breakpoints.wide
        ? 1360
        : width >= breakpoints.desktop
          ? 1240
          : width,
  };
}

const layoutPadding = {
  mobile: 20,
  tablet: 32,
  desktop: 48,
  wide: 64,
} as const;

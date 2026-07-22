import { useWindowDimensions } from 'react-native';
import { useMemo } from 'react';

// ============================================================
// Types & Constants
// ============================================================

export type Breakpoint = 'sm' | 'md' | 'lg' | 'xl' | '2xl';

export const breakpoints = {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    '2xl': 1536,
};

export type ResponsiveValue<T> = T | { [key in Breakpoint]?: T };

interface ResponsiveInfo {
    width: number;
    height: number;
    isMobile: boolean;
    isTablet: boolean;
    isDesktop: boolean;
    isWideScreen: boolean;
    isPortrait: boolean;
    isLandscape: boolean;
    breakpoint: Breakpoint;
    fontSize: number;
    scale: number;
}

// ============================================================
// Hook: useResponsive
// ============================================================

export function useResponsive(): ResponsiveInfo {
    const { width, height } = useWindowDimensions();

    return useMemo(() => {
        let breakpoint: Breakpoint = 'sm';
        if (width >= breakpoints['2xl']) breakpoint = '2xl';
        else if (width >= breakpoints.xl) breakpoint = 'xl';
        else if (width >= breakpoints.lg) breakpoint = 'lg';
        else if (width >= breakpoints.md) breakpoint = 'md';

        return {
            width,
            height,
            isMobile: width < breakpoints.md,
            isTablet: width >= breakpoints.md && width < breakpoints.lg,
            isDesktop: width >= breakpoints.lg,
            isWideScreen: width >= breakpoints.xl,
            isPortrait: height > width,
            isLandscape: width > height,
            breakpoint,
            fontSize: width < breakpoints.md ? 14 : 16,
            scale: Math.min(width / 375, 1.5), // Scale based on iPhone 8 width
        };
    }, [width, height]);
}

// ============================================================
// Helper: resolveResponsive
// ============================================================

export function resolveResponsive<T>(
    value: ResponsiveValue<T>,
    breakpoint: Breakpoint
): T {
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        const bpOrder: Breakpoint[] = ['sm', 'md', 'lg', 'xl', '2xl'];
        const currentIndex = bpOrder.indexOf(breakpoint);

        // Find the best matching breakpoint (current or smaller)
        for (let i = currentIndex; i >= 0; i--) {
            const bp = bpOrder[i];
            if ((value as any)[bp] !== undefined) {
                return (value as any)[bp];
            }
        }
    }
    return value as T;
}

// ============================================================
// Hook: useResponsiveStyle
// ============================================================

type ResponsiveStyles<T extends Record<string, any>> = {
    [K in keyof T]: ResponsiveValue<T[K]>;
};

export function useResponsiveStyle<T extends Record<string, any>>(
    styles: ResponsiveStyles<T>
): T {
    const { breakpoint } = useResponsive();

    return useMemo(() => {
        const resolved: any = {};
        for (const key in styles) {
            resolved[key] = resolveResponsive(styles[key], breakpoint);
        }
        return resolved as T;
    }, [styles, breakpoint]);
}

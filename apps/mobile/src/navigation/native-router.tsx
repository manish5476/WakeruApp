import React from 'react';
import { Pressable, type PressableProps } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { navigationRef, navigate, reset, goBack } from './navigationRef';
import { mapPathToRoute } from './route-mapper';

export const router = {
  push: (href: string | { pathname: string; params?: any }, _options?: any) => {
    const path = typeof href === 'string' ? href : href.pathname;
    const params = typeof href === 'string' ? undefined : href.params;
    const mapped = mapPathToRoute(path, params);
    navigate(mapped.name, mapped.params);
  },
  replace: (href: string | { pathname: string; params?: any }) => {
    const path = typeof href === 'string' ? href : href.pathname;
    const params = typeof href === 'string' ? undefined : href.params;
    const mapped = mapPathToRoute(path, params);
    if (mapped.name === 'Tabs') {
      reset([{ name: 'Tabs', params: mapped.params }]);
    } else {
      navigate(mapped.name, mapped.params);
    }
  },
  back: () => {
    goBack();
  },
  canGoBack: () => {
    return navigationRef.isReady() && navigationRef.canGoBack();
  },
  navigate: (href: string | { pathname: string; params?: any }) => {
    router.push(href);
  },
  setParams: (params: Record<string, any>) => {
    if (navigationRef.isReady()) {
      (navigationRef as any).setParams(params);
    }
  },
};

export function useRouter() {
  return router;
}

export function useLocalSearchParams<
  T extends Record<string, any> = Record<string, any>,
>(): T {
  try {
    const route = useRoute<any>();
    return (route.params || {}) as T;
  } catch {
    return {} as T;
  }
}

export function usePathname(): string {
  try {
    const current = navigationRef.getCurrentRoute();
    if (!current) return '/';

    // Map internal route names to expected expo-router paths
    switch (current.name) {
      case 'Home':
      case 'Tabs':
        return '/dashboard';
      case 'TripsTab':
        return '/home';
      case 'ExpensesTab':
        return '/expenses';
      case 'FinanceTab':
        return '/finance';
      case 'NotificationsTab':
        return '/notifications';
      case 'ProfileTab':
        return '/profile';
      case 'TripDetails':
      case 'TripExpenses':
      case 'TripAnalytics':
      case 'TripInsights':
      case 'TripLeaderboard':
      case 'TripMap':
      case 'TripSettings':
      case 'TripStory':
      case 'TripSummary':
      case 'TripStopDetails':
      case 'TripStopsReorder':
        return '/trips/details';
      case 'Requests':
        return '/requests';
      case 'Invitations':
        return '/invitations';
      case 'Appearance':
        return '/appearance';
      case 'Privacy':
        return '/privacy';
      default:
        return `/${current.name}`;
    }
  } catch {
    return '/';
  }
}

export function useSegments(): string[] {
  try {
    const current = navigationRef.getCurrentRoute();
    return current ? [current.name] : [];
  } catch {
    return [];
  }
}

export function useFocusEffect(effect: React.EffectCallback) {
  const {
    useFocusEffect: rnUseFocusEffect,
  } = require('@react-navigation/native');
  return rnUseFocusEffect(effect);
}

export interface LinkProps extends Omit<PressableProps, 'onPress'> {
  href: string | { pathname: string; params?: any };
  asChild?: boolean;
  children: React.ReactNode;
}

export function Link({ href, asChild, children, ...props }: LinkProps) {
  const handlePress = () => {
    router.push(href);
  };

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, {
      onPress: handlePress,
      ...props,
    });
  }

  return (
    <Pressable onPress={handlePress} {...props}>
      {children}
    </Pressable>
  );
}

export function Redirect({ href }: { href: string }) {
  React.useEffect(() => {
    router.replace(href);
  }, [href]);
  return null;
}

export interface ScreenProps {
  options?: any;
  name?: string;
  [key: string]: any;
}

export const Stack: {
  ({ children }: any): React.ReactElement | null;
  Screen: (props: ScreenProps) => React.ReactElement | null;
} = Object.assign(({ children }: any) => <>{children}</>, {
  Screen: (_props: ScreenProps) => null,
});

export const Tabs: {
  ({ children }: any): React.ReactElement | null;
  Screen: (props: ScreenProps) => React.ReactElement | null;
} = Object.assign(({ children }: any) => <>{children}</>, {
  Screen: (_props: ScreenProps) => null,
});

export const SplashScreen = {
  preventAutoHideAsync: async () => true,
  hideAsync: async () => true,
};

export default router;

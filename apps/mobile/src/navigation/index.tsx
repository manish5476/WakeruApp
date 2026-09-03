import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useAuthSession } from '@/features/authentication/presentation/hooks/AuthSessionProvider';
import { GuestNavigator } from './GuestNavigator';
import { AuthenticatedNavigator } from './AuthenticatedNavigator';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useTheme } from '@tripsplit/design-system';

import { useAuthStore } from '@/state/auth.store';

export function RootNavigator() {
  const { isHydrated, session } = useAuthSession();
  const { isAuthenticated, isInitialized, initialize } = useAuthStore();
  const theme = useTheme();

  React.useEffect(() => {
    initialize();
  }, [initialize]);

  if (!isHydrated && !isInitialized) {
    return (
      <View
        style={[styles.loading, { backgroundColor: theme.color.background }]}
      >
        <ActivityIndicator size="large" color={theme.color.primary} />
      </View>
    );
  }

  const isLoggedIn = !!session || isAuthenticated;

  return (
    <NavigationContainer>
      {isLoggedIn ? <AuthenticatedNavigator /> : <GuestNavigator />}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

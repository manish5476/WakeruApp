import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useAuthSession } from '@/features/authentication/presentation/hooks/AuthSessionProvider';
import { GuestNavigator } from './GuestNavigator';
import { AuthenticatedNavigator } from './AuthenticatedNavigator';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useTheme } from '@tripsplit/design-system';

export function RootNavigator() {
  const { isHydrated, session } = useAuthSession();
  const theme = useTheme();

  if (!isHydrated) {
    return (
      <View style={[styles.loading, { backgroundColor: theme.color.background }]}>
        <ActivityIndicator size="large" color={theme.color.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {session ? <AuthenticatedNavigator /> : <GuestNavigator />}
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

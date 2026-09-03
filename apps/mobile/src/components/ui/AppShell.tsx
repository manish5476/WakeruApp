/**
 * AppShell — DEPRECATED
 *
 * The GlobalHeader + AppSidebar are now mounted directly in
 * src/app/(app)/_layout.tsx at the correct navigator level.
 *
 * This file is kept only as a re-export stub so any existing
 * import { AppShell } from './AppShell' doesn't break at compile time.
 *
 * DO NOT use AppShell to wrap navigators — it caused scroll failures
 * and invisible header/sidebar due to layout tree conflicts with
 * expo-router's Tabs/Stack height management.
 */
import React from 'react';
import { View } from 'react-native';
import { GlobalBackground } from './GlobalBackground';

interface AppShellProps {
  children: React.ReactNode;
}

/** @deprecated — use (app)/_layout.tsx directly */
export function AppShell({ children }: AppShellProps) {
  return (
    <GlobalBackground>
      <View style={{ flex: 1 }}>{children}</View>
    </GlobalBackground>
  );
}

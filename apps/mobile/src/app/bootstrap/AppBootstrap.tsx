import React from 'react';
import { RootNavigator } from '@/navigation';

/**
 * Intentionally has no product UI. Routes are attached here only when a
 * feature slice is approved for implementation.
 */
export function AppBootstrap() {
  return <RootNavigator />;
}

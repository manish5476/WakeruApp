import React from 'react';
import { EnvironmentLoader } from './EnvironmentLoader';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';

export function AppBootstrap() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <EnvironmentLoader />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({ root: { flex: 1 } });

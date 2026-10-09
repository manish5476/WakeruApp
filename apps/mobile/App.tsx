import React from 'react';
import { AppBootstrap } from './src/app/bootstrap';
import { ErrorBoundary } from './src/components/ui/ErrorBoundary';

export default function App() {
  console.log('>>> [BOOT] App mounted');
  return (
    <ErrorBoundary>
      <AppBootstrap />
    </ErrorBoundary>
  );
}

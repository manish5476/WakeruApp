import React from 'react';
import { AppErrorBoundary } from '../../core/errors/AppErrorBoundary';

export function OverlayRoot() {
  return (
    <AppErrorBoundary>
      {/* Screens and overlays will render inside the error boundary */}
    </AppErrorBoundary>
  );
}

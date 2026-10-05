// src/components/ads/AdErrorBoundary.tsx
import React, { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  placement?: string;
}

interface State {
  hasError: boolean;
}

/**
 * AdErrorBoundary
 * Prevents any unhandled exception or ad rendering failure from bubbling up
 * and crashing or blanking the parent screen / application.
 */
export class AdErrorBoundary extends Component<Props, State> {
  override state: State = { hasError: false };

  static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.warn(
      `[AdErrorBoundary] Ad failed gracefully (${this.props.placement || 'ad_slot'}):`,
      error?.message,
      errorInfo?.componentStack,
    );
  }

  override render() {
    if (this.state.hasError) {
      return this.props.fallback || null;
    }
    return this.props.children;
  }
}

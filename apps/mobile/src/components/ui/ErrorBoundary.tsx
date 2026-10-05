import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { GlassCard } from './GlassCard';
import { Typography } from './Typography';
import { analytics } from '../../services/analytics';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public override state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    analytics.logError(error.message, errorInfo.componentStack);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public override render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View style={styles.container}>
          <GlassCard style={styles.card}>
            <Typography variant="h2" weight="bold" style={styles.title}>
              Oops! Something broke.
            </Typography>
            <Typography variant="body" style={styles.subtitle}>
              We've logged the issue and are looking into it.
            </Typography>
            <TouchableOpacity style={styles.button} onPress={this.handleReset}>
              <Typography variant="body" style={styles.buttonText}>
                Try Again
              </Typography>
            </TouchableOpacity>
          </GlassCard>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#0F172A', // Dark theme fallback
  },
  card: {
    padding: 24,
    alignItems: 'center',
    width: '100%',
  },
  title: {
    color: '#F87171', // Red warning color
    marginBottom: 8,
  },
  subtitle: {
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 24,
  },
  button: {
    backgroundColor: '#38BDF8',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  buttonText: {
    color: '#0F172A',
    fontWeight: 'bold',
  },
});

import React, {
  Component,
  type ErrorInfo,
  type PropsWithChildren,
  type ReactNode,
} from 'react';
import { AppBackground, AppText, Screen } from '@tripsplit/design-system';

type State = Readonly<{ error: Error | null }>;

export class AppErrorBoundary extends Component<PropsWithChildren, State> {
  public override state: State = { error: null };

  public static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Crash reporter integration is composed in bootstrap; do not leak error details to the UI.
    console.error(error, errorInfo);
  }

  public override render(): ReactNode {
    if (this.state.error !== null) {
      return (
        <AppBackground>
          <Screen>
            <AppText variant="title">Something went wrong</AppText>
            <AppText>
              Restart the app to continue. The issue has been recorded.
            </AppText>
          </Screen>
        </AppBackground>
      );
    }
    return this.props.children;
  }
}

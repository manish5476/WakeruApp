export type LogContext = Readonly<Record<string, boolean | number | string | undefined>>;

export interface Logger {
  debug(message: string, context?: LogContext): void;
  info(message: string, context?: LogContext): void;
  warn(message: string, context?: LogContext): void;
  error(error: Error, context?: LogContext): void;
}

export interface Analytics {
  identify(userId: string): void;
  reset(): void;
  track(event: string, properties?: LogContext): void;
}

export interface FeatureFlags {
  isEnabled(flag: string): boolean;
  getString(flag: string, fallback: string): string;
}

export interface CrashReporter {
  setUser(userId: string): void;
  clearUser(): void;
  recordError(error: Error, context?: LogContext): void;
}

export interface OtaUpdateProvider {
  checkForUpdate(): Promise<'available' | 'unavailable'>;
  applyUpdate(): Promise<void>;
}

export const noopAnalytics: Analytics = {
  identify: () => undefined,
  reset: () => undefined,
  track: () => undefined,
};

export const noopFeatureFlags: FeatureFlags = {
  getString: (_flag, fallback) => fallback,
  isEnabled: () => false,
};

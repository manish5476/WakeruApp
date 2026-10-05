// A wrapper around analytics so we can easily swap Firebase / PostHog later
// without rewriting 100 components.

export const analytics = {
  logEvent: (eventName: string, params?: Record<string, any>) => {
    // In production, map this to Firebase or PostHog:
    // e.g., await firebaseAnalytics().logEvent(eventName, params);
    if (__DEV__) {
      console.log(`[Analytics Event] ${eventName}`, params);
    }
  },

  logError: (message: string, stack?: string | null) => {
    // In production, map this to Crashlytics / Sentry
    // e.g., crashlytics().recordError(new Error(message));
    if (__DEV__) {
      console.error(`[Analytics Error] ${message}`, stack);
    }
  },

  setUserId: (userId: string) => {
    if (__DEV__) {
      console.log(`[Analytics] User ID set to: ${userId}`);
    }
  },
};

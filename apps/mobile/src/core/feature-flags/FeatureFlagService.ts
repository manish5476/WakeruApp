export interface FeatureFlagService {
  isEnabled(flagKey: string): boolean;
  getVariant(flagKey: string): string | null;
  refreshFlags(): Promise<void>;
}

export class DefaultFeatureFlagService implements FeatureFlagService {
  private flags: Record<string, boolean | string> = {};

  async refreshFlags(): Promise<void> {
    // In a real app, this would fetch from LaunchDarkly, Firebase Remote Config, or an API.
    this.flags = {
      new_dashboard: false,
      split_by_percentages: true,
      ai_receipt_scanner: false,
    };
  }

  isEnabled(flagKey: string): boolean {
    return this.flags[flagKey] === true;
  }

  getVariant(flagKey: string): string | null {
    const value = this.flags[flagKey];
    return typeof value === 'string' ? value : null;
  }
}

// src/services/ads/adFrequencyManager.ts
// Ad Frequency & Session Throttling Manager

import { AD_FREQUENCY_CONFIG, AdPlacementId } from './adConfig';

class AdFrequencyManager {
  private sessionStartTime: number = Date.now();
  private totalInterstitialsInSession: number = 0;
  private lastGlobalInterstitialTime: number = 0;
  private placementLastShown: Map<string, number> = new Map();
  private placementSessionCount: Map<string, number> = new Map();
  private inFlightPlacements: Set<string> = new Set();

  /**
   * Evaluates whether an interstitial ad is eligible to be shown for the given placement.
   */
  public canShowInterstitial(
    placementId: AdPlacementId,
    isAdFree: boolean,
  ): {
    allowed: boolean;
    reason?: string;
  } {
    if (isAdFree) {
      return { allowed: false, reason: 'user_is_ad_free' };
    }

    if (this.inFlightPlacements.has(placementId)) {
      return { allowed: false, reason: 'request_already_in_flight' };
    }

    // 1. Session cap check
    if (
      this.totalInterstitialsInSession >=
      AD_FREQUENCY_CONFIG.MAX_INTERSTITIALS_PER_SESSION
    ) {
      return { allowed: false, reason: 'max_session_interstitials_reached' };
    }

    const now = Date.now();

    // 2. Global cooldown check
    const timeSinceLastGlobal = now - this.lastGlobalInterstitialTime;
    if (
      timeSinceLastGlobal < AD_FREQUENCY_CONFIG.GLOBAL_INTERSTITIAL_COOLDOWN_MS
    ) {
      const waitRemainingSec = Math.round(
        (AD_FREQUENCY_CONFIG.GLOBAL_INTERSTITIAL_COOLDOWN_MS -
          timeSinceLastGlobal) /
          1000,
      );
      return {
        allowed: false,
        reason: `global_cooldown_active_${waitRemainingSec}s_remaining`,
      };
    }

    // 3. Placement-specific config check
    const config = AD_FREQUENCY_CONFIG.PLACEMENTS[placementId];
    if (config) {
      const placementCount = this.placementSessionCount.get(placementId) || 0;
      if (placementCount >= config.maxPerSession) {
        return {
          allowed: false,
          reason: `placement_session_cap_reached (${placementCount}/${config.maxPerSession})`,
        };
      }

      const lastPlacementTime = this.placementLastShown.get(placementId) || 0;
      const timeSincePlacement = now - lastPlacementTime;
      if (timeSincePlacement < config.cooldownMs) {
        const waitRemainingSec = Math.round(
          (config.cooldownMs - timeSincePlacement) / 1000,
        );
        return {
          allowed: false,
          reason: `placement_cooldown_active_${waitRemainingSec}s_remaining`,
        };
      }
    }

    return { allowed: true };
  }

  /**
   * Sets in-flight lock on a placement to prevent rapid duplicate requests.
   */
  public setInFlight(placementId: string, inFlight: boolean): void {
    if (inFlight) {
      this.inFlightPlacements.add(placementId);
    } else {
      this.inFlightPlacements.delete(placementId);
    }
  }

  /**
   * Records that an interstitial was successfully displayed.
   */
  public recordInterstitialShown(placementId: AdPlacementId): void {
    const now = Date.now();
    this.lastGlobalInterstitialTime = now;
    this.totalInterstitialsInSession += 1;

    this.placementLastShown.set(placementId, now);
    const count = this.placementSessionCount.get(placementId) || 0;
    this.placementSessionCount.set(placementId, count + 1);

    this.inFlightPlacements.delete(placementId);
    console.log(
      `[AdFrequencyManager] Recorded interstitial for "${placementId}". Total in session: ${this.totalInterstitialsInSession}/${AD_FREQUENCY_CONFIG.MAX_INTERSTITIALS_PER_SESSION}`,
    );
  }

  /**
   * Resets session counters (e.g. on user logout/login or new app foreground cycle).
   */
  public resetSession(): void {
    this.sessionStartTime = Date.now();
    this.totalInterstitialsInSession = 0;
    this.placementSessionCount.clear();
    this.inFlightPlacements.clear();
  }

  /**
   * Diagnostics dump for audit and debugging.
   */
  public getStatus(): Record<string, any> {
    return {
      sessionStartTime: new Date(this.sessionStartTime).toISOString(),
      totalInterstitialsInSession: this.totalInterstitialsInSession,
      lastGlobalInterstitialTime: this.lastGlobalInterstitialTime
        ? new Date(this.lastGlobalInterstitialTime).toISOString()
        : null,
      placementCounts: Object.fromEntries(this.placementSessionCount),
    };
  }
}

export const adFrequencyManager = new AdFrequencyManager();

// src/services/ads/adDiagnostics.ts
// Development Ad Diagnostics, Lifecycle State Machine & Event Tracking for TripSplit / Wakeru

import { Platform } from 'react-native';
import { AdPlacementId } from './adConfig';

export type AdLifecycleState =
  'IDLE' | 'LOADING' | 'LOADED' | 'SHOWN' | 'DISMISSED' | 'FAILED' | 'COOLDOWN';

export type AdEventType =
  | 'ad_request'
  | 'ad_loaded'
  | 'ad_failed'
  | 'ad_impression'
  | 'ad_clicked'
  | 'ad_closed'
  | 'ad_dismissed';

export interface AdDiagnosticPayload {
  placement: AdPlacementId | string;
  userType?: 'free' | 'paid' | 'anonymous';
  eligible?: boolean;
  sdkReady?: boolean;
  adUnitConfigured?: boolean;
  requestStarted?: boolean;
  loaded?: boolean;
  errorCode?: string | number;
  errorMessage?: string;
  format?: string;
  details?: string;
}

export interface AdEventPayload {
  placement: AdPlacementId | string;
  format?: string;
  platform?: string;
  result?: 'success' | 'failure' | 'skipped';
  errorCode?: string | number;
  errorMessage?: string;
  latencyMs?: number;
  metadata?: Record<string, any>;
}

// Development flag: logs in __DEV__ or when EXPO_PUBLIC_ADS_DEBUG is enabled
const IS_DEBUG_ENABLED =
  __DEV__ || process.env.EXPO_PUBLIC_ADS_DEBUG === 'true';

/**
 * Logs structured development diagnostics when an ad request or eligibility check occurs.
 */
export function logAdDiagnostic(
  action: 'REQUEST' | 'SUCCESS' | 'FAILURE' | 'BLOCKED',
  payload: AdDiagnosticPayload,
): void {
  if (!IS_DEBUG_ENABLED) return;

  const {
    placement,
    userType = 'free',
    eligible = true,
    sdkReady = true,
    adUnitConfigured = true,
    requestStarted = true,
    loaded,
    errorCode,
    errorMessage,
  } = payload;

  if (action === 'FAILURE' || loaded === false) {
    console.log(
      `[ADS]\n` +
        `  placement = ${placement}\n` +
        `  loaded = false\n` +
        `  errorCode = ${errorCode ?? 'UNKNOWN'}\n` +
        `  errorMessage = ${errorMessage ?? 'None provided'}`,
    );
  } else if (action === 'BLOCKED') {
    console.log(
      `[ADS]\n` +
        `  placement = ${placement}\n` +
        `  userType = ${userType}\n` +
        `  eligible = false\n` +
        `  reason = ${errorCode || payload.details || 'BLOCKED'}`,
    );
  } else {
    console.log(
      `[ADS]\n` +
        `  placement = ${placement}\n` +
        `  userType = ${userType}\n` +
        `  eligible = ${eligible}\n` +
        `  sdkReady = ${sdkReady}\n` +
        `  adUnitConfigured = ${adUnitConfigured}\n` +
        `  requestStarted = ${requestStarted}`,
    );
  }
}

/**
 * Central event tracking function for ad lifecycle monitoring.
 * Safe, privacy-preserving, and non-blocking.
 */
export function trackAdEvent(
  eventType: AdEventType,
  payload: AdEventPayload,
): void {
  const event = {
    eventType,
    timestamp: Date.now(),
    platform: payload.platform || Platform.OS,
    placement: payload.placement,
    format: payload.format || 'unknown',
    result: payload.result || 'success',
    errorCode: payload.errorCode,
    errorMessage: payload.errorMessage,
    latencyMs: payload.latencyMs,
  };

  if (IS_DEBUG_ENABLED) {
    console.log(`[AdTracker] ${eventType}:`, JSON.stringify(event));
  }
}

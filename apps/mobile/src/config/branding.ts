/**
 * Centralized Branding Configuration
 *
 * Powered by environment variables (EXPO_PUBLIC_*).
 * Changing EXPO_PUBLIC_APP_NAME or other values in .env immediately updates
 * the visible name across the entire application, web exports, and native builds.
 */

export const APP_NAME = process.env.EXPO_PUBLIC_APP_NAME || 'TripSplit';
export const APP_SHORT_NAME =
  process.env.EXPO_PUBLIC_APP_SHORT_NAME || 'TripSplit';
export const APP_TAGLINE =
  process.env.EXPO_PUBLIC_APP_TAGLINE || 'Split Bills & Travel Expenses';
export const APP_DESCRIPTION =
  process.env.EXPO_PUBLIC_APP_DESCRIPTION ||
  'TripSplit is the ultimate group travel expense operating system. Effortlessly manage shared expenses, track multi-currency budgets across 150+ foreign currencies with live FX rates, simplify group debts with smart settlement algorithms, scan receipts with on-device AI, and explore interactive geotagged trip maps. Works offline-first anywhere in the world.';
export const SITE_URL = (
  process.env.EXPO_PUBLIC_SITE_URL || 'https://wakeru.net'
).replace(/\/+$/, '');
export const APP_DOMAIN = process.env.EXPO_PUBLIC_APP_DOMAIN || 'wakeru.net';
export const COMPANY_NAME =
  process.env.EXPO_PUBLIC_COMPANY_NAME || 'TripSplit Inc.';
export const SUPPORT_EMAIL =
  process.env.EXPO_PUBLIC_SUPPORT_EMAIL || 'tripSplit@proton.me';

export const BRANDING = {
  name: APP_NAME,
  shortName: APP_SHORT_NAME,
  tagline: APP_TAGLINE,
  description: APP_DESCRIPTION,
  siteUrl: SITE_URL,
  domain: APP_DOMAIN,
  companyName: COMPANY_NAME,
  supportEmail: SUPPORT_EMAIL,
} as const;

export default BRANDING;

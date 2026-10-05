// src/config/affiliates.config.ts
// Centralized Affiliate & Ad Configuration
// All IDs are pre-configured with safe testing/sandbox values.
// In production, these can be overridden via environment variables or directly updated here.

export const AFFILIATE_CONFIG = {
  // Travelpayouts Partner Marker ID
  TRAVELPAYOUTS_MARKER:
    process.env.EXPO_PUBLIC_TRAVELPAYOUTS_MARKER || '577595',

  // Official Travelpayouts Web Tracking Script URL
  TRAVELPAYOUTS_SCRIPT_URL:
    process.env.EXPO_PUBLIC_TRAVELPAYOUTS_SCRIPT_URL ||
    'https://tp-em.com/NTc3NTk1.js?t=577595',

  // Booking.com Affiliate ID (AID) (Falls back to Travelpayouts marker attribution)
  BOOKING_COM: {
    name: 'Booking.com',
    aid: process.env.EXPO_PUBLIC_BOOKING_AID || '000000',
    baseUrl: 'https://www.booking.com/searchresults.html',
    badge: 'Hotel Partner',
  },

  // Skyscanner / WayAway Flight Search
  SKYSCANNER: {
    name: 'Skyscanner',
    badge: 'Flight Partner',
    baseUrl: 'https://www.skyscanner.com/transport/flights',
  },

  // Zero-Markup Forex Card (Niyo / Scapia / Wise)
  FOREX_CARD: {
    name: 'Niyo Global Forex',
    badge: '0% Forex Markup',
    title: 'Zero-Markup Forex Travel Card',
    subtitle: 'Save up to 3.5% on foreign currency transactions on this trip',
    referralUrl:
      process.env.EXPO_PUBLIC_FOREX_REFERRAL_URL || 'https://goniyo.com',
  },

  // Tours & Experiences (GetYourGuide / Klook)
  TOURS: {
    name: 'GetYourGuide',
    badge: 'Tours & Experiences',
    baseUrl: 'https://www.getyourguide.com/s',
  },

  // Google AdSense Web Configuration (Test Client ID: ca-pub-3940256099942544)
  ADSENSE: {
    publisherId:
      process.env.EXPO_PUBLIC_ADSENSE_CLIENT_ID || 'ca-pub-3940256099942544',
    feedSlotId: process.env.EXPO_PUBLIC_ADSENSE_FEED_SLOT_ID || '1234567890',
  },
};

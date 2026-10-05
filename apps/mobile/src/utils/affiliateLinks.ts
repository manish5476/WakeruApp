// src/utils/affiliateLinks.ts
// Generates contextual deep-links based on trip destination and travel partner

import { AFFILIATE_CONFIG } from '../config/affiliates.config';

/**
 * Returns a dynamic Booking.com search link pre-filled with the destination and optional coordinates.
 * Fallbacks directly to clean Booking.com search to avoid expired Travelpayouts program 404 ("promo not found").
 */
export function getHotelDealUrl(
  destination?: string,
  coords?: { lat: number; lng: number },
): string {
  const query = destination ? encodeURIComponent(destination.trim()) : 'hotels';
  const aid = AFFILIATE_CONFIG.BOOKING_COM.aid;
  const coordParam =
    coords?.lat && coords?.lng
      ? `&latitude=${coords.lat}&longitude=${coords.lng}`
      : '';

  if (aid && aid !== '000000') {
    return `${AFFILIATE_CONFIG.BOOKING_COM.baseUrl}?ss=${query}${coordParam}&aid=${aid}`;
  }

  // Fallback directly to clean Booking.com search results to guarantee HTTP 200/301 without "promo not found" errors
  return `https://www.booking.com/searchresults.html?ss=${query}${coordParam}`;
}

/**
 * Returns a dynamic flight comparison link.
 */
export function getFlightDealUrl(destination?: string): string {
  const query = destination
    ? encodeURIComponent(destination.trim())
    : 'explore';
  return `https://www.skyscanner.com/transport/flights/?query=${query}`;
}

/**
 * Returns a zero-forex card signup link.
 */
export function getForexCardDealUrl(): string {
  return AFFILIATE_CONFIG.FOREX_CARD.referralUrl;
}

/**
 * Returns a tours and experiences search link for the destination.
 */
export function getActivityDealUrl(
  destination?: string,
  coords?: { lat: number; lng: number },
): string {
  const query = destination ? encodeURIComponent(destination.trim()) : 'tours';
  return `${AFFILIATE_CONFIG.TOURS.baseUrl}?q=${query}`;
}

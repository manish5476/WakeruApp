import apiClient from './client';

export const locationApi = {
  /** Get location info from GPS coordinates */
  getLocationInfo: (lat: number, lng: number) =>
    apiClient.get('/location/reverse-geocode', { params: { lat, lng } }),

  /** Search locations by text */
  searchLocations: (query: string) =>
    apiClient.get('/location/search', { params: { q: query } }),

  /** Get nearby stops for a trip */
  checkNearbyStops: (tripId: string, lat: number, lng: number) =>
    apiClient.get(`/location/nearby-stops/${tripId}`, { params: { lat, lng } }),

  /** Smart stop suggestion */
  suggestStop: (tripId: string, lat: number, lng: number) =>
    apiClient.get(`/location/suggest-stop/${tripId}`, { params: { lat, lng } }),

  /** Get all supported countries */
  getSupportedCountries: () => apiClient.get('/location/countries'),

  /** Get currency info for a country */
  getCurrencyInfo: (countryCode: string) =>
    apiClient.get(`/location/currency/${countryCode}`),
};

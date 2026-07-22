import { useState, useCallback } from 'react';
import { locationApi } from '../../core/api/services/location.api';

export function useLocationService() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [countries, setCountries] = useState<any[]>([]);
    const [countriesLoaded, setCountriesLoaded] = useState(false);

    /** Get location info from GPS coordinates */
    const getLocationInfo = useCallback(async (lat: number, lng: number) => {
        setLoading(true);
        setError(null);
        try {
            const response = await locationApi.getLocationInfo(lat, lng);
            return response.data?.data;
        } catch (err: any) {
            setError(err.message || 'Failed to get location info');
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    /** Search locations by text */
    const searchLocations = useCallback(async (query: string) => {
        setLoading(true);
        setError(null);
        try {
            const response = await locationApi.searchLocations(query);
            return response.data?.data || [];
        } catch (err: any) {
            setError(err.message || 'Search failed');
            return [];
        } finally {
            setLoading(false);
        }
    }, []);

    /** Check nearby stops for a trip */
    const checkNearbyStops = useCallback(async (tripId: string, lat: number, lng: number) => {
        setLoading(true);
        setError(null);
        try {
            const response = await locationApi.checkNearbyStops(tripId, lat, lng);
            return response.data?.data;
        } catch (err: any) {
            setError(err.message || 'Failed to check nearby stops');
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    /** Get smart stop suggestion */
    const suggestStop = useCallback(async (tripId: string, lat: number, lng: number) => {
        setLoading(true);
        setError(null);
        try {
            const response = await locationApi.suggestStop(tripId, lat, lng);
            return response.data?.data;
        } catch (err: any) {
            setError(err.message || 'Failed to suggest stop');
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    /** Get supported countries (cached after first load) */
    const getSupportedCountries = useCallback(async (forceRefresh = false) => {
        if (countriesLoaded && !forceRefresh) return countries;

        setLoading(true);
        setError(null);
        try {
            const response = await locationApi.getSupportedCountries();
            const data = response.data?.data || [];
            setCountries(data);
            setCountriesLoaded(true);
            return data;
        } catch (err: any) {
            setError(err.message || 'Failed to load countries');
            return [];
        } finally {
            setLoading(false);
        }
    }, [countries, countriesLoaded]);

    /** Get currency info for a country */
    const getCurrencyInfo = useCallback(async (countryCode: string) => {
        try {
            const response = await locationApi.getCurrencyInfo(countryCode);
            return response.data?.data;
        } catch (err: any) {
            return null;
        }
    }, []);

    return {
        loading,
        error,
        countries,
        getLocationInfo,
        searchLocations,
        checkNearbyStops,
        suggestStop,
        getSupportedCountries,
        getCurrencyInfo,
    };
}

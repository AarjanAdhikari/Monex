'use strict';
import { useState, useEffect, useCallback } from 'react';

const API_URL = 'https://open.er-api.com/v6/latest/';
const CACHE_KEY = 'monex_rates_cache';
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour

interface RateData {
  base_code: string;
  rates: Record<string, number>;
  time_last_update_unix: number;
}

interface CacheData {
  timestamp: number;
  data: Record<string, RateData>; // Mapping base currency -> rates
}

export function useExchangeRates(baseCurrency: string, offlineModeSetting: boolean = false) {
  const [rates, setRates] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(typeof navigator !== 'undefined' ? !navigator.onLine : false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const fetchRates = useCallback(async (base: string, offlineSetting: boolean, forceRefresh = false) => {
    setLoading(true);
    let cache: CacheData = { timestamp: 0, data: {} };
    try {
      const cacheStr = localStorage.getItem(CACHE_KEY);
      if (cacheStr) {
        cache = JSON.parse(cacheStr);
      }
    } catch {
      // Ignore cache parse error
    }

    const now = Date.now();
    const cachedRates = cache.data[base];
    // Always fetch live unless offline mode is on or device is offline
    const currentDeviceOffline = !navigator.onLine;

    // If we're not forcing refresh, and (offline mode is ON or device is offline)
    if (!forceRefresh && (offlineSetting || currentDeviceOffline)) {
      if (cachedRates) {
        setRates(cachedRates.rates);
        setLastUpdated(new Date(cache.timestamp));
        setLoading(false);
        return;
      }
      setError("You are offline and no saved rates were found.");
      setLoading(false);
      return;
    }

    // Try API if forceRefresh is true, or (if online and offline mode is OFF)
    if (forceRefresh || (!currentDeviceOffline && !offlineSetting)) {
      try {
        const res = await fetch(`${API_URL}${base}`);
        if (!res.ok) throw new Error('Network response was not ok');
        const data = await res.json() as RateData;
        
        setRates(data.rates);
        setLastUpdated(new Date(now));
        setError(null);

        // Update cache
        cache.timestamp = now;
        cache.data[base] = data;
        localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
      } catch (err) {
        console.error("Failed to fetch rates, checking cache fallback", err);
        if (cachedRates) {
          setRates(cachedRates.rates);
          setLastUpdated(new Date(cache.timestamp));
        } else {
          setError("Failed to fetch rates and no cache available.");
        }
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchRates(baseCurrency, offlineModeSetting);
    
    // Auto sync precisely every 30 minutes
    const interval = setInterval(() => {
      fetchRates(baseCurrency, offlineModeSetting);
    }, 1000 * 60 * 30);

    return () => clearInterval(interval);
  }, [baseCurrency, fetchRates, isOffline, offlineModeSetting]);

  const convert = useCallback((amount: number, toCurrency: string) => {
    if (!rates[toCurrency]) return null;
    return amount * rates[toCurrency];
  }, [rates]);

  const refresh = useCallback(() => {
    return fetchRates(baseCurrency, offlineModeSetting, true);
  }, [baseCurrency, offlineModeSetting, fetchRates]);

  return { rates, loading, error, isOffline, lastUpdated, convert, fetchRates, refresh };
}

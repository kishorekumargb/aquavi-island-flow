import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { analytics, trackPageView } from '@/lib/analytics';

/**
 * Hook to automatically track page views when routes change
 * @param measurementId - Your GA4 Measurement ID
 * @param debug - Enable debug mode for development
 */
export const useAnalytics = (measurementId?: string, debug: boolean = false) => {
  const location = useLocation();

  // Initialize Analytics on mount
  useEffect(() => {
    if (measurementId) {
      analytics.initialize(measurementId, debug);
    }
  }, [measurementId, debug]);

  // Track page views on route changes
  useEffect(() => {
    const path = location.pathname + location.search;
    trackPageView(path);
  }, [location]);

  return analytics;
};

/**
 * Hook for manual analytics tracking without automatic page views
 * @param measurementId - Your GA4 Measurement ID
 * @param debug - Enable debug mode for development
 */
export const useAnalyticsSetup = (measurementId?: string, debug: boolean = false) => {
  useEffect(() => {
    if (measurementId) {
      analytics.initialize(measurementId, debug);
    }
  }, [measurementId, debug]);

  return analytics;
};
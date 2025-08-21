import ReactGA from 'react-ga4';

interface AnalyticsConfig {
  measurementId: string;
  debug?: boolean;
}

class Analytics {
  private isInitialized: boolean = false;
  private config: AnalyticsConfig | null = null;

  /**
   * Initialize Google Analytics 4
   * @param measurementId - Your GA4 Measurement ID (e.g., 'G-XXXXXXXXXX')
   * @param debug - Enable debug mode for development
   */
  initialize(measurementId: string, debug: boolean = false) {
    if (this.isInitialized) {
      console.warn('Analytics already initialized');
      return;
    }

    if (!measurementId) {
      console.error('Google Analytics Measurement ID is required');
      return;
    }

    this.config = { measurementId, debug };

    try {
      ReactGA.initialize(measurementId, {
        testMode: debug
      });

      this.isInitialized = true;
      console.log(`Google Analytics initialized with ID: ${measurementId}`);
    } catch (error) {
      console.error('Failed to initialize Google Analytics:', error);
    }
  }

  /**
   * Track page views
   * @param path - The page path
   * @param title - The page title (optional)
   */
  pageView(path: string, title?: string) {
    if (!this.isInitialized) {
      console.warn('Analytics not initialized. Call initialize() first.');
      return;
    }

    try {
      ReactGA.send({
        hitType: 'pageview',
        page: path,
        title: title || document.title
      });

      if (this.config?.debug) {
        console.log(`GA Page View: ${path}`);
      }
    } catch (error) {
      console.error('Failed to send page view:', error);
    }
  }

  /**
   * Track custom events
   * @param eventName - The event name
   * @param parameters - Additional event parameters
   */
  event(eventName: string, parameters?: Record<string, any>) {
    if (!this.isInitialized) {
      console.warn('Analytics not initialized. Call initialize() first.');
      return;
    }

    try {
      ReactGA.event(eventName, parameters);

      if (this.config?.debug) {
        console.log(`GA Event: ${eventName}`, parameters);
      }
    } catch (error) {
      console.error('Failed to send event:', error);
    }
  }

  /**
   * Track e-commerce purchase
   * @param transactionId - Unique transaction ID
   * @param value - Transaction value
   * @param currency - Currency code (default: USD)
   * @param items - Array of purchased items
   */
  purchase(transactionId: string, value: number, currency: string = 'USD', items?: Array<any>) {
    if (!this.isInitialized) {
      console.warn('Analytics not initialized. Call initialize() first.');
      return;
    }

    try {
      ReactGA.event('purchase', {
        transaction_id: transactionId,
        value: value,
        currency: currency,
        items: items
      });

      if (this.config?.debug) {
        console.log(`GA Purchase: ${transactionId} - ${currency} ${value}`);
      }
    } catch (error) {
      console.error('Failed to send purchase event:', error);
    }
  }

  /**
   * Set user properties
   * @param userId - User ID
   * @param properties - User properties
   */
  setUser(userId: string, properties?: Record<string, any>) {
    if (!this.isInitialized) {
      console.warn('Analytics not initialized. Call initialize() first.');
      return;
    }

    try {
      ReactGA.set({
        user_id: userId,
        ...properties
      });

      if (this.config?.debug) {
        console.log(`GA User ID set: ${userId}`, properties);
      }
    } catch (error) {
      console.error('Failed to set user:', error);
    }
  }

  /**
   * Track form submissions
   */
  formSubmit(formName: string, success: boolean = true) {
    this.event('form_submit', {
      form_name: formName,
      success: success
    });
  }

  /**
   * Track button clicks
   */
  buttonClick(buttonName: string, location?: string) {
    this.event('button_click', {
      button_name: buttonName,
      location: location
    });
  }

  /**
   * Track file downloads
   */
  fileDownload(fileName: string, fileType?: string) {
    this.event('file_download', {
      file_name: fileName,
      file_type: fileType
    });
  }

  /**
   * Track search queries
   */
  search(searchTerm: string, category?: string) {
    this.event('search', {
      search_term: searchTerm,
      category: category
    });
  }
}

// Export a singleton instance
export const analytics = new Analytics();

// Export the class for advanced usage
export { Analytics };

// Common event tracking helpers
export const trackPageView = (path: string, title?: string) => analytics.pageView(path, title);
export const trackEvent = (eventName: string, parameters?: Record<string, any>) => analytics.event(eventName, parameters);
export const trackPurchase = (transactionId: string, value: number, currency?: string, items?: Array<any>) => 
  analytics.purchase(transactionId, value, currency, items);
export const trackFormSubmit = (formName: string, success?: boolean) => analytics.formSubmit(formName, success);
export const trackButtonClick = (buttonName: string, location?: string) => analytics.buttonClick(buttonName, location);
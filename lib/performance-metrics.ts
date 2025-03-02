/**
 * Performance Metrics Tracking
 * 
 * This module provides utilities for tracking performance metrics in the application.
 * It helps identify bottlenecks and opportunities for optimization by monitoring
 * page load times, API response times, and other critical performance indicators.
 */

// Polyfill for older browsers that might not support the Performance API
const nowFn = typeof performance !== 'undefined' ? 
  () => performance.now() : 
  () => Date.now();

// Store metrics in memory for the current session
const metricsStore: Record<string, any[]> = {
  pageLoads: [],
  apiCalls: [],
  renderTimes: [],
  interactions: [],
  errors: []
};

// Maximum number of entries to keep per metric type
const MAX_ENTRIES = 100;

/**
 * Tracks a page load event
 * @param route The route that was loaded
 */
export function trackPageLoad(route: string): void {
  if (typeof window === 'undefined') return;
  
  // Collect navigation timing data if available
  let timingData = {};
  if (window.performance && window.performance.timing) {
    const timing = window.performance.timing;
    timingData = {
      dnsLookup: timing.domainLookupEnd - timing.domainLookupStart,
      tcpConnection: timing.connectEnd - timing.connectStart,
      serverResponse: timing.responseEnd - timing.requestStart,
      domComplete: timing.domComplete - timing.domLoading,
      pageLoad: timing.loadEventEnd - timing.navigationStart,
    };
  }
  
  addMetric('pageLoads', {
    route,
    timestamp: new Date().toISOString(),
    ...timingData
  });
  
  // Try to load web-vitals
  if (typeof window !== 'undefined') {
    try {
      // Instead of importing directly, we'll load the module dynamically 
      // and handle it gracefully if it fails
      import('web-vitals').then((webVitals) => {
        // Once loaded, we can safely use the module
        if (webVitals) {
          try {
            if (typeof webVitals.onCLS === 'function') {
              webVitals.onCLS(sendWebVitalsToAnalytics);
            }
            if (typeof webVitals.onFID === 'function') {
              webVitals.onFID(sendWebVitalsToAnalytics);
            }
            if (typeof webVitals.onLCP === 'function') {
              webVitals.onLCP(sendWebVitalsToAnalytics);
            }
          } catch (e) {
            console.warn('Failed to register web-vitals handlers:', e);
          }
        }
      }).catch(err => {
        console.warn('Web-vitals could not be loaded:', err);
      });
    } catch (e) {
      // Silently fail if import isn't supported
      console.warn('Web-vitals dynamic import failed:', e);
    }
  }
}

/**
 * Tracks API call performance
 * @param endpoint The API endpoint called
 * @param duration Time taken in milliseconds
 * @param status HTTP status code
 */
export function trackApiCall(endpoint: string, duration: number, status: number): void {
  addMetric('apiCalls', {
    endpoint,
    duration,
    status,
    timestamp: new Date().toISOString()
  });
}

/**
 * Tracks component render time
 * @param componentName Name of the component being measured
 * @param duration Time taken to render in milliseconds
 */
export function trackRenderTime(componentName: string, duration: number): void {
  addMetric('renderTimes', {
    component: componentName,
    duration,
    timestamp: new Date().toISOString()
  });
}

/**
 * Creates a timing wrapper to measure function execution time
 * @param fn Function to time
 * @param label Label for the timing measurement
 * @returns The original function wrapped with timing
 */
export function withTiming<T extends (...args: any[]) => any>(
  fn: T, 
  label: string
): (...args: Parameters<T>) => ReturnType<T> {
  return (...args: Parameters<T>): ReturnType<T> => {
    const start = nowFn();
    try {
      const result = fn(...args);
      
      // Handle promises
      if (result instanceof Promise) {
        return result.finally(() => {
          const duration = nowFn() - start;
          console.log(`${label} took ${duration.toFixed(2)}ms`);
          trackRenderTime(label, duration);
        }) as ReturnType<T>;
      }
      
      const duration = nowFn() - start;
      console.log(`${label} took ${duration.toFixed(2)}ms`);
      trackRenderTime(label, duration);
      return result;
    } catch (error) {
      const duration = nowFn() - start;
      console.error(`${label} failed after ${duration.toFixed(2)}ms`, error);
      trackError(label, error);
      throw error;
    }
  };
}

/**
 * Tracks user interactions
 * @param action Description of the user action
 * @param details Additional context about the action
 */
export function trackInteraction(action: string, details?: Record<string, any>): void {
  addMetric('interactions', {
    action,
    details,
    timestamp: new Date().toISOString()
  });
}

/**
 * Tracks errors that occur in the application
 * @param context Where the error occurred
 * @param error The error object or message
 */
export function trackError(context: string, error: any): void {
  addMetric('errors', {
    context,
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    timestamp: new Date().toISOString()
  });
}

/**
 * Hook to measure component render time with React
 * @param componentName Name of the component being measured
 */
export function useRenderTiming(componentName: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    // Use React's useEffect and useRef for timing in components
    // We need to use dynamic imports here to avoid issues with SSR
    const React = require('react');
    if (React && React.useEffect && React.useRef) {
      const { useEffect, useRef } = React;
      const startTimeRef = useRef(nowFn());
      
      useEffect(() => {
        const renderTime = nowFn() - startTimeRef.current;
        trackRenderTime(componentName, renderTime);
        
        return () => {
          // Reset the timer for the next render
          startTimeRef.current = nowFn();
        };
      });
    }
  } catch (error) {
    console.warn('Could not set up render timing:', error instanceof Error ? error.message : String(error));
  }
}

/**
 * Helper function to add a metric to the store
 */
function addMetric(type: string, data: any): void {
  if (!metricsStore[type]) {
    metricsStore[type] = [];
  }
  
  // Add the new entry
  metricsStore[type].push(data);
  
  // Trim the array if it exceeds the maximum size
  if (metricsStore[type].length > MAX_ENTRIES) {
    metricsStore[type] = metricsStore[type].slice(-MAX_ENTRIES);
  }
  
  // Periodically send metrics to the server
  scheduleMetricsUpload();
}

// Track when the last metrics upload was scheduled
let metricsUploadTimeout: NodeJS.Timeout | null = null;

/**
 * Schedules an upload of metrics to the server
 */
function scheduleMetricsUpload(): void {
  if (metricsUploadTimeout) return;
  
  // Schedule an upload for 10 seconds from now
  metricsUploadTimeout = setTimeout(() => {
    uploadMetrics();
    metricsUploadTimeout = null;
  }, 10000);
}

/**
 * Uploads collected metrics to the server
 */
async function uploadMetrics(): Promise<void> {
  if (typeof window === 'undefined') return;
  
  // Make a shallow copy of the current metrics
  const metrics = { ...metricsStore };
  
  // Skip if there's nothing to upload
  const hasMetrics = Object.values(metrics).some(arr => arr.length > 0);
  if (!hasMetrics) return;
  
  try {
    // Actual upload logic would go here - commented out to avoid actual API calls
    /*
    await fetch('/api/metrics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        metrics,
        userAgent: window.navigator.userAgent,
        timestamp: new Date().toISOString()
      }),
    });
    */
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Performance metrics collected:', metrics);
    }
    
    // Clear the uploaded metrics
    Object.keys(metricsStore).forEach(key => {
      metricsStore[key] = [];
    });
  } catch (error) {
    console.error('Failed to upload metrics:', error);
  }
}

/**
 * Helper function for Web Vitals reporting
 */
function sendWebVitalsToAnalytics({ name, delta, id }: {name: string, delta: number, id: string}): void {
  addMetric('webVitals', {
    metric: name,
    value: delta,
    id,
    timestamp: new Date().toISOString()
  });
} 
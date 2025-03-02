/**
 * API helper utilities for optimized data fetching, caching and error handling
 */

// Cache for API responses
const API_CACHE = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 60000; // 1 minute cache TTL

interface FetchOptions extends RequestInit {
  cacheTTL?: number; // Cache time-to-live in milliseconds
  bypassCache?: boolean; // Force fresh fetch
}

/**
 * Enhanced fetch with caching, timeout and error handling
 */
export async function fetchWithCache<T>(
  url: string, 
  options: FetchOptions = {}
): Promise<T> {
  const { cacheTTL = CACHE_TTL, bypassCache = false, ...fetchOptions } = options;
  const cacheKey = `${url}-${JSON.stringify(fetchOptions.body || {})}`;
  
  // Return cached response if available and not expired
  if (!bypassCache && API_CACHE.has(cacheKey)) {
    const cachedResponse = API_CACHE.get(cacheKey)!;
    if (Date.now() - cachedResponse.timestamp < cacheTTL) {
      return cachedResponse.data as T;
    }
    // Remove expired cache entry
    API_CACHE.delete(cacheKey);
  }

  // Add timeout to prevent hanging requests
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
  
  try {
    const response = await fetch(url, {
      ...fetchOptions,
      headers: {
        'Content-Type': 'application/json',
        ...fetchOptions.headers,
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Cache successful responses
    if (options.method !== 'POST' && options.method !== 'PUT' && options.method !== 'DELETE') {
      API_CACHE.set(cacheKey, { data, timestamp: Date.now() });
    } else {
      // Invalidate related cache entries on mutations
      const baseUrl = url.split('?')[0];
      for (const key of API_CACHE.keys()) {
        if (key.startsWith(baseUrl)) {
          API_CACHE.delete(key);
        }
      }
    }
    
    return data as T;
  } catch (error: any) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    
    throw error;
  }
}

/**
 * Optimized API functions for specific endpoints
 */
export const api = {
  // Expense related API calls
  expenses: {
    getAll: () => fetchWithCache<any[]>('/api/expenses'),
    getById: (id: string) => fetchWithCache<any>(`/api/expenses/${id}`),
    create: (data: any) => fetchWithCache<any>('/api/expenses', { 
      method: 'POST', 
      body: JSON.stringify(data),
      bypassCache: true
    }),
    update: (id: string, data: any) => fetchWithCache<any>(`/api/expenses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      bypassCache: true
    }),
    delete: (id: string) => fetchWithCache<void>(`/api/expenses/${id}`, {
      method: 'DELETE',
      bypassCache: true
    }),
  },
  
  // User related API calls
  user: {
    updateProfile: (data: any) => fetchWithCache<any>('/api/user/update', {
      method: 'POST',
      body: JSON.stringify(data),
      bypassCache: true
    }),
  },
  
  // Auth related API calls
  auth: {
    forgotPassword: (email: string) => fetchWithCache<any>('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
      bypassCache: true
    }),
    resetPassword: (data: any) => fetchWithCache<any>('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(data),
      bypassCache: true
    }),
  }
}; 
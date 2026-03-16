/**
 * Axios Client Configuration
 * Handles HTTP requests to FastAPI backend with JWT auth
 * 
 * IMPORTANT: 
 * - Uses Authorization header for JWT (no cookies/credentials needed)
 * - Minimal headers to avoid unnecessary CORS preflight complexity
 * - Content-Type added only when needed (POST/PUT/PATCH)
 */

import axios, { AxiosError, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import { supabase } from './supabaseClient';

const baseURL = process.env.EXPO_PUBLIC_API_BASE_URL;

if (!baseURL) {
  console.error('EXPO_PUBLIC_API_BASE_URL not set');
  throw new Error('Missing API base URL. Please check .env file.');
}

console.log('📡 API Base URL:', baseURL);

// Create axios instance with minimal configuration
export const axiosClient = axios.create({
  baseURL: baseURL, // Backend routes already include /api/v1/...
  timeout: 30000,
  // No global headers - add only when needed
  // No withCredentials - we use JWT, not cookies
  withCredentials: false,
});

/**
 * Recursively transform Date objects to UTC ISO strings for backend
 */
function transformDatesToUTC(obj: any): any {
  if (obj instanceof Date) {
    return obj.toISOString(); // Local Date -> UTC ISO with Z
  }
  if (Array.isArray(obj)) {
    return obj.map(transformDatesToUTC);
  }
  if (obj !== null && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [k, transformDatesToUTC(v)])
    );
  }
  return obj;
}

/**
 * Recursively convert UTC ISO strings from backend to local ISO strings for display
 * Backend sends: "2026-03-01T11:06:00Z" (UTC)
 * Frontend needs: "2026-03-01T16:36:00" (local time in ISO format, no Z)
 * This allows consistent parsing throughout the app
 */
function transformDatesFromUTC(obj: any): any {
  // Match ISO 8601 datetime strings with Z suffix (UTC from backend)
  if (typeof obj === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/.test(obj)) {
    // Parse UTC string and convert to local ISO string (without Z)
    const date = new Date(obj);
    if (!isNaN(date.getTime())) {
      // Return local time in ISO format without Z suffix
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hour = String(date.getHours()).padStart(2, '0');
      const minute = String(date.getMinutes()).padStart(2, '0');
      const second = String(date.getSeconds()).padStart(2, '0');
      return `${year}-${month}-${day}T${hour}:${minute}:${second}`;
    }
  }
  if (Array.isArray(obj)) {
    return obj.map(transformDatesFromUTC);
  }
  if (obj !== null && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [k, transformDatesFromUTC(v)])
    );
  }
  return obj;
}

// Request interceptor - Add JWT token and Content-Type only when needed
axiosClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      // Transform outgoing dates to UTC
      if (config.data) {
        config.data = transformDatesToUTC(config.data);
      }

      // Inject device/browser timezone into all requests as a query param
      // Works on both React Native (device timezone) and web (browser timezone)
      // Backend uses this for timezone-aware date filtering (e.g., DATE(appointment_start AT TIME ZONE tz))
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      config.params = { ...config.params, timezone };
      
      // IMPORTANT: getSession() returns cached session
      // After refreshSession() is called elsewhere, this will get the updated token
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.access_token) {
        // Add JWT to Authorization header
        config.headers.Authorization = `Bearer ${session.access_token}`;
        console.log('🔐 JWT added to request:', config.url);
        console.log('🔐 Token (first 50 chars):', session.access_token.substring(0, 50));
      } else {
        console.log('ℹ️ No JWT available for request:', config.url);
      }

      // Add Content-Type only for requests with body
      if (config.method && ['post', 'put', 'patch'].includes(config.method.toLowerCase())) {
        if (config.data && !config.headers['Content-Type']) {
          config.headers['Content-Type'] = 'application/json';
        }
      }
    } catch (error) {
      console.error('❌ Error in request interceptor:', error);
    }
    
    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor - Handle 401 errors and token refresh
axiosClient.interceptors.response.use(
  (response) => {
    console.log('✅ API response:', response.config.url, response.status);
    
    // Transform incoming UTC dates to local Date objects
    if (response.data) {
      response.data = transformDatesFromUTC(response.data);
    }
    
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    // Log CORS errors specifically (using console.log to avoid error banners)
    if (error.message?.includes('CORS') || error.message?.includes('Network Error')) {
      if (__DEV__) {
        console.log('🚫 CORS/Network error:', {
          url: originalRequest.url,
          method: originalRequest.method,
          status: error.response?.status,
          message: error.message,
        });
      }
    }

    // Handle 401 errors - attempt token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      console.log('🔄 Attempting token refresh...');

      try {
        // Attempt to refresh the session
        const { data: { session }, error: refreshError } = await supabase.auth.refreshSession();
        
        if (refreshError || !session) {
          console.error('❌ Token refresh failed:', refreshError);
          throw new Error('Session expired');
        }

        console.log('✅ Token refreshed successfully');

        // Retry the original request with new token
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${session.access_token}`;
        }
        
        return axiosClient(originalRequest);
      } catch (refreshError) {
        console.error('❌ Token refresh failed:', refreshError);
        return Promise.reject(refreshError);
      }
    }

    // Log error details (using console.log to avoid error banners in UI)
    if (__DEV__) {
      console.log('❌ API error:', {
        url: originalRequest.url,
        status: error.response?.status,
        message: error.message,
        data: error.response?.data,
      });
    }

    return Promise.reject(error);
  }
);

/**
 * Normalized error structure
 */
export interface NormalizedError {
  code: string;
  message: string;
  status?: number;
  details?: any;
}

/**
 * Normalize API errors to consistent format
 */
export const normalizeError = (error: unknown): NormalizedError => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<any>;
    
    // Check for CORS errors
    if (axiosError.message?.includes('CORS') || axiosError.message?.includes('Network Error')) {
      return {
        code: 'CORS_ERROR',
        message: 'Unable to connect to server. This may be a temporary issue. Please try again.',
        status: 0,
      };
    }
    
    return {
      code: axiosError.response?.data?.code || 'API_ERROR',
      message: axiosError.response?.data?.message || axiosError.message || 'An error occurred',
      status: axiosError.response?.status,
      details: axiosError.response?.data?.details,
    };
  }

  if (error instanceof Error) {
    return {
      code: 'UNKNOWN_ERROR',
      message: error.message,
    };
  }

  return {
    code: 'UNKNOWN_ERROR',
    message: 'An unexpected error occurred',
  };
};

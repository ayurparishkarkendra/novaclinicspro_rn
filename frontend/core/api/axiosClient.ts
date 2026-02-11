/**
 * Axios Client Configuration
 * Handles HTTP requests to FastAPI backend with JWT auth
 * 
 * IMPORTANT: Uses Authorization header for auth (no cookies/credentials needed)
 */

import axios, { AxiosError, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import { supabase } from './supabaseClient';

const baseURL = process.env.EXPO_PUBLIC_API_BASE_URL;

if (!baseURL) {
  console.error('EXPO_PUBLIC_API_BASE_URL not set');
  throw new Error('Missing API base URL. Please check .env file.');
}

console.log('📡 API Base URL:', baseURL);

// Create axios instance with clean configuration
export const axiosClient = axios.create({
  baseURL: `${baseURL}/api`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
  // Do NOT use withCredentials - we use Authorization header instead
  withCredentials: false,
});

// Request interceptor - Add JWT token from Supabase
axiosClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      // Get current session from Supabase
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.access_token) {
        // Add JWT to Authorization header
        config.headers.Authorization = `Bearer ${session.access_token}`;
        console.log('🔐 JWT added to request:', config.url);
      } else {
        console.log('ℹ️ No JWT available for request:', config.url);
      }
    } catch (error) {
      console.error('❌ Error getting session for request:', error);
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
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    // Log CORS errors specifically
    if (error.message?.includes('CORS') || error.message?.includes('Network Error')) {
      console.error('🚫 CORS/Network error:', {
        url: originalRequest.url,
        method: originalRequest.method,
        headers: originalRequest.headers,
        message: error.message,
      });
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

    console.error('❌ API error:', {
      url: originalRequest.url,
      status: error.response?.status,
      message: error.message,
    });

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
        message: 'Unable to connect to server. Please check your internet connection.',
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

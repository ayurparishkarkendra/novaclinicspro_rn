/**
 * Axios Client Configuration
 * Handles HTTP requests to FastAPI backend with JWT auth
 */

import axios, { AxiosError, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import Constants from 'expo-constants';
import { supabase } from './supabaseClient';

const baseURL = Constants.expoConfig?.extra?.EXPO_PUBLIC_API_BASE_URL || process.env.EXPO_PUBLIC_API_BASE_URL;

if (!baseURL) {
  throw new Error('Missing API base URL');
}

// Create axios instance
export const axiosClient = axios.create({
  baseURL: `${baseURL}/api`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add JWT token
axiosClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      // Get current session from Supabase
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.access_token) {
        config.headers.Authorization = `Bearer ${session.access_token}`;
      }
    } catch (error) {
      console.error('Error getting session for request:', error);
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle 401 errors
axiosClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    // Handle 401 errors - attempt token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Attempt to refresh the session
        const { data: { session }, error: refreshError } = await supabase.auth.refreshSession();
        
        if (refreshError || !session) {
          // Refresh failed - user needs to log in again
          throw new Error('Session expired');
        }

        // Retry the original request with new token
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${session.access_token}`;
        }
        
        return axiosClient(originalRequest);
      } catch (refreshError) {
        // Clear session and redirect to login will be handled by auth store
        return Promise.reject(refreshError);
      }
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

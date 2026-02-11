/**
 * API Error Handler Hook
 * Provides consistent error handling across all API calls
 */

import { useCallback } from 'react';
import { Alert } from 'react-native';
import { NormalizedError, normalizeError } from '../api/axiosClient';

interface UseApiErrorHandlerOptions {
  showAlert?: boolean;
  customMessage?: string;
  onError?: (error: NormalizedError) => void;
}

export const useApiErrorHandler = (options: UseApiErrorHandlerOptions = {}) => {
  const { showAlert = true, customMessage, onError } = options;

  const handleError = useCallback(
    (error: unknown) => {
      const normalized = normalizeError(error);

      // Call custom error handler if provided
      if (onError) {
        onError(normalized);
      }

      // Show alert if enabled
      if (showAlert) {
        const message = customMessage || normalized.message;
        Alert.alert(
          'Error',
          message,
          [{ text: 'OK' }],
          { cancelable: true }
        );
      }

      // Log error for debugging (remove in production)
      console.error('API Error:', normalized);

      return normalized;
    },
    [showAlert, customMessage, onError]
  );

  return { handleError };
};

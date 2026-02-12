/**
 * API Error Handler Hook
 * Provides consistent error handling across all API calls with i18n support
 * 
 * Usage:
 * const { handleError } = useApiErrorHandler();
 * 
 * // In React Query onError:
 * onError: (error) => handleError(error, ErrorTokens.appointments.loadFailed)
 */

import { useCallback } from 'react';
import { Alert } from 'react-native';
import { NormalizedError, normalizeError } from '../api/axiosClient';
import { t } from '../localization/i18n';
import { ErrorTokens } from '../localization/errorTokens';

interface UseApiErrorHandlerOptions {
  /** Show alert dialog (default: true) */
  showAlert?: boolean;
  /** Custom error token or message key */
  errorToken?: string;
  /** Callback for custom error handling */
  onError?: (error: NormalizedError) => void;
  /** Suppress console logging */
  silent?: boolean;
}

interface HandleErrorOptions {
  /** Override error token for this specific call */
  errorToken?: string;
  /** Show alert for this specific call */
  showAlert?: boolean;
}

export const useApiErrorHandler = (options: UseApiErrorHandlerOptions = {}) => {
  const { 
    showAlert = true, 
    errorToken: defaultToken, 
    onError,
    silent = false 
  } = options;

  const handleError = useCallback(
    (error: unknown, overrideOptions?: HandleErrorOptions | string) => {
      const normalized = normalizeError(error);
      
      // Support both string token or options object for backward compatibility
      const opts: HandleErrorOptions = typeof overrideOptions === 'string' 
        ? { errorToken: overrideOptions }
        : overrideOptions || {};

      // Determine which error token to use
      const tokenToUse = opts.errorToken || defaultToken;
      const shouldShowAlert = opts.showAlert ?? showAlert;

      // Get localized message
      let message: string;
      if (tokenToUse) {
        message = t(tokenToUse);
      } else {
        // Infer error type from status code
        message = getMessageForStatus(normalized.status, normalized.message);
      }

      // Call custom error handler if provided
      if (onError) {
        onError(normalized);
      }

      // Show alert if enabled
      if (shouldShowAlert) {
        Alert.alert(
          t('common.error'),
          message,
          [{ text: t('common.ok') }],
          { cancelable: true }
        );
      }

      // Log error for debugging
      if (!silent) {
        console.error('API Error:', {
          status: normalized.status,
          message: normalized.message,
          token: tokenToUse,
        });
      }

      return normalized;
    },
    [showAlert, defaultToken, onError, silent]
  );

  return { handleError };
};

/**
 * Get appropriate error message based on HTTP status code
 */
function getMessageForStatus(status: number | undefined, fallbackMessage: string): string {
  switch (status) {
    case 401:
      return t(ErrorTokens.auth.sessionExpired);
    case 403:
      return t(ErrorTokens.auth.permissionDenied);
    case 404:
      return t(ErrorTokens.generic.notFound);
    case 408:
    case 504:
      return t(ErrorTokens.network.timeout);
    case 500:
    case 502:
    case 503:
      return t(ErrorTokens.network.serverUnavailable);
    default:
      // If we have a network error
      if (fallbackMessage.toLowerCase().includes('network')) {
        return t(ErrorTokens.network.generic);
      }
      return t(ErrorTokens.generic.unknown);
  }
}

export default useApiErrorHandler;

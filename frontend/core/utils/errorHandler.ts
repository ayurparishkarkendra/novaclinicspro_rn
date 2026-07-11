/**
 * Error Handler Utility
 * Extracts user-friendly error messages from API errors
 */

import { AxiosError } from 'axios';

/**
 * Extract user-friendly error message from API error
 */
export const getErrorMessage = (error: unknown, fallbackMessage: string = 'Something went wrong. Please try again.'): string => {
  // Handle AxiosError
  if (error && typeof error === 'object' && 'isAxiosError' in error) {
    const axiosError = error as AxiosError<any>;
    
    // Check for response data with detail field (FastAPI standard)
    if (axiosError.response?.data?.detail) {
      const detail = axiosError.response.data.detail;
      
      // If detail is a string, return it
      if (typeof detail === 'string') {
        return sanitizeErrorMessage(detail);
      }
      
      // If detail is an array (validation errors), extract messages
      if (Array.isArray(detail)) {
        const messages = detail.map((err: any) => err.msg || err.message).filter(Boolean);
        if (messages.length > 0) {
          return sanitizeErrorMessage(messages[0]);
        }
      }
    }
    
    // Check for response data with error field
    if (axiosError.response?.data?.error) {
      return sanitizeErrorMessage(axiosError.response.data.error);
    }
    
    // Check for response data with message field
    if (axiosError.response?.data?.message) {
      return sanitizeErrorMessage(axiosError.response.data.message);
    }
    
    // Handle specific HTTP status codes
    if (axiosError.response?.status) {
      switch (axiosError.response.status) {
        case 400:
          return 'Invalid request. Please check your input and try again.';
        case 401:
          return 'You are not authorized. Please log in again.';
        case 403:
          return 'You do not have permission to perform this action.';
        case 404:
          return 'The requested resource was not found.';
        case 409:
          return 'This action conflicts with existing data.';
        case 422:
          return 'The data provided is invalid. Please check and try again.';
        case 429:
          return 'Too many requests. Please wait a moment and try again.';
        case 500:
          return 'Server error. Our team has been notified. Please try again later.';
        case 502:
        case 503:
        case 504:
          return 'Service temporarily unavailable. Please try again in a few moments.';
        default:
          return fallbackMessage;
      }
    }
    
    // Network error
    if (axiosError.message === 'Network Error') {
      return 'Network connection failed. Please check your internet connection.';
    }
  }
  
  // Handle standard Error objects
  if (error instanceof Error) {
    // Don't show technical error messages to users
    if (error.message.includes('AxiosError') || error.message.includes('Request failed')) {
      return fallbackMessage;
    }
    return sanitizeErrorMessage(error.message);
  }
  
  // Handle string errors
  if (typeof error === 'string') {
    return sanitizeErrorMessage(error);
  }
  
  // Fallback
  return fallbackMessage;
};

/**
 * Sanitize error message to remove technical details
 */
const sanitizeErrorMessage = (message: string): string => {
  // Remove technical prefixes
  message = message.replace(/^\[.*?\]\s*/, ''); // Remove [FunctionName] prefix
  message = message.replace(/^Error:\s*/i, ''); // Remove "Error:" prefix
  message = message.replace(/^AxiosError:\s*/i, ''); // Remove "AxiosError:" prefix
  
  // Remove stack traces
  if (message.includes('\n')) {
    message = message.split('\n')[0];
  }
  
  // If message contains technical terms, use generic message
  const technicalTerms = [
    'AxiosError',
    'TypeError',
    'ReferenceError',
    'undefined',
    'null',
    'NaN',
    'Infinity',
    'prototype',
    'constructor',
    '__proto__',
    'stack trace',
  ];
  
  const lowerMessage = message.toLowerCase();
  if (technicalTerms.some(term => lowerMessage.includes(term.toLowerCase()))) {
    return 'An unexpected error occurred. Please try again.';
  }
  
  // Capitalize first letter
  message = message.charAt(0).toUpperCase() + message.slice(1);
  
  // Ensure message ends with punctuation
  if (!/[.!?]$/.test(message)) {
    message += '.';
  }
  
  return message;
};

/**
 * Log error for debugging (only in development)
 */
export const logError = (context: string, error: unknown): void => {
  if (__DEV__) {
    console.error(`[${context}] Error:`, error);
  }
};

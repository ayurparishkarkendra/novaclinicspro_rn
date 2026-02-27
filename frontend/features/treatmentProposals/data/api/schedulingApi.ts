/**
 * Scheduling API
 * Handles all HTTP calls for treatment series scheduling
 * 
 * Architecture:
 * - Uses axios client from core/api/axiosClient.ts
 * - All paths start with /api/v1/clinic/{tenant_id}/...
 * - Includes try-catch error handling
 * - Returns typed responses (no any)
 * - Maps error responses to user-friendly messages
 */

import { axiosClient, normalizeError, NormalizedError } from '../../../../core/api/axiosClient';
import {
  ScheduleDTO,
  ScheduleValidationResponse,
  ScheduleCreationResponse,
} from '../models/treatmentProposals.dtos';

// ============================================
// ERROR MAPPING
// ============================================

/**
 * Map API error codes to user-friendly messages
 */
const getErrorMessage = (error: NormalizedError): string => {
  const errorMessages: Record<string, string> = {
    'VALIDATION_ERROR': 'Please resolve all scheduling conflicts before confirming.',
    'BUSINESS_RULE_VIOLATION': error.message || 'This action is not allowed.',
    'NOT_FOUND': 'Proposal not found.',
    'PERMISSION_DENIED': 'You do not have permission to schedule treatments.',
    'CORS_ERROR': 'Unable to connect to server. Please check your internet connection.',
  };

  return errorMessages[error.code] || error.message || 'An unexpected error occurred.';
};

// ============================================
// SCHEDULING APIs
// ============================================

/**
 * Validate a treatment schedule before confirmation
 * POST /api/v1/clinic/{tenant_id}/treatment-proposals/{id}/schedule/validate
 * 
 * @throws {NormalizedError} If validation fails
 */
export const validateScheduleApi = async (
  tenantId: string,
  proposalId: string,
  payload: ScheduleDTO
): Promise<ScheduleValidationResponse> => {
  try {
    console.log('📤 Validating schedule:', { tenantId, proposalId, payload });
    const response = await axiosClient.post(
      `/api/v1/clinic/${tenantId}/treatment-proposals/${proposalId}/schedule/validate`,
      payload
    );
    console.log('✅ Schedule validation result:', response.data);
    return response.data;
  } catch (error) {
    const normalizedError = normalizeError(error);
    console.error('❌ Failed to validate schedule:', normalizedError);
    throw new Error(getErrorMessage(normalizedError));
  }
};

/**
 * Schedule a treatment series
 * POST /api/v1/clinic/{tenant_id}/treatment-proposals/{id}/schedule
 * 
 * @throws {NormalizedError} If scheduling fails
 */
export const scheduleSeriesApi = async (
  tenantId: string,
  proposalId: string,
  payload: ScheduleDTO
): Promise<ScheduleCreationResponse> => {
  try {
    console.log('📤 Scheduling treatment series:', { tenantId, proposalId, payload });
    const response = await axiosClient.post(
      `/api/v1/clinic/${tenantId}/treatment-proposals/${proposalId}/schedule`,
      payload,
      {
        headers: {
          // Add idempotency key to prevent duplicate schedules
          'Idempotency-Key': `schedule-${proposalId}-${Date.now()}`,
        },
      }
    );
    console.log('✅ Treatment series scheduled:', response.data);
    return response.data;
  } catch (error) {
    const normalizedError = normalizeError(error);
    console.error('❌ Failed to schedule treatment series:', normalizedError);
    
    // Handle 400 validation errors
    if (normalizedError.status === 400) {
      if (normalizedError.code === 'VALIDATION_ERROR') {
        throw new Error('Please resolve all scheduling conflicts before confirming.');
      }
      if (normalizedError.code === 'BUSINESS_RULE_VIOLATION') {
        throw new Error(normalizedError.message || 'This proposal cannot be scheduled at this time.');
      }
    }
    
    // Handle 403 permission errors
    if (normalizedError.status === 403) {
      throw new Error('You do not have permission to schedule treatments. Please contact an administrator.');
    }
    
    // Handle 404 not found
    if (normalizedError.status === 404) {
      throw new Error('Proposal not found. It may have been deleted.');
    }
    
    throw new Error(getErrorMessage(normalizedError));
  }
};

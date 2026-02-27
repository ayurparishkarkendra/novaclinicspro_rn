/**
 * Lifecycle Management API
 * Handles pause, resume, and cancel operations for treatment series
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
  PauseSeriesDTO,
  PauseSeriesResponse,
  ResumeSeriesDTO,
  ResumeSeriesResponse,
  CancelSeriesDTO,
  CancelSeriesResponse,
  RuleEvaluationResult,
} from '../models/treatmentProposals.dtos';

// ============================================
// ERROR MAPPING
// ============================================

/**
 * Map API error codes to user-friendly messages
 */
const getErrorMessage = (error: NormalizedError): string => {
  const errorMessages: Record<string, string> = {
    'VALIDATION_ERROR': 'Please check your input and try again.',
    'BUSINESS_RULE_VIOLATION': error.message || 'This action is not allowed.',
    'NOT_FOUND': 'Treatment sheet not found.',
    'PERMISSION_DENIED': 'You do not have permission to perform this action.',
    'CORS_ERROR': 'Unable to connect to server. Please check your internet connection.',
  };

  return errorMessages[error.code] || error.message || 'An unexpected error occurred.';
};

// ============================================
// PAUSE APIs
// ============================================

/**
 * Check if user can pause a treatment series
 * GET /api/v1/clinic/{tenant_id}/treatment-sheets/{id}/can-pause
 * 
 * @throws {NormalizedError} If check fails
 */
export const canPauseSeriesApi = async (
  tenantId: string,
  sheetId: string
): Promise<RuleEvaluationResult> => {
  try {
    console.log('📤 Checking can-pause:', { tenantId, sheetId });
    const response = await axiosClient.get(
      `/api/v1/clinic/${tenantId}/treatment-sheets/${sheetId}/can-pause`
    );
    console.log('✅ Can-pause result:', response.data);
    return response.data;
  } catch (error) {
    const normalizedError = normalizeError(error);
    console.error('❌ Failed to check can-pause:', normalizedError);
    throw new Error(getErrorMessage(normalizedError));
  }
};

/**
 * Pause a treatment series
 * POST /api/v1/clinic/{tenant_id}/treatment-sheets/{id}/pause
 * 
 * @throws {NormalizedError} If pause fails
 */
export const pauseSeriesApi = async (
  tenantId: string,
  sheetId: string,
  payload: PauseSeriesDTO
): Promise<PauseSeriesResponse> => {
  try {
    console.log('📤 Pausing treatment series:', { tenantId, sheetId, payload });
    const response = await axiosClient.post(
      `/api/v1/clinic/${tenantId}/treatment-sheets/${sheetId}/pause`,
      payload
    );
    console.log('✅ Treatment series paused:', response.data);
    return response.data;
  } catch (error) {
    const normalizedError = normalizeError(error);
    console.error('❌ Failed to pause treatment series:', normalizedError);
    
    // Handle 400 validation errors
    if (normalizedError.status === 400) {
      throw new Error(normalizedError.message || 'Cannot pause this treatment series. Please check the requirements.');
    }
    
    // Handle 403 permission errors
    if (normalizedError.status === 403) {
      throw new Error('You do not have permission to pause treatment series.');
    }
    
    // Handle 404 not found
    if (normalizedError.status === 404) {
      throw new Error('Treatment sheet not found. It may have been deleted.');
    }
    
    throw new Error(getErrorMessage(normalizedError));
  }
};

// ============================================
// RESUME APIs
// ============================================

/**
 * Check if user can resume a paused treatment series
 * GET /api/v1/clinic/{tenant_id}/treatment-sheets/{id}/can-resume
 * 
 * @throws {NormalizedError} If check fails
 */
export const canResumeSeriesApi = async (
  tenantId: string,
  sheetId: string
): Promise<RuleEvaluationResult> => {
  try {
    console.log('📤 Checking can-resume:', { tenantId, sheetId });
    const response = await axiosClient.get(
      `/api/v1/clinic/${tenantId}/treatment-sheets/${sheetId}/can-resume`
    );
    console.log('✅ Can-resume result:', response.data);
    return response.data;
  } catch (error) {
    const normalizedError = normalizeError(error);
    console.error('❌ Failed to check can-resume:', normalizedError);
    throw new Error(getErrorMessage(normalizedError));
  }
};

/**
 * Resume a paused treatment series
 * POST /api/v1/clinic/{tenant_id}/treatment-sheets/{id}/resume
 * 
 * @throws {NormalizedError} If resume fails
 */
export const resumeSeriesApi = async (
  tenantId: string,
  sheetId: string,
  payload: ResumeSeriesDTO
): Promise<ResumeSeriesResponse> => {
  try {
    console.log('📤 Resuming treatment series:', { tenantId, sheetId, payload });
    const response = await axiosClient.post(
      `/api/v1/clinic/${tenantId}/treatment-sheets/${sheetId}/resume`,
      payload
    );
    console.log('✅ Treatment series resumed:', response.data);
    return response.data;
  } catch (error) {
    const normalizedError = normalizeError(error);
    console.error('❌ Failed to resume treatment series:', normalizedError);
    
    // Handle 400 validation errors
    if (normalizedError.status === 400) {
      throw new Error(normalizedError.message || 'Cannot resume this treatment series. Please check the requirements.');
    }
    
    // Handle 403 permission errors
    if (normalizedError.status === 403) {
      throw new Error('You do not have permission to resume treatment series.');
    }
    
    // Handle 404 not found
    if (normalizedError.status === 404) {
      throw new Error('Treatment sheet not found. It may have been deleted.');
    }
    
    throw new Error(getErrorMessage(normalizedError));
  }
};

// ============================================
// CANCEL APIs
// ============================================

/**
 * Check if user can cancel a treatment series
 * GET /api/v1/clinic/{tenant_id}/treatment-sheets/{id}/can-cancel
 * 
 * @throws {NormalizedError} If check fails
 */
export const canCancelSeriesApi = async (
  tenantId: string,
  sheetId: string
): Promise<RuleEvaluationResult> => {
  try {
    console.log('📤 Checking can-cancel:', { tenantId, sheetId });
    const response = await axiosClient.get(
      `/api/v1/clinic/${tenantId}/treatment-sheets/${sheetId}/can-cancel`
    );
    console.log('✅ Can-cancel result:', response.data);
    return response.data;
  } catch (error) {
    const normalizedError = normalizeError(error);
    console.error('❌ Failed to check can-cancel:', normalizedError);
    throw new Error(getErrorMessage(normalizedError));
  }
};

/**
 * Cancel a treatment series
 * POST /api/v1/clinic/{tenant_id}/treatment-sheets/{id}/cancel
 * 
 * @throws {NormalizedError} If cancel fails
 */
export const cancelSeriesApi = async (
  tenantId: string,
  sheetId: string,
  payload: CancelSeriesDTO
): Promise<CancelSeriesResponse> => {
  try {
    console.log('📤 Cancelling treatment series:', { tenantId, sheetId, payload });
    const response = await axiosClient.post(
      `/api/v1/clinic/${tenantId}/treatment-sheets/${sheetId}/cancel`,
      payload
    );
    console.log('✅ Treatment series cancelled:', response.data);
    return response.data;
  } catch (error) {
    const normalizedError = normalizeError(error);
    console.error('❌ Failed to cancel treatment series:', normalizedError);
    
    // Handle 400 validation errors
    if (normalizedError.status === 400) {
      throw new Error(normalizedError.message || 'Cannot cancel this treatment series. Please check the requirements.');
    }
    
    // Handle 403 permission errors
    if (normalizedError.status === 403) {
      throw new Error('You do not have permission to cancel treatment series.');
    }
    
    // Handle 404 not found
    if (normalizedError.status === 404) {
      throw new Error('Treatment sheet not found. It may have been deleted.');
    }
    
    throw new Error(getErrorMessage(normalizedError));
  }
};

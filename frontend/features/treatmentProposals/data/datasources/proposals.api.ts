/**
 * Treatment Proposals API
 * Handles all HTTP calls for treatment proposal management
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
  TreatmentProposal,
  ProposalCreateDTO,
  ProposalUpdateDTO,
  ProposalDeclineDTO,
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
    'CONFLICT_ERROR': 'This proposal was modified by another user. Please refresh and try again.',
    'NOT_FOUND': 'Proposal not found.',
    'PERMISSION_DENIED': 'You do not have permission to perform this action.',
    'CORS_ERROR': 'Unable to connect to server. Please check your internet connection.',
  };

  return errorMessages[error.code] || error.message || 'An unexpected error occurred.';
};

// ============================================
// PROPOSAL CRUD APIs
// ============================================

/**
 * Create a new treatment proposal
 * POST /api/v1/clinic/{tenant_id}/treatment-proposals
 * 
 * @throws {NormalizedError} If creation fails
 */
export const createProposalApi = async (
  tenantId: string,
  payload: ProposalCreateDTO
): Promise<TreatmentProposal> => {
  try {
    console.log('📤 Creating proposal:', { tenantId, payload });
    
    // Map frontend fields to backend expected fields
    // Backend schema uses different field names than design document
    const backendPayload: any = {
      episode_id: payload.episode_id,
      client_id: (payload as any).client_id, // Added by frontend before calling API
      treatment_type: payload.name, // Map 'name' to 'treatment_type'
      proposed_duration_days: payload.duration_days, // Map 'duration_days' to 'proposed_duration_days'
      currency: payload.currency || 'INR',
    };

    // Map optional fields
    if (payload.goals) {
      backendPayload.expected_outcomes = payload.goals; // Map 'goals' to 'expected_outcomes'
    }

    if (payload.contraindications) {
      backendPayload.clinical_notes = payload.contraindications; // Map 'contraindications' to 'clinical_notes'
    }

    if (payload.estimated_cost_min !== undefined) {
      backendPayload.estimated_cost_min = payload.estimated_cost_min;
    }

    if (payload.estimated_cost_max !== undefined) {
      backendPayload.estimated_cost_max = payload.estimated_cost_max;
    }

    // Note: modalities and modalities_notes are not in backend schema
    // They may be added later or stored differently
    
    console.log('📤 Mapped backend payload:', backendPayload);
    
    const response = await axiosClient.post(
      `/api/v1/clinic/${tenantId}/treatment-proposals`,
      backendPayload
    );
    console.log('✅ Proposal created:', response.data);
    return response.data;
  } catch (error) {
    const normalizedError = normalizeError(error);
    console.error('❌ Failed to create proposal:', normalizedError);
    throw new Error(getErrorMessage(normalizedError));
  }
};

/**
 * Get proposals by episode ID
 * GET /api/v1/clinic/{tenant_id}/treatment-proposals?episode_id={episode_id}
 * 
 * @throws {NormalizedError} If fetch fails
 */
export const getProposalsByEpisodeApi = async (
  tenantId: string,
  episodeId: string
): Promise<{ proposals: TreatmentProposal[]; total: number }> => {
  try {
    console.log('📤 Fetching proposals for episode:', { tenantId, episodeId });
    const response = await axiosClient.get(
      `/api/v1/clinic/${tenantId}/treatment-proposals`,
      { params: { episode_id: episodeId } }
    );
    console.log('✅ Proposals fetched:', response.data);
    
    // Handle both response formats: array or object with proposals property
    const proposals = Array.isArray(response.data) 
      ? response.data 
      : (response.data.proposals || []);
    
    return {
      proposals,
      total: response.data.total || proposals.length,
    };
  } catch (error) {
    const normalizedError = normalizeError(error);
    console.error('❌ Failed to fetch proposals:', normalizedError);
    throw new Error(getErrorMessage(normalizedError));
  }
};

/**
 * Get a single proposal by ID
 * GET /api/v1/clinic/{tenant_id}/treatment-proposals/{id}
 * 
 * @throws {NormalizedError} If fetch fails
 */
export const getProposalByIdApi = async (
  tenantId: string,
  proposalId: string
): Promise<TreatmentProposal> => {
  try {
    console.log('📤 Fetching proposal:', { tenantId, proposalId });
    const response = await axiosClient.get(
      `/api/v1/clinic/${tenantId}/treatment-proposals/${proposalId}`
    );
    console.log('✅ Proposal fetched:', response.data);
    return response.data;
  } catch (error) {
    const normalizedError = normalizeError(error);
    console.error('❌ Failed to fetch proposal:', normalizedError);
    
    // Handle 404 specifically
    if (normalizedError.status === 404) {
      throw new Error('Proposal not found. It may have been deleted.');
    }
    
    throw new Error(getErrorMessage(normalizedError));
  }
};

/**
 * Update a proposal
 * PATCH /api/v1/clinic/{tenant_id}/treatment-proposals/{id}
 * 
 * @throws {NormalizedError} If update fails
 */
export const updateProposalApi = async (
  tenantId: string,
  proposalId: string,
  payload: ProposalUpdateDTO
): Promise<TreatmentProposal> => {
  try {
    console.log('📤 Updating proposal:', { tenantId, proposalId, payload });
    const response = await axiosClient.patch(
      `/api/v1/clinic/${tenantId}/treatment-proposals/${proposalId}`,
      payload
    );
    console.log('✅ Proposal updated:', response.data);
    return response.data;
  } catch (error) {
    const normalizedError = normalizeError(error);
    console.error('❌ Failed to update proposal:', normalizedError);
    
    // Handle 409 conflict specifically
    if (normalizedError.status === 409) {
      throw new Error('This proposal was modified by another user. Please refresh and try again.');
    }
    
    // Handle 400 validation errors
    if (normalizedError.status === 400) {
      throw new Error(normalizedError.message || 'Invalid proposal data. Please check your input.');
    }
    
    throw new Error(getErrorMessage(normalizedError));
  }
};

/**
 * Decline a proposal
 * PATCH /api/v1/clinic/{tenant_id}/treatment-proposals/{id}/decline
 * 
 * @throws {NormalizedError} If decline fails
 */
export const declineProposalApi = async (
  tenantId: string,
  proposalId: string,
  payload: ProposalDeclineDTO
): Promise<TreatmentProposal> => {
  try {
    console.log('📤 Declining proposal:', { tenantId, proposalId, payload });
    const response = await axiosClient.patch(
      `/api/v1/clinic/${tenantId}/treatment-proposals/${proposalId}/decline`,
      payload
    );
    console.log('✅ Proposal declined:', response.data);
    return response.data;
  } catch (error) {
    const normalizedError = normalizeError(error);
    console.error('❌ Failed to decline proposal:', normalizedError);
    
    // Handle 403 permission errors
    if (normalizedError.status === 403) {
      throw new Error('You do not have permission to decline proposals. Please contact an administrator.');
    }
    
    throw new Error(getErrorMessage(normalizedError));
  }
};

// ============================================
// RULE EVALUATION APIs
// ============================================

/**
 * Check if user can create a proposal for an episode
 * GET /api/v1/clinic/{tenant_id}/treatment-proposals/can-create?episode_id={episode_id}
 * 
 * @throws {NormalizedError} If check fails
 */
export const canCreateProposalApi = async (
  tenantId: string,
  episodeId: string
): Promise<RuleEvaluationResult> => {
  try {
    console.log('📤 Checking can-create:', { tenantId, episodeId });
    const response = await axiosClient.get(
      `/api/v1/clinic/${tenantId}/treatment-proposals/can-create`,
      { params: { episode_id: episodeId } }
    );
    console.log('✅ Can-create result:', response.data);
    return response.data;
  } catch (error) {
    const normalizedError = normalizeError(error);
    console.error('❌ Failed to check can-create:', normalizedError);
    throw new Error(getErrorMessage(normalizedError));
  }
};

/**
 * Check if user can edit a proposal
 * GET /api/v1/clinic/{tenant_id}/treatment-proposals/{id}/can-edit
 * 
 * @throws {NormalizedError} If check fails
 */
export const canEditProposalApi = async (
  tenantId: string,
  proposalId: string
): Promise<RuleEvaluationResult> => {
  try {
    console.log('📤 Checking can-edit:', { tenantId, proposalId });
    const response = await axiosClient.get(
      `/api/v1/clinic/${tenantId}/treatment-proposals/${proposalId}/can-edit`
    );
    console.log('✅ Can-edit result:', response.data);
    return response.data;
  } catch (error) {
    const normalizedError = normalizeError(error);
    console.error('❌ Failed to check can-edit:', normalizedError);
    throw new Error(getErrorMessage(normalizedError));
  }
};

/**
 * Check if user can schedule a proposal
 * GET /api/v1/clinic/{tenant_id}/treatment-proposals/{id}/can-schedule
 * 
 * @throws {NormalizedError} If check fails
 */
export const canScheduleProposalApi = async (
  tenantId: string,
  proposalId: string
): Promise<RuleEvaluationResult> => {
  try {
    console.log('📤 Checking can-schedule:', { tenantId, proposalId });
    const response = await axiosClient.get(
      `/api/v1/clinic/${tenantId}/treatment-proposals/${proposalId}/can-schedule`
    );
    console.log('✅ Can-schedule result:', response.data);
    return response.data;
  } catch (error) {
    const normalizedError = normalizeError(error);
    console.error('❌ Failed to check can-schedule:', normalizedError);
    throw new Error(getErrorMessage(normalizedError));
  }
};

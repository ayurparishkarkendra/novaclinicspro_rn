/**
 * Rules Engine API
 * Handles rule evaluation for treatment proposals and sheets
 * 
 * Architecture:
 * - Uses axios client from core/api/axiosClient.ts
 * - All paths start with /api/v1/clinic/{tenant_id}/...
 * - Includes try-catch error handling
 * - Returns typed responses (no any)
 * - Maps error responses to user-friendly messages
 */

import { axiosClient, normalizeError, NormalizedError } from '../../../../core/api/axiosClient';
import { RuleEvaluationResult } from '../models/treatmentProposals.dtos';

// ============================================
// ERROR MAPPING
// ============================================

/**
 * Map API error codes to user-friendly messages
 */
const getErrorMessage = (error: NormalizedError): string => {
  const errorMessages: Record<string, string> = {
    'VALIDATION_ERROR': 'Invalid rule evaluation request.',
    'NOT_FOUND': 'Resource not found.',
    'PERMISSION_DENIED': 'You do not have permission to perform this action.',
    'CORS_ERROR': 'Unable to connect to server. Please check your internet connection.',
  };

  return errorMessages[error.code] || error.message || 'An unexpected error occurred.';
};

// ============================================
// GENERIC RULE EVALUATION API
// ============================================

/**
 * Evaluate a rule with custom context
 * POST /api/v1/clinic/{tenant_id}/rules/evaluate
 * 
 * This is a generic rule evaluation endpoint that can be used for any rule.
 * For specific rules (can-create, can-edit, etc.), use the dedicated endpoints
 * in proposalApi.ts and lifecycleApi.ts instead.
 * 
 * @throws {NormalizedError} If evaluation fails
 */
export const evaluateRuleApi = async (
  tenantId: string,
  ruleId: string,
  context: Record<string, any>
): Promise<RuleEvaluationResult> => {
  try {
    console.log('📤 Evaluating rule:', { tenantId, ruleId, context });
    const response = await axiosClient.post(
      `/api/v1/clinic/${tenantId}/rules/evaluate`,
      {
        rule_id: ruleId,
        context,
      }
    );
    console.log('✅ Rule evaluation result:', response.data);
    return response.data;
  } catch (error) {
    const normalizedError = normalizeError(error);
    console.error('❌ Failed to evaluate rule:', normalizedError);
    throw new Error(getErrorMessage(normalizedError));
  }
};

// ============================================
// TREATMENT SHEET ROW EDIT RULES
// ============================================

/**
 * Check if user can edit a treatment sheet row
 * GET /api/v1/clinic/{tenant_id}/treatment-sheets/{sheet_id}/rows/{row_id}/can-edit
 * 
 * @throws {NormalizedError} If check fails
 */
export const canEditRowApi = async (
  tenantId: string,
  sheetId: string,
  rowId: string
): Promise<RuleEvaluationResult> => {
  try {
    console.log('📤 Checking can-edit-row:', { tenantId, sheetId, rowId });
    const response = await axiosClient.get(
      `/api/v1/clinic/${tenantId}/treatment-sheets/${sheetId}/rows/${rowId}/can-edit`
    );
    console.log('✅ Can-edit-row result:', response.data);
    return response.data;
  } catch (error) {
    const normalizedError = normalizeError(error);
    console.error('❌ Failed to check can-edit-row:', normalizedError);
    throw new Error(getErrorMessage(normalizedError));
  }
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Check if a rule evaluation result allows the action
 */
export const isActionAllowed = (result: RuleEvaluationResult): boolean => {
  return result.allowed === true;
};

/**
 * Get the reason why an action is not allowed
 */
export const getDisallowReason = (result: RuleEvaluationResult): string => {
  return result.reason || 'This action is not allowed.';
};

/**
 * Check if an action requires audit logging
 */
export const requiresAudit = (result: RuleEvaluationResult): boolean => {
  return result.requires_audit === true;
};

/**
 * Check if an action requires a reason to be provided
 */
export const requiresReason = (result: RuleEvaluationResult): boolean => {
  return result.requires_reason === true;
};

/**
 * Get the audit message for an action
 */
export const getAuditMessage = (result: RuleEvaluationResult): string | undefined => {
  return result.audit_message;
};

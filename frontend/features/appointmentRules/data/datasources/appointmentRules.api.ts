/**
 * Appointment Rules API
 * Data source for appointment rules endpoints
 */

import axiosClient from '../../../../core/api/axiosClient';
import {
  AppointmentRuleResponse,
  AppointmentRulesListResponse,
  TenantRuleOverrideRequest,
} from '../models/appointmentRules.dtos';

const API_BASE = '/api/v1/clinic';

// ============================================
// API FUNCTIONS
// ============================================

/**
 * List all appointment rules for a tenant
 */
export const listAppointmentRules = async (
  tenantId: string
): Promise<AppointmentRulesListResponse> => {
  const response = await axiosClient.get<AppointmentRuleResponse[]>(
    `${API_BASE}/${tenantId}/appointment-rules`
  );
  return {
    items: response.data,
    total: response.data.length,
  };
};

/**
 * Get a specific appointment rule
 */
export const getAppointmentRule = async (
  tenantId: string,
  ruleCode: string
): Promise<AppointmentRuleResponse> => {
  const response = await axiosClient.get<AppointmentRuleResponse>(
    `${API_BASE}/${tenantId}/appointment-rules/${ruleCode}`
  );
  return response.data;
};

/**
 * Create or update a tenant rule override
 */
export const upsertAppointmentRule = async (
  tenantId: string,
  ruleCode: string,
  data: TenantRuleOverrideRequest
): Promise<AppointmentRuleResponse> => {
  const response = await axiosClient.put<AppointmentRuleResponse>(
    `${API_BASE}/${tenantId}/appointment-rules/${ruleCode}`,
    data
  );
  return response.data;
};

/**
 * Delete a tenant rule override (revert to org default)
 */
export const deleteAppointmentRuleOverride = async (
  tenantId: string,
  ruleCode: string
): Promise<void> => {
  await axiosClient.delete(`${API_BASE}/${tenantId}/appointment-rules/${ruleCode}`);
};

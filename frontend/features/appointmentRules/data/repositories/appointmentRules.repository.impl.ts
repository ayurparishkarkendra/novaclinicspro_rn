/**
 * Appointment Rules Repository Implementation
 * React Query hooks for appointment rules management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listAppointmentRules,
  getAppointmentRule,
  upsertAppointmentRule,
  deleteAppointmentRuleOverride,
} from '../datasources/appointmentRules.api';
import {
  appointmentRulesKeys,
  TenantRuleOverrideRequest,
} from '../models/appointmentRules.dtos';

// ============================================
// QUERY HOOKS
// ============================================

/**
 * Query hook for listing all appointment rules
 */
export const useAppointmentRulesListQuery = (
  tenantId: string,
  options?: { enabled?: boolean }
) => {
  return useQuery({
    queryKey: appointmentRulesKeys.list(tenantId),
    queryFn: () => listAppointmentRules(tenantId),
    enabled: options?.enabled !== false && !!tenantId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Query hook for getting a specific rule
 */
export const useAppointmentRuleQuery = (
  tenantId: string,
  ruleCode: string,
  options?: { enabled?: boolean }
) => {
  return useQuery({
    queryKey: appointmentRulesKeys.detail(tenantId, ruleCode),
    queryFn: () => getAppointmentRule(tenantId, ruleCode),
    enabled: options?.enabled !== false && !!tenantId && !!ruleCode,
  });
};

// ============================================
// MUTATION HOOKS
// ============================================

/**
 * Mutation hook for creating/updating a rule override
 */
export const useUpsertAppointmentRuleMutation = (tenantId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      ruleCode,
      data,
    }: {
      ruleCode: string;
      data: TenantRuleOverrideRequest;
    }) => upsertAppointmentRule(tenantId, ruleCode, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: appointmentRulesKeys.list(tenantId) });
    },
  });
};

/**
 * Mutation hook for deleting a rule override
 */
export const useDeleteAppointmentRuleOverrideMutation = (tenantId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ruleCode: string) => deleteAppointmentRuleOverride(tenantId, ruleCode),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: appointmentRulesKeys.list(tenantId) });
    },
  });
};

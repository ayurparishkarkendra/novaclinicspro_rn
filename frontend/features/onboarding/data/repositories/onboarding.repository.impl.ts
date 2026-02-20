/**
 * Onboarding Repository Implementation
 * React Query hooks for onboarding management
 */

import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import {
  getApplicationDetailApi,
  getValidationReportApi,
  improveApplicationApi,
  resubmitApplicationApi,
  createDemoTenantApi,
  getDemoStatusApi,
  transitionDemoToLiveApi,
  getSetupWizardContextApi,
  getSetupWizardProgressApi,
  completeSetupWizardApi,
  getOnboardingStatusApi,
  submitStepDataApi,
  completeSetupApi,
} from '../datasources/onboarding.api';
import {
  ApplicationDetailResponse,
  ValidationReportResponse,
  ApplicationImprovementRequest,
  ApplicationImprovementResponse,
  DemoCreateRequest,
  DemoCreateResponse,
  DemoStatusResponse,
  SetupWizardContextResponse,
  SetupWizardProgressResponse,
  OnboardingStatusResponse,
  StepSubmitRequest,
  StepSubmitResponse,
  CompleteSetupResponse,
} from '../models/onboarding.dtos';

// ============================================
// QUERY KEYS
// ============================================

export const onboardingKeys = {
  all: ['onboarding'] as const,
  applications: () => [...onboardingKeys.all, 'applications'] as const,
  application: (id: string) => [...onboardingKeys.applications(), id] as const,
  validationReport: (id: string) => [...onboardingKeys.application(id), 'validation'] as const,
  demos: () => [...onboardingKeys.all, 'demos'] as const,
  demo: (id: string) => [...onboardingKeys.demos(), id] as const,
  setupWizard: (id: string) => [...onboardingKeys.all, 'setup-wizard', id] as const,
  setupProgress: (id: string) => [...onboardingKeys.setupWizard(id), 'progress'] as const,
  status: (tenantId: string) => [...onboardingKeys.all, 'status', tenantId] as const,
};

// ============================================
// QUERY HOOKS
// ============================================

/**
 * Hook to get application details
 */
export const useApplicationDetailQuery = (
  applicationId: string,
  options?: Omit<UseQueryOptions<ApplicationDetailResponse, Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<ApplicationDetailResponse, Error>({
    queryKey: onboardingKeys.application(applicationId),
    queryFn: () => getApplicationDetailApi(applicationId),
    enabled: !!applicationId,
    ...options,
  });
};

/**
 * Hook to get validation report
 */
export const useValidationReportQuery = (
  applicationId: string,
  options?: Omit<UseQueryOptions<ValidationReportResponse, Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<ValidationReportResponse, Error>({
    queryKey: onboardingKeys.validationReport(applicationId),
    queryFn: () => getValidationReportApi(applicationId),
    enabled: !!applicationId,
    ...options,
  });
};

/**
 * Hook to get demo status
 */
export const useDemoStatusQuery = (
  demoTenantId: string,
  options?: Omit<UseQueryOptions<DemoStatusResponse, Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<DemoStatusResponse, Error>({
    queryKey: onboardingKeys.demo(demoTenantId),
    queryFn: () => getDemoStatusApi(demoTenantId),
    enabled: !!demoTenantId,
    refetchInterval: 60000, // Refresh every minute
    ...options,
  });
};

/**
 * Hook to get setup wizard context
 */
export const useSetupWizardContextQuery = (
  applicationId: string,
  options?: Omit<UseQueryOptions<SetupWizardContextResponse, Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<SetupWizardContextResponse, Error>({
    queryKey: onboardingKeys.setupWizard(applicationId),
    queryFn: () => getSetupWizardContextApi(applicationId),
    enabled: !!applicationId,
    ...options,
  });
};

/**
 * Hook to get setup wizard progress
 */
export const useSetupWizardProgressQuery = (
  applicationId: string,
  options?: Omit<UseQueryOptions<SetupWizardProgressResponse, Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<SetupWizardProgressResponse, Error>({
    queryKey: onboardingKeys.setupProgress(applicationId),
    queryFn: () => getSetupWizardProgressApi(applicationId),
    enabled: !!applicationId,
    ...options,
  });
};

// ============================================
// MUTATION HOOKS
// ============================================

/**
 * Hook to improve application
 */
export const useImproveApplicationMutation = (applicationId: string) => {
  const queryClient = useQueryClient();

  return useMutation<ApplicationImprovementResponse, Error, ApplicationImprovementRequest>({
    mutationFn: (data) => improveApplicationApi(applicationId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: onboardingKeys.application(applicationId) });
      queryClient.invalidateQueries({ queryKey: onboardingKeys.validationReport(applicationId) });
    },
    onError: (error) => {
      console.error('[useImproveApplicationMutation] Error:', error);
    },
  });
};

/**
 * Hook to resubmit application
 */
export const useResubmitApplicationMutation = (applicationId: string) => {
  const queryClient = useQueryClient();

  return useMutation<ApplicationDetailResponse, Error, void>({
    mutationFn: () => resubmitApplicationApi(applicationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: onboardingKeys.application(applicationId) });
    },
    onError: (error) => {
      console.error('[useResubmitApplicationMutation] Error:', error);
    },
  });
};

/**
 * Hook to create demo tenant
 */
export const useCreateDemoTenantMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<DemoCreateResponse, Error, DemoCreateRequest>({
    mutationFn: (data) => createDemoTenantApi(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: onboardingKeys.demos() });
    },
    onError: (error) => {
      console.error('[useCreateDemoTenantMutation] Error:', error);
    },
  });
};

/**
 * Hook to transition demo to live
 */
export const useTransitionDemoToLiveMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<{ tenant_id: string }, Error, string>({
    mutationFn: (demoTenantId) => transitionDemoToLiveApi(demoTenantId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: onboardingKeys.demos() });
    },
    onError: (error) => {
      console.error('[useTransitionDemoToLiveMutation] Error:', error);
    },
  });
};

/**
 * Hook to complete setup wizard
 */
export const useCompleteSetupWizardMutation = (applicationId: string) => {
  const queryClient = useQueryClient();

  return useMutation<{ tenant_id: string }, Error, void>({
    mutationFn: () => completeSetupWizardApi(applicationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: onboardingKeys.setupWizard(applicationId) });
    },
    onError: (error) => {
      console.error('[useCompleteSetupWizardMutation] Error:', error);
    },
  });
};

/**
 * Hook to get onboarding status (NEW - Dynamic Steps)
 */
export const useOnboardingStatusQuery = (
  tenantId: string,
  options?: Omit<UseQueryOptions<OnboardingStatusResponse, Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<OnboardingStatusResponse, Error>({
    queryKey: onboardingKeys.status(tenantId),
    queryFn: () => getOnboardingStatusApi(tenantId),
    enabled: !!tenantId,
    staleTime: 30000, // 30 seconds
    ...options,
  });
};

/**
 * Hook to submit step data
 */
export const useSubmitStepMutation = (tenantId: string, stepCode: string) => {
  const queryClient = useQueryClient();

  return useMutation<StepSubmitResponse, Error, StepSubmitRequest>({
    mutationFn: (data) => submitStepDataApi(tenantId, stepCode, data),
    onSuccess: () => {
      // Invalidate onboarding status to refetch
      queryClient.invalidateQueries({ queryKey: onboardingKeys.status(tenantId) });
    },
    onError: (error) => {
      console.error('[useSubmitStepMutation] Error:', error);
    },
  });
};

/**
 * Hook to complete setup (NEW)
 */
export const useCompleteSetupMutation = (tenantId: string) => {
  const queryClient = useQueryClient();

  return useMutation<CompleteSetupResponse, Error, void>({
    mutationFn: () => completeSetupApi(tenantId),
    onSuccess: () => {
      // Invalidate all onboarding queries
      queryClient.invalidateQueries({ queryKey: onboardingKeys.all });
    },
    onError: (error) => {
      console.error('[useCompleteSetupMutation] Error:', error);
    },
  });
};

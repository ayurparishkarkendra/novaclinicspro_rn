/**
 * Onboarding Repository Implementation
 * React Query hooks for onboarding management
 */

import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { useCallback, useRef } from 'react';
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
  associateClinicEntryApi,
  createClinicEntryApi,
  createInitialOrganizationApi,
  getContactVerificationStatusApi,
  getOrganizationContextApi,
  getOwnershipStatusApi,
  refreshEffectiveTenantApi,
  requestContactVerificationApi,
  selectEffectiveTenantApi,
  ensureWorkspacePreparationApi,
  getWorkspacePreparationApi,
  retryWorkspacePreparationApi,
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
  WorkspacePreparationDatasourceError,
  WorkspacePreparationResponseDTO,
} from '../models/onboarding.dtos';
import {
  BringClinicInput,
  ClinicEntryResult,
  ContactVerificationResult,
  EffectiveTenantResult,
  NewClinicInput,
  InitialOrganizationResult,
  OwnershipStatusResult,
} from '../../domain/clinic-entry';
import {
  WORKSPACE_PREPARATION_CONTRACT_V1,
  WorkspacePreparation,
  WorkspacePreparationError,
} from '../../domain/entities/workspace-preparation.entity';
import { buildWorkspacePreparationViewModel } from '../../domain/usecases/build-workspace-preparation-view-model.usecase';

type StepSubmitVariables = StepSubmitRequest & {
  idempotencyKey?: string;
};

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
  organizationContext: () => [...onboardingKeys.all, 'organization-context'] as const,
  workspacePreparations: (organizationId: string, tenantId: string) =>
    [...onboardingKeys.all, 'workspace-preparation', organizationId, tenantId] as const,
  workspacePreparation: (organizationId: string, tenantId: string) =>
    [
      ...onboardingKeys.workspacePreparations(organizationId, tenantId),
      WORKSPACE_PREPARATION_CONTRACT_V1,
    ] as const,
};

const mapWorkspacePreparation = (
  dto: WorkspacePreparationResponseDTO
): WorkspacePreparation =>
  buildWorkspacePreparationViewModel({
    contractVersion: dto.contract_version,
    runId: dto.run_id,
    state: dto.state,
    aggregateVersion: dto.aggregate_version,
    progress: dto.progress,
    units: dto.units.map((unit) => ({
      code: unit.code,
      outcome: unit.outcome,
      evidenceVersion: unit.evidence_version,
      attempt: unit.attempt,
      observedAt: unit.observed_at,
      recordedAt: unit.recorded_at,
    })),
    reasonCode: dto.reason_code,
    retryAllowed: dto.retry_allowed,
    userRetryCount: dto.user_retry_count,
    maxUserRetries: dto.max_user_retries,
    nextAction: dto.next_action,
    refreshAfterSeconds: dto.refresh_after_seconds,
    supportCorrelationId: dto.support_correlation_id,
    updatedAt: dto.updated_at,
  });

const mapWorkspacePreparationError = (error: unknown): never => {
  if (error instanceof WorkspacePreparationError) throw error;
  if (error instanceof WorkspacePreparationDatasourceError) {
    throw new WorkspacePreparationError(error.errorCode, error.messageToken, error.retryable);
  }
  throw new WorkspacePreparationError(
    'workspace_preparation.execution_failure',
    'errors.workspacePreparation.execution_failure',
    true
  );
};

export const workspacePreparationRepository = {
  async ensureWorkspacePreparation(tenantId: string): Promise<WorkspacePreparation> {
    try {
      return mapWorkspacePreparation(await ensureWorkspacePreparationApi(tenantId));
    } catch (error) {
      return mapWorkspacePreparationError(error);
    }
  },
  async getWorkspacePreparation(tenantId: string): Promise<WorkspacePreparation> {
    try {
      return mapWorkspacePreparation(await getWorkspacePreparationApi(tenantId));
    } catch (error) {
      return mapWorkspacePreparationError(error);
    }
  },
  async retryWorkspacePreparation(
    tenantId: string,
    aggregateVersion: number,
    idempotencyKey: string
  ): Promise<WorkspacePreparation> {
    try {
      return mapWorkspacePreparation(
        await retryWorkspacePreparationApi(tenantId, aggregateVersion, idempotencyKey)
      );
    } catch (error) {
      return mapWorkspacePreparationError(error);
    }
  },
};

export const shouldRetryWorkspacePreparation = (
  failureCount: number,
  error: Error
): boolean =>
  error instanceof WorkspacePreparationError && error.retryable && failureCount < 2;

export const useWorkspacePreparationQuery = (
  organizationId: string,
  tenantId: string,
  options?: Omit<UseQueryOptions<WorkspacePreparation, Error>, 'queryKey' | 'queryFn'>
) =>
  useQuery<WorkspacePreparation, Error>({
    queryKey: onboardingKeys.workspacePreparation(organizationId, tenantId),
    queryFn: () => workspacePreparationRepository.getWorkspacePreparation(tenantId),
    enabled: Boolean(organizationId && tenantId),
    retry: shouldRetryWorkspacePreparation,
    ...options,
  });

export const useEnsureWorkspacePreparationMutation = (
  organizationId: string,
  tenantId: string
) => {
  const queryClient = useQueryClient();
  const queryKey = onboardingKeys.workspacePreparation(organizationId, tenantId);
  return useMutation<WorkspacePreparation, Error, void>({
    mutationFn: () => workspacePreparationRepository.ensureWorkspacePreparation(tenantId),
    onSuccess: (value) => {
      queryClient.setQueryData(queryKey, value);
      queryClient.invalidateQueries({ queryKey });
    },
    retry: false,
  });
};

export const useRetryWorkspacePreparationMutation = (
  organizationId: string,
  tenantId: string
) => {
  const queryClient = useQueryClient();
  const queryKey = onboardingKeys.workspacePreparation(organizationId, tenantId);
  const scope = `${organizationId}:${tenantId}`;
  const pendingIntent = useRef<{
    scope: string;
    key: string;
    aggregateVersion: number;
  } | null>(null);
  return useMutation<
    WorkspacePreparation,
    Error,
    { aggregateVersion: number }
  >({
    mutationFn: ({ aggregateVersion }) => {
      if (pendingIntent.current?.scope !== scope) pendingIntent.current = null;
      pendingIntent.current ??= {
        scope,
        key: `workspace-preparation-retry-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        aggregateVersion,
      };
      return workspacePreparationRepository.retryWorkspacePreparation(
        tenantId,
        pendingIntent.current.aggregateVersion,
        pendingIntent.current.key
      );
    },
    onSuccess: (value) => {
      queryClient.setQueryData(queryKey, value);
      queryClient.invalidateQueries({ queryKey });
      pendingIntent.current = null;
    },
    retry: false,
  });
};

export const useClearWorkspacePreparationCache = () => {
  const queryClient = useQueryClient();
  return useCallback(
    async (organizationId: string, tenantId: string): Promise<void> => {
      const queryKey = onboardingKeys.workspacePreparations(organizationId, tenantId);
      await queryClient.cancelQueries({ queryKey });
      queryClient.removeQueries({ queryKey });
    },
    [queryClient]
  );
};

export const useOrganizationContextQuery = () =>
  useQuery({
    queryKey: onboardingKeys.organizationContext(),
    queryFn: getOrganizationContextApi,
  });

export const useCreateInitialOrganizationMutation = () =>
  useMutation<InitialOrganizationResult, Error, string>({
    mutationFn: createInitialOrganizationApi,
  });

export const useRequestContactVerificationMutation = () =>
  useMutation<
    ContactVerificationResult,
    Error,
    {
      organizationId: string;
      contactKind: 'email' | 'mobile';
      contactValue: string;
      intendedOperation: 'clinic_entry.create.v1' | 'clinic_entry.associate.v1';
      idempotencyKey: string;
    }
  >({
    mutationFn: (variables) =>
      requestContactVerificationApi(
        variables.organizationId,
        variables.contactKind,
        variables.contactValue,
        variables.intendedOperation,
        variables.idempotencyKey
      ),
  });

export const useContactVerificationStatusMutation = () =>
  useMutation<
    ContactVerificationResult,
    Error,
    { organizationId: string; evidenceId: string }
  >({
    mutationFn: ({ organizationId, evidenceId }) =>
      getContactVerificationStatusApi(organizationId, evidenceId),
  });

export const useOwnershipStatusMutation = () =>
  useMutation<
    OwnershipStatusResult,
    Error,
    { organizationId: string; ownershipReference: string }
  >({
    mutationFn: ({ organizationId, ownershipReference }) =>
      getOwnershipStatusApi(organizationId, ownershipReference),
  });

export const useCreateClinicEntryMutation = () =>
  useMutation<
    ClinicEntryResult,
    Error,
    {
      organizationId: string;
      input: NewClinicInput;
      evidenceReference: string;
      idempotencyKey: string;
    }
  >({
    mutationFn: ({ organizationId, input, evidenceReference, idempotencyKey }) =>
      createClinicEntryApi(organizationId, input, evidenceReference, idempotencyKey),
  });

export const useAssociateClinicEntryMutation = () =>
  useMutation<
    ClinicEntryResult,
    Error,
    {
      organizationId: string;
      input: BringClinicInput;
      evidenceReference: string;
      idempotencyKey: string;
    }
  >({
    mutationFn: ({ organizationId, input, evidenceReference, idempotencyKey }) =>
      associateClinicEntryApi(organizationId, input, evidenceReference, idempotencyKey),
  });

export const useSelectEffectiveTenantMutation = () =>
  useMutation<
    EffectiveTenantResult,
    Error,
    { organizationId: string; tenantId: string; idempotencyKey: string }
  >({
    mutationFn: ({ organizationId, tenantId, idempotencyKey }) =>
      selectEffectiveTenantApi(organizationId, tenantId, idempotencyKey),
  });

export const useRefreshEffectiveTenantMutation = () =>
  useMutation<EffectiveTenantResult, Error, string>({
    mutationFn: refreshEffectiveTenantApi,
  });

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

  return useMutation<StepSubmitResponse, Error, StepSubmitVariables>({
    mutationFn: ({ idempotencyKey, ...data }) => submitStepDataApi(tenantId, stepCode, data, idempotencyKey),
    onSuccess: () => {
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

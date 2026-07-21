import { useCallback, useEffect, useMemo } from 'react';

import {
  useEnsureWorkspacePreparationMutation,
  useOrganizationContextQuery,
  useRetryWorkspacePreparationMutation,
  useWorkspacePreparationQuery,
} from '../../data/repositories/onboarding.repository.impl';
import {
  WorkspacePreparationFailureInformation,
  WorkspacePreparationOrchestrationState,
} from '../../domain/entities/workspace-preparation.entity';
import {
  deriveWorkspacePreparationState,
  translateWorkspacePreparationError,
} from '../../domain/usecases/build-workspace-preparation-view-model.usecase';

export interface WorkspacePreparationPresentationState {
  readonly loading: boolean;
  readonly domain: WorkspacePreparationOrchestrationState | null;
  readonly error: WorkspacePreparationFailureInformation | null;
  readonly retrying: boolean;
  readonly retry: () => Promise<void>;
  readonly reload: () => Promise<void>;
}

export const useWorkspacePreparation = (
  tenantId: string,
  requestedOrganizationId?: string | null
): WorkspacePreparationPresentationState => {
  const organizationContext = useOrganizationContextQuery();
  const organizationId =
    requestedOrganizationId ?? organizationContext.data?.effectiveOrganizationId ?? '';
  const ensure = useEnsureWorkspacePreparationMutation(organizationId, tenantId);
  const status = useWorkspacePreparationQuery(organizationId, tenantId, {
    enabled: Boolean(organizationId && tenantId && ensure.isSuccess),
  });
  const retryMutation = useRetryWorkspacePreparationMutation(organizationId, tenantId);
  const ensureIdle = ensure.isIdle;
  const ensurePreparation = ensure.mutate;

  useEffect(() => {
    if (organizationId && tenantId && ensureIdle) ensurePreparation();
  }, [ensureIdle, ensurePreparation, organizationId, tenantId]);

  const preparation = status.data ?? ensure.data ?? null;
  const domain = useMemo(
    () => (preparation ? deriveWorkspacePreparationState(preparation) : null),
    [preparation]
  );
  const rawError = organizationContext.error ?? ensure.error ?? status.error ?? retryMutation.error;
  const error = useMemo(
    () => (rawError ? translateWorkspacePreparationError(rawError) : null),
    [rawError]
  );

  const retry = useCallback(async () => {
    if (!domain?.retry.available) return;
    await retryMutation.mutateAsync({ aggregateVersion: domain.aggregateVersion });
  }, [domain, retryMutation]);

  const reload = useCallback(async () => {
    if (ensure.isError) {
      await ensure.mutateAsync();
      return;
    }
    await status.refetch();
  }, [ensure, status]);

  return {
    loading:
      organizationContext.isLoading ||
      ensure.isIdle ||
      ensure.isPending ||
      (ensure.isSuccess && status.isLoading),
    domain,
    error,
    retrying: retryMutation.isPending,
    retry,
    reload,
  };
};

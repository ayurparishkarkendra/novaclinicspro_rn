import { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  useClearJourneyVisibilityCache,
  useClearOnboardingStatusCache,
  useJourneyVisibilityQuery,
  useOnboardingStatusQuery,
  useOrganizationContextQuery,
} from '../../data/repositories/onboarding.repository.impl';
import { mapOnboardingStatusToDomain } from '../../domain/entities/onboarding-status.entity';
import { PROGRESSIVE_EXPERIENCE_JOURNEY_DEFINITION } from '../../domain/entities/journey.entity';
import { JourneyVisibilityError } from '../../domain/entities/journey-visibility.entity';
import { buildJourneyViewModelFromVisibilityProjection } from '../../domain/usecases/build-journey-view-model.usecase';

interface UseJourneyFoundationOptions {
  enabled?: boolean;
}

export const useJourneyFoundation = (
  tenantId: string,
  options: UseJourneyFoundationOptions = {}
) => {
  const organizationContext = useOrganizationContextQuery();
  const organizationId = organizationContext.data?.effectiveOrganizationId ?? '';
  const scopeMatches = Boolean(
    organizationId &&
      tenantId &&
      organizationContext.data?.effectiveTenantId === tenantId &&
      !organizationContext.data?.sessionRefreshRequired
  );
  const enabled = (options.enabled ?? Boolean(tenantId)) && scopeMatches;
  const statusQuery = useOnboardingStatusQuery(tenantId, {
    enabled,
  });
  const visibilityQuery = useJourneyVisibilityQuery(organizationId, tenantId, { enabled });
  const refetchStatus = statusQuery.refetch;
  const refetchVisibility = visibilityQuery.refetch;
  const refetchOrganizationContext = organizationContext.refetch;
  const clearVisibilityCache = useClearJourneyVisibilityCache();
  const clearStatusCache = useClearOnboardingStatusCache();
  const previousScope = useRef<{ organizationId: string; tenantId: string } | null>(null);
  const hasMatchingTenant = statusQuery.data?.tenant_id === tenantId;
  const hasMatchingProjection = visibilityQuery.data?.identity.tenantId === tenantId;

  useEffect(() => {
    const previous = previousScope.current;
    if (
      previous &&
      (previous.organizationId !== organizationId || previous.tenantId !== tenantId)
    ) {
      void clearVisibilityCache(previous.organizationId, previous.tenantId);
      void clearStatusCache(previous.organizationId, previous.tenantId);
    }
    previousScope.current = organizationId && tenantId ? { organizationId, tenantId } : null;
  }, [clearStatusCache, clearVisibilityCache, organizationId, tenantId]);

  useEffect(
    () => () => {
      const current = previousScope.current;
      if (current) {
        void clearVisibilityCache(current.organizationId, current.tenantId);
        void clearStatusCache(current.organizationId, current.tenantId);
      }
    },
    [clearStatusCache, clearVisibilityCache]
  );

  const journey = useMemo(() => {
    if (
      !scopeMatches ||
      !statusQuery.data ||
      !visibilityQuery.data ||
      !hasMatchingTenant ||
      !hasMatchingProjection
    ) {
      return null;
    }

    return buildJourneyViewModelFromVisibilityProjection(
      PROGRESSIVE_EXPERIENCE_JOURNEY_DEFINITION,
      visibilityQuery.data,
      mapOnboardingStatusToDomain(statusQuery.data)
    );
  }, [hasMatchingProjection, hasMatchingTenant, scopeMatches, statusQuery.data, visibilityQuery.data]);

  const refetch = useCallback(async () => {
    if (!scopeMatches) return { data: undefined, projection: undefined };
    const [statusResult, visibilityResult] = await Promise.all([
      refetchStatus(),
      refetchVisibility(),
    ]);
    return { data: statusResult.data, projection: visibilityResult.data };
  }, [refetchStatus, refetchVisibility, scopeMatches]);

  const revalidateTenant = useCallback(async (): Promise<boolean> => {
    const refreshed = await refetchOrganizationContext();
    return Boolean(
      refreshed.data?.effectiveOrganizationId === organizationId &&
        refreshed.data?.effectiveTenantId === tenantId &&
        !refreshed.data?.sessionRefreshRequired
    );
  }, [organizationId, refetchOrganizationContext, tenantId]);

  const scopeError =
    !organizationContext.isLoading && !scopeMatches
      ? new JourneyVisibilityError(
          'TENANT_MISMATCH',
          'journey_visibility.scope_mismatch',
          'errors.journeyVisibility.scope_mismatch',
          false
        )
      : null;

  return {
    ...statusQuery,
    isLoading:
      organizationContext.isLoading ||
      (scopeMatches && (statusQuery.isLoading || visibilityQuery.isLoading)),
    isRefreshing: statusQuery.isRefetching || visibilityQuery.isRefetching,
    error: organizationContext.error ?? scopeError ?? visibilityQuery.error ?? statusQuery.error,
    data: hasMatchingTenant ? statusQuery.data : undefined,
    projection: scopeMatches && hasMatchingProjection ? visibilityQuery.data : undefined,
    journey,
    refetch,
    revalidateTenant,
    scopeMatches,
  };
};

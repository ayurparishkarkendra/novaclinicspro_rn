import { useMemo } from 'react';
import { useOnboardingStatusQuery } from '../../data/repositories/onboarding.repository.impl';
import { mapOnboardingStatusToDomain } from '../../domain/entities/onboarding-status.entity';
import { PROGRESSIVE_EXPERIENCE_JOURNEY_DEFINITION } from '../../domain/entities/journey.entity';
import { buildJourneyViewModel } from '../../domain/usecases/build-journey-view-model.usecase';

interface UseJourneyFoundationOptions {
  enabled?: boolean;
}

export const useJourneyFoundation = (
  tenantId: string,
  options: UseJourneyFoundationOptions = {}
) => {
  const statusQuery = useOnboardingStatusQuery(tenantId, {
    enabled: options.enabled ?? Boolean(tenantId),
  });

  const journey = useMemo(() => {
    if (!statusQuery.data || statusQuery.data.tenant_id !== tenantId) {
      return null;
    }

    return buildJourneyViewModel(
      PROGRESSIVE_EXPERIENCE_JOURNEY_DEFINITION,
      mapOnboardingStatusToDomain(statusQuery.data)
    );
  }, [statusQuery.data, tenantId]);

  return {
    ...statusQuery,
    journey,
  };
};

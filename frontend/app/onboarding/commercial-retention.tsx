import { useLocalSearchParams } from 'expo-router';

import { CommercialRetentionScreen } from '../../features/onboarding/presentation/pages/CommercialRetentionScreen';

export default function CommercialRetentionRoute() {
  const params = useLocalSearchParams<{
    organizationId?: string;
    tenantId?: string;
  }>();
  return (
    <CommercialRetentionScreen
      organizationId={params.organizationId ?? ''}
      tenantId={params.tenantId ?? ''}
    />
  );
}

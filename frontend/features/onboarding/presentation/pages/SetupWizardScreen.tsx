/**
 * SetupWizardScreen
 * Entry point that redirects to the new wizard flow
 */

import React, { useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LoadingScreen } from '../components/LoadingScreen';

export function SetupWizardScreen() {
  const router = useRouter();
  const { tenantId } = useLocalSearchParams<{ tenantId: string }>();

  useEffect(() => {
    if (tenantId) {
      // Redirect to the new wizard flow
      router.replace(`/onboarding/wizard-flow?tenantId=${tenantId}`);
    }
  }, [tenantId, router]);

  return <LoadingScreen message="Loading setup wizard..." />;
}

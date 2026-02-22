/**
 * Episode Detail Page
 * Full-page view of a single episode with visits and documents
 */

import React from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { EpisodeDetailScreen } from '../../../../features/episodes/presentation/pages/EpisodeDetailScreen';
import { useAuth } from '../../../../features/auth/presentation/hooks/useAuth';

export default function EpisodeDetailPage() {
  const router = useRouter();
  const { episodeId } = useLocalSearchParams<{ episodeId: string }>();
  const { currentUser } = useAuth();
  const tenantId = currentUser?.tenantId || '';

  const handleNavigateToAppointment = (appointmentId: string) => {
    router.push(`/clinic-admin/appointments/${appointmentId}` as any);
  };

  const handleNavigateToDocument = (documentId: string, type: string) => {
    // Navigate to document detail based on type
    if (type === 'casesheet') {
      router.push(`/clinic-admin/casesheets/${documentId}` as any);
    } else if (type === 'prescription') {
      router.push(`/clinic-admin/prescriptions/${documentId}` as any);
    } else if (type === 'treatment_sheet') {
      router.push(`/clinic-admin/treatment-sheets/${documentId}` as any);
    }
  };

  return (
    <EpisodeDetailScreen 
      tenantId={tenantId}
      episodeId={episodeId || ''} 
      onNavigateToAppointment={handleNavigateToAppointment}
      onNavigateToDocument={handleNavigateToDocument}
      onBack={() => router.back()}
    />
  );
}


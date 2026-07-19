/**
 * Episode Workspace Route
 * /clinic-admin/episodes/[episodeId]/workspace
 *
 * Accepts mode ("doctor" | "admin"), clientId, optional initialTab, and
 * (T-FE-A.1) optional appointmentId as query params.
 * Entry point for both Doctor Dashboard and Admin Dashboard appointment taps.
 *
 * T-FE-A.1 (FR-COS-1 AC1): the SAME route now also renders the
 * VisitCommandCenter shell, gated behind cos_v1 — no new route created.
 * With cos_v1 off, this is byte-identical to the pre-T-FE-A.1 behavior
 * (the legacy branch below is unchanged code, just now inside an if/else).
 */

import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { EpisodeWorkspaceScreen, WorkspaceTab } from '../../../../features/episodes/presentation/pages/EpisodeWorkspaceScreen';
import { VisitCommandCenter } from '../../../../features/episodes/presentation/pages/VisitCommandCenter';
import type { WorkspaceMode } from '../../../../features/episodes/presentation/config/episodeWorkspaceConfig';
import { useFeatures, isCosV1Enabled } from '../../../../core/hooks/useFeatures';

export default function EpisodeWorkspaceRoute() {
  const { episodeId, mode, clientId, initialTab, appointmentId } = useLocalSearchParams<{
    episodeId: string;
    mode?: string;
    clientId?: string;
    initialTab?: string;
    appointmentId?: string;
  }>();

  const features = useFeatures();

  if (isCosV1Enabled(features)) {
    return (
      <VisitCommandCenter
        episodeId={episodeId ?? ''}
        appointmentId={appointmentId}
        clientId={clientId ?? ''}
      />
    );
  }

  const resolvedMode: WorkspaceMode =
    mode === 'admin' ? 'admin' : 'doctor';

  const resolvedTab: WorkspaceTab =
    initialTab === 'treatmentPlans' ? 'treatmentPlans'
    : initialTab === 'visitNotes' ? 'visitNotes'
    : 'prescriptions';

  return (
    <EpisodeWorkspaceScreen
      mode={resolvedMode}
      episodeId={episodeId ?? ''}
      clientId={clientId ?? ''}
      initialTab={resolvedTab}
    />
  );
}

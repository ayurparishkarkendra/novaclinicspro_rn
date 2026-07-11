/**
 * Episode Workspace Route
 * /clinic-admin/episodes/[episodeId]/workspace
 *
 * Accepts mode ("doctor" | "admin"), clientId, and optional initialTab as query params.
 * Entry point for both Doctor Dashboard and Admin Dashboard appointment taps.
 */

import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { EpisodeWorkspaceScreen, WorkspaceTab } from '../../../../features/episodes/presentation/pages/EpisodeWorkspaceScreen';
import type { WorkspaceMode } from '../../../../features/episodes/presentation/config/episodeWorkspaceConfig';

export default function EpisodeWorkspaceRoute() {
  const { episodeId, mode, clientId, initialTab } = useLocalSearchParams<{
    episodeId: string;
    mode?: string;
    clientId?: string;
    initialTab?: string;
  }>();

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

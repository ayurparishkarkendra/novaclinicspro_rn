/**
 * ClinicalWorkspace (R3A · T-A.2, ADR-R3A-01/02)
 *
 * The shell the consultation route renders. Wraps the existing, unchanged
 * ConsultationWorkspaceScreen in WorkspaceProvider (T-A.1) so Persistent
 * Context is available for the life of the workspace session.
 *
 * Zero behavior change in this task: ConsultationWorkspaceScreen still
 * receives the same three props it always has and still resolves every
 * section exactly as it does today. No module reads from WorkspaceProvider
 * yet — Group B migrates modules to it one at a time (design.md §13).
 *
 * Entry resolution (caseResolver.ts / consultationRoutes.ts) is untouched
 * (FR-A3, NAV-2) — this component only changes what the destination screen
 * does with the identifiers it already receives.
 */

import React from 'react';
import { useAuth } from '../../../auth/presentation/hooks/useAuth';
import { WorkspaceProvider } from '../context/ClinicalWorkspaceContext';
import { ConsultationWorkspaceScreen } from './ConsultationWorkspaceScreen';

export interface ClinicalWorkspaceProps {
  episodeId: string;
  appointmentId: string;
  clientId: string;
}

export const ClinicalWorkspace: React.FC<ClinicalWorkspaceProps> = ({
  episodeId,
  appointmentId,
  clientId,
}) => {
  // Same tenantId resolution ConsultationWorkspaceScreen performs internally
  // today — useAuth() reads from the auth store, not the network, so calling
  // it here in addition to inside ConsultationWorkspaceScreen introduces no
  // new fetch and no behavior change.
  const { currentUser, selectedClinicId } = useAuth();
  const tenantId = selectedClinicId || currentUser?.tenantId || '';

  return (
    <WorkspaceProvider tenantId={tenantId} episodeId={episodeId} appointmentId={appointmentId} clientId={clientId}>
      <ConsultationWorkspaceScreen episodeId={episodeId} appointmentId={appointmentId} clientId={clientId} />
    </WorkspaceProvider>
  );
};

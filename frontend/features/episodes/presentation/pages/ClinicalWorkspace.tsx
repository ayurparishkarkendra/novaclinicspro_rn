/**
 * ClinicalWorkspace (R3A · T-A.2/T-D.1, ADR-R3A-01/02/03)
 *
 * The shell the consultation route renders. Wraps the existing, unchanged
 * ConsultationWorkspaceScreen in WorkspaceProvider (T-A.1) so Persistent
 * Context is available for the life of the workspace session.
 *
 * T-D.1 adds WorkspaceSaveStatusProvider + WorkspaceHeader as siblings of
 * ConsultationWorkspaceScreen, matching design §4's target architecture
 * diagram (WorkspaceHeader and ModuleHost are both children of
 * WorkspaceProvider, not of each other). WorkspaceSaveStatusProvider is a
 * SEPARATE context from WorkspaceProvider's own (see
 * WorkspaceSaveStatusContext.tsx's docstring for why) — its addition here
 * changes nothing about how ConsultationWorkspaceScreen or any module
 * resolves episodeId/appointmentId/clientId.
 *
 * Entry resolution (caseResolver.ts / consultationRoutes.ts) is untouched
 * (FR-A3, NAV-2) — this component only changes what the destination screen
 * does with the identifiers it already receives.
 */

import React from 'react';
import { View } from 'react-native';
import { useAuth } from '../../../auth/presentation/hooks/useAuth';
import { WorkspaceProvider } from '../context/ClinicalWorkspaceContext';
import { WorkspaceSaveStatusProvider } from '../context/WorkspaceSaveStatusContext';
import { WorkspaceHeader } from '../components/WorkspaceHeader';
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
      <WorkspaceSaveStatusProvider>
        <View style={{ flex: 1 }}>
          <WorkspaceHeader />
          <ConsultationWorkspaceScreen episodeId={episodeId} appointmentId={appointmentId} clientId={clientId} />
        </View>
      </WorkspaceSaveStatusProvider>
    </WorkspaceProvider>
  );
};

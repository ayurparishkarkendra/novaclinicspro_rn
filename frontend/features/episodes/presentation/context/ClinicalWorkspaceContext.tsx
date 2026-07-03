/**
 * Clinical Workspace — Persistent Context (R3A · T-A.1, ADR-R3A-01)
 *
 * Single owner of Patient/Episode/Visit identity + summary data for the
 * lifetime of a Clinical Workspace session (design.md §9.B, §5 Ownership
 * Rules). This is a RELOCATION of the existing useEpisodeWorkspaceData()
 * fetch already performed by useConsultationWorkspace.ts — not a new query
 * (design §9.B(2)). useEpisodeWorkspaceData itself is unchanged and remains
 * shared with EpisodeWorkspaceScreen.tsx / CompleteConsultationScreen.tsx;
 * only WorkspaceProvider's own use of it is new.
 *
 * No module consumes this yet (T-A.1 scope) — Group B migrates modules to
 * read from here one at a time.
 *
 * Visit is mirrored read-only from the existing nested VisitInfo lookup
 * (ADR-R3A-04) — no new fetch, no independent business state (Phase 2
 * Requirements.md CL-1).
 */

import React, { createContext, ReactNode, useContext, useMemo } from 'react';
import { useEpisodeWorkspaceData } from '../hooks/useEpisodeWorkspaceData';
import { EpisodeDetailsResponse, VisitInfo } from '../../data/models/episodes.dtos';

export interface PatientContextValue {
  clientId: string;
  clientName: string;
}

export interface EpisodeContextValue {
  episodeId: string;
  episodeDetails: EpisodeDetailsResponse | undefined;
  isEpisodeLoading: boolean;
  isEpisodeError: boolean;
  refetchEpisode: () => void;
}

export interface VisitContextValue {
  appointmentId: string;
  visit: VisitInfo | undefined;
}

export interface WorkspaceContextValue {
  patient: PatientContextValue;
  episode: EpisodeContextValue;
  visit: VisitContextValue;
}

const WorkspaceContext = createContext<WorkspaceContextValue | undefined>(undefined);

export interface WorkspaceProviderProps {
  tenantId: string;
  episodeId: string;
  appointmentId: string;
  clientId: string;
  children: ReactNode;
}

export const WorkspaceProvider: React.FC<WorkspaceProviderProps> = ({
  tenantId,
  episodeId,
  appointmentId,
  clientId,
  children,
}) => {
  // Same shared hook useConsultationWorkspace.ts already calls internally
  // (design §9.B(2)) — React Query's own cache dedupes the underlying
  // network requests across both call sites by query key, so this does not
  // introduce a second fetch. useEpisodeWorkspaceData's own clientId
  // fallback (episodeDetails?.episode?.client_id ?? clientId) is reused
  // as-is, not re-derived here.
  const workspaceData = useEpisodeWorkspaceData(tenantId, episodeId, clientId);

  // Same appointment_id-keyed lookup ConsultationWorkspaceScreen.tsx
  // performs today (`workspace.episodeDetails?.visits.find(v => v
  // .appointment_id === appointmentId)`) — relocated, not reimplemented.
  const visit = useMemo(
    () => workspaceData.episodeDetails?.visits.find((v) => v.appointment_id === appointmentId),
    [workspaceData.episodeDetails, appointmentId],
  );

  const value = useMemo<WorkspaceContextValue>(
    () => ({
      patient: {
        clientId: workspaceData.clientId,
        clientName: workspaceData.clientName,
      },
      episode: {
        episodeId,
        episodeDetails: workspaceData.episodeDetails,
        isEpisodeLoading: workspaceData.isEpisodeLoading,
        isEpisodeError: workspaceData.isEpisodeError,
        refetchEpisode: workspaceData.refetchEpisode,
      },
      visit: {
        appointmentId,
        visit,
      },
    }),
    [
      episodeId,
      appointmentId,
      visit,
      workspaceData.clientId,
      workspaceData.clientName,
      workspaceData.episodeDetails,
      workspaceData.isEpisodeLoading,
      workspaceData.isEpisodeError,
      workspaceData.refetchEpisode,
    ],
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
};

function useWorkspaceContext(hookName: string): WorkspaceContextValue {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error(`${hookName} must be used within a WorkspaceProvider`);
  }
  return context;
}

/** CO-1: Patient identity/summary — single source of truth for the workspace session. */
export const usePatientContext = (): PatientContextValue => useWorkspaceContext('usePatientContext').patient;

/** CO-1: Episode identity/summary — single source of truth for the workspace session. */
export const useEpisodeContext = (): EpisodeContextValue => useWorkspaceContext('useEpisodeContext').episode;

/**
 * CO-4 / ADR-R3A-04: Visit identity + read-only VisitInfo summary, mirrored
 * from the backend aggregate — never an independent frontend source of
 * truth for Visit business state.
 */
export const useVisitContext = (): VisitContextValue => useWorkspaceContext('useVisitContext').visit;

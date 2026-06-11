/**
 * useEpisodeWorkspaceData
 *
 * Shared data hook for EpisodeWorkspaceScreen.
 * Uses episode details as the source of truth for document IDs,
 * then fetches each document by ID directly (no list queries).
 *
 * SOLID: Single Responsibility — data fetching only, no UI logic.
 * DRY: one hook consumed by both doctor and admin workspace.
 */

import { useMemo } from 'react';
import { useEpisodeDetailsQuery } from '../../data/repositories/episodes.repository.impl';
import { useCasesheetDetailQuery } from '../../../casesheets/data/repositories/casesheets.repository.impl';
import { useTreatmentSheetDetailQuery } from '../../../treatmentSheets/data/repositories/treatmentSheets.repository.impl';
import { EpisodeDetailsResponse, VisitInfo } from '../../data/models/episodes.dtos';
import { CasesheetResponse } from '../../../casesheets/data/models/casesheets.dtos';
import { TreatmentSheetResponse } from '../../../treatmentSheets/data/models/treatmentSheets.dtos';

export interface EpisodeWorkspaceData {
  // Episode
  episodeDetails: EpisodeDetailsResponse | undefined;
  isEpisodeLoading: boolean;
  isEpisodeError: boolean;
  refetchEpisode: () => void;

  // Casesheet (fetched by ID from episode details)
  casesheet: CasesheetResponse | undefined;
  casesheetId: string | null;
  hasCasesheet: boolean;
  isCasesheetLoading: boolean;

  // Treatment sheet (fetched by ID from episode details)
  treatmentSheet: TreatmentSheetResponse | undefined;
  treatmentSheetId: string | null;
  hasTreatmentSheet: boolean;
  isTreatmentSheetLoading: boolean;
  isTreatmentSheetError: boolean;
  refetchTreatmentSheet: () => void;

  // Visits (from episodeDetails — sorted newest first)
  visits: VisitInfo[];

  // Derived
  clientId: string;
  clientName: string;
}

export const useEpisodeWorkspaceData = (
  tenantId: string,
  episodeId: string,
  clientId: string,
): EpisodeWorkspaceData => {
  // ── Episode details ───────────────────────────────────────────────────────
  const {
    data: episodeDetails,
    isLoading: isEpisodeLoading,
    isError: isEpisodeError,
    refetch: refetchEpisode,
  } = useEpisodeDetailsQuery(tenantId, episodeId, {
    enabled: !!tenantId && !!episodeId,
  });

  const resolvedClientId = episodeDetails?.episode?.client_id ?? clientId;

  // IDs come directly from episode details — single source of truth
  const casesheetId = episodeDetails?.documents?.casesheet?.id ?? null;
  const hasCasesheet = Boolean(episodeDetails?.documents?.casesheet?.exists);

  const treatmentSheetId = episodeDetails?.documents?.treatment_sheet?.id ?? null;
  const hasTreatmentSheet = Boolean(episodeDetails?.documents?.treatment_sheet?.exists);

  // ── Casesheet detail (by ID) ──────────────────────────────────────────────
  const {
    data: casesheet,
    isLoading: isCasesheetLoading,
  } = useCasesheetDetailQuery(
    tenantId,
    casesheetId ?? '',
    { enabled: !!tenantId && !!casesheetId }
  );

  // ── Treatment sheet detail (by ID) ────────────────────────────────────────
  const {
    data: treatmentSheet,
    isLoading: isTreatmentSheetLoading,
    isError: isTreatmentSheetError,
    refetch: refetchTreatmentSheet,
  } = useTreatmentSheetDetailQuery(
    treatmentSheetId ?? '',
    tenantId,
    { enabled: !!tenantId && !!treatmentSheetId, staleTime: 0 }
  );

  // ── Visits (sorted newest first) ─────────────────────────────────────────
  const visits = useMemo<VisitInfo[]>(() => {
    const raw = episodeDetails?.visits ?? [];
    return [...raw].sort(
      (a, b) =>
        new Date(b.appointment_date).getTime() - new Date(a.appointment_date).getTime()
    );
  }, [episodeDetails?.visits]);

  return {
    episodeDetails,
    isEpisodeLoading,
    isEpisodeError,
    refetchEpisode,
    casesheet,
    casesheetId,
    hasCasesheet,
    isCasesheetLoading,
    treatmentSheet,
    treatmentSheetId,
    hasTreatmentSheet,
    isTreatmentSheetLoading,
    isTreatmentSheetError,
    refetchTreatmentSheet,
    visits,
    clientId: resolvedClientId,
    clientName: episodeDetails?.episode?.client_name ?? '',
  };
};

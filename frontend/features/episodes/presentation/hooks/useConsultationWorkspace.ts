/**
 * useConsultationWorkspace
 *
 * R3A · T-B.1/T-B.2/T-B.3: Case Sheet's, Prescription's, and Treatment
 * Recommendation's own state (autosave, create-if-absent, save status, send
 * logic) now live in CaseSheetModule, PrescriptionModule, and
 * TreatmentRecommendationModule respectively — this hook owns none of them
 * anymore.
 *
 * What remains here: a thin wrapper over useEpisodeWorkspaceData plus
 * buildSectionConfig/the shared SectionKey-family types every module still
 * imports from this file (SectionKey, SectionProgress, SectionSaveStatus,
 * TreatmentRecommendationDraft, etc.) — moving those type exports elsewhere
 * is out of this task's scope (T-B.3 migrates Treatment Recommendation's
 * *state*, not this file's shared type definitions). Every field this hook
 * still returns duplicates something already available via
 * useEpisodeContext()/usePatientContext() (T-A.1) or a direct
 * buildSectionConfig(useFeatures()) call — noted here as a candidate for a
 * future polish task (Group D), not retired unilaterally in this one.
 */

import { useMemo } from 'react';
import { useEpisodeWorkspaceData } from './useEpisodeWorkspaceData';
import { useFeatures, isAyurvedaClinic } from '../../../../core/hooks/useFeatures';
import { EpisodeDetailsResponse } from '../../data/models/episodes.dtos';

// ============================================================
// EXPORTED TYPES
// ============================================================

export type SectionProgressStatus = 'empty' | 'in_progress' | 'complete';
export type SectionSaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export interface SectionProgress {
  status: SectionProgressStatus;
  saveStatus: SectionSaveStatus;
}

export type CoreSectionKey = 'chiefComplaint' | 'clinicalNotes' | 'prescription' | 'treatmentRecommendation' | 'clinicalServices';
export type SpecialtySectionKey = 'ayurvedicAssessment';
export type SectionKey = CoreSectionKey | SpecialtySectionKey;

export interface ConsultationSectionConfig {
  activeSections: SectionKey[];
  specialtySections: Set<SpecialtySectionKey>;
}

export interface TreatmentRecommendationDraft {
  recommendedTherapy: string;
  frequency: 'daily' | 'alternate' | '3x_week' | 'custom';
  customFrequency?: string;
  durationDays: 7 | 14 | 21 | 30 | 45 | 60 | 'custom';
  customDurationDays?: number;
  startPreference: 'asap' | 'specific_date';
  specificStartDate?: Date;
  notesForAdmin: string;
}

export interface UseConsultationWorkspaceInput {
  tenantId: string;
  episodeId: string;
  appointmentId: string;
  clientId: string;
}

export interface UseConsultationWorkspaceOutput {
  // Data from useEpisodeWorkspaceData
  episodeDetails: EpisodeDetailsResponse | undefined;
  isEpisodeLoading: boolean;
  isEpisodeError: boolean;
  refetchEpisode: () => void;
  clientName: string;

  // Section config
  sectionConfig: ConsultationSectionConfig;
}

// ============================================================
// HELPERS
// ============================================================

export function buildSectionConfig(features: ReturnType<typeof useFeatures>): ConsultationSectionConfig {
  const coreSections: SectionKey[] = ['chiefComplaint', 'clinicalNotes', 'prescription', 'treatmentRecommendation'];
  const specialtySections = new Set<SpecialtySectionKey>();

  if (isAyurvedaClinic(features)) {
    specialtySections.add('ayurvedicAssessment');
  }

  const activeSections: SectionKey[] = [
    'chiefComplaint',
    'clinicalNotes',
    ...(isAyurvedaClinic(features) ? ['ayurvedicAssessment' as SpecialtySectionKey] : []),
    'prescription',
    'treatmentRecommendation',
    'clinicalServices',
  ];

  return { activeSections, specialtySections };
}

// ============================================================
// MAIN HOOK
// ============================================================

export function useConsultationWorkspace(
  input: UseConsultationWorkspaceInput,
): UseConsultationWorkspaceOutput {
  const { tenantId, episodeId, clientId } = input;

  // ── Feature config (computed once; stable unless tenant changes) ──────────
  const features = useFeatures();
  const sectionConfig = useMemo(() => buildSectionConfig(features), [features]);

  // ── Episode workspace data (read-only, reactive) ──────────────────────────
  // R3A · T-B.1/T-B.3: casesheet/casesheetId/hasCasesheet and treatmentSheet/
  // treatmentSheetId/hasTreatmentSheet/refetchTreatmentSheet removed from
  // this destructure — CaseSheetModule and TreatmentRecommendationModule now
  // read them via useEpisodeContext() (the same underlying
  // useEpisodeWorkspaceData call, relocated to WorkspaceProvider, not
  // duplicated).
  const {
    episodeDetails,
    isEpisodeLoading,
    isEpisodeError,
    refetchEpisode,
    clientName,
  } = useEpisodeWorkspaceData(tenantId, episodeId, clientId);

  return {
    episodeDetails,
    isEpisodeLoading,
    isEpisodeError,
    refetchEpisode,
    clientName,
    sectionConfig,
  };
}

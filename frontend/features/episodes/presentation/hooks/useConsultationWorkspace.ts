/**
 * useConsultationWorkspace
 *
 * Primary state manager for ConsultationWorkspaceScreen.
 * Composes useEpisodeWorkspaceData (read) with autosave, create-if-absent,
 * and prescription upsert logic.
 *
 * Key responsibilities:
 * - Section config driven by clinic features (never compare clinic_type strings directly)
 * - 1000ms debounced casesheet autosave (POST once, then PATCH)
 * - Prescription load on mount, save (POST/PATCH)
 * - Treatment recommendation draft + sendTreatmentToAdmin
 * - Section progress computation
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useEpisodeWorkspaceData } from './useEpisodeWorkspaceData';
import { useFeatures, isAyurvedaClinic, isFreshnessV1Enabled } from '../../../../core/hooks/useFeatures';
import {
  createCasesheetApi,
  updateCasesheetApi,
} from '../../../casesheets/data/datasources/casesheets.api';
import { casesheetsKeys } from '../../../casesheets/data/repositories/casesheets.repository.impl';
import {
  createPrescriptionApi,
  updatePrescriptionApi,
} from '../../../prescriptions/data/datasources/prescriptions.api';
import { prescriptionsKeys } from '../../../prescriptions/data/repositories/prescriptions.repository.impl';
import {
  sendToSchedulingApi,
  createTreatmentRecommendationApi,
} from '../../../treatmentSheets/data/datasources/treatmentOrders.api';
import { invalidateTreatmentOrderSurfaces } from '../../../treatmentSheets/data/repositories/treatmentOrders.repository.impl';
import { axiosClient } from '../../../../core/api/axiosClient';
import { CasesheetFormData } from '../../../casesheets/presentation/components/CasesheetForm';
import {
  PrescriptionData,
} from '../../../prescriptions/data/models/prescriptions.dtos';
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

export type CoreSectionKey = 'chiefComplaint' | 'clinicalNotes' | 'prescription' | 'treatmentRecommendation';
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

  // Casesheet state
  casesheetId: string | null;
  hasCasesheet: boolean;
  casesheetData: CasesheetFormData;
  isCasesheetSaving: boolean;
  casesheetSaveError: string | null;
  updateCasesheetField: (path: string, value: string) => void;
  updateExtensionField: (templateId: string, fieldId: string, value: string) => void;

  // Prescription state
  prescriptionId: string | null;
  prescriptionData: PrescriptionData;
  isPrescriptionSaving: boolean;
  prescriptionSaveError: string | null;
  prescriptionNotRequired: boolean;
  savePrescription: () => Promise<void>;
  markPrescriptionNotRequired: () => void;
  onChange: (data: PrescriptionData) => void;

  // Treatment recommendation state
  treatmentRecommendation: TreatmentRecommendationDraft;
  isTreatmentSaving: boolean;
  isTreatmentSent: boolean;
  treatmentSaveError: string | null;
  updateTreatmentField: <K extends keyof TreatmentRecommendationDraft>(
    key: K,
    value: TreatmentRecommendationDraft[K],
  ) => void;
  sendTreatmentToAdmin: () => Promise<void>;

  // Section config
  sectionConfig: ConsultationSectionConfig;

  // Section progress
  sectionProgress: Partial<Record<SectionKey, SectionProgress>>;

  // Flush
  flushPendingAutosave: () => Promise<void>;
}

// ============================================================
// HELPERS
// ============================================================

const EMPTY_PRESCRIPTION_DATA: PrescriptionData = { medications: [] };

const EMPTY_CASESHEET_DATA: CasesheetFormData = {
  basic: {},
  extensions: [],
};

const DEFAULT_TREATMENT_DRAFT: TreatmentRecommendationDraft = {
  recommendedTherapy: '',
  frequency: 'daily',
  durationDays: 7,
  startPreference: 'asap',
  notesForAdmin: '',
};

// Execution states that mean the sheet has been sent to admin for scheduling.
// Document status (DRAFT/FINAL/SIGNED) is a separate axis and is NOT used here.
const SENT_EXECUTION_STATES = new Set(['ORDERED', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED']);

const isSentToScheduling = (state?: string | null): boolean =>
  SENT_EXECUTION_STATES.has((state ?? '').toUpperCase());

const normalizeCasesheetData = (casesheet: any): CasesheetFormData => {
  const dataJson = casesheet.data_json ?? casesheet.data ?? {};
  const basic = dataJson.basic ?? dataJson;

  return {
    basic: {
      ...basic,
      chief_complaint: basic.chief_complaint ?? casesheet.chief_complaint ?? undefined,
      provisional_diagnosis: basic.provisional_diagnosis ?? casesheet.provisional_diagnosis ?? undefined,
      final_diagnosis: basic.final_diagnosis ?? casesheet.final_diagnosis ?? undefined,
    },
    extensions: dataJson.extensions ?? casesheet.extensions ?? [],
  };
};

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
  ];

  return { activeSections, specialtySections };
}

function isCasesheetDraftEmpty(data: CasesheetFormData): boolean {
  const b = data.basic;
  const hasBasic =
    !!b.chief_complaint?.trim() ||
    !!b.subjective?.trim() ||
    !!b.objective?.trim() ||
    !!b.assessment?.trim() ||
    !!b.plan?.trim() ||
    !!b.provisional_diagnosis?.trim() ||
    !!b.final_diagnosis?.trim();
  if (hasBasic) return false;
  if (data.extensions && data.extensions.length > 0) {
    return data.extensions.every(ext =>
      Object.values(ext.data || {}).every(v => !String(v ?? '').trim())
    );
  }
  return true;
}

// T-A.3 (FR-A4): gates the unmount-flush auto-save for prescription — only
// worth auto-committing if at least one medication has a real name.
function isPrescriptionDraftEmpty(data: PrescriptionData): boolean {
  const meds = data.medications ?? [];
  return meds.every(m => !m.name?.trim());
}

// ============================================================
// SECTION PROGRESS COMPUTATION HELPERS
// ============================================================

function computeChiefComplaintStatus(data: CasesheetFormData): SectionProgressStatus {
  const val = data.basic.chief_complaint?.trim() ?? '';
  if (!val) return 'empty';
  return 'complete'; // any non-empty text → complete
}

function computeClinicalNotesStatus(data: CasesheetFormData): SectionProgressStatus {
  const b = data.basic;
  const fields = [b.subjective, b.objective, b.assessment, b.plan, b.provisional_diagnosis, b.final_diagnosis];
  const filled = fields.filter(f => !!f?.trim()).length;
  if (filled === 0) return 'empty';
  if (filled < 6) return 'in_progress';
  return 'complete';
}

function computeAyurvedicAssessmentStatus(data: CasesheetFormData): SectionProgressStatus {
  const prakritiExt = data.extensions?.find(e => e.template_id === 'prakriti');
  const nadiExt = data.extensions?.find(e => e.template_id === 'nadi_pariksha');

  const prakritiHasData = prakritiExt
    ? Object.values(prakritiExt.data || {}).some(v => !!String(v ?? '').trim())
    : false;
  const nadiHasData = nadiExt
    ? Object.values(nadiExt.data || {}).some(v => !!String(v ?? '').trim())
    : false;

  if (!prakritiHasData && !nadiHasData) return 'empty';

  // Check if both have ALL fields filled
  const prakritiFields = ['vata', 'pitta', 'kapha', 'dominant_dosha'];
  const nadiFields = ['nadi_type', 'nadi_gati', 'nadi_bala', 'observations'];

  const prakritiComplete = prakritiFields.every(f =>
    !!String(prakritiExt?.data?.[f] ?? '').trim()
  );
  const nadiComplete = nadiFields.every(f =>
    !!String(nadiExt?.data?.[f] ?? '').trim()
  );

  if (prakritiComplete && nadiComplete) return 'complete';
  return 'in_progress';
}

function computePrescriptionStatus(
  prescriptionId: string | null,
  prescriptionNotRequired: boolean,
): SectionProgressStatus {
  if (!prescriptionId && !prescriptionNotRequired) return 'empty';
  if (prescriptionNotRequired) return 'complete';
  // prescription exists (at least DRAFT)
  return 'complete';
}

function computeTreatmentStatus(
  treatmentDraft: TreatmentRecommendationDraft,
  isTreatmentSent: boolean,
): SectionProgressStatus {
  if (!treatmentDraft.recommendedTherapy?.trim()) return 'empty';
  if (isTreatmentSent) return 'complete';
  return 'in_progress';
}

// ============================================================
// MAIN HOOK
// ============================================================

export function useConsultationWorkspace(
  input: UseConsultationWorkspaceInput,
): UseConsultationWorkspaceOutput {
  const { tenantId, episodeId, appointmentId, clientId } = input;

  // Phase 1 · T-A.2 (ADR-P1-01): invalidate the owning query key(s) after
  // each affected clinical save succeeds, so any OTHER screen reading the
  // same casesheet/prescription/treatment-order via React Query sees fresh
  // data without needing its own remount/refetch hack. This does not change
  // how THIS screen's own local draft state is displayed (unaffected) — see
  // T-A.1's report for why the existing `refetchEpisode()`/
  // `refetchTreatmentSheet()` calls are kept, additive, not replaced.
  const queryClient = useQueryClient();

  // ── Feature config (computed once; stable unless tenant changes) ──────────
  const features = useFeatures();
  const sectionConfig = useMemo(() => buildSectionConfig(features), [features]);

  // ── Episode workspace data (read-only, reactive) ──────────────────────────
  const {
    episodeDetails,
    isEpisodeLoading,
    isEpisodeError,
    refetchEpisode,
    casesheet,
    casesheetId: remoteCasesheetId,
    hasCasesheet,
    treatmentSheet,
    treatmentSheetId: remoteTreatmentSheetId,
    hasTreatmentSheet,
    refetchTreatmentSheet,
    clientId: resolvedClientId,
    clientName,
  } = useEpisodeWorkspaceData(tenantId, episodeId, clientId);

  // ── Casesheet local draft ─────────────────────────────────────────────────
  const [casesheetData, setCasesheetData] = useState<CasesheetFormData>(EMPTY_CASESHEET_DATA);
  // Mirror into ref to avoid stale closure in debounce
  const casesheetDataRef = useRef<CasesheetFormData>(EMPTY_CASESHEET_DATA);
  const [isCasesheetSaving, setIsCasesheetSaving] = useState(false);
  const [casesheetSaveError, setCasesheetSaveError] = useState<string | null>(null);

  // casesheetId ref — once set, never POST again
  const casesheetIdRef = useRef<string | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const workspaceKeyRef = useRef(`${episodeId}:${appointmentId}`);

  useEffect(() => {
    const nextKey = `${episodeId}:${appointmentId}`;
    if (workspaceKeyRef.current === nextKey) return;

    workspaceKeyRef.current = nextKey;
    casesheetIdRef.current = null;
    casesheetDataRef.current = EMPTY_CASESHEET_DATA;
    setCasesheetData(EMPTY_CASESHEET_DATA);
    setCasesheetSaveError(null);
  }, [episodeId, appointmentId]);

  // Sync remote casesheetId into ref when first loaded
  useEffect(() => {
    if (remoteCasesheetId && !casesheetIdRef.current) {
      casesheetIdRef.current = remoteCasesheetId;
    } else if (!remoteCasesheetId && !hasCasesheet) {
      casesheetIdRef.current = null;
    }
  }, [remoteCasesheetId, hasCasesheet]);

  // Sync initial data from remote casesheet into local draft (only once, when draft is still empty)
  const initialSyncDoneRef = useRef(false);
  useEffect(() => {
    initialSyncDoneRef.current = false;
  }, [episodeId, appointmentId]);

  useEffect(() => {
    if (casesheet && !initialSyncDoneRef.current) {
      // T-A.5 (ED-003 fix): reads casesheetDataRef, NOT the casesheetData
      // state, deliberately. When episodeId/appointmentId AND casesheet
      // change together in the same commit (reachable now that T-A.5
      // removes the forced remount — see consultation.tsx), the reset
      // effect above already ran first in this same commit and updated
      // casesheetDataRef.current synchronously, but its setCasesheetData()
      // call hasn't been applied to this closure's `casesheetData` yet
      // (state updates from a sibling effect in the same flush aren't
      // visible until the next render). Reading the state here would see
      // the stale, still-populated PREVIOUS episode's draft, wrongly
      // conclude nothing needs loading, and permanently skip syncing the
      // new episode's data (the exact bug ED-003 characterized). The ref
      // is always fresh within the same commit.
      const remoteDraft = isCasesheetDraftEmpty(casesheetDataRef.current);
      if (remoteDraft) {
        const loaded = normalizeCasesheetData(casesheet);
        setCasesheetData(loaded);
        casesheetDataRef.current = loaded;
        initialSyncDoneRef.current = true;
      }
    }
  }, [casesheet]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Save status for autosave-backed sections ──────────────────────────────
  // Keys: chiefComplaint, clinicalNotes, ayurvedicAssessment (when active)
  const [saveStatuses, setSaveStatuses] = useState<Partial<Record<SectionKey, SectionSaveStatus>>>({});
  const savedTimerRefs = useRef<Partial<Record<SectionKey, ReturnType<typeof setTimeout>>>>({});

  const setSectionSaveStatus = useCallback(
    (key: SectionKey, status: SectionSaveStatus) => {
      setSaveStatuses(prev => ({ ...prev, [key]: status }));
      if (status === 'saved') {
        // Transition saved → idle after 2s
        const existing = savedTimerRefs.current[key];
        if (existing) clearTimeout(existing);
        savedTimerRefs.current[key] = setTimeout(() => {
          setSaveStatuses(prev => ({ ...prev, [key]: 'idle' }));
        }, 2000);
      }
    },
    [],
  );

  // ── performAutosave (reads from ref to avoid stale closures) ─────────────
  const performAutosave = useCallback(async (): Promise<void> => {
    const draft = casesheetDataRef.current;

    // Mark saving on autosave-backed sections
    const autosaveSections: SectionKey[] = [
      'chiefComplaint',
      'clinicalNotes',
      ...(sectionConfig.specialtySections.has('ayurvedicAssessment') ? ['ayurvedicAssessment' as SectionKey] : []),
    ];
    autosaveSections.forEach(k => setSectionSaveStatus(k, 'saving'));
    setIsCasesheetSaving(true);

    try {
      if (!casesheetIdRef.current) {
        // POST — create new casesheet
        const response = await createCasesheetApi(tenantId, resolvedClientId, {
          clinic_type: features.clinic_type as any,
          data_json: draft,
          appointment_id: appointmentId,
          episode_id: episodeId,
        });
        casesheetIdRef.current = response.id;
        refetchEpisode();
        // T-A.2, flag-gated (T-A.6, RB-1): prime the detail cache and
        // invalidate lists for this client, matching what
        // useCreateCasesheetMutation already does elsewhere. Gated so
        // turning the flag off reproduces exact pre-Phase-1 behavior (no
        // data effect) alongside consultation.tsx's flag-gated remount.
        if (isFreshnessV1Enabled(features)) {
          queryClient.setQueryData(casesheetsKeys.detail(tenantId, response.id), response);
          queryClient.invalidateQueries({ queryKey: casesheetsKeys.list(tenantId, resolvedClientId) });
        }
      } else {
        // PATCH — update existing casesheet
        const response = await updateCasesheetApi(tenantId, casesheetIdRef.current, {
          data_json: draft,
        });
        // T-A.2, flag-gated (T-A.6, RB-1): matching what
        // useUpdateCasesheetMutation already does elsewhere — write the
        // fresh response directly (no extra refetch) and invalidate list
        // queries.
        if (isFreshnessV1Enabled(features)) {
          queryClient.setQueryData(casesheetsKeys.detail(tenantId, casesheetIdRef.current), response);
          queryClient.invalidateQueries({ queryKey: casesheetsKeys.lists() });
        }
      }

      setCasesheetSaveError(null);
      autosaveSections.forEach(k => setSectionSaveStatus(k, 'saved'));
    } catch (err: any) {
      const msg = err?.response?.data?.detail ?? err?.message ?? 'Save failed';
      setCasesheetSaveError(msg);
      autosaveSections.forEach(k => setSectionSaveStatus(k, 'error'));
      throw err;
    } finally {
      setIsCasesheetSaving(false);
    }
  }, [tenantId, resolvedClientId, appointmentId, episodeId, features.clinic_type, sectionConfig.specialtySections, setSectionSaveStatus, refetchEpisode, queryClient]);

  // ── scheduleAutosave ──────────────────────────────────────────────────────
  const scheduleAutosave = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      debounceTimerRef.current = null;
      performAutosave().catch(() => {
        // errors already captured in state — swallow here
      });
    }, 1000);
  }, [performAutosave]);

  // ── flushPendingAutosave ──────────────────────────────────────────────────
  const flushPendingAutosave = useCallback(async (): Promise<void> => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
      await performAutosave();
    }
  }, [performAutosave]);

  // ── On unmount: flush synchronously ──────────────────────────────────────
  // T-A.3 (FR-A4, ADR-P1-01): every exit from this screen — back arrow,
  // "Change Case", "Save & Submit" — unmounts this hook the same way, so
  // this cleanup is the ONE place that reliably protects against silently
  // dropping unsaved work regardless of which UI action triggered the exit.
  // Casesheet's flush (below) already existed; prescription and treatment
  // recommendation are explicit-save fields with no debounce, so they need
  // their own dirty-flag-gated flush here. All three read from refs (not
  // state), so they behave correctly even though this effect's closure is
  // fixed at first render (see the *Ref comments above each field's state).
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
        // Fire-and-forget on unmount; we can't await in cleanup
        performAutosave().catch(() => {});
      }
      if (prescriptionDirtyRef.current && !isPrescriptionDraftEmpty(prescriptionDataRef.current)) {
        savePrescription().catch(() => {});
      }
      if (treatmentDirtyRef.current && treatmentRecommendationRef.current.recommendedTherapy?.trim()) {
        sendTreatmentToAdmin().catch(() => {});
      }
      // Clear all saved → idle timers
      Object.values(savedTimerRefs.current).forEach(t => {
        if (t) clearTimeout(t);
      });
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── updateCasesheetField ──────────────────────────────────────────────────
  const updateCasesheetField = useCallback((path: string, value: string) => {
    setCasesheetData(prev => {
      const next: CasesheetFormData = {
        ...prev,
        basic: { ...prev.basic, [path]: value },
      };
      casesheetDataRef.current = next;
      return next;
    });
    setCasesheetSaveError(null);
    scheduleAutosave();
  }, [scheduleAutosave]);

  // ── updateExtensionField ─────────────────────────────────────────────────
  const updateExtensionField = useCallback(
    (templateId: string, fieldId: string, value: string) => {
      if (!sectionConfig.activeSections.includes('ayurvedicAssessment')) {
        return;
      }
      setCasesheetData(prev => {
        const extensions = prev.extensions ? [...prev.extensions] : [];
        const idx = extensions.findIndex(e => e.template_id === templateId);
        if (idx >= 0) {
          extensions[idx] = {
            ...extensions[idx],
            data: { ...extensions[idx].data, [fieldId]: value },
          };
        } else {
          extensions.push({ template_id: templateId, data: { [fieldId]: value } });
        }
        const next: CasesheetFormData = { ...prev, extensions };
        casesheetDataRef.current = next;
        return next;
      });
      setCasesheetSaveError(null);
      scheduleAutosave();
    },
    [scheduleAutosave, sectionConfig.activeSections],
  );

  // ── Prescription state ────────────────────────────────────────────────────
  const [prescriptionId, setPrescriptionId] = useState<string | null>(null);
  const [prescriptionData, setPrescriptionData] = useState<PrescriptionData>(EMPTY_PRESCRIPTION_DATA);
  const [isPrescriptionSaving, setIsPrescriptionSaving] = useState(false);
  const [prescriptionSaveError, setPrescriptionSaveError] = useState<string | null>(null);
  const [prescriptionNotRequired, setPrescriptionNotRequired] = useState(false);
  // T-A.3 (FR-A4): refs mirror the state above so `savePrescription` can be
  // called safely from the unmount-flush cleanup effect (which closes over
  // its first-render values — reading refs instead of state keeps it
  // reading FRESH data regardless of which render's closure fired it).
  // `prescriptionDirtyRef` tracks whether there is unsaved, user-entered
  // content since the last successful save.
  const prescriptionIdRef = useRef<string | null>(null);
  const prescriptionDataRef = useRef<PrescriptionData>(EMPTY_PRESCRIPTION_DATA);
  const prescriptionDirtyRef = useRef(false);

  // Load existing prescription for this appointment on mount
  useEffect(() => {
    if (!tenantId || !appointmentId) return;

    let cancelled = false;

    // Reset prescription state for the CURRENT consultation context first, so a
    // previous episode's prescription can never leak into a new one while the
    // lookup is in flight (or if none exists for this episode/appointment).
    setPrescriptionId(null);
    prescriptionIdRef.current = null;
    setPrescriptionData(EMPTY_PRESCRIPTION_DATA);
    prescriptionDataRef.current = EMPTY_PRESCRIPTION_DATA;
    setPrescriptionNotRequired(false);
    setPrescriptionSaveError(null);
    prescriptionDirtyRef.current = false;

    const load = async () => {
      try {
        const result = await axiosClient.get(
          `/api/v1/clinic/${tenantId}/prescriptions`,
          // Scope strictly to this consultation: appointment AND episode.
          { params: { appointment_id: appointmentId, episode_id: episodeId } },
        );
        if (cancelled) return;

        const items = result.data?.items ?? result.data ?? [];
        if (Array.isArray(items) && items.length > 0) {
          const first = items[0];
          setPrescriptionId(first.id);
          prescriptionIdRef.current = first.id;
          const loaded = first.prescription_data ?? EMPTY_PRESCRIPTION_DATA;
          setPrescriptionData(loaded);
          prescriptionDataRef.current = loaded;
        }
      } catch {
        // No prescription found — start fresh
      }
    };

    load();
    return () => { cancelled = true; };
  }, [tenantId, appointmentId, episodeId]);

  const savePrescription = useCallback(async (): Promise<void> => {
    setIsPrescriptionSaving(true);
    setPrescriptionSaveError(null);
    setSectionSaveStatus('prescription', 'saving');
    try {
      if (!prescriptionIdRef.current) {
        const response = await createPrescriptionApi(tenantId, {
          client_id: resolvedClientId,
          prescription_data: prescriptionDataRef.current,
          appointment_id: appointmentId,
          episode_id: episodeId,
        });
        setPrescriptionId(response.id);
        prescriptionIdRef.current = response.id;
        // T-A.2, flag-gated (T-A.6, RB-1): prime the detail cache and
        // invalidate lists + the episode+appointment-scoped key
        // established in T-A.1.
        if (isFreshnessV1Enabled(features)) {
          queryClient.setQueryData(prescriptionsKeys.detail(tenantId, response.id), response);
          queryClient.invalidateQueries({ queryKey: prescriptionsKeys.lists() });
          queryClient.invalidateQueries({
            queryKey: prescriptionsKeys.byAppointment(tenantId, episodeId, appointmentId),
          });
        }
      } else {
        const response = await updatePrescriptionApi(tenantId, prescriptionIdRef.current, {
          prescription_data: prescriptionDataRef.current,
        });
        if (isFreshnessV1Enabled(features)) {
          queryClient.setQueryData(prescriptionsKeys.detail(tenantId, prescriptionIdRef.current), response);
          queryClient.invalidateQueries({ queryKey: prescriptionsKeys.lists() });
          queryClient.invalidateQueries({
            queryKey: prescriptionsKeys.byAppointment(tenantId, episodeId, appointmentId),
          });
        }
      }
      prescriptionDirtyRef.current = false;
      setSectionSaveStatus('prescription', 'saved');
    } catch (err: any) {
      const msg = err?.response?.data?.detail ?? err?.message ?? 'Save failed';
      setPrescriptionSaveError(msg);
      setSectionSaveStatus('prescription', 'error');
      throw err;
    } finally {
      setIsPrescriptionSaving(false);
    }
  }, [tenantId, resolvedClientId, appointmentId, episodeId, queryClient, setSectionSaveStatus, features]);

  const markPrescriptionNotRequired = useCallback(() => {
    setPrescriptionNotRequired(true);
    // Marking "not required" is itself an intentional resolution — don't let
    // the unmount-flush effect also try to auto-save an abandoned draft.
    prescriptionDirtyRef.current = false;
  }, []);

  const onPrescriptionChange = useCallback((data: PrescriptionData) => {
    setPrescriptionData(data);
    prescriptionDataRef.current = data;
    prescriptionDirtyRef.current = true;
  }, []);

  // ── Treatment recommendation state ────────────────────────────────────────
  const [treatmentRecommendation, setTreatmentRecommendation] = useState<TreatmentRecommendationDraft>(
    DEFAULT_TREATMENT_DRAFT,
  );
  const [isTreatmentSaving, setIsTreatmentSaving] = useState(false);
  const [treatmentSaveError, setTreatmentSaveError] = useState<string | null>(null);
  const [isTreatmentSent, setIsTreatmentSent] = useState(false);
  // T-A.5 (ED-003-class fix): mirrors `isTreatmentSent`. The pre-populate
  // effect below reads this instead of the state, for the same reason
  // ED-003 required casesheet's sync effect to read a ref: when
  // episodeId/appointmentId AND treatmentSheet change together in the same
  // commit (reachable now that T-A.5 removes the forced remount), the
  // reset effect's `setIsTreatmentSent(false)` hasn't applied yet in that
  // same effect-flush, so a stale `isTreatmentSent: true` from the
  // PREVIOUS episode would incorrectly skip pre-populating the new
  // episode's treatment recommendation draft. The ref is written
  // synchronously everywhere `setIsTreatmentSent` is called, so it is
  // always fresh within the same commit.
  const isTreatmentSentRef = useRef(false);
  // Track treatment sheet ID and version created/found in this session
  const treatmentSheetIdRef = useRef<string | null>(null);
  const treatmentSheetVersionRef = useRef<number>(0);
  // Gate the pre-population so it runs once per consultation context. Without
  // this, every treatment-sheet refetch (staleTime: 0) re-ran the effect and
  // clobbered the doctor's in-progress edits (e.g. a just-selected therapy).
  const treatmentPrefillDoneRef = useRef(false);
  // T-A.3 (FR-A4): mirrors `treatmentRecommendation` so `sendTreatmentToAdmin`
  // can be called safely from the unmount-flush cleanup effect, which closes
  // over its first-render values. `treatmentDirtyRef` tracks whether there
  // are unsent edits since the last successful send.
  const treatmentRecommendationRef = useRef<TreatmentRecommendationDraft>(DEFAULT_TREATMENT_DRAFT);
  const treatmentDirtyRef = useRef(false);

  useEffect(() => {
    treatmentSheetIdRef.current = null;
    treatmentSheetVersionRef.current = 0;
    treatmentPrefillDoneRef.current = false;
    setTreatmentRecommendation(DEFAULT_TREATMENT_DRAFT);
    treatmentRecommendationRef.current = DEFAULT_TREATMENT_DRAFT;
    treatmentDirtyRef.current = false;
    setTreatmentSaveError(null);
    setIsTreatmentSent(false);
    isTreatmentSentRef.current = false;
  }, [episodeId, appointmentId]);

  // Pre-populate from existing treatment sheet
  useEffect(() => {
    if (treatmentSheet) {
      // Keep id/version refs fresh on every change (needed for the If-Match
      // header) — these are idempotent and must not be gated.
      treatmentSheetIdRef.current = treatmentSheet.id;
      treatmentSheetVersionRef.current = (treatmentSheet as any).version ?? 0;
    }

    // Pre-fill the editable draft ONLY once per consultation context. Re-running
    // this on every refetch would overwrite the doctor's in-progress edits.
    // Reads isTreatmentSentRef (not the isTreatmentSent state) — see the ref's
    // declaration comment for why (T-A.5, ED-003-class staleness fix).
    if (treatmentSheet && !isTreatmentSentRef.current && !treatmentPrefillDoneRef.current) {
      treatmentPrefillDoneRef.current = true;
      const firstRow = treatmentSheet.rows?.[0];
      setTreatmentRecommendation(prev => {
        // Prefer the recommendation stored on the sheet (new ORDER model);
        // fall back to legacy per-row data for sheets created before the refactor.
        const sessions =
          treatmentSheet.planned_sessions ?? treatmentSheet.duration_days;
        let durationDays: TreatmentRecommendationDraft['durationDays'] = prev.durationDays;
        let customDurationDays = prev.customDurationDays;
        if (typeof sessions === 'number' && sessions > 0) {
          if ([7, 14, 21, 30, 45, 60].includes(sessions)) {
            durationDays = sessions as 7 | 14 | 21 | 30 | 45 | 60;
          } else {
            durationDays = 'custom';
            customDurationDays = sessions;
          }
        }

        // Legacy: parse per-row instructions JSON for frequency/startPreference/notes
        let extra: Partial<TreatmentRecommendationDraft> = {};
        if (firstRow?.instructions) {
          try {
            const parsed = JSON.parse(firstRow.instructions);
            if (parsed.frequency) extra.frequency = parsed.frequency;
            if (parsed.startPreference) extra.startPreference = parsed.startPreference;
            if (parsed.notesForAdmin !== undefined) extra.notesForAdmin = parsed.notesForAdmin;
          } catch {
            // ignore parse errors
          }
        }

        const next: TreatmentRecommendationDraft = {
          ...prev,
          recommendedTherapy:
            treatmentSheet.recommended_therapy ??
            firstRow?.treatment_description ??
            prev.recommendedTherapy,
          notesForAdmin:
            treatmentSheet.order_notes ?? extra.notesForAdmin ?? prev.notesForAdmin,
          durationDays,
          customDurationDays,
          ...(extra.frequency ? { frequency: extra.frequency } : {}),
          ...(extra.startPreference ? { startPreference: extra.startPreference } : {}),
        };
        treatmentRecommendationRef.current = next;
        return next;
      });

      // If execution state shows it's already been sent to scheduling, reflect that
      if (isSentToScheduling((treatmentSheet as any).state)) {
        setIsTreatmentSent(true);
        isTreatmentSentRef.current = true;
      }
    }
  }, [treatmentSheet]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const treatmentDocument = episodeDetails?.documents.treatment_sheet;
    const sheetId = treatmentSheet?.id ?? remoteTreatmentSheetId ?? treatmentDocument?.id;
    if (sheetId) {
      treatmentSheetIdRef.current = sheetId;
      // Keep version in sync — prefer the full treatmentSheet object which has it
      const version = (treatmentSheet as any)?.version ?? 0;
      if (version > 0) treatmentSheetVersionRef.current = version;
    }

    const state = (treatmentSheet as any)?.state ?? (treatmentDocument as any)?.state;
    if (isSentToScheduling(state)) {
      setIsTreatmentSent(true);
      isTreatmentSentRef.current = true;
    }
  }, [episodeDetails, remoteTreatmentSheetId, treatmentSheet]);

  const updateTreatmentField = useCallback(
    <K extends keyof TreatmentRecommendationDraft>(key: K, value: TreatmentRecommendationDraft[K]) => {
      setTreatmentRecommendation(prev => {
        const next = { ...prev, [key]: value };
        treatmentRecommendationRef.current = next;
        return next;
      });
      treatmentDirtyRef.current = true;
      if (isTreatmentSent) {
        setIsTreatmentSent(false);
        isTreatmentSentRef.current = false;
      }
    },
    [isTreatmentSent],
  );

  // ── sendTreatmentToAdmin ──────────────────────────────────────────────────
  // The treatment recommendation is only a request to the admin to SCHEDULE
  // therapy for a recommended number of sessions — it is NOT the per-day
  // treatment plan. So this does NOT create treatment sheet rows. It stores the
  // recommendation (therapy + sessions + frequency + notes) as an ORDER that
  // surfaces on the admin scheduling worklist. Admin scheduling creates the rows
  // (one per scheduled day); the doctor fills per-day details afterwards.
  const sendTreatmentToAdmin = useCallback(async (): Promise<void> => {
    // T-A.3: read from the ref, not the `treatmentRecommendation` state
    // closure — this callback must behave correctly even when called from
    // the unmount-flush effect, which only ever sees this function's
    // first-render closure (a `[]`-dep `useEffect` cleanup never picks up a
    // newer version). The ref is always current; see updateTreatmentField.
    const draft = treatmentRecommendationRef.current;

    if (!draft.recommendedTherapy || !draft.recommendedTherapy.trim()) {
      const msg = 'Please enter the recommended therapy.';
      setTreatmentSaveError(msg);
      throw new Error(msg);
    }

    setIsTreatmentSaving(true);
    setTreatmentSaveError(null);

    const plannedSessions =
      draft.durationDays === 'custom'
        ? (draft.customDurationDays ?? 7)
        : draft.durationDays;

    const toIsoDate = (d: Date): string => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    // Human-readable frequency label for the admin.
    const frequencyLabel = (() => {
      switch (draft.frequency) {
        case 'daily': return 'Daily';
        case 'alternate': return 'Alternate days';
        case '3x_week': return '3x / week';
        case 'custom': return draft.customFrequency || 'Custom';
        default: return undefined;
      }
    })();

    // Start preference + notes, packaged as free-text guidance for the admin.
    const startPref =
      draft.startPreference === 'specific_date' && draft.specificStartDate
        ? `Preferred start: ${toIsoDate(draft.specificStartDate)}`
        : 'Preferred start: ASAP';
    const orderNotes = draft.notesForAdmin?.trim() || undefined;

    try {
      let sheetId = treatmentSheetIdRef.current;

      if (!sheetId) {
        // Backend derives the order's sheet from the client's latest casesheet,
        // so make sure consultation notes have been saved first.
        if (!casesheetIdRef.current) {
          await performAutosave();
        }
        if (!casesheetIdRef.current) {
          throw new Error('Please add consultation notes before sending to scheduling.');
        }

        const order = await createTreatmentRecommendationApi(tenantId, {
          client_id: resolvedClientId,
          episode_id: episodeId,
          appointment_id: appointmentId,
          recommended_therapy: draft.recommendedTherapy.trim(),
          planned_sessions: plannedSessions,
          frequency: frequencyLabel,
          preferred_time_window: startPref,
          order_notes: orderNotes,
        });
        treatmentSheetIdRef.current = order.id;
        treatmentSheetVersionRef.current = (order as any).version ?? 0;
      } else {
        // Recommendation already exists — update its metadata in place (no rows).
        const order = await sendToSchedulingApi(sheetId, treatmentSheetVersionRef.current, {
          order_notes: orderNotes,
          planned_sessions: plannedSessions,
          frequency: frequencyLabel,
          preferred_time_window: startPref,
          recommended_therapy: draft.recommendedTherapy.trim(),
        });
        treatmentSheetVersionRef.current =
          (order as any).version ?? treatmentSheetVersionRef.current;
      }

      setIsTreatmentSent(true);
      isTreatmentSentRef.current = true;
      treatmentDirtyRef.current = false;
      refetchEpisode();
      // T-A.7 (NFR-4, over-invalidation risk): refetchTreatmentSheet() and
      // invalidateTreatmentOrderSurfaces() below both target the same
      // treatment-sheet queries. Calling both back-to-back does NOT dedupe
      // to one network call — React Query's invalidateQueries cancels an
      // in-flight fetch and starts a NEW one rather than reusing it, so the
      // underlying API was empirically observed to fire multiple times for
      // a single "send to admin" action (see
      // tests/features/doctorDashboard/freshnessNoDuplicateFetch.test.tsx).
      // invalidateTreatmentOrderSurfaces already covers everything
      // refetchTreatmentSheet does (and more — worklists,
      // pending-documentation), so the manual refetch is only needed when
      // the flag is off and invalidation doesn't run at all.
      if (isFreshnessV1Enabled(features)) {
        // T-A.2, flag-gated (T-A.6, RB-1): reuse the exact invalidation set
        // treatmentOrders.repository.impl.ts's own mutations already use
        // (worklists, pending-documentation, treatment sheet caches), so
        // other surfaces (e.g. admin scheduling worklist) see this order
        // without their own remount/refetch.
        await invalidateTreatmentOrderSurfaces(queryClient, tenantId, treatmentSheetIdRef.current ?? undefined);
      } else {
        refetchTreatmentSheet();
      }
    } catch (err: any) {
      const msg = err?.response?.data?.detail ?? err?.message ?? 'Failed to send to scheduling';
      setTreatmentSaveError(msg);
      throw err;
    } finally {
      setIsTreatmentSaving(false);
    }
  }, [
    tenantId,
    resolvedClientId,
    appointmentId,
    episodeId,
    performAutosave,
    refetchEpisode,
    refetchTreatmentSheet,
    queryClient,
    features,
  ]);

  // ── Section progress ──────────────────────────────────────────────────────
  const sectionProgress = useMemo<Partial<Record<SectionKey, SectionProgress>>>(() => {
    const result: Partial<Record<SectionKey, SectionProgress>> = {};

    for (const section of sectionConfig.activeSections) {
      let status: SectionProgressStatus;
      let saveStatus: SectionSaveStatus = saveStatuses[section] ?? 'idle';

      switch (section) {
        case 'chiefComplaint':
          status = computeChiefComplaintStatus(casesheetData);
          break;
        case 'clinicalNotes':
          status = computeClinicalNotesStatus(casesheetData);
          break;
        case 'ayurvedicAssessment':
          status = computeAyurvedicAssessmentStatus(casesheetData);
          break;
        case 'prescription':
          status = computePrescriptionStatus(prescriptionId, prescriptionNotRequired);
          // T-A.3 (FR-A3): saveStatus now comes from saveStatuses['prescription']
          // (set by savePrescription via setSectionSaveStatus), giving the same
          // "✓ Saved" confirmation casesheet sections already have. Previously
          // hardcoded to 'idle', so a successful save showed no confirmation.
          break;
        case 'treatmentRecommendation':
          status = computeTreatmentStatus(treatmentRecommendation, isTreatmentSent);
          saveStatus = 'idle'; // treatment uses explicit send, not autosave
          break;
        default:
          status = 'empty';
      }

      result[section] = { status, saveStatus };
    }

    return result;
  }, [
    sectionConfig.activeSections,
    casesheetData,
    prescriptionId,
    prescriptionNotRequired,
    treatmentRecommendation,
    isTreatmentSent,
    saveStatuses,
  ]);

  // ── Return ────────────────────────────────────────────────────────────────
  return {
    // Episode data
    episodeDetails,
    isEpisodeLoading,
    isEpisodeError,
    refetchEpisode,
    clientName,

    // Casesheet
    casesheetId: casesheetIdRef.current,
    hasCasesheet,
    casesheetData,
    isCasesheetSaving,
    casesheetSaveError,
    updateCasesheetField,
    updateExtensionField,

    // Prescription
    prescriptionId,
    prescriptionData,
    isPrescriptionSaving,
    prescriptionSaveError,
    prescriptionNotRequired,
    savePrescription,
    markPrescriptionNotRequired,
    onChange: onPrescriptionChange,

    // Treatment recommendation
    treatmentRecommendation,
    isTreatmentSaving,
    isTreatmentSent,
    treatmentSaveError,
    updateTreatmentField,
    sendTreatmentToAdmin,

    // Section config
    sectionConfig,

    // Section progress
    sectionProgress,

    // Flush
    flushPendingAutosave,
  };
}

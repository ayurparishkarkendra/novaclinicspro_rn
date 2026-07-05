/**
 * PrescriptionModule (R3A · T-B.2, ADR-R3A-02)
 *
 * The doctor's existing Prescription section, re-hosted as a workspace
 * module. Reads episodeId/clientId/appointmentId/tenantId from Persistent
 * Context (design §9.D) instead of from props threaded by the parent screen.
 * All save/validation logic below is copied UNCHANGED from
 * useConsultationWorkspace.ts — only its input source changed.
 *
 * Unlike CaseSheetModule (T-B.1), no cross-module bridge is needed:
 * Prescription is explicit-save (no debounce, so nothing for "Save & Submit"
 * to flush) and nothing else in the hook reads prescription state (confirmed
 * by a full grep of useConsultationWorkspace.ts before writing this file).
 * Its own unmount-flush (dirty-ref check + save) moves with it, exactly as
 * CaseSheetModule's did (design §6.4).
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { useClinicTheme } from '../../../../../core/theme/useClinicTheme';
import { isFreshnessV1Enabled, useFeatures } from '../../../../../core/hooks/useFeatures';
import { createPrescriptionApi, updatePrescriptionApi } from '../../../../prescriptions/data/datasources/prescriptions.api';
import { prescriptionsKeys } from '../../../../prescriptions/data/repositories/prescriptions.repository.impl';
import { PrescriptionData } from '../../../../prescriptions/data/models/prescriptions.dtos';
import { axiosClient } from '../../../../../core/api/axiosClient';
import { useEpisodeContext, usePatientContext, useVisitContext } from '../../context/ClinicalWorkspaceContext';
import { useReportSaveStatus } from '../../context/WorkspaceSaveStatusContext';
import { SectionKey, SectionProgress, SectionProgressStatus, SectionSaveStatus } from '../../hooks/useConsultationWorkspace';
import { PrescriptionEditingCore } from '../../../../prescriptions/presentation/components/PrescriptionEditingCore';
import { renderSection } from './sectionRenderer';

// R3B (T-B.4, ADR-R3B-05): fixed set — reproduces PrescriptionSection's own
// pre-T-B.4 advice-field behavior bit-for-bit (T-0.3 baseline). The
// canonical core's full field set (also notes, next_visit_days) exists, but
// this host only activates the same three fields it always has.
const PRESCRIPTION_MODULE_ACTIVE_ADVICE_FIELDS = ['dietary_advice', 'lifestyle_advice', 'follow_up_instructions'] as const;

const EMPTY_PRESCRIPTION_DATA: PrescriptionData = { medications: [] };

// T-A.3 (FR-A4): gates the unmount-flush auto-save — only worth
// auto-committing if at least one medication has a real name.
function isPrescriptionDraftEmpty(data: PrescriptionData): boolean {
  const meds = data.medications ?? [];
  return meds.every((m) => !m.name?.trim());
}

function computePrescriptionStatus(prescriptionId: string | null, prescriptionNotRequired: boolean): SectionProgressStatus {
  if (!prescriptionId && !prescriptionNotRequired) return 'empty';
  return 'complete';
}

export interface PrescriptionModuleProps {
  expandedSections: Set<SectionKey>;
  onToggleSection: (key: SectionKey) => void;
}

export const PrescriptionModule: React.FC<PrescriptionModuleProps> = ({ expandedSections, onToggleSection }) => {
  const queryClient = useQueryClient();
  const { colors, spacing, typography } = useClinicTheme();
  const features = useFeatures();
  const { tenantId, episodeId } = useEpisodeContext();
  const { clientId: resolvedClientId } = usePatientContext();
  const { appointmentId } = useVisitContext();

  const [prescriptionId, setPrescriptionId] = useState<string | null>(null);
  const [prescriptionData, setPrescriptionData] = useState<PrescriptionData>(EMPTY_PRESCRIPTION_DATA);
  const [isPrescriptionSaving, setIsPrescriptionSaving] = useState(false);
  const [prescriptionSaveError, setPrescriptionSaveError] = useState<string | null>(null);
  const [prescriptionNotRequired, setPrescriptionNotRequired] = useState(false);
  const prescriptionIdRef = useRef<string | null>(null);
  const prescriptionDataRef = useRef<PrescriptionData>(EMPTY_PRESCRIPTION_DATA);
  const prescriptionDirtyRef = useRef(false);

  // ── Save status (own copy — CO-3: each module owns its own save state) ──
  const [saveStatus, setSaveStatus] = useState<SectionSaveStatus>('idle');
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const setSectionSaveStatus = useCallback((status: SectionSaveStatus) => {
    setSaveStatus(status);
    if (status === 'saved') {
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
      savedTimerRef.current = setTimeout(() => setSaveStatus('idle'), 2000);
    }
  }, []);

  // T-D.1 (ADR-R3A-03): report this module's own already-computed save
  // status for WorkspaceHeader's read-only aggregate — purely additive.
  const reportSaveStatus = useReportSaveStatus();
  useEffect(() => {
    reportSaveStatus('prescription', saveStatus);
  }, [saveStatus, reportSaveStatus]);

  // Load existing prescription for this appointment on mount (unchanged
  // from useConsultationWorkspace.ts).
  useEffect(() => {
    if (!tenantId || !appointmentId) return;

    let cancelled = false;

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
    return () => {
      cancelled = true;
    };
  }, [tenantId, appointmentId, episodeId]);

  const savePrescription = useCallback(async (): Promise<void> => {
    setIsPrescriptionSaving(true);
    setPrescriptionSaveError(null);
    setSectionSaveStatus('saving');
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
      setSectionSaveStatus('saved');
    } catch (err: any) {
      const msg = err?.response?.data?.detail ?? err?.message ?? 'Save failed';
      setPrescriptionSaveError(msg);
      setSectionSaveStatus('error');
      throw err;
    } finally {
      setIsPrescriptionSaving(false);
    }
  }, [tenantId, resolvedClientId, appointmentId, episodeId, queryClient, setSectionSaveStatus, features]);

  const markPrescriptionNotRequired = useCallback(() => {
    setPrescriptionNotRequired(true);
    prescriptionDirtyRef.current = false;
  }, []);

  const onChange = useCallback((data: PrescriptionData) => {
    setPrescriptionData(data);
    prescriptionDataRef.current = data;
    prescriptionDirtyRef.current = true;
  }, []);

  // Own unmount-flush — moves with this module (design §6.4).
  useEffect(() => {
    return () => {
      if (prescriptionDirtyRef.current && !isPrescriptionDraftEmpty(prescriptionDataRef.current)) {
        savePrescription().catch(() => {});
      }
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const sectionProgress = useMemo<SectionProgress>(
    () => ({ status: computePrescriptionStatus(prescriptionId, prescriptionNotRequired), saveStatus }),
    [prescriptionId, prescriptionNotRequired, saveStatus],
  );

  return (
    <>
      {renderSection(
        'prescription',
        expandedSections,
        onToggleSection,
        sectionProgress,
        <PrescriptionEditingCore
          prescriptionData={prescriptionData}
          isSaving={isPrescriptionSaving}
          saveError={prescriptionSaveError}
          resolvedWithoutSave={prescriptionNotRequired}
          onSave={savePrescription}
          onChange={onChange}
          progress={sectionProgress.status}
          saveStatus={sectionProgress.saveStatus}
          activeAdviceFields={PRESCRIPTION_MODULE_ACTIVE_ADVICE_FIELDS as any}
          extraActions={
            <TouchableOpacity
              onPress={markPrescriptionNotRequired}
              accessibilityRole="button"
              style={{
                minHeight: 44,
                borderWidth: 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                borderColor: colors.border.default,
                borderRadius: spacing.sm,
                padding: spacing.sm,
              }}
            >
              <Text style={[typography.button, { color: colors.text.secondary }]}>Mark as Not Required</Text>
            </TouchableOpacity>
          }
        />,
      )}
    </>
  );
};

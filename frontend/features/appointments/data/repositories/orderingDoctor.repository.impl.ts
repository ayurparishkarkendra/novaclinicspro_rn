/**
 * Ordering Doctor Resolution -- Repository Implementation
 *
 * Phase 4 · T-G.2 (Frontend Clean Architecture Boundary Restoration)
 *
 * Extracted from CreateAppointmentScreen.tsx, which previously called
 * axiosClient directly inside two separate useEffect waterfalls. This file
 * preserves both waterfalls' exact fallback order, field semantics, and
 * error handling -- this is an architecture-only move, not a behavior
 * change (see the T-G.2 report for the full before/after).
 *
 * IMPORTANT, discovered during this extraction, NOT fixed here (out of
 * this task's no-behavior-change scope):
 *  - EpisodeResponse has no `doctor_id` field (confirmed against
 *    app/api/v1/schemas/episode.py) -- the episode-based doctor lookup in
 *    both waterfalls below has never resolved a value in production.
 *  - TreatmentSheetResponse has no `doctor_id` field either (confirmed
 *    against app/api/v1/routers/treatment_sheets_router.py) -- the
 *    treatment-sheet-based doctor lookup in the pre-fill waterfall has
 *    likewise never resolved a value.
 *  - Episode has no `treatment_id` field -- the treatment pre-fill from an
 *    episode has never contributed a value either (only `params.treatmentId`
 *    ever did).
 *  - getLatestCasesheetForClientLegacyApi's URL matches no real backend
 *    route (see its own doc comment in casesheets.api.ts) -- always 404s.
 * All four are preserved verbatim via defensive `(x as any)?.field` reads
 * or an intentionally-preserved 404, so the resolved value is exactly the
 * same (usually null) as before this extraction.
 */

import { useQuery } from '@tanstack/react-query';
import { listTreatmentSheetsByClientApi, getTreatmentSheetApi } from '../../../treatmentSheets/data/datasources/treatmentSheets.api';
import { listEpisodesApi, getEpisodeApi } from '../../../episodes/data/datasources/episodes.api';
import { getLatestCasesheetForClientLegacyApi } from '../../../casesheets/data/datasources/casesheets.api';
import { getClientApi } from '../../../clients/data/datasources/clients.api';

// ============================================
// useOrderingDoctorQuery -- waterfall #1
// (client's active treatment sheet -> active episode -> latest casesheet)
// ============================================

const resolveOrderingDoctorId = async (tenantId: string, clientId: string): Promise<string | null> => {
  try {
    const sheets = await listTreatmentSheetsByClientApi(tenantId, {
      client_id: clientId,
      status: 'IN_PROGRESS',
      limit: 1,
    });
    const doctorId = sheets.items[0]?.recorded_by_staff_id;
    if (doctorId) return doctorId;
  } catch {
    // Preserved: the original waterfall falls through silently on error.
  }

  try {
    const episodes = await listEpisodesApi(tenantId, { client_id: clientId, status: 'ACTIVE', limit: 1 });
    // See file-level note: EpisodeResponse has no doctor_id field today.
    const doctorId = (episodes.items[0] as any)?.doctor_id;
    if (doctorId) return doctorId;
  } catch {
    // Preserved: falls through silently on error.
  }

  try {
    const casesheet = await getLatestCasesheetForClientLegacyApi(tenantId, clientId);
    const doctorId = casesheet?.recorded_by_staff_id;
    if (doctorId) return doctorId;
  } catch {
    // Preserved: this call is expected to 404 every time (see its own doc comment).
  }

  return null;
};

/**
 * Resolves the doctor to pre-fill as "ordering doctor" for a new multi-day
 * therapy booking. Enabled only while the caller is actually in MULTI mode
 * with a selected client, matching the original effect's own guard clause.
 */
export const useOrderingDoctorQuery = (tenantId: string, clientId: string | null, enabled: boolean) => {
  return useQuery<string | null, Error>({
    queryKey: ['ordering-doctor', tenantId, clientId],
    queryFn: () => resolveOrderingDoctorId(tenantId, clientId as string),
    enabled: enabled && !!tenantId && !!clientId,
  });
};

// ============================================
// useTreatmentSheetPrefillQuery -- waterfall #2
// (treatment sheet -> episode -> client, pre-filling the MULTI-day form)
// ============================================

export interface TreatmentSheetPrefillResult {
  selectedDoctorId?: string;
  treatmentId?: string;
  numberOfSessions?: number;
  clientId?: string;
  clientInfo?: { name: string; phone: string };
}

const resolveTreatmentSheetPrefill = async (
  tenantId: string,
  treatmentSheetId: string,
  paramsTreatmentId: string | undefined,
  paramsDurationDays: string | undefined
): Promise<TreatmentSheetPrefillResult> => {
  const treatmentSheet = await getTreatmentSheetApi(treatmentSheetId, tenantId);
  const result: TreatmentSheetPrefillResult = {};

  // See file-level note: TreatmentSheetResponse has no doctor_id field today.
  const sheetDoctorId = (treatmentSheet as any)?.doctor_id;
  if (sheetDoctorId) {
    result.selectedDoctorId = sheetDoctorId;
  }

  if (treatmentSheet.episode_id) {
    const episode = await getEpisodeApi(tenantId, treatmentSheet.episode_id);

    // See file-level note: Episode has no doctor_id field today.
    const episodeDoctorId = (episode as any)?.doctor_id;
    if (episodeDoctorId && !result.selectedDoctorId) {
      result.selectedDoctorId = episodeDoctorId;
    }

    if (episode.client_id) {
      result.clientId = episode.client_id;
      const client = await getClientApi(tenantId, episode.client_id);
      result.clientInfo = {
        name: client.full_name || 'Unknown',
        phone: client.phone || '',
      };
    }

    // See file-level note: Episode has no treatment_id field today -- only
    // params.treatmentId has ever populated this in production.
    const treatmentIdToUse = paramsTreatmentId || (episode as any)?.treatment_id;
    if (treatmentIdToUse) {
      result.treatmentId = treatmentIdToUse;
    }
  }

  const sessions = treatmentSheet.duration_days || (paramsDurationDays ? parseInt(paramsDurationDays, 10) : 0);
  if (sessions > 0) {
    result.numberOfSessions = sessions;
  }

  return result;
};

/**
 * Resolves the full multi-day form pre-fill (doctor, treatment, session
 * count, client) from an existing treatment sheet reference -- used when
 * navigating into appointment creation from a treatment sheet ("Schedule
 * Appointments"). Enabled only when both a treatmentSheetId and the MULTI
 * tab are present, matching the original effect's own guard clause.
 */
export const useTreatmentSheetPrefillQuery = (
  tenantId: string,
  treatmentSheetId: string | undefined,
  enabled: boolean,
  paramsTreatmentId?: string,
  paramsDurationDays?: string
) => {
  return useQuery<TreatmentSheetPrefillResult, Error>({
    queryKey: ['treatment-sheet-prefill', tenantId, treatmentSheetId],
    queryFn: () => resolveTreatmentSheetPrefill(tenantId, treatmentSheetId as string, paramsTreatmentId, paramsDurationDays),
    enabled: enabled && !!tenantId && !!treatmentSheetId,
  });
};

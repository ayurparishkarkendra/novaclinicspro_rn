/**
 * useClinicalTimelineData (R3B · T-C.1, ADR-R3B-02, Timeline Adapter Rule §7)
 *
 * A render-free adapter — aggregation/normalization ONLY, zero JSX, zero
 * rendering, no component-level state of its own — that reads
 * `episodeId`/`clientId`/`tenantId` from Persistent Context (CO-1) and
 * derives one chronologically ordered, uniformly shaped list from each
 * in-scope artifact type's own query. `ClinicalTimeline` (T-C.2) must never
 * itself merge queries; this file is the only place that logic lives.
 *
 * Scope (corrected T-C.1, per user direction — see `design.md`'s ADR-R3B-02
 * correction and `requirements.md`'s FR-C1/FR-C1a): Visits, Prescriptions,
 * Case Sheet, Treatment Recommendation, Clinical Services. Feedback is
 * explicitly NOT built — no backend endpoint exists to retrieve a specific
 * patient's own submitted feedback (confirmed by reading `feedback_router.py`
 * in full); deferred to a future task. Therapy Sessions/Daily Progress
 * (Doc 03 §20's own finer-grained names) are not separate top-level items —
 * they were originally carried as each Treatment Sheet entry's own row-
 * derived session-count detail; T-0.6 removed that (see below) as a
 * verified-incorrect, verified-dead local formula.
 *
 * Data sourcing — every artifact type via an existing query, except Clinical
 * Services (new frontend code wired to an existing, previously-unwired
 * backend endpoint; NOT a new backend endpoint, NFR-1/N-3 respected):
 *  - Visits: `useAppointmentsListQuery` filtered by `episode_id` — the exact
 *    pattern §2.4/T-0.4 found already proven in `AppointmentDetailScreen`'s
 *    Visit History card.
 *  - Prescriptions: `usePrescriptionsListQuery` filtered by `episode_id`.
 *  - Case Sheet: `useEpisodeContext().casesheet` (one per episode, T-0.2).
 *  - Treatment Recommendation: `useTreatmentSheetsByEpisodeQuery`.
 *  - Clinical Services: one `clinicalServicesByVisitQueryOptions`-built query
 *    per Visit above (the backend has no episode-wide query, only Visit-
 *    scoped), fanned out via `useQueries` (a dynamic-length query set — the
 *    correct primitive for a list whose size depends on how many Visits
 *    exist, unlike a fixed `useQuery` call which cannot vary hook count per
 *    render).
 *
 * Navigation targets (FR-C2) point at each artifact's own existing detail/
 * reference screen (not necessarily its editor) — the same screens
 * `PrescriptionsListScreen`/`CasesheetsListScreen`'s own item-press
 * navigation already uses, not a new navigation concept.
 *
 * R7 · T-0.6 (ED-ARCH-001 / ED-ARCH-007): the Clinical Services fan-out
 * imported `listClinicalServicesByVisitApi` directly from the datasource
 * layer — repointed to `clinicalServicesByVisitQueryOptions`, a query-
 * options factory now owned by `clinicalServices.repository.impl.ts` (see
 * that file's own docstring for why a factory, not a hook, given the
 * dynamic-length `useQueries` fan-out).
 *
 * Also removed the Treatment Recommendation subtitle's local
 * `sessionCount`/`completedSessionCount` derivation (`row.session_date`
 * presence treated as "completed"), verified incorrect two ways: (1) a
 * future-scheduled row was reported as done — it checks scheduling, not
 * execution; (2) separately verified DEAD in production — the by-episode
 * list endpoint this hook's `treatmentSheetsQuery` calls
 * (`GET .../treatment-sheets?episode_id=...`,
 * `SQLAlchemyTreatmentSheetRepository._to_dict`, backend) always returns
 * `rows: []` server-side for this specific listing (never row-populated),
 * so the formula never produced a truthy count here to begin with — this
 * change is a no-op on current observable output. A genuine backend-
 * resolved completed-session count exists (`TreatmentOrderResponse
 * .completed_count`, `SQLAlchemyTreatmentOrderRepository._sheet_to_dict`)
 * but only via the per-order detail/worklist endpoints, which are not
 * episode-scoped — reaching it here is out of T-0.6's declared change
 * surface. Per T-0.6, omitting the subtitle is preferred over inventing a
 * second frontend formula or a false count; the corrected value returns
 * with the R7 hierarchical history backend contract
 * (T-BE-A.5/T-FE-C.5–C.7). The duplicate-therapy-representation defect
 * (the same encounter surfacing as both a flat "visit" item and inside a
 * Treatment Recommendation) is a SEPARATE, still-open characterization —
 * not touched by this change, not fixed by guessing.
 */
import { useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import { useEpisodeContext, usePatientContext } from '../context/ClinicalWorkspaceContext';
import { useAppointmentsListQuery } from '../../../appointments/data/repositories/appointments.repository.impl';
import { usePrescriptionsListQuery } from '../../../prescriptions/data/repositories/prescriptions.repository.impl';
import { useTreatmentSheetsByEpisodeQuery } from '../../../treatmentSheets/data/repositories/treatmentSheets.repository.impl';
import { clinicalServicesByVisitQueryOptions } from '../../../clinicalServices/data/repositories/clinicalServices.repository.impl';

export type ClinicalTimelineItemType =
  | 'visit'
  | 'prescription'
  | 'case_sheet'
  | 'treatment_recommendation'
  | 'clinical_service';

export interface ClinicalTimelineItem {
  id: string;
  type: ClinicalTimelineItemType;
  /** ISO date/datetime string — the sole sort key (most-recent-first). */
  date: string;
  title: string;
  subtitle?: string;
  /** FR-C2: the item's own canonical detail/reference route. */
  route: string;
}

export interface ClinicalTimelineData {
  items: ClinicalTimelineItem[];
  isLoading: boolean;
}

export function useClinicalTimelineData(): ClinicalTimelineData {
  const { tenantId, episodeId, casesheet, casesheetId } = useEpisodeContext();
  const { clientId } = usePatientContext();

  const visitsQuery = useAppointmentsListQuery(
    tenantId,
    { episode_id: episodeId, skip: 0, limit: 50 },
    { enabled: !!tenantId && !!episodeId },
  );
  const prescriptionsQuery = usePrescriptionsListQuery(
    tenantId,
    { episode_id: episodeId },
    { enabled: !!tenantId && !!episodeId },
  );
  const treatmentSheetsQuery = useTreatmentSheetsByEpisodeQuery(tenantId, episodeId);

  const visits = visitsQuery.data?.items ?? [];

  const clinicalServiceQueries = useQueries({
    queries: visits.map((visit) => clinicalServicesByVisitQueryOptions(tenantId, visit.id)),
  });

  const isLoading =
    visitsQuery.isLoading ||
    prescriptionsQuery.isLoading ||
    treatmentSheetsQuery.isLoading ||
    clinicalServiceQueries.some((q) => q.isLoading);

  const items = useMemo<ClinicalTimelineItem[]>(() => {
    const result: ClinicalTimelineItem[] = [];

    visits.forEach((visit) => {
      result.push({
        id: `visit-${visit.id}`,
        type: 'visit',
        date: visit.appointment_start,
        title: 'Visit',
        subtitle: visit.status,
        route: `/clinic-admin/appointments/${visit.id}`,
      });
    });

    (prescriptionsQuery.data?.items ?? []).forEach((prescription) => {
      const medCount = prescription.prescription_data?.medications?.length ?? 0;
      result.push({
        id: `prescription-${prescription.id}`,
        type: 'prescription',
        date: prescription.created_at,
        title: 'Prescription',
        subtitle: medCount ? `${medCount} medication${medCount === 1 ? '' : 's'}` : undefined,
        route: `/clinic-admin/clients/${clientId}/prescriptions/${prescription.id}`,
      });
    });

    if (casesheet && casesheetId) {
      result.push({
        id: `case-sheet-${casesheetId}`,
        type: 'case_sheet',
        date: casesheet.recorded_at,
        title: 'Case Sheet',
        subtitle: casesheet.chief_complaint ?? undefined,
        route: `/clinic-admin/clients/${clientId}/casesheets/${casesheetId}`,
      });
    }

    (treatmentSheetsQuery.data?.treatment_sheets ?? []).forEach((sheet) => {
      // No local session-count subtitle — see file header (T-0.6): no
      // genuine backend authority is reachable from this episode-scoped
      // query today, and this hook must not invent one.
      result.push({
        id: `treatment-recommendation-${sheet.id}`,
        type: 'treatment_recommendation',
        date: sheet.recorded_at,
        title: 'Treatment Recommendation',
        route: `/clinic-admin/treatment-sheets/${sheet.id}`,
      });
    });

    clinicalServiceQueries.forEach((q) => {
      (q.data?.items ?? []).forEach((service) => {
        result.push({
          id: `clinical-service-${service.id}`,
          type: 'clinical_service',
          date: service.delivered_at,
          title: 'Clinical Service',
          subtitle: service.service_type,
          route: `/clinic-admin/appointments/${service.visit_id}`,
        });
      });
    });

    return result.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  }, [visits, prescriptionsQuery.data, casesheet, casesheetId, clientId, treatmentSheetsQuery.data, clinicalServiceQueries]);

  return { items, isLoading };
}

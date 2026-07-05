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
 * they are each Treatment Sheet's own already-fetched `rows`, carried as
 * this entry's own `sessionCount`/`completedSessionCount` detail.
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
 *  - Clinical Services: one `listClinicalServicesByVisitApi` call per Visit
 *    above (the backend has no episode-wide query, only Visit-scoped),
 *    fanned out via `useQueries` (a dynamic-length query set — the correct
 *    primitive for a list whose size depends on how many Visits exist,
 *    unlike a fixed `useQuery` call which cannot vary hook count per render).
 *
 * Navigation targets (FR-C2) point at each artifact's own existing detail/
 * reference screen (not necessarily its editor) — the same screens
 * `PrescriptionsListScreen`/`CasesheetsListScreen`'s own item-press
 * navigation already uses, not a new navigation concept.
 */
import { useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import { useEpisodeContext, usePatientContext } from '../context/ClinicalWorkspaceContext';
import { useAppointmentsListQuery } from '../../../appointments/data/repositories/appointments.repository.impl';
import { usePrescriptionsListQuery } from '../../../prescriptions/data/repositories/prescriptions.repository.impl';
import { useTreatmentSheetsByEpisodeQuery } from '../../../treatmentSheets/data/repositories/treatmentSheets.repository.impl';
import { clinicalServicesKeys } from '../../../clinicalServices/data/repositories/clinicalServices.repository.impl';
import { listClinicalServicesByVisitApi } from '../../../clinicalServices/data/datasources/clinicalServices.api';

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
    queries: visits.map((visit) => ({
      queryKey: clinicalServicesKeys.byVisit(tenantId, visit.id),
      queryFn: () => listClinicalServicesByVisitApi(tenantId, visit.id),
      enabled: !!tenantId && !!visit.id,
      staleTime: 30 * 1000,
    })),
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
      const sessionCount = sheet.rows?.length ?? 0;
      const completedSessionCount = sheet.rows?.filter((row) => !!row.session_date).length ?? 0;
      result.push({
        id: `treatment-recommendation-${sheet.id}`,
        type: 'treatment_recommendation',
        date: sheet.recorded_at,
        title: 'Treatment Recommendation',
        subtitle: sessionCount
          ? `${completedSessionCount}/${sessionCount} therapy session${sessionCount === 1 ? '' : 's'}`
          : undefined,
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

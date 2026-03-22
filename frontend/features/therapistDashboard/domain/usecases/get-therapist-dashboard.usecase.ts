/**
 * Get Therapist Dashboard Use Case
 *
 * Orchestrates the dashboard summary fetch. Accepts tenantId, calls
 * useTherapistDashboardQuery, and maps the response to the TherapistDashboard
 * domain entity (display name, today's date, stat card values).
 *
 * Requirements: 3.1, 3.2, 2.1, 2.2
 */

import { useTherapistDashboardQuery } from '../../../staffDashboards/data/repositories/staffDashboards.repository.impl';
import { TherapistDashboard } from '../entities/therapistDashboard.entity';
import { TherapistDashboardResponse } from '../../../staffDashboards/data/models/staffDashboards.dtos';
import { formatDate } from '../../../../core/utils/dateTimeUtils';

// ============================================
// MAPPING HELPERS
// ============================================

/**
 * Derive the number of completed sessions from the response.
 * A session is completed when its status is 'completed'.
 */
const countCompleted = (response: TherapistDashboardResponse): number =>
  (response.sessions ?? []).filter((s) => s.status === 'completed').length;

/**
 * Derive the number of pending sessions from the response.
 * Pending = sessions with status 'in_progress' or 'scheduled'.
 */
const countPending = (response: TherapistDashboardResponse): number =>
  (response.sessions ?? []).filter(
    (s) => s.status === 'in_progress' || s.status === 'scheduled'
  ).length;

/**
 * Map a TherapistDashboardResponse to the TherapistDashboard domain entity.
 *
 * @param response - Raw API response
 * @param displayName - Staff display name (sourced from auth context, since the
 *   dashboard summary endpoint does not return a display_name field)
 */
export const mapToDashboardEntity = (
  response: TherapistDashboardResponse,
  displayName: string = ''
): TherapistDashboard => ({
  displayName:
    (response as TherapistDashboardResponse & { display_name?: string }).display_name ??
    displayName,
  todayDate: formatDate(new Date()),
  totalSessions: response.total_count,
  completedSessions: countCompleted(response),
  pendingSessions: countPending(response),
  averageRating:
    (response as TherapistDashboardResponse & { average_rating?: number | null })
      .average_rating ?? null,
});

// ============================================
// USE CASE HOOK
// ============================================

export interface GetTherapistDashboardResult {
  data: TherapistDashboard | null;
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
}

/**
 * useGetTherapistDashboard
 *
 * React hook use case. Fetches the therapist dashboard summary for the given
 * tenantId and maps the raw API response to the TherapistDashboard entity.
 *
 * @param tenantId - The clinic's tenant identifier
 * @param displayName - Fallback display name from auth context (used when the
 *   API response does not include a display_name field)
 *
 * Returns null data while loading or on error.
 *
 * Requirements: 3.1, 3.2, 2.1, 2.2
 */
export const useGetTherapistDashboard = (
  tenantId: string,
  displayName: string = ''
): GetTherapistDashboardResult => {
  const { data, isLoading, isError, refetch } = useTherapistDashboardQuery(tenantId);

  const mappedData: TherapistDashboard | null =
    data != null ? mapToDashboardEntity(data, displayName) : null;

  return {
    data: mappedData,
    isLoading,
    isError,
    refetch,
  };
};

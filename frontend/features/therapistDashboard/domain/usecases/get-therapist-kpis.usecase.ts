/**
 * Get Therapist KPIs Use Case
 *
 * Accepts tenantId, staffId, and KpiQueryParams. Calls useTherapistKpisQuery
 * and maps the response to the TherapistKpi domain entity for display.
 *
 * Requirements: 9.3, 9.4
 */

import { useTherapistKpisQuery } from '../../../staffDashboards/data/repositories/staffDashboards.repository.impl';
import { TherapistKpi } from '../entities/therapistDashboard.entity';
import {
  KpiQueryParams,
  TherapistKpisResponse,
} from '../../../staffDashboards/data/models/staffDashboards.dtos';

// ============================================
// MAPPING HELPERS
// ============================================

/**
 * Map a TherapistKpisResponse to the TherapistKpi domain entity.
 * Converts snake_case API fields to camelCase entity fields.
 */
export const mapToKpiEntity = (response: TherapistKpisResponse): TherapistKpi => ({
  completionRate: response.completion_rate,
  retentionRate: response.retention_rate,
  satisfactionScore: response.satisfaction_score,
  ratingDistribution: response.rating_distribution,
  periodLabel: response.period_label,
});

// ============================================
// USE CASE HOOK
// ============================================

export interface GetTherapistKpisResult {
  data: TherapistKpi | null;
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
}

/**
 * useGetTherapistKpis
 *
 * React hook use case. Fetches KPI metrics for the given tenantId, staffId,
 * and query params, then maps the raw API response to the TherapistKpi entity.
 *
 * Returns null data while loading or on error.
 *
 * Requirements: 9.3, 9.4
 */
export const useGetTherapistKpis = (
  tenantId: string,
  staffId: string,
  params: KpiQueryParams
): GetTherapistKpisResult => {
  const { data, isLoading, isError, refetch } = useTherapistKpisQuery(
    tenantId,
    staffId,
    params
  );

  const mappedData: TherapistKpi | null =
    data != null ? mapToKpiEntity(data) : null;

  return {
    data: mappedData,
    isLoading,
    isError,
    refetch,
  };
};

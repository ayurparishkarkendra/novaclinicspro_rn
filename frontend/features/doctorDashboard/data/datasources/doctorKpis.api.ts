/**
 * Doctor KPIs API
 * Handles HTTP calls for doctor KPI data
 * 
 * API Support Status:
 * - Doctor KPIs: SUPPORTED via GET /api/v1/clinic/{tenant_id}/staff/{staff_id}/kpis
 */

import { axiosClient } from '../../../../core/api/axiosClient';
import type {
  DoctorKpiResponseDTO,
  DoctorKpiQueryParams,
} from '../models/doctorKpis.dtos';

// ============================================
// KPI API
// ============================================

/**
 * Get doctor KPI metrics
 * GET /api/v1/clinic/{tenant_id}/staff/{staff_id}/kpis
 * 
 * @param tenantId - Clinic tenant ID
 * @param staffId - Doctor's staff ID
 * @param params - Query parameters (period, from_date, to_date)
 */
export const getDoctorKpisApi = async (
  tenantId: string,
  staffId: string,
  params: DoctorKpiQueryParams
): Promise<DoctorKpiResponseDTO> => {
  const queryParams = new URLSearchParams();
  queryParams.set('period', params.period);
  
  if (params.period === 'custom') {
    if (params.from_date) queryParams.set('from_date', params.from_date);
    if (params.to_date) queryParams.set('to_date', params.to_date);
  }

  const response = await axiosClient.get<DoctorKpiResponseDTO>(
    `/api/v1/clinic/${tenantId}/staff/${staffId}/kpis?${queryParams.toString()}`
  );
  return response.data;
};

/**
 * Clinical Services API
 * Handles HTTP calls for Clinical Services (Phase 2 backend, R3A · T-B.4
 * first frontend surface).
 *
 * IMPORTANT: All paths must start with /api/v1/...
 */

import { axiosClient } from '../../../../core/api/axiosClient';
import { ClinicalServiceCreateRequest, ClinicalServiceResponse } from '../models/clinicalServices.dtos';

/**
 * Record a new Clinical Service
 * POST /api/v1/clinic/{tenant_id}/clinical-services
 */
export const createClinicalServiceApi = async (
  tenantId: string,
  payload: ClinicalServiceCreateRequest
): Promise<ClinicalServiceResponse> => {
  const response = await axiosClient.post(
    `/api/v1/clinic/${tenantId}/clinical-services`,
    payload
  );
  return response.data;
};

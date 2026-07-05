/**
 * Clinical Services API
 * Handles HTTP calls for Clinical Services (Phase 2 backend, R3A · T-B.4
 * first frontend surface).
 *
 * IMPORTANT: All paths must start with /api/v1/...
 */

import { axiosClient } from '../../../../core/api/axiosClient';
import { ClinicalServiceCreateRequest, ClinicalServiceListResponse, ClinicalServiceResponse } from '../models/clinicalServices.dtos';

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

/**
 * List Clinical Services recorded against one Visit.
 * GET /api/v1/clinic/{tenant_id}/clinical-services?visit_id=...
 *
 * R3B · T-C.1 (Clinical Timeline) — the first frontend call to this
 * endpoint. The backend has no episode-wide Clinical Services query, only
 * this Visit-scoped one (Phase 2's own `clinical_services_router.py`), so
 * the Timeline adapter calls this once per Visit in the episode.
 */
export const listClinicalServicesByVisitApi = async (
  tenantId: string,
  visitId: string
): Promise<ClinicalServiceListResponse> => {
  const response = await axiosClient.get(
    `/api/v1/clinic/${tenantId}/clinical-services`,
    { params: { visit_id: visitId } }
  );
  return response.data;
};

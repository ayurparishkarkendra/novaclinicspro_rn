/**
 * Clinical Workspace API
 * Handles the HTTP call for the backend-owned Clinical Workspace facts
 * aggregate (T-BE-A.1 / T-BE-A.2).
 *
 * IMPORTANT: All paths must start with /api/v1/...
 */

import { axiosClient } from '../../../../core/api/axiosClient';
import { WorkspaceFactsResponse } from '../models/clinicalWorkspace.dtos';

/**
 * Get the Clinical Workspace facts aggregate for a Visit context.
 * GET /api/v1/clinic/{tenant_id}/clinical-workspace
 */
export const getClinicalWorkspaceApi = async (
  tenantId: string,
  clientId: string,
  episodeId: string,
  appointmentId: string,
): Promise<WorkspaceFactsResponse> => {
  const response = await axiosClient.get(
    `/api/v1/clinic/${tenantId}/clinical-workspace`,
    { params: { client_id: clientId, episode_id: episodeId, appointment_id: appointmentId } },
  );
  return response.data;
};

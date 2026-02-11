/**
 * Admin Applications API Datasource
 * Handles all HTTP calls for tenant applications management
 */

import { axiosClient } from '../../../../core/api/axiosClient';
import {
  TenantApplicationListItemResponse,
  TenantApplicationDetailResponse,
  ListApplicationsParams,
  ReviewApplicationRequest,
} from '../models/adminApplications.dtos';

/**
 * List all tenant applications
 * GET /api/v1/admin/applications
 */
export const listTenantApplicationsApi = async (
  params?: ListApplicationsParams
): Promise<TenantApplicationListItemResponse[]> => {
  const response = await axiosClient.get('/api/v1/admin/applications', {
    params,
  });
  return response.data;
};

/**
 * Get application by ID
 * GET /api/v1/admin/applications/{application_id}
 */
export const getTenantApplicationApi = async (
  id: string
): Promise<TenantApplicationDetailResponse> => {
  const response = await axiosClient.get(`/api/v1/admin/applications/${id}`);
  return response.data;
};

/**
 * Review application (approve/reject)
 * POST /api/v1/admin/applications/{application_id}/review
 */
export const reviewTenantApplicationApi = async (
  id: string,
  payload: ReviewApplicationRequest
): Promise<TenantApplicationDetailResponse> => {
  const response = await axiosClient.post(
    `/api/v1/admin/applications/${id}/review`,
    payload
  );
  return response.data;
};

/**
 * Activate application (go-live)
 * POST /api/v1/admin/applications/{application_id}/go-live
 */
export const activateApplicationApi = async (
  id: string
): Promise<TenantApplicationDetailResponse> => {
  const response = await axiosClient.post(
    `/api/v1/admin/applications/${id}/go-live`
  );
  return response.data;
};

/**
 * Suspend application
 * POST /api/v1/admin/applications/{application_id}/suspend
 */
export const suspendApplicationApi = async (
  id: string
): Promise<TenantApplicationDetailResponse> => {
  const response = await axiosClient.post(
    `/api/v1/admin/applications/${id}/suspend`
  );
  return response.data;
};

/**
 * Reactivate suspended application
 * POST /api/v1/admin/applications/{application_id}/reactivate
 */
export const reactivateApplicationApi = async (
  id: string
): Promise<TenantApplicationDetailResponse> => {
  const response = await axiosClient.post(
    `/api/v1/admin/applications/${id}/reactivate`
  );
  return response.data;
};

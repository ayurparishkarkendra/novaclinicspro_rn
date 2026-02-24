/**
 * Staff Dashboards API
 * Handles all HTTP calls for role-specific dashboards
 *
 * IMPORTANT: All paths must start with /api/v1/...
 */

import { axiosClient } from '../../../../core/api/axiosClient';
import {
  DoctorDashboardResponse,
  TherapistDashboardResponse,
  FrontdeskDashboardResponse,
} from '../models/staffDashboards.dtos';

/**
 * Get doctor dashboard data
 * GET /api/v1/clinic/{tenant_id}/staff/me/dashboard/doctor
 */
export const getDoctorDashboardApi = async (
  tenantId: string,
  params?: {
    date?: string;
  }
): Promise<DoctorDashboardResponse> => {
  console.log('[API] Fetching doctor dashboard:', {
    tenantId,
    params,
    fullParams: {
      ...params,
      expand: 'staff,client,treatment'
    }
  });
  
  const response = await axiosClient.get(
    `/api/v1/clinic/${tenantId}/staff/me/dashboard/doctor`,
    { 
      params: {
        ...params,
        expand: 'staff,client,treatment'
      }
    }
  );
  
  console.log('[API] Doctor dashboard response:', {
    appointmentsCount: response.data?.appointments?.length || 0,
    firstAppointment: response.data?.appointments?.[0],
    requestedDate: params?.date,
  });
  
  return response.data;
};

/**
 * Get therapist dashboard data
 * GET /api/v1/clinic/{tenant_id}/staff/me/dashboard/therapist
 */
export const getTherapistDashboardApi = async (
  tenantId: string
): Promise<TherapistDashboardResponse> => {
  const response = await axiosClient.get(
    `/api/v1/clinic/${tenantId}/staff/me/dashboard/therapist`
  );
  return response.data;
};

/**
 * Get frontdesk dashboard data
 * GET /api/v1/clinic/{tenant_id}/staff/me/dashboard/frontdesk
 */
export const getFrontdeskDashboardApi = async (
  tenantId: string,
  params?: {
    doctor_id?: string;
    room_id?: string;
    status?: string;
  }
): Promise<FrontdeskDashboardResponse> => {
  const response = await axiosClient.get(
    `/api/v1/clinic/${tenantId}/staff/me/dashboard/frontdesk`,
    { params }
  );
  return response.data;
};

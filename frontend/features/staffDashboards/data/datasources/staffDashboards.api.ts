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
  
  console.log('[API] Doctor dashboard RAW response:', {
    fullResponse: response.data,
    appointmentsArray: response.data?.appointments,
    appointmentsCount: response.data?.appointments?.length || 0,
    totalCount: response.data?.total_count,
    onLeave: response.data?.on_leave_today,
    firstAppointment: response.data?.appointments?.[0],
    firstAppointmentDoctorId: response.data?.appointments?.[0]?.doctor_id,
    requestedDate: params?.date,
  });
  
  console.log('[API] Doctor dashboard - Appointment doctor IDs:', 
    response.data?.appointments?.map((apt: any) => ({
      id: apt.id,
      doctor_id: apt.doctor_id,
      client_name: apt.client_name,
      date: apt.appointment_start?.split('T')[0],
    }))
  );
  
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

// ============================================
// ADMIN DASHBOARD - MULTI-DAY TREATMENTS (F2.5)
// ============================================

import {
  TreatmentStatsResponse,
  PendingProposalItem,
  TodaySessionStatsResponse,
  PausedSeriesItem,
} from '../models/staffDashboards.dtos';

/**
 * Get treatment statistics for admin dashboard
 * GET /api/v1/clinic/{tenant_id}/treatment-stats
 */
export const getTreatmentStatsApi = async (
  tenantId: string
): Promise<TreatmentStatsResponse> => {
  console.log('[API] Fetching treatment stats:', { tenantId });
  const response = await axiosClient.get(
    `/api/v1/clinic/${tenantId}/treatment-stats`
  );
  console.log('[API] Treatment stats response:', response.data);
  return response.data;
};

/**
 * Get pending proposals for admin dashboard
 * GET /api/v1/clinic/{tenant_id}/treatment-proposals?status=PROPOSED
 */
export const getPendingProposalsApi = async (
  tenantId: string,
  limit: number = 5
): Promise<{ proposals: PendingProposalItem[]; total: number }> => {
  console.log('[API] Fetching pending proposals:', { tenantId, limit });
  const response = await axiosClient.get(
    `/api/v1/clinic/${tenantId}/treatment-proposals`,
    { 
      params: { 
        status: 'PROPOSED',
        limit,
        expand: 'client,created_by'
      } 
    }
  );
  console.log('[API] Pending proposals response:', response.data);
  return response.data;
};

/**
 * Get today's session statistics for admin dashboard
 * GET /api/v1/clinic/{tenant_id}/today-session-stats
 */
export const getTodaySessionStatsApi = async (
  tenantId: string,
  date?: string
): Promise<TodaySessionStatsResponse> => {
  console.log('[API] Fetching today session stats:', { tenantId, date });
  const response = await axiosClient.get(
    `/api/v1/clinic/${tenantId}/today-session-stats`,
    { params: { date } }
  );
  console.log('[API] Today session stats response:', response.data);
  return response.data;
};

/**
 * Get paused series for admin dashboard
 * GET /api/v1/clinic/{tenant_id}/treatment-sheets?status=PAUSED
 */
export const getPausedSeriesApi = async (
  tenantId: string,
  limit: number = 5
): Promise<{ series: PausedSeriesItem[]; total: number }> => {
  console.log('[API] Fetching paused series:', { tenantId, limit });
  const response = await axiosClient.get(
    `/api/v1/clinic/${tenantId}/treatment-sheets`,
    { 
      params: { 
        status: 'PAUSED',
        limit,
        expand: 'client'
      } 
    }
  );
  console.log('[API] Paused series response:', response.data);
  return response.data;
};


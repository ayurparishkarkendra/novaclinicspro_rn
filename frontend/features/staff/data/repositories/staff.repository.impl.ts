/**
 * Staff Repository Implementation
 * React Query hooks for staff management
 */

import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import {
  listStaffApi,
  getStaffApi,
  createStaffApi,
  updateStaffApi,
  deleteStaffApi,
  listStaffLeaveApi,
  createStaffLeaveApi,
  approveLeaveApi,
  rejectLeaveApi,
  cancelLeaveApi,
  searchStaffApi,
} from '../datasources/staff.api';
import {
  StaffCreate,
  StaffUpdate,
  StaffResponse,
  StaffLeaveCreate,
  StaffLeaveResponse,
  LeaveApproveRequest,
  LeaveRejectRequest,
  ListStaffParams,
  ListStaffLeaveParams,
  PaginatedStaffResponse,
  PaginatedLeaveResponse,
} from '../models/staff.dtos';

// ============================================
// QUERY KEYS
// ============================================

export const staffKeys = {
  all: ['staff'] as const,
  lists: () => [...staffKeys.all, 'list'] as const,
  list: (tenantId: string, params?: ListStaffParams) =>
    [...staffKeys.lists(), tenantId, params] as const,
  details: () => [...staffKeys.all, 'detail'] as const,
  detail: (tenantId: string, staffId: string) =>
    [...staffKeys.details(), tenantId, staffId] as const,
  search: (tenantId: string, query: string) =>
    [...staffKeys.all, 'search', tenantId, query] as const,
  // Leave keys
  leaves: () => [...staffKeys.all, 'leaves'] as const,
  leaveList: (tenantId: string, staffId: string, params?: ListStaffLeaveParams) =>
    [...staffKeys.leaves(), tenantId, staffId, params] as const,
};

// ============================================
// STAFF QUERY HOOKS
// ============================================

/**
 * Hook to list staff members for a tenant
 */
export const useStaffListQuery = (
  tenantId: string,
  params?: ListStaffParams,
  options?: Omit<UseQueryOptions<PaginatedStaffResponse, Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<PaginatedStaffResponse, Error>({
    queryKey: staffKeys.list(tenantId, params),
    queryFn: () => listStaffApi(tenantId, params),
    enabled: !!tenantId,
    ...options,
  });
};

/**
 * Hook to get a single staff member
 */
export const useStaffDetailQuery = (
  tenantId: string,
  staffId: string,
  options?: Omit<UseQueryOptions<StaffResponse, Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<StaffResponse, Error>({
    queryKey: staffKeys.detail(tenantId, staffId),
    queryFn: () => getStaffApi(tenantId, staffId),
    enabled: !!tenantId && !!staffId,
    ...options,
  });
};

// ============================================
// STAFF MUTATION HOOKS
// ============================================

/**
 * Hook to create a staff member
 */
export const useCreateStaffMutation = (tenantId: string) => {
  const queryClient = useQueryClient();

  return useMutation<StaffResponse, Error, StaffCreate>({
    mutationFn: (payload) => createStaffApi(tenantId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: staffKeys.lists() });
    },
  });
};

/**
 * Hook to update a staff member
 */
export const useUpdateStaffMutation = (tenantId: string, staffId: string) => {
  const queryClient = useQueryClient();

  return useMutation<StaffResponse, Error, StaffUpdate>({
    mutationFn: (payload) => updateStaffApi(tenantId, staffId, payload),
    onSuccess: (data) => {
      queryClient.setQueryData(staffKeys.detail(tenantId, staffId), data);
      queryClient.invalidateQueries({ queryKey: staffKeys.lists() });
    },
  });
};

/**
 * Hook to delete a staff member
 */
export const useDeleteStaffMutation = (tenantId: string) => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (staffId) => deleteStaffApi(tenantId, staffId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: staffKeys.lists() });
    },
  });
};

// ============================================
// LEAVE QUERY HOOKS
// ============================================

/**
 * Hook to list leave requests for a staff member
 */
export const useStaffLeaveListQuery = (
  tenantId: string,
  staffId: string,
  params?: ListStaffLeaveParams,
  options?: Omit<UseQueryOptions<PaginatedLeaveResponse, Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<PaginatedLeaveResponse, Error>({
    queryKey: staffKeys.leaveList(tenantId, staffId, params),
    queryFn: () => listStaffLeaveApi(tenantId, staffId, params),
    enabled: !!tenantId && !!staffId,
    ...options,
  });
};

// ============================================
// LEAVE MUTATION HOOKS
// ============================================

/**
 * Hook to create a leave request
 */
export const useCreateLeaveMutation = (tenantId: string, staffId: string) => {
  const queryClient = useQueryClient();

  return useMutation<StaffLeaveResponse, Error, StaffLeaveCreate>({
    mutationFn: (payload) => createStaffLeaveApi(tenantId, staffId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: staffKeys.leaves() });
    },
  });
};

/**
 * Hook to approve a leave request
 */
export const useApproveLeaveMutation = (tenantId: string) => {
  const queryClient = useQueryClient();

  return useMutation<
    StaffLeaveResponse,
    Error,
    { leaveId: string; payload?: LeaveApproveRequest }
  >({
    mutationFn: ({ leaveId, payload }) => approveLeaveApi(tenantId, leaveId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: staffKeys.leaves() });
    },
  });
};

/**
 * Hook to reject a leave request
 */
export const useRejectLeaveMutation = (tenantId: string) => {
  const queryClient = useQueryClient();

  return useMutation<
    StaffLeaveResponse,
    Error,
    { leaveId: string; payload: LeaveRejectRequest }
  >({
    mutationFn: ({ leaveId, payload }) => rejectLeaveApi(tenantId, leaveId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: staffKeys.leaves() });
    },
  });
};

/**
 * Hook to cancel a leave request
 */
export const useCancelLeaveMutation = (tenantId: string) => {
  const queryClient = useQueryClient();

  return useMutation<StaffLeaveResponse, Error, string>({
    mutationFn: (leaveId) => cancelLeaveApi(tenantId, leaveId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: staffKeys.leaves() });
    },
  });
};

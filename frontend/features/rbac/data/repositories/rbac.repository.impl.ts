/**
 * RBAC Repository Implementation
 * React Query hooks for RBAC management
 */

import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import {
  // Tenant Roles
  listTenantRolesApi,
  getTenantRoleApi,
  createTenantRoleApi,
  updateTenantRoleApi,
  deleteTenantRoleApi,
  // Tenant Permissions
  listTenantPermissionsApi,
  getTenantPermissionApi,
  toggleTenantPermissionApi,
  // Tenant Users
  listTenantUsersApi,
  getTenantUserApi,
  createTenantUserApi,
  updateTenantUserApi,
  // User Role Assignments
  listTenantUserRolesApi,
  getTenantUserRoleApi,
  assignTenantUserRoleApi,
  updateTenantUserRoleApi,
  removeTenantUserRoleApi,
  // Audit History
  listRbacAuditHistoryApi,
  getRbacAuditHistoryApi,
} from '../datasources/rbac.api';
import {
  // DTOs
  TenantRoleCreate,
  TenantRoleUpdate,
  TenantRoleResponse,
  ListTenantRolesParams,
  PaginatedTenantRolesResponse,
  TenantPermissionResponse,
  TenantPermissionToggleActive,
  ListTenantPermissionsParams,
  PaginatedTenantPermissionsResponse,
  TenantUserCreate,
  TenantUserUpdate,
  TenantUserResponse,
  ListTenantUsersParams,
  PaginatedTenantUsersResponse,
  TenantUserRoleAssign,
  TenantUserRoleUpdate,
  TenantUserRoleResponse,
  TenantUserRoleRemove,
  ListTenantUserRolesParams,
  PaginatedTenantUserRolesResponse,
  TenantUserRoleHistoryResponse,
  ListRbacAuditParams,
  PaginatedRbacAuditResponse,
} from '../models/rbac.dtos';

// ============================================
// QUERY KEYS
// ============================================

export const rbacKeys = {
  all: ['rbac'] as const,
  
  // Tenant Roles
  roles: (tenantId: string) => [...rbacKeys.all, 'roles', tenantId] as const,
  rolesList: (tenantId: string, params?: ListTenantRolesParams) => 
    [...rbacKeys.roles(tenantId), 'list', params] as const,
  roleDetail: (tenantId: string, roleId: string) => 
    [...rbacKeys.roles(tenantId), 'detail', roleId] as const,
  
  // Tenant Permissions
  permissions: (tenantId: string) => [...rbacKeys.all, 'permissions', tenantId] as const,
  permissionsList: (tenantId: string, params?: ListTenantPermissionsParams) => 
    [...rbacKeys.permissions(tenantId), 'list', params] as const,
  permissionDetail: (tenantId: string, permissionId: string) => 
    [...rbacKeys.permissions(tenantId), 'detail', permissionId] as const,
  
  // Tenant Users
  users: (tenantId: string) => [...rbacKeys.all, 'users', tenantId] as const,
  usersList: (tenantId: string, params?: ListTenantUsersParams) => 
    [...rbacKeys.users(tenantId), 'list', params] as const,
  userDetail: (tenantId: string, userId: string) => 
    [...rbacKeys.users(tenantId), 'detail', userId] as const,
  
  // User Role Assignments
  userRoles: (tenantId: string) => [...rbacKeys.all, 'userRoles', tenantId] as const,
  userRolesList: (tenantId: string, params?: ListTenantUserRolesParams) => 
    [...rbacKeys.userRoles(tenantId), 'list', params] as const,
  userRoleDetail: (tenantId: string, assignmentId: string) => 
    [...rbacKeys.userRoles(tenantId), 'detail', assignmentId] as const,
  
  // Audit History
  audit: (tenantId: string) => [...rbacKeys.all, 'audit', tenantId] as const,
  auditList: (tenantId: string, params?: ListRbacAuditParams) => 
    [...rbacKeys.audit(tenantId), 'list', params] as const,
  auditDetail: (tenantId: string, historyId: string) => 
    [...rbacKeys.audit(tenantId), 'detail', historyId] as const,
};

// ============================================
// TENANT ROLES HOOKS
// ============================================

/**
 * Hook to list tenant roles
 */
export const useTenantRolesQuery = (
  tenantId: string,
  params?: ListTenantRolesParams,
  options?: Omit<UseQueryOptions<PaginatedTenantRolesResponse, Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<PaginatedTenantRolesResponse, Error>({
    queryKey: rbacKeys.rolesList(tenantId, params),
    queryFn: () => listTenantRolesApi(tenantId, params),
    enabled: !!tenantId,
    ...options,
  });
};

/**
 * Hook to get a single tenant role
 */
export const useTenantRoleQuery = (
  tenantId: string,
  roleId: string,
  options?: Omit<UseQueryOptions<TenantRoleResponse, Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<TenantRoleResponse, Error>({
    queryKey: rbacKeys.roleDetail(tenantId, roleId),
    queryFn: () => getTenantRoleApi(tenantId, roleId),
    enabled: !!tenantId && !!roleId,
    ...options,
  });
};

/**
 * Hook to create a tenant role
 */
export const useCreateTenantRoleMutation = (tenantId: string) => {
  const queryClient = useQueryClient();

  return useMutation<TenantRoleResponse, Error, TenantRoleCreate>({
    mutationFn: (payload) => createTenantRoleApi(tenantId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rbacKeys.roles(tenantId) });
    },
  });
};

/**
 * Hook to update a tenant role
 */
export const useUpdateTenantRoleMutation = (tenantId: string, roleId: string) => {
  const queryClient = useQueryClient();

  return useMutation<TenantRoleResponse, Error, TenantRoleUpdate>({
    mutationFn: (payload) => updateTenantRoleApi(tenantId, roleId, payload),
    onSuccess: (data) => {
      queryClient.setQueryData(rbacKeys.roleDetail(tenantId, roleId), data);
      queryClient.invalidateQueries({ queryKey: rbacKeys.roles(tenantId) });
    },
  });
};

/**
 * Hook to delete a tenant role
 */
export const useDeleteTenantRoleMutation = (tenantId: string) => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (roleId) => deleteTenantRoleApi(tenantId, roleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rbacKeys.roles(tenantId) });
    },
  });
};

// ============================================
// TENANT PERMISSIONS HOOKS
// ============================================

/**
 * Hook to list tenant permissions
 */
export const useTenantPermissionsQuery = (
  tenantId: string,
  params?: ListTenantPermissionsParams,
  options?: Omit<UseQueryOptions<PaginatedTenantPermissionsResponse, Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<PaginatedTenantPermissionsResponse, Error>({
    queryKey: rbacKeys.permissionsList(tenantId, params),
    queryFn: () => listTenantPermissionsApi(tenantId, params),
    enabled: !!tenantId,
    ...options,
  });
};

/**
 * Hook to get a single tenant permission
 */
export const useTenantPermissionQuery = (
  tenantId: string,
  permissionId: string,
  options?: Omit<UseQueryOptions<TenantPermissionResponse, Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<TenantPermissionResponse, Error>({
    queryKey: rbacKeys.permissionDetail(tenantId, permissionId),
    queryFn: () => getTenantPermissionApi(tenantId, permissionId),
    enabled: !!tenantId && !!permissionId,
    ...options,
  });
};

/**
 * Hook to toggle tenant permission active status
 */
export const useToggleTenantPermissionMutation = (tenantId: string) => {
  const queryClient = useQueryClient();

  return useMutation<
    TenantPermissionResponse,
    Error,
    { permissionId: string; payload: TenantPermissionToggleActive }
  >({
    mutationFn: ({ permissionId, payload }) =>
      toggleTenantPermissionApi(tenantId, permissionId, payload),
    onSuccess: (data) => {
      queryClient.setQueryData(
        rbacKeys.permissionDetail(tenantId, data.id),
        data
      );
      queryClient.invalidateQueries({ queryKey: rbacKeys.permissions(tenantId) });
    },
  });
};

// ============================================
// TENANT USERS HOOKS
// ============================================

/**
 * Hook to list tenant users
 */
export const useTenantUsersQuery = (
  tenantId: string,
  params?: ListTenantUsersParams,
  options?: Omit<UseQueryOptions<PaginatedTenantUsersResponse, Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<PaginatedTenantUsersResponse, Error>({
    queryKey: rbacKeys.usersList(tenantId, params),
    queryFn: () => listTenantUsersApi(tenantId, params),
    enabled: !!tenantId,
    ...options,
  });
};

/**
 * Hook to get a single tenant user
 */
export const useTenantUserQuery = (
  tenantId: string,
  tenantUserId: string,
  options?: Omit<UseQueryOptions<TenantUserResponse, Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<TenantUserResponse, Error>({
    queryKey: rbacKeys.userDetail(tenantId, tenantUserId),
    queryFn: () => getTenantUserApi(tenantId, tenantUserId),
    enabled: !!tenantId && !!tenantUserId,
    ...options,
  });
};

/**
 * Hook to create/invite a tenant user
 */
export const useCreateTenantUserMutation = (tenantId: string) => {
  const queryClient = useQueryClient();

  return useMutation<TenantUserResponse, Error, TenantUserCreate>({
    mutationFn: (payload) => createTenantUserApi(tenantId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rbacKeys.users(tenantId) });
    },
  });
};

/**
 * Hook to update a tenant user
 */
export const useUpdateTenantUserMutation = (tenantId: string, tenantUserId: string) => {
  const queryClient = useQueryClient();

  return useMutation<TenantUserResponse, Error, TenantUserUpdate>({
    mutationFn: (payload) => updateTenantUserApi(tenantId, tenantUserId, payload),
    onSuccess: (data) => {
      queryClient.setQueryData(rbacKeys.userDetail(tenantId, tenantUserId), data);
      queryClient.invalidateQueries({ queryKey: rbacKeys.users(tenantId) });
    },
  });
};

// ============================================
// USER ROLE ASSIGNMENTS HOOKS
// ============================================

/**
 * Hook to list tenant user role assignments
 */
export const useTenantUserRolesQuery = (
  tenantId: string,
  params?: ListTenantUserRolesParams,
  options?: Omit<UseQueryOptions<PaginatedTenantUserRolesResponse, Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<PaginatedTenantUserRolesResponse, Error>({
    queryKey: rbacKeys.userRolesList(tenantId, params),
    queryFn: () => listTenantUserRolesApi(tenantId, params),
    enabled: !!tenantId,
    ...options,
  });
};

/**
 * Hook to get a single user role assignment
 */
export const useTenantUserRoleQuery = (
  tenantId: string,
  assignmentId: string,
  options?: Omit<UseQueryOptions<TenantUserRoleResponse, Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<TenantUserRoleResponse, Error>({
    queryKey: rbacKeys.userRoleDetail(tenantId, assignmentId),
    queryFn: () => getTenantUserRoleApi(tenantId, assignmentId),
    enabled: !!tenantId && !!assignmentId,
    ...options,
  });
};

/**
 * Hook to assign a role to a tenant user
 */
export const useAssignTenantUserRoleMutation = (tenantId: string) => {
  const queryClient = useQueryClient();

  return useMutation<TenantUserRoleResponse, Error, TenantUserRoleAssign>({
    mutationFn: (payload) => assignTenantUserRoleApi(tenantId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rbacKeys.userRoles(tenantId) });
      queryClient.invalidateQueries({ queryKey: rbacKeys.audit(tenantId) });
    },
  });
};

/**
 * Hook to update a user role assignment
 */
export const useUpdateTenantUserRoleMutation = (tenantId: string, assignmentId: string) => {
  const queryClient = useQueryClient();

  return useMutation<TenantUserRoleResponse, Error, TenantUserRoleUpdate>({
    mutationFn: (payload) => updateTenantUserRoleApi(tenantId, assignmentId, payload),
    onSuccess: (data) => {
      queryClient.setQueryData(rbacKeys.userRoleDetail(tenantId, assignmentId), data);
      queryClient.invalidateQueries({ queryKey: rbacKeys.userRoles(tenantId) });
      queryClient.invalidateQueries({ queryKey: rbacKeys.audit(tenantId) });
    },
  });
};

/**
 * Hook to remove a role from a tenant user
 */
export const useRemoveTenantUserRoleMutation = (tenantId: string) => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { assignmentId: string; payload?: TenantUserRoleRemove }>({
    mutationFn: ({ assignmentId, payload }) =>
      removeTenantUserRoleApi(tenantId, assignmentId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rbacKeys.userRoles(tenantId) });
      queryClient.invalidateQueries({ queryKey: rbacKeys.audit(tenantId) });
    },
  });
};

// ============================================
// RBAC AUDIT HISTORY HOOKS
// ============================================

/**
 * Hook to list RBAC audit history
 */
export const useRbacAuditHistoryQuery = (
  tenantId: string,
  params?: ListRbacAuditParams,
  options?: Omit<UseQueryOptions<PaginatedRbacAuditResponse, Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<PaginatedRbacAuditResponse, Error>({
    queryKey: rbacKeys.auditList(tenantId, params),
    queryFn: () => listRbacAuditHistoryApi(tenantId, params),
    enabled: !!tenantId,
    ...options,
  });
};

/**
 * Hook to get a single audit history entry
 */
export const useRbacAuditHistoryDetailQuery = (
  tenantId: string,
  historyId: string,
  options?: Omit<UseQueryOptions<TenantUserRoleHistoryResponse, Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<TenantUserRoleHistoryResponse, Error>({
    queryKey: rbacKeys.auditDetail(tenantId, historyId),
    queryFn: () => getRbacAuditHistoryApi(tenantId, historyId),
    enabled: !!tenantId && !!historyId,
    ...options,
  });
};

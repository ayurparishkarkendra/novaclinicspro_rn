/**
 * RBAC API Datasource
 * Handles all HTTP calls for RBAC management
 * 
 * IMPORTANT: All paths must start with /api/v1/...
 */

import { axiosClient } from '../../../../core/api/axiosClient';
import {
  // Tenant Roles
  TenantRoleCreate,
  TenantRoleUpdate,
  TenantRoleResponse,
  ListTenantRolesParams,
  PaginatedTenantRolesResponse,
  // Tenant Permissions
  TenantPermissionResponse,
  TenantPermissionToggleActive,
  ListTenantPermissionsParams,
  PaginatedTenantPermissionsResponse,
  // Tenant Users
  TenantUserCreate,
  TenantUserUpdate,
  TenantUserResponse,
  ListTenantUsersParams,
  PaginatedTenantUsersResponse,
  // User Role Assignments
  TenantUserRoleAssign,
  TenantUserRoleUpdate,
  TenantUserRoleResponse,
  TenantUserRoleRemove,
  ListTenantUserRolesParams,
  PaginatedTenantUserRolesResponse,
  // Audit History
  TenantUserRoleHistoryResponse,
  ListRbacAuditParams,
  PaginatedRbacAuditResponse,
} from '../models/rbac.dtos';

// ============================================
// TENANT ROLES API
// ============================================

/**
 * List tenant roles
 * GET /api/v1/rbac/{tenant_id}/tenant-roles
 */
export const listTenantRolesApi = async (
  tenantId: string,
  params?: ListTenantRolesParams
): Promise<PaginatedTenantRolesResponse> => {
  const response = await axiosClient.get(`/api/v1/rbac/${tenantId}/tenant-roles`, {
    params,
  });
  return response.data;
};

/**
 * Get tenant role by ID
 * GET /api/v1/rbac/{tenant_id}/tenant-roles/{role_id}
 */
export const getTenantRoleApi = async (
  tenantId: string,
  roleId: string
): Promise<TenantRoleResponse> => {
  const response = await axiosClient.get(
    `/api/v1/rbac/${tenantId}/tenant-roles/${roleId}`
  );
  return response.data;
};

/**
 * Create tenant role
 * POST /api/v1/rbac/{tenant_id}/tenant-roles
 */
export const createTenantRoleApi = async (
  tenantId: string,
  payload: TenantRoleCreate
): Promise<TenantRoleResponse> => {
  const response = await axiosClient.post(
    `/api/v1/rbac/${tenantId}/tenant-roles`,
    payload
  );
  return response.data;
};

/**
 * Update tenant role
 * PATCH /api/v1/rbac/{tenant_id}/tenant-roles/{role_id}
 */
export const updateTenantRoleApi = async (
  tenantId: string,
  roleId: string,
  payload: TenantRoleUpdate
): Promise<TenantRoleResponse> => {
  const response = await axiosClient.patch(
    `/api/v1/rbac/${tenantId}/tenant-roles/${roleId}`,
    payload
  );
  return response.data;
};

/**
 * Delete tenant role
 * DELETE /api/v1/rbac/{tenant_id}/tenant-roles/{role_id}
 */
export const deleteTenantRoleApi = async (
  tenantId: string,
  roleId: string
): Promise<void> => {
  await axiosClient.delete(
    `/api/v1/rbac/${tenantId}/tenant-roles/${roleId}`
  );
};

// ============================================
// TENANT PERMISSIONS API
// ============================================

/**
 * List tenant permissions
 * GET /api/v1/rbac/{tenant_id}/tenant-permissions
 */
export const listTenantPermissionsApi = async (
  tenantId: string,
  params?: ListTenantPermissionsParams
): Promise<PaginatedTenantPermissionsResponse> => {
  const response = await axiosClient.get(
    `/api/v1/rbac/${tenantId}/tenant-permissions`,
    { params }
  );
  return response.data;
};

/**
 * Get tenant permission by ID
 * GET /api/v1/rbac/{tenant_id}/tenant-permissions/{permission_id}
 */
export const getTenantPermissionApi = async (
  tenantId: string,
  permissionId: string
): Promise<TenantPermissionResponse> => {
  const response = await axiosClient.get(
    `/api/v1/rbac/${tenantId}/tenant-permissions/${permissionId}`
  );
  return response.data;
};

/**
 * Toggle tenant permission active status
 * PATCH /api/v1/rbac/{tenant_id}/tenant-permissions/{permission_id}/toggle-active
 */
export const toggleTenantPermissionApi = async (
  tenantId: string,
  permissionId: string,
  payload: TenantPermissionToggleActive
): Promise<TenantPermissionResponse> => {
  const response = await axiosClient.patch(
    `/api/v1/rbac/${tenantId}/tenant-permissions/${permissionId}/toggle-active`,
    payload
  );
  return response.data;
};

// ============================================
// TENANT USERS API
// ============================================

/**
 * List tenant users
 * GET /api/v1/rbac/{tenant_id}/tenant-users
 */
export const listTenantUsersApi = async (
  tenantId: string,
  params?: ListTenantUsersParams
): Promise<PaginatedTenantUsersResponse> => {
  const response = await axiosClient.get(
    `/api/v1/rbac/${tenantId}/tenant-users`,
    { params }
  );
  return response.data;
};

/**
 * Get tenant user by ID
 * GET /api/v1/rbac/{tenant_id}/tenant-users/{tenant_user_id}
 */
export const getTenantUserApi = async (
  tenantId: string,
  tenantUserId: string
): Promise<TenantUserResponse> => {
  const response = await axiosClient.get(
    `/api/v1/rbac/${tenantId}/tenant-users/${tenantUserId}`
  );
  return response.data;
};

/**
 * Create/invite tenant user
 * POST /api/v1/rbac/{tenant_id}/tenant-users
 */
export const createTenantUserApi = async (
  tenantId: string,
  payload: TenantUserCreate
): Promise<TenantUserResponse> => {
  const response = await axiosClient.post(
    `/api/v1/rbac/${tenantId}/tenant-users`,
    payload
  );
  return response.data;
};

/**
 * Update tenant user
 * PATCH /api/v1/rbac/{tenant_id}/tenant-users/{tenant_user_id}
 */
export const updateTenantUserApi = async (
  tenantId: string,
  tenantUserId: string,
  payload: TenantUserUpdate
): Promise<TenantUserResponse> => {
  const response = await axiosClient.patch(
    `/api/v1/rbac/${tenantId}/tenant-users/${tenantUserId}`,
    payload
  );
  return response.data;
};

// ============================================
// USER ROLE ASSIGNMENTS API
// ============================================

/**
 * List tenant user role assignments
 * GET /api/v1/rbac/{tenant_id}/tenant-user-roles
 */
export const listTenantUserRolesApi = async (
  tenantId: string,
  params?: ListTenantUserRolesParams
): Promise<PaginatedTenantUserRolesResponse> => {
  const response = await axiosClient.get(
    `/api/v1/rbac/${tenantId}/tenant-user-roles`,
    { params }
  );
  return response.data;
};

/**
 * Get tenant user role assignment by ID
 * GET /api/v1/rbac/{tenant_id}/tenant-user-roles/{assignment_id}
 */
export const getTenantUserRoleApi = async (
  tenantId: string,
  assignmentId: string
): Promise<TenantUserRoleResponse> => {
  const response = await axiosClient.get(
    `/api/v1/rbac/${tenantId}/tenant-user-roles/${assignmentId}`
  );
  return response.data;
};

/**
 * Assign role to tenant user
 * POST /api/v1/rbac/{tenant_id}/tenant-user-roles/assign
 */
export const assignTenantUserRoleApi = async (
  tenantId: string,
  payload: TenantUserRoleAssign
): Promise<TenantUserRoleResponse> => {
  const response = await axiosClient.post(
    `/api/v1/rbac/${tenantId}/tenant-user-roles/assign`,
    payload
  );
  return response.data;
};

/**
 * Update tenant user role assignment
 * PATCH /api/v1/rbac/{tenant_id}/tenant-user-roles/{assignment_id}
 */
export const updateTenantUserRoleApi = async (
  tenantId: string,
  assignmentId: string,
  payload: TenantUserRoleUpdate
): Promise<TenantUserRoleResponse> => {
  const response = await axiosClient.patch(
    `/api/v1/rbac/${tenantId}/tenant-user-roles/${assignmentId}`,
    payload
  );
  return response.data;
};

/**
 * Remove role from tenant user
 * DELETE /api/v1/rbac/{tenant_id}/tenant-user-roles/{assignment_id}
 */
export const removeTenantUserRoleApi = async (
  tenantId: string,
  assignmentId: string,
  payload?: TenantUserRoleRemove
): Promise<void> => {
  await axiosClient.delete(
    `/api/v1/rbac/${tenantId}/tenant-user-roles/${assignmentId}`,
    { data: payload }
  );
};

// ============================================
// RBAC AUDIT HISTORY API
// ============================================

/**
 * List tenant user role history
 * GET /api/v1/rbac/{tenant_id}/tenant-user-role-history
 */
export const listRbacAuditHistoryApi = async (
  tenantId: string,
  params?: ListRbacAuditParams
): Promise<PaginatedRbacAuditResponse> => {
  const response = await axiosClient.get(
    `/api/v1/rbac/${tenantId}/tenant-user-role-history`,
    { params }
  );
  return response.data;
};

/**
 * Get tenant user role history entry by ID
 * GET /api/v1/rbac/{tenant_id}/tenant-user-role-history/{history_id}
 */
export const getRbacAuditHistoryApi = async (
  tenantId: string,
  historyId: string
): Promise<TenantUserRoleHistoryResponse> => {
  const response = await axiosClient.get(
    `/api/v1/rbac/${tenantId}/tenant-user-role-history/${historyId}`
  );
  return response.data;
};

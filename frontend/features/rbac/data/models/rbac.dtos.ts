/**
 * RBAC DTOs
 * Data Transfer Objects matching OpenAPI schemas for RBAC operations
 */

// ============================================
// TENANT ROLES
// ============================================

/** Request to create a tenant role */
export interface TenantRoleCreate {
  name: string;
  description?: string | null;
  is_system?: boolean;
}

/** Request to update a tenant role */
export interface TenantRoleUpdate {
  name?: string | null;
  description?: string | null;
  is_active?: boolean | null;
}

/** Response for a tenant role */
export interface TenantRoleResponse {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  is_system: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/** Parameters for listing tenant roles */
export interface ListTenantRolesParams {
  is_active?: boolean;
  is_system?: boolean;
  search?: string;
  skip?: number;
  limit?: number;
  lang?: string;
}

// ============================================
// TENANT PERMISSIONS
// ============================================

/** Response for a tenant permission */
export interface TenantPermissionResponse {
  id: string;
  tenant_id: string;
  org_permission_id: string;
  is_active: boolean;
  code: string;
  name: string;
  description: string | null;
  category: string | null;
  module: string;
  created_at: string;
  updated_at: string;
}

/** Request to toggle permission active status */
export interface TenantPermissionToggleActive {
  is_active: boolean;
}

/** Parameters for listing tenant permissions */
export interface ListTenantPermissionsParams {
  is_active?: boolean;
  category?: string;
  module?: string;
  search?: string;
  skip?: number;
  limit?: number;
  lang?: string;
}

// ============================================
// TENANT USERS
// ============================================

/** Request to create/invite a tenant user */
export interface TenantUserCreate {
  user_id: string;
}

/** Response for a tenant user */
export interface TenantUserResponse {
  id: string;
  tenant_id: string;
  user_id: string;
  is_active: boolean;
  joined_at: string;
  created_at: string;
  updated_at: string;
}

/** Request to update a tenant user */
export interface TenantUserUpdate {
  is_active?: boolean | null;
}

/** Parameters for listing tenant users */
export interface ListTenantUsersParams {
  is_active?: boolean;
  skip?: number;
  limit?: number;
  lang?: string;
}

// ============================================
// TENANT USER ROLE ASSIGNMENTS
// ============================================

/** Request to assign a role to a tenant user */
export interface TenantUserRoleAssign {
  tenant_user_id: string;
  role_id: string;
  expires_at?: string | null;
  reason?: string | null;
}

/** Response for a tenant user role assignment */
export interface TenantUserRoleResponse {
  id: string;
  tenant_id: string;
  tenant_user_id: string;
  role_id: string;
  assigned_by: string | null;
  assigned_at: string;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/** Request to remove a role from a user */
export interface TenantUserRoleRemove {
  reason?: string | null;
}

/** Request to update a user role assignment */
export interface TenantUserRoleUpdate {
  expires_at?: string | null;
  is_active?: boolean | null;
}

/** Parameters for listing user role assignments */
export interface ListTenantUserRolesParams {
  is_active?: boolean;
  tenant_user_id?: string;
  role_id?: string;
  skip?: number;
  limit?: number;
  lang?: string;
}

// ============================================
// RBAC AUDIT HISTORY
// ============================================

/** Response for a tenant user role history entry */
export interface TenantUserRoleHistoryResponse {
  id: string;
  tenant_id: string;
  tenant_user_id: string;
  role_id: string;
  action: string;
  performed_by: string | null;
  performed_at: string;
  reason: string | null;
  metadata?: Record<string, any> | null;
}

/** Parameters for listing audit history */
export interface ListRbacAuditParams {
  tenant_user_id?: string;
  role_id?: string;
  action?: string;
  skip?: number;
  limit?: number;
  lang?: string;
}

// ============================================
// PAGINATED RESPONSES
// ============================================

/** Generic paginated response */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  skip: number;
  limit: number;
}

/** Paginated tenant roles */
export type PaginatedTenantRolesResponse = PaginatedResponse<TenantRoleResponse>;

/** Paginated tenant permissions */
export type PaginatedTenantPermissionsResponse = PaginatedResponse<TenantPermissionResponse>;

/** Paginated tenant users */
export type PaginatedTenantUsersResponse = PaginatedResponse<TenantUserResponse>;

/** Paginated tenant user roles */
export type PaginatedTenantUserRolesResponse = PaginatedResponse<TenantUserRoleResponse>;

/** Paginated audit history */
export type PaginatedRbacAuditResponse = PaginatedResponse<TenantUserRoleHistoryResponse>;

// ============================================
// CONSTANTS
// ============================================

/** Permission modules */
export const PERMISSION_MODULES = [
  'CORE',
  'CLINICAL_DOCUMENTS',
  'INVENTORY',
  'BILLING',
  'APPOINTMENTS',
  'REPORTS',
  'SETTINGS',
] as const;

/** Permission categories */
export const PERMISSION_CATEGORIES = [
  'appointments',
  'casesheets',
  'prescriptions',
  'billing',
  'inventory',
  'reports',
  'settings',
  'users',
] as const;

/** Role history actions */
export const ROLE_HISTORY_ACTIONS = [
  'assigned',
  'removed',
  'updated',
  'expired',
] as const;

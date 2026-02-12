/**
 * RBAC Repository Interface
 * Domain contract for RBAC operations
 */

import { TenantRole } from '../entities/role.entity';
import { TenantPermission } from '../entities/permission.entity';
import { TenantUser } from '../entities/tenant-user.entity';
import { TenantUserRoleAssignment } from '../entities/user-role-assignment.entity';
import { RbacAuditEvent } from '../entities/rbac-audit.entity';

// ============================================
// PAGINATION TYPES
// ============================================

export interface PaginationParams {
  skip?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  skip: number;
  limit: number;
}

// ============================================
// FILTER PARAMS
// ============================================

export interface ListRolesParams extends PaginationParams {
  isActive?: boolean;
  isSystem?: boolean;
  search?: string;
}

export interface ListPermissionsParams extends PaginationParams {
  isActive?: boolean;
  category?: string;
  module?: string;
  search?: string;
}

export interface ListUsersParams extends PaginationParams {
  isActive?: boolean;
}

export interface ListUserRolesParams extends PaginationParams {
  isActive?: boolean;
  tenantUserId?: string;
  roleId?: string;
}

export interface ListAuditParams extends PaginationParams {
  tenantUserId?: string;
  roleId?: string;
  action?: string;
}

// ============================================
// MUTATION PAYLOADS
// ============================================

export interface CreateRolePayload {
  name: string;
  description?: string | null;
  isSystem?: boolean;
}

export interface UpdateRolePayload {
  name?: string | null;
  description?: string | null;
  isActive?: boolean | null;
}

export interface AssignRolePayload {
  tenantUserId: string;
  roleId: string;
  expiresAt?: string | null;
  reason?: string | null;
}

export interface RevokeRolePayload {
  reason?: string | null;
}

// ============================================
// REPOSITORY INTERFACE
// ============================================

export interface RbacRepository {
  // Tenant Roles
  listTenantRoles(
    tenantId: string,
    params?: ListRolesParams
  ): Promise<PaginatedResult<TenantRole>>;
  
  getTenantRole(
    tenantId: string,
    roleId: string
  ): Promise<TenantRole>;
  
  createTenantRole(
    tenantId: string,
    payload: CreateRolePayload
  ): Promise<TenantRole>;
  
  updateTenantRole(
    tenantId: string,
    roleId: string,
    payload: UpdateRolePayload
  ): Promise<TenantRole>;
  
  deleteTenantRole(
    tenantId: string,
    roleId: string
  ): Promise<void>;

  // Tenant Permissions
  listTenantPermissions(
    tenantId: string,
    params?: ListPermissionsParams
  ): Promise<PaginatedResult<TenantPermission>>;
  
  getTenantPermission(
    tenantId: string,
    permissionId: string
  ): Promise<TenantPermission>;
  
  toggleTenantPermission(
    tenantId: string,
    permissionId: string,
    isActive: boolean
  ): Promise<TenantPermission>;

  // Tenant Users
  listTenantUsers(
    tenantId: string,
    params?: ListUsersParams
  ): Promise<PaginatedResult<TenantUser>>;
  
  getTenantUser(
    tenantId: string,
    tenantUserId: string
  ): Promise<TenantUser>;
  
  inviteTenantUser(
    tenantId: string,
    userId: string
  ): Promise<TenantUser>;
  
  updateTenantUser(
    tenantId: string,
    tenantUserId: string,
    isActive: boolean
  ): Promise<TenantUser>;

  // User Role Assignments
  listUserRoleAssignments(
    tenantId: string,
    params?: ListUserRolesParams
  ): Promise<PaginatedResult<TenantUserRoleAssignment>>;
  
  getUserRoleAssignment(
    tenantId: string,
    assignmentId: string
  ): Promise<TenantUserRoleAssignment>;
  
  assignRole(
    tenantId: string,
    payload: AssignRolePayload
  ): Promise<TenantUserRoleAssignment>;
  
  revokeRole(
    tenantId: string,
    assignmentId: string,
    payload?: RevokeRolePayload
  ): Promise<void>;

  // Audit History
  listAuditEvents(
    tenantId: string,
    params?: ListAuditParams
  ): Promise<PaginatedResult<RbacAuditEvent>>;
  
  getAuditEvent(
    tenantId: string,
    auditId: string
  ): Promise<RbacAuditEvent>;
}

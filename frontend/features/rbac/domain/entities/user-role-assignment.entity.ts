/**
 * User Role Assignment Entity
 * Domain model for tenant user role assignments
 */

export interface TenantUserRoleAssignment {
  id: string;
  tenantId: string;
  tenantUserId: string;
  roleId: string;
  assignedBy: string | null;
  assignedAt: Date;
  expiresAt: Date | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Transform a user role assignment DTO to entity
 */
export const toUserRoleAssignmentEntity = (dto: {
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
}): TenantUserRoleAssignment => ({
  id: dto.id,
  tenantId: dto.tenant_id,
  tenantUserId: dto.tenant_user_id,
  roleId: dto.role_id,
  assignedBy: dto.assigned_by,
  assignedAt: new Date(dto.assigned_at),
  expiresAt: dto.expires_at ? new Date(dto.expires_at) : null,
  isActive: dto.is_active,
  createdAt: new Date(dto.created_at),
  updatedAt: new Date(dto.updated_at),
});

/**
 * Check if an assignment is expired
 */
export const isAssignmentExpired = (assignment: TenantUserRoleAssignment): boolean => {
  if (!assignment.expiresAt) return false;
  return new Date() > assignment.expiresAt;
};

/**
 * Check if an assignment is effectively active (active and not expired)
 */
export const isAssignmentEffectivelyActive = (assignment: TenantUserRoleAssignment): boolean => {
  return assignment.isActive && !isAssignmentExpired(assignment);
};

/**
 * Tenant Role Entity
 * Domain model for tenant roles
 */

export interface TenantRole {
  id: string;
  tenantId: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Transform a role DTO to entity
 */
export const toTenantRoleEntity = (dto: {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  is_system: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}): TenantRole => ({
  id: dto.id,
  tenantId: dto.tenant_id,
  name: dto.name,
  description: dto.description,
  isSystem: dto.is_system,
  isActive: dto.is_active,
  createdAt: new Date(dto.created_at),
  updatedAt: new Date(dto.updated_at),
});

/**
 * Check if a role can be edited (not a system role)
 */
export const canEditRole = (role: TenantRole): boolean => {
  return !role.isSystem;
};

/**
 * Check if a role can be deleted (not a system role and active)
 */
export const canDeleteRole = (role: TenantRole): boolean => {
  return !role.isSystem && role.isActive;
};

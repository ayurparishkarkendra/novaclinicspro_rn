/**
 * Tenant Permission Entity
 * Domain model for tenant permissions
 */

export interface TenantPermission {
  id: string;
  tenantId: string;
  orgPermissionId: string;
  isActive: boolean;
  code: string;
  name: string;
  description: string | null;
  category: string | null;
  module: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Transform a permission DTO to entity
 */
export const toTenantPermissionEntity = (dto: {
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
}): TenantPermission => ({
  id: dto.id,
  tenantId: dto.tenant_id,
  orgPermissionId: dto.org_permission_id,
  isActive: dto.is_active,
  code: dto.code,
  name: dto.name,
  description: dto.description,
  category: dto.category,
  module: dto.module,
  createdAt: new Date(dto.created_at),
  updatedAt: new Date(dto.updated_at),
});

/**
 * Group permissions by module
 */
export const groupPermissionsByModule = (
  permissions: TenantPermission[]
): Record<string, TenantPermission[]> => {
  return permissions.reduce((acc, permission) => {
    const module = permission.module || 'OTHER';
    if (!acc[module]) {
      acc[module] = [];
    }
    acc[module].push(permission);
    return acc;
  }, {} as Record<string, TenantPermission[]>);
};

/**
 * Group permissions by category
 */
export const groupPermissionsByCategory = (
  permissions: TenantPermission[]
): Record<string, TenantPermission[]> => {
  return permissions.reduce((acc, permission) => {
    const category = permission.category || 'other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(permission);
    return acc;
  }, {} as Record<string, TenantPermission[]>);
};

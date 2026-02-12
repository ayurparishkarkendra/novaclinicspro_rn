/**
 * Tenant User Entity
 * Domain model for tenant users
 */

export interface TenantUser {
  id: string;
  tenantId: string;
  userId: string;
  isActive: boolean;
  joinedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Transform a tenant user DTO to entity
 */
export const toTenantUserEntity = (dto: {
  id: string;
  tenant_id: string;
  user_id: string;
  is_active: boolean;
  joined_at: string;
  created_at: string;
  updated_at: string;
}): TenantUser => ({
  id: dto.id,
  tenantId: dto.tenant_id,
  userId: dto.user_id,
  isActive: dto.is_active,
  joinedAt: new Date(dto.joined_at),
  createdAt: new Date(dto.created_at),
  updatedAt: new Date(dto.updated_at),
});

/**
 * Auth Domain Entity
 * Business logic representation of authenticated user session
 */

export interface AuthUserSession {
  id: string;
  userId: string;
  email: string;
  fullName: string;
  tenantId: string | null;
  roles: string[];
  permissions: string[];
  isOrgAdmin: boolean;
}

/**
 * Map DTO to domain entity
 */
export const mapCurrentUserToDomain = (dto: {
  user_id: string;
  email: string;
  full_name?: string;
  tenant_id: string | null;
  roles: string[];
  permissions: string[];
  is_org_admin: boolean;
}): AuthUserSession => {
  return {
    id: dto.user_id,
    userId: dto.user_id,
    email: dto.email,
    fullName: dto.full_name || dto.email,
    tenantId: dto.tenant_id,
    roles: dto.roles,
    permissions: dto.permissions,
    isOrgAdmin: dto.is_org_admin,
  };
};

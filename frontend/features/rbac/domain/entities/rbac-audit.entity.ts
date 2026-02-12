/**
 * RBAC Audit Event Entity
 * Domain model for RBAC audit history
 */

export interface RbacAuditEvent {
  id: string;
  tenantId: string;
  tenantUserId: string;
  roleId: string;
  action: RbacAuditAction;
  performedBy: string | null;
  performedAt: Date;
  reason: string | null;
  metadata: Record<string, any> | null;
}

/** Possible audit actions */
export type RbacAuditAction = 'assigned' | 'removed' | 'updated' | 'expired';

/**
 * Transform an audit event DTO to entity
 */
export const toRbacAuditEventEntity = (dto: {
  id: string;
  tenant_id: string;
  tenant_user_id: string;
  role_id: string;
  action: string;
  performed_by: string | null;
  performed_at: string;
  reason: string | null;
  metadata?: Record<string, any> | null;
}): RbacAuditEvent => ({
  id: dto.id,
  tenantId: dto.tenant_id,
  tenantUserId: dto.tenant_user_id,
  roleId: dto.role_id,
  action: dto.action as RbacAuditAction,
  performedBy: dto.performed_by,
  performedAt: new Date(dto.performed_at),
  reason: dto.reason,
  metadata: dto.metadata || null,
});

/**
 * Get human-readable action label
 */
export const getAuditActionLabel = (action: RbacAuditAction): string => {
  const labels: Record<RbacAuditAction, string> = {
    assigned: 'Role Assigned',
    removed: 'Role Removed',
    updated: 'Role Updated',
    expired: 'Role Expired',
  };
  return labels[action] || action;
};

/**
 * Get action color for UI display
 */
export const getAuditActionColor = (action: RbacAuditAction): string => {
  const colors: Record<RbacAuditAction, string> = {
    assigned: '#10b981', // success green
    removed: '#ef4444', // error red
    updated: '#f59e0b', // warning amber
    expired: '#6b7280', // grey
  };
  return colors[action] || '#6b7280';
};

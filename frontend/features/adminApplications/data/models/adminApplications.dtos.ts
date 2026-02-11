/**
 * Tenant Applications DTOs
 * Data Transfer Objects matching OpenAPI schemas for Admin - Tenant Applications
 */

// === Request DTOs ===

export interface ListApplicationsParams {
  skip?: number;
  limit?: number;
  status?: string;
  clinic_type?: string;
  region?: string;
  search?: string;
}

export interface ReviewApplicationRequest {
  decision: 'approved' | 'rejected';
  reviewer_notes?: string;
}

// === Response DTOs ===

export interface TenantApplicationListItemResponse {
  id: string;
  tenant_id: string;
  tenant_name: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  clinic_type: string;
  region?: string;
  status: string;
  submitted_at: string;
  reviewed_at?: string | null;
  reviewer_id?: string | null;
  reviewer_notes?: string | null;
  activated_at?: string | null;
  risk_score?: number;
}

export interface TenantApplicationDetailResponse extends TenantApplicationListItemResponse {
  business_profile?: Record<string, any>;
  contact_details?: Record<string, any>;
  app_context?: Record<string, any>;
  component_recommendations?: Array<{
    component: string;
    confidence: number;
    reason: string;
  }>;
  auto_approval_result?: {
    eligible: boolean;
    risk_score: number;
    risk_factors: string[];
    reason?: string;
  };
  validation_errors?: string[];
}

// === Constants ===

export const APPLICATION_STATUSES = [
  'draft',
  'pending_review',
  'approved',
  'rejected',
  'active',
  'suspended',
] as const;

export const APPLICATION_REGIONS = [
  'north',
  'south',
  'east',
  'west',
  'central',
  'northeast',
] as const;

/**
 * Tenant Domain Entity
 * Clean domain representation of a tenant
 */

export interface Tenant {
  id: string;
  code: string;
  name: string;
  clinicType: string;
  status: string;
  email?: string | null;
  phones?: Record<string, any> | null;
  websiteAddress?: string | null;
  clinicLogo?: string | null;
  clinicRegistration?: string | null;
  clinicPan?: string | null;
  clinicGst?: string | null;
  language: string;
  timezone: string;
  currency: string;
  address?: Record<string, any> | null;
  subscriptionPlan: string;
  subscriptionStatus: string;
  subscriptionStartDate?: string | null;
  subscriptionEndDate?: string | null;
  trialEndDate?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string | null;
}

/**
 * Map DTO to Domain Entity
 */
export const mapTenantFromDto = (dto: any): Tenant => ({
  id: dto.id,
  code: dto.code,
  name: dto.name,
  clinicType: dto.clinic_type,
  status: dto.status,
  email: dto.email,
  phones: dto.phones,
  websiteAddress: dto.website_address,
  clinicLogo: dto.clinic_logo,
  clinicRegistration: dto.clinic_registration,
  clinicPan: dto.clinic_pan,
  clinicGst: dto.clinic_gst,
  language: dto.language,
  timezone: dto.timezone,
  currency: dto.currency,
  address: dto.address,
  subscriptionPlan: dto.subscription_plan,
  subscriptionStatus: dto.subscription_status,
  subscriptionStartDate: dto.subscription_start_date,
  subscriptionEndDate: dto.subscription_end_date,
  trialEndDate: dto.trial_end_date,
  isActive: dto.is_active,
  createdAt: dto.created_at,
  updatedAt: dto.updated_at,
});

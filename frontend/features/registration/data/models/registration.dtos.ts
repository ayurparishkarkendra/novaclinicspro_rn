/**
 * Registration DTOs
 * Data Transfer Objects matching the OpenAPI schema
 */

// === Request DTOs ===

export interface ClinicOwnerRegistrationRequest {
  email: string;
  password: string;
  full_name: string;
  phone: string;
  tenant_name: string;
  clinic_type: string;
  business_profile: BusinessProfile;
  contact_details: ContactDetails;
  app_context: AppContext;
  requested_components?: string[];
}

export interface BusinessProfile {
  business_name?: string;
  business_type?: 'individual' | 'partnership' | 'company' | 'trust';
  registration_number?: string;
  tax_id?: string;
  established_year?: number;
  staff_count?: '1-5' | '6-20' | '21-50' | '50+';
  specializations?: string[];
  services_offered?: string[];
  current_systems?: string[];
  pain_points?: string[];
}

export interface ContactDetails {
  primary_contact: PrimaryContact;
  clinic_address: ClinicAddress;
  operating_hours?: WeeklyOperatingHours;
  emergency_contact?: EmergencyContact;
}

export interface PrimaryContact {
  name: string;
  phone: string;
  email: string;
  designation?: string;
}

export interface ClinicAddress {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  landmark?: string;
}

export interface WeeklyOperatingHours {
  monday?: DayOperatingHours;
  tuesday?: DayOperatingHours;
  wednesday?: DayOperatingHours;
  thursday?: DayOperatingHours;
  friday?: DayOperatingHours;
  saturday?: DayOperatingHours;
  sunday?: DayOperatingHours;
}

export interface DayOperatingHours {
  open: string;
  close: string;
  closed?: boolean;
}

export interface EmergencyContact {
  name: string;
  phone: string;
  relationship?: string;
}

export interface AppContext {
  source: 'app_store' | 'play_store' | 'web' | 'referral';
  referral_code?: string;
  marketing_campaign?: string;
  device_info?: DeviceInfo;
  onboarding_preferences?: OnboardingPreferences;
  urgency?: 'immediate' | 'within_week' | 'within_month' | 'exploring';
  budget_range?: 'free' | 'basic' | 'premium' | 'enterprise' | 'custom';
}

export interface DeviceInfo {
  platform: string;
  device_model?: string;
  os_version?: string;
  app_version?: string;
}

export interface OnboardingPreferences {
  preferred_contact_method?: 'email' | 'phone' | 'whatsapp';
  preferred_language?: string;
  demo_requested?: boolean;
  training_required?: boolean;
}

// === Response DTOs ===

export interface ClinicOwnerRegistrationResponse {
  success: boolean;
  user_id: string;
  application_id: string;
  tenant_id?: string;
  component_recommendations: ComponentRecommendation[];
  auto_approval_result: AutoApprovalResult;
  application_status?: 'draft' | 'pending_review' | 'approved' | 'active';
  approved_components?: string[];
  completion_percentage?: number;
  validation_errors?: string[];
  next_steps: string[];
  estimated_setup_time?: string;
}

export interface ComponentRecommendation {
  component: string;
  confidence: number;
  reason: string;
}

export interface AutoApprovalResult {
  eligible: boolean;
  risk_score: number;
  risk_factors: string[];
  reason?: string;
}

// === Clinic Types ===
export const CLINIC_TYPES = [
  'ayurveda',
  'homeopathy',
  'naturopathy',
  'physiotherapy',
  'allopathy',
  'general_practice',
  'multi_specialty',
  'other',
] as const;

export type ClinicType = typeof CLINIC_TYPES[number];

// === Service Types ===
export const SERVICE_TYPES = [
  'consultation',
  'surgery',
  'diagnostics',
  'pharmacy',
  'laboratory',
  'radiology',
  'therapy',
  'emergency',
  'inpatient',
  'outpatient',
] as const;

// === Pain Points ===
export const PAIN_POINTS = [
  'appointment_scheduling',
  'billing_invoicing',
  'inventory_management',
  'patient_records',
  'staff_management',
  'reporting_analytics',
  'communication',
  'compliance',
] as const;

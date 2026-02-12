/**
 * Templates DTOs
 * Data Transfer Objects for Document Templates API
 */

// ============================================
// TEMPLATE TYPES
// ============================================

export type TemplateType =
  | 'casesheet'
  | 'prescription'
  | 'treatment_sheet'
  | 'invoice'
  | 'consent_form'
  | 'follow_up_reminder'
  | 'appointment_confirmation';

export const TEMPLATE_METADATA: Record<TemplateType, {
  label: string;
  description: string;
  icon: string;
  color: string;
}> = {
  casesheet: {
    label: 'Case Sheet',
    description: 'Patient consultation and diagnosis records',
    icon: 'document-text-outline',
    color: '#2F6F4E',
  },
  prescription: {
    label: 'Prescription',
    description: 'Medication and treatment prescriptions',
    icon: 'medical-outline',
    color: '#3B82F6',
  },
  treatment_sheet: {
    label: 'Treatment Sheet',
    description: 'Daily treatment tracking records',
    icon: 'clipboard-outline',
    color: '#C28A4B',
  },
  invoice: {
    label: 'Invoice',
    description: 'Billing and payment invoices',
    icon: 'receipt-outline',
    color: '#10B981',
  },
  consent_form: {
    label: 'Consent Form',
    description: 'Treatment consent documents',
    icon: 'checkmark-circle-outline',
    color: '#8B5CF6',
  },
  follow_up_reminder: {
    label: 'Follow-up Reminder',
    description: 'Patient follow-up notification templates',
    icon: 'notifications-outline',
    color: '#F59E0B',
  },
  appointment_confirmation: {
    label: 'Appointment Confirmation',
    description: 'Booking confirmation messages',
    icon: 'calendar-outline',
    color: '#EC4899',
  },
};

// ============================================
// API RESPONSE TYPES
// ============================================

export interface TemplateResponse {
  id: string;
  tenant_id: string;
  template_type: TemplateType;
  name: string;
  description: string | null;
  content: string;
  variables: string[];
  is_default: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TemplatesListResponse {
  items: TemplateResponse[];
  total: number;
}

// ============================================
// API REQUEST TYPES
// ============================================

export interface TemplateCreate {
  template_type: TemplateType;
  name: string;
  description?: string;
  content: string;
  variables?: string[];
  is_default?: boolean;
}

export interface TemplateUpdate {
  name?: string;
  description?: string;
  content?: string;
  variables?: string[];
  is_default?: boolean;
  is_active?: boolean;
}

export interface PreviewMergeRequest {
  template_id: string;
  merge_data: Record<string, any>;
}

export interface PreviewMergeResponse {
  merged_content: string;
  missing_variables: string[];
}

// ============================================
// QUERY KEYS
// ============================================

export const templatesKeys = {
  all: ['templates'] as const,
  lists: () => [...templatesKeys.all, 'list'] as const,
  list: (tenantId: string, filters?: { type?: TemplateType }) =>
    [...templatesKeys.lists(), tenantId, filters] as const,
  detail: (tenantId: string, templateId: string) =>
    [...templatesKeys.all, tenantId, templateId] as const,
};

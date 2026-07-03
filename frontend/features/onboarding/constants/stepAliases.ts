/**
 * Shared service-catalogue step-code aliases.
 *
 * Source: backend onboarding-template audit (Req 4 AC-3).
 * All five codes below map semantically to the same Treatments & Services
 * management screen (/clinic-admin/settings/treatments).
 *
 * NOTE: If the backend audit surfaces additional aliases (e.g. `therapies`,
 * `clinic_services`, `specialities`), add them to this array before merging
 * Phase 1. Both StepDetailScreen and SetupWizardFlow import from here so the
 * two routing surfaces stay in sync automatically (Design Property 5).
 */
export const SERVICE_CATALOGUE_ALIASES = [
  'treatments_and_therapies',
  'services_and_specialities',
  'services',
  'services_offered',
  'treatment_services',
] as const;

export type ServiceCatalogueAlias = typeof SERVICE_CATALOGUE_ALIASES[number];

const STEP_DISPLAY_NAMES: Record<string, string> = {
  clinic_profile: 'Clinic Profile',
  operating_hours: 'Operating Hours',
  rooms_and_therapy_beds: 'Rooms & Therapy Beds',
  treatment_rooms: 'Rooms & Therapy Beds',
  staff_and_roles: 'Staff & Roles',
  staff_setup: 'Staff & Roles',
  staff_members: 'Staff & Roles',
  inventory_setup: 'Inventory Readiness',
  financials_and_tax: 'Billing Preferences',
  billing_setup: 'Billing Preferences',
  billing_settings: 'Billing Preferences',
  payment_setup: 'Payment Methods',
  payment_methods: 'Payment Methods',
  subscription_payment: 'Subscription Options',
  go_live_checklist: 'Ready to Start',
};

export const getPreparationStepDisplayName = (stepCode: string) => {
  if (SERVICE_CATALOGUE_ALIASES.includes(stepCode as ServiceCatalogueAlias)) {
    return 'Treatments & Therapies';
  }

  return STEP_DISPLAY_NAMES[stepCode] || stepCode.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

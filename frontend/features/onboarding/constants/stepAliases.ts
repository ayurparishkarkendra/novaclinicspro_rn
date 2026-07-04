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

type Translate = (key: string, params?: Record<string, string | number>) => string;

const STEP_DISPLAY_KEYS: Record<string, string> = {
  clinic_profile: 'onboarding.progressiveExperience.stepLabels.clinicProfile',
  operating_hours: 'onboarding.progressiveExperience.stepLabels.operatingHours',
  rooms_and_therapy_beds: 'onboarding.progressiveExperience.stepLabels.roomsAndTherapyBeds',
  treatment_rooms: 'onboarding.progressiveExperience.stepLabels.roomsAndTherapyBeds',
  staff_and_roles: 'onboarding.progressiveExperience.stepLabels.staffAndRoles',
  staff_setup: 'onboarding.progressiveExperience.stepLabels.staffAndRoles',
  staff_members: 'onboarding.progressiveExperience.stepLabels.staffAndRoles',
  inventory_setup: 'onboarding.progressiveExperience.stepLabels.inventoryReadiness',
  financials_and_tax: 'onboarding.progressiveExperience.stepLabels.billingPreferences',
  billing_setup: 'onboarding.progressiveExperience.stepLabels.billingPreferences',
  billing_settings: 'onboarding.progressiveExperience.stepLabels.billingPreferences',
  payment_setup: 'onboarding.progressiveExperience.stepLabels.paymentMethods',
  payment_methods: 'onboarding.progressiveExperience.stepLabels.paymentMethods',
  subscription_payment: 'onboarding.progressiveExperience.stepLabels.subscriptionOptions',
  go_live_checklist: 'onboarding.progressiveExperience.stepLabels.readyToStart',
};

export const getPreparationStepDisplayName = (stepCode: string, t: Translate) => {
  if (SERVICE_CATALOGUE_ALIASES.includes(stepCode as ServiceCatalogueAlias)) {
    return t('onboarding.progressiveExperience.stepLabels.treatmentsAndTherapies');
  }

  const key = STEP_DISPLAY_KEYS[stepCode];
  return key ? t(key) : stepCode.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

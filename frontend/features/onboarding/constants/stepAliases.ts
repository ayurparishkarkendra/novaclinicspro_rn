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

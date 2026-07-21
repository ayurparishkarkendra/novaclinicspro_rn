export type ClinicEntryPath = 'new_clinic' | 'bring_your_clinic';
export type ContactKind = 'email' | 'mobile';
export type VerificationState =
  | 'idle'
  | 'submitting'
  | 'pending'
  | 'verified'
  | 'approved'
  | 'selecting_tenant'
  | 'refreshing_session'
  | 'complete'
  | 'error';

export interface ClinicContactEvidence {
  kind: ContactKind;
  value: string;
  evidenceReference: string;
}

export interface NewClinicInput {
  clinicName: string;
  clinicTypeSpecialty: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  countryCode: string;
  contactKind: ContactKind;
  contactValue: string;
}

export interface BringClinicInput {
  ownershipReference: string;
  contactKind: ContactKind;
  contactValue: string;
}

export interface ContactVerificationResult {
  evidenceId: string;
  status: string;
  reference: string | null;
  referenceRecoverable: boolean;
}

export interface OwnershipStatusResult {
  status: string;
  version: number;
  allowedNextActions: string[];
}

export interface ClinicEntryResult {
  operationId: string;
  operation: string;
  replayed: boolean;
  tenantId: string;
  clinicDisplayName: string;
  associationState: string;
  effectiveTenantId: string | null;
  sessionRefreshRequired: boolean;
  nextHandoff: string;
  contractVersion: string;
}

export interface AuthorizedClinic {
  tenantId: string;
  clinicName: string;
  city?: string | null;
}

export interface OrganizationContext {
  organizationId: string;
  organizationName: string;
  authorizedClinics: AuthorizedClinic[];
  effectiveTenantId: string | null;
  selectionRequired: boolean;
}

export interface AuthOrganizationContext {
  memberships: OrganizationContext[];
  effectiveOrganizationId: string | null;
  effectiveTenantId: string | null;
  selectionRequired: boolean;
  sessionRefreshRequired: boolean;
}

export interface EffectiveTenantResult {
  organizationId: string;
  effectiveTenantId: string;
  selectionRequired: boolean;
  sessionRefreshRequired: boolean;
  contextVersion: string;
  metadataSynchronized: boolean;
}

export class ClinicEntryTransportError extends Error {
  constructor(
    readonly errorCode: string,
    readonly messageToken: string,
    readonly retryable: boolean,
    readonly fieldKey?: string
  ) {
    super(messageToken);
    this.name = 'ClinicEntryTransportError';
  }
}

export const clinicEntryErrorToken = (error: unknown): string =>
  error instanceof ClinicEntryTransportError
    ? error.messageToken
    : error instanceof Error && error.message === 'clinic_entry.organization_required'
      ? 'errors.clinicEntry.organizationRequired'
      : error instanceof Error && error.message === 'clinic_entry.session_refresh_failed'
        ? 'errors.clinicEntry.sessionRefreshFailed'
    : 'errors.clinicEntry.transientFailure';

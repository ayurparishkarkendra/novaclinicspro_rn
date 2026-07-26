/**
 * Clinical Workspace facts DTOs (T-FE-A.2, backend T-BE-A.2)
 *
 * One-to-one mirror of the backend's WorkspaceFactsResponse
 * (app/api/v1/schemas/clinical_workspace.py) — no renamed fields, no
 * flattened ABSENT/NOT_RECORDED/UNAVAILABLE/NOT_APPLICABLE/UNRESOLVED
 * distinctions, no locally-computed properties. This is the single
 * backend-owned facts aggregate for a Visit context (DP-15); the
 * frontend renders it, it does not derive clinical meaning from it.
 *
 * Decimal-typed backend fields (billed_amount/paid_amount/
 * outstanding_amount) are typed `string | null` here — Pydantic v2
 * serializes `Decimal` as a JSON string by default, the same convention
 * already used by consultationCompletion.dtos.ts's BillingSummary.
 */

export interface WorkspaceIdentity {
  tenant_id: string;
  client_id: string;
  episode_id: string;
  appointment_id: string;
  visit_id: string | null;
  requesting_tenant_user_id: string;
  context_valid: boolean;
}

export interface AppointmentPurposeFacts {
  value: string | null;
  recording_state: string;
}

export interface EpisodeFacts {
  exists: boolean;
  episode_id: string | null;
  status: string | null;
  recording_state: string;
}

export interface VisitFacts {
  exists: boolean;
  visit_id: string | null;
  outcome_type: string | null;
  outcome_notes: string | null;
  recording_state: string;
}

export interface AppointmentFacts {
  exists: boolean;
  appointment_id: string | null;
  status: string | null;
  recording_state: string;
}

export interface CaseSheetFacts {
  exists: boolean;
  casesheet_id: string | null;
  episode_id: string | null;
  document_status: string | null;
  signed: boolean;
  contribution_count: number | null;
  recording_state: string;
}

export interface PrescriptionFacts {
  exists: boolean;
  prescription_id: string | null;
  document_status: string | null;
  recording_state: string;
}

export interface TreatmentFacts {
  exists: boolean;
  treatment_sheet_id: string | null;
  is_order: boolean;
  lifecycle_status: string | null;
  lifecycle_unresolved: boolean;
  recording_state: string;
}

export interface BillingFacts {
  clinical_services_exist: boolean | null;
  invoice_exists: boolean | null;
  invoice_status: string | null;
  outstanding_state: string;
  recording_state: string;
  invoice_count: number | null;
  invoice_ids: string[];
  invoice_statuses: string[];
  billed_amount: string | null;
  paid_amount: string | null;
  outstanding_amount: string | null;
  currency: string | null;
}

export interface CapabilityState {
  code: string;
  entitled: boolean;
  tenant_preference: boolean;
  effective_available: boolean;
  effective_enabled: boolean;
  blocked_reason_code: string | null;
  unmet_dependencies: string[];
  source: string;
}

export interface CapabilityFacts {
  states: Record<string, CapabilityState>;
  recording_state: string;
}

export interface PermissionFacts {
  granted_codes: string[];
  recording_state: string;
}

/**
 * T-BE-A.6 (FR-VCC-3 signals 1+2: "last Visit date", "latest Visit
 * summary"). `outcome_notes` is the verified stored-narrative field the
 * backend reuses as the previous Visit's own summary — not a
 * frontend-invented field, and never renamed to imply generation.
 */
export interface PreviousVisitFacts {
  exists: boolean;
  visit_id: string | null;
  visit_date: string | null;
  outcome_notes: string | null;
  recording_state: string;
}

/** T-BE-A.6 (FR-VCC-3 signals 3+4: "active treatment sessions", "completed session count"). */
export interface SessionActivityFacts {
  active_session_count: number | null;
  completed_session_count: number | null;
  recording_state: string;
}

/** T-BE-A.6 (FR-VCC-3 signal 5: "pending clinical review") — the one backend-owned fact; never a raw lifecycle string. */
export interface PendingReviewFacts {
  pending: boolean | null;
  recording_state: string;
}

/**
 * T-BE-A.6 (FR-VCC-3). Signals 6/7/8 (Prescription/Episode/billing) are
 * NOT duplicated here — see `prescription`/`episode`/`billing` on
 * `WorkspaceFactsResponse` directly.
 */
export interface WhatChangedFacts {
  previous_visit: PreviousVisitFacts;
  sessions: SessionActivityFacts;
  pending_review: PendingReviewFacts;
}

export interface WorkspaceFactsResponse {
  identity: WorkspaceIdentity;
  purpose: AppointmentPurposeFacts;
  episode: EpisodeFacts;
  visit: VisitFacts;
  appointment: AppointmentFacts;
  casesheet: CaseSheetFacts;
  prescription: PrescriptionFacts;
  treatment: TreatmentFacts;
  billing: BillingFacts;
  capability: CapabilityFacts;
  permission: PermissionFacts;
  what_changed: WhatChangedFacts;
}

/**
 * T-FE-C.5 (T-BE-A.3/A.3a, FR-HIST-1/2) — one-to-one mirror of the
 * backend's `HistoryItemResponse`/`ClinicalHistoryResponse`/
 * `SessionCountsResponse` (`app/api/v1/schemas/clinical_workspace.py`).
 * Semantics only (AC-5): `id`, `encounter_type`, `appointment_ids`,
 * `plan_id` are identifiers/state codes, never presentation fields.
 *
 * `session_counts` is present for `treatment_plan` items only -- `null`
 * elsewhere means "not applicable to this encounter type", never "zero
 * sessions". `occurred_at` (T-BE-A.3a) is the sole authoritative
 * occurrence timestamp -- `null` only when the backend genuinely could
 * not resolve one; never fabricated or derived on the frontend.
 */
export interface SessionCountsResponse {
  completed: number;
  scheduled: number;
  not_completed: number;
  cancelled: number;
}

export interface HistoryItemResponse {
  id: string;
  encounter_type: string;
  appointment_ids: string[];
  plan_id: string | null;
  session_counts: SessionCountsResponse | null;
  occurred_at: string | null;
}

export interface ClinicalHistoryResponse {
  items: HistoryItemResponse[];
}

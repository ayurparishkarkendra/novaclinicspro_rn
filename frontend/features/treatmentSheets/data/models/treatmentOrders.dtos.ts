/**
 * Treatment Orders DTOs
 *
 * TreatmentOrderResponse is the NEW response shape returned by the treatment-order
 * endpoints. It is DISTINCT from TreatmentSheetResponse (which covers the
 * documentation lifecycle and is unchanged).
 *
 * Key separation:
 *   TreatmentSheetResponse  — documentation lifecycle (DRAFT → FINAL → SIGNED)
 *   TreatmentOrderResponse  — execution lifecycle    (DRAFT → ORDERED → SCHEDULED
 *                                                      → IN_PROGRESS → COMPLETED
 *                                                      → CANCELLED)
 */

// ============================================
// EXECUTION LIFECYCLE TYPES
// ============================================

/**
 * Execution state of the treatment order.
 * Driven entirely by the backend — never derive on the frontend.
 */
export type TreatmentOrderState =
  | 'DRAFT'
  | 'ORDERED'
  | 'SCHEDULED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';

/**
 * Scheduling completeness of the order.
 * null when is_order = false (sheet not yet sent to scheduling).
 */
export type SchedulingStatus =
  | 'PENDING_SCHEDULING'
  | 'PARTIALLY_SCHEDULED'
  | 'FULLY_SCHEDULED'
  | null;

/**
 * Documentation lifecycle status (aliased from the existing sheet status column).
 * Documentation is complete when value is 'FINAL' or 'SIGNED'.
 */
export type DocumentationStatus = 'DRAFT' | 'FINAL' | 'SIGNED';

/** Completion progress of the session rows. */
export type CompletionStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';

/** Row-level execution status. */
export type TreatmentRowStatus =
  | 'PENDING'
  | 'SCHEDULED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';

// ============================================
// ROW RESPONSE
// ============================================

/**
 * A single row in a TreatmentOrderResponse.
 * treatment_sheet_id lives on the parent — not repeated per row.
 */
export interface TreatmentRowOrderResponse {
  /** row_id — primary identifier for start/complete operations */
  id: string;
  day_number: number;
  status: TreatmentRowStatus;
  assigned_staff_id: string | null;
  /** ISO date string in tenant local time (YYYY-MM-DD) */
  scheduled_date: string | null;
  /** "HH:MM:SS" in tenant local time */
  scheduled_time: string | null;
  /** ISO datetime UTC — when the row was scheduled */
  scheduled_at: string | null;
  scheduled_by_staff_id: string | null;
  /** ISO datetime UTC — when the session was started */
  started_at: string | null;
  started_by_staff_id: string | null;
  /** ISO datetime UTC — when the session was completed */
  completed_at: string | null;
  completed_by_staff_id: string | null;
  treatment_name: string | null;
  medicines_text: string | null;
  instructions_text: string | null;
}

// ============================================
// MAIN RESPONSE
// ============================================

/** Full treatment order response — returned by all order endpoints. */
export interface TreatmentOrderResponse {
  id: string;
  tenant_id: string;
  client_id: string;
  case_sheet_id?: string | null;
  episode_id: string | null;
  /** Execution lifecycle state — read directly, never derive. */
  state: TreatmentOrderState;
  /** True once the sheet has been sent to scheduling via send-to-scheduling. */
  is_order: boolean;
  /** Scheduling completeness — null when is_order = false. */
  scheduling_status: SchedulingStatus;
  /** Documentation lifecycle — complete when 'FINAL' | 'SIGNED'. */
  documentation_status: DocumentationStatus;
  planned_sessions: number | null;
  frequency: string | null;
  preferred_time_window: string | null;
  order_notes: string | null;
  /** Therapy the doctor recommended (free text). Empty for legacy row-based sheets. */
  recommended_therapy?: string | null;
  /** ISO datetime UTC — when send-to-scheduling was called. */
  ordered_at: string | null;
  /**
   * Optimistic concurrency token.
   * All state-mutating endpoints require If-Match: <version> header.
   * On 409 VERSION_CONFLICT: refetch to get current_version, then re-trigger.
   */
  version: number;
  rows: TreatmentRowOrderResponse[];
  scheduled_count: number;
  completed_count: number;
  active_row_count: number;
  progress_percentage: number;
  completion_status: CompletionStatus;
  created_at: string | null;
  updated_at: string | null;
  // ── Denormalised display fields (returned by list endpoint) ──────────────
  client_name?: string | null;
  ordered_by_name?: string | null;
  duration_days?: number | null;
  /** Staff ID of the doctor who created/ordered the sheet */
  recorded_by_staff_id?: string | null;
}

// ============================================
// REQUEST DTOs
// ============================================

/** Body for POST /treatment-sheets/{sheet_id}/send-to-scheduling */
export interface SendToSchedulingRequest {
  order_notes?: string;
  planned_sessions?: number;
  frequency?: string;
  preferred_time_window?: string;
  recommended_therapy?: string;
}

/** Body for PATCH /treatment-sheets/{sheet_id}/rows/{row_id}/schedule */
export interface ScheduleRowRequest {
  assigned_staff_id: string;
  therapist_ids?: string[];
  room_id?: string | null;
  scheduled_date: string;
  scheduled_time?: string;
}

/** Single assignment in a bulk-schedule request */
export interface BulkScheduleAssignment {
  row_id: string;
  assigned_staff_id: string;
  therapist_ids?: string[];
  room_id?: string | null;
  scheduled_date: string;
  scheduled_time?: string;
}

/** Body for PATCH /treatment-sheets/{sheet_id}/rows/bulk-schedule */
export interface BulkScheduleRequest {
  assignments: BulkScheduleAssignment[];
}

// ============================================
// PAGINATED LIST RESPONSE
// ============================================

/** Paginated response from GET /treatment-sheets/clinic/{tenant_id}/treatment-orders */
export interface TreatmentOrdersListResponse {
  items: TreatmentOrderResponse[];
  total: number;
  skip: number;
  limit: number;
}

/** Query params for the admin worklist */
export interface TreatmentOrdersListParams {
  state?: TreatmentOrderState;
  scheduling_status?: SchedulingStatus;
  date_from?: string;
  date_to?: string;
  therapist_id?: string;
  overdue?: boolean;
  skip?: number;
  limit?: number;
}

// ============================================
// 409 CONFLICT RESPONSE
// ============================================

/** Shape of the 409 body returned by all state-mutating order endpoints. */
export interface VersionConflictError {
  error: 'VERSION_CONFLICT';
  current_version: number;
  retry: boolean;
  message: string;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/** True when documentation is complete (FINAL or SIGNED). */
export const isDocumentationComplete = (status: DocumentationStatus): boolean =>
  status === 'FINAL' || status === 'SIGNED';

/** Human-readable label for execution state. */
export const getOrderStateLabel = (state: TreatmentOrderState): string => {
  const labels: Record<TreatmentOrderState, string> = {
    DRAFT: 'Draft',
    ORDERED: 'Waiting for Scheduling',
    SCHEDULED: 'Scheduled',
    IN_PROGRESS: 'In Progress',
    COMPLETED: 'Completed',
    CANCELLED: 'Cancelled',
  };
  return labels[state] ?? state;
};

/** Color token for execution state. */
export const getOrderStateColor = (state: TreatmentOrderState): string => {
  const map: Record<TreatmentOrderState, string> = {
    DRAFT: '#6B7280',
    ORDERED: '#F59E0B',
    SCHEDULED: '#3B82F6',
    IN_PROGRESS: '#8B5CF6',
    COMPLETED: '#10B981',
    CANCELLED: '#EF4444',
  };
  return map[state] ?? '#6B7280';
};

/** Human-readable label for scheduling status. */
export const getSchedulingStatusLabel = (status: SchedulingStatus): string => {
  if (!status) return '—';
  const labels: Record<NonNullable<SchedulingStatus>, string> = {
    PENDING_SCHEDULING: 'Pending Scheduling',
    PARTIALLY_SCHEDULED: 'Partially Scheduled',
    FULLY_SCHEDULED: 'Fully Scheduled',
  };
  return labels[status];
};

/** Color token for scheduling status. */
export const getSchedulingStatusColor = (status: SchedulingStatus): string => {
  if (!status) return '#6B7280';
  const map: Record<NonNullable<SchedulingStatus>, string> = {
    PENDING_SCHEDULING: '#EF4444',
    PARTIALLY_SCHEDULED: '#F59E0B',
    FULLY_SCHEDULED: '#10B981',
  };
  return map[status];
};

/**
 * R3B · T-D.1 (FR-D2) — the single primary, business-meaningful status for a
 * TreatmentOrderResponse. `state` and `scheduling_status` are two different
 * dimensions of the same order's progress, never shown together (Doc 02
 * §12's own rule: "multiple derived implementation statuses should never be
 * presented simultaneously"). Presentation-only — does not touch how either
 * underlying field is computed, stored, or derived (N-1); it only decides
 * which single, most business-meaningful label to show.
 *
 * **Corrected (T-D.1, second pass):** the first version of this function
 * assumed `scheduling_status` is only ever non-null/relevant while
 * `state === 'ORDERED'` — that does not hold. Reading the backend's own
 * `_repair_order_scheduling_states_for_tenant` (`sqlalchemy_treatment_order_
 * repository.py`) confirms it only auto-reverts `state` back to `ORDERED`
 * when `scheduling_status` drifts to `PENDING_SCHEDULING` — it does NOT
 * revert on a drift to `PARTIALLY_SCHEDULED` (e.g., planned sessions
 * increase after a plan was already fully scheduled). So a genuine, live
 * case exists where `state` has already advanced past `ORDERED` (e.g.
 * `SCHEDULED`/`IN_PROGRESS`) while `scheduling_status` is incomplete again —
 * exactly the signal `orders.tsx`'s own pre-existing `showSchedChip` logic
 * was written to surface as a second pill. Collapsing to "one status" must
 * not silently discard this — it is the single most operationally
 * important fact in that scenario (more important than either "Scheduled"
 * or "Partially Scheduled" shown alone), so it is surfaced as its own
 * explicit, task-oriented label — **"Needs Re-scheduling"** — rather than
 * either raw value. One status ≠ less information; one status = the most
 * important business status.
 *
 * Rule, in order (matches `orders.tsx`'s own pre-existing `showSchedChip`
 * condition exactly — `scheduling_status && scheduling_status !==
 * 'PENDING_SCHEDULING' && state !== 'ORDERED'` — rather than a broader
 * guess): only `PARTIALLY_SCHEDULED` triggers the drift label.
 * `PENDING_SCHEDULING` is deliberately excluded — the backend's own repair
 * job specifically targets and reverts *that* combination back to `ORDERED`
 * (`scheduling_status == "PENDING_SCHEDULING" and sheet.state ==
 * "SCHEDULED"`), treating it as a transient anomaly to correct, not a
 * stable state worth surfacing — unlike `PARTIALLY_SCHEDULED` drift, which
 * has no such reversion and is the case `orders.tsx`'s own logic was
 * written to catch.
 * 1. `state !== 'ORDERED'` (already past first-pass ordering) AND
 *    `scheduling_status === 'PARTIALLY_SCHEDULED'` → **"Needs
 *    Re-scheduling"** (drift case).
 * 2. `state === 'ORDERED'` AND a `scheduling_status` exists → show it
 *    (`getSchedulingStatusLabel`) — more precise than the generic "Waiting
 *    for Scheduling" state label during first-pass scheduling.
 * 3. Otherwise → the order's own `state` (`getOrderStateLabel`) — covers
 *    `DRAFT`, terminal states, and the fully-resolved case (`state`
 *    advanced with `scheduling_status` already `FULLY_SCHEDULED` — genuinely
 *    redundant with the state label, unlike the incomplete-scheduling case
 *    above).
 */
export const getPrimaryOrderStatusLabel = (order: Pick<TreatmentOrderResponse, 'state' | 'is_order' | 'scheduling_status'>): string => {
  if (order.is_order && order.state !== 'ORDERED' && order.scheduling_status === 'PARTIALLY_SCHEDULED') {
    return 'Needs Re-scheduling';
  }
  if (order.is_order && order.state === 'ORDERED' && order.scheduling_status) {
    return getSchedulingStatusLabel(order.scheduling_status);
  }
  return getOrderStateLabel(order.state);
};

/** Color token matching whichever value `getPrimaryOrderStatusLabel` chose — "Needs Re-scheduling" uses the same urgent/attention color as `PENDING_SCHEDULING`. */
export const getPrimaryOrderStatusColor = (order: Pick<TreatmentOrderResponse, 'state' | 'is_order' | 'scheduling_status'>): string => {
  if (order.is_order && order.state !== 'ORDERED' && order.scheduling_status === 'PARTIALLY_SCHEDULED') {
    return getSchedulingStatusColor('PENDING_SCHEDULING');
  }
  if (order.is_order && order.state === 'ORDERED' && order.scheduling_status) {
    return getSchedulingStatusColor(order.scheduling_status);
  }
  return getOrderStateColor(order.state);
};

/**
 * Returns the rows from a TreatmentOrderResponse that have a scheduled_date,
 * sorted ascending — used for the patient schedule modal (Phase 1).
 */
export const getScheduledRows = (order: TreatmentOrderResponse): TreatmentRowOrderResponse[] =>
  order.rows
    .filter((r) => r.scheduled_date !== null)
    .sort((a, b) => (a.scheduled_date! > b.scheduled_date! ? 1 : -1));

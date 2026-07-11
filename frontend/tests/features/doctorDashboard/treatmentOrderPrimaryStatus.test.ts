import {
  getPrimaryOrderStatusLabel,
  getPrimaryOrderStatusColor,
  getLifecycleStatusLabel,
  getLifecycleStatusColor,
} from '../../../features/treatmentSheets/data/models/treatmentOrders.dtos';

/**
 * Phase 4 (R4) · T-E.1 (ADR-R4-02, FR-B4) — behavioral tests for
 * `getPrimaryOrderStatusLabel`/`getPrimaryOrderStatusColor`, re-pointed from
 * re-deriving a status out of raw `state`/`scheduling_status` (R3B · T-D.1)
 * to simply reading the backend's own resolved `lifecycle_status_label`
 * (T-C.2). This file replaces the old R3B test suite entirely — the old
 * suite asserted equivalence to `getOrderStateLabel`/`getSchedulingStatusLabel`
 * combinations, which no longer applies now that the frontend does not
 * recreate that derivation at all.
 */

describe('getPrimaryOrderStatusLabel / getPrimaryOrderStatusColor (R4 · T-E.1 — re-pointed to backend lifecycle_status_label)', () => {
  it('shows the backend label verbatim — no re-derivation from state/scheduling_status', () => {
    const order = { lifecycle_status_label: 'Needs Scheduling', lifecycle_status: 'needs_scheduling' as const };
    expect(getPrimaryOrderStatusLabel(order)).toBe('Needs Scheduling');
  });

  it('does not read state/scheduling_status at all -- passing them with no lifecycle_status_label produces the fallback, proving they are ignored', () => {
    // Raw state/scheduling_status are intentionally NOT part of the Pick
    // type anymore -- cast as `any` to exercise a real-world response shape
    // (which legitimately also carries these unrelated fields) rather than
    // fighting the type checker over properties the function never reads.
    const order = { state: 'SCHEDULED', scheduling_status: 'PARTIALLY_SCHEDULED', is_order: true } as any;
    expect(getPrimaryOrderStatusLabel(order)).toBe('Status Pending Review');
  });

  it.each([
    ['needs_scheduling', 'Needs Scheduling'],
    ['scheduling_denied', 'Scheduling Denied'],
    ['scheduled_awaiting_treatment_sheet', 'Scheduled - Awaiting Treatment Sheet'],
    ['treatment_sheet_draft', 'Treatment Sheet Draft'],
    ['released_to_therapist', 'Released to Therapist'],
    ['in_therapy', 'In Therapy'],
    ['needs_clinical_review', 'Needs Clinical Review'],
    ['under_clinical_review', 'Under Clinical Review'],
    ['treatment_complete', 'Treatment Complete'],
  ] as const)('%s -> label passes through, resolves a real (non-fallback) color', (status, label) => {
    const order = { lifecycle_status_label: label, lifecycle_status: status };
    expect(getPrimaryOrderStatusLabel(order)).toBe(label);
    expect(getPrimaryOrderStatusColor(order)).not.toBe('#6B7280'); // not the "unknown" fallback gray
  });

  it.each([
    ['recommended', 'Recommended'],
    ['scheduling_on_hold', 'Scheduling On Hold'],
  ] as const)('%s: label passes through -- its color is legitimately the same neutral gray as the fallback (a real, deliberate lookup entry, not a missed one)', (status, label) => {
    const order = { lifecycle_status_label: label, lifecycle_status: status };
    expect(getPrimaryOrderStatusLabel(order)).toBe(label);
    expect(getPrimaryOrderStatusColor(order)).toBe('#6B7280');
  });

  it('lifecycle_status_unresolved shows an honest "Status Pending Review", never a guessed status', () => {
    const order = { lifecycle_status_label: null, lifecycle_status_unresolved: true };
    expect(getPrimaryOrderStatusLabel(order)).toBe('Status Pending Review');
    expect(getPrimaryOrderStatusColor(order)).toBe('#6B7280');
  });

  it('missing lifecycle_status_label (e.g. an older cached response) falls back safely instead of crashing', () => {
    const order = {};
    expect(getPrimaryOrderStatusLabel(order)).toBe('Status Pending Review');
    expect(getPrimaryOrderStatusColor(order)).toBe('#6B7280');
  });

  it('always returns exactly one label -- never a concatenation of two statuses', () => {
    const order = { lifecycle_status_label: 'Needs Scheduling', lifecycle_status: 'needs_scheduling' as const };
    const label = getPrimaryOrderStatusLabel(order);
    expect(label).not.toContain('·');
  });
});

describe('getLifecycleStatusLabel / getLifecycleStatusColor (standalone helpers, T-E.1)', () => {
  it('pass through the backend label/color for a resolved status', () => {
    expect(getLifecycleStatusLabel('In Therapy')).toBe('In Therapy');
    expect(getLifecycleStatusColor('in_therapy')).not.toBe('#6B7280');
  });

  it('unresolved always wins over a present label/status', () => {
    expect(getLifecycleStatusLabel('In Therapy', true)).toBe('Status Pending Review');
    expect(getLifecycleStatusColor('in_therapy', true)).toBe('#6B7280');
  });

  it('null/undefined status falls back safely', () => {
    expect(getLifecycleStatusLabel(null)).toBe('Status Pending Review');
    expect(getLifecycleStatusLabel(undefined)).toBe('Status Pending Review');
    expect(getLifecycleStatusColor(null)).toBe('#6B7280');
    expect(getLifecycleStatusColor(undefined)).toBe('#6B7280');
  });
});

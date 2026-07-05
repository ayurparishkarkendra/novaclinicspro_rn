import {
  getPrimaryOrderStatusLabel,
  getPrimaryOrderStatusColor,
  getOrderStateLabel,
  getOrderStateColor,
  getSchedulingStatusLabel,
  getSchedulingStatusColor,
} from '../../../features/treatmentSheets/data/models/treatmentOrders.dtos';

/**
 * R3B · T-D.1 (FR-D2) — behavioral tests for `getPrimaryOrderStatusLabel`/
 * `getPrimaryOrderStatusColor`, the single-status resolution
 * `TreatmentSheetInfoCard.tsx` now uses instead of concatenating
 * `state` + `scheduling_status`. Confirms the actual branch outcomes, not
 * just that the function exists (that structural check lives in
 * `taskLanguageAndStatusPresentation.characterization.test.ts`).
 *
 * UPDATE (T-D.1, second pass): the function's first version silently
 * discarded a real "needs re-scheduling" signal (`scheduling_status ===
 * 'PARTIALLY_SCHEDULED'` while `state` has already advanced past
 * `ORDERED` — a genuine drift case the backend's own repair job does NOT
 * revert). Added the regression test below, proving the function now
 * returns "Needs Re-scheduling" in exactly the scenario `orders.tsx`'s own
 * pre-existing `showSchedChip` logic already showed as a second pill for.
 */

describe('getPrimaryOrderStatusLabel / getPrimaryOrderStatusColor (R3B · T-D.1)', () => {
  it('DRAFT: shows the order state label (no scheduling concept yet)', () => {
    const order = { state: 'DRAFT' as const, is_order: false, scheduling_status: null };
    expect(getPrimaryOrderStatusLabel(order)).toBe(getOrderStateLabel('DRAFT'));
    expect(getPrimaryOrderStatusColor(order)).toBe(getOrderStateColor('DRAFT'));
  });

  it('ORDERED + is_order + a scheduling_status: the scheduling label wins — more precise than the generic order-state label', () => {
    const order = { state: 'ORDERED' as const, is_order: true, scheduling_status: 'PARTIALLY_SCHEDULED' as const };
    expect(getPrimaryOrderStatusLabel(order)).toBe('Partially Scheduled');
    expect(getPrimaryOrderStatusLabel(order)).not.toBe(getOrderStateLabel('ORDERED'));
    expect(getPrimaryOrderStatusColor(order)).toBe(getSchedulingStatusColor('PARTIALLY_SCHEDULED'));
  });

  it('ORDERED but NOT yet is_order (no scheduling_status): falls back to the order state label', () => {
    const order = { state: 'ORDERED' as const, is_order: false, scheduling_status: null };
    expect(getPrimaryOrderStatusLabel(order)).toBe(getOrderStateLabel('ORDERED'));
    expect(getPrimaryOrderStatusColor(order)).toBe(getOrderStateColor('ORDERED'));
  });

  it('SCHEDULED with scheduling_status FULLY_SCHEDULED (the normal, non-drift case): the order state label wins — genuinely redundant, not a signal worth surfacing', () => {
    const order = { state: 'SCHEDULED' as const, is_order: true, scheduling_status: 'FULLY_SCHEDULED' as const };
    expect(getPrimaryOrderStatusLabel(order)).toBe(getOrderStateLabel('SCHEDULED'));
    expect(getPrimaryOrderStatusLabel(order)).not.toBe(getSchedulingStatusLabel('FULLY_SCHEDULED'));
  });

  it('REGRESSION (T-D.1, second pass): SCHEDULED/IN_PROGRESS with scheduling_status PARTIALLY_SCHEDULED (the drift case orders.tsx\'s own showSchedChip already surfaced as a second pill) — returns "Needs Re-scheduling", not the state label alone', () => {
    (['SCHEDULED', 'IN_PROGRESS'] as const).forEach((state) => {
      const order = { state, is_order: true, scheduling_status: 'PARTIALLY_SCHEDULED' as const };
      expect(getPrimaryOrderStatusLabel(order)).toBe('Needs Re-scheduling');
      expect(getPrimaryOrderStatusLabel(order)).not.toBe(getOrderStateLabel(state));
      expect(getPrimaryOrderStatusColor(order)).toBe(getSchedulingStatusColor('PENDING_SCHEDULING'));
    });
  });

  it('the drift signal is specific to PARTIALLY_SCHEDULED — PENDING_SCHEDULING while non-ORDERED is NOT treated as "needs re-scheduling" (matches orders.tsx\'s own showSchedChip condition exactly; the backend\'s own repair job actively reverts that specific combination)', () => {
    const order = { state: 'SCHEDULED' as const, is_order: true, scheduling_status: 'PENDING_SCHEDULING' as const };
    expect(getPrimaryOrderStatusLabel(order)).not.toBe('Needs Re-scheduling');
    expect(getPrimaryOrderStatusLabel(order)).toBe(getOrderStateLabel('SCHEDULED'));
  });

  it('IN_PROGRESS / COMPLETED / CANCELLED: the order state label always wins', () => {
    (['IN_PROGRESS', 'COMPLETED', 'CANCELLED'] as const).forEach((state) => {
      const order = { state, is_order: true, scheduling_status: null };
      expect(getPrimaryOrderStatusLabel(order)).toBe(getOrderStateLabel(state));
    });
  });

  it('always returns exactly one label — never a concatenation of both', () => {
    const order = { state: 'ORDERED' as const, is_order: true, scheduling_status: 'PENDING_SCHEDULING' as const };
    const label = getPrimaryOrderStatusLabel(order);
    expect(label).not.toContain('·');
    expect(label).not.toContain(getOrderStateLabel('ORDERED'));
  });
});

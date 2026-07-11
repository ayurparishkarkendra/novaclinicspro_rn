/**
 * Phase 4 (R4) · T-F.2c (ADR-R4-03) — TreatmentScheduleSummary's outer
 * visibility gate in TreatmentSheetDetailContent.tsx no longer reads
 * `treatmentSheet.status === 'DRAFT'` (a backward-compat document field,
 * always DRAFT in practice, ADR-R4-03). It now reads `isInSchedulingPhase`,
 * built purely from the resolver's own `lifecycle_status` -- the widget's
 * real job (offer "Schedule Appointments" / show "View All Appointments")
 * is only relevant before the Doctor releases the sheet to the Therapist.
 *
 * Verifies:
 *   1. Visibility never changes based on TreatmentSheet.status (DRAFT/
 *      SIGNED/FINAL) -- the function doesn't even take that field as input.
 *   2. The correct lifecycle_status values control visibility: true for the
 *      5 pre-release statuses, false for every post-release/terminal status
 *      and for the unresolved edge case.
 *   3/4. Neither Doctor treatment preparation nor Admin scheduling
 *      visibility depend on role -- this gate has no role/mode input at
 *      all (unchanged from before), so both continue to see the widget
 *      during the scheduling phase exactly as before.
 */
import fs from 'fs';
import path from 'path';
import { isInSchedulingPhase } from '../../../features/treatmentSheets/presentation/pages/detail/TreatmentSheetDetailContent';
import type { TreatmentLifecycleStatus, TreatmentOrderResponse } from '../../../features/treatmentSheets/data/models/treatmentOrders.dtos';

const orderWith = (
  lifecycle_status: TreatmentLifecycleStatus,
  overrides: Partial<TreatmentOrderResponse> = {}
): TreatmentOrderResponse =>
  ({
    id: 'order-1',
    lifecycle_status,
    lifecycle_status_label: 'irrelevant',
    lifecycle_status_unresolved: false,
    ...overrides,
  }) as unknown as TreatmentOrderResponse;

describe('TreatmentScheduleSummary visibility gate (R4 · T-F.2c)', () => {
  it('1. is unaffected by TreatmentSheet.status entirely -- the function has no such parameter', () => {
    // A DRAFT/FINAL/SIGNED sheet.status would previously flip this gate;
    // now the gate only accepts a treatmentOrder, proving the document
    // field cannot influence the result at all.
    const order = orderWith('treatment_sheet_draft');
    expect(isInSchedulingPhase(order)).toBe(true);
    // No treatmentSheet argument exists to pass DRAFT/FINAL/SIGNED into --
    // confirmed by the function's own arity.
    expect(isInSchedulingPhase.length).toBe(1);
  });

  it.each([
    ['recommended', true],
    ['needs_scheduling', true],
    ['scheduling_on_hold', true],
    ['scheduled_awaiting_treatment_sheet', true],
    ['treatment_sheet_draft', true],
    ['released_to_therapist', false],
    ['in_therapy', false],
    ['needs_clinical_review', false],
    ['under_clinical_review', false],
    ['treatment_complete', false],
    ['scheduling_denied', false],
  ] as const)('2. lifecycle_status=%s -> visible=%s', (status, expected) => {
    expect(isInSchedulingPhase(orderWith(status))).toBe(expected);
  });

  it('2. lifecycle_status_unresolved (still-open T-B.2 edge case) hides the widget rather than guessing', () => {
    const order = orderWith('in_therapy', { lifecycle_status_unresolved: true, lifecycle_status: null });
    expect(isInSchedulingPhase(order)).toBe(false);
  });

  it('2. no order at all (still loading) hides the widget', () => {
    expect(isInSchedulingPhase(undefined)).toBe(false);
  });

  it('3/4. the gate takes no role/mode parameter -- Doctor treatment preparation and Admin scheduling see identical visibility during the scheduling phase, exactly as before this change', () => {
    expect(isInSchedulingPhase.length).toBe(1);
    const order = orderWith('scheduled_awaiting_treatment_sheet');
    // Same call, no role input possible -- both roles get the same answer.
    expect(isInSchedulingPhase(order)).toBe(true);
  });

  it('source confirms the gate is wired into the render and no live JSX still reads treatmentSheet.status for this widget', () => {
    const source = fs.readFileSync(
      path.resolve(__dirname, '../../../features/treatmentSheets/presentation/pages/detail/TreatmentSheetDetailContent.tsx'),
      'utf8',
    );
    expect(source).toMatch(/\{isInSchedulingPhase\(treatmentOrder\)\s*\?/);
    expect(source).not.toMatch(/treatmentSheet\.status\s*===\s*['"]DRAFT['"]\s*\?/);
  });
});

/**
 * Phase 4 (R4) · T-E.1 (ADR-R4-02) — TreatmentLifecycleActions.tsx's
 * `OrderStateAction` re-pointed from raw `order.state` branching to the
 * backend's own `lifecycle_status`. Verifies:
 *   - exactly one lifecycle status shown (one pill/button, not raw state
 *     text anywhere)
 *   - Scheduled (`needs_scheduling`)/On Hold (`scheduling_on_hold`)/Denied
 *     (`scheduling_denied`) display correctly
 *   - Released/In Therapy/Review/Complete display correctly
 *   - the "Send to Scheduling"/"Send Schedule to Patient" operational
 *     actions are unaffected (still gated on raw state -- these are
 *     preserved operational controls, not lifecycle display, per the
 *     user's own directive)
 */
import React from 'react';
import { render } from '@testing-library/react-native';

import { TreatmentLifecycleActions } from '../../../features/treatmentSheets/presentation/pages/detail/TreatmentLifecycleActions';
import type { TreatmentOrderResponse } from '../../../features/treatmentSheets/data/models/treatmentOrders.dtos';

jest.mock('../../../core/theme/useClinicTheme', () => ({
  useClinicTheme: () => ({
    colors: {
      primary: { default: '#2563EB', onPrimary: '#FFFFFF' },
      background: { elevated: '#FFFFFF' },
      border: { subtle: '#F3F4F6' },
      text: { secondary: '#6B7280' },
      feedback: { success: '#10B981', warning: '#F59E0B', error: '#EF4444', info: '#3B82F6' },
    },
  }),
}));

const baseOrder = {
  id: 'order-1',
  tenant_id: 'tenant-1',
  client_id: 'client-1',
  episode_id: null,
  is_order: true,
  documentation_status: 'DRAFT',
  version: 1,
  rows: [],
  scheduled_count: 0,
  completed_count: 0,
  active_row_count: 0,
  progress_percentage: 0,
  completion_status: 'NOT_STARTED',
  created_at: null,
  updated_at: null,
} as unknown as TreatmentOrderResponse;

const defaultProps = {
  isOrderLoading: false,
  sendToScheduling: { status: 'idle', mutate: jest.fn(), errorMessage: null } as any,
  treatmentSheetId: 'sheet-1',
  orderVersion: 1,
  scheduleSent: false,
  pauseMutation: {},
  cancelMutation: {},
  onShowPatientSchedule: jest.fn(),
  onPause: jest.fn(),
  onResume: jest.fn(),
  onCancel: jest.fn(),
  // Phase 4 (R4) · T-E.5 (ADR-R4-06) -- isDoctor=true here since this file's
  // own tests characterize the Doctor-visible OrderStateAction nudge/pill;
  // the Release-button-specific behavior is covered by its own test file
  // (treatmentReleaseAction.test.tsx).
  isDoctor: true,
  onRelease: jest.fn(),
  releaseMutation: {},
};

describe('TreatmentLifecycleActions.OrderStateAction (R4 · T-E.1 — re-pointed to lifecycle_status)', () => {
  it.each([
    ['needs_scheduling', 'Waiting for Scheduling'],
    ['scheduling_on_hold', 'Waiting for Scheduling'],
  ] as const)('%s -> "%s" (Scheduled/On Hold display correctly, matches old ORDERED behavior)', (lifecycleStatus, expectedText) => {
    const order = { ...baseOrder, state: 'ORDERED', scheduling_status: 'PENDING_SCHEDULING', lifecycle_status: lifecycleStatus, lifecycle_status_label: expectedText } as unknown as TreatmentOrderResponse;
    const utils = render(
      <TreatmentLifecycleActions {...defaultProps} treatmentOrder={order} />
    );
    expect(utils.getByText(expectedText)).toBeTruthy();
  });

  it('scheduling_denied -> "Cancelled" (Denied displays correctly)', () => {
    const order = { ...baseOrder, state: 'CANCELLED', scheduling_status: null, lifecycle_status: 'scheduling_denied', lifecycle_status_label: 'Scheduling Denied' } as unknown as TreatmentOrderResponse;
    const utils = render(<TreatmentLifecycleActions {...defaultProps} treatmentOrder={order} />);
    expect(utils.getByText('Cancelled')).toBeTruthy();
  });

  // Phase 4 (R4) · T-E.5 (ADR-R4-06): scheduled_awaiting_treatment_sheet and
  // treatment_sheet_draft moved OUT of this nudge-only map -- the Doctor's
  // real [Release Treatment Sheet] action now occupies this slot for those
  // two statuses instead. Covered by treatmentReleaseAction.test.tsx, not
  // duplicated here.
  it.each([
    ['released_to_therapist', 'Continue Documentation'],
    ['in_therapy', 'Continue Documentation'],
    ['needs_clinical_review', 'Continue Documentation'],
    ['under_clinical_review', 'Continue Documentation'],
  ] as const)('%s -> "%s" (Released/In Therapy/Review display correctly)', (lifecycleStatus, expectedText) => {
    const order = { ...baseOrder, state: 'IN_PROGRESS', scheduling_status: 'FULLY_SCHEDULED', lifecycle_status: lifecycleStatus, lifecycle_status_label: 'irrelevant' } as unknown as TreatmentOrderResponse;
    const utils = render(<TreatmentLifecycleActions {...defaultProps} treatmentOrder={order} />);
    expect(utils.getByText(expectedText)).toBeTruthy();
  });

  it('treatment_complete -> "View Completed Plan" (Complete displays correctly)', () => {
    const order = { ...baseOrder, state: 'COMPLETED', scheduling_status: 'FULLY_SCHEDULED', lifecycle_status: 'treatment_complete', lifecycle_status_label: 'Treatment Complete' } as unknown as TreatmentOrderResponse;
    const utils = render(<TreatmentLifecycleActions {...defaultProps} treatmentOrder={order} />);
    expect(utils.getByText('View Completed Plan')).toBeTruthy();
  });

  it('lifecycle_status_unresolved shows an honest fallback, never a guessed state', () => {
    const order = { ...baseOrder, state: 'IN_PROGRESS', scheduling_status: 'FULLY_SCHEDULED', lifecycle_status: null, lifecycle_status_unresolved: true } as unknown as TreatmentOrderResponse;
    const utils = render(<TreatmentLifecycleActions {...defaultProps} treatmentOrder={order} />);
    expect(utils.getByText('Status Pending Review')).toBeTruthy();
  });

  it('exactly one lifecycle status element is shown -- no raw state text rendered alongside it', () => {
    const order = { ...baseOrder, state: 'IN_PROGRESS', scheduling_status: 'FULLY_SCHEDULED', lifecycle_status: 'in_therapy', lifecycle_status_label: 'In Therapy' } as unknown as TreatmentOrderResponse;
    const utils = render(<TreatmentLifecycleActions {...defaultProps} treatmentOrder={order} />);
    expect(utils.queryAllByText('Continue Documentation')).toHaveLength(1);
    expect(utils.queryByText('IN_PROGRESS')).toBeNull();
    expect(utils.queryByText('In Therapy')).toBeNull(); // this component shows the action nudge, not the raw label text
  });

  it('preserves the "Send Schedule to Patient" operational control unaffected -- still gated on raw state, not lifecycle display', () => {
    const order = { ...baseOrder, state: 'SCHEDULED', scheduling_status: 'FULLY_SCHEDULED', lifecycle_status: 'scheduled_awaiting_treatment_sheet', lifecycle_status_label: 'Scheduled - Awaiting Treatment Sheet' } as unknown as TreatmentOrderResponse;
    const utils = render(<TreatmentLifecycleActions {...defaultProps} treatmentOrder={order} />);
    expect(utils.getByText('Send Schedule to Patient')).toBeTruthy();
  });
});

/**
 * Phase 4 (R4) · T-E.5 (ADR-R4-06) — [Release Treatment Sheet] action on
 * TreatmentLifecycleActions.tsx's OrderStateAction slot. Verifies:
 *   - visible to the Doctor (isDoctor=true) for scheduled_awaiting_treatment_
 *     sheet/treatment_sheet_draft, replacing the old nudge in that slot.
 *   - not visible at all (not merely disabled) for Admin (isDoctor=false).
 *   - release works with empty rows (no rows-related gate exists in the UI
 *     at all -- confirmed by never passing/reading a rows prop here).
 *   - pressing Release, after confirming the dialog, calls onRelease.
 */
import React from 'react';
import { Alert } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';

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

jest.spyOn(Alert, 'alert');

const baseOrder = {
  id: 'order-1',
  tenant_id: 'tenant-1',
  client_id: 'client-1',
  episode_id: null,
  is_order: true,
  documentation_status: 'DRAFT',
  version: 1,
  rows: [], // empty rows -- confirms release is offered with no rows at all
  scheduled_count: 0,
  completed_count: 0,
  active_row_count: 0,
  progress_percentage: 0,
  completion_status: 'NOT_STARTED',
  created_at: null,
  updated_at: null,
  state: 'SCHEDULED',
  scheduling_status: 'FULLY_SCHEDULED',
} as unknown as TreatmentOrderResponse;

const makeProps = (overrides: { isDoctor: boolean; onRelease?: jest.Mock }) => ({
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
  onRelease: jest.fn(),
  releaseMutation: {},
  ...overrides,
});

describe('[Release Treatment Sheet] action (R4 · T-E.5)', () => {
  beforeEach(() => {
    (Alert.alert as jest.Mock).mockClear();
  });

  it.each(['scheduled_awaiting_treatment_sheet', 'treatment_sheet_draft'] as const)(
    'visible to the Doctor for %s, even with zero rows (empty rows do not block release)',
    (lifecycleStatus) => {
      const order = { ...baseOrder, lifecycle_status: lifecycleStatus, lifecycle_status_label: 'irrelevant' } as unknown as TreatmentOrderResponse;
      const utils = render(<TreatmentLifecycleActions {...makeProps({ isDoctor: true })} treatmentOrder={order} />);
      expect(utils.getByText('Release Treatment Sheet')).toBeTruthy();
    }
  );

  it.each(['scheduled_awaiting_treatment_sheet', 'treatment_sheet_draft'] as const)(
    'NOT visible for Admin (isDoctor=false) -- not merely disabled, not rendered at all for %s',
    (lifecycleStatus) => {
      const order = { ...baseOrder, lifecycle_status: lifecycleStatus, lifecycle_status_label: 'irrelevant' } as unknown as TreatmentOrderResponse;
      const utils = render(<TreatmentLifecycleActions {...makeProps({ isDoctor: false })} treatmentOrder={order} />);
      expect(utils.queryByText('Release Treatment Sheet')).toBeNull();
    }
  );

  it('pressing Release opens a confirm dialog; confirming calls onRelease', () => {
    const onRelease = jest.fn();
    const order = { ...baseOrder, lifecycle_status: 'treatment_sheet_draft', lifecycle_status_label: 'Treatment Sheet Draft' } as unknown as TreatmentOrderResponse;
    const utils = render(<TreatmentLifecycleActions {...makeProps({ isDoctor: true, onRelease })} treatmentOrder={order} />);

    fireEvent.press(utils.getByText('Release Treatment Sheet'));
    expect(Alert.alert).toHaveBeenCalled();
    const [, , buttons] = (Alert.alert as jest.Mock).mock.calls[0];
    const confirmButton = buttons.find((b: any) => b.text === 'Release');
    confirmButton.onPress();

    expect(onRelease).toHaveBeenCalledTimes(1);
  });

  it('released_to_therapist no longer shows the Release button -- already released, this is a one-time whole-sheet action', () => {
    const order = { ...baseOrder, lifecycle_status: 'released_to_therapist', lifecycle_status_label: 'Released to Therapist' } as unknown as TreatmentOrderResponse;
    const utils = render(<TreatmentLifecycleActions {...makeProps({ isDoctor: true })} treatmentOrder={order} />);
    expect(utils.queryByText('Release Treatment Sheet')).toBeNull();
  });
});

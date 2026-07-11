/**
 * Phase 4 (R4) · T-E.4 (ADR-R4-06) — TreatmentRowEditor.tsx's row-content
 * editability, re-pointed from document status (isEditable(treatmentSheet.
 * status)) to the new role/row-completion-based ownership rule:
 *   - Doctor: may edit non-completed (future) rows.
 *   - Admin/Therapist: canEdit is computed upstream as `isDoctor` (false for
 *     both), so clinical content is never editable for them regardless of
 *     row status.
 *   - Completed rows are never editable, even for the Doctor, regardless of
 *     the sheet-level canEdit permission.
 */
import React from 'react';
import { render } from '@testing-library/react-native';

import { TreatmentRowEditor } from '../../../features/treatmentSheets/presentation/pages/detail/TreatmentRowEditor';
import type { RowFormData } from '../../../features/treatmentSheets/presentation/pages/detail/types';
import type { TreatmentOrderResponse } from '../../../features/treatmentSheets/data/models/treatmentOrders.dtos';

jest.mock('../../../core/theme/useClinicTheme', () => ({
  useClinicTheme: () => ({
    colors: {
      primary: { default: '#2563EB' },
      background: { default: '#FFFFFF', elevated: '#FFFFFF' },
      border: { subtle: '#F3F4F6' },
      text: { secondary: '#6B7280', primary: '#111827', disabled: '#9CA3AF' },
      feedback: { success: '#10B981', info: '#3B82F6' },
    },
  }),
}));

const baseRow: RowFormData = {
  id: 'row-1',
  day_number: 1,
  session_date: null,
  session_id: null,
  scheduled_time: null,
  therapist_id: null,
  treatment_name: 'Abhyanga',
  medicines_text: 'Herbal oil',
  instructions_text: 'Rest after',
  isSaving: false,
  isEditing: true, // editing mode ON so the field's `editable` prop is the thing under test
};

const defaultProps = {
  index: 0,
  hasBeenSavedOnce: true,
  onUpdateField: jest.fn(),
  onUpdateSingleRow: jest.fn(),
  onToggleEditMode: jest.fn(),
  onCopyFromAbove: jest.fn(),
  onScheduleRow: jest.fn(),
};

function makeOrder(rowStatus: string): TreatmentOrderResponse {
  return {
    id: 'order-1',
    tenant_id: 'tenant-1',
    client_id: 'client-1',
    episode_id: null,
    state: 'IN_PROGRESS',
    is_order: true,
    scheduling_status: 'FULLY_SCHEDULED',
    documentation_status: 'DRAFT',
    version: 1,
    rows: [
      {
        id: 'row-1',
        day_number: 1,
        status: rowStatus,
        assigned_staff_id: null,
        scheduled_date: null,
        scheduled_time: null,
        scheduled_at: null,
        scheduled_by_staff_id: null,
        started_at: null,
        started_by_staff_id: null,
        completed_at: null,
        completed_by_staff_id: null,
        treatment_name: 'Abhyanga',
        medicines_text: 'Herbal oil',
        instructions_text: 'Rest after',
      },
    ],
    scheduled_count: 1,
    completed_count: rowStatus === 'COMPLETED' ? 1 : 0,
    active_row_count: 1,
    progress_percentage: 0,
    completion_status: 'NOT_STARTED',
    created_at: null,
    updated_at: null,
  } as unknown as TreatmentOrderResponse;
}

describe('TreatmentRowEditor row-content editability (R4 · T-E.4 — role + completion, never document status)', () => {
  it('Doctor (canEdit=true) can edit a non-completed row', () => {
    const utils = render(
      <TreatmentRowEditor {...defaultProps} row={baseRow} canEdit={true} treatmentOrder={makeOrder('PENDING')} />
    );
    expect(utils.getByPlaceholderText('Describe the treatment performed...').props.editable).toBe(true);
  });

  it('Doctor (canEdit=true) CANNOT edit a COMPLETED row -- immutability preserved even for the Doctor', () => {
    const utils = render(
      <TreatmentRowEditor {...defaultProps} row={baseRow} canEdit={true} treatmentOrder={makeOrder('COMPLETED')} />
    );
    expect(utils.getByPlaceholderText('Describe the treatment performed...').props.editable).toBe(false);
    expect(utils.getByPlaceholderText('List medicines administered...').props.editable).toBe(false);
    expect(utils.getByPlaceholderText('Instructions for the patient...').props.editable).toBe(false);
  });

  it('Admin/Therapist (canEdit=false, computed upstream from isDoctor) cannot edit even a non-completed row', () => {
    const utils = render(
      <TreatmentRowEditor {...defaultProps} row={baseRow} canEdit={false} treatmentOrder={makeOrder('PENDING')} />
    );
    expect(utils.getByPlaceholderText('Describe the treatment performed...').props.editable).toBe(false);
  });

  it('a non-completed row remains editable regardless of the parent treatment sheet\'s own document status (no FINAL/SIGNED dependency exists at this component at all)', () => {
    // TreatmentRowEditor never reads treatmentSheet.status -- it only takes
    // `canEdit` (computed upstream from isDoctor) and the matching
    // treatmentOrder row's own execution status. Passing a canEdit=true prop
    // regardless of any document status concept proves this component has
    // no such dependency left to remove.
    const utils = render(
      <TreatmentRowEditor {...defaultProps} row={baseRow} canEdit={true} treatmentOrder={makeOrder('SCHEDULED')} />
    );
    expect(utils.getByPlaceholderText('Describe the treatment performed...').props.editable).toBe(true);
  });
});

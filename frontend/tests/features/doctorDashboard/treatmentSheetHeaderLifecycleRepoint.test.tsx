/**
 * Phase 4 (R4) · T-F.2b (ADR-R4-03) — TreatmentSheetDetailHeader.tsx no
 * longer renders TreatmentSheetStatusBadge (raw TreatmentSheet.status:
 * DRAFT/FINAL/SIGNED). It now shows the resolver's own
 * lifecycle_status_label instead, matching every other lifecycle display on
 * this same canonical workspace (TreatmentSheetInfoCard,
 * TreatmentLifecycleActions).
 *
 * Verifies:
 *   - the header displays lifecycle_status_label
 *   - the header never displays "Draft"/"Final"/"Signed" (the old document
 *     status labels)
 *   - lifecycle_status_unresolved shows the same honest "Status Pending
 *     Review" fallback used elsewhere, not a guessed status
 *   - no frontend re-derivation of the resolver's logic (source-level proof)
 */
import fs from 'fs';
import path from 'path';
import React from 'react';
import { render } from '@testing-library/react-native';
import { TreatmentSheetDetailHeader } from '../../../features/treatmentSheets/presentation/pages/detail/TreatmentSheetDetailHeader';
import type { TreatmentSheetResponse } from '../../../features/treatmentSheets/data/models/treatmentSheets.dtos';
import type { TreatmentOrderResponse } from '../../../features/treatmentSheets/data/models/treatmentOrders.dtos';

jest.mock('../../../core/theme/useClinicTheme', () => ({
  useClinicTheme: () => ({
    colors: {
      primary: { default: '#2563EB' },
      background: { elevated: '#FFFFFF' },
      border: { subtle: '#F3F4F6' },
      text: { primary: '#111827' },
      feedback: { success: '#10B981', warning: '#F59E0B', error: '#EF4444', info: '#3B82F6' },
    },
  }),
}));
jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }));

const baseSheet = {
  id: 'sheet-1',
  status: 'DRAFT',
  duration_days: 14,
} as unknown as TreatmentSheetResponse;

const baseProps = {
  treatmentSheet: baseSheet,
  rowsCount: 14,
  isPrinting: false,
  isArchiving: false,
  onBack: jest.fn(),
  onPrint: jest.fn(),
  onArchive: jest.fn(),
};

describe('TreatmentSheetDetailHeader: lifecycle repoint (R4 · T-F.2b)', () => {
  it('displays lifecycle_status_label, not the raw document status', () => {
    const order = {
      lifecycle_status: 'in_therapy',
      lifecycle_status_label: 'In Therapy',
      lifecycle_status_unresolved: false,
    } as unknown as TreatmentOrderResponse;

    const utils = render(<TreatmentSheetDetailHeader {...baseProps} treatmentOrder={order} />);
    expect(utils.getByText('In Therapy')).toBeTruthy();
  });

  it('never displays "Draft" for a DRAFT-status treatment sheet -- document status is not the workflow state', () => {
    const order = {
      lifecycle_status: 'treatment_sheet_draft',
      lifecycle_status_label: 'Treatment Sheet Draft',
      lifecycle_status_unresolved: false,
    } as unknown as TreatmentOrderResponse;

    const utils = render(<TreatmentSheetDetailHeader {...baseProps} treatmentOrder={order} />);
    expect(utils.queryByText('Draft')).toBeNull();
    expect(utils.queryByText('Final')).toBeNull();
    expect(utils.queryByText('Signed')).toBeNull();
  });

  it('lifecycle_status_unresolved shows the honest fallback, not a guessed status', () => {
    const order = {
      lifecycle_status: null,
      lifecycle_status_label: null,
      lifecycle_status_unresolved: true,
    } as unknown as TreatmentOrderResponse;

    const utils = render(<TreatmentSheetDetailHeader {...baseProps} treatmentOrder={order} />);
    expect(utils.getByText('Status Pending Review')).toBeTruthy();
  });

  it('renders the same fallback when treatmentOrder has not loaded yet', () => {
    const utils = render(<TreatmentSheetDetailHeader {...baseProps} treatmentOrder={undefined} />);
    expect(utils.getByText('Status Pending Review')).toBeTruthy();
  });

  it('source confirms no TreatmentSheetStatusBadge import, no raw status literals, and no re-derivation of resolver logic', () => {
    const source = fs.readFileSync(
      path.resolve(__dirname, '../../../features/treatmentSheets/presentation/pages/detail/TreatmentSheetDetailHeader.tsx'),
      'utf8',
    );
    expect(source).not.toMatch(/TreatmentSheetStatusBadge/);
    expect(source).not.toMatch(/treatmentSheet\.status/);
    expect(source).not.toMatch(/['"]FINAL['"]|['"]SIGNED['"]/);
    // uses the shared helpers rather than any local if/switch on lifecycle_status
    expect(source).toMatch(/getLifecycleStatusLabel/);
    expect(source).not.toMatch(/switch\s*\(.*lifecycle_status/);
  });
});

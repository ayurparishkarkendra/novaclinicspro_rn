/**
 * Phase 4 (R4) · T-E.1 (ADR-R4-02) — TreatmentSheetInfoCard.tsx's "Status:"
 * row re-pointed from getPrimaryOrderStatusLabel's old raw-state derivation
 * to the backend's own lifecycle_status_label. Verifies exactly one status
 * value is shown, and it matches the backend field verbatim.
 */
import React from 'react';
import { render } from '@testing-library/react-native';

import { TreatmentSheetInfoCard } from '../../../features/treatmentSheets/presentation/pages/detail/TreatmentSheetInfoCard';
import type { TreatmentOrderResponse } from '../../../features/treatmentSheets/data/models/treatmentOrders.dtos';
import type { TreatmentSheetResponse } from '../../../features/treatmentSheets/data/models/treatmentSheets.dtos';

jest.mock('../../../core/theme/useClinicTheme', () => ({
  useClinicTheme: () => ({
    colors: {
      background: { default: '#FFFFFF' },
      border: { subtle: '#F3F4F6' },
      text: { disabled: '#9CA3AF', secondary: '#6B7280', primary: '#111827' },
      feedback: { success: '#10B981', error: '#EF4444', info: '#3B82F6' },
      primary: { default: '#2563EB' },
    },
  }),
}));

const treatmentSheet = {
  duration_days: 7,
  recorded_at: '2026-07-01T00:00:00Z',
} as unknown as TreatmentSheetResponse;

describe('TreatmentSheetInfoCard status row (R4 · T-E.1 — re-pointed to lifecycle_status_label)', () => {
  it('shows the backend lifecycle_status_label verbatim, exactly once', () => {
    const treatmentOrder = {
      is_order: true,
      lifecycle_status: 'in_therapy',
      lifecycle_status_label: 'In Therapy',
    } as unknown as TreatmentOrderResponse;

    const utils = render(
      <TreatmentSheetInfoCard
        treatmentSheet={treatmentSheet}
        rowsData={[]}
        isLoadingHeaderData={false}
        clientData={null}
        episodeData={null}
        treatmentOrder={treatmentOrder}
      />
    );

    expect(utils.getAllByText('In Therapy')).toHaveLength(1);
  });

  it('shows the honest fallback for the still-open T-B.2 edge case, never a guessed status', () => {
    const treatmentOrder = {
      is_order: true,
      lifecycle_status: null,
      lifecycle_status_label: null,
      lifecycle_status_unresolved: true,
    } as unknown as TreatmentOrderResponse;

    const utils = render(
      <TreatmentSheetInfoCard
        treatmentSheet={treatmentSheet}
        rowsData={[]}
        isLoadingHeaderData={false}
        clientData={null}
        episodeData={null}
        treatmentOrder={treatmentOrder}
      />
    );

    expect(utils.getByText('Status Pending Review')).toBeTruthy();
  });
});

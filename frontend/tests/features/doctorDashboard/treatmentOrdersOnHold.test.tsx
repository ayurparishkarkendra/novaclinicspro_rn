/**
 * Phase 4 (R4) · T-D.1 (ADR-R4-01) — Scheduling On Hold action on the
 * existing admin scheduling worklist (app/clinic-admin/treatment-sheets/orders.tsx).
 *
 * Verifies: (1) "On Hold" is offered on an ORDERED, not-yet-held order and
 * placing it calls the new /hold endpoint with the version If-Match header;
 * (2) an ON_HOLD order shows "Extend Hold" instead, with the existing
 * hold_expires_at surfaced as plain fact text; confirming calls the
 * /hold/extend endpoint. No new scheduling screen is introduced -- both
 * flows stay on this same worklist screen.
 */
import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import TreatmentOrdersScreen from '../../../app/clinic-admin/treatment-sheets/orders.tsx';
import { axiosClient } from '../../../core/api/axiosClient';

jest.mock('../../../features/auth/presentation/hooks/useAuth', () => ({
  useAuth: () => ({ currentUser: { tenantId: 'tenant-1' } }),
}));

jest.mock('../../../core/api/axiosClient', () => ({
  axiosClient: { get: jest.fn(), post: jest.fn() },
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
}));

const baseOrder = {
  id: 'order-1',
  tenant_id: 'tenant-1',
  client_id: 'client-1',
  case_sheet_id: null,
  episode_id: null,
  state: 'ORDERED',
  is_order: true,
  scheduling_status: 'PENDING_SCHEDULING',
  documentation_status: 'DRAFT',
  planned_sessions: 7,
  frequency: 'Daily',
  preferred_time_window: null,
  order_notes: null,
  recommended_therapy: 'Abhyanga',
  ordered_at: '2026-07-01T00:00:00Z',
  version: 3,
  rows: [],
  scheduled_count: 0,
  completed_count: 0,
  active_row_count: 0,
  progress_percentage: 0,
  completion_status: 'NOT_STARTED',
  created_at: null,
  updated_at: null,
  client_name: 'Maya Rao',
  recorded_by_staff_id: null,
  // Phase 4 (R4) · T-E.1 (ADR-R4-02) — a real backend response always
  // carries these fields (T-C.4); included here so the card's status pill
  // (re-pointed to lifecycle_status_label) renders the same real value a
  // live order would, not the "Status Pending Review" fallback.
  lifecycle_status: 'needs_scheduling',
  lifecycle_status_label: 'Needs Scheduling',
  lifecycle_status_unresolved: false,
};

const renderScreen = (order: any) => {
  (axiosClient.get as jest.Mock).mockResolvedValue({
    data: { items: [order], total: 1, skip: 0, limit: 50 },
  });
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <TreatmentOrdersScreen />
    </QueryClientProvider>
  );
};

describe('Scheduling On Hold (R4 · T-D.1)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('offers "On Hold" for an ORDERED order and places it via the new /hold endpoint', async () => {
    (axiosClient.post as jest.Mock).mockResolvedValue({
      data: { ...baseOrder, scheduling_status: 'ON_HOLD', version: 4 },
    });
    const utils = renderScreen(baseOrder);

    await waitFor(() => expect(utils.getByText('On Hold')).toBeTruthy());
    fireEvent.press(utils.getByText('On Hold'));

    await waitFor(() => expect(utils.getByText('Place On Hold')).toBeTruthy());
    fireEvent.press(utils.getByText('Confirm Hold'));

    await waitFor(() => expect(axiosClient.post).toHaveBeenCalled());
    const [url, body, config] = (axiosClient.post as jest.Mock).mock.calls[0];
    expect(url).toBe('/api/v1/treatment-sheets/order-1/hold');
    expect(body.hold_expires_at).toBeTruthy();
    expect(config.headers['If-Match']).toBe('3');
  });

  it('offers "Extend Hold" for an already-ON_HOLD order and shows the existing hold fact', async () => {
    const heldOrder = {
      ...baseOrder,
      scheduling_status: 'ON_HOLD',
      hold_expires_at: '2026-07-10T00:00:00Z',
      hold_notes: 'Patient wants to think about it.',
      lifecycle_status: 'scheduling_on_hold',
      lifecycle_status_label: 'Scheduling On Hold',
    };
    (axiosClient.post as jest.Mock).mockResolvedValue({ data: heldOrder });
    const utils = renderScreen(heldOrder);

    await waitFor(() => expect(utils.getByText(/On hold/)).toBeTruthy());
    expect(utils.getByText(/Patient wants to think about it\./)).toBeTruthy();
    expect(utils.getByText('Extend Hold')).toBeTruthy();

    fireEvent.press(utils.getByText('Extend Hold'));
    await waitFor(() => expect(utils.getByText('Extend the scheduling pause for this treatment plan.')).toBeTruthy());
    // Two "Extend Hold" texts now exist: the card button (behind the modal)
    // and the modal's own confirm button — press the modal's.
    const extendButtons = utils.getAllByText('Extend Hold');
    fireEvent.press(extendButtons[extendButtons.length - 1]);

    await waitFor(() => expect(axiosClient.post).toHaveBeenCalled());
    const [url] = (axiosClient.post as jest.Mock).mock.calls[0];
    expect(url).toBe('/api/v1/treatment-sheets/order-1/hold/extend');
  });

  it('does not offer On Hold for a fully scheduled order (state no longer ORDERED)', async () => {
    const scheduledOrder = {
      ...baseOrder,
      state: 'SCHEDULED',
      scheduling_status: 'FULLY_SCHEDULED',
      lifecycle_status: 'scheduled_awaiting_treatment_sheet',
      lifecycle_status_label: 'Scheduled - Awaiting Treatment Sheet',
    };
    const utils = renderScreen(scheduledOrder);

    await waitFor(() => expect(utils.getByText('Send Schedule')).toBeTruthy());
    expect(utils.queryByText('On Hold')).toBeNull();
  });

  // Phase 4 (R4) · T-D.3 — journey checkpoint: exactly three admin outcomes
  // (Schedule / On Hold / Deny) are offered from the shared Needs-Scheduling
  // starting point, no fourth action, and On Hold/Extend Hold never coexist.
  it('offers exactly the three admin outcomes from Needs Scheduling, no fourth action', async () => {
    const utils = renderScreen(baseOrder);

    await waitFor(() => expect(utils.getByText('Schedule Plan')).toBeTruthy());
    expect(utils.getByText('Patient Declined')).toBeTruthy();
    expect(utils.getByText('On Hold')).toBeTruthy();
    // Not yet held: "Extend Hold" must not also be present.
    expect(utils.queryByText('Extend Hold')).toBeNull();
    // Not yet scheduled: "Send Schedule" (the post-scheduling action) must not appear.
    expect(utils.queryByText('Send Schedule')).toBeNull();
  });

  it('once on hold, the action button is only ever "Extend Hold" (never a duplicate "On Hold" action), while Schedule/Deny remain available', async () => {
    const heldOrder = {
      ...baseOrder,
      scheduling_status: 'ON_HOLD',
      hold_expires_at: '2026-07-10T00:00:00Z',
      lifecycle_status: 'scheduling_on_hold',
      lifecycle_status_label: 'Scheduling On Hold',
    };
    const utils = renderScreen(heldOrder);

    await waitFor(() => expect(utils.getByText('Extend Hold')).toBeTruthy());
    // Phase 4 (R4) · T-E.1 (ADR-R4-02) — the status pill is now re-pointed
    // to the backend's own lifecycle_status_label ("Scheduling On Hold"),
    // not a frontend re-derivation. It legitimately shows exactly once as
    // the current-state label; what must NOT happen is a second, competing
    // "On Hold" ACTION button coexisting with "Extend Hold" -- the button
    // itself is mutually exclusive (isOnHold ? 'Extend Hold' : 'On Hold'),
    // so the exact string "On Hold" (the old button-only text) must not
    // appear at all once held.
    expect(utils.getAllByText('Scheduling On Hold')).toHaveLength(1);
    expect(utils.queryByText('On Hold')).toBeNull();
    // Schedule and Deny remain reachable while on hold (state is still
    // ORDERED) -- confirms the audit finding that these existing actions
    // are never blocked by a hold.
    expect(utils.getByText('Schedule Plan')).toBeTruthy();
    expect(utils.getByText('Patient Declined')).toBeTruthy();
  });
});

/**
 * Release 5 (R5) · T-E.1 (design.md §12, requirements.md FR-H2/FR-H4, N-6,
 * AC-21) — tests for `useCapabilities()` / `useToggleCapability()`.
 *
 * Mirrors `useClinicalTimelineData.test.tsx`'s established convention:
 * `jest.mock` every collaborator at its exact import path, `renderHook`
 * with a real `QueryClient` under a `QueryClientProvider` wrapper.
 */
import React from 'react';
import { renderHook, waitFor, act } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useCapabilities,
  useToggleCapability,
  capabilitiesKeys,
  CapabilityState,
} from '../../../core/hooks/useCapabilities';
import { axiosClient } from '../../../core/api/axiosClient';
import { useAuth } from '../../../features/auth/presentation/hooks/useAuth';
import { useTranslation } from '../../../core/localization/useTranslation';

jest.mock('../../../core/api/axiosClient', () => ({
  axiosClient: { get: jest.fn(), patch: jest.fn() },
}));
jest.mock('../../../features/auth/presentation/hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));
jest.mock('../../../core/localization/useTranslation', () => ({
  useTranslation: jest.fn(),
}));

const mockState = (overrides: Partial<CapabilityState> = {}): CapabilityState => ({
  code: 'core',
  name: 'Core',
  description: 'Essential clinic management',
  entitled: true,
  tenant_preference: true,
  effective_available: true,
  effective_enabled: true,
  blocked_reason_code: null,
  blocked_reason_label: null,
  unmet_dependencies: [],
  source: 'template_default',
  ...overrides,
});

let queryClient: QueryClient;
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe('useCapabilities / useToggleCapability (R5 · T-E.1)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    (useAuth as jest.Mock).mockReturnValue({ currentUser: { tenantId: 'tenant-1' } });
    (useTranslation as jest.Mock).mockReturnValue({ t: (key: string) => key, locale: 'en-US' });
  });

  // ---------------------------------------------------------------------
  // useCapabilities — read hook
  // ---------------------------------------------------------------------

  describe('useCapabilities', () => {
    it('fetches the tenant capability map on mount', async () => {
      (axiosClient.get as jest.Mock).mockResolvedValue({
        data: { capabilities: { core: mockState() } },
      });

      const { result } = renderHook(() => useCapabilities(), { wrapper });
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(axiosClient.get).toHaveBeenCalledWith('/api/v1/tenants/tenant-1/capabilities');
      expect(result.current.capabilities.core.code).toBe('core');
    });

    it('does not fetch when there is no authenticated tenant', () => {
      (useAuth as jest.Mock).mockReturnValue({ currentUser: null });

      renderHook(() => useCapabilities(), { wrapper });

      expect(axiosClient.get).not.toHaveBeenCalled();
    });

    it('caches per session — a second render with the same tenant does not refetch', async () => {
      (axiosClient.get as jest.Mock).mockResolvedValue({
        data: { capabilities: { core: mockState() } },
      });

      const { result, rerender } = renderHook(() => useCapabilities(), { wrapper });
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      rerender({});
      rerender({});

      expect(axiosClient.get).toHaveBeenCalledTimes(1);
    });

    it('getReason falls back to the cached capability state label when untranslated', async () => {
      (axiosClient.get as jest.Mock).mockResolvedValue({
        data: {
          capabilities: {
            'treatment.physiotherapy': mockState({
              code: 'treatment.physiotherapy',
              effective_available: false,
              effective_enabled: false,
              blocked_reason_code: 'requires_plan_upgrade',
              blocked_reason_label: 'Requires a plan upgrade to unlock this feature.',
            }),
          },
        },
      });

      const { result } = renderHook(() => useCapabilities(), { wrapper });
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.getReason('requires_plan_upgrade')).toBe(
        'Requires a plan upgrade to unlock this feature.'
      );
    });

    it('getReason prefers the frontend translation when the key is populated', async () => {
      (useTranslation as jest.Mock).mockReturnValue({
        t: (key: string) => (key === 'capabilities.requires_plan_upgrade' ? 'Upgrade your plan' : key),
        locale: 'en-US',
      });
      (axiosClient.get as jest.Mock).mockResolvedValue({
        data: {
          capabilities: {
            core: mockState({
              blocked_reason_code: 'requires_plan_upgrade',
              blocked_reason_label: 'Backend label (should not be used here)',
            }),
          },
        },
      });

      const { result } = renderHook(() => useCapabilities(), { wrapper });
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.getReason('requires_plan_upgrade')).toBe('Upgrade your plan');
    });
  });

  // ---------------------------------------------------------------------
  // useToggleCapability — mutation hook
  // ---------------------------------------------------------------------

  describe('useToggleCapability', () => {
    it('sends If-Match with the given version', async () => {
      (axiosClient.patch as jest.Mock).mockResolvedValue({
        data: { capabilities: { core: mockState() }, version: 3 },
      });

      const { result } = renderHook(() => useToggleCapability(), { wrapper });
      await act(async () => {
        await result.current.toggle({ code: 'core', enabled: true, version: 2 });
      });

      expect(axiosClient.patch).toHaveBeenCalledWith(
        '/api/v1/tenants/tenant-1/capabilities/core',
        { enabled: true },
        { headers: { 'If-Match': '2' } }
      );
    });

    it('on success, writes the returned re-resolved map into the capabilities cache (FR-H2)', async () => {
      queryClient.setQueryData(capabilitiesKeys.tenant('tenant-1'), {
        capabilities: { core: mockState({ effective_enabled: false, tenant_preference: false }) },
      });
      (axiosClient.patch as jest.Mock).mockResolvedValue({
        data: {
          capabilities: { core: mockState({ effective_enabled: true, tenant_preference: true }) },
          version: 4,
        },
      });

      const { result } = renderHook(() => useToggleCapability(), { wrapper });
      await act(async () => {
        await result.current.toggle({ code: 'core', enabled: true, version: 3 });
      });

      expect(result.current.status).toBe('success');
      expect(result.current.currentVersion).toBe(4);
      const cached = queryClient.getQueryData<any>(capabilitiesKeys.tenant('tenant-1'));
      expect(cached.capabilities.core.effective_enabled).toBe(true);
    });

    it('surfaces a 409 version_conflict as a conflict status, never auto-retrying', async () => {
      (axiosClient.patch as jest.Mock).mockRejectedValue({
        response: {
          status: 409,
          data: { error: 'version_conflict', message: 'stale', expected_version: 2, current_version: 5 },
        },
      });

      const { result } = renderHook(() => useToggleCapability(), { wrapper });
      await act(async () => {
        await result.current.toggle({ code: 'core', enabled: true, version: 2 });
      });

      expect(result.current.status).toBe('conflict');
      expect(result.current.currentVersion).toBe(5);
      expect(result.current.rejection?.error).toBe('version_conflict');
      expect(axiosClient.patch).toHaveBeenCalledTimes(1);
    });

    it('surfaces a 422 not_entitled rejection as an error status with the structured body', async () => {
      (axiosClient.patch as jest.Mock).mockRejectedValue({
        response: {
          status: 422,
          data: { error: 'not_entitled', message: 'not available', reason_code: 'requires_plan_upgrade' },
        },
      });

      const { result } = renderHook(() => useToggleCapability(), { wrapper });
      await act(async () => {
        await result.current.toggle({ code: 'treatment.physiotherapy', enabled: true, version: 0 });
      });

      expect(result.current.status).toBe('error');
      expect(result.current.rejection?.error).toBe('not_entitled');
      expect(result.current.rejection?.reason_code).toBe('requires_plan_upgrade');
    });

    it('reset() clears status back to idle', async () => {
      (axiosClient.patch as jest.Mock).mockRejectedValue({
        response: { status: 422, data: { error: 'not_entitled', message: 'x', reason_code: 'x' } },
      });

      const { result } = renderHook(() => useToggleCapability(), { wrapper });
      await act(async () => {
        await result.current.toggle({ code: 'core', enabled: true, version: 0 });
      });
      expect(result.current.status).toBe('error');

      act(() => {
        result.current.reset();
      });

      expect(result.current.status).toBe('idle');
      expect(result.current.errorMessage).toBeNull();
      expect(result.current.rejection).toBeNull();
    });
  });
});

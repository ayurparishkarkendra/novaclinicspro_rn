/**
 * Release 5 (R5) · T-E.2 (design.md §12, requirements.md FR-H3, AC-12) —
 * tests for `<CapabilityGate>`, covering every UI-contract state named in
 * design.md §12: loading, available+enabled, available-but-disabled,
 * unavailable-with-reason, nested gates, and error fail-closed.
 */
import React from 'react';
import { Text } from 'react-native';
import { render } from '@testing-library/react-native';
import { CapabilityGate } from '../../../core/components/CapabilityGate';
import { useCapabilities } from '../../../core/hooks/useCapabilities';
import type { CapabilityState } from '../../../core/hooks/useCapabilities';

jest.mock('../../../core/hooks/useCapabilities', () => ({
  useCapabilities: jest.fn(),
}));

const mockState = (overrides: Partial<CapabilityState> = {}): CapabilityState => ({
  code: 'treatment.physiotherapy',
  name: 'Physiotherapy',
  description: 'Physiotherapy treatment tracking',
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

const mockUseCapabilities = (
  capabilities: Record<string, CapabilityState>,
  extra: { isLoading?: boolean; error?: Error | null } = {}
) => {
  (useCapabilities as jest.Mock).mockReturnValue({
    capabilities,
    isLoading: extra.isLoading ?? false,
    error: extra.error ?? null,
    getReason: (code: string) => `Reason: ${code}`,
    refetch: jest.fn(),
  });
};

describe('<CapabilityGate> (R5 · T-E.2)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loading: renders fallback, never children, while the map is loading', () => {
    mockUseCapabilities({}, { isLoading: true });

    const { queryByText } = render(
      <CapabilityGate code="treatment.physiotherapy" fallback={<Text>Loading…</Text>}>
        <Text>Physio Content</Text>
      </CapabilityGate>
    );

    expect(queryByText('Loading…')).toBeTruthy();
    expect(queryByText('Physio Content')).toBeNull();
  });

  it('loading: renders null (not children) when no fallback is given', () => {
    mockUseCapabilities({}, { isLoading: true });

    const { queryByText, toJSON } = render(
      <CapabilityGate code="treatment.physiotherapy">
        <Text>Physio Content</Text>
      </CapabilityGate>
    );

    expect(queryByText('Physio Content')).toBeNull();
    expect(toJSON()).toBeNull();
  });

  it('available + enabled: renders children', () => {
    mockUseCapabilities({ 'treatment.physiotherapy': mockState() });

    const { getByText } = render(
      <CapabilityGate code="treatment.physiotherapy">
        <Text>Physio Content</Text>
      </CapabilityGate>
    );

    expect(getByText('Physio Content')).toBeTruthy();
  });

  it('available but not enabled: renders null by default (hidden)', () => {
    mockUseCapabilities({
      'treatment.physiotherapy': mockState({ effective_enabled: false, tenant_preference: false }),
    });

    const { queryByText, toJSON } = render(
      <CapabilityGate code="treatment.physiotherapy">
        <Text>Physio Content</Text>
      </CapabilityGate>
    );

    expect(queryByText('Physio Content')).toBeNull();
    expect(toJSON()).toBeNull();
  });

  it('available but not enabled: renders whenDisabled when the consumer opts in', () => {
    mockUseCapabilities({
      'treatment.physiotherapy': mockState({ effective_enabled: false, tenant_preference: false }),
    });

    const { getByText, queryByText } = render(
      <CapabilityGate
        code="treatment.physiotherapy"
        whenDisabled={(info) => <Text>Enable {info.name}</Text>}
      >
        <Text>Physio Content</Text>
      </CapabilityGate>
    );

    expect(getByText('Enable Physiotherapy')).toBeTruthy();
    expect(queryByText('Physio Content')).toBeNull();
  });

  it('unavailable: renders null by default (hidden), not children', () => {
    mockUseCapabilities({
      'treatment.physiotherapy': mockState({
        effective_available: false,
        effective_enabled: false,
        blocked_reason_code: 'requires_plan_upgrade',
      }),
    });

    const { queryByText, toJSON } = render(
      <CapabilityGate code="treatment.physiotherapy">
        <Text>Physio Content</Text>
      </CapabilityGate>
    );

    expect(queryByText('Physio Content')).toBeNull();
    expect(toJSON()).toBeNull();
  });

  it('unavailable: whenUnavailable receives blocked_reason_code + localized reason + unmet_dependencies', () => {
    mockUseCapabilities({
      'treatment.dental': mockState({
        code: 'treatment.dental',
        effective_available: false,
        effective_enabled: false,
        blocked_reason_code: 'requires_capability',
        unmet_dependencies: ['clinical_documents'],
      }),
    });

    const { getByText } = render(
      <CapabilityGate
        code="treatment.dental"
        whenUnavailable={(info) => (
          <Text>
            {info.blocked_reason_code} / {info.reason} / {info.unmet_dependencies.join(',')}
          </Text>
        )}
      >
        <Text>Dental Content</Text>
      </CapabilityGate>
    );

    expect(getByText('requires_capability / Reason: requires_capability / clinical_documents')).toBeTruthy();
  });

  it('unavailable: an unknown code (absent from the resolved map) is treated as unavailable, fail closed', () => {
    mockUseCapabilities({});

    const { queryByText, toJSON } = render(
      <CapabilityGate code="not.in.catalog">
        <Text>Content</Text>
      </CapabilityGate>
    );

    expect(queryByText('Content')).toBeNull();
    expect(toJSON()).toBeNull();
  });

  it('nested gates: compose independently, each re-checking its own code', () => {
    mockUseCapabilities({
      core: mockState({ code: 'core', effective_available: true, effective_enabled: true }),
      'treatment.physiotherapy': mockState({
        code: 'treatment.physiotherapy',
        effective_available: false,
        effective_enabled: false,
        blocked_reason_code: 'requires_plan_upgrade',
      }),
    });

    const { getByText, queryByText } = render(
      <CapabilityGate code="core">
        <Text>Core Content</Text>
        <CapabilityGate code="treatment.physiotherapy">
          <Text>Physio Content</Text>
        </CapabilityGate>
      </CapabilityGate>
    );

    expect(getByText('Core Content')).toBeTruthy();
    expect(queryByText('Physio Content')).toBeNull();
  });

  it('nested gates: an unavailable outer gate hides the inner gate entirely, without the inner gate needing special logic', () => {
    mockUseCapabilities({
      core: mockState({ code: 'core', effective_available: false, effective_enabled: false }),
      'treatment.physiotherapy': mockState({ code: 'treatment.physiotherapy' }),
    });

    const { queryByText, toJSON } = render(
      <CapabilityGate code="core">
        <Text>Core Content</Text>
        <CapabilityGate code="treatment.physiotherapy">
          <Text>Physio Content</Text>
        </CapabilityGate>
      </CapabilityGate>
    );

    expect(queryByText('Core Content')).toBeNull();
    expect(queryByText('Physio Content')).toBeNull();
    expect(toJSON()).toBeNull();
  });

  it('error: fails closed (renders fallback/null), never renders children', () => {
    mockUseCapabilities({}, { error: new Error('network down') });

    const { queryByText, toJSON } = render(
      <CapabilityGate code="treatment.physiotherapy" fallback={<Text>Unavailable</Text>}>
        <Text>Physio Content</Text>
      </CapabilityGate>
    );

    expect(queryByText('Physio Content')).toBeNull();
    expect(queryByText('Unavailable')).toBeTruthy();
  });

  it('error: does not throw or crash when no fallback is given', () => {
    mockUseCapabilities({}, { error: new Error('network down') });

    const { toJSON } = render(
      <CapabilityGate code="treatment.physiotherapy">
        <Text>Physio Content</Text>
      </CapabilityGate>
    );

    expect(toJSON()).toBeNull();
  });

  it('CapabilityGate.Skeleton renders a placeholder view', () => {
    const { getByTestId } = render(<CapabilityGate.Skeleton />);

    expect(getByTestId('capability-gate-skeleton')).toBeTruthy();
  });
});

import React from 'react';
import { render } from '@testing-library/react-native';

import {
  CommercialRetention,
  CommercialTrialError,
} from '../../features/onboarding/domain/entities/commercial-trial.entity';
import { CommercialRetentionScreen } from '../../features/onboarding/presentation/pages/CommercialRetentionScreen';

const mockUseCommercialRetentionQuery = jest.fn();

jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));
jest.mock(
  '../../features/onboarding/data/repositories/onboarding.repository.impl',
  () => ({
    useCommercialRetentionQuery: (...args: unknown[]) =>
      mockUseCommercialRetentionQuery(...args),
  })
);
jest.mock('../../core/localization/useTranslation', () => ({
  useTranslation: () => ({
    locale: 'en-US',
    t: (token: string) => token,
  }),
}));
jest.mock('../../core/theme/useClinicTheme', () => ({
  useClinicTheme: () => ({
    colors: {
      background: { default: '#fff' },
      surface: { default: '#fff' },
      primary: { default: '#111' },
      text: { primary: '#111', secondary: '#555' },
      feedback: {
        success: '#080',
        warning: '#850',
        warningLight: '#ffe',
        error: '#800',
      },
      border: { subtle: '#ddd' },
    },
    spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 },
    typography: {
      h3: { fontSize: 24 },
      h4: { fontSize: 20 },
      h5: { fontSize: 18 },
      h6: { fontSize: 16 },
      body1: { fontSize: 16 },
      body2: { fontSize: 14 },
      button: { fontSize: 16 },
    },
  }),
}));

const ROOT = 'onboarding.progressiveExperience.commercialRetention';

const retention = (
  overrides: Partial<CommercialRetention> = {}
): CommercialRetention => ({
  contractVersion: 'commercial_trial_v1',
  trialId: 'trial-secret',
  organizationId: 'org-1',
  tenantId: 'tenant-1',
  commercialState: 'ARCHIVED',
  aggregateVersion: 8,
  archivedAt: '2026-07-01T10:00:00Z',
  retentionUntil: '2026-09-29T10:00:00Z',
  restoreEligible: true,
  permanentDeletionEligible: false,
  extensionEligible: true,
  workspaceDataExportRequestPermitted: false,
  legalHoldActive: false,
  statutoryRetentionActive: false,
  allowedActions: ['GRANT_EXTENSION', 'RESTORE_WORKSPACE'],
  ineligibilityReasons: ['RETENTION_PERIOD_ACTIVE'],
  ...overrides,
});

const query = (
  data: CommercialRetention | undefined,
  error: Error | null = null
) => ({
  data,
  error,
  isPending: false,
  refetch: jest.fn(),
});

describe('CommercialRetentionScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseCommercialRetentionQuery.mockReturnValue(query(retention()));
  });

  it.each([
    'ACTIVE',
    'EXPIRED',
    'SUSPENDED',
    'ARCHIVED',
    'DELETED',
  ] as const)('renders the backend-authoritative %s status', (state) => {
    mockUseCommercialRetentionQuery.mockReturnValue(
      query(retention({ commercialState: state }))
    );
    const { getByText } = render(
      <CommercialRetentionScreen organizationId="org-1" tenantId="tenant-1" />
    );

    expect(getByText(`${ROOT}.states.${state}`)).toBeTruthy();
    expect(getByText(`${ROOT}.stateDescriptions.${state}`)).toBeTruthy();
    expect(mockUseCommercialRetentionQuery).toHaveBeenCalledWith(
      'org-1',
      'tenant-1'
    );
  });

  it('uses the localized loading primitive', () => {
    mockUseCommercialRetentionQuery.mockReturnValue({
      ...query(undefined),
      isPending: true,
    });
    const { getByRole, getByText } = render(
      <CommercialRetentionScreen organizationId="org-1" tenantId="tenant-1" />
    );

    expect(getByRole('progressbar').props.accessibilityState).toEqual({
      busy: true,
    });
    expect(getByText(`${ROOT}.loading`)).toBeTruthy();
  });

  it('fails closed when workspace scope is missing', () => {
    const { getByRole, getByText } = render(
      <CommercialRetentionScreen organizationId="" tenantId="" />
    );

    expect(getByRole('alert')).toBeTruthy();
    expect(getByText(`${ROOT}.empty.missingWorkspace`)).toBeTruthy();
  });

  it.each([
    ['FORBIDDEN', 'permissionDenied'],
    ['NOT_FOUND', 'missingWorkspace'],
    ['RETENTION_EVIDENCE_UNAVAILABLE', 'missingEvidence'],
    ['UNSUPPORTED_CONTRACT', 'unsupported'],
    ['BACKEND_FAILURE', 'network'],
  ] as const)('maps %s to a localized safe empty state', (kind, message) => {
    mockUseCommercialRetentionQuery.mockReturnValue(
      query(
        undefined,
        new CommercialTrialError(
          kind,
          `commercial_trial.${kind.toLowerCase()}`,
          `errors.${kind}`,
          false
        )
      )
    );
    const { getByRole, getByText } = render(
      <CommercialRetentionScreen organizationId="org-1" tenantId="tenant-1" />
    );

    expect(getByRole('alert')).toBeTruthy();
    expect(getByText(`${ROOT}.empty.${message}`)).toBeTruthy();
  });

  it('renders exactly the backend action collection without identifiers or export artifacts', () => {
    mockUseCommercialRetentionQuery.mockReturnValue(
      query(
        retention({
          allowedActions: [
            'REQUEST_EXTENSION',
            'REQUEST_WORKSPACE_DATA_EXPORT',
            'CONTACT_SUPPORT',
          ],
        })
      )
    );
    const { getByText, queryByText } = render(
      <CommercialRetentionScreen organizationId="org-1" tenantId="tenant-1" />
    );

    expect(getByText(`${ROOT}.actionLabels.REQUEST_EXTENSION`)).toBeTruthy();
    expect(
      getByText(`${ROOT}.actionLabels.REQUEST_WORKSPACE_DATA_EXPORT`)
    ).toBeTruthy();
    expect(getByText(`${ROOT}.actionLabels.CONTACT_SUPPORT`)).toBeTruthy();
    expect(queryByText(`${ROOT}.actionLabels.GRANT_EXTENSION`)).toBeNull();
    expect(queryByText('trial-secret')).toBeNull();
    expect(queryByText(/download|package|artifact/i)).toBeNull();
  });

  it('announces backend ineligibility reasons without exposing raw enums', () => {
    const { getByRole, getByText, queryByText } = render(
      <CommercialRetentionScreen organizationId="org-1" tenantId="tenant-1" />
    );

    expect(getByRole('alert')).toBeTruthy();
    expect(
      getByText(`${ROOT}.ineligibilityReasons.RETENTION_PERIOD_ACTIVE`)
    ).toBeTruthy();
    expect(queryByText('RETENTION_PERIOD_ACTIVE')).toBeNull();
  });

  it('omits missing dates and nullable hold evidence instead of inventing values', () => {
    mockUseCommercialRetentionQuery.mockReturnValue(
      query(
        retention({
          archivedAt: null,
          retentionUntil: null,
          legalHoldActive: null,
          statutoryRetentionActive: null,
          ineligibilityReasons: [],
        })
      )
    );
    const { getByText, queryByText } = render(
      <CommercialRetentionScreen organizationId="org-1" tenantId="tenant-1" />
    );

    expect(getByText(`${ROOT}.retention.notApplicable`)).toBeTruthy();
    expect(queryByText(`${ROOT}.retention.archivedAt`)).toBeNull();
    expect(queryByText(`${ROOT}.retention.retentionUntil`)).toBeNull();
  });

  it('exposes an ordered accessible screen and backend action summaries', () => {
    const { getByLabelText, getAllByLabelText } = render(
      <CommercialRetentionScreen organizationId="org-1" tenantId="tenant-1" />
    );

    expect(getByLabelText(`${ROOT}.accessibility.screen`)).toBeTruthy();
    expect(
      getAllByLabelText(
        new RegExp(`${ROOT}\\.actionLabels\\.(GRANT_EXTENSION|RESTORE_WORKSPACE)`)
      )
    ).toHaveLength(2);
  });
});

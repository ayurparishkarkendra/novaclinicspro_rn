import React from 'react';
import { render } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ClinicalWorkspace } from '../../../features/episodes/presentation/pages/ClinicalWorkspace';
import { useFeatures } from '../../../core/hooks/useFeatures';

/**
 * R3B · T-C.2 — Verification that `ClinicalTimeline` is mounted into
 * `ClinicalWorkspace` only when `isClinicalSpineV1Enabled` is ON, and not at
 * all when OFF — using shallow component-level mocks for
 * `ConsultationWorkspaceScreen`/`ClinicalTimeline` themselves (already
 * covered individually by `clinicalWorkspaceShell.test.tsx` and
 * `clinicalTimeline.test.tsx`), mirroring the technique
 * `caseSheetRouteFlagSwitch.test.tsx`/`prescriptionRouteFlagSwitch.test.tsx`
 * (T-B.3/T-B.6) already established for flag-gated mounting.
 */

jest.mock('../../../features/auth/presentation/hooks/useAuth', () => ({
  useAuth: () => ({ currentUser: { tenantId: 'tenant-1' }, selectedClinicId: null }),
}));
jest.mock('../../../core/hooks/useFeatures', () => ({
  useFeatures: jest.fn(),
  isClinicalSpineV1Enabled: (features: any) => !!features.clinical_spine_v1_enabled,
}));
jest.mock('../../../features/episodes/presentation/context/ClinicalWorkspaceContext', () => ({
  WorkspaceProvider: ({ children }: any) => children,
}));
jest.mock('../../../features/episodes/presentation/context/WorkspaceSaveStatusContext', () => ({
  WorkspaceSaveStatusProvider: ({ children }: any) => children,
}));
jest.mock('../../../features/episodes/presentation/components/WorkspaceHeader', () => ({
  WorkspaceHeader: () => null,
}));
jest.mock('../../../features/episodes/presentation/pages/ConsultationWorkspaceScreen', () => ({
  ConsultationWorkspaceScreen: () => {
    const { Text } = require('react-native');
    return <Text testID="module-host-stub">module host</Text>;
  },
}));
jest.mock('../../../features/episodes/presentation/components/ClinicalTimeline', () => ({
  ClinicalTimeline: () => {
    const { Text } = require('react-native');
    return <Text testID="clinical-timeline-stub">timeline</Text>;
  },
}));

let queryClient: QueryClient;
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe('ClinicalWorkspace: ClinicalTimeline flag-gated mounting (R3B · T-C.2)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  });

  it('flag OFF: ClinicalTimeline does not render at all — only the module host does', () => {
    (useFeatures as jest.Mock).mockReturnValue({ clinical_spine_v1_enabled: false });
    const { queryByTestId } = render(
      <ClinicalWorkspace episodeId="episode-1" appointmentId="appointment-1" clientId="client-1" />,
      { wrapper },
    );
    expect(queryByTestId('module-host-stub')).toBeTruthy();
    expect(queryByTestId('clinical-timeline-stub')).toBeNull();
  });

  it('flag ON: ClinicalTimeline renders alongside the module host, not in place of it', () => {
    (useFeatures as jest.Mock).mockReturnValue({ clinical_spine_v1_enabled: true });
    const { queryByTestId } = render(
      <ClinicalWorkspace episodeId="episode-1" appointmentId="appointment-1" clientId="client-1" />,
      { wrapper },
    );
    expect(queryByTestId('module-host-stub')).toBeTruthy();
    expect(queryByTestId('clinical-timeline-stub')).toBeTruthy();
  });
});

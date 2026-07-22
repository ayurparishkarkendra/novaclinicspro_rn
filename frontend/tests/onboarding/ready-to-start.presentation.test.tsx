import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';

import enUS from '../../core/localization/translations/en-US.json';
import hiIN from '../../core/localization/translations/hi-IN.json';
import {
  ReadyToStart,
  ReadyToStartError,
} from '../../features/onboarding/domain/entities/ready-to-start.entity';
import { useReadyToStart } from '../../features/onboarding/presentation/hooks/useReadyToStart';
import { GoLiveScreen } from '../../features/onboarding/presentation/pages/steps/GoLiveScreen';

jest.mock('../../features/onboarding/presentation/hooks/useReadyToStart', () => ({
  useReadyToStart: jest.fn(),
}));

const mockUseReadyToStart = useReadyToStart as jest.Mock;
const refresh = jest.fn(async () => undefined);
const revalidateTenant = jest.fn(async () => true);

const tokenRoot = 'onboarding.progressive_experience.ready_to_start.providers';

const aggregate = (state: ReadyToStart['state'] = 'NOT_READY'): ReadyToStart => {
  const complete = Object.freeze({
    providerId: 'journey_setup_progress',
    itemId: 'profile',
    itemVersion: '1',
    titleToken: `${tokenRoot}.journey_setup_progress.steps.clinic_profile.title`,
    explanationToken: `${tokenRoot}.journey_setup_progress.steps.clinic_profile.complete`,
    status: 'COMPLETE' as const,
    classification: null,
    evidenceTimestamp: '2026-07-22T12:00:00Z',
    order: 7,
    applicable: true,
    nextAction: null,
  });
  const blocker = Object.freeze({
    providerId: 'workspace_preparation',
    itemId: 'workspace',
    itemVersion: '1',
    titleToken: `${tokenRoot}.workspace_preparation.states.not_ready.title`,
    explanationToken: `${tokenRoot}.workspace_preparation.states.not_ready.explanation`,
    status: 'BLOCKED' as const,
    classification: 'BLOCKER' as const,
    evidenceTimestamp: '2026-07-22T12:00:00Z',
    order: 2,
    applicable: true,
    nextAction: Object.freeze({
      actionId: 'readiness.open_workspace_preparation',
      labelToken: `${tokenRoot}.workspace_preparation.actions.open`,
      ownerId: 'workspace_preparation',
      kind: 'NAVIGATE' as const,
      authorizationRequirement: 'tenant.read',
      targetId: 'onboarding.workspace_preparation',
    }),
  });
  const advisory = Object.freeze({
    providerId: 'journey_setup_progress',
    itemId: 'hours',
    itemVersion: '1',
    titleToken: `${tokenRoot}.journey_setup_progress.steps.operating_hours.title`,
    explanationToken: `${tokenRoot}.journey_setup_progress.steps.operating_hours.advisory`,
    status: 'ADVISORY' as const,
    classification: 'ADVISORY' as const,
    evidenceTimestamp: '2026-07-22T12:00:00Z',
    order: 1,
    applicable: true,
    nextAction: null,
  });
  return Object.freeze({
    identity: Object.freeze({
      readinessContractVersion: 'ready_to_start_v1',
      tenantId: 'tenant-1',
      journeyProjectionIdentity: Object.freeze({
        templateVersion: 'template-v1',
        capabilityRevision: 'cap-v1:revision',
      }),
      providerSetRevision: 'providers-v1',
      evidenceRevision: 'evidence-v1',
    }),
    state,
    providers: Object.freeze([
      Object.freeze({
        providerId: 'journey_setup_progress',
        providerVersion: '1',
        providerOrder: 0,
        applicable: true,
        state,
        outcome: state === 'READY' ? 'SATISFIED' as const : 'BLOCKER' as const,
        evidenceRevision: 'journey-v1',
        observedAt: '2026-07-22T12:00:00Z',
        severity: `${tokenRoot}.journey_setup_progress.severity`,
        explanationToken: `${tokenRoot}.journey_setup_progress.${state.toLowerCase()}`,
        nextAction: null,
      }),
    ]),
    checklist: Object.freeze([complete, blocker, advisory]),
    blockers: Object.freeze([blocker]),
    advisories: Object.freeze([advisory]),
    evaluatedAt: '2026-07-22T12:00:00Z',
    authorizesHandoff: state === 'READY',
  });
};

const presentation = (data: ReadyToStart | undefined = aggregate()) => ({
  data,
  error: null,
  loading: false,
  refreshing: false,
  refresh,
  revalidateTenant,
  scopeMatches: true,
});

const renderScreen = (props: Partial<React.ComponentProps<typeof GoLiveScreen>> = {}) =>
  render(
    <GoLiveScreen
      tenantId="tenant-1"
      onComplete={jest.fn()}
      onNavigateToSetupStep={jest.fn()}
      onOpenWorkspacePreparation={jest.fn()}
      {...props}
    />
  );

describe('Ready to Start presentation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseReadyToStart.mockReturnValue(presentation());
  });

  it.each([
    ['READY', 'Ready'],
    ['NOT_READY', 'Not ready'],
    ['EVALUATING', 'Evaluating'],
    ['UNKNOWN', 'Unknown'],
    ['UNAVAILABLE', 'Unavailable'],
    ['STALE', 'Needs refresh'],
  ] as const)('renders the authoritative %s summary', (state, label) => {
    mockUseReadyToStart.mockReturnValue(presentation(aggregate(state)));
    expect(renderScreen().getByText(label)).toBeTruthy();
  });

  it('preserves backend checklist order and renders complete, blocker, and advisory states', () => {
    const { getAllByRole, getByText } = renderScreen();
    const summaries = getAllByRole('summary');
    expect(summaries
      .map(node => node.props.accessibilityLabel)
      .filter((label): label is string => typeof label === 'string')
      .slice(0, 3)
      .map(label => label.split('.')[0]))
      .toEqual(['Clinic profile', 'Clinic workspace', 'Operating hours']);
    expect(getByText('Complete')).toBeTruthy();
    expect(getByText('Blocking readiness')).toBeTruthy();
    expect(getByText('Advisory')).toBeTruthy();
  });

  it.each([
    ['EVALUATING', 'Being evaluated'],
    ['UNKNOWN', 'Unknown'],
    ['UNAVAILABLE', 'Unavailable'],
    ['STALE', 'Needs refresh'],
  ] as const)('renders %s checklist status without synthesizing items', (status, label) => {
    const base = aggregate();
    mockUseReadyToStart.mockReturnValue(presentation(Object.freeze({
      ...base,
      checklist: Object.freeze([{ ...base.checklist[0], status, classification: 'BLOCKER' as const }]),
      blockers: Object.freeze([]),
      advisories: Object.freeze([]),
    })));
    expect(renderScreen().getByText(label)).toBeTruthy();
  });

  it('uses loading and refreshing accessibility semantics and pull-to-refresh', async () => {
    mockUseReadyToStart.mockReturnValue({ ...presentation(undefined), loading: true });
    expect(renderScreen().getByLabelText('Checking whether your clinic is ready...'))
      .toHaveProp('accessibilityState', { busy: true });

    mockUseReadyToStart.mockReturnValue({ ...presentation(), refreshing: true });
    const refreshed = renderScreen();
    expect(refreshed.getByText('Refreshing clinic readiness...')).toBeTruthy();
    const scroll = refreshed.getByLabelText('Clinic readiness checklist');
    await act(async () => scroll.props.refreshControl.props.onRefresh());
    expect(refresh).toHaveBeenCalled();
  });

  it('delegates an allowlisted action after tenant revalidation and prevents duplicate clicks', async () => {
    let resolveScope: ((value: boolean) => void) | undefined;
    revalidateTenant.mockImplementationOnce(
      () => new Promise<boolean>(resolve => { resolveScope = resolve; })
    );
    const openWorkspace = jest.fn();
    const { getByLabelText } = renderScreen({ onOpenWorkspacePreparation: openWorkspace });
    const action = getByLabelText('Open workspace preparation');

    fireEvent.press(action);
    fireEvent.press(action);
    expect(revalidateTenant).toHaveBeenCalledTimes(1);
    await act(async () => resolveScope?.(true));
    await waitFor(() => expect(openWorkspace).toHaveBeenCalledTimes(1));
  });

  it('disables unsupported mutation actions and non-ready handoff', () => {
    const base = aggregate();
    const retryAction = {
      ...base.checklist[1],
      nextAction: {
        ...base.checklist[1].nextAction!,
        actionId: 'readiness.retry_workspace_preparation',
        labelToken: `${tokenRoot}.workspace_preparation.actions.retry`,
        kind: 'RETRY' as const,
        targetId: 'workspace_preparation.retry',
      },
    };
    mockUseReadyToStart.mockReturnValue(presentation(Object.freeze({
      ...base,
      checklist: Object.freeze([retryAction]),
    })));
    const { getByLabelText } = renderScreen();
    expect(getByLabelText('Retry workspace preparation')).toHaveProp(
      'accessibilityState',
      { disabled: true, busy: false }
    );
    expect(getByLabelText('Continue to clinic workspace')).toHaveProp(
      'accessibilityState',
      { disabled: true, busy: false }
    );
  });

  it('hands off only an authoritative READY result after tenant revalidation', async () => {
    const onComplete = jest.fn();
    mockUseReadyToStart.mockReturnValue(presentation(aggregate('READY')));
    const { getByLabelText } = renderScreen({ onComplete });
    await act(async () => fireEvent.press(getByLabelText('Continue to clinic workspace')));
    expect(revalidateTenant).toHaveBeenCalled();
    expect(onComplete).toHaveBeenCalled();
  });

  it.each([
    ['UNAUTHORIZED', 'Please sign in again to check clinic readiness.'],
    ['FORBIDDEN', 'You do not have permission to view readiness for this clinic.'],
    ['TENANT_MISMATCH', 'The selected clinic changed. Return to the current clinic and check again.'],
    ['STALE_PROJECTION', 'Readiness changed while it was loading. Check again for the latest result.'],
    ['READINESS_UNAVAILABLE', 'Clinic readiness is temporarily unavailable. Please check again.'],
    ['BACKEND_FAILURE', 'Clinic readiness could not be loaded. Please try again.'],
  ] as const)('renders safe localized %s errors and retry', async (kind, message) => {
    mockUseReadyToStart.mockReturnValue({
      ...presentation(undefined),
      error: new ReadyToStartError(
        kind,
        'safe.code',
        'safe.token',
        false
      ),
    });
    const { getByText } = renderScreen();
    expect(getByText(message)).toBeTruthy();
    await act(async () => fireEvent.press(getByText('Check again')));
    expect(refresh).toHaveBeenCalled();
  });

  it('keeps English and Hindi presentation/provider keys and placeholders in parity', () => {
    const english = {
      presentation: enUS.onboarding.progressiveExperience.readyToStart.presentation,
      providers: enUS.onboarding.progressive_experience.ready_to_start.providers,
    };
    const hindi = {
      presentation: hiIN.onboarding.progressiveExperience.readyToStart.presentation,
      providers: hiIN.onboarding.progressive_experience.ready_to_start.providers,
    };
    const flatten = (value: unknown, prefix = '', output: Record<string, string> = {}) => {
      Object.entries(value as Record<string, unknown>).forEach(([key, nested]) => {
        const path = prefix ? `${prefix}.${key}` : key;
        if (typeof nested === 'string') output[path] = nested;
        else flatten(nested, path, output);
      });
      return output;
    };
    const en = flatten(english);
    const hi = flatten(hindi);
    expect(Object.keys(hi).sort()).toEqual(Object.keys(en).sort());
    const placeholders = (value: string) => value.match(/{{[^}]+}}/g)?.sort() ?? [];
    Object.keys(en).forEach(key => expect(placeholders(hi[key])).toEqual(placeholders(en[key])));
  });
});

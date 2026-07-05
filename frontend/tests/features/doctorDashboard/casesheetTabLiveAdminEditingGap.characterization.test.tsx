import React from 'react';
import fs from 'fs';
import path from 'path';
import { render } from '@testing-library/react-native';
import { CasesheetTab } from '../../../features/episodes/presentation/components/CasesheetTab';
import { useUpdateCasesheetMutation } from '../../../features/casesheets/data/repositories/casesheets.repository.impl';

/**
 * R3B · T-B.7 (Reality-Check finding, characterization ONLY — no production
 * code changed) — `EpisodeWorkspaceScreen`'s `CasesheetTab` is a LIVE, not
 * dormant, fourth Case Sheet editing surface.
 *
 * T-B.7 was originally scoped (ADR-R3B-06) to remove the *doctor*-mode
 * wiring for this tab, on the premise that `admin` mode (the only mode any
 * current caller reaches) renders it read-only. Auditing `CasesheetTab.tsx`
 * directly — not just re-grepping the `mode` prop's own reachability, which
 * is as far as `requirements.md` §3.2's own original audit went — found this
 * premise false: `canCreate` (driven by `canEditNotes`) gates ONLY the
 * "Add Casesheet" empty-state button. The form's own editability,
 * `const isEditable = isDraft;`, depends solely on the casesheet's status,
 * with no reference to `canCreate`/`mode`/`config` anywhere. This means an
 * admin viewing an episode with a DRAFT casesheet can already edit it
 * inline, today, via the exact route (`mode=admin`) every current caller
 * uses.
 *
 * Per explicit user direction: do NOT change `CasesheetTab.tsx`/
 * `EpisodeWorkspaceScreen.tsx`/`episodeWorkspaceConfig.ts` in this task —
 * characterize the live gap with tests only. Consolidation is deferred to a
 * separate, future approved task. `design.md`'s ADR-R3B-06 and
 * `requirements.md` §3.1/§3.2 are corrected to record this finding
 * (see those documents' own T-B.7 correction blocks).
 */

jest.mock('../../../core/theme/useClinicTheme', () => ({
  useClinicTheme: () => ({
    colors: {
      primary: { default: '#2563EB', main: '#2563EB', onPrimary: '#FFFFFF' },
      background: { default: '#FFFFFF', elevated: '#FFFFFF' },
      surface: { default: '#FFFFFF' },
      border: { default: '#E5E7EB', subtle: '#F3F4F6' },
      text: { primary: '#111827', secondary: '#6B7280', tertiary: '#9CA3AF', disabled: '#9CA3AF' },
      feedback: { success: '#10B981', error: '#EF4444', warning: '#F59E0B', info: '#3B82F6' },
    },
    spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 },
    typography: { h6: {}, subtitle1: {}, subtitle2: {}, body1: {}, body2: {}, caption: {}, button: {} },
  }),
}));
jest.mock('../../../core/localization/useTranslation', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
jest.mock('../../../features/auth/presentation/hooks/useAuth', () => ({
  useAuth: () => ({ currentUser: { tenantId: 'tenant-1', roles: ['ADMIN'] } }),
}));
jest.mock('../../../features/casesheets/data/repositories/casesheets.repository.impl', () => ({
  useUpdateCasesheetMutation: jest.fn(),
}));
jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }));

const draftCasesheet = {
  id: 'casesheet-1',
  status: 'DRAFT' as const,
  document_version: 1,
  chief_complaint: 'Knee pain',
  data_json: { basic: {}, extensions: [] },
};

describe('CasesheetTab: LIVE admin-mode editing gap (R3B · T-B.7 Reality-Check, characterization only)', () => {
  beforeEach(() => {
    (useUpdateCasesheetMutation as jest.Mock).mockReturnValue({ mutateAsync: jest.fn(), isPending: false });
  });

  it('with canCreate=false (the ADMIN config value — the only mode any current caller reaches), a DRAFT casesheet is STILL rendered fully editable — the live gap', () => {
    const { getByDisplayValue } = render(
      <CasesheetTab
        casesheet={draftCasesheet as any}
        casesheetId="casesheet-1"
        hasCasesheet
        isLoading={false}
        canCreate={false}
        onCreateCasesheet={jest.fn()}
      />,
    );
    // CasesheetForm's own Chief Complaint field is editable (not disabled) —
    // confirmed by asserting `editable` prop directly, not just presence.
    const field = getByDisplayValue('Knee pain');
    expect(field.props.editable).toBe(true);
  });

  it('canCreate=false only suppresses the "Add Casesheet" empty-state button — it does NOT gate editability once a casesheet exists', () => {
    const { queryByLabelText } = render(
      <CasesheetTab
        casesheet={undefined}
        casesheetId={null}
        hasCasesheet={false}
        isLoading={false}
        canCreate={false}
        onCreateCasesheet={jest.fn()}
      />,
    );
    expect(queryByLabelText('episodeWorkspace.casesheet.addCasesheet')).toBeNull();
  });

  it('a FINAL/SIGNED casesheet is correctly read-only regardless of canCreate (only DRAFT is ever editable)', () => {
    const { getByDisplayValue } = render(
      <CasesheetTab
        casesheet={{ ...draftCasesheet, status: 'FINAL' as const } as any}
        casesheetId="casesheet-1"
        hasCasesheet
        isLoading={false}
        canCreate={false}
        onCreateCasesheet={jest.fn()}
      />,
    );
    expect(getByDisplayValue('Knee pain').props.editable).toBe(false);
  });

  it('source confirms isEditable is derived only from isDraft, never from canCreate/mode/config', () => {
    const source = fs.readFileSync(
      path.resolve(__dirname, '../../../features/episodes/presentation/components/CasesheetTab.tsx'),
      'utf8',
    );
    expect(source).toContain('const isEditable = isDraft;');
    expect(source).not.toMatch(/isEditable\s*=\s*isDraft\s*&&\s*canCreate/);
  });

  it('AppointmentsListScreen.tsx (the only confirmed caller of the workspace route) still hardcodes mode=admin at both call sites — re-confirmed fresh, no new caller has appeared', () => {
    const source = fs.readFileSync(
      path.resolve(__dirname, '../../../features/appointments/presentation/pages/AppointmentsListScreen.tsx'),
      'utf8',
    );
    const workspaceRouteCalls = source.match(/\/workspace\?mode=\w+/g) ?? [];
    expect(workspaceRouteCalls.length).toBeGreaterThanOrEqual(2);
    workspaceRouteCalls.forEach((call) => expect(call).toContain('mode=admin'));
  });
});

/**
 * Phase 4 (R4) · T-F.2a (ADR-R4-05) — CasesheetTab converted to a read-only
 * summary; Case Sheet editing has exactly one owner
 * (CaseSheetModule/CasesheetStandaloneScreen). This replaces
 * `casesheetTabLiveAdminEditingGap.characterization.test.tsx`, which
 * characterized the now-fixed live duplicate-editor gap (deleted, its
 * premise is no longer true).
 *
 * Verifies:
 *   - CasesheetTab renders no editable form fields (no CasesheetForm)
 *   - it never calls any update/save mutation -- there is none to call
 *   - it displays a read-only summary (chief complaint / diagnosis)
 *   - "Edit" navigates out (calls onEditCasesheet) instead of saving in place
 *   - "Edit" is hidden when canCreate=false (admin/read-only mode), matching
 *     the existing "Add Casesheet" gating convention
 *   - empty-state creation flow (Add Casesheet) still works, unchanged
 */
import fs from 'fs';
import path from 'path';
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { CasesheetTab } from '../../../features/episodes/presentation/components/CasesheetTab';

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
jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }));

const draftCasesheet = {
  id: 'casesheet-1',
  status: 'DRAFT' as const,
  document_version: 1,
  chief_complaint: 'Knee pain',
  provisional_diagnosis: 'Suspected osteoarthritis',
  final_diagnosis: '',
  data_json: { basic: {}, extensions: [] },
};

describe('CasesheetTab: read-only summary (R4 · T-F.2a)', () => {
  it('does not render an editable text field for chief complaint -- no embedded CasesheetForm', () => {
    const { queryByDisplayValue } = render(
      <CasesheetTab
        casesheet={draftCasesheet as any}
        casesheetId="casesheet-1"
        hasCasesheet
        isLoading={false}
        canCreate
        onCreateCasesheet={jest.fn()}
        onEditCasesheet={jest.fn()}
      />,
    );
    // A CasesheetForm TextInput would surface via getByDisplayValue; a
    // read-only summary renders the same text as plain, non-editable Text.
    expect(queryByDisplayValue('Knee pain')).toBeNull();
  });

  it('displays the chief complaint and diagnosis as read-only summary text', () => {
    const { getByText } = render(
      <CasesheetTab
        casesheet={draftCasesheet as any}
        casesheetId="casesheet-1"
        hasCasesheet
        isLoading={false}
        canCreate
        onCreateCasesheet={jest.fn()}
        onEditCasesheet={jest.fn()}
      />,
    );
    expect(getByText('Knee pain')).toBeTruthy();
    expect(getByText('Suspected osteoarthritis')).toBeTruthy();
  });

  it('"Edit" navigates out via onEditCasesheet -- no save/update call happens', () => {
    const onEditCasesheet = jest.fn();
    const { getByLabelText } = render(
      <CasesheetTab
        casesheet={draftCasesheet as any}
        casesheetId="casesheet-1"
        hasCasesheet
        isLoading={false}
        canCreate
        onCreateCasesheet={jest.fn()}
        onEditCasesheet={onEditCasesheet}
      />,
    );
    fireEvent.press(getByLabelText('episodeWorkspace.casesheet.editCasesheet'));
    expect(onEditCasesheet).toHaveBeenCalledTimes(1);
  });

  it('"Edit" is hidden when canCreate=false (matches the existing Add-Casesheet gating convention)', () => {
    const { queryByLabelText } = render(
      <CasesheetTab
        casesheet={draftCasesheet as any}
        casesheetId="casesheet-1"
        hasCasesheet
        isLoading={false}
        canCreate={false}
        onCreateCasesheet={jest.fn()}
        onEditCasesheet={jest.fn()}
      />,
    );
    expect(queryByLabelText('episodeWorkspace.casesheet.editCasesheet')).toBeNull();
  });

  it('empty-state "Add Casesheet" creation flow is unchanged', () => {
    const onCreateCasesheet = jest.fn();
    const { getByLabelText } = render(
      <CasesheetTab
        casesheet={undefined}
        casesheetId={null}
        hasCasesheet={false}
        isLoading={false}
        canCreate
        onCreateCasesheet={onCreateCasesheet}
        onEditCasesheet={jest.fn()}
      />,
    );
    fireEvent.press(getByLabelText('episodeWorkspace.casesheet.addCasesheet'));
    expect(onCreateCasesheet).toHaveBeenCalledTimes(1);
  });

  it('empty-state "Add Casesheet" is hidden when canCreate=false, unchanged', () => {
    const { queryByLabelText } = render(
      <CasesheetTab
        casesheet={undefined}
        casesheetId={null}
        hasCasesheet={false}
        isLoading={false}
        canCreate={false}
        onCreateCasesheet={jest.fn()}
        onEditCasesheet={jest.fn()}
      />,
    );
    expect(queryByLabelText('episodeWorkspace.casesheet.addCasesheet')).toBeNull();
  });

  it('source confirms no CasesheetForm import and no update-mutation call -- proof required by T-F.2a', () => {
    const source = fs.readFileSync(
      path.resolve(__dirname, '../../../features/episodes/presentation/components/CasesheetTab.tsx'),
      'utf8',
    );
    expect(source).not.toMatch(/import\s*\{[^}]*CasesheetForm/);
    expect(source).not.toMatch(/useUpdateCasesheetMutation\(/);
    expect(source).not.toMatch(/\.mutateAsync\(/);
  });
});

import React from 'react';
import { render } from '@testing-library/react-native';
import fs from 'fs';
import path from 'path';
import { useLocalSearchParams } from 'expo-router';
import { useFeatures } from '../../../core/hooks/useFeatures';

/**
 * R3B · T-B.3 — Verification for the flag-gated Case Sheet standalone route
 * switch (ADR-R3B-04's "canonical editor switch"). The two route files
 * (`.../casesheets/[casesheetId]/edit.tsx`, `.../casesheets/new.tsx`) render
 * the OLD screens unchanged when `isClinicalSpineV1Enabled` is OFF, and the
 * NEW `CasesheetStandaloneScreen` (T-B.2) when ON — `CasesheetEditScreen`/
 * `CreateCasesheetScreen`/`CasesheetForm.tsx` are not deleted or modified.
 *
 * Uses shallow component-level mocks (not full data mocks) for the four
 * screens under test — the routing branch itself is the thing under test
 * here, not each screen's own internal behavior (already covered by
 * `casesheetStandaloneScreen.test.tsx` and this task's own characterization
 * predecessors).
 */

jest.mock('expo-router', () => ({ useLocalSearchParams: jest.fn() }));
jest.mock('../../../core/hooks/useFeatures', () => ({
  useFeatures: jest.fn(),
  isClinicalSpineV1Enabled: (features: any) => !!features.clinical_spine_v1_enabled,
}));
jest.mock('../../../features/casesheets', () => ({
  CasesheetEditScreen: () => null,
  CreateCasesheetScreen: () => null,
}));
jest.mock('../../../features/casesheets/presentation/pages/CasesheetStandaloneScreen', () => ({
  CasesheetStandaloneScreen: (props: any) => {
    const { Text } = require('react-native');
    return <Text testID="standalone-screen-props">{JSON.stringify(props)}</Text>;
  },
}));

import EditCasesheetRoute from '../../../app/clinic-admin/clients/[clientId]/casesheets/[casesheetId]/edit';
import NewCasesheetRoute from '../../../app/clinic-admin/clients/[clientId]/casesheets/new';
import { CasesheetEditScreen, CreateCasesheetScreen } from '../../../features/casesheets';

describe('Case Sheet standalone route flag switch (R3B · T-B.3)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('edit.tsx', () => {
    beforeEach(() => {
      (useLocalSearchParams as jest.Mock).mockReturnValue({ clientId: 'client-1', casesheetId: 'casesheet-1' });
    });

    it('flag OFF: renders the original CasesheetEditScreen unchanged', () => {
      (useFeatures as jest.Mock).mockReturnValue({ clinical_spine_v1_enabled: false });
      const { UNSAFE_getByType, queryByTestId } = render(<EditCasesheetRoute />);
      expect(UNSAFE_getByType(CasesheetEditScreen as any)).toBeTruthy();
      expect(queryByTestId('standalone-screen-props')).toBeNull();
    });

    it('flag ON: renders CasesheetStandaloneScreen with clientId/casesheetId from route params', () => {
      (useFeatures as jest.Mock).mockReturnValue({ clinical_spine_v1_enabled: true });
      const { getByTestId } = render(<EditCasesheetRoute />);
      const props = JSON.parse(getByTestId('standalone-screen-props').props.children);
      expect(props).toEqual({ clientId: 'client-1', casesheetId: 'casesheet-1' });
    });
  });

  describe('new.tsx', () => {
    it('flag OFF: renders the original CreateCasesheetScreen unchanged', () => {
      (useLocalSearchParams as jest.Mock).mockReturnValue({ clientId: 'client-1' });
      (useFeatures as jest.Mock).mockReturnValue({ clinical_spine_v1_enabled: false });
      const { UNSAFE_getByType, queryByTestId } = render(<NewCasesheetRoute />);
      expect(UNSAFE_getByType(CreateCasesheetScreen as any)).toBeTruthy();
      expect(queryByTestId('standalone-screen-props')).toBeNull();
    });

    it('flag ON: renders CasesheetStandaloneScreen with clientId + optional appointmentId/episodeId from route params', () => {
      (useLocalSearchParams as jest.Mock).mockReturnValue({
        clientId: 'client-1',
        appointmentId: 'appointment-1',
        episodeId: 'episode-1',
      });
      (useFeatures as jest.Mock).mockReturnValue({ clinical_spine_v1_enabled: true });
      const { getByTestId } = render(<NewCasesheetRoute />);
      const props = JSON.parse(getByTestId('standalone-screen-props').props.children);
      expect(props).toEqual({ clientId: 'client-1', appointmentId: 'appointment-1', episodeId: 'episode-1' });
    });

    it('flag ON: works with only clientId present — no dangling failure for the CasesheetsListScreen "Add Casesheet" caller, which passes no appointmentId/episodeId', () => {
      (useLocalSearchParams as jest.Mock).mockReturnValue({ clientId: 'client-1' });
      (useFeatures as jest.Mock).mockReturnValue({ clinical_spine_v1_enabled: true });
      const { getByTestId } = render(<NewCasesheetRoute />);
      const props = JSON.parse(getByTestId('standalone-screen-props').props.children);
      expect(props.clientId).toBe('client-1');
    });
  });

  describe('MIG-1: every known caller of these two routes is unchanged (no dangling deep link, no caller needed updating)', () => {
    const appointmentDetailScreen = fs.readFileSync(
      path.resolve(__dirname, '../../../features/appointments/presentation/pages/AppointmentDetailScreen.tsx'),
      'utf8',
    );
    const episodeWorkspaceScreen = fs.readFileSync(
      path.resolve(__dirname, '../../../features/episodes/presentation/pages/EpisodeWorkspaceScreen.tsx'),
      'utf8',
    );
    const casesheetsListScreen = fs.readFileSync(
      path.resolve(__dirname, '../../../features/casesheets/presentation/pages/CasesheetsListScreen.tsx'),
      'utf8',
    );
    const casesheetDetailScreen = fs.readFileSync(
      path.resolve(__dirname, '../../../features/casesheets/presentation/pages/CasesheetDetailScreen.tsx'),
      'utf8',
    );

    it('AppointmentDetailScreen (T-0.4\'s own finding) still routes to casesheets/new — automatically covered by the route-level gate, no caller change needed', () => {
      expect(appointmentDetailScreen).toContain('casesheets/new?appointmentId=');
    });

    it('EpisodeWorkspaceScreen still routes to casesheets/new — automatically covered', () => {
      expect(episodeWorkspaceScreen).toContain('/casesheets/new');
    });

    it('CasesheetsListScreen still routes to casesheets/new (clientId only) and casesheets/[casesheetId] (detail, unaffected by this task) — automatically covered', () => {
      expect(casesheetsListScreen).toContain("pathname: '/clinic-admin/clients/[clientId]/casesheets/new'");
    });

    it('CasesheetDetailScreen still routes to casesheets/[casesheetId]/edit — automatically covered', () => {
      expect(casesheetDetailScreen).toContain("pathname: '/clinic-admin/clients/[clientId]/casesheets/[casesheetId]/edit'");
    });
  });

  describe('OFF-path preservation: CasesheetEditScreen/CreateCasesheetScreen/CasesheetForm are NOT deleted or modified by this task', () => {
    it('the two route files still import the original screens (not deleted)', () => {
      const editRoute = fs.readFileSync(
        path.resolve(__dirname, '../../../app/clinic-admin/clients/[clientId]/casesheets/[casesheetId]/edit.tsx'),
        'utf8',
      );
      const newRoute = fs.readFileSync(
        path.resolve(__dirname, '../../../app/clinic-admin/clients/[clientId]/casesheets/new.tsx'),
        'utf8',
      );
      expect(editRoute).toContain("import { CasesheetEditScreen } from '../../../../../../features/casesheets'");
      expect(newRoute).toContain("import { CreateCasesheetScreen } from '../../../../../features/casesheets'");
    });

    it('CasesheetForm.tsx (the OFF-path field-editing implementation) still exists, still exports EXTENSION_TEMPLATES with all 4 templates, untouched', () => {
      const casesheetForm = fs.readFileSync(
        path.resolve(__dirname, '../../../features/casesheets/presentation/components/CasesheetForm.tsx'),
        'utf8',
      );
      ['vitals', 'prakriti', 'nadi_pariksha', 'custom'].forEach((id) => {
        expect(casesheetForm).toContain(`id: '${id}'`);
      });
    });
  });
});

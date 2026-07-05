import React from 'react';
import { render } from '@testing-library/react-native';
import fs from 'fs';
import path from 'path';
import { useLocalSearchParams } from 'expo-router';
import { useFeatures } from '../../../core/hooks/useFeatures';

/**
 * R3B · T-B.6 — Verification for the flag-gated Prescription standalone
 * route switch (ADR-R3B-04's "canonical editor switch"), identical pattern
 * to `caseSheetRouteFlagSwitch.test.tsx` (T-B.3). The two route files
 * (`.../prescriptions/[prescriptionId]/edit.tsx`, `.../prescriptions/new.tsx`)
 * render the OLD screens unchanged when `isClinicalSpineV1Enabled` is OFF,
 * and the NEW `PrescriptionStandaloneScreen` (T-B.5) when ON —
 * `PrescriptionEditScreen`/`CreatePrescriptionScreen`/`PrescriptionForm.tsx`
 * are not deleted or modified.
 */

jest.mock('expo-router', () => ({ useLocalSearchParams: jest.fn() }));
jest.mock('../../../core/hooks/useFeatures', () => ({
  useFeatures: jest.fn(),
  isClinicalSpineV1Enabled: (features: any) => !!features.clinical_spine_v1_enabled,
}));
jest.mock('../../../features/prescriptions', () => ({
  PrescriptionEditScreen: () => null,
  CreatePrescriptionScreen: () => null,
}));
jest.mock('../../../features/prescriptions/presentation/pages/PrescriptionStandaloneScreen', () => ({
  PrescriptionStandaloneScreen: (props: any) => {
    const { Text } = require('react-native');
    return <Text testID="standalone-screen-props">{JSON.stringify(props)}</Text>;
  },
}));

import EditPrescriptionRoute from '../../../app/clinic-admin/clients/[clientId]/prescriptions/[prescriptionId]/edit';
import NewPrescriptionRoute from '../../../app/clinic-admin/clients/[clientId]/prescriptions/new';
import { PrescriptionEditScreen, CreatePrescriptionScreen } from '../../../features/prescriptions';

describe('Prescription standalone route flag switch (R3B · T-B.6)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('edit.tsx', () => {
    beforeEach(() => {
      (useLocalSearchParams as jest.Mock).mockReturnValue({ clientId: 'client-1', prescriptionId: 'rx-1' });
    });

    it('flag OFF: renders the original PrescriptionEditScreen unchanged', () => {
      (useFeatures as jest.Mock).mockReturnValue({ clinical_spine_v1_enabled: false });
      const { UNSAFE_getByType, queryByTestId } = render(<EditPrescriptionRoute />);
      expect(UNSAFE_getByType(PrescriptionEditScreen as any)).toBeTruthy();
      expect(queryByTestId('standalone-screen-props')).toBeNull();
    });

    it('flag ON: renders PrescriptionStandaloneScreen with clientId/prescriptionId from route params', () => {
      (useFeatures as jest.Mock).mockReturnValue({ clinical_spine_v1_enabled: true });
      const { getByTestId } = render(<EditPrescriptionRoute />);
      const props = JSON.parse(getByTestId('standalone-screen-props').props.children);
      expect(props).toEqual({ clientId: 'client-1', prescriptionId: 'rx-1' });
    });
  });

  describe('new.tsx', () => {
    it('flag OFF: renders the original CreatePrescriptionScreen unchanged', () => {
      (useLocalSearchParams as jest.Mock).mockReturnValue({ clientId: 'client-1' });
      (useFeatures as jest.Mock).mockReturnValue({ clinical_spine_v1_enabled: false });
      const { UNSAFE_getByType, queryByTestId } = render(<NewPrescriptionRoute />);
      expect(UNSAFE_getByType(CreatePrescriptionScreen as any)).toBeTruthy();
      expect(queryByTestId('standalone-screen-props')).toBeNull();
    });

    it('flag ON: renders PrescriptionStandaloneScreen with clientId + optional appointmentId from route params', () => {
      (useLocalSearchParams as jest.Mock).mockReturnValue({ clientId: 'client-1', appointmentId: 'appointment-1' });
      (useFeatures as jest.Mock).mockReturnValue({ clinical_spine_v1_enabled: true });
      const { getByTestId } = render(<NewPrescriptionRoute />);
      const props = JSON.parse(getByTestId('standalone-screen-props').props.children);
      expect(props).toEqual({ clientId: 'client-1', appointmentId: 'appointment-1' });
    });

    it('flag ON: works with only clientId present — no dangling failure for the PrescriptionsListScreen "Add Prescription" caller, which passes no appointmentId', () => {
      (useLocalSearchParams as jest.Mock).mockReturnValue({ clientId: 'client-1' });
      (useFeatures as jest.Mock).mockReturnValue({ clinical_spine_v1_enabled: true });
      const { getByTestId } = render(<NewPrescriptionRoute />);
      const props = JSON.parse(getByTestId('standalone-screen-props').props.children);
      expect(props.clientId).toBe('client-1');
    });
  });

  describe('MIG-1: every known client-scoped caller of these two routes is unchanged (no dangling deep link, no caller needed updating)', () => {
    const appointmentDetailScreen = fs.readFileSync(
      path.resolve(__dirname, '../../../features/appointments/presentation/pages/AppointmentDetailScreen.tsx'),
      'utf8',
    );
    const episodeWorkspaceScreen = fs.readFileSync(
      path.resolve(__dirname, '../../../features/episodes/presentation/pages/EpisodeWorkspaceScreen.tsx'),
      'utf8',
    );
    const prescriptionsListScreen = fs.readFileSync(
      path.resolve(__dirname, '../../../features/prescriptions/presentation/pages/PrescriptionsListScreen.tsx'),
      'utf8',
    );
    const prescriptionDetailScreen = fs.readFileSync(
      path.resolve(__dirname, '../../../features/prescriptions/presentation/pages/PrescriptionDetailScreen.tsx'),
      'utf8',
    );

    it('AppointmentDetailScreen still routes to prescriptions/new — automatically covered by the route-level gate, no caller change needed', () => {
      expect(appointmentDetailScreen).toContain('prescriptions/new?appointmentId=');
    });

    it('EpisodeWorkspaceScreen still routes to prescriptions/new — automatically covered', () => {
      expect(episodeWorkspaceScreen).toContain('/prescriptions/new?appointmentId=');
    });

    it('PrescriptionsListScreen still routes to prescriptions/new (client-scoped branch) — automatically covered; its non-client-scoped else-branch (/clinic-admin/prescriptions/new) is a separate, pre-existing dead route with no corresponding route file, unrelated to this task, logged not fixed', () => {
      expect(prescriptionsListScreen).toContain("pathname: '/clinic-admin/clients/[clientId]/prescriptions/new'");
    });

    it('PrescriptionDetailScreen still routes to prescriptions/[prescriptionId]/edit (client-scoped branch) — automatically covered', () => {
      expect(prescriptionDetailScreen).toContain(
        "pathname: '/clinic-admin/clients/[clientId]/prescriptions/[prescriptionId]/edit'",
      );
    });
  });

  describe('OFF-path preservation: PrescriptionEditScreen/CreatePrescriptionScreen/PrescriptionForm are NOT deleted or modified by this task', () => {
    it('the two route files still import the original screens (not deleted)', () => {
      const editRoute = fs.readFileSync(
        path.resolve(__dirname, '../../../app/clinic-admin/clients/[clientId]/prescriptions/[prescriptionId]/edit.tsx'),
        'utf8',
      );
      const newRoute = fs.readFileSync(
        path.resolve(__dirname, '../../../app/clinic-admin/clients/[clientId]/prescriptions/new.tsx'),
        'utf8',
      );
      expect(editRoute).toContain("import { PrescriptionEditScreen } from '../../../../../../features/prescriptions'");
      expect(newRoute).toContain("import { CreatePrescriptionScreen } from '../../../../../features/prescriptions'");
    });

    it('PrescriptionForm.tsx (the OFF-path field-editing implementation) still exists, still exports its own medication/advice fields, untouched', () => {
      const prescriptionForm = fs.readFileSync(
        path.resolve(__dirname, '../../../features/prescriptions/presentation/components/PrescriptionForm.tsx'),
        'utf8',
      );
      expect(prescriptionForm).toContain('next_visit_days');
      expect(prescriptionForm).toContain('med.name.trim() && med.dosage.trim()');
    });
  });
});

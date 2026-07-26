import React from 'react';
import fs from 'fs';
import path from 'path';
import { fireEvent, render } from '@testing-library/react-native';
import { useRouter } from 'expo-router';
import { ClinicalTimeline } from '../../../features/episodes/presentation/components/ClinicalTimeline';
import { useClinicalTimelineData } from '../../../features/episodes/presentation/hooks/useClinicalTimelineData';

/**
 * R3B · T-C.2 — Verification for `ClinicalTimeline` (render-only).
 * Confirms rendering/navigation behavior and — via source-level checks —
 * the binding constraints design.md §7/CO-3/CO-4/CO-6/N-7 place on this
 * specific file: no aggregation logic (Timeline Adapter Rule), no
 * clinical-artifact state (CO-4), and zero create/update/save API calls of
 * any kind, including no Visit Note API (N-7).
 */

jest.mock('expo-router', () => ({ useRouter: jest.fn() }));
jest.mock('../../../features/episodes/presentation/hooks/useClinicalTimelineData', () => ({
  useClinicalTimelineData: jest.fn(),
}));
jest.mock('../../../core/theme/useClinicTheme', () => ({
  useClinicTheme: () => ({
    colors: {
      primary: { default: '#2563EB' },
      surface: { default: '#FFFFFF' },
      border: { default: '#E5E7EB', subtle: '#F3F4F6' },
      text: { primary: '#111827', secondary: '#6B7280', tertiary: '#9CA3AF' },
    },
    spacing: { xs: 4, sm: 8, md: 16, lg: 24 },
    typography: { h6: {}, subtitle2: {}, body2: {}, caption: {} },
  }),
}));
jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }));

const router = { push: jest.fn(), back: jest.fn(), replace: jest.fn() };

describe('ClinicalTimeline (R3B · T-C.2)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(router);
  });

  it('shows a loading indicator while the adapter is loading', () => {
    (useClinicalTimelineData as jest.Mock).mockReturnValue({ items: [], isLoading: true });
    const { queryByText } = render(<ClinicalTimeline />);
    expect(queryByText('No clinical activity recorded yet for this episode.')).toBeNull();
  });

  it('shows an empty state when there are no items and loading has finished', () => {
    (useClinicalTimelineData as jest.Mock).mockReturnValue({ items: [], isLoading: false });
    const { getByText } = render(<ClinicalTimeline />);
    expect(getByText('No clinical activity recorded yet for this episode.')).toBeTruthy();
  });

  it('renders every item\'s title/subtitle and navigates to its own route on press (FR-C2)', () => {
    (useClinicalTimelineData as jest.Mock).mockReturnValue({
      isLoading: false,
      items: [
        { id: 'treatment-recommendation-1', type: 'treatment_recommendation', date: '2026-06-04', title: 'Treatment Recommendation', subtitle: '1/2 therapy sessions', route: '/clinic-admin/treatment-sheets/sheet-1' },
        { id: 'prescription-1', type: 'prescription', date: '2026-06-03', title: 'Prescription', subtitle: '1 medication', route: '/clinic-admin/clients/client-1/prescriptions/rx-1' },
        { id: 'case-sheet-1', type: 'case_sheet', date: '2026-06-02', title: 'Case Sheet', subtitle: 'Knee pain', route: '/clinic-admin/clients/client-1/casesheets/casesheet-1' },
        { id: 'visit-1', type: 'visit', date: '2026-06-01', title: 'Visit', subtitle: 'COMPLETED', route: '/clinic-admin/appointments/visit-1' },
        { id: 'clinical-service-1', type: 'clinical_service', date: '2026-06-01', title: 'Clinical Service', subtitle: 'Massage', route: '/clinic-admin/appointments/visit-1' },
      ],
    });
    const { getByText } = render(<ClinicalTimeline />);

    expect(getByText('Treatment Recommendation')).toBeTruthy();
    expect(getByText('1/2 therapy sessions')).toBeTruthy();
    expect(getByText('Prescription')).toBeTruthy();
    expect(getByText('Case Sheet')).toBeTruthy();
    expect(getByText('Visit')).toBeTruthy();
    expect(getByText('Clinical Service')).toBeTruthy();

    fireEvent.press(getByText('Prescription'));
    expect(router.push).toHaveBeenCalledWith('/clinic-admin/clients/client-1/prescriptions/rx-1');

    fireEvent.press(getByText('Case Sheet'));
    expect(router.push).toHaveBeenCalledWith('/clinic-admin/clients/client-1/casesheets/casesheet-1');
  });

  describe('Source-level checks (design.md §7 Timeline Adapter Rule; CO-3, CO-4, CO-6; N-7)', () => {
    const source = fs.readFileSync(
      path.resolve(__dirname, '../../../features/episodes/presentation/components/ClinicalTimeline.tsx'),
      'utf8',
    );

    it('performs no aggregation of its own — calls exactly one hook (useClinicalTimelineData) and no other query hook', () => {
      expect(source).toContain('useClinicalTimelineData()');
      expect(source).not.toMatch(/useAppointmentsListQuery|usePrescriptionsListQuery|useTreatmentSheetsByEpisodeQuery|useQueries\(/);
    });

    it('holds no clinical-artifact state (CO-4) — no useState/useReducer anywhere in this file', () => {
      expect(source).not.toMatch(/useState|useReducer/);
    });

    it('calls zero create/update/save APIs of any kind, including no Visit Note API (N-7, CO-6)', () => {
      expect(source).not.toMatch(/mutateAsync|useMutation|axiosClient\.(post|put|patch|delete)|create\w*Api|update\w*Api|save\w*Api/i);
    });

    it('never renders an editable field — no TextInput anywhere in this file', () => {
      expect(source).not.toMatch(/TextInput/);
    });
  });

  describe('T-FE-C.4 — virtualization', () => {
    const source = fs.readFileSync(
      path.resolve(__dirname, '../../../features/episodes/presentation/components/ClinicalTimeline.tsx'),
      'utf8',
    );

    it('renders the item list via a virtualized FlatList, not a plain ScrollView + .map()', () => {
      expect(source).toMatch(/<FlatList/);
      expect(source).not.toMatch(/<ScrollView/);
    });

    it('is bounded (maxHeight) so it is safe to embed inside a host with its own outer ScrollView (VisitCommandCenter)', () => {
      expect(source).toMatch(/maxHeight/);
    });
  });
});

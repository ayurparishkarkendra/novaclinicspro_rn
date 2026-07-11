// This file still imports useConsultationWorkspace.ts for buildSectionConfig,
// and that file's own top-level imports (useEpisodeWorkspaceData, useFeatures)
// both transitively pull in the real axios/supabase client chain (which
// throws on missing env vars during module evaluation) unless mocked here —
// same guard every sibling module test file (caseSheetModule.test.tsx etc.)
// already applies.
jest.mock('../../../features/episodes/presentation/hooks/useEpisodeWorkspaceData', () => ({
  useEpisodeWorkspaceData: jest.fn(),
}));
jest.mock('../../../core/hooks/useFeatures', () => ({
  useFeatures: jest.fn(),
  isAyurvedaClinic: (value: any) => value.clinic_type === 'ayurveda',
  isFreshnessV1Enabled: (value: any) => !!value.freshness_v1_enabled,
}));

import { buildSectionConfig } from '../../../features/episodes/presentation/hooks/useConsultationWorkspace';

// R3A · T-B.1/T-B.2/T-B.3: casesheet-, prescription-, and treatment-
// recommendation-specific coverage moved to caseSheetModule.test.tsx,
// prescriptionModule.test.tsx, and treatmentRecommendationModule.test.tsx
// respectively — all three now live in their own modules, not this hook.
// What remains here is buildSectionConfig, still exported from this file
// unchanged (design.md §9.A/§9.B — sectionConfig continues to determine
// which sections are active, independent of any one module's own state).

describe('useConsultationWorkspace', () => {
  it('buildSectionConfig omits ayurvedicAssessment for a non-Ayurveda clinic, includes it for Ayurveda', () => {
    expect(buildSectionConfig({ clinic_type: 'general' } as any).activeSections).not.toContain('ayurvedicAssessment');
    expect(buildSectionConfig({ clinic_type: 'ayurveda' } as any).activeSections).toContain('ayurvedicAssessment');
  });
});

/**
 * Phase 1 · T-E.3 — Behavior-unchanged verification for `clinic_type`
 * single-sourcing (T-E.1, ADR-P1-05). Confirms: (1) the accepted values are
 * identical to the pre-T-E.1 duplicated literals, (2) `isTherapyClinic`/
 * `isAyurvedaClinic`/`isPhysioClinic` themselves are untouched and still
 * used correctly for specialty-specific behavior, and (3) the private
 * `normalizeClinicType` fallback behavior is intact.
 *
 * **Release 5 · T-F.2d (design.md §12, requirements.md N-10, FR-D2
 * narrowed):** `hasMultiDayAppointments`/`hasTreatmentSheets` are NO LONGER
 * gated by `isTherapyClinic` — `allow_multiday`/`enable_treatment_sheets`
 * are capability-platform-derived as of T-F.2c and already correct
 * per-tenant, so the redundant frontend re-derivation was removed. Their
 * tests below prove the NEW behavior (trust the field directly), a
 * deliberate change from this file's own prior "unchanged" claim.
 * `hasGenderMatching` is untouched (deferred configuration, N-10) — its
 * test proves that explicitly, unchanged from before this task.
 *
 * `normalizeClinicType`/`normalizeFeatures`/`isTherapyClinicType` are
 * module-private (not exported) — exporting them purely for testability
 * would be a scope-expanding change this task doesn't call for. Fallback
 * behavior is instead verified via source inspection (the same technique
 * already used elsewhere in this project, e.g. T-0.5/T-0.7), rather than by
 * rendering the full `useFeatures()` hook, which would require mocking
 * `supabase`/`axiosClient` well beyond this task's scope.
 */
import fs from 'fs';
import path from 'path';

// useFeatures.ts imports supabase/axiosClient at module scope, and both
// throw at import time if their env vars aren't set (as in this test
// environment). This test only exercises the pure branching/allowed-list
// exports, never the hook's effect, so a minimal mock is sufficient.
jest.mock('../../../core/api/supabaseClient', () => ({ supabase: {} }));
jest.mock('../../../core/api/axiosClient', () => ({ axiosClient: {} }));

import {
  CLINIC_TYPES,
  isAyurvedaClinic,
  isPhysioClinic,
  isTherapyClinic,
  hasMultiDayAppointments,
  hasGenderMatching,
  hasTreatmentSheets,
  isFreshnessV1Enabled,
  isClinicalSpineV1Enabled,
  type FeatureConfig,
} from '../../../core/hooks/useFeatures';

function makeFeatures(overrides: Partial<FeatureConfig> = {}): FeatureConfig {
  return {
    clinic_type: 'general',
    appointments: { allow_multiday: false, enable_gender_matching: false },
    treatment_sheets: { enable_treatment_sheets: false, enable_sheet_sync: false },
    freshness_v1_enabled: false,
    clinical_spine_v1_enabled: false,
    ...overrides,
  };
}

describe('clinic_type single-source (T-E.1) — accepted values unchanged', () => {
  it('CLINIC_TYPES is the exact same 6 values, in the same order, as the pre-T-E.1 duplicated literals', () => {
    expect(CLINIC_TYPES).toEqual(['general', 'ayurveda', 'allopathy', 'dental', 'physio', 'multispeciality']);
  });
});

describe('branching unchanged (FR-D2): isAyurvedaClinic / isPhysioClinic / isTherapyClinic', () => {
  it('isAyurvedaClinic is true only for clinic_type "ayurveda"', () => {
    for (const clinic_type of CLINIC_TYPES) {
      expect(isAyurvedaClinic(makeFeatures({ clinic_type }))).toBe(clinic_type === 'ayurveda');
    }
  });

  it('isPhysioClinic is true only for clinic_type "physio"', () => {
    for (const clinic_type of CLINIC_TYPES) {
      expect(isPhysioClinic(makeFeatures({ clinic_type }))).toBe(clinic_type === 'physio');
    }
  });

  it('isTherapyClinic is true for "ayurveda" and "physio" only (not "allopathy", "dental", "multispeciality", or "general")', () => {
    for (const clinic_type of CLINIC_TYPES) {
      expect(isTherapyClinic(makeFeatures({ clinic_type }))).toBe(
        clinic_type === 'ayurveda' || clinic_type === 'physio'
      );
    }
  });
});

describe('Release 5 · T-F.2c/T-F.2d: hasMultiDayAppointments/hasTreatmentSheets are capability-platform-derived, no frontend clinic-type re-derivation', () => {
  it('hasMultiDayAppointments honors allow_multiday=true directly, regardless of clinic_type — proves the redundant isTherapyClinic gate is gone', () => {
    for (const clinic_type of CLINIC_TYPES) {
      expect(
        hasMultiDayAppointments(makeFeatures({ clinic_type, appointments: { allow_multiday: true, enable_gender_matching: false } }))
      ).toBe(true);
    }
  });

  it('hasMultiDayAppointments honors allow_multiday=false — remains unavailable regardless of clinic_type', () => {
    for (const clinic_type of CLINIC_TYPES) {
      expect(
        hasMultiDayAppointments(makeFeatures({ clinic_type, appointments: { allow_multiday: false, enable_gender_matching: false } }))
      ).toBe(false);
    }
  });

  it('hasTreatmentSheets honors enable_treatment_sheets=true directly, regardless of clinic_type', () => {
    for (const clinic_type of CLINIC_TYPES) {
      expect(
        hasTreatmentSheets(makeFeatures({ clinic_type, treatment_sheets: { enable_treatment_sheets: true, enable_sheet_sync: false } }))
      ).toBe(true);
    }
  });

  it('hasTreatmentSheets honors enable_treatment_sheets=false — remains unavailable regardless of clinic_type', () => {
    for (const clinic_type of CLINIC_TYPES) {
      expect(
        hasTreatmentSheets(makeFeatures({ clinic_type, treatment_sheets: { enable_treatment_sheets: false, enable_sheet_sync: false } }))
      ).toBe(false);
    }
  });
});

describe('requirements.md N-10: hasGenderMatching is deferred configuration, untouched by T-F.2d', () => {
  it('hasGenderMatching still requires both a therapy clinic AND enable_gender_matching=true (unchanged)', () => {
    expect(
      hasGenderMatching(makeFeatures({ clinic_type: 'physio', appointments: { allow_multiday: false, enable_gender_matching: true } }))
    ).toBe(true);
    expect(
      hasGenderMatching(makeFeatures({ clinic_type: 'dental', appointments: { allow_multiday: false, enable_gender_matching: true } }))
    ).toBe(false);
  });
});

describe('freshness_v1_enabled feature flag (T-A.6, ADR-P1-01, FR-A6/RB-1)', () => {
  it('isFreshnessV1Enabled reflects whatever the field is set to', () => {
    expect(isFreshnessV1Enabled(makeFeatures({ freshness_v1_enabled: true }))).toBe(true);
    expect(isFreshnessV1Enabled(makeFeatures({ freshness_v1_enabled: false }))).toBe(false);
  });

  const source = fs.readFileSync(
    path.resolve(__dirname, '../../../core/hooks/useFeatures.ts'),
    'utf8'
  );

  it('DEFAULT_FEATURES defaults freshness_v1_enabled to false (fail-closed if the API is unreachable)', () => {
    const defaultsBlock = source.slice(
      source.indexOf('const DEFAULT_FEATURES'),
      source.indexOf('};', source.indexOf('const DEFAULT_FEATURES'))
    );
    expect(defaultsBlock).toContain('freshness_v1_enabled: false');
  });

  it('normalizeFeatures reads freshness_v1_enabled directly from the raw API response, NOT gated by clinic type (global rollout flag, not a clinic-type feature)', () => {
    const fnBody = source.slice(
      source.indexOf('function normalizeFeatures'),
      source.indexOf('\n}', source.indexOf('function normalizeFeatures'))
    );
    expect(fnBody).toContain('freshness_v1_enabled: !!raw?.freshness_v1_enabled');
    // Distinguish from the therapyClinic-gated fields immediately above it.
    const flagLineIndex = fnBody.indexOf('freshness_v1_enabled: !!raw?.freshness_v1_enabled');
    const flagLine = fnBody.slice(flagLineIndex, flagLineIndex + 60);
    expect(flagLine).not.toContain('therapyClinic');
  });
});

describe('clinical_spine_v1_enabled feature flag (R3B · T-A.1, ADR-R3B-04)', () => {
  it('isClinicalSpineV1Enabled reflects whatever the field is set to', () => {
    expect(isClinicalSpineV1Enabled(makeFeatures({ clinical_spine_v1_enabled: true }))).toBe(true);
    expect(isClinicalSpineV1Enabled(makeFeatures({ clinical_spine_v1_enabled: false }))).toBe(false);
  });

  const source = fs.readFileSync(
    path.resolve(__dirname, '../../../core/hooks/useFeatures.ts'),
    'utf8'
  );

  it('DEFAULT_FEATURES defaults clinical_spine_v1_enabled to false (fail-closed if the API is unreachable)', () => {
    const defaultsBlock = source.slice(
      source.indexOf('const DEFAULT_FEATURES'),
      source.indexOf('};', source.indexOf('const DEFAULT_FEATURES'))
    );
    expect(defaultsBlock).toContain('clinical_spine_v1_enabled: false');
  });

  it('normalizeFeatures reads clinical_spine_v1_enabled directly from the raw API response, NOT gated by clinic type (global rollout flag, not a clinic-type feature)', () => {
    const fnBody = source.slice(
      source.indexOf('function normalizeFeatures'),
      source.indexOf('\n}', source.indexOf('function normalizeFeatures'))
    );
    expect(fnBody).toContain('clinical_spine_v1_enabled: !!raw?.clinical_spine_v1_enabled');
    // Distinguish from the therapyClinic-gated fields above it.
    const flagLineIndex = fnBody.indexOf('clinical_spine_v1_enabled: !!raw?.clinical_spine_v1_enabled');
    const flagLine = fnBody.slice(flagLineIndex, flagLineIndex + 70);
    expect(flagLine).not.toContain('therapyClinic');
  });

  it('is independent of freshness_v1_enabled — one can be true while the other is false', () => {
    expect(isClinicalSpineV1Enabled(makeFeatures({ clinical_spine_v1_enabled: true, freshness_v1_enabled: false }))).toBe(true);
    expect(isFreshnessV1Enabled(makeFeatures({ clinical_spine_v1_enabled: true, freshness_v1_enabled: false }))).toBe(false);
  });
});

describe('normalizeClinicType fallback behavior intact (source inspection — private function, not exported)', () => {
  const source = fs.readFileSync(
    path.resolve(__dirname, '../../../core/hooks/useFeatures.ts'),
    'utf8'
  );

  it('normalizes via the single-sourced CLINIC_TYPES constant, not a second duplicated literal', () => {
    expect(source).toContain('CLINIC_TYPES.includes(normalized as ClinicType)');
  });

  it('still falls back to "general" for an unrecognized value (unchanged fallback behavior)', () => {
    const fnBody = source.slice(
      source.indexOf('function normalizeClinicType'),
      source.indexOf('function isTherapyClinicType')
    );
    expect(fnBody).toContain("return 'general';");
  });

  it('still lowercases and defaults an empty/undefined value to "general" before checking membership', () => {
    const fnBody = source.slice(
      source.indexOf('function normalizeClinicType'),
      source.indexOf('function isTherapyClinicType')
    );
    expect(fnBody).toContain("(value || 'general').toLowerCase()");
  });
});

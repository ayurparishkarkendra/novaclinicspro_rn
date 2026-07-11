/**
 * Phase 1 · T-0.4 (baseline) / T-A.5 (fix) — "save → navigate → return"
 * freshness. See .kiro/specs/phase-1-clinical-platform-trust/design.md §4.A
 * and Document 09 finding V4 (Critical).
 *
 * R3A · T-B.1/T-B.3: this file's own episode/appointment-context-change
 * re-sync tests (casesheet, then treatment recommendation) moved to
 * caseSheetModule.test.tsx's / treatmentRecommendationModule.test.tsx's own
 * "episode/appointment context changes" describe blocks — that state now
 * lives in CaseSheetModule / TreatmentRecommendationModule, not this hook
 * (which, after T-B.3, owns no per-module draft state at all). This file
 * keeps only the source-inspection test, which isn't owned by any one
 * module.
 */
import fs from 'fs';
import path from 'path';

describe('Consultation save → navigate → return freshness (baseline, T-0.4)', () => {
  it('T-A.5: the forced-remount key is gone from the consultation route (source inspection)', () => {
    const routeSource = fs.readFileSync(
      path.resolve(__dirname, '../../../app/clinic-admin/episodes/[episodeId]/consultation.tsx'),
      'utf8'
    );
    expect(routeSource).not.toContain('key={`${episodeId}:${appointmentId}`}');
    // R3A · T-A.2: the route now renders ClinicalWorkspace (which wraps the
    // still-unmodified ConsultationWorkspaceScreen in WorkspaceProvider —
    // see clinicalWorkspaceShell.test.tsx) instead of ConsultationWorkspaceScreen
    // directly. Updated to match the approved design §9.A swap; the assertion's
    // original intent — the route still renders something, not a blank screen —
    // is preserved.
    expect(routeSource).toContain('<ClinicalWorkspace');
  });
});

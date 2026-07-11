import fs from 'fs';
import path from 'path';

/**
 * Phase 4 (R4) · T-E.4 (ADR-R4-06) — TreatmentSheetDetailScreen.tsx +
 * detail/TreatmentSheetDetailContent.tsx no longer gate row-content editing
 * on TreatmentSheet.status (DRAFT/FINAL/SIGNED). Confirms the isDoctor
 * computation exists and is threaded through, and that the old
 * isEditable(treatmentSheet.status)/TreatmentSheetStatus dependency is gone
 * from the row-editing call site.
 *
 * Case Sheet / Prescription document lifecycle (Draft -> Signed -> locked
 * record) is untouched by this task -- CasesheetStandaloneScreen.tsx's own
 * isDoctor + isEditable(casesheet.status) pattern (a legitimate document
 * gate for a real document type) is confirmed still present, unchanged.
 */

const read = (relativePath: string) => fs.readFileSync(path.resolve(__dirname, relativePath), 'utf8');

describe('TreatmentSheetDetailScreen/Content: row editing gated by role, not TreatmentSheet.status (R4 · T-E.4)', () => {
  it('TreatmentSheetDetailScreen computes isDoctor from the current user\'s roles and passes it to TreatmentSheetDetailContent', () => {
    const source = read('../../../features/treatmentSheets/presentation/pages/TreatmentSheetDetailScreen.tsx');
    expect(source).toContain("currentUser?.roles?.includes('DOCTOR')");
    expect(source).toMatch(/<TreatmentSheetDetailContent[\s\S]*?isDoctor=\{isDoctor\}/);
  });

  it('TreatmentSheetDetailContent no longer imports isEditable/TreatmentSheetStatus, and gates canEdit on isDoctor (not treatmentSheet.status)', () => {
    const source = read('../../../features/treatmentSheets/presentation/pages/detail/TreatmentSheetDetailContent.tsx');
    expect(source).not.toMatch(/import\s*\{[^}]*\bisEditable\b/);
    expect(source).not.toMatch(/import\s*\{[^}]*\bTreatmentSheetStatus\b/);
    expect(source).toContain('canEdit={isDoctor}');
  });

  it('T-F.2c: TreatmentScheduleSummary visibility is no longer gated on treatmentSheet.status -- it uses the resolver\'s own lifecycle_status instead', () => {
    const source = read('../../../features/treatmentSheets/presentation/pages/detail/TreatmentSheetDetailContent.tsx');
    // No live JSX conditional reads treatmentSheet.status anymore (only this
    // task's own explanatory comment mentions the retired pattern in prose).
    expect(source).not.toMatch(/treatmentSheet\.status\s*===\s*['"]DRAFT['"]\s*\?/);
    expect(source).toContain('isInSchedulingPhase(treatmentOrder)');
    expect(source).toContain('SCHEDULING_PHASE_LIFECYCLE_STATUSES');
  });

  it('TreatmentRowEditor never reads treatmentSheet.status or FINAL/SIGNED at all', () => {
    const source = read('../../../features/treatmentSheets/presentation/pages/detail/TreatmentRowEditor.tsx');
    expect(source).not.toMatch(/FINAL|SIGNED|treatmentSheet\.status|isEditable/);
    // Its own row-level completed-row immutability check IS expected.
    expect(source).toContain("orderRow?.status !== 'COMPLETED'");
  });

  it('Case Sheet document lifecycle is untouched -- CasesheetStandaloneScreen.tsx still legitimately gates on casesheet.status (DRAFT/FINAL/SIGNED), unaffected by this task', () => {
    const source = read('../../../features/casesheets/presentation/pages/CasesheetStandaloneScreen.tsx');
    expect(source).toContain("isEditable(casesheet.status)");
    expect(source).toContain("casesheet.status === 'SIGNED' && isDoctor");
  });

  it('Prescription document lifecycle is untouched -- PrescriptionStandaloneScreen.tsx still legitimately gates on prescription.status, unaffected by this task', () => {
    const source = read('../../../features/prescriptions/presentation/pages/PrescriptionStandaloneScreen.tsx');
    expect(source).toContain('isEditable(prescription.status)');
  });
});

/**
 * R3B (T-B.1, ADR-R3B-05) — progress/save-status vocabulary for the
 * canonical Case Sheet editing core, declared locally rather than imported
 * from `features/episodes/.../useConsultationWorkspace`'s own
 * `SectionProgressStatus`/`SectionSaveStatus`. Those types are workspace
 * vocabulary shared across every module (Prescription, Treatment
 * Recommendation, Clinical Services too) — a context-agnostic Case Sheet
 * core (ADR-R3B-01: no reliance on workspace-only concepts) declares its own
 * copy instead of reaching into `episodes`. The string members are
 * identical, so a host passing its own `SectionProgressStatus`/
 * `SectionSaveStatus` value satisfies these structurally, with no runtime
 * conversion needed.
 */
export type CaseSheetSectionProgressStatus = 'empty' | 'in_progress' | 'complete';
export type CaseSheetSectionSaveStatus = 'idle' | 'saving' | 'saved' | 'error';

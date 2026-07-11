/**
 * R3B (T-B.4, ADR-R3B-05) — progress/save-status vocabulary for the
 * canonical Prescription editing core, declared locally rather than
 * imported from `features/episodes/.../useConsultationWorkspace`'s own
 * `SectionProgressStatus`/`SectionSaveStatus`. Mirrors
 * `features/casesheets/presentation/components/caseSheetSectionTypes.ts`'s
 * own rationale exactly: a context-agnostic core (ADR-R3B-01) declares its
 * own copy rather than reaching into workspace-only vocabulary. The string
 * members are identical, so a host passing its own `SectionProgressStatus`/
 * `SectionSaveStatus` value satisfies these structurally.
 */
export type PrescriptionSectionProgressStatus = 'empty' | 'in_progress' | 'complete';
export type PrescriptionSectionSaveStatus = 'idle' | 'saving' | 'saved' | 'error';

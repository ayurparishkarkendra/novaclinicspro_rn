import fs from 'fs';
import path from 'path';

/**
 * Phase 4 (R4) · T-E.3 / T-E.3b — Prescription field completeness.
 *
 * ORIGINALLY (T-E.3, read-only audit): this file compared the OLD
 * PrescriptionForm.tsx/CreatePrescriptionScreen.tsx/PrescriptionEditScreen.tsx
 * field-for-field against the canonical PrescriptionEditingCore.tsx, closing
 * a real gap -- prior R3B tasks (T-B.4/T-B.5) documented parity in prose,
 * but no test asserted it programmatically.
 *
 * UPDATE (T-E.3b): the old files are now deleted -- T-E.3's own audit found
 * no capability gap, so PrescriptionEditScreen/CreatePrescriptionScreen were
 * removed, and PrescriptionForm.tsx along with them (it had zero remaining
 * consumers once its two callers were gone). There is nothing left to
 * compare against. This file is converted from an old-vs-canonical
 * comparison into a standalone completeness assertion on the canonical core
 * alone -- preserving the exact field lists the comparison already proved
 * correct, as fixed expectations, so a future regression (a field silently
 * dropped from `PrescriptionEditingCore.tsx`) is still caught.
 */

const read = (relativePath: string) => fs.readFileSync(path.resolve(__dirname, relativePath), 'utf8');

const canonicalCore = read('../../../features/prescriptions/presentation/components/PrescriptionEditingCore.tsx');

describe('Prescription fields: canonical PrescriptionEditingCore.tsx completeness (R4 · T-E.3/T-E.3b)', () => {
  it('MED_FIELDS covers all 5 medication fields: name, dosage, frequency, duration, instructions', () => {
    const medFieldsMatch = canonicalCore.match(/const MED_FIELDS[^\[]*\[([^\]]*)\]/);
    expect(medFieldsMatch).not.toBeNull();
    const medFields = [...medFieldsMatch![1].matchAll(/'(\w+)'/g)].map((m) => m[1]);
    expect(medFields.sort()).toEqual(['dosage', 'duration', 'frequency', 'instructions', 'name'].sort());
  });

  it('PrescriptionAdviceFieldId covers all 5 advice fields: dietary_advice, lifestyle_advice, follow_up_instructions, notes, next_visit_days', () => {
    const adviceTypeMatch = canonicalCore.match(/export type PrescriptionAdviceFieldId =([\s\S]*?);/);
    expect(adviceTypeMatch).not.toBeNull();
    const adviceFields = [...adviceTypeMatch![1].matchAll(/'(\w+)'/g)].map((m) => m[1]);
    expect(adviceFields.sort()).toEqual(
      ['dietary_advice', 'lifestyle_advice', 'follow_up_instructions', 'notes', 'next_visit_days'].sort(),
    );
  });
});

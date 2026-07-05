import fs from 'fs';
import path from 'path';
import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { PrescriptionForm, PrescriptionFormData } from '../../../features/prescriptions/presentation/components/PrescriptionForm';

/**
 * R3B · T-0.3 — Characterization of BOTH existing Prescription editing
 * implementations, BEFORE T-B.4 extracts a canonical core (ADR-R3B-05).
 * This is the "before" baseline that extraction must prove it preserves.
 * Mirrors T-0.2's own structure and discipline exactly.
 *
 * The WORKSPACE implementation (PrescriptionModule + its PrescriptionSection)
 * already has thorough, passing behavioral coverage from Phase 3A
 * (`prescriptionModule.test.tsx`, 12 tests — autosave-free explicit save,
 * freshness-flag branches, unmount-flush). That suite IS this task's
 * workspace-side baseline; not re-characterized here. This file's job is
 * the STANDALONE implementation (zero prior coverage) plus the field/
 * capability comparison between the two.
 *
 * REALITY-CHECK FINDING (same kind as T-0.2's Case Sheet finding — same
 * resolution applied without a fresh AskUserQuestion cycle, since
 * design.md's own text about Prescription was already appropriately
 * generic — "same resolution as Case Sheet" — and never asserted a
 * specific, now-falsifiable Prescription field-parity claim the way
 * ADR-R3B-05's Case Sheet text originally did; this finding fills in the
 * specifics the ADR's own Consequences clause ("every field-level
 * difference... must be reconciled") already anticipated, it doesn't
 * contradict a stated fact): the two Prescription implementations' ADVICE
 * fields are NOT equivalent. `PrescriptionForm.tsx` (standalone) sends
 * `dietary_advice`, `lifestyle_advice`, `notes` (a top-level Prescription
 * field, not part of `prescription_data`), and `next_visit_days` (also
 * top-level) to the backend — confirmed real, wired fields, not dead code
 * (`PrescriptionEditScreen.tsx`/`CreatePrescriptionScreen.tsx` both pass
 * them through to the update/create mutation). `PrescriptionSection.tsx`
 * (workspace) sends `dietary_advice`, `lifestyle_advice`, and
 * `follow_up_instructions` (which the standalone form has NO equivalent
 * field for at all) — and `PrescriptionModule.tsx`'s own `savePrescription`
 * call never sends `notes` or `next_visit_days` to the backend. Medication
 * fields (name/dosage/frequency/duration/instructions) DO match exactly
 * between both. `design.md` §2.2 updated with this finding (additive, not
 * a correction of a false claim).
 *
 * A SECOND finding, confirmed while reading the standalone screens: the
 * SAME status/role edit-gate pattern found for Case Sheet
 * (`isEditable(status) || (status === 'SIGNED' && isDoctor)`) exists
 * verbatim in `PrescriptionEditScreen.tsx` — confirms this is a genuine,
 * repeated host-level pattern across both artifacts, not a one-off.
 *
 * A THIRD finding: the standalone form BLOCKS submission silently if no
 * medication has both a name and dosage (`handleSubmit` returns early with
 * no error shown to the user — its own comment says "Show error" but no
 * actual UI error exists). `PrescriptionModule`'s own `savePrescription`
 * has no equivalent blocking check — it saves whatever draft exists,
 * including an all-empty medications array, if the Save button is pressed.
 * This is a real behavioral difference, recorded as a host-level
 * reconciliation item for T-B.4/T-B.6, not fixed here.
 *
 * UPDATE (T-B.4, extraction complete): `PrescriptionSection` moved out of
 * `features/episodes/.../ConsultationSections/` and was generalized into
 * `PrescriptionEditingCore` (`features/prescriptions/presentation/
 * components/`), now carrying `notes`/`next_visit_days` as optional,
 * host-activated fields (ADR-R3B-05's "must be carried into the canonical
 * core" requirement, applied the same way as Case Sheet's vitals/custom).
 * `read()` paths below updated to match; the "Advice/metadata field parity"
 * describe block is extended (not rewritten — `follow_up_instructions`'s own
 * "workspace only" framing was about which host ACTIVATES it, still true)
 * with new assertions proving both halves of the resolution: the core file
 * now supports `notes`/`next_visit_days` as optional props, AND
 * `PrescriptionModule`'s own call site still activates only the original
 * three fields — zero behavior change for the doctor's live workspace.
 */

const read = (relativePath: string) => fs.readFileSync(path.resolve(__dirname, relativePath), 'utf8');

describe('Prescription dual-implementation characterization (R3B · T-0.3, baseline for T-B.4)', () => {
  describe('Medication field parity — confirmed equivalent between both implementations', () => {
    const workspaceSection = read('../../../features/prescriptions/presentation/components/PrescriptionEditingCore.tsx');
    const standaloneForm = read('../../../features/prescriptions/presentation/components/PrescriptionForm.tsx');

    it('both implementations use the exact same medication field set: name, dosage, frequency, duration, instructions', () => {
      expect(workspaceSection).toContain("['name', 'dosage', 'frequency', 'duration', 'instructions']");
      ['name', 'dosage', 'frequency', 'duration', 'instructions'].forEach((field) => {
        expect(standaloneForm).toMatch(new RegExp(`'${field}'`));
      });
    });
  });

  describe('Advice/metadata field parity — ORIGINAL FINDING (T-0.3) vs. resolved state (T-B.4)', () => {
    const canonicalCore = read('../../../features/prescriptions/presentation/components/PrescriptionEditingCore.tsx');
    const standaloneForm = read('../../../features/prescriptions/presentation/components/PrescriptionForm.tsx');
    const workspaceModule = read('../../../features/episodes/presentation/components/ConsultationSections/PrescriptionModule.tsx');
    const editScreen = read('../../../features/prescriptions/presentation/pages/PrescriptionEditScreen.tsx');
    const createScreen = read('../../../features/prescriptions/presentation/pages/CreatePrescriptionScreen.tsx');

    it('dietary_advice and lifestyle_advice ARE shared between both implementations', () => {
      expect(canonicalCore).toContain("'dietary_advice'");
      expect(canonicalCore).toContain("'lifestyle_advice'");
      expect(standaloneForm).toContain('dietary_advice');
      expect(standaloneForm).toContain('lifestyle_advice');
    });

    it('follow_up_instructions exists in the canonical core; the standalone form still has no field for it (unresolved on that side — it was never the gap ADR-R3B-05 asked T-B.4 to close, since only notes/next_visit_days were confirmed as missing FROM the core)', () => {
      expect(canonicalCore).toContain("'follow_up_instructions'");
      expect(standaloneForm).not.toContain('follow_up_instructions');
    });

    it('T-B.4 RESOLUTION: the canonical core now supports notes/next_visit_days as optional, host-activated props — no longer standalone-only (ADR-R3B-05\'s "must be carried into the canonical core" requirement satisfied)', () => {
      expect(canonicalCore).toContain("'notes'");
      expect(canonicalCore).toContain("'next_visit_days'");
      expect(canonicalCore).toContain('onNotesChange');
      expect(canonicalCore).toContain('onNextVisitDaysChange');
    });

    it('T-B.4 BEHAVIOR-PRESERVING: PrescriptionModule\'s own call site still activates only dietary_advice/lifestyle_advice/follow_up_instructions — the workspace doctor sees zero change, even though the underlying core file now supports more', () => {
      expect(workspaceModule).toContain(
        "const PRESCRIPTION_MODULE_ACTIVE_ADVICE_FIELDS = ['dietary_advice', 'lifestyle_advice', 'follow_up_instructions'] as const;",
      );
      // Not banning the substring anywhere (an explanatory comment in this
      // file legitimately mentions both) — the real guarantee is that no
      // `notes=`/`nextVisitDays=` PROP is passed at the <PrescriptionEditingCore
      // call site itself.
      expect(workspaceModule).not.toMatch(/\bnotes=\{|nextVisitDays=\{/);
    });

    it('notes and next_visit_days remain real (wired to the backend, not dead fields) in the standalone form', () => {
      expect(standaloneForm).toContain('useState(initialData?.notes');
      expect(standaloneForm).toContain('next_visit_days');
    });

    it('PrescriptionEditScreen wires notes through to the update mutation (confirms it is a real, backend-persisted field, not UI-only)', () => {
      expect(editScreen).toContain('notes: data.notes,');
    });

    it('CreatePrescriptionScreen wires both notes and next_visit_days through to the create mutation', () => {
      expect(createScreen).toContain('notes: data.notes,');
      expect(createScreen).toContain('next_visit_days: data.next_visit_days,');
    });
  });

  describe('Standalone screen behavior NOT present in the workspace module (host-level concerns, not core-editing concerns)', () => {
    const editScreen = read('../../../features/prescriptions/presentation/pages/PrescriptionEditScreen.tsx');
    const workspaceModule = read('../../../features/episodes/presentation/components/ConsultationSections/PrescriptionModule.tsx');

    it('PrescriptionEditScreen enforces the same status/role edit-gate pattern found for Case Sheet: DRAFT always editable, SIGNED only by DOCTOR role, FINAL never', () => {
      expect(editScreen).toContain("const canEdit = isEditable(prescription.status) || (prescription.status === 'SIGNED' && isDoctor);");
    });

    it('PrescriptionModule has no equivalent status/role gate (confirms this is a host-level concern to carry into the standalone wrapper, T-B.5/T-B.6)', () => {
      expect(workspaceModule).not.toMatch(/isEditable\(|isDoctor|prescription\.status/);
    });
  });

  describe('Standalone PrescriptionForm: real render-based behavioral baseline (zero prior test coverage before this task)', () => {
    const buildFormTree = (props?: Partial<React.ComponentProps<typeof PrescriptionForm>>) => {
      const onSubmit = jest.fn();
      const onCancel = jest.fn();
      const utils = render(
        <PrescriptionForm onSubmit={onSubmit} onCancel={onCancel} submitLabel="Create Prescription" {...props} />,
      );
      return { ...utils, onSubmit, onCancel };
    };

    it('renders one empty medication row by default', () => {
      const { getByTestId } = buildFormTree();
      expect(getByTestId('medication-0-name')).toBeTruthy();
      expect(getByTestId('medication-0-dosage')).toBeTruthy();
    });

    it('captures a medication edit and submits it via onSubmit', () => {
      const { getByTestId, onSubmit } = buildFormTree();
      fireEvent.changeText(getByTestId('medication-0-name'), 'Paracetamol');
      fireEvent.changeText(getByTestId('medication-0-dosage'), '500mg');
      fireEvent.press(getByTestId('prescription-form-submit'));
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          medications: [expect.objectContaining({ name: 'Paracetamol', dosage: '500mg' })],
        }),
      );
    });

    it('adds a second medication row', () => {
      const { getByTestId } = buildFormTree();
      fireEvent.press(getByTestId('add-medication-button'));
      expect(getByTestId('medication-1-name')).toBeTruthy();
    });

    it('removes a medication row (only shown when more than one exists)', () => {
      const { getByTestId, queryByTestId } = buildFormTree();
      fireEvent.press(getByTestId('add-medication-button'));
      expect(queryByTestId('remove-medication-0')).toBeTruthy();
      fireEvent.press(getByTestId('remove-medication-0'));
      expect(queryByTestId('medication-1-name')).toBeNull();
    });

    it('captures notes and next_visit_days and submits them (the fields with no workspace equivalent)', () => {
      const { getByTestId, onSubmit } = buildFormTree();
      fireEvent.changeText(getByTestId('medication-0-name'), 'Ibuprofen');
      fireEvent.changeText(getByTestId('medication-0-dosage'), '200mg');
      fireEvent.changeText(getByTestId('notes-input'), 'Take with food');
      fireEvent.changeText(getByTestId('next-visit-days-input'), '14');
      fireEvent.press(getByTestId('prescription-form-submit'));
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ notes: 'Take with food', next_visit_days: 14 }),
      );
    });

    it('BLOCKS submission silently when no medication has both a name and a dosage (confirmed real, no error UI shown — a host-level behavior to reconcile, not fixed here)', () => {
      const { getByTestId, onSubmit } = buildFormTree();
      // Leave the default empty medication row untouched — name and dosage both blank.
      fireEvent.press(getByTestId('prescription-form-submit'));
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('disables every input and hides action buttons when isEditable is false (the SIGNED/FINAL read-only path)', () => {
      const { getByTestId, queryByTestId } = buildFormTree({ isEditable: false });
      expect(getByTestId('medication-0-name').props.editable).toBe(false);
      expect(queryByTestId('prescription-form-submit')).toBeNull();
      expect(queryByTestId('add-medication-button')).toBeNull();
    });

    it('cancel calls onCancel', () => {
      const { getByTestId, onCancel } = buildFormTree();
      fireEvent.press(getByTestId('prescription-form-cancel'));
      expect(onCancel).toHaveBeenCalledTimes(1);
    });
  });
});

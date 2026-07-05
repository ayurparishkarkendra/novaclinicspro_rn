import fs from 'fs';
import path from 'path';
import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { CasesheetForm, CasesheetFormData } from '../../../features/casesheets/presentation/components/CasesheetForm';

/**
 * R3B · T-0.2 — Characterization of BOTH existing Case Sheet editing
 * implementations, BEFORE T-B.1 extracts a canonical core (ADR-R3B-05).
 * This is the "before" baseline that extraction must prove it preserves.
 *
 * The WORKSPACE implementation (CaseSheetModule + its section components)
 * already has thorough, passing behavioral coverage from Phase 3A
 * (`caseSheetModule.test.tsx`, 20 tests — autosave, POST-then-PATCH,
 * freshness-flag branches, unmount-flush). That suite IS this task's
 * workspace-side baseline; it is not re-characterized here, to avoid
 * duplicating already-passing coverage (same discipline Phase 3A's own
 * T-0.2 applied). This file's job is the STANDALONE implementation, which
 * had ZERO test coverage before this task, plus the field/capability
 * comparison between the two.
 *
 * MAJOR REALITY-CHECK FINDING (reported and design.md corrected before this
 * file was written — see design.md §2.2's own "Update (T-0.2)" and
 * ADR-R3B-05's correction): the two implementations' specialty EXTENSION
 * systems are NOT equivalent. CasesheetForm.tsx supports FOUR extension
 * templates (vitals, prakriti, nadi_pariksha, custom free-text), added/
 * removed dynamically, with NO clinic-type gating. AyurvedicAssessmentSection
 * (workspace) supports only TWO (prakriti, nadi_pariksha), always both
 * rendered, Ayurveda-clinic-gated only. prakriti/nadi_pariksha's own field
 * names match exactly between the two — that data shape is genuinely
 * compatible — but vitals/custom exist ONLY in the standalone form today.
 * This is locked in below as an explicit, executable baseline, not just
 * asserted in prose.
 *
 * TWO FURTHER FINDINGS, confirmed while reading the standalone screens
 * (CasesheetEditScreen.tsx/CreateCasesheetScreen.tsx) to complete this
 * characterization — recorded here, not fixed, and not blocking this task
 * (this task is characterization only):
 *  1. CasesheetEditScreen.tsx enforces a real status/role edit-gate absent
 *     from CaseSheetModule entirely: DRAFT is always editable; SIGNED is
 *     editable only by a DOCTOR-role user; FINAL is never editable. The
 *     workspace module has no equivalent check (it never needed one — a
 *     live consultation's casesheet is implicitly still in-progress). This
 *     is a real behavior the standalone wrapper (T-B.2/T-B.3) must
 *     replicate as its own HOST-level concern — the canonical core itself
 *     has no reason to know about casesheet status.
 *  2. CreateCasesheetScreen.tsx hardcodes `clinic_type: 'ayurveda'` on
 *     create (its own comment: "Default clinic type, can be made
 *     configurable") regardless of the actual clinic's real type, whereas
 *     CaseSheetModule correctly uses `features.clinic_type`. This is a
 *     pre-existing bug in the standalone implementation, unrelated to this
 *     phase's consolidation work — logged as Engineering Debt in this
 *     task's own tasks.md completion record, not fixed here (Phase vs.
 *     Engineering Debt policy: not required to complete this task's own
 *     acceptance).
 *  3. CONFIRMED EQUIVALENT (not a gap): both implementations already
 *     enforce the same "one casesheet per episode" business rule —
 *     CreateCasesheetScreen redirects to the existing casesheet if one is
 *     found (`episodeDetailsForGuard?.documents?.casesheet?.exists`);
 *     CaseSheetModule's own `casesheetIdRef`/`hasCasesheet` logic achieves
 *     the same invariant via a different mechanism (PATCH instead of a
 *     second POST). No reconciliation needed for this behavior.
 *
 * UPDATE (T-B.1, extraction complete): `ChiefComplaintSection`/
 * `ClinicalNotesSection`/`AyurvedicAssessmentSection` moved out of
 * `features/episodes/.../ConsultationSections/` into
 * `features/casesheets/presentation/components/` — `AyurvedicAssessmentSection`
 * itself was generalized into `CaseSheetExtensionsSection`, now carrying the
 * full four-template registry (`vitals`/`prakriti`/`nadi_pariksha`/`custom`)
 * as a strict superset of both prior implementations (ADR-R3B-05's own
 * correction, satisfied). `read()` paths below updated to match; the
 * "Extension system parity" describe block below is rewritten to assert the
 * NEW, correct split: the canonical core FILE now contains all four
 * templates (no longer "workspace has only 2, standalone has 4" — that gap
 * is closed at the core level), while `CaseSheetModule`'s own call site
 * still activates only `prakriti`/`nadi_pariksha` with `allowAddRemove=false`
 * — reproducing T-0.2's original workspace behavior bit-for-bit. Every other
 * describe block's assertions are unchanged in substance.
 */

const read = (relativePath: string) => fs.readFileSync(path.resolve(__dirname, relativePath), 'utf8');

describe('Case Sheet dual-implementation characterization (R3B · T-0.2, baseline for T-B.1)', () => {
  describe('Base field parity — confirmed equivalent between both implementations', () => {
    const workspaceChiefComplaint = read('../../../features/casesheets/presentation/components/ChiefComplaintSection.tsx');
    const workspaceClinicalNotes = read('../../../features/casesheets/presentation/components/ClinicalNotesSection.tsx');
    const standaloneForm = read('../../../features/casesheets/presentation/components/CasesheetForm.tsx');

    it('both implementations use the exact same base field IDs: chief_complaint, subjective, objective, assessment, plan, provisional_diagnosis, final_diagnosis', () => {
      expect(workspaceChiefComplaint).toContain('ChiefComplaintSection');
      ['subjective', 'objective', 'assessment', 'plan', 'provisional_diagnosis', 'final_diagnosis'].forEach((field) => {
        expect(workspaceClinicalNotes).toContain(`'${field}'`);
        expect(standaloneForm).toContain(`id: '${field}'`);
      });
    });
  });

  describe('Extension system parity — ORIGINAL FINDING (T-0.2) vs. resolved state (T-B.1)', () => {
    const standaloneForm = read('../../../features/casesheets/presentation/components/CasesheetForm.tsx');
    const canonicalExtensionsCore = read('../../../features/casesheets/presentation/components/CaseSheetExtensionsSection.tsx');
    const caseSheetModule = read('../../../features/episodes/presentation/components/ConsultationSections/CaseSheetModule.tsx');

    it('the standalone form supports 4 extension templates: vitals, prakriti, nadi_pariksha, custom', () => {
      ['vitals', 'prakriti', 'nadi_pariksha', 'custom'].forEach((id) => {
        expect(standaloneForm).toContain(`id: '${id}'`);
      });
    });

    it('T-B.1 RESOLUTION: the canonical core now ALSO supports all 4 templates — vitals/custom are no longer standalone-only (ADR-R3B-05\'s "must be carried into the canonical core" requirement satisfied)', () => {
      ['vitals', 'prakriti', 'nadi_pariksha', 'custom'].forEach((id) => {
        expect(canonicalExtensionsCore).toContain(`id: '${id}'`);
      });
    });

    it('T-B.1 BEHAVIOR-PRESERVING: CaseSheetModule\'s own call site still activates only prakriti/nadi_pariksha with allowAddRemove=false — the workspace doctor sees zero change, even though the underlying core file now supports more', () => {
      expect(caseSheetModule).toContain("const AYURVEDIC_ASSESSMENT_ACTIVE_TEMPLATE_IDS = ['prakriti', 'nadi_pariksha'];");
      expect(caseSheetModule).toContain('allowAddRemove={false}');
      expect(caseSheetModule).not.toMatch(/activeTemplateIds=\{.*vitals.*\}/);
      expect(caseSheetModule).not.toMatch(/activeTemplateIds=\{.*custom.*\}/);
    });

    it('prakriti/nadi_pariksha field names DO match exactly between both implementations (the one part of the extension system that was already compatible)', () => {
      ['vata', 'pitta', 'kapha', 'dominant_dosha'].forEach((field) => {
        expect(standaloneForm).toContain(`id: '${field}'`);
        expect(canonicalExtensionsCore).toContain(`'${field}'`);
      });
      ['nadi_type', 'nadi_gati', 'nadi_bala', 'observations'].forEach((field) => {
        expect(standaloneForm).toContain(`id: '${field}'`);
        expect(canonicalExtensionsCore).toContain(`'${field}'`);
      });
    });

    it('vitals field names also match exactly between the standalone form and the canonical core (the newly-carried-in template)', () => {
      ['blood_pressure', 'pulse_rate', 'temperature', 'respiratory_rate', 'spo2', 'weight'].forEach((field) => {
        expect(standaloneForm).toContain(`id: '${field}'`);
        expect(canonicalExtensionsCore).toContain(`'${field}'`);
      });
    });

    it('the standalone form has no clinic-type gating on extensions; the workspace host is Ayurveda-only (gated one level up, by CaseSheetModule\'s own activeSections — unchanged by T-B.1)', () => {
      expect(standaloneForm).not.toMatch(/isAyurvedaClinic|clinic_type/);
      expect(canonicalExtensionsCore).not.toMatch(/isAyurvedaClinic|clinic_type/);
    });
  });

  describe('Standalone screen behavior NOT present in the workspace module (host-level concerns, not core-editing concerns)', () => {
    const editScreen = read('../../../features/casesheets/presentation/pages/CasesheetEditScreen.tsx');
    const createScreen = read('../../../features/casesheets/presentation/pages/CreateCasesheetScreen.tsx');
    const workspaceModule = read('../../../features/episodes/presentation/components/ConsultationSections/CaseSheetModule.tsx');

    it('CasesheetEditScreen enforces a status/role edit-gate: DRAFT always editable, SIGNED only by DOCTOR role, FINAL never', () => {
      expect(editScreen).toContain("const canEdit = isEditable(casesheet.status) || (casesheet.status === 'SIGNED' && isDoctor);");
    });

    it('CaseSheetModule has no equivalent status/role gate (confirms this is a host-level concern to carry into the standalone wrapper, T-B.2/T-B.3, not the canonical core)', () => {
      expect(workspaceModule).not.toMatch(/isEditable\(|isDoctor|casesheet\.status/);
    });

    it('CreateCasesheetScreen hardcodes clinic_type: \'ayurveda\' on create — a pre-existing bug, logged as Engineering Debt, not fixed by this task', () => {
      expect(createScreen).toContain("clinic_type: 'ayurveda', // Default clinic type, can be made configurable");
    });

    it('CaseSheetModule, by contrast, correctly uses the real clinic\'s type', () => {
      expect(workspaceModule).toContain('clinic_type: features.clinic_type as any');
    });

    it('both implementations already enforce "one casesheet per episode" — confirmed equivalent, not a gap', () => {
      expect(createScreen).toContain('episodeDetailsForGuard?.documents?.casesheet?.exists');
      expect(workspaceModule).toContain('casesheetIdRef');
    });
  });

  describe('Standalone CasesheetForm: real render-based behavioral baseline (zero prior test coverage before this task)', () => {
    const buildFormTree = (props?: Partial<React.ComponentProps<typeof CasesheetForm>>) => {
      const onSubmit = jest.fn();
      const onCancel = jest.fn();
      const utils = render(
        <CasesheetForm onSubmit={onSubmit} onCancel={onCancel} submitLabel="Create Casesheet" {...props} />,
      );
      return { ...utils, onSubmit, onCancel };
    };

    it('renders the Chief Complaint field, expanded by default', () => {
      const { getByTestId } = buildFormTree();
      expect(getByTestId('casesheet-field-chief_complaint')).toBeTruthy();
    });

    it('captures a Chief Complaint edit and submits it via onSubmit', () => {
      const { getByTestId, onSubmit } = buildFormTree();
      fireEvent.changeText(getByTestId('casesheet-field-chief_complaint'), 'Knee pain for 3 weeks');
      fireEvent.press(getByTestId('casesheet-form-submit'));
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ basic: expect.objectContaining({ chief_complaint: 'Knee pain for 3 weeks' }) }),
      );
    });

    it('adds a Vitals extension via the picker and captures a field edit within it', () => {
      const { getByText, getByTestId, onSubmit } = buildFormTree();
      fireEvent.press(getByTestId('add-extension-btn'));
      fireEvent.press(getByText('Vital Signs'));
      fireEvent.changeText(getByTestId('extension-field-vitals-blood_pressure'), '120/80 mmHg');
      fireEvent.press(getByTestId('casesheet-form-submit'));
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          extensions: expect.arrayContaining([
            expect.objectContaining({ template_id: 'vitals', data: expect.objectContaining({ blood_pressure: '120/80 mmHg' }) }),
          ]),
        }),
      );
    });

    it('adds a Custom (free-text) extension — a capability with no workspace equivalent today', () => {
      const { getByText, getByTestId, onSubmit } = buildFormTree();
      fireEvent.press(getByTestId('add-extension-btn'));
      fireEvent.press(getByText('Custom Notes'));
      fireEvent.changeText(getByTestId('extension-field-custom-content'), 'Doctor\'s free-form note');
      fireEvent.press(getByTestId('casesheet-form-submit'));
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          extensions: expect.arrayContaining([
            expect.objectContaining({ template_id: 'custom', data: expect.objectContaining({ content: "Doctor's free-form note" }) }),
          ]),
        }),
      );
    });

    it('removes an added extension', () => {
      const { getByText, getByTestId, getByLabelText, queryByTestId, onSubmit } = buildFormTree();
      fireEvent.press(getByTestId('add-extension-btn'));
      fireEvent.press(getByText('Vital Signs'));
      expect(queryByTestId('extension-field-vitals-blood_pressure')).toBeTruthy();

      // Remove is icon-only — queried by its accessibilityLabel, not visible text.
      fireEvent.press(getByLabelText('Remove Vital Signs'));
      fireEvent.press(getByTestId('casesheet-form-submit'));
      expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ extensions: [] }));
    });

    it('disables every input and hides action buttons when isEditable is false (the SIGNED/FINAL read-only path)', () => {
      const { getByTestId, queryByTestId } = buildFormTree({ isEditable: false });
      expect(getByTestId('casesheet-field-chief_complaint').props.editable).toBe(false);
      expect(queryByTestId('casesheet-form-submit')).toBeNull();
      expect(queryByTestId('add-extension-btn')).toBeNull();
    });

    it('cancel calls onCancel', () => {
      const { getByTestId, onCancel } = buildFormTree();
      fireEvent.press(getByTestId('casesheet-form-cancel'));
      expect(onCancel).toHaveBeenCalledTimes(1);
    });
  });
});

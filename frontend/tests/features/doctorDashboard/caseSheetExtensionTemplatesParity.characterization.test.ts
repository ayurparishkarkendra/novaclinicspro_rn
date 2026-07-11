import fs from 'fs';
import path from 'path';

/**
 * Phase 4 (R4) · T-E.3 — Parity verification (read-only audit, no removal)
 * before Case Sheet old-editor retirement (T-E.3b).
 *
 * Gap found: no existing test proved the OLD standalone implementation
 * (CasesheetForm.tsx's own EXTENSION_TEMPLATES, a private/unexported const)
 * and the CANONICAL core (CaseSheetExtensionsSection.tsx's exported
 * CASE_SHEET_EXTENSION_TEMPLATES) are field-for-field identical -- prior
 * R3B tasks documented this in prose (T-B.1's own docstring) but never
 * asserted it programmatically; the one existing related test
 * (caseSheetRouteFlagSwitch.test.tsx) only checks the OLD file still has
 * the 4 template ids, not that the CANONICAL one matches it field-for-field.
 * This file closes that gap: if either registry ever drifts, this test
 * fails loudly instead of the drift going unnoticed until users report
 * missing fields after the old editor is deleted.
 *
 * EXTENSION_TEMPLATES is not exported from CasesheetForm.tsx (by design --
 * it is the OFF-path's own private implementation detail, left untouched
 * per Group B's restructuring rule) -- this file reads both source files as
 * text and extracts `{ id: '...' }` field declarations with a regex,
 * mirroring the exact technique caseSheetRouteFlagSwitch.test.tsx already
 * uses, rather than adding an export to production code (out of scope for
 * a read-only audit task).
 */

const read = (relativePath: string) => fs.readFileSync(path.resolve(__dirname, relativePath), 'utf8');

/** Extracts the ordered list of top-level template blocks (id + its own
 * `fields: [...]` array) from an EXTENSION_TEMPLATES-shaped source file. */
function extractTemplates(source: string): Array<{ id: string; fieldIds: string[] }> {
  const templateBlockRegex = /id:\s*'(\w+)'[\s\S]*?fields:\s*\[([\s\S]*?)\n\s*\],/g;
  const templates: Array<{ id: string; fieldIds: string[] }> = [];
  let match: RegExpExecArray | null;
  while ((match = templateBlockRegex.exec(source)) !== null) {
    const [, id, fieldsBlock] = match;
    const fieldIdRegex = /id:\s*'(\w+)'/g;
    const fieldIds: string[] = [];
    let fieldMatch: RegExpExecArray | null;
    while ((fieldMatch = fieldIdRegex.exec(fieldsBlock)) !== null) {
      fieldIds.push(fieldMatch[1]);
    }
    templates.push({ id, fieldIds });
  }
  return templates;
}

const oldSource = read('../../../features/casesheets/presentation/components/CasesheetForm.tsx');
const canonicalSource = read('../../../features/casesheets/presentation/components/CaseSheetExtensionsSection.tsx');

// Both files also define OTHER template-shaped arrays (e.g. CasesheetForm's
// own SECTION_TEMPLATES for chief/soap/diagnosis) -- scope extraction to
// each file's OWN extension-template array declaration only.
const oldExtensionsBlock = oldSource.slice(
  oldSource.indexOf('const EXTENSION_TEMPLATES'),
  oldSource.indexOf('\n];', oldSource.indexOf('const EXTENSION_TEMPLATES')) + 3,
);
const canonicalExtensionsBlock = canonicalSource.slice(
  canonicalSource.indexOf('const CASE_SHEET_EXTENSION_TEMPLATES'),
  canonicalSource.indexOf('\n];', canonicalSource.indexOf('const CASE_SHEET_EXTENSION_TEMPLATES')) + 3,
);

const oldTemplates = extractTemplates(oldExtensionsBlock);
const canonicalTemplates = extractTemplates(canonicalExtensionsBlock);

describe('Case Sheet extension templates: old CasesheetForm.tsx vs canonical CaseSheetExtensionsSection.tsx (R4 · T-E.3)', () => {
  it('the extraction itself found all 4 templates in both files (sanity check on the regex, not just the parity claim)', () => {
    expect(oldTemplates.map((t) => t.id)).toEqual(['vitals', 'prakriti', 'nadi_pariksha', 'custom']);
    expect(canonicalTemplates.map((t) => t.id)).toEqual(['vitals', 'prakriti', 'nadi_pariksha', 'custom']);
  });

  it.each(['vitals', 'prakriti', 'nadi_pariksha', 'custom'])(
    'template "%s": canonical has every field id the old form has (no field silently dropped)',
    (templateId) => {
      const oldTemplate = oldTemplates.find((t) => t.id === templateId)!;
      const canonicalTemplate = canonicalTemplates.find((t) => t.id === templateId)!;
      expect(canonicalTemplate).toBeDefined();
      expect([...canonicalTemplate.fieldIds].sort()).toEqual([...oldTemplate.fieldIds].sort());
    }
  );

  it('vitals has all 6 clinical fields (the field set most likely to be missed if only prakriti/nadi were carried forward)', () => {
    const canonicalVitals = canonicalTemplates.find((t) => t.id === 'vitals')!;
    expect(canonicalVitals.fieldIds).toEqual([
      'blood_pressure', 'pulse_rate', 'temperature', 'respiratory_rate', 'spo2', 'weight',
    ]);
  });

  it('nadi_pariksha carries its "observations" field forward (easy to miss since it reads as an afterthought field in the old form)', () => {
    const canonicalNadi = canonicalTemplates.find((t) => t.id === 'nadi_pariksha')!;
    expect(canonicalNadi.fieldIds).toContain('observations');
  });
});

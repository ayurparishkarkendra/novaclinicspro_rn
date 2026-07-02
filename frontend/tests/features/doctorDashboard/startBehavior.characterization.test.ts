/**
 * Phase 1 · T-0.5 — Characterization of the "Start" behavior(s) on the
 * Doctor Dashboard. See
 * .kiro/specs/phase-1-clinical-platform-trust/design.md ADR-P1-04 and
 * Document 09 finding V7.
 *
 * ORIGINAL FINDING (T-0.5, recorded precisely, not assumed from prior
 * analysis): reading the current source showed the divergence was NOT what
 * earlier analysis assumed (two navigation destinations). There were two
 * genuinely different "Start"-labeled entry points on app/doctor.tsx:
 *
 *   A. Per-appointment "Start Consultation" button on each AppointmentRow
 *      (`onStartConsultation={handleStartConsultation}`) — calls
 *      `startConsultationWithGuard` -> `resolveCase`, which correctly
 *      resolves the episode and navigates to the consultation screen. This
 *      behavior is already thoroughly characterized by the EXISTING
 *      `tests/features/doctorDashboard/caseResolver.test.ts` (not duplicated
 *      here).
 *
 *   B. The dashboard-level "Start Session" Quick Action — its `onPress`
 *      ONLY called `Alert.alert(...)` with a confirmation-style message. It
 *      did NOT call `router.push`, `startConsultationWithGuard`, or
 *      `resolveCase`. It was a dead end (ED-004): tapping "Start Session"
 *      never actually started anything or navigated anywhere.
 *
 * T-D.2 UPDATE (ADR-P1-04): Behavior B now delegates to the same
 * `handleStartConsultation` as Behavior A, so both entry points resolve
 * through the identical canonical path. This file's "Behavior B" describe
 * block and the two former `.todo` items are updated below to assert the
 * new (convergent) behavior — this is the T-0.5 oracle for Group D per
 * tasks.md's "Verify: one behavior (T-0.5)".
 *
 * This is characterized here via source inspection (the same technique this
 * project already uses for backend behavioral characterization, e.g.
 * tests/test_treatment_order_state_regression.py), rather than by rendering
 * the full doctor.tsx screen — rendering the whole dashboard would require
 * mocking well beyond the affected files for this task (~15+ unrelated
 * hooks/queries), which is out of this task's read/change scope.
 */
import fs from 'fs';
import path from 'path';

const DOCTOR_SCREEN_PATH = path.resolve(__dirname, '../../../app/doctor.tsx');
const CASE_RESOLVER_PATH = path.resolve(
  __dirname,
  '../../../features/doctorDashboard/application/caseResolver.ts'
);

function readSource(filePath: string): string {
  return fs.readFileSync(filePath, 'utf8');
}

/** Extracts the source block for a `quickActions` entry by its `label`, up to the next `label:` or the array's closing `]`. */
function extractQuickActionBlock(source: string, label: string): string {
  const startMarker = `label: '${label}'`;
  const startIndex = source.indexOf(startMarker);
  if (startIndex === -1) {
    throw new Error(`Could not find quick action with label "${label}" in doctor.tsx`);
  }
  const afterStart = source.slice(startIndex);
  // Stop at the next quick-action label or the closing of the quickActions array.
  const nextLabelIndex = afterStart.indexOf('label:', startMarker.length);
  const arrayCloseIndex = afterStart.indexOf('], [dashboardData, router, handleStartConsultation]');
  const endIndex =
    nextLabelIndex !== -1 && nextLabelIndex < arrayCloseIndex ? nextLabelIndex : arrayCloseIndex;
  return afterStart.slice(0, endIndex);
}

describe('Doctor Dashboard "Start" behavior (baseline, T-0.5)', () => {
  const doctorSource = readSource(DOCTOR_SCREEN_PATH);
  const caseResolverSource = readSource(CASE_RESOLVER_PATH);

  describe('Behavior A — per-appointment "Start Consultation" (AppointmentListItem)', () => {
    it('wires onStartConsultation to handleStartConsultation, which calls startConsultationWithGuard', () => {
      expect(doctorSource).toContain('onStartConsultation={handleStartConsultation}');
      expect(doctorSource).toMatch(
        /const handleStartConsultation = React\.useCallback\(\s*async \(appointmentId: string, clientId: string\) => \{\s*await startConsultationWithGuard\(/
      );
    });

    it('startConsultationWithGuard resolves the case and navigates via resolveCase (see caseResolver.test.ts for full behavior)', () => {
      // caseResolver.ts is the single implementation behind Behavior A; its
      // full navigation-decision behavior (existing linked episode / active
      // episode found & attached / no active episode / error propagation) is
      // already characterized by the pre-existing
      // tests/features/doctorDashboard/caseResolver.test.ts and is
      // intentionally NOT duplicated here.
      expect(caseResolverSource).toContain('export async function resolveCase(');
      expect(caseResolverSource).toContain('export async function startConsultationWithGuard(');
    });
  });

  describe('Behavior B — dashboard "Start Session" Quick Action (T-D.2: now canonical, no longer a dead end)', () => {
    const startSessionBlock = extractQuickActionBlock(doctorSource, 'Start Session');

    it('delegates to handleStartConsultation for the next scheduled/confirmed appointment', () => {
      expect(startSessionBlock).toContain('handleStartConsultation(nextAppointment.id, nextAppointment.client_id)');
    });

    it('no longer shows the old dead-end confirmation Alert for the found-appointment case', () => {
      expect(startSessionBlock).not.toContain("Alert.alert(\n            'Start Session'");
    });

    it('still informs the user via Alert when there is no upcoming appointment (unchanged, not a dead end)', () => {
      expect(startSessionBlock).toContain("Alert.alert('No Upcoming', 'No upcoming appointments to start.')");
    });
  });

  describe('ONE canonical "Start" entry point (ADR-P1-04, T-D.2)', () => {
    it('both entry points call the same handleStartConsultation function, which delegates to startConsultationWithGuard', () => {
      const startSessionBlock = extractQuickActionBlock(doctorSource, 'Start Session');
      expect(startSessionBlock).toContain('handleStartConsultation(');
      expect(doctorSource).toContain('onStartConsultation={handleStartConsultation}');
      expect(doctorSource).toMatch(
        /const handleStartConsultation = React\.useCallback\(\s*async \(appointmentId: string, clientId: string\) => \{\s*await startConsultationWithGuard\(/
      );
    });

    it('both entry points resolve through the identical resolveCase implementation, so they navigate to the same destination given the same appointment', () => {
      // handleStartConsultation is the single shared function called by both
      // entry points (Behavior A's onStartConsultation prop and Behavior B's
      // Start Session onPress); it always delegates to
      // startConsultationWithGuard -> resolveCase. There is no separate
      // navigation-decision logic for either entry point, so determinism
      // follows from there being exactly one implementation, already
      // characterized by caseResolver.test.ts.
      expect(caseResolverSource).toContain('export async function resolveCase(');
      expect(caseResolverSource.match(/export async function resolveCase\(/g)?.length).toBe(1);
    });
  });
});

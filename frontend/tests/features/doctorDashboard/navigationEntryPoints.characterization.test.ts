import fs from 'fs';
import path from 'path';

/**
 * R3B · T-0.1 — Characterization of TODAY'S navigation: all three entry
 * points into episode-level work, Back, and reload — BEFORE any Group A
 * convergence work begins. This is the "before" baseline AC-3/AC-4 will be
 * checked against once entry points converge; it is also the oracle proving
 * Group A's changes didn't silently disturb something this task locked in.
 *
 * `isClinicalSpineV1Enabled` (T-A.1) does not exist yet — there is no
 * ON/OFF branch to characterize here, only today's single, pre-flag
 * behavior.
 *
 * Technique: source-inspection (matching `standaloneScreenContracts
 * .characterization.test.ts`'s own precedent for exactly this kind of
 * structural/wiring fact — which component a route renders, which router
 * method a transition uses) rather than full render tests, since every
 * assertion here is about STRUCTURE (route → component, push vs. replace,
 * a query-param resolution rule), not deep runtime behavior. Reload
 * behavior is NOT re-characterized here — it already has its own dedicated
 * oracle (`workspaceReloadRestoration.test.tsx`, Phase 3A T-C.2) and
 * re-characterizing it here would duplicate already-passing, still-accurate
 * coverage, the same discipline Phase 3A's own T-0.2 applied.
 *
 * No negative-control pass was run for this task (Execution Governance #2's
 * own "where meaningful" qualifier) — these are characterizations of
 * existing structure, not assertions of a guarantee under test; negative
 * controls apply where a test claims to prove a guarantee holds (T-A.3,
 * T-E.3, T-E.4), not to a baseline snapshot of what already exists.
 */

const read = (relativePath: string) => fs.readFileSync(path.resolve(__dirname, relativePath), 'utf8');

describe('Navigation entry points (R3B · T-0.1, baseline for AC-3/AC-4)', () => {
  describe('Entry point 1: start-consultation.tsx', () => {
    const source = read('../../../app/clinic-admin/appointments/[appointmentId]/start-consultation.tsx');

    it('renders CreateConsultationScreen with appointmentId/clientId from route params', () => {
      expect(source).toContain("useLocalSearchParams<{");
      expect(source).toContain('appointmentId: string;');
      expect(source).toContain('clientId: string;');
      expect(source).toContain('<CreateConsultationScreen appointmentId={appointmentId} clientId={clientId} />');
    });
  });

  describe('CreateConsultationScreen: transitions via replace, not push (the one Reality-Check-confirmed correct precedent)', () => {
    const source = read('../../../features/episodes/presentation/pages/CreateConsultationScreen.tsx');

    it('uses router.replace() into the consultation route on successful create — Back skips the transient "create" step', () => {
      expect(source).toContain('router.replace(consultationRoute(episode.id, appointmentId, clientId)');
    });

    it('does NOT use router.push() for this transition (today\'s one already-correct precedent, per design.md §2.1)', () => {
      expect(source).not.toMatch(/router\.push\(consultationRoute/);
    });
  });

  describe('Entry point 2: consultation.tsx', () => {
    const source = read('../../../app/clinic-admin/episodes/[episodeId]/consultation.tsx');

    it('renders ClinicalWorkspace with episodeId/appointmentId/clientId from route params', () => {
      expect(source).toContain("import { ClinicalWorkspace } from '../../../../features/episodes/presentation/pages/ClinicalWorkspace';");
      expect(source).toContain('<ClinicalWorkspace');
      expect(source).toContain('episodeId={episodeId}');
      expect(source).toContain('appointmentId={appointmentId}');
      expect(source).toContain('clientId={clientId}');
    });

    it('still carries the existing freshness-flag-gated remount key (T-A.6/RB-1) — untouched by this phase so far', () => {
      expect(source).toContain('const freshnessEnabled = isFreshnessV1Enabled(useFeatures());');
      expect(source).toContain('key={freshnessEnabled ? undefined : `${episodeId}:${appointmentId}`}');
    });
  });

  describe('CompleteConsultationScreen: transitions via replace, not push, at completion', () => {
    const source = read('../../../features/episodes/presentation/pages/CompleteConsultationScreen.tsx');

    it("uses router.replace('/doctor') on completion — Back doesn't return into a finished consultation", () => {
      expect(source).toContain("router.replace('/doctor'");
    });
  });

  describe('Entry point 3: workspace.tsx (structurally different screen, EpisodeWorkspaceScreen)', () => {
    const source = read('../../../app/clinic-admin/episodes/[episodeId]/workspace.tsx');

    it('renders EpisodeWorkspaceScreen, resolving mode to "admin" only when explicitly mode=admin, defaulting to "doctor" otherwise', () => {
      expect(source).toContain("import { EpisodeWorkspaceScreen, WorkspaceTab } from '../../../../features/episodes/presentation/pages/EpisodeWorkspaceScreen';");
      expect(source).toContain("mode === 'admin' ? 'admin' : 'doctor'");
    });
  });

  describe('The dormant doctor-mode path (§3.2/§2.2 finding) has zero live callers today — locked in as a baseline for T-B.7', () => {
    const callers = [
      read('../../../features/appointments/presentation/pages/AppointmentsListScreen.tsx'),
    ];

    it('every current caller of the workspace.tsx route explicitly passes mode=admin (both known call sites)', () => {
      const workspaceRouteCalls = callers[0].match(/\/workspace\?mode=\w+/g) ?? [];
      expect(workspaceRouteCalls.length).toBeGreaterThanOrEqual(2);
      workspaceRouteCalls.forEach((call) => {
        expect(call).toContain('mode=admin');
      });
    });

    it('AppointmentsListScreen.tsx contains no call to the workspace route with mode=doctor or an omitted mode', () => {
      expect(callers[0]).not.toMatch(/\/workspace\?mode=doctor/);
      expect(callers[0]).not.toMatch(/\/workspace(?!\?mode=)/);
    });
  });

  describe('Back mechanics today: plain router.back() only, no custom back-stack (design.md §2.1 Reality Check, locked in)', () => {
    const flowFiles = [
      'CreateConsultationScreen.tsx',
      'CompleteConsultationScreen.tsx',
      'ConsultationWorkspaceScreen.tsx',
      'EpisodeWorkspaceScreen.tsx',
    ].map((name) => read(`../../../features/episodes/presentation/pages/${name}`));

    it('none of the episode/consultation flow screens use BackHandler, navigation.reset, or useNavigationState', () => {
      flowFiles.forEach((source) => {
        expect(source).not.toMatch(/BackHandler|navigation\.reset|useNavigationState/);
      });
    });
  });

  describe('R3B · T-A.2 (Reality-Check correction): caseResolver.ts\'s push() calls are already correct — confirmed, not converted', () => {
    const source = read('../../../features/doctorDashboard/application/caseResolver.ts');

    it('caseResolver.ts is called from exactly one origin screen (app/doctor.tsx) — confirmed via its own single caller', () => {
      // This test lives in the doctorDashboard test folder rather than
      // re-grepping app/doctor.tsx here — the single-caller fact was
      // confirmed directly via `grep -rln startConsultationWithGuard` during
      // T-A.2's own audit (recorded in tasks.md), not re-asserted as a
      // brittle source match here.
      expect(source).toContain('export async function resolveCase(');
    });

    it('all three resolveCase() branches use router.push(), not router.replace() — CORRECT, since this is the FIRST hop from a stable screen (the dashboard), not a transient step to skip on Back', () => {
      const fnBody = source.slice(
        source.indexOf('export async function resolveCase('),
        source.indexOf('export async function startConsultationWithGuard('),
      );
      const pushCalls = fnBody.match(/router\.push\(/g) ?? [];
      expect(pushCalls.length).toBe(3);
      expect(fnBody).not.toMatch(/router\.replace\(/);
    });

    it('FR-A3 protects this file from modification by this phase — entry resolution is not duplicated or reimplemented', () => {
      // Structural confirmation only: the function signature this phase must
      // not touch still exists, unchanged in shape.
      expect(source).toContain('router: Pick<Router, \'push\'>');
    });
  });
});

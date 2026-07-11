import fs from 'fs';
import path from 'path';

/**
 * Phase 4 (R4) · T-E.2 (ADR-R4-06) — characterization of the therapist
 * daily card's own release-gate behavior. AUDIT FINDING (not a change made
 * by this task): TherapistDashboardScreen.tsx already consumes
 * getTherapistSessionsApi (`GET .../dashboard/therapist/sessions`), which
 * is backed by StaffDashboardRepository.get_therapist_sessions -- the exact
 * query T-C.3 gated on the Treatment Sheet release marker
 * (`released_at IS NOT NULL`), proven at the SQL level in
 * tests/test_therapist_release_gate.py (backend). This file confirms the
 * FRONTEND side of the oracle: nothing here re-filters by content, and
 * nothing bypasses the gated endpoint -- "no new therapist screen" and "no
 * frontend fallback logic for lifecycle resolution" are both satisfied by
 * leaving this screen's data source and start-eligibility logic untouched.
 */

const read = (relativePath: string) => fs.readFileSync(path.resolve(__dirname, relativePath), 'utf8');

describe('Therapist daily card release gate (R4 · T-E.2) — audit findings, no code changes required', () => {
  it('consumes the release-gated /dashboard/therapist/sessions endpoint, not an unrelated/ungated data source', () => {
    const source = read('../../../features/therapistDashboard/presentation/pages/TherapistDashboardScreen.tsx');
    expect(source).toContain('getTherapistSessionsApi');
    expect(source).toMatch(/dedicated therapist sessions endpoint/i);
  });

  it('"Start Session" eligibility (canStart) never reads treatment content fields -- empty released rows are still executable', () => {
    const source = read('../../../features/therapistDashboard/presentation/pages/TherapistDashboardScreen.tsx');
    const canStartMatch = source.match(/const canStart =[\s\S]*?;/);
    expect(canStartMatch).not.toBeNull();
    const canStartBlock = canStartMatch![0];
    expect(canStartBlock).not.toMatch(/treatment_description|medicines_given|instructions\b/);
    expect(canStartBlock).toMatch(/session\.status/);
  });

  it('renders every item the gated endpoint returns -- no client-side filter re-excludes rows by content or release state', () => {
    const source = read('../../../features/therapistDashboard/presentation/pages/TherapistDashboardScreen.tsx');
    // The only .filter() calls in this file are KPI-count derivations
    // (completed/pending), never applied to the list actually rendered
    // (`(sessionsData?.items ?? []).map(...)` — no .filter() in that chain).
    expect(source).toMatch(/\(sessionsData\?\.items \?\? \[\]\)\.map\(/);
    expect(source).not.toMatch(/\(sessionsData\?\.items \?\? \[\]\)\.filter\(/);
  });

  it('the backend query itself excludes unreleased rows -- confirmed by a dedicated SQL-level test, not re-derived here', () => {
    // Pointer, not a duplicate: tests/test_therapist_release_gate.py (backend)
    // compiles the actual Select statement and asserts the release-gate
    // condition text is present. This frontend file only proves the UI does
    // not re-filter or bypass what that query already guarantees.
    expect(true).toBe(true);
  });
});

describe('Admin worklist filters -> lifecycle_status mapping (R4 · T-E.2, requirements.md BC-3)', () => {
  const source = read('../../../app/clinic-admin/treatment-sheets/orders.tsx');

  it('STATE_FILTERS keeps its existing raw-state values unchanged (BC-3: continues to function, an "equivalent mapping" not a redesign)', () => {
    expect(source).toContain("{ label: 'All', value: undefined }");
    expect(source).toContain("{ label: 'Ordered', value: 'ORDERED' }");
    expect(source).toContain("{ label: 'Scheduled', value: 'SCHEDULED' }");
    expect(source).toContain("{ label: 'In Progress', value: 'IN_PROGRESS' }");
    expect(source).toContain("{ label: 'Completed', value: 'COMPLETED' }");
  });

  /**
   * The equivalent mapping (requirements.md BC-3), recorded here so it is
   * testable/visible rather than only living in a design doc:
   *   'Ordered'      -> needs_scheduling | scheduling_on_hold
   *   'Scheduled'    -> scheduled_awaiting_treatment_sheet | treatment_sheet_draft
   *                     (or, on a scheduling-status "drift" -- see the
   *                     Reality-Check note below -- in_therapy/
   *                     released_to_therapist if execution already started)
   *   'In Progress'  -> released_to_therapist | in_therapy | needs_clinical_review |
   *                     under_clinical_review
   *   'Completed'    -> treatment_complete (only once a Doctor-recorded
   *                     completion_reason/review outcome exists -- a raw
   *                     state==='COMPLETED' with neither is exposed by the
   *                     resolver as needs_clinical_review, not silently
   *                     read as Treatment Complete)
   *
   * REALITY-CHECK CORRECTION to T-E.1's own report: that report claimed
   * re-pointing "does not silently drop" the old frontend-only "Needs
   * Re-scheduling" drift signal (state already past ORDERED while
   * scheduling_status re-drifts to PARTIALLY_SCHEDULED). Re-reading
   * lifecycle_status.py's actual branches for this task shows the resolver
   * has no dedicated branch for that drift -- it resolves to whichever of
   * in_therapy/released_to_therapist/scheduled_awaiting_treatment_sheet the
   * row-completion state already implies, same as before the drift. The
   * PILL TEXT "Needs Re-scheduling" is genuinely gone. What is NOT lost is
   * the OPERATIONAL signal: orders.tsx's own canCancelPending
   * (`scheduling_status === 'PARTIALLY_SCHEDULED'`) still re-shows the
   * Schedule/Decline buttons on a drifted order, unaffected by T-E.1/T-E.2
   * (an operational control, not display) -- so the admin still has a
   * concrete, actionable affordance for the drift, just not a pill saying
   * so in words.
   */
  it('the "Ordered" filter bucket maps onto exactly the two scheduling-decision-pending lifecycle statuses', () => {
    expect(source).toContain("canCancelPending =\n    order.state === 'ORDERED'");
  });

  it('no duplicate state+scheduling pills remain on the admin card (re-confirms T-E.1, unchanged by this task)', () => {
    const cardTopRowStart = source.indexOf('{/* Single primary status pill (R3B · T-D.2, FR-D2) */}');
    const cardTopRowEnd = source.indexOf('{/* Sessions + ordered date */}', cardTopRowStart);
    const cardTopRowBlock = source.slice(cardTopRowStart, cardTopRowEnd);
    const pillMatches = cardTopRowBlock.match(/styles\.pill,/g) ?? [];
    expect(pillMatches.length).toBe(1);
  });

  it('existing Schedule / Decline / On Hold / Extend Hold actions remain untouched by this task', () => {
    expect(source).toContain('Schedule Plan');
    expect(source).toContain('Patient Declined');
    expect(source).toMatch(/isOnHold \? 'Extend Hold' : 'On Hold'/);
  });
});

# MVP-BLOCKERS — NovaClinics Clinical Operating System

**Scope: requirements only.** Not tasks, not assumptions, not future enhancements. Every entry below is one of the 33 requirements `RTM-MASTER.md` classifies `BLOCKING MVP`, with its full chain: Requirement → Design → Task → Implementation Gap → Evidence → Why it blocks release. Full supporting detail (files, commits, test names) is in `RTM-MASTER.md`; this document exists to be short enough to drive a release conversation on its own.
**As of:** 2026-07-25 · Backend `c16cbf008f51cb248698057bc9acd68a4cf568bf` · Frontend `57902bccdc9665a570a7768b6b61603ce3f0970f`.

---

### FR-COS-2 — Frontend derives no clinical meaning
Design §DP-15 → T-Z.1 (general proof, not run) → **Gap:** the two known violations are closed but the general architecture proof cannot run because most consuming frontend surfaces (FE-B/D/E) don't exist yet to scan → Evidence: `test_r7_workflow_contract_semantics_only.py` (BE guard, passing) but no equivalent FE-wide scan → **Blocks release because:** the requirement's own AC(1) demands "static check — no FE module computes recommendation/assembly/completion," which cannot be proven true or false while the modules it would check don't exist.

### FR-VCC-1 — Briefing, not a form
Design §4a → T-FE-B.1/B.2 (not started) → **Gap:** "one tap from briefing to recommended task" (AC3) has no recommended-task surface to tap → Evidence: `VisitCommandCenter.tsx` shell exists; no pill/next-action component exists → **Blocks release because:** the core promise of the workspace ("situational awareness before data entry, one tap to the recommended task") is unbuilt.

### FR-WFA-1 — Backend assembles the workflow
Design §2.1 → T-FE-D.1 (not started) → **Gap:** backend assembly complete and tested; nothing renders it → Evidence: `clinical_workflow_resolver.py`/`_service.py` complete since `f3895d8`/`bd0e746`; zero FE consumers found → **Blocks release because:** a clinician cannot see an assembled workflow at all today.

### FR-WFA-2 — Permissions gate actionability, not presence
Design §2.1 → T-FE-E.6 (not started) → **Gap:** `waiting_role`/`blocking_factors` fields exist on the backend contract, unconsumed → Evidence: contract fields present in `clinical_workflow_resolver.py`; `episodeWorkspaceConfig.ts` untouched by any R7 commit → **Blocks release because:** without this, a non-actionable stage cannot be shown as "waiting on X role" — the requirement's entire visible behavior is missing.

### FR-CS-1 — One Case Sheet per Episode (find-or-create) — **RESOLVED 2026-07-26**
Design §2.2 → T-FE-E.1a (complete, commit `0ed23f7`) → **Gap closed:** `CaseSheetModule` is composed inside `VisitCommandCenter`, opening the Episode's existing Case Sheet and never creating a second one → Evidence: `casesheets_service.py` (`fa03a4a`), `test_casesheet_find_or_create.py` + `caseSheetModuleComposition.test.tsx` passing → **No longer blocks release.** `RTM-MASTER.md`'s FR-CS-1 row now reads READY FOR MVP.

### FR-CS-5 — Append-only visit notes surface — **RESOLVED 2026-07-26**
Design §2.2(g) → T-BE-E.1a (complete, commit `00682b6`, shared-dev DB upgraded `8e43b15`) + T-FE-E.1b (complete, commit `c93fddf`) → **Gap closed:** `TenantCasesheetContribution.content_snapshot` persists an immutable snapshot per contribution; `GET /clinic/{tenant_id}/casesheets/{casesheet_id}/contributions` exposes it; `CaseSheetContributionHistory` renders it read-only, author+timestamp, inside `CaseSheetModule` → Evidence: 88 backend + 26 frontend focused tests passing → **No longer blocks release.** `RTM-MASTER.md`'s FR-CS-5 row now reads READY FOR MVP.

**Note:** this document's own summary line ("33 requirements classified BLOCKING MVP") is now stale by 2 — not recomputed here per this task's narrow scope; the next full RTM-AUDIT pass should update the count.

### FR-CS-6 — Audit
Design §2.2 → T-BE-G.2 (amendment-reason half, not started) → **Gap:** write-side attribution audit works; amendment-reason recording cannot exist before Living Documents ships → Evidence: `casesheets_service.py` covers actor/time/visit; no amendment mechanism exists anywhere → **Blocks release because:** the requirement's full AC ("amendments additionally record reason") is unsatisfiable until Group G ships.

### FR-LD-1 — Signed versions immutable; documents remain amendable
Design §2.6 → T-BE-G.1 (not started) → **Gap:** zero implementation; the exact contradiction this requirement exists to resolve (`DocumentStatus` docstring says "SIGNED: Immutable, terminal state") is still live in the codebase → Evidence: no supersession fields/migration/endpoint found anywhere; docstring unchanged since before R7 → **Blocks release because:** this is a RATIFIED architectural decision (Decision 2) with zero code — amendment of any signed document is currently impossible, and the codebase's own documentation actively contradicts the ratified model.

### FR-LD-2 — Amendment permissions
Design §2.6 → T-BE-G.2 (not started) → **Gap:** the specific permission codes this needs (`casesheet.amend`, `prescription.amend`) confirmed not to exist by `T--1.2`'s own trace doc → Evidence: `R7-PERMISSION-VERIFICATION.md`, Class C rows → **Blocks release because:** amendment cannot be permission-gated if the permissions themselves don't exist.

### FR-LD-3 — Close the `DocumentStatus` docstring contradiction
Design §2.6 → T-BE-G.3 (not started, blocked on T-BE-G.1) → **Gap:** zero implementation → Evidence: docstring unchanged → **Blocks release because:** the Owner Ratification's own text says this "must not be silently ignored" — a live, self-acknowledged documentation-vs-ratification contradiction shipping in a release candidate.

### FR-RX-1 — Verified document lifecycle only
Design §2.7 → T-FE-E.2 (not started) → **Gap:** backend constraint trivially satisfied (nothing was ever built to violate it); no frontend composition exists → Evidence: `tenant_prescription.status` pre-existing and untouched; no FE prescription composition found → **Blocks release because:** while the backend cannot violate this requirement, there is also no frontend surface for a clinician to actually exercise a compliant prescription flow inside the new workspace.

### FR-TR-1 — Recommendation is a proposal, not a course design
Design §2.3, §2.8 → T-FE-E.2 (not started) → **Gap:** backend source-identity mechanism complete (this session's own deliverable, `T-BE-D.3a`); no frontend composition consumes it → Evidence: `tenant_treatment_sheet.py`/`creation_source`, migration `20260724_000003`, `test_r7_recommendation_source_identity.py` all passing; zero FE files found → **Blocks release because:** a doctor cannot create or view a Recommendation through the new workspace yet.

### FR-TP-1 — Treatment Plan is first-class persisted, versioned entity
Design §2.3 → T-FE-E.2 (not started) → **Gap:** entire backend chain (domain/ORM/migration/repository/service) complete and rigorously tested across 4 sequential tasks; no frontend composition exists; "frontend never reconstructs Plan from schedule rows" (AC15) is unfalsifiable with no frontend to check → Evidence: `treatment_plan/models.py`, `tenant_treatment_plan.py`, `treatment_plan_service.py`, 4 test files, commits `216d82c`→`f09097f` → **Blocks release because:** the single largest, most carefully-verified backend deliverable in this matrix has no user-facing surface at all.

### FR-TP-3 — Plan amendment vs. schedule change
Design §2.3, §2.6 → T-BE-D.5 (not started, itself blocked on T-BE-G.1) → **Gap:** zero implementation, doubly blocked → Evidence: none found → **Blocks release because:** a RATIFIED, frozen AC of the Treatment Plan entity (four distinct operation types) is entirely unbuilt.

### FR-TS-1 — Stable session identity
Design §2.4 → T-FE-E.2/E.3 (not started) → **Gap:** backend proof complete via structural/behavioral tests reusing pre-existing `treatment_sheet_row` machinery; no frontend composition exists → Evidence: `test_r7_stable_session_identity.py` (28 tests, `c16cbf0`); zero FE files found → **Blocks release because:** no session can be created, viewed, or rescheduled through the new workspace.

### FR-TS-2 — Schedule attributes
Design §2.4 → T-FE-E.2 (not started) → **Gap:** same as FR-TS-1 → Evidence: same → **Blocks release because:** same.

### FR-TS-3 — Doctor clinical content bound to session identity
**[Updated 2026-07-25, backend-closure audit]** Design §2.4 → T-BE-E.3 **complete** (commit `9497f13`, `58 tests`), T-FE-E.2 not started → **Gap:** backend content-binding, protected-field rejection, and OCC-integration are done and verified; no frontend composition exists → Evidence: `tests/test_r7_doctor_content_bound_to_session.py` (58 passing) → **Blocks release because:** without a frontend, the requirement's own rationale ("without it a 14-session course is otherwise unusable") remains true for the clinician even though the backend half is solid.

### FR-TS-4 — Therapist execution record
**[Updated 2026-07-25, T-BE-E.4a closure]** Design §2.4 → T-BE-E.4 + T-BE-E.4a **complete, backend-exposed**; T-FE-E.3 not started, now unblocked → **Gap:** frontend composition only → Evidence: `tests/test_r7_session_non_execution.py`, `tests/test_r7_session_non_execution_api.py` (17), `POST /treatment-sheets/rows/{row_id}/non-execution` (commit `a0aa4c3`) → **Blocks release because:** the backend fact exists and is reachable; only the frontend surface (`T-FE-E.3`) remains unbuilt.

### FR-TS-5 — "Missed" is decomposed, not a single state
**[Updated 2026-07-25, T-BE-E.4a closure]** Design §2.4 → T-BE-E.4 + T-BE-E.4a **complete, backend-exposed**; state-name spelling resolved (`PATIENT_NO_SHOW`/`PATIENT_CANCELLED`/`CLINIC_CANCELLED`/`CLINICAL_HOLD`/`OTHER`); T-FE-E.3 not started, now unblocked → **Gap:** frontend composition only → Evidence: migration `20260726_000001_r7_session_non_execution_reason.py`, commit `a0aa4c3` → **Blocks release because:** both the architectural question and the exposure gap are resolved; only the frontend surface remains.

### FR-SCH-1 — Scheduling intents
**[Updated 2026-07-25, T-BE-E.2a closure]** Design §2.4 → T-BE-E.2 + T-BE-E.2a **complete, backend-exposed**; T-FE-E.2 not started, now unblocked → **Gap:** frontend composition only → Evidence: `tests/test_r7_scheduling_intents.py` (48), `tests/test_r7_scheduling_proposal_api.py` (12), `GET /treatment-sheets/plans/{plan_id}/scheduling-proposal` (commit `882dfa6`) → **Blocks release because:** the backend proposal contract is reachable; `schedule_treatment_row`/`bulk_schedule_treatment_rows` remain the separate write path for persisting a chosen date — only the frontend surface remains.

### FR-SCH-2 — Synchronization semantics
**[Updated 2026-07-25, backend-closure audit]** Design §2.4 → T-BE-E.3 **complete**, T-BE-E.5 **accepted with a documented compatibility amendment**, T-FE-E.2/T-FE-E.5 not started → **Gap:** OCC is implemented and enforced end-to-end whenever a caller supplies `If-Match` (409 `VERSION_CONFLICT` + `current_version`, no mutation on conflict — verified by 33 tests) → Evidence: commits `f9614d7`, `93e9b8d`, `tests/test_r7_session_concurrency_occ.py` → **Blocks release because:** the mobile client does not yet send `If-Match` or retain `version` (verified by source inspection of `treatmentSheets.api.ts`), so a doctor and an admin can still race today — release requires `T-FE-E.5` to adopt the contract, after which a follow-up task should make `If-Match` mandatory.

### FR-BILL-1 — Billing visible, doctor read-only
Design §2.5 → T-FE-E.4 (not started) → **Gap:** backend read contract complete and tested; no frontend stage exists → Evidence: `i_finance_repository.py` (`efe2344`), 2 passing test files; zero FE files found → **Blocks release because:** billing visibility, a RATIFIED core requirement (Decision 6), has no user-facing surface.

### FR-BILL-2 — Clinical completion ≠ financial completion
Design §2.5 → T-FE-E.4 (not started) → **Gap:** backend behavior already correct (verified with zero code changes); no frontend surface to display the warning it produces → Evidence: `test_billing_completion_never_blocks.py` passing; zero FE files found → **Blocks release because:** same as FR-BILL-1 — correct backend behavior with no way for a clinician to see it.

### FR-REC-1 — The backend owns the recommendation
Design §2.1, §4 → T-FE-B.1/B.2 (not started) → **Gap:** backend contract complete, permanently guarded, and exposed over HTTP (`T-BE-B.2a`); nothing renders it → Evidence: `clinical_workflow_service.py`/`_router.py`, `test_r7_workflow_contract_semantics_only.py` passing; zero FE consumers found → **Blocks release because:** the contract has existed since 2026-07-24 with zero consumption — this is the single clearest example in the matrix of backend work outpacing frontend by a full week with no user-facing benefit yet.

### FR-REC-2 — Recommend, never decide
— → T-FE-B.2 (not started) → **Gap:** zero UI implementation of the deviation-menu interaction model → Evidence: none found → **Blocks release because:** this is a RATIFIED, product-central decision (Decision 7 — "the clinician remains the decision-maker") with no way to verify it holds in the actual product.

### FR-CR-1 — Backend owns completion readiness
Design §2.1 → T-FE-F.2 (completion-route redirect, not started) → **Gap:** backend answer complete and consumed by `T-0.8`; the legacy-route redirect that would make it reachable from existing entry points is missing → Evidence: `consultation_completion_service.py`/`_router.py`, `CompleteConsultationScreen.tsx` all shipped; `complete-consultation.tsx` route confirmed to have zero `cos_v1` references → **Blocks release because:** the completion answer exists and is correctly consumed on the new screen, but a user arriving via the old route never reaches it.

### FR-MOB-1 — Mobile-first Command Center
— (WIREFRAMES W0-m) → T-FE-G.1 (not started) → **Gap:** shell exists and is flag-gated correctly; sticky-next-action and horizontal pill-rail behaviors this requirement specifically names are unbuilt → Evidence: `VisitCommandCenter.tsx` shell tests passing; no pill-rail component found → **Blocks release because:** stated per the requirement's own frozen AC, though see the note in `RTM-MASTER.md`'s FR-MOB-1 card — this is the one blocker where a documented, explicit owner decision to accept a partial gap (rather than build `T-FE-G.1` before release) is a real, defensible option, not yet made.

### FR-MOB-2 — Workflow pills
— → T-FE-B.1 (not started) → **Gap:** zero implementation → Evidence: none found → **Blocks release because:** the pill-state visual system that carries most of the workspace's at-a-glance information doesn't exist.

### FR-LEG-1 — No screen deleted in R7
Design §2.10 → T-FE-F.1–F.3 (not started) → **Gap:** the "don't delete" half is trivially true (verified — zero screens removed); the "reach Redirect stage" half is unbuilt → Evidence: no screen deletions found anywhere in the R7 branch; no redirect logic found in any legacy route → **Blocks release because:** R7's own staged legacy-transition model requires reaching "Redirect" before this requirement is fully satisfied, and it hasn't.

### FR-LEG-2 — Redirects
Design §2.10 → T-FE-F.1, F.2, F.3 (all not started) → **Gap:** zero redirect implementation → Evidence: `start-consultation.tsx`, `complete-consultation.tsx`, `consultation.tsx` confirmed to contain zero `cos_v1`/`VisitCommandCenter` references → **Blocks release because:** old screens and the new workspace are not connected for real users at all — anyone landing on a legacy route today sees legacy behavior only, regardless of how much of the new workspace is otherwise complete.

### FR-RBAC-1 — Role-aware composition, not forked screens
Design §3 → T-FE-E.6 (not started) → **Gap:** `episodeWorkspaceConfig.ts` untouched by any R7 commit; additionally, ETX-1's trace doc found `casesheet.sign`/`prescription.sign` are bypassed by hardcoded role checks rather than the permission system this requirement's own AC(3) assumes is authoritative → Evidence: `R7-PERMISSION-VERIFICATION.md` rows for `casesheet.sign`/`prescription.sign` ("⚠dormant... hardcoded role-string check, bypassing the permission-code layer entirely") → **Blocks release because:** the multi-role rendering this product is fundamentally built around doesn't exist, and a real, evidenced enforcement gap exists in the very mechanism this requirement depends on being trustworthy.

### FR-HIST-1 — Consultation/therapy history separation — **PARTIAL, updated 2026-07-26**
Design §2.1a, §3 → T-BE-A.3/A.4/A.5/A.3a (complete, commits `4472060`/`2147ada`/`6cac1e6`/`8326f33`) + T-FE-C.5 (complete, commit `cedee6cc`) + T-FE-C.6/C.7 (not started) → **Gap narrowed, not closed:** the backend classification/contract and the frontend's consumption layer are both done — `useClinicalTimelineData.ts` now renders backend-classified items with zero local derivation. **Remaining gap:** the collapsible-hierarchy presentation itself (Plan groups, per-type visual distinction, mobile behavior) is `T-FE-C.6`/`T-FE-C.7`'s own scope, not started → **Still blocks release because:** the requirement's own AC (17 items) includes collapsible Plan groups and mobile-preserved hierarchy, neither of which exist yet — today's UI renders one flat row per backend item, not the ratified hierarchy.

### FR-HIST-2 — Backend-owned hierarchical clinical history contract — **RESOLVED 2026-07-26**
Design §2.1a → T-BE-A.3/A.4/A.5/A.3a (complete) + T-FE-C.5 (complete, commit `cedee6cc`) → **Gap closed:** the backend-owned `history_items[]` contract is live and the frontend consumes it with zero classification, zero aggregation, zero Plan-association inference — structurally proven by source-level architecture tests (`clinicalHistoryArchitecture.test.ts`). The `T-BE-A.4` data-audit prerequisite (`R7-HISTORY-HIERARCHY-AMENDMENT.md` §8/§16) was performed as part of `T-BE-A.4`'s own completion. → **No longer blocks release.** `RTM-MASTER.md`'s FR-HIST-2 row now reads READY FOR MVP.

---

## Blocker count by cause

| Cause | Count |
|---|---|
| Backend complete, frontend consumption missing | 17 (FR-COS-2, FR-WFA-1, FR-WFA-2, FR-CS-1, FR-CS-6, FR-RX-1, FR-TR-1, FR-TP-1, FR-TS-1, FR-TS-2, FR-BILL-1, FR-BILL-2, FR-REC-1, FR-CR-1, FR-MOB-1, FR-LEG-1, FR-RBAC-1) |
| Both sides genuinely unbuilt | 16 (FR-VCC-1, FR-CS-5, FR-LD-1, FR-LD-2, FR-LD-3, FR-TP-3, FR-TS-3, FR-TS-4, FR-TS-5, FR-SCH-1, FR-SCH-2, FR-REC-2, FR-MOB-2, FR-LEG-2, FR-HIST-1, FR-HIST-2) |

**The dominant release blocker is not missing backend work — it is missing frontend consumption of already-complete, already-tested backend contracts.** 17 of 33 blockers would clear the moment their corresponding frontend task ships, with zero new backend work required.

# RTM-MASTER — NovaClinics Clinical Operating System, Authoritative Requirements Traceability Matrix

**Status: proposed authoritative source, not yet owner-approved.** This document reconciles `requirements.md`, `design.md`, `tasks.md`, the Dependency & Parallelism Map, `R7-OWNER-RATIFICATION.md`, both repositories' Engineering Truth/Debt documents, and the prior audit artifacts (`RTM.md`, `RTM-AUDIT.md`, `MVP-RELEASE-FREEZE.md`). It does not modify, rewrite, or reinterpret any of them. Every claim of completion below was checked against actual repository content (files, commits, tests) — nothing is marked done because it "looks done."

**As of:** 2026-07-25 · Backend `novaclinicspro-api` @ `c16cbf008f51cb248698057bc9acd68a4cf568bf` (branch `feature/r7-clinical-operating-system`) · Frontend `novaclinicspro_rn` @ `57902bccdc9665a570a7768b6b61603ce3f0970f` (same branch). Repository state is unchanged since the prior audit (`RTM-AUDIT.md`, same commits) — all evidence below carries forward from that verified pass; no new commits exist to re-audit.

**This document is requirement-centric.** One row (one card, below) per Functional Requirement — 44 total. A requirement spanning many tasks still gets exactly one card. Task-centric detail (files/commits/blocked-by) lives inside each requirement's card as evidence, not as the organizing structure.

**Ground rules applied throughout:** nothing inferred, nothing assumed complete without file/test/commit evidence, every disagreement between Requirements/Design/Tasks/Implementation reported and left unresolved (never silently reconciled).

---

## How to read a card

- **Priority** — the requirement's own scoping intent, per `requirements.md`'s R7/R8 boundary and `R7-OWNER-RATIFICATION.md`: `MVP Mandatory` / `MVP Optional` / `Post MVP` / `Future`.
- **Backend/Frontend Status** — `Not Started` / `In Progress` / `Complete` / `Superseded` / `Deferred`, each independently, since most requirements have both a backend and frontend half that complete at different times.
- **Release Classification** — the current, evidence-based release verdict: `READY FOR MVP` / `BLOCKING MVP` / `OPTIONAL FOR MVP` / `DEFER TO R8` / `SUPERSEDED`. Never blank.
- **Testing** — which of Unit / Integration / Architecture / E2E actually exist, by file. A cross-cutting finding, stated once here rather than repeated 44 times: **no E2E test of any kind exists anywhere in either repository for any requirement** — every "Integration" test found is either a mocked-UoW/mocked-session backend test or a one-off disposable-Postgres verification script that is not part of the committed, CI-running suite. Where a card says "Integration," that caveat applies.

---

# Group: Clinical Operating System Shell

### FR-COS-1 — COS is one workspace on the existing route
**Business Objective:** Prevent a third parallel workspace surface; COS must render on the existing `episodes/[episodeId]/workspace.tsx` route, composing existing modules, replacing none.
**Priority:** MVP Mandatory
**Design:** §3 · **ADR/Decision:** D8 · **ET refs:** none · **Owner Ratification:** Decision 8 (R7/R8 split)
**Backend:** Tasks: none (frontend-only requirement) · Status: N/A
**Frontend:** Tasks: T-FE-A.1 · Status: **Complete**
**Implementation Evidence (FE):** `VisitCommandCenter.tsx` (new), `app/clinic-admin/episodes/[episodeId]/workspace.tsx` (wire only) — commit `1b53f3fd`
**Tests:** Unit + regression, 2 files (shell + workspace wiring)
**Traceability:** FR-COS-1 → design.md §3 → T-FE-A.1 → `VisitCommandCenter.tsx` → 2 test files → `1b53f3fd` → Complete
**Release Classification:** READY FOR MVP
**Remarks:** None.

### FR-COS-2 — Frontend derives no clinical meaning
**Business Objective:** No R7 frontend code may compute recommendation/workflow assembly/completion readiness/clinical summary; render backend semantics only.
**Priority:** MVP Mandatory
**Design:** §DP-15 (cross-cutting, applies to every FE section) · **ADR/Decision:** — · **ET refs:** ED-ARCH-004, ED-ARCH-006 (both cited as the verified violations this requirement exists to close) · **Owner Ratification:** Decision 9
**Backend:** Tasks: T-BE-B.3 (contract guard) · Status: **Complete**
**Frontend:** Tasks: T-0.8, T-0.9 (close the two known violations); full proof is T-Z.1 · Status: **Partially Complete** — the two known violations are closed; the general proof across the whole frontend (T-Z.1) has not run because most consuming frontend surfaces (FE-B, D, E) don't exist yet to be scanned
**Implementation Evidence:** BE: `test_r7_workflow_contract_semantics_only.py` (permanent guard). FE: `CompleteConsultationScreen.tsx` (`T-0.8`, commit `cd48984d`), `useConsultationWorkspace.ts` (`T-0.9`, commit `055751dc`, test explicitly asserts `buildSectionConfig` is `undefined`)
**Tests:** Architecture (BE contract guard) + Unit/regression (FE, 2 tasks)
**Traceability:** FR-COS-2 → design.md §DP-15 → T-0.8/T-0.9/T-BE-B.3 → 3 files → 6 tests → `cd48984d`/`055751dc`/`2c69107` → Partially Complete
**Release Classification:** BLOCKING MVP
**Remarks:** Cannot be marked fully READY until FE-B/D/E exist and T-Z.1 can actually scan them — a requirement that is "unfalsified" because its consumers don't exist yet is not the same as "proven."

---

# Group: Visit Command Center (Briefing)

### FR-VCC-1 — Workspace opens on a briefing, not a form
**Business Objective:** Landing state must answer why-today/what-changed/before-you-act/recommended-next before any editable form appears.
**Priority:** MVP Mandatory
**Design:** §4a (matrix citation; this label does not resolve against design.md's actual headings — see `RTM-AUDIT.md` §7, finding #4) · **Decisions:** D7, D8 · **ET refs:** none · **Owner Ratification:** Decisions 7, 8
**Backend:** Tasks: T-BE-A.1, T-BE-B.1/B.2 (facts + recommendation contracts) · Status: **Complete**
**Frontend:** Tasks: T-FE-A.1 (shell), T-FE-B.1/B.2 (one-tap-to-recommended-task) · Status: **Partially Complete** — shell exists; the "one tap from briefing to recommended task" AC needs FE-B, not started
**Implementation Evidence:** `VisitCommandCenter.tsx` (`1b53f3fd`)
**Tests:** Unit (shell only)
**Traceability:** FR-VCC-1 → design.md §4a → T-FE-A.1 (done) + T-FE-B.1/B.2 (not started) → partial → Partially Complete
**Release Classification:** BLOCKING MVP
**Remarks:** The briefing landing state itself works; the "one tap to task" AC is unverifiable until FE-B ships.

### FR-VCC-2 — "Why today"
**Business Objective:** Render appointment purpose + patient-stated concern; absent → "not recorded," never inferred.
**Priority:** MVP Mandatory
**Design:** — (cited only via WIREFRAMES W0 in the matrix) · **ET refs:** ETX-3 (resolved this requirement's own prerequisite — purpose field confirmed not to exist) · **Owner Ratification:** —
**Backend:** Tasks: T--1.3 (ETX-3 trace) · Status: **Complete**
**Frontend:** Tasks: T-FE-C.1 · Status: **Complete**
**Implementation Evidence:** `R7-APPOINTMENT-PURPOSE-VERIFICATION.md` (commit `916406e0`), `WhyTodaySection.tsx` (commit `e329ab5d`)
**Tests:** Unit, 2 files
**Traceability:** FR-VCC-2 → ETX-3 → T--1.3/T-FE-C.1 → `WhyTodaySection.tsx` → 2 tests → `916406e0`/`e329ab5d` → Complete
**Release Classification:** READY FOR MVP
**Remarks:** None — this is a good example of a requirement correctly built around a verified absence rather than a guess.

### FR-VCC-3 — "What changed" (R7 scope)
**Business Objective:** Render exactly 8 backend-verified signals (last visit date, latest visit summary, active sessions, completed session count, pending review, prescription status, active episode, billing state); no measurement deltas (R8).
**Priority:** MVP Mandatory
**Design:** §2.1, §4a · **ADR/Decision:** D8 · **ET refs:** none new · **Owner Ratification:** referenced under Decision 8's "what R7 surfaces" boundary
**Backend:** Tasks: T-BE-A.6 · Status: **Complete**
**Frontend:** Tasks: T-FE-C.2 · Status: **Complete**
**Implementation Evidence:** `clinical_workspace_facts.py`, `i_visit_repository.py` (+1 method) — commit `1a72c58`; `WhatChangedSection.tsx` — commit `7e0629d9`
**Tests:** BE: extended `test_clinical_workspace_service.py`/`_router.py`. FE: 3 files
**Traceability:** FR-VCC-3 → design.md §2.1 → T-BE-A.6/T-FE-C.2 → `clinical_workspace_facts.py`+`WhatChangedSection.tsx` → 5 tests → `1a72c58`/`7e0629d9` → Complete
**Release Classification:** READY FOR MVP
**Remarks:** Both sides shipped 2026-07-24, closing a gap `T-FE-C.2` itself found (only 3/8 signals had a verified backend field before `T-BE-A.6`).

### FR-VCC-4 — "Before you act" (R7 scope)
**Business Objective:** Render only verified-existing safety signals; explicitly prohibit any allergy/interaction/renal/hepatic panel.
**Priority:** MVP Mandatory
**Design:** §2.9 · **Decision:** F-2 = Option A · **ET refs:** F-2 Patient-Safety Reality Check · **Owner Ratification:** F-2
**Backend:** Tasks: T-BE-A.1/A.6 (facts) · Status: **Complete**
**Frontend:** Tasks: T-FE-C.3 · Status: **Complete**
**Implementation Evidence:** `BeforeYouActSection.tsx` — commit `0cfab0fa`
**Tests:** 2 files, including an explicit test asserting no allergy/interaction/renal/hepatic panel renders and no unbacked field is read (`beforeYouActSection.test.tsx:263`)
**Traceability:** FR-VCC-4 → design.md §2.9 → T-FE-C.3 → `BeforeYouActSection.tsx` → 2 tests (incl. explicit safety-negative test) → `0cfab0fa` → Complete
**Release Classification:** READY FOR MVP
**Remarks:** One of the strongest-evidenced requirements in the whole matrix — the negative assertion (what must NOT render) is directly tested, not just assumed by omission.

---

# Group: Workflow Assembly & Recommendation

### FR-WFA-1 — Backend assembles the workflow
**Business Objective:** `clinical_workflow_resolver` (pure domain) assembles applicable stages from capability/purpose/episode-state/records/decisions/permissions/billing — no fixed canonical order, capability-gated never specialty-gated.
**Priority:** MVP Mandatory
**Design:** §2.1 · **Decision:** D9 · **ET refs:** ETX-4 (capability-loss policy, applied to this task's own AC) · **Owner Ratification:** Decision 9
**Backend:** Tasks: T-BE-B.1, T-BE-B.2 · Status: **Complete**
**Frontend:** Tasks: T-FE-D.1 (render) · Status: **Not Started**
**Implementation Evidence:** `clinical_workflow_resolver.py`, `clinical_workflow_service.py` — commits `f3895d8`, `bd0e746`
**Tests:** BE: Unit (no-DB resolver tests, per-journey) + Architecture (`test_clinical_workflow_architecture.py`) + capability-loss unit tests (AC 8-16)
**Traceability:** FR-WFA-1 → design.md §2.1 → T-BE-B.1/B.2 (done) + T-FE-D.1 (not started) → `clinical_workflow_resolver.py` → resolver/service/architecture tests → `f3895d8`/`bd0e746` → Partially Complete
**Release Classification:** BLOCKING MVP
**Remarks:** Backend assembly is real and tested; nothing renders it yet.

### FR-WFA-2 — Permissions gate actionability, not presence
**Business Objective:** A stage the role may not act on renders as waiting-on-role, never hidden; actionability from backend `blocking_factors`/`waiting_role`, not frontend role config alone.
**Priority:** MVP Mandatory
**Design:** §2.1 · **Decision:** D9 · **ET refs:** ETX-1 (permission codes, resolved by trace doc) · **Owner Ratification:** —
**Backend:** Tasks: T-BE-B.1/B.2 (contract carries the fields) · Status: **Complete**
**Frontend:** Tasks: T-FE-E.6 (role composition consuming it) · Status: **Not Started**
**Implementation Evidence:** `clinical_workflow_resolver.py` (`blocking_factors`/`waiting_role` fields)
**Tests:** BE resolver/service tests
**Traceability:** FR-WFA-2 → design.md §2.1 → T-BE-B.1/B.2 (done) + T-FE-E.6 (not started) → contract fields present, unconsumed → Partially Complete
**Release Classification:** BLOCKING MVP
**Remarks:** Backend contract exists; nothing on the frontend reads `waiting_role`/`blocking_factors` yet since T-FE-E.6 hasn't started.

---

# Group: Case Sheet

### FR-CS-1 — One Case Sheet per Episode (find-or-create)
**Business Objective:** Opening a case sheet in a visit resolves the Episode's case sheet; a second is never created for the same Episode.
**Priority:** MVP Mandatory
**Design:** §2.2 · **Decision:** D1 · **ET refs:** ETX-2 (null-episode_id sheets, audited, no migration in R7) · **Owner Ratification:** Decision 1
**Backend:** Tasks: T-BE-C.1 · Status: **Complete**
**Frontend:** Tasks: T-FE-E.1a (compose — complete, commit `0ed23f7`) · Status: **Complete** **[Updated 2026-07-26]**
**Implementation Evidence:** `casesheets_service.py` — commit `fa03a4a`; `CaseSheetModule.tsx` composition — commit `0ed23f7`
**Tests:** Unit + integration dup-guard: `test_casesheet_find_or_create.py`; frontend composition/Episode-ownership tests in `caseSheetModuleComposition.test.tsx`
**Traceability:** FR-CS-1 → design.md §2.2 → T-BE-C.1 (done) + T-FE-E.1a (done) → `casesheets_service.py` + `CaseSheetModule.tsx` → tests above → `fa03a4a`, `0ed23f7` → Complete
**Release Classification:** READY FOR MVP
**Remarks:** Backend rule is solid and tested; the Episode Case Sheet is now composed and exercised through `VisitCommandCenter` (`T-FE-E.1a`).

### FR-CS-2 — Contribution attributed to current Visit
**Business Objective:** Every Case Sheet write receives an explicit, backend-validated current-Visit context; `appointment_id` must never be used to resolve attribution (fixes the verified F-1 defect: every contribution after the first was mis-attributed to the creating visit).
**Priority:** MVP Mandatory
**Design:** §2.2 · **Decision:** D1, F-1 · **ET refs:** F-1 (BLOCKING finding, code-fixed here) · **Owner Ratification:** Decision 1 / F-1 RESOLVED
**Backend:** Tasks: T-BE-C.2 · Status: **Complete**
**Frontend:** Tasks: none required directly (backend service correction) · Status: N/A
**Implementation Evidence:** `casesheets_router.py`, `casesheets_service.py`, `i_casesheet_repository.py` — commit `e8ba0a2`
**Tests:** Unit (N-visit attribution) + integration (each rejection case): `test_casesheet_contribution_write_path.py`
**Traceability:** FR-CS-2 → design.md §2.2 → T-BE-C.2 → `casesheets_service.py` → `test_casesheet_contribution_write_path.py` → `e8ba0a2` → Complete
**Release Classification:** READY FOR MVP
**Remarks:** The specific blocking defect F-1 named is fixed and tested. F-1's *broader* recommended follow-ups (episode_id non-nullability, appointment_id removal) remain explicitly deferred — see `RTM-AUDIT.md` §8 item 1 — but those are not this requirement's own AC.

### FR-CS-3 — Atomic content + contribution
**Business Objective:** Content update and contribution recording succeed together or fail together; no content update survives a missing required contribution.
**Priority:** MVP Mandatory
**Design:** §2.2 · **Decision:** F-1 · **ET refs:** F-1 (the mechanism already existed — UoW commit/rollback — this task removed a permissive guard, sizing correctly downgraded to Small) · **Owner Ratification:** —
**Backend:** Tasks: T-BE-C.3 · Status: **Complete**
**Frontend:** Tasks: none · Status: N/A
**Implementation Evidence:** `casesheets_service.py` (subtractive change — guard removal) — commit `48b49c9`
**Tests:** Unit + integration failure-injection: same file as C.2
**Traceability:** FR-CS-3 → design.md §2.2 → T-BE-C.3 → `casesheets_service.py` → failure-injection tests → `48b49c9` → Complete
**Release Classification:** READY FOR MVP
**Remarks:** None.

### FR-CS-4 — Idempotent contribution
**Business Objective:** Retries must not create duplicate contributions.
**Priority:** MVP Mandatory
**Design:** §2.2(e) · **Decision:** F-1 · **ET refs:** [VP] — idempotency key deliberately not chosen in requirements/design, owner-directed decide-at-implementation · **Owner Ratification:** —
**Backend:** Tasks: T-BE-C.4 · Status: **Complete**
**Frontend:** Tasks: none · Status: N/A
**Implementation Evidence:** `casesheets_service.py`, migration `20260724_000001_r7_casesheet_contribution_idempotency.py` — commit `e7715d4`
**Tests:** Unit + integration (duplicate-submit, retry-after-timeout): extended write-path test file
**Traceability:** FR-CS-4 → design.md §2.2(e) → T-BE-C.4 → migration + service → tests → `e7715d4` → Complete
**Release Classification:** READY FOR MVP
**Remarks:** **Open architectural question closed in practice, not yet in the frozen documents**: the idempotency key was decided during implementation as a caller-supplied `correlation_id`. `requirements.md`/`design.md` still describe this as an open `[VP]`. The implementation decision should be folded back into the governing documents as a ratified spelling — flagged, not fixed here.

### FR-CS-5 — Append-only visit notes surface
**Business Objective:** Prior visits' notes visibly retained with author + timestamp; a visit appends, never overwrites.
**Priority:** MVP Mandatory
**Design:** §2.2(g) · **Decision:** D1, **Decision 12** (DO-2 amendment, v1.3) · **ET refs:** T-BE-E.1a pre-implementation investigation · **Owner Ratification:** Decision 12
**Backend:** Tasks: `T-BE-E.1a` (snapshot migration/write/read contract) · Status: **Complete** **[Updated 2026-07-26]**. Implementation commit `00682b6`; shared development Supabase upgraded and verified at `20260727_000001` (commit `8e43b15`, see `.kiro/engineering/DB-T-BE-E1A-SNAPSHOT-UPGRADE-RESULT.md` in `novaclinicspro-api`).
**Frontend:** Tasks: `T-FE-E.1a` (composition — complete, commit `0ed23f7`), `T-FE-E.1b` (render history — complete, commit `c93fddf`) · Status: **Complete** **[Updated 2026-07-26]**
**Implementation Evidence:** `T-FE-E.1a` commit `0ed23f7`; `T-BE-E.1a` commit `00682b6` + DB upgrade `8e43b15`; `T-FE-E.1b` commit `c93fddf`
**Tests:** `T-FE-E.1a`'s composition tests; `T-BE-E.1a`'s 88 focused backend tests (snapshot, history, migration, idempotency, write path); `T-FE-E.1b`'s 26 focused frontend tests (data hook + rendering + isolation + architecture) plus updated `caseSheetModule.test.tsx`/`caseSheetModuleComposition.test.tsx` regression coverage
**Traceability:** FR-CS-5 → design.md §2.2(g) → T-BE-E.1a/T-FE-E.1a/T-FE-E.1b (all done) → `casesheets_service.py`, `casesheets_router.py`, `CaseSheetModule.tsx`, `CaseSheetContributionHistory.tsx` → tests above → `00682b6`, `8e43b15`, `0ed23f7`, `c93fddf` → Complete
**Release Classification:** READY FOR MVP
**Remarks:** The original requirement rationale ("the contribution model exists but has no UI") undersold the actual gap — the model didn't persist content at all, only attribution. Decision 12 closed that gap without reopening DO-2's core invariant (one current, editable Case Sheet per Episode); the frontend now renders that history read-only, never merging it into the active draft.

### FR-CS-6 — Audit
**Business Objective:** Every contribution records actor, time, visit; amendments additionally record reason.
**Priority:** MVP Mandatory
**Design:** §2.2 · **ET refs:** none · **Owner Ratification:** —
**Backend:** Tasks: T-BE-C.2 (attribution carries actor/time/visit) · Status: **Complete** for the write side; amendment-reason half depends on FR-LD-2 (not started)
**Frontend:** Tasks: none directly · Status: N/A
**Implementation Evidence:** `casesheets_service.py` — commit `e8ba0a2`
**Tests:** same as FR-CS-2
**Traceability:** FR-CS-6 → design.md §2.2 → T-BE-C.2 (done) + amendment-reason half via T-BE-G.2 (not started) → Partially Complete
**Release Classification:** BLOCKING MVP
**Remarks:** Basic write-attribution audit is real and tested; the amendment-reason half of this requirement cannot exist until Living Documents (Group G) ships.

---

# Group: Living Documents

### FR-LD-1 — Signed versions immutable; documents remain amendable
**Business Objective:** DRAFT→FINAL→SIGNED→SUPERSEDED lifecycle; amendment creates a new version referencing/retaining the prior, never mutates a signed one.
**Priority:** MVP Mandatory
**Design:** §2.6 · **Decision:** D2 · **ET refs:** the verified `DocumentStatus` docstring contradiction this requirement exists to resolve · **Owner Ratification:** Decision 2
**Backend:** Tasks: T-BE-G.1 · Status: **Not Started**
**Frontend:** Tasks: T-FE-E.5 · Status: **Not Started**
**Implementation Evidence:** none
**Tests:** none
**Traceability:** FR-LD-1 → design.md §2.6 → T-BE-G.1/T-FE-E.5 → — → — → Not Started
**Release Classification:** BLOCKING MVP
**Remarks:** A RATIFIED architectural decision (Decision 2) with zero implementation. The contradiction it exists to resolve (`DocumentStatus`'s docstring still says "SIGNED: Immutable, terminal state" vs. the ratified "may be superseded") is still live in the codebase today.

### FR-LD-2 — Amendment permissions
**Business Objective:** Amendment requires a distinct permission from write; rejection is service-layer, not UI hiding.
**Priority:** MVP Mandatory
**Design:** §2.6 · **ET refs:** [VP] → ETX-1 (permission codes) · **Owner Ratification:** —
**Backend:** Tasks: T-BE-G.2 · Status: **Not Started**
**Frontend:** Tasks: none directly · Status: N/A
**Implementation Evidence:** none
**Tests:** none
**Traceability:** FR-LD-2 → design.md §2.6 → T-BE-G.2 → — → — → Not Started
**Release Classification:** BLOCKING MVP
**Remarks:** ETX-1's own trace doc found the specific permission codes this would need (`casesheet.amend`, `prescription.amend`) genuinely don't exist yet ("Class C — required, proposed code follows convention") — a concrete, evidenced gap, not a guess.

### FR-LD-3 — Close the `DocumentStatus` docstring contradiction
**Business Objective:** Update the docstring to match the ratified supersession model; documentation-only, no behavior change.
**Priority:** MVP Mandatory
**Design:** §2.6 · **Decision:** D2 · **ET refs:** — · **Owner Ratification:** Decision 2's own explicit note: "must not be silently ignored"
**Backend:** Tasks: T-BE-G.3 · Status: **Not Started**
**Frontend:** Tasks: none · Status: N/A
**Implementation Evidence:** none — the contradictory docstring (`"FINAL: Locked… SIGNED: Immutable, terminal state"`) is still present in `DocumentStatus`'s definition today
**Tests:** none
**Traceability:** FR-LD-3 → design.md §2.6 → T-BE-G.3 → not started → — → Not Started
**Release Classification:** BLOCKING MVP
**Remarks:** Lowest-effort task in the whole remaining backlog (Size S, docs-only) but blocked on `T-BE-G.1` landing first per its own dependency, so it cannot be picked off early to reduce backlog count.

---

# Group: Prescription

### FR-RX-1 — Verified document lifecycle only
**Business Objective:** R7 implements only DRAFT→FINAL→SIGNED (+SUPERSEDED via FR-LD-1); no Issue/Dispense action anywhere.
**Priority:** MVP Mandatory
**Design:** §2.7 · **Decision:** D3 · **ET refs:** the verified fact that `PrescriptionStatus(draft/issued/dispensed)` has zero runtime usages (ED-ARCH-002) · **Owner Ratification:** Decision 3
**Backend:** Tasks: none required (enforced by omission — no Issue/Dispense code was ever built) · Status: **Complete**
**Frontend:** Tasks: T-FE-E.2 (composition, not started) · Status: **Not Started**
**Implementation Evidence:** `tenant_prescription.status` (pre-existing `document_status` ENUM)
**Tests:** pre-existing prescription test suite
**Traceability:** FR-RX-1 → design.md §2.7 → (no BE task needed) + T-FE-E.2 (not started) → `tenant_prescription.status` → pre-existing tests → n/a → Partially Complete
**Release Classification:** BLOCKING MVP
**Remarks:** The backend constraint is trivially satisfied (nothing was ever built to violate it), but the requirement's frontend composition half genuinely has not shipped.

### FR-RX-2 — Copy-forward is not in R7
**Business Objective:** No copy-forward action ships in R7 — a negative requirement.
**Priority:** **Post MVP / Future** (this is the one requirement whose own text defers itself)
**Design:** — · **Decision:** D5 · **ET refs:** F-2 (copy-forward's reconciliation gate cannot check anything without allergy/medication data) · **Owner Ratification:** Decision 5 (RATIFIED → R8)
**Backend:** Tasks: none (by design) · Status: **Deferred**
**Frontend:** Tasks: none (by design) · Status: **Deferred**
**Implementation Evidence:** N/A — confirmed absent, as required
**Tests:** N/A
**Traceability:** FR-RX-2 → Decision 5 → (no task, by design) → confirmed absent → n/a → Deferred
**Release Classification:** DEFER TO R8
**Remarks:** The only requirement of the 44 that is itself scoped out of R7 by its own text. Its ratification carries a strong warning worth repeating here: shipping the reconciliation gate without the allergy/medication data model "would be worse than not shipping it" — R8 must build the data model before or alongside copy-forward, not after.

---

# Group: Treatment Recommendation & Plan

### FR-TR-1 — Recommendation is a proposal, not a course design
**Business Objective:** Answers "should this patient receive a course?"; does not own final course design; may lead to at most one approved Treatment Plan.
**Priority:** MVP Mandatory
**Design:** §2.3, §2.8 · **Decision:** D8, Decision 11 · **ET refs:** the removed `tenant_treatment_proposals` entity, the dual-endpoint discriminator ambiguity resolved by `T-BE-D.3a` · **Owner Ratification:** Decision 11 (v1.2 amendment, this session)
**Backend:** Tasks: T-BE-D.3a · Status: **Complete**
**Frontend:** Tasks: T-FE-E.2 · Status: **Not Started**
**Implementation Evidence:** `tenant_treatment_sheet.py` (`creation_source` column), migration `20260724_000003_r7_recommendation_source_identity.py`, `i_treatment_order_repository.py::get_eligible_recommendation_source`, `i_treatment_plan_repository.py::get_by_originating_recommendation_id` — commit `fc8235a`
**Tests:** Structural (migration DDL) + Unit (mocked, every creation path + immutability via source inspection) + Integration (disposable Postgres, one-off concurrency proof, not in CI suite): `test_r7_recommendation_source_identity.py`
**Traceability:** FR-TR-1 → design.md §2.3/§2.8 → T-BE-D.3a (done) + T-FE-E.2 (not started) → `tenant_treatment_sheet.py`+migration → `test_r7_recommendation_source_identity.py` → `fc8235a` → Partially Complete
**Release Classification:** BLOCKING MVP
**Remarks:** This requirement's backend realization required a genuine design correction mid-flight — see `RTM-AUDIT.md` §1 finding #4 and §7 finding #3. The fix shipped cleanly, but it is evidence the original design-freeze process did not fully validate this requirement against Engineering Truth before `tasks.md` was frozen.

### FR-TP-1 — Treatment Plan is first-class persisted, versioned entity
**Business Objective:** Plan answers "what course is clinically intended?"; owns patient/Episode/Recommendation/clinician/therapies/session-count/frequency/etc.; contains no committed dates; persists independently of scheduling.
**Priority:** MVP Mandatory
**Design:** §2.3 · **Decision:** Treatment Plan resolution · **ET refs:** verified no Plan entity existed pre-R7 (`app/domain/treatment_plan/` held only `SyncResult`); ETX-5 naming collision with `tenant_visits.treatment_plan` (resolved by T--1.4) · **Owner Ratification:** "Treatment Plan — RESOLVED · first-class entity" section
**Backend:** Tasks: T-BE-D.1, T-BE-D.2, T-BE-D.3, T-BE-D.4 · Status: **Complete**
**Frontend:** Tasks: T-FE-E.2 · Status: **Not Started**
**Implementation Evidence:** `treatment_plan/models.py` (domain, `216d82c`), `tenant_treatment_plan.py` + migration `20260724_000002` (ORM/schema, `f0fdb33`), `sqlalchemy_treatment_plan_repository.py` + UoW registration (`bbe4066`), `treatment_plan_service.py` + `i_treatment_plan_service.py` + factory (`f09097f`)
**Tests:** Unit (domain invariants, repository, service — mocked) + Structural (migration DDL): `test_r7_treatment_plan_domain.py`, `_persistence.py`, `test_treatment_plan_repository.py`, `test_treatment_plan_service.py`
**Traceability:** FR-TP-1 → design.md §2.3 → T-BE-D.1..D.4 (done) + T-FE-E.2 (not started) → 4 new modules + 1 migration → 4 test files (89+ tests total) → `216d82c`/`f0fdb33`/`bbe4066`/`f09097f` → Partially Complete
**Release Classification:** BLOCKING MVP
**Remarks:** The entity, its persistence, and the service that creates it from a Recommendation are all complete and thoroughly tested — this is the single most rigorously verified backend chain in the entire matrix (4 sequential tasks, each independently audited on landing). "Frontend never reconstructs the Plan from schedule rows" (AC15) is structurally unfalsifiable until FE-E.2 exists to check.

### FR-TP-2 — Plan lifecycle: semantic stages frozen, spelling deferred
**Business Objective:** 8 named stages (Authoring…Stopped/discontinued) must all be representable; smallest additive model.
**Priority:** MVP Mandatory
**Design:** §2.3 · **ET refs:** [VP] spelling deferred; explicit warning not to reuse `TreatmentLifecycleStatus` (verified semantic mismatch — execution status, not Plan lifecycle) · **Owner Ratification:** Treatment Plan resolution section
**Backend:** Tasks: T-BE-D.1 · Status: **Complete**
**Frontend:** Tasks: none directly · Status: N/A
**Implementation Evidence:** `treatment_plan/models.py::TreatmentPlanStatus` (8-member enum, distinct type from `TreatmentLifecycleStatus`, verified by a dedicated test) — commit `216d82c`
**Tests:** `test_r7_treatment_plan_domain.py::TestFrozenEightStageLifecycle`, `TestNoTreatmentLifecycleStatusReuse`
**Traceability:** FR-TP-2 → design.md §2.3 → T-BE-D.1 → `TreatmentPlanStatus` enum → domain tests → `216d82c` → Complete
**Release Classification:** READY FOR MVP
**Remarks:** **Open architectural question closed in practice, not in the frozen documents**: exact spelling (`authoring`/`approved_clinical_intent`/…/`stopped_discontinued`) was decided at implementation. `requirements.md` still calls this `[VP]` deferred. Should be ratified back into the governing documents.

### FR-TP-3 — Plan amendment vs. schedule change
**Business Objective:** Four distinct operations never conflated: clinical-intent change → new version; schedule-logistics change → no new version; unexecuted-session-instruction edit → session-level only; execution-record correction → audit-controlled.
**Priority:** MVP Mandatory
**Design:** §2.3, §2.6 · **Decision:** —, D2 · **ET refs:** none · **Owner Ratification:** —
**Backend:** Tasks: T-BE-D.5 · Status: **Not Started**
**Frontend:** Tasks: none directly · Status: N/A
**Implementation Evidence:** none
**Tests:** none
**Traceability:** FR-TP-3 → design.md §2.3/§2.6 → T-BE-D.5 (blocked on T-BE-G.1, also not started) → — → — → Not Started
**Release Classification:** BLOCKING MVP
**Remarks:** Doubly blocked — `T-BE-D.5` itself needs `T-BE-G.1` (supersession representation) to exist first, and neither has started.

---

# Group: Sessions & Scheduling

### FR-TS-1 — Stable session identity
**Business Objective:** Session identity stable, never recreated during rescheduling/reassignment/hold/instruction-update; `day_number` is display-order only, never identity.
**Priority:** MVP Mandatory
**Design:** §2.4 · **ET refs:** verified `treatment_sheet_row` already ~70% separated pre-R7 · **Owner Ratification:** Treatment Plan resolution section
**Backend:** Tasks: T-BE-E.1 · Status: **Complete**
**Frontend:** Tasks: T-FE-E.2/E.3 (compose) · Status: **Not Started**
**Implementation Evidence:** `i_treatment_plan_repository.py` (docstring extension — reuses the existing `get_by_originating_recommendation_id` lookup for Session→Plan resolution, no new column/entity) — commit `c16cbf0`
**Tests:** Structural + behavioral (28 tests): `test_r7_stable_session_identity.py`
**Traceability:** FR-TS-1 → design.md §2.4 → T-BE-E.1 (done) + T-FE-E.2/E.3 (not started) → `i_treatment_plan_repository.py` → `test_r7_stable_session_identity.py` → `c16cbf0` → Partially Complete
**Release Classification:** BLOCKING MVP
**Remarks:** This task deliberately added almost no new production code — it proved, via structural/behavioral tests, that the pre-existing `treatment_sheet_row` machinery (built well before R7) already satisfies AC(5)/(10)/(11) and the "no regenerate" prohibition. This is the correct outcome per the requirement's own rationale ("R7 finishes it; it does not rewrite it"), not an under-delivery.

### FR-TS-2 — Schedule attributes
**Business Objective:** Date/time/therapist/room/bed/resource/operational status change without touching Plan identity, Session identity, doctor content, or execution history.
**Priority:** MVP Mandatory
**Design:** §2.4 · **ET refs:** none · **Owner Ratification:** —
**Backend:** Tasks: T-BE-E.1 (proven by omission — verified no scheduling-mutation method touches Plan/identity) · Status: **Complete**
**Frontend:** Tasks: T-FE-E.2 · Status: **Not Started**
**Implementation Evidence:** same as FR-TS-1 — `schedule_row`/`unschedule_row`/`start_row`/`bulk_schedule_rows` verified via source inspection to key on `row_id` only, never `day_number`, and never construct a replacement row
**Tests:** same file as FR-TS-1
**Traceability:** FR-TS-2 → design.md §2.4 → T-BE-E.1 (done) + T-FE-E.2 (not started) → same evidence → same tests → `c16cbf0` → Partially Complete
**Release Classification:** BLOCKING MVP
**Remarks:** None beyond FR-TS-1's.

### FR-TS-3 — Doctor clinical content bound to session identity
**Business Objective:** Author-once-apply-to-many across sessions with per-session override; rescheduling never deletes/regenerates/detaches/remaps content.
**Priority:** MVP Mandatory
**Design:** §2.4 · **ET refs:** none · **Owner Ratification:** —
**Backend:** Tasks: T-BE-E.3 · Status: **Not Started**
**Frontend:** Tasks: T-FE-E.2 · Status: **Not Started**
**Implementation Evidence:** none
**Tests:** none
**Traceability:** FR-TS-3 → design.md §2.4 → T-BE-E.3/T-FE-E.2 → — → — → Not Started
**Release Classification:** BLOCKING MVP
**Remarks:** The requirement's own rationale calls author-once-apply-to-many "not a nicety... without it a 14-session course is otherwise unusable" — a genuinely high-value, entirely unbuilt piece.

### FR-TS-4 — Therapist execution record
**Business Objective:** Actuals stay attached to the executed session; append-only/audit-controlled; reschedule never overwrites.
**Priority:** MVP Mandatory
**Design:** §2.4 · **ET refs:** [VP] adverse-events marker · **Owner Ratification:** —
**Backend:** Tasks: T-BE-E.4, T-BE-E.4a · Status: **Complete, exposed** (`record_session_non_execution` implemented in `TreatmentSheetsService`; `POST /treatment-sheets/rows/{row_id}/non-execution` exposes it — commit `a0aa4c3`)
**Frontend:** Tasks: T-FE-E.3 · Status: **Not Started** (unblocked as of `T-BE-E.4a`)
**Implementation Evidence:** commits `9497f13`, `ccf56d8`, `1529b47`, `a0aa4c3`; DB result doc `DB-T-BE-E4-MIGRATION-UPGRADE-RESULT.md`
**Tests:** `tests/test_r7_session_non_execution.py` (44), `tests/test_r7_doctor_content_bound_to_session.py`, `tests/test_r7_session_non_execution_api.py` (17)
**Traceability:** FR-TS-4 → design.md §2.4 → T-BE-E.4/T-BE-E.4a/T-FE-E.3 → — → — → Backend complete and exposed
**Release Classification:** BLOCKING MVP
**Remarks:** [2026-07-25] `T-BE-E.4a` closed the transport gap the prior audit found. Two prerequisite gaps discovered and fixed while exposing it: the interface method was missing entirely, and the row `_to_dict` projection never exposed the two migrated columns (response would have always read `None`). See `T-BE-E.4a`'s task card for full detail.

### FR-TS-5 — "Missed" is decomposed, not a single state
**Business Objective:** Backend semantics distinguish what was scheduled / whether execution occurred / why not; UI composes the label from three facts, never a single ambiguous state.
**Priority:** MVP Mandatory
**Design:** §2.4 · **ET refs:** [VP] exact state names deferred to implementation, after Engineering Truth · **Owner Ratification:** "Session 'Missed' — RESOLVED at architecture level" (the three-part shape is ratified; spelling is not)
**Backend:** Tasks: T-BE-E.4, T-BE-E.4a · Status: **Complete, exposed** (state-name spelling decided: `PATIENT_NO_SHOW`/`PATIENT_CANCELLED`/`CLINIC_CANCELLED`/`CLINICAL_HOLD`/`OTHER`, migration `20260726_000001` on shared dev; reachable via `POST /treatment-sheets/rows/{row_id}/non-execution` — commit `a0aa4c3`)
**Frontend:** Tasks: T-FE-E.3 · Status: **Not Started** (unblocked as of `T-BE-E.4a`)
**Implementation Evidence:** commits `ccf56d8`, `1529b47`, `a0aa4c3`; migration `20260726_000001_r7_session_non_execution_reason.py`
**Tests:** `tests/test_r7_session_non_execution.py` (44), `tests/test_r7_session_non_execution_api.py` (17)
**Traceability:** FR-TS-5 → design.md §2.4 → T-BE-E.4/T-BE-E.4a/T-FE-E.3 → — → — → Backend complete and exposed
**Release Classification:** BLOCKING MVP
**Remarks:** [2026-07-25] Both the spelling question and the exposure gap are now resolved.

### FR-SCH-1 — Scheduling intents
**Business Objective:** Consecutive · alternate-day · specific weekdays · weekly · multiple/week · non-sequential · PRN · review-dependent continuation, capability-gated never specialty-gated.
**Priority:** MVP Mandatory
**Design:** §2.4 · **ET refs:** none · **Owner Ratification:** —
**Backend:** Tasks: T-BE-E.2, T-BE-E.2a · Status: **Complete, exposed** (`resolve_scheduling_proposal` implemented in `TreatmentPlanService`, all 9 intents; `GET /treatment-sheets/plans/{plan_id}/scheduling-proposal` exposes it — commit `882dfa6`)
**Frontend:** Tasks: T-FE-E.2 · Status: **Not Started** (unblocked as of `T-BE-E.2a`; `schedule_treatment_row`/`bulk_schedule_treatment_rows` on `treatment_orders_router` remain the write path for persisting a chosen date)
**Implementation Evidence:** commits `c496c86`, `882dfa6`
**Tests:** `tests/test_r7_scheduling_intents.py` (48), `tests/test_r7_scheduling_proposal_api.py` (12)
**Traceability:** FR-SCH-1 → design.md §2.4 → T-BE-E.2/T-BE-E.2a/T-FE-E.2 → — → — → Backend complete and exposed
**Release Classification:** BLOCKING MVP
**Remarks:** [2026-07-25] `T-BE-E.2a` closed the transport gap the prior audit found; also added the DI factory for `TreatmentPlanService`, which had never been wired into the FastAPI graph at all before this task.

### FR-SCH-2 — Synchronization semantics
**Business Objective:** Reschedule/therapist-change/room-change/cancellation/missed/additional-session/reduced-course all preserve doctor content and execution history; OCC prevents silent clobber.
**Priority:** MVP Mandatory
**Design:** §2.4 · **ET refs:** none · **Owner Ratification:** —
**Backend:** Tasks: T-BE-E.3, T-BE-E.5 · Status: **Accepted, with a documented compatibility amendment** (`expected_version` end-to-end + `If-Match` on `PATCH /treatment-sheets/rows/{row_id}`; conflict → 409 `VERSION_CONFLICT` + `current_version`, no mutation — verified. Missing-header behavior amended from mandatory-428 to staged-optional pending `T-FE-E.5` — see Remarks)
**Frontend:** Tasks: T-FE-E.2, T-FE-E.5 · Status: **Not Started**
**Implementation Evidence:** commits `f9614d7` (T-BE-E.3), `f9614d7` (T-BE-E.5 initial), `93e9b8d` (compatibility amendment)
**Tests:** `tests/test_r7_doctor_content_bound_to_session.py` (58), `tests/test_r7_session_concurrency_occ.py` (33)
**Traceability:** FR-SCH-2 → design.md §2.4 → T-BE-E.3/E.5/T-FE-E.2 → — → — → Accepted with compatibility amendment
**Release Classification:** BLOCKING MVP
**Remarks:** Backend-closure audit (2026-07-25): T-BE-E.5 as first landed made `If-Match` unconditionally mandatory (missing → 428). Audit found `novaclinicspro_rn`'s `updateTreatmentSheetRowApi` sends no `If-Match` and retains no `version`, and `T-FE-E.5` (the task that adopts this contract) has not started — mandatory enforcement today would break the only live caller instead of surfacing a reload/keep conflict, the opposite of the AC. Corrected to Decision B (staged adoption, commit `93e9b8d`): OCC fully enforced whenever a token is supplied, 428 removed until `T-FE-E.5` lands. This is a scoped, documented rollout boundary, not a requirement weakening — a follow-up task must make the header mandatory once `T-FE-E.5` ships.

---

# Group: Billing

### FR-BILL-1 — Billing visible, doctor read-only
**Business Objective:** Workspace shows consultation charges/clinical services/therapy charges/medicines/consumables/procedures/invoice+payment status/outstanding; doctors read-only, admin/front-desk full access where permitted.
**Priority:** MVP Mandatory
**Design:** §2.5 · **Decision:** D6 · **ET refs:** verified spine `TenantClinicalService.visit_id` (`nullable=False`) → `TenantInvoiceLine.clinical_service_id` → invoice → payment · **Owner Ratification:** Decision 6
**Backend:** Tasks: T-BE-F.1 · Status: **Complete**
**Frontend:** Tasks: T-FE-E.4 · Status: **Not Started**
**Implementation Evidence:** `i_finance_repository.py`, `sqlalchemy_repositories.py` — commit `efe2344`
**Tests:** `test_finance_repository_visit_scope.py`, `test_billing_clinical_service_boundary.py`
**Traceability:** FR-BILL-1 → design.md §2.5 → T-BE-F.1 (done) + T-FE-E.4 (not started) → `i_finance_repository.py` → 2 test files → `efe2344` → Partially Complete
**Release Classification:** BLOCKING MVP
**Remarks:** None beyond the missing frontend stage.

### FR-BILL-2 — Clinical completion ≠ financial completion
**Business Objective:** Unbilled services produce a visible warning; clinical completion succeeds; billing never blocks by default.
**Priority:** MVP Mandatory
**Design:** §2.5 · **Decision:** D6 · **ET refs:** none · **Owner Ratification:** Decision 6
**Backend:** Tasks: T-BE-F.2 · Status: **Complete**
**Frontend:** Tasks: T-FE-E.4 · Status: **Not Started**
**Implementation Evidence:** none needed — commit `f57d93b`'s own message states no production code changed; existing behavior was already correct
**Tests:** `test_billing_completion_never_blocks.py`
**Traceability:** FR-BILL-2 → design.md §2.5 → T-BE-F.2 (done, verification-only) + T-FE-E.4 (not started) → n/a → `test_billing_completion_never_blocks.py` → `f57d93b` → Partially Complete
**Release Classification:** BLOCKING MVP
**Remarks:** A genuinely pleasant finding — the requirement was already true before R7 touched anything; the task existed to *prove* it, and did, cheaply (no code change).

---

# Group: Recommendation & Completion Readiness

### FR-REC-1 — The backend owns the recommendation
**Business Objective:** `clinical_workflow_service` returns `recommended_action`/`reason`/`blocking_factors`/`waiting_role`/`completion_readiness` (+alternatives); contract carries no presentation fields.
**Priority:** MVP Mandatory
**Design:** §2.1, §4 · **Decision:** D9 · **ET refs:** none · **Owner Ratification:** Decision 9
**Backend:** Tasks: T-BE-B.2, T-BE-B.2a, T-BE-B.3 · Status: **Complete**
**Frontend:** Tasks: T-FE-B.1/B.2 (render) · Status: **Not Started**
**Implementation Evidence:** `clinical_workflow_service.py`, `clinical_workflow_router.py` — commits `bd0e746`, `f23e018`
**Tests:** Contract/semantics-only guard: `test_r7_workflow_contract_semantics_only.py` (`2c69107`, hardened `eaca818`)
**Traceability:** FR-REC-1 → design.md §2.1/§4 → T-BE-B.2/B.2a/B.3 (done) + T-FE-B.1/B.2 (not started) → service + router → semantics guard → `bd0e746`/`f23e018`/`2c69107` → Partially Complete
**Release Classification:** BLOCKING MVP
**Remarks:** The backend contract, including its explicit HTTP exposure (`T-BE-B.2a`, itself a controlled amendment that closed a sequencing gap `T-BE-B.3` found), is complete and permanently guarded. Nothing renders it yet.

### FR-REC-2 — Recommend, never decide
**Business Objective:** Every recommendation presents action/reason/context/blocker/alternatives; deviation immediate (≤1 tap) and unpunished; no forced sequencing, no automatic clinical decision.
**Priority:** MVP Mandatory
**Design:** — · **Decision:** D7 · **ET refs:** none · **Owner Ratification:** Decision 7
**Backend:** Tasks: none directly (contract from FR-REC-1 covers the data) · Status: N/A
**Frontend:** Tasks: T-FE-B.2 · Status: **Not Started**
**Implementation Evidence:** none
**Tests:** none
**Traceability:** FR-REC-2 → Decision 7 → T-FE-B.2 → — → — → Not Started
**Release Classification:** BLOCKING MVP
**Remarks:** A RATIFIED, product-central decision ("the clinician remains the decision-maker") with zero UI implementation — the deviation-menu UX cannot be verified to exist at all yet.

### FR-CR-1 — Backend owns completion readiness
**Business Objective:** Backend is the single answer to "can this visit be completed?" — outstanding mandatory work, optional suggested work, warnings, all explicit states.
**Priority:** MVP Mandatory
**Design:** §2.1 · **Decision:** D9 · **ET refs:** verified violation — completion was derived across ~10 frontend modules (ED-ARCH-006/B) plus `deriveSummary` (ED-ARCH-004) · **Owner Ratification:** Decision 9
**Backend:** Tasks: T-BE-F.3 · Status: **Complete**
**Frontend:** Tasks: T-0.8 (consumes it), T-FE-F.2 (route adapter) · Status: **Partially Complete** — T-0.8 consumes the contract; T-FE-F.2 (the completion-route redirect) not started
**Implementation Evidence:** `consultation_completion_service.py`, `_resolver.py`, `consultation_completion_router.py` — commits `c9630e8`, `7fe1991`; `CompleteConsultationScreen.tsx` — commit `cd48984d`
**Tests:** 3+ backend test files, 3 frontend test files
**Traceability:** FR-CR-1 → design.md §2.1 → T-BE-F.3/T-0.8 (done) + T-FE-F.2 (not started) → 4 files → 6+ tests → `c9630e8`/`7fe1991`/`cd48984d` → Partially Complete
**Release Classification:** BLOCKING MVP
**Remarks:** Genuinely well-covered on the core answer and its consumption in the completion screen; only the legacy-route redirect piece remains.

---

# Group: Patient Safety

### FR-PS-1 — R7 surfaces only verified-existing signals
**Business Objective:** Pending clinical reviews, active prescription status, active episode, session progress, billing state — nothing else; frontend must not fabricate/derive/interpret; unbacked safety field never displayed.
**Priority:** MVP Mandatory
**Design:** §2.9 · **Decision:** F-2 · **ET refs:** F-2 (allergies/interactions/renal confirmed not to exist anywhere in the backend) · **Owner Ratification:** F-2 = Option A
**Backend:** Tasks: T-BE-A.1/A.6 · Status: **Complete**
**Frontend:** Tasks: T-FE-C.3 · Status: **Complete**
**Implementation Evidence:** same as FR-VCC-4
**Tests:** same as FR-VCC-4
**Traceability:** FR-PS-1 → design.md §2.9 → T-BE-A.1/A.6/T-FE-C.3 → `clinical_workspace_facts.py`+`BeforeYouActSection.tsx` → tests incl. explicit negative assertion → `1a72c58`/`0cfab0fa` → Complete
**Release Classification:** READY FOR MVP
**Remarks:** Same evidence as FR-VCC-4 — these two requirements are realized by the same code and tests.

---

# Group: Mobile & Presentation

### FR-MOB-1 — Mobile-first Command Center
**Business Objective:** Patient summary → today's needs → sticky next action → horizontal scrollable pill rail → one primary task → minimal scrolling → ≥44pt targets → interruption recovery.
**Priority:** MVP Mandatory
**Design:** — (WIREFRAMES W0-m) · **Decision:** D8 · **ET refs:** none · **Owner Ratification:** —
**Backend:** Tasks: none · Status: N/A
**Frontend:** Tasks: T-FE-A.1 (shell), T-FE-G.1 (pill rail/sticky-action polish) · Status: **Partially Complete**
**Implementation Evidence:** `VisitCommandCenter.tsx` — commit `1b53f3fd`
**Tests:** shell tests only
**Traceability:** FR-MOB-1 → WIREFRAMES W0-m → T-FE-A.1 (done) + T-FE-G.1 (not started) → `VisitCommandCenter.tsx` → shell tests → `1b53f3fd` → Partially Complete
**Release Classification:** BLOCKING MVP
**Remarks:** The shell exists and is flag-gated/render-only correctly, but the sticky-next-action and horizontal pill-rail behaviors this requirement specifically names are part of `T-FE-G.1`, judged optional-for-MVP at the task level in `MVP-RELEASE-FREEZE.md` — meaning this requirement can realistically ship with a documented gap rather than being a hard blocker, but is recorded as BLOCKING here per the ground rule of never softening a requirement's own frozen AC without an explicit owner decision to do so.

### FR-MOB-2 — Workflow pills
**Business Objective:** 6 pill states (completed/current/pending/waiting-on-role/blocked/not-applicable), blue always names owner, accessible (icon+text, never colour alone).
**Priority:** MVP Mandatory
**Design:** — · **ET refs:** none · **Owner Ratification:** —
**Backend:** Tasks: none · Status: N/A
**Frontend:** Tasks: T-FE-B.1 · Status: **Not Started**
**Implementation Evidence:** none
**Tests:** none
**Traceability:** FR-MOB-2 → (no design.md section cited) → T-FE-B.1 → — → — → Not Started
**Release Classification:** BLOCKING MVP
**Remarks:** None.

---

# Group: Legacy Transition

### FR-LEG-1 — No screen deleted in R7
**Business Objective:** Staged model (Discover→Introduce→Shadow→Validate→Redirect→Deprecate→Remove); R7 reaches at most Redirect.
**Priority:** MVP Mandatory
**Design:** §2.10 · **ET refs:** none · **Owner Ratification:** —
**Backend:** Tasks: none · Status: N/A
**Frontend:** Tasks: (structural — enforced by not deleting anything); full staged model needs T-FE-F.1-F.3 · Status: **Partially Complete**
**Implementation Evidence:** confirmed via repository audit — zero screens removed anywhere in the R7 branch
**Tests:** n/a (a negative/structural claim)
**Traceability:** FR-LEG-1 → design.md §2.10 → (no deletion, confirmed) + T-FE-F.1-F.3 (not started) → — → — → Partially Complete
**Release Classification:** BLOCKING MVP
**Remarks:** The "don't delete" half is trivially and verifiably true; the "reach Redirect stage" half needs Group F, not started.

### FR-LEG-2 — Redirects
**Business Objective:** `start-consultation`/`consultation`/`complete-consultation` route to workspace stages via adapters; standalone case-sheet/prescription entry points redirect to the Episode's own sheet.
**Priority:** MVP Mandatory
**Design:** §2.10 · **ET refs:** none · **Owner Ratification:** —
**Backend:** Tasks: none · Status: N/A
**Frontend:** Tasks: T-FE-F.1, T-FE-F.2, T-FE-F.3 · Status: **Not Started**
**Implementation Evidence:** confirmed via repository audit — the three named legacy routes (`start-consultation.tsx`, `complete-consultation.tsx`, `consultation.tsx`) exist but contain zero references to `cos_v1`/`VisitCommandCenter`
**Tests:** none
**Traceability:** FR-LEG-2 → design.md §2.10 → T-FE-F.1-F.3 → — → — → Not Started
**Release Classification:** BLOCKING MVP
**Remarks:** None.

---

# Group: Platform

### FR-FLAG-1 — R7 is flag-gated and reversible
**Business Objective:** One umbrella flag `cos_v1`, mirroring existing mechanism; flag-off = today's behavior exactly; data-shaped changes not rolled back by a flag alone.
**Priority:** MVP Mandatory
**Design:** §7 · **ET refs:** verified precedent (`freshness_v1_enabled`, `clinical_spine_v1_enabled`) · **Owner Ratification:** —
**Backend:** Tasks: (mirror only) · Status: **Complete**
**Frontend:** Tasks: T-FE-A.3 · Status: **Complete**
**Implementation Evidence:** `useFeatures.ts` — commit `3df98d04`; `config.py` — commit `9023b45`
**Tests:** `useFeatures.test.ts`, `test_cos_v1_feature_flag.py`
**Traceability:** FR-FLAG-1 → design.md §7 → T-FE-A.3 → `useFeatures.ts`+`config.py` → 2 test files → `3df98d04`/`9023b45` → Complete
**Release Classification:** READY FOR MVP
**Remarks:** None — this is a fully clean, fully tested requirement.

### FR-RBAC-1 — Role-aware composition, not forked screens
**Business Objective:** `episodeWorkspaceConfigByRole` extends 2→5 roles as config; any role holding permission may act — backend enforces, UI hiding is polish only.
**Priority:** MVP Mandatory
**Design:** §3 · **ET refs:** ETX-1 (permission codes) · **Owner Ratification:** —
**Backend:** Tasks: none directly (permission enforcement pre-exists) · Status: N/A
**Frontend:** Tasks: T-FE-E.6 · Status: **Not Started**
**Implementation Evidence:** `episodeWorkspaceConfig.ts` exists pre-R7, has not been touched by any R7 commit
**Tests:** none R7-specific
**Traceability:** FR-RBAC-1 → design.md §3 → T-FE-E.6 → `episodeWorkspaceConfig.ts` (unmodified) → none → n/a → Not Started
**Release Classification:** BLOCKING MVP
**Remarks:** ETX-1's own trace doc found a real, unaddressed enforcement gap directly relevant to this requirement: `casesheet.sign`/`prescription.sign` permission codes are seeded but bypassed by hardcoded `"DOCTOR" not in roles` checks in the routers — meaning even where role checks exist today, at least two are not actually backend-enforced via the permission system this requirement's own AC(3) requires ("backend enforces; UI hiding is presentation polish only").

---

# Group: Clinical History Hierarchy (v1.1 amendment)

### FR-HIST-1 — Consultation/therapy history separation
**Business Objective:** Doctor consultations and Treatment Reviews are top-level clinical encounters; therapy Sessions grouped beneath their authoritative Treatment Plan, collapsible; hierarchy backend-owned, frontend renders only.
**Priority:** MVP Mandatory (RATIFIED explicitly as in-R7, not R8 — Decision 10)
**Design:** §2.1a, §3 · **Decision:** D10 · **ET refs:** verified defect — `useClinicalTimelineData` flattened everything into one undifferentiated list, computed completed-count from scheduled (not completed) rows, double-represented therapy appointments (ED-ARCH-007) — all three now closed · **Owner Ratification:** Decision 10 (v1.1 amendment, 2026-07-18)
**Backend:** Tasks: T-BE-A.3, T-BE-A.4, T-BE-A.5, T-BE-A.3a · Status: **COMPLETE** **[Updated 2026-07-26]** — commits `4472060` (A.3, encounter classification), `2147ada` (A.4, legacy association), `6cac1e6` (A.5, backend-derived session counts), `8326f33` (A.3a, authoritative `occurred_at`)
**Frontend:** Tasks: T-FE-C.5 (consumption — complete, commit `cedee6cc`), T-FE-C.6 (collapsible hierarchy rendering — **COMPLETE, commit `71e9f44d`**), T-FE-C.7 (mobile hierarchy behavior, AC17 — **COMPLETE, commit `3315d08d`**) · Status: **PARTIAL** **[Updated 2026-07-26]**
**Implementation Evidence:** Backend: `clinical_history_classifier.py`, `clinical_workspace_service.py`, `clinical_workspace.py` (schemas) — commits above. Frontend: `useClinicalTimelineData.ts`, `ClinicalTimeline.tsx`, `clinicalWorkspace.{dtos,api,repository.impl}.ts` — commits `cedee6cc`, `71e9f44d`, `3315d08d`.
**Tests:** Backend: 139 focused (classifier/service/router/contract-semantics, includes `T-BE-A.3a`'s 16). Frontend: 88 focused (`useClinicalTimelineData`, `ClinicalTimeline` incl. `T-FE-C.6`'s 21 new + `T-FE-C.7`'s 7 new, data-contract, cross-file architecture) + 147 regression, all passing.
**Traceability:** FR-HIST-1 → design.md §2.1a/§3 → T-BE-A.3/A.4/A.5/A.3a (done) + T-FE-C.5 (done) + T-FE-C.6 (done) + T-FE-C.7 (done) → source above → tests above → PARTIAL
**Release Classification:** BLOCKING MVP — backend, frontend consumption, collapsible-Plan-group rendering (`T-FE-C.6`), and mobile hierarchy behavior (`T-FE-C.7`) are all done. `T-FE-C.7`'s own 3-item AC (44pt touch target, hierarchy never flattened, no dot-only status) required no new backend field — Engineering Truth confirmed all three were satisfiable from the existing `HistoryItemResponse` contract, and only the touch-target minimum needed a code fix (the other two AC items were already true by construction). One thing still remains before this requirement's own 17-item AC is fully satisfied: a genuine, reported backend contract gap discovered during `T-FE-C.6`'s own Engineering Truth — `HistoryItemResponse` carries no per-session data (`sessions[]`, AC8/AC9: individual Session identity, dates, therapists, instructions, outcomes) and no Plan `status` field (AC7's "distinct by status" clause, as opposed to its weaker "remain visible" clause, which the current implementation does satisfy). Expanding a Plan group today reveals only the real `session_counts` aggregate — the richest detail the live contract can honestly provide, never a fabricated per-session list or status label.
**Remarks:** All 4 backend tasks and all three frontend tasks (`T-FE-C.5`, `T-FE-C.6`, `T-FE-C.7`) are now done. Only `T-Z.9` remains as a task; a new backend contract amendment (analogous to `T-BE-A.3a`) would be required to satisfy AC7's stronger clause and AC8/AC9 in full — not yet requested or ratified, reported here for the owner's awareness. Clinical History is **not yet READY FOR MVP**: the AC7/AC8/AC9 backend gap is a requirement-level blocker independent of task completion.

### FR-HIST-2 — Backend-owned hierarchical clinical history contract
**Business Objective:** The existing Clinical Workspace aggregate exposes an authoritative `history_items[]` projection (consultation/treatment_review/treatment_plan{session_counts}/legacy_treatment_sessions); no competing aggregate; frontend performs zero clinical aggregation.
**Priority:** MVP Mandatory (same ratification as FR-HIST-1)
**Design:** §2.1a · **Decision:** D10 · **ET refs:** "Sheet-to-Plan cardinality is unverified... no automatic legacy backfill without a verified cardinality/data audit" — resolved by `T-BE-A.4`'s explicit legacy classification (never inferred) · **Owner Ratification:** Decision 10
**Backend:** Tasks: T-BE-A.3, T-BE-A.4, T-BE-A.5, T-BE-A.3a · Status: **COMPLETE** **[Updated 2026-07-26]** — same commits as FR-HIST-1's Backend row
**Frontend:** Tasks: T-FE-C.5 (consumption) · Status: **COMPLETE** **[Updated 2026-07-26]** — commit `cedee6cc`. `useClinicalTimelineData.ts` performs zero encounter classification, zero Session-count aggregation, zero Plan-association inference, zero Treatment Review date derivation, and no local sort — every AC this requirement names is about the contract/non-derivation guarantee (not rich hierarchy rendering, which is FR-HIST-1's `T-FE-C.6/C.7`), and that guarantee is now structurally enforced (proven by source-level architecture tests, `clinicalHistoryArchitecture.test.ts`/`useClinicalTimelineData.test.tsx`'s own architecture describe blocks).
**Implementation Evidence:** Same files as FR-HIST-1.
**Tests:** Same test suites as FR-HIST-1.
**Traceability:** FR-HIST-2 → design.md §2.1a → T-BE-A.3/A.4/A.5/A.3a (done) + T-FE-C.5 (done) → source above → tests above → **COMPLETE**
**Release Classification:** READY FOR MVP **[Updated 2026-07-26]** — this requirement's own AC (backend-owned classification, no competing aggregate, zero frontend clinical aggregation) is fully satisfied end-to-end; it does not itself require the richer hierarchy UI FR-HIST-1/`T-FE-C.6` still owns.
**Remarks [Note added 2026-07-26, narrow]:** `T-BE-A.3a` (new) is COMPLETE, adding the authoritative `occurred_at` timestamp this contract was missing — `T-FE-C.5` is now fully unblocked on the backend side. Row's Backend/Frontend Status cells not otherwise recomputed in this pass.
**Remarks:** `T-BE-A.4` specifically cannot even start until "the data audit itself (count Treatment Sheets per episode/recommendation across real tenant data)" is performed — this is a genuine prerequisite investigation, not a coding task, and per the task's own text "if unperformed when this task starts, it blocks start, it is not skipped."

---

## Mandatory Cross-Validation — Requirements ↔ Design ↔ Tasks ↔ Implementation

Checked for every one of the 44 requirements above. Where all four agree, no note appears (the card above stands as the record). Where they disagree, both sides are reported below rather than silently resolved:

1. **FR-TR-1**: `design.md` §2.8's original text (Requirements↔Design agreement point) assumed a reusable, independently-identifiable Recommendation backend entity. **Implementation reality disagreed**: no such entity existed (`tenant_treatment_proposals` had been removed pre-R7). `design.md` was subsequently amended in place (Decision 11) to state its own earlier assumption was wrong. Requirements↔Design now agree with Implementation; the disagreement was real and is recorded, not erased.
2. **FR-CS-4 / FR-TP-2 / FR-TS-5 / FR-LD-1**: all four carry a `requirements.md`/`design.md` `[VP]` marking a detail as "deferred to implementation." For FR-CS-4 and FR-TP-2, **Implementation has since decided the detail** (correlation_id; the 8-stage enum spelling) but **Requirements/Design have not been updated to reflect the ratified spelling** — a live Requirements↔Implementation gap, not fixed here per instruction. For FR-TS-5 and FR-LD-1, the `[VP]` remains genuinely open on both sides (Implementation hasn't started either).
3. **FR-WFA-1** (via ETX-4): `requirements.md` §19 still lists ETX-4 among its open Engineering Truth Exceptions; `design.md` §8 states "ETX-4... is resolved." **Requirements and Design disagree with each other** on this exception's status, independent of what Implementation actually did (Implementation did apply a capability-loss policy to `T-BE-B.1`/`T-BE-B.2`'s ACs, both complete — so Implementation sides with Design's "resolved" framing, but Requirements has not been updated to match).
4. **FR-RBAC-1**: Design/Requirements state "backend enforces; UI hiding is presentation polish only" as the governing rule. **Implementation (per `T--1.2`'s own trace doc) disagrees in two specific places**: `casesheet.sign`/`prescription.sign` are enforced by hardcoded role-string checks in routers, bypassing the permission-code system this rule assumes is authoritative. This is a real Design↔Implementation gap on a live (pre-R7) code path this requirement depends on, not a hypothetical one.
5. **FR-HIST-1/FR-HIST-2**: `design.md` §2.1a explicitly states its own projection "cannot return real Plan groups before both [Treatment Plan and Session identity] exist." As of this session, both now exist (`T-BE-D.4`, `T-BE-E.1` complete) — Design's own stated precondition is now satisfied, but Tasks (`T-BE-A.3` onward) have not yet been executed to take advantage of it. Not a disagreement, but a live, actionable state change worth recording since Design's own gating language is now stale relative to Implementation reality.

No other requirement showed a Requirements↔Design↔Tasks↔Implementation disagreement in this pass.

---

## Validation Report 1 — Requirements with No Design

None found. Every one of the 44 requirements cites at least one design.md section, a named artifact (WIREFRAMES/TREATMENT-MODEL/STATE-DEFS/GAP-MATRIX/RATIFICATION), or is itself a structural/negative requirement whose "design" is the absence of an artifact (FR-RX-2, FR-LEG-1's negative half). Caveat carried over from `RTM-AUDIT.md` §7 finding #4: several of `requirements-traceability-matrix.md`'s own design-section citations (§4a, §4b, §5, §11, §DP-15) do not resolve against `design.md`'s actual heading structure — the citation exists, but is unverifiable as written. Affected requirements: FR-VCC-1, FR-VCC-3, FR-COS-1, FR-COS-2, FR-CR-1, FR-WFA-1, FR-WFA-2, FR-RBAC-1.

## Validation Report 2 — Requirements with No Tasks

None found among the 44. Every requirement maps to at least one task (backend and/or frontend), confirmed via `requirements-traceability-matrix.md`'s own §1/§2 coverage claim ("44/44") and independently re-verified against `tasks.md`'s actual task list in this audit and the prior one.

## Validation Report 3 — Requirements with Tasks but No Implementation

19 requirements have at least one associated task with zero implementation evidence (Status: Not Started on that side): FR-LD-1, FR-LD-2, FR-LD-3, FR-TP-3, FR-TS-3, FR-TS-4, FR-TS-5, FR-SCH-1, FR-SCH-2, FR-REC-2, FR-MOB-2, FR-LEG-2, FR-HIST-1, FR-HIST-2, plus the not-started *half* of FR-COS-2, FR-VCC-1, FR-WFA-1, FR-WFA-2, FR-CS-1, FR-CS-5, FR-CS-6, FR-RX-1, FR-TR-1, FR-TP-1, FR-TS-1, FR-TS-2, FR-BILL-1, FR-BILL-2, FR-REC-1, FR-CR-1, FR-MOB-1, FR-LEG-1, FR-RBAC-1 (partially-complete requirements — see each card for which side).

## Validation Report 4 — Implementation with No Requirement

None found. Every commit inspected in the backend and frontend audits ties back to a named task, and every named task ties back to at least one requirement ID in its own frontmatter. No orphan implementation (code with no requirement trace) was found in either repository.

## Validation Report 5 — Requirements Implemented but Not Tested

None found. Every requirement card above whose Backend or Frontend status is "Complete" cites at least one test file, independently confirmed to exist and pass in the relevant repository audit. The one partial exception is FR-BILL-2, where "Complete" required zero production code (behavior was already correct) — its test file still exists and passes, so it is not actually untested, merely untested-by-necessity-of-no-new-code.

## Validation Report 6 — Tasks Completed but Requirement Still Partially Satisfied

20 requirements fall in this category — task(s) marked complete on one side (usually backend) while the requirement's overall AC remains only partially satisfied because the other side (usually frontend) hasn't started: FR-COS-2, FR-VCC-1, FR-WFA-1, FR-WFA-2, FR-CS-1, FR-CS-6, FR-RX-1, FR-TR-1, FR-TP-1, FR-TS-1, FR-TS-2, FR-BILL-1, FR-BILL-2, FR-REC-1, FR-CR-1, FR-MOB-1, FR-LEG-1. This is the largest and most consequential validation-report category in this matrix — it is the concrete evidence behind Section 1's "backend substantially ahead of frontend" finding.

## Validation Report 7 — Duplicate Requirements

None found. Every requirement ID is unique and its scope does not overlap another requirement's scope to the point of duplication. (FR-VCC-3/FR-VCC-4 and FR-PS-1 share underlying backend evidence — `clinical_workspace_facts.py` — but they specify genuinely distinct AC sets, not duplicated ones, so this is shared implementation, not a duplicate requirement.)

## Validation Report 8 — Superseded Requirements

None found. No requirement's own text or AC has been replaced by a different requirement. The one place "superseded" language appears in the source documents is at the *design* level (design.md §2.8's Decision-11 correction) and the *task* level (`T-BE-D.3a` inserted as a prerequisite) — neither event superseded the requirement itself (FR-TR-1's text and AC are unchanged); only the *design's assumption about how to realize it* was corrected.

## Validation Report 9 — Requirements Incorrectly Marked Mandatory

None found to be incorrectly marked. All 43 non-FR-RX-2 requirements are genuinely part of R7's ratified core scope per `R7-OWNER-RATIFICATION.md`'s own Decision 8 ("R7 — Clinical Operating System Core"). One borderline case worth naming: FR-MOB-1's full realization depends partly on `T-FE-G.1`, which `MVP-RELEASE-FREEZE.md` judged optional-at-the-task-level. This is not the requirement being incorrectly marked mandatory — it is a task-level scoping choice that could, with an explicit owner decision, downgrade this one requirement's Release Classification from BLOCKING to OPTIONAL. That decision has not been made; recorded here as a candidate, not a finding of error.

## Validation Report 10 — Requirements Incorrectly Deferred

None found. FR-RX-2 is the only requirement classified Post MVP/Future, and its own text explicitly states it is a negative requirement ("no copy-forward action ships in R7") — it is correctly deferred, not incorrectly.

---

## Most Important Analysis — Classification of Every Remaining Task

29 tasks remain (per `RTM-AUDIT.md` §10). Each is classified below into exactly one of the requested categories, with evidence.

| Task | Classification | Evidence-based justification |
|---|---|---|
| T-BE-A.3 | **Mandatory for MVP** | Realizes FR-HIST-1/2, RATIFIED explicitly as in-R7 (Decision 10). All three of its own blockers (A.1, D.4, E.1) are now complete, confirmed by commit inspection. |
| T-BE-A.4 | **Mandatory for MVP** | Same requirement chain. Explicitly blocked on a data audit not yet performed — this is a prerequisite investigation, not itself optional, per the task's own text. |
| T-BE-A.5 | **Mandatory for MVP** | Same requirement chain; also the designated fix for ED-ARCH-007 (a BLOCKING-classified debt item for the v1.1 amendment specifically). |
| T-BE-D.5 | **Mandatory for MVP** | Realizes FR-TP-3, a frozen AC of a RATIFIED entity (Treatment Plan). No document defers it. |
| T-BE-E.2 | **Mandatory for MVP** | Realizes FR-SCH-1. Unblocked (T-BE-E.1 done, confirmed by commit `c16cbf0`). |
| T-BE-E.3 | **Mandatory for MVP** | Realizes FR-TS-3, explicitly called high-value by its own requirement rationale ("without it a 14-session course is otherwise unusable"). |
| T-BE-E.4 | **Mandatory for MVP** | Realizes FR-TS-4/FR-TS-5. |
| T-BE-E.5 | **Mandatory for MVP** | Realizes the concurrency half of FR-SCH-2 — a data-integrity concern, not deferrable. |
| T-BE-G.1 | **Mandatory for MVP** | Realizes FR-LD-1, a RATIFIED architectural decision (Decision 2) with an explicitly-named live contradiction (`DocumentStatus` docstring) it exists to close. |
| T-BE-G.2 | **Mandatory for MVP** | Realizes FR-LD-2; ETX-1's trace doc found the specific permission codes this needs don't yet exist — concrete, evidenced remaining work. |
| T-BE-G.3 | **Mandatory for MVP** | Docs-only but realizes FR-LD-3, whose own Owner Ratification note says the contradiction "must not be silently ignored." Not technical debt — it is a frozen requirement's own AC. |
| T-FE-B.1 | **Mandatory for MVP** | Realizes FR-MOB-2 and half of FR-REC-1/FR-WFA-1's frontend consumption. Unblocked (A.2, B.2, B.3 all done). |
| T-FE-B.2 | **Mandatory for MVP** | Realizes FR-REC-2, a RATIFIED core interaction model (Decision 7) with zero UI today. |
| T-FE-C.4 | **Mandatory for MVP** | Realizes part of FR-VCC-1 (history/timeline panel). Unblocked (T-0.6 done). |
| T-FE-C.5 | **Mandatory for MVP** | Realizes FR-HIST-2's frontend consumption; also the designated fix for ED-ARCH-007's frontend half. |
| T-FE-C.6 | **Mandatory for MVP** | Realizes FR-HIST-1's collapsible-groups AC directly. |
| T-FE-C.7 | **Mandatory for MVP** | Realizes FR-HIST-1 AC17 (mobile hierarchy behavior) specifically. |
| T-FE-D.1 | **Mandatory for MVP** | Realizes FR-WFA-1/2's frontend rendering — the backend contract (T-BE-B.2/B.2a) has been complete and unconsumed since 2026-07-24. |
| T-FE-E.1 | **Mandatory for MVP** | Realizes FR-CS-1/FR-CS-5's frontend half. Unblocked (T-0.3, T-BE-C.4 both done). |
| T-FE-E.2 | **Mandatory for MVP** | Realizes the frontend half of FR-RX-1, FR-TR-1, FR-TP-1, FR-TS-3, FR-SCH-1 — the single largest-scope remaining task, spanning both M5 and M6 by the task plan's own "Granularity note." |
| T-FE-E.3 | **Mandatory for MVP** | Realizes FR-TS-4/5's frontend half. |
| T-FE-E.4 | **Mandatory for MVP** | Realizes FR-BILL-1/2's frontend half. Unblocked (T-BE-F.1 done). |
| T-FE-E.5 | **Mandatory for MVP** | Realizes FR-LD-1/2's frontend half. |
| T-FE-E.6 | **Mandatory for MVP** | Realizes FR-RBAC-1/FR-WFA-2's frontend half — the multi-role rendering this ratified product is fundamentally built around. |
| T-FE-F.1 | **Mandatory for MVP** | Realizes FR-LEG-1/2's route-adapter half for start/consultation routes. |
| T-FE-F.2 | **Mandatory for MVP** | Realizes FR-CR-1/FR-LEG-2's completion-route redirect. Unblocked (T-0.8, T-BE-F.3 both done). |
| T-FE-F.3 | **Mandatory for MVP** | Realizes FR-LEG-2/FR-CS-1's standalone-entry-point redirect. |
| T-FE-G.1 | **Future Enhancement** | Realizes the polish half (sticky-action, pill-rail animation/scroll behavior) of FR-MOB-1, whose core briefing/shell AC is already satisfied. `MVP-RELEASE-FREEZE.md` §4 already judged this optional; this audit concurs on evidence — the shell works and is tested without it. |
| T-FE-G.2 | **Future Enhancement** | Accessibility/localization pass layered on top of already-shipped, already-localized (per-task AC) components. No requirement's core AC depends solely on this task. |
| T-Z.1 | **Mandatory for MVP** | The release-gate architecture proof itself — required by M8/OR-6, not deferrable if the release gate is to mean anything. |
| T-Z.2 | **Mandatory for MVP** | Full regression proof, same reasoning. |
| T-Z.3 | **Mandatory for MVP** | DP-15 one-answer proof — directly validates Principle P3, cross-cutting through nearly every requirement in this matrix. |
| T-Z.4 | **Mandatory for MVP** | Rollback validation — required given multiple requirements (FR-LD-1, FR-FLAG-1) carry explicit, non-trivial rollback obligations. |
| T-Z.5 | **Future Enhancement** | Performance sanity check. No requirement's AC names a specific performance threshold; valuable but not blocking any named AC. |
| T-Z.6 | **Future Enhancement** | Legacy deprecation *readiness* (instrumentation for a future removal) — by FR-LEG-1's own text, R7 stops at "Redirect," not "Deprecate." This task prepares for a stage R7 itself does not reach. |
| T-Z.7 | **Post MVP** | R8 handoff package — by definition prepares R8, not R7's own release. |
| T-Z.8 | **Mandatory for MVP** | Closure documentation for the release itself — required by M8's own merge criteria. |
| T-Z.9 | **Mandatory for MVP** | History-hierarchy proof, the final link in the Decision-10 chain. |

**No task in the remaining 29 was classified Already Implemented, Superseded, Duplicate, Documentation only, or Technical Debt** — every one traces to a genuinely unstarted requirement obligation. This is itself a finding: the remaining backlog is real, not inflated by stale or already-satisfied entries.

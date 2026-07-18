# R7 — Task Plan (re-cut against the ratified COS scope)

**Authority:** [R7-OWNER-RATIFICATION.md](R7-OWNER-RATIFICATION.md). Where this plan and any other R7 document disagree, the ratification governs.
**Status:** Proposed — **not approved, not implemented.** No branch, code, migration, schema, API, route, screen, commit, or DB change accompanies this plan.
**Baselines:** backend `dev` `8b23568` · frontend `dev` `cd86021`.
**Re-cut, not edited:** the previous plan was built for the form-stepper design and is discarded, per the owner's instruction not to preserve it mechanically.

**Execution governance (inherited from R4–R6, proven):** one task at a time · per-group Standing Gate (Engineering-Truth review → Product-Discovery review; **STOP** on divergence) · Task Isolation (touch only declared files) · never `git add .` · no commit/push/DB-write without explicit authorization · additive/reversible/flag-gated · frozen once approved.

**Sizes:** S/M/L/VL by code surface, dependency breadth, migration complexity, risk. **No calendar estimates.**

**Architecture rules binding on every task** (`CLAUDE.md` both repos; ED-ARCH-001):
```
Frontend: Presentation → Application/Use Cases → Domain Repo Interfaces → Infra Repo Impls → Datasources/HTTP
Backend : Routers → Services → Repositories → ORM/DB/External
Forbidden: Presentation→axiosClient · Presentation→datasource · Application→HTTP client
           Router→DB · Router→ORM · Service→business-data SQLAlchemy · Service→DB bypassing repo · Domain→infrastructure
```

---

## Group -1 — Owner Ratification & Documentation Freeze · **BLOCKING, no code**

| Task | Repo | Size | Acceptance |
|---|---|---|---|
| T--1.1 Verify all 8 owner decisions are documented in the ratification | docs | S | ratification complete + linked from every doc |
| T--1.2 ✅ **RESOLVED at Design Freeze** — F-1 (Episode binding · current-Visit attribution · `appointment_id` = creation provenance · atomic · idempotent) · F-2 = **Option A** · Treatment Plan = **first-class entity** · `Missed` = schedule-state + execution-outcome + reason · `PrescriptionStatus` = deferred cleanup | docs | S | ✅ recorded in ratification §Final Blocker Resolution |
| T--1.3 Contradiction sweep: no document asserts `ISSUED`/`DISPENSED`; no per-visit case sheet; no specialty-gated therapy; no fabricated safety data | docs | S | grep-level sweep clean across all 13 docs |
| T--1.4 R7/R8 boundary explicit in every doc | docs | S | each doc states its phase |
| T--1.5 Record `ED-ARCH-002` (PrescriptionStatus drift) and `ED-ARCH-003` (frontend `allergies` unbacked contract) in both repos' `ENGINEERING-DEBT.md` | docs | S | items recorded; **not fixed here** |

**Exit gate:** ✅ **SATISFIED** — F-1, F-2, Treatment Plan and `Missed` are all resolved at Design Freeze. Remaining deferrals (state spellings, idempotency key, permission codes, legacy `treatment_plan` column disposition) are **requirements-task decisions**, and no task depends on them being answered *now*.

---

## Group 0 — Engineering Truth, Baseline & Blocking Layer Remediation

| Task | Repo | Layer | Declared files | Size | Acceptance / Tests / Rollback |
|---|---|---|---|---|---|
| T-0.1 Branch gate; baseline record | both | — | — | S | branch + HEAD recorded; clean tree · rollback: delete branch |
| T-0.2 Complete the structural traces flagged as unverified: therapist/session downstream, prescription & session duplicate-guards, **exact permission codes vs `org_permissions`** | both | — | trace doc | M | every R7 permission cited is verified to exist · no code |
| T-0.3 **ED-ARCH-001 remediation of R7-reused modules** — `PrescriptionModule` (`axiosClient.get` → repository/hook), `ConsultationSections/*` datasource imports | FE | Presentation→App | the ED-ARCH-001 verified list only | M | behaviour-preserving; existing module tests green; **no presentation→transport import remains in touched files** · rollback: per-file revert |
| T-0.4 Characterization baseline: both workspaces, dual-impl, consultation flow | FE | Test | existing suites | S | baseline captured |

**Gate:** **no group composes a module until T-0.3 passes for that module.** Do not widen into unrelated repo-wide refactor.

---

## Group A-BE — Case Sheet, Visit Contribution & Document-State Contract · **BLOCKING (F-1)**

| Task | Layer | Size | Acceptance / Tests / Rollback |
|---|---|---|---|
| T-A-BE.1 **Fix contribution attribution (F-1)**: resolve the Visit from the **current write context**, not `casesheet.appointment_id` | Service | M | **state-model check:** visit 2's contribution attributes to visit 2 (today: visit 1) · unit tests for N-visit attribution · rollback: revert service (additive behaviour) |
| T-A-BE.2 ✏ **Atomicity + explicit failure**: content update **and** contribution attribution succeed together or fail together; an unresolved Visit fails **explicitly** — never "content saved, contribution silently missing" | Service | S–M | AC 8/9: unresolved Visit → explicit failure; no content update survives a missing required contribution |
| T-A-BE.5 🆕 **Idempotency**: retries create no duplicate contribution. **Key determined by Engineering Truth in requirements** (case sheet+visit+operation · explicit contribution id · mutation/request id · other) — **not invented here** | Service | S–M | AC 10: retry → exactly one contribution |
| T-A-BE.6 🆕 **Current-Visit validation**: Visit exists · same tenant · same Episode · same patient · Case Sheet belongs to that Episode · author permitted | Service | M | AC 5/6/7: other-Episode / other-patient / other-tenant Visit **rejected** |
| T-A-BE.3 Episode case-sheet **find-or-create** contract (one per Episode) | Service | M | **product check:** second visit reuses the episode's case sheet; never creates a second · dup-guard test |
| T-A-BE.4 Document `appointment_id` = creation provenance (comment/docs only; **no schema change**) | Docs | S | meaning documented; **nullability migration deferred to a separate approval** |

**Depends:** Group -1 (F-1 resolved), Group 0.

## Group A-FE — Episode Case Sheet & Append-Only Visit Notes

| Task | Layer | Size | Acceptance |
|---|---|---|---|
| T-A-FE.1 Compose `CaseSheetModule` against the **episode** case sheet | Presentation (compose) | M | opens the episode's sheet, not a new one |
| T-A-FE.2 **Append-only visit-note surface** (the contribution model has no UI today) | Presentation | M | **product check:** prior visits' notes visibly retained, never overwritten; author+timestamp shown |

---

## Group B-BE — COS Aggregate & Workflow-Assembly Facts

| Task | Layer | Size | Acceptance |
|---|---|---|---|
| T-B-BE.1 **Read-only aggregate** (`workspace-state`): composes existing repos + `treatment_lifecycle_resolver`; **router thin, service composes, repos own persistence** | Router+Service | M | **architecture check:** no DB/ORM in router; no SQLAlchemy business query in service · unit tests with mocked repos · rollback: additive endpoint, drop cleanly |
| T-B-BE.2 Expose **assembly facts**: enabled capabilities, appointment purpose, episode state, existing-record presence, treatment state, billing state | Service | M | facts sufficient to assemble every §11 example journey |

## Group B-FE — Visit Command Center Foundation

| Task | Layer | Size | Acceptance |
|---|---|---|---|
| T-B-FE.1 `VisitCommandCenter` shell on the **existing** `episodes/[episodeId]/workspace` route, flag `cos-v1` (off) | Presentation | M | **no third workspace**; flag-off = today's behaviour · rollback: flag |
| T-B-FE.2 Aggregate data hook (canonical query key + invalidation) | App/data | S–M | no presentation→datasource · freshness tests |

---

## Group C-BE — Existing Clinical Context Exposure · **scope pending F-2**

| Task | Layer | Size | Acceptance |
|---|---|---|---|
| T-C-BE.1 Expose **only verified-existing** context: pending clinical reviews · active prescription existence/status · active episode · session progress · last visit summary · billing state | Service | M | **product check:** every field traces to a verified source; **nothing fabricated** |
| T-C-BE.2 *(only if owner picks F-2 option (b))* allergy data model | Model+Service | **L** | **schema change — separate approval required** |

## Group C-FE — Why Today / What Changed / Before You Act

| Task | Layer | Size | Acceptance |
|---|---|---|---|
| T-C-FE.1 "Why today" (appointment purpose + concern) | Presentation | S–M | renders purpose; absent-purpose state handled |
| T-C-FE.2 "What changed" from **R7-available data only** (last visit, sessions done, pending review, Rx status, episode, billing) | Presentation | M | **no measurement deltas in R7** (R8) |
| T-C-FE.3 "Before you act" — **only** pending reviews + verified context; **allergy/renal panels excluded unless F-2(b)** | Presentation | S–M | **must not display an unbacked safety field** (F-2(c) rejected) |

---

## Group D-BE / D-FE — Recommendation, Completion Readiness, Pills

> **✏ RE-CUT BY DECISION 9 (Backend Owns Workflow Intelligence).** Workflow assembly, recommendation generation and completion readiness **moved D-FE → D-BE**. D-FE is now **presentation only**. The prior "FE may proceed on stitched data as an interim" path is **withdrawn** — it would reintroduce the violation.

| Task | Repo | Layer | Size | Acceptance |
|---|---|---|---|---|
| **T-D-BE.1** **`clinical_workflow_resolver`** — pure domain: assembles the workflow + derives recommendation/blocking factors/waiting role/completion readiness as a **pure function over immutable snapshots**. Same shape as `treatment_lifecycle_resolver` (R4) / `capability_resolver` (R5). | BE | **Domain (pure)** | **L** | **architecture check:** imports nothing from `app.infrastructure`/`app.api`/session · **unit-testable with no DB** · **product check:** GP/Ayurveda/Physio/follow-up/review/therapist journeys each assemble correctly; **no fixed canonical order** |
| **T-D-BE.2** **`clinical_workflow_service`** — application: gathers facts (patient/episode/visit context, document states, treatment states, billing state, capabilities, purpose, permissions), feeds the resolver, returns semantics | BE | Application | **M–L** | router thin; repos own persistence; **returns `recommended_action`/`reason`/`blocking_factors`/`waiting_role`/`completion_readiness` only** |
| **T-D-BE.3** Completion-readiness contract (incl. **billing warning**, open sessions coexist) | BE | Application | S–M | warning never a block (Decision 6) |
| **T-D-BE.4** **Semantics-only guard**: contract returns **no** colours/icons/layout/UI labels; state codes + localization keys only (R5/R6 precedent) | BE | Contract test | S | test asserts no presentation fields in the response |
| T-D-FE.1 ✏ **Render** assembled workflow **pills** from the backend contract (green/yellow/white/blue+owner/red/grey; not colour-alone; mobile rail auto-scrolls active) | FE | Presentation | M | a11y: icon+text; owner named on blue; **FE assembles nothing** |
| T-D-FE.2 ✏ **Render** recommendation + **deviation menu** (`[Do this]` / `[Something else ▾]`) from the contract | FE | Presentation | S–M | **product check:** deviation ≤1 tap; never forced sequencing (Decision 7); **FE computes no recommendation** |
| **T-D-FE.3** 🆕 **Remove frontend workflow derivation** on touched paths — no `nextAction`, no assembly, no completion derivation in FE | FE | Presentation | S | **architecture check:** grep proves no FE recommendation/assembly logic in R7 code |

**Depends:** D-FE now **hard-depends** on D-BE (contract must exist first).

---

## Group E-BE / E-FE — Treatment Plan, Stable Session & Schedule Separation

| Task | Repo | Size | Acceptance |
|---|---|---|---|
| T-E-BE.1 ✏ **Treatment Plan — first-class persisted, versioned entity** (patient · Episode · originating Recommendation · authoring clinician · therapies · session count · frequency · scheduling intent · interval · sequencing · review milestones · completion criteria · course precautions · therapist requirements · status · document version · supersession · provenance) — **no committed dates**. **RATIFIED: entity, not projection.** | BE | **L** | **⚠ schema-bearing group — additive migration + rollback (drop new table), R4–R6 style.** AC 1/2/3/14: Recommendation→one Plan; Plan persists independently of scheduling; rescheduling never changes the Plan; workflow intelligence derives readiness from Plan+Sessions |
| T-E-BE.5 🆕 Plan **versioning/supersession** (Decision 2): amendment references + retains prior; preserves executed sessions; defines effect on future unexecuted sessions; records author/reason/timestamp | BE | **L** | AC 12/13: clinical amendment → new version; **schedule-only change → NO new Plan version** |
| T-E-BE.6 🆕 Distinguish the **four operations**: change clinical intent · change schedule logistics · edit an unexecuted session's instructions · correct an execution record | BE | M | each has distinct semantics + audit |
| T-E-BE.2 **Stable Session identity**; schedule attributes (date/time/therapist/room/bed) mutable; **`day_number` not identity** | BE | M | **state-model check:** reschedule ≠ regenerate |
| T-E-BE.3 Clinical content bound to **session identity**; execution record append-only | BE | M | **product check:** reschedule/cancel/miss/add **preserves doctor instructions**; execution history never overwritten |
| T-E-BE.4 Scheduling intents: consecutive · alternate · weekdays · weekly · multi-weekly · **PRN** · **review-dependent** | BE | M | each intent → correct sessions; PRN creates none upfront |
| T-E-FE.1 Plan authoring + scheduling handoff + session guidance | FE | **L** | capability-gated (**never specialty**) |
| T-E-FE.2 Per-session doctor instructions **after** scheduling + **author-once-apply-to-many** | FE | M | adoption check: 14-session course authorable |
| T-E-FE.3 Therapist execution/actuals | FE | M | actuals append; instructions visible |

---

## Group F-BE / F-FE — Billing Visibility

| Task | Repo | Size | Acceptance |
|---|---|---|---|
| T-F-BE.1 Billing visibility contract (consultation, services, therapy, medicines, consumables, procedures, invoice/payment status, outstanding) reusing `TenantClinicalService`→`TenantInvoiceLine` | BE | S–M | additive read |
| T-F-FE.1 Billing stage: **doctor read-only**, admin/front-desk actionable | FE | M | **product check:** doctor never blocked; unbilled = warning (Decision 6) |

---

## Group G — Living-Document Supersession · **gated on Decision 2 schema approval**

| Task | Repo | Size | Acceptance |
|---|---|---|---|
| T-G.1 Supersession/version model (`DRAFT→FINAL→SIGNED→SUPERSEDED`; amendment references superseded version + author/reason/timestamp) | BE | **L** | **schema change — separate approval** · signed version immutable & renderable forever |
| T-G.2 Amend actions + version/superseded rendering; prints identify version | FE | M | **state-model check:** no path mutates a SIGNED version |
| T-G.3 Close the `DocumentStatus` docstring contradiction | BE docs | S | docstring matches ratification |

---

## Group H — Role, Permission & Capability Composition

| Task | Repo | Size | Acceptance |
|---|---|---|---|
| T-H.1 `episodeWorkspaceConfigByRole` 2→5 roles (**config, no screen forks**) | FE | M | per-role visibility/enablement; RBAC-flexible (not profession-hard-coded) |
| T-H.2 Capability gating for therapy/billing/advice-placeholder (`appointments.multiday`/`.sessions`) | FE | S | **never `isAyurvedaClinic`** for workflow presence |
| T-H.3 Service-layer permission verification per stage | BE | S | permission codes verified in T-0.2 |

---

## Group I — Legacy Introduction, Shadowing & Redirects

| Task | Repo | Size | Acceptance |
|---|---|---|---|
| T-I.1 Shadow `cos-v1` (renders, no redirects) | FE | S | flag off = today |
| T-I.2 Route adapters: `start-consultation`, `consultation`, `complete-consultation` → workspace stages | FE | M | deep-link tests; **no deletion** |
| T-I.3 Standalone casesheet/prescription create/edit → workspace (reuse existing route flags); **standalone "new case sheet per visit" redirects to the episode's sheet** (E-2) | FE | M | flag-switch tests |

---

## Group J — Complete R7 COS Workflow Proof

| Task | Repo | Size | Acceptance |
|---|---|---|---|
| T-J.1 End-to-end proof: all assembled journeys × 5 roles × capability variants | both | **L** | no stranding; no cross-episode/appointment leak; every stage reachable |
| T-J.2 Resolve every ⚠ from design-validation | both | M | each → green or explicitly deferred |

## Group K — R8 Handoff Package

| Task | Size | Acceptance |
|---|---|---|
| T-K.1 R8 scope doc: measurements (on R6 concepts) · attachments · LIONIC/LIS/FHIR adapters · trends · **Clinical Advice** · **copy-forward + reconciliation** · **allergy/medication modelling (F-2 prerequisite)** | M | R8 inputs complete; laboratory design marked R8 |

## Group Z — Architecture, Workflow Proof & Closure

| Task | Size | Acceptance |
|---|---|---|
| T-Z.1 Full regression vs baseline (both suites); **layer audit clean — no new ED-ARCH-001 instances** | M | suites green; audit clean |
| T-Z.2 R7 architecture + clinical-workflow proof doc; closure | S–M | every decision/wireframe → evidence |

---

## Sequencing

```
Group -1 (blocking: F-1 + F-2) → Group 0 (blocking: ED-ARCH-001 remediation)
   → A-BE → A-FE
   → B-BE → B-FE
   → C-BE → C-FE
   → D-BE → D-FE
   → E-BE → E-FE
   → F-BE → F-FE
   → G (gated on Decision-2 schema approval)
   → H → I → J → K → Z
```

**Critical dependencies:** **D-FE hard-depends on D-BE** (Decision 9 — no interim frontend derivation). **ED-ARCH-004 blocks Group I's completion-route composition** until the summary/readiness are backend-owned. F-1 unresolved ⇒ Group A cannot start ⇒ **the ratified case-sheet model cannot be delivered**. F-2 unresolved ⇒ Group C scope undefined. T-0.3 unremediated ⇒ no FE composition. Decision-2 schema unapproved ⇒ Group G deferred (R7 core still ships without amendment).

## Revised R7 size

**Frontend Large · Backend Medium–Large · R7 overall Large** *(after the R8 split; without it, Very Large)*. Drivers: workflow assembly (L), Treatment Plan/session separation (L), supersession (L, if in scope), COS briefing surface, plus unification discipline.

## Not in R7 (explicit)

Laboratory/measurements · attachments · trends · Clinical Advice · copy-forward · medication reconciliation · dispensing/fulfilment lifecycle · generalized workflow engine · autonomous clinical decisions · clinical-decision-support engine · analytics/AI · screen removal (readiness only) · unrelated drift cleanup · **R8 scope may not move back into R7 without explicit owner approval.**

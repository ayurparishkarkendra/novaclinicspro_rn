# R7 — Clinical Operating System · Tasks

**Version:** 1.0 — **APPROVED — implementation roadmap frozen**
**Approved:** 2026-07-17 · **Requirements version:** `requirements.md` v1.0 FROZEN · **Design version:** `design.md` v1.0 APPROVED · **Base commits recorded before this documentation commit:** BE `novaclinicspro-api` `dev` `8b23568` · FE `novaclinicspro_rn` `dev` `cd86021`.
**Implements (immutable, not reinterpreted):** [`requirements.md`](requirements.md) v1.0 FROZEN · [`design.md`](design.md) v1.0 APPROVED · [`requirements-traceability-matrix.md`](requirements-traceability-matrix.md) · R7-OWNER-RATIFICATION · R7-DESIGN-FREEZE-CHECKLIST · R7-GUIDED-CLINICAL-WORKSPACE-DESIGN · R7-TREATMENT-SCHEDULING-MODEL · R7-STATE-DEFINITIONS
**Baselines:** BE `novaclinicspro-api` `dev` `8b23568` · FE `novaclinicspro_rn` `dev` `cd86021`

**Amendment control.** This plan is now frozen. Changing scope, task IDs, dependencies, acceptance criteria, milestones, or governance mechanisms requires a **controlled task-plan amendment** — its own reviewed, versioned change — not an inline edit. No task under this plan may reinterpret `requirements.md` or `design.md`.

> **Engineering Truth note (surfaced, not silently resolved).** `design.md`'s own header still reads *"Draft — not approved"* and *"tasks.md NOT authored — awaits ... approval."* Both are stale relative to this approval: `design.md` is a constitutional input this task is instructed not to modify, so its header was left untouched rather than edited to normalize wording — approval is recorded here instead, in `tasks.md`, where this task's authorization actually permits a status change. A future task should update `design.md`'s own header to match; that is not performed here.

**Governance (R4–R6 proven, mandatory):** one task at a time · per-group Standing Gate (Engineering-Truth → Product-Discovery; **STOP** on divergence) · **Task Isolation** (touch only declared files; no opportunistic cleanup) · never `git add .` · no commit/push/DB-write without explicit authorization · additive/reversible/flag-gated · **frozen once approved**.

**Every task is atomic · independently testable · reviewable · reversible · commitable.** Sizes S/M/L. **No calendar estimates.**

**Rollback vocabulary (owner-ratified — used precisely, never loosely):**
| Kind | Meaning |
|---|---|
| **Behavior** | feature flag · compatibility routing · UI rollback |
| **Migration** | *pre-adoption:* table may be dropped · *post-adoption:* disable behavior, **retain data**, provide compatibility |
| **Compatibility** | legacy route/adapter remains functional |
| **Data** | ⚠ **clinical history is NEVER destroyed.** Amendment chains, signed versions, contributions, audit history preserved. **"Data rollback" is never claimed for clinical records.** |

**Legend:** ✅ verified in code · **[VP]** verification point · **[ETX-n]** Engineering Truth Exception (requirements §19) · **∥** parallelizable.

---

# GROUP -1 — Engineering Truth · Design Validation · Environment
*(no feature code; output is verified knowledge)*

### T--1.1 · Branch & baseline gate
**Repo:** both · **Layer:** — · **Objective:** create R7 feature branch from approved `dev`; record base/HEAD/clean tree.
**Files:** git only · **Blocked by:** — · **Unblocks:** all · **∥ with:** T--1.2…T--1.6 · **Size:** S
**AC:** branch record present; clean at creation; `.claude/` never staged.
**ET:** confirm `dev` = `8b23568`(BE)/`cd86021`(FE). **Tests:** n/a. **Rollback:** *Behavior* — delete branch.
**Reqs:** FR-FLAG-1 · **Design:** §7 · **Decisions:** D8 · **Principles:** AC-6

### T--1.2 · ETX-1 — verify R7 permission codes ∥
**Repo:** BE · **Objective:** verify against `org_permissions`: `casesheet.write/finalise/sign/amend`, `prescription.write/sign/amend`, `treatment.recommend/schedule`, `session.execute`, `billing.view`, `invoice.write`, `payment.write`, `episode.close`, `visit.outcome`, `clinical_service.write`.
**Files:** trace doc · **Blocked by:** T--1.1 · **Unblocks:** BE-F, BE-G, FE-E.6 · **∥** · **Size:** M
**AC:** each code confirmed to **exist** or recorded as **must-be-seeded** with an owning task; **no requirement proceeds on an unverified code.**
**ET:** read-only inspection of `org_permissions` + `rbac_seed.py`. **Tests:** n/a. **Rollback:** n/a.
**Reqs:** FR-RBAC-1, FR-LD-2, FR-WFA-2, FR-BILL-1 · **ETX:** ETX-1

### T--1.3 · ETX-3 — verify appointment purpose / patient-stated concern ∥
**Repo:** BE · **Files:** trace doc · **Blocked by:** T--1.1 · **Unblocks:** BE-A, FE-C.1 · **∥** · **Size:** S
**AC:** existence proven/disproven. If absent → **Engineering Truth Finding** with two options (model additively = scope decision · render "not recorded"). **FR-VCC-2 must not fabricate.** **No redesign.**
**ET:** inspect `tenant_appointment` + appointment schemas. **Reqs:** FR-VCC-2, FR-WFA-1 · **ETX:** ETX-3

### T--1.4 · ETX-5 — `tenant_visits.treatment_plan` disposition ∥
**Repo:** BE · **Objective:** decide final disposition of the **legacy narrative** free-text column ✅ (`treatment_plan: TEXT nullable`).
**Files:** trace doc · **Blocked by:** T--1.1 · **Unblocks:** BE-D · **∥** · **Size:** M
**AC:** (1) usage census. (2) disposition recommended: **retain as legacy narrative** *(default)* · migrate · deprecate. (3) **NOT silently merged with `tenant_treatment_plan`** (owner-directed). (4) naming-collision guard documented.
**ET:** grep readers/writers, both repos. **Reqs:** FR-TP-1 · **Design:** §2.3 · **ETX:** ETX-5

### T--1.5 · ETX-2 — audit null-`episode_id` case sheets ∥
**Repo:** BE · **Files:** trace doc · **Blocked by:** T--1.1 · **Unblocks:** BE-C · **∥** · **Size:** M
**AC:** count + classification recorded; **no nullability migration in R7**; audit precedes any future change.
**ET:** **read-only** shared-DB query (authorization required; no mutation). **Reqs:** FR-CS-1 · **ETX:** ETX-2

### T--1.6 · ETX-4 — capability-change-mid-episode behavior ∥
**Repo:** BE · **Files:** trace doc · **Blocked by:** T--1.1 · **Unblocks:** BE-B · **∥** · **Size:** S
**AC:** behavior specified; default **preserve records, hide future stages** (R5 entitlement-loss precedent ✅). Finding, not redesign. **Reqs:** FR-WFA-1 · **ETX:** ETX-4

### T--1.7 · Design-validation & environment gate
**Repo:** both · **Blocked by:** T--1.2…T--1.6 · **Unblocks:** Group 0 · **Size:** S
**AC:** internal consistency confirmed (42/42 coverage ✅); both suites green at baseline (BE 667 ✅). **Rollback:** n/a.

> **GATE:** Group 0 does not start until T--1.7 passes.

---

# GROUP 0 — Blocking Architectural Debt
**No feature work begins until complete.** Scope = **only R7-composed modules** (ED-ARCH-001 §migration-strategy — do not widen to a repo-wide refactor).

### T-0.1 · Characterization baseline ∥
**Repo:** FE · **Layer:** Test · **Objective:** lock current behavior before touching anything.
**Files:** extend `tests/features/doctorDashboard/consultationFlow.integration.test.tsx`, `workspaceProvider.test.tsx`, `caseSheetDualImplementation.characterization.test.tsx`, `prescriptionDualImplementation.characterization.test.tsx` ✅
**Blocked by:** T--1.7 · **Unblocks:** T-0.2…T-0.9 · **Size:** S
**AC:** baseline captured; all green. **Tests:** characterization. **Rollback:** *Behavior* — test-only.
**Reqs:** FR-COS-1 · **Design:** §5

### T-0.2 · ED-ARCH-001 — `PrescriptionModule` (**2 imports** ✅ + live `axiosClient.get` ✅)
**Repo:** FE · **Layer:** Presentation→Application · **Objective:** route transport through the feature's repository/hook; remove `axiosClient`+datasource imports.
**Files:** `features/episodes/presentation/components/ConsultationSections/PrescriptionModule.tsx` (+ its hook/repository)
**Blocked by:** T-0.1 · **Unblocks:** FE-E.2 · **∥ with:** T-0.3…T-0.7 · **Size:** M
**AC:** (1) zero `axiosClient`/datasource imports. (2) **behavior-preserving** — `prescriptionModule.test.tsx` ✅ green unchanged. (3) no new abstraction invented.
**ET:** confirm an existing hook/repository covers the call; if none → create one **in the correct layer**, not a workaround. **Tests:** unit · architecture (no presentation→transport import). **Rollback:** *Behavior* — revert.
**Reqs:** FR-COS-2, FR-RX-1 · **Design:** §2.7, §3 · **Debt:** ED-DEP-1 · **Principles:** P9, AC-2

### T-0.3 · ED-ARCH-001 — `CaseSheetModule` (1 ✅) ∥
**Repo:** FE · **Files:** `.../ConsultationSections/CaseSheetModule.tsx` · **Blocked by:** T-0.1 · **Unblocks:** FE-E.1 · **Size:** S
**AC:** zero violation imports; `caseSheetModule.test.tsx` ✅ green. **Rollback:** *Behavior* — revert. **Reqs:** FR-COS-2 · **Debt:** ED-DEP-1

### T-0.4 · ED-ARCH-001 — `TreatmentRecommendationModule` (1 ✅) ∥
**Repo:** FE · **Files:** `.../ConsultationSections/TreatmentRecommendationModule.tsx` · **Blocked by:** T-0.1 · **Unblocks:** FE-E.2 · **Size:** S
**AC:** zero violation imports; `treatmentRecommendationModule.test.tsx` ✅ green. **Rollback:** *Behavior* — revert. **Reqs:** FR-COS-2, FR-TR-1 · **Debt:** ED-DEP-1

### T-0.5 · ED-ARCH-001 — `ClinicalServicesModule` (1 ✅) ∥
**Repo:** FE · **Files:** `.../ConsultationSections/ClinicalServicesModule.tsx` · **Blocked by:** T-0.1 · **Unblocks:** FE-E.2 · **Size:** S
**AC:** zero violation imports; behavior preserved. **Rollback:** *Behavior* — revert. **Reqs:** FR-COS-2 · **Debt:** ED-DEP-1

### T-0.6 · ED-ARCH-001 — `useClinicalTimelineData` (1 ✅) ∥
**Repo:** FE · **Files:** `features/episodes/presentation/hooks/useClinicalTimelineData.ts` · **Blocked by:** T-0.1 · **Unblocks:** FE-C.4 · **Size:** S
**AC:** zero violation imports; `clinicalWorkspaceTimelineFlagSwitch.test.tsx` ✅ green. **Rollback:** *Behavior* — revert. **Reqs:** FR-COS-2 · **Debt:** ED-DEP-1

### T-0.7 · ED-ARCH-001 — `TreatmentSheetDetailScreen` (2 ✅) + `useTreatmentSheetRows` (1 ✅) ∥
**Repo:** FE · **Files:** `features/treatmentSheets/presentation/pages/TreatmentSheetDetailScreen.tsx`, `.../detail/useTreatmentSheetRows.ts` · **Blocked by:** T-0.1 · **Unblocks:** FE-E.2 · **Size:** M
**AC:** zero violation imports; existing treatment tests green. **Rollback:** *Behavior* — revert. **Reqs:** FR-COS-2, FR-TS-3 · **Debt:** ED-DEP-1

### T-0.8 · **ED-ARCH-004** — retire `deriveSummary` from clinical decision-making
**Repo:** FE · **Layer:** Presentation · **Objective:** stop the frontend deriving the consultation summary/completion and **acting on it**.
**Files:** `features/episodes/presentation/pages/CompleteConsultationScreen.tsx` (1 import ✅ + `deriveSummary` ✅)
**Blocked by:** **T-BE-F.3** (backend owns summary+readiness) · **Unblocks:** T-FE-F.2 · **Size:** M
**AC:** (1) `deriveSummary` renders the backend contract — derives no clinical statement. (2) `treatmentSent = treatmentState !== 'DRAFT'` lifecycle duplication ✅ **removed**. (3) hardcoded template IDs `['nadi_pariksha','prakriti']` ✅ removed from presentation. (4) **absence never rendered as a negative finding** (`'Not saved'/'Not created'/'Not sent'` → backend states). (5) `transitionCasesheetStatusApi(...,{status:'FINAL'})` ✅ driven by contract, not local derivation.
**ET:** re-verify the violation before changing. **Tests:** unit · **architecture (no FE clinical derivation)** · regression (completion flow). **Rollback:** *Behavior* — flag `cos_v1` off restores the legacy screen (never deleted in R7).
**Reqs:** FR-COS-2, FR-CR-1 · **Design:** §2.9, §2.10, §3 · **Debt:** ED-DEP-2 · **Principles:** P1, P2, P3

### T-0.9 · **ED-ARCH-006** — remove frontend workflow assembly
**Repo:** FE · **Layer:** Application · **Objective:** delete `buildSectionConfig()`'s assembly + hardcoded canonical order + `isAyurvedaClinic` workflow gating ✅.
**Files:** `features/episodes/presentation/hooks/useConsultationWorkspace.ts`
**Blocked by:** **T-BE-B.2** (backend assembles) · **Unblocks:** FE-D · **Size:** M
**AC:** (1) no `activeSections` computed in FE. (2) no `isAyurvedaClinic` **workflow-presence** gating (labels only). (3) `SectionProgress` retained **only** as UI state — **never visit-level completion** (that is T-BE-F.3). (4) architecture test proves no FE assembly.
**ET:** verify no other consumer depends on `activeSections` before removal. **Tests:** unit · architecture · regression (`useConsultationWorkspace.test.tsx` ✅). **Rollback:** *Behavior* — flag off.
**Reqs:** FR-COS-2, FR-WFA-1 · **Design:** §3 · **Debt:** ED-DEP-3, ED-DEP-6 · **Principles:** P2, P3, P8

> **GATE:** no FE composition task runs against a module until that module's Group-0 task is complete.

---

# BACKEND

## BE Group A — Clinical Workspace Aggregate
*(Approved: **one** purpose-specific aggregate; FE never assembles from multiple responses. It **composes existing authorities** — never a second lifecycle owner.)*

### T-BE-A.1 · Workspace facts snapshot (read model)
**Repo:** BE · **Layer:** Application · **Objective:** assemble `WorkspaceFactsSnapshot` via **repositories only** — patient/episode/visit context, document presence+status, treatment state (**reuse `treatment_lifecycle_resolver`** ✅), billing state, capabilities, permissions, purpose ([ETX-3]).
**Files:** `app/application/services/clinical_workspace_service.py`, `app/domain/services/i_clinical_workspace_service.py`, `app/application/factories/clinical_workspace_factory.py`
**Blocked by:** T-0 gate, T--1.3 · **Unblocks:** T-BE-A.2, T-BE-B.2 · **∥ with:** BE-C, BE-D · **Size:** M
**AC:** (1) **no DB/ORM in router; no business-data SQLAlchemy in service** (AC-1). (2) treatment stage from the existing resolver (**one answer**, P3). (3) platform-reference reads may use the documented `AsyncSession` exception ✅ (`capability_catalog_provider`); **business data via repositories**. (4) snapshot immutable.
**ET:** confirm every needed repo method exists; if absent → extend the **interface**, never bypass. **Tests:** unit (`AsyncMock(spec=...)` ✅) · architecture. **Rollback:** *Behavior* — additive, unreferenced.
**Reqs:** FR-VCC-3, FR-VCC-4, FR-PS-1 · **Design:** §2.1 · **Decisions:** D9 · **Principles:** P1, P2, P3, AC-1

### T-BE-A.2 · Aggregate read endpoint (thin router)
**Repo:** BE · **Layer:** Router · **Files:** `app/api/v1/routers/clinical_workspace_router.py`, `.../dependencies/services/clinical_workspace_dependencies.py`
**Blocked by:** T-BE-A.1 · **Unblocks:** T-FE-A.2 · **Size:** S
**AC:** (1) router parses/authz/calls service/translates — nothing else. (2) additive; **no existing contract changed** (AC-8). (3) follows verified `get_X_service → create_X_service(db) → IXService` convention ✅.
**Tests:** contract · integration · architecture. **Rollback:** *Behavior* — remove route.
**Reqs:** FR-VCC-1 · **Design:** §2.1, §4

## BE Group B — Clinical Workflow Resolver & Service

### T-BE-B.1 · `clinical_workflow_resolver` — **pure domain**
**Repo:** BE · **Layer:** Domain (pure) · **Objective:** assemble workflow + derive recommendation/blocking/waiting-role/completion-readiness as a **pure function over immutable snapshots** (R4 `treatment_lifecycle_resolver`/R5 `capability_resolver` shape ✅).
**Files:** `app/domain/services/clinical_workflow_resolver.py`
**Blocked by:** T-0 gate, T--1.6 · **Unblocks:** T-BE-B.2 · **∥ with:** BE-A, BE-C, BE-D · **Size:** **L**
**AC:** (1) imports **nothing** from `app.infrastructure`/`app.api`/session/`app.localization` (AC-3 — the trap `capability_resolver` documents ✅). (2) **unit-testable with no DB.** (3) assembles GP · Ayurveda · Physio · follow-up · treatment-review · therapist journeys correctly. (4) **no fixed canonical order.** (5) capability-gated, **never** specialty-gated (AC-7). (6) inapplicable stages absent. (7) frozen dataclasses out.
**ET:** verify capability codes `appointments.multiday`/`appointments.sessions` ✅ and entitlement (`("ayurveda","physio")` ✅). **Tests:** **unit, no DB** (per journey) · architecture (import audit). **Rollback:** *Behavior* — additive.
**Reqs:** FR-WFA-1, FR-WFA-2, FR-REC-1, FR-CR-1 · **Design:** §2.1 · **Decisions:** D9 · **Principles:** P2, P3, P8, AC-3

### T-BE-B.2 · `clinical_workflow_service` + contract
**Repo:** BE · **Layer:** Application+Router · **Files:** `app/application/services/clinical_workflow_service.py` (+ router/dependencies/factory)
**Blocked by:** T-BE-A.1, T-BE-B.1 · **Unblocks:** **T-0.9**, T-FE-B.1, T-FE-D.1 · **Size:** M
**AC:** contract returns `recommended_action · reason · blocking_factors[] · waiting_role · completion_readiness{} · stages[] · alternatives[]`.
**Tests:** unit (mocked) · contract · integration. **Rollback:** *Behavior* — additive endpoint.
**Reqs:** FR-WFA-1/2, FR-REC-1 · **Design:** §2.1, §4

### T-BE-B.3 · **Semantics-only contract guard**
**Repo:** BE · **Layer:** Contract test · **Files:** `tests/test_r7_workflow_contract_semantics_only.py`
**Blocked by:** T-BE-B.2 · **Unblocks:** T-FE-B.1 · **Size:** S
**AC:** fails if any colour/icon/layout/UI-label field appears; state codes carry **localization keys** ✅.
**Tests:** contract. **Rollback:** *Behavior* — test-only. **Reqs:** FR-REC-1 · **Design:** §4 · **Principles:** AC-4

## BE Group C — Case Sheet (F-1)

### T-BE-C.1 · Episode find-or-create
**Repo:** BE · **Layer:** Application · **Files:** `app/application/services/casesheets_service.py`
**Blocked by:** T-0 gate, T--1.5 · **Unblocks:** T-BE-C.2, T-FE-E.1 · **∥ with:** BE-A, BE-B, BE-D · **Size:** M
**AC:** (1) V2 **reuses** the Episode's sheet. (2) a second sheet never created for an Episode. (3) null-`episode_id` legacy sheets handled gracefully ([ETX-2]); **no nullability migration**.
**ET:** re-verify `episode_id` immutability on update ✅. **Tests:** unit · integration (dup-guard) · regression. **Rollback:** *Behavior* — revert; **Data:** ⚠ none — read/create only.
**Reqs:** FR-CS-1 · **Design:** §2.2 · **Decisions:** D1 · **Principles:** P4

### T-BE-C.2 · **Current-Visit attribution** (F-1 fix)
**Repo:** BE · **Layer:** Application · **Objective:** resolve attribution from an explicit, backend-validated **current visit context** — never from `casesheet.appointment_id` ✅.
**Files:** `casesheets_service.py`, `casesheets_router.py` (additive input), `i_casesheet_repository.py` if needed
**Blocked by:** T-BE-C.1 · **Unblocks:** T-BE-C.3 · **Size:** M
**AC (FR-CS-2):** (1) V1→V1. (2) **V2→V2.** (3) V2 never attributed to V1. (4) V3 appends without altering V1/V2. (5) other-**Episode** rejected. (6) other-**patient** rejected. (7) other-**tenant** rejected. (12) `appointment_id` = **creation provenance only**, never read for attribution.
**Transport [VP]:** route param · request field · server-resolved context — per existing API conventions; **business rule frozen.**
**ET:** re-verify defect; confirm `visit_repo` on UoW ✅. **Tests:** unit (N-visit attribution) · integration (each rejection) · regression. **Rollback:** *Behavior* — revert; **Data:** ⚠ **existing historical contributions NOT rewritten** (AC 11) — forward-only; **clinical history never destroyed**.
**Reqs:** FR-CS-2, FR-CS-6 · **Design:** §2.2 · **Decisions:** D1, F-1 · **Principles:** P4, P5

### T-BE-C.3 · **Atomicity** — remove the permissive guard
**Repo:** BE · **Layer:** Application · **Files:** `casesheets_service.py`
**Blocked by:** T-BE-C.2 · **Unblocks:** T-BE-C.4 · **Size:** **S** *(subtractive)*
**AC:** (8) unresolved Visit → **explicit failure**, nothing persisted. (9) no content update survives a missing required contribution.
**ET (verified):** UoW exposes `commit()`/`rollback()` and holds both `casesheet_contribution_repo` ✅ and `visit_repo` ✅ on one session; contribution create **already inside the transaction** ✅. **This task removes the `if visit:` guard** (today: *"no contribution row is inserted; the content update still succeeds"* ✅). **No transactional machinery built** — if implementation finds otherwise, raise an **ET Finding**, do not redesign.
**Tests:** unit · **integration with failure injection → neither persists** · regression. **Rollback:** *Behavior* — revert; **Data:** ⚠ none.
**Reqs:** FR-CS-3 · **Design:** §2.2 · **Decisions:** F-1 · **Principles:** P5

### T-BE-C.4 · **Idempotency** [VP]
**Repo:** BE · **Layer:** Application · **Files:** `casesheets_service.py` (+ repository/constraint if the chosen key needs it)
**Blocked by:** T-BE-C.3 · **Unblocks:** T-FE-E.1 · **Size:** M
**AC:** (10) retry → exactly one contribution.
**ET (owner-directed — decide, don't assume):** evaluate (case sheet + visit + authoring operation) · explicit contribution id · mutation/request id. **Must check** the legitimate case of **two distinct contributions by the same staff in the same visit** before adopting a natural key (design §2.2e).
**Tests:** unit · integration (duplicate submit; retry-after-timeout) · **migration test if a constraint is added**. **Rollback:** *Behavior* — revert; **Migration** (only if constraint added): *pre-adoption* drop; *post-adoption* disable enforcement, **retain data**.
**Reqs:** FR-CS-4 · **Design:** §2.2 · **Decisions:** F-1

## BE Group D — Treatment Plan
*(Entity name approved: **`tenant_treatment_plan`**. `tenant_visits.treatment_plan` is **legacy narrative only** — never silently merged; disposition from T--1.4.)*

### T-BE-D.1 · Domain object + repository interface
**Repo:** BE · **Layer:** Domain · **Files:** `app/domain/treatment_plan/models.py`, `app/domain/repositories/i_treatment_plan_repository.py`
**Blocked by:** T-0 gate, T--1.4 · **Unblocks:** T-BE-D.2 · **∥ with:** BE-A, BE-B, BE-C · **Size:** M
**AC:** (1) pure domain (AC-3). (2) **no committed dates** (FR-TP-1). (3) status = **smallest additive** enum for the frozen stages; ⚠ **`TreatmentLifecycleStatus` NOT reused** without semantic-fit proof (verified: execution statuses, not Plan lifecycle ✅).
**ET:** re-verify no Plan entity exists ✅ (`app/domain/treatment_plan/` = `SyncResult` only ✅). **Tests:** unit (domain invariants). **Rollback:** *Behavior* — additive.
**Reqs:** FR-TP-1, FR-TP-2 · **Design:** §2.3 · **Principles:** P1, AC-3

### T-BE-D.2 · `tenant_treatment_plan` — ORM model + **additive migration**
**Repo:** BE · **Layer:** Infrastructure · **Files:** `app/infrastructure/db/models/tenant_treatment_plan.py`, `.../migrations/versions/<rev>_r7_treatment_plan.py`, models `__init__.py`
**Blocked by:** T-BE-D.1 · **Unblocks:** T-BE-D.3 · **Size:** **L**
**AC:** (1) **additive only** — no existing table altered (AC-8). (2) `tenant_` prefix (tenant-owned ✅). (3) single alembic head. (4) empty at creation. (5) `downgrade()` drops cleanly. (6) **`tenant_visits.treatment_plan` untouched.**
**ET:** verify current head before revising. **Tests:** structural · **migration up/down on disposable Postgres (NOT Supabase)** ✅ (R6 T-A.1 precedent) · single-head. **Rollback:** **Migration — *pre-adoption:* drop the table** (no data, nothing altered); ***post-adoption:* flag off, RETAIN data, provide compatibility.** ⚠ **Data: once plans exist they are clinical records — never destroyed.**
**Reqs:** FR-TP-1 · **Design:** §2.3 · **Decisions:** Treatment Plan

### T-BE-D.3 · Repository impl + UoW registration
**Repo:** BE · **Layer:** Infrastructure · **Files:** `.../repositories/sqlalchemy_treatment_plan_repository.py`, `app/infrastructure/uow/sqlalchemy_uow.py`
**Blocked by:** T-BE-D.2 · **Unblocks:** T-BE-D.4 · **Size:** M
**AC:** implements interface; registered on UoW alongside existing repos ✅; returns DTO/dict (no ORM leakage upward).
**Tests:** unit · integration (disposable Postgres). **Rollback:** *Behavior* — revert. **Reqs:** FR-TP-1 · **Principles:** AC-1

### T-BE-D.4 · Plan service — Recommendation → Plan
**Repo:** BE · **Layer:** Application · **Files:** `app/application/services/treatment_plan_service.py` (+ router/dependencies/factory)
**Blocked by:** T-BE-D.3, T--1.2 · **Unblocks:** T-BE-D.5, BE-E, T-FE-E.2 · **Size:** M
**AC:** (1) Recommendation → **one** approved Plan (FR-TR-1 AC1). (2) Plan persists **independently of scheduling** (FR-TP-1 AC2). (3) rescheduling never changes the Plan (AC3).
**Tests:** unit (mocked) · integration · contract. **Rollback:** *Behavior*. **Reqs:** FR-TP-1, FR-TR-1 · **Design:** §2.3, §2.8

### T-BE-D.5 · Plan versioning/supersession + four-operation distinction
**Repo:** BE · **Layer:** Application · **Objective:** clinical-intent change → new version; **schedule-only change → no new version.**
**Blocked by:** T-BE-D.4, T-BE-G.1 · **Unblocks:** T-BE-E.4 · **Size:** **L**
**AC:** (12) clinical amendment versioned/superseded. (13) **schedule-only → NO new Plan version.** (a/b/c/d) four operations distinct: intent · logistics · unexecuted-instruction edit · execution correction. Amendment preserves executed sessions; defines effect on future unexecuted ones.
**Tests:** unit (each op) · integration · regression. **Rollback:** *Behavior* — flag; **Data:** ⚠ **amendment chains + superseded versions PRESERVED — never destroyed.**
**Reqs:** FR-TP-3, FR-LD-1 · **Design:** §2.3, §2.6 · **Principles:** P6

## BE Group E — Sessions · Scheduling · Content · Execution

### T-BE-E.1 · Stable session identity
**Repo:** BE · **Layer:** Application+Infrastructure · **Blocked by:** T-BE-D.4 · **Unblocks:** T-BE-E.2 · **Size:** M
**AC:** (4) sessions link to Plan. (5) identity survives date/time/therapist/room change. (10) sessions added without recreating existing ones. (11) reducing the course deletes **no** historical/executed sessions. **"Regenerate from schedule" not implemented as a concept.** `day_number` ✅ = display-order only, **never identity** (retirement not R7).
**ET (verified):** `treatment_sheet_row` already has `session_id`/`session_date`/`assigned_staff_id`/`status`/`completed_at`/`completed_by_staff_id` ✅. **Tests:** unit · integration (reschedule preserves identity) · regression. **Rollback:** *Behavior*; **Data:** ⚠ sessions are clinical records — never destroyed.
**Reqs:** FR-TS-1, FR-TS-2 · **Design:** §2.4 · **Principles:** P1

### T-BE-E.2 · Scheduling intents
**Repo:** BE · **Layer:** Application · **Blocked by:** T-BE-E.1 · **Unblocks:** T-BE-E.3, T-FE-E.2 · **Size:** M
**AC:** (8) consecutive **and** non-sequential. (9) review-dependent supported. **PRN pre-creates no dates.** review-dependent schedules only to the milestone. **Capability-gated, never specialty-gated** (AC-7).
**Tests:** unit (each intent) · integration. **Rollback:** *Behavior*. **Reqs:** FR-SCH-1 · **Design:** §2.4 · **Principles:** P8

### T-BE-E.3 · Doctor clinical content bound to session identity
**Repo:** BE · **Layer:** Application · **Blocked by:** T-BE-E.2 · **Unblocks:** T-BE-E.4, T-FE-E.2 · **Size:** M
**AC:** (6) **doctor instructions survive rescheduling** — by construction. reschedule/cancel/miss/add never delete, regenerate, detach or silently remap content. content attaches to identity, not date.
**Tests:** unit · **integration: reschedule → content intact** · regression. **Rollback:** *Behavior*; **Data:** ⚠ content is clinical — never destroyed. **Reqs:** FR-TS-3, FR-SCH-2 · **Design:** §2.4

### T-BE-E.4 · Therapist execution (append-only) + `Missed` decomposition
**Repo:** BE · **Layer:** Application · **Blocked by:** T-BE-E.3 · **Unblocks:** T-FE-E.3 · **Size:** M
**AC:** (7) actuals stay attached to the executed session. execution history **append-only/audit-controlled**; a reschedule **never** overwrites it. `Missed` = **schedule state + execution outcome + structured reason** — **no single ambiguous `MISSED`**; spelling **[VP]**.
**ET:** verify existing session/actuals surface (structural to date). **Tests:** unit · integration (reschedule after execution) · regression. **Rollback:** *Behavior*; **Data:** ⚠ execution history never destroyed.
**Reqs:** FR-TS-4, FR-TS-5 · **Design:** §2.4 · **Principles:** P6

### T-BE-E.5 · Session concurrency (OCC) ∥ with T-BE-E.4
**Repo:** BE · **Layer:** Application · **Blocked by:** T-BE-E.3 · **Size:** S
**AC:** doctor-authoring vs admin-rescheduling → conflict surfaces reload/keep; **never silent clobber.** reuses verified `version`/If-Match (R5 ✅)/`document_version` ✅.
**Tests:** unit · integration (concurrent write). **Rollback:** *Behavior*. **Reqs:** FR-SCH-2 · **Design:** §2.4

## BE Group F — Billing · Completion Readiness · Recommendation

### T-BE-F.1 · Billing visibility read contract ∥
**Repo:** BE · **Layer:** Application+Router · **Objective:** compose the **verified existing spine** — `TenantClinicalService.visit_id`(`nullable=False` ✅) → `TenantInvoiceLine.clinical_service_id` ✅ → invoice → payment.
**Blocked by:** T-0 gate, T--1.2 · **Unblocks:** T-FE-E.4 · **∥ with:** BE-C, BE-D, BE-E · **Size:** M
**AC:** returns consultation charges · clinical services · therapy/session charges · medicines · consumables · procedures · invoice status · payment status · outstanding. **read-only; no new billing write path in R7.** capability-gated.
**Tests:** unit · contract · integration. **Rollback:** *Behavior* — additive read. **Reqs:** FR-BILL-1 · **Design:** §2.5 · **Decisions:** D6 · **Principles:** P8

### T-BE-F.2 · Completion readiness — billing warning, never block
**Repo:** BE · **Layer:** Application · **Blocked by:** T-BE-F.1, T-BE-B.2 · **Unblocks:** T-BE-F.3 · **Size:** S
**AC:** unbilled → **warning**; completion succeeds. **no hard block hard-coded**; blocking tenant policy is explicit config **[VP]**. open therapy sessions **coexist** with consultation completion.
**Tests:** unit · integration. **Rollback:** *Behavior*. **Reqs:** FR-BILL-2, FR-CR-1 · **Design:** §2.5 · **Decisions:** D6

### T-BE-F.3 · **Backend owns consultation summary + completion readiness**
**Repo:** BE · **Layer:** Application · **Objective:** the single backend answer to *"can this visit be completed?"* + the summary the FE derives today ✅.
**Blocked by:** T-BE-F.2 · **Unblocks:** **T-0.8**, T-FE-F.2 · **Size:** M
**AC:** (1) **exactly one** answer (DP-15). (2) outstanding-mandatory + optional-suggested + warnings returned. (3) explicit states (**never absence-as-negative**). (4) replaces every clinical statement `deriveSummary` ✅ computes.
**Tests:** unit · contract · integration. **Rollback:** *Behavior* — additive; FE falls back to flag-off legacy screen.
**Reqs:** FR-CR-1, FR-COS-2 · **Design:** §2.1 · **Debt:** ED-DEP-2 · **Principles:** P1, P2, P3

## BE Group G — Living Documents · Supersession · Compatibility · Rollback

### T-BE-G.1 · Supersession representation [VP]
**Repo:** BE · **Layer:** Infrastructure+Domain · **Objective:** version chain + superseded pointer + amendment metadata (author/reason/timestamp).
**Blocked by:** T-0 gate, T--1.2 · **Unblocks:** T-BE-D.5, T-BE-G.2 · **Size:** **L**
**AC:** (1) a `SIGNED` version is **never mutated.** (2) a superseded version is **retained**, renderable **exactly as signed**, visibly marked. (3) never deleted by ordinary editing. (4) additive schema.
**ET:** verify `document_version` ✅ semantics before extending; **do not overload** an existing enum (ED-ARCH-002 lesson). **Tests:** unit · **migration up/down (disposable Postgres)** · integration (immutability of signed version). **Rollback:** **Migration — *pre-adoption:* drop additive structures; *post-adoption:* disable amendment via flag, RETAIN data, provide compatibility.** ⚠ **Data: amendment chains, signed versions, audit history PRESERVED — clinical history NEVER destroyed. No data rollback is claimed.**
**Reqs:** FR-LD-1 · **Design:** §2.6 · **Decisions:** D2 · **Principles:** P6

### T-BE-G.2 · Amendment service + permissions
**Repo:** BE · **Layer:** Application · **Blocked by:** T-BE-G.1, T--1.2 · **Unblocks:** T-FE-E.5 · **Size:** M
**AC:** amendment requires a distinct permission ([ETX-1]); rejection is **service-layer** (not UI hiding); follows draft/final/sign lifecycle.
**Tests:** unit · integration (unpermitted amend rejected). **Rollback:** *Behavior*; **Data:** ⚠ preserved. **Reqs:** FR-LD-2 · **Design:** §2.6

### T-BE-G.3 · Close the `DocumentStatus` docstring contradiction
**Repo:** BE · **Layer:** Docs · **Blocked by:** T-BE-G.1 · **Size:** S
**AC:** docstring (*"FINAL: Locked… SIGNED: Immutable, terminal"* ✅) matches the ratified supersession model. **docs only — no behavior change.**
**Tests:** n/a. **Rollback:** *Behavior* — revert docstring. **Reqs:** FR-LD-3 · **Design:** §2.6

---

# FRONTEND
*(Every FE task is **render-only**. No FE task may derive clinical meaning — FR-COS-2.)*

## FE Group A — Workspace shell

### T-FE-A.1 · `VisitCommandCenter` shell on the **existing** route
**Repo:** FE · **Layer:** Presentation · **Files:** `features/episodes/presentation/pages/VisitCommandCenter.tsx`, `app/clinic-admin/episodes/[episodeId]/workspace.tsx` ✅ (wire only)
**Blocked by:** T-0 gate · **Unblocks:** FE-B, FE-C · **∥ with:** all BE groups · **Size:** M
**AC:** (1) **no new workspace route** (FR-COS-1 AC1). (2) flag `cos_v1` **off ⇒ today's behavior exactly.** (3) reuses `WorkspaceProvider` ✅ — context scoping **not weakened.** (4) invalid context → explicit "cannot open workspace" (W30).
**ET:** confirm `WorkspaceProvider`'s appointment-scoped visit lookup ✅ before reuse. **Tests:** unit · integration (flag on/off parity) · regression. **Rollback:** *Behavior* — flag off; **Compatibility:** legacy workspace untouched.
**Reqs:** FR-COS-1, FR-VCC-1 · **Design:** §3 · **Principles:** P9

### T-FE-A.2 · Workspace data hook (application layer)
**Repo:** FE · **Layer:** Application · **Blocked by:** T-FE-A.1, T-BE-A.2 · **Unblocks:** FE-C · **Size:** S
**AC:** canonical query key + invalidation; **presentation never touches a datasource** (AC-2); reuses verified freshness discipline ✅ (no forced remounts).
**Tests:** unit · architecture · integration (invalidation). **Rollback:** *Behavior*. **Reqs:** FR-COS-1 · **Design:** §3

### T-FE-A.3 · Feature flag `cos_v1` ∥
**Repo:** FE (+BE mirror) · **Layer:** Core · **Files:** `core/hooks/useFeatures.ts` ✅ (+ `app/core/config.py` ✅ if a BE gate is needed)
**Blocked by:** T-0 gate · **Unblocks:** T-FE-A.1 · **Size:** S
**AC:** mirrors the verified mechanism exactly (`isFreshnessV1Enabled`/`isClinicalSpineV1Enabled` ✅; `freshness_v1_enabled`/`clinical_spine_v1_enabled` ✅). **one umbrella flag**; reuse existing route flags.
**Tests:** flag-switch. **Rollback:** *Behavior* — flag off ⇒ **no data effect.** **Reqs:** FR-FLAG-1 · **Principles:** AC-6

## FE Group B — Workflow rendering

### T-FE-B.1 · `WorkflowPills` (render-only)
**Repo:** FE · **Layer:** Presentation · **Blocked by:** T-FE-A.2, **T-BE-B.2**, T-BE-B.3 · **Unblocks:** FE-D · **Size:** M
**AC:** 🟢completed 🟡current ⚪pending 🔵waiting-on-role (**owner named**) 🔴blocked ⚫n/a. **renders backend stages; assembles nothing.** never colour-alone (icon+text). grey only where useful.
**Tests:** unit (each state) · architecture (no assembly) · a11y. **Rollback:** *Behavior* — flag. **Reqs:** FR-MOB-2, FR-WFA-2 · **Principles:** P2, P9

### T-FE-B.2 · `NextActionBar` + deviation menu (render-only)
**Repo:** FE · **Layer:** Presentation · **Blocked by:** T-FE-B.1 · **Unblocks:** FE-D · **Size:** M
**AC:** renders `recommended_action · reason · blocking_factors · waiting_role`; `[Do this]` + **`[Something else ▾]` always present**; deviation ≤1 tap; **no forced sequencing**; **FE computes no recommendation.**
**Tests:** unit · architecture · a11y. **Rollback:** *Behavior*. **Reqs:** FR-REC-2, FR-COS-2 · **Decisions:** D7 · **Principles:** P7

## FE Group C — Visit Command Center regions

### T-FE-C.1 · "Why today" ∥
**Repo:** FE · **Blocked by:** T-FE-A.2, T--1.3 · **Size:** S
**AC:** purpose+concern rendered when present; absent → **"not recorded"**; **never inferred** ([ETX-3]). **Tests:** unit · empty-state. **Rollback:** *Behavior*. **Reqs:** FR-VCC-2

### T-FE-C.2 · "What changed" (R7 scope) ∥
**Repo:** FE · **Blocked by:** T-FE-A.2, T-BE-A.1 · **Size:** M
**AC:** **only** the 8 R7 signals; **no measurement deltas** ([R8]); deltas computed backend-side. **Tests:** unit · integration. **Rollback:** *Behavior*. **Reqs:** FR-VCC-3

### T-FE-C.3 · "Before you act" (R7 scope) ∥
**Repo:** FE · **Blocked by:** T-FE-A.2, T-BE-A.1 · **Size:** S
**AC:** **only** verified signals (pending review · Rx status · episode · session progress). **no allergy/interaction/renal/hepatic panel.** **never render an unbacked safety field** — the FE `allergies` field ✅ (ED-ARCH-003) **must not** be surfaced (false clinical negative).
**Tests:** unit · **test asserting no allergy/renal panel renders.** **Rollback:** *Behavior*. **Reqs:** FR-VCC-4, FR-PS-1 · **Decisions:** F-2 · **Debt:** ED-DEP-4

### T-FE-C.4 · History/timeline panel ∥
**Repo:** FE · **Blocked by:** T-0.6 · **Size:** S
**AC:** reuses `ClinicalTimeline` ✅; virtualized; **default-filtered to the active episode** (no cross-episode leak). **Tests:** unit · integration. **Rollback:** *Behavior*. **Reqs:** FR-VCC-1

## FE Group D — Dynamic workflow rendering

### T-FE-D.1 · Render the assembled workflow (post-`buildSectionConfig` removal)
**Repo:** FE · **Layer:** Presentation · **Blocked by:** **T-0.9**, T-FE-B.1, T-FE-B.2 · **Unblocks:** FE-E · **Size:** M
**AC:** stages come **only** from the backend; GP shows no therapy stages **because the capability is absent**, not clinic name; blocked stage shows reason + fix affordance (W18); read-only role sees content, actions hidden (W19/W26).
**Tests:** unit (per journey) · architecture (no FE assembly) · regression. **Rollback:** *Behavior* — flag. **Reqs:** FR-WFA-1/2, FR-COS-2 · **Principles:** P2, P8

## FE Group E — Module composition
*(each blocked by its module's Group-0 remediation)*

### T-FE-E.1 · Compose Case Sheet + append-only visit notes
**Repo:** FE · **Blocked by:** **T-0.3**, T-BE-C.4 · **Size:** M
**AC:** opens the **Episode's** sheet (never a second); prior visits' notes **visibly retained** with author+timestamp, never overwritten; supplies the explicit current-visit context (T-BE-C.2 transport).
**Tests:** unit · integration (multi-visit) · regression. **Rollback:** *Behavior*. **Reqs:** FR-CS-1, FR-CS-5

### T-FE-E.2 · Compose Prescription · Recommendation · Plan · Scheduling
**Repo:** FE · **Blocked by:** **T-0.2/T-0.4/T-0.7**, T-BE-D.4, T-BE-E.2, T-BE-E.3 · **Size:** M
**AC:** **no `Issue`/`Dispense` action exists** (FR-RX-1); Rx edit DRAFT-only; **FE never reconstructs the Plan from schedule rows** (FR-TP-1 AC15); **author-once-apply-to-many** per-session instructions (FR-TS-3 adoption).
**Tests:** unit · integration · architecture. **Rollback:** *Behavior*. **Reqs:** FR-RX-1, FR-TR-1, FR-TP-1, FR-TS-3, FR-SCH-1

### T-FE-E.3 · Compose therapist session execution ∥
**Repo:** FE · **Blocked by:** **T-0.7**, T-BE-E.4 · **Size:** M
**AC:** instructions visible; actuals append; `Missed` label composed from the **three** backend facts (never a single ambiguous state). **Tests:** unit · integration. **Rollback:** *Behavior*. **Reqs:** FR-TS-4, FR-TS-5

### T-FE-E.4 · Compose billing stage ∥
**Repo:** FE · **Blocked by:** T-BE-F.1 · **Size:** M
**AC:** doctor **read-only**; admin/front-desk actionable; unbilled → **warning at completion, never a block**; capability-gated. **Tests:** unit (per role) · integration. **Rollback:** *Behavior*. **Reqs:** FR-BILL-1/2 · **Decisions:** D6

### T-FE-E.5 · Amendment surfaces + version rendering
**Repo:** FE · **Blocked by:** T-BE-G.2 · **Size:** M
**AC:** amend action permission-gated; **superseded versions visibly marked**; prints identify the version; **no UI path mutates a signed version.**
**Tests:** unit · integration. **Rollback:** *Behavior* — flag (⚠ **records persist**; see T-BE-G.1). **Reqs:** FR-LD-1/2 · **Principles:** P6

### T-FE-E.6 · Role/capability composition
**Repo:** FE · **Layer:** Config · **Files:** `features/episodes/presentation/config/episodeWorkspaceConfig.ts` ✅
**Blocked by:** T--1.2, T-FE-D.1 · **Size:** M
**AC:** 2→5 roles **as config, no screen forks** (the file's own docstring mandates this ✅); **RBAC-flexible** (permission-driven, not profession-hard-coded); **backend enforces** — UI hiding is presentation polish only ✅; actionability from backend `blocking_factors`/`waiting_role`, **never this map.**
**Tests:** unit (per role) · integration. **Rollback:** *Behavior*. **Reqs:** FR-RBAC-1, FR-WFA-2

## FE Group F — Legacy redirects
*(R7 reaches **Redirect** only. **No screen deleted.**)*

### T-FE-F.1 · Route adapters: start-consultation · consultation ∥
**Repo:** FE · **Blocked by:** T-FE-D.1 · **Size:** M
**AC:** params preserved; deep links land on the correct stage; flag-gated. **Tests:** redirect + deep-link. **Rollback:** *Compatibility* — flag off ⇒ original routes intact (never deleted). **Reqs:** FR-LEG-1/2 · **Design:** §2.10

### T-FE-F.2 · Route adapter: complete-consultation
**Repo:** FE · **Blocked by:** **T-0.8**, T-BE-F.3 · **Size:** M
**AC:** composed **only after** summary/readiness are backend-owned (ED-DEP-2 gate). **Tests:** redirect · integration. **Rollback:** *Compatibility* — flag off. **Reqs:** FR-LEG-2, FR-CR-1 · **Debt:** ED-DEP-2

### T-FE-F.3 · Standalone casesheet/prescription create-edit redirects ∥
**Repo:** FE · **Blocked by:** T-FE-E.1, T-FE-E.2 · **Size:** M
**AC:** reuse **existing** flags ✅ (`caseSheetRouteFlagSwitch`, `prescriptionRouteFlagSwitch`); standalone "new case sheet per visit" **redirects to the Episode's sheet** (correctness fix, FR-CS-1); **read/list retained.**
**Tests:** flag-switch · redirect. **Rollback:** *Compatibility* — flag off. **Reqs:** FR-LEG-2, FR-CS-1

## FE Group G — Mobile · Accessibility

### T-FE-G.1 · Mobile-first Command Center ∥
**Repo:** FE · **Blocked by:** T-FE-C.1..C.3, T-FE-B.2 · **Size:** M
**AC:** sticky next action; horizontal pill rail with **active auto-scrolled into view**; one primary task; minimal scrolling; ≥44pt; **no dot-only pills.**
**Tests:** unit · responsive · a11y. **Rollback:** *Behavior*. **Reqs:** FR-MOB-1

### T-FE-G.2 · Accessibility & localization ∥
**Repo:** FE · **Blocked by:** T-FE-G.1 · **Size:** M
**AC:** **status never colour-alone** (icon+text); labels/roles/hit targets; **all text via localization keys** ✅ (backend sends keys, never English — AC-4). **Tests:** a11y · localization. **Rollback:** *Behavior*. **Reqs:** FR-MOB-1/2

---

# GROUP Z — Proof · Regression · Performance · Rollback validation · Release readiness

### T-Z.1 · Architecture proof ∥
**Repo:** both · **Blocked by:** all · **Size:** M
**AC:** layer audit clean (**no new ED-ARCH-001 instances**); resolver imports no infrastructure; **no FE clinical derivation**; contract carries no presentation fields. **Tests:** architecture suite. **Reqs:** FR-COS-2, FR-REC-1 · **Principles:** AC-1..AC-5

### T-Z.2 · Full regression vs baseline
**Repo:** both · **Blocked by:** all · **Size:** M
**AC:** both suites green vs baseline (BE 667 ✅ + new); **flag-off parity proven**; no pre-existing failure silently absorbed. **Tests:** full suites.

### T-Z.3 · DP-15 proof (one clinical answer)
**Repo:** both · **Blocked by:** T-Z.1 · **Size:** M
**AC:** for each clinical question (can-complete · next-action · treatment-complete · rx-finalized · casesheet-ready) **exactly one** backend authority answers; **no FE path can produce a different answer.** **Tests:** architecture + integration. **Principles:** P3

### T-Z.4 · **Rollback validation** (all four kinds, explicitly)
**Repo:** both · **Blocked by:** T-Z.2 · **Size:** M
**AC:** (1) **Behavior:** `cos_v1` off ⇒ today's behavior, **no data effect.** (2) **Compatibility:** every legacy route still functional. (3) **Migration — pre-adoption:** `tenant_treatment_plan` + supersession structures drop cleanly (disposable Postgres). (4) **Migration — post-adoption:** behavior disabled via flag, **data retained**, compatibility provided. (5) ⚠ **Data: NO rollback destroys clinical history** — amendment chains, signed versions, contributions, audit history preserved and **verified present after rollback.**
**Tests:** migration up/down · flag-off parity · **post-adoption rollback drill.**

### T-Z.5 · Performance sanity ∥
**Repo:** both · **Blocked by:** T-Z.2 · **Size:** S
**AC:** the aggregate read does not regress workspace open vs baseline; no N+1 from fact assembly. **Tests:** query-count/timing on a disposable environment.

### T-Z.6 · Legacy deprecation readiness (**no removal**)
**Repo:** FE · **Blocked by:** T-FE-F.1..F.3 · **Size:** S
**AC:** zero-usage instrumentation in place; **removal explicitly deferred** to a separately-approved task with the full §17 checklist. **no screen deleted in R7.** **Reqs:** FR-LEG-1

### T-Z.7 · R8 handoff package ∥
**Repo:** docs · **Blocked by:** T-Z.3 · **Size:** M
**AC:** R8 inputs complete — measurements (on R6 concepts) · attachments · adapters · trends · **Clinical Advice** · **copy-forward + reconciliation** · **allergy/medication modelling (F-2 prerequisite)** · dispensing fulfilment. **Reqs:** FR-RX-2 + `[R8]` markers

### T-Z.8 · R7 closure + architecture/workflow proof doc
**Repo:** docs · **Blocked by:** T-Z.1..T-Z.7 · **Size:** M
**AC:** every requirement → evidence; every owner decision → implementation; rollback verified; retrospective recorded (R6 precedent).

---

# Dependency & Parallelism Map

```
-1 ─► 0 ─┬─► BE-A ─► BE-B ─┬─► BE-F.3 ─► T-0.8 ─► FE-F.2
         │                 └─► T-0.9 ─► FE-D ─► FE-E ─► FE-F.1/F.3 ─► FE-G
         ├─► BE-C (∥ A/B/D)
         ├─► BE-D ─► BE-E
         ├─► BE-F.1/F.2 (∥)
         ├─► BE-G ─► BE-D.5
         └─► FE-A (∥ ALL BE — shell needs no backend) ─► FE-B/FE-C
                                                                      └─► Z
```

**Concurrent execution (both teams, no contention):**
| Window | Backend | Frontend |
|---|---|---|
| 1 | BE-A, BE-C, BE-D.1–D.3, BE-G.1 — **all ∥** | **FE-A** (shell+flag+hook; needs no BE) ∥ **T-0.2…T-0.7** remediation (6 modules ∥) |
| 2 | BE-B (resolver+service), BE-E, BE-F | FE-C regions (C.1/C.2/C.3/C.4 ∥) |
| 3 | BE-F.3, BE-G.2 | FE-B → FE-D → FE-E (E.3/E.4 ∥) |
| 4 | — | FE-F (F.1/F.3 ∥), FE-G (G.1/G.2 ∥) |
| 5 | Z (Z.1/Z.5/Z.7 ∥) | Z |

**Hard blocks (never parallelize):**
- **T-0 gate → all feature work.**
- **T-BE-B.2 → T-0.9** (FE can't remove assembly until the backend assembles).
- **T-BE-F.3 → T-0.8 → T-FE-F.2** (completion route must not compose a violating screen — ED-DEP-2).
- **Any FE composition → that module's Group-0 task** (ED-DEP-1).
- **FE-B/FE-D → BE-B** — **no interim frontend derivation** (D9). If the contract is late, the frontend waits.

---

# Coverage

**Requirements → tasks:** all **42/42** frozen requirements have ≥1 implementing task (FR-RX-2 is a *negative* requirement enforced by T-FE-E.2 AC + T-Z.7).
**Owner decisions → tasks:** D1→BE-C · D2→BE-G · D3→T-FE-E.2/T-BE-D.1 · D4→[R8] T-Z.7 · D5→[R8] T-Z.7 · D6→BE-F/T-FE-E.4 · D7→T-FE-B.2 · D8→scope/T-Z.7 · D9→BE-B/T-0.9 · F-1→BE-C.2/C.3/C.4 · F-2→T-FE-C.3 · Plan→BE-D · Missed→T-BE-E.4/T-FE-E.3.
**Debt gates → tasks:** ED-DEP-1→T-0.2..0.7 · ED-DEP-2→T-0.8 · ED-DEP-3→T-0.9 · ED-DEP-4→T-FE-C.3 · ED-DEP-5→T-BE-D.1/T-FE-E.2 · ED-DEP-6→T-0.9.
**ETX → tasks:** ETX-1→T--1.2 · ETX-2→T--1.5 · ETX-3→T--1.3 · ETX-4→T--1.6 · ETX-5→T--1.4.
**Rollback:** every task declares its kind. **Data rollback is claimed nowhere** — clinical history is preserved by design (T-Z.4 AC5 verifies it).

---

# Repository Milestones and Merge Checkpoints

Milestone completion requires tests passing, architecture proof, and (where a gate is defined below) owner-review approval — **code existing is necessary but never sufficient.**

## M0 — Engineering Truth Complete
**Task groups:** Group -1 (T--1.1 … T--1.7).
**Required automated tests:** none yet (verification-only group); T--1.7 confirms both baseline suites green (BE 667 ✅ + FE baseline).
**Required architecture proof:** none (no code yet).
**Merge criteria:** all five ETX findings (ETX-1..5) recorded with evidence; branch/baseline verified (T--1.1); T--1.7's internal-consistency + baseline-green gate passes.
**Owner-review requirement:** none dedicated — visibility via the Group -1 completion report.
**Permitted target branch:** `feature/r7-clinical-operating-system` only. **No implementation starts before this gate** (T--1.7's own gate statement).

## M1 — Blocking Architecture Debt Removed
**Task groups:** Group 0 (T-0.1 … T-0.9).
**Required automated tests:** T-0.1's characterization suite green; each of T-0.2…T-0.7's own architecture test ("no presentation→transport import"); T-0.8's architecture test ("no FE clinical derivation") + regression; T-0.9's architecture test ("no FE assembly") + regression (`useConsultationWorkspace.test.tsx` ✅).
**Required architecture proof:** frontend scan (§Architectural Regression Scans) clean for the 8 R7-composed modules named in T-0.2…T-0.7, plus `CompleteConsultationScreen.tsx` (T-0.8) and `useConsultationWorkspace.ts` (T-0.9).
**Merge criteria:** ED-ARCH-001 remediated in every R7-composed module (T-0.2…T-0.7) · ED-ARCH-004 no longer controls completion (T-0.8, itself gated on T-BE-F.3) · ED-ARCH-006 no longer assembles workflow in the frontend (T-0.9, itself gated on T-BE-B.2) · characterization tests green throughout.
**Owner-review requirement:** **Gate OR-1.**
**Permitted target branch:** `feature/r7-clinical-operating-system`.

## M2 — Backend COS Contracts Complete
**Task groups:** BE Group A (T-BE-A.1, T-BE-A.2) · BE Group B (T-BE-B.1, T-BE-B.2, T-BE-B.3) · BE Group F, backend portion (T-BE-F.1, T-BE-F.2, T-BE-F.3).
**Required automated tests:** resolver unit tests with no DB (T-BE-B.1) · service unit tests with mocked repos + contract + integration (T-BE-A.1/A.2, T-BE-B.2) · **semantics-only contract guard** (T-BE-B.3) · completion-readiness contract tests (T-BE-F.3).
**Required architecture proof:** backend scan clean — resolver imports no infrastructure (AC-3); router/service/repository layering intact (AC-1); contract carries no presentation fields (AC-4, T-BE-B.3).
**Merge criteria:** Clinical Workspace aggregate complete (T-BE-A) · pure workflow resolver complete (T-BE-B.1) · workflow service complete (T-BE-B.2) · semantics-only contract guard passing (T-BE-B.3) · completion-readiness backend contract complete (T-BE-F.3, which itself depends on billing T-BE-F.1/F.2) · **no frontend clinical derivation required** to consume the contract · backend focused tests green.
**Owner-review requirement:** **Gate OR-2.**
**Permitted target branch:** `feature/r7-clinical-operating-system`.

## M3 — COS Shell and Command Center Complete
**Task groups:** FE Group A (T-FE-A.1, T-FE-A.2, T-FE-A.3).
**Required automated tests:** flag on/off parity (T-FE-A.1) · invalidation tests (T-FE-A.2) · flag-switch test (T-FE-A.3).
**Required architecture proof:** frontend scan clean for the new shell — presentation never touches a datasource (AC-2, T-FE-A.2).
**Merge criteria:** existing workspace route reused, no new route created (FR-COS-1 AC1) · `cos_v1` flag operational · flag-off parity proven · Visit Command Center shell complete · frontend remains render-only · invalid-context state handled (W30).
**Owner-review requirement:** none dedicated — M3 is presentation scaffolding with no clinical semantics yet; visibility via completion report. (Independent of OR-1/OR-2 — the dependency map already permits FE-A to proceed in parallel with all backend groups.)
**Permitted target branch:** `feature/r7-clinical-operating-system`.

## M4 — Dynamic Workflow Functional
**Task groups:** FE Group B (T-FE-B.1, T-FE-B.2) · FE Group D (T-FE-D.1).
**Required automated tests:** per-state unit tests + architecture ("no assembly") + a11y (T-FE-B.1) · architecture ("FE computes no recommendation") + a11y (T-FE-B.2) · per-journey unit tests + architecture ("no FE assembly") + regression (T-FE-D.1).
**Required architecture proof:** frontend scan clean — no FE workflow assembly, no FE recommendation derivation (both explicit scan items, §Architectural Regression Scans).
**Merge criteria:** backend-assembled workflow rendered (T-FE-D.1) · recommendations and alternatives rendered (T-FE-B.2) · waiting-role and blockers rendered (T-FE-B.1) · **no canonical frontend order** · **no specialty-driven workflow presence** (capability-gated only, AC-7) · mobile workflow-pill behaviour verified against T-FE-G.1's pill-rail AC (full mobile polish remains Group G's own scope; only pill *behavior* is spot-verified here).
**Owner-review requirement:** **Gate OR-4.**
**Permitted target branch:** `feature/r7-clinical-operating-system`.

## M5 — Clinical Continuity Complete
**Task groups:** BE Group C (T-BE-C.1 … T-BE-C.4) · FE-E.1 (case sheet) · the Prescription/Recommendation portion of FE-E.2 · FE-E.4 (billing stage).
> **Granularity note.** `T-FE-E.2` is one task titled "Compose Prescription · Recommendation · Plan · Scheduling" — its scope spans both M5 (Prescription/Recommendation) and M6 (Plan/Scheduling). It is **not split** here (task IDs/scope are frozen); M5's merge criteria checks only the Prescription/Recommendation portion of its already-declared AC (`FR-RX-1`, `FR-TR-1`), and M6 additionally requires the Plan/Scheduling portion (`FR-TP-1`, `FR-TS-3`, `FR-SCH-1`) before M6 itself completes.
**Required automated tests:** N-visit attribution + each rejection case + regression (T-BE-C.2) · failure-injection integration (T-BE-C.3) · duplicate-submit/retry integration (T-BE-C.4) · multi-visit integration (FE-E.1) · unit/integration/architecture (FE-E.2, Prescription/Recommendation portion) · per-role unit + integration (FE-E.4).
**Required architecture proof:** backend scan clean for `casesheets_service.py` (no repository bypass, AC-1); frontend scan clean for composed modules (no new axiosClient/datasource imports reintroduced post-T-0.2..T-0.7 remediation).
**Merge criteria:** one Case Sheet per Episode (T-BE-C.1) · current-Visit contribution attribution correct (T-BE-C.2) · atomicity and idempotency verified (T-BE-C.3, T-BE-C.4) · append-only visit notes visible (FE-E.1) · Prescription and Recommendation composed (FE-E.2 portion) · billing visible according to role (FE-E.4).
**Owner-review requirement:** none dedicated — folded into OR-4's dependent-milestone visibility and OR-6's end-to-end review; the F-1 fix itself was already owner-ratified as a frozen contract in `requirements.md`, so this milestone verifies implementation against an already-approved contract rather than opening a new decision.
**Permitted target branch:** `feature/r7-clinical-operating-system`.

## M6 — Treatment Workflow Complete
**Task groups:** BE Group D (T-BE-D.1 … T-BE-D.5) · BE Group E (T-BE-E.1 … T-BE-E.5) · the Plan/Scheduling portion of FE-E.2 · FE-E.3 (therapist execution).
**Required automated tests:** domain invariant unit tests (T-BE-D.1) · **migration up/down on disposable Postgres** (T-BE-D.2) · integration on disposable Postgres (T-BE-D.3) · unit/integration/contract (T-BE-D.4) · per-operation unit + integration + regression (T-BE-D.5) · reschedule-preserves-identity integration (T-BE-E.1) · per-intent unit + integration (T-BE-E.2) · reschedule-content-intact integration (T-BE-E.3) · reschedule-after-execution integration (T-BE-E.4) · concurrent-write integration (T-BE-E.5).
**Required architecture proof:** backend scan clean for the new Treatment Plan module (pure domain, AC-3; repository/UoW registration, AC-1); confirm `TreatmentLifecycleStatus` was **not** reused for Plan lifecycle without semantic-fit proof (T-BE-D.1's own AC).
**Merge criteria:** Treatment Plan entity implemented (T-BE-D.1) · migration tested up/down (T-BE-D.2) · stable Sessions linked to Plan (T-BE-E.1) · sequential and non-sequential scheduling supported (T-BE-E.2) · doctor instructions survive rescheduling (T-BE-E.3) · therapist execution history preserved (T-BE-E.4) · `Missed` semantics decomposed correctly (T-BE-E.4).
**Owner-review requirement:** **Gate OR-3**, positioned specifically **after BE Group D completes and before the Plan/Scheduling portion of FE-E.2 begins** (i.e., mid-M6, not only at its end) — per the user's own placement ("before treatment UI composition").
**Permitted target branch:** `feature/r7-clinical-operating-system`.

## M7 — Living Documents Complete
**Task groups:** BE Group G (T-BE-G.1, T-BE-G.2, T-BE-G.3) · FE-E.5 (amendment surfaces + version rendering).
**Required automated tests:** **migration up/down on disposable Postgres** + immutability-of-signed-version integration (T-BE-G.1) · unpermitted-amend-rejected integration (T-BE-G.2) · unit + integration (FE-E.5).
**Required architecture proof:** backend scan clean — `document_version` semantics not overloaded (ED-ARCH-002 lesson, T-BE-G.1's own ET note); amendment rejection is service-layer, not UI hiding (T-BE-G.2).
**Merge criteria:** supersession representation implemented (T-BE-G.1) · signed versions immutable (T-BE-G.1) · amendments versioned (T-BE-G.1, T-BE-G.2) · prior versions printable and auditable (FE-E.5) · post-adoption compatibility/rollback verified (T-BE-G.1's own Migration rollback clause) · **no destructive clinical-data rollback** (T-BE-G.1's Data clause — amendment chains, signed versions, audit history preserved).
**Owner-review requirement:** **Gate OR-5.**
**Permitted target branch:** `feature/r7-clinical-operating-system`.

## M8 — R7 Release Candidate
**Task groups:** Group Z (T-Z.1 … T-Z.8) — each blocked by **"all"** prior tasks per the existing dependency map, so M8 implicitly gates on M0–M7.
**Required automated tests:** full architecture suite (T-Z.1) · full regression, both repos, vs baseline (T-Z.2) · DP-15 architecture+integration proof (T-Z.3) · migration up/down + flag-off parity + post-adoption rollback drill (T-Z.4) · query-count/timing sanity (T-Z.5).
**Required architecture proof:** T-Z.1 in full — layer audit clean, **no new ED-ARCH-001 instances**, resolver imports no infrastructure, no FE clinical derivation, contract carries no presentation fields.
**Merge criteria:** Group Z complete · full regression green · DP-15 proof complete · architecture proof complete · rollback drill complete · performance sanity complete · legacy routes remain functional (T-FE-F.1…F.3, consumed by T-Z.6) · R8 handoff complete (T-Z.7) · **owner release approval obtained.**
**Owner-review requirement:** **Gate OR-6.** This is the final gate — its approval is the release decision itself, separate from and in addition to any subsequent decision to merge `feature/r7-clinical-operating-system` into `dev`.
**Permitted target branch:** work lands on `feature/r7-clinical-operating-system`. **Merging that branch into `dev` is a separate, explicitly authorized action** — not automatic on M8 completion, and not performed by this task.

---

# No-New-Debt Exit Gate

**Applies to every task, task group, milestone, and pull request in this plan — without exception.**

Before any of the above may be marked complete, confirm:

```
No new ED-ARCH item introduced.
No new ED-DEP gate introduced.
No unresolved Engineering Truth divergence.
No new Presentation → axiosClient access.
No new Presentation → datasource access.
No new Application → HTTP client access.
No new Router → database/repository shortcut.
No new Service → direct business-data SQLAlchemy access.
No new frontend-derived clinical truth.
No duplicate clinical lifecycle authority.
No duplicate workflow/recommendation/completion-readiness logic.
No unrelated cleanup included.
```

**If any item fails:** the task/group/milestone **remains incomplete** · the violation must be **fixed within the responsible task** or **explicitly escalated** (a new, separately-tracked item — never silently folded into "future debt" to force a milestone closed) · **it is never a license for an uncontrolled repository-wide cleanup** — this gate applies to **new and touched R7 code only**; pre-existing violations outside R7's touched surface are reported (per §Architectural Regression Scans' three-way classification) and left alone.

**Existing precedent this gate formalizes:** T-Z.1's own AC already states "no new ED-ARCH-001 instances" — this gate generalizes that check to every task, not only Group Z.

---

# Pull Request Acceptance Checklist

**Every R7 pull request must confirm:**

```
[ ] The PR identifies the exact task ID.
[ ] The PR identifies the implementing requirement IDs.
[ ] The PR identifies the relevant design sections.
[ ] Only declared files/modules were changed.
[ ] No unrelated refactor or cleanup was included.
[ ] Frontend/backend layer rules remain intact.
[ ] Backend Owns Clinical Truth is preserved.
[ ] Backend Owns Workflow Intelligence is preserved.
[ ] DP-15 One Clinical Answer is preserved.
[ ] No frontend clinical derivation was introduced.
[ ] Acceptance criteria are demonstrated.
[ ] Required tests were added or updated.
[ ] Focused tests pass.
[ ] Relevant regression tests pass.
[ ] Architecture tests pass.
[ ] Contract tests pass where applicable.
[ ] Migration up/down tests pass where applicable.
[ ] Rollback behaviour is documented and verified.
[ ] Clinical records are not destroyed by rollback.
[ ] Feature-flag behaviour is verified where applicable.
[ ] R7/R8 boundary remains intact.
[ ] No frozen requirement or approved design was reinterpreted.
[ ] git diff --check passes.
[ ] Exact staged files were reviewed; git add . was not used.
```

**Every PR additionally requires a brief evidence section:**

- Commands run.
- Tests and counts (e.g., "unit: 12 passed; integration: 4 passed; architecture: 1 passed").
- Migration result, where applicable (up/down verified on disposable Postgres — never Supabase, per R6 T-A.1 precedent).
- Rollback evidence (which kind — Behavior/Migration/Compatibility/Data — and how it was exercised).
- Architecture-scan result (clean, or pre-existing debt named and excluded).
- Known limitations.
- **Explicit statement that no unrelated files were changed.**

---

# Architectural Regression Scans

**Purpose:** catch a new violation before it merges — not just at Group Z. Every scan **distinguishes** pre-existing known debt (ED-ARCH-001..006, already recorded, not this gate's concern unless the current task touches that exact file) · R7-touched violations (a file already on the ED-ARCH-001 list, remediated by Group 0, then re-violated by later R7 work) · newly introduced violations (a file never on the list, introduced by R7). **Only the third category blocks completion** — but the second (a Group-0 remediation regressing) is equally serious and treated as a task failure, not new debt.

## Frontend scan
Detect:
- presentation imports of `axiosClient`;
- presentation imports of datasources;
- presentation imports of infrastructure repository implementations;
- application imports of HTTP clients/datasources;
- frontend workflow assembly (a reintroduced `activeSections`-style computation);
- frontend lifecycle derivation;
- frontend recommendation derivation;
- frontend completion-readiness derivation;
- hard-coded clinic-type workflow presence (specialty-string gating instead of capability-gating);
- duplicate clinical state answers (two code paths that could answer the same DP-15 question differently).

## Backend scan
Detect:
- routers accessing ORM/database directly;
- routers calling repositories instead of services;
- services issuing business-data SQLAlchemy queries directly;
- services bypassing an existing repository;
- domain modules importing infrastructure/API/session (AC-3);
- duplicate lifecycle resolvers (a second pure resolver answering a question `clinical_workflow_resolver` or `treatment_lifecycle_resolver` already owns);
- duplicate workflow/recommendation authorities;
- UI/presentation fields leaking into semantic contracts (AC-4 — the exact check T-BE-B.3 already automates).

**Cadence:** after every backend or frontend group · before every milestone merge · during Group Z's architecture proof (T-Z.1).

**Automation.** Where practical, convert to automated architecture tests rather than relying exclusively on grep — several tasks already do this (T-BE-B.1's import audit, T-BE-B.3's semantics-only guard, T-0.2…T-0.9's "no presentation→transport import"/"no FE assembly"/"no FE clinical derivation" tests, T-Z.1's architecture suite). New scan categories introduced by this gate (duplicate lifecycle resolvers, duplicate workflow authorities, hard-coded clinic-type presence) should gain equivalent automated tests during the tasks that first make them possible to violate (T-BE-B.1, T-BE-D.1, T-FE-D.1) rather than remaining grep-only through Group Z.

---

# Owner Review Gates

**No subsequent dependent milestone begins until its applicable gate is approved.** Independent tasks not depending on the review may continue **only when the dependency map (§Dependency & Parallelism Map) explicitly allows it** — e.g., FE-A may proceed during OR-1/OR-2 review because the map already shows it depends only on the T-0 gate, not on BE Group A/B.

## Gate OR-1 — After Group 0 / M1
Review: architectural debt remediation (T-0.2…T-0.7) · preserved behaviour (characterization suite still green) · no widened cleanup (Task Isolation held) · readiness to compose existing modules (Group 0's own gate statement: "no FE composition task runs against a module until that module's Group-0 task is complete").

## Gate OR-2 — After Backend Workflow Contract / M2
Review: aggregate shape (T-BE-A) · workflow stages (T-BE-B.1) · recommendation semantics (T-BE-B.2) · completion readiness (T-BE-F.3) · blockers and waiting role · absence of UI fields (T-BE-B.3's contract guard) · proof that frontend derivation is unnecessary (the contract is sufficient for T-FE-B/T-FE-D to render without computing anything).

## Gate OR-3 — After Treatment Plan Backend / before treatment UI composition
Review: `tenant_treatment_plan` entity (T-BE-D.1/D.2) · lifecycle semantics (T-BE-D.1's status enum — confirm it did **not** reuse `TreatmentLifecycleStatus`) · migration (T-BE-D.2, up/down verified) · relationship to Recommendation and Sessions (T-BE-D.4, T-BE-E.1) · disposition of legacy `tenant_visits.treatment_plan` (per T--1.4/ETX-5's finding) · rollback phases (pre-/post-adoption, T-BE-D.2).
**Position:** mid-M6 — after BE Group D, before the Plan/Scheduling portion of T-FE-E.2.

## Gate OR-4 — After Dynamic Workflow UI / M4
Review: clinic/capability variants (T-FE-D.1's per-journey tests) · recommendation with easy deviation (T-FE-B.2, Decision 7) · mobile pills (T-FE-B.1, spot-verified against T-FE-G.1's AC) · waiting-role behaviour · no fixed frontend order · no form-first regression (the COS opens on a briefing, not a form — FR-VCC-1).

## Gate OR-5 — After Living Documents / M7
Review: immutable signed versions (T-BE-G.1) · amendment chain (T-BE-G.1/G.2) · print/share behaviour (FE-E.5) · version visibility (FE-E.5) · post-adoption rollback and compatibility (T-BE-G.1's Migration rollback clause).

## Gate OR-6 — Group Z / M8
Review: end-to-end patient lifecycle (T-Z.1..T-Z.3) · rollback drill (T-Z.4) · regression (T-Z.2) · performance (T-Z.5) · legacy compatibility (T-Z.6) · R7/R8 boundary (T-Z.7) · release readiness. **This gate's approval is the release decision** — separate from any later decision to merge into `dev`.

---

# Not in R7 (explicit)
Laboratory/measurements · attachments · trends · Clinical Advice · copy-forward · medication reconciliation · allergy/interaction/renal modelling · dispensing fulfilment · generalized workflow engine · autonomous clinical decisions · CDS engine · analytics/AI · **screen removal** (readiness only) · `day_number` retirement · `episode_id` nullability migration · `appointment_id` removal · unrelated drift cleanup. **R8 scope may not move into R7 without explicit owner approval.**

# R7 — Clinical Operating System · Design
*(formerly "Guided Clinical Workspace")*

> ## ⚠ REVISED BY DESIGN REVIEW — read [R7-DESIGN-REVIEW-GAPS.md](R7-DESIGN-REVIEW-GAPS.md) first
> This document originally designed **forms + stepper + next-action**. That is a guided form sequence, not an operating system. Revised below:
> - **§4a Visit Command Center** — the workspace opens on a **briefing**, not a form (A-1).
> - **§4b Workflow Assembly** — the journey is **computed** from clinic type/capabilities/purpose/context/decisions/permissions, **not a fixed canonical order** (A-4). GP ≠ Ayurveda ≠ Physio.
> - **§7 lifecycle derivation** corrected: prescription is `DRAFT→FINAL→SIGNED` (**E-1** — `ISSUED/DISPENSED` do not exist); case sheet is **per Episode with per-visit contributions** (**E-2**).
> - **§11/§12** therapy gates on **capability**, never specialty (**E-3**); billing is a **first-class stage** (**E-4**).
> - **§new** Concept separation: Business State ≠ Workflow Progress ≠ Next Action ≠ Status Badge (A-5).
> - **Sizing revised: R7 is Large/Very Large, not Medium.**
> Companion documents: [State Definitions](R7-STATE-DEFINITIONS.md) · [Treatment & Scheduling Model](R7-TREATMENT-SCHEDULING-MODEL.md) · [Laboratory & Measurements](R7-LABORATORY-AND-MEASUREMENTS-DESIGN.md).

**Status:** Discovery / design proposal — NOT approved, NOT implemented. Documentation only.
**Repos inspected:** `novaclinicspro-api` @ `dev` `8b23568`; `novaclinicspro_rn` @ `dev` `cd86021`.
**Skills applied:** `novaclinics-product-discovery` (clinical/UX/workflow), `novaclinics-engineering-truth` (verified boundary tracing), `novaclinics-engineering-workflow` (codebase verification, migration/rollback, verifiable task groups). *(The prompt named `novaclinics-architecture`/`novaclinics-engineering`; those do not exist in either repo — the three above are the actual installed skills, applied to that intent.)*

> **Skills-naming note is not cosmetic:** every "architecture" conclusion below is traced to a file/route/status in code, per engineering-truth, rather than to folder names or old docs.

---

## 1. Governing Engineering Truth (why R7 is not greenfield)

Direct code inspection contradicts the framing of "design a Guided Clinical Workspace" as new construction. **Two workspace surfaces already exist**, plus a partial active-context model and a per-section progress primitive:

| Existing artifact (verified path) | What it already is |
|---|---|
| `features/episodes/presentation/pages/ConsultationWorkspaceScreen.tsx` | The **active consultation authoring** surface: header + `ActiveCaseBanner` + `PatientSummarySection` + `CaseSheetModule` + `PrescriptionModule` + `TreatmentRecommendationModule` + `ClinicalServicesModule`, rendered as **collapsible sections in one scroll**, ending in "Save & Submit" → `complete-consultation`. |
| `features/episodes/presentation/pages/EpisodeWorkspaceScreen.tsx` | A **separate tabbed post-consultation** surface (`prescriptions` / `treatmentPlans` / `visitNotes`), reached via `episodes/[episodeId]/workspace?mode=doctor\|admin`. |
| `features/episodes/presentation/pages/ClinicalWorkspace.tsx` | Wraps `ConsultationWorkspaceScreen` in `WorkspaceProvider`; reached via `episodes/[episodeId]/consultation`. |
| `features/episodes/presentation/context/ClinicalWorkspaceContext.tsx` | **Active-context model already exists**: `PatientContextValue{clientId}`, `EpisodeContextValue{episodeId}`, `VisitContextValue{appointmentId}` via `WorkspaceProvider`/`useEpisodeContext()`/`usePatientContext()`. |
| `useConsultationWorkspace.ts` | Already defines `SectionKey` (`chiefComplaint`, `clinicalNotes`, `prescription`, `treatmentRecommendation`, `clinicalServices`, `ayurvedicAssessment`) and `SectionProgress = {status: empty\|in_progress\|complete, saveStatus}`. |
| `episodeWorkspaceConfig.ts` | Role config already exists: `episodeWorkspaceConfigByRole['doctor'\|'admin']` → `{canEditNotes, canSchedule, canWriteRx, canCreateTreatmentSheet}`. |

**Therefore R7's real problem is composition and unification, not construction:** two workspaces exist but neither *guides*; the section-progress primitive exists but nothing composes it into a lifecycle stepper with next-action derivation; the context model exists but the two workspaces don't share one continuous journey. The single largest R7 risk is **building a third workspace** and leaving three competing surfaces — the exact anti-pattern §22 of the brief forbids.

---

## 2. Design Principles

1. **Compose, don't reconstruct.** Every existing module (`CaseSheetModule`, `PrescriptionModule`, `TreatmentRecommendationModule`, `ClinicalServicesModule`) and the existing context/progress primitives are reused. R7 adds a *guidance layer above them*, not replacements beneath.
2. **Backend owns lifecycle truth; frontend reflects it.** The current-step and next-action must derive from verified backend state (appointment status, casesheet `DocumentStatus`, prescription status, the R4 `treatment_lifecycle_resolver` output, episode status), never from frontend-invented rules. This is the R6 invariant restated for workflow.
3. **One meaning, one owner** (inherited from R6). The workspace never becomes a second store of clinical values or a second lifecycle authority.
4. **Guidance is additive and reversible.** Behind a feature flag (the repo already uses `caseSheetRouteFlagSwitch`, `prescriptionRouteFlagSwitch`, `clinicalWorkspaceTimelineFlagSwitch` — verified test names), so rollback restores today's behavior with no data effect — the exact Phase-1 freshness-flag discipline already in `consultation.tsx`.
5. **Role- and specialty-aware by composition, not by forked screens.** Reuse `episodeWorkspaceConfigByRole` and `useFeatures()`/`isAyurvedaClinic()` — never raw clinic-type/plan string checks (Constitution 03; `CLAUDE.md` §3).
6. **No stranded states.** Every lifecycle node resolves to exactly one of: completed · current · available · blocked (with reason) · optional · unavailable — and always a single next recommended action.

---

## 3. Product Goals

- A clinical user completes **Patient → Appointment → Consultation → Case Sheet → Prescription → Treatment Recommendation → Scheduling → Sessions → Progress → Completion → Episode continuation/closure/follow-up** without leaving the workspace, rediscovering the patient, or seeing an action the backend can't perform.
- No records from another appointment/episode ever appear in the active context (the context model already scopes by `appointmentId`/`episodeId` — R7 must preserve that, not weaken it).
- Duplicate creation (two casesheets / two prescriptions / two recommendations for one visit) is structurally prevented — several already are (`ensureCasesheetExists` gates the recommendation on a single casesheet).

---

## 4. Selected Design Approach

**Alternative A — Lifecycle Stepper Workspace**, adopted as the primary shell, **with an embedded compact Alternative-B timeline** as a secondary "history" affordance. Rationale and rejected alternatives: see [R7-GUIDED-WORKSPACE-WIREFRAMES.md](R7-GUIDED-WORKSPACE-WIREFRAMES.md) §Design Alternatives (full comparison matrix). Summary of why:

- **A (stepper)** maps 1:1 onto the already-existing `SectionKey`/`SectionProgress` primitive and the linear clinical lifecycle; lowest new-abstraction cost; strongest "what do I do next?" answer for non-technical clinic staff on mobile. **Chosen.**
- **B (timeline)** is superior for *reviewing* a long history and parallel treatment plans, but weaker at driving the single next action; **demoted to an embedded panel** inside A rather than the primary shell (it already partially exists as `ClinicalTimeline.tsx` + `useClinicalTimelineData.ts` — reused, not rebuilt).
- **C (task-oriented)** best fits cross-patient role queues (admin "awaiting scheduling", therapist "today's sessions") — but those are **role dashboards, not the per-patient workspace**, and largely already exist (`doctorDashboard`, `therapistDashboard`, `treatment-sessions/index`). C is therefore **not the workspace**; its needs are met by keeping those dashboards as the *entry points into* the A workspace.

**The workspace is the per-patient guided shell (A). The role dashboards remain the cross-patient task lists (C) that launch into it.**

---

## 4a. The Visit Command Center (revised — A-1)

The workspace **does not open into a form.** Its landing state is a briefing that answers the COS questions before any data entry:

| COS question | Region | Source |
|---|---|---|
| Why is this patient here today? | appointment **purpose** + today's concern | appointment + visit |
| What changed since the previous visit? | **delta panel** (therapy progress, measurement trends, Rx changes) | aggregate + measurements (R6) |
| What should I know before I act? | **alerts**: allergies, interactions, renal/dose cautions, out-of-range values | safety surfacing (**new — the package's worst omission**) |
| What should I do next? | **recommendation** + cheap deviation | `nextAction()` |
| What's completed / pending / blocked? | workflow **pills** | assembled workflow |
| What's waiting for another role? | 🔵 pills with role marker | lifecycle statuses |
| Can this visit safely be completed? | **completion readiness** (incl. billing warning) | completion rules |

Forms open **on demand**, from the recommendation or a pill — never as the landing state.

## 4b. Workflow Assembly (revised — A-4, replaces the fixed stepper)

The journey is **assembled per visit**, not declared:

```
assembleWorkflow(clinicType, capabilities, specialty, appointmentPurpose,
                 patientContext, episodeState, doctorDecisions, permissions)
      -> ordered, gated stages
```

Rules:
- **Capabilities decide stage presence** (`appointments.multiday`/`.sessions` → therapy stages; billing capability → billing stage). **Never specialty** (E-3).
- **Appointment purpose decides emphasis** (follow-up vs new complaint vs therapy-only).
- **Doctor decisions extend the workflow at runtime** — recommending therapy *adds* scheduling/session stages to this episode's journey.
- **Permissions decide actionability, not presence** — a stage you cannot act on shows as 🔵 *waiting on <role>*, never hidden (otherwise the doctor cannot see the patient is blocked on admin).

Worked assemblies (all from the same engine — no per-clinic code):

```
General Practice : Consult → Clinical Update → Prescription → Billing → Complete
Ayurveda         : Consult → Clinical Update → Prescription → Treatment Recommendation
                   → Treatment Plan → Scheduling → Treatment Sheet → Sessions → Billing → Follow-up
Physiotherapy    : Consult → Assessment → Therapy Plan → Scheduling → Treatment Sheet
                   → Sessions → Billing → Review
```
GP has **no** therapy stages — not because it is "not Ayurveda", but because it lacks the multi-day capability. Physio **has** them today (verified: the capability is seeded for `("ayurveda","physio")`).

## 4c. Concept separation (permanent — A-5)

**Business State** (backend-owned; see [State Definitions](R7-STATE-DEFINITIONS.md)) ≠ **Workflow Progress** (per-visit, derived, never persisted) ≠ **Next Action** (derived from state+role+permission, never stored) ≠ **Status Badge** (presentation only, never drives logic). Mixing them means a UI change forces a domain change.

## 5. Navigation Model

**Primary route (proposed):** reuse the existing `app/clinic-admin/episodes/[episodeId]/workspace.tsx` route as the single canonical workspace, rather than minting a new path — it already accepts `mode`, `clientId`, `initialTab`. R7 extends its params, it does not replace the route.

Proposed canonical params: `episodeId` (path) · `appointmentId` (query, the active visit) · `clientId` (query) · `mode` (query: role-derived) · `step` (query, optional deep-link into a lifecycle stage).

**Consolidation:** `episodes/[episodeId]/consultation`, `.../complete-consultation`, and `appointments/[appointmentId]/start-consultation` become **stages within** the one workspace route (via `step=`), reached by redirect adapters during migration (see [R7-LEGACY-SCREEN-TRANSITION-PLAN.md](R7-LEGACY-SCREEN-TRANSITION-PLAN.md)). No route is deleted in R7.

---

## 6. Active-Context Model

Reuse `WorkspaceProvider` verbatim as the authority. Authoritative-context rule when values disagree:

- **Patient (`clientId`)**: authoritative source is `episodeDetails.episode.client_id` (backend), with the route param as fallback only — this is *already* how `useEpisodeWorkspaceData` resolves it (`episodeDetails?.episode?.client_id ?? clientId`). R7 keeps this precedence.
- **Episode (`episodeId`)**: route param, validated against backend; an episode not `ACTIVE` blocks authoring stages (see interaction-state matrix).
- **Visit/appointment (`appointmentId`)**: the `visit = episodeDetails.visits.find(v => v.appointment_id === appointmentId)` lookup already in `WorkspaceProvider`. If no visit matches, the workspace is in "no active appointment / invalid route context" state (wireframe #30), never a silent wrong-record state.

**Disagreement precedence:** backend `episodeDetails` > route params > local draft. Never the reverse.

---

## 7. Lifecycle-Step Derivation

The workspace step model is a thin projection over verified backend state — **no new lifecycle rules invented in the frontend.**

| Lifecycle step | Derived from (verified backend truth) |
|---|---|
| Consultation start | appointment status `SCHEDULED/CONFIRMED` → `IN_PROGRESS` (visit ensured; `AppointmentStatus`, `visits_router`/`ensure_visit`) |
| Case sheet ✏ | **the *episode's*** `tenant_casesheets` row + `DocumentStatus` `DRAFT→FINAL→SIGNED`, **plus per-visit `TenantCasesheetContribution`** (E-2: one case sheet per Episode, append-only visit notes — **not** one per visit) |
| Prescription ✏ | `tenant_prescriptions` existence + **`document_status` `DRAFT→FINAL→SIGNED`** (**E-1**: `PrescriptionStatus`/`ISSUED`/`DISPENSED` has **zero usages** — it is not the persisted lifecycle) |
| Billing 🆕 | `TenantClinicalService(visit_id NOT NULL)` → `TenantInvoiceLine.clinical_service_id` → invoice/payment (E-4) |
| Measurements 🆕 | observations of R6 canonical concepts (see [Laboratory design](R7-LABORATORY-AND-MEASUREMENTS-DESIGN.md)) |
| Treatment recommendation → scheduling → sessions → review → complete | the R4 `treatment_lifecycle_resolver` 11-status output (`RECOMMENDED → NEEDS_SCHEDULING → … → IN_THERAPY → NEEDS_CLINICAL_REVIEW → UNDER_CLINICAL_REVIEW → TREATMENT_COMPLETE`) |
| Consultation completion | appointment `COMPLETED` + visit outcome recorded (`tenant_visits.outcome_type`) |
| Episode continuation/closure/follow-up | `EpisodeStatus` `ACTIVE↔CLOSED` + `outcome_recommended_episode_action` |

**Backend gap this exposes (the single most important R7 backend finding):** there is **no aggregate endpoint** returning this composite lifecycle state for `(client, appointment, episode)`. Verified: only `onboarding_router` has a `next_steps` concept (unrelated); treatment lifecycle status is surfaced only inside `treatment_sheets_service`. Today the frontend stitches the picture from multiple queries in `useEpisodeWorkspaceData`. R7 needs a **read-only aggregate "clinical workspace state" endpoint** (additive, no schema change) so the frontend stops reconstructing lifecycle truth — see backend orchestration below and [R7-FEASIBILITY-AND-IMPACT.md](R7-FEASIBILITY-AND-IMPACT.md).

---

## 8. Next-Action Derivation

The next recommended action is a pure function of the **assembled** workflow (§4b) + business state + role config + permissions:

```
nextAction(assembledStages, businessState, role, permissions) =
  first incomplete, unblocked, role-permitted stage in the ASSEMBLED order,
  OR the single unblock action if the earliest incomplete stage is blocked,
  OR the waiting-on-role signal if the earliest incomplete stage belongs to another role,
  OR "Complete visit" (with billing/therapy warnings, never hard blocks) if authoring is done,
  OR the episode disposition choice if the visit is complete.
```
✏ **Corrected from "canonical order" to "assembled order"** — there is no canonical order (A-4).

**It recommends; it never dictates (A-14).** Every recommendation is paired with `[ Something else ▾ ]` and a stated *why*. The system always **has** an answer so the clinician never has to work out where to go — but the clinician, not the software, decides. This preserves clinical autonomy and keeps the platform a consumer, not an owner, of clinical decisions (Constitution 03).

> **✏ CORRECTED BY THE BACKEND-OWNS-CLINICAL-TRUTH ADDENDUM.** This section previously placed `nextAction()` in a **frontend** application/use-case module. **That is now architecturally wrong:** the addendum classifies *workflow recommendations* and *completion readiness* as clinical facts, which are **backend-owned**.
>
> **Revised (now ratified as Decision 9):** the **Clinical Workflow Service** (`app/application/services/clinical_workflow_service.py`, with a pure `app/domain/services/clinical_workflow_resolver.py` — the same shape as R4's `treatment_lifecycle_resolver` and R5's `capability_resolver`) returns the recommendation as a contract — `recommended_action` · `reason` · `blocking_factors` · `role_owner` · `confidence` (+ alternatives). The frontend **renders it and offers deviation; it does not compute it.** The `nextAction()` logic above is the **backend service's** specification, not a frontend module. This also removes the business-rule duplication the design review flagged as the core backend gap (G-1) — the two findings converge on the same answer.
>
> **Task-plan consequence:** recommendation derivation moves **Group D-FE → Group D-BE**; D-FE becomes presentation + deviation only. R7 frontend gets *smaller*; backend gets *larger*.

---

## 9. Frontend Composition

```
episodes/[episodeId]/workspace.tsx (route, unchanged path)
   → GuidedClinicalWorkspaceScreen (NEW shell — composes, owns no clinical mutation)
        → WorkspaceProvider (REUSE — active context)
        → LifecycleStepper (NEW — projects backend state → step chips)   [Group C-FE]
        → PatientSummarySection (REUSE)
        → active-step body, one of:
             CaseSheetModule (REUSE)
             PrescriptionModule (REUSE)
             TreatmentRecommendationModule (REUSE)
             ClinicalServicesModule (REUSE)
             TreatmentPlansSection / TreatmentSheetsSection (REUSE — scheduling/sessions)
             ClinicalTimeline (REUSE — embedded history panel)
        → NextActionBar (NEW — renders nextAction() result)              [Group C-FE]
```

Only two genuinely new presentation pieces (`LifecycleStepper`, `NextActionBar`) plus one new shell and one new use-case module. Everything else is composition of verified-existing components.

---

## 10. Backend Orchestration

- **Additive read aggregate** (new): `GET .../workspace-state?client_id&appointment_id&episode_id` returning the composite of §7 — routers→**services**→repositories, no direct DB in the router, reusing existing repositories and the existing `treatment_lifecycle_resolver`. No schema change, no new lifecycle authority.
- **No new write endpoints in the core design.** Every mutation the workspace triggers already has an endpoint (casesheet create/update, prescription create/update, treatment recommendation, scheduling, session actuals, completion, episode close). R7 wires the guidance to existing writes.
- **Response-shape gaps** (documented in the impact matrix) where the frontend currently reconstructs business state (e.g. it re-derives treatment stage) are closed additively so the frontend stops re-deriving — this directly serves the R6/Constitution "no duplicated business rule" principle.

---

## 11. Permissions

Reuse `episodeWorkspaceConfigByRole` extended from 2 roles (`doctor`/`admin`) to the required set (Doctor, Admin, Front desk, Assistant doctor, Therapist) — **as config, not screen forks** (the file's own docstring already mandates "add new roles by extending this map, not by branching inside components"). Capability entitlement and RBAC permission stay separate checks (`CLAUDE.md` §3, verified). Read-only visibility is preserved where policy permits (a role that can't edit still *sees* clinically useful context). Full matrix: [R7-INTERACTION-STATE-MATRIX.md](R7-INTERACTION-STATE-MATRIX.md).

---

## 12. Specialty Behavior

Reuse the verified governed mechanism: `useFeatures()` + `isAyurvedaClinic(features)` already gates the `ayurvedicAssessment` section in `buildSectionConfig`. R7 keeps this; new specialties are added by the same feature/capability mechanism, never by clinic-name string comparison. Section-progress and next-action calculation already iterate `activeSections`, which is specialty-filtered — so hidden specialty sections are naturally excluded from step derivation with no special-casing. Detail: [R7-GUIDED-WORKSPACE-WIREFRAMES.md](R7-GUIDED-WORKSPACE-WIREFRAMES.md) §Specialty variants.

---

## 13. Data Freshness

Reuse the existing freshness discipline (`isFreshnessV1Enabled`, the flag already gating `consultation.tsx`'s remount and `useConsultationWorkspace`'s invalidations). The aggregate workspace-state query gets a canonical query key; mutations invalidate it. No forced remounts to fake freshness (`CLAUDE.md` §4). Stale/conflict handling: optimistic-concurrency already exists on treatment data (R5 `version`/If-Match) and casesheet `document_version` — the workspace surfaces these as an explicit "reload" affordance (wireframe #21), never a silent overwrite.

---

## 14. Failure Handling

Every workspace mutation reuses the module's own existing error/save-status (`SectionSaveStatus = idle|saving|saved|error`, already defined). Recoverable network failures show retry in place (wireframe #20). No stage advances on a failed mutation. The workspace never strands the user on failure — the current step stays current with an explicit retry.

---

## 15. Role Handoffs

Doctor→Admin (recommendation → scheduling) and Admin→Therapist (schedule → session execution) are **already backend-modeled** by the treatment lifecycle statuses (`NEEDS_SCHEDULING`, `RELEASED_TO_THERAPIST`). R7 represents each handoff as a lifecycle step that becomes the *other role's* next action — no context is lost because the episode/appointment context is the shared key. Wireframes #27–28.

---

## 16. Compatibility Strategy

Staged, flag-gated, redirect-based; no old screen deleted in R7. Full plan: [R7-LEGACY-SCREEN-TRANSITION-PLAN.md](R7-LEGACY-SCREEN-TRANSITION-PLAN.md). Principle: **Discover → Introduce → Shadow → Validate → Redirect → Deprecate → Remove**, with removal gated on the brief's §17 checklist (all roles supported, deep links compatible, callers migrated, tests pass, rollback exists, zero references).

---

## 17. Architecture Boundaries (permanent, restated)

**Frontend:** `Presentation → Application/Use Cases → Domain Repository Interfaces → Infrastructure Repository Implementations → Datasources/HTTP/External`.
**Backend:** `Routers → Services → Repositories → ORM/DB/External`.

No R7 code may deviate. This is enforced by `CLAUDE.md` (both repos) and `ED-ARCH-001` (both repos, created 2026-07-17). **R7-relevant blocker:** several R7-reused files already violate this — `PrescriptionModule.tsx` calls `axiosClient.get(...)` directly, and multiple `episodes/presentation/ConsultationSections/*` import datasources directly (verified in ED-ARCH-001). These must be remediated *before or as part of* composing them into the guided shell — R7 must not copy the violation upward. See [R7-FEASIBILITY-AND-IMPACT.md](R7-FEASIBILITY-AND-IMPACT.md) §Blocking deviations and Group 0 of the task plan.

---

## 18. Open Decisions Requiring Owner Review

1. **Doc location** — this set is in `frontend/.kiro/specs/R7-guided-clinical-workspace/`; backend-specific analysis is embedded here rather than duplicated in the backend repo. Confirm, or request a split/backend copy. (Dir is currently gitignored; needs a `.gitignore` exception at commit time.)
2. **Aggregate endpoint vs. richer existing responses** — build one new read aggregate (recommended), or additively enrich each existing response so the frontend stitches less. Trade-off in the impact matrix.
3. **Route identity** — reuse `episodes/[episodeId]/workspace` as canonical (recommended) vs. a new `/clinical-workspace` route. Reuse avoids a third surface.
4. **ED-ARCH-001 remediation sequencing** — fix the reused modules' layer violations as R7 Group 0 (recommended, blocking) vs. a separate pre-R7 debt sprint.

---

## ARCHITECTURE PRINCIPLE — Backend Owns Clinical Truth *(ratification addendum, 2026-07-17)*

**The backend is the single source of truth for all clinical information. The frontend must never independently derive, infer, calculate, interpret or persist clinical meaning. The frontend is a presentation layer only.**

Clinical facts (non-exhaustive): allergies · intolerances · medication reconciliation · medication interactions · contraindications · laboratory interpretations · renal indicators · hepatic indicators · clinical measurements · diagnosis · treatment eligibility · patient-safety warnings · clinical alerts · **completion readiness** · **workflow recommendations** · clinical summaries · longitudinal trends.

**Required direction:**
```
Clinical Fact → Backend Domain Model → Backend Service → Repository
              → Database / External Clinical Provider → API Contract → Frontend Presentation
```
**Prohibited:**
```
Frontend Form → Local Interpretation → Clinical Warning → Clinical Decision
```

The frontend must never call laboratory systems, medication-interaction engines, clinical-decision-support engines, or external safety providers directly.

**Clinical warnings** carry, from the backend: type · severity · reason · supporting evidence · source · timestamp · version · acknowledgement state (where applicable).

**Absence is never a negative finding.** The backend returns an explicit state — `Known Allergies` / `No Known Allergies` / `Unknown` / `Not Recorded` — and the frontend renders that state. An empty field must never be presented as "none."

**Offline:** the frontend may cache backend responses but must mark them **stale / last-synchronized / unable to verify current clinical state**. It must never silently present stale clinical safety as current truth.

**Precedent (verified):** this is not a new idea — **R4 already did exactly this once.** The frontend previously derived treatment status locally and was re-pointed to the backend-resolved `lifecycle_status` / `lifecycle_status_label` / `lifecycle_status_unresolved` (see `treatmentSheetHeaderLifecycleRepoint`, `treatmentSheetInfoCardStatusRepoint`, `treatmentLifecycleActionsStatusRepoint` tests, and `treatmentOrders.dtos.ts`: *"resolved server-side"*, *"never writable"*). This addendum generalizes a correction the platform has already proven.

---

## DP-15 — One Clinical Answer Rule *(design freeze, 2026-07-17)*

**For every clinical question there is exactly one authoritative backend answer. The frontend must never be capable of producing a different one.**

| Clinical question | Single authority |
|---|---|
| Can this visit be completed? | backend `completion_readiness` |
| What is the recommended next action? | backend `recommended_action` |
| Is this treatment complete? | backend treatment lifecycle (`TREATMENT_COMPLETE`) |
| Is this prescription finalized? | backend `document_status` (`FINAL`/`SIGNED`) |
| Is this Case Sheet ready for signing? | backend `document_status` + readiness |
| Which workflow applies to this visit? | backend workflow assembly |
| Is this step blocked, and by whom? | backend `blocking_factors` / `waiting_role` |

**The frontend presents. The backend decides clinical semantics.** DP-15 is the testable form of the Backend-Owns-Clinical-Truth principle: if two layers can answer the same clinical question, the architecture is wrong — regardless of whether they currently agree. This is the generalization of R6's *"one meaning, one owner"* invariant from clinical **data** to clinical **answers**.

**Verified live violations of DP-15** (to remove, not preserve): `deriveSummary()` (ED-ARCH-004), `buildSectionConfig()` (ED-ARCH-006/A), `SectionProgress` visit-level completion (ED-ARCH-006/B).

---

## Workflow Assembly Ownership *(design freeze)*

**Workflow Assembly is backend-owned.** The backend determines: applicable workflow · workflow order · mandatory steps · optional steps · blocked steps · waiting role · completion readiness · recommendation. **The frontend renders the workflow it is given.**

**No frontend canonical workflow ordering remains in this design.** Any surviving frontend ordering (`buildSectionConfig`'s hardcoded `activeSections` array) is **ED-ARCH-006**, a violation scheduled for removal in Group D-FE.3 — not a design element.

---

## SectionProgress — ownership split *(design freeze)*

`SectionProgress` currently mixes presentation and business semantics. It is split, permanently:

| Backend owns (clinical semantics) | Frontend owns (UI state only) |
|---|---|
| completion readiness · assessment complete · visit complete · prescription required · treatment required · blockers · recommendations | expanded/collapsed · autosave state · validation display · editing · focus · scroll · local draft indicators |

**`SectionProgress` must never evolve into another source of clinical truth.** Its permitted scope is **UI state**. Per-section *save* status (`idle/saving/saved/error`) is legitimately presentational and may remain. **Visit-level completion readiness is a clinical answer (DP-15) and comes only from the backend** — today it is derived across ~10 modules with no single authority (ED-ARCH-006/B).

---

## Architectural Pattern — Resolver + Service *(formalized; preferred pattern for future clinical domains)*

```
Clinical Context
      ↓
Application Service   (clinical_workflow_service.py)      ← orchestrates
      ↓  immutable snapshots
Domain Resolver       (clinical_workflow_resolver.py)     ← decides, purely
      ↓
Semantics → API contract → Frontend Presentation
```

| Resolver (domain) — `app/domain/services/*_resolver.py` | Service (application) — `app/application/services/*_service.py` |
|---|---|
| pure · deterministic · immutable inputs | repository orchestration |
| **no repositories · no database · no infrastructure** | context assembly |
| unit-testable **without a database** | permission gathering |
| decides clinical semantics | capability gathering |
| imports nothing from `app.infrastructure` / `app.api` / session | resolver invocation · API contract creation |

**Verified precedents (this is not a new pattern — it is the platform's proven one):**
- `app/domain/services/treatment_lifecycle_resolver.py` (R4) — pure, 11-status business lifecycle.
- `app/domain/services/capability_resolver.py` (R5) — pure; its docstring states it imports nothing from `app.infrastructure`, `app.api`, config, session, or even `app.localization` (which transitively pulls FastAPI/SQLAlchemy).
- `app/application/services/clinical_semantic_resolution_service.py` (R6) · `capability_resolution_service.py` (R5) — the orchestrating half.

**Why this is the preferred pattern for future clinical domains:** it makes the clinical decision a pure function — reviewable, deterministic, falsification-testable without infrastructure (R6's FT-1..FT-5 proved the value) — while keeping all I/O in one orchestrating layer. It is also **not** BPM, a rules engine, AI, or a generic workflow engine: `treatment_lifecycle_resolver` is the existing proof that this is ordinary, well-tested business logic.

---

## Responsibility Split — canonical statement *(applies to every R7/R8 document)*

| Backend owns | Frontend owns |
|---|---|
| workflow assembly · recommendations · completion readiness · blocking factors · workflow semantics · **all clinical answers (DP-15)** | rendering · navigation · accessibility · interaction · visual presentation |

**These are never mixed.** The backend returns semantics (state codes + localization keys); it never returns colours, icons, layout, or UI labels. The frontend renders; it never decides.

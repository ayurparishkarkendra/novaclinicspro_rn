# R7 — Clinical Operating System · Feasibility & Impact

> ## ⚠ REVISED BY DESIGN REVIEW — sizing changed materially
> The original assessment (**FE Medium / BE Small–Medium**) was **valid only for the form-stepper design it described**. The COS revision ([R7-DESIGN-REVIEW-GAPS.md](R7-DESIGN-REVIEW-GAPS.md)) adds: Visit Command Center + delta/"what changed" computation, workflow assembly engine, patient-safety surfacing, billing stage, corrected case-sheet model, document amendment/supersession, treatment plan/session separation, measurements, attachments.
>
> **Revised sizing: Frontend Large · Backend Medium–Large · Overall R7 = Large / Very Large.**
> **Recommendation: split.** R7 = COS core + model corrections (Command Center, workflow assembly, corrected case sheet/prescription lifecycles, billing visibility, session/schedule separation). **R8** = laboratory/measurements depth, Clinical Advice framework, attachments, copy-forward, trends. Delivering all of it as one R7 contradicts the additive/reversible/one-task-at-a-time discipline that made R4–R6 succeed.

**Status:** Discovery — not approved, not implemented. Documentation only.
**Baselines:** backend `dev` `8b23568`; frontend `dev` `cd86021` (both verified clean vs. the stated baseline; the only working-tree changes are the pre-existing unrelated items named in the brief plus the prior-task `ED-ARCH-001` governance files — none touched here).

## 1. Objective

Deliver a Guided Clinical Workspace enabling clinical roles to complete the full patient lifecycle without workflow gaps, duplicate entry points, stale state, unclear next actions, or cross-appointment/episode record leakage — by **composing and unifying existing surfaces**, not building a new one.

## 2. Current-state summary (verified)

- **Two workspaces already exist** (`ConsultationWorkspaceScreen` for authoring; `EpisodeWorkspaceScreen` for tabbed review) plus `ClinicalWorkspace` wrapper and the `episodes/[episodeId]/workspace` + `.../consultation` + `.../complete-consultation` routes.
- **A 3-part active-context model already exists** (`WorkspaceProvider` → patient/episode/visit).
- **A per-section progress primitive already exists** (`SectionProgress{status,saveStatus}`, `SectionKey` set).
- **A role-config primitive already exists** (`episodeWorkspaceConfigByRole`, doctor/admin).
- **The backend lifecycle state machine is complete and authoritative** (appointment, casesheet `DocumentStatus`, prescription, R4 11-status `treatment_lifecycle_resolver`, episode `ACTIVE/CLOSED`).
- **Duplicate implementations are already known and characterization-locked** (`caseSheetDualImplementation`/`prescriptionDualImplementation` tests; standalone screens coexist with consultation modules).
- **Migration feature-flags already exist** (`caseSheetRouteFlagSwitch`, `prescriptionRouteFlagSwitch`, `clinicalWorkspaceTimelineFlagSwitch`, `isFreshnessV1Enabled`).

**The gap is guidance and unification**, not primitives.

## 3. Frontend feasibility — **Medium**

Reason: the hard parts (context scoping, per-section progress, autosave, role config, specialty gating, freshness/remount discipline) already exist and are tested. R7 adds a guidance layer (stepper + next-action) over them and consolidates two workspaces into one. This is **composition-heavy, invention-light**.

- New surface area: 1 shell (`GuidedClinicalWorkspaceScreen`), 2 components (`LifecycleStepper`, `NextActionBar`), 1 use-case module (next-action derivation), 1 data hook consuming the aggregate endpoint. **Small–Medium.**
- Consolidation of two workspaces + redirect adapters for 3 routes. **Medium** (behavior-preserving, flag-gated).
- **Blocker (raises risk, not size):** several reused modules violate the layer rule (see §8). Remediation is Small–Medium but **must precede** composing them.

## 4. Backend feasibility — **Small–Medium**

Reason: the lifecycle authority is already implemented; R7 needs one **additive read aggregate** endpoint (compose existing repositories + `treatment_lifecycle_resolver`), plus additive response-shape enrichment where the frontend currently re-derives state. **No schema change, no new lifecycle rules, no new write paths in the core design.**

- New aggregate read endpoint (router→service→repos, reusing existing repos): **Small–Medium.**
- Additive response enrichment (attach lifecycle status where consumed): **Small.**
- Migration required: **None** in the core design (read-only aggregation). Any future denormalization is out of R7 scope.

## 5. Modification-size assessment (evidence-based; no calendar estimates)

| Area | Size | Basis |
|---|---|---|
| Frontend workspace shell + stepper + next-action | Medium | new composition over existing primitives; 2 new components, 1 shell, 1 use-case |
| Frontend consolidation of 2 workspaces + 3 route adapters | Medium | behavior-preserving redirects, flag-gated |
| Frontend ED-ARCH-001 remediation of reused modules | Small–Medium | ~bounded set of `episodes/ConsultationSections/*` files (verified list in ED-ARCH-001) |
| Backend aggregate workspace-state endpoint | Small–Medium | one router+service, reuses repos + resolver |
| Backend response enrichment | Small | additive fields |
| Legacy transition (redirects/deprecation, no removal in R7) | Medium | staged, per transition plan |
| Testing (workspace integration, next-action derivation, role/specialty, redirects) | Medium | extends a substantial existing suite |

**Overall R7: Medium** frontend, **Small–Medium** backend — *because most primitives already exist*. The dominant cost is unification discipline and legacy transition, not new capability.

## 6. Affected modules (top-level, verified)

**Frontend:** `features/episodes/*` (workspaces, context, hooks, ConsultationSections), `features/casesheets`, `features/prescriptions`, `features/treatmentSheets`, `features/treatmentSessions`, `features/therapistDashboard`, `features/doctorDashboard`, `features/appointments`, `core/hooks/useFeatures`, `app/clinic-admin/episodes/*`, `app/clinic-admin/appointments/*`.
**Backend:** `episodes_router`+service, `visits_router`+`visits_service`, `casesheets_router`+service, `prescriptions_router`+service, `treatment_sheets_router`/`treatment_orders_router`/`treatment_sessions_router`+`treatment_sheets_service`, `treatment_lifecycle_resolver`, plus a **new** aggregate workspace-state router+service. Repositories reused unchanged.

## 7. Dependencies, risks, constraints

- **Dependency:** the aggregate endpoint (backend Group C-BE) unblocks reliable frontend next-action derivation (Group C-FE). Frontend can proceed against stitched data as an interim, but the endpoint removes the frontend business-rule duplication the Constitution forbids.
- **Risk — third-workspace proliferation:** highest risk; mitigated by reusing the existing `workspace` route and consolidating rather than adding.
- **Risk — stale/cross-context leakage:** mitigated by reusing `WorkspaceProvider`'s existing appointment-scoped visit lookup; R7 must not weaken it.
- **Risk — copying layer violations upward:** mitigated by making ED-ARCH-001 remediation a blocking Group 0 gate.
- **Constraint:** additive/reversible/flag-gated throughout; no schema change; no old-screen deletion in R7; frontend and backend layering terms kept distinct.

## 8. Blocking architectural deviations (must resolve before dependent R7 work)

Recorded in `ED-ARCH-001` (both repos). R7-blocking subset (verified):

- **Presentation → `axiosClient` directly:** `features/episodes/presentation/components/ConsultationSections/PrescriptionModule.tsx` (`axiosClient.get(...)` at ~L110) and others in the ED-ARCH-001 list — these are **reused by the guided shell**, so they block clean composition.
- **Presentation → datasource directly:** the `episodes/presentation/ConsultationSections/*` and `treatmentSheets/presentation/*` set — same reuse-path concern.
- **Backend Application → `AsyncSession` for business CRUD:** `appointments_advanced_service_impl.py`, `demo_service.py` — not directly on the R7 aggregate path, but the new aggregate service must not follow that pattern.

**Blocking rule:** a reused module is remediated to route through its repository/hook before it is composed into the guided workspace. A non-blocking deviation elsewhere is recorded, not fixed opportunistically.

## 9. Non-blocking technical debt (record, don't fix in R7)

- Duplicate casesheet/prescription implementations (module vs standalone screen) — already characterization-locked; R7's transition plan *converges* them but does not delete in R7.
- `useConsultationWorkspace` returns fields duplicating `useEpisodeContext()`/`usePatientContext()` (its own docstring flags this as a future polish) — converge opportunistically only within an already-touched file.
- Backend `AsyncSession`-in-service instances outside the R7 path — tracked in `ED-ARCH-001`, not R7's to fix.

## 10. Recommended implementation strategy

Documentation → owner approval → flag-gated, additive implementation in the task-plan group order (Group 0 remediation gate first), each group independently verifiable, legacy removal deferred to a post-adoption Group I with the full §17 checklist. Rollback = flag off (restores today's two-workspace behavior with no data effect).

## 11. Go / No-Go considerations

- **Go if:** owner accepts "unify existing, add guidance layer" framing and the reuse-of-`workspace`-route decision; accepts one additive backend aggregate; approves ED-ARCH-001 remediation as a blocking gate.
- **No-Go / revisit if:** owner wants a brand-new workspace route/surface (would create a third competing surface — explicitly advised against), or wants legacy screens removed within R7 (violates the staged-retirement safety checklist).
- **Evidence boundary:** the consultation-authoring core, context model, and lifecycle state machine were traced in depth (files read). The treatment-session/therapist downstream and several backend routers were mapped structurally (directory + status + interface level) but not read line-by-line; Group 0 of the task plan includes completing that trace before those groups' implementation.

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

## Sizing revision — Decision 9 (Backend Owns Workflow Intelligence)

Recommendation generation, workflow assembly and completion readiness move **frontend → backend**. Net effect:

| | Before Decision 9 | After Decision 9 | Change |
|---|---|---|---|
| **Frontend** | Large (assembly engine + `nextAction()` + completion derivation + presentation) | **Medium–Large** | **↓** — FE keeps presentation, pills, deviation menu; loses the assembly engine, `nextAction()`, and completion derivation |
| **Backend** | Medium–Large (aggregate + facts) | **Large** | **↑** — gains `clinical_workflow_service` + pure `clinical_workflow_resolver` (assembly, recommendation, blocking factors, waiting role, completion readiness) |
| **R7 overall** | Large | **Large** (unchanged) | work **relocates**, it does not disappear |

**Why this is a net architectural win despite no size reduction:**
- It **removes** the design review's core backend gap (G-1: frontend re-deriving lifecycle) and Decision 9's violation in one move — the two findings had the same answer.
- The pure-resolver split makes recommendation logic **unit-testable without a database** (R4/R5 both prove this shape).
- It **shrinks the riskiest surface**: frontend clinical derivation, where 3 live violations were verified (ED-ARCH-004/006).
- **Frontend blocked work drops:** FE no longer needs the aggregate to derive anything — it renders a contract.

**New backend dependency:** Group D-FE now **hard-depends** on Group D-BE (previously it could proceed on stitched data as an interim). That interim path is **withdrawn** — it would reintroduce the violation.

---

## Design-Freeze sizing correction — R7 now requires an additive migration

**Superseded statement.** Earlier sections state R7's core design needs **"no schema change"**. **That is no longer true**, as a direct consequence of the ratified Treatment Plan decision.

**Verified (this task):** no Treatment Plan entity exists. `*plan*` models are `org_subscription_plan` / `subscription_plan_capability` (billing, unrelated); `app/domain/treatment_plan/` holds only a `SyncResult` dataclass; **"treatment plan" today is a free-text `TEXT` column on `tenant_visits`**. A first-class, persisted, **versioned** Plan therefore requires a **new table + version/supersession representation**.

| | Before freeze | After freeze | Change |
|---|---|---|---|
| Backend | Large | **Large (upper band)** | **↑** — Treatment Plan entity + repository + service + versioning + **additive migration** |
| Frontend | Medium–Large | **Medium–Large** | unchanged (FE renders; never reconstructs the Plan) |
| Migrations | **none** | **≥1 additive** (Treatment Plan + versioning) | **new** |
| R7 overall | Large | **Large** | unchanged band; backend depth increases |

**Still true:** the migration is **additive and reversible** (new table; nothing existing altered) — consistent with the R4–R6 posture. **No** change to `tenant_casesheets.appointment_id`/`episode_id` nullability in R7 (both explicitly deferred behind a data audit). The Case Sheet F-1 fix is **service-layer only, no schema**.

**Consequence for sequencing:** Group E-BE becomes a schema-bearing group and must carry a migration + rollback plan (drop the additive table) in the R4–R6 style.

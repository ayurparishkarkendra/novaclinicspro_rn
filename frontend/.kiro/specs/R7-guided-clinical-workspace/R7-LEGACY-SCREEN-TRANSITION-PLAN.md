# R7 — Legacy-Screen Obsolescence & Transition Plan

> ## ⚠ REVISED BY DESIGN REVIEW — read [R7-DESIGN-REVIEW-GAPS.md](R7-DESIGN-REVIEW-GAPS.md) first
> The staged model (**Discover → Introduce → Shadow → Validate → Redirect → Deprecate → Remove**) and the removal gate **survive the review unchanged** — they remain sound.
> **Additions required by the COS revision:**
> - **Billing screens** (`billing/invoices/*`, `billing/payments/*`) enter the inventory: **Retain** the admin surfaces, **compose** doctor read-only visibility into the workspace (E-4). They are not superseded.
> - **Standalone case-sheet screens** must be re-assessed against the corrected **per-Episode** model (E-2) — a standalone "new case sheet per visit" entry point is not merely duplicate, it is **modelling the wrong thing** and should redirect to the episode's case sheet.
> - Prescription redirects must not offer `Issue`/`Dispense` (E-1 — those states do not exist).
> - **No new competing surface:** the Command Center (W0) lands on the **existing** `episodes/[episodeId]/workspace` route — the review reaffirms this as the single most important anti-proliferation decision.

**Status:** Discovery — not approved, not implemented. **No screen is deleted, redirected, or deprecated by this task.**
Staged model: **Discover → Introduce → Shadow → Validate → Redirect → Deprecate → Remove.** R7 implementation reaches at most **Redirect**; **Remove** is a separate, gated readiness step (Group I) requiring the full §17 checklist.

## Screen inventory & proposed disposition (verified routes)

| Current route / screen | Callers (evidence) | Purpose | Proposed disposition | Superseding wireframe | Compat mechanism | Deprecation criteria | Removal criteria | Rollback |
|---|---|---|---|---|---|---|---|---|
| `episodes/[id]/workspace` (`EpisodeWorkspaceScreen`) | doctor/admin dashboards | tabbed review | **Refactor-and-reuse** → becomes the guided shell host | W1 | flag: guided-workspace-v1 | n/a (evolves) | n/a | flag off → tabbed view |
| `episodes/[id]/consultation` (`ClinicalWorkspace`/`ConsultationWorkspaceScreen`) | start-consultation, dashboards | active authoring | **Reuse-by-composition** as `step=consult…recommend` | W1,W5–11 | route adapter → `workspace?step=` | after workspace validated for all author roles | zero refs + tests green | flag off → consultation route |
| `episodes/[id]/complete-consultation` (`CompleteConsultationScreen`) | Save & Submit | completion+outcome | **Reuse-by-composition** as `step=complete` | W16–17 | route adapter | after disposition step validated | zero refs | flag off |
| `appointments/[id]/start-consultation` | appointment tap | ensure visit + enter | **Wrap-for-compat + Redirect** → `workspace?step=consult` | W25 | redirect adapter | after entry validated | zero refs | remove redirect |
| `appointments/[id]/link-episode`, `.../create-episode` | consultation entry | episode binding | **Reuse-by-composition** (embed selector) or keep standalone | W4 | `EpisodeSelector`/`EpisodeSelectorModal` reuse | after embedded selector validated | zero refs | keep standalone |
| `clients/[id]/casesheets/new`,`/[id]/edit`,`/index`,`/[id]` | client chart | standalone casesheet | **Redirect** create/edit into workspace; **Retain** read/list | W5–7 | flag `caseSheetRouteFlagSwitch` (exists) | after in-workspace casesheet validated | zero create/edit refs | flag off → standalone |
| `clients/[id]/prescriptions/new`,`/edit`,`/index`,`/[id]` | client chart | standalone rx | **Redirect** create/edit into workspace; **Retain** read/list | W8–9 | flag `prescriptionRouteFlagSwitch` (exists) | after in-workspace rx + **module remediation** | zero create/edit refs | flag off |
| `clients/[id]/treatment-sheets/*`, `treatment-sheets/[id]/*`, `treatment-sheets/orders`, `treatment-sheets/[id]/schedule` | admin/doctor | plan/schedule | **Reuse-by-composition** for in-context; **Retain** admin list/orders | W12,W24 | compose sections; keep admin queue | after scheduling-in-workspace validated | n/a (admin queue retained) | flag off |
| `treatment-sessions/index`, `treatment-sessions/[id]` | therapist | session queue/exec | **Retain** queue (role dashboard); **Reuse-by-composition** exec as `step=session` | W13–15 | keep queue; compose exec | after therapist-in-workspace validated | n/a | flag off |
| `app/doctor.tsx`, `app/therapist.tsx` | role landing | dashboards | **Retain** as entry points into workspace | — | none | never (entry points) | never | — |

## Migration order (safest-first)

1. **Group 0 gate** — remediate ED-ARCH-001 in reused modules (esp. `PrescriptionModule` `axiosClient.get`) so composition doesn't inherit violations.
2. **Introduce** the guided shell on the existing `workspace` route behind `guided-workspace-v1`, off by default (Shadow: renders, no legacy redirect yet).
3. **Validate** per role + specialty + deep-link + freshness against the §20 checklist and existing tests (`consultationFlow.integration`, `workspaceProvider`, dual-impl characterizations must stay green).
4. **Redirect** legacy authoring routes into `workspace?step=` via adapters, flag-gated, one route at a time, each with a redirect test.
5. **Deprecate** a route only after its redirect is validated and all in-repo callers are migrated.
6. **Remove** (Group I, separate) only when every §17 removal criterion is met.

## Removal gate (per brief §17 — all must hold before any Remove)

new workflow implemented · all relevant roles supported · deep links compatible · navigation callers migrated · functional workflow tests pass · automated tests pass · rollback exists · no unresolved data-loss risk · no permission regression · no accessibility regression · no remaining code references · product acceptance complete.

## Compatibility-mechanism trade-offs

- **Route adapter / redirect** (chosen for start/consultation/complete): cheapest, preserves deep links, reversible by flag; risk = param-mapping bugs → covered by redirect tests.
- **Feature flag** (chosen; two already exist): clean rollback with no data effect (Phase-1 freshness precedent); risk = flag sprawl → one `guided-workspace-v1` umbrella flag, reuse existing route flags.
- **Shared screen composition** (chosen for modules): maximal reuse, no duplicate logic; risk = inheriting layer violations → gated by Group 0.
- **Compatibility wrapper** (for `start-consultation`): thin, no logic; lowest risk.
- **Route alias**: rejected as primary (hides the migration; redirect is more honest and testable).

**Explicitly rejected:** deleting any screen because a new route exists; keeping old+new indefinitely without a retirement checkpoint (Group I is that checkpoint).

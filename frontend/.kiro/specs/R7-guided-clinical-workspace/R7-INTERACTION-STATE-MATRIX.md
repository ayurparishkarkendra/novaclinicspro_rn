# R7 — Interaction-State Matrix

> ## ⚠ REVISED BY DESIGN REVIEW — read [R7-DESIGN-REVIEW-GAPS.md](R7-DESIGN-REVIEW-GAPS.md) first
> **This document contained a factual error (E-1).** It asserted prescriptions run `DRAFT → ISSUED → DISPENSED` citing `PrescriptionStatus`. **That enum has zero usages in the codebase.** `tenant_prescription.status` is persisted as the `document_status` ENUM: **`DRAFT → FINAL → SIGNED`**. The prescription rows below are corrected accordingly; "Issue"/"Dispense" transitions **do not exist** and must not be built until the owner decides `PrescriptionStatus`'s disposition (see state definitions Q4).
>
> **Other revisions:** actions are now gated on **capability** (not specialty) for therapy (E-3); billing actions added (E-4); amendment actions added pending ratification (A-3); every action pairs a recommendation with a cheap deviation (A-14). See [R7-STATE-DEFINITIONS.md](R7-STATE-DEFINITIONS.md) for the business meaning of every state referenced here.

**Status:** Discovery — not approved, not implemented.
Must agree with [R7-GUIDED-WORKSPACE-WIREFRAMES.md](R7-GUIDED-WORKSPACE-WIREFRAMES.md). Each action: visibility · enablement · role/permission · prerequisite · backend state required · mutation invoked · success → · failure · retry · stale-state · next action · legacy-route impact.

Permission names are illustrative of the existing RBAC model (capability entitlement and RBAC permission are **separate** checks — verified in `CLAUDE.md` §3); exact permission codes to be confirmed against `org_permissions` in Group 0. Roles are RBAC-flexible: any role holding the permission may act, not one hard-coded profession.

**Concept separation (A-5, permanent):** the "Backend state req" column is **Business State** (backend-owned). Enablement is **Next Action** derivation. Nothing here is a Status Badge, and no row may be read as Workflow Progress.

| Action | Visible when | Enabled when | Perm | Prereq | Backend state req | Mutation | Success → | Failure | Retry | Stale-state | Next action | Legacy impact |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **Start Consultation** | appt active, no visit yet | appt `SCHEDULED/CONFIRMED` | `appointment.update` | appointment | appt not terminal | ensure-visit → appt `IN_PROGRESS` | visit created, step=consult | toast+stay | yes | — | Create case sheet | `start-consultation` → workspace `step=consult` |
| **Open/Create Episode Case Sheet** ✏ | step consult | visit exists | `casesheet.write` | visit+episode | episode `ACTIVE` | **find-or-create the *episode's* case sheet** (E-2: **one per Episode**, not per visit) | casesheet `DRAFT` | inline err | yes | — | Add visit note | standalone `casesheets/new` redirect |
| **Add Visit Note (append)** ✏🆕 | case sheet open | visit exists | `casesheet.write` | episode case sheet | `DRAFT`/`FINAL` | **append** contribution (`TenantCasesheetContribution`: casesheet_id+visit_id+staff_id) | note appended; **prior visits' notes never overwritten** | save-status err | auto | version guard | Prescription | E-2 correction |
| **Continue Assessment** | casesheet `DRAFT` | editable | `casesheet.write` | casesheet | `DRAFT` | autosave update | saved | save-status err | auto | version guard (W21) | Complete assessment | — |
| **Complete Assessment** | casesheet `DRAFT`, min fields | required sections complete | `casesheet.write` | casesheet `DRAFT` | `DRAFT` | update → `FINAL` | `FINAL` — *"complete for now"*, **not** permanent lock (A-3) | inline err | yes | version guard | Sign / prescription | new explicit step |
| **Sign Case Sheet** ✏ | `FINAL` | signer attests | `casesheet.sign` | casesheet `FINAL` | `FINAL` | sign → `SIGNED` | `SIGNED` — that **version** immutable forever | inline | yes | — | Prescription | — |
| **Amend Case Sheet** 🆕 | `FINAL`/`SIGNED` | amendment ratified (A-3) | `casesheet.amend` 🆕 | casesheet | `FINAL`/`SIGNED` | new version supersedes; prior retained + renderable | new version `DRAFT` | inline | yes | supersession | Sign amendment | **pending owner ratification** |
| **Create Prescription** | step rx | casesheet exists (per rule) | `prescription.write` | casesheet | — | prescription create (`DRAFT`) | `DRAFT` | inline err | yes | — | Recommend treatment | standalone `prescriptions/new` redirect; **module remediation prereq (ED-ARCH-001)** |
| **Edit Prescription** | prescription exists | `DRAFT` only | `prescription.write` | prescription | `DRAFT` | update (`document_version`↑) | updated | inline | yes | version guard | Sign / recommend | — |
| **Finalise Prescription** ✏ | `DRAFT` complete | required fields present | `prescription.write` | prescription | `DRAFT` | update → `FINAL` | `FINAL` (content frozen) | inline | yes | version guard | Sign prescription | — |
| **Sign Prescription** ✏ | `FINAL` | signer is a prescriber | `prescription.sign` 🆕 | prescription `FINAL` | `FINAL` | sign (`signed_by_staff_id`,`signed_at`) → `SIGNED` | `SIGNED` — **the point it becomes dispensable** | inline | yes | — | Complete consultation | — |
| **Amend Prescription** 🆕 | `FINAL`/`SIGNED` | amendment ratified (A-3) | `prescription.amend` 🆕 | signed/final rx | `FINAL`/`SIGNED` | new version supersedes; prior retained | new `DRAFT` version | inline | yes | supersession | Sign amendment | **pending owner ratification** |
| **Copy Previous Prescription** 🆕 | prior rx exists | capability + `prescription.write` | `prescription.write` | prior rx | any | copy → new `DRAFT` (`repeated_from_prescription_id`) | new `DRAFT` | inline | yes | — | **Reconcile (mandatory)** | never auto-signs (A-8) |
| **Reconcile Copied Rx** 🆕 | copied draft | — | `prescription.write` | copied `DRAFT` | `DRAFT` | acknowledge stopped/allergy/interaction/renal flags | reconciled | inline | yes | — | Sign | **blocking gate before signing** |
| ~~Issue Prescription~~ | ❌ **does not exist** | — | — | — | — | — | — | — | — | — | — | **E-1: `ISSUED` is not a persisted state** |
| ~~Dispense Prescription~~ | ❌ **does not exist** | — | — | — | — | — | — | — | — | — | — | **E-1: `DISPENSED` is not a persisted state** |
| **Recommend Treatment** | step recommend | casesheet exists (`ensureCasesheetExists`) | `treatment.recommend` | casesheet | — | recommendation → `RECOMMENDED` | sent to admin (handoff) | inline | yes | — | (Doctor) Complete consultation | — |
| **Edit Recommendation** | rec exists, pre-schedule | `RECOMMENDED` | `treatment.recommend` | rec | not scheduled | update | updated | inline | yes | — | — | — |
| **Accept Recommendation** | admin, rec pending | `RECOMMENDED` | `treatment.schedule` | rec | RECOMMENDED | accept → `NEEDS_SCHEDULING` | schedulable | inline | yes | — | Schedule treatment | admin queue |
| **Decline Recommendation** | admin, rec pending | `RECOMMENDED` | `treatment.schedule` | rec | RECOMMENDED | decline → `SCHEDULING_DENIED` | notify doctor | inline | yes | — | Notify doctor | — |
| **Schedule Treatment** | admin, accepted | `NEEDS_SCHEDULING` | `treatment.schedule` | accepted rec | not on-hold | schedule → sheet draft → `RELEASED_TO_THERAPIST` | released (handoff) | inline | yes | on-hold path | (Therapist) Start session | `treatment-sheets/[id]/schedule` composed |
| **Add Daily Instructions** | released sheet | editable rows | `treatment.schedule`/`.write` | sheet | released | rows update | saved | inline | yes | version | Start session | — |
| **Start Treatment Session** | therapist, released | session `RELEASED` | `session.execute` | released sheet | released | session → `IN_THERAPY` | in progress | inline | yes | — | Record actuals | `treatment-sessions/[id]` composed |
| **Record Actuals** | session in progress | active session | `session.execute` | session | IN_PROGRESS | actuals save | saved | save-status | yes | version | Complete session | — |
| **Complete Session** | actuals recorded | complete allowed | `session.execute` | actuals | IN_PROGRESS | complete → `NEEDS_CLINICAL_REVIEW` | review pending | inline | yes | — | Clinical review | — |
| **Record Clinical Service (charge)** 🆕 | billing capability on | service delivered | `clinical_service.write` | visit | visit open | service → `TenantClinicalService(visit_id NOT NULL)` | chargeable | inline | yes | — | (Admin) Invoice | E-4: spine already exists |
| **View Billing Summary** 🆕 | billing capability on | always (doctor) | `billing.view` | visit | — | **none (read-only)** | charges + outstanding visible | — | — | — | — | doctor never blocked by billing |
| **Create / Issue Invoice** 🆕 | admin, chargeable services | services unbilled | `invoice.write` | chargeable services | — | invoice + lines (`clinical_service_id`) | invoiced | inline | yes | — | Record payment | admin-owned |
| **Record Payment** 🆕 | invoice issued | balance > 0 | `payment.write` | invoice | issued | payment | part-paid/paid | inline | yes | — | — | — |
| **Complete Consultation** ✏ | authoring complete | casesheet ≥ `FINAL` | `visit.outcome` | casesheet | authoring done | outcome + appt `COMPLETED` | consultation complete | inline | yes | — | Episode disposition | `complete-consultation` composed; **unbilled services → warning, never a hard block (A-6)**; open therapy sessions **coexist**, not a contradiction |
| **Continue Episode** | consultation complete | episode ACTIVE | `episode.update` | complete | ACTIVE | none (stays ACTIVE) | continued | — | — | — | Book next appointment | — |
| **Close Episode** | consultation complete | episode ACTIVE | `episode.close` | complete | ACTIVE | close → `CLOSED` | closed | inline | yes | — | Follow-up (optional) | — |
| **Plan Follow-up** | disposition | — | `appointment.create` | disposition | — | appointment create | follow-up booked | inline | yes | — | (loop) | prefill `appointments/create` |

## Global interaction rules

- **Visibility vs enablement:** an action a role *may* perform but whose prerequisite is unmet is shown **disabled with a reason + fix link** (W18), never hidden — so users understand the path. An action the role *may never* perform is **hidden** (mutation) while its content stays **visible** where policy permits (W19/W26).
- **Stale-state:** any mutation on versioned data (casesheet `document_version`, treatment `version`/OCC) that conflicts surfaces "reload latest / keep editing" (W21) — never silent overwrite.
- **Failure:** the current step never advances on failure; retry in place (W20).
- **Next action** is always exactly one, from `nextAction()` (design §8). If none applies, the bar shows a terminal/read-only message, never nothing.
- **Legacy impact** column: no action deletes a legacy route in R7; it composes or redirects it.

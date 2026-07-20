# R7 — Patient-Lifecycle Gap Matrix

> ## ⚠ REVISED BY DESIGN REVIEW — read [R7-DESIGN-REVIEW-GAPS.md](R7-DESIGN-REVIEW-GAPS.md) first
> **Two factual errors and one omission are corrected below:**
> - **E-1:** rows 8–9 claimed prescriptions run `DRAFT→ISSUED→DISPENSED`. **`PrescriptionStatus` has zero usages**; the persisted lifecycle is `document_status`: `DRAFT→FINAL→SIGNED`. Corrected.
> - **E-2:** rows 5–7 modelled the Case Sheet **per visit**. `TenantCasesheetContribution(casesheet_id, visit_id, staff_id)` proves the model is **one Case Sheet per Episode + append-only per-visit notes**. Corrected — this was the most dangerous defect (it would have created a second case sheet per visit).
> - **E-4:** billing was **absent from the entire lifecycle** despite a mandatory, already-built spine (`TenantClinicalService.visit_id NOT NULL` → `TenantInvoiceLine.clinical_service_id`). Steps 23–25 added.
> - **E-3:** therapy steps gate on **capability** (`appointments.multiday`/`.sessions` — entitled to ayurveda **and physio** today), never on specialty.
> - **A-4:** this table is the **maximal** lifecycle. The actual journey is **assembled per visit** from clinic type/capabilities/purpose/episode/permissions — a GP visit legitimately has no rows 10–17.

**Status:** Discovery — not approved, not implemented.
**Method:** each row traces a real step to verified frontend routes/screens and backend routers/statuses. Where a cell reads *(structural)* it was mapped at directory/interface level, not read line-by-line — flagged honestly per engineering-truth; Group 0 completes those traces before dependent implementation.

Legend for **Gap**: 🟥 stranding/leak risk · 🟧 friction/duplication · 🟨 missing guidance only · 🟩 already coherent.

## End-to-end trace

| # | Step | Role(s) | FE route / screen (verified) | Backend router → status source | Domain state | Prereq | Success → next state | Next recommended action | Failure / empty | Gap | Proposed R7 treatment |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Patient selection | Front desk, Doctor, Admin | `clients/index`, `clients/[clientId]/index` | `clients` router *(structural)* | client record | — | client chosen | Open appointment | empty client list state exists | 🟩 | Reuse as workspace entry |
| 2 | Appointment selection | Front desk, Doctor, Admin | `appointments/index`, `appointments/[appointmentId]` | `appointments`/`appointments_crud_router` → `AppointmentStatus` | SCHEDULED/CONFIRMED | client | appointment chosen | Start consultation | cancelled/no-show terminal handled | 🟨 | Launch point into workspace |
| 3 | Consultation start | Doctor, Assistant doctor | `appointments/[appointmentId]/start-consultation` → `episodes/[episodeId]/consultation` | `visits_router` (ensure visit) → appointment `IN_PROGRESS` | visit ensured | active appointment | visit created, IN_PROGRESS | Create/continue case sheet | — | 🟧 | Becomes workspace `step=consult` |
| 4 | Episode select/create | Doctor, Admin | `appointments/[appointmentId]/link-episode`, `.../create-episode`, `EpisodeSelectorModal` | `episodes_router` → `EpisodeStatus` | episode ACTIVE | patient | episode bound to visit | Author case sheet | link/create both exist | 🟧 | Embed selector in workspace header |
| 5 | **Episode** case sheet open/create ✏ | Doctor | `CaseSheetModule` (in consult) **and** `clients/[clientId]/casesheets/new` (standalone) | `casesheets_router` → `DocumentStatus.DRAFT` | DRAFT | visit+episode | **find-or-create the episode's** case sheet | Add visit note | `ensureCasesheetExists` guards dup | 🟥 **dual impl + E-2 wrong model** | **One per Episode**; converge to module; standalone → redirect |
| 5b | **Visit note (append)** ✏🆕 | Doctor, Assistant | (none — not surfaced) | `casesheets_router` + `TenantCasesheetContribution` | contribution row | episode casesheet | note appended, prior notes intact | Prescription | contribution model exists, **UI absent** | 🟥 **model built, unused in UI** | Surface append-only visit notes |
| 6 | Case sheet update | Doctor | `CaseSheetModule` autosave; `casesheets/[id]/edit` | `casesheets_router` (update, `document_version`) | DRAFT | casesheet exists | content saved | Prescription | autosave save-status exists | 🟧 | Reuse module autosave |
| 7 | Assessment completion ✏ | Doctor | (no explicit "complete assessment" affordance) | `casesheets_router` → `DocumentStatus.FINAL` | DRAFT→FINAL | casesheet DRAFT | FINAL = *"complete for now"* (**not** a permanent lock — A-3) | Sign / prescription | **no clear "mark complete" step** | 🟨 | Explicit complete action + amendment path |
| 7b | Sign / amend case sheet 🆕 | Doctor | — | `casesheets_router` → `SIGNED` (+ `SUPERSEDED` 🆕) | FINAL→SIGNED | FINAL | signed version immutable; amendable via supersession | Prescription | **amendment model absent** | 🟥 **contradiction (A-3)** | Ratify supersession model |
| 8 | Prescription create ✏ | Doctor | `PrescriptionModule` (in consult) **and** `clients/[clientId]/prescriptions/new` (standalone) | `prescriptions_router` → **`document_status.DRAFT`** | `DRAFT` | casesheet exists (varies) | prescription created | Finalise → sign | dual-impl characterization-locked | 🟥 **dual impl + `axiosClient.get` (ED-ARCH-001)** | Converge; remediate layer violation |
| 9 | Prescription finalise/sign ✏ | Doctor | `PrescriptionModule`; `prescriptions/[id]/edit` | `prescriptions_router` → **`FINAL` → `SIGNED`** (`signed_by_staff_id`/`signed_at`) | `DRAFT→FINAL→SIGNED` | prescription exists | signed = **dispensable** | Recommend / complete | ~~ISSUED/DISPENSED~~ **do not exist (E-1)** | 🟥 **package asserted a fictional lifecycle** | Correct to document lifecycle; decide `PrescriptionStatus` disposition |
| 9b | Copy previous prescription 🆕 | Doctor | (absent) | `repeated_from_prescription_id` **exists in schema** | new `DRAFT` | prior rx | new editable draft + provenance | **Reconcile (mandatory)** | schema ready, **UI absent** | 🟧 | Approve **only with** reconciliation + never-auto-sign (A-8) |
| 10 | Treatment recommendation | Doctor | `TreatmentRecommendationModule` (needs `ensureCasesheetExists`) | `treatment_orders_router`/`treatments_router` → `RECOMMENDED` | RECOMMENDED | casesheet exists | recommendation sent to admin | (handoff) Admin schedules | dup prevented via casesheet gate | 🟧 | Reuse; represent handoff as step |
| 11 | Recommendation accept/decline | Admin | `treatment-sheets/orders`, admin workspace `mode=admin` | `treatment_orders_router` → `NEEDS_SCHEDULING`/`SCHEDULING_DENIED` | RECOMMENDED→NEEDS_SCHEDULING | recommendation | accepted/declined | Schedule / notify doctor | on-hold/denied statuses exist | 🟨 | Admin next-action = "schedule" |
| 12 | Treatment planning | Admin, Doctor | `treatment-sheets/[id]/index`, `TreatmentPlansSection` | `treatment_sheets_router` → `TREATMENT_SHEET_DRAFT` | draft sheet | accepted rec | plan drafted | Schedule sessions | — | 🟨 | Workspace `step=plan` |
| 13 | Treatment scheduling | Admin | `treatment-sheets/[id]/schedule` | `treatment_sheets_router` → `SCHEDULED_AWAITING_TREATMENT_SHEET`→`RELEASED_TO_THERAPIST` | scheduled | draft sheet | released to therapist | (handoff) Therapist executes | on-hold path exists | 🟧 | Workspace `step=schedule`; handoff |
| 14 | Daily instructions | Doctor, Admin | `treatment-sheets` rows *(structural)* | `treatment_sheets_router` (rows) | released | released sheet | instructions set | Therapist starts session | — | 🟨 | Reuse rows editor |
| 15 | Session execution | Therapist, Assistant | `therapist.tsx`, `treatment-sessions/[sessionId]`, `TreatmentSessionCompleteModal` | `treatment_sessions_router` → `IN_THERAPY` (rows IN_PROGRESS) | IN_PROGRESS | released sheet | session in progress | Record actuals | *(structural)* | 🟧 | Therapist next-action into workspace `step=session` |
| 16 | Actual progress recording | Therapist, Assistant | `TreatmentSessionCompleteModal` *(structural)* | `treatment_sessions_router` (actuals) | IN_PROGRESS | active session | actuals saved | Complete session | *(structural)* | 🟨 | Reuse modal; represent as step |
| 17 | Case-sheet synchronization | system/Doctor | `treatmentSheets` sync utils *(structural)* | `treatment_sheets_service` sync | — | actuals | synced | Clinical review | sync_result exists (`sync_result.py`) | 🟨 | Surface sync state read-only |
| 18 | Consultation completion | Doctor | `episodes/[episodeId]/complete-consultation` (`CompleteConsultationScreen`) | `visits_router` (outcome) → appointment `COMPLETED` | COMPLETED | authoring done | consultation complete | Episode disposition | outcome fields exist (`outcome_type`, `outcome_recommended_episode_action`) | 🟧 | Workspace `step=complete` |
| 19 | Clinical review | Doctor | review section *(structural)* | `tenant_treatment_clinical_review` → `NEEDS/UNDER_CLINICAL_REVIEW`→`TREATMENT_COMPLETE` | review | sessions done | reviewed | Close/continue episode | review model exists | 🟨 | Reuse review; step in stepper |
| 20 | Episode continuation | Doctor | `episodes/[episodeId]/index`, `AllEpisodesScreen` | `episodes_router` (stays ACTIVE) | ACTIVE | consultation complete | continue | New appointment/visit | — | 🟨 | Disposition step |
| 21 | Episode closure | Doctor | `EpisodeDetailScreen` | `episodes_router` (close) → `EpisodeStatus.CLOSED` | ACTIVE→CLOSED | consultation complete | closed | Follow-up plan | close/reopen exist in repo | 🟨 | Disposition step |
| 22 | Follow-up planning | Doctor, Front desk | new appointment via `appointments/create` | `appointments` (create) | new SCHEDULED | closed/continued | follow-up booked | (loop to #2) | outcome recommends follow-up | 🟨 | Disposition → prefill new appointment |
| 23 | **Record clinical services (charges)** 🆕 | Doctor/Admin | (absent from workspace) | `clinical_services_router` → `TenantClinicalService(visit_id **NOT NULL**)` | chargeable | visit | charge recorded | Invoice | **spine built, workspace-blind** | 🟥 **E-4 omitted entirely** | First-class capability-gated stage |
| 24 | **Invoice** 🆕 | Admin | `billing/invoices/*` (standalone) | `finance`/invoice routers → `TenantInvoiceLine.clinical_service_id` | invoiced | chargeable services | invoice issued | Payment | exists, disconnected from visit flow | 🟧 | Doctor read-only visibility; admin acts |
| 25 | **Payment / outstanding** 🆕 | Admin | `billing/payments/*`, `record-payment` | payment router | part-paid/paid | invoice | settled | — | exists, disconnected | 🟧 | Surface outstanding in Command Center |
| 26 | **Clinical advice** (diet/exercise/lifestyle/home care/restrictions) 🆕 | Doctor | **no home anywhere** | **none** | — | visit | advice issued+printed | Complete | **completely absent (A-7)** | 🟧 | Bounded "Clinical Advice" framework (6-of-8), R6 concepts |
| 27 | **Measurements / lab** 🆕 | Doctor, Lab | **absent** | **none** | — | visit/episode | value recorded, trend visible | Interpret | **absent; approved standard ignored (E-5)** | 🟥 | Build on R6 concepts — see laboratory design |
| 28 | **Attachments** 🆕 | Doctor, Front desk | **absent** | **none** | — | visit | evidence attached | — | **absent** | 🟧 | Visit-scoped, episode-visible |

## Cross-cutting stranding / leak points (explicit)

1. **Dual case-sheet & prescription surfaces (#5, #8)** — a user can author in the consultation module *or* the standalone screen; two entry points for one action, already characterization-locked. **Stranding/confusion risk 🟥.**
2. **No "complete assessment" affordance (#7)** — DRAFT→FINAL transition exists in the backend but no clear frontend step; users can leave a casesheet DRAFT indefinitely. 🟨
3. **Handoff invisibility (#11, #13, #15)** — recommendation→scheduling→release→session are backend-modeled but the *originating* role gets no in-workspace signal that the ball is now in another role's court. 🟧
4. **No aggregate next-action source** — frontend re-derives lifecycle stage from multiple queries; risk of frontend/back-end disagreement (an action shown that the backend can't perform). 🟥 (the core backend gap).
5. **Completion vs. incomplete treatment** — consultation can complete (#18) while treatment sessions (#15–17) are still open; the rules exist in the resolver but the workspace must show this coexistence clearly, not as a contradiction. 🟨
6. **Cross-appointment/episode isolation** is currently sound (`WorkspaceProvider` scopes the visit by `appointmentId`) — R7 must **preserve** this, and every wireframe's context header exists to make the active scope unmistakable. 🟩→ must-not-regress.

## Role coverage (RBAC-flexible; not hard-coded to one profession)

| Step range | Doctor | Assistant doctor | Admin | Front desk | Therapist |
|---|---|---|---|---|---|
| 1–2 select | ✓ | ✓ (per perm) | ✓ | ✓ | view |
| 3–10 author | ✓ | partial (per perm) | view | — | — |
| 11–14 plan/schedule | view | — | ✓ | — | view |
| 15–17 sessions | view | ✓ (per perm) | view | — | ✓ |
| 18–22 complete/dispose | ✓ | partial | view | — | — |

Actual visibility/enablement is permission-driven, not role-hard-coded — see [R7-INTERACTION-STATE-MATRIX.md](R7-INTERACTION-STATE-MATRIX.md). Where clinic config/permissions allow an assistant doctor or admin to perform a step, the workspace must enable it by permission, not assume "doctor only."

## Gaps requiring resolution before implementation

- **G-1 (backend):** no aggregate workspace-state/next-action contract. *Blocking for reliable guidance.*
- **G-2 (frontend):** no lifecycle stepper / next-action composition over the existing section-progress primitive. *Core R7 build.*
- **G-3 (frontend):** dual casesheet/prescription surfaces must converge via redirect, not deletion.
- **G-4 (both):** handoff signals not surfaced to originating role.
- **G-5 (frontend):** no explicit "complete assessment" step.
- **G-6 (arch, blocking):** ED-ARCH-001 violations inside reused modules.

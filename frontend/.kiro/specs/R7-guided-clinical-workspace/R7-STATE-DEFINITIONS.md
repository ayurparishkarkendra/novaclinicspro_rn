# R7 — State Definitions (business semantics)

**Status:** Design review — no code/API/migration/schema change. Definitions proposed for ratification.
**Purpose:** the R7 package had **no business semantics** for any lifecycle state — only enum names. This document defines every state's *meaning*, not its spelling.

**Governing separation (permanent — see design-review A-5):**
**Business State** (backend-owned, defined here) ≠ **Workflow Progress** (per-visit, derived, never persisted) ≠ **Next Action** (derived from state+role+permission) ≠ **Status Badge** (presentation only). Nothing in this document is a badge or a UI rule.

**Verified vs proposed:** ✅ = exists in code today · 🆕 = proposed, needs ratification · ⚠ = exists but its documented meaning is contested.

---

## 1. Appointment ✅ (`AppointmentStatus`, `app/domain/appointments/models.py`)

| State | Business meaning | Owner | Entry | Exit | Prev → Next | Terminal | Reversible | Billing | Printing |
|---|---|---|---|---|---|---|---|---|---|
| `SCHEDULED` | A slot is reserved; nobody has affirmed attendance. | Front desk | booking created | confirm/cancel/no-show/reschedule | — → CONFIRMED, CANCELLED, NO_SHOW, RESCHEDULED | no | yes | none | none |
| `CONFIRMED` ⚠ | **Contested — see Q1.** Today: an intent-affirmation only. | Front desk | affirmation | consultation starts / cancel | SCHEDULED → IN_PROGRESS, CANCELLED, NO_SHOW | no | yes | none | none |
| `IN_PROGRESS` | Clinical encounter underway; a **Visit exists**. | Clinician | visit ensured | completion | CONFIRMED/SCHEDULED → COMPLETED | no | no (visit exists) | charges may accrue | none |
| `COMPLETED` | Encounter concluded and outcome recorded. | Clinician | outcome recorded | — | IN_PROGRESS → — | **yes** | no | billing finalizable | visit docs printable |
| `CANCELLED` / `NO_SHOW` / `RESCHEDULED` | Slot released without an encounter (reason differs). | Front desk | respective act | — | — | **yes** | no | typically none | none |

**Q1 — "What exactly is Appointment Confirmed?"** Today it is ambiguous: it may mean *patient confirmed attendance*, *clinic confirmed the slot*, or *reception acknowledged*. Three different business facts wearing one name. **Recommendation:** define `CONFIRMED` as **"attendance affirmed by or on behalf of the patient"**, and if clinic-side slot assurance is a distinct fact, it needs its own field — **not** a reuse of this state. Requires ratification.

Notifications: reminders on SCHEDULED/CONFIRMED. Audit: status transitions. Reporting: utilisation, no-show rate.

## 2. Consultation / Visit ✅ (`tenant_visits`)

A **Visit** is the clinical encounter record; it is *ensured* when an appointment goes `IN_PROGRESS` (Phase-2 idempotency: at most one Visit per Appointment). The Visit has no status column of its own — **its lifecycle is expressed by its appointment's status plus the presence of `outcome_type`.**

| Derived state | Meaning | Entry | Exit | Terminal | Reversible |
|---|---|---|---|---|---|
| Visit open 🆕 | encounter underway | visit ensured | outcome recorded | no | n/a |
| Visit concluded 🆕 | outcome + disposition recorded | `outcome_type` set, appt COMPLETED | — | yes | amendable via A-3 |

**Recommendation 🆕:** do **not** add a visit status column; deriving it avoids a second lifecycle authority (R6 principle). Audit: contribution rows + outcome. Billing: `TenantClinicalService.visit_id` (NOT NULL) binds all charges to the visit.

## 3. Episode ✅ (`EpisodeStatus`, `app/domain/episodes/enums.py`)

| State | Business meaning | Owner | Entry | Exit | Terminal | Reversible |
|---|---|---|---|---|---|---|
| `ACTIVE` | A clinical problem is under care; new visits may contribute. | Clinician | created / reopened | closure | no | — |
| `CLOSED` | Care for this problem concluded. | Clinician | disposition = close | reopen | **no — explicitly reversible** | **yes** (`CLOSED → ACTIVE` documented in code: "when issue recurs") |

Reporting: episode duration, outcomes. Billing: none directly. Printing: episode summary.

## 4. Case Sheet ⚠ (`DocumentStatus` on `tenant_casesheets`)

**Scope correction (design-review E-2):** the Case Sheet is **per Episode**, with **per-visit contributions** (`TenantCasesheetContribution`), not per visit.

| State | Business meaning | Owner | Entry | Exit | Terminal | Reversible | Billing | Printing |
|---|---|---|---|---|---|---|---|---|
| `DRAFT` | Authoring; content mutable; `document_version` increments. | Author (RBAC) | created | finalise | no | yes | none | draft watermark |
| `FINAL` ⚠ | **Contested — Q2.** Today: *"Locked, no content edits allowed."* | Author | finalise | sign / **amend 🆕** | no | **contested** | none | printable |
| `SIGNED` ⚠ | **Contested — Q3.** Today: *"Immutable, terminal, cannot be deleted."* | Signer | signature applied | **amend 🆕** | today: yes | today: no | none | legally printable |
| `SUPERSEDED` 🆕 | This version was replaced by an amendment; retained, renderable, never deleted. | system | amendment created | — | yes | no | none | printable "superseded" |

**Q2 — "What exactly is Case Sheet Final?"** Recommendation 🆕: `FINAL` = **"the author asserts this content is complete for now"** — a *clinical completeness* claim, **not** a legal one and **not** permanent immutability. It should permit **amendment** (new version supersedes) while forbidding silent in-place edits.

**Q3 — "What exactly is Signed?"** Recommendation 🆕: `SIGNED` = **"a named clinician attests to this exact content at this time."** The *signed version* is immutable **forever** — but the *document* remains living: an amendment creates a new version that supersedes it, with author/time/reason, and the signed version is retained and renderable exactly as signed. **This is the only reading that satisfies both `SIGNED = immutable` (code) and "completion must never imply permanent locking" (product).** Requires ratification (design-review A-3).

Permissions 🆕: `casesheet.write` (DRAFT), `casesheet.finalise`, `casesheet.sign`, **`casesheet.amend`** (new, RBAC-controlled — doctors amend; admins/therapists never). Audit: version chain + amendment reason. Reporting: episode-level clinical data.

## 5. Prescription 🟥 (`tenant_prescription.status` → `document_status`)

**Correction (design-review E-1):** the package claimed `DRAFT→ISSUED→DISPENSED` (`PrescriptionStatus`). **That enum has zero usages.** The persisted lifecycle is the **document** lifecycle: `DRAFT → FINAL → SIGNED`, plus `signed_by_staff_id`/`signed_at`.

| State | Business meaning | Owner | Terminal | Reversible | Billing | Printing |
|---|---|---|---|---|---|---|
| `DRAFT` | Being composed; not clinically actionable by anyone. | Prescriber | no | yes | medicines may bill | draft only |
| `FINAL` | Composition complete; awaiting attestation. | Prescriber | no | contested (A-3) | billable | printable (unsigned) |
| `SIGNED` | A named prescriber attests; **this is the point it becomes dispensable**. | Prescriber | yes (version) | via amendment 🆕 | billable | **legally printable/shareable** |

**Q4 — "What exactly is Issued?"** It does not exist in the persisted model. If the clinic genuinely needs **Issued** (handed to patient) and **Dispensed** (pharmacy fulfilled), those are **real, distinct business facts** currently unmodelled — they are **not** synonyms for FINAL/SIGNED. **Decision required:** delete `PrescriptionStatus` as dead code, **or** design dispensing as a properly migrated state model. Implementation must not guess.

Copy-forward 🆕 (`repeated_from_prescription_id` exists): a copy always enters `DRAFT`, records provenance, and **requires reconciliation** before signing (design-review A-8).

## 6. Treatment Recommendation ✅ (via `treatment_lifecycle_resolver`)

| State | Business meaning | Owner | Waiting on | Terminal | Reversible |
|---|---|---|---|---|---|
| `RECOMMENDED` | Clinician proposes therapy; no commitment of resources yet. | Doctor | **Admin** 🔵 | no | yes (pre-schedule) |
| `NEEDS_SCHEDULING` | Accepted; resources not yet committed. | Admin | Admin | no | yes |
| `SCHEDULING_ON_HOLD` | Accepted but deliberately paused (reason recorded). | Admin | Admin | no | yes |
| `SCHEDULING_DENIED` | Declined with a reason; clinician must be informed. | Admin | **Doctor** 🔵 | yes* | yes (re-recommend) |

## 7. Treatment Plan — **RATIFIED: first-class persisted, versioned entity** (see [R7-TREATMENT-SCHEDULING-MODEL.md](R7-TREATMENT-SCHEDULING-MODEL.md))

**Business meaning:** the **approved clinical intent** for a treatment course — *"what course of treatment is clinically intended?"* Distinct from Treatment Recommendation (*"should this patient receive a course?"*). **Contains no committed dates.** Owner: authoring clinician. Billing: drives expected therapy charges. Printing: plan summary.

**Verified status:** ❌ **does not exist today.** No Plan entity (`app/domain/treatment_plan/` = a `SyncResult` dataclass only); "treatment plan" is a free-text `TEXT` column on `tenant_visits`. → **additive migration required in R7**.

**Semantic stages — FROZEN. Spelling — deferred to requirements** (Engineering Truth + Product Discovery):

| Semantic stage | Meaning |
|---|---|
| Authoring | plan being composed; not yet approved intent |
| Approved clinical intent | clinician has approved the course design |
| Available for scheduling | admin may commit resources |
| Active course | sessions exist / are executing |
| Under clinical review | review milestone reached; clinician judging |
| Completed | course concluded against completion criteria |
| Superseded / amended | replaced by a new version; prior retained (Decision 2) |
| Stopped / discontinued | ended early for clinical reasons |

⚠ **Do not reuse the R4 `TreatmentLifecycleStatus` 11 statuses without verifying semantic fit.** Verified this task: those are **treatment *execution*** statuses ("at most one … for a given treatment at a given time": recommendation→scheduling→sheet→therapy→review→complete). Overlap with Plan lifecycle is **partial, not identity** — the Plan is *intent*, the resolver tracks *execution*. Requirements must propose the **smallest additive model** rather than overload an existing enum (overloading one enum with two concerns is exactly what produced `ED-ARCH-002`).

**Reversible:** yes — via supersession, never in-place mutation (Decision 2). **Schedule-only changes must NOT create a new Plan version.**

## 8. Treatment Sheet ✅ (`tenant_treatment_sheets` + rows)

| State | Business meaning | Owner | Waiting on | Terminal |
|---|---|---|---|---|
| `SCHEDULED_AWAITING_TREATMENT_SHEET` | Calendar committed; clinical rows not yet authored. | Admin | Doctor 🔵 | no |
| `TREATMENT_SHEET_DRAFT` | Doctor authoring per-session clinical content. | Doctor | Doctor | no |
| `RELEASED_TO_THERAPIST` | Clinically authorised for execution. | Doctor | **Therapist** 🔵 | no |
| `IN_THERAPY` | At least one session executed/underway. | Therapist | Therapist | no |
| `NEEDS_CLINICAL_REVIEW` | Execution complete; clinician judgement required. | Therapist | **Doctor** 🔵 | no |
| `UNDER_CLINICAL_REVIEW` | Clinician reviewing outcomes. | Doctor | Doctor | no |
| `TREATMENT_COMPLETE` | Clinician concluded the therapy course. | Doctor | — | yes |
| `UNRESOLVED` | **Not a business state — an integrity alarm.** | system | Engineering | n/a |

**Note 🆕:** `UNRESOLVED` must never render as a patient-facing badge; it means the resolver's inputs are inconsistent. Treat as an error surface, not a status.

## 9. Treatment Session ✅/🆕 (`treatment_sheet_row`, `tenant_treatment_sessions`)

**Correction (E-6):** `treatment_sheet_row` already carries `session_id`, `session_date`, `assigned_staff_id`, `status`, `completed_at`, `completed_by_staff_id` — **plus legacy `day_number`** (to retire).

| State | Business meaning | Owner | Terminal | Reversible |
|---|---|---|---|---|
| Scheduled 🆕 | A real session exists on a real date with an assigned therapist. | Admin | no | yes (reschedule = attribute change) |
| `IN_PROGRESS` | Therapist executing. | Therapist | no | no |
| `COMPLETED` | Executed; **actuals recorded**. | Therapist | yes | amendable |
| `CANCELLED` | Will not occur; **clinical content retained**. | Admin/Doctor | yes | yes (re-add) |
| Missed 🆕 | Scheduled, did not occur, no clinical fault recorded. | Admin | yes | yes |

**Rule 🆕 (A-9):** session **identity** is stable; date/therapist/room are **attributes**; doctor-authored clinical content attaches to **identity**. Rescheduling never regenerates a session and therefore never destroys instructions.

## 10. Billing / Clinical Service ✅ (`TenantClinicalService.visit_id` NOT NULL)

| State 🆕 | Business meaning | Owner | Billing impact |
|---|---|---|---|
| Chargeable | A clinical service was delivered in a visit; not yet invoiced. | system/clinician | appears as unbilled |
| Invoiced | Attached to an invoice line (`clinical_service_id`). | Admin | on invoice |
| Written off | Deliberately not charged (reason). | Admin | excluded |

## 11. Invoice / Payment ✅

| State | Business meaning | Owner | Terminal |
|---|---|---|---|
| Draft | Charges assembled, not issued. | Admin | no |
| Issued | Payable document given to patient. | Admin | no |
| Part-paid | Payment(s) < total. | Admin | no |
| Paid | Settled. | Admin | yes |
| Cancelled/Credited | Reversed with reason. | Admin | yes |

**Completion rule (A-6):** unbilled chargeable services produce a **warning** at visit completion, never a hard block.

---

## Cross-cutting

**Naming inconsistency 🟧:** `DocumentStatus` uses UPPERCASE (`DRAFT`), `PrescriptionStatus` lowercase (`draft`), treatment lifecycle lowercase (`needs_scheduling`), appointment UPPERCASE. Three conventions. **Recommendation:** standardise **new** states on the dominant persisted convention (UPPERCASE for document/appointment; the treatment resolver's lowercase is an established public contract — do **not** churn it). Cosmetic renames of live contracts are **rejected**: the cost (API/consumer churn) exceeds the benefit.

**API representation rule 🆕:** every state is transported as its **stable code** plus a **localization key** — never as English display text (R5/R6 precedent). Badges are rendered at the boundary.

**Audit rule 🆕:** every transition records actor, time, and — where the transition is a judgement (amend, decline, write-off, cancel, deviate-from-recommendation) — a **reason**.

**States requiring ratification before implementation:** Appointment `CONFIRMED` (Q1) · Case Sheet `FINAL`/`SIGNED` + `SUPERSEDED` (Q2/Q3, A-3) · Prescription `ISSUED`/`DISPENSED` disposition (Q4) · Treatment Plan states · Session `Missed` · Billing/Clinical-Service states.

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

## DP-15 — One Clinical Answer Rule *(design freeze)*

**For every clinical question there is exactly one authoritative backend answer; the frontend must never be capable of producing a different one.** Full statement, the Resolver+Service pattern, the Workflow-Assembly ownership rule and the `SectionProgress` UI/clinical split are defined once in [R7-GUIDED-CLINICAL-WORKSPACE-DESIGN.md](R7-GUIDED-CLINICAL-WORKSPACE-DESIGN.md) — **not duplicated here** (DP-15 applies to its own documentation: one source of truth per concept).

Consequence for this document: every state defined here is a **backend-owned Business State**. Nothing here may be derived, inferred, or recomputed by the frontend.

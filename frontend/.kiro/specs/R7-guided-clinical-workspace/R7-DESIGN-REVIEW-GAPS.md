# R7 — Design Review & Gaps (Clinical Operating System revision)

> ## POST-RATIFICATION UPDATE — [R7-OWNER-RATIFICATION.md](R7-OWNER-RATIFICATION.md) is now the authority
> All 8 decisions ratified 2026-07-17. **The ratification did NOT resolve everything** — re-challenging the revised design surfaced two new blocking findings and several unresolved gaps. See **Part 6** (new).

**Status:** Design review — no code, API, migration, schema, branch, or commit. Review only.
**Reviewer stance:** Principal Healthcare Product / Clinical Workflow / UX / Technical / Enterprise Architect.
**Subject:** the R7 Discovery Package produced at baselines backend `8b23568` / frontend `cd86021`.
**Verdict:** the package is **not approvable as written**. It contains three factual errors, one wrong domain model, and four material omissions — all verified against code. It also under-reaches: it designed a *guided form-stepper*, not a Clinical Operating System. Revised architecture below.

> **Method note (engineering-truth):** every finding cites verified code. Where the original package asserted something it had not verified, that is called out as a **reviewer error**, not softened. The most important lesson from this review: the original package read enums and folder structure and inferred behavior — the exact failure mode the skill exists to prevent.

---

## Part 1 — Errors in the existing package (must correct before approval)

### E-1 🟥 **BLOCKING — The prescription lifecycle in the package is fiction**
**Weakness.** `R7-INTERACTION-STATE-MATRIX.md` and `R7-PATIENT-LIFECYCLE-GAP-MATRIX.md` state prescriptions run `DRAFT → ISSUED → DISPENSED`, citing `PrescriptionStatus`.
**Evidence.** `grep -rn "PrescriptionStatus" app/` returns **zero usages** outside its own definition. `tenant_prescription.status` is declared as `postgresql.ENUM("DRAFT","FINAL","SIGNED", name="document_status")`. The real persisted lifecycle is the **document** lifecycle.
**Why it matters.** Every prescription interaction rule, next-action derivation, and status badge in the package is built on a state machine that does not exist. Implementing it would produce a UI offering "Issue"/"Dispense" transitions the backend cannot perform — precisely the "action that does not reflect backend state" R7 exists to eliminate.
**Recommended solution.** Correct all documents to the verified `document_status` lifecycle. Separately raise `PrescriptionStatus` as **dead-code/domain-drift debt** (`ED-ARCH-002` candidate): either the enum is deleted, or — if `ISSUED`/`DISPENSED` are genuinely wanted (pharmacy dispensing is a real clinical concept) — it becomes an approved future state-model change with a migration. **That is a product decision, not a doc fix.**
**Impact.** Docs: corrected. Architecture: none (removes an invented one). **Blocking.**

### E-2 🟥 **BLOCKING — Wrong Case Sheet domain model**
**Weakness.** The package modeled the Case Sheet as a per-visit document (`gap matrix` rows 5–7: "casesheet create → DRAFT per visit").
**Evidence.** `TenantCasesheetContribution(tenant_id, casesheet_id, visit_id, staff_id, contributed_at)` already exists (Phase 2, ADR-P2-03). Its entire reason for existing is to attribute **many visits to one case sheet**. `tenant_casesheets` carries `episode_id` *and* `appointment_id`, **both nullable**.
**Why it matters.** The codebase already implements the longitudinal model the product intends (one Case Sheet per Episode, contributed to per visit). The package's per-visit model would have driven the implementation to create a **second case sheet per visit** — duplicating clinical records and breaking episode continuity. This is the single most dangerous defect in the package.
**Recommended solution.** Adopt **one Case Sheet per Episode + append-only per-visit contributions** as the domain model (see §Part 2 A-2 for the refined model and the `appointment_id` ambiguity that must be resolved).
**Impact.** Architecture: significant (correct model). Product: high (record integrity). **Blocking.**

### E-3 🟧 **Multi-day therapy wrongly modeled as an Ayurveda specialty trait**
**Weakness.** The package gated therapy steps via `isAyurvedaClinic(features)`.
**Evidence.** R5 established `appointments.multiday` / `appointments.sessions` as **capabilities**, and `capability_multiday_entitlement_seed.py` seeds them for `MULTIDAY_ENTITLEMENT_CLINIC_TYPES = ("ayurveda", "physio")` — **physio already has multi-day therapy today.**
**Why it matters.** Specialty-gating would hide the therapy workflow from physio clinics that are already entitled to it, and would require a code change for every future specialty — violating "extension before modification" (Constitution 03) and the capability/entitlement separation.
**Recommended solution.** All therapy/session steps gate on **capability** (`appointments.multiday`, `appointments.sessions`), never on clinic type. Specialty affects **labels and content** (Pathya/Apathya vs Exercise Protocol), never **workflow presence**.
**Impact.** Architecture: medium (correct gating source). **Blocking for Group F.**

### E-4 🟥 **BLOCKING — Billing omitted from the lifecycle entirely**
**Weakness.** The 22-step lifecycle contains no billing step; `R7-GUIDED-CLINICAL-WORKSPACE-DESIGN.md` never mentions invoices.
**Evidence.** The billing spine exists and is **mandatory**: `TenantClinicalService.visit_id` is `nullable=False` (every clinical service is bound to a visit — Phase 2 ADR-P2-05), and `TenantInvoiceLine.clinical_service_id` links services to invoice lines. Routers/models for invoice, invoice line, payment all exist.
**Why it matters.** A visit cannot be *operationally* complete if its charges are unrecorded. Omitting billing means the "Complete visit" action lies. Worse, the Visit→ClinicalService→InvoiceLine chain is already built — the package ignored a finished spine.
**Recommended solution.** Billing becomes a **first-class, capability-gated lifecycle stage** that is **visible to doctors, actionable by admins, and non-blocking for clinical work** (see §Part 2 A-6).
**Impact.** Product: high. Architecture: medium (reuse existing spine). **Blocking.**

### E-5 🟧 **Approved Clinical Measurement Standard ignored**
**Weakness.** No document referenced `.kiro/standards/02-clinical-measurement-standard.md` (approved) or `01-clinical-document-standard.md`.
**Evidence.** Both exist under `.kiro/standards/`. The engineering-workflow skill explicitly requires consulting them "whenever the task touches clinical documents or measurements" — R7 touches both.
**Why it matters.** R7 is the first phase that *implements* structured measurements. Designing them without the governing standard risks contradicting an approved authority.
**Recommended solution.** `R7-LABORATORY-AND-MEASUREMENTS-DESIGN.md` derives from that standard and from R6's semantic foundation.
**Impact.** Architecture: medium. **Blocking for the laboratory group.**

### E-6 🟨 **Day-N vs real-session migration mischaracterized**
**Weakness.** Package implied session representation was un-started.
**Evidence.** `treatment_sheet_row` already has `session_id`, `session_date`, `assigned_staff_id`, `status`, `completed_at`, `completed_by_staff_id` — **and** legacy `day_number`. The transition is half-complete.
**Recommended solution.** Treat `day_number` as **legacy ordinal to retire**, not a model to replace wholesale (see `R7-TREATMENT-SCHEDULING-MODEL.md`).
**Impact.** Sizing: reduces. Non-blocking.

---

## Part 2 — Architectural revision: from Guided Workspace to Clinical Operating System

### A-1 🟥 The package designed forms + stepper + next-action. That is not an operating system.
**Why it matters.** A stepper answers *"where am I in a form sequence?"*. A clinician needs *"why is this patient here, what changed, what must I know before I act, what's safe to do next."* The package's W1 wireframe opens **directly into `CaseSheetModule` sections** — it starts with data entry, not with situational awareness.

**Recommended solution — the Visit Command Center.** The workspace's landing state is a **briefing, not a form**:

```
┌──────────────────────────────────────────────────────────┐
│ Ravi Kumar · 34M          ⚠ Allergy: Sulfa   [Timeline]  │
│ WHY TODAY: Follow-up · "back pain worse after travel"     │  ← appointment purpose + today's concern
├──────────────────────────────────────────────────────────┤
│ WHAT CHANGED SINCE LAST VISIT (12 Jun)                    │
│  • Therapy: 4/8 sessions done · last 10 Jun               │
│  • HbA1c 7.9 → 7.2  ✅ improving                          │  ← measurement delta (R6 concepts)
│  • Rx: Amitriptyline stopped by patient (reported)        │
├──────────────────────────────────────────────────────────┤
│ BEFORE YOU ACT                                            │
│  ⚠ Sulfa allergy · ⚠ eGFR 54 (dose caution)               │
│  ⏳ Awaiting your clinical review: Plan A (sessions done)  │  ← waiting-on-me
├──────────────────────────────────────────────────────────┤
│ ▸ RECOMMENDED NEXT: Review therapy outcome                 │  ← recommendation, deviation cheap
│   [ Do this ]   [ Something else ▾ ]                      │
└──────────────────────────────────────────────────────────┘
```

The nine COS questions map to explicit regions: *why here* (purpose+concern), *what changed* (delta), *what to know* (alerts), *what next* (recommendation), *done/pending/blocked/waiting-on-role* (workflow pills), *can I complete* (completion readiness).
**Impact.** Frontend **Large** (new briefing surface + delta computation). Backend **Medium** (aggregate must return deltas/alerts, not just statuses). **Blocking for the COS objective.**

### A-2 🟧 One Case Sheet per Episode — with the ambiguity the code leaves open
**Recommended model.**
- **Case Sheet = per Episode** (stable episode-level clinical information: presenting problem, history, examination baseline, diagnosis evolution).
- **Visit Note = append-only per visit**, attributed via the existing `TenantCasesheetContribution`.
- A visit **never overwrites** a prior visit's note; it appends. Episode-stable sections are *amended with versioning* (A-3), not overwritten silently.

**Unresolved ambiguity requiring an owner decision (do not let implementation guess):** `tenant_casesheets` has **both** `episode_id` and `appointment_id`, both nullable. That permits three contradictory readings — per-episode, per-appointment, or floating. **Decision needed:** make `episode_id` the authoritative binding and `appointment_id` the *creating* visit only (historical provenance), or formally deprecate `appointment_id` on the case sheet. This is a data-model decision with migration implications — **out of R7 implementation scope until decided.**
**Impact.** Architecture: high. **Blocking.**

### A-3 🟥 "Living documents" vs `FINAL = Locked` / `SIGNED = Immutable` — a real, unresolved contradiction
**Evidence.** `DocumentStatus` docstring: *"FINAL: Locked, no content edits allowed. SIGNED: Immutable, terminal state, cannot be deleted."* The review objective states *"Completion must never imply permanent locking"* and documents must stay editable per RBAC.
**These cannot both be true.** Silently choosing either side would be an architectural violation (engineering-truth: never resolve a contradiction by picking a side).

**Recommended resolution — supersession, not mutation (reuse R6's proven invariant).** "Living" must not mean "mutable." Clinically and legally, a signed record must remain exactly as signed; but a clinician must be able to correct/extend it. R6 already solved this exact shape for clinical *meaning* ("immutable once referenced; evolution through supersession; the prior remains, so history stays interpretable"). Apply it to clinical *documents*:

- `DRAFT` → freely editable, version increments (already true).
- `FINAL`/`SIGNED` → content frozen. An edit creates an **Amendment**: a new version that supersedes the prior, with author/time/reason, while the superseded version is retained and remains renderable/printable exactly as signed.
- RBAC governs **who may amend**, not whether the record may be rewritten.
- Prints/shares always identify the version and whether an amendment exists.

This satisfies "editable per RBAC" *and* clinical/legal integrity *and* is architecturally continuous with R6 rather than a new mechanism.
**Impact.** Architecture: high (document versioning model). Product: high (audit/print). **Blocking — requires owner ratification because it reinterprets an approved enum's documented meaning.**

### A-4 🟧 The workflow is hard-coded; it must be assembled
**Weakness.** The package's `nextAction()` = "first incomplete step in *canonical order*" — a fixed linear lifecycle. GP visits do not have treatment recommendation → scheduling → sessions.
**Recommended solution — Workflow Assembly.** The journey is **computed**, not declared:

```
assembleWorkflow(inputs) -> ordered stages
inputs: clinic type · enabled capabilities · specialty · appointment purpose
        · patient context · episode state · doctor decisions · permissions
```
- **Capabilities decide stage presence** (`appointments.multiday` → therapy stages; billing capability → billing stage).
- **Appointment purpose decides emphasis** (follow-up vs new complaint vs therapy-only visit).
- **Doctor decisions extend the workflow at runtime** (recommending therapy *adds* scheduling/session stages to this episode's journey).
- **Permissions decide actionability, never presence** (a stage you may not act on appears as *waiting-on-role*, not hidden — otherwise the doctor cannot see the patient is blocked on admin).

Worked examples (GP / Ayurveda / Physio) in `R7-GUIDED-CLINICAL-WORKSPACE-DESIGN.md` §Workflow Assembly.
**Impact.** Frontend **Large** (assembly engine + per-stage registry). Backend **Medium** (aggregate must expose capability + purpose + episode facts). **Blocking for the dynamic-workflow objective.**

### A-5 🟨 Four concepts were conflated — separate them permanently
The package's step chip meant *state*, *progress*, *next action*, and *badge* simultaneously. These must be independent, or a UI change forces a domain change:

| Concept | Owner | Definition | Example |
|---|---|---|---|
| **Business State** | backend entity | the record's own lifecycle status | case sheet `FINAL` |
| **Workflow Progress** | assembled journey (per visit) | where this visit stands in *its* assembled stages | stage 3 of 6 current |
| **Next Action** | derivation (role+perm+state) | the single recommended act | "Review therapy outcome" |
| **Status Badge** | presentation | human rendering of business state | 🟡 "Awaiting review" |

**Rule:** Business State is never invented by the frontend. Workflow Progress never persists. Next Action is derived, never stored. Status Badge is presentation-only and never drives logic.
**Impact.** Architecture: medium. Non-blocking but **permanent**.

### A-6 🟥 Billing as a first-class, non-blocking stage
**Recommended solution.** Reuse the existing spine (`Visit → TenantClinicalService(visit_id NOT NULL) → TenantInvoiceLine → Invoice → Payment`).
- **Doctor:** sees charges accruing (consultation, therapies, medicines, consumables, services) + outstanding balance — **read-only visibility**, never blocked by billing.
- **Admin:** acts (invoice, payment, adjust).
- **Completion:** "Complete visit" reports billing readiness (e.g. "3 services unbilled") as a **warning, not a hard block** — clinical work must never be held hostage to billing, but a visit that silently loses charges is an operational defect.
- Capability-gated; clinics without billing see no stage.
**Impact.** Frontend **Medium**, Backend **Small–Medium** (reuse). **Blocking for "complete the lifecycle."**

### A-7 🟧 Clinical Recommendation Framework — **partially reject the proposal**
**The proposal:** collapse Medicines, Treatments, Diet, Exercises, Lifestyle, Home Care, Restrictions, Follow-up Advice into one modular framework.
**My assessment: do not unify all eight. Unify six; keep two separate.** Reasoning:

- **Prescription (medicines)** is *regulated*, has dispensing downstream, signing semantics, and medicine reconciliation. **Treatment** is *resourced and scheduled* (rooms, therapists, sessions) with an 11-status lifecycle. These two have genuinely different lifecycles, different downstream systems, and different legal weight. Collapsing them into one "recommendation" loses exactly the semantics that make them safe. **Reject unification for these two.**
- **Diet, Exercise, Lifestyle, Home Care, Restrictions, Follow-up Advice** *do* share one shape: advisory, no independent lifecycle, authored during the visit, printed/shared together, capability-gated, specialty-labeled. Today they have **no home at all** — that is the real gap. **Unify these six** as **Clinical Advice**: one modular model, one print/share pipeline, one extension point.

| | Advantages | Disadvantages |
|---|---|---|
| Unify all 8 | one model/print/extensibility | destroys regulatory + scheduling semantics; huge migration of two mature lifecycles; **high clinical-safety risk** |
| **Unify the 6 advisory (recommended)** | fills a real gap; one print/share; capability+specialty extensible; **no migration of existing mature models** | two frameworks coexist (justified by genuinely different natures) |
| Unify none | no change | leaves 6 concepts homeless; every specialty re-invents them |

- **Migration:** additive only (new advisory model; prescription/treatment untouched).
- **Printing/sharing:** one advisory renderer + existing Rx/treatment renderers, composed per Clinical Document Standard.
- **Extensibility:** each advice item gets **canonical identity via R6 concepts** (Pathya/Apathya, Exercise Protocol, Oral Hygiene are *labels* over canonical advice concepts) — extending to a new specialty is seed data, not code.

**Impact.** Architecture: medium (new bounded model). **Non-blocking** for the COS core; sequence after the lifecycle correction.

### A-8 🟨 Prescription "Copy Previous" — approve, with hard conditions
**Assessment.** Genuinely valuable (chronic-care repeat prescribing) and the model supports it: `tenant_prescription` already has `repeat_previous_prescription_id` / `repeated_from_prescription_id` (verified in Phase-2 characterization tests). So the concept **already exists in the schema** — the package missed it.
**Conditions (non-negotiable for clinical safety):**
- Copy always produces a **new DRAFT**, never an issued/finalized record.
- **Provenance recorded** (`repeated_from_prescription_id`) → audit answers "copied from what."
- **Reconciliation is mandatory, not optional**: the draft must surface *what changed since*: stopped medicines, allergy conflicts (⚠ Sulfa), interaction warnings, renal-dose flags (eGFR), and items the patient self-reported as discontinued.
- **Never auto-issue.** A copied prescription requires an explicit clinician act.
- **Duplication guard:** one active draft per visit.
**Risk if built without reconciliation:** silently perpetuating a stale/unsafe regimen — the highest clinical-safety risk in this entire review.
**Impact.** Frontend Medium, Backend Small (fields exist). **Non-blocking; gated on reconciliation being in-scope.**

### A-9 🟥 Scheduling ↔ Treatment Sheet synchronization is the hardest unsolved problem
**Weakness.** The package hand-waved this ("reuse scheduling components"). The proposed flow *generates* the Treatment Sheet **after** scheduling — which means **rescheduling regenerates rows and destroys doctor-authored instructions.**
**Recommended solution — three-way separation** (detailed in `R7-TREATMENT-SCHEDULING-MODEL.md`):
1. **Session identity** — stable, never regenerated.
2. **Schedule attributes** — date/therapist/room; freely mutable; rescheduling *updates*, never recreates.
3. **Clinical content** — doctor-authored therapies/medicines/oils/duration/precautions/instructions/expected outcome; attached to **session identity**, never to the date.

Then reschedule/cancel/miss/add/shorten/therapist-change/room-change all become attribute changes or lifecycle events on a stable session — **doctor instructions survive by construction.** This is the single most important architectural correction in the treatment domain.
**Impact.** Architecture: high. **Blocking for the treatment groups.**

### A-10 🟧 Mobile: the package was form-first
**Recommended solution.** Mobile-first COS: patient summary → today's needs → **sticky next action** → horizontal workflow pills → **one primary task at a time** → minimal scrolling → ≥44pt targets → interruption recovery. Wireframes revised in `R7-GUIDED-WORKSPACE-WIREFRAMES.md`.
**Impact.** Frontend Medium. Non-blocking (but core to adoption).

### A-11 🟨 Workflow visualization
Adopt rounded colored pills: 🟢 completed · 🟡 current · ⚪ pending · 🔵 waiting-on-another-role · ⚫ not-applicable. **Superior alternative considered and adopted:** pills alone encode state but not *ownership*; add a **role initial/avatar on blue pills** ("🔵 Sched · A") so "waiting on Admin" is legible at a glance — the package's original circles could not express cross-role waiting at all. Colour is never the sole channel (accessibility): each pill carries icon + text.

### A-12 🟧 Laboratory & measurements — architect on R6, not on an integration
**Recommended solution.** Do **not** couple to LIONIC or any provider. Structured measurements are **observations of canonical clinical concepts (R6)** — R6 already built exactly this seam (concept + context mapping + resolution, provenance-preserving). A lab result is the same shape as `chief_complaint`: a canonical concept, an observed value, a context, provenance. Adding LIONIC/FHIR/CSV/device later = **new provenance adapters**, not a redesign. Full design in `R7-LABORATORY-AND-MEASUREMENTS-DESIGN.md`.
**Impact.** Architecture: high leverage (reuses R6). **Non-blocking for COS core; blocking for the lab group.**

### A-13 🟨 Visit attachments — absent
Attachments (lab PDFs, imaging, referral letters, external documents) belong to the **visit** (provenance) while surfacing on the **episode timeline** (continuity). Capability-gated storage. Design sketch in the laboratory document (shares the provenance model).

### A-14 🟧 Respectful disagreement: *"The user should never have to decide where to navigate next. The system should always know."*
**I disagree with this as stated, and recommend a precise reformulation.**
A Clinical Operating System must **always have a confident recommendation** and make **deviation cheap** — it must never *decide* for the clinician. Reasons:
1. **Clinical safety & autonomy.** The clinician holds accountability; a system that dictates the next clinical act positions itself as the decision-maker. Constitution 03 is explicit that AI/derived layers are consumers, never owners, of clinical truth — and that every contribution stays explainable and attributable. "Always knows" quietly crosses that line.
2. **Reality of practice.** Patients deviate: the "next step" is frequently wrong for *this* patient (concern changed, patient declines therapy, urgent finding). A system that only knows one path strands exactly the cases that matter most.
3. **Regulatory exposure.** Prescriptive clinical sequencing edges toward clinical-decision-support classification.

**Reformulation:** *"The user should never have to **work out** where to go next — the system always shows a confident recommendation, always explains why, and always makes choosing differently a first-class, one-tap action."* Every wireframe therefore pairs `[ Do this ]` with `[ Something else ▾ ]`. This preserves the product intent (zero navigation burden) without making the software the clinician.

---

## Part 3 — Remaining gap sweep (§23 challenge-everything)

| Area | Gap | Class |
|---|---|---|
| Workflows | No workflow assembly; no appointment-purpose concept surfaced; no "urgent finding" deviation path | 🟥 |
| Lifecycle states | No formal semantics anywhere → `R7-STATE-DEFINITIONS.md` created | 🟥 |
| APIs | No aggregate; no delta/"what changed"; no alerts/allergies; no billing summary; no completion-readiness | 🟥 |
| Permissions | Role config covers 2 of 5 roles; amendment rights undefined; exact permission codes unverified | 🟥 |
| Summaries | No previous-visit summary, no measurement deltas | 🟥 |
| Dashboards | Role queues exist but don't expose "waiting on you" from the workspace's perspective | 🟨 |
| Synchronization | Reschedule destroys instructions (A-9) | 🟥 |
| Printing/Sharing | Clinical Document Standard not applied; amendment/version identification on prints undefined | 🟧 |
| Versioning | `document_version` exists but no amendment model (A-3) | 🟥 |
| Audit | Contribution attribution exists; amendment/copy-forward/deviation audit undefined | 🟧 |
| Reporting | Billing/clinical reporting impact of each state undefined → now in state definitions | 🟧 |
| Patient safety | **No allergy/interaction/renal surfacing anywhere in the package** — the most serious product omission | 🟥 |
| Migration | `day_number` retirement, `appointment_id`-on-casesheet ambiguity, `PrescriptionStatus` disposition all unplanned | 🟧 |
| Rollback | Flag-gating defined; but no rollback for *data-shaped* changes (amendments) | 🟧 |

---

## Part 4 — Blocking vs non-blocking summary

**Blocking (must resolve before implementation):** E-1 (prescription lifecycle fiction), E-2 (case sheet model), E-4 (billing), A-2 (`episode_id`/`appointment_id` ambiguity — **owner data-model decision**), A-3 (living-document contradiction — **owner ratification**), A-4 (workflow assembly), A-6, A-9 (session/schedule separation), E-3 (capability gating), plus ED-ARCH-001 remediation carried from the original package, plus patient-safety surfacing (allergies/interactions).

**Non-blocking (sequence after core):** A-7 (Clinical Advice framework), A-8 (copy-forward, gated on reconciliation), A-10 (mobile), A-11 (pills), A-12/A-13 (lab & attachments — blocking only for their own groups), E-6 (`day_number`), A-5 (concept separation — permanent rule, applies immediately to new code).

## Part 5 — Decisions required from the owner (implementation must not guess)

1. **Case sheet binding:** `episode_id` authoritative + `appointment_id` = creating-visit provenance? Or deprecate `appointment_id`? (migration implications)
2. **Living documents:** ratify supersession/amendment (A-3) as the reinterpretation of `FINAL`/`SIGNED`, or keep hard locking and reject "always editable"?
3. **`PrescriptionStatus`:** delete as dead code, or promote `ISSUED`/`DISPENSED` to a real, migrated state model (pharmacy dispensing)?
4. **Clinical Advice scope:** accept the 6-of-8 bounded unification (A-7), or mandate full unification (I advise against, with reasons)?
5. **Copy-forward:** approve only with mandatory reconciliation + never-auto-issue?
6. **Billing completion:** warning-only (recommended) vs hard block?
7. **"System always knows":** accept the A-14 reformulation (recommend + explain + cheap deviation)?
8. **Scope reality:** with the COS revision, R7 is **Large/Very Large**, not Medium. Confirm R7 delivers the full COS, or split (R7 = COS core + correct models; R8 = lab/measurements/advice/billing depth).


---

# Part 6 — Post-Ratification Gap Review (the ratification did not close these)

Re-challenged after the owner decisions. Classified: **blocking R7** · non-blocking R7 · **R8** · future · rejected.

## New blocking findings (verified this task)

### F-1 🟥 **BLOCKING R7 — Decision 1 is not achievable with current code**
Contribution attribution resolves the Visit from `casesheet.appointment_id`, which is **set once at creation and never reassigned** (`update_data` excludes it; `episode_id` is explicitly immutable). Under the ratified one-Case-Sheet-per-Episode model, **every contribution after the first is attributed to the creating visit** — visit 2's clinical note is recorded as visit 1's. The append-only model exists but **mis-attributes**. Second risk: an unresolvable visit silently inserts **no contribution row** while the content update succeeds — under the per-Episode model that is **silent loss of a visit's authorship**, not a benign no-op.
**Why it matters:** silently corrupts the longitudinal attribution Decision 1 exists to guarantee. **Solution:** resolve the visit from the **current write context** (Group A-BE). **Impact:** service-layer correction (M) + later nullability migration. **Class: ✅ RESOLVED at Design Freeze** — the fix is frozen as a contract (current-Visit explicit + backend-validated · atomic · idempotent · `appointment_id` = creation provenance only) with 12 acceptance criteria carried to requirements. The *defect* remains live in code; **Group A-BE fixes it**.

### F-2 🟥 **BLOCKING R7 — ratified patient-safety scope is largely unbuildable**
Verified: **allergies do not exist in the backend at all** (`grep -rn "allerg" app/ -il` → empty; no column/schema/DTO). Interactions and renal indicators are **not modelled**. Treatment-level `contraindications` is free text about *a therapy*, not *this patient*. Active medicines exist only as **opaque JSONB** (`prescription_data`) — displayable, not reason-over-able. Only **pending clinical reviews** is genuinely available.
**Compounding contract drift:** the **frontend declares an `allergies` field** (`client.entity.ts`, `clients.dtos.ts`, `ClientForm`, `ClientDetailScreen`) that the backend never persists or returns.
**Reviewer error owned:** the prior W0 wireframe displayed `⚠ ALLERGY: Sulfa` and `⚠ eGFR 54` as headline safety features. **Both fabricated.** Corrected.
**Why it matters:** shipping an unbacked safety panel is *worse than none* — "no allergies shown" reads as "no allergies". **Class: ✅ RESOLVED at Design Freeze — Option A.** R7 displays only verified backend-owned signals that exist today or are explicitly implemented in R7; allergy/interaction/renal/hepatic/contraindication modelling → **R8**. The frontend must not fabricate, derive or interpret them.

## Unresolved gaps after ratification

| # | Gap | Class |
|---|---|---|
| G-A | **Decision 2 (supersession) requires a schema change** not yet designed or approved (version chain, superseded pointer, amendment reason). R7 core can ship without it; amendment cannot. | **blocking Group G only** |
| G-B | `DocumentStatus` docstring ("FINAL: Locked… SIGNED: Immutable, terminal") **still contradicts the ratification** in code. Documentation-vs-ratification contradiction — must be closed, not ignored. | blocking Group G |
| G-C | **Decision 5's reconciliation gate cannot check anything today** (no allergy/interaction/structured-medicine data). Shipping it as-is implies a safety check that does not occur. | **R8, gated on F-2** |
| G-D | ✅ **RESOLVED at Design Freeze** — Treatment Plan = **first-class persisted, versioned entity**; projection **rejected** (schedule churn would alter clinical intent; DP-15 violation). **Consequence:** R7 now needs an **additive migration** (verified: no Plan entity exists; `tenant_visits.treatment_plan` is a free-text `TEXT` column). | ~~blocking~~ **resolved** |
| G-E | ✅ **RESOLVED at Design Freeze** — `Missed` = **schedule state + execution outcome + structured reason**; never one ambiguous `MISSED` status. Exact spellings → requirements. | ~~blocking~~ **resolved** |
| G-F | `PrescriptionStatus` disposition (delete vs dispensing model) — deferred by Decision 3, but the enum remains a live trap for the next reader. | non-blocking R7 (`ED-ARCH-002`) |
| G-G | **Appointment `CONFIRMED`** still overloaded (patient-affirmed vs clinic-assured vs reception-acknowledged). Recommended meaning proposed; **not ratified**. | non-blocking R7 |
| G-H | `episode_id` nullable + **no data audit** of null-episode case sheets before any non-null migration. | blocking the migration, not R7 core |
| G-I | **Exact permission codes unverified** against `org_permissions` (`casesheet.amend`, `prescription.sign`, `billing.view` etc. are proposed names). | blocking Group H (T-0.2 resolves) |
| G-J | **Author-once-apply-to-many** for per-session instructions: correctness is fine without it, **adoption is not** (14-session course unusable one-by-one). | non-blocking R7 (adoption-critical) |
| G-K | Workflow assembly has **no defined behaviour when capabilities change mid-episode** (e.g. multiday entitlement revoked while a plan is active). | non-blocking R7 |
| G-L | **Rollback for data-shaped changes** (amendments, contributions) undefined — flags roll back code, not records. | blocking Group G |
| G-M | R7/R8 boundary risk: "basic what changed" (R7) vs "structured what changed" (R8) is a **soft line**; scope creep back into R7 is likely without a hard rule. | non-blocking R7 |
| G-N | Therapist/session downstream still **structurally traced only** (not read line-by-line) — Group E rests partly on unverified ground. | blocking Group E (T-0.2 resolves) |

## Rejected (recorded so they are not re-proposed)

| Proposal | Why rejected |
|---|---|
| Surface the frontend's existing `allergies` field | Not persisted/returned by backend → permanently empty/unreliable **safety** field. More dangerous than showing nothing. |
| "The system should always know" | Makes the software the clinical decision-maker; contradicts Constitution 03 (derived layers are consumers, never owners); regulatory exposure. Replaced by recommend-with-deviation (Decision 7). |
| Unify all 8 concepts into Clinical Recommendation | Destroys regulatory (prescription) and scheduling/resource (treatment) semantics; migrates two mature lifecycles for no clinical gain. |
| Implement `ISSUED`/`DISPENSED` in R7 | Zero runtime usage; would ship transitions the backend cannot perform. |
| Delete `PrescriptionStatus` now | Out of scope for a design task; needs its own product decision. |
| Hard-block clinical completion on billing | Clinical work must not be gated by finance (Decision 6). |
| Cosmetic state renames (casing harmonisation) | Treatment resolver's lowercase codes are a live public contract; churn cost > benefit. |
| Regenerating the Treatment Sheet from the schedule | Destroys doctor-authored instructions by construction (A-9). |

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

# Part 7 — Decision 9 Engineering-Truth Sweep (frontend workflow derivation)

Fresh sweep for frontend-derived workflow/completion/summary/lifecycle. **Three violations verified; one candidate cleared.**

### V-1 🟥 **BLOCKING R7 — `deriveSummary()` / `CompleteConsultationScreen`** *(re-evaluated, confirmed)*
Re-checked against code; the earlier classification **stands and is confirmed blocking**. It derives a **clinical summary**, duplicates the backend **order lifecycle** (`treatmentSent = treatmentState !== 'DRAFT'`), interprets clinical JSONB with **hardcoded template IDs** (`['nadi_pariksha','prakriti']`), **treats absence as a negative finding** (`'Not saved'`/`'Not created'`/`'Not sent'`), and then **acts on its own derivation** (`transitionCasesheetStatusApi(…,{status:'FINAL'})`). Its own comment records this derivation **was already wrong once**.
**Why blocking:** it sits on the consultation-completion screen — the visit's highest-consequence moment — and R7 planned to **compose that screen as the `complete` stage**, importing the violation into the COS. **Correction:** backend owns the summary + completion readiness (Group D-BE); the screen renders them. **Debt:** `ED-ARCH-004`. **Do not fix code now.**

### V-2 🟥 **BLOCKING R7 — `buildSectionConfig()` assembles the workflow in the frontend**
**Evidence.** `features/episodes/presentation/hooks/useConsultationWorkspace.ts`:
```ts
export function buildSectionConfig(features) {
  if (isAyurvedaClinic(features)) specialtySections.add('ayurvedicAssessment');
  const activeSections = ['chiefComplaint','clinicalNotes',
    ...(isAyurvedaClinic(features) ? ['ayurvedicAssessment'] : []),
    'prescription','treatmentRecommendation','clinicalServices'];
}
```
**Three defects in one function:** (a) **workflow assembly in the frontend** — Decision 9 makes this backend-owned; (b) **specialty-gated, not capability-gated** — the E-3 defect, live in code (physio is already entitled to multi-session therapy); (c) **a hardcoded canonical section order** — exactly the fixed order A-4 rejects.
**Why blocking:** R7's assembled workflow cannot be backend-owned while the frontend still computes `activeSections`. **Correction:** `clinical_workflow_resolver` assembles; FE renders. **Debt:** `ED-ARCH-006`.

### V-3 🟧 **Non-blocking — `SectionProgress` completion derived in the frontend, across ~10 modules**
**Evidence.** `SectionProgressStatus = 'empty' | 'in_progress' | 'complete'` (`useConsultationWorkspace.ts`), consumed by ~10 `ConsultationSections/*` components, each deciding its own "complete" locally.
**Why it matters.** Decision 9 makes **completion readiness** backend-owned. Today completion is derived in ten places with no single authority — so "is this visit complete?" has ten possible answers.
**Why non-blocking for R7 core:** per-section *save/authoring* progress is legitimately presentational; only **visit-level completion readiness** is a clinical fact and must come from the backend. **Correction:** backend owns completion readiness; per-section save status may remain presentational. **Debt:** `ED-ARCH-006`.

### V-4 ✅ **Cleared — `episodeWorkspaceConfigByRole` is not a Decision-9 violation**
Frontend role→CTA map (`canEditNotes`/`canSchedule`/`canWriteRx`/`canCreateTreatmentSheet`). `CLAUDE.md` §3 **explicitly permits** this: *"Hiding a route or component is presentation polish, never an access control mechanism"* — provided the backend enforces. **Not new debt.** **But R7 must derive actionability from the backend's `blocking_factors`/`waiting_role`, not from this map** — the map may hide a CTA; it may never be the authority for whether an action is permitted.

### Precedent that de-risks all of this
**R4 already performed this exact correction once**: frontend-derived treatment status → backend-resolved `lifecycle_status`/`lifecycle_status_label`/`lifecycle_status_unresolved` (`treatmentOrders.dtos.ts`: *"resolved server-side"*, *"never writable"*; `treatmentSheetHeaderLifecycleRepoint`/`treatmentSheetInfoCardStatusRepoint`/`treatmentLifecycleActionsStatusRepoint` tests). Decision 9 generalizes a proven correction — V-1/V-2/V-3 are the same violation R4 fixed elsewhere, still live here.

# R7 — Treatment & Scheduling Model

> ## FROZEN (2026-07-17) — [R7-OWNER-RATIFICATION.md](R7-OWNER-RATIFICATION.md) §Final Blocker Resolution
> **Treatment Plan is RATIFIED as a first-class, persisted, versioned clinical domain entity** — not a projection, not a UI model, not an alias for Recommendation/Sheet/schedule. The open question this document raised ("*new persisted entity or additive projection?*") is **closed: entity.** Projection is **rejected** (it would let schedule churn alter clinical intent and violate DP-15).
> **Verified consequence:** no Plan entity exists today (`app/domain/treatment_plan/` holds only a `SyncResult`; "treatment plan" is a free-text `TEXT` column on `tenant_visits`) → **R7 requires an additive migration**. Plan-lifecycle **spelling** is deferred to requirements; **⚠ do not reuse the R4 `TreatmentLifecycleStatus` 11 statuses without verifying semantic fit** — verified: they are *treatment execution* statuses, not Plan-lifecycle.
> Session "Missed" is resolved as **schedule state + execution outcome + structured reason** — never one ambiguous `MISSED` state.

**Status:** Design review — **frozen** — no code/API/migration/schema change made.
**Supersedes** the original package's treatment handling, which hand-waved synchronization and would have **destroyed doctor-authored instructions on every reschedule** (design-review A-9).

---

## 1. The core architectural correction

**The proposed flow** ("Treatment Sheet generated after scheduling") has a fatal property: if rows are *generated from* the schedule, then changing the schedule *regenerates* rows — and the doctor's therapies, oils, precautions and instructions are lost or silently re-attached to the wrong session.

**Correction — separate three things that the current model conflates:**

| Layer | Owns | Mutability | Never |
|---|---|---|---|
| **Session identity** | the fact that *a* session exists in this course | created once; never regenerated | never recreated by rescheduling |
| **Schedule attributes** | date, time, therapist, room | freely mutable | never the anchor for clinical content |
| **Clinical content** | therapies, medicines, oils/materials, duration, precautions, instructions, expected outcome | doctor-authored, versioned | never regenerated from schedule |
| **Execution record** | actuals, actual outcome, who/when | therapist-authored, append | never overwritten by a reschedule |

**Consequence:** rescheduling = *updating an attribute of a stable session*. Doctor instructions survive **by construction**, not by careful coding.

**Evidence this is achievable, not a rewrite (E-6):** `treatment_sheet_row` **already** has `session_id`, `session_date`, `assigned_staff_id`, `status`, `completed_at`, `completed_by_staff_id`, `materials_payload_hash` — plus the legacy ordinal `day_number`. The model is already ~70% of the way here. R7 completes the separation and retires `day_number` as an identity.

---

## 2. Treatment Plan vs Treatment Sheet — is the separation clinically superior?

**Assessment: yes, and it should be made explicit** (today the "plan" is implicit).

- **Treatment Plan = clinical intent.** Therapies, approximate session count, preferred frequency, review interval, completion criteria, scheduling preferences. Authored by the doctor. **Contains no dates.**
- **Treatment Sheet = the executable instance.** Real sessions with real dates, therapists, rooms, and per-session clinical content.

**Why superior:** intent survives schedule churn. A patient who reschedules four times still has one unchanged clinical intent, and the plan remains the thing reviewed against completion criteria. Collapsing them (today's implicit model) means every schedule change looks like a clinical change — which is both clinically wrong and the root cause of the synchronization problem.

**Better model considered and rejected:** "plan = the schedule" (simpler, one entity). Rejected because it cannot express *review-dependent continuation* ("6 sessions, review at 3, extend if improving") without inventing schedule rows that may never exist — and it forces a clinical re-decision on every logistics change.

```mermaid
flowchart LR
  R[Recommendation<br/>RECOMMENDED] --> P[Treatment Plan<br/>intent: therapies, count,<br/>frequency, review, criteria]
  P -->|Admin commits resources| S[Scheduling<br/>dates · therapist · room]
  S -->|creates stable| SESS[Sessions<br/>identity + attributes]
  SESS -->|Doctor authors| CC[Clinical content<br/>per session]
  CC -->|Release| T[Therapist executes]
  T --> A[Actuals recorded]
  A --> RV[Doctor review vs criteria]
  RV -->|criteria met| DONE[TREATMENT_COMPLETE]
  RV -->|extend| P
```

**Note the loop:** review feeds back to *plan*, not to schedule — that is the clinical reality the separation buys.

---

## 3. Sequencing model (§20 — beyond consecutive days)

The Plan declares **scheduling intent**, not dates:

| Intent | Meaning | Scheduling converts to |
|---|---|---|
| `CONSECUTIVE` | daily, unbroken | n consecutive dates |
| `ALTERNATE` | every other day | n alternating dates |
| `SPECIFIC_WEEKDAYS` | e.g. Mon/Thu | dates matching weekdays |
| `WEEKLY` / `TWICE_WEEKLY` | cadence | spaced dates |
| `PRN` | as needed | **no pre-created dates**; sessions created on demand |
| `REVIEW_DEPENDENT` | schedule to the review milestone only | dates up to review; continuation decided at review |

Plan carries: `session_count` (approximate), `preferred_frequency`, `scheduling_intent`, `review_milestones`, `completion_criteria`.
**`PRN` and `REVIEW_DEPENDENT` are exactly what a fixed "Day 1..Day N" sheet cannot express** — a further reason to retire `day_number`.

**Do not assume multi-day = Ayurveda (E-3):** every therapy stage is gated on the **capabilities** `appointments.multiday` / `appointments.sessions`, already entitled to **ayurveda *and* physio** today, and available to dental/ortho/rehab/pain/integrative by entitlement alone — **no code change per specialty.**

---

## 4. Session representation (§21)

Sessions are **real scheduled events**, never ordinals:

```
Session · Thu 18 Jul 10:30 · Therapist: Anjali · Room 2       🟢 completed
  therapies: Abhyanga, Swedana      duration: 45m
  medicines/oils: Mahanarayana taila (materials tracked)
  precautions: avoid post-therapy cold exposure
  instructions (doctor): reduce pressure on lumbar region
  expected outcome: pain ↓ ≥2 points
  ── actuals (therapist) ──────────────────────────────
  performed: Abhyanga, Swedana · 40m · actual outcome: pain 6→4 · note: tolerated well
```

Each session owns: date · therapist · therapies · medicines/materials · duration · instructions · precautions · expected outcome · actuals. `day_number` becomes **display-order only, then retired** — never identity, never the anchor for content.

---

## 5. Synchronization semantics (§9) — the answer to each event

| Event | What changes | What is preserved | State effect |
|---|---|---|---|
| **Reschedule** | `session_date` (attribute) | **all clinical content, identity, authoring** | none (still scheduled) |
| **Therapist change** | `assigned_staff_id` | all clinical content | none |
| **Room change** | room attribute | all clinical content | none |
| **Cancellation** | status → `CANCELLED` (+reason) | **content retained** (never deleted) | plan may need extra session |
| **Missed** | status → `Missed` 🆕 (+reason) | content retained | plan may re-add |
| **Additional session** | **new session identity** appended | existing sessions untouched | plan `session_count` intent updated |
| **Reduced duration/count** | future sessions cancelled | past sessions + content untouched | plan amended (A-3 versioning) |
| **Schedule regeneration** | **not permitted as a concept** 🆕 | — | replaced by per-session attribute edits |

**Rule 🆕 — "no regeneration":** there is no operation that recreates the sheet from the schedule. The only operations are: create session · update session attributes · cancel/miss session · add session. This is what makes "preserving doctor instructions" a structural guarantee rather than a promise.

**Concurrency:** sessions carry optimistic concurrency (the R5 `version`/If-Match precedent, and rows already have `updated_at`). A doctor authoring content while an admin reschedules must not silently clobber: conflict surfaces "reload/keep" (never silent overwrite).

**Ordering guarantee:** a session's clinical content is authored against session identity, so it remains correct even if the session moves *earlier or later than its siblings* — a case "Day N" ordinals get wrong by definition.

---

## 6. Doctor-fills-scheduled-rows (§8) — assessment

The proposed order (Admin schedules → **then** doctor fills each scheduled session) is **clinically sound and superior** to authoring content before dates exist: the doctor authors against the *actual* date/therapist, so precautions and expectations reflect reality.

**But it creates a gap the package missed:** between `SCHEDULED_AWAITING_TREATMENT_SHEET` and `TREATMENT_SHEET_DRAFT`, **the therapy is waiting on the doctor** — and today nothing tells the doctor that. This is a 🔵 *waiting-on-you* item that must appear in the doctor's Visit Command Center (design-review A-1) and role queue. Without it, therapy stalls invisibly.

**Efficiency requirement 🆕:** authoring N sessions individually is unusable for a 14-session course. The design must support **author-once-apply-to-many** (template a session's content across selected sessions), with per-session override. Otherwise the model is correct but unusable — an adoption risk, not a correctness one.

---

## 7. Impact

| Change | FE | BE | Class |
|---|---|---|---|
| Explicit Treatment Plan (intent) as first-class | Medium | Medium (new model/endpoints — **additive**) | 🟥 blocking for treatment groups |
| Session identity/attribute/content separation | Medium | Small–Medium (model already ~70% there) | 🟥 blocking |
| Scheduling-intent model (6 intents incl. PRN/review-dependent) | Medium | Medium | 🟥 blocking |
| Retire `day_number` as identity | Small | Small (display-order only, then drop) | 🟨 non-blocking |
| Author-once-apply-to-many | Medium | Small | 🟧 adoption-critical |
| Capability gating (not specialty) | Small | — | 🟥 blocking |
| Waiting-on-doctor signal | Small | Small (expose in aggregate) | 🟧 |

**Migration:** additive. No destructive schema change proposed; `day_number` retirement is a later, separately-approved step once nothing reads it as identity.
**Rollback:** all new stages capability/flag-gated; the existing sheet/row model remains functional with flags off.
**Open decisions:** (1) is Treatment Plan a new persisted entity or an additive projection over the existing sheet? (2) does `Missed` become a real status or a cancellation reason? Both require owner ratification before implementation.

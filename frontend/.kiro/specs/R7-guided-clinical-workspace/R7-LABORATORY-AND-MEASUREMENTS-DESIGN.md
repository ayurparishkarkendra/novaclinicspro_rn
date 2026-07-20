# R7 — Laboratory & Clinical Measurements Design

> ## STATUS: **APPROVED ARCHITECTURAL DIRECTION — IMPLEMENTATION DEFERRED TO R8**
> Ratified under Decision 8 (R7/R8 split). This document is an **R8 input**, retained here as the single source (no duplicate copy created). Nothing in it is in R7 scope.
> **R8 prerequisite added by F-2:** allergy/medication data modelling must land in R8 **before or with** copy-forward and safety surfacing — R7 cannot surface them (they do not exist).

**Status:** Approved architectural direction · **implementation deferred to R8** · no code/API/migration/schema change.
**Governing authority:** `.kiro/standards/02-clinical-measurement-standard.md` (**approved**; the original R7 package ignored it — design-review E-5) and `.kiro/standards/01-clinical-document-standard.md`.
**Foundation:** R6 Clinical Semantic Foundation (merged to `dev` @ `8b23568`).

---

## 1. The key architectural insight — this is R6's next consumer, not a new subsystem

A laboratory result has **exactly the shape R6 already proved**:

| R6 concept (built, live) | Laboratory equivalent |
|---|---|
| Canonical Clinical Concept (`org_clinical_concepts`) | **HbA1c**, FBS, Creatinine, ESR, CRP — one canonical meaning each |
| Context Mapping (`org_clinical_concept_context_mappings`) | *where the value lives* — lab result, case-sheet field, device feed |
| Observed Value | the result value |
| Provenance | who/when/which instrument or which uploaded report |
| Clinical Semantic Resolution | the single authority answering "what does this value mean" |

**Therefore:** measurements must **not** get a new semantic mechanism. HbA1c is a canonical concept; a lab result is an *observation of that concept in a lab context*. R6's invariant — *every clinical observation has one canonical meaning* — is precisely what makes cross-source, cross-time comparison (trends) sound. Without it, "HbA1c from LIONIC" and "HbA1c typed by a nurse" are two unrelated strings and no trend is trustworthy.

This is the highest-leverage reuse available to R7: the seam was built in R6 and deliberately proved with exactly two contexts so a third (lab) is **one more mapping, not a new mechanism** (R6 design §11, proven by T-E.3).

**Standard alignment:** the Clinical Measurement Standard mandates specialty-independent, comparable measurements with standardized core definitions — which is the same statement as "one canonical concept per measurement, specialty-independent." R6 supplies the mechanism the standard requires.

---

## 2. Provider-agnostic architecture (§16 — no coupling to LIONIC)

**Never couple to a provider.** Layering:

```
Clinical Domain
   Measurement = observation of a Canonical Clinical Concept (R6)
        ↑ (one shape, provider-agnostic)
Application
   Measurement ingestion / resolution / trend derivation
        ↑ (ports — domain repository interfaces)
Infrastructure — interchangeable provenance adapters
   [ manual entry ] [ CSV import ] [ LIONIC ] [ generic LIS ] [ FHIR Observation ] [ device feed ]
```

- **The domain never names a provider.** Adding LIONIC/another LIS/FHIR/a device = **a new adapter + a new provenance kind**, zero domain or UI redesign. This satisfies "avoid redesign when new laboratory providers are added."
- **FHIR readiness inherits R6's stance** (R6 design §10): the canonical concept plays the `code`/`CodeableConcept` role; binding to LOINC later is an **additive mapping**, not a rewrite. **R7 must not bind terminology now** — premature binding is exactly what R6 deliberately avoided.
- **Dependency direction is mandatory** (`CLAUDE.md`, ED-ARCH-001): Routers → Services → Repositories → ORM/External. A provider SDK must never be reachable from a service, still less a router.

**Rejected alternative:** a `lab_results` table with provider-specific columns (fastest to build). Rejected — it makes provider #2 a schema migration and makes trends provider-scoped, defeating longitudinal comparison. This is the "20-year" test: adapters age, canonical meaning does not.

---

## 3. Measurement model (proposed, additive)

A **Measurement** minimally carries: canonical concept (R6) · value · unit · reference range · effective time (**when observed**, not when entered) · provenance (source kind, performer, instrument/report) · abnormal flag · the **visit** it was recorded in · the **episode/patient** it belongs to.

**Non-negotiables:**
- **Unit is part of the value.** A value without a unit is not comparable and must be rejected.
- **Reference range travels with the observation** (ranges are lab- and demographic-specific and change over time). A trend that re-applies today's range to a 3-year-old value is clinically wrong.
- **Effective time ≠ entry time.** Trends order by effective time.
- **Never mutate an observation.** Corrections **supersede** (R6 §8 / design-review A-3), preserving the original — the same invariant as clinical documents. A lab correction is a new observation superseding the prior, never an overwrite.

## 4. Longitudinal trends (§18)

Comparative table first; graphs later (explicitly deferred).

```
Measurement      12 Mar    18 May    17 Jul     Δ        Flag
HbA1c (%)          8.4       7.9       7.2     ↓1.2      ✅ improving
FBS (mg/dL)        148       132       126     ↓22       ✅ improving   [range 70–100 ⚠ high]
Creatinine (mg/dL) 1.1       1.3       1.5     ↑0.4      ⚠ deteriorating  [range 0.7–1.3 ⚠ high]
ESR (mm/hr)         44        30        22     ↓22       ✅ improving
```

Highlighting rules: **improvement** / **deterioration** (direction is concept-specific — *falling* creatinine is good, *falling* haemoglobin is not, so direction-of-good is an attribute of the **concept**, not a global rule) · **out-of-range** (against the range recorded *with that observation*) · **clinically significant change** (concept-defined threshold, not a generic %).

**Feeds the Command Center's "What changed?"** (design-review A-1): the delta row (`HbA1c 7.9 → 7.2 ✅`) is a trend query, not a new mechanism.

**Deliberately deferred:** graphs, cross-patient analytics, any AI interpretation. Analytics/AI are out of R7 scope (constraint §22) and must remain *consumers* of measurements, never owners (Constitution 03).

## 5. Visit attachments (§17)

Attachments (lab PDFs, imaging, referral letters, previous prescriptions, external documents) **belong to the visit** (provenance: which encounter produced them) while being **surfaced on the episode timeline** (continuity). One model, two views — no duplication.

- An attachment may be **linked to measurements** it evidences (the PDF a value was read from) — this is provenance, and it is what makes a manually-entered value auditable.
- Capability-gated (storage is not universal); RBAC governs view/upload/delete; deletion is **soft** with audit (clinical evidence is never hard-deleted).
- Attachments are **not** a document store for the clinic — they are visit-scoped clinical evidence. Keeping that boundary prevents this becoming a general DMS.

## 6. Where measurements live relative to the Case Sheet

The Case Sheet (per Episode — design-review E-2) **references** measurements; it does not **own** their values. Rationale: measurements outlive and cross case sheets (a value observed during therapy, or imported between visits, belongs to the patient's record regardless of which document displays it). Embedding values inside `data_json` would recreate exactly the per-store duplication R6 was built to eliminate.

**This is the R6 invariant applied literally:** the case sheet is one *context* that observes a canonical concept; the lab is another. Same meaning, different observations, each with its own provenance.

## 7. Impact & sequencing

| Item | FE | BE | Class |
|---|---|---|---|
| Measurement model + concept seeds (HbA1c, FBS, …) | Small | Medium (additive tables + R6 concept seeds) | 🟥 blocking for lab group only |
| Provenance adapter port (manual + CSV first) | Small | Medium | 🟥 (lab group) |
| Trend/comparative table + deltas | Medium | Small–Medium (trend query) | 🟧 (feeds Command Center) |
| Attachments | Medium | Medium (storage + RBAC + audit) | 🟧 |
| LIONIC / LIS / FHIR / device adapters | — | Medium **each, later** | 🟨 deferred by design |

**Migration:** additive only; no existing table altered. **Rollback:** capability/flag-gated; dropping the measurement tables leaves R6 and the case sheet untouched (R6's own rollback posture, inherited).
**Open decisions:** (1) do measurements get their own tables (recommended) or extend case-sheet `data_json` (rejected above — recreates duplication)? (2) which concepts are seeded first, and by whom clinically approved (R6 established the Clinical Architecture Authority gate — the same gate applies)? (3) is "direction-of-good" + significance threshold a concept attribute (recommended) or per-tenant config?

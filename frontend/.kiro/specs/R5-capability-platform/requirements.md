# Release 5 — Capability Platform — Requirements

**Release:** R5 · **Status:** Planning · **Document type:** Requirements (Doc 07 §13) — defines **what** must be true, not **how**. Design follows in `design.md` only after this document is explicitly approved.

**Reading scope (as specified):** Doc 01 (Product Vision), Doc 04 (Domain/Experience Constitution), Doc 05 (Capability & Access Model), Doc 06 (Solution Architecture Constitution), Doc 07 (Product Evolution Roadmap) · R0 (Constitutional Freeze & Baseline), R1 (`phase-1-clinical-platform-trust`), R2 (`phase-2-clinical-workflow-alignment`), R3A (`R3A-clinical-workspace`), R3B (`R3B-clinical-spine`), R4 (`R4-treatment-state-ownership`) — requirements/design/closure notes and, for R4, `BACKEND-STATE-OWNERSHIP.md`.

**Known reading-scope gaps (verified this session, not assumed):**

1. **Doc 09 ("Audit") and Doc 10 ("Phase Governance") remain locally inaccessible**, exactly as every prior phase's own requirements.md has recorded. R4's own reading-scope-gap note (its §"Known reading-scope gaps" item 1) already established this; this document does not re-attempt independent access and does not fabricate a Doc 10 finding-code citation for the problem this document identifies (§2) — that problem is verified directly from the running backend codebase (§3), not derived from a Doc 10 quotation. If Doc 09/10 become available, reconcile against this document before `design.md` is finalized.
2. **Doc 05 ("Capability & Access Model")** is named in this phase's own title and is the single most relevant constitutional document for R5's subject matter. It was not locally found either (same `~/Documents/Product Roadmap/` search R3B/R4 already performed came up empty for it). This document therefore treats Doc 05 the same way R4 treated Doc 02/04a — relying on **already-approved citations of Doc 05 embedded in prior phases' own specs** (e.g. R4 requirements.md §6: *"Doc 05 — Capability & Access Model | Role boundaries this phase must not redesign (N-3)"*) as the trustworthy secondary source, not a fresh independent read.
3. Doc numbers 01, 04, 06, 07 were freshly and successfully read this session from `/Users/ayurparishkar/Documents/Product Roadmap/` and are used directly below.

These gaps are recorded per the Reality-Check discipline (audit before you write) rather than silently assumed away. None of them block this document, because the current-state findings below (§3) are independently verified from the running codebase, not derived from the missing documents.

---

## 1. Business Goal

**R5 is not another clinical workflow phase.** R0–R4 each named one lifecycle/screen/status owner for a specific clinical domain (the consultation, the treatment, the case sheet). R5 does the equivalent work one layer up the stack: it names **one owner for the question "is this feature available, and to whom?"** — a question every one of R1–R4's own capabilities (multi-day appointments, treatment sheets, the Clinical Spine flag, the R4 lifecycle flag) already had to answer today, each in its own ad hoc way (§2, §3).

> **One feature has one entitlement owner, one enablement owner, and one runtime answer — computed once, not re-derived per screen, per module, or per subscription check.**

**"Computed once" means one canonical computation per request/query execution — not a permanently stored effective-state field, and not one single lifetime computation.** The effective state SHALL remain a *derived* value (recomputed each time it is asked for, from its authoritative inputs) and SHALL NOT become another independently-writable status table (this is the same discipline R4's OW-2 established for its own resolver — "a read/presentation computation, never a competing writable field"). "Once" refers to eliminating the *N-different-answers-per-request* problem of §2's six mechanisms, not to caching a single answer forever.

This mirrors R4's own founding sentence exactly on purpose (*"One clinical event has one lifecycle owner, one screen owner, one status owner"*) — R5 is the platform-level generalization of the same discipline, built so that R6 and every future phase (Telemedicine, Dental, Patient Feedback, Physiotherapy, additional Ayurveda capabilities, Billing extensions) **plugs into one existing model** instead of inventing its own sixth diffuse mechanism (§2).

---

## 2. Problem Statement

A tenant's access to a feature today is decided by **at least six independent, unreconciled mechanisms**, each verified directly against the running backend codebase (§3), not assumed:

| # | Mechanism | Where it lives | What it answers |
|---|---|---|---|
| 1 | Hardcoded module→plan dict | `app/core/subscription_modules.py:58-63` (`SUBSCRIPTION_MODULES`) | "Which coarse modules does plan X include?" |
| 2 | DB column, same question, independent source | `org_subscription_plans.included_modules` (JSONB) | Same question as #1 — **a second, independent answer** |
| 3 | Permission-to-module tagging | `org_permissions.module` (string column), consumed by `PermissionSyncService.sync_tenant_permissions` | "Which permissions belong to which module, for RBAC sync purposes?" |
| 4 | Clinic-type template blob, feature A | `org_templates.enabledfeatures` (`list[dict]`) | "Which features does this clinic template turn on?" |
| 5 | Clinic-type template blob, feature B | `org_templates.featuresettings` (`dict`) | Same question as #4, **different shape, same row** |
| 6 | Clinic-type branching in application code | `OrgTenantsService.get_tenant_features` (`is_therapy_clinic = clinic_type in {"ayurveda","physio"}`) | "Which appointment/treatment-sheet settings does this clinic type get?" — hardcoded branch, not data |

...plus a **seventh, orthogonal mechanism already correctly scoped and not itself the problem** — the R1/R3B/R4 rollout feature flags (`freshness_v1_enabled`, `clinical_spine_v1_enabled`, `treatment_lifecycle_v1_enabled`, all in `app/core/config.py`) — which answer a genuinely different question ("is this already-decided engineering work safe to expose yet?") but are **bundled into the same `GET /tenants/{id}/features` response** as mechanisms #4–#6, blurring the boundary between "is this code ready" (an engineering-rollout concern with a defined removal criterion) and "is this tenant entitled to this feature" (a product/billing concern with no expiry).

No two of these seven answer the same question the same way, and no single one of them is authoritative for a new feature a future phase wants to add. Concretely, **mechanisms #1 and #2 can already drift** — nothing keeps `subscription_modules.py`'s hardcoded dict in sync with `org_subscription_plans.included_modules`; a plan edited via #2 (the DB) silently has no effect unless #1 (the Python file) is also hand-edited and redeployed. This is not a hypothetical risk — it is the exact shape of divergence R4's own `_repair_order_scheduling_states_for_tenant` (design.md §2.2/§3.3) existed to patch after the fact for a different diffuse-ownership problem; R5 exists to prevent this one from ever needing an equivalent repair job.

There is also a second-order symptom of the same root cause: `OrgTenant.subscription_plan` (a plain string column on the tenant row itself) and `OrgSubscription.plan_code` (the actual billing-integrated subscription record, with Razorpay IDs, billing cycle, and payment history) are **two independent answers to "what plan is this tenant on"**, with no enforced consistency link between them. `PermissionSyncService` reads the former; the actual billing/payment system presumably reads (or should read) the latter. Which one is authoritative is not documented anywhere in code.

### 2.1 Framing note

The field-level inventory above is evidence that **feature/capability ownership is diffuse** — it is a *symptom*, not this phase's primary target, exactly mirroring how R4's own §2 framed its seven status fields as symptoms of workflow-ownership diffusion rather than the disease itself. Read this section alongside §8 Area H (Ownership), which names the single owner this multiplicity is a consequence of not having.

---

## 3. Current-State Findings (verified from code, not assumed)

### 3.1 Entitlement, enablement, and authorization are three different questions, answered by different — and in places, no — owners today

| Question | Current owner(s) | Verified by |
|---|---|---|
| What could this tenant's plan *ever* unlock? (entitlement ceiling) | `org_subscription_plans.included_modules` (JSONB list of module code strings) **and independently** `app/core/subscription_modules.py`'s `SUBSCRIPTION_MODULES` dict | `org_subscription_plan.py:79-84`; `subscription_modules.py:58-63` |
| What subscription is this tenant actually on? | `OrgTenant.subscription_plan` (string) **or** `OrgSubscription.plan_code` (string, billing-linked) — two independent columns, no FK between them, no documented precedence | `permission_sync_service.py:67-71` reads the former; `org_subscription.py:38-44` defines the latter |
| What does a *new* tenant of clinic-type X start with? | `OrgTemplate.enabledfeatures` (`list[dict]`) **and** `OrgTemplate.featuresettings` (`dict`) — two fields on the same row, overlapping purpose, no documented boundary between them | `org_template.py:76,81` |
| What does *this specific tenant* currently have turned on, having possibly deviated from its template default? | **No dedicated owner exists.** `OrgTenantsService.get_tenant_features` recomputes a features shape from the template on every call; there is no tenant-level override table analogous to `tenant_permissions` for anything feature/capability-shaped | `org_tenants_service.py:102-145`; confirmed by contrast with the RBAC layer, which *does* have this (`TenantPermission`, §3.2) |
| Who is allowed to *perform* an action, once a feature is visible? | `org_permissions` / `org_role_permissions` (role defaults) / `tenant_permissions` / `tenant_role_permissions` (tenant-level ADD/REMOVE overrides) — a mature, already-correct model | `tenant_permission.py`, `tenant_role_permission.py` |
| Is the underlying *code* for a not-yet-fully-proven feature safe to expose at all? | `app/core/config.py`'s three `xxx_v1_enabled` rollout flags, each with a phase-specific ADR and (for R4) an explicit removal-criteria commitment | `config.py:94-134` |

### 3.2 The RBAC layer already solved the "tenant deviates from a default" problem — for permissions only

`TenantPermission` (`tenant_permission.py:17-27`) is a lightweight table that references a master catalog (`org_permissions`) and adds exactly one tenant-scoped fact: `is_active`. `TenantRolePermission` (`tenant_role_permission.py:1-14`) goes further — it stores **only the deltas** a tenant has made relative to its role's template defaults (`override_type = ADD | REMOVE`), computing the effective set as `(org_role_permissions ∪ ADD) \ REMOVE`.

**This is the exact shape R5's tenant-level capability enablement needs, and it already exists in this codebase for a sibling concern.** No equivalent exists for capabilities/features today — every "is this tenant's clinic-type X" or "is this tenant's plan Y" check is re-derived from scratch, per call, per consumer, with no cached, auditable, tenant-scoped "what did we actually decide for this tenant" record.

### 3.3 `PermissionSyncService` already implicitly couples subscription plan → module → permission — but through ad hoc filtering, not a declared model

`PermissionSyncService.sync_tenant_permissions` (`permission_sync_service.py:32-100`) reads the tenant's plan, resolves it to a module list via `OrgSubscriptionPlan.included_modules`, and filters `org_permissions` where `.module.in_(subscription_modules)` to decide which permissions a tenant should have. This is a real, working, **already-shipped** subscription-to-permission gate — but it is expressed as an imperative filter inside one service method, not as a declared, queryable, dependency-aware model another consumer (a future capability check in `appointments`, `inventory`, or a brand-new `telemedicine` module) could reuse without duplicating the same `.in_()` pattern a sixth time.

### 3.4 No dependency model exists between any of the above

Nothing in the current schema or code expresses "capability X requires capability Y to be enabled first." A future Physiotherapy module that logically depends on multi-day appointment support (R3B era) has no way to declare that dependency today; enabling one without the other is not detected, not prevented, and not surfaced to the tenant admin.

### 3.5 Correction from R4's own manual acceptance verification, generalized

R4's `CLOSURE-NOTES.md` and `requirements.md §3.7` established a durable lesson this document inherits directly: **shipping correct architecture is not the same as removing the actual duplication a user (there: a doctor; here: a platform engineer adding capability #7) experiences.** A technically-correct new `Capability` table sitting *alongside* the six mechanisms in §2, rather than *replacing* them, would repeat exactly the failure R4's §3.7 finding described for Case Sheet editors — "a perfect [capability] system on top of duplicate [entitlement] workflows." §9 (Migration Strategy) and Area G below exist specifically to prevent that outcome.

---

## 4. Scope

- **In scope:**
  - A single, hierarchical **Capability** domain model (catalog, dependency graph, entitlement, enablement) that becomes the one owner for "is feature X available to tenant Y, and is it currently turned on" (Area A/B).
  - A **pure, backend-computed Capability Resolver**, mirroring R4's own resolver discipline (never persisted as a competing writable field, side-effect-free, single source of the runtime answer) (Area C).
  - A **tenant-level capability override table**, modeled directly on the already-proven `TenantPermission`/`TenantRolePermission` shape (§3.2), replacing the "no dedicated owner" gap in §3.1 (Area B).
  - Formal **reconciliation** of mechanisms #1–#6 (§2) into the new model, additive-first, with explicit retirement criteria for each old mechanism once parity is proven (Area D/G — mirrors R4 ADR-R4-04's flag-removal-criteria discipline exactly).
  - A **dependency graph** with cycle prevention at both declaration time and resolution time, kept distinct from catalog hierarchy (Area E, FR-E4).
  - Composition (not merging) with the existing, already-correct RBAC authorization layer, including entitlement-loss re-synchronization (Area F).
  - **Entitlement-loss behavior** on downgrade/expiry/cancellation (Area I), **toggle concurrency/idempotency/audit** (Area J), and **catalog identity/lifecycle** discipline (Area K).
  - Backend API surface (`GET /tenants/{id}/capabilities`, admin toggle endpoint, catalog endpoint) with the full distinct-field response (FR-H4) and a frontend `useCapabilities()`/`<CapabilityGate>` pairing that invalidates on its own mutation (FR-H2), mirroring the existing `useFeatures()` fetch-once-per-session convention (Area H).
  - A migration/backward-compatibility plan for every existing consumer of mechanisms #1–#6, with the two-state exit (§16) making the "one mechanism" destination compatible with a bounded read-only deprecation window (Area G).
  - Extensibility proof: at least one worked example (not a new production capability — see N-3) showing a future phase can register a new capability, declare its dependencies and plan eligibility, and have it resolve correctly, using only the platform this phase ships (§20).

- **Out of scope (this phase does not do) — see §5 for the full Non-Goals list.**

---

## 5. Out of Scope — Non-Goals

**Correction, binding on every non-goal below (mirrors R4 §5's own binding correction):** backward compatibility means *"existing data keeps working"* and *"the API keeps working during migration"* — it does **not** mean *"every old mechanism stays forever."* Mechanisms #1–#6 (§2) are explicitly in scope for **reconciliation and eventual retirement** (Area G) once parity is proven; "it might break something" is a prompt to prove parity, not a reason to leave a sixth diffuse mechanism permanently in place.

- **N-1. No RBAC/permission-model redesign.** `org_permissions`/`org_role_permissions`/`tenant_permissions`/`tenant_role_permissions` are a dependency this phase builds on and composes with (§8 Area F), not something it redesigns. Capability answers "is this visible/available"; RBAC continues to answer "is this user allowed" — two axes, composed, never merged into one table or one check.
- **N-2. No subscription billing, payment, or plan-management redesign.** `OrgSubscription`/`OrgSubscriptionPlan`/Razorpay integration are consumed as an existing input (the entitlement ceiling, §8 Area A) — R5 does not touch billing cycles, payment processing, or plan CRUD beyond adding the new capability-linkage join table (§13).
- **N-3. No implementation of any specific future capability's clinical or business logic.** Telemedicine video consults, Dental workflows, Patient Feedback collection, additional Physiotherapy/Ayurveda capabilities, Billing extensions — none of these are built by this phase. This phase builds the platform those future phases register into. Any example capability referenced in this document or `design.md` is illustrative only, per the user's own explicit instruction: *"Do NOT simply describe capabilities. Design a reusable Capability Platform."*
- **N-4. No retroactive migration of R1–R4's own rollout flags into the Capability model.** `freshness_v1_enabled`, `clinical_spine_v1_enabled`, `treatment_lifecycle_v1_enabled` answer a different question (engineering rollout safety, §3.1) than Capability answers (tenant entitlement/enablement) — see ADR-R5-05. They are read as one *input* to a mid-rollout capability's resolver where relevant, never absorbed into the Capability catalog itself.
- **N-5. No tenant-authorable custom capabilities.** The Capability catalog is platform-curated (added by engineering, via migration, per phase) — tenants and clinic admins choose *whether to enable* an existing catalog entry (within what their plan allows), not define new ones. Tenant-authored capabilities are a plausible future extension explicitly deferred, not foreclosed (§16 Future Extensibility).
- **N-6. No real-time capability-change propagation (websockets/push).** A tenant admin's toggle takes effect on the next fetch (mirrors `useFeatures()`'s own existing fetch-once-per-session precedent, §8 Area H) — not instantaneously to already-open sessions. A future phase may add push invalidation; this phase does not.
- **N-7. No UI for the platform-level capability catalog itself (a super-admin "manage all capabilities across all tenants" screen) beyond the minimum admin toggle surface needed for a single tenant's own capabilities.** A cross-tenant capability-catalog management console is a plausible future extension, not this phase's deliverable.
- **N-8. No mandatory data migration/backfill without an explicit, separately reviewed migration plan** (mirrors R4 N-6 verbatim). Any backfill this phase proposes (§13) requires its own approved plan before implementation, not an assumed big-bang cutover.
- **N-9. No removal of any of the six existing mechanisms (§2) as a precondition for `design.md`.** Whether/when each is physically retired is `design.md`'s and `tasks.md`'s decision, gated on proven parity (Area G) — this document does not foreclose that timeline.

---

## 6. Constitutional References

| Doc | Sections used |
|---|---|
| Doc 01 — Product Vision | §4.1 Clinical First; §4.4 Long-Term Maintainability |
| Doc 04 — Clinical Experience Constitution | §21 UX Evolution Principles (Consolidate/Standardize classification, reused here for Area G's mechanism-retirement discipline) |
| Doc 05 — Capability & Access Model (content per prior phases' own citations; original file not locally accessible, §"Known reading-scope gaps" above) | Role/capability boundary language R4 already cited as "role boundaries this phase must not redesign" — extended here to the capability/permission axis split (N-1) |
| Doc 06 — Solution Architecture Constitution | §5 Domain Ownership; §7 State Ownership; §8 Server-State Strategy; §9 Navigation Independence |
| Doc 07 — Product Evolution Roadmap | §3 Evolution Principles (Production First, Backward Compatibility, No Big-Bang); Evolution Without Rewrite |
| R3B — `requirements.md`/`design.md`/`CLOSURE-NOTES.md` | ADR-R3B-04 flag-adoption precedent this phase's own flag (§13) mirrors; MIG-2 flag-removal-criteria gap R4 already closed once and this phase closes again for its own flag |
| R4 — `requirements.md`/`design.md`/`CLOSURE-NOTES.md`/`BACKEND-STATE-OWNERSHIP.md` | §1's "one X owner" founding-sentence pattern (reused verbatim in §1 above); §3.7 manual-acceptance-verification lesson (reused in §3.5); ADR-R4-02 resolver discipline (reused in §8 Area C); ADR-R4-03 additive-only/demote-don't-delete discipline (reused in §9); ADR-R4-04 flag-removal-criteria discipline (reused in §13); ADR-R4-05 ownership-table-gates-implementation discipline (reused in §10/§14 EG-6) |

---

## 7. Business Outcomes

- **BO-1 — One entitlement, one enablement, one runtime answer, everywhere.** Every consumer (backend service, frontend screen, a future phase's own new module) reads the same, single, trustworthy capability state, computed once, not re-derived per call. *(§2, §3.1.)*
- **BO-2 — No more silent entitlement drift.** The `subscription_modules.py`-vs-`included_modules` divergence risk (§2, finding #1/#2) is resolved by a single, DB-backed catalog with one relational join table, not two independently-editable sources. *(§13.)*
- **BO-3 — A new phase can add a capability without inventing a seventh mechanism.** Any future phase (Telemedicine, Dental, additional Ayurveda/Physiotherapy capabilities, Billing extensions, Patient Feedback) registers into the existing catalog, dependency graph, and resolver — it does not add a new template-blob field, a new hardcoded dict, or a new ad hoc `.in_()` filter. *(§20 proves this with a worked example.)*
- **BO-4 — Ownership clarity for every future phase.** Any future feature touching entitlement/enablement/dependency has exactly one place to read from and one place to write to, per concern (§10 ownership table, finalized in `design.md`).
- **BO-5 — Visibility and authorization stay two composed axes, never one merged check.** A capability being off hides the feature; RBAC continues to independently gate the action if somehow reached — defense in depth, matching the existing, already-correct RBAC discipline (N-1).
- **BO-6 — Safe to ship, safe to undo.** Like R4 before it (the first R3/R4-series phase to touch backend-owned data), this phase's migration and rollback plan (§13) lets the platform revert without data loss, without touching Phase 1–4 work, and without breaking any of the six existing mechanisms mid-migration.
- **BO-7 — Subscription and clinic-type entitlement stop being expressed as code branches.** `OrgTenantsService.get_tenant_features`'s `is_therapy_clinic = clinic_type in {"ayurveda","physio"}`-style branching (§2, finding #6) is superseded by data-driven capability-plan/template linkage — closing the exact "no clinic-specific branching" requirement this phase was commissioned under.

---

## 8. Functional Requirements

**Area A — Capability Catalog & Entitlement Ceiling**
- **FR-A1.** A single, hierarchical Capability catalog SHALL exist as the one owner of "what capability, coarse or fine-grained, could ever exist in this product" — no second catalog, dict, or template-blob key SHALL be introduced as an alternative registration point once this phase ships (§9 Migration Strategy governs the transition of the six existing mechanisms into this one).
- **FR-A2.** Each subscription plan SHALL declare its capability entitlement ceiling via a relational join to the catalog (FR-A1), replacing the informal `included_modules` JSONB list and the hardcoded `subscription_modules.py` dict as the two mechanisms are retired per Area G. The JSONB list itself is not deleted by this phase (N-8/BC-2) — it becomes backward-compat-only.
- **FR-A3.** The duplication between `OrgTenant.subscription_plan` and `OrgSubscription.plan_code` (§3.1) SHALL be resolved into **exactly one authoritative "active subscription/plan resolution contract"** before the capability resolver (Area C) is implemented — mirrors R4 FR-A3's own duplicate-`AppointmentStatus`-enum resolution requirement, applied here to subscription-plan-reference duplication. This requirement does **not** predetermine that either existing string field remains the final authority; `design.md`'s subscription-lifecycle audit (§12 ADR-R5-03) SHALL resolve *what* the authority is (a relationship to the active `OrgSubscription`, a dedicated resolution function, or another existing billing-owned construct — never a redesign of billing itself, N-2). The contract SHALL satisfy all of:
  - **FR-A3a.** It SHALL define one deterministic answer to "what plan governs this tenant's entitlement right now," explicitly handling every subscription lifecycle state observable in the existing schema — **no active subscription, `expired`, `cancelled`, `suspended`, `trial`, `pending`, and multiple historical subscription rows for one tenant** (`OrgSubscription.status` already enumerates `active|cancelled|suspended|expired|trial`, and a tenant may accumulate multiple rows over time). The contract SHALL specify which row wins when several exist, and what the entitlement ceiling is when none is active (candidate: fall back to a defined minimum, e.g. the `CORE`-equivalent capability set — `design.md`'s decision).
  - **FR-A3b.** Any compatibility projection retained for backward compatibility (e.g. keeping `OrgTenant.subscription_plan` populated as a demoted mirror, per ADR-R5-03) SHALL be kept consistent with the authority either by **transactional synchronization** (updated in the same transaction as the authoritative source) or by being **demoted to a computed/read-only projection** of it — never left as a second independently-writable field that can silently drift again (this is the exact drift §2.4 documents; the contract exists to make that drift structurally impossible, not merely discouraged).
  - **FR-A3c.** No downstream consumer (the resolver, `PermissionSyncService`, or any future phase) SHALL choose between the two fields independently — every consumer reads the single contract's answer, mirroring FR-C3's own no-independent-re-derivation discipline.

**Area B — Capability Enablement (Template Defaults + Tenant Overrides)**
- **FR-B1.** A tenant-level capability enablement record SHALL exist, modeled directly on the proven `TenantPermission` shape (§3.2) — referencing the catalog (FR-A1), carrying exactly the tenant-scoped facts needed (`is_enabled`, source, audit fields) and no duplicated catalog metadata.
- **FR-B2.** A new tenant's initial capability enablement SHALL be seeded from its clinic template's capability defaults, superseding `OrgTemplate.enabledfeatures`/`featuresettings` (§2, findings #4/#5) as those two ambiguous fields are retired per Area G. **A later change to a clinic template SHALL NOT silently overwrite a tenant's own subsequent capability decisions.** `design.md` SHALL decide and document (ADR-R5-08):
  - **FR-B2a.** Whether template defaults are **snapshotted at tenant-creation** (the tenant owns an independent copy from that point) or **continuously inherited** (the tenant follows template changes unless it has explicitly overridden a given capability) — and the effective answer SHALL be explainable and auditable, not emergent from seeding-order accidents.
  - **FR-B2b.** How an explicit tenant override (`source='admin_override'`, FR-B1) is distinguished from an inherited/seeded default (`source='template_default'`) at every point where the two could diverge — so "did the tenant decide this, or did they inherit it" always has a recorded answer.
  - **FR-B2c.** How a **newly introduced catalog capability** (added by a future phase after existing tenants were created) receives a default for those already-existing tenants — without clobbering any decision they have already made about other capabilities.
  - **FR-B2d.** How re-seeding (whether on template change, catalog addition, or a re-run of the seeding task) remains **idempotent** — running it twice produces the same result as running it once, and never resurrects a capability the tenant deliberately disabled.
- **FR-B3.** A tenant admin (with the appropriate new RBAC permission, Area F) SHALL be able to enable/disable any capability within what their plan's entitlement ceiling (Area A) and the capability's dependency graph (Area E) allow — and SHALL receive a clear, structured reason when a toggle is rejected (not entitled, or a dependency is unmet, or a dependent capability blocks a disable). Concurrency, idempotency, and audit obligations for this write path are specified in Area J.
- **FR-B4.** The tenant enablement record (FR-B1) SHALL carry enough provenance (`source`, actor, timestamps — Area J) that the answer to "why is this capability in this state for this tenant" is always reconstructable from stored data, never inferred.

**Area C — Capability Resolver (single runtime authority)**
- **FR-C1.** A single, backend-computed, **pure, read-only** Capability Resolver SHALL exist, producing the single effective state (see FR-H4 for the full field set) for every capability for a tenant, from these inputs only: the entitlement ceiling (Area A), the authoritative active-plan answer (FR-A3), the tenant's enablement record (Area B), the catalog + dependency graph (Area E), and — only where a capability is explicitly mid-rollout (ADR-R5-05) — an **already-resolved rollout condition passed in as a plain immutable value**. The resolver SHALL NOT mutate any of its inputs (mirrors R4 NFR-3/OW-2 verbatim). **The resolver is a domain-layer module and SHALL NOT itself read environment/configuration/flag state, a database, FastAPI/request context, or localization** — see NFR-8. Infrastructure/application code reads any rollout configuration and passes a plain boolean (or equivalent immutable value) into the resolver; the domain layer never reaches out for it. This preserves the exact architecture correction R4's own architecture review applied to `treatment_lifecycle_resolver.py`.
- **FR-C2.** The resolver's computation rule SHALL be documented (not just implemented), mirroring R4 FR-B2's own "why does this show this status" traceability requirement, applied here to "why is this capability available/unavailable/enabled/disabled."
- **FR-C3.** Once the resolver exists, every consumer currently re-deriving an entitlement/enablement answer independently (§2's six mechanisms, and any future phase that would otherwise be tempted to add a seventh) SHALL be re-pointed to consume it rather than re-deriving the same logic — mirrors R4 FR-B4's own re-pointing requirement for its own resolver.
- **FR-C4.** The resolver's output is a **derived value computed once per request/query execution** (§1's "computed once" clarification), never persisted as an independently-writable effective-state table (OW-2). Caching of the resolver's *inputs* (e.g. the rarely-changing catalog/graph) at the application layer is permitted for performance (NFR-5) and does not violate this requirement — the resolver itself remains a pure recomputation over whatever inputs it is handed.

**Area D — UI/API Language & Shape Alignment**
- **FR-D1.** The capability API response SHALL expose task-oriented, human-readable reasons for unavailable/disabled states (e.g. "Requires the Professional plan," "Requires Multi-Day Appointments to be enabled first"), not raw enum/error codes, consistent with this product's existing Doc 03 §19 task-language convention (already reused by R3B/R4 for treatment status labels).
- **FR-D2.** Every frontend screen currently gating a feature via an ad hoc clinic-type or subscription-plan check SHALL, after this phase, be backed by the single resolver rather than re-implementing its own gate — this phase itself only needs to prove the mechanism (§20); re-pointing every existing ad hoc gate is explicitly sequenced into Area G/`tasks.md`, not assumed complete on `design.md` approval alone.

**Area E — Dependency Graph**
- **FR-E1.** A capability MAY declare one or more dependencies on other capabilities. The dependency graph SHALL be a Directed Acyclic Graph — a cycle SHALL be rejected at declaration time (when a dependency edge is added) and defensively detected (fail-closed, not infinite-loop) at resolution time (FR-C1), mirroring this document series' own repeated "verify, don't assume" discipline.
- **FR-E2.** The resolver (Area C) SHALL treat a capability as unavailable if any of its declared dependencies are unavailable or disabled for that tenant, and SHALL surface which dependency is blocking (FR-D1).
- **FR-E3.** Disabling a capability that other currently-enabled capabilities depend on SHALL be rejected by default (FR-B3), not silently cascade-disabled — a future phase MAY add explicit cascading as an opt-in admin action; this phase does not build it (see Non-Goals discipline — not listed as a formal N- item because it is a deferred *design* choice for `design.md` to record, not a scope boundary requirements.md forecloses).
- **FR-E4.** **Catalog hierarchy (parent/child) and dependency (operational prerequisite) are two distinct meanings and SHALL NOT be conflated.** Hierarchy expresses classification / coarse-to-fine grouping / ownership; a dependency edge expresses "this capability cannot function unless that one is available." A child capability SHALL NOT automatically be treated as *depending on* its parent unless `design.md` explicitly chooses and documents that rule (ADR-R5-09). If `design.md` does adopt an implicit parent→child dependency, that rule SHALL be stated as an explicit, documented resolver rule with its own test — never left as an unstated, emergent behavior of the hierarchy field. This requirement exists specifically to prevent the hierarchy from silently becoming a second, undocumented dependency mechanism (which would itself be a new §2-style diffuse-ownership problem).

**Area F — Composition with RBAC (not merging)**
- **FR-F1.** Capability (visibility/availability, Areas A–C) and Permission (authorization, existing RBAC) SHALL remain two independently-owned, composed concerns. No new table or check introduced by this phase SHALL merge them into a single row or a single boolean.
- **FR-F2.** New RBAC permissions this phase requires (at minimum, "manage tenant capabilities") SHALL be seeded via migration into the existing `org_permissions` catalog, following the exact pattern already established by every prior phase's own permission-seeding migrations (e.g. R4's `treatment_sheet.release`/`treatment_order.hold`/`treatment_sheet.review`) — not a parallel permission mechanism.
- **FR-F3.** `PermissionSyncService`'s existing subscription-plan→module→permission filtering (§3.3) SHALL be re-pointed to consume the new capability entitlement model (Area A) once the reconciliation (Area G) proves parity, rather than continuing to filter on the informal `.module` string tag independently.
- **FR-F4.** **Scope ownership SHALL be explicit and enforced:** the capability **catalog**, **dependency edges**, and **plan→capability entitlement definitions** are platform/global-scoped (no `tenant_id`); **tenant enablement and the resolved effective state** are tenant-scoped. A tenant-admin API SHALL be able to mutate **only** its own tenant's enablement records — it SHALL NOT be able to create, edit, delete, or re-point any catalog row, dependency edge, or plan-entitlement definition (those are platform-engineering-owned, mutated by migration/seeding only per §5's ownership table). Any attempt to do so via a tenant-admin surface SHALL be rejected as an authorization failure, not silently ignored.
- **FR-F5.** When a tenant's entitlement changes such that a previously-available capability becomes unavailable (Area I), the permission-synchronization path (§3.3) SHALL be re-evaluated so that **no privileged action gated behind that capability is left accidentally available** through a stale permission grant — closing the NFR-7 privilege-escalation concern for the *entitlement-loss* direction specifically, not only the enable direction.

**Area G — Reconciliation & Retirement of the Six Existing Mechanisms**
*Problem (§2/§3.5): a phase that adds a technically-correct new model alongside six old ones, without retiring any of them, has only added a seventh diffuse mechanism. This area exists to prevent that outcome, mirroring R4's own Area G discipline exactly.*
- **FR-G1.** Each of the six mechanisms identified in §2 SHALL be classified into exactly one of: **(A) Superseded, parity proven, retired** — mirrors R4 FR-G2's classification (D); **(B) Superseded, parity proven, kept read-only for backward compatibility during a deprecation window** — mirrors R4's classification (B)/(C) combined, since these are data sources rather than screens; **(C) Not superseded this phase, explicit reason recorded.** No mechanism may remain unclassified (mirrors R4 N-8's "undecided is not a valid outcome" discipline exactly).
- **FR-G2.** Any mechanism classified (A) SHALL only be physically removed after its own parity-verification task (mirroring R4's own T-E.3 "parity verification before removal" discipline) confirms every existing consumer receives an equivalent or superior answer from the new model.
- **FR-G3.** Backward compatibility for this phase's Area G work means data keeps working and existing API contracts keep working during the migration window — it does not mean every old mechanism stays reachable forever (mirrors R4 FR-G3/N-8, restated for data-shape rather than screen-shape mechanisms).

**Area H — Frontend/Backend Interaction**
- **FR-H1.** A new `GET /tenants/{id}/capabilities` endpoint SHALL expose the resolver's (Area C) full effective-state map for a tenant. The existing `GET /tenants/{id}/features` endpoint SHALL remain unchanged in its current response shape for the duration of the migration window (FR-E1/E2-style backward compatibility, applied to this API), per Area G's classification of finding #6.
- **FR-H2.** A frontend `useCapabilities()` hook and a `<CapabilityGate>` (or equivalent) conditional-rendering primitive SHALL exist, mirroring the existing `useFeatures()` fetch-once-per-session convention (§3.1) rather than introducing a new frontend data-fetching pattern. **A successful admin toggle (FR-B3) SHALL invalidate/refetch the capability query in the initiating client** so that the same admin screen never shows stale state immediately after its own successful mutation. This is *not* real-time push and remains within N-6: other already-open sessions update on their next fetch or next session; only the client that performed the mutation is refreshed synchronously (the mutation response itself carries the re-resolved map, §12/FR-H1, so no extra round-trip is required).
- **FR-H3.** A tenant-admin-facing capability management surface (enable/disable, with the FR-D1 reasons surfaced) SHALL exist as a minimum viable admin UI — full catalog-curation UI is explicitly out of scope (N-7).
- **FR-H4.** The effective-state API response (FR-H1) SHALL expose these as **distinct fields**, never collapsed into a single boolean (collapsing them would recreate the exact entitlement-vs-enablement ambiguity §2 documents):
  - **catalog identity** — the capability's immutable machine key and its localized display label (Area K);
  - **entitled** — whether the tenant's active plan entitles this capability at all (Area A);
  - **tenant preference** — whether the tenant has enabled or disabled it (Area B), distinct from whether it is effectively usable;
  - **effective available** — the resolver's final availability verdict (entitled AND dependencies met AND not blocked by rollout);
  - **effective enabled** — available AND the tenant preference is on;
  - **blocked_reason (machine code)** — a stable machine-readable reason code when unavailable/blocked;
  - **blocked_reason (human)** — the localized human-readable reason (resolved at the API/application boundary, FR-D1 — never in the domain resolver, NFR-8);
  - **unmet dependencies** — the specific dependency code(s) blocking availability, when that is the cause;
  - **source** — where the current enablement/default came from (`template_default` vs `admin_override`, Area B), where relevant.
  Machine-readable reason codes SHALL remain stable across releases (they are a contract consumed by frontend gates and future phases); human-readable labels are localized at the API/application boundary, not in the domain resolver.

**Area I — Entitlement Change & Loss (downgrade, expiry, cancellation)**
*This area specifies what happens when a tenant loses entitlement to a capability that is still enabled at the tenant-preference level (e.g. a plan downgrade, subscription expiry/cancellation per FR-A3a, or a plan-entitlement definition change). The exact retention policy is a `design.md` decision (ADR-R5-10); the scenario itself SHALL NOT remain unspecified.*
- **FR-I1.** On the next authoritative resolution (FR-C1) after entitlement is lost, the capability's **effective availability SHALL become unavailable immediately** — there is no grace period at the resolver level (any grace/notice period is a billing concern, N-2, upstream of the resolver's inputs).
- **FR-I2.** The tenant's stored **preference** (FR-B1, "the tenant had this enabled") MAY be **retained** so the capability re-activates automatically on re-entitlement, **or** be **disabled**, according to an explicitly chosen, documented policy (ADR-R5-10). Whichever is chosen, `effective enabled` SHALL be false while unentitled regardless of the stored preference (FR-H4's field distinction makes this expressible without ambiguity).
- **FR-I3.** Loss of entitlement SHALL cause **no destructive deletion** of clinical or business data created while the capability was available (e.g. records authored under a now-unentitled capability are not deleted) — mirrors R4/N-8's own no-destructive-migration discipline, applied to the entitlement-loss path.
- **FR-I4.** Existing records created under the capability SHALL remain **readable** according to normal product and RBAC rules (a tenant does not lose read access to their own historical data because a capability lapsed) — subject to RBAC continuing to gate the reader independently (Area F).
- **FR-I5.** **Write** operations against a now-unavailable capability SHALL fail with a **structured entitlement reason** (FR-D1/FR-H4 machine code + human label), not a generic error and not a silent success.
- **FR-I6.** Permission synchronization (FR-F5) SHALL be re-evaluated on entitlement loss so no privileged action gated behind the lost capability is left accidentally performable (NFR-7).

**Area J — Toggle Concurrency, Idempotency & Audit**
- **FR-J1.** Enable/disable operations (FR-B3) SHALL be **idempotent** — enabling an already-enabled capability (or disabling an already-disabled one) is a well-defined no-op that returns the current state, never an error and never a duplicate record.
- **FR-J2.** Concurrent conflicting updates to the same tenant capability SHALL be protected by an **optimistic-version (or equivalent) concurrency policy** — mirroring the `version`/`If-Match` OCC pattern R4 and the existing treatment-order code already use (`VersionConflictError`, R4 `BACKEND-STATE-OWNERSHIP.md` §3) rather than inventing a new concurrency mechanism.
- **FR-J3.** Every enablement change SHALL record an **auditable actor, source, and timestamp** (who toggled it, whether via admin override / template seed / entitlement-loss policy, and when) — the provenance FR-B4 requires.
- **FR-J4.** Dependency validation (Area E) and the enablement write SHALL be **transactionally consistent** — the check and the write occur in one transaction so that a dependency's state cannot change between validation and persistence and leave an invalid enablement committed (this is exactly why FR-J2's concurrency control is required, not optional).
- **FR-J5.** A rejected toggle (not entitled, unmet dependency, blocked-by-dependent, or version conflict) SHALL return a **structured conflict/rejection response** (machine code + human label, FR-H4), never a silent failure or an unstructured 500.

**Area K — Catalog Identity & Lifecycle**
*A capability key becomes a long-lived contract consumed by plans, templates, APIs, frontend gates, and every future phase — its identity and lifecycle rules SHALL be as disciplined as any other public contract in this codebase.*
- **FR-K1.** Every catalog entry SHALL have an **immutable, namespaced machine key** (e.g. `appointments.multiday`, `treatment.clinical_review`) — stable for the life of the product, never renamed in place.
- **FR-K2.** **Localized/display labels SHALL be separate from the machine identity** — the label is presentation (localized at the API/application boundary, FR-D1/NFR-8), the key is contract; changing a label SHALL never change behavior.
- **FR-K3.** A retired machine key SHALL **never be reused** for a different capability (reuse would silently re-point every plan/template/gate that still references it).
- **FR-K4.** A referenced catalog entry SHALL be **deprecated, not destructively deleted** — removal requires first removing or re-pointing every plan-entitlement, dependency edge, and tenant-enablement reference to it (referential integrity, FR-K6), mirroring FR-K3's own contract-stability intent.
- **FR-K5.** Catalog entries SHALL have an **explicit lifecycle state** (at minimum `enabled` / `deprecated`) so a capability can be sunset without breaking existing references (a deprecated capability resolves deterministically — e.g. unavailable-with-reason — rather than vanishing).
- **FR-K6.** **Uniqueness and referential integrity SHALL be enforced at the schema level** — machine keys unique; every plan-entitlement, dependency edge, and tenant-enablement row references a real catalog entry (FK), so no dangling reference can exist.
- **FR-K7.** Where an API or UI enumerates capabilities, ordering SHALL be **deterministic** (an explicit `display_order` or equivalent, mirroring the existing `OrgSubscriptionPlan.display_order` convention) — never dependent on insertion order or hash iteration order.

---

## 9. Non-Functional Requirements

- **NFR-1. No regression to R1–R4 guarantees** — freshness, autosave, Persistent Context, the Clinical Spine/Timeline/canonical editors, R4's treatment lifecycle resolver and its own backward-compatibility guarantees, and the existing RBAC model's own correctness (§3.2).
- **NFR-2. No silent breaking change to any existing API consumer** of `GET /tenants/{id}/features` or any of the six existing mechanisms (§2) during rollout (FR-H1, Area G).
- **NFR-3. The capability resolver SHALL be deterministic and side-effect-free** — computing it SHALL NOT itself mutate any entitlement, enablement, or dependency record, mirroring R4's own NFR-3 verbatim, applied to this phase's resolver instead of R4's.
- **NFR-4. Rollback-safe.** This is a backend-data-owning phase (like R4 before it) — the migration plan (§13) SHALL make rollback possible without data loss or corruption, and without requiring R0–R4 work to be reverted (mirrors R4 NFR-4/MIG-2).
- **NFR-5. Resolver performance.** The resolver SHALL be safe to call on every relevant page load without a noticeable latency regression — dependency-graph traversal SHALL be bounded (no unbounded recursion; depth/size limits are a `design.md` decision) given the catalog is expected to remain in the tens-to-low-hundreds of entries, not thousands, for the foreseeable product horizon (§16).
- **NFR-6. Tenant isolation (OWASP broken-access-control).** Tenant-owned state (enablement records, resolved effective state) SHALL be tenant-scoped (`tenant_id` filter, no cross-tenant leakage) exactly as every existing tenant-owned table already is; platform-owned state (catalog, dependency edges, plan-entitlement definitions, FR-F4) is global and SHALL NOT be mutable through any tenant-scoped surface. Specifically: (a) the `tenant_id` a request operates on SHALL be derived from the authenticated context and **checked against any route/path tenant id**, rejecting a mismatch (a request-supplied id SHALL NOT override authenticated context); (b) no tenant-admin surface SHALL read or write another tenant's enablement or another tenant's resolved state; (c) the catalog-exposure API SHALL NOT leak internal rollout/configuration information (raw flag names/values, ADR-R5-05) — it exposes the *resolved* effective state and stable reason codes only (FR-H4), never the underlying rollout-flag plumbing.
- **NFR-7. No privilege escalation via capability toggles.** Enabling a capability SHALL NEVER itself grant a permission, and disabling/losing one SHALL NEVER leave a privileged action performable (FR-F5/FR-I6) — Area F's composition discipline is also a security boundary, not only an architectural one: a capability being "on" must never be mistaken by any future consumer for "this user may act," which the RBAC layer alone continues to decide.
- **NFR-8. Dependency direction (Clean Architecture).** The domain-layer capability resolver (FR-C1) SHALL NOT import or otherwise reach application config, environment/flag access, FastAPI/request context, database access, or localization. All such reads happen in infrastructure/application code, which passes plain immutable values into the resolver. This is the exact correction R4's own architecture review applied to `treatment_lifecycle_resolver.py` (moving localized-label lookup out of the domain module), restated here as a binding NFR so R5 does not re-introduce the coupling. Presentation → Application → Domain → Infrastructure; no layer reaches upward.

---

## 10. Ownership Requirements (binding on `design.md`)

- **OW-1.** `design.md` SHALL produce a definitive ownership table naming, for every one of the concerns in §3.1's table (entitlement ceiling, active subscription reference, template defaults, tenant enablement, authorization, rollout safety), exactly one owning entity/mechanism and exactly one authoritative field/computation — mirrors R4 OW-1 exactly, applied to this phase's own concerns.
- **OW-2.** The Capability Resolver (FR-C1) is a **read/presentation computation** over the owned entities (OW-1) — it does not itself become a new, competing, independently-writable capability-state field. It is computed from the authoritative owners, never written to directly by client code (mirrors R4 OW-2 verbatim).
- **OW-3.** Any entitlement/enablement-shaped field found during `design.md`'s own deeper audit and not already listed in §2/§3.1 SHALL be added to the ownership table before implementation proceeds (mirrors R4 OW-3).
- **OW-4.** `design.md` SHALL produce the **Capability Platform Ownership table** required by this phase's own ADR-R5-01 (§12) — owning entity, allowed writer, allowed reader, and a retirement classification (FR-G1) for each of the six existing mechanisms. **No implementation task may begin until this table exists and is approved** (EG-6, §14) — mirrors R4 OW-4/ADR-R4-05's implementation-gating discipline exactly.

---

## 11. Backward Compatibility Requirements

**Definition (binding, per §5's correction):** "backward compatible" in this document means (1) existing data keeps working, (2) existing API contracts keep working during the migration window, and (3) rollback remains possible. It does **not** mean every one of the six existing mechanisms must remain the source of truth forever — see Area G and N-9.

- **BC-1.** `GET /tenants/{id}/features` remains behaviorally unchanged for the duration of the migration window (mirrors R4 BC-1 discipline).
- **BC-2.** The six existing mechanisms' underlying columns/files (§2) remain readable for the duration of the migration window — they are not removed in the same change that introduces the new catalog/resolver (mirrors R4 BC-2).
- **BC-3.** Any existing filter/consumer of `PermissionSyncService`'s current module-filtering behavior (§3.3) continues to function, either unchanged or via an equivalent mapping onto the new capability model (mirrors R4 BC-3, applied to this phase's own consumer).
- **BC-4.** A mechanism classified (A) Superseded/retired under FR-G1 SHALL NOT be treated as a backward-compatibility violation on that basis alone — it is only a violation if it breaks existing data (BC-2) or an API contract still in use (BC-1/BC-3), mirroring R4 BC-4 exactly.

---

## 12. ADR Candidates (for `design.md` to resolve — not decided here)

- **ADR-R5-01 — Single hierarchical Capability model vs. separate Module + Capability entities.** Whether "module" (coarse, plan-level) and "capability" (fine-grained, tenant-toggle-level) become one self-referencing hierarchical entity (a top-level Capability with no parent *is* a module) or two separate catalog tables. This document's own current-state findings (§2, finding #4 vs #5 — two overlapping fields on one row) argue against introducing a second parallel concept; `design.md` must explicitly resolve this rather than silently defaulting to "add a second table because that's what modules and capabilities sound like."
- **ADR-R5-02 — Resolver input set and where the resolver lives.** Confirms/refines FR-C1's input list; decides whether the resolver is a pure domain module analogous to R4's `treatment_lifecycle_resolver.py`, or an application-service method — R4's own precedent (ADR-R4-02) is the default this ADR must explicitly keep or supersede.
- **ADR-R5-03 — Reconciling `OrgTenant.subscription_plan` vs `OrgSubscription.plan_code` (FR-A3).** Which becomes authoritative, and what happens to the other (demoted-but-kept, per ADR-R4-03's own precedent, or something else) — `design.md` must decide, this document only establishes that the duplication must be resolved.
- **ADR-R5-04 — Feature-flag adoption for the Capability Platform itself.** Mirrors R3B/R4's own MIG-2/ADR-R4-04 evaluation requirement: because this phase changes how every existing entitlement check ultimately resolves, `design.md` MUST evaluate whether a rollout flag (candidate name: `capability_platform_v1_enabled`) is warranted — almost certainly yes, given R4's own precedent for phases that touch backend-owned data for the first time in their series.
- **ADR-R5-05 — Capability vs rollout flag, formal boundary.** Resolves N-4 precisely: under what circumstance (if any) may a capability's resolver read an existing `xxx_v1_enabled` flag as one of its inputs, and what stops that from becoming a backdoor for a flag to masquerade as tenant-facing entitlement.
- **ADR-R5-06 — Cascading disable policy (FR-E3).** Whether a future phase's cascading-disable admin action is designed now (even if not built) or left fully open — `design.md`'s call, this document only establishes the default (reject, don't cascade) for what this phase itself ships.
- **ADR-R5-07 — Migration/backfill approach for the six existing mechanisms' historical data (Area G).** Whether reconciling `subscription_modules.py`, `included_modules`, `org_permissions.module`, `enabledfeatures`, and `featuresettings` into the new catalog requires a one-time backfill script, and what its idempotency/rollback story is — directly determines whether FR-G2's parity-verification task needs to account for historical data reconciliation or can treat the new catalog as purely additive-and-empty at first deploy.
- **ADR-R5-08 — Template-default seeding semantics (FR-B2).** Snapshot-at-tenant-creation vs. continuously-inherited defaults; how `template_default` vs `admin_override` provenance is recorded and distinguished; how a newly-added catalog capability defaults for already-existing tenants; and how re-seeding stays idempotent (never resurrecting a deliberately-disabled capability). The effective answer must be explainable and auditable, not emergent from seeding order.
- **ADR-R5-09 — Hierarchy vs. dependency semantics (FR-E4).** Whether catalog parent/child hierarchy implies an operational dependency at all, and if so, that implicit parent→child dependency rule SHALL be stated explicitly as a documented resolver rule with its own test — never left emergent. Default posture: hierarchy is classification/grouping only, dependency is a separate explicit edge; `design.md` must consciously affirm or override this.
- **ADR-R5-10 — Entitlement-loss retention policy (Area I).** On loss of entitlement while a capability is enabled, whether the tenant's stored preference is retained (auto-reactivate on re-entitlement) or disabled — with the binding invariant either way that `effective enabled` is false while unentitled (FR-I2), no data is destructively deleted (FR-I3), writes fail with a structured reason (FR-I5), and permission sync is re-evaluated (FR-I6). Scenario is mandatory; the policy choice is `design.md`'s.

---

## 13. Migration Strategy

Mirroring R4's own group structure, at the phase-planning level (task-level detail belongs to `tasks.md`, not this document):

- **Group G0 — Branch gate.** Confirm both repos' `dev` trees are clean; create `feature/r5-capability-platform` from `dev` in each repo (§14 EG-2/EG-3); record both branch/base-commit pairs before any implementation begins.
- **Group A — Ownership audit & catalog/graph model (Area H per this document's own §10, gates everything below).** Complete OW-1's ownership table; resolve ADR-R5-01 (single vs. dual entity model); classify all six existing mechanisms (FR-G1); produce and get the Capability Platform Ownership table (OW-4) approved. **Nothing in Group B onward may begin until this group's table is approved** (EG-6).
- **Group B — Catalog, dependency graph, entitlement schema (additive only).** New tables per §12's resolved ADRs, including catalog identity/lifecycle (Area K: immutable keys, lifecycle state, referential integrity, deterministic ordering); no destructive change to any of the six existing mechanisms' storage.
- **Group C — Resolver.** Implement the pure Capability Resolver (FR-C1–C4, incl. entitlement-loss resolution FR-I1/I2 and the FR-A3 active-plan contract), behind the flag (ADR-R5-04), unit-tested against every entitlement/enablement/dependency/loss combination the design specifies — mirrors R4 Group C's own resolver-implementation-and-test discipline.
- **Group D — Admin write path & RBAC composition.** Tenant admin enable/disable action (FR-B3) with concurrency/idempotency/audit (Area J), template seeding (Area B/ADR-R5-08), entitlement-loss policy execution (Area I/ADR-R5-10), new permissions (FR-F2), and `PermissionSyncService` re-pointing (FR-F3/F5).
- **Group E — API & frontend integration.** New endpoint (FR-H1), `useCapabilities()`/`<CapabilityGate>` (FR-H2), minimum admin UI (FR-H3), and the worked extensibility example (§20).
- **Group F — Reconciliation execution.** Execute Area G's classifications: parity-verify and retire/deprecate each of the six mechanisms per its recorded classification.
- **Group Z — Closure.** Documentation, ADR status updates, flag-removal criteria recorded (mirrors R4's own T-Z.2), the developer/product journey test (§20) result recorded, exit criteria.

**MIG-1.** No existing consumer of any of the six mechanisms (§2) SHALL be cut over to the new model until Group F's parity-verification proof passes for that specific mechanism.
**MIG-2.** Rollback of R5 work SHALL NOT require reverting R0–R4 commits.
**MIG-3.** Catalog/dependency-graph modeling and the ownership table (Group A) SHALL be decided **before** the resolver (Group C) is implemented, and the resolver SHALL exist **before** any of the six existing mechanisms are retired (Group F) — mirrors R4's own MIG-3 correction (classification and ownership before the resolver; resolver and backward-compat proof before retirement execution) applied to this phase's own group sequence.

---

## 14. Execution Governance (Branch Isolation)

- **EG-1.** R5 SHALL NOT be implemented directly on any shared branch (`dev`, `test`, `main`) in either repository. It is implemented on a dedicated feature branch per the finalized workflow: **`dev → feature/r5-capability-platform → test → validated test → dev`**.
- **EG-2.** Frontend branch: **`feature/r5-capability-platform`, created from the frontend repo's latest `dev`**, before any R5 frontend implementation task begins.
- **EG-3.** Backend branch: **`feature/r5-capability-platform`, created from the backend repo's latest `dev`**, before any R5 backend implementation task begins (this phase needs backend changes — new tables, resolver, endpoints). The frontend and backend branches share the same name but exist in separate repositories; they are coordinated by name, not by a shared git history.
- **EG-4. Branch gate** (Group G0 above) — confirm both repos' `dev` trees are clean, record the base `dev` commit in each repo, create `feature/r5-capability-platform` from `dev` in each, record both branch/base-commit pairs in `tasks.md`, stop for explicit approval before any code is written.
- **EG-5. Rollback requirement.** A failed R5 rollout SHALL be removable by reverting R5 work only (MIG-2).
- **EG-6. Ownership table gate.** No implementation task from Group B onward SHALL begin until the Capability Platform Ownership table (OW-4) exists and is explicitly approved — recorded in `tasks.md` exactly as the branch gate (EG-4) is recorded.

---

## 15. Acceptance Criteria

- **AC-1.** Every one of the six mechanisms identified in §2 has exactly one FR-G1 classification recorded — none left undecided. *(FR-G1, N-9.)*
- **AC-2.** A single Capability catalog exists and is the one place a new capability is registered — no second catalog/dict/blob-key registration point exists after this phase ships. *(FR-A1.)*
- **AC-3.** `OrgTenant.subscription_plan` vs `OrgSubscription.plan_code` duplication is resolved to exactly one authoritative source. *(FR-A3.)*
- **AC-4.** A tenant-level capability enablement record exists, modeled on `TenantPermission`, superseding the "no dedicated owner" gap identified in §3.1. *(FR-B1.)*
- **AC-5.** A single, pure, backend-computed resolver produces the effective capability state for a tenant; it is never bypassed by a re-derived, independent check anywhere this phase touches. *(FR-C1, FR-C3.)*
- **AC-6.** The dependency graph rejects a cycle at declaration time and fails closed (not infinite-loops, not crashes) if one is ever defensively detected at resolve time. *(FR-E1.)*
- **AC-7.** Capability and Permission remain two composed, never-merged concerns; no new table or check conflates "visible" with "allowed." *(FR-F1, NFR-7.)*
- **AC-8.** No existing API consumer of `GET /tenants/{id}/features` or any of the six mechanisms broke during rollout. *(NFR-2, BC-1..3.)*
- **AC-9.** Rollback of R5 is possible without touching R0–R4 work. *(MIG-2, EG-5.)*
- **AC-10.** The branch gate (EG-4) passed and is recorded in `tasks.md` before any implementation began. *(AC-8 mirrors R4 AC-8 pattern.)*
- **AC-11.** The Capability Platform Ownership table (OW-4) exists and was approved before any Group B (schema) implementation task began, confirmed by the `tasks.md` record required by EG-6.
- **AC-12.** A future phase can register a new capability (extensibility proof, §20) using only the platform this phase ships — no new hardcoded dict, template-blob field, or ad hoc filter was required to do so.
- **AC-13.** Every new table and the resolver itself are tenant-scoped with no cross-tenant leakage path. *(NFR-6.)*
- **AC-14.** No capability toggle, by itself, ever grants or revokes a permission. *(NFR-7.)*
- **AC-15.** After R5 implementation exit, **no old mechanism (§2) remains an independent writer** of entitlement/enablement state — there is exactly one authoritative write path and one resolver; any surviving old mechanism is a classified, time-bounded, read-only compatibility projection only. *(FR-G1, §16 two-state split.)*
- **AC-16.** Template changes after tenant creation do not silently overwrite a tenant's own capability decisions; `template_default` vs `admin_override` provenance is recorded and distinguishable, and re-seeding is idempotent (never resurrects a deliberately-disabled capability). *(FR-B2a–d.)*
- **AC-17.** On entitlement loss, effective availability becomes unavailable on the next resolution, no clinical/business data is destructively deleted, existing records remain readable per RBAC, writes fail with a structured entitlement reason, and no privileged action is left performable. *(FR-I1–I6, FR-F5.)*
- **AC-18.** Toggles are idempotent, guarded by optimistic concurrency, transactionally validate dependencies-and-write together, record actor/source/timestamp, and return structured conflict responses on rejection. *(FR-J1–J5.)*
- **AC-19.** Catalog keys are immutable, namespaced, never reused; catalog entries have an explicit lifecycle state; referential integrity is schema-enforced; and any enumerating API/UI orders deterministically. *(FR-K1–K7.)*
- **AC-20.** Catalog hierarchy does not act as an implicit dependency unless `design.md` explicitly documents that rule with its own test. *(FR-E4, ADR-R5-09.)*
- **AC-21.** A successful admin toggle refreshes the initiating client's own capability view immediately (via the mutation's re-resolved response), without WebSockets/push and without staleness on that screen. *(FR-H2, N-6.)*

**Negative security acceptance criteria** (explicit tests, mirroring R4's own security-review discipline — an architecture pass alone does not satisfy these):

- **AC-SEC-1.** A tenant admin **cannot read or toggle another tenant's** capabilities — a cross-tenant attempt is rejected, not silently scoped-away. *(NFR-6.)*
- **AC-SEC-2.** A user with a capability **enabled but without the RBAC permission cannot perform** the action. *(FR-F1, NFR-7.)*
- **AC-SEC-3.** A user with the RBAC permission **but the capability unavailable cannot perform** the capability-gated action. *(FR-F1, FR-I5.)*
- **AC-SEC-4.** Toggling a parent/category capability **does not accidentally grant any child's permissions** (composition, not merging; hierarchy is not authorization). *(FR-E4, FR-F1, NFR-7.)*
- **AC-SEC-5.** A **request-supplied tenant id cannot override the authenticated tenant context** — a mismatch between path/body id and token id is rejected. *(NFR-6.)*

---

## 16. Success Metrics

**Two measurable exit states (resolves the migration-window/BC/N-8/FR-G1-classification-B tension — the "one mechanism" destination is real but is reached in two stages, not one):**

**State 1 — R5 implementation exit** (this phase's own Definition of Done, §19):

| Metric | Target | Verified by |
|---|---|---|
| Authoritative **write paths** for entitlement/enablement state | 1 (currently 6 independent writers, §2) | Code-level review |
| Compatibility **readers** still in use | Only those classified (FR-G1-B) and time-bounded — each with a recorded owner, removal criterion, and deadline | `design.md`'s classification table |
| Old mechanisms remaining an **independent writer** | 0 | Code-level review (AC-15) |
| Documented ownership per entitlement/enablement concern | 100% (currently 0, §3.1) | `design.md`'s ownership table (OW-1) |
| Subscription-plan-reference sources considered authoritative | 1 contract (currently 2 columns, §3.1/FR-A3) | Code-level grep |
| Mechanisms with an FR-G1 classification recorded | 100% of the six (§2) | `design.md`'s classification table |
| Existing API consumers/filters broken by rollout | 0 | Full regression + explicit BC check (mirrors R4 AC-8) |
| Rollback dependency on R0–R4 work | 0 | Rollback drill, if performed |
| New capability registrations requiring a code change to a mechanism *other than* the catalog/graph/entitlement tables | 0 | §20 worked example, verified at exit review |
| Cross-tenant capability-state leakage paths | 0 | Security review (NFR-6, AC-SEC-1/5) |
| Capability toggles that also silently changed a permission | 0 | Security review (NFR-7, AC-14, AC-SEC-2/3/4) |

**State 2 — Flag/removal exit** (a later milestone, gated on `capability_platform_v1_enabled`'s recorded removal criteria — mirrors R4's own flag-removal-exit being distinct from its implementation exit):

| Metric | Target | Verified by |
|---|---|---|
| Independent, unreconciled entitlement/enablement mechanisms in **active use** (readers or writers) | 1 | Code-level review |
| Compatibility mechanisms **retired, or demonstrably read-only with an owner + removal criterion + deadline** | 100% of those classified FR-G1-B at State 1 | Deprecation-ledger review |
| The `capability_platform_v1_enabled` flag | Removed once its recorded criteria are met | Flag-removal task (mirrors R4 ADR-R4-04) |

---

## 17. Traceability Matrix

| Requirement | Constitutional/Prior-Phase basis | Current-State Finding |
|---|---|---|
| FR-A1..A2, OW-1..3 | Doc 05 (per prior-phase citations); R4's own "one owner" founding sentence, generalized | §2, §3.1 |
| FR-A3, FR-A3a..c, ADR-R5-03 | R4 FR-A3 duplicate-enum-resolution discipline; billing-owned, N-2 boundary | §2.4, §3.1 |
| FR-B1..B4, ADR-R5-08 | R1's `TenantPermission`/`TenantRolePermission` precedent (§3.2), reused not redesigned | §3.1, §3.2 |
| FR-C1..C4, ADR-R5-02, NFR-8 | R4 ADR-R4-02 resolver discipline + R4's own architecture-review dependency-direction correction, reused | §3.1, §3.3 |
| FR-D1, FR-D2 | Doc 03 §19 task-language convention, already reused by R3B/R4 | §8 Area D |
| FR-E1..E4, ADR-R5-06, ADR-R5-09 | — (new to R5; no prior-phase precedent for dependency graphs/hierarchy split) | §3.4 |
| FR-F1..F5 | Doc 05 role-boundary discipline (N-1); R4's own composition-not-merging pattern (capability vs. permission mirrors R4's status-resolver-vs-RBAC boundary) | §3.2, §3.3 |
| FR-G1..G3, BC-1..4, N-9 | R4 Area G / FR-G1..G5 discipline, reused verbatim for data-shape mechanisms instead of screens | §3.5, §2 |
| FR-H1..H4 | R3B/R4's `useFeatures()`/`get_tenant_features` precedent, extended not replaced | §3.1 |
| FR-I1..I6, ADR-R5-10 | R4/N-8 no-destructive-migration discipline, applied to the entitlement-loss path (new scenario) | §3.1 |
| FR-J1..J5 | R4/existing treatment-order OCC (`version`/`If-Match`/`VersionConflictError`), reused not reinvented | §3.2 |
| FR-K1..K7 | Existing `OrgSubscriptionPlan.display_order`/catalog conventions; contract-stability discipline (new) | §2 (findings #1–#5) |
| EG-1..EG-6, AC-10, AC-15 | Finalized `dev → feature/... → test → validated test → dev` workflow; R3B/R4 ownership-gate precedent | §13, §14 |
| NFR-6, NFR-7, NFR-8, AC-13, AC-14, AC-SEC-1..5 | OWASP broken-access-control/privilege-escalation; Clean Architecture dependency direction; this document's explicit security requirements | §9 |

---

## 18. Dependencies

- **R4 must be closed out** before the R5 branch gate (EG-4) — this phase does not depend on R4's own domain content (treatment lifecycle) but does depend on R4's precedent-setting governance discipline (resolver pattern, ownership-table gate, flag-removal criteria) being the established convention this document repeatedly reuses rather than re-derives.
- **The existing RBAC model** (`org_permissions` through `tenant_role_permissions`) is a hard constraint this phase composes with, not redesigns (N-1).
- **The existing subscription/billing model** (`OrgSubscription`/`OrgSubscriptionPlan`) is a hard constraint this phase consumes, not redesigns (N-2).
- **Doc 05's full original text** is not locally available (§"Known reading-scope gaps"); this phase relies on its content as already embedded in approved prior-phase specs. Should the original become available, reconcile before `design.md` is finalized.

---

## 19. Definition of Done

- All Functional Requirements (§8) implemented and verified against their own oracle.
- All Acceptance Criteria (§15) objectively met.
- All Success Metrics (§16) at target.
- No Non-Goal (§5) quietly implemented — verified by an explicit negative check, mirroring R3B/R4's own T-E.3/T-E.4 discipline.
- No R1–R4 trust or backward-compatibility guarantee regressed.
- The branch gate (§14 EG-4) passed and is recorded in `tasks.md` before implementation began (AC-10) — both repos branched `feature/r5-capability-platform` from `dev`.
- ADR-R5-01 through **R5-10** (§12) resolved in `design.md` with explicit status.
- Documentation updated: the Capability Platform Ownership table (OW-4) finalized; migration/rollback plan (§13) recorded as executed or explicitly deferred with reason.
- Every one of the six existing mechanisms identified in §2 has an FR-G1 classification recorded — none left as "undecided" (N-9, AC-1) — and **State 1 exit** (§16) is met: exactly one authoritative write path, no old mechanism remaining an independent writer (AC-15).
- Every feature flag this phase introduces has recorded removal criteria (mirrors R4 FR-G4 discipline, applied to `capability_platform_v1_enabled`) — the **State 2 / flag-removal exit** (§16) is defined even though its completion is a later milestone.
- Template-seeding semantics (FR-B2/AC-16), entitlement-loss behavior (Area I/AC-17), toggle concurrency/idempotency/audit (Area J/AC-18), and catalog identity/lifecycle (Area K/AC-19) are all implemented and verified against their own oracles.
- The §20 extensibility proof has been run against the shipped platform and passed — an architecture-test pass alone does not satisfy this item on its own, exactly as R4's own §19/§20 established for its own journey test.
- The Capability Platform Ownership table (OW-4) was approved before any Group B (schema) implementation task began, confirmed by the `tasks.md` record required by EG-6 (AC-11).
- No cross-tenant leakage, no capability-toggle-grants-permission path, and no request-id-overrides-auth-context path exists (NFR-6/NFR-7/NFR-8, AC-13/AC-14, AC-SEC-1..5) — confirmed by an explicit security review with the negative tests named in §15, not assumed from architecture alone.

---

## 20. Phase Exit Criteria — Extensibility Proof (Developer/Product Journey Test)

Per the correction recorded in §3.5 and required by BO-3: this phase's exit review SHALL include the following proof, run in addition to (not instead of) the automated architecture/negative checks §19 already requires. **This is R5's equivalent of R4's own Doctor/Admin/Therapist user-journey test (R4 requirements.md §20)** — adapted for a platform phase, where the "user" being served is a future engineering phase, not a clinical end user.

| Step | Proof required | Pass condition |
|---|---|---|
| 1. Register a new, illustrative-only capability (e.g. a placeholder `telemedicine.video_consult` catalog entry — no actual video-consult logic, per N-3) | Using only the catalog table this phase ships | No code change to any router, service, or template file was required to register the entry — only a catalog row (and, if the example has one, a dependency edge). |
| 2. Declare a dependency on an existing capability (e.g. depends on the top-level "appointments" capability) | Using only the dependency-graph table | The resolver correctly reports the new capability unavailable if the dependency is unmet, and available once it is met — with a human-readable reason (FR-D1) either way. |
| 3. Grant it to one subscription plan, not another | Using only the entitlement join table (Area A) | A tenant on the granted plan sees it as available (subject to step 2); a tenant on the ungranted plan sees a clear "requires plan X" reason. |
| 4. A tenant admin enables it | Using only the existing admin toggle endpoint (FR-B3) | The tenant-level enablement record is created; the resolver reflects `enabled: true` on next fetch (N-6 — no push required). |
| 5. Attempt to disable a capability another enabled capability depends on | Using only the existing admin toggle endpoint | Rejected with a structured reason naming the blocking dependent (FR-E3) — not a silent no-op, not a cascade. |

A phase that passes every automated check but has not run this five-step proof against the shipped platform is not done — this is the direct lesson of R4's own manual acceptance verification (§3.5), applied here to prove *platform* extensibility rather than *user-journey* simplicity.

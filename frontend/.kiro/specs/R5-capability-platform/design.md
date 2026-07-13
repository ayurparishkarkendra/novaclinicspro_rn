# Release 5 — Capability Platform — Design

**Release:** R5 · **Document type:** Design (Doc 07 §13) — defines **how** the approved `requirements.md` is realized. `tasks.md` follows only after this document is explicitly approved. Every ADR candidate `requirements.md` §12 raised is resolved below (§13); no code accompanies this document.

**Supersedes/refines:** `requirements.md`'s Area A–H framing is retained as the requirements baseline. This document is organized **ownership-first, then mechanism**: who owns each fact today, who owns it after this phase, how the resolver computes the runtime answer, and only then the API/frontend/migration mechanics — mirroring R4 `design.md`'s own "workflow-first" organizing principle, applied here to entitlement/enablement instead of clinical workflow.

---

## 1. Overview

R5 exists because R1–R4 each, independently and correctly for their own scope, needed an answer to "is this feature available" — and each answer landed in a different place (`requirements.md` §2's six mechanisms). This is not a defect in any single prior phase; it is the accumulated cost of never having had a platform to plug into. R5 builds that platform, once, so R6 and beyond never have to choose between "add a seventh ad hoc mechanism" and "block on a platform phase that doesn't exist yet."

**What this phase is not:** it is not a new subscription/billing system (R5 consumes `OrgSubscription`/`OrgSubscriptionPlan` as-is), not a new RBAC system (R5 composes with `org_permissions` as-is), and not a rewrite of any of the six existing mechanisms' storage (all additive, per ADR-R4-03's own precedent, reused here). It is the **one new layer** — catalog, dependency graph, resolver — that lets every existing and future mechanism converge onto a single runtime answer.

The model, in one picture:

```
Active-Plan Contract            Clinic Template              Tenant
(§9.0 — resolves the             (defaults for a               (explicit override —
 entitlement ceiling from         new tenant of this            what IS actually on,
 OrgSubscription lifecycle;       clinic type; template          deviating from default;
 what CAN ever be on)             changes never overwrite        preference RETAINED even
        │                         admin overrides)                on entitlement loss)
        │                              │                              │
        ▼                              ▼                              ▼
┌───────────────────────────────────────────────────────────────────────────┐
│              Capability Catalog (hierarchical, Area K lifecycle)          │
│         Capability  +  CapabilityDependency (DAG)  [platform-global]      │
└───────────────────────────────────────────────────────────────────────────┘
        │
        ▼  (PURE domain computation — reads only plain pre-fetched inputs, NFR-8;
        │   never writes any of the above; recomputed per request, FR-C4)
              CAPABILITY RESOLVER
        │
        ▼
   { code: { entitled, tenant_preference, effective_available,
             effective_enabled, blocked_reason_code, unmet_dependencies, source } }
             (+ localized labels added at the application boundary, §9.2)
        │
        ├──────────────┬────────────────────┬─────────────────────┐
        ▼              ▼                    ▼                     ▼
  Backend service   Frontend             Admin toggle        A future
  visibility        useCapabilities()/   endpoint (writes     phase's own
  checks             <CapabilityGate>     ONLY the tenant      new module,
                                           override row,        reading the
                                           never the             same resolver
                                           catalog/plan/graph)
```

RBAC (`org_permissions` → `tenant_permissions`) sits **beside**, not inside, this picture — a capability being available/enabled answers "is this visible to try"; RBAC independently answers "is this specific user allowed to act." Both must say yes for an action to actually happen. Neither is redesigned by R5 (`requirements.md` N-1).

---

## 2. Current State Audit

*(Condensed from `requirements.md` §2/§3, extended with fresh evidence gathered for this design — the actual field types, the actual filter logic, and the actual absence of a dependency concept anywhere in the schema.)*

### 2.1 The six mechanisms, their storage shape, and who reads them today

| # | Mechanism | Storage shape | Confirmed reader(s) |
|---|---|---|---|
| 1 | `subscription_modules.py` | Python dict literal, redeployed to change | `subscription_modules.py`'s own `get_modules_for_subscription`/`has_module_access` — **zero confirmed callers found in application/router code**; this file's own functions are themselves currently unreferenced outside itself, meaning mechanism #2 (below) is the one actually driving `PermissionSyncService` today, and mechanism #1 is dead-but-present duplication, not merely theoretical drift risk |
| 2 | `org_subscription_plans.included_modules` | `JSONB`, list of string module codes, no FK to any catalog table (none exists) | `PermissionSyncService.sync_tenant_permissions` (§2.3 below) |
| 3 | `org_permissions.module` | plain string column, no FK, no catalog | Same service, via `.module.in_(subscription_modules)` |
| 4 | `org_templates.enabledfeatures` | `JSONB`, `list[dict]` | `auth_metadata.py:275` (read at auth/session-bootstrap time), `template_merge_service.py` (parent/child template merge) |
| 5 | `org_templates.featuresettings` | `JSONB`, `dict` (nested, e.g. `{"appointments.core": {"settings": {...}}}`) | `OrgTenantsService.get_tenant_features` (the current `GET /tenants/{id}/features` backing) |
| 6 | Clinic-type branch in `get_tenant_features` | Python `if clinic_type in {"ayurveda","physio"}` | Same method, gates whether `featuresettings` (#5) values are honored at all |

### 2.2 `PermissionSyncService`'s actual filter (verified in full, not excerpted)

```python
subscription_modules = ["CORE"]                      # default fallback
if tenant.subscription_plan:                          # OrgTenant.subscription_plan (string)
    plan = <lookup OrgSubscriptionPlan by code == tenant.subscription_plan>
    if plan and plan.included_modules:
        subscription_modules = plan.included_modules   # JSONB list, mechanism #2

org_permissions = <all where module.in_(subscription_modules)>   # mechanism #3
# diff against existing tenant_permissions, add/update/deactivate
```

This is a real, working, additive-sync service (adds/updates/deactivates, never destructively drops a tenant's own manual grant) — it is **not** broken. It is, however, the concrete proof that "subscription plan gates permission visibility" is already a real, live product behavior implemented via string-tag filtering rather than a declared, reusable model. R5's Area A/F work is to give this exact behavior a proper home, not to invent a new behavior that doesn't exist yet.

### 2.3 No dependency concept exists anywhere in the schema

Confirmed by exhaustive search: no table, column, or JSONB key anywhere in `app/infrastructure/db/models/` expresses "X requires Y." This is new ground R5 breaks — Areas E/§7 below are not a reconciliation of an existing mechanism, they are this phase's own original contribution.

### 2.4 `OrgTenant.subscription_plan` vs `OrgSubscription.plan_code` — confirmed independent

`OrgTenant.subscription_plan` (`app/api/v1/schemas/org_tenant.py:28`, default `"FREE"`) is set at tenant-creation time and is the field `PermissionSyncService` actually reads (§2.2). `OrgSubscription.plan_code` (`org_subscription.py:38-44`) is the field the billing/payment lifecycle (Razorpay IDs, billing cycles, `current_period_end`, payment failures) actually governs. **No code path was found that keeps these two in sync.** A tenant whose billing subscription is downgraded via `OrgSubscription` today would NOT see `PermissionSyncService` re-derive fewer permissions, because that service never reads `OrgSubscription` at all.

---

## 3. Target Architecture

Four layers, mirroring R4's own three-layer target architecture (§3), extended by one — this phase adds a genuine new **Entitlement** layer beneath Screen/Workflow ownership that R4 did not need, because R4 operated entirely within one already-entitled clinical domain:

```
┌─────────────────────────────────────────────────────────────────┐
│  Layer 1 — Entitlement Ownership (§5, §6)                        │
│  Exactly one catalog, one dependency graph, one plan-linkage     │
│  table. Every capability, coarse or fine, is one row here.       │
├─────────────────────────────────────────────────────────────────┤
│  Layer 2 — Enablement Ownership (§7)                             │
│  Exactly one tenant-scoped override table, modeled on the        │
│  proven TenantPermission shape. Template defaults seed it;       │
│  admin toggles mutate it. Nothing else writes tenant capability  │
│  state.                                                          │
├─────────────────────────────────────────────────────────────────┤
│  Layer 3 — Resolution (§8)                                       │
│  A pure function over Layers 1–2 (+ the dependency graph),       │
│  producing exactly one effective-state map per tenant. Never     │
│  persisted as a competing writable field (mirrors R4 OW-2).      │
├─────────────────────────────────────────────────────────────────┤
│  Layer 4 — Consumption (§10–§12)                                 │
│  Backend services, the admin toggle endpoint, the frontend hook, │
│  and every future phase's own module all read Layer 3's output   │
│  — none of them re-derive Layers 1–2 independently.              │
└─────────────────────────────────────────────────────────────────┘
```

This ordering is deliberate and binding, mirroring R4 §3's own "Layer 1/2 decided before Layer 3" discipline: the catalog/graph/ownership table (Group A, `requirements.md` MIG-3) is decided and approved before the resolver (Group C) is implemented, and the resolver exists before any of the six existing mechanisms are retired (Group F).

---

## 4. Domain Model

```
Capability   (platform-global catalog — NO tenant_id; Area K identity/lifecycle)
├── id: UUID
├── code: str            — IMMUTABLE, namespaced, dotted machine key (FR-K1); never renamed in place,
│                           never reused for a different capability (FR-K3). e.g. "appointments",
│                           "appointments.multiday", "treatment.ayurveda", "telemedicine.video_consult"
├── name_key: str         — localization KEY for the display name (FR-K2/D1); the display TEXT is
│                           resolved at the app/API boundary (§9.2), never stored as English here
├── description_key: str  — localization key for the description
├── category: str         — UI grouping ONLY; has NO semantic meaning whatsoever — no resolver
│                           branch, no entitlement rule, no dependency, no behavior may ever read
│                           it (§6.1). NOT a second hierarchy; see ADR-R5-01
├── parent_capability_id: UUID | null   — self-FK; null = top-level ("module-equivalent")
├── lifecycle_state: enum('enabled','deprecated')   — FR-K5; deprecated resolves deterministically
│                           (unavailable-with-reason), never silently vanishes
├── mid_rollout: bool     — ADR-R5-05 engineering-internal marker; when true the resolver additionally
│                           requires an already-resolved rollout condition (never tenant-facing)
├── display_order: int    — FR-K7 deterministic ordering (mirrors OrgSubscriptionPlan.display_order)
├── created_at / updated_at
└── UNIQUE(code) (FR-K6)

CapabilityDependency   (platform-global; the DAG's explicit cross-branch edges)
├── id: UUID
├── capability_id: UUID          — FK → Capability, "the dependent"
├── depends_on_capability_id: UUID — FK → Capability, "the dependency"
├── created_at
└── CHECK capability_id != depends_on_capability_id (no self-loop);
    UNIQUE (capability_id, depends_on_capability_id)   (FR-K6 referential integrity)

SubscriptionPlanCapability   (platform-global; the entitlement ceiling)
├── id: UUID
├── subscription_plan_id: UUID   — FK → OrgSubscriptionPlan (EXISTING table, reused)
├── capability_id: UUID          — FK → Capability
├── created_at
└── UNIQUE (subscription_plan_id, capability_id)
    — "this plan's tenants MAY have this capability available"

TenantCapability   (TENANT-SCOPED; the only tenant-owned table in this model)
├── id: UUID
├── tenant_id: UUID              — FK → OrgTenant (EXISTING table, reused)
├── capability_id: UUID          — FK → Capability
├── is_enabled: bool             — the tenant's stored PREFERENCE (distinct from effective-enabled,
│                                   FR-H4) — retained across entitlement loss per ADR-R5-10
├── source: enum('template_default','admin_override')   — FR-B2b provenance
├── version: int (default 1)     — optimistic-concurrency counter (FR-J2), mirrors the existing
│                                   treatment-order `version`/If-Match/VersionConflictError pattern
├── enabled_by_staff_id: UUID | null  — FK → tenant_staff; actor audit (FR-J3), null when template_default
├── enabled_at: timestamp | null
├── disabled_at: timestamp | null
├── notes: text | null
└── UNIQUE (tenant_id, capability_id)
    — mirrors TenantPermission's own shape (requirements.md §3.2) almost field-for-field
```

**Deliberately not modeled as a separate `Module` entity** — see ADR-R5-01 (§13). A "module" in the existing `included_modules`/`subscription_modules.py` sense is simply a `Capability` row with `parent_capability_id IS NULL`.

**Scope ownership (FR-F4, NFR-6), enforced structurally by the schema above:** `Capability`, `CapabilityDependency`, and `SubscriptionPlanCapability` carry **no `tenant_id`** — they are platform-global, mutated only by migration/seeding, and there is **no tenant-scoped write path to any of them** (§11 exposes only a *read* of the catalog; §9.3's write path touches only `TenantCapability`). `TenantCapability` is the sole tenant-owned table and every query against it filters `tenant_id`. This makes "a tenant admin edits the catalog/graph/plan-entitlement" not merely forbidden by policy but **absent by construction** — there is no endpoint and no service method that writes those tables outside migration.

**Physical table naming (schema naming alignment correction, 2026-07-13, migration `20260713_090000`):** the class names above (`Capability`, `CapabilityDependency`, `SubscriptionPlanCapability`, `TenantCapability`) are unchanged, but the *physical* table names they map to were corrected post-implementation to follow NovaClinicsPro's existing ownership-oriented naming convention — **platform/organization-owned tables use the `org_` prefix; tenant-owned tables use the `tenant_` prefix**:

| Class | Physical table (as originally shipped, T-B.1a/b/c) | Physical table (corrected, `20260713_090000`) |
|---|---|---|
| `Capability` | `capabilities` | `org_capabilities` |
| `CapabilityDependency` | `capability_dependencies` | `org_capability_dependencies` |
| `SubscriptionPlanCapability` | `subscription_plan_capabilities` | `org_subscription_plan_capabilities` |
| `TenantCapability` | `tenant_capabilities` | `tenant_capabilities` (already correct) |
| `OrgTemplateCapability` | `org_template_capabilities` | `org_template_capabilities` (already correct) |

This is a schema naming correction, not a conceptual architecture change — the domain model, resolver contract, ownership boundaries, and every ADR above are unaffected. Capability machine codes (`appointments`, `treatment`, `billing`, `clinical_documents`, etc., `tasks.md`'s T-A.3 inventory) are untouched by this correction — they are business vocabulary, not physical table names. See `OWNERSHIP.md` for the full correction record and `tasks.md`'s dedicated completion report.

---

## 5. Ownership Table (OW-1, OW-4 — the required deliverable)

| Concern | Owning entity (after R5) | Writer | Reader | Prior mechanism, disposition |
|---|---|---|---|---|
| Capability catalog (what could ever exist) | `Capability` | Platform engineering, via migration only — no runtime write path | Everyone | Mechanisms #1 (`subscription_modules.py` dict), #4 (`enabledfeatures` keys, as a naming source), #5 (`featuresettings` keys, as a naming source) → **all superseded, Group F** |
| Capability dependency | `CapabilityDependency` | Platform engineering, via migration only | Resolver (§8) | None existed (§2.3) — new |
| Entitlement ceiling (what a plan allows) | `SubscriptionPlanCapability` | Platform/billing admin action (out of this phase's UI scope, N-7) or migration | Resolver | Mechanisms #1, #2 (`included_modules`) → **superseded, `included_modules` kept read-only during migration window (BC-2), then Group F retirement** |
| Which plan governs a tenant's entitlement *right now* | **Active-plan resolution contract** (`resolve_active_plan(tenant)`, §9.0, ADR-R5-03) — a single billing-owned function, **migration-aware three-tier precedence** (`active_subscription` → `legacy_tenant_projection` → `minimum_fallback`, §9.0), NOT a raw column read by any other consumer | Existing billing/payment lifecycle writes `OrgSubscription` (unchanged, N-2); `OrgTenant.subscription_plan` continues to be written by its six T-A.2-enumerated live call sites during the migration window | Resolver (via `CapabilityService`) | Both `OrgTenant.subscription_plan` **and** raw `OrgSubscription.plan_code` reads → **no consumer *other than the contract itself* reads either directly** (the contract's own Tier 2 legitimately reads `OrgTenant.subscription_plan` as a named, logged compatibility source, not a violation of this rule). `OrgTenant.subscription_plan`'s **approved final disposition** is a computed/read-only projection with no independent writers — reached only after T-C.2b's separately reviewed reconciliation work and Group F's parity proof, **not already the case today** |
| Template defaults for a new tenant | `Capability` rows referenced by a new, narrow `org_template_capabilities` join (§6.3) | Template authoring (existing `OrgTemplate` CRUD, extended) | Tenant-provisioning flow, seeding `TenantCapability` | Mechanisms #4 (`enabledfeatures`), #5 (`featuresettings`) → **superseded, Group F; both fields kept read-only during migration window** |
| Tenant's actual current enablement | `TenantCapability` | Tenant-provisioning flow (seed from template) + admin toggle endpoint (§11) | Resolver | **No prior owner existed** (`requirements.md` §3.1) — new |
| Effective runtime state | Capability Resolver (§8), pure function | Nobody — read/presentation computation only (OW-2) | Every consumer (Layer 4) | Mechanisms #5+#6 combined (`get_tenant_features`'s own ad hoc recomputation) → **superseded, Group F; `GET /tenants/{id}/features` kept as an unchanged-shape read path during migration window (BC-1)** |
| Rollout safety for not-yet-proven capability code | Existing `xxx_v1_enabled` flags | Existing mechanism, unchanged | Resolver, only for capabilities explicitly marked mid-rollout (ADR-R5-05) | Not superseded — different axis (`requirements.md` N-4) |
| Authorization (who may act) | Existing RBAC (`org_permissions` → `tenant_permissions`) | Existing mechanism, unchanged | Existing `require_permission` dependency | Not superseded — composed with, not merged (FR-F1) |

---

## 6. Capability Catalog & Hierarchy

### 6.1 Two-level convention, not two entities (ADR-R5-01)

- **Top-level capability** (`parent_capability_id IS NULL`) — the "module-equivalent," e.g. `appointments`, `treatment`, `inventory`, `billing`, `telemedicine`. This is what `SubscriptionPlanCapability` typically links a plan to.
- **Child capability** (`parent_capability_id` set) — the fine-grained toggle, e.g. `appointments.multiday`, `treatment.ayurveda`, `treatment.physiotherapy`, `billing.invoicing`.
- A plan MAY link directly to a child capability (fine-grained entitlement) — the hierarchy is a UI/reasoning/grouping convenience, not a hard rule about what a plan may reference.

**`category` has no semantic meaning whatsoever (binding).** `category` is a pure UI-grouping label — **no resolver branch, entitlement rule, dependency, permission, or any other behavior may ever read or condition on it.** It exists so an admin screen can group capabilities under a heading, nothing more. This is stated as a hard rule (not merely "UI-only") precisely to stop a future developer from quietly introducing category-driven behavior, which would recreate a §2-style hidden mechanism. If behavior ever needs to distinguish a group of capabilities, that is a *dependency edge* or a *hierarchy relationship* (both explicit, both tested) — never `category`. A test in the resolver suite asserts the resolver's inputs (`CapabilityCatalogSnapshot`, §8.2) do not even carry `category`, making category-driven resolution impossible by construction.

**Hierarchy ≠ dependency (FR-E4, ADR-R5-09).** Hierarchy (`parent_capability_id`) means *classification/grouping*; a dependency edge means *operational prerequisite*. These are two distinct meanings and are stored separately. This design **does** adopt one explicit, documented rule connecting them — a child is treated as depending on its parent — but that rule is a **conscious, tested resolver rule** (§7.2, ADR-R5-09), not an emergent side effect of the hierarchy field. `design.md` states it explicitly precisely so it never becomes the kind of silent, undocumented second dependency mechanism `requirements.md` FR-E4 forbids.

### 6.2 Code naming convention (reused, not invented)

Dotted, lower-snake namespacing, directly continuing the convention already visible in `featuresettings`' own existing keys (`"appointments.core"`, `"appointments.sessions"`) — R5 does not invent a new naming scheme, it formalizes the one already informally in use.

### 6.3 Template linkage (`org_template_capabilities`, new, narrow join table)

```
OrgTemplateCapability
├── id: UUID
├── template_id: UUID      — FK → OrgTemplate (EXISTING, reused)
├── capability_id: UUID    — FK → Capability
├── default_enabled: bool
└── UNIQUE (template_id, capability_id)
```

This is intentionally the **only** new column/table touching `OrgTemplate` — `enabledfeatures`/`featuresettings` themselves are not altered, extended, or read by any new code path (BC-2); they are superseded by this join table's contents once Group F's parity check passes.

### 6.4 Catalog identity & lifecycle (Area K)

The `code` machine key is a **long-lived contract** consumed by plans, templates, APIs, frontend gates, and every future phase — treated with the same discipline as any public contract in this codebase:

- **Immutable, namespaced key (FR-K1):** `code` is set once and never renamed in place. `UNIQUE(code)` at the schema level (FR-K6).
- **Identity ≠ label (FR-K2):** the human-readable name/description are localization *keys* (`name_key`/`description_key`, §4), resolved to text at the application/API boundary (§9.2) — a label change is a translation-file edit, never a behavior or contract change.
- **No key reuse (FR-K3):** a retired key is never repurposed for a different capability (reuse would silently re-point every plan/template/gate still referencing it). Enforced by convention + the deprecation lifecycle below (a deprecated row keeps its key occupied).
- **Deprecate, don't delete (FR-K4/K5):** a referenced capability is set `lifecycle_state='deprecated'`, not `DELETE`d. A deprecated capability still resolves deterministically (the resolver returns `available=false, blocked_reason="capability_deprecated"`), so no dangling reference ever occurs. Physical removal is possible only after every `SubscriptionPlanCapability`, `CapabilityDependency`, and `TenantCapability` reference is first removed/re-pointed — enforced by the FKs (FR-K6), which reject an orphaning delete.
- **Deterministic ordering (FR-K7):** every catalog-enumerating API/UI orders by `(display_order, code)` — never insertion or hash order.

The resolver's §8.3 decision tree gains one early branch for `lifecycle_state='deprecated'` (returns `capability_deprecated`), keeping deprecated capabilities safe-by-default rather than vanishing.

**Future lifecycle evolution (not built in R5, additive when needed).** R5 ships the minimal two-state lifecycle (`enabled` / `deprecated`) — sufficient for everything this phase and the §18 worked examples need. A future phase will likely want the fuller set — **`draft` → `enabled` → `deprecated` → `removed`**: `draft` for a capability seeded but not yet exposed to any plan (safer than relying on `mid_rollout` alone), and `removed` as a terminal tombstone that keeps the `code` permanently reserved (FR-K3 no-reuse) after every reference is gone. This is a pure enum extension: each new state adds one early resolver branch (all resolving to a deterministic unavailable-with-reason, exactly like `deprecated` does today), changes no existing state's behavior, and requires no schema restructuring (a `lifecycle_state` value addition). Recorded here so the two-state choice is understood as a deliberate minimal starting point, not a ceiling.

---

## 7. Dependency Graph

### 7.1 Structure

`CapabilityDependency` is an edge list forming a directed graph over `Capability` nodes. **Constraint: DAG only** (FR-E1).

### 7.2 Parent-as-dependency: an explicit, documented, tested rule (ADR-R5-09)

This design adopts the rule "**a child capability depends on its parent being available**" — but as a **conscious, documented resolver rule with its own test** (FR-E4/ADR-R5-09), never an unstated emergent behavior. The rule: the resolver (§8.3) treats `catalog[code].parent_code`, when present, as an *additional* member of `code`'s effective dependency set — on top of any explicit `CapabilityDependency` rows. Explicit edge rows remain reserved for **cross-branch** dependencies (e.g. `treatment.physiotherapy` depends on `appointments.multiday`, a different branch).

*Why this is the chosen rule, not the alternative:* a child capability whose parent module is entitlement-off genuinely cannot function (`appointments.multiday` is meaningless if `appointments` itself is not available to the plan) — so the parent is a real operational prerequisite here, not merely a grouping. Encoding it as a rule (rather than requiring an explicit edge per child) halves edge-row count and eliminates a whole class of "forgot to link the child to its parent" catalog bugs by construction. The cost — that hierarchy and one specific dependency are coupled — is bounded and made safe by being **explicit and tested**: `tasks.md` includes a dedicated test asserting exactly this rule (`test_child_capability_unavailable_when_parent_unavailable`), so the coupling can never silently change or be mistaken for an accident. A future phase that ever needs a child that does *not* depend on its parent would have to change this documented rule deliberately (and its test), which is the point — it is a decision, visible in one place, not an emergent property.

### 7.3 Cycle prevention — two enforcement points, not one

1. **Declaration-time (primary, cheap):** before `INSERT`ing a new `CapabilityDependency` row, run a topological reachability check (does `depends_on_capability_id` already, transitively, depend on `capability_id`?) — reject with a 409-style structured error if so, mirroring this codebase's existing `VersionConflictError` structured-error convention. This is the primary defense — a well-formed catalog never has a cycle to begin with.
2. **Resolution-time (defensive, cheap, mandatory per FR-E1):** the resolver's own graph walk (§8.3) carries a `visiting: set[capability_code]` guard. If a node is encountered while still in `visiting`, the resolver does **not** raise or infinite-loop — it marks that capability (and every capability that depends on it) `available=False, blocked_reason="capability_graph_integrity_error"`, and logs a structured error for platform engineering to fix the bad data. This mirrors this document series' own "verify, don't assume; fail closed, not open" discipline (parallel to R4's own defensive `assert_valid_sheet_transition` guard at every write site) — a defensive check earns its cost only if a declaration-time bug or a direct DB edit ever slips past enforcement point 1.

### 7.4 Depth/size bound (NFR-5)

The resolver's graph walk is bounded by `MAX_CAPABILITY_DEPTH = 8` (a `design.md`-level constant, not user-configurable) — chosen generously against the catalog's expected real depth (module → capability → sub-capability is 3 levels in every worked example this document uses) while still bounding worst-case walk cost even if the catalog grows into the low hundreds of rows over the product's lifetime (§16).

### 7.5 Graph integrity validation (startup + migration, cheap)

Beyond the cycle checks (§7.3), a `validate_capability_graph(catalog_snapshot)` routine runs at **application startup** and at the **end of every catalog migration** (both cheap given the catalog's small size, §16), fail-loud on a violation so a bad catalog is caught before it can ever reach a resolver call. It checks:

- **Cycles** — the DAG invariant (§7.3), re-checked over the whole graph, not just per-inserted-edge.
- **Missing parent references** — every non-null `parent_capability_id` points to a real, present catalog row (also FK-enforced, FR-K6 — this is the defense-in-depth re-check).
- **Orphan / unreachable nodes** — a capability that no plan entitles, no template seeds, and nothing depends on: not an error (a newly-added, not-yet-entitled capability is legitimately "orphan" for a while), but **logged as a curation warning** so the catalog doesn't silently accumulate dead entries (§19's dumping-ground risk).
- **Dependency on a deprecated capability** — an `enabled` capability whose dependency (explicit edge or parent) is `lifecycle_state='deprecated'`: a **hard validation error** (it would make the dependent permanently unavailable-by-deprecation for a non-obvious reason), forcing the deprecation to be done in the right order (re-point or deprecate dependents first, FR-K4).
- **Duplicate hierarchy / conflicting parentage** — the schema's self-FK makes a node have at most one parent, but the validator additionally asserts no code appears twice (FR-K6 `UNIQUE(code)` re-check) and that `category` groupings are consistent with hierarchy where both are set (a warning, not an error — `category` is UI-only, §6.1).

These checks are inexpensive (the catalog is tens-to-low-hundreds of rows) and turn "a bad catalog edit" from a latent runtime surprise into an immediate, located, startup/migration-time failure.

### 7.6 Catalog Evolution (how the catalog itself changes safely across releases)

The catalog is a long-lived contract (Area K), so its *own* evolution needs rules, not just its entries' lifecycle:

- **All catalog structure changes are migration-only.** New capabilities, new dependency edges, parent/child relationships, `lifecycle_state` transitions, and plan-entitlement links are changed **exclusively via reviewed migrations/seed tasks** — never via a runtime/admin write path (there is none, §4/FR-F4). This makes every catalog change reviewable, versioned with the code, and rollback-tied to a specific deploy.
- **`catalog_version` (a monotonic marker, e.g. the latest catalog-migration revision id) identifies the catalog's shape.** It is what the cache keys on (§16) and what a partially-deployed environment uses to detect skew (below).
- **Can dependencies change between releases?** Yes — a migration may add or remove a `CapabilityDependency` edge, but each such change runs through §7.5 validation at migration end (no cycle, no dep-on-deprecated), and **adding a dependency to an already-shipped capability is a potentially-breaking change** (it can make a previously-available capability unavailable for tenants missing the new dependency) — so it is treated with the same care as an API-contract change: called out in the migration's own notes, and its tenant-impact checked (mirrors the Group F parity discipline).
- **Can parent/child change between releases?** Re-parenting is allowed by migration but is **high-impact** (it changes the ADR-R5-09 parent-dependency of a live capability) — the migration must re-run §7.5 validation and the affected capability's parity check. Re-parenting is expected to be rare; the safer default is to deprecate-and-replace rather than re-parent in place.
- **Partial-deployment / rolling-restart skew.** During a rolling deploy, two app instances may briefly run different code and thus different `catalog_version`s. Because the catalog is **read-only per instance and keyed by `catalog_version`** (§16), each instance resolves consistently against *its own* catalog — there is no shared-mutable-cache corruption. Brief cross-instance divergence (one instance already knows a new capability, another not yet) is bounded by the deploy window and is **safe-by-construction**: the new capability is either not-yet-entitled (invisible everywhere) or additively available (worst case, one instance shows it a few seconds before another). Entitlement/enablement writes (`TenantCapability`) are DB-transactional and instance-independent, so no write is lost to skew. A capability *removal* is never a hard delete (FR-K4 deprecate-not-delete), so an older instance never dangles on a vanished row.
- **The extensibility proof (§20) exercises exactly this path** — adding a capability via migration/seed with no code change to any router/service — which is the common-case catalog evolution, proving the evolution story is real, not aspirational.

---

## 8. Resolver Design (ADR-R5-02)

### 8.1 Location and purity

`app/domain/services/capability_resolver.py` — a **pure domain module** (NFR-8), directly mirroring `app/domain/services/treatment_lifecycle_resolver.py`'s own now-corrected shape (post R4 architecture review): **no imports from `app.infrastructure`, `app.api`, `app.core.config`/environment, a database session, or `app.localization`.** Label/reason-text lookup and rollout-flag reading are **application/infrastructure-layer** concerns — the resolver receives only plain, immutable, pre-fetched values (including any rollout condition as a plain boolean, §8.2's `rollout_flag_overrides`, per FR-C1/NFR-8). This is the exact fix R4's own architecture review applied to its resolver, inherited here rather than re-learned.

### 8.2 Inputs — two rich immutable snapshots (not a growing bag of collections)

Rather than a single input dataclass with N loosely-related collections (which would grow unboundedly as R6/R7/R8 add inputs), the resolver takes exactly **two cohesive, frozen, I/O-free objects** — one platform-scoped, one tenant-scoped — mirroring `LifecycleResolverInput`'s frozen-dataclass purity but organized so the resolver's *signature stays stable* even as each snapshot's internals evolve:

```python
@dataclass(frozen=True)
class CapabilityCatalogSnapshot:
    """Platform-global, per-deploy-cacheable (§16). Same for every tenant;
    changes only on a catalog migration. Immutable value object."""
    nodes: Mapping[str, "CapabilityNode"]          # code -> {parent_code, lifecycle_state, mid_rollout}
    dependency_edges: Mapping[str, frozenset[str]] # code -> {explicit cross-branch depended-on codes}
    catalog_version: str                            # monotonic; identifies this snapshot (§ Catalog
                                                    # Evolution, §7a) — used for cache keying/invalidation

@dataclass(frozen=True)
class TenantCapabilitySnapshot:
    """Per-tenant, per-request. Everything the resolver needs that varies by
    tenant — all already resolved upstream (NFR-8: no billing/config/DB in here)."""
    tenant_id: UUID
    entitled_codes: frozenset[str]                  # from the §9.0 active-plan contract, already resolved
    preferences: Mapping[str, bool]                 # code -> tenant's stored is_enabled (Layer 2)
    preference_sources: Mapping[str, str]           # code -> 'template_default' | 'admin_override'
    rollout_conditions: Mapping[str, bool]          # code -> ALREADY-RESOLVED flag value, only for
                                                    # mid_rollout capabilities (ADR-R5-05); infra read
                                                    # config, resolver never does (NFR-8)

def resolve(catalog: CapabilityCatalogSnapshot,
            tenant: TenantCapabilitySnapshot) -> Mapping[str, CapabilityState]:
    ...
```

**Why two objects, not one flat input or five collections (rev — anticipates R6+ growth):** the catalog snapshot is the same for every tenant and cacheable per-deploy; the tenant snapshot is per-request. Splitting on that natural seam means (a) the cache layer caches exactly one object (`CapabilityCatalogSnapshot`, keyed by `catalog_version`), (b) a future input that is *platform-scoped* (e.g. a global policy) extends `CapabilityCatalogSnapshot` without touching the resolver signature or any tenant-path code, and a future *tenant-scoped* input (e.g. usage counters, §18 note 8) extends `TenantCapabilitySnapshot` the same way. The resolver's public contract — `resolve(catalog, tenant)` — stays stable across releases. `entitled_codes` being empty vs non-empty already encodes "no active plan / entitlement lost" (§9.0), so no separate billing-lifecycle field is ever needed inside these snapshots.

### 8.3 Algorithm (decision tree, per capability code)

```
resolve(code):                                     # closes over `catalog`, `tenant`, `visiting`
  node = catalog.nodes.get(code)
  if node is None:
      return UNAVAILABLE("capability_not_found")
  if node.lifecycle_state == 'deprecated':                    # Area K, FR-K5 — safe-by-default
      return UNAVAILABLE("capability_deprecated")

  # ── Entitlement (Layer 1) ──────────────────────────────────────────
  # An unentitled / expired / no-active-subscription / entitlement-LOST
  # (Area I) tenant arrives with this code absent from entitled_codes (the
  # §9.0 contract already resolved that upstream) — no special branch here.
  if code not in tenant.entitled_codes:
      return UNAVAILABLE("requires_plan_upgrade")

  # ── Rollout safety (N-4/ADR-R5-05), only if the catalog row is flagged
  #    mid-rollout — the overwhelming majority of capabilities never hit
  #    this branch ──
  if node.mid_rollout and not tenant.rollout_conditions.get(code, False):
      return UNAVAILABLE("not_yet_released")

  # ── Dependency graph (Area E): explicit edges + the parent rule (ADR-R5-09) ──
  effective_deps = catalog.dependency_edges.get(code, frozenset())
  if node.parent_code:                              # §7.2 ADR-R5-09 documented parent-dependency rule
      effective_deps = effective_deps | {node.parent_code}

  for dep_code in effective_deps:
      if dep_code in visiting:                      # §7.3 cycle guard, fail-closed
          return UNAVAILABLE("capability_graph_integrity_error")
      visiting.add(code)
      dep_result = resolve(dep_code)                 # recursion, depth-bounded (§7.4)
      visiting.remove(code)
      if not dep_result.effective_available:
          return UNAVAILABLE("requires_capability", unmet=[dep_code])

  # ── Enablement (Layer 2) ────────────────────────────────────────────
  # effective_available=True here; effective_enabled = the tenant's preference.
  return AVAILABLE(
      tenant_preference=tenant.preferences.get(code, False),
      source=tenant.preference_sources.get(code, 'template_default'),
  )
```

**At most one result per capability, per tenant, per resolve call — never a concatenation** (mirrors R4's own resolver discipline verbatim, `requirements.md` §3.5 of R4).

**Complexity is linear in the capability graph, and the evaluation strategy is an implementation detail behind a stable contract.** Resolving all capabilities is **O(V + E)** in the number of capabilities (V) and dependency edges (E) — each node and each edge is visited a bounded number of times. This linearity, not an assumption that "the catalog is small," is what guarantees the resolver scales (the small-catalog note in §16 is a *current fact*, not a *dependency* of the design). The pseudocode above shows a **recursive DFS with a `visiting` guard** for clarity; the `resolve(catalog, tenant)` contract (§8.2) is agnostic to *how* the traversal is done. If the catalog ever grows to several hundred capabilities with dense graphs, the implementation may switch to a **memoized / topological evaluation** (compute each capability's availability once, in dependency order, reusing sub-results) — strictly an internal optimization that changes neither the input snapshots, the output shape (§8.4), nor any test's expected result. `tasks.md`'s resolver task notes this permitted evolution so a future optimizer knows the contract is stable.

### 8.4 Output shape (FR-H4 — distinct fields, never one boolean)

The resolver returns, per capability, the full distinct-field set `requirements.md` FR-H4 requires — the domain resolver emits everything except the *human* reason label (added at the application boundary, §9.2, per NFR-8):

```python
# From the pure resolver (domain layer) — machine values only:
{
  "appointments.multiday": {
    "code": "appointments.multiday",
    "entitled": true,                    # plan grants it (Layer 1)
    "tenant_preference": true,           # tenant's stored is_enabled (Layer 2), independent of availability
    "effective_available": true,         # entitled AND deps met AND not blocked by rollout/deprecation
    "effective_enabled": true,           # available AND tenant_preference
    "blocked_reason_code": null,         # stable machine code (contract), null when available
    "unmet_dependencies": [],            # which dep codes block, when that's the cause
    "source": "admin_override"           # template_default | admin_override
  },
  "treatment.physiotherapy": {
    "code": "treatment.physiotherapy",
    "entitled": true,
    "tenant_preference": true,           # NB: preference on, but NOT effectively enabled — the
                                         # distinct fields make this expressible without ambiguity
    "effective_available": false,
    "effective_enabled": false,
    "blocked_reason_code": "requires_capability",
    "unmet_dependencies": ["appointments.multiday"],
    "source": "admin_override"
  },
  "telemedicine.video_consult": {
    "code": "telemedicine.video_consult",
    "entitled": false,
    "tenant_preference": false,
    "effective_available": false,
    "effective_enabled": false,
    "blocked_reason_code": "requires_plan_upgrade",
    "unmet_dependencies": [],
    "source": "template_default"
  }
}
```

The application layer (§9.2) then adds `blocked_reason_label` (localized human text, FR-D1) and the capability's own localized `name`/`description` from `name_key`/`description_key`, producing the API response.

`blocked_reason_code` is a **stable machine code** (a cross-release contract, FR-H4), not display text — exactly mirroring how R4's architecture-review-corrected design keeps `treatment_lifecycle_status` (machine code) and `treatment_lifecycle_status_label` (localized text) as two separate fields. **`entitled` / `tenant_preference` / `effective_available` / `effective_enabled` are deliberately four separate booleans, never collapsed** — collapsing them recreates the exact entitlement-vs-enablement ambiguity §2 documents.

**Computed once (FR-C4, §1):** this map is recomputed on each request/query execution from freshly-fetched (or per-deploy-cached, §16) inputs — it is a *derived* value, never a persisted `effective_state` table. There is no write path to `effective_available`/`effective_enabled`; they exist only as resolver output.

---

## 9. Application Layer

### 9.0 Active-plan resolution contract — migration-aware, three-tier (FR-A3, ADR-R5-03)

**Amended after the T-A.2 audit (`tasks.md` T-A.2).** The audit proved the population this contract resolves against is not what an `OrgSubscription`-only design assumed: **none of the three live tenant-creation paths (org-admin API, onboarding go-live, onboarding provisioning) ever create an `OrgSubscription` row** — only the separate, later `SubscriptionCheckoutService` checkout flow does. A contract that read only `OrgSubscription` and fell back straight to the minimum floor for everyone else would **silently mis-entitle the majority of today's tenants**, discarding the `OrgTenant.subscription_plan` value they actually have. This section (and ADR-R5-03, §13) is revised to make that transitional reality an explicit, tested, observable tier of the contract — not an assumption the resolver quietly gets wrong at cutover.

Before the resolver can run, the application layer must answer one question with a single authoritative contract: **"what plan governs this tenant's entitlement right now?"** This is a **billing-owned resolution function**, not a raw column read (FR-A3) — R5 does not redesign billing (N-2), it *consumes* `OrgSubscription`'s existing lifecycle through one documented contract, extended with an explicit, migration-scoped compatibility tier:

```
resolve_active_plan(tenant_id) -> ActivePlan:   # ActivePlan = {plan_code, source, is_minimum_fallback}
  # ── Tier 1: active_subscription (authoritative, unchanged from original design) ──
  subs = all OrgSubscription rows for tenant_id
  active = subs where status == 'active' AND current_period_end >= today
  if exactly one active: return {plan_code: active.plan_code, source: "active_subscription", is_minimum_fallback: false}
  if several active (data anomaly): pick the one with the latest current_period_end,
                                    log a structured billing-integrity warning (never silently guess),
                                    source: "active_subscription"
  if a 'trial' row is active per its own window: treat as its plan_code (trials entitle),
                                    source: "active_subscription"

  # ── Tier 2: legacy_tenant_projection (NEW — migration-window compatibility only,
  #    reached ONLY when zero OrgSubscription rows exist for this tenant at all) ──
  if no OrgSubscription row exists for tenant_id AND OrgTenant.subscription_plan is set:
       log/count this call (capability_active_plan_legacy_fallback_count, §16a)
       return {plan_code: OrgTenant.subscription_plan, source: "legacy_tenant_projection", is_minimum_fallback: false}

  # ── Tier 3: minimum_fallback (unchanged from original design) ──
  return {plan_code: MINIMUM_FALLBACK_PLAN, source: "minimum_fallback", is_minimum_fallback: true}
```

- **Every lifecycle state is handled explicitly** (FR-A3a): active, expired, cancelled, suspended, trial, pending, no-subscription, and multiple-historical-rows all have a defined answer within Tier 1. The "no active `OrgSubscription`" case no longer falls straight to the minimum floor — it first checks Tier 2 (below), and only reaches the floor if Tier 2 also has nothing usable.
- **Tier 2 (`legacy_tenant_projection`) is an explicit, tested, time-bounded compatibility path, not a silent equivalence with Tier 1.** It exists solely because T-A.2 proved a large, real population of tenants has a `subscription_plan` value with no backing `OrgSubscription` row, and treating them as unentitled would be a regression, not a migration. Every tier-2 resolution is logged/counted so remaining reliant tenants can be identified and driven toward zero (this is what T-C.2b, the separately reviewed reconciliation task, measures its progress against) — this is not a permanent third source of truth, it is a **measured, temporary bridge**.
- **This resolver never manufactures billing history.** Tier 2 reads `OrgTenant.subscription_plan` as it exists today — it does not create, backfill, or synthesize an `OrgSubscription` row, a trial window, or any billing-adjacent record to make Tier 1 appear satisfied. Reducing reliance on Tier 2 is the explicit job of a **separately reviewed** reconciliation/backfill task (T-C.2b), whose own plan must define status, dates, trial semantics, and billing implications before any such row is created — never assumed or defaulted by this contract.
- **No consumer reads either raw field directly** (FR-A3c): `CapabilityService`, `PermissionSyncService` (re-pointed, FR-F3), `rbac_seed.py`'s `_seed_tenant_permissions_async` (re-pointed, FR-F3 — a second live consumer of the same subscription-plan lookup, found by T-A.2 and not previously named here), and any future phase all call `resolve_active_plan`. This is the single seam — including for the Tier 2 compatibility path itself: no consumer re-derives "check `OrgSubscription`, else read `OrgTenant.subscription_plan` myself" independently; they all get the already-resolved, already-sourced answer from this one function.
- **`OrgTenant.subscription_plan` disposition (FR-A3b) — phased, not immediate.** During the migration window, it is read by exactly one place: this contract's Tier 2, as a named, logged, tested fallback — not by any other new code, and not silently. Its **final** disposition (approved per T-A.2's recommendation) is to become a **computed/read-only projection with no independent writers** — but this end-state is reached only *after* T-C.2b's reconciliation work reduces Tier 2 usage and Group F's parity proof confirms it is safe, not on `design.md`'s approval alone. Until then, the field continues to be written by its six T-A.2-enumerated live call sites exactly as today (BC-2) — this section does not claim that write-side change has already happened.
- **This function lives in the application/infrastructure layer, reads the DB, and hands the resolver a plain code set** — the domain resolver never sees `OrgSubscription`, `OrgTenant.subscription_plan`, or any lifecycle/tiering logic (NFR-8). The resolver receives only the already-resolved plan code; it has no visibility into which tier produced it.

### 9.1 `CapabilityService` and its collaborators (named seams, not a God Service)

`CapabilityService` (`app/application/services/capability_service.py`) is the orchestration entry point, but it **delegates each distinct responsibility to a named collaborator** rather than accumulating them all itself — so no single class becomes the "knows-everything" God Service as the platform grows. The collaborators are defined as explicit seams from day one (each behind a small interface), even though R5 does not need more physical layers today:

| Collaborator | Single responsibility | R5 backing |
|---|---|---|
| `ActivePlanResolver` | Answer "what plan governs this tenant now" (§9.0, FR-A3) — all subscription-lifecycle reasoning | reads `OrgSubscription` |
| `CapabilityCatalogProvider` | Supply the `CapabilityCatalogSnapshot` (§8.2) — catalog + edges + `catalog_version`, with per-deploy caching + invalidation (§16, § Cache Invalidation) | reads `Capability`/`CapabilityDependency`, caches |
| `CapabilityResolutionService` | Build the `TenantCapabilitySnapshot`, invoke the **pure** resolver, return machine-level `CapabilityState` map | calls `ActivePlanResolver`, `CapabilityCatalogProvider`, tenant-override repo, config for rollout flags |
| `CapabilityLocalizationService` | Turn machine reason codes + `name_key`/`description_key` into localized text at the API boundary (§9.2, FR-D1/NFR-8) | `get_localized_text` |

`CapabilityService` composes these: `resolve() → CapabilityResolutionService.resolve() → CapabilityLocalizationService.localize()`. This keeps the domain resolver pure (NFR-8), the billing seam isolated (`ActivePlanResolver`, so a future billing change touches one class), the cache seam isolated (`CapabilityCatalogProvider`, so a future cache-strategy change touches one class), and localization isolated (so adding a language touches translation files only). `tasks.md` may implement these as methods-behind-interfaces initially (not four separate deploy units) — the requirement is the **named seam and single responsibility**, so future refactoring into separate modules is mechanical, not a redesign.

### 9.2 Label resolution (mirrors the R4 architecture-review fix, not the mistake it corrected)

A new localization namespace, `app/localization/locales/{lang}/capabilities.json`, keyed by `blocked_reason` code (`requires_plan_upgrade`, `requires_capability`, `not_yet_released`, `capability_graph_integrity_error`, `capability_not_found`) plus one entry per capability `code` for its own display name/description — populated in en/hi/mr from day one (`requirements.md` FR-D1), following the exact `get_localized_text(key, lang, namespace)` convention already used throughout this codebase.

### 9.3 `CapabilityAdminService` — the write path (Area J: concurrency, idempotency, audit)

`enable_capability(tenant_id, code, staff_id, expected_version)` / `disable_capability(tenant_id, code, staff_id, expected_version)`:

1. **Open one transaction** (`UnitOfWork`) and `SELECT ... FOR UPDATE` the target `TenantCapability` row (or lock the intent to insert it) — so dependency validation and the write are **transactionally consistent** (FR-J4): a dependency's state cannot change between check and commit.
2. **Optimistic concurrency (FR-J2):** if the row exists and its `version != expected_version` (from the client's last read, passed as `If-Match`), raise `CapabilityVersionConflictError` — reusing the exact `VersionConflictError`/`If-Match` pattern R4 and the treatment-order code already established (not a new concurrency mechanism). A create (no row yet) uses the unique `(tenant_id, capability_id)` constraint to make concurrent double-inserts fail one side deterministically.
3. **Idempotency (FR-J1):** enabling an already-`is_enabled=true` row (or disabling an already-false one) is a **defined no-op** — returns the current state with the current version, does not bump version, does not error, does not write a duplicate.
4. **Enable:** reject (structured error, FR-J5 — not a silent no-op) unless the resolver says `effective_available=True` for that code (entitlement + dependencies + not-deprecated + rollout already satisfied — the resolver computed this inside the same transaction's input snapshot; the admin service does not re-derive it independently, FR-C3). On success, upsert `TenantCapability(is_enabled=True, source='admin_override', enabled_by_staff_id=staff_id, enabled_at=now, version=version+1)`.
5. **Disable:** reject if any *other currently-enabled* capability's effective dependency set (explicit edges + the parent rule, §7.2) includes this code (FR-E3 — no cascading; structured error naming every blocking dependent, FR-J5). On success, upsert `is_enabled=False, disabled_at=now, version=version+1`.
6. **Audit (FR-J3):** every write records actor (`enabled_by_staff_id`), source, and timestamp — the provenance FR-B4 requires, reconstructable from the row itself.
7. **Response:** the mutation returns the **full re-resolved capability map** (so the initiating client refreshes with no second round-trip, FR-H2) plus the new `version`.
8. All of the above commit within one `UnitOfWork` transaction, mirroring every R4 write-path method's own try/commit/rollback shape — no new transaction-handling convention introduced.

Rejections (not entitled / dependency unmet / blocks-dependents / version conflict) all return the **structured conflict shape** R4 established for `VersionConflictError` (a typed machine `error` code + localized `message`), never an unstructured 500 (FR-J5).

### 9.4 Template-default seeding semantics (FR-B2, ADR-R5-08)

When a tenant is provisioned, its `TenantCapability` rows are seeded from `org_template_capabilities` (§6.3) for its clinic template. The binding semantics (ADR-R5-08):

- **Continuously-inherited with explicit-override wins (chosen model):** a tenant does **not** get a frozen copy of the template at creation; instead the seed writes `source='template_default'` rows, and the resolver/seeder treat a template default as the value **only while the tenant has not explicitly overridden that capability**. The moment an admin toggles a capability, that row becomes `source='admin_override'` and is **immune to all future template changes** (FR-B2a/B2b). This gives the auditable, explainable answer: "template_default rows follow the template; admin_override rows never do."
- **New catalog capability for existing tenants (FR-B2c):** when a future phase adds a catalog capability, a seeding task creates `source='template_default'` rows for existing tenants **only where the tenant has no row for that capability yet** — it never touches an existing `admin_override` row, and never creates a row that contradicts a decision the tenant already made about a *different* capability.
- **Idempotent re-seeding (FR-B2d):** the seeder is `INSERT ... ON CONFLICT (tenant_id, capability_id) DO NOTHING` for `template_default` rows and **never** overwrites an `admin_override` row — so running it twice equals running it once, and it can **never resurrect a capability the tenant deliberately disabled** (a disabled `admin_override` row is left exactly as the tenant set it).

### 9.5 Entitlement loss / downgrade behavior (Area I, ADR-R5-10)

When `resolve_active_plan` (§9.0) returns a plan that no longer entitles a capability the tenant still has `is_enabled=true` for (downgrade, expiry, cancellation):

- **Immediate on next resolution (FR-I1):** the resolver returns `effective_available=false, effective_enabled=false, blocked_reason_code="requires_plan_upgrade"` for that capability on the very next call — no grace period at the resolver level (any grace/notice is a billing concern upstream, N-2).
- **Preference retained (chosen policy, ADR-R5-10):** the `TenantCapability.is_enabled=true` **preference is retained** (not force-flipped to false) — so if the tenant re-subscribes/upgrades, the capability **auto-reactivates** to exactly the state they last chose. `effective_enabled` is false while unentitled regardless (FR-I2); the distinct fields (§8.4) make "preference on, effectively off" a first-class, unambiguous state, so retention creates no ambiguity. (Rejected alternative: force-disable on loss — rejected because it silently destroys the tenant's prior choice and makes re-entitlement require re-toggling everything by hand.)
- **No destructive deletion (FR-I3):** nothing about entitlement loss deletes clinical/business data authored while the capability was available — mirrors R4/N-8's no-destructive-migration discipline.
- **Existing records stay readable (FR-I4):** read paths for historical data remain functional, gated only by the unchanged RBAC layer — a lapsed capability hides the *feature surface*, it does not revoke read access to already-created data.
- **Writes fail with a structured entitlement reason (FR-I5):** any write endpoint behind a now-unavailable capability rejects with the structured `requires_plan_upgrade` reason (machine code + localized label), never a generic error and never a silent success. Enforced by the same capability check every feature endpoint gains (§17).
- **Permission-sync re-evaluation (FR-F5/FR-I6):** on entitlement loss, `PermissionSyncService` (re-pointed to the capability entitlement model, FR-F3) re-runs so that no privileged action gated behind the lost capability remains performable through a stale grant — closing the entitlement-loss direction of NFR-7, symmetric with the enable direction.

---

## 10. Data Flow (full picture)

```
Tenant admin clicks "Enable Physiotherapy" in a settings screen
         │
         ▼
Frontend: PATCH /tenants/{id}/capabilities/treatment.physiotherapy
          If-Match: <version>   body: {enabled: true}
         │
         ▼
Router: require_permission("capability.manage") + tenant-id-matches-auth-context guard (NFR-6)
        → CapabilityAdminService.enable_capability(..., expected_version)
         │
         ▼
CapabilityAdminService calls CapabilityService.get_effective_capabilities(tenant_id)
         │            (fetches Layer 1 + Layer 2 + catalog/graph, calls the pure resolver)
         ▼
Resolver says available=True (plan entitles it, appointments.multiday dependency already enabled)
         │
         ▼
CapabilityAdminService upserts TenantCapability row — the ONLY write this whole flow performs
         │
         ▼
Response: full re-resolved capability map (so the frontend never needs a second round-trip)
         │
         ▼  (read-only, next page load or explicit refetch — N-6, no push)
Frontend: useCapabilities() refetches → <CapabilityGate code="treatment.physiotherapy"> renders
```

---

## 11. API Design

| Method | Path | Purpose | Permission |
|---|---|---|---|
| `GET` | `/tenants/{tenant_id}/capabilities` | Full effective-state map (§8.4 FR-H4 fields + localized labels) for the tenant | `capability.view` (new) |
| `GET` | `/capabilities/catalog` | Capability catalog (codes, localized names/descriptions, hierarchy, `display_order`) for building admin UI; **not** tenant-scoped, no entitlement filtering (platform-global). **Does NOT expose `mid_rollout` markers or any raw flag name/value** (NFR-6 — no rollout/config leakage); those are engineering-internal (ADR-R5-05) | `capability.view` |
| `PATCH` | `/tenants/{tenant_id}/capabilities/{code}` | Admin enable/disable toggle (§9.3); requires `If-Match: <version>` (FR-J2); body `{enabled: bool}` | `capability.manage` (new) |
| `GET` | `/tenants/{tenant_id}/features` | **Unchanged existing endpoint** (BC-1) — during the migration window, internally still computed as today; Group F re-points its internals to be backed by the resolver (verified for shape-parity) before the endpoint itself is ever deprecated | (existing) |

**Tenant-scoping (NFR-6, AC-SEC-1/5):** for every `/tenants/{tenant_id}/...` route, the `tenant_id` in the path is checked against the authenticated context's tenant; a mismatch is rejected (403), exactly as this codebase's existing tenant-scoped routers already do (e.g. `create_treatment_recommendation`'s own `if user_context.tenant_id != tenant_id` guard). A request-supplied id can never widen access beyond the token.

`PATCH` failure responses use the same structured-error convention R4 established for `VersionConflictError` (409 with a typed `error` code + localized `message`), applied to `not_entitled` / `dependency_unmet` / `blocks_dependents` / `version_conflict` rejection cases (FR-J5) — no new error-shape convention introduced. On success the `PATCH` returns the full re-resolved map + new `version` (FR-H2 — the initiating client refreshes without a second round-trip).

---

## 12. Frontend Integration

- **`useCapabilities()`** (`core/hooks/useCapabilities.ts`) — fetch-once-per-session, mirrors `useFeatures()`'s exact caching/invalidation shape (React Query, same staleness convention). Returns the full FR-H4 field-set map (§8.4) plus a `t()`-integrated `getReason(code)` helper (reusing the frontend's own existing `useTranslation()` for the same reason-code strings §9.2 seeds server-side, keeping frontend and backend reason text in sync by sharing the key set, not duplicating copy).
- **Mutation cache invalidation (FR-H2, within N-6):** the admin-toggle mutation hook (`useToggleCapability()`) **invalidates/refetches the capabilities query in the initiating client on success** — using the full re-resolved map the `PATCH` already returns (§9.3 step 7) to update the cache immediately, so the admin's own screen never shows stale state after their own successful toggle. This is React Query's standard `onSuccess` cache-update, **not** WebSockets/push: other already-open sessions still update only on their next fetch or next session (N-6 preserved). The mutation also passes the current `version` as `If-Match` (FR-J2), surfacing a `version_conflict` as a "capabilities changed, please review" state rather than clobbering a concurrent change.
- **`<CapabilityGate code="...">`** — conditional-rendering primitive, generalizing the ad hoc `if (flag) { ... }` pattern into one reusable component so a future phase's screen never hand-rolls its own gate (directly serves BO-3/AC-12). Its **UI contract is defined explicitly** (so every consuming screen behaves consistently, not per-author-guess):
  - **Loading state:** while `useCapabilities()` is fetching (first load, no cached map yet), `<CapabilityGate>` renders its `fallback` prop if given, else `null` — it **never** renders its children optimistically before the map resolves (avoids a flash of a feature the tenant may not have). A `<CapabilityGate.Skeleton>` convenience is provided for the common "show a placeholder" case.
  - **Available + enabled:** renders `children`.
  - **Available but not enabled** (tenant preference off): renders `null` by default; a screen that wants an "enable this" affordance uses the explicit `whenDisabled` render-prop instead of relying on gate internals.
  - **Unavailable** (not entitled / dependency unmet / deprecated / mid-rollout-off): renders `null` by default (feature is simply absent), **or** the `whenUnavailable` render-prop — which receives the `blocked_reason_code` + localized reason so a screen can show "Upgrade to Professional to unlock" where product wants an upsell. **Hidden-vs-disabled is the consumer's explicit choice** via which render-prop they pass — the gate never silently renders a dead/disabled control; default is hide.
  - **Nested gates:** compose freely and independently — an inner gate re-checks its own `code` against the same cached map; there is no implicit parent-child coupling in the component (the *data* already encodes dependencies via `effective_available`, so a child capability's gate is already false when its parent is unavailable — the component needs no special nesting logic).
  - **Error/suspense:** on a capabilities-fetch error, the gate renders its `fallback`/`null` (fail-closed — hide the gated feature rather than show it on an errored/unknown state), and surfaces the error to the app's existing error boundary rather than swallowing it. It integrates with the existing React Query error/suspense conventions already used by `useFeatures()`, introducing no new async-rendering pattern.
  - **Never a security boundary:** `<CapabilityGate>` is visibility only; the backend `require_permission` + capability check remain the real gate (NFR-7/AC-SEC-2/3). A gate rendering children is not permission to act — it only avoids showing a control the user could not use anyway.
- **Minimum admin UI** (FR-H3) — a settings-screen list of top-level + child capabilities for the tenant, each row showing available/unavailable + reason, with a toggle for available-but-not-required-by-a-dependent capabilities. Full catalog-curation UI (cross-tenant) is out of scope (N-7).

---

## 13. ADR Summaries (all `requirements.md` §12 candidates ADR-R5-01..10, resolved)

*Every ADR below follows the same uniform structure for readability: **Decision · Motivation · Alternatives rejected · Consequences · Trade-offs · Future impact · Status**. "Trade-offs" names what the decision costs (what we accept by choosing it); "Future impact" names how the decision shapes or constrains later phases (R6+).*

**ADR-R5-01 — Single hierarchical Capability model; no separate Module entity.**
- *Decision:* One `Capability` table, self-referencing via `parent_capability_id`. A top-level row (`parent_capability_id IS NULL`) fills the role `included_modules`/`subscription_modules.py`'s "module" concept fills today; a child row is the fine-grained tenant toggle. `category` is a separate, UI-only grouping field — explicitly not a second hierarchy.
- *Motivation:* `requirements.md` §2 finding #4-vs-#5 (`enabledfeatures` vs `featuresettings`, two overlapping fields on one row) is direct, in-codebase evidence that introducing two parallel "sounds-similar" concepts (Module + Capability) recreates the exact disease this phase exists to cure. One entity, one hierarchy depth field, is simpler and has no ambiguous boundary to maintain.
- *Alternatives rejected:* (1) Separate `Module` and `Capability` tables with a `module_id` FK on `Capability` — rejected; every "is X a module or a capability" judgment call becomes a second classification decision with no clear rule, mirroring the exact ambiguity `enabledfeatures`/`featuresettings` already demonstrates in production. (2) Flat, non-hierarchical capability list with a naming convention only (e.g. `treatment.ayurveda` implies "treatment" module by string convention) — rejected; string-convention-as-structure is exactly mechanism #1's own failure mode (a hardcoded, unenforced convention that can silently drift from what the data says).
- *Consequences:* `tasks.md` implements one table, one self-FK, one `category` string column — no second catalog table anywhere in this phase's schema changes.
- *Trade-offs:* a "module" has no dedicated table with module-specific columns; any module-only metadata (e.g. the old `permissions_count`) becomes a nullable column or JSONB on `Capability` — acceptable given N-7 (no elaborate catalog UI needs those yet).
- *Future impact:* every future phase registers into one catalog with one mental model ("everything is a capability, depth is just `parent_capability_id`") — no "is this a module or a capability" judgment call ever recurs.
- *Status:* **Approved.**

**ADR-R5-02 — Resolver is a pure domain module, mirroring `treatment_lifecycle_resolver.py`'s corrected shape.**
- *Decision:* `app/domain/services/capability_resolver.py`, pure function, frozen dataclass input, no I/O, no localization import — label/reason-text resolution lives in `CapabilityService` (application layer), exactly mirroring the fix R4's own architecture review applied to its resolver (not the mistake that review found and corrected).
- *Motivation:* Direct reuse of an already-proven, already-corrected pattern in this exact codebase — R5 inherits the lesson without needing to relearn it.
- *Alternatives rejected:* Resolver-as-application-service-method (no separate domain module) — rejected; loses the clean unit-testability (pure function, no mocking needed) R4's own resolver tests demonstrated is valuable, and blurs the OW-2 "read/presentation computation, not a competing writable field" boundary this document series treats as a hard invariant.
- *Consequences:* `tasks.md` includes a dedicated resolver-unit-test task mirroring R4's own T-C.2, covering every branch of §8.3's decision tree plus the cycle-guard fail-closed path.
- *Trade-offs:* the application layer must assemble the two snapshots before calling the resolver (an extra orchestration step vs. a resolver that fetches its own data) — accepted, because that step is exactly where caching, localization, and the billing seam belong (§9.1), and it is what keeps the resolver unit-testable with zero mocks.
- *Future impact:* the pure `resolve(catalog, tenant)` contract + two-snapshot input (§8.2) is the stable seam every future input (quotas §18.1, global policy) extends without touching the signature — the resolver's public API is intended to outlive R5 unchanged.
- *Status:* **Approved.**

**ADR-R5-03 — A single billing-owned active-plan resolution contract, migration-aware three-tier precedence; neither raw string field is read directly by any *other* consumer.**
- *Decision:* Introduce `resolve_active_plan(tenant_id)` (§9.0) as the **one** authoritative answer to "what plan governs this tenant's entitlement now," resolved via an explicit three-tier precedence: **Tier 1 `active_subscription`** — `OrgSubscription`'s existing lifecycle (`status`, `current_period_end`, trial windows), handling every state explicitly — active, expired, cancelled, suspended, trial, pending, no-subscription, and multiple-historical-rows (FR-A3a); **Tier 2 `legacy_tenant_projection`** — reached *only* when zero `OrgSubscription` rows exist for the tenant, reading `OrgTenant.subscription_plan` as a named, logged, time-bounded migration-window compatibility source; **Tier 3 `minimum_fallback`** — the CORE-equivalent floor, reached only when neither tier above resolves. No consumer *other than this contract itself* (resolver, `PermissionSyncService`, `rbac_seed.py`'s seeding path, future phases) reads `OrgSubscription.plan_code` or `OrgTenant.subscription_plan` directly (FR-A3c). This does **not** predetermine that either raw field is "the authority" — the *contract*, including its explicit tiering, is the authority.
  - **Amendment (post-T-A.2, required review):** the original decision assumed `OrgSubscription` coverage was universal enough that "no active subscription" could fall straight to Tier 3 (the minimum floor). T-A.2's audit proved this false — three of four live tenant-creation paths never create an `OrgSubscription` row at all, meaning most existing tenants would have hit Tier 3 immediately, discarding their real `subscription_plan` value. Tier 2 is the correction: an explicit, tested, observable, *temporary* bridge — not a silent equivalence with Tier 1, and not a permanent third source of truth. Every Tier 2 resolution is counted (`capability_active_plan_legacy_fallback_count`, §16a) so the population relying on it is visible and can be driven to zero.
- *`OrgTenant.subscription_plan` disposition (FR-A3b) — phased, explicitly not claimed as already final:* during the migration window it is read by exactly one place — this contract's Tier 2 — and continues to be written by its live call sites exactly as today (T-A.2 found six: org-admin `PATCH`, org-admin `POST` create, onboarding go-live, onboarding provisioning, `SubscriptionCheckoutService`'s checkout flow, and `TrialService.convert_trial_to_subscription`). Its **approved final disposition** is to become a computed/read-only projection with no independent writers (per T-A.2's recommendation) — but that end-state is reached only after **T-C.2b** (a separately reviewed subscription-record reconciliation/backfill task, not decided or executed here) reduces Tier 2 reliance and Group F's parity proof confirms safety. `design.md` does not claim this end-state exists yet — see §9.0's own note.
- *Motivation:* `OrgSubscription` is what the actual billing/payment lifecycle already governs; `OrgTenant.subscription_plan` has no confirmed *coordinated* writer keeping it in sync (§2.4, and T-A.2's six-writer enumeration confirms this concretely rather than just suspecting it). But entitlement is a *lifecycle* question (is the subscription active/expired/trial — or does one not exist yet because this tenant was provisioned through a path that never created one?), not a single-column lookup — so the answer must be a contract with an explicit transitional tier, not a field, without R5 taking over billing (N-2) and without R5 manufacturing billing history it doesn't own (T-A.2's binding constraint: no fake `OrgSubscription` row without its own separately approved plan).
- *Alternatives rejected:* (1) Naming either raw column authoritative — rejected; a raw column can't express "expired yesterday," "one of three historical rows," or "no subscription row exists because this tenant was provisioned through onboarding, not checkout." (2) Building a new subscription state machine inside R5 — rejected; that redesigns billing (N-2). (3) *(new, post-T-A.2)* Treating "no `OrgSubscription`" as equivalent to "minimum fallback" — rejected; T-A.2 proved this silently mis-entitles the majority of existing tenants, which is a regression, not a migration. (4) *(new, post-T-A.2)* Backfilling `OrgSubscription` rows for every existing tenant as part of this ADR/contract's own implementation — rejected; manufacturing billing-adjacent records (status, dates, trial semantics, billing implications) is a distinct, higher-risk decision that must be separately reviewed (T-C.2b), not bundled into the resolver's own rollout.
- *Consequences:* `tasks.md` includes a Group A audit task (T-A.2, completed) enumerating every current reader/writer of both fields — which found a *wider* surface than originally assumed, including a second live entitlement-filtering engine (`rbac_seed.py`) and zero live `OrgSubscription` creation on three of four tenant-provisioning paths — and a task (T-C.2) implementing `resolve_active_plan` with tests for every Tier-1 lifecycle state *and* the Tier-2/Tier-3 precedence and `source` field. `PermissionSyncService` (§2.2) is re-pointed to it (T-D.5a), and so, newly, is `rbac_seed.py`'s `_seed_tenant_permissions_async` (T-D.5b), with a parity test between the two (T-D.5c) — both found by T-A.2, neither in the original consequences list.
- *Trade-offs:* one more indirection (a function call rather than a column read) on every entitlement lookup, and R5 owns a small amount of subscription-lifecycle *reading* logic — accepted as far cheaper than the silent drift (§2.4) the raw-column approach already causes, and bounded to *reading* (never writing) billing state (N-2). The three-tier design adds a second trade-off: Tier 2's existence means the contract carries transitional complexity (a tier, a metric, a reconciliation task) that a "clean" `OrgSubscription`-only design wouldn't need — accepted because the alternative (ignoring the audit's finding) would ship a resolver that is wrong for most of today's tenants on day one.
- *Future impact:* a future billing change (new plan states, proration, grace periods) is absorbed by editing one function (`resolve_active_plan`) that every consumer already goes through — the entitlement/billing seam is isolated, so R5's consumers never need to change when billing evolves. Tier 2 is explicitly temporary: T-C.2b's reconciliation work plus Group F's parity proof are the named, tracked path to eventually removing it, not an open-ended permanent fixture.
- *Status:* **Approved (revised per requirements revision #2; further amended post-T-A.2 audit for migration-aware three-tier precedence — this amendment).**

**ADR-R5-04 — Feature-flag adoption: `capability_platform_v1_enabled`, defaulting OFF.**
- *Decision:* Adopt `capability_platform_v1_enabled`, mirroring `clinical_spine_v1_enabled`/`treatment_lifecycle_v1_enabled`'s exact mechanism (a `Settings` field, no DB migration for the flag itself, `get_tenant_features` addition during the transition, later folded into the new `/capabilities` endpoint's own always-on availability once the flag concept graduates). **Required**, not optional — this phase changes the authoritative answer to "what can this tenant do," the most consequential kind of change this document series has a precedent for gating.
- **Removal criteria** (mirrors R4 ADR-R4-04's own closed-loop discipline): the flag is removed once (a) every mechanism in Area G's classification table has executed its retirement/deprecation, (b) the resolver has been live for at least one full pilot-tenant cycle with zero AC-8-class regressions, and (c) an explicit removal task is approved.
- *Motivation:* Doc 07 §3 Backward Compatibility/No Big-Bang; this is the first R5-series phase to touch backend-owned entitlement data, exactly the class of change R3B/R4 both required a flag for.
- *Alternatives rejected:* No flag — rejected for the same reason R4 rejected it: this changes what every tenant admin and every future phase treats as ground truth for "can I use this," not a purely additive change.
- *Consequences:* `tasks.md` must include a task building the flag and gating every write-path (Group D) and retirement (Group F) behavior change behind it.
- *Trade-offs:* two code paths coexist during the migration window (old mechanisms + new resolver), the standard R3B/R4-precedented cost of a flagged rollout — accepted for the safe-rollback it buys on a first-in-series backend-data-owning phase.
- *Future impact:* the flag is a *temporary* migration tool with recorded removal criteria (State 2, §16) — it is explicitly not a permanent branch point; R6 inherits a single always-on platform, not a flag to reason about.
- *Status:* **Approved.**

**ADR-R5-05 — Capability vs. rollout flag: formal boundary.**
- *Decision:* A capability catalog row MAY carry a `mid_rollout: bool` marker (and, if so, an associated existing `xxx_v1_enabled`-style flag name) — when set, the resolver's §8.3 decision tree additionally requires that flag to be true, on top of (never instead of) entitlement/dependency checks. This marker is **engineering-internal**: it is never itself exposed as a tenant-admin-facing toggle, and it is never itself readable via the public `/capabilities/catalog` endpoint's response for a non-platform-engineering caller (future refinement, RBAC-gated if ever exposed). A capability's `mid_rollout` marker is removed (not merely set false) once the underlying code has graduated — at that point it behaves exactly like every other capability, with no flag dependency at all.
- *Motivation:* Directly resolves `requirements.md` N-4 — prevents a flag from ever masquerading as a tenant-facing entitlement decision, while still letting engineering stage a not-fully-proven capability's code behind the existing, proven flag mechanism during its own rollout.
- *Alternatives rejected:* Every capability implicitly checks a same-named flag — rejected; would force every future phase to create a flag for every capability, reintroducing exactly the "seventh mechanism, but now mandatory" failure this document exists to prevent. The overwhelming majority of capabilities need no flag at all once they exist in the catalog.
- *Consequences:* `tasks.md`'s extensibility-proof task (`requirements.md` §20) explicitly demonstrates a capability *without* a `mid_rollout` marker (the common case) — the marker itself is not required to prove the platform works.
- *Trade-offs:* one extra optional catalog field (`mid_rollout`) and one extra resolver branch that most capabilities never hit — a small, contained cost to keep engineering-rollout and tenant-entitlement as cleanly separated axes (N-4).
- *Future impact:* a phase shipping a risky new capability can stage its *code* behind the proven flag mechanism while the capability's *entitlement* is modeled normally — so "not yet safe to run" and "not entitled" never get conflated in any future phase.
- *Status:* **Approved.**

**ADR-R5-06 — No cascading disable; reject with structured blocking-dependent list.**
- *Decision:* §9.3's disable path rejects (never cascades) when other enabled capabilities depend on the target. The rejection response names every blocking dependent by code, so the admin can disable them first if that's genuinely intended.
- *Motivation:* Cascading disable is a genuinely destructive, multi-capability side effect — this document series' own repeated discipline (R4's own no-silent-mutation stance) argues for an explicit, one-capability-at-a-time action set over an implicit blast-radius action, especially for a first version of a brand-new admin surface.
- *Alternatives rejected:* Silent cascade — rejected, violates NFR-3-adjacent "no surprising side effects" discipline and this document's own OWASP-relevant caution around unintended state changes. Cascade-with-confirmation-dialog — deferred, not rejected outright; a legitimate future UX improvement once the platform has real usage data on how often this scenario actually occurs, explicitly left open for a later phase to design (`requirements.md` §12 ADR-R5-06's own framing).
- *Consequences:* `tasks.md`'s disable-path test task must cover the blocking-dependents-listed rejection case explicitly.
- *Trade-offs:* an admin disabling a whole capability subtree must do it one capability at a time (more clicks) — accepted for a safer v1; the rejection names every blocker so the manual order is obvious.
- *Future impact:* leaves the door open for a future cascade-with-confirmation UX (deferred, not foreclosed) once real usage data shows how often the multi-disable scenario occurs — the observability counter `capability_toggle_count{outcome=blocks_dependents}` (§16a) is the exact signal that would justify building it.
- *Status:* **Approved.**

**ADR-R5-07 — Migration/backfill approach: additive catalog, no historical backfill required.**
- *Decision:* The new catalog starts **empty** at deploy time (not backfilled from the six existing mechanisms' historical data in the same migration). A separate, explicitly-reviewed data-seeding task (Group A/B, `tasks.md`) populates the catalog with entries corresponding to today's actually-observed module/feature set (`CORE`, `CLINICAL_DOCUMENTS`, `STAFF_MANAGEMENT`, `INVENTORY`, `REPORTS` from `subscription_modules.py`'s own `MODULES` dict, plus the `appointments.*`/`treatment_sheets.*` keys already visible in `featuresettings`), and a second task seeds `SubscriptionPlanCapability`/`TenantCapability` rows FROM the six mechanisms' CURRENT live values (a read-then-write reconciliation, not a blind historical replay) — every existing tenant's resolved capability state after seeding must match what `get_tenant_features`/`PermissionSyncService` would have said for them the moment before migration (the literal parity check FR-G2 requires).
- *Motivation:* `requirements.md` N-8 (no mandatory backfill without its own separately reviewed plan) — this ADR is that plan's shape, not its full task-level detail (that's `tasks.md`'s job).
- *Alternatives rejected:* Backfill inside the schema migration itself — rejected; couples schema DDL to a data-reconciliation script with very different risk/rollback profiles, violating this codebase's own established convention (every migration reviewed in this phase's own research kept schema and data-seeding cleanly separable).
- *Consequences:* `tasks.md` has two distinct tasks: (1) schema migration (empty tables), (2) data-seeding script (idempotent, re-runnable, logs every row it writes) — never combined into one task.
- *Trade-offs:* a second explicit seed task most migrations in this codebase haven't needed — accepted because coupling data-reconciliation to schema DDL (different risk/rollback profiles) is exactly the kind of shortcut this document series avoids.
- *Future impact:* establishes the pattern every future catalog addition follows — a reviewed, idempotent, logged seed separate from schema — so catalog evolution (§7.6) is always a safe, repeatable operation, not a bespoke script each time.
- *Status:* **Approved.**

**ADR-R5-08 — Template defaults are continuously inherited until explicitly overridden; re-seeding is idempotent and never resurrects a disabled capability.**
- *Decision:* §9.4's model — `source='template_default'` rows follow the template; the first admin toggle flips a capability to `source='admin_override'`, which is thereafter immune to template changes (FR-B2a/b). New catalog capabilities seed `template_default` rows for existing tenants only where no row exists (FR-B2c). Re-seeding is `INSERT ... ON CONFLICT DO NOTHING` for defaults and never touches an `admin_override` row (FR-B2d) — idempotent, and structurally incapable of resurrecting a deliberately-disabled capability.
- *Motivation:* Directly resolves `requirements.md` FR-B2's "template changes must not silently overwrite tenant decisions" — the `source` column makes "did the tenant decide this or inherit it" a stored, auditable fact, not an inference.
- *Alternatives rejected:* (1) Snapshot-at-creation (frozen copy) — rejected; a new tenant would never benefit from a template improvement it didn't explicitly opt into, and there'd be no way to distinguish "inherited" from "chosen" for future reasoning. (2) Always-follow-template (no override immunity) — rejected; silently overwrites tenant decisions, the exact failure FR-B2 forbids.
- *Consequences:* `tasks.md`'s seeding tasks assert idempotency and the "never resurrect a disabled capability" invariant with explicit tests (AC-16).
- *Trade-offs:* the `source` column must be checked on every seed/re-seed (a small extra condition), and "continuously inherited" means a template improvement reaches only tenants who haven't overridden that capability — accepted as the only model that keeps tenant decisions authoritative while still propagating sensible defaults.
- *Future impact:* the `template_default` vs `admin_override` provenance becomes the permanent, auditable answer to "did the tenant choose this or inherit it" — every future feature that reasons about tenant configuration (analytics, support tooling, migration) can rely on it.
- *Status:* **Approved.**

**ADR-R5-09 — Hierarchy implies exactly one documented, tested dependency (parent-availability); nothing else is emergent.**
- *Decision:* §7.2's rule — a child capability depends on its parent being available, encoded as one explicit resolver rule with a dedicated test (`test_child_capability_unavailable_when_parent_unavailable`), never an unstated side effect. All *other* dependencies are explicit `CapabilityDependency` edges. Catalog `category` and `parent_capability_id` carry no other operational meaning (grouping/UI only).
- *Motivation:* Directly resolves `requirements.md` FR-E4 — a child whose parent module is entitlement-off genuinely cannot function, so parent-availability is a real prerequisite; but making it a *documented, tested* rule (not an emergent property of the hierarchy field) is what keeps hierarchy from silently becoming a second, undocumented dependency mechanism.
- *Alternatives rejected:* (1) Hierarchy implies no dependency at all; require an explicit edge from every child to its parent — rejected; doubles edge-row authoring and invites "forgot to link child to parent" bugs, for a dependency that is true in every realistic case. (2) Hierarchy implies dependency *implicitly and undocumented* — rejected explicitly by FR-E4 (the emergent-mechanism trap).
- *Consequences:* the parent-dependency rule and its test are named deliverables in `tasks.md`'s resolver group; any future exception (a child that must not depend on its parent) requires deliberately changing this ADR and its test.
- *Trade-offs:* hierarchy and one specific dependency are coupled (a child *always* depends on its parent) — accepted because that dependency is true in every realistic case, the coupling is explicit and tested (not emergent), and it halves edge-row authoring while eliminating "forgot to link child to parent" bugs.
- *Future impact:* a future capability needing a non-dependent parent (grouping only, no prerequisite) would require consciously revising this one documented rule + its test — which is the intended safeguard: the coupling can change, but only visibly and deliberately, never by accident.
- *Status:* **Approved.**

**ADR-R5-10 — On entitlement loss, retain the tenant preference; effective state goes unavailable immediately; no data deleted; permission sync re-evaluated.**
- *Decision:* §9.5's policy — the `TenantCapability.is_enabled` preference is **retained** (auto-reactivates on re-entitlement); `effective_enabled` is false while unentitled regardless (FR-I1/I2); no clinical/business data is deleted (FR-I3); existing records stay readable under RBAC (FR-I4); writes fail with a structured `requires_plan_upgrade` reason (FR-I5); `PermissionSyncService` re-runs so no privileged action is left performable (FR-F5/I6).
- *Motivation:* Directly resolves `requirements.md` Area I — the scenario cannot be left unspecified. Retention is the least-surprising choice (a downgrade-then-re-upgrade returns the tenant to exactly their prior state), made unambiguous by the FR-H4 distinct fields (`preference on, effective off` is a first-class state).
- *Alternatives rejected:* (1) Force-disable the preference on loss — rejected; silently destroys the tenant's prior choice, forcing manual re-toggling on re-entitlement. (2) Delete data created under a lapsed capability — rejected outright (FR-I3, destructive; also a data-loss/compliance hazard). (3) Grace period at the resolver — rejected; grace/notice is a billing concern (N-2), kept upstream of the resolver's inputs.
- *Consequences:* `tasks.md` includes an entitlement-loss test group (AC-17) covering effective-unavailability, preference-retention, no-deletion, structured write-rejection, and permission-sync re-evaluation.
- *Trade-offs:* retaining a preference the tenant can't currently use means the enablement table holds "aspirational" rows (preference on, effectively off) — accepted because the FR-H4 distinct fields make that state unambiguous, and it delivers the least-surprising re-entitlement behavior (nothing to re-toggle after re-upgrade).
- *Future impact:* the retain-preference policy + FR-H4 field distinction is what a future quota/downgrade-proration model (§18.1) builds on — "entitled vs preferred vs effective" is already a first-class, tested distinction, so quantitative entitlement changes slot into the same shape.
- *Status:* **Approved.**

---

## 14. Rollback Strategy

- **Flag-first (ADR-R5-04):** disabling `capability_platform_v1_enabled` reverts every consumer to the six existing mechanisms' current behavior — no data loss, mirrors R4/R3B's own rollback posture exactly.
- **No data loss:** every existing mechanism's storage is untouched (§5 ownership table, "kept read-only" dispositions) — disabling the flag does not orphan any data.
- **No dependency on R0–R4 work** (`requirements.md` MIG-2/EG-5) — reverting R5 branches alone is sufficient.
- **Retirement execution (Group F) is the one irreversible-by-flag step** — physically dropping a superseded column/file is a code change, not flag-gated, and is sequenced last (mirrors R4 §12's own "retirement last" discipline) so a mid-rollout rollback never needs to un-retire a mechanism.

---

## 15. Testing Strategy

**Resolver unit tests** (mirroring R4's own T-E.3/T-E.4 negative-check discipline): every branch of §8.3 — not entitled, deprecated (`capability_deprecated`), mid-rollout-and-flag-off, dependency unmet via explicit edge, dependency unmet via the parent rule (ADR-R5-09's named `test_child_capability_unavailable_when_parent_unavailable`), cycle-guard fail-closed, fully available-and-enabled, available-but-preference-off; a test proving the FR-H4 fields are **four distinct booleans** (a case where `tenant_preference=true` but `effective_enabled=false`, proving they're not collapsed).

**Active-plan contract tests (§9.0, FR-A3a):** one per lifecycle state — active, expired, cancelled, suspended, trial, pending, no-subscription, and the multiple-active-rows anomaly (latest-period-end wins + warning), and the no-active minimum-floor fallback.

**Seeding tests (§9.4, AC-16):** template_default vs admin_override provenance; admin_override immune to template change; new-capability-for-existing-tenant seeds only where absent; **re-seeding idempotent and never resurrects a deliberately-disabled capability**.

**Entitlement-loss tests (§9.5, AC-17):** effective-unavailable on next resolution; preference retained + auto-reactivate on re-entitlement; no data deletion; write rejected with structured reason; permission-sync re-evaluated.

**Concurrency/idempotency tests (§9.3, AC-18):** idempotent re-enable/re-disable no-op; version-conflict on stale `If-Match`; transactional validate-and-write; audit fields recorded; structured rejection shapes.

**Catalog identity/lifecycle tests (Area K, AC-19):** unique-code enforcement; deprecated resolves to `capability_deprecated` not vanish; FK rejects an orphaning delete; deterministic `(display_order, code)` ordering.

**Architectural regression tests:** a **no-second-catalog test** proving no code path outside `Capability`/`CapabilityDependency` registers a capability (structural grep check, mirroring R4's own `test_review_outcome_groupings_partition_the_full_vocabulary_with_no_overlap` style); a **resolver-purity test** proving `capability_resolver.py` imports nothing from `app.infrastructure`/`app.api`/`app.core.config`/`app.localization` (NFR-8, mirroring R4's own dependency-direction regression).

**Negative security tests (required, explicit — `requirements.md` §15 AC-SEC-1..5):**
- **AC-SEC-1** — a tenant admin request for *another* tenant's `/capabilities` (read or `PATCH`) is rejected (403), not silently scoped-away.
- **AC-SEC-2** — a user with a capability enabled but lacking the RBAC permission cannot perform the action (the endpoint's own `require_permission` still fires).
- **AC-SEC-3** — a user with the RBAC permission but the capability unavailable cannot perform the capability-gated action (the write rejects with `requires_plan_upgrade`, FR-I5).
- **AC-SEC-4** — toggling a parent/category capability grants no child's permissions (composition, not merging: enabling never touches `org_permissions`/`tenant_permissions`, NFR-7).
- **AC-SEC-5** — a request whose path/body `tenant_id` differs from the authenticated token's tenant is rejected (NFR-6).

**Extensibility proof (required, not optional — `requirements.md` §20):** the five-step proof, run against the shipped platform, not simulated.

**Parity tests (Group F, per mechanism):** for each of the six mechanisms classified (A)/(B) under FR-G1, a test comparing the new resolver's output against the old mechanism's output for a representative tenant sample, before that mechanism's retirement is allowed (FR-G2).

**Consolidation check — two measurable exit states (`requirements.md` §16, revised):** unlike R4's screen-count EG-CONSOLIDATE, this phase's metric is mechanism-count-based, split into two milestones: **State 1 (R5 implementation exit)** — exactly **one authoritative write path** and one resolver; any surviving old mechanism is a *classified, read-only, time-bounded* compatibility reader only (no old mechanism remains an independent writer, AC-15). **State 2 (flag-removal exit, later)** — one active mechanism total; every compatibility reader retired or demonstrably read-only with an owner + removal criterion + deadline, and `capability_platform_v1_enabled` removed. This resolves the apparent tension between "target = 1 mechanism" and BC-1/BC-2/N-8/FR-G1-classification-B: the destination is one mechanism, reached in two governed stages, not a single big-bang cutover.

---

## 16. Performance Considerations

- Catalog + dependency graph are expected to remain small (tens to low hundreds of rows, `requirements.md` NFR-5) relative to tenant count (thousands) — the `CapabilityCatalogSnapshot` (§8.2) is cacheable **per-deploy** (changes infrequently, migration-only §7.6), while the `TenantCapabilitySnapshot` is the per-request-variable input. `CapabilityCatalogProvider` (§9.1) SHOULD cache the catalog snapshot in-process, keyed by `catalog_version` — the cache lives in the application layer's fetch step, never inside the domain resolver (whose pure-function contract is unaffected).

  **Cache invalidation — explicitly defined (rev):** the catalog cache is invalidated/refreshed on exactly these triggers, and no others:
  1. **Process restart / deploy** — a fresh instance builds the snapshot once on first use (or at startup, alongside the §7.5 graph validation). Since catalog changes are migration-only (§7.6) and migrations ship with a deploy, a restart is the primary, expected invalidation path.
  2. **`catalog_version` change** — the provider reads the current catalog-migration revision id cheaply (a single indexed lookup, or Alembic's version table) and rebuilds the snapshot when it differs from the cached snapshot's `catalog_version`. This covers the rolling-deploy window (§7.6): each instance converges to the new catalog independently, keyed by version, with no shared-mutable-cache corruption possible.
  3. **Explicit refresh hook** — an internal (non-tenant-facing, platform-engineering-only) cache-refresh entry point the catalog-seed task calls at its end, so a same-process seed run takes effect without waiting for a restart.
  Because the catalog is read-only per instance and version-keyed, two instances briefly holding different snapshots during a deploy is **safe by construction** (§7.6), not a correctness bug — there is no scenario where a stale cache serves a *wrong* answer, only (transiently, within a deploy window) an *older* consistent one.
- The resolver's own graph walk is **O(V + E) — linear in the number of capabilities and dependency edges** (§8.3), and additionally bounded per-path by `MAX_CAPABILITY_DEPTH` (§7.4). This linearity is the design's actual scaling guarantee; the "tens to low hundreds of rows" figure above is the *current* catalog size, not a correctness dependency — even at several hundred capabilities the resolver stays linear, and the memoized/topological evolution (§8.3) keeps it so under dense graphs. The graph walk is in any case negligible relative to the DB round-trips `CapabilityCatalogProvider`/`CapabilityResolutionService` perform to gather inputs, which are the latency-dominant cost and are addressed by the per-deploy catalog cache above.
- `GET /tenants/{id}/capabilities` is expected to be called at most once per frontend session (mirrors `useFeatures()`'s own existing call frequency, §12) — not on every screen render.

---

## 16a. Observability & Metrics

Because the resolver becomes the single seam every entitlement/enablement answer passes through, it is also the single best place to instrument — a diagnostic advantage the six diffuse mechanisms never offered. The platform emits (via this codebase's existing `structlog` structured-logging convention, plus counters/timers on whatever metrics backend is in use):

- **`capability_resolve_count`** — resolver invocations, tagged by outcome bucket (available-enabled / available-disabled / unavailable-by-reason) — reveals which `blocked_reason_code`s dominate (e.g. a spike in `requires_plan_upgrade` may signal a pricing/packaging issue, not a bug).
- **`capability_resolve_latency`** — resolver + input-gather timing (p50/p95/p99) — guards NFR-5; a regression here flags a caching problem (§16) before users feel it.
- **`capability_catalog_cache_hit_ratio`** — per-instance catalog-snapshot cache effectiveness (§16); a low ratio flags a cache-invalidation misconfiguration (e.g. rebuilding every request).
- **`capability_evaluation_failure_count`** — resolver fail-closed events: `capability_graph_integrity_error` (a cycle reached resolution despite §7.3/§7.5) and `capability_not_found` for a code a consumer expected — each is a **data-integrity alert**, not a normal outcome, and pages platform engineering.
- **`capability_dependency_unmet_count`** — tagged by (`code`, blocking `dep_code`) — reveals which dependencies most often block enablement, informing catalog/packaging decisions.
- **`capability_entitlement_mismatch_count`** — incremented by the §9.0 active-plan contract when it hits the multiple-active-subscription-rows anomaly, or when a retained `OrgTenant.subscription_plan` projection is found inconsistent with the contract's answer (FR-A3b drift detection) — the direct, ongoing successor to the one-time §2.4 drift audit, so the drift this phase closes can never silently reopen.
- **`capability_active_plan_legacy_fallback_count`** *(new, post-T-A.2)* — incremented every time §9.0's Tier 2 (`legacy_tenant_projection`) resolves a tenant's plan because no `OrgSubscription` row exists at all — tagged by tenant. This is the direct measure of how many tenants still depend on the migration-window compatibility tier; T-C.2b's reconciliation work is measured against this metric trending to zero, and it is the evidence Group F's eventual retirement of Tier 2 relies on rather than assuming the tier is unused.
- **`capability_toggle_count`** — admin enable/disable operations, tagged by outcome (success / rejected-not-entitled / rejected-dependency / rejected-blocks-dependents / version-conflict) — reveals admin-UX friction (e.g. many `blocks_dependents` rejections may argue for the deferred cascade-with-confirmation UX, ADR-R5-06).

These are **operational metrics, not new persisted state** — they never feed back into resolution (which stays a pure function of its two snapshots, §8.2). `tasks.md` includes a small instrumentation task in the resolver/service group; the metric *names* above are the contract, the backend is whatever this codebase already uses.

---

## 17. Security Considerations (OWASP-relevant)

- **Broken access control — tenant isolation (NFR-6, AC-SEC-1/5):** `TenantCapability` carries `tenant_id` and every query filters on it. The operative `tenant_id` is taken from the **authenticated context and checked against the route/path `tenant_id`** — a mismatch is rejected (403), never silently re-scoped; a request-supplied id can never widen access (mirrors the existing `create_treatment_recommendation` tenant-guard). No tenant-scoped surface can read or mutate another tenant's enablement or resolved state.
- **Catalog/graph/entitlement are platform-owned and unwritable by tenants (FR-F4):** `Capability`/`CapabilityDependency`/`SubscriptionPlanCapability` carry no `tenant_id` and have **no tenant-facing write endpoint at all** — they are mutated only by migration/seeding. A tenant admin cannot create/edit/delete/re-point a catalog row, dependency edge, or plan-entitlement definition, because no such route or service method exists (absent by construction, not merely forbidden by a check).
- **No rollout/config leakage (NFR-6, ADR-R5-05):** the `/capabilities/catalog` and `/capabilities` responses expose resolved effective state and stable reason codes only — never `mid_rollout` markers, raw flag names, or flag values. Rollout plumbing stays engineering-internal.
- **Privilege escalation via capability toggle (NFR-7, AC-SEC-2/3/4):** `CapabilityAdminService` never writes to any `org_permissions`/`tenant_permissions`/`tenant_role_permissions` table — verified by the §15 architectural regression test. A capability being enabled changes what a UI *shows*; RBAC alone decides what an API *allows*, and every action-performing endpoint keeps its own `require_permission` dependency (capability-available AND permission-granted both required — two composed gates, AC-SEC-2/3). On entitlement **loss**, permission-sync re-evaluation (§9.5/FR-F5) ensures no stale privileged grant survives — the escalation concern is closed in both directions.
- **Insecure direct object reference:** the `PATCH /tenants/{id}/capabilities/{code}` endpoint validates `code` against the live catalog (§8.3's `capability_not_found`/`capability_deprecated` branches) before any write — an unknown, inactive, or deprecated code is rejected, not silently accepted as a new ad hoc row.
- **Denial of service via graph depth:** `MAX_CAPABILITY_DEPTH` (§7.4) bounds worst-case resolver cost even under a maliciously or accidentally deep catalog.

---

## 18. Future Extensibility (worked examples, illustrative only — `requirements.md` N-3)

These examples exist to prove §20's extensibility proof is representative of real future work, not to specify any of these capabilities' actual behavior:

- **Telemedicine** (`telemedicine`, `telemedicine.video_consult`, `telemedicine.async_messaging`) — `telemedicine.video_consult` would declare an explicit dependency on `appointments` (a video consult is still an appointment) and likely ship `mid_rollout=true` initially (ADR-R5-05), given video infrastructure is a genuinely new engineering risk class for this codebase.
- **Dental** (`treatment.dental`, child capabilities for specific procedure categories) — a sibling of `treatment.ayurveda`/`treatment.physiotherapy` under the existing `treatment` top-level capability, entitled to different plan tiers, no special rollout flag needed (mature, well-understood domain by the time it ships).
- **Patient Feedback** (`patient_feedback.collection`, `patient_feedback.analytics`) — `patient_feedback.analytics` depends on `patient_feedback.collection` (can't analyze what you don't collect) — a clean, small worked example of the implicit-parent-is-not-enough case explicit `CapabilityDependency` edges exist for (§7.2), since these two are siblings, not parent/child, in the hierarchy.
- **Billing extensions** (`billing.invoicing`, `billing.multi_currency`) — `billing.multi_currency` depends on `billing.invoicing`; both would typically be Enterprise-tier-only entitlements, a clean worked example of `SubscriptionPlanCapability` gating without any dependency-graph novelty.

None of the above is built by R5 (N-3) — they illustrate that the catalog/graph/resolver/admin-toggle machinery this phase ships is sufficient for all four without any of them requiring a schema change, a new resolver branch, or a new ad hoc filter.

### 18.1 Beyond boolean: quotas, limits, and quantified entitlements (acknowledged future direction, not built in R5)

R5's effective state is **boolean** (`effective_available`/`effective_enabled`). A future release may need **quantified** entitlements — quotas (max 5 telemedicine rooms), usage counts (200 SMS/month), licensed quantities (10 seats), or otherwise configurable per-plan/per-tenant limits. This design is deliberately shaped so that evolution is **additive, not a rewrite**:

- **The two-snapshot resolver input (§8.2) is the extension point.** A quantified entitlement is a *tenant-scoped* input — it extends `TenantCapabilitySnapshot` (e.g. a `limits: Mapping[str, int]` field), and the plan-side ceiling extends `SubscriptionPlanCapability` (a nullable `quantity` column) — **without changing the resolver's `resolve(catalog, tenant)` signature** or any existing boolean capability's behavior. This is exactly the stability §8.2 was restructured to provide.
- **The output would gain a field, not lose one.** A future `CapabilityState` could carry `limit: int | None` and `usage: int | None` alongside today's booleans — the FR-H4 distinct-field discipline (never collapse concerns) already established here is what makes adding a quantitative axis safe: "available," "enabled," and "within quota" stay three separate answers, never one overloaded value.
- **What R5 deliberately does *not* do:** it does not model quotas now (N-3-adjacent scope discipline — build the platform, not speculative features), does not add nullable quantity columns "just in case" (they'd be dead schema until a real requirement shapes them), and does not let the boolean resolver pretend to answer a quantitative question. The acknowledgement here is a **directional guarantee** (the platform can grow this way without a rewrite), not a half-built feature.

A future "R-quotas" phase would write its own requirements/design against these seams — this note exists so that phase inherits a platform ready to extend, exactly as R5 itself inherited R4's resolver and OCC patterns rather than reinventing them.

---

## 19. Risks

- **Catalog becomes a dumping ground if not curated.** Nothing in this design technically prevents platform engineering from registering low-value or overly granular capabilities. Mitigated by process (a lightweight catalog-entry review convention), not by schema — an acknowledged, deliberately out-of-schema risk (curation discipline is a team practice, not a database constraint).
- **`OrgSubscription.plan_code` promotion (ADR-R5-03) could surface a latent billing/entitlement mismatch** for tenants where the two fields have already silently drifted (§2.4). **Confirmed, not merely hypothetical:** T-A.2 (`tasks.md`) proved three of four live tenant-creation paths never create an `OrgSubscription` row at all, meaning most existing tenants have no Tier-1 data to resolve against. §9.0's Tier 2 (`legacy_tenant_projection`) and the separately reviewed T-C.2b reconciliation task are the resolution this risk required — not a future concern, an already-actioned one. Group F's parity tests remain the direct safety net for the eventual cutover.
- **Dependency graph misuse** — a well-intentioned but overly deep dependency chain (e.g. an accidental 6-level chain) degrades the "one obvious reason" UX goal (FR-D1) even though it's technically within `MAX_CAPABILITY_DEPTH`. Mitigated by the same curation discipline noted above, not a hard schema limit (a hard limit lower than 8 would be an arbitrary, not evidence-based, constraint at this stage).
- **Doc 05 inaccessibility** (`requirements.md`'s own recorded gap) means this design cannot independently re-verify Doc 05's own Capability & Access Model section against its original text — relies on already-approved citations, as `requirements.md` itself already flagged.

## Tradeoffs

- **Single hierarchical entity (ADR-R5-01) vs. two entities:** chosen for simplicity and to avoid recreating the `enabledfeatures`/`featuresettings` ambiguity — the tradeoff is that a "module" has no dedicated table with module-specific columns (e.g. `permissions_count`, visible today only in the soon-to-be-retired `subscription_modules.py`'s `MODULES` dict); any such module-specific metadata becomes a JSONB or additional nullable column on `Capability` instead, acceptable given this phase's own N-7 (no elaborate cross-tenant catalog-management UI needs those fields yet).
- **Empty-catalog-then-seed (ADR-R5-07) vs. backfill-in-migration:** chosen for migration/rollback safety at the cost of a second, explicit task most schema migrations in this codebase's history haven't needed — accepted because R4's own migrations never needed a comparable historical-reconciliation step (R4's new fields were genuinely new concepts with no prior data to reconcile), making this genuinely new ground this phase alone needs to cover carefully.
- **No cascading disable (ADR-R5-06) vs. cascade-with-confirmation:** chosen for a safer v1 at the cost of more manual admin clicks in the (expected to be rare) case a tenant wants to disable a whole capability tree at once — explicitly left open for a future phase's UX improvement.

## Rejected alternatives (documented, not repeated per-ADR)

- **A single flat "features" JSONB column on `OrgTenant`**, replacing all six mechanisms with a seventh JSONB blob — rejected outright at the framing stage: this is mechanism #5 (`featuresettings`) by another name, with the identical "no dependency graph, no entitlement/enablement distinction, no queryable catalog" limitations this entire document exists to resolve.
- **Reusing `org_permissions`/`tenant_permissions` directly as the capability mechanism** (treat "capability enabled" as just another permission) — rejected; conflates visibility/entitlement with authorization (violates FR-F1/NFR-7 by construction) and would make a future RBAC change accidentally change tenant entitlement, or vice versa — exactly the coupling this design's Area F composition discipline exists to prevent.

---

## 20. Traceability Matrix

| Design element | Requirements basis | Current-State Evidence |
|---|---|---|
| §1 Overview, ownership-first framing | `requirements.md` §1 core principle | R4's own founding-sentence pattern, reused |
| §2 Current State Audit | `requirements.md` §2/§3 | `subscription_modules.py`, `org_subscription_plan.py`, `permission_sync_service.py`, `org_template.py`, `tenant_permission.py` |
| §4 Domain Model, ADR-R5-01 | `requirements.md` FR-A1, OW-1 | `requirements.md` §2 finding #4/#5 |
| §5 Ownership table | `requirements.md` OW-1/OW-4 | §2 of this document |
| §6/§7 Catalog & Dependency Graph | `requirements.md` FR-A1, FR-E1..E3 | §2.3 (no prior dependency concept) |
| §8 Resolver, ADR-R5-02 | `requirements.md` FR-C1..C3 | R4's own `treatment_lifecycle_resolver.py`, post-architecture-review shape |
| §9.0 Active-plan contract | `requirements.md` FR-A3/A3a-c, ADR-R5-03 | §2.4 `OrgSubscription`/`OrgTenant` drift; `OrgSubscription` lifecycle enums |
| §9.1–9.3 Application Layer + write path | `requirements.md` FR-D1, FR-B3, Area J | R4's own `_attach_lifecycle_status` + `VersionConflictError`/If-Match OCC precedent |
| §9.4 Seeding | `requirements.md` FR-B2/B2a-d, ADR-R5-08 | `OrgTemplate` + new `org_template_capabilities` |
| §9.5 Entitlement loss | `requirements.md` Area I, ADR-R5-10 | N-8 no-destructive-migration discipline |
| §11 API Design | `requirements.md` FR-H1/H4, NFR-6 | R4's own `TreatmentOrderResponse` additive-field + tenant-guard precedent |
| §12 Frontend Integration | `requirements.md` FR-H2/H3/H4, N-6 | Existing `useFeatures()` + React Query mutation-invalidation convention |
| §13 ADRs | `requirements.md` §12 candidates ADR-R5-01..10 | All ten resolved above |
| §17 Security | `requirements.md` NFR-6/NFR-7/NFR-8, AC-SEC-1..5 | OWASP broken-access-control/privilege-escalation; Clean Architecture dependency direction |
| §8.2 two-snapshot input | Architectural review #1 (resolver-input growth) | Stable `resolve(catalog, tenant)` signature for R6+ |
| §9.1 named collaborators | Architectural review #2 (God-Service risk) | ActivePlanResolver / CatalogProvider / ResolutionService / LocalizationService seams |
| §7.6 Catalog Evolution | Architectural review #3 (catalog versioning) | migration-only changes, `catalog_version`, partial-deploy skew safety |
| §16 Cache invalidation | Architectural review #4 | restart / `catalog_version` change / explicit refresh |
| §7.5 Graph validation | Architectural review #5 | cycles / orphans / missing parents / dep-on-deprecated / duplicates, at startup+migration |
| §12 CapabilityGate contract | Architectural review #6 | loading / unavailable / hide-vs-disable / nested / suspense-error |
| §16a Observability | Architectural review #7 | resolve count/latency, cache hit ratio, failure + entitlement-mismatch counters |
| §18 + §18.1 Future Extensibility | `requirements.md` §20, BO-3, N-3; architectural review #8 (beyond boolean) | Illustrative only; quota/quantity evolution acknowledged as additive |

---

## 21. Definition of Done

- ADR-R5-01 through **10** (§13) approved with this `design.md`.
- The Capability Platform Ownership table (§5) approved before any Group B+ implementation task begins (EG-6) — recorded in `tasks.md`.
- §8's resolver implemented as a **pure domain module** (NFR-8, verified by the purity regression test), unit-tested against every branch of §8.3 including the cycle-guard fail-closed and deprecated-capability paths.
- §9.0's active-plan resolution contract implemented and tested across every Tier-1 subscription lifecycle state (FR-A3a), **plus the Tier-2 `legacy_tenant_projection` and Tier-3 `minimum_fallback` paths** (amended post-T-A.2); no consumer *other than the contract itself* reads either raw plan field directly (FR-A3c); the `capability_active_plan_legacy_fallback_count` metric (§16a) is live and observable. T-C.2b's own reconciliation execution is **not** a precondition of this phase's closure — it is a separately reviewed, explicitly deferrable task; this phase's DoD requires only that Tier 2 exists, is tested, and is measured, not that its usage has already reached zero.
- §6/§7's catalog and dependency graph implemented, DAG-only, cycle rejection verified at declaration and (defensively) resolution time; catalog identity/lifecycle (Area K) enforced (immutable keys, deprecate-not-delete, referential integrity, deterministic ordering).
- §7.2's parent-as-dependency rule implemented as one documented, tested rule (ADR-R5-09) — hierarchy is not an emergent dependency anywhere else.
- §9.3's admin write path verified: entitlement + dependency respected (no independent re-derivation, FR-C3); disable rejects with named blocking dependents, never cascades (ADR-R5-06); idempotent, OCC-guarded, transactional, audited (Area J).
- §9.4 seeding (template_default vs admin_override, idempotent, never resurrects a disabled capability — AC-16) and §9.5 entitlement-loss behavior (AC-17) verified.
- §17's security checks verified, including the five explicit negative security tests (AC-SEC-1..5): cross-tenant denial, capability-vs-RBAC composition both directions, parent-toggle-grants-no-child-permission, and request-id-cannot-override-auth-context.
- §15's parity tests pass for every mechanism classified (A)/(B) under `requirements.md` FR-G1, before that mechanism's retirement executes; **State 1 exit** met (one authoritative writer, no old mechanism remains an independent writer — AC-15).
- The `requirements.md` §20 extensibility proof passes against the shipped platform.
- Flag removal criteria (ADR-R5-04) recorded; **State 2 / flag-removal exit** defined even though its completion is a later milestone.
- The architectural-review refinements are realized: the resolver takes the two immutable snapshots (§8.2, review #1); `CapabilityService`'s collaborators exist as named single-responsibility seams (§9.1, review #2); `validate_capability_graph` runs at startup + migration covering cycles/orphans/missing-parents/dep-on-deprecated/duplicates (§7.5, review #5); catalog cache invalidation is implemented on restart / `catalog_version` change / explicit refresh (§16, review #4); the `<CapabilityGate>` UI contract (§12, review #6) and the observability metrics (§16a, review #7) are implemented; the Catalog Evolution rules (§7.6, review #3) and the boolean→quantity future-direction note (§18.1, review #8) are recorded.
- No R0–R4 guarantee regressed; rollback (§14) verified without touching prior-phase work.

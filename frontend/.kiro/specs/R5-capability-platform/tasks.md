# Release 5 — Capability Platform — Tasks

**Release:** R5 · **Document type:** Tasks (Doc 07 §13) — the implementation breakdown of the approved `requirements.md` + `design.md`. **No code is written by this document.** Tasks execute **one at a time**, each after an explicit "Approved, proceed with T-X.Y", each closed with a written outcome appended in place (mirroring R4's own living-`tasks.md` precedent). Each task is sized to **one Claude implementation session**.

**Traceability:** every task cites the `requirements.md` FR/AC/NFR/ADR and `design.md` § it realizes. Nothing here introduces scope not already in those two documents.

**Execution flow (binding — governance rules 8 & 9 below):** tasks do **not** auto-continue. Each task is `approve → implement → completion report → architecture review → approve → next`. Every completed task appends a **completion report** (Files changed · Reason · Verification · Architecture deviations discovered · Unexpected findings) in place — mirroring R4's living-`tasks.md` precedent, which worked extremely well.

**Repositories & workflow (finalized, EG-1..3):** two repos, same branch name.
- Frontend: `feature/r5-capability-platform`, from frontend `dev`.
- Backend: `feature/r5-capability-platform`, from backend `dev`.
- Workflow: `dev → feature/r5-capability-platform → test → validated test → dev`.
- `(be)` = backend repo task, `(fe)` = frontend repo task, `(doc)` = documentation-only.

---

## Governance rules binding on every task

1. **Branch gate (EG-4).** No implementation task (Group A onward) begins until Group G0's branch gate has passed and is recorded below.
2. **Ownership gate (EG-6 / OW-4).** **No task from Group B onward may begin until Group A is approved at T-A.4** — the ownership table (T-A.1), the subscription-field reader audit (T-A.2), and the catalog-seed inventory (T-A.3). Hard blocker, recorded below.
3. **Flag-gated (ADR-R5-04).** Every Group C/D/E behavior change is gated behind `capability_platform_v1_enabled` (default OFF); rollback is flag-flip first (§14).
4. **Additive-only, retire-after-parity (ADR-R5-03/07, Area G).** No existing mechanism (§2) is removed until its own parity task (Group F) proves the resolver gives an equivalent-or-better answer. **State 1 exit** (no old independent writer, AC-15) is the phase's DoD; **State 2** (flag removal, all compat readers retired) is a later milestone.
5. **Resolver purity (NFR-8).** The domain resolver imports nothing from `app.infrastructure`/`app.api`/`app.core.config`/`app.localization`; a regression test enforces this. Any task touching the resolver re-runs it.
6. **Two composed gates, never merged (FR-F1, NFR-7).** No task makes a capability toggle grant/revoke a permission; capability answers "visible/available," RBAC answers "allowed."
7. **Usable, not just built.** A capability action is not "done" until its owner screen exposes it and the relevant journey/extensibility proof passes (Groups E/Z) — backend-only completion is not acceptance.
8. **Mandatory completion report per task (worked extremely well in R4).** Every completed task is closed with a written outcome appended in place, containing at minimum: **Files changed · Reason · Verification (what was run + result) · Architecture deviations discovered · Unexpected findings.** A task with a green test suite but no completion report is not closed. This is the record the next task, the architecture review, and any future recovery depends on.
9. **No automatic continuation between tasks (prevents scope creep).** Claude does not proceed from one task to the next on its own. The per-task flow is strictly:

   ```
   User approval  →  Implementation  →  Completion report (rule 8)  →  Architecture review  →  Approval  →  Next task
   ```

   Each arrow is a stop. Claude implements exactly the one approved task, writes its completion report, and **stops for the architecture review + explicit approval** before touching the next task. No batching, no "while I'm here," no starting the next task because it looks obvious.

**Branch record (filled by T-G0.1 before any implementation):**
- Frontend: base `dev` @ `b1534e6e4953fa8a666f42884ed67dd928ae46c9` (clean, matches `origin/dev`) → created `feature/r5-capability-platform` @ `b1534e6e4953fa8a666f42884ed67dd928ae46c9` (zero divergence from base), worktree `/Users/ayurparishkar/Projects/NovaClinics/novaclinicspro_rn-r5-capability-platform`, pushed with upstream `origin/feature/r5-capability-platform`. ✅ 2026-07-12.
- Backend: base `dev` @ `9dba7d157f7459d6581439cc818d67c406592cf5` (clean, matches `origin/dev`) → created `feature/r5-capability-platform` @ `9dba7d157f7459d6581439cc818d67c406592cf5` (zero divergence from base), worktree `/Users/ayurparishkar/Projects/NovaClinics/novaclinicspro-api-r5-capability-platform`, pushed with upstream `origin/feature/r5-capability-platform`. ✅ 2026-07-12.
- Note: `.kiro/` is repo-gitignored (frontend `.gitignore:240`) generally, but this specific phase directory (`frontend/.kiro/specs/R5-capability-platform/`) was un-ignored and committed to this branch (commit `b9d1d113`, "Preserve R5 capability platform specifications") — resolved, no longer a risk. All four documents (`requirements.md`, `design.md`, `tasks.md`, `OWNERSHIP.md`) are now tracked and present in this worktree's checkout.
- Ownership gate (T-A.4) approved: ✅ **APPROVED 2026-07-12** — T-A.1/T-A.2/T-A.3 individually approved; cross-document consistency verified (see T-A.4's own completion report above); no contradictions found. **Group B+ tasks may now begin. T-C.1 is the first approved production code task.**

---

## Mandatory completion-report template (rule 8 — append verbatim under each task when closing it)

Every task, when completed, appends this block **in place** under its own entry (mirroring R4's living-`tasks.md` precedent). A task is not closed until this block is filled — a green test run without it does not close the task.

```
- **Status:** ✅ COMPLETE — <one-line summary>
  - **Files changed:** <every file added/modified/deleted, with a phrase on what changed in each>
  - **Reason:** <why these changes realize the task's Purpose + the cited requirement IDs>
  - **Verification:** <exact commands/tests run + their result — e.g. "pytest tests/test_x.py → 12 passed";
                       "alembic upgrade head && downgrade → clean"; migration head id>
  - **Architecture deviations discovered:** <any place the real code diverged from design.md, with the
                       justification — or "none">
  - **Unexpected findings:** <anything surprising: a hidden reader, a pre-existing bug, a spec assumption
                       proven wrong on contact with the code — or "none">
```

If a task is blocked or partial, it stays `in_progress` with a report explaining what remains (never marked COMPLETE with failing verification — R4 governance rule, carried forward).

---

## Group G0 — Branch Gate

**T-G0.1 — Branch gate (EG-4)** · (be+fe) · deps: none · realizes: `requirements.md` §14
- **Purpose:** Establish the two isolated feature branches per the finalized workflow, before any code.
- **Do:** Confirm both repos' `dev` trees are clean (`git status --porcelain` empty); record each `dev` base commit; create `feature/r5-capability-platform` from `dev` in each repo; fill the Branch record above. **Stop for explicit approval.**
- **Files expected to change:** none (branch creation only).
- **Verification:** both `git status --porcelain` empty at branch creation; both branches exist at the recorded base commits.
- **Acceptance:** Branch record filled; AC-10.
- **Dependency:** none (entry point).
- **Rollback:** delete the two branches; no code written.
- **Risk:** low. Only risk is branching on a dirty `dev` — the clean-tree check prevents it.

---

## Group A — Ownership, Classification, Contract Audit  ⛔ HARD GATE (EG-6)

*Nothing in Group B onward proceeds until T-A.4's approval is recorded.*

**T-A.1 — Ownership table + six-mechanism classification (OW-1, OW-4, FR-G1)** · (doc) · deps: T-G0.1 · realizes: `requirements.md` OW-1/OW-4, FR-G1; `design.md` §5
- **Purpose:** Produce the binding ownership table and classify every existing mechanism — the EG-6 gate deliverable.
- **Do:** Finalize `design.md` §5's ownership table against live code (every concern → one owner/writer/reader). Classify each of the six mechanisms (§2) as FR-G1 **(A)** retire, **(B)** read-only-deprecation-window (with owner + removal criterion + deadline), or **(C)** not-superseded-this-phase-with-reason. Confirm `subscription_modules.py` (mechanism #1) is dead-code (no callers) per `design.md` §2.1.
- **Files expected to change:** `tasks.md` (this table appended), optionally a short `OWNERSHIP.md` under the spec dir.
- **Verification:** every concern in §3.1 has exactly one owner; every one of the six mechanisms has exactly one classification; no "undecided" (N-9).
- **Acceptance:** AC-1, AC-11.
- **Dependency:** T-G0.1.
- **Rollback:** documentation-only; revert the doc.
- **Risk:** low (analysis). Risk is mis-classifying a mechanism as dead — mitigated by the grep-confirmed caller audit.
- **Status:** ✅ COMPLETE — Ownership table finalized against live code; all **seven** mechanisms classified (mechanism #7, `tenant_features`/`TenantFeature`, added and fully evidenced per the required amendment).
  - **Files changed:** `frontend/.kiro/specs/R5-capability-platform/OWNERSHIP.md` (full ownership table + seven-mechanism classification, with mechanism #7 fully evidenced in the classification table itself, not left as a standalone finding); `tasks.md` (this completion report).
  - **Reason:** OW-1/OW-4 require a definitive, live-code-verified ownership table before any Group B+ task begins (EG-6); FR-G1 requires every mechanism to carry exactly one classification, none left undecided (N-9); OW-3 requires any newly-discovered entitlement/enablement-shaped field to be added to the ownership table before implementation proceeds.
  - **Verification:** every row in `design.md` §5/§2's ownership table and six-mechanism inventory was checked against the actual backend code on `feature/r5-capability-platform` (not assumed from the document) — `app/core/subscription_modules.py`, `app/infrastructure/db/models/org_subscription_plan.py`, `org_permission.py`, `org_template.py`, `org_subscription.py`, `app/application/rbac/permission_sync_service.py` (full read), `app/application/services/org_tenants_service.py:get_tenant_features` (full read), `tenant_permission.py`, `tenant_role_permission.py`. `subscription_modules.py` reconfirmed dead code. Mechanism #7 (`TenantFeature`) evidenced with six independent negative-greps (`app/application/services/org_tenants_service.py`, `app/application/billing/`, `app/application/rbac/`, `app/api/`) plus a full writer/reader/lifecycle trace confirming insert-only-at-go-live, never updated. All seven mechanisms classified: #1 (A), #2 (B), #3 explicit split (entitlement-filter B / RBAC-display untouched, both interpretations spelled out with the binding no-permission-mutation rule), #4 (B, with a second live reader noted), #5 (B), #6 (B, retired with #5), #7 (C, with ownership record, binding boundary, review trigger, and a reclassification rule). No mechanism left unclassified (AC-1 satisfied).
  - **Architecture deviations discovered:** none from `design.md`'s own architecture — the deviations found are in the *current-state narrative* (`requirements.md`/`design.md` §2.4's own text and the six-mechanism inventory's completeness), not in the R5 design itself.
  - **Unexpected findings:**
    (1) **A seventh mechanism exists and is now fully classified** — `tenant_features` (`TenantFeature`), written once at tenant go-live (`go_live_service.py`, seeded from `org_templates.enabledfeatures`), read only by the onboarding-progress/step-validation path. Directly contradicts `requirements.md` §3.1's literal claim that "no dedicated owner exists" for a tenant's current feature enablement. Classified **(C)** with full evidence (OWNERSHIP.md §2.1), an ownership record (owner/writer/reader/lifecycle/why-projection-not-authority, §2.2), a binding boundary preventing it from ever being read by the resolver/`CapabilityService`/`CapabilityAdminService`, a review trigger tied to Codex's onboarding-branch integration, and an explicit reclassification-to-(B) rule if evidence ever changes (§2.3).
    (2) **`org_permissions.module` has a second, unrelated live reader** beyond `PermissionSyncService`'s entitlement filter — the tenant-permission admin list/detail API (`sqlalchemy_repositories.py`) filters/displays by `.module` for RBAC admin UI purposes. Disposition made fully explicit (OWNERSHIP.md §3.1): entitlement-filter interpretation superseded/re-pointed; RBAC-display interpretation untouched and carries no removal criterion; the column itself is not retired; and the binding NFR-7 rule (no capability toggle ever mutates a permission row) is recorded alongside it so the split can't be misread as license to blur the two concerns.
    (3) **`design.md` §2.4 understates the reader/writer surface of `OrgTenant.subscription_plan`.** A shallow (non-exhaustive) grep this session already found readers in `org_tenants_router.py`, `tenant_data_service.py`, `billing_notification_service.py`, `account_lifecycle_service.py`, `tenant_provisioning_service.py`, `sqlalchemy_repositories.py`, `rbac_seed.py`, and writers in `subscription_service.py`'s upgrade/downgrade flow and `account_lifecycle_service.py` — a materially wider surface than "`PermissionSyncService` is the confirmed reader." Not fully enumerated here (that is T-A.2's explicit mandate) and the design conclusion is deliberately left unchanged pending that audit — flagged forward so T-A.2 starts from the corrected premise.
  - **Amendment history:** initial submission left mechanism #7 as a standalone finding outside the classification table with a recommendation only; per required review feedback, amended to (a) fold #7 into the classification table as a full seventh row with complete evidence/ownership/boundary/review-trigger/reclassification-rule, and (b) make the `org_permissions.module` split fully explicit with all four required dispositions. This is that amended version.

**T-A.2 — Subscription-plan-field reader audit (FR-A3, ADR-R5-03)** · (be, read-only) · deps: T-G0.1 · realizes: `requirements.md` FR-A3/A3a-c; `design.md` §9.0, ADR-R5-03
- **Purpose:** Enumerate every reader of `OrgTenant.subscription_plan` and `OrgSubscription.plan_code` so the §9.0 contract can replace them safely, and decide the retained-field disposition (sync vs computed projection, FR-A3b).
- **Do:** Grep/trace every read of both fields across `app/`. For each, record whether it re-points to `resolve_active_plan` or is legacy-read during the migration window. Decide: keep `OrgTenant.subscription_plan` transactionally-synced, or demote to a computed projection — record the choice + reason.
- **Files expected to change:** `tasks.md` (audit findings appended). No production code.
- **Verification:** the audit lists every reader with a disposition; `PermissionSyncService` (the one confirmed reader) is flagged for re-point (FR-F3).
- **Acceptance:** AC-3 (foundation); ADR-R5-03 consequences satisfied.
- **Dependency:** T-G0.1.
- **Rollback:** documentation-only.
- **Risk:** medium — an unenumerated reader could break when the field is demoted. Mitigated by exhaustive grep + the Group F parity net.
- **Status:** ✅ COMPLETE — exhaustive reader/writer audit of both fields, all usages classified, disposition recommended, no production code touched.
  - **Files changed:** `tasks.md` (this audit). No production code, no design conclusion altered.
  - **Reason:** FR-A3/A3a-c requires every reader of both fields enumerated and the retained-field disposition (FR-A3b) decided before the resolver (T-C.2/T-C.3) or the re-pointing (T-D.5) can proceed safely.
  - **Verification:** every usage below was read in full context (not matched by grep alone) and traced to its caller chain; reachability of every writer was independently confirmed or refuted (router wiring, event-handler wiring, or absence thereof).

### T-A.2 audit findings

#### A. `OrgTenant.subscription_plan` — every reader

| Site | What it does | Category |
|---|---|---|
| `permission_sync_service.py:67,70` (`PermissionSyncService.sync_tenant_permissions`) | Reads it to resolve `OrgSubscriptionPlan.included_modules`, drives the live entitlement→permission filter | **Authoritative** (today's real entitlement mechanism) |
| `rbac_seed.py:333-346` (`_seed_tenant_permissions_async`, called by `seed_rbac_for_tenant_async`) | **A second, independently-coded implementation of the same subscription→module→permission filter**, via raw SQL, run at tenant-creation-time RBAC seeding (confirmed live: called from `demo_service.py` ×2, `tenant_provisioning_service.py`, and `TenantRbacSeedHandler` — the handler for `TenantCreatedEvent`, which `org_tenants_service.create_tenant_with_admin` publishes). Simplified to only CORE vs INVENTORY per its own docstring ("after module consolidation"). | **Authoritative — and NOT on T-D.5's current re-pointing list.** This is a new finding, not previously listed in `requirements.md` §2 or `design.md` §2.1/§2.2; it is a genuine duplicate of mechanisms #2/#3's logic in a second, independently-maintained code path. |
| `org_tenants_router.py:75` (`create_org_tenant` request) / `sqlalchemy_repositories.py:1858` (`_to_dict`, the generic tenant serializer) | Passes the value straight from request to persistence at creation, and serializes it back out on every tenant read | **Compatibility/display** (pass-through, not a decision point) |
| `org_tenant.py:28,45,68` (`OrgTenantCreate`/`OrgTenantUpdate`/response schemas) | Pydantic field declarations — the API-schema surface both writers and readers flow through | **API-schema** (not itself a decision point, but the two schemas gate the two live writers below) |
| `tenant_data_service.py:260` (`_get_tenant_info`) | Returned as part of onboarding-validation tenant info | **Display-only** (onboarding-scoped, same domain as T-A.1's mechanism #7) |
| `billing_notification_service.py:322,514` | Included in notification/email context payloads | **Display-only** |
| `account_lifecycle_service.py:419` | Included in a GDPR-style account-data export | **Display-only** |
| `tenant_provisioning_service.py:165` | Returned as part of the created-tenant response dict (read-back of what was just written) | **Display-only** (read-back of its own write, see writers below) |

#### B. `OrgTenant.subscription_plan` — every writer

| Site | What it does | Reachability | Category |
|---|---|---|---|
| `org_tenants_router.py` `PATCH /tenants/{id}` → `org_tenants_service.update_tenant` → `sqlalchemy_repositories.py:1830` (generic `update(OrgTenant).values(**tenant_data)`) | **Unrestricted org-admin override** — sets `subscription_plan` to any string in `OrgTenantUpdate`, with **no validation against the `OrgSubscriptionPlan` catalog** and **no corresponding `OrgSubscription` row created or updated** | **Live, reachable** (real API endpoint, `require_org_admin`) | **Authoritative writer, uncoordinated with billing** — this is the starkest concrete instance of the drift `requirements.md` §2.4 warns about: an org-admin can set this field to a value billing has no record of. |
| `org_tenants_router.py` `POST /tenants` (`create_org_tenant`) → `create_tenant_with_admin` → repository `create` | Sets `subscription_plan` from `OrgTenantCreate.subscription_plan` (default `"FREE"`) at tenant creation | **Live, reachable** | **Authoritative writer** — creates the tenant with a plan code but **no `OrgSubscription` row** |
| `app/application/onboarding/go_live_service.py:740-766` (`_create_tenant` / `go_live`) | Maps `requested_subscription_tier` → `subscription_plan` via a hardcoded dict, sets it directly on `OrgTenant()` at go-live | **Live, reachable** (onboarding go-live flow) | **Authoritative writer — no `OrgSubscription` row created** |
| `app/application/onboarding/tenant_provisioning_service.py:200-256` (`_create_tenant`) | Same hardcoded tier→plan mapping, sets `subscription_plan` at tenant creation | **Live, reachable** | **Authoritative writer — no `OrgSubscription` row created** |
| `app/application/onboarding/demo_service.py:270-313` (`_prepare_demo_tenant_data`) | Hardcodes `subscription_plan = "FREE"` for every demo tenant | **Live, reachable** | **Authoritative writer — no `OrgSubscription` row created** |
| `app/application/billing/subscription_checkout_service.py:118-146` (`SubscriptionCheckoutService.create_subscription`, via `subscription_router.py` `POST /billing/tenants/{id}/subscription`) | Creates an `OrgSubscription` row **and** syncs `OrgTenant.subscription_plan` in the same flow, via a repository abstraction | **Live, reachable** | **Authoritative writer — the one path that keeps both fields in sync at creation time** |
| `app/application/billing/trial_service.py:399-451` (`TrialService.convert_trial_to_subscription`, reachable via `trial_router.py` `POST /trials/{id}/convert`) | Sets `subscription_plan` directly on `OrgTenant` | **Live, reachable** | **Authoritative writer — no `OrgSubscription` row created or updated** |
| `app/application/billing/subscription_service.py` (`SubscriptionService.create_subscription`/`upgrade_subscription`/`cancel_subscription`, lines 244,380,463) | Would create/update `OrgSubscription` **and** transactionally sync `OrgTenant.subscription_plan` on create/upgrade — **except `cancel_subscription` updates `subscription_status` but never clears/updates `subscription_plan`**, a genuine drift bug within this class itself | **DEAD CODE — confirmed unreachable.** Zero router references `SubscriptionService`. Its only importer, `billing_job_service.py`, imports it but never calls any of its methods (the sole reference is a comment: `"# This would use SubscriptionService to process renewals"`) — a stub that was never wired up. `BillingJobService` itself has zero callers anywhere (no router, no scheduler, no CLI entry point found). | **Not a live writer today** — recorded because it demonstrates in isolation exactly the failure mode ADR-R5-03 must guard against (a cancelled subscription silently leaving a stale plan code), even though it currently cannot execute. |
| `app/application/billing/trial_service.py:145-165` (`start_trial`) | Sets `subscription_status="TRIAL"` only — does **not** touch `subscription_plan` | **Live, reachable** | Not a `subscription_plan` writer (listed for completeness; confirms trial-start doesn't touch this field) |
| `app/application/billing/trial_service.py:527` (`_expire_trial`) | Marks `OrgTrialSession.status="expired"` only — **never touches `OrgTenant` at all** | **DEAD CODE — confirmed unreachable.** Zero callers of `_expire_trial`, `check_trial_status`, or `get_expiring_trials` found anywhere outside the file itself. | **No live trial-expiry enforcement exists today** — a trial that runs past `trial_expires_at` has no automated transition; `subscription_plan`/`subscription_status` remain whatever they were set to at trial start, indefinitely, until/unless an admin manually intervenes. |
| `app/application/billing/account_lifecycle_service.py` (`suspend_account`/`reactivate_account`/`schedule_account_deletion`/`cancel_scheduled_deletion`) | All four only touch `subscription_status` (+ metadata), never `subscription_plan` | **Live, reachable** | Not a `subscription_plan` writer (listed for completeness — confirms these lifecycle actions correctly leave the plan code alone) |

#### C. `OrgSubscription.plan_code` — every reader

| Site | What it does | Category |
|---|---|---|
| `subscription_service.py` (multiple), `subscription_checkout_service.py`, `billing_performance_service.py:300` (proration calc), `account_lifecycle_service.py:462` (GDPR export) | Reads the live subscription row's plan code for billing math, upgrade-comparison logic, or export/display | **Authoritative-within-billing** (the field is correctly authoritative for the billing domain's own internal logic) but **never cross-checked against or synced to `OrgTenant.subscription_plan` except at the two live creation paths noted above (B)** |
| `app/api/v1/schemas/billing.py` (`SubscriptionCreateRequest`/`SubscriptionCreateResponse`/etc., 5 fields) | Pydantic request/response schema fields | **API-schema** |
| `app/integrations/payments/razorpay_provider.py`, `manual_provider.py`, `app/domain/services/i_payment_provider.py` | Accept `plan_code` as a **parameter** passed in by the caller (not a direct read of the `OrgSubscription` ORM column) — provider-integration boundary | **Payment-provider integration boundary**, not a direct model reader |

#### D. `OrgSubscription.plan_code` — every writer

| Site | What it does | Reachability | Category |
|---|---|---|---|
| `subscription_service.py:123-260` (`create_subscription`), `:272-400` (`upgrade_subscription`) | Creates/updates the `OrgSubscription` row's `plan_code` | **Dead code** (see B above — `SubscriptionService` is unreachable) | Not live |
| `subscription_checkout_service.py:118-146` (`SubscriptionCheckoutService.create_subscription`, via repository) | Creates the `OrgSubscription` row via `subscription_repository.create_subscription` | **Live, reachable** | **The one live writer of `OrgSubscription.plan_code`** |

No other writer of `OrgSubscription.plan_code` was found — there is currently **no live upgrade/downgrade path for an existing subscription** (the only implementation, `SubscriptionService.upgrade_subscription`, is dead code) and **no live cancellation path that updates `plan_code`** (the only implementation, `SubscriptionService.cancel_subscription`, is also dead code, and even if it were live it wouldn't touch `plan_code`, only `status`).

#### E. Provisioning / onboarding / billing / permission-sync / API-schema / test / factory summary

- **Provisioning + onboarding:** three independent tenant-creation code paths (org-admin API, `go_live_service.py`, `tenant_provisioning_service.py`) plus demo creation (`demo_service.py`) — **all four set `OrgTenant.subscription_plan` directly and none create a corresponding `OrgSubscription` row.**
- **Billing/payment:** two independently-coded "create a subscription" implementations exist (`SubscriptionService`, dead; `SubscriptionCheckoutService`, live) and one trial-conversion path (`TrialService.convert_trial_to_subscription`, live) that writes `OrgTenant.subscription_plan` without an `OrgSubscription` row.
- **Permission-sync:** two independently-coded implementations of the same subscription→module→permission logic — `PermissionSyncService` (ORM, on-demand re-sync) and `rbac_seed.py`'s `_seed_tenant_permissions_async` (raw SQL, creation-time seed, simplified to CORE/INVENTORY only). **Both read `OrgTenant.subscription_plan`; both are live; only one (`PermissionSyncService`) is currently on T-D.5's re-pointing list.**
- **API-schema:** `OrgTenantCreate`/`OrgTenantUpdate`/`OrgTenantResponse` (subscription_plan) and the five `billing.py` schemas (plan_code) — both fields are first-class, directly-settable API fields, not incidental.
- **Test/factory:** `grep -rln "subscription_plan\|plan_code" tests/` returned **zero matches** — neither field has any test coverage today. The `*_factory.py` files found are dependency-injection wiring (service constructors), not test data factories; none reference either field directly.

#### F. Recommended final disposition of `OrgTenant.subscription_plan`

**Recommendation: demote to a computed/read-only projection of the active-plan contract, not a transactionally-synced field.** Reasoning, not a decision (this is T-A.2's recommendation for `design.md`/`tasks.md` to ratify, not a unilateral change):
- "Transactional synchronization" presumes a single, or small number of, coordinated writers. This audit found **six independent writer call sites across four subsystems** (org-admin API, two onboarding paths, demo creation, checkout, trial-conversion) plus **two dead-but-illustrative ones** — coordinating transactional sync across all of them is a large, ongoing maintenance surface, and the org-admin `PATCH` writer in particular has no natural transaction to synchronize *into* (an admin can set any string with no billing action occurring at all).
- A computed projection sidesteps this entirely: `OrgTenant.subscription_plan` becomes a **read-only view refreshed from `resolve_active_plan(tenant_id)`'s answer**, and every one of the writers above is re-pointed to stop writing it directly (Group F) rather than being individually kept in sync.
- This does **not** eliminate the deeper gap this audit surfaced: **`resolve_active_plan` as `design.md` §9.0 currently specifies it (reading only `OrgSubscription`) will return `MINIMUM_FALLBACK_PLAN` for every tenant created via the three provisioning/demo paths and never subsequently checked out through `SubscriptionCheckoutService`** — since none of those paths create an `OrgSubscription` row. This is a **material risk to the resolver's correctness at cutover**, not a hypothetical one; it needs an explicit decision in `design.md`/`tasks.md` before T-C.2 is implemented (options include: backfilling an `OrgSubscription` row for every existing tenant from its current `subscription_plan` as part of Group A/B seeding, per ADR-R5-07's own backfill-is-separate-from-schema discipline; or extending `resolve_active_plan`'s fallback to consult `OrgTenant.subscription_plan` itself when no `OrgSubscription` row exists, during the migration window only). **Not deciding this here** — flagging it as the single most consequential finding of this audit for `design.md`'s own resolution.

#### G. Exact consumers that must be re-pointed to `resolve_active_plan`

1. `PermissionSyncService.sync_tenant_permissions` (`permission_sync_service.py:67-90`) — already on T-D.5's list.
2. **`rbac_seed.py`'s `_seed_tenant_permissions_async`** (lines 315-350ish) — **not currently on any re-pointing list; a new finding requiring T-D.5's scope to expand, or a sibling task.** Left as a recommendation for `tasks.md` to decide, not altered here.
3. The six `OrgTenant.subscription_plan` writer call sites (B above) — each needs to stop writing the field directly once it is demoted to a computed projection (Group F), re-pointed instead to whatever writes `OrgSubscription` (for the two that don't already: `go_live_service.py`, `tenant_provisioning_service.py`, `demo_service.py`, and the org-admin `PATCH` endpoint, which would need to become either a subscription-management action or be retired in favor of `SubscriptionCheckoutService`).
4. Every **display-only** reader (A above) can keep reading the field as a projection with zero code change, since a read-only projection is still readable — no re-pointing required for those.

#### H. Migration-window behavior and rollback implications

- **During the migration window (BC-1/BC-2):** `OrgTenant.subscription_plan` keeps being written by all six live call sites exactly as today (no behavior change) until Group D/F re-point them; `resolve_active_plan` runs alongside, gated behind `capability_platform_v1_enabled` (OFF by default), so the fallback-plan risk in (F) above cannot affect production until the flag is explicitly turned on for a pilot tenant.
- **Rollback:** since none of the six writers are touched until Group F, flag-OFF rollback is unaffected by this audit's findings — `OrgTenant.subscription_plan` simply continues being independently written exactly as it is today. The only new rollback consideration this audit surfaces is for **whichever fallback strategy `design.md` picks for the missing-`OrgSubscription`-row case** (F above) — if that strategy involves a backfill migration (creating `OrgSubscription` rows for existing tenants), that backfill needs its own rollback plan per ADR-R5-07's existing discipline (already anticipated by `design.md`, not a new requirement this audit invents).
  - **Architecture deviations discovered:** none in the R5 design itself — all deviations are in the *current-state narrative*'s completeness (a second permission-sync mechanism was undocumented; the fallback-plan risk from provisioning paths never creating `OrgSubscription` rows was not previously identified in `design.md`'s own risk list, §19, in this specific concrete form).
  - **Unexpected findings:** (1) `rbac_seed.py`'s duplicate entitlement-filtering mechanism (§G.2 above); (2) two entire dead-code subsystems (`SubscriptionService`+`BillingJobService`, and trial-expiry enforcement) that illustrate — in isolation, without being live — exactly the drift-and-no-enforcement failure modes ADR-R5-03/FR-A3a must guard against; (3) zero test coverage on either field today; (4) the org-admin `PATCH /tenants/{id}` endpoint is an unrestricted, unvalidated, uncoordinated writer of `subscription_plan` with no connection to `OrgSubscription` at all.
  - **Recommendation for T-A.4 approval:** ready for approval as drafted, conditional on `design.md`/`tasks.md` explicitly resolving the fallback-plan gap in (F) before T-C.2 (the active-plan resolver) is implemented — this is flagged as the audit's single highest-priority finding, not decided here.
  - **Amendment applied (post-approval, required review):** T-A.2 itself is approved as complete and its findings/audit evidence stand unaltered above. Two mandatory design corrections this audit's findings required were applied to `design.md`/`tasks.md`/`OWNERSHIP.md`, not to this report: (1) §9.0/ADR-R5-03 amended to a migration-aware three-tier `resolve_active_plan` (`active_subscription`/`legacy_tenant_projection`/`minimum_fallback`) with a new `T-C.2b` reconciliation task and a binding no-fabricated-billing-history constraint, resolving finding (F)'s flagged gap; (2) `T-D.5` split into `T-D.5a`/`T-D.5b`/`T-D.5c` so `rbac_seed.py`'s `_seed_tenant_permissions_async` (finding (2)/§G.2) is re-pointed alongside `PermissionSyncService`, with a parity test between the two. The dead-code finding (3) is recorded as engineering debt in `OWNERSHIP.md` §5, not repaired. See `OWNERSHIP.md` §4/§5 for the consolidated record.

**T-A.3 — Catalog seed inventory (ADR-R5-07)** · (be, read-only) · deps: T-G0.1 · realizes: `requirements.md` FR-G2, ADR-R5-07; `design.md` §6, ADR-R5-07
- **Purpose:** Enumerate the actual current module/feature set the catalog must seed, so Group B seeds from live values (a read-then-write reconciliation, not a blind replay).
- **Do:** Inventory `subscription_modules.MODULES` (CORE/CLINICAL_DOCUMENTS/STAFF_MANAGEMENT/INVENTORY/REPORTS), the `included_modules` values per plan, and the `featuresettings`/`enabledfeatures` keys actually in use (`appointments.*`, `treatment_sheets.*`). Produce the catalog seed plan: top-level capabilities, children, dependency edges (if any today), and plan→capability links reflecting current `included_modules`.
- **Files expected to change:** `tasks.md` (seed plan appended).
- **Verification:** the seed plan's plan→capability links reproduce today's `included_modules` per plan (the parity baseline for Group F).
- **Acceptance:** AC-2 (foundation), AC-12 (foundation).
- **Dependency:** T-G0.1.
- **Rollback:** documentation-only.
- **Risk:** low. Risk of missing a feature key — mitigated by Group F parity tests catching any gap before retirement.
- **Status:** ✅ COMPLETE — full catalog seed inventory produced from live code/migration data (not assumed), proposed capability hierarchy drafted for review. No data seeded, no production code touched.
  - **Files changed:** `tasks.md` (this inventory + seed plan). No production code, no migrations, no seed scripts.
  - **Reason:** ADR-R5-07 requires the catalog to seed from actually-observed live values (a read-then-write reconciliation), and AC-2/AC-12's foundation requires the plan→capability links to reproduce today's `included_modules` per plan exactly, not an idealized or intended version of it.
  - **Verification:** every value below was read directly from migration/seed source (not inferred) — `app/core/subscription_modules.py`, the `org_subscription_plans` seed migration (`9ad6b47e9660`), the `org_permissions.module` backfill migration (`c7911d033936`), and all six `org_templates` rows' `enabledfeatures`/`featuresettings` (`554e384715b8_0010_insert_template_data.py`, full read, all six clinic-type templates).

### T-A.3 catalog seed inventory

#### 1. Every current module code from `subscription_modules.py`

`MODULES` dict keys (§ mechanism #1, T-A.1 — confirmed dead code, zero callers): `CORE`, `CLINICAL_DOCUMENTS`, `INVENTORY`, `STAFF_MANAGEMENT`, `REPORTS` (5 codes).

#### 2. Every distinct `included_modules` value actually used by subscription plans — **three disagreeing sources found, not one**

| Plan | (A) Live DB seed (`org_subscription_plans.included_modules`, migration `9ad6b47e9660`) — **the authoritative source for this seed plan, per AC-2's own parity requirement** | (B) `subscription_modules.py`'s `SUBSCRIPTION_MODULES` dict (dead code) | (C) `c7911d033936` migration's own docstring "Subscription Mapping" comment |
|---|---|---|---|
| FREE | `["CORE"]` | `["CORE"]` | CORE only |
| BASIC | `["CORE", "CLINICAL_DOCUMENTS"]` | `["CORE","CLINICAL_DOCUMENTS","STAFF_MANAGEMENT"]` | CORE + CLINICAL_DOCUMENTS + STAFF_MANAGEMENT |
| PRO | `["CORE","CLINICAL_DOCUMENTS","INVENTORY","STAFF_MANAGEMENT"]` (no REPORTS) | `["CORE","CLINICAL_DOCUMENTS","STAFF_MANAGEMENT","INVENTORY","REPORTS"]` (all 5) | BASIC + INVENTORY + REPORTS (all 5) |
| ENTERPRISE | `["CORE","CLINICAL_DOCUMENTS","INVENTORY","STAFF_MANAGEMENT","REPORTS"]` (all 5) | all 5 | All modules |

**This is a concrete, confirmed instance of exactly the drift `requirements.md` §2 finding #1-vs-#2 describes as a risk** — not hypothetical. (B) and (C) agree with each other but disagree with (A) on BASIC (missing `STAFF_MANAGEMENT`) and PRO (missing `REPORTS`). Since `PermissionSyncService` and `rbac_seed.py` (T-A.2's second-mechanism finding) both read (A) `included_modules` directly, **(A) is what actually governs live tenant entitlement today** — this is the source this seed plan reproduces, per AC-2's own instruction. (B)/(C) are recorded as the confirmed-drifted, non-authoritative alternates; they are not additional migration inputs, just evidence that mechanism #1's dict was never kept in sync.

#### 3. `org_permissions.module` — actual live tagging (migration `c7911d033936`, full read)

| Module | Permission codes tagged (verbatim from the migration's own `UPDATE ... WHERE code IN (...)`) | Count |
|---|---|---|
| `CORE` | `tenant.read/update`, `user.read/create/update/assign_role/remove_role/deactivate`, `client.read/create/update`, `appointment.read/create/update/cancel/delete`, `treatment.read/update`, `session.read/update` | 18 |
| `CLINICAL_DOCUMENTS` | `casesheet.read/create/update/sign`, `treatment_sheet.read/create/update/sign/complete/record_materials`, `prescription.read/create/update/sign` | 13 |
| `INVENTORY` | `inventory.read/create/update` | 3 |
| `STAFF_MANAGEMENT` | `staff.read/create/update`, `staff_leave.read/request/approve/reject/cancel`, `staff_document.read/upload`, `staff_availability.read/update`, `staff_dashboard.view` | 11 |
| `REPORTS` | `reports.view` | 1 |

(Counts are close to but not identical to `subscription_modules.py`'s own `permissions_count` comments — e.g. it claims CORE=20/CLINICAL_DOCUMENTS=14 — another small instance of the same dead-dict drift, not re-litigated further here since the dict itself is already classified (A) retire.)

**T-D.5b's own finding, reconfirmed here with the actual data:** `rbac_seed.py`'s `_seed_tenant_permissions_async` hardcodes `allowed_modules = ["CORE"]` plus `INVENTORY` only if the plan's `included_modules` contains it — **it never includes `CLINICAL_DOCUMENTS`, `STAFF_MANAGEMENT`, or `REPORTS` regardless of plan.** This means, today, tenant-creation-time RBAC seeding via this path **never grants** casesheet/treatment_sheet/prescription/staff/reports permissions to any tenant on any plan — a real, concrete behavioral divergence from `PermissionSyncService` (which does grant them per the plan's actual `included_modules`), not just a duplicated-implementation risk. This is exactly what T-D.5c's parity test must surface and either fix (post re-point) or explicitly document as an intentional divergence being corrected.

#### 4. Every live key from `enabledfeatures` and `featuresettings` (all six `org_templates` rows, full read of migration `554e384715b8`)

**`enabledfeatures` keys** (10 distinct, across `HEALTHCARE_CORE_V1`/`AYURVEDA_V1`/`ALLOPATHY_V1`/`DENTAL_V1`/`PHYSIO_V1`/`MULTISPECIALITY_V1`):

| Key | Templates it appears in | `visibility` | `depends_on` (as declared, unenforced) | `gated_by` (as declared, unenforced) |
|---|---|---|---|---|
| `appointments.core` | all 6 | enabled | none | none |
| `appointments.sessions` | ayurveda, physio | enabled | `appointments.core` | none |
| `casesheets.core` | all 6 | enabled | none | none |
| `prescriptions.core` | all except dental*... *(confirmed present: healthcare_core, ayurveda, allopathy, multispeciality — **absent from dental and physio**, which have no `prescriptions.core` entry at all)* | enabled | none | none |
| `documents.core` | healthcare_core, allopathy, dental, physio, multispeciality — **absent from ayurveda** | enabled | none | none |
| `reports.basic` | healthcare_core, allopathy, multispeciality — **absent from ayurveda, dental, physio** | enabled | none | none |
| `financials.core` | all 6 | **disabled** in every template | none | `{type: subscription, plans: [pro, enterprise]}` (lowercase — see §11 casing finding) |
| `therapy.core` | ayurveda, physio | enabled | `appointments.core` | none |
| `inventory.core` | ayurveda (disabled), multispeciality (disabled) — **absent from healthcare_core, allopathy, dental, physio** | disabled where present | none | `{type: subscription, plans: [pro, enterprise]}` (ayurveda only; multispeciality's `inventory.core` entry has no `gated_by`) |
| `dental.procedures` | dental only | enabled | `casesheets.core` | none |

**`featuresettings` keys** (7 of the 10 above have a settings block; 3 never do): `appointments.core`, `documents.core`, `reports.basic`, `financials.core`, `therapy.core`, `inventory.core`, `dental.procedures`. **`appointments.sessions`, `casesheets.core`, and `prescriptions.core` never have a `featuresettings` entry in any template** — see §10 (dead keys) for why this matters concretely.

#### 5. Proposed top-level capability codes

| Code | Rationale | Entitlement basis |
|---|---|---|
| `core` | Maps 1:1 to the `CORE` subscription module and its 18 `org_permissions` codes; always entitled | All plans |
| `clinical_documents` | Maps 1:1 to `CLINICAL_DOCUMENTS` module and its 13 codes | BASIC+ (per §2's authoritative source A) |
| `inventory` | Maps 1:1 to `INVENTORY` module and its 3 codes, and to the `inventory.core` enabledfeatures key | PRO+ |
| `staff_management` | Maps 1:1 to `STAFF_MANAGEMENT` module and its 11 codes | PRO+ (per source A — **not** BASIC+, contradicting the dead dict/migration-comment) |
| `reports` | Maps 1:1 to `REPORTS` module, its 1 code, and `reports.basic` | ENTERPRISE only (per source A) |
| `appointments` | **New — no dedicated `org_permissions` module exists; `appointment.*` codes are tagged `CORE`.** Proposed as its own top-level capability (mirrors `design.md` §18's own worked example naming, `appointments.multiday`) because `enabledfeatures` already treats it as a distinct functional category across every template | All plans (mirrors `CORE`'s scope, since the only RBAC precedent tags it `CORE`) |
| `treatment` | **New — no dedicated module; `treatment_sheet.*` codes are tagged `CLINICAL_DOCUMENTS`, but `therapy.core`/`dental.procedures` are functionally distinct clinic-specific concepts in `enabledfeatures`.** Proposed as its own top-level capability, mirroring `design.md`'s own worked `treatment.ayurveda`/`treatment.physiotherapy`/`treatment.dental` examples | BASIC+ (mirrors `CLINICAL_DOCUMENTS`'s scope, the closest RBAC precedent) — **flagged as a judgment call, not an evidenced fact**, since no permission today is tagged specifically for therapy/dental |
| `billing` | **New — genuinely unmapped.** `financials.core` appears in all 6 templates but has **no corresponding `org_permissions` module, no RBAC codes, and no live enforcement** (its `gated_by` is descriptive only, §11) | Proposed PRO+/ENTERPRISE per the templates' own (unenforced) `gated_by` hint — **the lowest-confidence mapping in this inventory**, since nothing today actually enforces it |

#### 6. Proposed child capability codes and parent relationships

| Child code | Parent | Maps to (legacy) |
|---|---|---|
| `core.appointments_base`, `core.clients`, `core.staff_users`, `core.treatment_records` *(optional finer split of the 18 CORE-tagged permission codes — proposed only if finer-grained toggling is ever wanted; not required for parity)* | `core` | subsets of the 18 `CORE`-tagged codes |
| `clinical_documents.casesheets` | `clinical_documents` | `casesheet.*` (4 codes), `casesheets.core` (enabledfeatures) |
| `clinical_documents.treatment_sheets` | `clinical_documents` | `treatment_sheet.*` (6 codes) |
| `clinical_documents.prescriptions` | `clinical_documents` | `prescription.*` (4 codes), `prescriptions.core` (enabledfeatures) |
| `appointments.sessions` | `appointments` | `appointments.sessions` (enabledfeatures) |
| `appointments.multiday` | `appointments` | the `allow_multiday` featuresetting under `appointments.core` — **currently always `false` everywhere, §10** |
| `treatment.ayurveda` | `treatment` | `therapy.core` (ayurveda template context) |
| `treatment.physiotherapy` | `treatment` | `therapy.core` (physio template context) |
| `treatment.dental` | `treatment` | `dental.procedures` (dental template only) |
| `billing.invoicing` | `billing` | `financials.core` — **note: `design.md` §18 already names `billing.invoicing` as an illustrative future-extensibility example; this inventory finds it is not actually hypothetical — real template data already gates a concept matching it today, just unenforced.** |

The `clinical_documents.*` three-way split above is proposed **for review, not required** — a single flat `clinical_documents` (no children) would equally reproduce today's actual entitlement behavior, since `PermissionSyncService`/`rbac_seed.py` both currently grant or withhold the whole `CLINICAL_DOCUMENTS` module as one unit, never per-sub-document. Splitting is a forward-looking judgment call about future fine-grained toggling, not something today's data requires.

#### 7. Explicit dependency edges (proposed, cross-branch only — parent-as-dependency, ADR-R5-09, is separate and automatic)

| Capability | Depends on | Evidence |
|---|---|---|
| `appointments.sessions` | `appointments` *(parent-as-dependency, automatic per ADR-R5-09 — not a separate edge)* | `enabledfeatures`' own `depends_on: ["appointments.core"]` declaration |
| `treatment.ayurveda` / `treatment.physiotherapy` | `appointments` | `therapy.core`'s own `depends_on: ["appointments.core"]` declaration in every template that has it — this **is** a genuine cross-branch edge (treatment depends on appointments, a sibling top-level capability, not its parent) |
| `treatment.dental` | `clinical_documents.casesheets` (or flat `clinical_documents` if not split) | `dental.procedures`' own `depends_on: ["casesheets.core"]` declaration |
| `billing.invoicing` | none found | no `depends_on` declared for `financials.core` in any template |

**Caveat, stated plainly:** every `depends_on`/`gated_by` value above is **descriptive metadata in the `enabledfeatures` JSONB today — confirmed unenforced by any backend code** (§11). These proposed edges are *informed by* that metadata as the best available evidence of intended relationships, not a claim that today's system already enforces a dependency graph. Nothing currently breaks if this evidence is wrong; the resolver (T-C.3) will be the first thing to actually enforce these edges.

#### 8. Plan-to-capability mappings (reproducing source A exactly, per AC-2)

| Plan | Capabilities |
|---|---|
| FREE | `core`, `appointments` |
| BASIC | FREE + `clinical_documents`, `treatment` |
| PRO | BASIC + `inventory`, `staff_management` |
| ENTERPRISE | PRO + `reports` |
| *(all plans, judgment call)* | `billing` — **not mapped to any plan in this table**, since no live plan-to-`financials.core` gate is actually enforced anywhere; if `design.md`/`tasks.md` want `billing` pre-entitled to PRO/ENTERPRISE to match the templates' *declared* (unenforced) intent, that is a decision for review, not reproduced from any live behavior (there is none to reproduce) |

**`appointments` and `treatment` are placed above by their closest RBAC precedent** (`core`'s and `clinical_documents`' own plan scope respectively) since neither has its own dedicated entitlement mechanism today — this is the same judgment-call caveat as §5.

#### 9. Template-to-capability default mappings (`org_template_capabilities`, ADR-R5-08)

Derived directly from each template's `enabledfeatures[].visibility` (`enabled` → `default_enabled=true`, `disabled` → `default_enabled=false`):

| Template (`clinictype`) | `default_enabled=true` | `default_enabled=false` |
|---|---|---|
| `HEALTHCARE_CORE_V1` (general) | `core`, `appointments`, `clinical_documents.casesheets`, `clinical_documents.prescriptions`, `reports` | `billing` |
| `AYURVEDA_V1` | `core`, `appointments`, `appointments.sessions`, `clinical_documents.casesheets`, `clinical_documents.prescriptions`, `treatment.ayurveda` | `inventory`, `billing` |
| `ALLOPATHY_V1` | `core`, `appointments`, `clinical_documents.casesheets`, `clinical_documents.prescriptions`, `reports` | `billing` |
| `DENTAL_V1` | `core`, `appointments`, `clinical_documents.casesheets`, `clinical_documents.prescriptions`, `treatment.dental` | `billing` |
| `PHYSIO_V1` | `core`, `appointments`, `appointments.sessions`, `clinical_documents.casesheets`, `treatment.physiotherapy` | `billing` |
| `MULTISPECIALITY_V1` | `core`, `appointments`, `clinical_documents.casesheets`, `clinical_documents.prescriptions`, `reports` | `inventory`, `billing` |

Note `documents.core` (present in 5 of 6 templates) has **no proposed capability mapping at all** — see §10, it is the clearest "cannot map confidently" case in this inventory.

#### 10. Keys that cannot be mapped confidently (named, not glossed over)

- **`documents.core`** (enabledfeatures, present in healthcare_core/allopathy/dental/physio/multispeciality, absent from ayurveda) — generic file-upload settings (`enable_uploads`, `max_file_size_mb`). **No `org_permissions` module or code corresponds to it at all.** It doesn't cleanly belong under `core` (its own settings are unrelated to any `CORE`-tagged permission), and inventing a new top-level `documents` capability for one settings block with no RBAC backing would be pure speculation. **Recommendation: do not seed a capability for this key in Group B; revisit if/when a real permission-gated document-management feature exists.** Left explicitly unmapped rather than forced into a guess.
- **`appointments.sessions`'s and `casesheets.core`'s/`prescriptions.core`'s missing `featuresettings`** — not a mapping failure exactly, but see §11's dead-key finding: these keys exist in `enabledfeatures` but were never given a matching `featuresettings` entry in any template, so any capability-level "settings" concept for them has nothing to seed from.

#### 11. Duplicates, aliases, dead keys, and conflicting semantics

- **Naming-convention alias, not a conflict:** `enabledfeatures` uses plural, `.core`-suffixed keys (`casesheets.core`, `prescriptions.core`, `appointments.core`) while `org_permissions.code` uses singular, verb-suffixed codes (`casesheet.read`, `prescription.sign`, `appointment.create`). Same underlying concepts, two independently-evolved naming conventions — the proposed capability `code`s (§5/§6) intentionally use neither verbatim, to avoid inheriting either legacy convention as the new permanent contract (FR-K1 immutability makes this a one-time decision worth getting right).
- **Confirmed dead/never-populated settings:** `appointments.sessions` has **no `featuresettings` entry in any of the six templates** — meaning `org_tenants_service.get_tenant_features`'s `sessions_settings = feature_settings.get("appointments.sessions", {})` is **always `{}`** today, so `enable_treatment_sheets`/`enable_sheet_sync` in the `GET /tenants/{id}/features` response are **always `False`, for every tenant, via this legacy path**, regardless of clinic type. Independently, `appointments.core`'s own `featuresettings.settings.allow_multiday` is hardcoded `false` in the one template that defines it (`HEALTHCARE_CORE_V1`) and **no child template ever overrides it** — so `allow_multiday` is also always `False` via this same legacy path today. **This is stated as a confirmed code-level fact about this specific legacy mechanism, not a claim about whether multi-day appointments work at all in the product** — this inventory did not trace whether some other, newer mechanism (e.g. a per-tenant override elsewhere) supplies `allow_multiday`/treatment-sheet-enablement in practice; only that `get_tenant_features`'s own template-derived path cannot produce `true` for either flag today.
- **Confirmed unenforced field:** `gated_by` (on `financials.core` and `inventory.core` entries) is **never read by any backend code** — `grep -rln "gated_by" app/application/ app/api/ app/domain/` finds it only in `app/api/v1/schemas/template.py` as a passthrough Pydantic field, never evaluated for an actual entitlement decision. It is descriptive/UI-hint metadata today, not a live gate — recorded so the seed plan's use of it (§5/§8, as the *only* evidence for `billing`'s proposed plan mapping) is understood as inference from intent, not reproduction of enforced behavior.
- **Confirmed casing inconsistency:** `gated_by.plans` uses lowercase plan codes (`"pro"`, `"enterprise"`) while `included_modules`/`subscription_modules.py`/`org_subscription_plans.code` all use uppercase (`"PRO"`, `"ENTERPRISE"`). Never caused a live bug only because `gated_by` is never actually read — recorded as a latent inconsistency, not a live one.
- **No duplicate/conflicting capability-shaped keys were found across `enabledfeatures` vs `featuresettings` themselves** beyond the naming-alias point above — every key that appears in `featuresettings` also appears in `enabledfeatures` (a subset relationship, not two competing lists).

#### 12. Evidence the proposed seed reproduces current behavior

- **Plan→capability (§8) reproduces `org_subscription_plans.included_modules` exactly** (source A, §2) — verified module-for-module: FREE→`core`; BASIC→`core`+`clinical_documents`; PRO→+`inventory`+`staff_management`; ENTERPRISE→+`reports`. This is the literal parity baseline AC-2 requires, and Group F's own parity tests (T-F.1) will re-verify it against live tenant data before any retirement.
- **Template→capability defaults (§9) reproduce each template's own `enabledfeatures[].visibility`** field verbatim (enabled→true, disabled→false) — no reinterpretation.
- **`org_permissions.module` counts (§3) are quoted verbatim from the `c7911d033936` migration's own `UPDATE ... WHERE code IN (...)` lists**, not estimated.
- **Where evidence was insufficient to reproduce behavior with confidence** (`documents.core`, `billing`'s plan mapping, the proposed dependency edges), this inventory says so explicitly (§7, §8, §10) rather than presenting a guess as a fact — consistent with this document series' own "verify, don't assume" discipline.

#### 13. Separation of concerns — capability identity vs. settings/configuration vs. RBAC permission grouping vs. onboarding-readiness projections

Four genuinely distinct things this inventory touched, kept explicitly separate (conflating any two would recreate a §2-style hidden mechanism):

1. **Capability identity** (this inventory's own proposal, §5/§6) — the `Capability.code`/hierarchy itself: *does this feature exist, at what level of granularity.* Platform-owned, migration-only (Area K).
2. **Settings/configuration** (`featuresettings`'s `settings` blocks — `slot_duration_minutes`, `default_session_length_minutes`, `track_tooth_chart`, etc.) — **not** part of the Capability model at all. These are feature-internal configuration values, orthogonal to whether the capability is available/enabled. R5 does not migrate or own these; they remain wherever they live today (`OrgTemplate.featuresettings` or a future dedicated settings store) — a capability being enabled says nothing about what its settings are.
3. **RBAC permission grouping** (`org_permissions.module`/`.category`) — *who is allowed to act*, composed with but never merged into capability (Area F, FR-F1). §3's module tagging informs which `org_permissions` codes a capability's entitlement should logically align with, but the capability catalog does not store or duplicate permission codes.
4. **Onboarding-readiness projections** (`tenant_features`/`TenantFeature`, T-A.1's mechanism #7, and `OrgSetupProgress`) — *did the setup wizard mark this step/feature as configured*, a historical, onboarding-scoped fact, never a capability-availability answer. Confirmed in T-A.1 to have zero overlap with any mechanism this inventory touches, and excluded from this catalog seed entirely, consistent with T-A.1's binding boundary.

  - **Architecture deviations discovered:** none in the R5 design itself — all findings are further evidence of the *current-state* diffuseness `requirements.md` §2 already frames as the problem, now with concrete data rather than description.
  - **Unexpected findings:** (1) a third, previously-uncited disagreeing source for plan→module mapping (the `c7911d033936` migration's own docstring, agreeing with the dead dict, disagreeing with the actual live seed); (2) `rbac_seed.py`'s hardcoded CORE/INVENTORY-only behavior means it **never** grants `CLINICAL_DOCUMENTS`/`STAFF_MANAGEMENT`/`REPORTS` permissions regardless of plan — a real behavioral gap from `PermissionSyncService`, not just a duplicated-implementation risk, reinforcing T-D.5c's necessity; (3) two confirmed dead/never-true settings paths (`appointments.sessions` featuresettings, `allow_multiday`); (4) `gated_by` is entirely unenforced platform-wide; (5) `design.md` §18's illustrative `billing.invoicing` example turns out to already have real (if unenforced) template data behind it today, not purely hypothetical.
  - **Recommendation for T-A.4 approval:** ready for approval as drafted. Three items needed an explicit decision — **all three resolved during T-A.4 review:**
    - **(a) `billing`/`treatment`/`appointments` — seed all three now.** Approved. Rationale: grounded in real, live `enabledfeatures` template data today (not hypothetical like `design.md` §18's telemedicine/dental illustrations) — seeding them now gives the §20 extensibility proof real, non-illustrative capabilities to prove the platform against, and `billing` in particular directly realizes `design.md` §18's own `billing.invoicing` worked example against real data rather than a placeholder.
    - **(b) `documents.core` — leave unmapped.** Approved as recommended. No capability seeded for this key in Group B; revisit only if a real permission-gated document-management feature emerges later.
    - **(c) `clinical_documents.*` split — flat, no split.** Approved as recommended. Group B seeds a single flat `clinical_documents` capability (no `.casesheets`/`.treatment_sheets`/`.prescriptions` children) — today's actual behavior (`PermissionSyncService`/`rbac_seed.py` both grant or withhold the whole module as one unit) requires nothing finer, and `design.md` §7.6 already notes re-parenting later is possible, just high-impact/rare — an acceptable deferred cost, not a blocker now.
    - These three resolutions supersede §5/§6/§9's own "proposed, for review" framing above — the seed plan is now decided, not merely drafted, for Group B (T-B.4) to execute against.

**T-A.4 — ⛔ Ownership gate approval (EG-6)** · (doc) · deps: T-A.1, T-A.2, T-A.3 · realizes: `requirements.md` EG-6, AC-11
- **Purpose:** The hard gate — record explicit approval before any schema work.
- **Do:** Obtain and record explicit approval of T-A.1 + T-A.2 + T-A.3. **Until this reads "Approved," no Group B+ task may begin.**
- **Verification:** approval recorded in the Branch record.
- **Acceptance:** AC-11.
- **Dependency:** T-A.1, T-A.2, T-A.3.
- **Rollback:** n/a (gate).
- **Risk:** n/a.
- **Status:** ✅ **APPROVED — GATE PASSED.** T-A.1, T-A.2, T-A.3 all individually approved; a cross-document consistency verification was additionally performed across `requirements.md`/`design.md`/`tasks.md`/`OWNERSHIP.md` before recording this gate (not just a formality check — see findings below). Three open architecture decisions surfaced by T-A.3 were resolved during this review (recorded against T-A.3's own entry above). **No Group B+ task may begin until this entry; that condition is now satisfied — T-C.1 (Group C, the first production code task) may proceed.**

### T-A.4 cross-document consistency verification

**Method:** targeted greps + full-context reads across all four documents for every term the audit amendments introduced (`resolve_active_plan`, `legacy_tenant_projection`, `MINIMUM_FALLBACK`, `T-D.5`, `rbac_seed`, `tenant_features`), plus a close read of the specific FR/AC/ADR text most at risk of being contradicted by the audit's findings, rather than assuming consistency from having written the amendments myself.

1. **`design.md`/`tasks.md`/`OWNERSHIP.md` all reference the three-tier contract identically** (13/12/6 matches respectively for `resolve_active_plan`/`legacy_tenant_projection`/`MINIMUM_FALLBACK`) — no stale two-tier language found anywhere (`design.md` §9.0, ADR-R5-03, §5 ownership row, §16a, §19 Risks, §21 DoD all checked and consistent).
2. **No un-split `T-D.5` reference remains** outside historical audit quotations (T-A.2's own findings text, correctly preserved as a record of what was true *before* the split) and the amendment notes that explain the split — verified by direct grep across the full `tasks.md`.
3. **`requirements.md` needs no edits** — confirmed by design, not by omission. `requirements.md` is a "what," not "how," document; FR-A3/FR-A3b, ADR-R5-03's candidate framing, and OW-3 all **explicitly delegate** exactly the kind of resolution this audit produced to `design.md` ("this requirement does not predetermine... `design.md`'s subscription-lifecycle audit SHALL resolve what the authority is"; "Any entitlement/enablement-shaped field found during `design.md`'s own deeper audit... SHALL be added to the ownership table"). The three-tier contract and the `tenant_features`/`rbac_seed.py` findings are both squarely inside that delegated authority, not violations of it.
4. **One genuine close call, examined and resolved:** FR-A3b's literal text ("kept consistent with the authority... never left as a second independently-writable field that can silently drift again") could be read as requiring `OrgTenant.subscription_plan`'s six writers to already be eliminated. Traced against `requirements.md` §16's own State 1 metrics table: both the "Authoritative write paths... (currently 6 independent writers)" row and AC-15 are **explicitly scoped to "§2"** — the six *numbered mechanisms* (`subscription_modules.py` through the clinic-type branch) — not to `OrgTenant.subscription_plan`'s separately-discovered writer surface (a T-A.2 finding, not one of the original six). FR-A3's own text further confirms `design.md` has authority to define what "the authority" means, including a phased definition. **Conclusion: no contradiction** — but recorded here explicitly rather than silently assumed, since it was a real ambiguity worth tracing rather than waving away.
5. **AC-11/EG-6 satisfied by this entry** — the Ownership Platform table (`OWNERSHIP.md`) exists and is approved before any Group B task begins, exactly as required.
6. **N-3 scope check on the three newly-approved capabilities** (`appointments`/`treatment`/`billing`): confirmed **not** a violation — N-3 excludes implementing *hypothetical future capabilities' clinical/business logic* (telemedicine, dental workflows, etc.); `appointments`/`treatment`/`billing` are grounded in **real, already-live** `enabledfeatures` template data reconciled by this phase's own catalog, not new clinical logic being built. `design.md` §18's own worked examples remain illustrative-only and untouched; this is a different, in-scope activity — reconciling mechanism #4 into the catalog (Area A/B, exactly what R5 is for).
7. **`OWNERSHIP.md` status line and all four documents' cross-references** updated to reflect T-A.1/A.2/A.3 approval and this gate — verified no document still describes an earlier task as "pending" or "draft" where it has since been approved.

**No remaining contradictions found.** The gate is recorded as passed on this basis, not merely because three prior approvals exist.

---

## Group B — Schema (additive only, backend)

**T-B.1a — `Capability` catalog table migration (Area K identity/lifecycle)** · (be) · deps: T-A.4 · realizes: `requirements.md` FR-A1, FR-F4 (no `tenant_id`), FR-K1/K2/K3/K4/K5/K6/K7; `design.md` §4, §6.4
- **Purpose:** The anchor catalog table — every other new table FKs to it, so it lands first and alone.
- **Do:** One Alembic migration adding `Capability`: immutable `code` (`UNIQUE`), `name_key`/`description_key`, `category`, `parent_capability_id` self-FK, `lifecycle_state` enum('enabled','deprecated'), `mid_rollout` bool, `display_order` int, timestamps. **No `tenant_id`** (platform-global). Additive; nothing existing touched.
- **Files expected to change:** one new migration.
- **Verification:** `alembic upgrade head` then `downgrade` clean; single head; `UNIQUE(code)`, self-FK, enum check present.
- **Acceptance:** AC-19 (Capability portion), AC-13 (no tenant_id).
- **Dependency:** T-A.4.
- **Rollback:** `alembic downgrade`.
- **Risk:** low-medium — schema change, but a single additive table. Run in `test` first, not a live DB in this env.
- **Completion report (rule 8):** required.

**T-B.1b — `CapabilityDependency` edge table migration (Area E schema)** · (be) · deps: T-B.1a · realizes: `requirements.md` FR-E1, FR-K6; `design.md` §4, §7.1
- **Purpose:** The DAG edge list; separate task so the graph structure is reviewed on its own.
- **Do:** Migration adding `CapabilityDependency`: `capability_id`/`depends_on_capability_id` FKs → `Capability`, `CHECK capability_id != depends_on_capability_id` (no self-loop), `UNIQUE(capability_id, depends_on_capability_id)`. No `tenant_id`.
- **Files expected to change:** one new migration.
- **Verification:** up/down clean; FKs + self-loop check + unique present.
- **Acceptance:** AC-6 (schema portion), FR-K6.
- **Dependency:** T-B.1a.
- **Rollback:** downgrade.
- **Risk:** low.
- **Completion report (rule 8):** required.

**T-B.1c — `SubscriptionPlanCapability` + `TenantCapability` migration (entitlement ceiling + tenant enablement w/ OCC)** · (be) · deps: T-B.1a · realizes: `requirements.md` FR-A2, FR-B1, FR-J2, FR-F4; `design.md` §4
- **Purpose:** The entitlement-ceiling join and the one tenant-scoped enablement table (with the OCC `version` and audit columns Area J needs).
- **Do:** Migration adding `SubscriptionPlanCapability` (FK → existing `OrgSubscriptionPlan` + `Capability`, `UNIQUE`, no `tenant_id`) and `TenantCapability` (FK → `OrgTenant` + `Capability`, `is_enabled`, `source` enum('template_default','admin_override'), `version` int default 1, `enabled_by_staff_id`/`enabled_at`/`disabled_at`/`notes` audit cols, `UNIQUE(tenant_id, capability_id)`).
- **Files expected to change:** one new migration.
- **Verification:** up/down clean; `TenantCapability` is the only new table with `tenant_id`; uniques/FKs/version-default present.
- **Acceptance:** AC-4, AC-13 (only TenantCapability tenant-scoped), AC-18 (version-column foundation).
- **Dependency:** T-B.1a.
- **Rollback:** downgrade.
- **Risk:** low-medium (two additive tables).
- **Completion report (rule 8):** required.

**T-B.2 — Template linkage migration (§6.3)** · (be) · deps: T-B.1a · realizes: `requirements.md` FR-B2; `design.md` §6.3
- **Purpose:** The narrow `org_template_capabilities` join that supersedes `enabledfeatures`/`featuresettings` for seeding.
- **Do:** Migration adding `OrgTemplateCapability` (FK to existing `OrgTemplate` + `Capability`, `default_enabled` bool, `UNIQUE(template_id, capability_id)`). `enabledfeatures`/`featuresettings` untouched (BC-2).
- **Files expected to change:** one new migration.
- **Verification:** up/down clean; existing `OrgTemplate` columns unchanged.
- **Acceptance:** FR-B2 (schema portion).
- **Dependency:** T-B.1a.
- **Rollback:** downgrade.
- **Risk:** low (single additive join table).
- **Completion report (rule 8):** required.

**T-B.3 — ORM models + graph validation (§7.5)** · (be) · deps: T-B.1a, T-B.1b, T-B.1c, T-B.2 · realizes: `requirements.md` FR-E1, FR-K4/K6; `design.md` §7.5, §7.6
- **Purpose:** ORM models for the five new tables + the startup/migration graph validator.
- **Do:** Add ORM models (mirroring existing model conventions), register in `models/__init__.py`. Implement `validate_capability_graph(snapshot)` (cycles, missing parents, orphan warning, dep-on-deprecated hard error, duplicate/UNIQUE re-check) and wire it to run at app startup and expose it for the seed task to call at migration end.
- **Files expected to change:** 5 new model files, `models/__init__.py`, a new `capability_graph_validation.py` (application/infra layer), startup hook.
- **Verification:** models import cleanly (full app import); validator unit tests cover each violation class (cycle, missing parent, dep-on-deprecated) fail-loud, and a clean graph passes.
- **Acceptance:** AC-6 (validation portion), AC-19.
- **Dependency:** T-B.1a, T-B.1b, T-B.1c, T-B.2.
- **Rollback:** revert model/validator files (no schema change here).
- **Risk:** low-medium — a false-positive validator would block startup. Mitigated by tests distinguishing warnings (orphan) from errors (cycle/dep-on-deprecated).

**T-B.4 — Catalog seed script (ADR-R5-07)** · (be) · deps: T-B.3, T-A.3 · realizes: `requirements.md` FR-G2, ADR-R5-07; `design.md` §7.6, ADR-R5-07
- **Purpose:** Populate the catalog + dependency edges + plan-entitlement links from T-A.3's inventory — idempotent, logged, re-runnable, separate from schema DDL.
- **Do:** A standalone, idempotent seed script (`INSERT ... ON CONFLICT DO NOTHING`, logs every row) that seeds `Capability`/`CapabilityDependency`/`SubscriptionPlanCapability` from T-A.3's plan; runs `validate_capability_graph` at the end. Does **not** seed `TenantCapability` (that is Group D provisioning/seeding). Sets each seeded capability's `catalog_version`-relevant migration marker.
- **Files expected to change:** one new seed script under `scripts/` or `app/.../seeds/`.
- **Verification:** running twice = running once (idempotent); post-seed `validate_capability_graph` passes; plan→capability links match T-A.3's `included_modules` baseline.
- **Acceptance:** AC-2, AC-12 (foundation).
- **Dependency:** T-B.3, T-A.3.
- **Rollback:** the seed is additive catalog data; a companion cleanup deletes seeded rows if needed (no tenant data touched).
- **Risk:** medium — a wrong seed mis-entitles tenants. Mitigated by Group F parity tests gating any retirement, and the flag keeping the resolver off until proven.

---

## Group C — Active-Plan Contract, Resolver, Read API (backend, flag-gated)

**T-C.1 — Feature flag `capability_platform_v1_enabled` (ADR-R5-04)** · (be) · deps: T-A.4 · realizes: `requirements.md` ADR-R5-04, NFR-4; `design.md` ADR-R5-04
- **Purpose:** The rollout flag gating every Group C/D/E behavior change.
- **Do:** Add `capability_platform_v1_enabled: bool = False` to `app/core/config.py` (mirroring `treatment_lifecycle_v1_enabled` exactly); expose via `OrgTenantsService.get_tenant_features`. Flag test mirroring `test_treatment_lifecycle_feature_flag.py`.
- **Files expected to change:** `app/core/config.py`, `app/application/services/org_tenants_service.py`, one new test file.
- **Verification:** flag defaults False; independent of the other flags; test passes.
- **Acceptance:** ADR-R5-04 (foundation).
- **Dependency:** T-A.4.
- **Rollback:** revert the three edits.
- **Risk:** low (proven precedent).
- **Status:** ✅ COMPLETE — first R5 production code, backend repo, commit `288fe37c9e4416dd2d2ed71a9486b22dfda0da2d` on `feature/r5-capability-platform`, pushed.
  - **Files changed:** `app/core/config.py` (new `capability_platform_v1_enabled: bool = Field(default=False, ...)`, mirroring `treatment_lifecycle_v1_enabled` verbatim); `app/application/services/org_tenants_service.py` (`get_tenant_features` docstring + return dict gain the new field, same pattern as the three existing flags); `tests/test_capability_platform_feature_flag.py` (new, mirrors `test_treatment_lifecycle_feature_flag.py` exactly — 4 tests: default-False-and-no-existing-field-change, reflects-when-enabled, independence-from-other-flags, class-level-default guard); `.gitignore` (added the required `!tests/test_capability_platform_feature_flag.py` negation — this repo gitignores `tests/*` by default per its own "Repository Hygiene" convention, each test-adding task appends its own exception, confirmed by tracing why the new file wasn't showing as untracked).
  - **Reason:** ADR-R5-04 requires this rollout flag before any Group C/D/E behavior change; realizes the task exactly as scoped, no more.
  - **Verification:** `python3 -m pytest tests/test_capability_platform_feature_flag.py tests/test_treatment_lifecycle_feature_flag.py tests/test_clinical_spine_feature_flag.py tests/test_freshness_feature_flag.py -v` → **16 passed**, 0 failed (all 4 new + all 3 pre-existing flag tests, confirming no regression to the other flags). `git diff --check` → clean, no whitespace errors. Full app import (`python3 -c "import app.main"`) → succeeds, in an isolated venv created for this task (the repo has no committed `.venv`; system Python is Homebrew-managed and PEP-668-protected, so a throwaway venv was used rather than `--break-system-packages`). No other test file references `get_tenant_features`/`org_tenants_service` (grep-confirmed) — the four run above are the complete directly-affected set.
  - **Architecture deviations:** none. No domain-layer import added; no resolver, catalog table, API endpoint, or frontend change introduced; the flag gates nothing yet (nothing exists yet for it to gate) — its own presence in the `GET /tenants/{id}/features` response is the entire behavior this task adds.
  - **Unexpected findings:** the repo's `tests/*` gitignore-by-default convention (each approved test file needs its own explicit `.gitignore` negation) was not mentioned in this task's own "Files expected to change" list — discovered when the new test file didn't appear in `git status` after being written; resolved by following the exact precedent of the three prior flag tests' own negation entries, not a deviation from the pattern, just an undocumented fourth file this task's own template didn't name.
  - **Engineering debt:** none introduced by this task.
  - **Frontend/onboarding scope:** confirmed untouched — `novaclinicspro_rn` (`dev`) and `novaclinicspro-api-progressive-recovery`/`novaclinicspro_rn-progressive-recovery`/`novaclinicspro_rn-progressive-recovery-codex` (onboarding worktrees) all re-checked at their pre-existing HEADs with clean status, no fetch/checkout/touch of any kind.

**T-C.2 — Active-plan resolution contract, migration-aware (FR-A3, §9.0)** · (be) · deps: T-A.2 · realizes: `requirements.md` FR-A3/A3a-c, ADR-R5-03; `design.md` §9.0, ADR-R5-03
- **Purpose:** The single billing-owned answer to "what plan governs this tenant now," handling every subscription lifecycle state **and the current tenant population's actual data shape** — T-A.2 proved that three of four live tenant-creation paths never create an `OrgSubscription` row, so a contract that only reads `OrgSubscription` would silently mis-entitle those tenants (T-A.2 §F/§H). Amended per required review after T-A.2.
- **Do:** Implement `ActivePlanResolver.resolve_active_plan(tenant_id)` as a **three-tier precedence**, each tier's use recorded in the returned value's `source` field:
  1. **`active_subscription`** — a valid, lifecycle-governed `OrgSubscription` row exists (reading `status`, `current_period_end`, trial window; handling active / expired / cancelled / suspended / trial / pending / multiple-active per the original per-state test matrix). When present, **this is authoritative** and no other tier is consulted.
  2. **`legacy_tenant_projection`** — **only** reached when no `OrgSubscription` row exists at all for the tenant (the T-A.2-confirmed common case for org-admin-created, go-live, and provisioning-created tenants during the migration window). Reads `OrgTenant.subscription_plan` as an explicit, documented compatibility source — not silently, not as an afterthought, but as a named, tested tier of the contract.
  3. **`minimum_fallback`** — reached only when neither of the above resolves (no subscription row and no usable `subscription_plan` value) — the `CORE`-equivalent floor, exactly as `PermissionSyncService`'s current `["CORE"]` default already behaves.
  Every call to tier 2 (`legacy_tenant_projection`) is logged/counted (a new `capability_active_plan_legacy_fallback_count` metric, tagged by tenant, alongside §16a's existing observability set) so remaining reliant tenants can be identified and tracked toward zero — this is the mechanism T-C.2b's reconciliation task measures its own progress against. **This resolver never creates, backfills, or manufactures an `OrgSubscription` row or any billing history** — tier 2 is a read of existing data, not a synthesis of new data; manufacturing fake billing records to simplify resolution is explicitly out of this task's scope (see T-C.2b for the only approved path to reducing tier-2 reliance).
- **Files expected to change:** new `app/application/services/active_plan_resolver.py` (or infra), test file.
- **Verification:** one test per `OrgSubscription` lifecycle state incl. the multiple-active anomaly; a test proving tier-2 fires only when zero `OrgSubscription` rows exist; a test proving tier-3 fires only when tier 2 also has nothing usable; a test proving the returned `source` field correctly identifies which tier answered; a test proving no `OrgSubscription` row is ever written by this resolver (read-only enforcement, mirrors the domain-resolver purity discipline at the application layer). No consumer reads either raw plan field directly once wired (FR-A3c) — but the *resolver itself* legitimately reads `OrgTenant.subscription_plan` as its documented tier-2 fallback, which is not a violation of FR-A3c (the resolver **is** the single seam; it isn't bypassing itself).
- **Acceptance:** AC-3.
- **Dependency:** T-A.2.
- **Rollback:** revert new files; no existing behavior changed (nothing consumes it yet).
- **Risk:** medium — mis-handling a lifecycle state mis-entitles a tenant. Mitigated by exhaustive per-state tests + the flag keeping it inert until wired. **Additional risk (new, from T-A.2):** if tier 2 is ever implemented as silently equivalent to tier 1 rather than a logged, tracked, explicitly time-bounded compatibility path, the contract re-introduces exactly the "two independent sources of truth" problem it exists to close. Mitigated by the mandatory `source` field and the fallback-count metric being non-optional parts of this task's Definition of Done, not a follow-up.

**T-C.2b — Subscription record reconciliation/backfill (separately reviewed) (ADR-R5-03, ADR-R5-07, T-A.2 finding)** · (be) · deps: T-A.2, T-C.2 · realizes: `requirements.md` FR-A3b, N-8, ADR-R5-07's backfill discipline applied to this specific gap; `design.md` §9.0 (as amended)
- **Purpose:** Close T-C.2's `legacy_tenant_projection` tier down toward zero usage over time, by reconciling or backfilling `OrgSubscription` coverage for tenants that currently have none — **this task is planning/definition only at this point in the sequence; its own execution is a separately reviewed change, gated on its own explicit approval, not bundled into T-C.2's implementation.**
- **Do (to be detailed in its own review, not decided here):** Enumerate every tenant with `OrgTenant.subscription_plan` set but zero `OrgSubscription` rows (the T-A.2-confirmed population: org-admin-created, go-live, and provisioning-created tenants never routed through `SubscriptionCheckoutService`). For each, the reconciliation plan must explicitly define — subject to its own separate approval, **not implied or defaulted here** — the manufactured row's `status`, `current_period_end`/billing dates, trial semantics (is it backfilled as `trial`, as `active` with no billing history, or something else), and any billing/notification implications of a tenant suddenly having a subscription record it never actually purchased. **Binding constraint carried from this amendment: no fake active billing subscription may be created for a historical tenant except under a plan that explicitly and separately addresses these questions** — this task does not authorize itself to invent that plan's answers.
- **Files expected to change:** none at this stage — this entry exists to hold the task's place and binding constraints in the plan; its own "Do" is filled in and re-reviewed immediately before it is implemented, mirroring ADR-R5-07's schema-migration-vs-data-seeding separation discipline applied one level further (definition-review vs. execution-review).
- **Verification (of the eventual execution, not of this definition):** post-reconciliation, `capability_active_plan_legacy_fallback_count` (T-C.2) trends toward zero for the reconciled tenant set; no tenant's resolved entitlement changes as a side effect of reconciliation alone (a parity check against pre-reconciliation `PermissionSyncService` output for the same tenants).
- **Acceptance:** progress toward State 2's "no consumer reads `OrgTenant.subscription_plan` as an independent source" (§16), specifically the precondition for ever removing T-C.2's tier 2.
- **Dependency:** T-A.2 (the population this task reconciles), T-C.2 (the tiered contract this task's success is measured against).
- **Rollback:** whatever the eventual, separately-approved plan specifies — not decided here.
- **Risk:** high — manufacturing billing-adjacent records for real tenants is exactly the kind of change that must not be improvised. This task's entry in `tasks.md` exists specifically so it cannot be silently skipped or silently folded into T-C.2, and so its own review happens before any row is created, not after.

**T-C.3 — Pure domain resolver (§8.2/8.3, NFR-8)** · (be) · deps: T-A.4 · realizes: `requirements.md` FR-C1/C2/C4, FR-E1/E2/E4, FR-K5, NFR-3/NFR-8; `design.md` §8, ADR-R5-02/R5-09
- **Purpose:** The pure runtime authority — two immutable snapshots in, effective-state map out.
- **Do:** `app/domain/services/capability_resolver.py` with `CapabilityCatalogSnapshot` + `TenantCapabilitySnapshot` frozen dataclasses and `resolve(catalog, tenant)`. Implement §8.3's decision tree (not-found, deprecated, not-entitled, mid-rollout-off, dependency via explicit edge + the ADR-R5-09 parent rule, cycle-guard fail-closed, depth bound, available-with-preference). Emit the FR-H4 machine fields (entitled/tenant_preference/effective_available/effective_enabled/blocked_reason_code/unmet_dependencies/source). No I/O, no config/localization import.
- **Files expected to change:** new resolver module + test file.
- **Verification:** unit tests cover every §8.3 branch incl. deprecated, parent-rule (`test_child_capability_unavailable_when_parent_unavailable`), cycle fail-closed, four-distinct-booleans; a **purity test** asserts no import from `app.infrastructure`/`app.api`/`app.core.config`/`app.localization` (mirrors R4's dependency-direction regression).
- **Acceptance:** AC-5, AC-6 (resolve-time), AC-20, NFR-8.
- **Dependency:** T-A.4.
- **Rollback:** revert new files; nothing consumes it yet.
- **Risk:** medium — the platform's core. Mitigated by pure-function testability (no mocks) + exhaustive branch coverage.

**T-C.4a — `CapabilityCatalogProvider` (snapshot + cache + invalidation) (§9.1, §16)** · (be) · deps: T-C.3, T-B.4 · realizes: `requirements.md` NFR-5; `design.md` §9.1, §16, §7.6
- **Purpose:** The platform-global catalog snapshot builder with per-deploy caching and defined invalidation — one isolated seam.
- **Do:** `CapabilityCatalogProvider` building `CapabilityCatalogSnapshot` (nodes + edges + `catalog_version`), in-process cache keyed by `catalog_version`, invalidation on restart / version change / explicit refresh (§16). Runs `validate_capability_graph` (T-B.3) on build.
- **Files expected to change:** one new provider file, test.
- **Verification:** cache hit on repeat call same version; rebuild on `catalog_version` change; explicit-refresh works; graph validated on build.
- **Acceptance:** NFR-5, §16 cache-invalidation.
- **Dependency:** T-C.3, T-B.4.
- **Rollback:** revert file; unused until wired.
- **Risk:** medium — cache-invalidation bugs. Mitigated by explicit version-keyed tests + read-only-per-instance safety (§7.6).
- **Completion report (rule 8):** required.

**T-C.4b — `CapabilityResolutionService` (build tenant snapshot, invoke pure resolver) (§9.1)** · (be) · deps: T-C.2, T-C.3, T-C.4a · realizes: `requirements.md` FR-C3, FR-H4 (machine fields), NFR-8; `design.md` §9.1
- **Purpose:** Assemble the `TenantCapabilitySnapshot` and call the pure resolver — the orchestration seam, no localization, no caching (those are separate collaborators).
- **Do:** `CapabilityResolutionService`: builds `TenantCapabilitySnapshot` via `ActivePlanResolver` (T-C.2) + `TenantCapability` override repo + rollout-flag config reads (passed to the resolver as plain bools, NFR-8); calls `resolve(catalog, tenant)`; returns the machine-level `CapabilityState` map (no labels yet).
- **Files expected to change:** one new service file, test.
- **Verification:** returns correct machine-field map for representative tenants; a test confirms it passes rollout flags as plain values (resolver never reads config).
- **Acceptance:** AC-5 (resolution wiring), FR-C3, NFR-8.
- **Dependency:** T-C.2, T-C.3, T-C.4a.
- **Rollback:** revert file; flag OFF.
- **Risk:** medium — the wiring the whole platform reads. Mitigated by per-tenant scenario tests.
- **Completion report (rule 8):** required.

**T-C.4c — `CapabilityLocalizationService` + `capabilities.json` (en/hi/mr) (§9.2, FR-D1)** · (be) · deps: T-C.4b · realizes: `requirements.md` FR-D1, FR-H4 (labels), NFR-8; `design.md` §9.2
- **Purpose:** Turn machine reason codes + `name_key`/`description_key` into localized text at the application boundary — the localization seam, kept out of the domain resolver.
- **Do:** `CapabilityLocalizationService` + `app/localization/locales/{en,hi,mr}/capabilities.json` (every `blocked_reason_code` + every capability's name/description key). Adds `blocked_reason_label` + localized name/description to the machine map.
- **Files expected to change:** one new service file, 3 new json files, test.
- **Verification:** localization parity across en/hi/mr (every reason code + capability key present, no missing-key fallback); the resolver imports no localization (re-run NFR-8 purity test).
- **Acceptance:** FR-D1, FR-H4 (labels), NFR-8.
- **Dependency:** T-C.4b.
- **Rollback:** revert files.
- **Risk:** low — missing translation key. Mitigated by the parity test.
- **Completion report (rule 8):** required.

**T-C.4d — Observability metrics (§16a)** · (be) · deps: T-C.4b · realizes: `requirements.md` (operational visibility); `design.md` §16a
- **Purpose:** Instrument the single resolver seam — the diagnostic advantage the six diffuse mechanisms never offered.
- **Do:** Emit the §16a metrics via this codebase's `structlog`/counters: `capability_resolve_count` (by outcome), `capability_resolve_latency`, `capability_catalog_cache_hit_ratio`, `capability_evaluation_failure_count`, `capability_dependency_unmet_count`, `capability_entitlement_mismatch_count` (FR-A3b drift detector), `capability_toggle_count` (by outcome). Operational only — never fed back into resolution.
- **Files expected to change:** instrumentation in the provider/resolution/admin services, a test.
- **Verification:** counters increment on the expected events (assert in a test); no metric read participates in resolution logic.
- **Acceptance:** §16a metric names emitted.
- **Dependency:** T-C.4b.
- **Rollback:** revert instrumentation.
- **Risk:** low.
- **Completion report (rule 8):** required.

**T-C.5 — Read endpoints: `/capabilities` + `/capabilities/catalog` (FR-H1/H4, NFR-6)** · (be) · deps: T-C.4c, T-D.1 · realizes: `requirements.md` FR-H1/H4, NFR-6, AC-SEC-1/5; `design.md` §11
- **Purpose:** Expose the resolver's effective-state map + the platform catalog, tenant-guarded, no rollout leak.
- **Do:** `GET /tenants/{id}/capabilities` (FR-H4 fields + localized labels) and `GET /capabilities/catalog` (no `mid_rollout`/flag exposure). Path-`tenant_id`-vs-auth-context guard (reject 403 on mismatch, mirroring `create_treatment_recommendation`). Require `capability.view`.
- **Files expected to change:** new router file, DI wiring, response schemas.
- **Verification:** endpoint returns the distinct FR-H4 fields; catalog endpoint omits rollout markers; cross-tenant request → 403; request-id-≠-token-id → 403.
- **Acceptance:** AC-SEC-1, AC-SEC-5, FR-H1/H4.
- **Dependency:** T-C.4c, T-D.1 (needs `capability.view` permission).
- **Rollback:** revert router; flag OFF.
- **Risk:** medium — an isolation bug leaks cross-tenant state. Mitigated by the explicit AC-SEC-1/5 negative tests.

---

## Group D — Write Path, Seeding, Entitlement Loss, RBAC (backend, flag-gated)

**T-D.1 — New permissions `capability.view` / `capability.manage` (FR-F2)** · (be) · deps: T-A.4 · realizes: `requirements.md` FR-F2, NFR-7; `design.md` §11
- **Purpose:** RBAC permissions for viewing/managing capabilities, seeded via the existing permission convention.
- **Do:** Migration seeding `capability.view` + `capability.manage` into `org_permissions` and assigning to CLINIC_ADMIN/CLINIC_OWNER (mirroring R4's `treatment_sheet.release` seeding). No merge with capability state (composition, FR-F1).
- **Files expected to change:** one migration.
- **Verification:** up/down clean; permissions present; assigned to the right roles.
- **Acceptance:** FR-F2.
- **Dependency:** T-A.4.
- **Rollback:** downgrade.
- **Risk:** low (proven pattern).

**T-D.2a — `CapabilityAdminService` write path (Area J: OCC/idempotency/audit/transactional)** · (be) · deps: T-C.4b, T-D.1 · realizes: `requirements.md` FR-B3, FR-E3, FR-J1-4, AC-18, AC-SEC-4, NFR-7; `design.md` §9.3
- **Purpose:** The one tenant-capability write path as a service — no HTTP concern yet, so its concurrency/dependency logic is testable in isolation.
- **Do:** `CapabilityAdminService.enable/disable_capability(...expected_version)` per §9.3: FOR-UPDATE lock, OCC via `version` (`CapabilityVersionConflictError`), idempotent no-op, enable-only-if-`effective_available` (no independent re-derivation, FR-C3), disable-rejected-if-blocking-dependents (named), audit (actor/source/timestamp), transactional validate+write, returns re-resolved map + new version. Never writes `org_permissions`/`tenant_permissions`.
- **Files expected to change:** new admin service, error type, tests.
- **Verification:** tests — idempotent re-enable/re-disable; version-conflict on stale version; blocks-dependents rejection names them; enable-not-entitled rejected; transactional validate+write; a test proving the path never touches `org_permissions`/`tenant_permissions` (AC-SEC-4/NFR-7).
- **Acceptance:** AC-18, AC-SEC-4, FR-B3/FR-E3/FR-J1/FR-J2/FR-J3/FR-J4.
- **Dependency:** T-C.4b, T-D.1.
- **Rollback:** revert; flag OFF.
- **Risk:** medium — concurrency correctness. Mitigated by reusing the proven OCC pattern + explicit conflict tests.
- **Completion report (rule 8):** required.

**T-D.2b — `PATCH /tenants/{id}/capabilities/{code}` endpoint (If-Match, tenant guard, structured errors)** · (be) · deps: T-D.2a · realizes: `requirements.md` FR-B3, FR-J5, FR-H2, NFR-6, AC-SEC-1/2/5; `design.md` §11
- **Purpose:** The HTTP surface over the write service — its own task so the transport concerns (auth, If-Match, structured error mapping, tenant guard) are reviewed separately from the write logic.
- **Do:** `PATCH /tenants/{id}/capabilities/{code}` requiring `capability.manage`; reads `If-Match` → `expected_version`; path-`tenant_id`-vs-auth-context guard (403 on mismatch); maps service rejections to the structured 409/422 shape (`not_entitled`/`dependency_unmet`/`blocks_dependents`/`version_conflict`, FR-J5); returns the re-resolved map + new version (FR-H2).
- **Files expected to change:** router addition, response/error schemas, DI wiring, tests.
- **Verification:** happy-path toggle; each rejection returns its structured shape; cross-tenant/path-id-≠-token → 403 (AC-SEC-1/5); capability-enabled-but-no-permission → the endpoint's own `require_permission` still blocks (AC-SEC-2).
- **Acceptance:** FR-J5, FR-H2, AC-SEC-1/2/5.
- **Dependency:** T-D.2a.
- **Rollback:** revert router; flag OFF.
- **Risk:** medium — an isolation/authz bug at the boundary. Mitigated by the explicit AC-SEC negative tests.
- **Completion report (rule 8):** required.

**T-D.3 — Template-default seeding on provisioning (§9.4, ADR-R5-08)** · (be) · deps: T-B.2, T-D.2a · realizes: `requirements.md` FR-B2a-d, FR-B4 (provenance reconstructable from the row), AC-16; `design.md` §9.4, ADR-R5-08
- **Purpose:** Seed a new tenant's `TenantCapability` from its template, with override-immunity and idempotency.
- **Do:** On tenant provisioning, seed `TenantCapability(source='template_default')` from `org_template_capabilities`. A separate task-callable seeder for new catalog capabilities → existing tenants (only where no row exists). `INSERT ON CONFLICT DO NOTHING`; never overwrites `admin_override`; never resurrects a disabled capability.
- **Files expected to change:** provisioning-flow hook, a seeding routine, tests.
- **Verification:** tests — `template_default` vs `admin_override` provenance; admin_override immune to template change; new-capability seeds only where absent; re-seed idempotent; never resurrects a disabled capability.
- **Acceptance:** AC-16, FR-B2a-d.
- **Dependency:** T-B.2, T-D.2a.
- **Rollback:** revert hook; seeded rows are additive tenant data (cleanup companion if needed).
- **Risk:** medium — clobbering a tenant decision. Mitigated directly by the AC-16 idempotency/immunity tests.

**T-D.4 — Entitlement-loss behavior (§9.5, ADR-R5-10)** · (be) · deps: T-D.2a · realizes: `requirements.md` FR-I1-6, FR-F5, AC-17, NFR-7; `design.md` §9.5, ADR-R5-10
- **Purpose:** Define what happens when a tenant loses entitlement while a capability is still enabled.
- **Do:** Resolver already reports unavailable when `entitled_codes` drops the code (T-C.3). Add: preference retention (no force-flip); a reusable capability-write guard feature endpoints call to reject writes behind an unavailable capability with a structured `requires_plan_upgrade` reason (FR-I5); no data deletion (FR-I3); permission-sync re-evaluation trigger on entitlement loss (FR-F5/I6).
- **Files expected to change:** a shared capability-guard dependency/util, permission-sync hook, tests.
- **Verification:** tests — effective-unavailable on next resolution; preference retained + auto-reactivate on re-entitlement; no deletion; write rejected with structured reason; permission-sync re-runs.
- **Acceptance:** AC-17, FR-I1-6, FR-F5.
- **Dependency:** T-D.2a.
- **Rollback:** revert; flag OFF.
- **Risk:** medium — a stale privileged grant surviving loss (security). Mitigated by the FR-F5 re-sync test + AC-SEC-3.

**T-D.5 was split into T-D.5a/T-D.5b/T-D.5c per required review after T-A.2**, which found a second, independently-coded, live implementation of the same subscription→module→permission filter (`rbac_seed.py`'s `_seed_tenant_permissions_async`, run at tenant-creation time) that the original single-task T-D.5 did not cover. Re-pointing only `PermissionSyncService` would have left a second, undocumented entitlement engine standing — exactly the kind of outcome Area G exists to prevent.

**T-D.5a — Re-point `PermissionSyncService.sync_tenant_permissions` (runtime re-sync) (FR-F3/F5)** · (be) · deps: T-C.2, T-D.4 · realizes: `requirements.md` FR-F3, FR-F5, AC-SEC-3; `design.md` §2.2, §9.5
- **Purpose:** Replace the ad hoc `included_modules`/`.module.in_()` filter with the capability entitlement model + active-plan contract, for the **on-demand re-sync path**.
- **Do:** Re-point `PermissionSyncService.sync_tenant_permissions` to read entitlement via `resolve_active_plan` + `SubscriptionPlanCapability` (behind the flag; the old path remains until Group F parity). Keep its additive/non-destructive behavior. Ensure entitlement-loss re-sync (FR-F5) leaves no privileged action available.
- **Files expected to change:** `app/application/rbac/permission_sync_service.py`, tests.
- **Verification:** re-pointed service produces the same-or-superset permission set as today for a representative tenant (parity precursor to Group F); AC-SEC-3 (capability-unavailable ⇒ action not performable).
- **Acceptance:** FR-F3, FR-F5, AC-SEC-3.
- **Dependency:** T-C.2, T-D.4.
- **Rollback:** flag OFF restores the old filter (both paths coexist until Group F).
- **Risk:** high — RBAC is security-critical. Mitigated by flag-gating + parity comparison + keeping the old path live until Group F proves equivalence.

**T-D.5b — Re-point `rbac_seed.py`'s `_seed_tenant_permissions_async` (tenant-creation-time seeding) (FR-F3/F5, T-A.2 finding)** · (be) · deps: T-C.2, T-D.4 · realizes: `requirements.md` FR-F3, FR-F5, AC-SEC-3; `design.md` §2.2, §9.5 (both extended per T-A.2's discovery)
- **Purpose:** Close the gap T-A.2 found — a second, live, raw-SQL implementation of the same subscription→module→permission logic, run at tenant creation via `TenantRbacSeedHandler` (on `TenantCreatedEvent`) and directly from `demo_service.py`/`tenant_provisioning_service.py`. Left un-repointed, this remains an undocumented second entitlement engine even after T-D.5a ships.
- **Do:** Re-point `_seed_tenant_permissions_async` (`app/infrastructure/db/seeds/rbac_seed.py`) to read entitlement via the same `resolve_active_plan` + `SubscriptionPlanCapability` seam T-D.5a uses — not a second, independently-derived implementation of the lookup. Behind the same flag; the old raw-SQL query remains until Group F parity. Preserve its current CORE-vs-INVENTORY behavior exactly under the flag-off path (no regression to the simplified module set it currently seeds).
- **Files expected to change:** `app/infrastructure/db/seeds/rbac_seed.py`, tests.
- **Verification:** re-pointed seeding produces the same-or-superset permission set as today's raw-SQL query for a representative tenant/plan combination; confirms the seed path and the sync path (T-D.5a) now share one entitlement-lookup implementation rather than two.
- **Acceptance:** FR-F3, FR-F5 — extended to cover the seeding path, not only the sync path.
- **Dependency:** T-C.2, T-D.4.
- **Rollback:** flag OFF restores the old raw-SQL filter.
- **Risk:** high — same RBAC-security-critical class as T-D.5a, plus the added risk of two call sites drifting if re-pointed independently rather than through one shared seam. Mitigated by T-D.5c's explicit parity test between the two.

**T-D.5c — Parity test: seeding and sync produce equivalent permission sets (FR-F3/F5, T-A.2 finding)** · (be) · deps: T-D.5a, T-D.5b · realizes: `requirements.md` FR-F3, FR-F5; `design.md` §2.2, §9.5
- **Purpose:** Prove, not assume, that tenant-creation-time seeding (T-D.5b) and later on-demand re-sync (T-D.5a) now agree — closing the exact "two engines can silently diverge" risk T-A.2 surfaced, for both the pre-cutover (raw-SQL vs ORM) and post-cutover (both re-pointed) states.
- **Do:** A dedicated test (or small suite) that, for a representative set of tenant/plan/capability-state combinations, runs both `_seed_tenant_permissions_async`'s resulting permission set and `PermissionSyncService.sync_tenant_permissions`'s resulting permission set and asserts they are equivalent — both before re-pointing (documenting today's actual behavior, including the CORE/INVENTORY simplification) and after (T-D.5a/T-D.5b landed, both flag-on and flag-off).
- **Files expected to change:** one new test file; no production code (this task is verification-only).
- **Verification:** the parity assertion passes in both the pre- and post-re-point configurations; a documented, deliberate difference (e.g., the seed path's current CORE/INVENTORY simplification, if it is intentionally preserved rather than expanded) is explicitly asserted as expected, not silently tolerated.
- **Acceptance:** the binding requirement that "tenant-creation permission seeding and later permission synchronization must produce equivalent results" is verified, not assumed.
- **Dependency:** T-D.5a, T-D.5b.
- **Rollback:** test-only; no production impact.
- **Risk:** low — this task only adds verification. Its absence, not its presence, is the risk it exists to close.

---

## Group E — Frontend & Extensibility Proof

**T-E.1 — `useCapabilities()` + `useToggleCapability()` (FR-H2)** · (fe) · deps: T-C.5, T-D.2b · realizes: `requirements.md` FR-H2/H4, N-6; `design.md` §12
- **Purpose:** The read hook (fetch-once-per-session) and the mutation hook that invalidates the initiating client's cache.
- **Do:** `core/hooks/useCapabilities.ts` (React Query, mirrors `useFeatures()`; returns FR-H4 map + `getReason(code)` via existing `useTranslation()`). `useToggleCapability()` — sends `If-Match`, on success updates the cache from the returned re-resolved map (FR-H2), surfaces `version_conflict` as a "please review" state. No WebSockets (N-6).
- **Files expected to change:** 2 new hook files, tests.
- **Verification:** read hook caches per session; mutation invalidates/updates its own client's cache; version-conflict surfaced; reason strings localized.
- **Acceptance:** AC-21, FR-H2.
- **Dependency:** T-C.5, T-D.2b.
- **Rollback:** revert hooks.
- **Risk:** low-medium — stale cache UX. Mitigated by the returned-map cache update + AC-21 test.

**T-E.2 — `<CapabilityGate>` component per the §12 UI contract (FR-H3)** · (fe) · deps: T-E.1 · realizes: `requirements.md` FR-H3; `design.md` §12
- **Purpose:** The reusable gate primitive with a defined UI contract (loading/unavailable/hide-vs-disable/nested/error).
- **Do:** `<CapabilityGate code fallback whenDisabled whenUnavailable>` per §12: loading→fallback/null (never optimistic), available+enabled→children, unavailable→null-or-`whenUnavailable(reason)`, hide-vs-disable is the consumer's explicit prop choice, nested gates independent, fail-closed on error, integrates existing error boundary. Never a security boundary.
- **Files expected to change:** 1 new component, tests.
- **Verification:** tests for each contract state (loading, available, unavailable-with-reason, disabled, nested, error fail-closed).
- **Acceptance:** FR-H3, §12 contract.
- **Dependency:** T-E.1.
- **Rollback:** revert component.
- **Risk:** low. Risk of inconsistent adoption — mitigated by the explicit contract + tests as the reference.

**T-E.3 — Minimum tenant-admin capability UI (FR-H3)** · (fe) · deps: T-E.1, T-E.2 · realizes: `requirements.md` FR-H3, N-7; `design.md` §12
- **Purpose:** The minimum viable admin surface to view/toggle a tenant's own capabilities with reasons.
- **Do:** A settings-screen list (deterministic `display_order`) of top-level + child capabilities showing available/unavailable + reason, with a toggle for toggleable ones. No cross-tenant catalog-curation UI (N-7).
- **Files expected to change:** 1–2 new screen/component files, route wiring.
- **Verification:** list renders ordered; toggles call `useToggleCapability`; rejection reasons surfaced; no catalog-edit affordance.
- **Acceptance:** FR-H3.
- **Dependency:** T-E.1, T-E.2.
- **Rollback:** revert screen.
- **Risk:** low.

**T-E.4 — Extensibility proof (§20 five-step)** · (be+fe) · deps: T-C.5, T-D.2b, T-E.3 · realizes: `requirements.md` §20, AC-12, BO-3; `design.md` §18/§20
- **Purpose:** Prove the platform is extensible using only what this phase ships — R5's equivalent of R4's journey test.
- **Do:** Run the five-step proof against the shipped platform: register an illustrative catalog entry (migration/seed only, no router/service change), declare a dependency, grant to one plan not another, admin-enable it, attempt-disable-a-depended-on-capability (rejected with named dependent). Record the result.
- **Files expected to change:** a throwaway seed/migration for the illustrative entry (reverted after), `tasks.md` result record.
- **Verification:** all five steps pass; **no code change to any router/service** was required to register the capability (AC-12).
- **Acceptance:** AC-12, §20.
- **Dependency:** T-C.5, T-D.2b, T-E.3.
- **Rollback:** remove the illustrative entry.
- **Risk:** low — this is a proof, not production. A failure here is a design signal, caught before closure.

---

## Group F — Reconciliation & Retirement (State 1 exit)

**T-F.0 — ⛔ Dry-Run checkpoint (pre-retirement safety gate — nothing is deleted)** · (be+fe) · deps: T-E.4 (whole platform built) · realizes: `requirements.md` NFR-2/NFR-4, BC-1..4, §16 State 1; `design.md` §14
- **Purpose:** One full-platform rehearsal **before a single mechanism is retired** — the extra safety net between "the new platform is built" and "the old mechanisms are removed." A green automated suite is necessary but not sufficient; this proves the *whole system* behaves correctly with the flag both on and off, on real-shaped data, while everything old is still present and reversible.
- **Do (delete nothing in this task):**
  1. Run the entire platform end-to-end with `capability_platform_v1_enabled` **ON** — resolver-backed entitlement/enablement live; capture a representative sample of tenants' effective-capability maps and their `get_tenant_features`/permission-sync outputs.
  2. Flip the flag **OFF** — confirm every consumer falls back cleanly to the six existing mechanisms with **identical** observable behavior (BC-1: `get_tenant_features` shape unchanged; permission sets unchanged).
  3. Flip **ON** again — confirm parity with step 1 (deterministic, no drift across the toggle).
  4. Record the on/off/on comparison as the dry-run evidence. **No mechanism is retired, no column dropped, no file deleted in this task** — the whole old system remains intact and the flag remains the reversible boundary.
- **Files expected to change:** none (a rehearsal + an appended evidence record); at most a throwaway comparison script under `scripts/` (removed after).
- **Verification:** flag ON→OFF→ON produces consistent, parity-matching outputs for the tenant sample; no consumer errors on either flag state; the six mechanisms are all still present and readable.
- **Acceptance:** the dry-run evidence shows flag-toggle parity with nothing deleted — the precondition for T-F.1/T-F.2. If any discrepancy is found, **stop**: it is a resolver/seed bug to fix before retirement, not a reason to proceed.
- **Dependency:** T-E.4 (platform fully built, including frontend).
- **Rollback:** trivial — nothing was changed; flag returns to OFF (its default).
- **Risk:** this task *reduces* risk (it is the safety net). The only failure mode is discovering a parity gap — which is exactly what it exists to catch, before any irreversible retirement.
- **Completion report (rule 8):** must record the on/off/on comparison outputs and any discrepancy found.

**T-F.1 — Per-mechanism parity tests (FR-G2)** · (be) · deps: T-F.0 · realizes: `requirements.md` FR-G2, §16 State 1; `design.md` §15
- **Purpose:** Prove the resolver gives an equivalent-or-better answer than each old mechanism, per FR-G1 classification, before any retirement.
- **Do:** For each mechanism classified (A)/(B) in T-A.1, a parity test comparing the new resolver's output to the old mechanism's for a representative tenant sample (esp. `get_tenant_features` shape-parity and `PermissionSyncService` permission-set parity).
- **Files expected to change:** parity test files.
- **Verification:** every parity test passes for its mechanism before its retirement task runs.
- **Acceptance:** FR-G2, State 1 precondition.
- **Dependency:** T-F.0.
- **Rollback:** tests only.
- **Risk:** medium — a parity gap means the seed/resolver is wrong. This task is the safety net that catches it before retirement.
- **Completion report (rule 8):** required.

**T-F.2a — Backend mechanism retirement (FR-G1)** · (be) · deps: T-F.1 · realizes: `requirements.md` FR-G1, FR-G3, BC-1/2/3, §16 State 1; `design.md` §5, §14
- **Purpose:** Retire/demote the *backend* mechanisms so no old backend mechanism remains an independent writer.
- **Do:** Per T-A.1's classifications: (A) retire the dead `subscription_modules.py` (confirmed no callers); (B) demote `included_modules`/`enabledfeatures`/`featuresettings`/`OrgTenant.subscription_plan` to read-only compatibility (per T-A.2's sync-vs-projection decision); re-point `get_tenant_features` internals to the resolver (shape-verified, BC-1). Frontend consumers handled in T-F.2b; compat-ledger in T-F.2c.
- **Files expected to change:** removal of `subscription_modules.py` (or callers), demotion edits, `get_tenant_features` re-point.
- **Verification:** grep proof — no backend code writes any demoted mechanism as an independent source; `get_tenant_features` shape unchanged (BC-1); backend regression green.
- **Acceptance:** AC-1 (backend), AC-15 (backend writers), BC-1.
- **Dependency:** T-F.1 (parity must pass first, MIG-1).
- **Rollback:** flag OFF restores old behavior; retiring the confirmed-dead file is the one non-flag step, sequenced late (§14).
- **Risk:** high — retiring a live backend mechanism. Mitigated by T-F.0 dry-run + T-F.1 parity + flag-first rollback + retiring only confirmed-dead code outright.
- **Completion report (rule 8):** required.

**T-F.2b — Frontend consumer migration (FR-D2)** · (fe) · deps: T-F.1 · realizes: `requirements.md` FR-D2, BC-1; `design.md` §12
- **Purpose:** Re-point every existing frontend ad hoc clinic-type/subscription gate to the resolver via `<CapabilityGate>`/`useCapabilities()` — the "consumers migrated" half of Area G, sequenced (not assumed at design approval).
- **Do:** Enumerate existing ad hoc frontend gates (clinic-type checks, subscription-plan checks); re-point each to `<CapabilityGate code>`/`useCapabilities()`. No behavior change for the tenant (the resolver returns the same availability the ad hoc check did — validated against T-F.1 parity).
- **Files expected to change:** the enumerated frontend gate call sites, tests/snapshots.
- **Verification:** grep proof — no remaining ad hoc clinic-type/subscription gate in the frontend; each re-pointed screen renders identically for a representative tenant; frontend regression green.
- **Acceptance:** FR-D2.
- **Dependency:** T-F.1.
- **Rollback:** revert the re-points; flag OFF makes `<CapabilityGate>` fall back (per its contract).
- **Risk:** medium — a re-pointed gate hides/shows a feature differently. Mitigated by per-screen parity checks against T-F.1.
- **Completion report (rule 8):** required.

**T-F.2c — Compatibility cleanup + State 1 exit verification (AC-15, §16 State 1)** · (be+fe) · deps: T-F.2a, T-F.2b · realizes: `requirements.md` FR-G1, BC-4, AC-15, §16 State 1; `design.md` §5, §16
- **Purpose:** Close Group F — record each surviving read-only compatibility reader's owner/removal-criterion/deadline (the State 2 ledger) and verify State 1 exit.
- **Do:** For every mechanism classified (B), record in a deprecation ledger its owner, removal criterion, and deadline (the input to State 2 / flag removal). Confirm exactly **one authoritative write path** remains across backend + frontend (AC-15). Remove any now-dead compat shims that no reader needs.
- **Files expected to change:** a deprecation ledger doc; removal of any now-unreferenced compat shim.
- **Verification:** State 1 metric (§16) = 1 authoritative writer, backend + frontend; every (B) mechanism has an owner/criterion/deadline recorded; no orphaned compat shim remains.
- **Acceptance:** AC-1, AC-15, §16 State 1 exit; State 2 ledger seeded.
- **Dependency:** T-F.2a, T-F.2b.
- **Rollback:** documentation + dead-shim removal; flag OFF still restores old behavior.
- **Risk:** low-medium — mis-recording a deadline. Mitigated by the T-Z.2 closure review re-checking the ledger.
- **Completion report (rule 8):** required.

---

## Group Z — Closure

**T-Z.1 — Full regression, security review, State 1 verification** · (be+fe) · deps: all above · realizes: `requirements.md` §15, §16, AC-SEC-1..5, §20; `design.md` §15, §17
- **Purpose:** Prove the phase is done to its DoD — no regressions, security negatives all pass, extensibility proven.
- **Do:** Full backend + frontend regression; the five explicit negative security tests (AC-SEC-1..5); resolver purity + no-second-catalog architectural regression tests; the §20 extensibility proof re-run; State 1 metric confirmed.
- **Files expected to change:** none (verification), plus any test gaps found.
- **Verification:** all suites green; AC-SEC-1..5 pass; State 1 exit metric = 1 authoritative writer.
- **Acceptance:** AC-8, AC-13/14, AC-SEC-1..5, AC-15, §20.
- **Dependency:** all.
- **Rollback:** n/a (verification).
- **Risk:** medium — a late-surfacing regression. This task exists to surface it before closure.

**T-Z.2 — Closure notes, ADR statuses, flag-removal criteria (State 2), traceability** · (doc) · deps: T-Z.1 · realizes: `requirements.md` §16 State 2, §19; `design.md` §14, ADR-R5-04
- **Purpose:** Record closure the way R3B/R4 did — what shipped, ADR statuses, State 2 flag-removal criteria, deferred items.
- **Do:** Write `CLOSURE-NOTES.md`: what shipped, ADR-R5-01..10 statuses, the State 2 flag-removal exit criteria + each compatibility reader's owner/criterion/deadline, deferred items (cascade-with-confirmation ADR-R5-06, quota future-direction §18.1, cross-tenant catalog UI N-7), and the §20 proof result.
- **Files expected to change:** new `CLOSURE-NOTES.md` under the spec dir.
- **Verification:** every ADR has a status; every FR-G1-(B) mechanism has an owner/criterion/deadline; State 2 criteria recorded.
- **Acceptance:** §16 State 2 defined, §19 DoD closure items.
- **Dependency:** T-Z.1.
- **Rollback:** documentation-only.
- **Risk:** low.

---

## Group/Task → Requirement traceability (summary)

*Range/slash notation is intentional and total: `FR-J1-5` covers FR-J1 through FR-J5; `FR-K1..K7` covers all seven; `FR-B2a-d` covers FR-B2a/b/c/d; `FR-A3a-c` covers all three. Every FR/AC/NFR/ADR ID defined in `requirements.md` is covered by at least one task below (verified by cross-document consistency review). The one apparent exception, `FR-G4`, is a reference to *R4's* FR-G4 discipline reused in `requirements.md`'s Definition of Done, not an R5 requirement — R5's own flag-removal criteria live under ADR-R5-04 / §16 State 2 (T-C.1, T-Z.2).*

| Group | Tasks | Primary requirement IDs |
|---|---|---|
| G0 | T-G0.1 | EG-1..4, AC-10 |
| A | T-A.1, T-A.2, T-A.3, T-A.4 | OW-1/OW-4, FR-G1, FR-A3, ADR-R5-03/07, AC-1/11 |
| B | T-B.1a, T-B.1b, T-B.1c, T-B.2, T-B.3, T-B.4 | FR-A1/A2, FR-B1/B2, FR-F4, FR-J2, FR-K1..K7, FR-E1, ADR-R5-07, AC-4/6/13/19 |
| C | T-C.1, T-C.2, T-C.2b, T-C.3, T-C.4a, T-C.4b, T-C.4c, T-C.4d, T-C.5 | ADR-R5-04, FR-A3a-c, FR-C1..C4, FR-D1, FR-E1/E2/E4, FR-H1/H4, NFR-3/5/8, §16a, AC-3/5/6/20, AC-SEC-1/5 — T-C.2 amended migration-aware (3-tier `source`), T-C.2b added (subscription reconciliation/backfill, separately reviewed) per T-A.2 finding |
| D | T-D.1, T-D.2a, T-D.2b, T-D.3, T-D.4, T-D.5a, T-D.5b, T-D.5c | FR-F2/F3/F5, FR-B3, FR-J1-5, FR-B2a-d/B4, FR-I1-6, FR-H2, NFR-6/7, AC-16/17/18, AC-SEC-1..4 — T-D.5 split into 5a (runtime re-sync), 5b (creation-time seeding, `rbac_seed.py`), 5c (parity test) per T-A.2 finding of a second, undocumented entitlement-filtering engine |
| E | T-E.1, T-E.2, T-E.3, T-E.4 | FR-H2/H3, N-6/N-7, §20, BO-3, AC-12/21 |
| F | T-F.0 (⛔ dry-run gate), T-F.1, T-F.2a, T-F.2b, T-F.2c | NFR-2/4, FR-G1/G2/G3, FR-D2, BC-1..4, §16 State 1, AC-1/15 |
| Z | T-Z.1, T-Z.2 | §15/§16/§19/§20, AC-8/13/14/SEC-1..5/15, State 2 |

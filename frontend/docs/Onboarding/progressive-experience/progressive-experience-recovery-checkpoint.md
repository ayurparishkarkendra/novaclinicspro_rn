# Progressive Experience Recovery Checkpoint

Execution date: 2026-07-13

## 1. Purpose

This checkpoint must close before further Progressive Experience implementation. It converts the ignored Kiro spec work into version-controlled governance, corrects unverified conclusions, and defines the gates required before any new onboarding behavior work begins.

## 2. Current Baseline

Frontend recovery worktree:

```text
/Users/ayurparishkar/Projects/NovaClinics/novaclinicspro_rn-progressive-recovery-codex
```

Frontend branch:

```text
feature/progressive-experience-recovery
```

Frontend `origin/dev` base:

```text
45c13b04 Merge branch 'test' into dev
```

Backend recovery worktree:

```text
/Users/ayurparishkar/Projects/NovaClinics/novaclinicspro-api-progressive-recovery
```

Backend branch:

```text
feature/progressive-experience-recovery
```

Backend `origin/dev` base:

```text
9dba7d1 Implement R4 treatment state ownership backend
```

Backend recovery branch current pushed head:

```text
a2a818b Integrate onboarding submission with platform idempotency
```

## 2.1 Worktree Ownership

| Agent | Repository | Worktree | Branch | Purpose |
|---|---|---|---|---|
| Codex | Frontend | `/Users/ayurparishkar/Projects/NovaClinics/novaclinicspro_rn-progressive-recovery-codex` | `feature/progressive-experience-recovery` | Onboarding recovery documentation |
| Codex | Backend | `/Users/ayurparishkar/Projects/NovaClinics/novaclinicspro-api-progressive-recovery` | `feature/progressive-experience-recovery` | Onboarding recovery |

The previous frontend recovery folder at `/Users/ayurparishkar/Projects/NovaClinics/novaclinicspro_rn-progressive-recovery` is now on `merge-progressive-phase0-into-test` at `e8fb29aa` and is treated as owned by another workflow. It was not switched or modified. No other agent worktree was modified. Doctor Module work remains out of scope.

## 3. Branch Decision

- Stale frontend `origin/feature/progressive-experience-phase-1` must not be reused.
- Clean paired frontend/backend recovery branches were created from latest `origin/dev`.
- Both recovery branches were pushed to origin.
- New implementation work must continue to use the same paired branch name:

```text
feature/progressive-experience-recovery
```

Do not merge into `test` or `dev` during R0.

## 4. Recovery Gate Results

| Gate | Status | Evidence | Unresolved Blocker | Owner / Next Action |
|---|---|---|---|---|
| R1 - Canonical Specs in Git | PASS | `git check-ignore -v frontend/docs/Onboarding/progressive-experience/requirements.md` reports the narrow `.gitignore` unignore rule. `git ls-files frontend/docs/Onboarding/progressive-experience` lists the nine canonical docs. `.kiro` remains ignored via `.gitignore:240:.kiro/`. Documentation commit `4cc02477` was pushed to `origin/feature/progressive-experience-recovery`. | None. | Keep canonical docs in `frontend/docs/Onboarding/progressive-experience/`; treat `.kiro` as a workspace mirror only. |
| R2 - Clean Paired Branches | PASS | Frontend branch `feature/progressive-experience-recovery` created from `45c13b04` and pushed. Backend branch `feature/progressive-experience-recovery` created from `9dba7d1` and pushed. Backend worktree is clean. Frontend worktree contains only reviewed docs and `.gitignore` changes for R0. | None for branch creation. | Codex/user: keep branch pair clean; do not reuse `origin/feature/progressive-experience-phase-1`. |
| R3 - Backend Onboarding Idempotency Verification | PASS_IN_DEV | Backend commits `c5082fb`, `f145dbf`, and `a2a818b` implement Platform Foundation request idempotency, migration `20260712_000001`, onboarding step submission integration, and focused tests. Full backend suite: `316 passed`; `git diff --check` passed; `alembic heads` reports `20260712_000001 (head)`. | Local database migration verification is blocked by a pre-existing older migration failure before the idempotency migration: `1d51109d8e2d_add_staff_bank_details_table.py` attempts to drop missing index `idx_tenant_rules_org_rule`. Staging retry verification still required after deployment. | Backend/platform owner: fix or bypass the historical migration-chain issue in an appropriate database environment, then verify `alembic current` at `20260712_000001` and run staging same-key replay checks. |
| R4 - Tenant Resolution Verification | PARTIAL | Frontend sends route tenant and `X-Tenant-ID` fallback in onboarding status and step submit APIs. Backend `/auth/me` response maps `tenant_id` to frontend `tenantId`. Backend route authorization resolves membership from the path `tenant_id`; onboarding service also checks user tenant against route tenant. Backend tests verify duplicate replay, same-key conflict, tenant/step isolation, missing-key compatibility, and cross-tenant rejection in code. | Staging verification was not executed in this thread for provisional tenants, active tenants, multi-clinic users, tenant switching, retry after timeout, duplicate retry, `X-Tenant-ID` mismatch, or cross-tenant rejection. | Backend/frontend owners: run staging checklist below with real credentials and deployed backend. |
| R5 - Hindi Localization Completion Decision | FORMALLY_DEFERRED | Comparison of `onboarding.progressiveExperience` in `en-US.json` and `hi-IN.json` shows every audited key is an `ENGLISH_PLACEHOLDER`. | Hindi localization remains incomplete and must be completed or explicitly accepted again before user-facing Hindi launch. | Product/localization owner: complete Hindi translations in Progressive Experience Phase 1 readiness, or maintain a named deferral owner and acceptance date. |
| R6 - Focused Verification | PARTIAL | Backend verification passes in `.venv-idempotency`: full tests `316 passed`, `git diff --check` passed, `alembic heads` passed. Frontend `git diff --check` passed. The frontend package root is `frontend/`; `packageManager` is Yarn 1; no TypeScript verification script exists in `frontend/package.json`. | Frontend dependencies are missing and `yarn install --frozen-lockfile` was rejected by the approval system, so `npm test -- --runInBand` fails with `jest: command not found`. Backend `alembic upgrade head` fails in historical migration `1d51109d8e2d` before the idempotency migration, so `alembic current` cannot verify the final revision. | Environment owner: allow dependency install or pre-provision `frontend/node_modules`, and fix/provide a migratable local/staging database state. |

## 5. Backend Idempotency Evidence

Conclusion after backend recovery implementation:

```text
VERIFIED_IN_DEV
```

| Concern | Evidence | Status |
|---|---|---|
| Header read | `submit_step_data` accepts optional `Idempotency-Key` via FastAPI `Header`. Missing key preserves legacy behavior; present empty key returns platform validation error. | PASS_IN_DEV |
| Scope | Platform scope includes route tenant, authenticated actor, onboarding step operation, and idempotency key. Request fingerprint includes tenant, step code, and request body. | PASS_IN_DEV |
| Duplicate prevention | `PlatformIdempotencyService` atomically claims a scoped key through `platform_idempotency_records` unique scope/key storage. | PASS_IN_DEV |
| Same-response retry | Completed same-key/same-payload requests replay the stored response body. | PASS_IN_DEV |
| Concurrent duplicate handling | Concurrent same-scope/same-key in-progress requests receive conflict and do not execute duplicate domain side effects in focused tests. | PASS_IN_DEV |
| Tests | `tests/test_platform_idempotency_service.py` and `tests/test_onboarding_idempotency_integration.py` cover first request, replay, conflict, concurrency, tenant/actor/operation/step isolation, retryable failure, missing-key compatibility, and cross-tenant rejection. | PASS_IN_DEV |

Recommended owner:

```text
PLATFORM_FOUNDATION
```

Rationale: the backend contains request correlation, CORS header allowance, event outbox retry infrastructure, notification event uniqueness, and domain-specific idempotency patterns, but no reusable processed-request store or request-level idempotency middleware/service. Onboarding should consume a reusable platform contract rather than creating a permanent onboarding-only mechanism.

## 6. Tenant Resolution Evidence

| Concern | Evidence | Status |
|---|---|---|
| `/auth/me` | `CurrentUserResponse` includes `tenant_id`; handler returns `user.tenant_id` and tenant status/name when present. | VERIFIED_IN_CODE |
| Current tenant/session resolution | Frontend auth entity maps `/auth/me` `tenant_id` to `tenantId`; auth hooks refresh session after demo/sample clinic creation to pick up tenant metadata. | VERIFIED_IN_CODE |
| Onboarding/provisional tenant behavior | Frontend has explicit `X-Tenant-ID` workaround and warning for missing JWT `tenant_id`; backend path-tenant dependency does not rely on the header and requires tenant membership unless org-admin bypass applies. | VERIFIED_IN_CODE; NOT_EXECUTED_IN_STAGING |
| Live tenant behavior | Code supports tenant ID in `/auth/me`, route tenant IDs, and path-tenant membership resolution. | VERIFIED_IN_CODE; NOT_EXECUTED_IN_STAGING |
| `X-Tenant-ID` compatibility | Frontend sends header, but backend onboarding route does not directly read it in the route signature inspected; backend uses path tenant. | VERIFIED_IN_CODE_AS_IGNORED_BY_ONBOARDING; NOT_EXECUTED_IN_STAGING |
| Tenant switching | Frontend auth maps `owned_clinics` and onboarding calls accept an explicit `tenantId`; end-to-end selected/effective tenant switching was not executed. | VERIFIED_IN_CODE_PARTIAL; NOT_EXECUTED_IN_STAGING |
| Cross-tenant submission safety | `OnboardingService.submit_step` rejects non-org-admin users when `user_context.tenant_id != tenant_id`. | VERIFIED_IN_CODE |
| Multi-tenant ownership | Frontend auth maps `owned_clinics`, `hasMultipleClinics`, and `getPrimaryClinic`; selected/effective tenant switching was not executed end-to-end. | VERIFIED_IN_CODE_PARTIAL; NOT_EXECUTED_IN_STAGING |

### Tenant Verification Matrix

| Case | Code evidence | Staging evidence | Status |
|---|---|---|---|
| Onboarding tenant | `/auth/me` maps `tenant_id`; onboarding status/submit calls use explicit path `tenantId`; backend path-tenant dependency checks membership. | Not executed. | VERIFIED_IN_CODE; NOT_EXECUTED |
| Active tenant | Same path-tenant membership and `/auth/me` tenant mapping support active tenants. | Not executed. | VERIFIED_IN_CODE; NOT_EXECUTED |
| Multi-clinic user | Frontend maps `owned_clinics`; helper functions identify multiple clinics and primary clinic. | Not executed. | VERIFIED_IN_CODE_PARTIAL; NOT_EXECUTED |
| Tenant switching | Onboarding APIs take explicit `tenantId`; query/cache behavior was not exercised. | Not executed. | VERIFIED_IN_CODE_PARTIAL; NOT_EXECUTED |
| Retry after timeout | Platform idempotency allows same-key/same-payload retry after `FAILED_RETRYABLE`; covered by backend unit tests. | Not executed. | VERIFIED_IN_CODE; NOT_EXECUTED |
| Duplicate retry | Onboarding integration test verifies same key and same payload replays without a second domain call. | Not executed. | VERIFIED_IN_CODE; NOT_EXECUTED |
| `X-Tenant-ID` mismatch | Backend onboarding route ignores `X-Tenant-ID` and uses path tenant plus authenticated membership context. | Not executed. | VERIFIED_IN_CODE; NOT_EXECUTED |
| Cross-tenant request rejection | `OnboardingService.submit_step` rejects non-org-admin mismatched tenant; integration test covers rejection. | Not executed. | VERIFIED_IN_CODE; NOT_EXECUTED |

### Staging Checklist

1. Provisional onboarding tenant: create/sign in, verify `/auth/me` has expected `tenant_id` or documented fallback behavior.
2. Active tenant: verify `/auth/me` returns active tenant and onboarding/dashboard routes use it.
3. Multi-tenant user: verify selected/effective tenant does not leak prior tenant onboarding status.
4. Tenant switch: switch tenants and verify onboarding/status/query cache isolation.
5. Onboarding step retry: submit same step twice with same `Idempotency-Key` after backend implementation, verify one side effect and same response.
6. Cross-tenant rejection: authenticated Tenant A user attempts Tenant B onboarding route/header, verify rejection unless org-admin.
7. Expired or invalid tenant membership: deactivate membership, refresh token/session, verify onboarding route rejection.
8. `X-Tenant-ID` disagreement: send URL Tenant A with header Tenant B and verify backend behavior is explicit and documented.

## 7. Hindi Localization Evidence

Outcome:

```text
FORMALLY_DEFERRED
```

Reason: all 77 audited `onboarding.progressiveExperience` leaf keys in `hi-IN.json` currently equal the English value. This is not a small translation remainder, so translation quality cannot be guaranteed inside this recovery verification task. The status is an explicit formal deferral, not an ambiguous pass.

Owner: Product/localization owner.

Target phase: Progressive Experience Phase 1 readiness gate, before any user-facing Hindi launch.

Acceptance criteria:

- every `onboarding.progressiveExperience` key in `hi-IN.json` is translated into Hindi;
- interpolation variables such as `{{completed}}`, `{{total}}`, and `{{durationDays}}` are preserved;
- JSON validation passes;
- localization tests or a key-diff script reports no `ENGLISH_PLACEHOLDER` values for Progressive Experience.

Sample comparison evidence:

| Key | English | Current Hindi | Status |
|---|---|---|---|
| `routes.prepareClinic` | Prepare Your Clinic | Prepare Your Clinic | ENGLISH_PLACEHOLDER |
| `dashboard.finishPreparingClinic` | Finish Preparing Your Clinic | Finish Preparing Your Clinic | ENGLISH_PLACEHOLDER |
| `choice.sampleClinicReadyTitle` | Sample Clinic Ready | Sample Clinic Ready | ENGLISH_PLACEHOLDER |
| `choice.prepareMyClinic` | Prepare My Clinic | Prepare My Clinic | ENGLISH_PLACEHOLDER |
| `statusBanner.commercialTrial` | Commercial Trial | Commercial Trial | ENGLISH_PLACEHOLDER |
| `flow.subscriptionDescription` | Review subscription options. Your commercial trial starts after your clinic is Ready to Start. | Review subscription options. Your commercial trial starts after your clinic is Ready to Start. | ENGLISH_PLACEHOLDER |
| `stepLabels.readyToStart` | Ready to Start | Ready to Start | ENGLISH_PLACEHOLDER |
| `readyToStart.confirmAccuracy` | I confirm that all information is accurate and I am ready to start accepting patients | I confirm that all information is accurate and I am ready to start accepting patients | ENGLISH_PLACEHOLDER |

Full script result: `total=77`, `englishPlaceholders=77`, `missing=0`.

## 8. Verification Results

| Area | Command | Result | Classification |
|---|---|---|---|
| Frontend | `git diff --check` | Passed with no output. | PASS |
| Frontend | `yarn install --frozen-lockfile` | Not run: approval system rejected the dependency-install escalation request. | ENVIRONMENT_BLOCKER |
| Frontend | `npm test -- --runInBand` | Failed: `jest: command not found` because `frontend/node_modules` is missing. | ENVIRONMENT_FAILURE |
| Frontend | TypeScript verification discovery | `frontend/package.json` has no `typecheck` or `tsc` script; no command was invented. | NOT_AVAILABLE |
| Backend | `git diff --check` | Passed with no output. | PASS |
| Backend | `.venv-idempotency/bin/pytest -q` | `316 passed`. | PASS |
| Backend | `.venv-idempotency/bin/alembic heads` | `20260712_000001 (head)`. | PASS |
| Backend | `createdb novaclinics_test` | Succeeded; created only the local development database requested for verification. | PASS |
| Backend | `.venv-idempotency/bin/alembic upgrade head` | Failed before idempotency migration in historical migration `1d51109d8e2d_add_staff_bank_details_table.py`: missing index `idx_tenant_rules_org_rule`. | MIGRATION_CHAIN_BLOCKER |
| Backend | `.venv-idempotency/bin/alembic current` after failed upgrade | Connected successfully but reported no current revision because the upgrade failed before a revision was recorded. | BLOCKED |

Backend product verification now claims the focused and full pytest results above. Frontend product tests are still not claimed as passing.

## 8.1 Backend Recovery Commits

| Commit | Message | Scope |
|---|---|---|
| `c5082fb` | `Define reusable request idempotency architecture` | Backend ADR for platform ownership and replay contract. |
| `f145dbf` | `Implement platform request idempotency foundation` | Platform service, SQLAlchemy model/repository/dependency, migration `20260712_000001`, Alembic model metadata. |
| `a2a818b` | `Integrate onboarding submission with platform idempotency` | Onboarding step submission consumer and focused idempotency/onboarding tests. |

## 9. Go / No-Go Decision

```text
Recovery Checkpoint: NO-GO
```

The checkpoint remains NO-GO because mandatory recovery validation is not fully closed: frontend dependency/test tooling could not be restored, the local database migration chain fails before reaching the idempotency migration, tenant-resolution/staging replay checks were not executed, and Hindi localization remains formally deferred rather than complete.

## 10. Minimum Remaining Actions For GO

1. Restore frontend dependencies in the dedicated recovery worktree and rerun `npm test -- --runInBand`.
2. Resolve or provide an appropriate database state for historical migration `1d51109d8e2d_add_staff_bank_details_table.py`, then rerun `alembic upgrade head` and verify `alembic current` reaches `20260712_000001`.
3. Verify tenant resolution and onboarding same-key replay in staging using the checklist above.
4. Complete Hindi Progressive Experience translations or maintain a named, approved deferral before any user-facing Hindi launch.
5. Update this checkpoint to PASS for all mandatory gates before starting Progressive Experience Phase 1.

## 11. Next Authorized Work

Progressive Experience Phase 1 is not authorized.

No Doctor Module changes are authorized.

## 12. Final Verification Update - 2026-07-13

This section supersedes earlier interim environment findings in this checkpoint.

### Database Naming

Backend idempotency persistence now complies with the Nova table naming rule:

- table: `tenant_idempotency_records`;
- unique constraint: `uq_tenant_idempotency_scope_key`;
- check constraint: `ck_tenant_idempotency_status`;
- indexes: `idx_tenant_idempotency_lookup`, `idx_tenant_idempotency_expires_at`;
- migration: unpublished revision `20260712_000001` was updated directly because backend commit `a2a818b` is contained only in `origin/feature/progressive-experience-recovery`, not `test` or `dev`.

### Migration Chain

The approved historical migration repair in `1d51109d8e2d_add_staff_bank_details_table.py` adds SQLAlchemy inspection guards for fresh-build-only legacy artifacts:

- `tenant_appointment_rules` table/index cleanup is skipped when the legacy table is absent;
- `tenant_inventory_alerts` cleanup is skipped when the legacy table is absent.

Fresh local rebuild still does not reach head. After dropping and recreating only the confirmed local `novaclinics_test` database, `alembic upgrade head` now fails later in the same historical revision on absent `tenant_inventory_batches`:

```text
relation "tenant_inventory_batches" does not exist
```

No staging, production, Supabase, or shared database was modified.

### Backend Verification

| Command | Result |
|---|---|
| `git diff --check` | PASS |
| `.venv-idempotency/bin/pytest -q tests/test_platform_idempotency_service.py tests/test_onboarding_idempotency_integration.py` | `12 passed` |
| `.venv-idempotency/bin/pytest -q` | `316 passed, 18 warnings` |
| `.venv-idempotency/bin/alembic heads` | `20260712_000001 (head)` |
| `.venv-idempotency/bin/alembic upgrade head` against fresh local `novaclinics_test` | FAILS in historical revision `1d51109d8e2d` on absent `tenant_inventory_batches` |
| `.venv-idempotency/bin/alembic current` | NOT VERIFIED at head because fresh upgrade is blocked before `20260712_000001` |

### Frontend Verification

| Command | Result |
|---|---|
| `yarn install --frozen-lockfile` | PASS |
| `git diff --check` | PASS |
| `yarn test --runInBand` | FAIL: 8 failed suites, 65 passed suites; 21 failed tests, 584 passed tests |
| `yarn test --runInBand tests/onboarding` | FAIL: 2 failed suites, 8 passed suites; 1 failed test, 64 passed tests; Jest open-handle hang stopped after failure summary |
| `./node_modules/.bin/tsc --noEmit` | FAIL: existing app-wide TypeScript errors, including onboarding demo-status and payment setup type errors |

Frontend failure classification: pre-existing verification debt. The current recovery edits touched only Hindi localization in frontend code and canonical docs, not the failing doctor, therapist, staff dashboard, or onboarding component/test logic.

### Tenant and Replay Matrix

| Case | Automated/local evidence | Staging evidence | Status |
|---|---|---|---|
| Authorized onboarding tenant | Onboarding integration tests submit with matching path tenant and user tenant. | Not executed. | VERIFIED_IN_CODE; NOT_EXECUTED |
| Active tenant | Same path-tenant authorization code path applies. | Not executed. | VERIFIED_IN_CODE; NOT_EXECUTED |
| Same-key replay | Focused tests verify same key and same payload replay without a second domain call. | Not executed. | VERIFIED_IN_CODE; NOT_EXECUTED |
| Same key in different tenants | Focused tests verify tenant-scoped independent execution. | Not executed. | VERIFIED_IN_CODE; NOT_EXECUTED |
| `X-Tenant-ID` mismatch | Backend onboarding route uses path tenant plus membership context, not the header. | Not executed. | VERIFIED_IN_CODE; NOT_EXECUTED |
| Cross-tenant rejection | Focused integration test verifies non-org-admin tenant mismatch rejection. | Not executed. | VERIFIED_IN_CODE; NOT_EXECUTED |
| Different onboarding steps same key | Focused tests verify operation/step scoping. | Not executed. | VERIFIED_IN_CODE; NOT_EXECUTED |
| Multi-clinic membership authorization | Code maps owned clinics and route membership context; no end-to-end selected-tenant staging run. | Not executed. | VERIFIED_IN_CODE_PARTIAL; NOT_EXECUTED |

### Localization

Hindi Progressive Experience localization is complete.

- `onboarding.progressiveExperience` key parity: `77` Hindi keys, `77` English keys.
- Missing keys: none.
- Extra keys: none.
- Interpolation variables preserved: `{{completed}}`, `{{total}}`, `{{durationDays}}`.

### Final Decision

```text
Progressive Experience Recovery Checkpoint: NO-GO
```

Remaining blockers:

1. Fresh local Alembic upgrade is still blocked in historical revision `1d51109d8e2d` before idempotency migration `20260712_000001`.
2. Frontend full and focused onboarding Jest verification fails.
3. Frontend TypeScript verification fails.
4. Staging-only tenant/replay checks remain `NOT_EXECUTED`.

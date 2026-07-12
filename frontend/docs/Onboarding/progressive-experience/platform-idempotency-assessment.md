# Platform Idempotency Assessment

Date: 2026-07-12

## 1. Purpose

This assessment records the Progressive Experience Recovery Checkpoint R0 audit for onboarding backend idempotency, tenant resolution, staging verification, and local tooling readiness. It is documentation only. It does not authorize idempotency implementation or Progressive Experience Phase 1 work.

## 2. Dedicated Worktree Baselines

| Repository | Worktree | Branch | HEAD | Status |
|---|---|---|---|---|
| Frontend | `/Users/ayurparishkar/Projects/NovaClinics/novaclinicspro_rn-progressive-recovery` | `feature/progressive-experience-recovery` | `0079f631` | Clean at audit start |
| Backend | `/Users/ayurparishkar/Projects/NovaClinics/novaclinicspro-api-progressive-recovery` | `feature/progressive-experience-recovery` | `9dba7d1` | Clean at audit start |

The dirty frontend main root at `/Users/ayurparishkar/Projects/NovaClinics/novaclinicspro_rn` was not used for this audit.

## 3. Existing Reusable Platform Capabilities

| Capability | Exists? | File / Symbol | Reusable for onboarding? | Notes |
|---|---|---|---|---|
| Request correlation | Yes | `app/main.py::request_id_middleware`; `app/core/logging.py` | No, observability only | Reads or creates `X-Request-ID` and adds it to logs/response headers. It does not deduplicate requests. |
| CORS allowance for idempotency header | Yes | `app/core/cors.py` | Partial plumbing only | Allows `Idempotency-Key` through CORS, but no backend onboarding handler consumes it. |
| Generic processed-request storage | No | Search found no reusable processed-request table/service | No | There is no platform service that records request key, payload hash, response body, status, and expiry for API replay. |
| Middleware-based request deduplication | No | Search found no idempotency middleware | No | No FastAPI middleware intercepts `Idempotency-Key`. |
| Event outbox retry handling | Yes | `event_outbox` migrations | No | Supports reliable event publishing retries, not synchronous API idempotency. |
| Notification event idempotency | Yes | `org_notification_events` migration | No | Unique event keys prevent duplicate lifecycle notifications only. |
| Domain-specific idempotency checks | Yes | `TenantProvisioningService._create_tenant_user`, `_assign_clinic_owner_role` | Pattern only | These are feature-local read-before-write guards, not a reusable platform contract. |
| Deterministic correlation IDs | Yes | treatment material usage/inventory movement code | Pattern only | Domain-specific material movement idempotency; not appropriate to couple onboarding submissions to this clinical implementation. |
| Row locks / optimistic concurrency | Yes, in clinical domains | treatment sheet lifecycle code and schemas | No | Domain-specific concurrency protection; onboarding step submission does not use it. |
| Unique operation keys | Partial, domain-specific | notification events, inventory movement correlation IDs | No | No reusable tenant/user/operation idempotency key model exists for onboarding. |

Conclusion: the repository has useful patterns, but no reusable platform idempotency capability that onboarding can consume without new foundation work.

## 4. Current Onboarding Submission Flow

| Layer | File / Symbol | Tenant Source | User Source | Transaction Boundary | Side Effects | Duplicate Risk | Retry Behavior | Current Tests |
|---|---|---|---|---|---|---|---|---|
| Frontend request | `frontend/features/onboarding/data/datasources/onboarding.api.ts::submitStepDataApi` | Function `tenantId`; sent in URL and `X-Tenant-ID` | Auth session via axios interceptor | Client-side only | Sends POST with optional `Idempotency-Key` | Frontend can resend same call if network/client retry occurs | Sends same key only when caller provides it | `frontend/tests/onboarding/onboarding.api.test.ts` checks `Idempotency-Key` and `X-Tenant-ID` headers |
| Backend route | `app/api/v1/routers/onboarding_router.py::submit_step_data` | Path `tenant_id`; dependency also receives path tenant | `require_permission("tenant.update")` | Request-scoped DB session dependency | Calls service and builds response | Does not read `Idempotency-Key`; duplicate request reaches service | No same-response replay | No onboarding idempotency tests found |
| Application service | `app/application/services/onboarding_service.py::submit_step` | Route tenant passed from router | `user_context` dict | Shares request DB session via repositories | Calls step handlers and `_mark_step_completed` | Handlers may rerun; unknown steps still mark complete | No key lookup, payload hash check, or cached response | No service idempotency tests found |
| Domain logic | `_handle_clinic_profile`, `_handle_operating_hours`, `_handle_rooms`, etc. | Tenant passed to each handler | Not always used directly | Same request DB session | Updates tenant or delegates entity creation by step | Replaying may repeat updates or entity creation depending on handler | Domain-dependent, not request-idempotent | No request replay tests found |
| Repository | `SQLAlchemySetupProgressRepository` and tenant/entity repositories | Tenant columns and filters | Not a request concept | `flush()` inside repository; commit owned by request/session lifecycle or called by some services | Creates/updates `org_setup_progress` | Read-then-create on progress can race under concurrent duplicate inserts | Unique constraint can reject duplicate row but does not return cached response | No onboarding duplicate-concurrency tests found |
| Database | `org_setup_progress` | `tenant_id` column | None | Database transaction | Unique `(tenant_id, step_code)` row | Protects only the progress row, not all step side effects | Integrity failure path is not handled for idempotent replay | Migration defines unique constraint only |
| Response | `StepSubmissionResponse` | Echoes `step_code`; result has `tenant_id` | None | After service returns | Returns created entities, validation errors, status | Replayed responses are recomputed, not cached | No same-response guarantee | No replay tests found |

## 5. Duplicate and Replay Risk Analysis

| Scenario | Current Behavior | Risk |
|---|---|---|
| Rapid double tap | Frontend guards reduce duplicate dispatch in `SetupWizardFlow`; backend has no idempotency contract. | Medium. Frontend helps, but backend remains unsafe for non-wizard or retried requests. |
| Same request retried after timeout | Same `Idempotency-Key` may be sent, but backend ignores it. | High. Side effects may run again and response may differ. |
| Same key reused with different payload | Backend does not read the key or compare payload hash. | High. No conflict detection. |
| Concurrent duplicate requests | Both requests can enter service. Progress row unique constraint covers only `(tenant_id, step_code)` and no replay response. | High. Possible duplicate side effects or unhandled integrity errors. |
| Browser/app refresh | Status refetch reads `org_setup_progress`; no request replay semantics. | Medium. UI may recover status, but failed retry semantics are not guaranteed. |
| Multiple tabs/devices | Backend has no operation-key locking or processed-request storage. | High. Duplicate submissions can race. |
| Cross-tenant key reuse | No key is read, scoped, or stored. | High. Cannot enforce tenant-scoped key isolation. |
| Same tenant and key used for a different onboarding step | No key is read, scoped, or stored. | High. Cannot detect misuse or return conflict. |

Backend idempotency classification:

```text
IMPLEMENTATION_REQUIRED
```

## 6. Idempotency Ownership Recommendation

Recommended owner:

```text
PLATFORM_FOUNDATION
```

Responsibility: provide reusable synchronous API idempotency for mutating endpoints that need safe retry/replay.

Ownership boundary: platform middleware/service owns header parsing, key validation, payload hash conflict detection, tenant/user/action scoping, locking or unique insertion, response persistence, and expiry. Feature services own operation naming and declare which endpoints require idempotency.

Consumers: onboarding step submission first; later payment-sensitive, provisioning, and other mutating APIs can adopt the same contract.

Minimum contract:

- require `Idempotency-Key` for opted-in operations;
- scope keys by tenant, authenticated user or org user, route/action, and step or operation identifier;
- store payload hash, response status, response body, error state, and expiry;
- return the original response for exact replay;
- reject same-key different-payload requests with conflict;
- serialize concurrent same-key requests or return an in-progress/conflict response;
- never share replay data across tenants.

Migration impact: new platform storage and endpoint integration are required. Onboarding should consume this once available rather than building a parallel "Super Onboarding Engine." If delivery pressure requires onboarding-first implementation, design it as the first platform consumer, not as an onboarding-only permanent mechanism.

## 7. Tenant Resolution Flow

| Area | Evidence | Classification |
|---|---|---|
| Authentication | `/auth/me` response model includes `tenant_id`; frontend `CurrentUserResponse` and `mapCurrentUserToDomain` map it to `tenantId`. | VERIFIED_IN_CODE |
| Person/session | `get_current_user` / Supabase provider extracts `app_metadata.tenant_id`; frontend `refreshSession` refreshes Supabase tokens and then refetches `/auth/me`. | VERIFIED_IN_CODE |
| Tenant selection | Frontend has `ownedClinics` helpers, but no end-to-end tenant switching verification was executed. | REQUIRES_STAGING |
| Tenant resolution | Onboarding URL uses function `tenantId`; backend route dependency resolves membership against path `tenant_id`. | VERIFIED_IN_CODE |
| Authorization | `require_permission("tenant.update")` uses `get_tenant_user_context`; non-members are rejected unless org-admin. Service also rejects non-org-admin when `user_context.tenant_id != tenant_id`. | VERIFIED_IN_CODE |
| Onboarding command | `submitStepDataApi` sends URL tenant, `X-Tenant-ID`, and optional `Idempotency-Key`; backend command uses path tenant. | VERIFIED_IN_CODE |
| Repository filtering | Progress and tenant/entity repositories query or write by `tenant_id`; `org_setup_progress` has tenant and step uniqueness. | VERIFIED_IN_CODE |
| Provisional/onboarding tenants | Provisioning syncs Supabase metadata and frontend refreshes session, but actual staging JWT behavior was not executed. | REQUIRES_STAGING |
| Active tenants | `/auth/me` and route membership code support active tenants, but staging validation was not executed. | REQUIRES_STAGING |
| `X-Tenant-ID` fallback | Frontend sends the header; backend onboarding route does not read it directly. | GAP |
| Multi-tenant membership | Code exposes owned clinic list helpers, but selected/effective tenant behavior was not verified end-to-end. | UNKNOWN |

## 8. Tenant Isolation Risks

| Risk | Current Mitigation | Residual Status |
|---|---|---|
| Route tenant differs from authenticated tenant | Backend membership lookup uses path tenant and service compares path tenant to `user_context.tenant_id` for non-org-admins. | VERIFIED_IN_CODE |
| `X-Tenant-ID` disagrees with route/JWT | Backend route does not consume `X-Tenant-ID`; header is not a verified fallback for onboarding. | GAP |
| Provisional tenant JWT missing `tenant_id` | Frontend refreshes token and sends fallback header, but backend route authorization still depends on path tenant membership. | REQUIRES_STAGING |
| Multiple clinics leak prior tenant cache/status | Query keys include tenant ID for onboarding status, but tenant switching behavior was not executed. | REQUIRES_STAGING |
| Expired or inactive tenant membership | `get_tenant_user_context` rejects inactive user or inactive tenant membership. | VERIFIED_IN_CODE |
| Org-admin cross-tenant setup | Explicit org-admin bypass exists for setup/configuration endpoints. | VERIFIED_IN_CODE, requires policy acceptance |

## 9. Staging Verification Checklist

1. New owner with provisional/onboarding clinic: complete registration, create onboarding tenant, refresh session, verify `/auth/me.tenant_id`, JWT `app_metadata.tenant_id`, and onboarding status access.
2. Existing active clinic: sign in, verify `/auth/me.tenant_id`, active status, and onboarding/dashboard route selection.
3. User with access to multiple clinics: verify owned clinic list, selected clinic, query key isolation, and no stale onboarding status after switching.
4. Tenant switching: switch from Tenant A to Tenant B and verify all onboarding status/submission calls use Tenant B.
5. Onboarding submission retry: after platform idempotency exists, submit the same step twice with the same `Idempotency-Key`; verify one side effect and same response.
6. Deliberate cross-tenant request: authenticate as Tenant A, call Tenant B route and/or header, verify rejection unless org-admin.
7. Expired or invalid tenant membership: deactivate membership, refresh token/session, verify onboarding route rejection.
8. `X-Tenant-ID` disagreement with authenticated context: send URL Tenant A with header Tenant B and verify backend behavior is explicit and documented.

No staging success is claimed by this document.

## 10. Tooling and Test Environment Findings

| Area | Command | Outcome | Classification |
|---|---|---|---|
| Frontend package root | `pwd`, `ls`, `cat package.json` in `frontend/` | Package root confirmed; scripts include `test` and `test:ci`; package manager metadata is Yarn 1. | PASS |
| Frontend dependencies | `test -d node_modules && echo "node_modules present" || echo "node_modules missing"` | `node_modules missing`. | MISSING_DEPENDENCY |
| Frontend lockfiles | `ls package-lock.json yarn.lock pnpm-lock.yaml` | `package-lock.json` and `yarn.lock` exist; `pnpm-lock.yaml` missing. | PASS_WITH_AMBIGUITY |
| Frontend tests | `npm test -- --runInBand` | Failed: `jest: command not found`. | MISSING_DEPENDENCY |
| Frontend typecheck | `npm run typecheck` | Failed: package has no `typecheck` script; npm log write also blocked under home npm logs. | ENVIRONMENT_FAILURE |
| Backend project root | `pwd`, `ls`, `find .. -maxdepth 2 ...` | `pyproject.toml`, `requirements.txt`, and `alembic.ini` confirmed. | PASS |
| Backend virtualenv | `test -d venv ...`; `find . -maxdepth 2 .../bin/*` | No local `venv`, `pytest`, or `alembic` found. | MISSING_DEPENDENCY |
| Backend Alembic | `./venv/bin/alembic heads`; `./venv/bin/alembic current` | Failed: no such file `./venv/bin/alembic`. | MISSING_DEPENDENCY |
| Backend tests | `./venv/bin/pytest -q` | Failed: no such file `./venv/bin/pytest`. | MISSING_DEPENDENCY |

Dependency installation was not attempted because network access is restricted and this task is a verification/documentation checkpoint.

## 11. Recovery Checkpoint Impact

R3 remains blocked because backend onboarding idempotency is not implemented and no reusable platform capability exists yet.

R4 remains partial because important tenant paths are code-verified, but staging still must verify provisional/onboarding tenants, active tenants, tenant switching, and `X-Tenant-ID` disagreement behavior.

R6 remains blocked because local frontend and backend verification tooling is not installed in the dedicated worktrees.

The checkpoint decision remains:

```text
Progressive Experience Recovery Checkpoint: NO-GO
```

## 12. Open Questions

1. Should platform idempotency be implemented as generic middleware, an application service/dependency, or endpoint-level decorator?
2. What retention period should processed request records use for onboarding step submission?
3. Should onboarding require `Idempotency-Key` for all mutating step submissions or accept it as optional during migration?
4. Should `X-Tenant-ID` be removed from onboarding clients once staging confirms JWT metadata reliability, or should the backend formalize it as a supported fallback?
5. What is the canonical tenant-selection UX for owners with multiple clinics?
6. Which package manager should be authoritative for the frontend worktree, given both `package-lock.json` and `yarn.lock` exist but `packageManager` names Yarn 1?

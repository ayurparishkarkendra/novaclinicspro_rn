# TG20 Acceptance Strategy

> **Controlling gates:** acceptance must verify every AUTH-1 through AUTH-4 rule
> and each measurable checkpoint exit in `final-authorization-contracts.md` and
> `tasks.md`; no implementation shortcut may be waived by this strategy.

Status: **Planning**

## Acceptance objective

Accept TG20 only when users can observe and recover authoritative workspace
preparation and enter personalization solely after server authorization, with no
Platform Foundation, readiness, clinical, or commercial boundary violation.

## Quality gates

| Gate | Required evidence |
|---|---|
| Architecture | Product/Platform Foundation references, dependency compliance, no duplicated authority. |
| Domain | Complete state/transition/invariant/property tests including invalid and duplicate transitions. |
| Persistence | PostgreSQL uniqueness, locking/versioning, isolation, migration, downgrade/re-upgrade, no TG20 drift. |
| Backend | Query/retry service, DI, transport, typed errors, idempotency, audit, transaction/rollback tests. |
| Frontend | Real hook/repository/datasource tests, all states, retry, refresh, stale rejection, handoff, tenant switch/logout. |
| Security | No enumeration/tenant escape/client authority/raw leakage; audit metadata safe; protected transitions server-only. |
| Localization | `en-US`/`hi-IN` key and interpolation parity; no visible literals. |
| Theme | Central tokens/icons only; no unauthorized hardcoded visual values. |
| Accessibility | Progress semantics, announcements, focus, action names, disabled/loading behavior, non-color meaning. |
| Multi-clinic | Query/cache/audit/retry isolation and stale outgoing-tenant rejection. |
| Regression | TG18 journey and TG19 Clinic Entry/effective-tenant cleanup remain green. |
| Scope | No TG21/TG22, clinical, financial, operational, CRM, analytics-platform, or integration implementation. |

## Test strategy

### Backend unit/domain

- every valid/invalid transition;
- determinate/indeterminate progress invariants;
- next-action derivation;
- retry attempt/idempotency intent;
- unsupported version/state and safe reason handling.

### Backend repository/PostgreSQL

- one current run per organization/tenant/version;
- organization and tenant isolation;
- optimistic/concurrent transition winner;
- concurrent retry produces one execution request;
- persistence roundtrip and legacy/no-run policy;
- audit failure and provisioning refusal rollback;
- upgrade, current, downgrade, re-upgrade, constraints, indexes, drift.

### Backend application/transport

- authenticated organization/effective-tenant authorization;
- status projection for all states;
- retry replay/conflict/stale/ineligible behavior;
- DI and existing provisioning adapter composition;
- stable safe serialization/error categories;
- no secrets, evidence, raw exception, provider payload, or internal task names.

### Frontend domain/data

- DTO mapping and unknown-field tolerance;
- Version 1 view-model state matrix;
- unsupported contract/state safety;
- onboarding repository/datasource delegation;
- query-key identity and localization/error-token parity.

### Frontend orchestration/presentation

- TG19 handoff to initial query;
- pending/preparing and bounded refresh;
- determinate and indeterminate accessible progress;
- personalization handoff only on authoritative availability and matching tenant;
- retryable failure, one explicit retry, replay, and conflict;
- terminal support state;
- stale response/run/version rejection;
- tenant switch/logout cancellation and cache cleanup;
- offline/network failure remains visibly stale and non-navigable;
- Theme, English/Hindi, focus, live-region, touch-target, and screen-reader checks.

## Architecture verification

Source review must prove:

- presentation has no direct networking;
- domain has no React/FastAPI/SQLAlchemy/provider dependency;
- repository adapter does not commit;
- application service owns UoW/audit/idempotency;
- provisioning is reused behind an adapter;
- Platform Foundation context is resolved server-side;
- cache keys include identity/organization/tenant/version;
- no readiness/clinical/commercial rules exist in TG20.

## Acceptance journeys

| Journey | Expected result |
|---|---|
| New clinic handoff | Effective tenant opens its authoritative preparation run. |
| Existing/associated clinic handoff | Current tenant run loads without duplicate creation. |
| Normal preparation | Pending/preparing updates remain truthful and reach personalization availability. |
| Retry | Retryable failure permits one idempotent retry and recovers or terminates safely. |
| Terminal failure | No retry/navigation; localized safe support action. |
| Tenant switch | Outgoing work/cache is cancelled/cleared; only new tenant projection applies. |
| Unsupported version/state | Fail-safe unavailable state, no personalization action. |
| Stale/network failure | Last data is visibly stale/non-authoritative; user can refresh safely. |

## Requirement matrix

Final acceptance must classify every TG20-FR, TG20-NFR, implemented optional
requirement, and explicit future/out-of-scope item. No requirement may remain
unclassified.

## Release criteria

- All mandatory requirements are `VERIFIED_COMPLETE` or explicitly approved
  `STAGING_ONLY`; no TG20-owned `PARTIAL` or `BLOCKED` remains.
- Focused and regression suites pass.
- Single Alembic head and zero TG20-owned drift.
- Production/staging runtime uses Supabase authority and safe strategy/config.
- Staging verifies actual preparation execution, refresh/retry, multi-clinic,
  stale-session, accessibility, localization, and observability.
- Rollback/forward migration and operational support playbook are verified.
- Worktrees are clean, commits pushed, and acceptance evidence traceable.

## Decision

Final acceptance chooses exactly one:

- `TG20_ACCEPTED`
- `TG20_NOT_ACCEPTED — <precise TG20-owned reason>`

Historical repository debt must be classified separately. Staging-only release
verification may remain after implementation acceptance only when the governing
requirements explicitly permit it.

## References

Product Architecture, Platform Foundation Architecture, Phase 2 roadmap E3/TG20,
TG19 accepted handoff, TG18 Journey Foundation, and ADR-PF-004/005/006/011/015/
017 govern this strategy.

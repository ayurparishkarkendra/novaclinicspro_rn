# TG20 Tasks — Architecture-to-Acceptance Plan

Status: **Planning only; implementation requires separate authorization**

Every checkpoint is independently reviewable and must stop on an undocumented
product, architecture, security, persistence, or provisioning dependency.

## Checkpoint 0 — Constitutional and reuse preflight

- [ ] Confirm Product Architecture, Platform Foundation, Phase 2 E3/TG20, TG19
  handoff, TG18 Journey contract, and relevant ADRs remain current.
- [ ] Audit existing tenant provisioning, onboarding status/progress, repository,
  query key, component, navigation, localization, and cleanup seams.
- [ ] Prove why tenant/application/onboarding status cannot represent the Version
  1 preparation lifecycle without overload.
- [ ] Freeze exact allowed/prohibited files and migration boundary.
- [ ] Resolve initialization policy for accepted TG19/legacy tenants with no run.

Verification: signed reuse matrix, source citations, zero open constitutional
decision. Stop if authoritative state or provisioning evidence cannot be supplied.

## Checkpoint 1 — Domain and persistence foundation

- [ ] Implement Version 1 aggregate/value objects/state transitions and typed
  failures in the onboarding/Progressive Experience domain.
- [ ] Add `IWorkspacePreparationRepository` and SQLAlchemy adapter.
- [ ] Add the approved additive model/migration, uniqueness, optimistic locking,
  indexes, and safe downgrade.
- [ ] Register repository in existing UoW.
- [ ] Add aggregate, repository, isolation, concurrency, legacy/no-run, migration,
  downgrade/re-upgrade tests.

Verification: Ruff, compileall, focused pytest, single Alembic head, isolated
PostgreSQL upgrade/current/downgrade/re-upgrade, no unrelated drift.

## Checkpoint 2 — Backend query and execution-evidence composition

- [ ] Implement `WorkspacePreparationQueryService`.
- [ ] Implement the adapter from existing provisioning evidence to safe aggregate
  transitions without duplicating provisioning.
- [ ] Compose Platform Foundation organization/effective-tenant authorization.
- [ ] Add safe query projection and typed error mapping.
- [ ] Add status transport through existing onboarding router/DI patterns.
- [ ] Test every state, unknown version/state, not-found policy, isolation, and no
  sensitive leakage.

Verification: service/contract/transport tests plus existing provisioning and
TG19 regressions.

## Checkpoint 3 — Retry command

- [ ] Implement `WorkspacePreparationRetryService`.
- [ ] Reuse organization idempotency, organization audit, provisioning adapter,
  repository lock/version, and UoW.
- [ ] Add retry transport and `Idempotency-Key` contract.
- [ ] Test replay, conflicting key, concurrent retry, stale run, ineligible state,
  audit failure rollback, execution refusal, and tenant isolation.

Verification: focused unit/integration/PostgreSQL tests; no duplicate execution.

## Checkpoint 4 — Frontend domain and data integration

- [ ] Add domain projection/view-model mapping and safe error tokens.
- [ ] Extend existing onboarding repository interface/implementation, datasource,
  DTO mapping, and query keys.
- [ ] Add `en-US`/`hi-IN` keys with interpolation parity.
- [ ] Test DTO/domain mapping, unsupported states/versions, repository delegation,
  and localization parity.

Verification: focused Jest, ESLint, scoped TypeScript; no new API client/store.

## Checkpoint 5 — Presentation and orchestration

- [ ] Implement the Workspace Preparation surface and focused orchestration hook.
- [ ] Reuse progress, notice, loading, error, button, Journey Card, Theme, icon,
  navigation, auth, React Query, and tenant-cleanup infrastructure.
- [ ] Implement bounded refresh, explicit retry, stale-response rejection,
  tenant-switch/logout cleanup, effective-tenant refetch, and authorized handoff.
- [ ] Preserve accessible progress/live/focus/loading semantics.
- [ ] Test real orchestration, not a mocked orchestration hook.

Verification: state matrix, refresh/retry, stale response, multi-clinic switch,
navigation, Theme, localization, and accessibility tests.

## Checkpoint 6 — Integrated verification

- [ ] Run complete TG20 backend/frontend suites and TG18/TG19 regression suites.
- [ ] Verify query/retry against isolated PostgreSQL and configured Supabase
  integration boundary without alternate runtime authority.
- [ ] Verify no TG21/TG22, clinical, commercial, billing, inventory, CRM, reports,
  or integration scope entered implementation.
- [ ] Verify analytics/audit safe metadata and no secrets/evidence leakage.
- [ ] Run Ruff, compileall, ESLint, scoped TypeScript, Alembic, and diff checks.

## Checkpoint 7 — Product acceptance

- [ ] Classify every TG20 requirement as `VERIFIED_COMPLETE`, `PARTIAL`,
  `BLOCKED`, `OUT_OF_SCOPE`, or `STAGING_ONLY`.
- [ ] Execute journeys: TG19 handoff, pending, preparing, determinate/indeterminate
  progress, success/handoff, retry/replay, terminal support, stale state, tenant
  switch, logout, unsupported version/state.
- [ ] Complete security, localization, accessibility, multi-clinic, Theme,
  migration, and staging gates.
- [ ] Record remaining historical debt separately.

Acceptance result: exactly `TG20_ACCEPTED` or `TG20_NOT_ACCEPTED` with precise
owned blockers. Acceptance does not automatically authorize TG21.

## Proposed implementation groups

| Group | Scope | Depends on |
|---|---|---|
| TG20.0 | Reuse/source audit and exact boundary | Planning package |
| TG20.1 | Domain, repository, persistence | TG20.0 |
| TG20.2 | Query service, provisioning evidence adapter, read transport | TG20.1 |
| TG20.3 | Retry service/transport | TG20.2 |
| TG20.4 | Frontend domain/data | TG20.2 |
| TG20.5 | Frontend presentation/orchestration | TG20.3, TG20.4 |
| TG20.6 | Integration, migration, regression, non-functional verification | TG20.5 |
| TG20.7 | Final acceptance | TG20.6 |

## Explicit exclusions

No task authorizes clinical sequences, Doctor Module, Clinical Workspace,
Appointments, Patients, Billing, Inventory, CRM, Reports, Integrations, TG21,
TG22, commercial behavior, or Platform Foundation redesign.

## References

All tasks consume Product Architecture, Platform Foundation Architecture, Phase
2 E3/TG20, TG19 acceptance/readiness, TG18 contracts, and ADR-PF-004/005/006/011/
015/017.

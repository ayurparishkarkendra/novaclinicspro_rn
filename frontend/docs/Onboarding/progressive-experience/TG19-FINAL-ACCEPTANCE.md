# TG19 Final Acceptance

Date: 2026-07-21

Branch: `feature/progressive-experience-recovery`

Decision: **TG19_NOT_ACCEPTED**

## 1. Executive Decision

TG19 has a complete and well-tested backend Platform Foundation and Clinic Entry
transport, plus accessible localized entry-path presentation. It does not yet
deliver the approved Epic 2 Version 1 user journey end to end.

The controlling blockers are:

1. frontend Clinic Entry orchestration required by `E2-IMPLEMENTATION-BOUNDARY.md`
   checkpoint 3 was never implemented;
2. the New Clinic and Bring Your Clinic cards have no path-specific input,
   verification, mutation, retry, session-refresh, effective-tenant validation,
   cleanup, or authoritative navigation handoff;
3. the TG19.1 verification-strategy resolver is defined but not consumed by an
   operational dependency/transport composition, so `AUTOMATIC`, contact
   `DISABLED`, ownership `AUTO_APPROVE`, and ownership `DISABLED` are not
   reachable through the shipped Clinic Entry flow.

These are implementation checkpoints, not staging-only checks and not accepted
baseline debt. Final acceptance therefore cannot be granted. This audit does not
authorize their implementation and does not begin TG20.

## 2. Requirement Traceability Matrix

Status totals: **9 `VERIFIED_COMPLETE`, 14 `PARTIAL`, 4 `BLOCKED`, 1
`OUT_OF_SCOPE`, 0 `STAGING_ONLY`** (28 classified requirements).

| Requirement | Design / ADR | Task / checkpoint | Implementation and focused evidence | Status |
|---|---|---|---|---|
| E2-FR1 Path presentation | E2 domain design: path selection | TG19 CP2 | `ChoiceScreen.tsx`, `build-clinic-entry-view-model.usecase.ts`; 8 frontend tests | PARTIAL |
| E2-FR2 New-clinic entry | E2 operational contract; ADR-PF-007/008/009 | Backend Clinic Entry; frontend orchestration | Backend `clinic_entry_service.py`/router tests pass; no frontend form or command | BLOCKED |
| E2-FR3 Bring Your Clinic | E2 Bring Your Clinic contract; ADR-PF-003/013 | Ownership transport; frontend orchestration | Backend ownership transport passes; no frontend flow | BLOCKED |
| E2-FR4 Identity/contact handoff | ADR-PF-007/008/009/018 | Identity/contact persistence and TG19.1 | Persistence and exact-match tests pass; no UI collection/handoff | PARTIAL |
| E2-FR5 Effective tenant | ADR-PF-011 | PF-FINAL-1/2 | Backend context/selection tests pass; frontend does not consume it | PARTIAL |
| E2-FR6 Session handoff | ADR-PF-011 | PF-FINAL-2; frontend orchestration | Backend refresh metadata exists; frontend refresh/recovery absent | PARTIAL |
| E2-FR7 Duplicate prevention | ADR-PF-005/007 | Identity persistence and Clinic Entry | PostgreSQL uniqueness, idempotency, concurrency, replay tests | VERIFIED_COMPLETE |
| E2-FR8 Failure/recovery | E2 typed-error contract | Backend transport; frontend orchestration | Typed backend failures pass; no path-specific pending/retry UI | PARTIAL |
| E2-FR9 Navigation/handoff | E2 domain design navigation | Frontend orchestration | Choice cards do not initiate either path or authoritative handoff | BLOCKED |
| E2-FR10 Multi-clinic isolation | ADR-PF-004/011 | PF-FINAL-1/2/5 | Backend isolation passes; frontend switch invalidation/cleanup absent | PARTIAL |
| NFR Central Theme | E2 cross-cutting principles | TG19 CP2 | `ChoiceScreen.tsx` uses `useClinicTheme`; focused ESLint passes | VERIFIED_COMPLETE |
| NFR Localization First | E2 cross-cutting principles | TG19 CP2 | `en-US.json`/`hi-IN.json` parity for presentation; tests pass | VERIFIED_COMPLETE |
| NFR Accessibility | E2 accessibility contract | TG19 CP2 and future orchestration | Radio semantics/live region exist; form, error-focus, and pending flow absent | PARTIAL |
| NFR Clean Architecture | E2 repository boundary | TG19 CP1/2 and frontend orchestration | Presentation has no direct Axios call; required repository orchestration absent | PARTIAL |
| NFR Reuse-before-create | E2 reuse audit | All TG19 checkpoints | Existing UoW, repositories, auth, navigation, theme, audit reused | VERIFIED_COMPLETE |
| NFR Multi-clinic compatibility | ADR-PF-004/011 | PF-FINAL-1/2/5 | Backend complete; no frontend selection/switch handoff | PARTIAL |
| NFR Progressive Experience consistency | Phase 2 roadmap/E2 design | TG19 | Backend truth preserved; complete progressive user flow absent | PARTIAL |
| NFR Security | ADR-PF-002–018 | Platform Foundation and TG19.1 | Focused authorization/isolation/redaction/provenance tests pass | VERIFIED_COMPLETE |
| E2-AC1 Approved paths only | E2 requirements | TG19 CP2 | Exactly `new_clinic` and `bring_your_clinic` presented | VERIFIED_COMPLETE |
| E2-AC5 Effective tenant before onboarding | ADR-PF-011 | PF-FINAL-2; frontend orchestration | Backend contract complete; frontend cannot reach/validate handoff | PARTIAL |
| E2-AC6 Retry cannot duplicate/cross tenant | ADR-PF-005/006/007 | Backend checkpoints | PostgreSQL idempotency, uniqueness, rollback, isolation tests | VERIFIED_COMPLETE |
| E2-AC7 Required reuse | E2 reuse/source audits | All checkpoints | Backend/presentation reuse proven; auth-refresh orchestration not consumed | PARTIAL |
| E2-AC8 No direct presentation API | E2 implementation boundary | TG19 CP2 | Source audit finds no direct Axios/fetch in Clinic Entry presentation | VERIFIED_COMPLETE |
| E2-AC9 English/Hindi parity | E2 requirements | TG19 CP2 | Matching Clinic Entry key sets and focused tests | VERIFIED_COMPLETE |
| E2-AC10 Accessible complete flow | E2 requirements | TG19 CP2/frontend orchestration | Choice semantics pass; required forms/errors/pending/navigation absent | PARTIAL |
| E2-AC11 Switch/logout cleanup | ADR-PF-011; local draft contract | Frontend orchestration | Backend context is isolated; frontend draft/cache/mutation cleanup absent | PARTIAL |
| E2-AC13 Workspace-preparation handoff | E2 domain design | Frontend orchestration | No authoritative completion navigation exists | BLOCKED |
| E2-AC14 Excluded clinical/commercial scope | E2 non-goals | All TG19 checkpoints | No Doctor Module, clinical, scheduling, inventory, billing, payment, or TG20 work | OUT_OF_SCOPE |

## 3. Journey Acceptance

| Journey | Result | Evidence |
|---|---|---|
| A. New user creates first organization and clinic | **BLOCKED** | Backend create/provision/associate/contact/idempotency contracts pass, but there is no frontend identity/contact input, verification-strategy invocation, mutation, refresh, or continuation. |
| B. Existing organization creates another clinic | **BLOCKED** | Backend Owner/Admin authorization, duplicate isolation, context, and selection pass; the frontend has no create-another-clinic orchestration or explicit multi-clinic handoff. |
| C. Connect existing Nova clinic | **BLOCKED** | Opaque target, review, system provenance, one-time consumption, and association pass in backend tests; the card cannot issue/status/approve/retry/associate. |
| D. Manual contact-verification fallback | **PARTIAL** | Capability, separation of duties, provenance, Platform Audit, and lifecycle transport pass; no frontend request/status/recovery integration exists. |
| E. Staff boundary | **VERIFIED_COMPLETE** | Strategy code and Clinic Entry routes are isolated from staff invitation/membership/RBAC flows. |

## 4. Frontend Acceptance

Checkpoint 2 presentation is verified: the two path cards are theme-token based,
specialty-agnostic, English/Hindi localized, screen-reader-labelled radio
choices with non-color selection state and a polite summary. No direct Axios or
`fetch` exists in the reviewed presentation/use-case files.

Frontend orchestration is **not implemented**. Repository and datasource
contracts were not extended for Clinic Entry; no orchestration hook exists; no
path-specific form or request state exists; selection does not trigger
navigation or a backend command; auth/session refresh and effective-tenant
validation are absent; draft allowlist/cleanup and tenant-switch cancellation
are absent. Presentation success is therefore not end-to-end acceptance.

## 5. Backend Acceptance

Backend application services, DTOs, schemas, FastAPI routers, dependency wiring,
organization context, effective-tenant selection, provisioning, verified contact
persistence/evidence, ownership target/review, capability assignment/bootstrap,
Platform and organization audit, idempotency, typed errors, and transaction/UoW
boundaries are present and covered by the 159-test TG19 suite.

The backend strategy layer is **partial operationally**. Interfaces, adapters,
strategy classes, configuration validation, lifecycle methods, DI resolver
functions, and focused tests exist. Source search finds no consumer of
`resolve_contact_verification_strategy` or
`resolve_ownership_verification_strategy`; existing manual and ownership routes
still compose their fixed services directly. Consequently the configured
strategies cannot yet obtain decisions for a real Clinic Entry request.

## 6. Verification-strategy Acceptance

| Area | Evidence | Status |
|---|---|---|
| Provider-neutral identity | `IAuthoritativeIdentityProvider` plus infrastructure-only `SupabaseIdentityProvider` | VERIFIED_COMPLETE |
| Confirmed email/mobile translation | Confirmed timestamps required; unconfirmed/ambiguous data fails closed | VERIFIED_COMPLETE |
| Exact normalized contact match/no copying | Focused TG19.1 tests | VERIFIED_COMPLETE |
| Contact `MANUAL` | Existing manual service reused | VERIFIED_COMPLETE |
| Contact `AUTOMATIC`/`DISABLED` lifecycle implementation | Issue/verify/UoW classes and unit tests | PARTIAL |
| Ownership `REQUIRED` | Existing target/review flow and PostgreSQL tests | VERIFIED_COMPLETE |
| Ownership `AUTO_APPROVE`/`DISABLED` | System provenance, no fake approver, Platform Audit classes/tests | PARTIAL |
| Production/staging safeguards | Typed settings reject bypass/ambiguous configuration | VERIFIED_COMPLETE |
| Runtime strategy selection | Resolver exists but is not wired into operational composition | BLOCKED |
| Staff unaffected | No staff dependency or route consumes strategies | VERIFIED_COMPLETE |

## 7. Security Matrix

| Property | Result |
|---|---|
| No public clinic or organization enumeration | VERIFIED_COMPLETE — opaque/non-disclosing target and context tests pass. |
| Tenant and cross-organization isolation | VERIFIED_COMPLETE — PostgreSQL tenant/organization isolation tests pass. |
| No `is_org_admin` verification bypass | VERIFIED_COMPLETE — explicit membership/capability checks tested. |
| No fake verification authority | VERIFIED_COMPLETE — system authority has null human actor and constrained provenance. |
| No evidence/contact/token/fingerprint leakage | VERIFIED_COMPLETE — safe projections and Platform Audit allowlist tests pass. |
| No client-declared verification | VERIFIED_COMPLETE — server evidence is required by Clinic Entry. |
| No production verification bypass | VERIFIED_COMPLETE — startup configuration tests reject prohibited modes. |
| Stale session/tenant rejection | VERIFIED_COMPLETE in backend; frontend recovery is PARTIAL. |
| Immutable audit/provenance | VERIFIED_COMPLETE — repository constraints and rollback tests pass. |

## 8. Migration and Alembic Results

- Isolated PostgreSQL database: `tg19_final_acceptance` (removed after checks).
- Fresh `alembic upgrade head`: passed.
- Heads/current: single `20260721_020000` head and current revision.
- Latest downgrade to `20260721_010000` and re-upgrade: passed.
- All nine guarded TG19 model registrations and migration-focused tests: passed.
- All TG19 PostgreSQL persistence/transaction/concurrency tests: passed.
- `alembic check`: not clean. It stops while sorting metadata because the
  pre-existing `tenant_treatment_material_usage.deleted_by_staff_id` foreign key
  targets unregistered historical `org_staff` metadata.

Per `TG19-ALEMBIC-DRIFT-AUDIT.md` post-correction policy, the `org_staff` issue
is separately owned historical repository debt and no comparison operation
references a TG19 table. It does not convert the missing frontend/runtime
integration into acceptable work, and it is not reported as a clean Alembic
gate.

## 9. Test Evidence

- Backend: `pytest -q tests/test_tg19*.py` with every TG19 PostgreSQL URL set to
  the isolated database — **159 passed**.
- Frontend Clinic Entry presentation: **2 suites, 8 tests passed** using
  `--no-watchman` (the first invocation was blocked by sandboxed Watchman
  LaunchAgent access, not a product failure).
- Focused frontend ESLint for the four TG19 presentation/use-case/test files:
  passed.
- Repository-wide `tsc --noEmit`: failed on established unrelated modules and
  pre-existing onboarding Demo Status types; no error referenced the TG19
  Clinic Entry presentation files.
- Backend focused Ruff and compileall: passed during implementation and
  rechecked for TG19-owned paths at final acceptance.
- `git diff --check`: passed for acceptance documentation.

## 10. Known Baseline Debt

1. Historical `org_staff` Alembic metadata target prevents a literal clean
   `alembic check`; it is governed by the completed drift audit and is not
   TG19-owned.
2. Repository-wide frontend TypeScript failures exist across treatment,
   date-time picker, appointments, billing, bulk upload, episodes, inventory,
   prescriptions, staff, capability tests, and pre-existing Demo Status code.
3. Watchman cannot write its user LaunchAgent in the constrained runner;
   `--no-watchman` provides a deterministic passing focused run.

None of these baseline items is the reason for `TG19_NOT_ACCEPTED`.

## 11. Release and Staging Gates

- Implement and verify the frozen frontend Clinic Entry orchestration checkpoint.
- Operationally compose the approved verification-strategy resolver into the
  existing verification/Clinic Entry boundary without adding a parallel API or
  lifecycle.
- Run end-to-end New Clinic, additional-clinic, Bring Your Clinic, manual
  fallback, automatic contact, multi-clinic selection, session refresh,
  accessibility, localization, and stale-state cleanup tests.
- Perform staging verification with production-safe `AUTOMATIC` contact and
  `REQUIRED` ownership modes.
- Continue to track the historical Alembic and TypeScript debt under their
  separate owners; do not silently waive or fold them into TG19.

## 12. Exact Remaining Work

The remaining TG19 work is bounded by the already frozen
`E2-IMPLEMENTATION-BOUNDARY.md` frontend orchestration checkpoint and the
ADR-PF-017/018 operational DI boundary. It must reuse the existing onboarding
repository/datasource, auth store/hooks, wizard store, navigation, error-token,
theme, and localization architecture. It must not create TG20 behavior, a new
repository/store/API client, a public clinic search, or new product semantics.

TG19 Final Acceptance Decision: **TG19_NOT_ACCEPTED**

## 13. TG19.1 Runtime Verification Composition Evidence — 2026-07-21

The ADR-PF-017/018 runtime-composition gap recorded by this audit is complete.
The existing contact-verification request transport now receives the configured
`IContactVerificationStrategy` through dependency injection, and the existing
ownership-target transport receives the configured
`IOwnershipVerificationStrategy`. Routers contain no configuration or
environment branching. Manual contact request/review and required ownership
review continue to use their existing application services; automatic and
non-production strategies use the same evidence, lifecycle, authorization,
audit, idempotency, and unit-of-work boundaries.

Focused live-route tests prove authoritative verified contact evidence and
approved ownership evidence are returned through the existing transports. The
complete TG19/TG19.1 backend suite passes **161 tests** against an isolated
PostgreSQL database. Ruff, compileall, the single Alembic head/current revision,
and fresh-database migration all pass. `alembic check` continues to stop only at
the separately classified historical `org_staff` metadata target; this
checkpoint changes no model or migration and introduces no TG19-owned drift.

This evidence removes only the runtime strategy-composition blocker. TG19
remains **NOT ACCEPTED** because the frozen frontend Clinic Entry orchestration
checkpoint is still absent. Final acceptance was not rerun, and TG20 remains
unauthorized.

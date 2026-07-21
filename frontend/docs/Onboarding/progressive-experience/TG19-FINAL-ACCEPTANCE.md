# TG19 Final Re-Acceptance

Date: 2026-07-21

Branch: `feature/progressive-experience-recovery`

Decision: **TG19_NOT_ACCEPTED**

> **Post-audit remediation update — 2026-07-21:** The three blockers identified
> by this decision have now been implemented without rerunning acceptance. The
> existing Supabase-authenticated Platform Foundation service is exposed through
> an initial-organization auth transport; the frontend creates that organization
> only for zero-membership context; the real orchestration hook has focused
> automatic, manual-pending, ownership, multi-clinic, session-refresh, retry, and
> navigation tests; and tenant handoff now cancels queries, invalidates cached
> state, removes the outgoing persisted wizard draft, and clears operation state.
> The `TG19_NOT_ACCEPTED` decision remains historical and controlling until a
> separately authorized final re-acceptance audit verifies this evidence.

## Executive decision

TG19.1 runtime verification composition and the frontend Clinic Entry
orchestration checkpoint are present and synchronized. The backend application,
transport, verification, authorization, audit, idempotency, transaction, and
PostgreSQL evidence is complete for an actor who already has an active
organization membership. The frontend now presents localized, theme-based New
Clinic and Bring Your Clinic forms and calls the existing transport through the
existing onboarding repository/data-source boundary.

Final acceptance is nevertheless withheld because the complete Epic 2 Version
1 journeys are not yet proven or operational:

1. Journey A requires a new user to create an organization before creating the
   first clinic. `OrganizationAuthorizationService.create_organization()` exists
   and is unit-tested, but no operational API, dependency composition, or
   frontend flow invokes it. A user with zero organization memberships reaches
   `clinic_entry.organization_required` and cannot proceed.
2. The frontend tests mock `useClinicEntryOrchestration` itself. They prove the
   form presentation and submitted DTO shape, but do not execute contact or
   ownership pending/approval, idempotent retry, effective-tenant selection,
   session refresh, stale-session recovery, logout, or authoritative navigation.
3. ADR-PF-011 and E2-AC11 require tenant-switch request cancellation and
   previous-tenant cache/draft cleanup. The orchestration sets the new tenant and
   invalidates organization context, but does not cancel tenant-sensitive work,
   invalidate tenant/onboarding/journey queries, or remove the previous persisted
   wizard draft before handoff.

The first item requires an approved operational organization-creation boundary;
it is not a narrow acceptance fix. No API or feature was invented during this
audit. TG20 remains unauthorized.

## Requirement traceability matrix

Totals: **18 `VERIFIED_COMPLETE`, 7 `PARTIAL`, 2 `BLOCKED`, 1
`OUT_OF_SCOPE`, 0 `STAGING_ONLY`** (28 classified requirements).

| Requirement | Current evidence | Status |
|---|---|---|
| E2-FR1 Path presentation | Both approved paths, forms, validation, and localized presentation exist. | VERIFIED_COMPLETE |
| E2-FR2 New-clinic entry | Contact verification and create-clinic orchestration exist for a member; zero-membership organization creation has no operational path. | BLOCKED |
| E2-FR3 Bring Your Clinic | Opaque reference status, contact verification, association, and handoff are implemented; frontend lifecycle is not exercised by focused tests. | PARTIAL |
| E2-FR4 Identity/contact handoff | Exact submitted contact and opaque server evidence are passed; no actor-contact copying. | VERIFIED_COMPLETE |
| E2-FR5 Effective tenant | Single-clinic automatic result and explicit multi-clinic selection consume the approved backend contract. | VERIFIED_COMPLETE |
| E2-FR6 Session handoff | Backend metadata projection, session-refresh endpoint, auth refresh, context refetch, and tenant equality gate exist. | VERIFIED_COMPLETE |
| E2-FR7 Duplicate prevention | Organization fingerprint uniqueness, idempotency replay, concurrency, and typed conflicts pass PostgreSQL tests. | VERIFIED_COMPLETE |
| E2-FR8 Failure/recovery | Typed safe errors, pending, retry, and logout UI exist; phase-specific frontend recovery lacks direct orchestration tests. | PARTIAL |
| E2-FR9 Navigation/handoff | Navigation occurs only after refresh and authoritative effective-tenant equality. | VERIFIED_COMPLETE |
| E2-FR10 Multi-clinic isolation | Backend isolation and explicit selection pass; frontend cancellation/cache/persisted-draft cleanup is incomplete. | PARTIAL |
| NFR Central Theme | Touched UI uses Clinic Theme tokens and existing icon/typography/spacing systems. | VERIFIED_COMPLETE |
| NFR Localization First | English/Hindi keys and interpolation shapes match; no new user-visible literal is embedded in the UI. | VERIFIED_COMPLETE |
| NFR Accessibility | Roles, labels, focus-on-error, touch targets, disabled state, and live regions exist; complete flow behavior is not directly tested. | PARTIAL |
| NFR Clean Architecture | Presentation contains no Axios/fetch; existing datasource, repository hooks, auth, wizard store, and navigation are reused. | VERIFIED_COMPLETE |
| NFR Reuse-before-create | No new API client, store, repository layer, verification strategy, or navigation architecture was introduced. | VERIFIED_COMPLETE |
| NFR Multi-clinic compatibility | Specialty-neutral domain and server isolation are complete; previous-tenant frontend cleanup remains incomplete. | PARTIAL |
| NFR Progressive Experience consistency | Workspace handoff targets the existing wizard, but Journey A and cleanup gates prevent complete journey acceptance. | PARTIAL |
| NFR Security | Server authority, non-enumeration, tenant isolation, evidence redaction, immutable audit/provenance, and production fail-closed strategy rules pass. | VERIFIED_COMPLETE |
| E2-AC1 Approved paths only | Exactly New Clinic and Bring Your Clinic are exposed. | VERIFIED_COMPLETE |
| E2-AC5 Effective tenant before onboarding | Refreshed context must equal the intended tenant before navigation. | VERIFIED_COMPLETE |
| E2-AC6 Retry cannot duplicate/cross tenant | Backend idempotency, uniqueness, rollback, and isolation tests pass. | VERIFIED_COMPLETE |
| E2-AC7 Required reuse | Existing onboarding/auth/query/wizard/theme/localization infrastructure is consumed. | VERIFIED_COMPLETE |
| E2-AC8 No direct presentation API | Source inspection confirms presentation delegates to the orchestration hook and repository hooks. | VERIFIED_COMPLETE |
| E2-AC9 English/Hindi parity | Focused catalog-shape test passes. | VERIFIED_COMPLETE |
| E2-AC10 Accessible complete flow | Accessible controls exist, but pending/retry/selection/session navigation is not executed in frontend tests. | PARTIAL |
| E2-AC11 Switch/logout cleanup | Existing logout cleanup is reused; tenant-switch cancellation, broad invalidation, and removal of the prior persisted draft are absent. | BLOCKED |
| E2-AC13 Workspace-preparation handoff | Successful validated tenant context routes to the existing wizard-flow boundary. | VERIFIED_COMPLETE |
| E2-AC14 Excluded clinical/commercial scope | No Doctor Module, clinical workspace, scheduling, inventory, billing, payment, or TG20 behavior was introduced. | OUT_OF_SCOPE |

## Product journey results

| Journey | Result | Evidence / gap |
|---|---|---|
| A — New user, organization, first clinic | **BLOCKED** | Organization creation is not exposed or consumed; zero-membership users cannot reach Clinic Entry authorization. |
| B — Existing organization, additional clinic | **PARTIAL** | Backend and frontend paths exist, including multiple-clinic selection, but prior-tenant cleanup and executable orchestration tests are missing. |
| C — Bring Your Clinic | **PARTIAL** | REQUIRED/AUTO_APPROVE/DISABLED strategy behavior and backend ownership lifecycle pass; the complete requester frontend sequence is not directly exercised. |
| D — Manual verification | **PARTIAL** | Request/review/approve/reject/revoke/expire/consume pass in backend coverage; frontend pending/resume behavior is source-present but untested. |
| E — Automatic verification | **VERIFIED_COMPLETE (backend)** | Exact normalized email/mobile, no contact copying, evidence, audit, idempotency, and rollback pass focused tests and live-route composition tests. |
| F — Staff isolation | **VERIFIED_COMPLETE** | TG19 organization/clinic verification is separate from staff invitation, tenant RBAC, and staff onboarding. |

## Frontend acceptance

The implementation reuses the existing onboarding datasource and React Query
repository, `useAuth`, organization context, wizard store, Expo Router, error
tokens, Clinic Theme, and localization catalogs. It introduces one domain model
and one orchestration hook, with no parallel networking, store, repository, or
navigation architecture. Presentation performs no direct network call.

Source inspection confirms New Clinic and Bring Your Clinic submissions,
pending status polling by user action, stable per-operation idempotency keys,
safe typed errors, multi-clinic selection, backend session-refresh handoff,
Supabase session refresh, context equality validation, retry, logout, and
authoritative wizard navigation. It also confirms that evidence remains only in
component-hook memory for the operation lifecycle.

Frontend acceptance remains **partial** because the focused tests mock the
orchestration hook and because ADR-PF-011 cleanup is incomplete.

## Backend and runtime-composition acceptance

Backend acceptance is **verified complete within an existing organization**.
Clinic Entry routers delegate to application services. Current organization
membership and tenant authorization are server-resolved. Contact and ownership
runtime strategies are injected through the existing dependencies; routers do
not branch on environment or provider. `AUTOMATIC`, `MANUAL`, contact
`DISABLED`, ownership `REQUIRED`, `AUTO_APPROVE`, and test-only `DISABLED`
preserve evidence lifecycle, persistence, audit, idempotency, transaction, and
typed error boundaries. Production/staging configuration fails closed against
bypass-capable modes.

The missing organization-creation transport is outside the existing Clinic
Entry router and prevents complete Journey A acceptance.

## Security acceptance

- No public clinic or organization enumeration: verified.
- No cross-organization or cross-tenant association/selection: verified.
- No production verification bypass or client-declared verification: verified.
- No actor-contact copying: verified.
- Opaque references, contact values, fingerprints, credentials, and raw backend
  exceptions are excluded from user-visible errors and Platform Audit: verified.
- Human and system decision provenance are constrained and immutable: verified.
- Platform and organization audit persistence is append-only: verified.

## PostgreSQL and Alembic acceptance

The isolated database `tg19_final_reacceptance_20260721` was created from the
full migration chain. `alembic heads`, `upgrade head`, and `current` passed with
the single head `20260721_020000`. Downgrade to `20260721_010000`, re-upgrade,
and current passed. All PostgreSQL-backed TG19 tests ran against this database.

`alembic check` still stops on the separately audited historical
`tenant_treatment_material_usage.deleted_by_staff_id` foreign key because
`org_staff` is absent from the metadata registry. No comparison operation
identifies a TG19 table, and no TG19-owned drift was found. This remains
historical schema-metadata debt, not a waiver of the product blockers above.

## Verification evidence

- Backend TG19/TG19.1: **161 passed** against isolated PostgreSQL.
- Frontend Clinic Entry: **2 suites, 8 passed**.
- Focused frontend ESLint: passed.
- Backend compileall: passed.
- Repository-wide frontend TypeScript: failed only in established unrelated
  modules and pre-existing Demo Status code; no TG19 orchestration file appears.
- Repository-wide backend Ruff exposes extensive established baseline debt;
  it is not a clean repository-wide gate and no source was changed by this audit.
- `git diff --check`: required after documentation update.

## Release gates and remaining work

TG19 cannot be released or promoted as Epic 2 complete until:

1. Product Architecture authorizes and implementation exposes the existing
   organization-create/member-owner service through an authenticated,
   transactionally audited operational boundary, and the frontend consumes it
   for zero-membership users.
2. Focused frontend tests execute the real orchestration hook for New Clinic,
   Bring Your Clinic, pending/manual/automatic outcomes, retry without duplicate
   mutation, effective-tenant selection, session refresh/mismatch, logout,
   navigation, accessibility, and localization.
3. Tenant switching cancels tenant-sensitive work, invalidates organization,
   tenant, onboarding, and journey state, and clears or isolates the previous
   persisted wizard draft before navigation.
4. Staging validates production-safe `AUTOMATIC` contact and `REQUIRED`
   ownership modes, manual fallback operations, first/additional clinic,
   Bring Your Clinic, multi-clinic selection, and stale-session recovery.

Historical `org_staff` Alembic metadata drift, repository-wide Ruff debt, and
repository-wide frontend TypeScript debt remain separately owned and must not be
misclassified as TG19 implementation work.

TG19 Final Re-Acceptance Decision: **TG19_NOT_ACCEPTED**

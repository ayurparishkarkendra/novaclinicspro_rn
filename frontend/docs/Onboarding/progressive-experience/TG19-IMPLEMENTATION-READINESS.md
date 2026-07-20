# TG19 Implementation Readiness Review

Date: 2026-07-20

Review type: Documentation-only implementation readiness checkpoint

Epic reviewed: E2 — Clinic Entry and Bring Your Clinic

Task group: TG19 — Clinic Entry and Bring Your Clinic Contract

Decision: **NOT READY**

## 1. Executive Decision

TG19 is **NOT READY** for implementation without architectural uncertainty.

The approved Phase 2 roadmap deliberately makes TG19 a contract-first group and
requires new accepted E2 requirements. Its stop condition requires work to stop
while either the product meaning of Bring Your Clinic or tenant/provisioning
ownership remains undefined. Both remain open in the authoritative documents.

Implementation is blocked until all of the following are accepted:

1. the supported clinic-entry paths and precise product meaning of Bring Your
   Clinic, including explicit non-goals;
2. the identity/contact field contract and authoritative validation ownership;
3. tenant provisioning, association, selection, session-refresh, and recovery
   contracts for new, provisional, existing, and multi-clinic users;
4. duplicate-clinic detection and idempotency behavior;
5. data ownership, storage, privacy, and security classification;
6. new E2 functional/non-functional requirements and acceptance criteria;
7. a clinic-entry application-flow/domain design;
8. an E2-specific source-confirmed reuse audit after those contracts are fixed;
9. an approved backend/frontend file boundary and focused test matrix.

This review authorizes no frontend or backend implementation.

## 2. Authoritative Evidence Reviewed

The following documents were read in the required order:

1. `requirements.md`;
2. `design.md`;
3. `PROGRESSIVE-EXPERIENCE-PHASE2-ROADMAP.md`;
4. `TG18-IMPLEMENTATION-READINESS.md`;
5. `E1-READY-TO-START-REQUIREMENTS.md`;
6. `E1-JOURNEY-DOMAIN-DESIGN.md`;
7. `E1-JOURNEY-VERSIONING.md`;
8. `E1-JOURNEY-CARD-CONTRACT.md`;
9. `E1-REUSE-AUDIT.md`.

The completed TG18 implementation through commit
`66ea54289ee6ee43de4d04876b73653ec002a4b5` was also inspected. TG18 provides a
read-only journey projection and presentation foundation; it does not define or
implement clinic entry, tenant creation/association, or Bring Your Clinic.

## 3. Business Objective

Provide clear, safe clinic-entry paths so an Organization Owner, Organization
Admin, or Clinic Administrator can create a new clinic or use an accepted Bring
Your Clinic path, confirm required identity/contact information, resolve the
effective tenant, and hand off to workspace preparation without duplicate clinic
creation or cross-tenant state.

The roadmap measures success through:

- account-to-clinic-identity completion rate;
- abandonment rate by entry path;
- median time to resolve a tenant and enter workspace preparation;
- duplicate clinic-creation rate.

These outcomes are approved at roadmap level. The behavior needed to measure and
deliver them is not yet an accepted requirements/design contract.

## 4. User Journey

The roadmap-level journey is:

1. The user completes account/application entry.
2. The user chooses a documented clinic-entry path.
3. For a new clinic, the system collects or confirms approved identity/contact
   fields and establishes the authoritative tenant association.
4. For Bring Your Clinic, the system follows a product-approved association or
   import path; no implementation may infer that this means record migration,
   tenant claiming, tenant search, or silent duplicate creation.
5. The system resolves one effective clinic/tenant explicitly.
6. Session and repository state refresh under that tenant.
7. The user enters workspace preparation and later consumes the TG18 journey.

The missing definition in step 4 and ownership uncertainty in steps 3, 5, and 6
prevent an implementation-ready flow.

## 5. Personas

Primary personas from E2:

- Organization Owner;
- Organization Admin;
- Clinic Administrator.

Front Desk, Doctor, and Therapist are not primary TG19 personas. Doctor Module
and clinical workflows are prohibited.

## 6. Requirements Coverage

### Existing requirements that constrain TG19

| Requirement | TG19 relevance | Current disposition |
|---|---|---|
| Req 11 — tenant identity | Requires reliable tenant identity for provisional/live paths and staging verification. | Constraint exists; authoritative new/existing/multi-clinic selection contract is missing. |
| Req 19 — storage security | Requires inspection/classification of locally stored sensitive data. | Security classification and permitted persistence for E2 fields are missing. |
| Req 24 — localization | Requires all new user-visible strings in English and Hindi. | Framework exists; E2 copy/key contract and Hindi review owner are missing. |
| Req 25 — accessibility | Requires accessible controls, disabled states, and touch targets. | General constraint exists; E2 choice/form/error/focus contract is missing. |
| Req 30 — tenant isolation | Requires tenant-scoped state, logout cleanup, and tenant-switch protection. | Existing draft/query patterns exist; effective-clinic selection for multi-clinic owners is unresolved. |

### Missing E2 requirements

New accepted E2 requirements must define:

- every supported clinic-entry path and its eligibility;
- the exact meaning and non-goals of Bring Your Clinic;
- identity/contact fields, required/optional rules, normalization, validation,
  specialty extensibility, and authoritative source;
- create, associate, select, cancel, retry, resume, and failure behavior;
- duplicate detection and idempotency rules;
- tenant/application/user ownership and authorization;
- new, provisional, existing, and multi-clinic state transitions;
- session refresh and effective-tenant handoff;
- loading, empty, validation, conflict, duplicate, stale, partial, unsupported,
  and retry states;
- data classification, permitted local persistence, retention, and cleanup;
- localization, accessibility, analytics intent, and success-metric evidence;
- handoff to workspace preparation without claiming provisioning completion.

No current E1 document can substitute for these product requirements.

## 7. Design References and Missing Design

TG19 is constrained by existing `design.md` sections for Layer Map, Dependency
Rules, Error Handling, Backend Dependencies, tenant verification, Testing
Strategy, Theme Compliance, and Git Delivery Strategy. It also inherits the E1
journey ownership boundary: frontend presentation cannot invent server truth.

A new E2 clinic-entry application-flow design is required. It must define:

- domain vocabulary and state machine for entry path, application, clinic,
  tenant association, effective tenant, provisioning handoff, and duplicate;
- backend/frontend ownership for every transition and validation;
- DTO/domain/presentation mappings;
- repository, query-key, invalidation, cancellation, and session-refresh rules;
- new/provisional/existing/multi-clinic transition matrices;
- duplicate/idempotency and safe retry behavior;
- data/security/storage boundaries;
- navigation and TG18/TG20 handoffs;
- localization and accessibility contracts;
- error taxonomy integration without inventing TG24 architecture;
- exact reuse/extension decisions and test boundaries.

## 8. Existing Implementation Findings

- `ChoiceScreen.tsx` is the active choice surface, but both visible paths call
  `useCreateDemoTenantMutation`; its own comment states direct setup is not
  implemented. It cannot represent accepted new-clinic versus Bring Your Clinic
  semantics today.
- `ChoiceScreen.tsx` reuses application detail, demo creation, auth refresh,
  theme, localization, loading, and error assets, but still contains legacy
  hardcoded copy/styles and fallback behavior that require contract-led cleanup.
- `ClinicProfileScreen.tsx` contains useful identity/contact form behavior and
  draft integration, but it also performs direct Axios calls and includes
  hardcoded user-visible strings. It is a reuse candidate, not an approved E2
  boundary as currently structured.
- Existing onboarding repositories expose application detail, validation,
  demo-tenant creation, setup-wizard, status, submit, and completion operations.
  No accepted Bring Your Clinic operation or contract was found.
- Existing tenant repositories expose organization tenant list/detail/create/
  update/deactivate and current-tenant lookup. Those administrative operations
  are not automatically valid clinic-entry or association APIs.
- TG18 supplies `JourneySurface`, `StepCard`, `ProgressBar`, journey entities,
  pure projection, and `useJourneyFoundation`. These begin only after effective
  tenant resolution and must not be repurposed to create/select a clinic.

## 9. Reuse Audit

### Reuse

| Asset | Required TG19 use |
|---|---|
| Central theme and existing tokens/icons/form primitives | All E2 presentation must use these; no parallel design system or hardcoded visual values. |
| Existing localization framework and `en-US`/`hi-IN` resources | All E2 copy, validation, status, and recovery text; matching interpolation required. |
| Existing application-detail query and centralized `onboardingKeys` | Reuse for accepted application context where contract-compatible. Do not duplicate application fetching. |
| Existing auth/session refresh boundary | Reuse after an authoritative tenant association/selection response. Do not create a second auth state. |
| Existing onboarding and tenant repositories/services/APIs | Reuse only operations proven to match the accepted E2 contract and caller authorization. |
| Existing form and validation primitives | Reuse for approved identity/contact fields. |
| Existing loading/error primitives | Reuse when their semantics, localization, theme, and accessibility fit the accepted E2 states. |
| Existing draft store | Reuse only for its accepted tenant/user-scoped draft responsibility if E2 explicitly permits local persistence. |
| TG18 journey foundation | Reuse after effective tenant handoff; retain journey version, projection, tenant guard, Journey Cards, progress, and edge-state behavior unchanged. |

### Extend

Extensions are provisional until E2 requirements/design approval:

| Asset | Permitted future extension |
|---|---|
| `ChoiceScreen.tsx` | Present only approved entry paths and delegate to repository-backed application actions; local product/provisioning policy is prohibited. |
| `ClinicProfileScreen.tsx` | Extract/reuse approved identity/contact form behavior and remove presentation-to-API violations within an accepted boundary. |
| Application/onboarding DTO and repository boundaries | Extend only for an accepted existing backend contract; use centralized keys and typed mapping. |
| Tenant repository/auth handoff | Extend only if approved ownership and authorization make existing operations suitable for clinic entry. |
| Focused presentation/application orchestration | Add only when no existing hook fits and it composes repositories rather than duplicating them. |

### Do Not Reuse or Create

- Do not use `createDemoTenant` as a hidden implementation of every E2 path.
- Do not reinterpret organization-admin tenant creation as Bring Your Clinic.
- Do not reuse raw `applicationId`, route `tenantId`, or cached tenant data as
  proof of ownership/association without the accepted contract.
- Do not use Wizard Draft, onboarding presentation store, or a new store as
  authoritative tenant/provisioning truth.
- Do not make direct API/Axios calls from `ChoiceScreen`, `ClinicProfileScreen`,
  or any new presentation component.
- Do not duplicate TG18 entities, journey projection, hook, Journey Card,
  ProgressBar, tenant guard, navigation, or localization/theme frameworks.
- Do not create a frontend import/migration engine, tenant-claiming workflow,
  duplicate detector, provisioning state machine, repository, service, API,
  endpoint, or migration without prior Roadmap → Requirements → Design approval.
- Do not reuse Demo Status, Go Live, subscription, payment, scheduling,
  inventory, clinical, or Doctor Module surfaces as E2 implementation.

## 10. Dependencies

### Backend dependencies

The following are unresolved and blocking:

- canonical create/associate/select behavior for every accepted entry path;
- authorization and ownership proof for existing-clinic association;
- authoritative duplicate-detection and idempotency rules;
- tenant provisioning/association result and status contract;
- session/JWT refresh behavior and tenant identity source;
- multi-clinic effective-tenant selection contract;
- identity/contact validation and uniqueness ownership;
- typed errors and safe retry semantics;
- audit/security obligations and data classification.

Backend impact for this review: **none**. Future backend impact is **undecided**;
no API, endpoint, service, model, or migration is authorized.

### Frontend dependencies

Blocking frontend decisions are:

- accepted E2 domain and presentation models;
- exact entry-path eligibility and navigation;
- repository/application orchestration ownership;
- approved reuse/extraction plan for `ChoiceScreen` and `ClinicProfileScreen`;
- effective-tenant/session handoff;
- validation/error/retry states;
- local-persistence permission and cleanup;
- localized copy/key catalog and Hindi review;
- accessibility/focus contract;
- exact file list and focused tests.

Frontend impact for this review: **documentation only**.

## 11. Theme, Localization, Accessibility, and Multi-Clinic

### Theme

- Central theme only; reuse existing tokens, typography, spacing, radii, icons,
  inputs, cards, buttons, and state primitives.
- No hardcoded colors, typography, spacing, radii, or new inline visual system.

### Localization

- No hardcoded user-visible strings.
- Add matching `en-US` and `hi-IN` keys with compatible interpolation.
- Cover path explanations, field labels/help, validation, duplicate/recovery,
  loading/status, and navigation.
- Hindi-literate review ownership is required before release.

### Accessibility

- Choices require clear names, descriptions, selected/disabled/pending state,
  44-by-44 touch targets, and deterministic focus order.
- Forms require programmatic labels/instructions, error association, logical
  keyboard/screen-reader order, and focus movement to the first invalid field.
- Dynamic status/errors require non-color meaning and non-repetitive live-region
  behavior; progress must be textual.
- Back/cancel/retry actions must state their consequences.

### Multi-clinic

- Effective clinic selection must be explicit and authoritative.
- Queries, mutations, drafts, caches, and navigation must retain tenant context.
- Tenant switching must cancel or isolate stale requests and derived TG18 state.
- Existing-clinic association must never expose or mutate another clinic.
- Fields and paths must remain specialty-agnostic; no Ayurveda-specific logic.

## 12. Test Strategy

The accepted E2 plan must include:

### Domain/unit

- path eligibility and state transitions;
- field normalization/validation and specialty-neutral behavior;
- duplicate/unsupported/unknown-state safety;
- effective-tenant and association rules as pure policy where appropriate.

### Repository/service/backend contract

- request/response mapping and typed errors;
- authorization and tenant isolation;
- idempotent create/associate retry and duplicate prevention;
- centralized tenant/application query keys and scoped invalidation;
- session refresh and authoritative tenant result;
- cancellation/stale-response safety during tenant switching.

### Component

- every choice/form/loading/error/duplicate/pending/retry state;
- central theme and existing primitive reuse;
- English/Hindi parity and interpolation;
- labels, descriptions, focus, errors, disabled/pending state, touch targets,
  screen-reader behavior, and non-color-only communication.

### Integration/E2E

- new-clinic, provisional, existing-clinic, and multi-clinic paths;
- rapid repeat action and slow-network duplicate prevention;
- failure/retry/session-refresh and app restart where persistence is approved;
- tenant switch/logout with no cache/draft/journey leakage;
- successful handoff to workspace preparation and TG18 journey;
- Req 11/12/32 staging/device verification remains a release gate.

## 13. Risks

- inventing Bring Your Clinic as migration, import, claim, or duplicate creation;
- unauthorized clinic association or cross-tenant disclosure;
- duplicate tenant/clinic creation under retries or repeated taps;
- conflating application, clinic, tenant, and effective-tenant identities;
- placing provisioning truth or validation policy in presentation;
- persisting sensitive identity/contact data without classification;
- direct API access and duplicated repositories/hooks/stores;
- specialty-specific fields becoming universal requirements;
- stale JWT/cache state handing TG18 the wrong tenant;
- inaccessible path choice, validation, or recovery UX;
- implementing TG20 workspace preparation inside TG19.

## 14. Open Decisions and Blockers

Every item below blocks implementation readiness:

1. What does Bring Your Clinic mean, and what is explicitly excluded?
2. Which entry paths are supported and who is eligible for each?
3. Does an existing clinic already have a Nova tenant, or is association/import
   required? Who proves ownership?
4. Which backend/platform owner creates, associates, selects, and provisions the
   tenant, and which response proves success?
5. How are duplicates detected and idempotently resolved?
6. How is the effective tenant selected for multi-clinic owners?
7. Which identity/contact fields are canonical, who validates them, and which
   may be stored locally?
8. What security/privacy classification, retention, audit, and cleanup applies?
9. What are the state/error/retry/session-refresh contracts?
10. Which existing components, hooks, repositories, services, and APIs fit the
    accepted contract after source confirmation?
11. What exact frontend/backend files and tests are authorized?
12. Who owns Hindi review, accessibility acceptance, and staging verification?

## 15. Implementation Boundary

### Files expected to change now

Only this document:

```text
frontend/docs/Onboarding/progressive-experience/TG19-IMPLEMENTATION-READINESS.md
```

### Provisional future candidate files

No source file is authorized while TG19 is **NOT READY**. After requirements,
design, ownership, security, and reuse gates close, a new readiness decision may
authorize a subset of:

- E2-specific domain entities/use cases and tests;
- `ChoiceScreen.tsx` and its focused tests;
- reusable identity/contact form boundaries derived from
  `ClinicProfileScreen.tsx` and focused tests;
- existing onboarding application DTO/repository/service files only where an
  accepted existing backend contract requires typed extension;
- existing tenant/auth repository/session boundaries only where ownership and
  authorization are accepted;
- `en-US.json` and `hi-IN.json`;
- minimal handoff composition to existing TG18 journey entry.

This is a discovery list, not implementation permission. Exact paths cannot be
fixed safely before the missing E2 contract determines whether backend work is
needed and which existing boundary owns each action.

### Files prohibited from changing

Under this review and until a subsequent READY decision:

- all frontend and backend source and tests;
- APIs, DTOs, schemas, database models, and migrations;
- dependencies, manifests, and lockfiles;
- `requirements.md`, `design.md`, the Phase 2 roadmap, E1 constitutional
  documents, and existing task groups;
- TG18 journey behavior except a later approved handoff;
- TG20 and all later roadmap capabilities;
- Doctor Module, Clinical Workspace, Scheduling, Inventory, Billing, Payment
  Gateway, analytics-platform, R7, main-root, `dev`, and `test` work.

### Documentation updates required before implementation

Separate approved planning work must create E2 requirements, clinic-entry domain
design, tenant/provisioning contract, security decision, tenant/path matrices,
and a source-confirmed E2 reuse audit. This review does not create those files or
change roadmap sequencing.

### Expected focused tests

No source test is required for this documentation-only review. The future
minimum test matrix is defined in §12 and must be converted into exact test files
after the E2 design and implementation boundary are accepted.

## 16. Prerequisites for a READY Decision

TG19 may become READY only when:

- every blocker in §14 has an accepted constitutional resolution;
- new E2 requirements and the application-flow/domain design are approved;
- backend/platform ownership and existing API sufficiency are verified;
- data/security classification is approved;
- the source-confirmed reuse audit records REUSE, EXTEND, and DO NOT REUSE for
  exact assets;
- exact frontend/backend files, behavior, documentation, and focused tests are
  authorized;
- implementation can proceed without inventing product or architecture.

Until then, the only allowed next activity is E2 constitutional planning—not
TG19 implementation.

**TG19 Implementation Status: NOT READY**

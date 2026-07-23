# Progressive Experience Requirements Traceability Matrix

## Governance

This Requirements Traceability Matrix (RTM) is the permanent current-state
implementation governance record for Progressive Experience. `requirements.md`
owns product intent and acceptance criteria, `design.md` and referenced
constitutional documents own design, the Phase 2 roadmap owns Epic destination,
and `tasks.md` owns execution history. This RTM connects those authorities; it
does not create product behavior or authorize a Task Group.

Status has exactly four values:

- `COMPLETE`: every acceptance criterion is supported by implementation and
  verification evidence;
- `PARTIALLY COMPLETE`: at least one criterion is evidenced and at least one
  remains open;
- `NOT STARTED`: no criterion has implementation evidence sufficient to claim
  delivery;
- `SUPERSEDED`: a later accepted contract replaces the original behavior and
  identifies its successor ownership.

Reconciled inventory after TG18–TG22: **11 COMPLETE, 19 PARTIALLY COMPLETE,
3 NOT STARTED, and 1 SUPERSEDED (34 total).** References such as “AC1–AC4” are
the acceptance-criteria numbers in `requirements.md`.

## Requirement → Epic → Task Group

| Requirement | Title | Epic | TG(s) | Design section | Backend owner | Frontend owner | Verification | Status | Remaining work |
|---|---|---|---|---|---|---|---|---|---|
| Req 1 | Service-category alias routing — StepDetailScreen | E4 | TG17; TG21 regression | Design 1.1 and E4 acceptance invariants | Template step-code authority | `StepDetailScreen` redirect map | Alias-routing and TG21 onboarding regressions; AC1–AC4 evidenced | COMPLETE | None |
| Req 2 | Service-category alias routing — SetupWizardFlow | E4 | TG17; TG21 regression | Design 1.2 and E4 frontend boundary | Template step-code authority | `SetupWizardFlow` alias rendering | Wizard routing and TG21 presentation regressions; AC1–AC3 evidenced | COMPLETE | None |
| Req 3 | Delete unused TreatmentsAndTherapiesScreen | E4 | TG17 | Design 1.3 | N/A | Onboarding presentation ownership | File absence plus build/test evidence; AC1–AC2 evidenced | COMPLETE | None |
| Req 4 | Backend template alias audit | E4 | TG17, TG21 | Design 1.1–1.2; E4 Ownership | Template repository and Journey Visibility projection | Alias consumers only | Central alias/template projection tests and source audit evidence | PARTIALLY COMPLETE | Sustain the active-template/release audit and record any newly discovered aliases consistently; the historical inline-comment form of AC3 is not complete evidence by itself. |
| Req 5 | WizardDraftStore schema and persistence | E1 | TG13–TG15; TG18 follow-up | Data Models; E1 domain/versioning/reuse contracts | N/A | Wizard draft store and storage adapter | Store schema, persistence, migration, expiry and integration suites; AC1–AC12 evidenced | COMPLETE | None |
| Req 6 | WizardDraftStore step-screen integration | E1 | TG14 | Architecture layer map; E1 reuse contract | N/A | Step screens, presentation hooks, SetupWizardFlow | Screen integration, restore indicator, hydration, clearing and debounce tests; AC1–AC5 evidenced | COMPLETE | None |
| Req 7 | Offline banner | E7 | TG16 | Components; Theme Compliance | N/A | `OfflineBanner` and connectivity hook | Visibility, interaction, Theme and accessibility tests; AC1–AC6 evidenced | COMPLETE | None |
| Req 8 | Offline CTA gating and mutation flush | E7 | TG16; TG24–TG25 future | Deferred Components/Data Models/Error Flows | Platform idempotency reused later | SetupWizardFlow; future mutation queue/retry owners | Online/offline gating and banner tests evidence AC1 and the gating portion of AC2 | PARTIALLY COMPLETE | AC2 queue flush and AC3–AC11 retry interceptor, durable tenant-scoped FIFO queue, restart recovery, manual error and dead-letter behavior. |
| Req 9 | App background/foreground lifecycle | E6 | TG15 | Data flow and deferred lifecycle flow | Status query | SetupWizardFlow lifecycle/draft orchestration | AppState persistence, rehydrate, refetch and update-notice tests; AC1–AC3 evidenced | COMPLETE | None |
| Req 10 | Android hardware back interception | E6 | TG14 | Correctness Property 4 | N/A | SetupWizardFlow | Focused BackHandler, draft-save and first-step tests; AC1–AC3 evidenced | COMPLETE | None |
| Req 11 | Tenant identity fix | E2, E3, E6 | TG19; TG20; TG23 future | Backend Dependencies; E2 operational contract; TG20 design | Authentication, Effective Tenant and organization-tenant association | Auth/onboarding tenant context | TG19 organization/effective-tenant journeys and isolation tests | PARTIALLY COMPLETE | Verify the exact provisional/live `/auth/me` contract in staging, remove any remaining `X-Tenant-ID`/user fallback allowed only for transition, and close AC1–AC4 with deployment evidence. |
| Req 12 | Idempotency keys on mutations | E7, E9 | TG19 platform foundation; TG24–TG27 future | Correctness Property 1; E2 operational/idempotency contracts | Organization/platform idempotency and mutation services | Mutation datasource/repository boundaries | TG19 idempotency replay/conflict tests and step-submit evidence | PARTIALLY COMPLETE | Complete all onboarding mutators, especially completion/commercial/payment paths, and record staging proof required by AC6. |
| Req 13 | Demo/Live transition hooks and banner | E5 successor; E8 commercial owner | TG22 successor; TG26 future | E5 bounded actions; future E8 design | Future commercial lifecycle owner | Ready-to-Start presentation; future commercial presentation | TG22 verifies safe readiness navigation and explicitly excludes activation | SUPERSEDED | Direct Demo/Live mutation, Demo Mode, and Go Live behavior in AC1–AC3/AC5–AC6 must not be implemented. Req 34 owns readiness; TG26 must define the commercial trial contract. |
| Req 14 | Theme compliance | E1–E12 cross-cutting | TG13–TG22; TG31 exit | Theme Compliance and Epic design contracts | N/A | All onboarding presentation owners | Touched-surface Theme tests/static review | PARTIALLY COMPLETE | Phase-wide zero-hardcoded-token audit and remaining E6–E12 surfaces; final TG31 verification. |
| Req 15 | Test coverage | E1–E12 cross-cutting | TG13–TG22; TG31 exit | Testing Strategy and Epic acceptance contracts | Backend feature owners | Frontend feature owners | Required baseline suites plus TG18–TG22 focused/regression acceptance evidence; AC1–AC6 evidenced | COMPLETE | Future Task Groups must add their own acceptance evidence without reopening the completed historical criteria. |
| Req 16 | Server/local draft conflict resolution | E6 | TG23 future | Deferred Components/Data Models/Data Flows; E6 design gap | Onboarding status revision authority | Future conflict domain/modal/orchestration | No implementation evidence | NOT STARTED | AC1–AC7 and an accepted conflict lifecycle; depends on Req 29. |
| Req 17 | Multi-device onboarding validation | E5, E6 | TG21–TG22 partial; TG23 future | E4 lifecycle; E5 identity/consistency; E6 design gap | TG21 projection and readiness authorities | Draft cleanup/conflict orchestration | TG21/TG22 server-authoritative projection, stale rejection and tenant tests | PARTIALLY COMPLETE | Completed-draft cleanup, explicit Device A/Device B conflict behavior, and canonical multi-device acceptance evidence (remaining ACs). |
| Req 18 | Pending payment recovery | E8, E9 | TG26–TG27 future | Deferred Components/Error Handling; E8/E9 design gap | Future commercial/payment owner | Future recovery banner/action owner | No implementation evidence | NOT STARTED | AC1–AC5 plus accepted payment verification, security, ownership and recovery contracts. |
| Req 19 | Storage security audit | E2, E9, E12 | TG19 partial; TG27/TG31 future | E2 security contracts; deferred security design | Security/identity owners | Local draft and future payment storage owners | TG19 verified-contact/secret-leakage evidence and draft storage review | PARTIALLY COMPLETE | Complete AC1–AC4 data-classification inventory, SecureStore decisions, prohibited-value proof and recorded security review across all remaining data. |
| Req 20 | Error message centralisation | E7, E9, E10 | TG19/TG22 partial; TG24/TG27/TG28 future | Error Handling; E2/E5 typed errors | Typed domain/transport error owners | Central frontend mapper and localized presentation | TG19/TG22 safe typed-error and raw-leakage tests | PARTIALLY COMPLETE | One module-wide error taxonomy/mapper, remaining legacy paths, offline/commercial/dunning mappings, localization and AC1–AC5 coverage. |
| Req 21 | Zero hardcoded Theme values | E1, E11, E12 | TG13–TG22 partial; TG29–TG31 future | Theme Compliance; Epic UI contracts | N/A | Onboarding UI owners | Touched-file lint/review and presentation tests | PARTIALLY COMPLETE | Repository-wide onboarding audit/backfill and future E6–E12 UI; close AC1–AC4 with final static evidence. |
| Req 22 | Zustand architecture compliance | E7, E12 | TG13–TG22 partial; TG24–TG25/TG31 future | Dependency Rules | N/A | Store and presentation-hook owners | New stores follow synchronous/reuse boundaries | PARTIALLY COMPLETE | Remove or justify remaining component-level `useWizardStore.getState()` calls and verify all stores against AC1–AC5, including future mutation storage. |
| Req 23 | Hook/service architecture compliance | E1–E12 cross-cutting | TG18–TG22 partial; future TGs | Layer Map and Dependency Rules; E1/E2/TG20/E4/E5 reuse boundaries | Application/repository/transport owners | Datasource, repository, hook and presentation owners | TG18–TG22 boundary and focused architecture tests | PARTIALLY COMPLETE | Eliminate remaining presentation-to-datasource coupling (including SetupWizardFlow paths), complete module audit, and enforce AC1–AC6 for future work. |
| Req 24 | Internationalisation coverage | E1–E12 cross-cutting | TG13–TG22 partial; TG23–TG31 future | E4/E5 localization; Theme/i18n sections | Safe localization-token owners | `en-US`/`hi-IN` catalogs and presentation | TG18–TG22 key/placeholder parity tests | PARTIALLY COMPLETE | Strings for conflict, offline recovery, commercial/payment/dunning/dashboard work and Hindi-literate review required by AC3; final orphan/parity audit. |
| Req 25 | Accessibility compliance | E1–E12 cross-cutting | TG13–TG22 partial; TG23–TG31 future | E4/E5 accessibility; Testing Strategy | N/A | Presentation components and action owners | TG18 Journey Card, TG19 Clinic Entry, TG20 workspace, TG21 journey and TG22 readiness accessibility tests | PARTIALLY COMPLETE | Draft conflict and payment recovery semantics plus phase-wide focus, screen-reader, touch-target and font-scaling verification. |
| Req 26 | Duplicate submission locking | E5, E7–E9 | TG17/TG22 partial; TG24–TG27 future | Correctness Properties 1–3; E5 bounded actions | Idempotency and future commercial mutation owners | SetupWizardFlow and future CTA owners | Step pending/locking/submission ordering tests; TG22 duplicate-navigation prevention | PARTIALLY COMPLETE | Commercial transition/payment mutation locks and loading semantics; complete AC2–AC4 across successor operations and final slow-network evidence. |
| Req 27 | Query invalidation rules | E3, E5, E8–E9 | TG17/TG20/TG22 partial; TG26–TG27 future | Submit/refetch flow; TG20/E5 cache contracts | Query/application state owners | Central onboarding query keys/repositories | Submit/complete invalidation, workspace/readiness refresh and stale-response tests | PARTIALLY COMPLETE | Future trial/payment invalidation and session refresh; verify every successor mutation and remaining AC3–AC4 semantics. |
| Req 28 | Analytics and audit events | E1–E12 cross-cutting | TG19–TG22 partial; TG23–TG31 future | Error Handling; E2 platform audit; E4/E5 evidence | Platform/organization audit owners | Analytics adapter/event callers | TG19 immutable platform/org audit tests and safe TG20–TG22 evidence | PARTIALLY COMPLETE | Approved frontend analytics provider and full AC1 event inventory, shared metadata/session identity, fire-and-forget behavior, plus future flow events. |
| Req 29 | Mandatory per-step `updated_at` | E6 | TG23 future | Design 1.4 is only a placeholder; E6 constitutional gap | Onboarding status persistence/DTO authority | Status DTO and conflict consumer | Current source audit shows no reliable per-step contract | NOT STARTED | AC1–AC5; freeze timestamp versus revision semantics and persistence/transport ownership before TG23 implementation. |
| Req 30 | Tenant-scoped draft/mutation storage | E2, E6, E7, E9, E12 | TG13–TG19 partial; TG23/TG25/TG27/TG31 future | Data Models; E2 isolation contracts; E6/E7 gaps | Effective Tenant and tenant-isolated operations | Draft storage, cleanup and future mutation queue | Draft scoping/logout and TG19 tenant-switch/isolation tests | PARTIALLY COMPLETE | PendingMutationStore isolation/flush, full account-switch matrix and AC1–AC7 proof across both draft and mutation stores. |
| Req 31 | Draft expiry | E6, E12 | TG13–TG15 partial; TG23/TG31 future | Deferred Data Models and E6 gap | N/A | Wizard draft storage | Per-step expiry/retention/reset tests | PARTIALLY COMPLETE | Remote-config ownership and structured `onboarding_draft_expired` analytics; final AC1–AC7 integration evidence. |
| Req 32 | End-to-end release verification | E5–E9, E12 | TG22 partial; TG23–TG31 future | E2E Manual Verification and Release Checklist | Release/backend owners | Release/mobile owners | TG22 automated acceptance and regression evidence | PARTIALLY COMPLETE | Physical/emulated Android Runs A–D, staging idempotency, slow/intermittent-network evidence and recorded release sign-off required by AC1–AC5. |
| Req 33 | Capability-driven journey visibility | E4 | TG21 | E4 Constitutional Contract | Capability/template projection, query and transport | Journey datasource/repository/domain/presentation | Backend projection/query/transport and frontend data/domain/presentation acceptance; AC1–AC13 evidenced | COMPLETE | None |
| Req 34 | Ready-to-Start checklist and explanation | E5 | TG22 | E5 Constitutional Contract | Readiness domain/providers/application/transport | Readiness data/domain/query/presentation | Backend readiness/TG21/onboarding regressions and frontend TG22/onboarding acceptance; AC1–AC29 evidenced | COMPLETE | None; trial/subscription/payment activation is explicitly outside Req 34. |

## Task Group → Requirements

| Task Group | Requirement ownership | Shared or remaining acceptance criteria |
|---|---|---|
| TG18 — Journey Foundation and Cards | E1 constitutional requirements; contributes Req 5, 14, 15, 21, 23–25, 28 | E1 is accepted, but TG18 alone does not complete the cross-cutting numbered requirements except where prior TG13–TG17 evidence closes them. Future Theme, architecture, i18n, accessibility and analytics criteria remain with later Epics/TG31. |
| TG19 — Clinic Entry and Bring Your Clinic | E2 constitutional requirements; contributes Req 11, 19, 24, 25, 30 | E2 is accepted. Broader provisional auth deployment, security inventory, phase-wide i18n/accessibility and all draft/mutation isolation ACs remain open. |
| TG20 — Workspace Preparation | E3 constitutional requirements; contributes Req 11, 15, 23–25, 27, 28 | E3 is accepted. Req 15 historical test criteria are complete; other cross-cutting requirements retain future acceptance work. |
| TG21 — Capability Visibility | Completes Req 33; regression ownership for Req 1–4, 15, 23–25 | Req 33 is complete. Req 4 release audit and cross-cutting architecture/i18n/accessibility work continue. |
| TG22 — Ready-to-Start | Completes Req 34; contributes Req 13, 15, 17, 23–28, 32 | Req 34 is complete. Req 13 direct Demo/Live behavior is superseded, not incomplete TG22 work. Multi-device, commercial mutation, analytics and release-device ACs remain with later Epics. |

## Roadmap, Design, and Constitutional Validation

Every Requirement 1–34 has a roadmap destination and the matrix contains no
orphan requirement or orphan completed Task Group. E1–E5 have accepted design
and implementation owners. E6–E12 have roadmap and numbered-requirement
ownership but are not all implementation-ready:

- resolved decisions must be read from their accepted owners rather than
  reopened: E1 journey version/card semantics (TG18), E2 clinic entry/effective
  tenant (TG19), E3 preparation/retry (TG20), E4 capability/template projection
  (Req 33/TG21), and E5 readiness providers/actions (Req 34/TG22);
- E6 still lacks the accepted per-step revision/timestamp authority and complete
  conflict/multi-device constitutional lifecycle;
- E7 lacks the queue/retry/dead-letter/security contract;
- E8–E10 lack accepted commercial, payment, recovery, and dunning contracts;
- E11 lacks dashboard/first-action and growth/branding authority;
- E12 retains Hindi review, analytics/security completion, staging/device
  access, and the release matrix.

The roadmap's “open decisions” register is therefore historical in part: its
E1–E5 items are resolved by the accepted documents named above, while its
Req 29/TG23 and E7–E12 items remain genuine gaps. The roadmap itself is frozen
and was audited, not modified, by this reconciliation.

## TG23 Readiness

**Documentation incomplete. TG23 is NOT READY for implementation.** Its Epic
and requirement destination are clear, but deterministic implementation still
requires constitutional approval of:

1. the Req 29 per-step timestamp/revision source, persistence, transport, and
   backward-compatibility contract;
2. server-versus-local and device-versus-device conflict states, comparison,
   ownership, resolution, failure, retry, and audit behavior;
3. completed/retired/new-step draft cleanup under the TG21 projection identity;
4. exact frontend/backend boundary, tenant-switch/isolation behavior, focused
   test matrix, rollback, and stop conditions.

This decision does not authorize TG23 planning artifacts or implementation.

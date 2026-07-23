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

### Ownership and responsibilities

Product Architecture owns this RTM. Task Group owners supply source-backed
implementation and verification evidence; Product Architecture approves status
changes. The permanent authority chain is:

```text
requirements.md              product intent and acceptance criteria
↓
design.md                    implementation design and architecture
↓
requirements-traceability-matrix.md
                             implementation fulfillment and evidence
↓
tasks.md                     execution and acceptance history
```

None of these documents may duplicate or silently override another's
responsibility. The roadmap owns Epic destination and ordering above this
chain; it does not authorize implementation.

### Update policy and lifecycle

- **Constitutional approval:** update requirements, design, RTM ownership and
  planned status, and the task authorization record in the same checkpoint.
- **Implementation completion:** update RTM fulfillment, commit, and automated
  evidence plus the task execution record. Do not change requirements or design
  unless product or architecture was separately approved to change.
- **Acceptance completion:** update RTM acceptance/manual evidence and final
  status plus the task acceptance record.
- **Evidence rule:** record only accepted reports, repository commits, executed
  tests, and observed manual verification. Use `Not identified` or `Not run`
  when evidence is absent; never infer it.
- **Status rule:** a status change must cite the acceptance criteria affected
  and the evidence supporting the change. Supersession requires an accepted
  successor requirement/design owner.

Every TG23–TG31 lifecycle is mandatory and ordered:

```text
Roadmap → Requirements → Design → RTM → Tasks → Implementation
→ Verification → Acceptance → RTM update → Tasks update
```

No Task Group may skip, reverse, or collapse these authorities. The RTM must be
reviewed at every constitutional, implementation, and acceptance checkpoint.

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
| Req 9 | App background/foreground lifecycle | E6 | TG15 | E6 constitutional contract; lifecycle data flow | Status query | SetupWizardFlow lifecycle/draft orchestration | AppState persistence, rehydrate, refetch and update-notice tests; AC1–AC3 evidenced | COMPLETE | None |
| Req 10 | Android hardware back interception | E6 | TG14 | Correctness Property 4 | N/A | SetupWizardFlow | Focused BackHandler, draft-save and first-step tests; AC1–AC3 evidenced | COMPLETE | None |
| Req 11 | Tenant identity fix | E2, E3, E6 | TG19; TG20; TG23 | E2/TG20 contracts; E6 tenant-scope contract; E6 readiness | Authentication, Effective Tenant and organization-tenant association | Auth/onboarding tenant context | TG19 organization/effective-tenant journeys and isolation tests | PARTIALLY COMPLETE | TG23 may implement only E6 effective-tenant validation/stale-scope rejection; provisional/live `/auth/me` staging verification remains open. |
| Req 12 | Idempotency keys on mutations | E7, E9 | TG19 platform foundation; TG24–TG27 future | Correctness Property 1; E2 operational/idempotency contracts | Organization/platform idempotency and mutation services | Mutation datasource/repository boundaries | TG19 idempotency replay/conflict tests and step-submit evidence | PARTIALLY COMPLETE | Complete all onboarding mutators, especially completion/commercial/payment paths, and record staging proof required by AC6. |
| Req 13 | Demo/Live transition hooks and banner | E5 successor; E8 commercial owner | TG22 successor; TG26 future | E5 bounded actions; future E8 design | Future commercial lifecycle owner | Ready-to-Start presentation; future commercial presentation | TG22 verifies safe readiness navigation and explicitly excludes activation | SUPERSEDED | Direct Demo/Live mutation, Demo Mode, and Go Live behavior in AC1–AC3/AC5–AC6 must not be implemented. Req 34 owns readiness; TG26 must define the commercial trial contract. |
| Req 14 | Theme compliance | E1–E12 cross-cutting | TG13–TG22; TG31 exit | Theme Compliance and Epic design contracts | N/A | All onboarding presentation owners | Touched-surface Theme tests/static review | PARTIALLY COMPLETE | Phase-wide zero-hardcoded-token audit and remaining E6–E12 surfaces; final TG31 verification. |
| Req 15 | Test coverage | E1–E12 cross-cutting | TG13–TG22; TG31 exit | Testing Strategy and Epic acceptance contracts | Backend feature owners | Frontend feature owners | Required baseline suites plus TG18–TG22 focused/regression acceptance evidence; AC1–AC6 evidenced | COMPLETE | Future Task Groups must add their own acceptance evidence without reopening the completed historical criteria. |
| Req 16 | Server/local draft conflict resolution | E6 | TG23 | E6 constitutional requirements/design and readiness | Onboarding status revision and stale-write authority | TG23 conflict/recovery orchestration and presentation | No implementation evidence | NOT STARTED | TG23 is authorized to implement/verify revision-first recovery, Use Latest, Keep Local revalidation, unavailable evidence, audit, localization, and accessibility. |
| Req 17 | Multi-device onboarding validation | E5, E6 | TG21–TG22 partial; TG23 | E4/E5 identity; E6 constitutional contract/readiness | TG21 projection plus E6 step-revision authority | Draft cleanup/conflict orchestration | TG21/TG22 server-authoritative projection, stale rejection and tenant tests | PARTIALLY COMPLETE | TG23 is authorized to implement atomic revision propagation, ineligible cleanup, Device A/B stale-write rejection, and multi-device acceptance. |
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
| Req 29 | Mandatory per-step `updated_at` and revision authority | E6 | TG23 | E6 constitutional requirements/design and readiness | Onboarding status persistence/revision/DTO authority | Status DTO and conflict consumer | Source audit confirms `OrgSetupProgress.updated_at` exists but the status projection exposes no per-step revision/timestamp | NOT STARTED | TG23.1–TG23.2 are authorized to add/verify persisted revision, UTC timestamp, atomic updates, stale-write validation, DTO mapping, and compatibility. |
| Req 30 | Tenant-scoped draft/mutation storage | E2, E6, E7, E9, E12 | TG13–TG19 partial; TG23; future E7/E9/E12 | E2 isolation; E6 contract/readiness; E7 future | Effective Tenant and tenant-isolated operations | Draft storage, cleanup and future mutation queue | Draft scoping/logout and TG19 tenant-switch/isolation tests | PARTIALLY COMPLETE | TG23 may implement E6 projection/user/organization/tenant binding and stale cleanup; PendingMutationStore remains E7-owned. |
| Req 31 | Draft expiry | E6, E12 | TG13–TG15 partial; TG23; future TG31 | E6 persistence/recovery/readiness; E12 future | N/A | Wizard draft storage | Per-step expiry/retention/reset tests | PARTIALLY COMPLETE | TG23 must preserve expiry through schema v2/scope binding; remote config and final analytics remain later acceptance work. |
| Req 32 | End-to-end release verification | E5–E9, E12 | TG22 partial; TG23–TG31 | E6 readiness/acceptance boundary; E2E Release Checklist | Release/backend owners | Release/mobile owners | TG22 automated acceptance and regression evidence | PARTIALLY COMPLETE | TG23.5 owns E6 conflict/multi-device/isolation/rollback acceptance; Runs A–D and phase release sign-off remain open. |
| Req 33 | Capability-driven journey visibility | E4 | TG21 | E4 Constitutional Contract | Capability/template projection, query and transport | Journey datasource/repository/domain/presentation | Backend projection/query/transport and frontend data/domain/presentation acceptance; AC1–AC13 evidenced | COMPLETE | None |
| Req 34 | Ready-to-Start checklist and explanation | E5 | TG22 | E5 Constitutional Contract | Readiness domain/providers/application/transport | Readiness data/domain/query/presentation | Backend readiness/TG21/onboarding regressions and frontend TG22/onboarding acceptance; AC1–AC29 evidenced | COMPLETE | None; trial/subscription/payment activation is explicitly outside Req 34. |

## Verification Evidence Register

The following accepted implementation bundles provide compact, immutable commit
references. They do not imply that every shared cross-cutting requirement is
complete.

| Bundle | Backend commit(s) | Frontend commit(s) | Accepted verification/acceptance owner |
|---|---|---|---|
| E18 | N/A | `6cb53e0c`, `b431e8ef`, `fb4a57ef`, `66ea5428` | TG18 completion record in `tasks.md` and E1 constitutional documents |
| E19 | `45c4a42`, `4cd4bc0`, `7783442`, `5eda9f1`, `aaf46ff`, `5ae3a9c` | `0bd53a6d`, `af2aea09`, `8529845e` | `TG19-FINAL-ACCEPTANCE.md` |
| E20 | `c079245`, `7e5f536`, `22dfa45`, `b9d90cf`, `1fef01c`, `4a5df2b`, `51ac3f6` | `c51e4ad1`, `4bb60f28`, `f49b1ec1`, `5bc9912e`, `1e8f9451` | `frontend/docs/TG20/acceptance.md` and TG20.7 execution record |
| E21 | `8b291b5`, `aa4892a`, `60f3014` | `89e9f5dd`, `2b6edf01`, `00c361aa` | TG21 final verification and acceptance record |
| E22 | `4cefb8a`, `200473f`, `6c93029`, `1fa8b82`, `9e6158d` | `2c2a5c92`, `85453585` | TG22.3 final verification and acceptance record |

“Not identified” means the reconciled canonical record does not name a commit;
it is not evidence of absence. “Not run” is an explicit open manual gate.

| Requirement | Roadmap Epic | Task Group | Design Section | Backend Commit(s) | Frontend Commit(s) | Automated Tests | Acceptance Report | Manual Verification |
|---|---|---|---|---|---|---|---|---|
| Req 1 | E4 | TG17; TG21 regression | Design 1.1; E4 invariants | E21 regression bundle | Original commit not identified; E21 regression bundle | Alias-routing and TG21 onboarding regression suites | TG17 completion evidence; TG21 acceptance | N/A |
| Req 2 | E4 | TG17; TG21 regression | Design 1.2; E4 frontend boundary | E21 regression bundle | Original commit not identified; E21 regression bundle | Wizard alias-routing and TG21 presentation regressions | TG17 completion evidence; TG21 acceptance | N/A |
| Req 3 | E4 | TG17 | Design 1.3 | N/A | Commit not identified | File-absence/build regressions | TG17 completion evidence | N/A |
| Req 4 | E4 | TG17; TG21 | Design 1.1–1.2; E4 ownership | E21 bundle | E21 bundle | Template/projection and alias regression tests | TG21 acceptance; requirement remains partial | Active-template release audit remains open |
| Req 5 | E1 | TG13–TG15; TG18 follow-up | Data Models; E1 contracts | N/A | Original commits not identified; E18 regression bundle | Draft schema, storage, migration, expiry and integration suites | TG13–TG15 completion records; TG18 regression evidence | N/A |
| Req 6 | E1 | TG14 | Layer Map; E1 reuse | N/A | Commit not identified | Step integration, debounce, restore, hydration and clear suites | TG14 completion record | N/A |
| Req 7 | E7 | TG16 | Components; Theme | N/A | Commit not identified | OfflineBanner connectivity, Theme and accessibility suites | TG16 completion record | N/A |
| Req 8 | E7 | TG16; TG24–TG25 future | Deferred offline designs | Future | TG16 commit not identified | Offline visibility/gating tests only | TG16 partial completion record | Queue/reconnect acceptance not run |
| Req 9 | E6 | TG15 | E6 contract; lifecycle data flow | Status owner commit not identified | Commit not identified | AppState persist/rehydrate/refetch/update-notice suites | TG15 completion record | N/A |
| Req 10 | E6 | TG14 | Correctness Property 4 | N/A | Commit not identified | BackHandler/draft/first-step suites | TG14 completion record | N/A |
| Req 11 | E2, E3, E6 | TG19; TG20; TG23 | E2/TG20 contracts; E6 readiness | E19 and E20 bundles | E19 and E20 bundles | Effective-tenant, organization, session and isolation tests | TG19/TG20 acceptance; TG23 not started | Provisional/live staging contract not run |
| Req 12 | E7, E9 | TG19 foundation; TG24–TG27 future | Idempotency contracts | E19 bundle | Related original commit not identified | TG19 idempotency replay/conflict suites | TG19 acceptance; requirement remains partial | Required staging idempotency check not run |
| Req 13 | E5 successor; E8 | TG22 successor; TG26 future | E5 bounded actions; future E8 | E22 bundle for successor only | E22 bundle for successor only | TG22 readiness/action tests | TG22 acceptance; supersession recorded in requirements/RTM | Commercial transition not authorized |
| Req 14 | E1–E12 | TG13–TG22; TG31 | Theme Compliance | N/A | E18–E22 bundles for touched surfaces | Touched-surface Theme/static suites | TG18–TG22 acceptance records; partial | Phase-wide audit not run |
| Req 15 | E1–E12 | TG13–TG22; TG31 | Testing Strategy | E19–E22 bundles | E18–E22 bundles | Required baseline and accepted focused/regression suites | TG18–TG22 acceptance records | Historical ACs complete; future TG gates remain separate |
| Req 16 | E6 | TG23 | E6 constitutional/readiness contracts | Future TG23 | Future TG23 | None | TG23 authorized; not started | Not run |
| Req 17 | E5, E6 | TG21–TG23 | E4/E5 identity; E6 readiness | E21–E22 bundles | E21–E22 bundles | Stale rejection, server authority and tenant isolation tests | TG21/TG22 acceptance; TG23 not started | Device A/B conflict run not run |
| Req 18 | E8, E9 | TG26–TG27 future | Deferred payment design | Future | Future | None | None | Not run |
| Req 19 | E2, E9, E12 | TG19; TG27/TG31 future | E2 security; deferred audit | E19 bundle | E19 bundle | Secret-leakage and verified-contact security tests | TG19 acceptance; partial | Phase-wide security review not run |
| Req 20 | E7, E9, E10 | TG19/TG22; TG24/TG27/TG28 | Error Handling; E2/E5 errors | E19 and E22 bundles | E19 and E22 bundles | Typed-error/raw-leakage tests | TG19/TG22 acceptance; partial | Module-wide mapper audit not run |
| Req 21 | E1, E11, E12 | TG13–TG22; TG29–TG31 | Theme Compliance | N/A | E18–E22 bundles | Touched-file lint/Theme tests | TG18–TG22 acceptance; partial | Repository-wide Theme audit not run |
| Req 22 | E7, E12 | TG13–TG22; TG24/TG25/TG31 | Dependency Rules | N/A | Relevant commits not individually identified | Store/architecture suites for touched work | Existing TG acceptance records; partial | Full Zustand architecture audit not run |
| Req 23 | E1–E12 | TG18–TG31 | Layer Map; Epic reuse boundaries | E19–E22 bundles | E18–E22 bundles | Boundary and focused architecture tests | TG18–TG22 acceptance; partial | Full module architecture review not run |
| Req 24 | E1–E12 | TG13–TG31 | E4/E5 localization; i18n design | Safe-token commits in E21–E22 | E18–E22 bundles | English/Hindi key and placeholder parity tests | TG18–TG22 acceptance; partial | Hindi-literate review not recorded |
| Req 25 | E1–E12 | TG13–TG31 | E4/E5 accessibility | N/A | E18–E22 bundles | Journey, Clinic Entry, Workspace and Readiness accessibility suites | TG18–TG22 acceptance; partial | Phase-wide assistive-technology run not recorded |
| Req 26 | E5, E7–E9 | TG17/TG22; TG24–TG27 | Correctness Properties 1–3; E5 | E22 action bundle | Original commit not identified; E22 bundle | Submission lock/order and duplicate-navigation tests | TG17/TG22 evidence; partial | Slow-network and future commercial mutation runs not run |
| Req 27 | E3, E5, E8–E9 | TG17/TG20/TG22; TG26/TG27 | Submit/refetch; TG20/E5 cache | E20 and E22 bundles | E20 and E22 bundles | Invalidation, refresh and stale-response suites | TG20/TG22 acceptance; partial | Future trial/payment/session-refresh verification not run |
| Req 28 | E1–E12 | TG19–TG31 | Platform audit; Epic evidence designs | E19–E22 bundles | Relevant commits not individually identified | Platform/organization audit and safe-evidence tests | TG19–TG22 acceptance; partial | Full analytics event/provider verification not run |
| Req 29 | E6 | TG23 | E6 constitutional/readiness contracts | Future TG23 | Future TG23 | None | TG23 authorized; not started | Not run |
| Req 30 | E2, E6, E7, E9, E12 | TG13–TG19; TG23; future TGs | E2 isolation; E6 readiness; E7 future | E19 bundle | E19 bundle plus earlier commits not identified | Draft scoping, logout, tenant-switch and isolation tests | TG19 acceptance; TG23 not started | E6 scope and E7 mutation matrices not run |
| Req 31 | E6, E12 | TG13–TG15; TG23; future TG31 | E6 readiness; E12 future | N/A | Commit not identified | Per-step expiry/retention/reset suites | Earlier evidence; TG23 not started | Remote-config/analytics acceptance not run |
| Req 32 | E5–E9, E12 | TG22–TG31 | E6 readiness; E2E Release Checklist | E22 bundle | E22 bundle | TG22 automated acceptance/regressions | TG22 acceptance; TG23 not started | E6 matrix, Android Runs A–D and staging sign-off not run |
| Req 33 | E4 | TG21 | E4 Constitutional Contract | E21 bundle | E21 bundle | Projection/query/transport and data/domain/presentation suites | TG21 final acceptance | N/A |
| Req 34 | E5 | TG22 | E5 Constitutional Contract | E22 bundle | E22 bundle | Readiness domain/application/transport and frontend suites | TG22.3 final acceptance | N/A |

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
orphan requirement or orphan completed Task Group. E1–E6 now have accepted
constitutional design ownership. E1–E5 have completed implementation owners;
E6–E12 are not implementation-authorized:

- resolved decisions must be read from their accepted owners rather than
  reopened: E1 journey version/card semantics (TG18), E2 clinic entry/effective
  tenant (TG19), E3 preparation/retry (TG20), E4 capability/template projection
  (Req 33/TG21), E5 readiness providers/actions (Req 34/TG22), and E6
  revision/conflict/multi-clinic recovery (E6 constitutional contracts);
- E6 source-reuse/readiness and TG23 authorization are now satisfied by
  `E6-IMPLEMENTATION-READINESS.md` and the task ledger;
- E7 lacks the queue/retry/dead-letter/security contract;
- E8–E10 lack accepted commercial, payment, recovery, and dunning contracts;
- E11 lacks dashboard/first-action and growth/branding authority;
- E12 retains Hindi review, analytics/security completion, staging/device
  access, and the release matrix.

### Minimum documentation prerequisites for future Epics

These are prerequisites, not completed constitutional work or Task Group
authorization.

| Epic | Minimum documentation prerequisite before implementation |
|---|---|
| E6 / TG23 | Satisfied by `E6-IMPLEMENTATION-READINESS.md`; TG23 is authorized and TG23.1 is the first source checkpoint. Implementation evidence remains absent until execution. |
| E7 / TG24–TG25 | Approve central error/retry taxonomy, supported queue operations, tenant-scoped persistence/security, idempotent FIFO replay, retry/dead-letter/manual recovery, ownership, tests, rollback, and acceptance. |
| E8 / TG26 | Approve trial authority, start eligibility, duration/extension/expiry states, readiness handoff, idempotency, audit, failure/recovery, UI ownership, tests, rollback, and acceptance. |
| E9 / TG27 | Approve subscription/payment authority, provider boundary, verification and pending-payment states, security/idempotency, recovery, tenant isolation, tests, rollback, and acceptance. |
| E10 / TG28 | Approve dunning triggers, timing, severity, channels, non-destructive consequences, owned actions, localization/accessibility, audit, tests, rollback, and acceptance. |
| E11 / TG29–TG30 | Approve dashboard ownership and first-action source, capability/eligibility rules, growth lifecycle, branding/design-system criteria, analytics, tests, rollback, and acceptance. |
| E12 / TG31 | Freeze the phase-wide security, architecture, analytics, localization/Hindi review, accessibility, Theme, multi-clinic, staging/device, regression, release, rollback, and sign-off matrix. |

The roadmap's “open decisions” register is therefore historical in part: its
E1–E6 items are resolved by the accepted documents named above, while its
E7–E12 items remain genuine constitutional gaps. The roadmap itself is frozen
and was audited, not modified, by this reconciliation.

## TG23 Readiness

**E6 is constitutionally complete and TG23 implementation is AUTHORIZED.**
`E6-IMPLEMENTATION-READINESS.md` freezes source reuse, one additive migration,
compatibility, five bounded checkpoints, tests, rollback, and stop conditions.
TG23.1 — Backend Per-Step Revision Foundation is the exact first checkpoint.
Implementation fulfillment and evidence statuses remain unchanged until source
execution and acceptance are completed.

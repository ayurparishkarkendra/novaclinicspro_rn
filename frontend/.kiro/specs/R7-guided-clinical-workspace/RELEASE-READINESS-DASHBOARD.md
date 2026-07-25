# RELEASE-READINESS-DASHBOARD — NovaClinics Clinical Operating System

**As of:** 2026-07-25 · Backend `c16cbf008f51cb248698057bc9acd68a4cf568bf` · Frontend `57902bccdc9665a570a7768b6b61603ce3f0970f`
**Legend:** ✅ Complete · 🟠 Implemented, Not Exposed (service-only — no router/caller reaches it) · 🟡 Partial · 🔴 Not Started · N/A Not Applicable to this capability

**Backend-closure audit addendum (2026-07-25, backend HEAD `93e9b8d`) — narrow, targeted only:** only the **Session Scheduling** and **Therapist Execution** rows are corrected below, per this audit's exact scope (`resolve_scheduling_proposal`/T-BE-E.2 and `record_session_non_execution`/T-BE-E.4 were verified directly against source and tests). The other rows are unchanged from the prior pass and are known to be stale in places (e.g. Clinical History's T-BE-A.3–A.5 chain has since completed) — a full dashboard recount is a separate, larger reconciliation not performed here, consistent with the standing instruction against unscoped RTM/dashboard reconciliation.

| Capability | BE | FE | Tests | Release | MVP Scope |
|---|---|---|---|---|---|
| Clinical Workspace Shell & Briefing | ✅ | ✅ | ✅ | ✅ | Included |
| Patient Safety Surface | ✅ | ✅ | ✅ | ✅ | Included |
| Workflow Engine | ✅ | 🔴 | ✅ | 🔴 | Included |
| Recommendation Engine | ✅ | 🔴 | ✅ | 🔴 | Included |
| Case Sheet Continuity | ✅ | 🔴 | ✅ | 🔴 | Included |
| Prescription Management | ✅ | 🔴 | ✅ | 🔴 | Included |
| Treatment Recommendation & Plan (creation) | ✅ | 🔴 | ✅ | 🔴 | Included |
| Session Scheduling | 🟠 (intents resolved, no transport — `T-BE-E.2a`) | 🔴 | ✅ (48) | 🔴 | Included |
| Therapist Execution | 🟠 (non-execution recording done, no transport — `T-BE-E.4a`) | 🔴 | ✅ (44) | 🔴 | Included |
| Billing Visibility | ✅ | 🔴 | ✅ | 🔴 | Included |
| Clinical History | 🔴 (stale row — see addendum above) | 🔴 | 🔴 | 🔴 | Included |
| Role-Based Workflow | N/A | 🔴 | 🔴 | 🔴 | Included |
| Legacy Navigation | N/A | 🔴 | 🔴 | 🔴 | Included |
| Living Documents (incl. Plan versioning) | 🔴 | 🔴 | 🔴 | 🔴 | **Deferred** |
| Mobile-First Presentation (full polish) | N/A | 🟡 | ✅ | 🟡 | **Deferred** |

**Overall Release column: 2 ✅ (Clinical Workspace, Patient Safety) · 1 🟡 (Mobile, deferred anyway) · 12 🔴.** Of the 13 in-scope-for-MVP capabilities, only 2 are release-ready today. **Doctor Session content (FR-TS-3, FR-SCH-2)** is not its own dashboard row but is tracked in `RTM-MASTER.md`: backend accepted with a documented staged-rollout compatibility amendment (`93e9b8d`); FE not started.

**Reading this dashboard correctly:** the 🔴 Release column for 10 of the 12 not-ready capabilities is driven by a ✅/🟠/🟡 Backend column paired with a 🔴 Frontend column — meaning most of the *remaining engineering risk* is frontend composition of already-complete, already-tested backend contracts, not backend design or implementation risk. Session Scheduling and Therapist Execution are now 🟠, not 🔴: their domain logic is implemented and tested, but genuinely unreachable by any client until `T-BE-E.2a`/`T-BE-E.4a` expose it — a smaller, better-understood gap than "not started," but still release-blocking as-is.

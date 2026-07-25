# RELEASE-READINESS-DASHBOARD — NovaClinics Clinical Operating System

**As of:** 2026-07-25 · Backend `c16cbf008f51cb248698057bc9acd68a4cf568bf` · Frontend `57902bccdc9665a570a7768b6b61603ce3f0970f`
**Legend:** ✅ Complete · 🟠 Implemented, Not Exposed (service-only — no router/caller reaches it) · 🟡 Partial · 🔴 Not Started · N/A Not Applicable to this capability

**Backend-closure audit addendum (2026-07-25, backend HEAD `a0aa4c3`) — narrow, targeted only:** only the **Session Scheduling** and **Therapist Execution** rows are corrected below. `T-BE-E.2a` and `T-BE-E.4a` (the transport-exposure tasks the prior audit pass flagged) are now complete and pushed — both rows move from 🟠 to ✅ on the Backend column. The other rows are unchanged from the prior passes and are known to be stale in places (e.g. Clinical History's T-BE-A.3–A.5 chain has since completed) — a full dashboard recount is a separate, larger reconciliation not performed here, consistent with the standing instruction against unscoped RTM/dashboard reconciliation.

| Capability | BE | FE | Tests | Release | MVP Scope |
|---|---|---|---|---|---|
| Clinical Workspace Shell & Briefing | ✅ | ✅ | ✅ | ✅ | Included |
| Patient Safety Surface | ✅ | ✅ | ✅ | ✅ | Included |
| Workflow Engine | ✅ | 🔴 | ✅ | 🔴 | Included |
| Recommendation Engine | ✅ | 🔴 | ✅ | 🔴 | Included |
| Case Sheet Continuity | ✅ | 🔴 | ✅ | 🔴 | Included |
| Prescription Management | ✅ | 🔴 | ✅ | 🔴 | Included |
| Treatment Recommendation & Plan (creation) | ✅ | 🔴 | ✅ | 🔴 | Included |
| Session Scheduling | ✅ (intents resolved and exposed — `T-BE-E.2a`, commit `882dfa6`) | 🔴 | ✅ (48+12) | 🔴 | Included |
| Therapist Execution | ✅ (non-execution recording done and exposed — `T-BE-E.4a`, commit `a0aa4c3`) | 🔴 | ✅ (44+17) | 🔴 | Included |
| Billing Visibility | ✅ | 🔴 | ✅ | 🔴 | Included |
| Clinical History | 🔴 (stale row — see addendum above) | 🔴 | 🔴 | 🔴 | Included |
| Role-Based Workflow | N/A | 🔴 | 🔴 | 🔴 | Included |
| Legacy Navigation | N/A | 🔴 | 🔴 | 🔴 | Included |
| Living Documents (incl. Plan versioning) | 🔴 | 🔴 | 🔴 | 🔴 | **Deferred** |
| Mobile-First Presentation (full polish) | N/A | 🟡 | ✅ | 🟡 | **Deferred** |

**Overall Release column: 2 ✅ (Clinical Workspace, Patient Safety) · 1 🟡 (Mobile, deferred anyway) · 12 🔴.** Of the 13 in-scope-for-MVP capabilities, only 2 are release-ready today. **Doctor Session content (FR-TS-3, FR-SCH-2)** is not its own dashboard row but is tracked in `RTM-MASTER.md`: backend accepted with a documented staged-rollout compatibility amendment (`93e9b8d`); FE not started.

**Reading this dashboard correctly [Updated 2026-07-25]:** every remaining 🔴 in the Release column is now driven by a ✅ (or, for the two stale rows, presumed-complete) Backend column paired with a 🔴 Frontend column — meaning **100% of the remaining engineering risk for Session Scheduling and Therapist Execution is now frontend composition**, not backend design, implementation, or exposure risk. Both capabilities' backend halves are complete, tested, and reachable over HTTP as of commits `882dfa6`/`a0aa4c3`.

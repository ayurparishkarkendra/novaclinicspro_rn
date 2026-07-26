# RELEASE-READINESS-DASHBOARD — NovaClinics Clinical Operating System

**As of:** 2026-07-25 · Backend `c16cbf008f51cb248698057bc9acd68a4cf568bf` · Frontend `57902bccdc9665a570a7768b6b61603ce3f0970f`
**Legend:** ✅ Complete · 🟠 Implemented, Not Exposed (service-only — no router/caller reaches it) · 🟡 Partial · 🔴 Not Started · N/A Not Applicable to this capability

**Backend-closure audit addendum (2026-07-25, backend HEAD `a0aa4c3`) — narrow, targeted only:** only the **Session Scheduling** and **Therapist Execution** rows are corrected below. `T-BE-E.2a` and `T-BE-E.4a` (the transport-exposure tasks the prior audit pass flagged) are now complete and pushed — both rows move from 🟠 to ✅ on the Backend column. The other rows are unchanged from the prior passes and are known to be stale in places (e.g. Clinical History's T-BE-A.3–A.5 chain has since completed) — a full dashboard recount is a separate, larger reconciliation not performed here, consistent with the standing instruction against unscoped RTM/dashboard reconciliation.

**Addendum (2026-07-26, `T-BE-E.1a`/`T-FE-E.1a`/`T-FE-E.1b` closure) — narrow, targeted only:** only the **Case Sheet Continuity** row is corrected below. The Case Sheet content snapshot (backend, `T-BE-E.1a`, commit `00682b6`, shared-dev DB upgraded `8e43b15`) and its frontend composition + read-only history rendering (`T-FE-E.1a`/`T-FE-E.1b`, commits `0ed23f7`/`c93fddf`) are now both complete — this row moves from 🔴 to ✅ on the Frontend and Release columns. Other rows are unchanged and not recomputed in this pass.

| Capability | BE | FE | Tests | Release | MVP Scope |
|---|---|---|---|---|---|
| Clinical Workspace Shell & Briefing | ✅ | ✅ | ✅ | ✅ | Included |
| Patient Safety Surface | ✅ | ✅ | ✅ | ✅ | Included |
| Workflow Engine | ✅ | 🔴 | ✅ | 🔴 | Included |
| Recommendation Engine | ✅ | 🔴 | ✅ | 🔴 | Included |
| Case Sheet Continuity | ✅ | ✅ (`T-FE-E.1a`+`T-FE-E.1b`, commits `0ed23f7`/`c93fddf`) | ✅ | ✅ | Included |
| Prescription Management | ✅ | 🔴 | ✅ | 🔴 | Included |
| Treatment Recommendation & Plan (creation) | ✅ | 🔴 | ✅ | 🔴 | Included |
| Session Scheduling | ✅ (intents resolved and exposed — `T-BE-E.2a`, commit `882dfa6`) | 🔴 | ✅ (48+12) | 🔴 | Included |
| Therapist Execution | ✅ (non-execution recording done and exposed — `T-BE-E.4a`, commit `a0aa4c3`) | 🔴 | ✅ (44+17) | 🔴 | Included |
| Billing Visibility | ✅ | 🔴 | ✅ | 🔴 | Included |
| Clinical History | ✅ (`T-BE-A.3/A.4/A.5/A.3a`, commits `4472060`/`2147ada`/`6cac1e6`/`8326f33`) | 🟡 (`T-FE-C.5`+`T-FE-C.6` done, commits `cedee6cc`/`71e9f44d` — consumption + collapsible Plan groups; `T-FE-C.7` mobile not started; per-session/Plan-status detail blocked on a discovered backend gap) | ✅ | 🟡 | Included |
| Role-Based Workflow | N/A | 🔴 | 🔴 | 🔴 | Included |
| Legacy Navigation | N/A | 🔴 | 🔴 | 🔴 | Included |
| Living Documents (incl. Plan versioning) | 🔴 | 🔴 | 🔴 | 🔴 | **Deferred** |
| Mobile-First Presentation (full polish) | N/A | 🟡 | ✅ | 🟡 | **Deferred** |

**Overall Release column [Updated 2026-07-26, T-FE-C.5 closure]: 3 ✅ (Clinical Workspace, Patient Safety, Case Sheet Continuity) · 2 🟡 (Mobile, deferred anyway; Clinical History — backend + frontend consumption done, hierarchy rendering `T-FE-C.6`/`C.7` still ahead) · 10 🔴.** Of the 13 in-scope-for-MVP capabilities, 3 are release-ready today.

**Addendum (2026-07-26, `T-FE-C.5` closure) — narrow, targeted only:** only the **Clinical History** row is corrected below. Its backend chain (`T-BE-A.3/A.4/A.5/A.3a`) and the frontend's own history-consumption task (`T-FE-C.5`) are both complete — the row moves from 🔴/🔴/🔴/🔴 to ✅/🟡/✅/🟡. Full hierarchy rendering (`T-FE-C.6`/`C.7`) remains, so Frontend/Release stay 🟡, not ✅. Other rows unchanged and not recomputed in this pass. **Doctor Session content (FR-TS-3, FR-SCH-2)** is not its own dashboard row but is tracked in `RTM-MASTER.md`: backend accepted with a documented staged-rollout compatibility amendment (`93e9b8d`); FE not started.

**Second addendum (2026-07-26, `T-FE-C.6` closure) — narrow, targeted only:** only the **Clinical History** row is updated again below. `T-FE-C.6` (collapsible Treatment Plan groups, commit `71e9f44d`) is complete — Frontend/Release stay 🟡, not ✅, since `T-FE-C.7` (mobile) remains and Engineering Truth found the live contract carries no per-session data or Plan status field, so the requirement's own AC7-9 clauses remain unsatisfiable without a further backend amendment (reported on `RTM-MASTER.md`'s FR-HIST-1 row).

**Reading this dashboard correctly [Updated 2026-07-25]:** every remaining 🔴 in the Release column is now driven by a ✅ (or, for the two stale rows, presumed-complete) Backend column paired with a 🔴 Frontend column — meaning **100% of the remaining engineering risk for Session Scheduling and Therapist Execution is now frontend composition**, not backend design, implementation, or exposure risk. Both capabilities' backend halves are complete, tested, and reachable over HTTP as of commits `882dfa6`/`a0aa4c3`.

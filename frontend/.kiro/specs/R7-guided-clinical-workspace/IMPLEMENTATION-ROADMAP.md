# IMPLEMENTATION-ROADMAP — NovaClinics Clinical Operating System MVP

**Status: proposed engineering execution plan, not yet owner-approved.** Derived entirely from `RTM-MASTER.md`, `RTM-SUMMARY.md`, `MVP-BLOCKERS.md`, `RTM.md`, `RTM-AUDIT.md`, `MVP-RELEASE-FREEZE.md`, and the original governing documents (`requirements.md`, `design.md`, `tasks.md`, `R7-OWNER-RATIFICATION.md`). None of those documents were modified to produce this one. No production code was touched. No requirement, design, or completed-task status was changed.
**As of:** 2026-07-25 · Backend `c16cbf008f51cb248698057bc9acd68a4cf568bf` · Frontend `57902bccdc9665a570a7768b6b61603ce3f0970f` — unchanged since the prior two audit passes; all evidence below carries forward from those verified findings.

**Backend-closure audit addendum (2026-07-25, backend HEAD `93e9b8d`) — narrow, targeted only:** rows **8 (Session Scheduling)** and **9 (Therapist Execution)** below are stale — `T-BE-E.2` through `T-BE-E.5` have since completed. See the corrected rows' inline notes. No other row in this table was re-verified in this pass; a full roadmap recount is a separate, larger reconciliation, not performed here.

**A second self-correction, stated plainly per this exercise's own standard of never propagating an unverified number:** `RTM-AUDIT.md` §10's closing line said "29 tasks remaining." Its own table, however, already listed Group Z's 9 tasks alongside the 29 BE+FE tasks — so the table itself contained 38 rows while the summary sentence said 29. `RTM-SUMMARY.md` independently arrived at the correct figure (80 total − 42 complete = **38 remaining**) via a different calculation. This document uses **38** throughout, the figure both independent calculations agree on.

---

## Phase 1 & 2 — Capability Definition and Assessment

Forgetting milestones, task groups, and phases, the 44 requirements group into **15 product capabilities.** The suggested list in scope plus what the requirements actually contain, with no capability forced or omitted:

| Capability | Backend | Frontend | Tests | End-to-End | Status |
|---|---|---|---|---|---|
| **1. Clinical Workspace Shell & Briefing** (FR-COS-1, FR-COS-2, FR-VCC-1/2/3, FR-FLAG-1) | ✅ Complete | ✅ Complete | ✅ Unit (shell, 3 briefing regions, flag) | ❌ None exists | **Complete** — evidence: `RTM-MASTER.md` FR-COS-1/FR-VCC-2/FR-VCC-3/FR-FLAG-1 cards, all "Complete" |
| **2. Patient Safety Surface** (FR-VCC-4, FR-PS-1) | ✅ Complete | ✅ Complete | ✅ Unit incl. explicit negative-assertion test | ❌ None | **Complete** — evidence: `RTM-MASTER.md` FR-VCC-4/FR-PS-1 cards, both "Complete" |
| **3. Workflow Engine** (FR-WFA-1, FR-WFA-2, FR-CR-1) | ✅ Complete | ❌ Not Started | ✅ Unit+Architecture (BE only) | ❌ None | **Backend Complete** — evidence: `RTM-MASTER.md` FR-WFA-1/2, FR-CR-1 cards; `MVP-BLOCKERS.md` entries for same |
| **4. Recommendation Engine** (FR-REC-1, FR-REC-2) | ✅ Complete | ❌ Not Started | ✅ Contract/semantics guard (BE only) | ❌ None | **Backend Complete** — evidence: `RTM-MASTER.md` FR-REC-1/2 cards |
| **5. Case Sheet Continuity** (FR-CS-1..6) | ✅ Complete | ✅ Complete (`T-FE-E.1a`/`T-FE-E.1b`, commits `0ed23f7`/`c93fddf`) | ✅ Unit+Integration (BE+FE) | ❌ None | **[Updated 2026-07-26, T-BE-E.1a/T-FE-E.1a/T-FE-E.1b closure]** evidence: `RTM-MASTER.md` FR-CS-1..6 cards (FR-CS-1/2/3/4/5 now Complete; FR-CS-6's amendment-reason half still depends on FR-LD-2) |
| **6. Prescription Management** (FR-RX-1, FR-RX-2) | ✅ Complete (by omission — no violating code exists) | ❌ Not Started | ✅ Pre-existing suite | ❌ None | **Backend Complete** — evidence: `RTM-MASTER.md` FR-RX-1 card |
| **7. Treatment Recommendation & Plan** (FR-TR-1, FR-TP-1, FR-TP-2, FR-TP-3) | 🟡 Partially Complete (creation done, versioning not) | ❌ Not Started | ✅ Extensive unit/structural (89+ tests, BE only) | ❌ None | **Backend Complete for creation; Not Started for versioning** — evidence: `RTM-MASTER.md` FR-TR-1/TP-1/TP-2 cards "Complete"/"Partially Complete", FR-TP-3 card "Not Started" |
| **8. Session Scheduling** (FR-TS-1, FR-TS-2, FR-SCH-1, FR-SCH-2) | ✅ Backend complete and exposed (identity, intent-resolution, doctor-content OCC, and `resolve_scheduling_proposal` all implemented and reachable over HTTP as of `T-BE-E.2a`) | ❌ Not Started | ✅ 28 (identity) + 48 (intents) + 58 (content) + 33 (OCC) + 12 (proposal API) | ❌ None | **[Updated 2026-07-25, T-BE-E.2a closure]** evidence: `RTM-MASTER.md` FR-SCH-1/FR-SCH-2 cards, `MVP-BLOCKERS.md` FR-SCH-1/2 entries, commits `c496c86`/`f9614d7`/`93e9b8d`/`882dfa6` |
| **9. Therapist Execution** (FR-TS-3, FR-TS-4, FR-TS-5) | ✅ Backend complete and exposed: FR-TS-3 (doctor content) with OCC (`93e9b8d`); FR-TS-4/5 (`record_session_non_execution`) reachable via `POST /treatment-sheets/rows/{row_id}/non-execution` as of `T-BE-E.4a` | ❌ Not Started | ✅ 58 (content) + 44 (non-execution) + 17 (non-execution API) | ❌ None | **[Updated 2026-07-25, T-BE-E.4a closure]** evidence: `RTM-MASTER.md` FR-TS-3/4/5 cards, `MVP-BLOCKERS.md` FR-TS-3/4/5 entries, commits `9497f13`/`ccf56d8`/`1529b47`/`a0aa4c3` |
| **10. Living Documents** (FR-LD-1, FR-LD-2, FR-LD-3) | ❌ Not Started | ❌ Not Started | ❌ None | ❌ None | **Not Started** — evidence: `RTM-MASTER.md` FR-LD-1/2/3 cards |
| **11. Billing Visibility** (FR-BILL-1, FR-BILL-2) | ✅ Complete | ❌ Not Started | ✅ Unit (BE only) | ❌ None | **Backend Complete** — evidence: `RTM-MASTER.md` FR-BILL-1/2 cards |
| **12. Clinical History** (FR-HIST-1, FR-HIST-2) | ✅ Complete (`T-BE-A.3/A.4/A.5/A.3a`) | 🟡 Partial (`T-FE-C.5`+`T-FE-C.6` complete, commits `cedee6cc`/`71e9f44d`; `T-FE-C.7` mobile not started; per-session/Plan-status detail blocked on a discovered backend gap) | ✅ 139 backend + 81 frontend focused | ❌ None | **[Updated 2026-07-26, T-FE-C.6 closure]** evidence: `RTM-MASTER.md` FR-HIST-1/2 cards (FR-HIST-2 Complete; FR-HIST-1 Partial — mobile + backend contract gap remain) |
| **13. Role-Based Workflow** (FR-RBAC-1) | N/A (pre-existing permission system; no new backend task) | ❌ Not Started | ❌ None R7-specific | ❌ None | **Not Started** — evidence: `RTM-MASTER.md` FR-RBAC-1 card; `episodeWorkspaceConfig.ts` confirmed untouched by any R7 commit |
| **14. Legacy Navigation** (FR-LEG-1, FR-LEG-2) | N/A | ❌ Not Started | ❌ None | ❌ None | **Not Started** — evidence: `RTM-MASTER.md` FR-LEG-1/2 cards; three legacy routes confirmed to contain zero `cos_v1` references |
| **15. Mobile-First Presentation** (FR-MOB-1, FR-MOB-2) | N/A | 🟡 Partially Complete (shell only) | ✅ Shell tests only | ❌ None | **Partially Complete** — evidence: `RTM-MASTER.md` FR-MOB-1 card "Partially Complete", FR-MOB-2 card "Not Started" |

**Cross-cutting fact repeated once, applying to every row above: no End-to-End test of any kind exists anywhere in either repository, for any capability.** This is not specific to any one row.

---

## Phase 3 — MVP Decision Per Capability (re-evaluated fresh, not inherited)

Each answers exactly: *can NovaClinics ship its first Clinical Operating System MVP without this capability?*

### 1. Clinical Workspace Shell & Briefing — **YES, Required for MVP**
Without this, there is no entry point to a "Clinical Operating System" at all — it is the product. Requirement refs: FR-COS-1, FR-VCC-1/2/3. Design ref: §3, §4a. RTM evidence: already Complete (`RTM-MASTER.md`), so the answer costs nothing to enforce.

### 2. Patient Safety Surface — **YES, Required for MVP**
A clinical product cannot honestly ship with zero safety context, even a deliberately minimal, verified-only one. Requirement refs: FR-VCC-4, FR-PS-1. Design ref: §2.9. Ratification: F-2 = Option A. RTM evidence: already Complete.

### 3. Workflow Engine — **YES, Required for MVP**
This is R7's own central differentiator (Decision 9, "Backend Owns Workflow Intelligence" — the whole reason R7 exists rather than being a set of disconnected forms). Requirement refs: FR-WFA-1, FR-WFA-2, FR-CR-1. Design ref: §2.1. RTM evidence: `RTM-MASTER.md` FR-WFA-1 card, `MVP-BLOCKERS.md` FR-WFA-1 entry — backend complete and tested since `f3895d8`/2026-07-17; zero frontend consumption.

### 4. Recommendation Engine — **YES, Required for MVP**
Tightly coupled to #3; "recommend, never decide" (Decision 7) is the product's core interaction philosophy, not a feature among many. Requirement refs: FR-REC-1, FR-REC-2. RTM evidence: `RTM-MASTER.md` FR-REC-1/2 cards.

### 5. Case Sheet Continuity — **YES, Required for MVP**
Decision 1 was the *first* ratified decision, fixing a verified, real clinical-record-integrity defect (F-1: contributions mis-attributed to the wrong visit). Requirement refs: FR-CS-1..6. Design ref: §2.2. RTM evidence: `RTM-MASTER.md` FR-CS-2/3/4 cards "Complete" and fully tested; FR-CS-1/5/6 "Partially Complete" (frontend gap only).

### 6. Prescription Management — **YES, Required for MVP**
Prescriptions are core, everyday clinical workflow; the requirement's scope (DRAFT/FINAL/SIGNED only) is intentionally minimal, not deferred. Requirement refs: FR-RX-1. Design ref: §2.7. Decision 3.

### 7. Treatment Recommendation & Plan — **YES, Required for MVP for creation; versioning (FR-TP-3) rides with capability #10's deferral**
The marquee new entity of R7 — an entire migration and Group D exist to build it. Shipping without exposing it to users would waste the largest, most rigorously-verified backend investment in the entire matrix. Requirement refs: FR-TR-1, FR-TP-1, FR-TP-2. Design ref: §2.3, §2.8. RTM evidence: `RTM-MASTER.md` FR-TP-1 card — 4 sequential backend tasks, 89+ tests, complete. **However**, FR-TP-3 (amendment vs. schedule change) is realized by `T-BE-D.5`, which is itself blocked by `T-BE-G.1` (Living Documents) — see #10 below for why that specific piece defers cleanly.

### 8. Session Scheduling — **YES, Required for MVP**
Without it, a Treatment Plan can be created but no actual multi-session therapy course can run — this defeats the product's stated primary use case (Ayurveda/Physio/Dental/Orthopedics/Rehabilitation/Pain Management, all named repeatedly in the ratified design as R7's target specialties). Requirement refs: FR-TS-1, FR-TS-2, FR-SCH-1, FR-SCH-2. Design ref: §2.4. RTM evidence: `RTM-MASTER.md` FR-TS-1/2 cards (identity proven) + FR-SCH-1/2 cards ("Not Started" — genuine remaining work).

### 9. Therapist Execution — **YES, Required for MVP** (the most negotiable "yes" in this list)
For a therapy-centric product, shipping Plans and Scheduling with zero way to record what actually happened is incomplete for the product's own primary audience. Requirement refs: FR-TS-3, FR-TS-4, FR-TS-5. Design ref: §2.4. **Caveat, stated honestly**: if timeline pressure forces a cut, this is the first capability worth a real owner conversation about shipping a simplified "mark complete" flow instead of the full append-only actuals/adverse-events/Missed-decomposition model — but that would be a scope change from the frozen AC, requiring an explicit owner decision, not something this document unilaterally grants.

### 10. Living Documents — **NO, Defer to Post-MVP**
**This is the one capability with direct textual permission to defer, not just this document's own judgment.** `design.md` §2.6 states outright: *"Version/supersession representation [VP] — deliberately not fixed here; it is a schema change requiring its own approval... R7 core ships without amendment (Group G defers cleanly)."* Requirement refs: FR-LD-1, FR-LD-2, FR-LD-3 (and the versioning half of FR-TP-3, via `T-BE-D.5`'s dependency on `T-BE-G.1`). Zero implementation exists (`RTM-MASTER.md` confirms all three FR-LD cards "Not Started"). **Accepted consequence**: the pre-R7 status quo continues — a SIGNED document remains locked forever, with no amendment path — until this capability lands.

### 11. Billing Visibility — **YES, Required for MVP**
Reconsidered carefully (a defer case was seriously weighed, since legacy billing screens remain fully functional per FR-LEG-1's no-deletion guarantee — admin/front-desk *could* keep using the old screens). Decided **required** because: (a) the backend is fully done and tested — the remaining cost is one Medium frontend task, not a new capability; (b) Decision 6 explicitly names admin/front-desk as primary actors *within* the new workspace, and shipping the COS without any billing visibility for the role that most needs it daily undermines the "operating system" claim for that user. Requirement refs: FR-BILL-1, FR-BILL-2. Design ref: §2.5.

### 12. Clinical History — **YES, Required for MVP**
Reconsidered carefully (a defer case exists — the pre-R7 flat timeline still renders and functions, just without correct grouping/counts). Decided **required** because Decision 10 is an explicit, dated, RATIFIED owner decision stating "in R7, not R8" — overriding an explicit ratification requires new evidence at least as strong as what justified deferring Living Documents (#10), and no such textual permission exists here; the opposite does (a whole amendment specifically pulling this *into* R7). Requirement refs: FR-HIST-1, FR-HIST-2. Design ref: §2.1a. **Honest caveat**: this is the least mature "yes" — zero implementation exists, though its backend prerequisites are now fully unblocked. If a scope conversation happens, this is the second candidate worth raising with the owner (after Therapist Execution) — but as a recommendation for that conversation, not a unilateral deferral here.

### 13. Role-Based Workflow — **YES, Required for MVP**
Reconsidered carefully — `episodeWorkspaceConfigByRole` already supports 2 roles pre-R7, so a narrower MVP could theoretically defer the 2→5 role extension. Decided **required** because it is a genuine dependency of two other already-required capabilities: Billing Visibility (#11, needs Admin/Front-desk role rendering to be meaningful) and Therapist Execution (#9, needs Therapist role). Deferring #13 would leave #9 and #11 functionally unreachable for the roles that need them. Requirement refs: FR-RBAC-1.

### 14. Legacy Navigation — **YES, Required for MVP**
Not a "nice to have" — it is the on-ramp. Without redirect wiring, a user clicking "Start Consultation" from existing entry points never reaches the new workspace regardless of flag state; the flag exists to gate a route real users actually arrive at. Requirement refs: FR-LEG-1, FR-LEG-2. Design ref: §2.10.

### 15. Mobile-First Presentation (full polish) — **NO, Defer to Post-MVP**
The underlying shell (already counted in capability #1, already Complete) renders and is mobile-safe. The remaining pieces — sticky-next-action, horizontal pill-rail scroll behavior, the dedicated accessibility pass (`T-FE-G.1`, `T-FE-G.2`) — are animation/interaction polish layered on top of already-functional components, not new capability. Requirement refs: FR-MOB-1 (partial), FR-MOB-2. `MVP-RELEASE-FREEZE.md` §4 independently reached the same conclusion at the task level; this capability-level re-evaluation concurs.

**Result: 13 of 15 capabilities are Required for MVP. 2 are cleanly deferrable — one with direct design-document textual permission (Living Documents), one on cost/value grounds concurring with the prior audit (Mobile polish).** This is a materially narrower "optional" list than a first glance at the 38 remaining tasks might suggest — most of what remains is genuinely required, not padding.

---

## Phase 4 — Remaining Task Classification (all 38 tasks, each exactly once)

| Category | Definition | Count | Tasks |
|---|---|---|---|
| **A — Mandatory before Release** | Required capability, real engineering work remains on at least one side | 18 | `T-BE-A.3`, `T-BE-A.4`, `T-BE-A.5`, `T-BE-E.2`, `T-BE-E.3`, `T-BE-E.4`, `T-BE-E.5`, `T-FE-C.4`, `T-FE-C.5`, `T-FE-C.6`, `T-FE-C.7`, `T-FE-E.2`, `T-FE-E.3`, `T-Z.1`, `T-Z.2`, `T-Z.3`, `T-Z.4`, `T-Z.9` |
| **B — Backend Complete, Frontend Pending** | Required capability, backend fully done and tested, only frontend consumption remains, no new backend blocker | 9 | `T-FE-B.1`, `T-FE-B.2`, `T-FE-D.1`, `T-FE-E.1`, `T-FE-E.4`, `T-FE-E.6`, `T-FE-F.1`, `T-FE-F.2`, `T-FE-F.3` |
| **C — Documentation Only** | Produces no capability, only closure/proof documentation | 1 | `T-Z.8` |
| **D — Already Implemented** | — | 0 | None — every remaining task traces to a genuinely unstarted requirement obligation (confirmed independently in `RTM-MASTER.md`'s own "Most Important Analysis") |
| **E — Superseded** | — | 0 | None — no remaining task's scope has been replaced by different work |
| **F — Technical Debt** | — | 0 | None among the *remaining* 38. (Accepted debt items exist — ED-ARCH-002, ED-ARCH-003, ED-ARCH-001's residual ~18 files — but none has an owning task in the remaining list; see `RTM-AUDIT.md` §6/§9 and `MVP-RELEASE-FREEZE.md` §6.) |
| **G — Post-MVP** | Capability deferred per Phase 3 | 10 | `T-BE-D.5`, `T-BE-G.1`, `T-BE-G.2`, `T-BE-G.3`, `T-FE-E.5`, `T-FE-G.1`, `T-FE-G.2`, `T-Z.5`, `T-Z.6`, `T-Z.7` |

**Total: 18 + 9 + 1 + 0 + 0 + 0 + 10 = 38.** Every task appears exactly once.

---

## Phase 5 — The Roadmap, Sorted by Implementation Order

Five phases, each respecting the actual dependency chains already verified in `tasks.md`/`RTM-MASTER.md` — not the original milestone numbering, which predates several amendments and is stale relative to current progress (per `RTM-AUDIT.md` §6).

### Roadmap Phase I — Wire up already-complete backend contracts (Category B, parallel, lowest risk)
| Capability | Related Requirements | Backend | Frontend | Dependencies | Remaining Tasks | Size | MVP/Post-MVP |
|---|---|---|---|---|---|---|---|
| Workflow Engine (render) | FR-WFA-1/2 | ✅ Complete | ❌ Not Started | None (T-FE-A.2✅, T-BE-B.2✅, T-BE-B.3✅ all satisfied) | T-FE-B.1, T-FE-B.2, T-FE-D.1 | M+M+M | MVP |
| Case Sheet Continuity (render) | FR-CS-1/5/6 | ✅ Complete | ✅ **Complete 2026-07-26** (`T-FE-E.1a`/`T-FE-E.1b`, commits `0ed23f7`/`c93fddf`) | None (T-0.3✅, T-BE-C.4✅) | None — `T-FE-E.1` umbrella closed | M | MVP |
| Billing Visibility (render) | FR-BILL-1/2 | ✅ Complete | ❌ Not Started | None (T-BE-F.1✅) | T-FE-E.4 | M | MVP |
| Legacy Navigation (partial — start/consultation only) | FR-LEG-1/2 | N/A | ❌ Not Started | T-FE-D.1 (this same phase) | T-FE-F.1 | M | MVP |

### Roadmap Phase II — Backend: Session Scheduling, Therapist Execution, Clinical History (parallel with each other and with Phase I)
| Capability | Related Requirements | Backend | Frontend | Dependencies | Remaining Tasks | Size | MVP/Post-MVP |
|---|---|---|---|---|---|---|---|
| Session Scheduling | FR-SCH-1/2 | 🟡 Partial → target Complete | (Phase III) | T-BE-E.1✅ (satisfied) | T-BE-E.2, T-BE-E.3, T-BE-E.5 | M+M+S | MVP |
| Therapist Execution | FR-TS-3/4/5 | ❌ → target Complete | (Phase III) | T-BE-E.3 (this phase, sequential) | T-BE-E.4 | M | MVP |
| Clinical History (backend) | FR-HIST-1/2 | ✅ **Complete 2026-07-26** (`T-BE-A.3/A.4/A.5/A.3a`) | (Phase III) | T-BE-A.1✅, T-BE-D.4✅, T-BE-E.1✅ (all satisfied) | None — backend chain closed | L+M+S | MVP |

### Roadmap Phase III — Frontend: consume Phase II backend + compose treatment/role surfaces
| Capability | Related Requirements | Backend | Frontend | Dependencies | Remaining Tasks | Size | MVP/Post-MVP |
|---|---|---|---|---|---|---|---|
| Role-Based Workflow | FR-RBAC-1 | N/A | ❌ Not Started | T-FE-D.1 (Phase I) | T-FE-E.6 | M | MVP |
| Treatment Recommendation & Plan (compose) + Session Scheduling (compose) | FR-TR-1, FR-TP-1/2, FR-TS-1/2, FR-SCH-1/2 | ✅ (creation) / 🟡 (scheduling, Phase II) | ❌ Not Started | T-BE-E.2/E.3 (Phase II) | T-FE-E.2 | M (largest remaining single task — spans two capabilities by the task plan's own design) | MVP |
| Therapist Execution (compose) | FR-TS-3/4/5 | (Phase II) | ❌ Not Started | T-BE-E.4 (Phase II) | T-FE-E.3 | M | MVP |
| Clinical History (timeline prep) | FR-HIST-1 (partial) | N/A | ❌ Not Started | T-0.6✅ (satisfied) | T-FE-C.4 | S | MVP |

### Roadmap Phase IV — Frontend: Clinical History consumption + remaining Legacy Navigation
| Capability | Related Requirements | Backend | Frontend | Dependencies | Remaining Tasks | Size | MVP/Post-MVP |
|---|---|---|---|---|---|---|---|
| Clinical History (compose) | FR-HIST-1/2 | ✅ (Phase II) | 🟡 **Partial 2026-07-26** (`T-FE-C.5`+`T-FE-C.6` complete, commits `cedee6cc`/`71e9f44d`) | T-BE-A.3/A.4/A.5 (Phase II), T-FE-C.4 (Phase III) | T-FE-C.7 | S | MVP |
| Legacy Navigation (remaining) | FR-LEG-2, FR-CR-1 | N/A | ❌ Not Started | T-0.8✅, T-BE-F.3✅ (F.2); T-FE-E.1/E.2 (Phase I/III, for F.3) | T-FE-F.2, T-FE-F.3 | M+M | MVP |

### Roadmap Phase V — Release Gate (must be last)
| Capability | Related Requirements | Backend | Frontend | Dependencies | Remaining Tasks | Size | MVP/Post-MVP |
|---|---|---|---|---|---|---|---|
| Release Readiness Proof | Cross-cutting (all) | — | — | All Phase I-IV complete | T-Z.1, T-Z.2, T-Z.3, T-Z.4 | M×4 | MVP |
| Clinical History Proof | FR-HIST-1/2 | — | — | Phase IV complete | T-Z.9 | M | MVP |

### Deferred entirely (Post-MVP, Category G — not sequenced above, may proceed independently whenever prioritized)
| Capability | Related Requirements | Remaining Tasks | Size | MVP/Post-MVP |
|---|---|---|---|---|
| Living Documents | FR-LD-1/2/3, FR-TP-3 (versioning) | T-BE-G.1, T-BE-G.2, T-BE-G.3, T-BE-D.5, T-FE-E.5 | L+M+S+L+M | Post-MVP |
| Mobile-First Presentation (polish) | FR-MOB-1 (partial), FR-MOB-2 | T-FE-G.1, T-FE-G.2 | M+M | Post-MVP |
| Performance sanity | — | T-Z.5 | S | Post-MVP |
| Legacy deprecation readiness | FR-LEG-1 (future stage) | T-Z.6 | S | Post-MVP |
| R8 handoff package | FR-RX-2 + `[R8]` markers | T-Z.7 | M | Post-MVP |
| Closure documentation | — | T-Z.8 | M | Documentation only, may happen alongside Phase V |

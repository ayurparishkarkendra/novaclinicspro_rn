/**
 * Next-Action Registry (T-FE-B.2, FR-REC-2, FR-COS-2)
 *
 * Centralized action-code -> presentation mapping. This is the ONLY
 * place an `ActionCode` string is switched on for navigation purposes —
 * `NextActionBar.tsx` must not spread a parallel switch across itself
 * and the page.
 *
 * This registry may contain ONLY presentation concerns (translation key,
 * accessibility label, an existing route builder). It must NOT determine
 * which action is recommended, whether a stage is complete, whether
 * treatment is applicable, or whether an action is clinically safe —
 * those are `resolve_clinical_workflow`'s (T-BE-B.1) job alone. This
 * file only maps a code the backend already decided into where an
 * EXISTING route already lives.
 *
 * Engineering Truth (verified by reading `clinical_workflow_resolver.py`
 * and the frontend route tree directly, not assumed):
 * - `record_assessment` / `record_prescription` /
 *   `record_treatment_recommendation` all route to the SAME existing
 *   `episodes/[episodeId]/consultation` screen — `ConsultationWorkspace
 *   Screen.tsx` already composes `CaseSheetModule`, `PrescriptionModule`,
 *   and `TreatmentRecommendationModule` together (verified via its own
 *   imports); there is no deeper per-module deep link today, and this
 *   registry does not fabricate one.
 * - `complete_visit` routes to the existing
 *   `episodes/[episodeId]/complete-consultation` screen (exact params
 *   verified: episodeId/appointmentId/clientId).
 * - `resolve_blocker` and `review_episode_disposition` ARE real values
 *   the backend resolver emits (verified: `ActionCode.RESOLVE_BLOCKER`
 *   and `ActionCode.REVIEW_EPISODE_DISPOSITION` are both assigned in
 *   `_recommend()`), but NO existing frontend route or screen exists for
 *   either (verified: no "disposition" match anywhere in `features/` or
 *   `app/`, and blocker-resolution is inherently contextual, not a
 *   single screen). Per this task's own rule ("do not invent a route"),
 *   both have `route: null` here and `NextActionBar` renders them as a
 *   non-navigable explanatory state — a reported gap, not a fabrication.
 */
export interface NextActionContext {
  episodeId: string;
  appointmentId: string;
  clientId: string;
}

// Route builders inlined here (not a separate file) to keep this task's
// declared file list exact. Both target routes already exist and are
// unmodified by this task; params verified against each route file's own
// `useLocalSearchParams<{...}>()` signature.
const EPISODE_CONSULTATION_ROUTE = (ctx: NextActionContext) => ({
  pathname: '/clinic-admin/episodes/[episodeId]/consultation',
  params: { episodeId: ctx.episodeId, appointmentId: ctx.appointmentId, clientId: ctx.clientId },
});

const EPISODE_COMPLETE_CONSULTATION_ROUTE = (ctx: NextActionContext) => ({
  pathname: '/clinic-admin/episodes/[episodeId]/complete-consultation',
  params: { episodeId: ctx.episodeId, appointmentId: ctx.appointmentId, clientId: ctx.clientId },
});

export interface NextActionRegistryEntry {
  /** Translation key under visitCommandCenter.nextActionBar.action.* */
  translationKey: string;
  /** Existing route builder, or null when no frontend route exists yet
   * for this backend-emitted action code (a reported gap, not a stop
   * condition — see this file's own header). */
  buildRoute: ((ctx: NextActionContext) => { pathname: string; params: Record<string, string> }) | null;
}

export const NEXT_ACTION_REGISTRY: Record<string, NextActionRegistryEntry> = {
  record_assessment: {
    translationKey: 'recordAssessment',
    buildRoute: (ctx) => EPISODE_CONSULTATION_ROUTE(ctx),
  },
  record_prescription: {
    translationKey: 'recordPrescription',
    buildRoute: (ctx) => EPISODE_CONSULTATION_ROUTE(ctx),
  },
  record_treatment_recommendation: {
    translationKey: 'recordTreatmentRecommendation',
    buildRoute: (ctx) => EPISODE_CONSULTATION_ROUTE(ctx),
  },
  resolve_blocker: {
    translationKey: 'resolveBlocker',
    buildRoute: null,
  },
  complete_visit: {
    translationKey: 'completeVisit',
    buildRoute: (ctx) => EPISODE_COMPLETE_CONSULTATION_ROUTE(ctx),
  },
  review_episode_disposition: {
    translationKey: 'reviewEpisodeDisposition',
    buildRoute: null,
  },
};

/**
 * T-FE-D.1 (W18 — "blocked stage shows reason + fix affordance", never a
 * dead end). A codes-only mirror of the backend's own `_STAGE_ACTION`
 * dict (`clinical_workflow_resolver.py`, verified: exactly these 4
 * entries) so `WorkflowPills` can look up "which existing action fixes
 * this blocked stage" and reuse `NEXT_ACTION_REGISTRY`'s route builder
 * above -- no new route, no new registry, no business logic. Stages with
 * no entry here (`consultation`, `treatment_plan`, `billing`) have no
 * discrete fix action in the backend either -- verified, not a
 * frontend omission.
 */
export const STAGE_TO_ACTION: Record<string, string> = {
  assessment: 'record_assessment',
  prescription: 'record_prescription',
  treatment_recommendation: 'record_treatment_recommendation',
  visit_completion: 'complete_visit',
};

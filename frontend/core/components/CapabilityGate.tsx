/**
 * <CapabilityGate>
 *
 * Release 5 (R5) · T-E.2 (design.md §12, requirements.md FR-H3, AC-12)
 *
 * The reusable conditional-rendering primitive over `useCapabilities()`
 * (T-E.1) — generalizes the ad hoc `if (flag) { ... }` pattern into one
 * component so a future screen never hand-rolls its own gate.
 *
 * **UI contract (design.md §12, binding):**
 * - **Loading** (first fetch, no cached map yet): renders `fallback` if
 *   given, else `null`. Never renders `children` optimistically before the
 *   map resolves — avoids a flash of a feature the tenant may not have.
 * - **Available + enabled**: renders `children`.
 * - **Available but not enabled** (tenant preference off): renders `null`
 *   by default; a screen wanting an "enable this" affordance passes the
 *   explicit `whenDisabled` render-prop instead of relying on gate
 *   internals.
 * - **Unavailable** (not entitled / dependency unmet / deprecated /
 *   mid-rollout-off): renders `null` by default, or the `whenUnavailable`
 *   render-prop — which receives the `blocked_reason_code` + localized
 *   reason (via `useCapabilities()`'s own `getReason`) so a screen can
 *   show an upsell. Hidden-vs-disabled is the consumer's explicit choice
 *   via which render-prop it passes — the gate never silently renders a
 *   dead/disabled control; default is hide.
 * - **Nested gates**: compose freely and independently. Each gate
 *   independently calls `useCapabilities()` (React Query dedupes by query
 *   key, so nesting never causes a duplicate network call) and re-checks
 *   its own `code` against the same cached map — there is no implicit
 *   parent-child coupling in this component. A child capability's own
 *   `effective_available` is already `false` when its parent is
 *   unavailable (the resolver's own parent-dependency rule, §7.2) — this
 *   component needs no special nesting logic to reflect that.
 * - **Error**: on a `useCapabilities()` fetch error, renders `fallback`/
 *   `null` (fail-closed — hide the gated feature rather than show it on an
 *   errored/unknown state). This codebase has no app-wide `ErrorBoundary`
 *   component today (confirmed by search — none exists), so there is
 *   nothing to explicitly re-throw into; this component simply does not
 *   add any new suppression of its own — `useCapabilities()`'s own
 *   `error` value is left exactly as React Query already surfaces it
 *   (visible via that hook's own `error` return value / any existing
 *   global query-error handling), never caught-and-hidden by this
 *   component. If an app-wide error boundary is introduced later, this
 *   component requires no change to keep working with it.
 * - **Never a security boundary**: this is visibility only. The backend's
 *   `require_permission` + capability check (T-D.2b) remain the real gate
 *   (NFR-7/AC-SEC-2/3) — a gate rendering `children` is not permission to
 *   act, only an avoidance of showing a control the user could not use.
 *
 * **Presentation-only, by construction**: this component reads ONLY
 * `useCapabilities()`'s own already-resolved `effective_available`/
 * `effective_enabled`/`blocked_reason_code` fields. It never reads
 * `clinic_type`, a plan code/string, a template, or any
 * `*_v1_enabled`-style rollout flag (`useFeatures()` is not imported here)
 * — those are exactly the six diffuse mechanisms this whole Release
 * exists to replace; re-introducing a check against one of them inside a
 * presentation component would be the regression this component's own
 * existence is meant to prevent.
 */
import React from 'react';
import { View, ViewStyle } from 'react-native';
import { useCapabilities } from '../hooks/useCapabilities';

export interface CapabilityUnavailableInfo {
  blocked_reason_code: string | null;
  reason: string;
  unmet_dependencies: string[];
}

export interface CapabilityDisabledInfo {
  code: string;
  name: string;
}

export interface CapabilityGateProps {
  /** The capability code to check (e.g. "treatment.physiotherapy"). */
  code: string;
  /** Rendered when available + enabled. */
  children: React.ReactNode;
  /** Rendered while loading (first fetch) or on a fetch error. Defaults to `null`. */
  fallback?: React.ReactNode;
  /** Rendered when available but the tenant preference is off. Defaults to `null` (hidden). */
  whenDisabled?: (info: CapabilityDisabledInfo) => React.ReactNode;
  /** Rendered when unavailable (not entitled / dependency unmet / deprecated / mid-rollout-off). Defaults to `null` (hidden). */
  whenUnavailable?: (info: CapabilityUnavailableInfo) => React.ReactNode;
}

function CapabilityGateComponent({
  code,
  children,
  fallback = null,
  whenDisabled,
  whenUnavailable,
}: CapabilityGateProps): React.ReactElement | null {
  const { capabilities, isLoading, error, getReason } = useCapabilities();

  if (isLoading || error) {
    return <>{fallback}</>;
  }

  const state = capabilities[code];

  if (!state) {
    // Code not present in the resolved map (e.g. not yet in the catalog) -
    // treat the same as unavailable, fail closed.
    if (whenUnavailable) {
      return <>{whenUnavailable({ blocked_reason_code: null, reason: getReason(code), unmet_dependencies: [] })}</>;
    }
    return null;
  }

  if (state.effective_enabled) {
    return <>{children}</>;
  }

  if (state.effective_available) {
    if (whenDisabled) {
      return <>{whenDisabled({ code: state.code, name: state.name })}</>;
    }
    return null;
  }

  if (whenUnavailable) {
    return (
      <>
        {whenUnavailable({
          blocked_reason_code: state.blocked_reason_code,
          reason: getReason(state.blocked_reason_code ?? code),
          unmet_dependencies: state.unmet_dependencies,
        })}
      </>
    );
  }
  return null;
}

/**
 * Convenience placeholder for the common "show a skeleton while loading"
 * case, e.g. `<CapabilityGate code="..." fallback={<CapabilityGate.Skeleton />}>`.
 */
function CapabilityGateSkeleton({ height = 40, style }: { height?: number; style?: ViewStyle }): React.ReactElement {
  return (
    <View
      style={[{ height, borderRadius: 8, backgroundColor: '#E5E7EB' }, style]}
      testID="capability-gate-skeleton"
    />
  );
}

export const CapabilityGate = Object.assign(CapabilityGateComponent, {
  Skeleton: CapabilityGateSkeleton,
});

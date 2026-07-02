/**
 * Phase 1 · T-D.1 — Centralized route builder (ADR-P1-04, design.md §4.D).
 *
 * The "Start consultation" destinations were previously built as duplicated
 * inline template-string literals in 3 places (`caseResolver.ts` x2,
 * `CreateConsultationScreen.tsx` x1). This module expresses each destination
 * once. Behavior-preserving: byte-identical route strings to the originals.
 */

export function consultationRoute(episodeId: string, appointmentId: string, clientId: string): string {
  return `/clinic-admin/episodes/${episodeId}/consultation?appointmentId=${appointmentId}&clientId=${clientId}`;
}

export function startConsultationRoute(appointmentId: string, clientId: string): string {
  return `/clinic-admin/appointments/${appointmentId}/start-consultation?clientId=${clientId}`;
}

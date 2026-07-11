/**
 * Clinical Services query keys (R3A · T-B.4)
 *
 * Mirrors the key-shape convention every other data domain in this codebase
 * uses (prescriptionsKeys, casesheetsKeys, treatmentSheetsKeys) so that a
 * later consumer (e.g. Billing, per Phase 2 design §9.E — out of this
 * phase's scope) has a canonical key to invalidate/read against. No query
 * hooks are defined here yet: T-B.4 only records Clinical Services
 * (session-only list, per the R3A design's own scope — see
 * ClinicalServicesModule's own docstring for why no list-by-visit query
 * exists), so there is nothing yet to list-query by.
 */

export const clinicalServicesKeys = {
  all: ['clinicalServices'] as const,
  lists: () => [...clinicalServicesKeys.all, 'list'] as const,
  byVisit: (tenantId: string, visitId: string) =>
    [...clinicalServicesKeys.lists(), tenantId, visitId] as const,
};

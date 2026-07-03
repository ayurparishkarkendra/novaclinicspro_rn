import fs from 'fs';
import path from 'path';

// R3A · T-0.3 — Source-inspection characterization of every standalone
// screen's current route-param contract and independent-fetch behavior
// (requirements.md §3.4), captured BEFORE any Phase 3A code change, as the
// BC-1 oracle Group E (T-E.1) verifies these screens against post-migration.
// None of these screens is touched by Phase 3A (Non-Goal N-4) — this test
// exists only to lock in what "unchanged" means.
//
// Source-inspection (not render tests) is used deliberately: these screens
// are out of scope for Phase 3A, so the value here is a cheap, stable
// contract snapshot, not deep behavioral coverage — mirroring the technique
// established in freshnessFeatureFlag.test.tsx's "source inspection" suite.

const read = (relativePath: string) => fs.readFileSync(path.resolve(__dirname, relativePath), 'utf8');

describe('Standalone screen contracts (R3A · T-0.3, baseline for BC-1)', () => {
  it('PrescriptionDetailScreen: receives only { clientId?, prescriptionId } and independently fetches via usePrescriptionDetailQuery', () => {
    const source = read('../../../features/prescriptions/presentation/pages/PrescriptionDetailScreen.tsx');
    expect(source).toContain("useLocalSearchParams<{ clientId?: string; prescriptionId: string }>()");
    expect(source).toContain('usePrescriptionDetailQuery(tenantId, prescriptionId)');
    // No episode/visit/context import of any kind — confirms zero coupling
    // to the consultation workspace this screen might be reached from.
    expect(source).not.toMatch(/episodeId|visitId|WorkspaceProvider|useConsultationWorkspace/);
  });

  it('CasesheetEditScreen: receives only { clientId, casesheetId }', () => {
    const source = read('../../../features/casesheets/presentation/pages/CasesheetEditScreen.tsx');
    expect(source).toContain("useLocalSearchParams<{ clientId: string; casesheetId: string }>()");
    expect(source).not.toMatch(/episodeId|visitId|WorkspaceProvider|useConsultationWorkspace/);
  });

  it('CreateCasesheetScreen: receives { clientId, appointmentId?, episodeId? } and independently fetches Appointment + Episode data of its own', () => {
    const source = read('../../../features/casesheets/presentation/pages/CreateCasesheetScreen.tsx');
    expect(source).toContain("useLocalSearchParams<{ clientId: string; appointmentId?: string; episodeId?: string }>()");
    // Confirms the §3.4 duplicate-context-passing finding: this screen
    // independently re-fetches Appointment/Episode rather than receiving
    // an already-loaded object from wherever the doctor navigated from.
    expect(source).toContain('useAppointmentDetailQuery');
    expect(source).toContain('useEpisodeDetailsQuery');
  });

  it('TenantInvoiceDetailScreen: receives only { invoiceId }', () => {
    const source = read('../../../features/billing/presentation/pages/TenantInvoiceDetailScreen.tsx');
    expect(source).toContain("useLocalSearchParams<{ invoiceId: string }>()");
    expect(source).not.toMatch(/episodeId|visitId|clinicalService|WorkspaceProvider/i);
  });

  it('TenantPaymentsListScreen: receives no route params at all (a plain list screen, not scoped to any consultation context)', () => {
    const source = read('../../../features/billing/presentation/pages/TenantPaymentsListScreen.tsx');
    expect(source).not.toContain('useLocalSearchParams');
  });

  it('TreatmentSheetDetailScreen: receives only { treatmentSheetId, casesheetId? } as INCOMING route params; any episodeId used elsewhere is derived from its own fetched treatmentSheet data for outgoing navigation only, never received as context', () => {
    const source = read('../../../features/treatmentSheets/presentation/pages/TreatmentSheetDetailScreen.tsx');
    expect(source).toContain("useLocalSearchParams<{ treatmentSheetId: string; casesheetId?: string }>()");
    expect(source).not.toMatch(/visitId|WorkspaceProvider|useConsultationWorkspace/);
    // episodeId does appear, but only as `treatmentSheet.episode_id` — this
    // screen's own fetched data used for outgoing navigation, not an
    // incoming prop/context dependency. Recorded explicitly so a future
    // reader doesn't mistake this for context coupling.
    expect(source).toContain('episodeId: treatmentSheet.episode_id');
    expect(source).not.toMatch(/useLocalSearchParams<\{[^}]*episodeId/);
  });

  it('BulkSchedulePlanScreen: receives only { treatmentSheetId }', () => {
    const source = read('../../../features/treatmentSheets/presentation/pages/BulkSchedulePlanScreen.tsx');
    expect(source).toContain("useLocalSearchParams<{ treatmentSheetId: string }>()");
    expect(source).not.toMatch(/episodeId|visitId|WorkspaceProvider|useConsultationWorkspace/);
  });
});

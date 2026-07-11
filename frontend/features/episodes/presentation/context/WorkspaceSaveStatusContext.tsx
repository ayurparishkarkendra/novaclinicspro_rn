/**
 * Workspace Save-Status aggregation (R3A · T-D.1, ADR-R3A-03)
 *
 * A SEPARATE context from ClinicalWorkspaceContext.tsx's WorkspaceContext —
 * deliberately, not bundled into the same value object. Persistent Context
 * (Patient/Episode/Visit) is proven stable across re-renders
 * (persistentContextContinuity.test.tsx, T-C.1); save status changes far
 * more often (every keystroke's debounce, every save, every 2s idle-fade).
 * If save status lived in the same memoized WorkspaceContextValue, every
 * status change would force a new object identity for patient/episode/visit
 * too, breaking T-C.1's guarantee for every module. Splitting into two
 * independent React contexts means a save-status update only re-renders
 * WorkspaceHeader (the only consumer of useWorkspaceSaveStatuses()), never
 * the four modules that only read Patient/Episode/Visit identity.
 *
 * Ownership (Doc 06 §5, design.md §4/§8 ADR-R3A-03): each module remains the
 * SOLE owner and writer of its own save status — it already computes that
 * status via its own unchanged save/validation logic (Group B). This
 * context adds nothing to that computation; each module just additionally
 * reports its own already-computed status here, via useReportSaveStatus(),
 * so WorkspaceHeader can read it BY REFERENCE (not by copy — Doc 06 §5) for
 * an at-a-glance aggregate. useReportSaveStatus()'s own identity never
 * changes (empty-dep useCallback + a functional setState updater), so a
 * module reporting its own status doesn't re-render any other module that
 * also holds a reference to the same reporter function.
 */

import React, { createContext, ReactNode, useCallback, useContext, useState } from 'react';
import { SectionKey, SectionSaveStatus } from '../hooks/useConsultationWorkspace';

export type WorkspaceSaveStatuses = Partial<Record<SectionKey, SectionSaveStatus>>;
export type ReportSaveStatusFn = (key: SectionKey, status: SectionSaveStatus) => void;

const ReportSaveStatusContext = createContext<ReportSaveStatusFn | undefined>(undefined);
const SaveStatusesContext = createContext<WorkspaceSaveStatuses | undefined>(undefined);

export const WorkspaceSaveStatusProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [saveStatuses, setSaveStatuses] = useState<WorkspaceSaveStatuses>({});

  const reportSaveStatus = useCallback<ReportSaveStatusFn>((key, status) => {
    setSaveStatuses((prev) => (prev[key] === status ? prev : { ...prev, [key]: status }));
  }, []);

  return (
    <ReportSaveStatusContext.Provider value={reportSaveStatus}>
      <SaveStatusesContext.Provider value={saveStatuses}>{children}</SaveStatusesContext.Provider>
    </ReportSaveStatusContext.Provider>
  );
};

/** Each module calls this to report ONLY its own save status — never reads or writes any other module's key (ADR-R3A-03: never becomes a second owner). */
export function useReportSaveStatus(): ReportSaveStatusFn {
  const ctx = useContext(ReportSaveStatusContext);
  if (!ctx) {
    throw new Error('useReportSaveStatus must be used within a WorkspaceSaveStatusProvider');
  }
  return ctx;
}

/** WorkspaceHeader-only: reads every module's save status for a single at-a-glance aggregate. Read-only — never call this to set a status. */
export function useWorkspaceSaveStatuses(): WorkspaceSaveStatuses {
  const ctx = useContext(SaveStatusesContext);
  if (!ctx) {
    throw new Error('useWorkspaceSaveStatuses must be used within a WorkspaceSaveStatusProvider');
  }
  return ctx;
}

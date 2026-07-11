/**
 * Episode Workspace Role Configuration
 *
 * Open/Closed Principle: add new roles by extending this map,
 * not by branching inside components.
 *
 * Each config controls:
 *  - canEditNotes: whether Visit Notes tab is editable
 *  - canSchedule: whether admin scheduling CTAs are shown
 *  - canWriteRx: whether "New Prescription" CTA is shown
 *  - canCreateTreatmentSheet: whether doctor can create a new treatment sheet
 */

export type WorkspaceMode = 'doctor' | 'admin';

export interface EpisodeWorkspaceRoleConfig {
  canEditNotes: boolean;
  canSchedule: boolean;
  canWriteRx: boolean;
  canCreateTreatmentSheet: boolean;
}

export const episodeWorkspaceConfigByRole: Record<WorkspaceMode, EpisodeWorkspaceRoleConfig> = {
  doctor: {
    canEditNotes: true,
    canSchedule: false,
    canWriteRx: true,
    canCreateTreatmentSheet: true,
  },
  admin: {
    canEditNotes: false,
    canSchedule: true,
    canWriteRx: false,
    canCreateTreatmentSheet: false,
  },
};

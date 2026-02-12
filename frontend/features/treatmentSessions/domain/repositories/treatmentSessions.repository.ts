/**
 * Treatment Sessions Repository Interface
 * Defines the contract for treatment session data operations
 */

import {
  TreatmentSessionCreate,
  TreatmentSessionUpdate,
  TreatmentSessionResponse,
  ListTreatmentSessionsParams,
  PaginatedTreatmentSessionsResponse,
} from '../../data/models/treatmentSessions.dtos';

/**
 * Treatment sessions repository interface
 */
export interface ITreatmentSessionsRepository {
  listSessions(
    tenantId: string,
    params?: ListTreatmentSessionsParams
  ): Promise<PaginatedTreatmentSessionsResponse>;
  getSession(tenantId: string, sessionId: string): Promise<TreatmentSessionResponse>;
  createSession(tenantId: string, data: TreatmentSessionCreate): Promise<TreatmentSessionResponse>;
  updateSession(
    tenantId: string,
    sessionId: string,
    data: TreatmentSessionUpdate
  ): Promise<TreatmentSessionResponse>;
  deleteSession(tenantId: string, sessionId: string): Promise<void>;
  startSession(tenantId: string, sessionId: string): Promise<TreatmentSessionResponse>;
  completeSession(
    tenantId: string,
    sessionId: string,
    payload?: { observations?: string; progress_notes?: string }
  ): Promise<TreatmentSessionResponse>;
}

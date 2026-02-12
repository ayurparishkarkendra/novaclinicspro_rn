/**
 * Treatment Session Entity
 * Domain model for treatment sessions
 */

import { SessionStatus } from '../../data/models/treatmentSessions.dtos';

/**
 * Treatment session entity
 */
export interface TreatmentSession {
  id: string;
  tenantId: string;
  appointmentId: string;
  clientId: string;
  therapistId: string | null;
  treatmentId: string | null;
  roomId: string | null;
  scheduledStart: Date;
  scheduledEnd: Date | null;
  actualStart: Date | null;
  actualEnd: Date | null;
  status: SessionStatus;
  notes: string | null;
  observations: string | null;
  progressNotes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Treatment session summary for list views
 */
export interface TreatmentSessionSummary {
  id: string;
  clientName: string;
  therapistName: string | null;
  treatmentName: string | null;
  scheduledStart: Date;
  status: SessionStatus;
}

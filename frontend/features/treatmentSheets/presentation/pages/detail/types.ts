import { TreatmentRowOrderResponse } from '../../../data/models/treatmentOrders.dtos';

export interface RowFormData {
  id: string;
  day_number: number;
  session_date: string | null;
  session_id: string | null;
  scheduled_time: string | null;
  therapist_id: string | null;
  treatment_name: string;
  medicines_text: string;
  instructions_text: string;
  isSaving: boolean;
  isEditing: boolean;
}

export type ScheduleRow = TreatmentRowOrderResponse;

export interface HeaderEntity {
  title?: string;
  client_id?: string;
  [key: string]: unknown;
}

export interface ClientEntity {
  name?: string;
  full_name?: string;
  [key: string]: unknown;
}

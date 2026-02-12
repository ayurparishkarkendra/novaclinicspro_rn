/**
 * Appointment Rules DTOs
 * Data Transfer Objects for Appointment Rules API
 */

// ============================================
// APPOINTMENT RULE TYPES
// ============================================

export type RuleCode = 
  | 'slot_duration'
  | 'buffer_time'
  | 'max_advance_booking_days'
  | 'min_advance_booking_hours'
  | 'overbooking_limit'
  | 'gender_matching'
  | 'cancellation_window_hours'
  | 'reschedule_window_hours'
  | 'therapist_assignment'
  | 'room_assignment';

export const RULE_METADATA: Record<RuleCode, {
  label: string;
  description: string;
  icon: string;
  color: string;
  unit?: string;
  valueType: 'number' | 'boolean' | 'object';
  defaultValue: any;
}> = {
  slot_duration: {
    label: 'Slot Duration',
    description: 'Default duration for appointment slots',
    icon: 'time-outline',
    color: '#2F6F4E',
    unit: 'minutes',
    valueType: 'number',
    defaultValue: 30,
  },
  buffer_time: {
    label: 'Buffer Time',
    description: 'Time gap between consecutive appointments',
    icon: 'hourglass-outline',
    color: '#C28A4B',
    unit: 'minutes',
    valueType: 'number',
    defaultValue: 15,
  },
  max_advance_booking_days: {
    label: 'Max Advance Booking',
    description: 'How far in advance patients can book',
    icon: 'calendar-outline',
    color: '#3B82F6',
    unit: 'days',
    valueType: 'number',
    defaultValue: 30,
  },
  min_advance_booking_hours: {
    label: 'Min Advance Booking',
    description: 'Minimum notice required for new bookings',
    icon: 'alarm-outline',
    color: '#EF4444',
    unit: 'hours',
    valueType: 'number',
    defaultValue: 2,
  },
  overbooking_limit: {
    label: 'Overbooking Limit',
    description: 'Maximum appointments per slot beyond capacity',
    icon: 'people-outline',
    color: '#8B5CF6',
    unit: '',
    valueType: 'number',
    defaultValue: 0,
  },
  gender_matching: {
    label: 'Gender Matching',
    description: 'Prefer same-gender therapist for treatments',
    icon: 'person-outline',
    color: '#EC4899',
    valueType: 'boolean',
    defaultValue: false,
  },
  cancellation_window_hours: {
    label: 'Cancellation Window',
    description: 'Hours before appointment when cancellation is free',
    icon: 'close-circle-outline',
    color: '#F59E0B',
    unit: 'hours',
    valueType: 'number',
    defaultValue: 24,
  },
  reschedule_window_hours: {
    label: 'Reschedule Window',
    description: 'Hours before appointment when rescheduling is allowed',
    icon: 'sync-outline',
    color: '#10B981',
    unit: 'hours',
    valueType: 'number',
    defaultValue: 12,
  },
  therapist_assignment: {
    label: 'Therapist Assignment',
    description: 'Rules for assigning therapists to treatments',
    icon: 'medkit-outline',
    color: '#6366F1',
    valueType: 'object',
    defaultValue: { auto_assign: true, prefer_previous: true },
  },
  room_assignment: {
    label: 'Room Assignment',
    description: 'Rules for assigning rooms to appointments',
    icon: 'business-outline',
    color: '#14B8A6',
    valueType: 'object',
    defaultValue: { auto_assign: true, optimize_utilization: true },
  },
};

// ============================================
// API RESPONSE TYPES
// ============================================

export interface AppointmentRuleResponse {
  id: string;
  tenant_id: string;
  rule_code: RuleCode;
  org_default_config: Record<string, any>;
  tenant_override_config: Record<string, any> | null;
  effective_config: Record<string, any>;
  is_override_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AppointmentRulesListResponse {
  items: AppointmentRuleResponse[];
  total: number;
}

// ============================================
// API REQUEST TYPES
// ============================================

export interface TenantRuleOverrideRequest {
  override_config: Record<string, any>;
  is_override_active?: boolean;
}

// ============================================
// QUERY KEYS
// ============================================

export const appointmentRulesKeys = {
  all: ['appointmentRules'] as const,
  lists: () => [...appointmentRulesKeys.all, 'list'] as const,
  list: (tenantId: string) => [...appointmentRulesKeys.lists(), tenantId] as const,
  detail: (tenantId: string, ruleCode: string) => [...appointmentRulesKeys.all, tenantId, ruleCode] as const,
};

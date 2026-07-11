/**
 * Doctor Dashboard DTOs
 * Data Transfer Objects matching the backend KPI API response
 * 
 * API Support Status:
 * - Doctor KPIs: SUPPORTED via GET /api/v1/clinic/{tenant_id}/staff/{staff_id}/kpis
 * - Dashboard/Worklist: SUPPORTED via existing staff dashboard API
 * - Feedback: SUPPORTED via feedback module
 */

// ============================================
// KPI PERIOD TYPES
// ============================================

/** KPI period type options */
export type KPIPeriodType = '7d' | '30d' | '90d' | 'custom';

/** KPI query parameters */
export interface DoctorKpiQueryParams {
  period: KPIPeriodType;
  from_date?: string; // Required if period='custom'
  to_date?: string;   // Required if period='custom'
}

// ============================================
// KPI RESPONSE DTOs (Backend Schema)
// ============================================

/** Peak hour item from backend */
export interface PeakHourDTO {
  hour: number; // 0-23
  count: number;
  label: string; // e.g., "9 AM - 10 AM"
}

/** Busiest day item from backend */
export interface BusiestDayDTO {
  day_of_week: number; // 0=Monday, 6=Sunday
  day_name: string; // "Monday", "Tuesday", etc.
  count: number;
}

/** Period metadata from KPI response */
export interface KpiPeriodDTO {
  start_date: string; // ISO date
  end_date: string;   // ISO date
  days: number;
  period_type: KPIPeriodType;
}

/** Consultation metrics from KPI response */
export interface ConsultationsDTO {
  total_scheduled: number;
  total_completed: number;
  total_cancelled: number;
  total_no_show: number;
  completion_rate: number;    // 0-100
  no_show_rate: number;       // 0-100
  cancellation_rate: number;  // 0-100
}

/** Patient metrics from KPI response */
export interface PatientsDTO {
  total_unique: number;
  new_patients: number;
  returning_patients: number;
  retention_rate: number; // 0-100
}

/** Clinical productivity metrics from KPI response */
export interface ClinicalProductivityDTO {
  casesheets_created: number;
  prescriptions_written: number;
  treatment_sheets_created: number;
  documents_signed: number;
  avg_documents_per_consultation: number;
}

/** Time metrics from KPI response */
export interface TimeMetricsDTO {
  avg_consultation_duration_minutes: number;
  peak_hours: PeakHourDTO[];
  busiest_days: BusiestDayDTO[];
}

/** Full KPI response from backend */
export interface DoctorKpiResponseDTO {
  staff_id: string;
  staff_name: string;
  period: KpiPeriodDTO;
  consultations: ConsultationsDTO;
  patients: PatientsDTO;
  clinical_productivity: ClinicalProductivityDTO;
  time_metrics: TimeMetricsDTO;
  // Optional patient satisfaction (if available)
  patient_satisfaction?: {
    average_rating: number;
    total_responses: number;
    response_rate: number;
  };
}

// ============================================
// UI CARD TYPES
// ============================================

/** Stat card item for display */
export interface KpiStatCardItem {
  label: string;
  value: string | number;
  icon: string;
  color: string;
  subtext?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
}

/** Time bar item for simple visualization */
export interface TimeBarItem {
  label: string;
  value: number;
  maxValue: number;
  color?: string;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/** Format percentage for display */
export const formatPercentage = (value: number): string => {
  return `${Math.round(value)}%`;
};

/** Format duration in minutes */
export const formatDuration = (minutes: number): string => {
  if (minutes < 60) {
    return `${Math.round(minutes)} min`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
};

/** Get period label for display */
export const getPeriodLabel = (period: KPIPeriodType): string => {
  const labels: Record<KPIPeriodType, string> = {
    '7d': 'Last 7 Days',
    '30d': 'Last 30 Days',
    '90d': 'Last 90 Days',
    'custom': 'Custom Range',
  };
  return labels[period];
};

/** Validate custom date range */
export const validateCustomDateRange = (
  fromDate?: string,
  toDate?: string
): { valid: boolean; error?: string } => {
  if (!fromDate || !toDate) {
    return { valid: false, error: 'Both start and end dates are required' };
  }
  
  const from = new Date(fromDate);
  const to = new Date(toDate);
  
  if (isNaN(from.getTime()) || isNaN(to.getTime())) {
    return { valid: false, error: 'Invalid date format' };
  }
  
  if (from > to) {
    return { valid: false, error: 'Start date must be before end date' };
  }
  
  const daysDiff = Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
  if (daysDiff > 365) {
    return { valid: false, error: 'Date range cannot exceed 365 days' };
  }
  
  return { valid: true };
};

/** Get color based on rate (for completion rate, etc.) */
export const getRateColor = (rate: number, type: 'positive' | 'negative' = 'positive'): string => {
  if (type === 'positive') {
    // Higher is better (completion rate, retention)
    if (rate >= 80) return '#10b981'; // success
    if (rate >= 60) return '#f59e0b'; // warning
    return '#ef4444'; // error
  } else {
    // Lower is better (no-show rate, cancellation)
    if (rate <= 10) return '#10b981'; // success
    if (rate <= 25) return '#f59e0b'; // warning
    return '#ef4444'; // error
  }
};

/** Map KPI response to consultation stat cards */
export const mapConsultationsToCards = (
  consultations: ConsultationsDTO
): KpiStatCardItem[] => {
  return [
    {
      label: 'Completed',
      value: consultations.total_completed,
      icon: 'checkmark-circle',
      color: '#10b981',
    },
    {
      label: 'Scheduled',
      value: consultations.total_scheduled,
      icon: 'calendar',
      color: '#2563eb',
    },
    {
      label: 'No-Shows',
      value: consultations.total_no_show,
      icon: 'close-circle',
      color: getRateColor(consultations.no_show_rate, 'negative'),
    },
    {
      label: 'Cancelled',
      value: consultations.total_cancelled,
      icon: 'remove-circle',
      color: getRateColor(consultations.cancellation_rate, 'negative'),
    },
  ];
};

/** Map KPI response to patient stat cards */
export const mapPatientsToCards = (
  patients: PatientsDTO
): KpiStatCardItem[] => {
  return [
    {
      label: 'Total Patients',
      value: patients.total_unique,
      icon: 'people',
      color: '#2563eb',
    },
    {
      label: 'New Patients',
      value: patients.new_patients,
      icon: 'person-add',
      color: '#10b981',
    },
    {
      label: 'Returning',
      value: patients.returning_patients,
      icon: 'refresh',
      color: '#7c3aed',
    },
  ];
};

/** Map KPI response to productivity stat cards */
export const mapProductivityToCards = (
  productivity: ClinicalProductivityDTO
): KpiStatCardItem[] => {
  return [
    {
      label: 'Casesheets',
      value: productivity.casesheets_created,
      icon: 'document-text',
      color: '#2563eb',
    },
    {
      label: 'Prescriptions',
      value: productivity.prescriptions_written,
      icon: 'medkit',
      color: '#10b981',
    },
    {
      label: 'Treatment Sheets',
      value: productivity.treatment_sheets_created,
      icon: 'clipboard',
      color: '#7c3aed',
    },
    {
      label: 'Documents Signed',
      value: productivity.documents_signed,
      icon: 'create',
      color: '#f59e0b',
    },
  ];
};

/** Map peak hours to time bars */
export const mapPeakHoursToBars = (
  peakHours: PeakHourDTO[],
  limit: number = 3
): TimeBarItem[] => {
  const maxCount = Math.max(...peakHours.map(h => h.count), 1);
  return peakHours
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
    .map(hour => ({
      label: hour.label,
      value: hour.count,
      maxValue: maxCount,
      color: '#2563eb',
    }));
};

/** Map busiest days to time bars */
export const mapBusiestDaysToBars = (
  busiestDays: BusiestDayDTO[],
  limit: number = 3
): TimeBarItem[] => {
  if (!busiestDays || busiestDays.length === 0) return [];
  
  const maxCount = Math.max(...busiestDays.map(d => d.count), 1);
  return busiestDays
    .filter(day => day && day.day_name) // Filter out invalid entries
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
    .map(day => ({
      label: day.day_name.substring(0, 3), // Mon, Tue, etc.
      value: day.count,
      maxValue: maxCount,
      color: '#7c3aed',
    }));
};

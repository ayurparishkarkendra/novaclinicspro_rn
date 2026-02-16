/**
 * Doctor KPI Entity
 * Domain entity for doctor KPI data with business logic helpers
 */

import type {
  DoctorKpiResponseDTO,
  ConsultationsDTO,
  PatientsDTO,
  ClinicalProductivityDTO,
  TimeMetricsDTO,
  KpiPeriodDTO,
  KpiStatCardItem,
  TimeBarItem,
} from '../../data/models/doctorKpis.dtos';

import {
  mapConsultationsToCards,
  mapPatientsToCards,
  mapProductivityToCards,
  mapPeakHoursToBars,
  mapBusiestDaysToBars,
  formatDuration,
} from '../../data/models/doctorKpis.dtos';

// ============================================
// DOMAIN ENTITY
// ============================================

/**
 * Doctor KPI Summary - Domain entity
 * Wraps the backend response with UI-ready computed properties
 */
export interface DoctorKpiSummary {
  // Identity
  staffId: string;
  staffName: string;
  
  // Period info
  period: {
    startDate: string;
    endDate: string;
    days: number;
    type: string;
    label: string;
  };
  
  // Raw metrics (from backend)
  consultations: ConsultationsDTO;
  patients: PatientsDTO;
  productivity: ClinicalProductivityDTO;
  timeMetrics: TimeMetricsDTO;
  
  // Patient satisfaction (optional)
  patientSatisfaction?: {
    averageRating: number;
    totalResponses: number;
    responseRate: number;
  };
  
  // UI-ready card data
  consultationCards: KpiStatCardItem[];
  patientCards: KpiStatCardItem[];
  productivityCards: KpiStatCardItem[];
  
  // Time metrics visualization
  peakHoursBars: TimeBarItem[];
  busiestDaysBars: TimeBarItem[];
  avgConsultationDuration: string;
}

// ============================================
// MAPPER FUNCTION
// ============================================

/**
 * Map backend KPI response to domain entity
 */
export const mapToDoctorKpiSummary = (
  response: DoctorKpiResponseDTO
): DoctorKpiSummary => {
  // Get period label
  const periodLabel = getPeriodDisplayLabel(response.period);

  return {
    staffId: response.staff_id,
    staffName: response.staff_name,
    
    period: {
      startDate: response.period.start_date,
      endDate: response.period.end_date,
      days: response.period.days,
      type: response.period.period_type,
      label: periodLabel,
    },
    
    consultations: response.consultations,
    patients: response.patients,
    productivity: response.clinical_productivity,
    timeMetrics: response.time_metrics,
    
    patientSatisfaction: response.patient_satisfaction
      ? {
          averageRating: response.patient_satisfaction.average_rating,
          totalResponses: response.patient_satisfaction.total_responses,
          responseRate: response.patient_satisfaction.response_rate,
        }
      : undefined,
    
    consultationCards: mapConsultationsToCards(response.consultations),
    patientCards: mapPatientsToCards(response.patients),
    productivityCards: mapProductivityToCards(response.clinical_productivity),
    
    peakHoursBars: mapPeakHoursToBars(response.time_metrics.peak_hours, 3),
    busiestDaysBars: mapBusiestDaysToBars(response.time_metrics.busiest_days, 3),
    avgConsultationDuration: formatDuration(
      response.time_metrics.avg_consultation_duration_minutes
    ),
  };
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get display label for period
 */
const getPeriodDisplayLabel = (period: KpiPeriodDTO): string => {
  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
    });
  };

  switch (period.period_type) {
    case '7d':
      return 'Last 7 Days';
    case '30d':
      return 'Last 30 Days';
    case '90d':
      return 'Last 90 Days';
    case 'custom':
      return `${formatDate(period.start_date)} - ${formatDate(period.end_date)}`;
    default:
      return `${period.days} Days`;
  }
};

/**
 * Check if KPI data is empty (no activity)
 */
export const isKpiDataEmpty = (summary: DoctorKpiSummary): boolean => {
  return (
    summary.consultations.total_scheduled === 0 &&
    summary.patients.total_unique === 0 &&
    summary.productivity.casesheets_created === 0
  );
};

/**
 * Get overall performance indicator
 */
export const getPerformanceIndicator = (
  summary: DoctorKpiSummary
): 'excellent' | 'good' | 'needs_attention' => {
  const completionRate = summary.consultations.completion_rate;
  const noShowRate = summary.consultations.no_show_rate;
  
  if (completionRate >= 85 && noShowRate <= 10) {
    return 'excellent';
  }
  if (completionRate >= 70 && noShowRate <= 20) {
    return 'good';
  }
  return 'needs_attention';
};

/**
 * Format period for API request
 */
export const formatPeriodForApi = (
  period: string,
  fromDate?: string,
  toDate?: string
): { period: string; from_date?: string; to_date?: string } => {
  if (period === 'custom' && fromDate && toDate) {
    return {
      period: 'custom',
      from_date: fromDate,
      to_date: toDate,
    };
  }
  return { period };
};

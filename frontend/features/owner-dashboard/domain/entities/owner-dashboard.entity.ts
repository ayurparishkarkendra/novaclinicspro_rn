/**
 * Owner Dashboard Domain Entities
 * Types for the clinic owner portfolio dashboard
 */

/**
 * Metric value type for placeholder contract
 * Used when backend APIs may not be available
 */
export type MetricValue =
  | { status: 'available'; value: number }
  | { status: 'unavailable'; reason: 'api_not_ready' };

/**
 * Helper to create an available metric
 */
export const availableMetric = (value: number): MetricValue => ({
  status: 'available',
  value,
});

/**
 * Helper to create an unavailable metric
 */
export const unavailableMetric = (): MetricValue => ({
  status: 'unavailable',
  reason: 'api_not_ready',
});

/**
 * Check if metric is available
 */
export const isMetricAvailable = (metric: MetricValue): metric is { status: 'available'; value: number } => {
  return metric.status === 'available';
};

/**
 * Get metric value or default
 */
export const getMetricValueOrDefault = (metric: MetricValue, defaultValue: number = 0): number => {
  return isMetricAvailable(metric) ? metric.value : defaultValue;
};

/**
 * Owner portfolio summary with metrics
 */
export interface OwnerPortfolioSummary {
  totalClinics: MetricValue;
  totalActiveStaff: MetricValue;
  appointmentsToday: MetricValue;
  appointmentsWeek: MetricValue;
  revenueThisMonth: MetricValue;
}

/**
 * Per-clinic summary in owner dashboard
 */
export interface OwnerClinicSummary {
  tenantId: string;
  clinicName: string;
  city?: string;
  isPrimary?: boolean;
  // Mini metrics per clinic
  activeStaff: MetricValue;
  appointmentsToday: MetricValue;
  pendingTasks: MetricValue;
}

/**
 * Create default owner portfolio summary (all metrics unavailable)
 */
export const createDefaultPortfolioSummary = (): OwnerPortfolioSummary => ({
  totalClinics: unavailableMetric(),
  totalActiveStaff: unavailableMetric(),
  appointmentsToday: unavailableMetric(),
  appointmentsWeek: unavailableMetric(),
  revenueThisMonth: unavailableMetric(),
});

/**
 * Create portfolio summary from owned clinics count
 * Other metrics remain unavailable until backend support
 */
export const createPortfolioSummaryFromClinics = (clinicsCount: number): OwnerPortfolioSummary => ({
  totalClinics: availableMetric(clinicsCount),
  totalActiveStaff: unavailableMetric(),
  appointmentsToday: unavailableMetric(),
  appointmentsWeek: unavailableMetric(),
  revenueThisMonth: unavailableMetric(),
});

/**
 * Create clinic summary from owned clinic
 */
export const createClinicSummary = (clinic: {
  tenantId: string;
  clinicName: string;
  city?: string;
  isPrimary?: boolean;
}): OwnerClinicSummary => ({
  tenantId: clinic.tenantId,
  clinicName: clinic.clinicName,
  city: clinic.city,
  isPrimary: clinic.isPrimary,
  // All per-clinic metrics unavailable until backend support
  activeStaff: unavailableMetric(),
  appointmentsToday: unavailableMetric(),
  pendingTasks: unavailableMetric(),
});

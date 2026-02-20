/**
 * Feedback Domain Entities
 * Business logic helpers for feedback data
 */

import type {
  PatientSatisfactionMetrics,
  StaffKPIResponse,
  StaffFeedbackItem,
  ClinicFeedbackSummaryResponse,
  TrendDirection,
} from '../../data/models/feedback.dtos';

// ==================== Rating Helpers ====================

/**
 * Get display text for a numeric rating
 */
export function getRatingLabel(rating: number): string {
  if (rating >= 4.5) return 'Excellent';
  if (rating >= 3.5) return 'Good';
  if (rating >= 2.5) return 'Average';
  if (rating >= 1.5) return 'Below Average';
  return 'Poor';
}

/**
 * Get color for rating value
 */
export function getRatingColor(rating: number): string {
  if (rating >= 4) return '#10b981'; // success
  if (rating >= 3) return '#f59e0b'; // warning
  return '#ef4444'; // error
}

/**
 * Format rating for display (e.g., "4.5/5")
 */
export function formatRating(rating: number): string {
  return `${rating.toFixed(1)}/5`;
}

/**
 * Get star icons array for rating display
 */
export function getStarIcons(rating: number): ('star' | 'star-half' | 'star-outline')[] {
  const stars: ('star' | 'star-half' | 'star-outline')[] = [];
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  
  for (let i = 0; i < 5; i++) {
    if (i < fullStars) {
      stars.push('star');
    } else if (i === fullStars && hasHalfStar) {
      stars.push('star-half');
    } else {
      stars.push('star-outline');
    }
  }
  
  return stars;
}

// ==================== KPI Helpers ====================

/**
 * Calculate derived metrics from KPI response
 */
export interface DerivedKpiMetrics {
  completionRate: number;
  noShowRate: number;
  retentionRate: number;
  avgRating: number;
  responseRate: number;
  trend: TrendDirection;
}

export function deriveKpiMetrics(kpi: StaffKPIResponse): DerivedKpiMetrics {
  return {
    completionRate: kpi.consultations.completion_rate,
    noShowRate: kpi.consultations.no_show_rate,
    retentionRate: kpi.patients.retention_rate,
    avgRating: kpi.patient_satisfaction.average_rating,
    responseRate: kpi.patient_satisfaction.response_rate,
    trend: kpi.patient_satisfaction.trend,
  };
}

/**
 * Format percentage for display
 */
export function formatPercentage(value: number): string {
  return `${Math.round(value)}%`;
}

/**
 * Convert KPI to stat card format
 */
export interface KpiStatCard {
  label: string;
  value: string;
  icon: string;
  color: string;
  subtext?: string;
}

export function kpiToStatCards(kpi: StaffKPIResponse): KpiStatCard[] {
  return [
    {
      label: 'Consultations',
      value: kpi.consultations.total.toString(),
      icon: 'calendar',
      color: '#2563eb',
      subtext: `${formatPercentage(kpi.consultations.completion_rate)} completed`,
    },
    {
      label: 'Patients',
      value: kpi.patients.unique_patients.toString(),
      icon: 'people',
      color: '#10b981',
      subtext: `${kpi.patients.new_patients} new`,
    },
    {
      label: 'Satisfaction',
      value: formatRating(kpi.patient_satisfaction.average_rating),
      icon: 'star',
      color: getRatingColor(kpi.patient_satisfaction.average_rating),
      subtext: `${kpi.patient_satisfaction.total_responses} responses`,
    },
    {
      label: 'Documents',
      value: kpi.productivity.documents_created.toString(),
      icon: 'document-text',
      color: '#7c3aed',
      subtext: `${kpi.productivity.prescriptions_issued} prescriptions`,
    },
  ];
}

// ==================== Feedback List Helpers ====================

/**
 * Check if feedback item needs attention
 */
export function needsAttention(item: StaffFeedbackItem): boolean {
  return item.needs_attention || item.rating <= 2;
}

/**
 * Group feedback items by date
 */
export function groupFeedbackByDate(items: StaffFeedbackItem[]): Map<string, StaffFeedbackItem[]> {
  const grouped = new Map<string, StaffFeedbackItem[]>();
  
  for (const item of items) {
    const date = item.appointment_date.split('T')[0];
    const existing = grouped.get(date) || [];
    grouped.set(date, [...existing, item]);
  }
  
  return grouped;
}

/**
 * Sort feedback items by submitted date (newest first)
 */
export function sortFeedbackByDate(items: StaffFeedbackItem[]): StaffFeedbackItem[] {
  return [...items].sort((a, b) => 
    new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime()
  );
}

// ==================== Clinic Summary Helpers ====================

/**
 * Get rating distribution as percentage array
 */
export function getRatingDistributionPercentages(
  distribution: ClinicFeedbackSummaryResponse['rating_distribution'],
  total: number
): { rating: number; count: number; percentage: number }[] {
  if (total === 0) {
    return [1, 2, 3, 4, 5].map(r => ({ rating: r, count: 0, percentage: 0 }));
  }

  return [1, 2, 3, 4, 5].map(rating => ({
    rating,
    count: distribution[rating.toString() as keyof typeof distribution],
    percentage: (distribution[rating.toString() as keyof typeof distribution] / total) * 100,
  }));
}

/**
 * Calculate NPS-like score from rating distribution
 */
export function calculateSatisfactionScore(
  distribution: ClinicFeedbackSummaryResponse['rating_distribution'],
  total: number
): number {
  if (total === 0) return 0;
  
  const promoters = distribution['5'] + distribution['4'];
  const detractors = distribution['1'] + distribution['2'];
  
  return Math.round(((promoters - detractors) / total) * 100);
}

/**
 * Format ambience score for display
 */
export function formatAmbienceScore(score: number): string {
  if (score === 0) return 'N/A';
  return score.toFixed(1);
}

/**
 * Get ambience scores as array for display
 */
export interface AmbienceScoreItem {
  key: string;
  label: string;
  score: number;
  icon: string;
}

export function getAmbienceScoreItems(
  scores: ClinicFeedbackSummaryResponse['ambience_scores']
): AmbienceScoreItem[] {
  // Handle case where scores might be undefined or null
  if (!scores) {
    return [
      { key: 'cleanliness', label: 'Cleanliness', score: 0, icon: 'sparkles' },
      { key: 'comfort', label: 'Comfort', score: 0, icon: 'bed' },
      { key: 'staff_professionalism', label: 'Staff', score: 0, icon: 'people' },
      { key: 'scheduling_ease', label: 'Scheduling', score: 0, icon: 'calendar' },
      { key: 'value_for_money', label: 'Value', score: 0, icon: 'cash' },
    ];
  }
  
  return [
    { key: 'cleanliness', label: 'Cleanliness', score: scores.cleanliness || 0, icon: 'sparkles' },
    { key: 'comfort', label: 'Comfort', score: scores.comfort || 0, icon: 'bed' },
    { key: 'staff_professionalism', label: 'Staff', score: scores.staff_professionalism || 0, icon: 'people' },
    { key: 'scheduling_ease', label: 'Scheduling', score: scores.scheduling_ease || 0, icon: 'calendar' },
    { key: 'value_for_money', label: 'Value', score: scores.value_for_money || 0, icon: 'cash' },
  ];
}

// ==================== Date Helpers ====================

/**
 * Get default date range (last 30 days)
 */
export function getDefaultDateRange(): { fromDate: string; toDate: string } {
  const today = new Date();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  return {
    fromDate: thirtyDaysAgo.toISOString().split('T')[0],
    toDate: today.toISOString().split('T')[0],
  };
}

/**
 * Format date for display
 */
export function formatFeedbackDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Format timestamp for display
 */
export function formatSubmittedAt(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

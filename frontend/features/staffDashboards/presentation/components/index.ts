/**
 * Staff Dashboards Presentation Components
 *
 * Phase 1 · T-C.2: the minimal appointment-row presentation formerly
 * exported here (`AppointmentListItem`) had zero production consumers and
 * was superseded by the unified `AppointmentRow` component
 * (features/appointments/presentation/components/AppointmentRow.tsx), per
 * ADR-P1-03. T-C.4: that minimal branch was itself then removed from
 * `AppointmentRow` as verified-dead code (FR-B4/AC-6) — `AppointmentRow`
 * now supports `variant="full"` only.
 */

export { SessionListItem } from './SessionListItem';
export { DashboardStatsRow, type StatItem } from './DashboardStatsRow';
export { DashboardQuickActions, type QuickAction } from './DashboardQuickActions';
export { EmptyDashboardState } from './EmptyDashboardState';
export { OnLeaveBanner } from './OnLeaveBanner';

// Multi-Day Treatment Widgets (F2.5 - Admin Dashboard Integration)
export { MultiDayTreatmentOverviewWidget } from './MultiDayTreatmentOverviewWidget';
export { UnscheduledTreatmentSheetsWidget } from './UnscheduledTreatmentSheetsWidget';
export { TodaysMultiDaySessionsAdminWidget } from './TodaysMultiDaySessionsAdminWidget';
export { PausedSeriesWidget } from './PausedSeriesWidget';


/**
 * Staff Leave Entity
 * Domain model for staff leave requests
 */

import { LeaveStatus } from '../../data/models/staff.dtos';

/**
 * Staff leave entity representing a leave request
 */
export interface StaffLeave {
  id: string;
  tenantId: string;
  staffId: string;
  leaveType: string;
  startDate: Date;
  endDate: Date;
  startTime: Date | null;
  endTime: Date | null;
  reason: string | null;
  status: LeaveStatus;
  requestedAt: Date;
  requestedByStaffId: string;
  reviewedAt: Date | null;
  reviewedByStaffId: string | null;
  reviewNotes: string | null;
}

/**
 * Leave summary for list views
 */
export interface LeaveSummary {
  id: string;
  staffId: string;
  leaveType: string;
  startDate: Date;
  endDate: Date;
  status: LeaveStatus;
  durationDays: number;
}

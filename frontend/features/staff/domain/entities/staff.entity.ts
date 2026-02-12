/**
 * Staff Entity
 * Domain model for staff members
 */

import { StaffType } from '../../data/models/staff.dtos';

/**
 * Staff entity representing a clinic staff member
 */
export interface Staff {
  id: string;
  tenantId: string;
  tenantUserId: string;
  orgUserId: string | null;
  fullName: string;
  email: string | null;
  phone: string | null;
  gender: string;
  dateOfBirth: Date | null;
  staffType: StaffType;
  staffCode: string | null;
  designation: string | null;
  specialization: string | null;
  qualifications: string | null;
  address: string | null;
  emergencyContact: string | null;
  joiningDate: Date | null;
  isActive: boolean;
  hasLogin: boolean;
  metadata: Record<string, any> | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Staff summary for list views
 */
export interface StaffSummary {
  id: string;
  fullName: string;
  staffType: StaffType;
  designation: string | null;
  phone: string | null;
  isActive: boolean;
  hasLogin: boolean;
}

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
  // Professional details
  specialization: string | null;
  qualifications: string | null;
  experienceYears: number | null;
  consultationFee: number | null;
  hourlyRate: number | null;
  // Address fields (detailed)
  addressLine: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  pin: string | null;
  // Legacy address field
  address: string | null;
  // Emergency contact (detailed)
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  emergencyContactRelation: string | null;
  // Legacy emergency contact
  emergencyContact: string | null;
  // Employment dates
  employmentStartDate: Date | null;
  employmentEndDate: Date | null;
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

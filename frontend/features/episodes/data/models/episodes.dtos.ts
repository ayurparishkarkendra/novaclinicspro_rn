/**
 * Episode Data Transfer Objects
 * 
 * Defines the Episode interface and related types for episode management.
 * Episodes represent a care continuum for a specific health condition.
 */

/**
 * Episode code system types
 */
export type EpisodeCodeSystem = 'ICD-10' | 'SNOMED' | 'INTERNAL' | 'NULL';

/**
 * Episode status types
 */
export type EpisodeStatus = 'ACTIVE' | 'CLOSED';

/**
 * Episode interface
 * 
 * Represents a clinical care continuum for a specific condition containing:
 * - Metadata: title, description, diagnosis codes
 * - Status: ACTIVE (can link appointments) or CLOSED (treatment complete)
 * - Linked entities: appointments, casesheets, prescriptions, treatment sheets
 * - Metrics: visits_count, last_visit_date, start_date, end_date
 */
export interface Episode {
  /** Unique identifier for the episode */
  id: string;
  
  /** Tenant/clinic identifier */
  tenant_id: string;
  
  /** Client/patient identifier */
  client_id: string;
  
  /** Episode title (e.g., condition name) */
  title: string;
  
  /** Optional detailed description of the episode */
  description?: string;
  
  /** Episode status - ACTIVE allows linking appointments, CLOSED means treatment complete */
  status: EpisodeStatus;
  
  /** Optional diagnosis code (e.g., ICD-10 code) */
  episode_code?: string;
  
  /** Code system used for episode_code */
  episode_code_system?: EpisodeCodeSystem;
  
  /** Human-readable display text for the episode code */
  episode_code_display?: string;
  
  /** Episode start date (ISO datetime string) */
  start_date: string;
  
  /** Optional episode end date (ISO datetime string) */
  end_date?: string;
  
  /** Optional last visit date in this episode (ISO datetime string) */
  last_visit_date?: string;
  
  /** Number of visits/appointments in this episode */
  visits_count: number;
  
  /** Timestamp when episode was created (ISO datetime string) */
  created_at: string;
  
  /** Timestamp when episode was last updated (ISO datetime string) */
  updated_at: string;
}

/**
 * Episodes list response for paginated episode queries
 * 
 * Used when fetching multiple episodes with pagination support.
 */
export interface EpisodesListResponse {
  /** Array of episode items */
  items: Episode[];
  
  /** Total number of episodes matching the query */
  total: number;
  
  /** Number of items skipped (offset for pagination) */
  skip: number;
  
  /** Maximum number of items per page */
  limit: number;
}

/**
 * Episode create request
 * 
 * Used when creating a new episode. Can optionally link to an appointment
 * by providing appointment_id, which will automatically link the appointment
 * to the newly created episode.
 */
export interface EpisodeCreateRequest {
  /** Client/patient identifier */
  client_id: string;
  
  /** Episode title (e.g., condition name) - required */
  title: string;
  
  /** Optional detailed description of the episode */
  description?: string;
  
  /** Optional diagnosis code (e.g., ICD-10 code) */
  episode_code?: string;
  
  /** Code system used for episode_code */
  episode_code_system?: EpisodeCodeSystem;
  
  /** Optional appointment ID to link to this episode on creation */
  appointment_id?: string;
}

/**
 * Episode update request
 * 
 * Used when updating an existing episode. All fields are optional
 * to support partial updates. Only the fields provided will be updated.
 */
export interface EpisodeUpdateRequest {
  /** Episode title (e.g., condition name) */
  title?: string;
  
  /** Detailed description of the episode */
  description?: string;
  
  /** Diagnosis code (e.g., ICD-10 code) */
  episode_code?: string;
  
  /** Code system used for episode_code */
  episode_code_system?: EpisodeCodeSystem;
}

/**
 * Attach episode request
 * 
 * Used when linking an appointment to an existing episode.
 * The appointment will be associated with the specified episode.
 */
export interface AttachEpisodeRequest {
  /** Episode ID to attach the appointment to */
  episode_id: string;
}

/**
 * Close episode request
 * 
 * Used when closing an active episode to mark treatment as complete.
 * Once closed, no new appointments can be linked to the episode,
 * but existing appointments and documents remain accessible.
 */
export interface CloseEpisodeRequest {
  /** Optional notes about why the episode is being closed or treatment outcome */
  notes?: string;
}

/**
 * API Error response
 * 
 * Structured error response from the backend API.
 * Use error_code for programmatic error handling instead of parsing message strings.
 * 
 * Common error codes:
 * - EPISODE_CLOSED: Attempted to attach appointment to a closed episode
 * - EPISODE_MISMATCH: Document episode_id doesn't match appointment's episode_id
 * - VALIDATION_ERROR: Request validation failed (check details.field_errors)
 * - FORBIDDEN: User lacks permission for the requested action
 */
export interface ApiError {
  /** Machine-readable error code for programmatic handling */
  error_code: string;
  
  /** Human-readable error message */
  message: string;
  
  /** Optional additional error details (e.g., field_errors for validation) */
  details?: Record<string, any>;
}

/**
 * Helper function to get status color for UI display
 * @param status - Episode status
 * @returns Color identifier for the status (green for ACTIVE, gray for CLOSED)
 */
export const getStatusColor = (status: EpisodeStatus): string => {
  switch (status) {
    case 'ACTIVE':
      return 'green';
    case 'CLOSED':
      return 'gray';
    default:
      return 'gray';
  }
};

/**
 * Helper function to get display label for episode status
 * @param status - Episode status
 * @returns Human-readable label for the status
 */
export const getStatusLabel = (status: EpisodeStatus): string => {
  switch (status) {
    case 'ACTIVE':
      return 'Active';
    case 'CLOSED':
      return 'Closed';
    default:
      return status;
  }
};

/**
 * Helper function to format episode date for display
 * Uses the centralized date formatting utility to ensure consistency
 * @param dateString - ISO date string
 * @returns Formatted date string (e.g., "15 Feb 2026") or "—" if invalid
 */
export const formatEpisodeDate = (dateString: string | undefined | null): string => {
  if (!dateString) return '—';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '—';
  }
};

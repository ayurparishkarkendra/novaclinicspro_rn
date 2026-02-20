/**
 * Auth API Datasource
 * Handles API calls to FastAPI backend auth endpoints
 */

import { axiosClient } from '../../../../core/api/axiosClient';
import { CurrentUserResponse } from '../models/auth.dtos';

/**
 * Get current user info from JWT token
 * GET /api/v1/auth/me
 */
export const getCurrentUserApi = async (): Promise<CurrentUserResponse> => {
  const response = await axiosClient.get<CurrentUserResponse>('/api/v1/auth/me');
  console.log('[getCurrentUserApi] Response data:', response.data);
  console.log('[getCurrentUserApi] application_status:', response.data.application_status);
  return response.data;
};

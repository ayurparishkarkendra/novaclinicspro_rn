/**
 * Registration API Datasource
 * Handles API calls for clinic owner registration
 */

import { axiosClient } from '../../../../core/api/axiosClient';
import {
  ClinicOwnerRegistrationRequest,
  ClinicOwnerRegistrationResponse,
  RegistrationStatusResponse,
} from '../models/registration.dtos';

export const registerClinicOwnerApi = async (
  payload: ClinicOwnerRegistrationRequest
): Promise<ClinicOwnerRegistrationResponse> => {
  const response = await axiosClient.post(
    '/api/v1/auth/register-clinic-owner',
    payload
  );
  return response.data;
};

export const getRegistrationStatusApi = async (
  userId: string
): Promise<RegistrationStatusResponse> => {
  const response = await axiosClient.get<RegistrationStatusResponse>(
    `/api/v1/auth/registration-status/${userId}`
  );
  return response.data;
};

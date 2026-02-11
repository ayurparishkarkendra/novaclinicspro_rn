/**
 * Auth Repository Implementation
 */

import { getCurrentUserApi } from '../datasources/auth.api';
import { AuthRepository } from '../../domain/repositories/auth.repository';
import { AuthUserSession, mapCurrentUserToDomain } from '../../domain/entities/auth.entity';

export class AuthRepositoryImpl implements AuthRepository {
  async getCurrentUser(): Promise<AuthUserSession> {
    const dto = await getCurrentUserApi();
    return mapCurrentUserToDomain(dto);
  }
}

export const authRepository = new AuthRepositoryImpl();

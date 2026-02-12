/**
 * Clients Repository Interface
 * Defines the contract for client data operations
 */

import {
  ClientCreate,
  ClientUpdate,
  ClientResponse,
  ListClientsParams,
  PaginatedClientsResponse,
} from '../../data/models/clients.dtos';

/**
 * Clients repository interface
 */
export interface IClientsRepository {
  listClients(tenantId: string, params?: ListClientsParams): Promise<PaginatedClientsResponse>;
  getClient(tenantId: string, clientId: string): Promise<ClientResponse>;
  createClient(tenantId: string, data: ClientCreate): Promise<ClientResponse>;
  updateClient(tenantId: string, clientId: string, data: ClientUpdate): Promise<ClientResponse>;
  deleteClient(tenantId: string, clientId: string): Promise<void>;
}

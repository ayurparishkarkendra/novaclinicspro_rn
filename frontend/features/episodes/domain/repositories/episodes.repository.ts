/**
 * Episodes Repository Interface
 * Defines the contract for episode data operations
 */

import {
  Episode,
  EpisodesListResponse,
  EpisodeCreateRequest,
  EpisodeUpdateRequest,
  AttachEpisodeRequest,
  CloseEpisodeRequest,
  EpisodeStatus,
} from '../../data/models/episodes.dtos';

/**
 * List episodes query parameters
 */
export interface ListEpisodesParams {
  /** Filter by client ID */
  client_id?: string;
  /** Filter by episode status (ACTIVE or CLOSED) */
  status?: EpisodeStatus;
  /** Number of items to skip (offset for pagination) */
  skip?: number;
  /** Maximum number of items to return per page */
  limit?: number;
}

/**
 * Episodes repository interface
 */
export interface IEpisodesRepository {
  listEpisodes(
    tenantId: string,
    params?: ListEpisodesParams
  ): Promise<EpisodesListResponse>;
  
  getEpisode(
    tenantId: string,
    episodeId: string
  ): Promise<Episode>;
  
  createEpisode(
    tenantId: string,
    data: EpisodeCreateRequest
  ): Promise<Episode>;
  
  updateEpisode(
    tenantId: string,
    episodeId: string,
    data: EpisodeUpdateRequest
  ): Promise<Episode>;
  
  closeEpisode(
    tenantId: string,
    episodeId: string,
    data?: CloseEpisodeRequest
  ): Promise<Episode>;
  
  reopenEpisode(
    tenantId: string,
    episodeId: string
  ): Promise<Episode>;
  
  attachEpisodeToAppointment(
    tenantId: string,
    appointmentId: string,
    data: AttachEpisodeRequest
  ): Promise<void>;
}

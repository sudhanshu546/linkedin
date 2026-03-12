/**
 * Profile Service API Endpoints
 */

import api from './axiosConfig';
import { API_ENDPOINTS } from '../constants/api';
import { Profile, User, ApiResponse, PaginatedResponse, SearchFilter } from '../types';

/**
 * Get current user's profile
 */
export const getMyProfile = async (): Promise<ApiResponse<Profile>> => {
  const response = await api.get<ApiResponse<Profile>>(
    API_ENDPOINTS.PROFILE.GET_ME
  );
  return response.data;
};

/**
 * Get profile by user ID
 */
export const getProfileById = async (userId: string): Promise<ApiResponse<Profile>> => {
  const response = await api.get<ApiResponse<Profile>>(
    API_ENDPOINTS.PROFILE.GET_BY_ID(userId)
  );
  return response.data;
};

/**
 * Update profile
 */
export const updateProfile = async (profileData: Partial<Profile>): Promise<ApiResponse<Profile>> => {
  const response = await api.put<ApiResponse<Profile>>(
    API_ENDPOINTS.PROFILE.UPDATE,
    profileData
  );
  return response.data;
};

/**
 * Search profiles with filters
 */
export const searchProfiles = async (
  filters: SearchFilter
): Promise<ApiResponse<PaginatedResponse<Profile>>> => {
  const params = new URLSearchParams();

  if (filters.query) params.append('query', filters.query);
  if (filters.page !== undefined) params.append('page', filters.page.toString());
  if (filters.size !== undefined) params.append('size', filters.size.toString());
  if (filters.sortBy) params.append('sortBy', filters.sortBy);
  if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);

  const response = await api.get<ApiResponse<PaginatedResponse<Profile>>>(
    API_ENDPOINTS.PROFILE.SEARCH,
    { params }
  );
  return response.data;
};

/**
 * Upload profile picture
 */
export const uploadProfilePicture = async (file: File): Promise<ApiResponse<string>> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post<ApiResponse<string>>(
    `${API_ENDPOINTS.PROFILE.UPDATE}/picture`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return response.data;
};

/**
 * Upload cover picture
 */
export const uploadCoverPicture = async (file: File): Promise<ApiResponse<string>> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post<ApiResponse<string>>(
    `${API_ENDPOINTS.PROFILE.UPDATE}/cover`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return response.data;
};

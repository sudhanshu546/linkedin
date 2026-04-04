import { API_ENDPOINTS } from "../constants/api";
import api from "./axiosConfig";
import { ApiResponse, ProfileDTO, Post, PaginatedResponse, AdvanceSearchCriteria, SearchFilter } from "../types";

/**
 * Fetch current user's profile
 */
export const getMyProfile = async (): Promise<ProfileDTO> => {
  const response = await api.get<ApiResponse<ProfileDTO>>(API_ENDPOINTS.PROFILE.GET_ME);
  return response.data.data;
};

/**
 * Update current user's profile
 */
export const updateProfile = async (profileData: ProfileDTO): Promise<ProfileDTO> => {
  const response = await api.put<ApiResponse<ProfileDTO>>(API_ENDPOINTS.PROFILE.UPDATE, profileData);
  return response.data.data;
};

/**
 * Fetch profile by user ID
 */
export const getProfileByUserId = async (userId: string): Promise<ProfileDTO> => {
  const response = await api.get<ApiResponse<ProfileDTO>>(API_ENDPOINTS.PROFILE.GET_BY_ID(userId));
  return response.data.data;
};

/**
 * Search profiles using advanced criteria
 */
export const searchProfiles = async (filters: SearchFilter | string): Promise<ProfileDTO[]> => {
  const criteria: AdvanceSearchCriteria = {
    pageNumber: 0,
    pageSize: 20,
    relation: 'AND',
    filters: []
  };

  if (typeof filters === 'string') {
    criteria.relation = 'OR';
    criteria.filters.push({ columnName: 'headline', operator: 'CONTAINS', values: [filters], relation: 'OR' });
    criteria.filters.push({ columnName: 'city', operator: 'CONTAINS', values: [filters], relation: 'OR' });
    criteria.filters.push({ columnName: 'state', operator: 'CONTAINS', values: [filters], relation: 'OR' });
    criteria.filters.push({ columnName: 'currentCompany', operator: 'CONTAINS', values: [filters], relation: 'OR' });
  } else {
    if (filters.query) {
        criteria.relation = 'OR';
        criteria.filters.push({ columnName: 'headline', operator: 'CONTAINS', values: [filters.query], relation: 'OR' });
        criteria.filters.push({ columnName: 'city', operator: 'CONTAINS', values: [filters.query], relation: 'OR' });
        criteria.filters.push({ columnName: 'currentCompany', operator: 'CONTAINS', values: [filters.query], relation: 'OR' });
    }
    if (filters.location) {
        criteria.filters.push({ columnName: 'city', operator: 'CONTAINS', values: [filters.location], relation: 'AND' });
    }
    if (filters.company) {
        criteria.filters.push({ columnName: 'currentCompany', operator: 'EQUALS', values: [filters.company], relation: 'AND' });
    }
  }

  const response = await api.post<ApiResponse<ProfileDTO[]>>(API_ENDPOINTS.PROFILE.ADVANCED_SEARCH, criteria);
  return response.data.data;
};

/**
 * Network - Get connections (all accepted)
 */
export const getConnections = async (): Promise<any[]> => {
  const response = await api.get<ApiResponse<any[]>>(API_ENDPOINTS.NETWORK.GET_CONNECTIONS);
  return response.data.data;
};

/**
 * Network - Get my connections (alias for getConnections)
 */
export const getMyConnections = async (): Promise<any[]> => {
  return getConnections();
};

/**
 * Network - Send connection request
 */
export const sendConnectionRequest = async (receiverId: string): Promise<void> => {
  await api.post(API_ENDPOINTS.NETWORK.SEND_CONNECTION_REQUEST, { receiverId });
};

/**
 * Network - Get pending requests
 */
export const getPendingRequests = async (): Promise<any[]> => {
  const response = await api.get<ApiResponse<any[]>>(API_ENDPOINTS.NETWORK.GET_PENDING_REQUESTS);
  return response.data.data;
};

/**
 * Network - Respond to connection request
 */
export const respondToConnectionRequest = async (connectionId: string, accept: boolean): Promise<void> => {
  await api.post(`${API_ENDPOINTS.NETWORK.RESPOND_CONNECTION(connectionId)}?accept=${accept}`);
};

/**
 * Network - Cancel connection request
 */
export const cancelConnectionRequest = async (connectionId: string): Promise<void> => {
  await api.delete(`${API_ENDPOINTS.NETWORK.GET_CONNECTIONS}/${connectionId}/cancel`);
};

/**
 * Network - Get connection status with another user
 */
export const getConnectionStatus = async (userId: string): Promise<any> => {
  const response = await api.get<ApiResponse<any>>(`${API_ENDPOINTS.NETWORK.GET_CONNECTIONS}/status/${userId}`);
  return response.data.data;
};

/**
 * Network - Get suggestions/recommendations
 */
export const getRecommendations = async (): Promise<string[]> => {
  const response = await api.get<string[]>(API_ENDPOINTS.NETWORK.GET_SUGGESTIONS);
  return response.data; // This might not be wrapped yet or is a string array
};

/**
 * Profile Views - Get views
 */
export const getProfileViews = async (): Promise<any[]> => {
  const response = await api.get<ApiResponse<any[]>>(API_ENDPOINTS.PROFILE_VIEWS.GET_VIEWS);
  return response.data.data;
};

/**
 * Profile Views - Get count
 */
export const getProfileViewCount = async (): Promise<number> => {
  const response = await api.get<ApiResponse<number>>(API_ENDPOINTS.PROFILE_VIEWS.GET_COUNT);
  return response.data.data;
};

/**
 * Profile Views - Get trends
 */
export const getProfileViewTrends = async (): Promise<any[]> => {
  const response = await api.get<ApiResponse<any[]>>(API_ENDPOINTS.PROFILE_VIEWS.GET_TRENDS);
  return response.data.data;
};

/**
 * Profile Views - Get demographics
 */
export const getProfileDemographics = async (): Promise<any> => {
  const response = await api.get<ApiResponse<any>>(API_ENDPOINTS.PROFILE_VIEWS.GET_DEMOGRAPHICS);
  return response.data.data;
};

/**
 * Get posts for a user (logged-in or other)
 */
export const getUserPosts = async (userId?: string, page = 0, size = 10): Promise<PaginatedResponse<Post>> => {
  const url = userId 
    ? `/ps/profiles/${userId}/posts`
    : `/ps/profiles/me/posts`;
  const response = await api.get<ApiResponse<PaginatedResponse<Post>>>(url, {
    params: { page, size }
  });
  return response.data.data;
};

/**
 * Experience - Add
 */
export const addExperience = async (experience: any): Promise<any> => {
  const response = await api.post<ApiResponse<any>>(`${API_ENDPOINTS.PROFILE.UPDATE}/experience`, experience);
  return response.data.data;
};

/**
 * Experience - Update
 */
export const updateExperience = async (id: string, experience: any): Promise<any> => {
  const response = await api.put<ApiResponse<any>>(`${API_ENDPOINTS.PROFILE.UPDATE}/experience/${id}`, experience);
  return response.data.data;
};

/**
 * Experience - Delete
 */
export const deleteExperience = async (id: string): Promise<void> => {
  await api.delete(`${API_ENDPOINTS.PROFILE.UPDATE}/experience/${id}`);
};

/**
 * Education - Add
 */
export const addEducation = async (education: any): Promise<any> => {
  const response = await api.post<ApiResponse<any>>(`${API_ENDPOINTS.PROFILE.UPDATE}/education`, education);
  return response.data.data;
};

/**
 * Education - Update
 */
export const updateEducation = async (id: string, education: any): Promise<any> => {
  const response = await api.put<ApiResponse<any>>(`${API_ENDPOINTS.PROFILE.UPDATE}/education/${id}`, education);
  return response.data.data;
};

/**
 * Update cover image
 */
export const updateCoverImage = async (image: File): Promise<string> => {
  const formData = new FormData();
  formData.append('image', image);
  const response = await api.post<ApiResponse<string>>(`${API_ENDPOINTS.PROFILE.UPDATE}/cover-image`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data.data;
};

/**
 * Education - Delete
 */
export const deleteEducation = async (id: string): Promise<void> => {
  await api.delete(`${API_ENDPOINTS.PROFILE.UPDATE}/education/${id}`);
};

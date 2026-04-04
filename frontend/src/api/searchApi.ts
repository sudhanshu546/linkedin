/**
 * Search Service API Endpoints (Elasticsearch backed)
 */

import api from './axiosConfig';
import { API_ENDPOINTS } from '../constants/api';
import { ApiResponse } from '../types';

export interface UserSearchResult {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    headline: string;
    skills: string;
    city: string;
    state: string;
    currentCompany: string;
    designation: string;
    profileImageUrl: string;
}

export interface JobSearchResult {
    id: string;
    title: string;
    description: string;
    company: string;
    location: string;
    jobType: string;
    postedDate: number;
}

/**
 * Search users using Elasticsearch
 */
export const searchUsersES = async (query: string, page: number = 0, size: number = 10): Promise<UserSearchResult[]> => {
  const response = await api.get<ApiResponse<UserSearchResult[]>>(
    `${API_ENDPOINTS.SEARCH.USERS}?query=${encodeURIComponent(query)}&page=${page}&size=${size}`
  );
  return response.data.data;
};

/**
 * Search jobs using Elasticsearch
 */
export const searchJobsES = async (query: string, page: number = 0, size: number = 10): Promise<JobSearchResult[]> => {
  const response = await api.get<ApiResponse<JobSearchResult[]>>(
    `${API_ENDPOINTS.SEARCH.JOBS}?query=${encodeURIComponent(query)}&page=${page}&size=${size}`
  );
  return response.data.data;
};

/**
 * Get trending hashtags from Elasticsearch
 */
export const getTrendingHashtags = async (): Promise<string[]> => {
  try {
    const response = await api.get<ApiResponse<string[]>>(
      API_ENDPOINTS.SEARCH.TRENDING_HASHTAGS
    );
    return response.data.data || [];
  } catch (err) {
    console.error('Error fetching trending hashtags:', err);
    return [];
  }
};

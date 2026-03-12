/**
 * User Service API Endpoints
 */

import api from './axiosConfig';
import { API_ENDPOINTS } from '../constants/api';
import {
  User,
  UserDetail,
  LoginRequest,
  SignupRequest,
  AccessTokenResponse,
  ApiResponse,
  PaginatedResponse,
} from '../types';

/**
 * User Authentication - Login
 */
export const userLogin = async (credentials: LoginRequest): Promise<ApiResponse<AccessTokenResponse>> => {
  const response = await api.post<ApiResponse<AccessTokenResponse>>(
    API_ENDPOINTS.USER.LOGIN,
    credentials
  );
  return response.data;
};

/**
 * User Authentication - Sign Up
 */
export const userSignup = async (userData: SignupRequest): Promise<ApiResponse<User>> => {
  const response = await api.post<ApiResponse<User>>(
    API_ENDPOINTS.USER.SIGNUP,
    userData
  );
  return response.data;
};

/**
 * Get current user details
 */
export const getUserDetail = async (): Promise<ApiResponse<UserDetail>> => {
  const response = await api.get<ApiResponse<UserDetail>>(
    API_ENDPOINTS.USER.USER_DETAIL
  );
  return response.data;
};

/**
 * Get all users with pagination
 */
export const getAllUsers = async (
  page = 0,
  size = 10
): Promise<ApiResponse<PaginatedResponse<User>>> => {
  const response = await api.get<ApiResponse<PaginatedResponse<User>>>(
    API_ENDPOINTS.USER.GET_ALL_USERS,
    { params: { page, size } }
  );
  return response.data;
};

/**
 * Get user by ID
 */
export const getUserById = async (userId: string): Promise<ApiResponse<User>> => {
  const response = await api.get<ApiResponse<User>>(
    API_ENDPOINTS.USER.GET_BY_ID(userId)
  );
  return response.data;
};

/**
 * Get user by internal ID
 */
export const getUserByInternalId = async (userId: string): Promise<ApiResponse<User>> => {
  const response = await api.get<ApiResponse<User>>(
    API_ENDPOINTS.USER.GET_BY_INTERNAL_ID(userId)
  );
  return response.data;
};

/**
 * Search users by query
 */
export const searchUsers = async (query: string): Promise<ApiResponse<User[]>> => {
  const response = await api.get<ApiResponse<User[]>>(
    API_ENDPOINTS.USER.SEARCH,
    { params: { query } }
  );
  return response.data;
};

/**
 * Refresh access token
 */
export const refreshToken = async (
  refreshToken: string
): Promise<ApiResponse<AccessTokenResponse>> => {
  const response = await api.post<ApiResponse<AccessTokenResponse>>(
    `${API_ENDPOINTS.USER.REFRESH_TOKEN}?refreshToken=${refreshToken}`
  );
  return response.data;
};

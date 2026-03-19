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
export const getAuthenticatedUser = async (): Promise<UserDetail> => {
  const response = await api.get<ApiResponse<UserDetail>>(
    API_ENDPOINTS.USER.USER_DETAIL
  );
  return response.data.result;
};

/**
 * Update user profile details and/or image (Composite API call)
 */
export const updateProfileComposite = async (profileData: any): Promise<any> => {
  // 1. If an image is provided or firstName/lastName, update user details in user-service
  if (profileData.image || profileData.firstName || profileData.lastName) {
    const formData = new FormData();
    if (profileData.image) {
      formData.append('img', profileData.image);
    }
    
    // Get current user to get ID and preserve email
    const user = await getAuthenticatedUser();
    
    if (user) {
        // Backend expects flat parameters for TUserDTO when using @ModelAttribute
        formData.append('id', user.id);
        formData.append('firstName', profileData.firstName || user.firstName);
        formData.append('lastName', profileData.lastName || user.lastName);
        formData.append('email', user.email);
        
        await api.put('/us/user/update', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    }
  }

  // 2. Update professional profile in profile-service
  // Only send fields that profile-service expects
  const { firstName, lastName, image, email, ...professionalData } = profileData;
  
  const response = await api.put<ApiResponse<any>>(
    API_ENDPOINTS.PROFILE.UPDATE, 
    professionalData
  );
  return response.data.result;
};


/**
 * Get all users with pagination
 */
export const getAllUsers = async (
  page = 0,
  size = 10
): Promise<PaginatedResponse<User>> => {
  const response = await api.get<ApiResponse<PaginatedResponse<User>>>(
    API_ENDPOINTS.USER.GET_ALL_USERS,
    { params: { page, size } }
  );
  return response.data.result;
};

/**
 * Get user by ID
 */
export const getUserById = async (userId: string): Promise<User> => {
  const response = await api.get<ApiResponse<User>>(
    API_ENDPOINTS.USER.GET_BY_ID(userId)
  );
  return response.data.result;
};

/**
 * Get user by internal ID
 */
export const getUserByInternalId = async (userId: string): Promise<User> => {
  const response = await api.get<ApiResponse<User>>(
    API_ENDPOINTS.USER.GET_BY_INTERNAL_ID(userId)
  );
  return response.data.result;
};

/**
 * Search users by query
 */
export const searchUsers = async (query: string): Promise<User[]> => {
  const response = await api.get<ApiResponse<User[]>>(
    API_ENDPOINTS.USER.SEARCH,
    { params: { query } }
  );
  return response.data.result;
};

/**
 * Refresh access token
 */
export const refreshToken = async (
  refreshToken: string
): Promise<AccessTokenResponse> => {
  const response = await api.post<ApiResponse<AccessTokenResponse>>(
    `${API_ENDPOINTS.USER.REFRESH_TOKEN}?refreshToken=${refreshToken}`
  );
  return response.data.result;
};

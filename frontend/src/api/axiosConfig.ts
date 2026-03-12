/**
 * Axios Configuration with Token Management
 * API Gateway: port 9191
 */

import axios, { AxiosInstance, AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL, API_ENDPOINTS } from '../constants/api';
import { getAccessToken, getRefreshToken, setTokens, clearTokens } from '../utils/storageUtils';

/**
 * Create axios instance with base configuration
 */
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

/**
 * Request Interceptor - Add authorization token
 */
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

/**
 * Response Interceptor - Handle token refresh on 401
 */
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = getRefreshToken();

      if (refreshToken) {
        try {
          // Use API_BASE_URL directly to ensure we hit the correct port
          const response = await axios.post(
            `${API_BASE_URL}${API_ENDPOINTS.USER.REFRESH_TOKEN}?refreshToken=${refreshToken}`
          );

          if (response.data?.result) {
            const { access_token, refresh_token } = response.data.result;
            setTokens({ access_token, refresh_token, token_type: 'Bearer', expires_in: 3600 });

            // Retry the original request with new token
            originalRequest.headers.Authorization = `Bearer ${access_token}`;
            return api(originalRequest);
          }
        } catch (refreshError: any) {
          // Token refresh failed - clear tokens and redirect to login
          clearTokens();
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      } else {
        // No refresh token available - redirect to login
        clearTokens();
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

/**
 * Helper methods for common operations
 */
export const apiClient = {
  /**
   * GET request
   */
  get: <T = any>(url: string, config?: any) => api.get<T>(url, config),

  /**
   * POST request
   */
  post: <T = any>(url: string, data?: any, config?: any) => api.post<T>(url, data, config),

  /**
   * PUT request
   */
  put: <T = any>(url: string, data?: any, config?: any) => api.put<T>(url, data, config),

  /**
   * PATCH request
   */
  patch: <T = any>(url: string, data?: any, config?: any) => api.patch<T>(url, data, config),

  /**
   * DELETE request
   */
  delete: <T = any>(url: string, config?: any) => api.delete<T>(url, config),

  /**
   * Get current authorization header
   */
  getAuthHeader: () => {
    const token = getAccessToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  },
};

export default api;

/**
 * Axios Configuration with Token Management
 * API Gateway: port 9191
 */

import axios, { AxiosInstance, AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { toast } from 'react-toastify';
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
      const currentRefreshToken = getRefreshToken();

      if (currentRefreshToken) {
        try {
          // We use a direct axios call here to avoid an interceptor loop
          const response = await axios.post(
            `${API_BASE_URL}${API_ENDPOINTS.USER.REFRESH_TOKEN}`,
            {},
            { params: { refreshToken: currentRefreshToken } }
          );

          if (response.data?.result) {
            const { accessToken, refreshToken } = response.data.result;
            setTokens({ access_token: accessToken, refresh_token: refreshToken });
            
            // Update the header for the original request and retry
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            return api(originalRequest);
          }
        } catch (refreshError: any) {
          toast.error('Your session has expired. Please log in again.');
          clearTokens();
          // Use a slight delay to allow the toast to be seen before redirecting
          setTimeout(() => {
            window.location.href = '/login';
          }, 1000);
          return Promise.reject(refreshError);
        }
      } else {
        // No refresh token available
        clearTokens();
        window.location.href = '/login';
      }
    }

    // Global error feedback for non-401 errors or failed retries
    if (error.response && error.response.status !== 401) {
        const message = (error.response.data as any)?.message || 'An error occurred';
        toast.error(message);
    } else if (!error.response) {
        toast.error('Network error. Please check your connection.');
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

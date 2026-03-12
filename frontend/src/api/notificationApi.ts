/**
 * Notification Service API Endpoints
 */

import api from './axiosConfig';
import { API_ENDPOINTS } from '../constants/api';
import { Notification, ApiResponse, PaginatedResponse } from '../types';

/**
 * Get all notifications
 */
export const getAllNotifications = async (
  page = 0,
  size = 10
): Promise<ApiResponse<PaginatedResponse<Notification>>> => {
  const response = await api.get<ApiResponse<PaginatedResponse<Notification>>>(
    API_ENDPOINTS.NOTIFICATIONS.GET_ALL,
    { params: { page, size } }
  );
  return response.data;
};

/**
 * Get unread notifications
 */
export const getUnreadNotifications = async (): Promise<ApiResponse<Notification[]>> => {
  const response = await api.get<ApiResponse<Notification[]>>(
    API_ENDPOINTS.NOTIFICATIONS.GET_UNREAD
  );
  return response.data;
};

/**
 * Mark notification as read
 */
export const markNotificationAsRead = async (
  notificationId: string
): Promise<ApiResponse<Notification>> => {
  const response = await api.patch<ApiResponse<Notification>>(
    API_ENDPOINTS.NOTIFICATIONS.MARK_READ(notificationId)
  );
  return response.data;
};

/**
 * Delete notification
 */
export const deleteNotification = async (
  notificationId: string
): Promise<ApiResponse<any>> => {
  const response = await api.delete<ApiResponse<any>>(
    API_ENDPOINTS.NOTIFICATIONS.DELETE(notificationId)
  );
  return response.data;
};

/**
 * Mark all notifications as read
 */
export const markAllAsRead = async (): Promise<ApiResponse<any>> => {
  const response = await api.patch<ApiResponse<any>>(
    `${API_ENDPOINTS.NOTIFICATIONS.GET_ALL}/read-all`
  );
  return response.data;
};

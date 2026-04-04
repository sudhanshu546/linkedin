/**
 * Notification Service API Endpoints
 */

import api from './axiosConfig';
import { API_ENDPOINTS } from '../constants/api';
import { Notification, ApiResponse } from '../types';

/**
 * Get all notifications
 */
export const getAllNotifications = async (
  page = 0,
  size = 10
): Promise<Notification[]> => {
  const response = await api.get<ApiResponse<Notification[]>>(
    API_ENDPOINTS.NOTIFICATIONS.GET_ALL,
    { params: { page, size } }
  );
  return response.data.data;
};

/**
 * Get unread notifications
 */
export const getUnreadNotifications = async (): Promise<Notification[]> => {
  const response = await api.get<ApiResponse<Notification[]>>(
    API_ENDPOINTS.NOTIFICATIONS.GET_UNREAD
  );
  return response.data.data;
};

/**
 * Mark notification as read
 */
export const markNotificationAsRead = async (
  notificationId: string
): Promise<any> => {
  const response = await api.put<ApiResponse<any>>(
    API_ENDPOINTS.NOTIFICATIONS.MARK_READ(notificationId)
  );
  return response.data.data;
};

/**
 * Delete notification
 */
export const deleteNotification = async (
  notificationId: string
): Promise<any> => {
  const response = await api.delete<ApiResponse<any>>(
    API_ENDPOINTS.NOTIFICATIONS.DELETE(notificationId)
  );
  return response.data.data;
};

/**
 * Mark all notifications as read
 */
export const markAllAsRead = async (): Promise<any> => {
  const response = await api.patch<ApiResponse<any>>(
    `${API_ENDPOINTS.NOTIFICATIONS.GET_ALL}/read-all`
  );
  return response.data.data;
};

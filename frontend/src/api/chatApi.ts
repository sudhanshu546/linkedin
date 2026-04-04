/**
 * Chat Service API Endpoints
 */

import api from './axiosConfig';
import { API_ENDPOINTS } from '../constants/api';
import { ChatMessage, ApiResponse } from '../types';

/**
 * Get chat messages with a specific user
 */
export const getChatMessages = async (recipientId: string): Promise<ChatMessage[]> => {
  const response = await api.get<ApiResponse<ChatMessage[]>>(
    API_ENDPOINTS.CHAT.GET_MESSAGES(recipientId)
  );
  return response.data.data;
};

/**
 * Mark messages from a specific sender as read
 */
export const markMessagesAsRead = async (senderId: string): Promise<void> => {
  await api.patch(
    API_ENDPOINTS.CHAT.MARK_READ(senderId)
  );
};

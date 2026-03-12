import api from './axiosConfig';

export const getChatMessages = async (recipientId) => {
  const response = await api.get(`/cs/messages/${recipientId}`);
  return response.data;
};

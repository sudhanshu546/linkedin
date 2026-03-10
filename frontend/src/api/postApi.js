import api from './axiosConfig';

export const getFeed = async (page = 0, size = 10) => {
  const response = await api.get(`/ps/feed?page=${page}&size=${size}`);
  return response.data;
};

export const createPost = async (content, images) => {
  const formData = new FormData();
  formData.append('content', content);
  if (images && images.length > 0) {
    images.forEach(image => {
      formData.append('images', image);
    });
  }
  
  const response = await api.post('/us/posts', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const likePost = async (postId) => {
  const response = await api.post(`/us/posts/${postId}/like`);
  return response.data;
};

export const commentOnPost = async (postId, content) => {
  const response = await api.post(`/us/posts/${postId}/comments`, content, {
    headers: {
      'Content-Type': 'text/plain',
    },
  });
  return response.data;
};

export const getComments = async (postId) => {
  const response = await api.get(`/us/posts/${postId}/comments`);
  return response.data;
};

export const getLikeCount = async (postId) => {
  const response = await api.get(`/us/posts/${postId}/likes/count`);
  return response.data;
};

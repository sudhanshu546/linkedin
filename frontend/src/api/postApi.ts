/**
 * Post/Feed Service API Endpoints
 */

import api from './axiosConfig';
import { API_ENDPOINTS, PAGINATION } from '../constants/api';
import {
  Post,
  Comment,
  PostCreateRequest,
  ApiResponse,
  PaginatedResponse,
} from '../types';

/**
 * Get feed with pagination
 */
export const getFeed = async (
  page = PAGINATION.DEFAULT_PAGE,
  size = PAGINATION.FEED_SIZE
): Promise<ApiResponse<PaginatedResponse<Post>>> => {
  const response = await api.get<ApiResponse<PaginatedResponse<Post>>>(
    API_ENDPOINTS.FEED.GET,
    { params: { page, size } }
  );
  return response.data;
};

/**
 * Create a new post
 */
export const createPost = async (data: PostCreateRequest): Promise<ApiResponse<Post>> => {
  const formData = new FormData();
  formData.append('content', data.content);

  if (data.images && data.images.length > 0) {
    data.images.forEach((image) => {
      formData.append('images', image);
    });
  }

  const response = await api.post<ApiResponse<Post>>(
    API_ENDPOINTS.FEED.CREATE_POST,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return response.data;
};

/**
 * Like a post
 */
export const likePost = async (postId: string): Promise<ApiResponse<any>> => {
  const response = await api.post<ApiResponse<any>>(
    API_ENDPOINTS.FEED.LIKE_POST(postId)
  );
  return response.data;
};

/**
 * Unlike a post
 */
export const unlikePost = async (postId: string): Promise<ApiResponse<any>> => {
  const response = await api.delete<ApiResponse<any>>(
    API_ENDPOINTS.FEED.LIKE_POST(postId)
  );
  return response.data;
};

/**
 * Comment on a post
 */
export const commentOnPost = async (
  postId: string,
  content: string
): Promise<ApiResponse<Comment>> => {
  const response = await api.post<ApiResponse<Comment>>(
    API_ENDPOINTS.FEED.COMMENT(postId),
    content,
    {
      headers: {
        'Content-Type': 'text/plain',
      },
    }
  );
  return response.data;
};

/**
 * Get comments for a post
 */
export const getComments = async (postId: string): Promise<ApiResponse<Comment[]>> => {
  const response = await api.get<ApiResponse<Comment[]>>(
    API_ENDPOINTS.FEED.GET_COMMENTS(postId)
  );
  return response.data;
};

/**
 * Get like count for a post
 */
export const getLikeCount = async (postId: string): Promise<ApiResponse<number>> => {
  const response = await api.get<ApiResponse<number>>(
    API_ENDPOINTS.FEED.GET_LIKE_COUNT(postId)
  );
  return response.data;
};

/**
 * Delete a post
 */
export const deletePost = async (postId: string): Promise<ApiResponse<any>> => {
  const response = await api.delete<ApiResponse<any>>(
    `${API_ENDPOINTS.FEED.CREATE_POST}/${postId}`
  );
  return response.data;
};

/**
 * Edit a post
 */
export const editPost = async (
  postId: string,
  content: string
): Promise<ApiResponse<Post>> => {
  const response = await api.put<ApiResponse<Post>>(
    `${API_ENDPOINTS.FEED.CREATE_POST}/${postId}`,
    { content }
  );
  return response.data;
};

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
): Promise<PaginatedResponse<Post>> => {
  const response = await api.get<ApiResponse<PaginatedResponse<Post>>>(
    API_ENDPOINTS.FEED.GET,
    { params: { page, size } }
  );
  return response.data.data;
};

/**
 * Create a new post
 */
export const createPost = async (data: PostCreateRequest): Promise<Post> => {
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
  return response.data.data;
};

/**
 * React to a post
 */
export const reactToPost = async (postId: string, type: string): Promise<void> => {
  await api.post(
    `${API_ENDPOINTS.FEED.CREATE_POST}/${postId}/react?type=${type}`
  );
};

/**
 * Remove reaction from a post
 */
export const unlikePost = async (postId: string): Promise<void> => {
  await api.delete(
    `${API_ENDPOINTS.FEED.CREATE_POST}/${postId}/react`
  );
};

/**
 * Get user reaction for a post
 */
export const getUserReaction = async (postId: string): Promise<string | null> => {
  const response = await api.get<ApiResponse<string>>(
    API_ENDPOINTS.FEED.GET_REACTION(postId)
  );
  return response.data.data;
};

/**
 * Get reaction count for a post
 */
export const getReactionCount = async (postId: string): Promise<number> => {
  const response = await api.get<ApiResponse<number>>(
    API_ENDPOINTS.FEED.GET_REACTION_COUNT(postId)
  );
  return response.data.data;
};

/**
 * Comment on a post
 */
export const commentOnPost = async (
  postId: string,
  content: string,
  parentId?: string
): Promise<Comment> => {
  const url = parentId 
    ? `${API_ENDPOINTS.FEED.COMMENT(postId)}?parentId=${parentId}`
    : API_ENDPOINTS.FEED.COMMENT(postId);
    
  const response = await api.post<ApiResponse<Comment>>(
    url,
    { content }
  );
  return response.data.data;
};

/**
 * Get comments for a post
 */
export const getComments = async (postId: string): Promise<Comment[]> => {
  const response = await api.get<ApiResponse<Comment[]>>(
    API_ENDPOINTS.FEED.GET_COMMENTS(postId)
  );
  return response.data.data;
};

/**
 * Get posts for a specific user
 */
export const getUserPosts = async (
  userId: string,
  page = PAGINATION.DEFAULT_PAGE,
  size = PAGINATION.FEED_SIZE
): Promise<any> => {
  const response = await api.get<ApiResponse<any>>(
    `${API_ENDPOINTS.FEED.CREATE_POST}/user/${userId}`,
    { params: { page, size } }
  );
  return response.data.data;
};

/**
 * Delete a comment
 */
export const deleteComment = async (commentId: string): Promise<any> => {
  const response = await api.delete<ApiResponse<any>>(
    API_ENDPOINTS.FEED.DELETE_COMMENT(commentId)
  );
  return response.data.data;
};

/**
 * Edit a post
 */
export const editPost = async (
  postId: string,
  content: string
): Promise<Post> => {
  const response = await api.put<ApiResponse<Post>>(
    `${API_ENDPOINTS.FEED.CREATE_POST}/${postId}`,
    { content }
  );
  return response.data.data;
};

/**
 * Create a new poll
 */
export const createPoll = async (data: {
  question: string;
  options: { text: string }[];
  expiryDate: string;
}): Promise<Post> => {
  const response = await api.post<ApiResponse<Post>>(
    API_ENDPOINTS.FEED.CREATE_POLL,
    data
  );
  return response.data.data;
};

/**
 * Vote in a poll
 */
export const voteInPoll = async (postId: string, optionId: string): Promise<void> => {
  await api.post(API_ENDPOINTS.FEED.VOTE_POLL(postId, optionId));
};

/**
 * Toggle comments on a post
 */
export const toggleComments = async (postId: string): Promise<any> => {
  const response = await api.post<ApiResponse<any>>(
    `${API_ENDPOINTS.FEED.CREATE_POST}/${postId}/toggle-comments`
  );
  return response.data.data;
};

/**
 * Delete a post
 */
export const deletePost = async (postId: string): Promise<void> => {
  await api.delete(`${API_ENDPOINTS.FEED.CREATE_POST}/${postId}`);
};

/**
 * Get poll details
 */
export const getPollDetails = async (postId: string): Promise<any> => {
  const response = await api.get<ApiResponse<any>>(
    API_ENDPOINTS.FEED.GET_POLL(postId)
  );
  return response.data.data;
};

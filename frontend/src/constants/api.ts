/**
 * API Endpoints - All routes through API Gateway (port 9191)
 */

export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:9191';
export const IMAGE_BASE_URL = `${API_BASE_URL}/us/uploads/`;
export const WS_BASE_URL = process.env.REACT_APP_WS_URL || 'http://localhost:9191/ws';
export const CHAT_WS_URL = process.env.REACT_APP_CHAT_WS_URL || 'http://localhost:9191/ws-chat';

/**
 * API Endpoints organized by service
 */
export const API_ENDPOINTS = {
  // User Service (us/*)
  USER: {
    LOGIN: '/us/login/user',
    SIGNUP: '/us/user/add',
    USER_DETAIL: '/us/user/me',
    GET_ALL_USERS: '/us/user/getAllUserDetail',
    GET_BY_ID: (userId: string) => `/us/user/user/${userId}`,
    GET_BY_INTERNAL_ID: (userId: string) => `/us/user/${userId}`,
    SEARCH: '/us/user/search',
    ADVANCED_SEARCH: '/us/user/advanced-search',
    REFRESH_TOKEN: '/us/login/user/refresh-token',
    PRIVACY: '/us/user/privacy',
    BLOCK: (userId: string) => `/us/user/block/${userId}`,
    UNBLOCK: (userId: string) => `/us/user/unblock/${userId}`,
  },

  // Profile Service (ps/*)
  PROFILE: {
    GET_ME: '/ps/profiles/me',
    SEARCH: '/ps/profiles/search',
    ADVANCED_SEARCH: '/ps/profiles/advanced-search',
    UPDATE: '/ps/profiles',
    GET_BY_ID: (userId: string) => `/ps/profiles/${userId}`,
  },

  // Feed Service (ps/*)
  FEED: {
    GET: '/ps/feed',
    CREATE_POST: '/us/posts',
    REACT_POST: (postId: string) => `/us/posts/${postId}/react`,
    GET_REACTION: (postId: string) => `/us/posts/${postId}/reaction`,
    GET_REACTION_COUNT: (postId: string) => `/us/posts/${postId}/reactions/count`,
    COMMENT: (postId: string) => `/us/posts/${postId}/comments`,
    DELETE_COMMENT: (commentId: string) => `/us/posts/comments/${commentId}`,
    GET_COMMENTS: (postId: string) => `/us/posts/${postId}/comments`,
    CREATE_POLL: '/us/posts/polls',
    VOTE_POLL: (postId: string, optionId: string) => `/us/posts/${postId}/polls/vote/${optionId}`,
    GET_POLL: (postId: string) => `/us/posts/${postId}/polls`,
  },

  // Job Service (js/*)
  JOBS: {
    GET_ALL: '/js/jobs',
    GET_BY_ID: (jobId: string) => `/js/jobs/${jobId}`,
    CREATE: '/js/jobs',
    UPDATE: (jobId: string) => `/js/jobs/${jobId}`,
    DELETE: (jobId: string) => `/js/jobs/${jobId}`,
    APPLY: (jobId: string) => `/js/jobs/${jobId}/apply`,
    GET_APPLICANTS: (jobId: string) => `/js/jobs/${jobId}/applicants`,
    SEARCH: '/js/jobs/search',
    ADVANCED_SEARCH: '/js/jobs/advanced-search',
  },

  // Notification Service (ns/*)
  NOTIFICATIONS: {
    GET_ALL: '/ns/notifications',
    GET_UNREAD: '/ns/notifications/unread',
    MARK_READ: (notificationId: string) => `/ns/notifications/${notificationId}/read`,
    DELETE: (notificationId: string) => `/ns/notifications/${notificationId}`,
  },

  // Connection/Network Service
  NETWORK: {
    GET_CONNECTIONS: '/ps/connections',
    SEND_CONNECTION_REQUEST: '/ps/connections/request',
    RESPOND_CONNECTION: (connectionId: string) => `/ps/connections/${connectionId}/respond`,
    GET_PENDING_REQUESTS: '/ps/connections/pending',
    GET_SUGGESTIONS: '/ps/connections/recommendations',
  },

  // View Profile Service
  PROFILE_VIEWS: {
    GET_VIEWS: '/ps/profiles/me/views',
    GET_COUNT: '/ps/profiles/me/views/count',
    GET_TRENDS: '/ps/profiles/me/views/trends',
    GET_DEMOGRAPHICS: '/ps/profiles/me/views/demographics',
  },

  // Chat/Messaging Service (cs/*)
  CHAT: {
    GET_MESSAGES: (recipientId: string) => `/cs/messages/${recipientId}`,
    MARK_READ: (senderId: string) => `/cs/messages/read/${senderId}`,
  },

  // Search Service (ss/*)
  SEARCH: {
    USERS: '/ss/api/search/users',
    JOBS: '/ss/api/search/jobs',
    TRENDING_HASHTAGS: '/ss/api/search/trending-hashtags',
  },
};

// Query Parameters
export const QUERY_PARAMS = {
  PAGE: 'page',
  SIZE: 'size',
  QUERY: 'query',
  FILTER: 'filter',
  SORT: 'sort',
};

// Default Pagination
export const PAGINATION = {
  DEFAULT_PAGE: 0,
  DEFAULT_SIZE: 10,
  FEED_SIZE: 10,
  JOBS_SIZE: 20,
};

import api from './axiosConfig';


export const searchUsers = async (query) => {
  const response = await api.get(`/us/user/search?query=${query}`);
  return response.data;
};

export const searchProfiles = async (filters) => {
  const params = new URLSearchParams(filters).toString();
  const response = await api.get(`/ps/profiles/search?${params}`);
  return response.data;
};

export const login = async (userName, password) => {
  const response = await api.post('/us/login/user', { userName, password });
  // The backend wraps AccessTokenResponse inside BaseResponse result
  return response.data;
};

export const signup = async (userData) => {
  const response = await api.post('/us/user/add', userData);
  return response.data;
};

export const getUserDetail = async () => {
  const response = await api.get('/us/user/detail');
  return response.data;
};

export const getAllUsers = async (page = 0, size = 10) => {
  const response = await api.get(`/us/user/getAllUserDetail?page=${page}&size=${size}`);
  return response.data;
};

export const getProfile = async () => {
  const response = await api.get('/ps/profiles/me');
  return response.data;
};

export const getUserById = async (userId) => {
  const response = await api.get(`/us/user/user/${userId}`);
  return response.data;
};

export const getUserByInternalId = async (userId) => {
  const response = await api.get(`/us/user/${userId}`);
  return response.data;
};

export const getUserProfileById = async (userId) => {
  const response = await api.get(`/ps/profiles/${userId}`);
  return response.data;
};

export const getUserPosts = async (userId) => {
  const response = await api.get(`/ps/profiles/${userId}/posts`);
  return response.data;
};

// Job APIs
export const getJobs = async () => {
  const response = await api.get('/js/jobs');
  return response.data;
};

export const postJob = async (jobData) => {
  const response = await api.post('/js/jobs', jobData);
  return response.data;
};

export const searchJobs = async (filters) => {
  const params = new URLSearchParams(filters).toString();
  const response = await api.get(`/js/jobs/search?${params}`);
  return response.data;
};

export const applyToJob = async (jobId) => {
  const response = await api.post(`/js/jobs/${jobId}/apply`);
  return response.data;
};

export const getMyApplications = async () => {
  const response = await api.get('/js/jobs/my-applications');
  return response.data;
};

export const getMyPostings = async () => {
  const response = await api.get('/js/jobs/my-postings');
  return response.data;
};

export const getJobApplicants = async (jobId) => {
  const response = await api.get(`/js/jobs/${jobId}/applicants`);
  return response.data;
};

export const updateApplicationStatus = async (applicationId, status) => {
  const response = await api.put(`/js/jobs/applications/${applicationId}/status?status=${status}`);
  return response.data;
};

export const sendConnectionRequest = async (receiverId) => {
  const response = await api.post('/ps/connections/request', { receiverId });
  return response.data;
};

export const getConnectionStatus = async (otherUserId) => {
  const response = await api.get(`/ps/connections/status/${otherUserId}`);
  return response.data;
};

export const respondToConnectionRequest = async (connectionId, accept) => {
  const acceptStr = accept ? 'true' : 'false';
  const response = await api.post(`/ps/connections/${connectionId}/respond?accept=${acceptStr}`);
  return response.data;
};

export const cancelConnectionRequest = async (connectionId) => {
  const response = await api.delete(`/ps/connections/${connectionId}/cancel`);
  return response.data;
};

export const updateProfile = async (profileData) => {
  const response = await api.post('/ps/profiles', profileData);
  return response.data;
};

export const getNotifications = async () => {
  const response = await api.get('/ns/notifications');
  return response.data;
};

export const markNotificationAsRead = async (id) => {
  const response = await api.put(`/ns/notifications/${id}/read`);
  return response.data;
};

export const getProfileViews = async () => {
  const response = await api.get('/ps/profiles/me/views');
  return response.data;
};

export const getProfileViewCount = async () => {
  const response = await api.get('/ps/profiles/me/views/count');
  return response.data;
};

export const getProfileViewTrends = async () => {
  const response = await api.get('/ps/profiles/me/views/trends');
  return response.data;
};

export const getPendingConnections = async () => {
  const response = await api.get('/ps/connections/pending');
  return response.data;
};

export const getMyConnections = async () => {
  const response = await api.get('/ps/connections');
  return response.data;
};

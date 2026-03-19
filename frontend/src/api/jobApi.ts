/**
 * Job Service API Endpoints
 */

import api from './axiosConfig';
import { API_ENDPOINTS, PAGINATION } from '../constants/api';
import {
  Job,
  JobApplication,
  JobCreateRequest,
  ApiResponse,
  PaginatedResponse,
  SearchFilter
} from '../types';

/**
 * Get all jobs with pagination
 */
export const getAllJobs = async (
  page = PAGINATION.DEFAULT_PAGE,
  size = PAGINATION.JOBS_SIZE
): Promise<PaginatedResponse<Job>> => {
  const response = await api.get<ApiResponse<PaginatedResponse<Job>>>(
    API_ENDPOINTS.JOBS.GET_ALL,
    { params: { page, size } }
  );
  return response.data.result;
};

/**
 * Get jobs posted by current user
 */
export const getMyPostings = async (): Promise<Job[]> => {
  const response = await api.get<ApiResponse<Job[]>>(
    '/js/jobs/my-postings'
  );
  return response.data.result;
};

/**
 * Get job by ID
 */
export const getJobById = async (jobId: string): Promise<Job> => {
  const response = await api.get<ApiResponse<Job>>(
    API_ENDPOINTS.JOBS.GET_BY_ID(jobId)
  );
  return response.data.result;
};

/**
 * Create a new job posting
 */
export const createJob = async (jobData: JobCreateRequest): Promise<Job> => {
  const response = await api.post<ApiResponse<Job>>(
    API_ENDPOINTS.JOBS.CREATE,
    jobData
  );
  return response.data.result;
};

/**
 * Update a job posting
 */
export const updateJob = async (
  jobId: string,
  jobData: Partial<JobCreateRequest>
): Promise<Job> => {
  const response = await api.put<ApiResponse<Job>>(
    API_ENDPOINTS.JOBS.UPDATE(jobId),
    jobData
  );
  return response.data.result;
};

/**
 * Delete a job posting
 */
export const deleteJob = async (jobId: string): Promise<any> => {
  const response = await api.delete<ApiResponse<any>>(
    API_ENDPOINTS.JOBS.DELETE(jobId)
  );
  return response.data.result;
};

/**
 * Apply for a job
 */
export const applyForJob = async (jobId: string): Promise<JobApplication> => {
  const response = await api.post<ApiResponse<JobApplication>>(
    API_ENDPOINTS.JOBS.APPLY(jobId)
  );
  return response.data.result;
};

/**
 * Get current user's job applications
 */
export const getMyApplications = async (): Promise<JobApplication[]> => {
  const response = await api.get<ApiResponse<JobApplication[]>>(
    '/js/jobs/my-applications'
  );
  return response.data.result;
};

/**
 * Get job applicants (for recruiters)
 */
export const getJobApplicants = async (
  jobId: string,
  page = 0,
  size = 10
): Promise<PaginatedResponse<JobApplication>> => {
  const response = await api.get<ApiResponse<PaginatedResponse<JobApplication>>>(
    API_ENDPOINTS.JOBS.GET_APPLICANTS(jobId),
    { params: { page, size } }
  );
  return response.data.result;
};

/**
 * Search jobs
 */
export const searchJobs = async (
  filters: SearchFilter
): Promise<PaginatedResponse<Job>> => {
  const params = new URLSearchParams();

  if (filters.query) params.append('query', filters.query);
  if (filters.page !== undefined) params.append('page', filters.page.toString());
  if (filters.size !== undefined) params.append('size', filters.size.toString());
  if (filters.sortBy) params.append('sortBy', filters.sortBy);
  if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);

  if (filters.title) params.append('title', filters.title);
  if (filters.company) params.append('company', filters.company);
  if (filters.location) params.append('location', filters.location);
  if (filters.jobType) params.append('jobType', filters.jobType);

  const response = await api.get<ApiResponse<PaginatedResponse<Job>>>(
    API_ENDPOINTS.JOBS.SEARCH,
    { params }
  );
  return response.data.result;
};

/**
 * Update job application status (for recruiters)
 */
export const updateApplicationStatus = async (
  jobId: string,
  applicantId: string,
  status: string
): Promise<JobApplication> => {
  const response = await api.patch<ApiResponse<JobApplication>>(
    `${API_ENDPOINTS.JOBS.GET_APPLICANTS(jobId)}/${applicantId}`,
    { status }
  );
  return response.data.result;
};

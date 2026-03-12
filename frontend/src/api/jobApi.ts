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
} from '../types';

/**
 * Get all jobs with pagination
 */
export const getAllJobs = async (
  page = PAGINATION.DEFAULT_PAGE,
  size = PAGINATION.JOBS_SIZE
): Promise<ApiResponse<PaginatedResponse<Job>>> => {
  const response = await api.get<ApiResponse<PaginatedResponse<Job>>>(
    API_ENDPOINTS.JOBS.GET_ALL,
    { params: { page, size } }
  );
  return response.data;
};

/**
 * Get job by ID
 */
export const getJobById = async (jobId: string): Promise<ApiResponse<Job>> => {
  const response = await api.get<ApiResponse<Job>>(
    API_ENDPOINTS.JOBS.GET_BY_ID(jobId)
  );
  return response.data;
};

/**
 * Create a new job posting
 */
export const createJob = async (jobData: JobCreateRequest): Promise<ApiResponse<Job>> => {
  const response = await api.post<ApiResponse<Job>>(
    API_ENDPOINTS.JOBS.CREATE,
    jobData
  );
  return response.data;
};

/**
 * Update a job posting
 */
export const updateJob = async (
  jobId: string,
  jobData: Partial<JobCreateRequest>
): Promise<ApiResponse<Job>> => {
  const response = await api.put<ApiResponse<Job>>(
    API_ENDPOINTS.JOBS.UPDATE(jobId),
    jobData
  );
  return response.data;
};

/**
 * Delete a job posting
 */
export const deleteJob = async (jobId: string): Promise<ApiResponse<any>> => {
  const response = await api.delete<ApiResponse<any>>(
    API_ENDPOINTS.JOBS.DELETE(jobId)
  );
  return response.data;
};

/**
 * Apply for a job
 */
export const applyForJob = async (jobId: string): Promise<ApiResponse<JobApplication>> => {
  const response = await api.post<ApiResponse<JobApplication>>(
    API_ENDPOINTS.JOBS.APPLY(jobId)
  );
  return response.data;
};

/**
 * Get job applicants (for recruiters)
 */
export const getJobApplicants = async (
  jobId: string,
  page = 0,
  size = 10
): Promise<ApiResponse<PaginatedResponse<JobApplication>>> => {
  const response = await api.get<ApiResponse<PaginatedResponse<JobApplication>>>(
    API_ENDPOINTS.JOBS.GET_APPLICANTS(jobId),
    { params: { page, size } }
  );
  return response.data;
};

/**
 * Search jobs
 */
export const searchJobs = async (
  query: string,
  page = 0,
  size = PAGINATION.JOBS_SIZE
): Promise<ApiResponse<PaginatedResponse<Job>>> => {
  const response = await api.get<ApiResponse<PaginatedResponse<Job>>>(
    API_ENDPOINTS.JOBS.SEARCH,
    { params: { query, page, size } }
  );
  return response.data;
};

/**
 * Update job application status (for recruiters)
 */
export const updateApplicationStatus = async (
  jobId: string,
  applicantId: string,
  status: 'REVIEWING' | 'SHORTLISTED' | 'REJECTED' | 'ACCEPTED'
): Promise<ApiResponse<JobApplication>> => {
  const response = await api.patch<ApiResponse<JobApplication>>(
    `${API_ENDPOINTS.JOBS.GET_APPLICANTS(jobId)}/${applicantId}`,
    { status }
  );
  return response.data;
};

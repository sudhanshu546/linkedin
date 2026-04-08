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
  SearchFilter,
  AdvanceSearchCriteria,
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
  return response.data.data;
};

/**
 * Get jobs posted by current user
 */
export const getMyPostings = async (): Promise<Job[]> => {
  const response = await api.get<ApiResponse<Job[]>>(
    API_ENDPOINTS.JOBS.MY_POSTINGS
  );
  return response.data.data;
};

/**
 * Get job by ID
 */
export const getJobById = async (jobId: string): Promise<Job> => {
  const response = await api.get<ApiResponse<Job>>(
    API_ENDPOINTS.JOBS.GET_BY_ID(jobId)
  );
  return response.data.data;
};

/**
 * Create a new job posting
 */
export const createJob = async (jobData: JobCreateRequest): Promise<Job> => {
  const response = await api.post<ApiResponse<Job>>(
    API_ENDPOINTS.JOBS.CREATE,
    jobData
  );
  return response.data.data;
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
  return response.data.data;
};

/**
 * Delete a job posting
 */
export const deleteJob = async (jobId: string): Promise<any> => {
  const response = await api.delete<ApiResponse<any>>(
    API_ENDPOINTS.JOBS.DELETE(jobId)
  );
  return response.data.data;
};

/**
 * Apply for a job
 */
export const applyForJob = async (
  jobId: string,
  resumeUrl?: string,
  coverLetter?: string
): Promise<JobApplication> => {
  const response = await api.post<ApiResponse<JobApplication>>(
    API_ENDPOINTS.JOBS.APPLY(jobId),
    { resumeUrl, coverLetter }
  );
  return response.data.data;
};

/**
 * Get current user's job applications
 */
export const getMyApplications = async (): Promise<JobApplication[]> => {
  const response = await api.get<ApiResponse<JobApplication[]>>(
    API_ENDPOINTS.JOBS.MY_APPLICATIONS
  );
  return response.data.data;
};

/**
 * Get job applicants (for recruiters)
 */
export const getJobApplicants = async (
  jobId: string,
  status?: string,
  page = 0,
  size = 10
): Promise<PaginatedResponse<JobApplication>> => {
  const response = await api.get<ApiResponse<PaginatedResponse<JobApplication>>>(
    API_ENDPOINTS.JOBS.GET_APPLICANTS(jobId),
    { params: { status, page, size } }
  );
  return response.data.data;
};

/**
 * Search jobs using advanced filtering
 */
export const searchJobs = async (
  filters: SearchFilter
): Promise<PaginatedResponse<Job>> => {
  const criteria: AdvanceSearchCriteria = {
    pageNumber: filters.page || 0,
    pageSize: filters.size || PAGINATION.JOBS_SIZE,
    filters: [],
    relation: 'AND'
  };

  if (filters.query) {
    criteria.filters.push({
      columnName: 'title', // Searching in title by default for query
      operator: 'CONTAINS',
      values: [filters.query],
      relation: 'OR'
    });
    criteria.filters.push({
      columnName: 'description',
      operator: 'CONTAINS',
      values: [filters.query],
      relation: 'OR'
    });
    criteria.filters.push({
      columnName: 'company',
      operator: 'CONTAINS',
      values: [filters.query],
      relation: 'OR'
    });
  }

  if (filters.title) {
    criteria.filters.push({
      columnName: 'title',
      operator: 'CONTAINS',
      values: [filters.title],
      relation: 'AND'
    });
  }

  if (filters.company) {
    criteria.filters.push({
      columnName: 'company',
      operator: 'EQUALS',
      values: [filters.company],
      relation: 'AND'
    });
  }

  if (filters.location) {
    criteria.filters.push({
      columnName: 'location',
      operator: 'CONTAINS',
      values: [filters.location],
      relation: 'AND'
    });
  }

  if (filters.jobType) {
    criteria.filters.push({
      columnName: 'jobType',
      operator: 'EQUALS',
      values: [filters.jobType],
      relation: 'AND'
    });
  }

  // Handle sorting if provided
  if (filters.sortBy) {
    criteria.filters.push({
      columnName: filters.sortBy,
      operator: 'EQUALS', // Dummy operator for sort-only filters if needed, or handled by backend
      values: [],
      sortDirection: filters.sortOrder || 'DESC'
    });
  }

  const response = await api.post<ApiResponse<PaginatedResponse<Job>>>(
    API_ENDPOINTS.JOBS.ADVANCED_SEARCH,
    criteria
  );
  return response.data.data;
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
    API_ENDPOINTS.JOBS.UPDATE_STATUS(jobId, applicantId),
    { status }
  );
  return response.data.data;
};

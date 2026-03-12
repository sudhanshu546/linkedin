/**
 * Error Handling Utility Functions
 */

import { AxiosError } from 'axios';
import { ApiResponse } from '../types';
import { ERROR_MESSAGES } from '../constants/messages';

export interface ApiError {
  status: number;
  message: string;
  details?: any;
  originalError?: AxiosError;
}

export const handleApiError = (error: unknown): ApiError => {
  // Handle Axios error
  if (error instanceof AxiosError) {
    const response = error.response;

    if (response?.status === 401) {
      return {
        status: 401,
        message: ERROR_MESSAGES.UNAUTHORIZED,
        originalError: error,
      };
    }

    if (response?.status === 403) {
      return {
        status: 403,
        message: ERROR_MESSAGES.FORBIDDEN,
        originalError: error,
      };
    }

    if (response?.status === 404) {
      return {
        status: 404,
        message: ERROR_MESSAGES.NOT_FOUND,
        originalError: error,
      };
    }

    if (response?.status === 400) {
      return {
        status: 400,
        message: response.data?.message || ERROR_MESSAGES.VALIDATION_ERROR,
        details: response.data?.details,
        originalError: error,
      };
    }

    if (response?.status >= 500) {
      return {
        status: response.status,
        message: ERROR_MESSAGES.SERVER_ERROR,
        originalError: error,
      };
    }

    if (!error.response) {
      return {
        status: 0,
        message: ERROR_MESSAGES.NETWORK_ERROR,
        originalError: error,
      };
    }

    return {
      status: response?.status || 500,
      message: response?.data?.message || ERROR_MESSAGES.SOMETHING_WENT_WRONG,
      details: response?.data?.details,
      originalError: error,
    };
  }

  // Handle generic Error
  if (error instanceof Error) {
    return {
      status: 500,
      message: error.message,
    };
  }

  // Fallback
  return {
    status: 500,
    message: ERROR_MESSAGES.SOMETHING_WENT_WRONG,
  };
};

export const getErrorMessage = (error: unknown): string => {
  if (error instanceof AxiosError) {
    return error.response?.data?.message || error.message || ERROR_MESSAGES.SOMETHING_WENT_WRONG;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return ERROR_MESSAGES.SOMETHING_WENT_WRONG;
};

export const isApiError = (error: any): boolean => {
  return error instanceof AxiosError && error.response !== undefined;
};

export const isNetworkError = (error: unknown): boolean => {
  if (error instanceof AxiosError) {
    return error.code === 'ECONNABORTED' || !error.response;
  }
  return false;
};

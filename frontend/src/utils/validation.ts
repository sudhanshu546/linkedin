/**
 * Validation Utility Functions
 */

import { VALIDATION_MESSAGES } from '../constants/messages';

export interface ValidationError {
  [key: string]: string;
}

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): boolean => {
  // At least 8 characters
  return password.length >= 8;
};

export const validatePhoneNumber = (phone: string): boolean => {
  // Basic phone validation (10-15 digits)
  const phoneRegex = /^\+?[\d\s\-()]{10,15}$/;
  return phoneRegex.test(phone);
};

export const validateUsername = (username: string): boolean => {
  // Alphanumeric, underscore, hyphen, 3-20 chars
  const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/;
  return usernameRegex.test(username);
};

export const validateUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// Form validation
export interface LoginFormData {
  userName: string;
  password: string;
}

export interface SignupFormData {
  firstName: string;
  lastName: string;
  email: string;
  userName: string;
  password: string;
  confirmPassword: string;
}

export const validateLoginForm = (data: LoginFormData): ValidationError => {
  const errors: ValidationError = {};

  if (!data.userName?.trim()) {
    errors.userName = VALIDATION_MESSAGES.USERNAME_REQUIRED;
  }

  if (!data.password) {
    errors.password = VALIDATION_MESSAGES.PASSWORD_REQUIRED;
  } else if (data.password.length < 8) {
    errors.password = VALIDATION_MESSAGES.PASSWORD_MIN_LENGTH;
  }

  return errors;
};

export const validateSignupForm = (data: SignupFormData): ValidationError => {
  const errors: ValidationError = {};

  if (!data.firstName?.trim()) {
    errors.firstName = VALIDATION_MESSAGES.FIRST_NAME_REQUIRED;
  }

  if (!data.lastName?.trim()) {
    errors.lastName = VALIDATION_MESSAGES.LAST_NAME_REQUIRED;
  }

  if (!data.email) {
    errors.email = VALIDATION_MESSAGES.EMAIL_REQUIRED;
  } else if (!validateEmail(data.email)) {
    errors.email = VALIDATION_MESSAGES.EMAIL_INVALID;
  }

  if (!data.userName?.trim()) {
    errors.userName = VALIDATION_MESSAGES.USERNAME_REQUIRED;
  } else if (!validateUsername(data.userName)) {
    errors.userName = 'Username must be 3-20 characters (alphanumeric, underscore, hyphen)';
  }

  if (!data.password) {
    errors.password = VALIDATION_MESSAGES.PASSWORD_REQUIRED;
  } else if (!validatePassword(data.password)) {
    errors.password = VALIDATION_MESSAGES.PASSWORD_MIN_LENGTH;
  }

  if (data.password !== data.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match';
  }

  return errors;
};

export const hasErrors = (errors: ValidationError): boolean => {
  return Object.keys(errors).length > 0;
};

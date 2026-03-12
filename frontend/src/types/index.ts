/**
 * TypeScript Types and Interfaces
 */

// API Response Types
export interface ApiResponse<T> {
  status: number;
  message: string;
  result: T;
  success: boolean;
}

export interface PaginatedResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  isLast: boolean;
}

// Auth Types
export interface LoginRequest {
  userName: string;
  password: string;
}

export interface SignupRequest {
  firstName: string;
  lastName: string;
  email: string;
  userName: string;
  password: string;
  phoneNumber?: string;
}

export interface AccessTokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

// User Types
export interface User {
  id: string;
  userId?: string;
  firstName: string;
  lastName: string;
  userName: string;
  email: string;
  phoneNumber?: string;
  profilePictureUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserDetail extends User {
  roles?: string[];
  isActive?: boolean;
  lastLogin?: string;
}

// Profile Types
export interface Profile {
  id: string;
  userId: string;
  headline?: string;
  bio?: string;
  profilePictureUrl?: string;
  coverPictureUrl?: string;
  location?: string;
  industry?: string;
  experience?: Experience[];
  education?: Education[];
  skills?: Skill[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Experience {
  id?: string;
  position: string;
  company: string;
  startDate: string;
  endDate?: string;
  isCurrentlyWorking: boolean;
  description?: string;
}

export interface Education {
  id?: string;
  institution: string;
  degree: string;
  fieldOfStudy: string;
  startDate: string;
  endDate?: string;
}

export interface Skill {
  id?: string;
  name: string;
  endorsements?: number;
}

// Post Types
export interface Post {
  id: string;
  userId: string;
  user?: User;
  content: string;
  images?: string[];
  likeCount: number;
  commentCount: number;
  isLiked: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  user?: User;
  content: string;
  createdAt: string;
  updatedAt?: string;
}

export interface PostCreateRequest {
  content: string;
  images?: File[];
}

// Job Types
export interface Job {
  id: string;
  userId: string;
  title: string;
  description: string;
  company: string;
  location: string;
  jobType: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'TEMPORARY';
  salary?: {
    minSalary: number;
    maxSalary: number;
    currency: string;
  };
  requiredSkills: string[];
  applicantCount?: number;
  postedDate?: string;
  deadline?: string;
}

export interface JobApplication {
  id: string;
  jobId: string;
  userId: string;
  user?: User;
  status: 'APPLIED' | 'REVIEWING' | 'SHORTLISTED' | 'REJECTED' | 'ACCEPTED';
  appliedDate: string;
  updatedDate?: string;
}

export interface JobCreateRequest {
  title: string;
  description: string;
  company: string;
  location: string;
  jobType: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'TEMPORARY';
  salary?: {
    minSalary: number;
    maxSalary: number;
    currency: string;
  };
  requiredSkills: string[];
  deadline?: string;
}

// Connection Types
export interface Connection {
  id: string;
  userId: string;
  connectedUserId: string;
  connectedUser?: User;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  createdAt: string;
  updatedAt?: string;
}

export interface ConnectionRequest extends Connection {
  message?: string;
}

// Notification Types
export interface Notification {
  id: string;
  userId: string;
  type: 'POST_LIKE' | 'COMMENT' | 'CONNECTION_REQUEST' | 'JOB_APPLIED' | 'MESSAGE';
  title: string;
  message: string;
  relatedUserId?: string;
  relatedPostId?: string;
  isRead: boolean;
  createdAt: string;
}

// Context Types
export interface UserContextType {
  user: UserDetail | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (userName: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (user: UserDetail) => void;
}

export interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  fetchNotifications: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
}

// State Types
export interface PaginationState {
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface AsyncState<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
}

// UI/Form Types
export interface FormError {
  [key: string]: string;
}

export interface SearchFilter {
  query?: string;
  page?: number;
  size?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

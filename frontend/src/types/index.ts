/**
 * TypeScript Types and Interfaces
 */

// API Response Types
export interface ApiResponse<T> {
  status: 'success' | 'fail' | 'error';
  message: string;
  data: T;
  metadata?: {
    page: number;
    size: number;
    total: number;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  metadata: {
    page: number;
    size: number;
    total: number;
  };
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
  profileImageUrl?: string;
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
  profileImageUrl?: string;
  coverPictureUrl?: string;
  location?: string;
  industry?: string;
  experience?: Experience[];
  education?: Education[];
  skills?: Skill[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ProfileDTO {
  id: string;
  userId: string;
  headline: string;
  summary: string;
  skills: string;
  city: string;
  state: string;
  experienceYears: number;
  currentCompany: string;
  designation: string;
  coverImageUrl?: string;
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
export interface PollOption {
  id: string;
  text: string;
  voteCount: number;
}

export interface Poll {
  id: string;
  question: string;
  options: PollOption[];
  expiryDate: string;
  hasVoted: boolean;
  selectedOptionId?: string;
}

export interface Post {
  id: string;
  userId: string;
  user?: User;
  content: string;
  imageUrls?: string[];
  likeCount: number;
  commentCount: number;
  isLiked: boolean;
  createdDate: number;
  lastModifiedDate?: number;
  isPoll?: boolean;
  pollQuestion?: string;
  pollOptions?: string[];
  pollExpiryDate?: string;
  poll?: Poll;
  commentsDisabled?: boolean;
}

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  user?: User;
  content: string;
  createdDate: number;
  lastModifiedDate?: number;
}

export interface PostCreateRequest {
  content: string;
  images?: File[];
  isPoll?: boolean;
  pollQuestion?: string;
  pollOptions?: string[];
  pollExpiryDate?: string;
}

export interface PollVoteRequest {
  postId: string;
  optionId: string;
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
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  appliedDate: string;
  updatedDate?: string;
  resumeUrl?: string;
  coverLetter?: string;
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

// Privacy Settings Types
export interface PrivacySettings {
  profileVisibility: 'PUBLIC' | 'CONNECTIONS' | 'PRIVATE';
  showEmail: boolean;
  showConnections: boolean;
  allowMessagesFrom: 'EVERYONE' | 'CONNECTIONS';
}

export interface PrivacySettingsDTO extends PrivacySettings {}

// Analytics Types
export interface DailyProfileView {
  id: string;
  profileOwnerId: string;
  viewDate: string;
  viewCount: number;
}

export interface ProfileDemographics {
  titles: Record<string, number>;
  companies: Record<string, number>;
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
  read: boolean;
  createdAt: string;
}

// Chat Types
export interface ChatMessage {
  id?: string;
  senderId: string;
  recipientId: string;
  content: string;
  isRead: boolean;
  timestamp: string;
}

// Context Types
export interface UserContextType {
  user: UserDetail | null;
  loading: boolean;
  setUser: (user: UserDetail | null) => void;
  fetchUser: () => Promise<void>;
  logout: () => void;
}

export interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  fetchNotifications: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
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
  title?: string;
  company?: string;
  location?: string;
  jobType?: string;
}

export type FilterOperator = 
  | 'IS' 
  | 'ISNOT' 
  | 'CONTAINS' 
  | 'NOTCONTAINS' 
  | 'EQUALS' 
  | 'ISEMPTY' 
  | 'ISNOTEMPTY' 
  | 'NOTEQUALS' 
  | 'GREATERTHAN' 
  | 'GREATERTHANOREQUAL' 
  | 'LESSTHAN' 
  | 'LESSTHANOREQUAL' 
  | 'BETWEEN' 
  | 'IN';

export interface FilterCriteria {
  columnName: string;
  operator: FilterOperator;
  values: string[];
  relation?: 'AND' | 'OR';
  sortDirection?: 'ASC' | 'DESC';
}

export interface AdvanceSearchCriteria {
  pageNumber: number;
  pageSize: number;
  filters: FilterCriteria[];
  relation?: 'AND' | 'OR';
}

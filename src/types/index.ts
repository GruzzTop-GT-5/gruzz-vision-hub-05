// Core data models and types for the application
// This file centralizes all TypeScript interfaces for maintainability

export interface User {
  id: string;
  phone?: string;
  display_name?: string;
  telegram_id?: number;
  telegram_username?: string;
  telegram_photo_url?: string;
  is_premium?: boolean;
  role: 'user' | 'system_admin' | 'admin' | 'moderator' | 'support';
  rating: number;
  reviews_count?: number;
  verified_reviews_count?: number;
  rating_distribution?: {
    "1": number;
    "2": number;
    "3": number;
    "4": number;
    "5": number;
  };
  balance: number;
  created_at?: string;
}

export interface Ad {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  category: string;
  price: number;
  status: 'active' | 'inactive' | 'sold';
  created_at?: string;
  user?: User;
}

export interface Transaction {
  id: string;
  user_id: string;
  type: 'deposit' | 'withdrawal' | 'payment';
  amount: number;
  status: 'pending' | 'rejected' | 'completed';
  payment_method?: 'bank_card' | 'yoomoney' | 'ozon' | 'manual_transfer';
  payment_details?: Record<string, any>;
  proof_image?: string;
  admin_notes?: string;
  processed_by?: string;
  created_at?: string;
  completed_at?: string;
  user?: User;
}

export interface Review {
  id: string;
  author_id: string;
  target_user_id: string;
  transaction_id?: string;
  rating?: number;
  comment?: string;
  is_moderated: boolean;
  is_reported: boolean;
  admin_bonus_points: number;
  admin_comment?: string;
  is_hidden: boolean;
  hidden_by?: string;
  hidden_at?: string;
  moderated_by?: string;
  moderated_at?: string;
  created_at?: string;
  author?: User;
  target_user?: User;
}

export interface Conversation {
  id: string;
  participants: string[];
  created_by: string;
  type: 'chat' | 'support';
  title?: string;
  category?: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: 'active' | 'closed' | 'archived';
  assigned_to?: string;
  last_message_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content?: string;
  message_type: 'text' | 'file' | 'system';
  file_url?: string;
  file_name?: string;
  file_type?: string;
  file_size?: number;
  is_edited: boolean;
  is_deleted: boolean;
  metadata?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
  sender?: User;
  reactions?: MessageReaction[];
}

export interface MessageReaction {
  id: string;
  message_id: string;
  user_id: string;
  reaction: string;
  created_at?: string;
  user?: User;
}

export interface Notification {
  id: string;
  user_id: string;
  type: 'message' | 'transaction' | 'review' | 'system';
  title: string;
  content?: string;
  conversation_id?: string;
  message_id?: string;
  is_read: boolean;
  created_at?: string;
}

export interface SupportTicket {
  id: string;
  ticket_number: string;
  created_by: string;
  conversation_id: string;
  subject: string;
  description?: string;
  category?: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  urgency: 'low' | 'normal' | 'high' | 'critical';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  assigned_to?: string;
  response_time_minutes?: number;
  resolved_at?: string;
  created_at?: string;
  updated_at?: string;
  creator?: User;
  assignee?: User;
}

export interface ReviewReport {
  id: string;
  review_id: string;
  reporter_id: string;
  reason: string;
  processed: boolean;
  processed_by?: string;
  processed_at?: string;
  created_at?: string;
  review?: Review;
  reporter?: User;
}

export interface AdminLog {
  id: string;
  user_id: string;
  action: string;
  target_type?: string;
  target_id?: string;
  timestamp?: string;
  user?: User;
}

export interface SecurityLog {
  id: string;
  event_type: string;
  user_id?: string;
  ip_address?: string;
  user_agent?: string;
  details?: Record<string, any>;
  severity: 'info' | 'warning' | 'error' | 'critical';
  created_at?: string;
}

// API Response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// Form types
export interface CreateAdForm {
  title: string;
  description: string;
  category: string;
  price: number;
}

export interface TopUpForm {
  amount: number;
  payment_method: 'bank_card' | 'yoomoney' | 'ozon';
  proof_image?: File;
}

export interface ReviewForm {
  rating: number;
  comment: string;
  transaction_id?: string;
}

export interface SupportTicketForm {
  subject: string;
  description: string;
  category: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  urgency: 'low' | 'normal' | 'high' | 'critical';
}

// Filter and search types
export interface AdFilters {
  category?: string;
  priceMin?: number;
  priceMax?: number;
  status?: string;
  search?: string;
}

export interface TransactionFilters {
  type?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export interface UserFilters {
  role?: string;
  search?: string;
  isActive?: boolean;
}

// Configuration types
export interface AppConfig {
  app: {
    name: string;
    version: string;
    environment: 'development' | 'staging' | 'production';
  };
  supabase: {
    url: string;
    anonKey: string;
    projectId: string;
  };
  features: {
    telegramIntegration: boolean;
    paymentMethods: string[];
    maxFileSize: number;
    supportedFileTypes: string[];
  };
  limits: {
    maxAdsPerUser: number;
    maxTransactionAmount: number;
    minTransactionAmount: number;
    rateLimitRequests: number;
    rateLimitWindow: number;
  };
}
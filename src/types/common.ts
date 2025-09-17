// Централизованные типы для всего приложения
export interface User {
  id: string;
  phone: string | null;
  display_name: string | null;
  full_name: string | null;
  bio: string | null;
  role: 'user' | 'admin' | 'system_admin' | 'moderator' | 'support';
  rating: number;
  balance: number;
  created_at: string;
  age: number | null;
  citizenship: string | null;
  qualification: string | null;
  telegram_id?: bigint | null;
  telegram_username?: string | null;
  is_premium?: boolean;
  avatar_url?: string | null;
}

export interface Order {
  id: string;
  title: string;
  description: string;
  category: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'inactive';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  price: number;
  client_id: string;
  executor_id?: string | null;
  created_at: string;
  updated_at: string;
  expires_at: string;
  is_expired: boolean;
  people_needed: number;
  people_accepted: number;
  start_time?: string | null;
  end_time?: string | null;
  deadline?: string | null;
  order_number: string;
  admin_priority_override?: string | null;
  admin_modified_by?: string | null;
  admin_modified_at?: string | null;
}

export interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  type: 'deposit' | 'withdrawal' | 'payment' | 'purchase';
  status: 'pending' | 'completed' | 'rejected';
  payment_method: 'bank_card' | 'yoomoney' | 'ozon' | 'manual_transfer' | null;
  proof_image?: string | null;
  created_at: string;
  completed_at?: string | null;
  admin_notes?: string | null;
  processed_by?: string | null;
  payment_details?: Record<string, any> | null;
}

export interface Review {
  id: string;
  author_id: string;
  target_user_id: string;
  rating: number;
  comment?: string | null;
  transaction_id?: string | null;
  created_at: string;
  is_moderated: boolean;
  is_hidden: boolean;
  is_reported: boolean;
  admin_comment?: string | null;
  admin_bonus_points: number;
  moderated_by?: string | null;
  moderated_at?: string | null;
  hidden_by?: string | null;
  hidden_at?: string | null;
}

export interface SupportTicket {
  id: string;
  ticket_number: string;
  subject: string;
  description?: string | null;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  category?: string | null;
  created_by: string;
  assigned_to?: string | null;
  conversation_id: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string | null;
  response_time_minutes?: number | null;
}

export interface Conversation {
  id: string;
  type: 'chat' | 'support';
  title?: string | null;
  participants: string[];
  created_by: string;
  status: 'active' | 'closed' | 'archived';
  last_message_at: string;
  created_at: string;
  updated_at: string;
  assigned_to?: string | null;
  category?: string | null;
  priority: 'low' | 'normal' | 'high' | 'urgent';
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content?: string | null;
  message_type: 'text' | 'file' | 'image' | 'system';
  file_url?: string | null;
  file_name?: string | null;
  file_type?: string | null;
  file_size?: number | null;
  metadata?: Record<string, any> | null;
  created_at: string;
  updated_at: string;
  is_edited: boolean;
  is_deleted: boolean;
}

export interface Category {
  id: string;
  name: string;
  description?: string | null;
  icon?: string | null;
  color: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Ad {
  id: string;
  title: string;
  description?: string | null;
  category: string;
  category_id: string;
  price: number;
  user_id: string;
  status: 'active' | 'inactive' | 'moderated' | 'rejected';
  created_at: string;
}

export interface UserBan {
  id: string;
  user_id: string;
  ban_type: 'chat' | 'orders' | 'reviews' | 'full_access';
  duration_minutes: number;
  reason?: string | null;
  issued_by: string;
  is_active: boolean;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

// API Response типы
export interface ApiResponse<T> {
  data: T | null;
  error: Error | null;
  loading: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Form типы
export interface AuthFormData {
  phone: string;
  password: string;
  confirmPassword?: string;
  rememberMe?: boolean;
}

export interface OrderFormData {
  title: string;
  description: string;
  category: string;
  price: number;
  deadline?: Date | null;
  people_needed: number;
  start_time?: string | null;
  end_time?: string | null;
  priority: 'low' | 'normal' | 'high' | 'urgent';
}

export interface ReviewFormData {
  rating: number;
  comment?: string;
  transaction_id?: string;
}

export interface SupportTicketFormData {
  subject: string;
  description: string;
  category?: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
}

// Component Props типы
export interface UserProfileProps {
  userId: string;
  showContactInfo?: boolean;
  onContactClick?: () => void;
}

export interface OrderCardProps {
  order: Order;
  onOrderClick?: (order: Order) => void;
  showActions?: boolean;
  currentUserId?: string;
}

export interface ReviewCardProps {
  review: Review;
  showActions?: boolean;
  onEdit?: (review: Review) => void;
  onDelete?: (reviewId: string) => void;
}

// Filter и Sort типы
export interface OrderFilters {
  category?: string;
  priceMin?: number;
  priceMax?: number;
  status?: string[];
  priority?: string[];
  isExpired?: boolean;
}

export interface SortOptions {
  field: string;
  direction: 'asc' | 'desc';
}

// Event типы
export interface OrderEvent {
  type: 'created' | 'updated' | 'status_changed' | 'expired';
  orderId: string;
  userId: string;
  data?: Record<string, any>;
  timestamp: string;
}

export interface UserEvent {
  type: 'profile_updated' | 'balance_changed' | 'role_changed' | 'banned' | 'unbanned';
  userId: string;
  data?: Record<string, any>;
  timestamp: string;
}
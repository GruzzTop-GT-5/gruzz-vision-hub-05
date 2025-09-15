// Centralized API service for all database operations
// This provides a clean abstraction layer for data access

import { supabase } from '@/integrations/supabase/client';
import type { 
  User, 
  Ad, 
  Transaction, 
  Review, 
  Conversation, 
  Message, 
  Notification,
  SupportTicket,
  ApiResponse,
  PaginatedResponse,
  AdFilters,
  TransactionFilters,
  UserFilters
} from '@/types';

class ApiService {
  // User operations
  async getProfile(userId: string): Promise<ApiResponse<User>> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;
      return { data: data as User };
    } catch (error) {
      return { error: (error as Error).message };
    }
  }

  async updateProfile(userId: string, updates: Partial<User>): Promise<ApiResponse<User>> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .maybeSingle();

      if (error) throw error;
      return { data: data as User };
    } catch (error) {
      return { error: (error as Error).message };
    }
  }

  async getUsers(filters: UserFilters = {}, page = 1, limit = 20): Promise<PaginatedResponse<User>> {
    try {
      let query = supabase.from('profiles').select('*', { count: 'exact' });

      // Apply filters
      if (filters.role) {
        query = query.eq('role', filters.role as any);
      }
      if (filters.search) {
        query = query.or(
          `display_name.ilike.%${filters.search}%,phone.ilike.%${filters.search}%,telegram_username.ilike.%${filters.search}%`
        );
      }

      // Apply pagination
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to).order('created_at', { ascending: false });

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        data: data || [],
        total: count || 0,
        page,
        limit,
        hasMore: (count || 0) > page * limit
      };
    } catch (error) {
      return {
        data: [],
        total: 0,
        page,
        limit,
        hasMore: false
      };
    }
  }

  // Ad operations
  async getAds(filters: AdFilters = {}, page = 1, limit = 20): Promise<PaginatedResponse<Ad>> {
    try {
      let query = supabase
        .from('ads')
        .select(`
          *,
          user:profiles(*)
        `, { count: 'exact' });

      // Apply filters
      if (filters.category) {
        query = query.eq('category', filters.category);
      }
      if (filters.status) {
        query = query.eq('status', filters.status as any);
      }
      if (filters.priceMin) {
        query = query.gte('price', filters.priceMin);
      }
      if (filters.priceMax) {
        query = query.lte('price', filters.priceMax);
      }
      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      // Apply pagination
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to).order('created_at', { ascending: false });

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        data: (data || []) as Ad[],
        total: count || 0,
        page,
        limit,
        hasMore: (count || 0) > page * limit
      };
    } catch (error) {
      return {
        data: [],
        total: 0,
        page,
        limit,
        hasMore: false
      };
    }
  }

  async createAd(ad: Omit<Ad, 'id' | 'created_at'>): Promise<ApiResponse<Ad>> {
    try {
      const { data, error } = await supabase
        .from('ads')
        .insert(ad as any)
        .select()
        .maybeSingle();

      if (error) throw error;
      return { data: data as Ad };
    } catch (error) {
      return { error: (error as Error).message };
    }
  }

  async updateAd(adId: string, updates: Partial<Ad>): Promise<ApiResponse<Ad>> {
    try {
      const { data, error } = await supabase
        .from('ads')
        .update(updates as any)
        .eq('id', adId)
        .select()
        .maybeSingle();

      if (error) throw error;
      return { data: data as Ad };
    } catch (error) {
      return { error: (error as Error).message };
    }
  }

  async deleteAd(adId: string): Promise<ApiResponse<void>> {
    try {
      const { error } = await supabase
        .from('ads')
        .delete()
        .eq('id', adId);

      if (error) throw error;
      return { message: 'Ad deleted successfully' };
    } catch (error) {
      return { error: (error as Error).message };
    }
  }

  // Transaction operations
  async getTransactions(filters: TransactionFilters = {}, page = 1, limit = 20): Promise<PaginatedResponse<Transaction>> {
    try {
      let query = supabase
        .from('transactions')
        .select(`
          *,
          user:profiles(*)
        `, { count: 'exact' });

      // Apply filters
      if (filters.type) {
        query = query.eq('type', filters.type as any);
      }
      if (filters.status) {
        query = query.eq('status', filters.status as any);
      }
      if (filters.dateFrom) {
        query = query.gte('created_at', filters.dateFrom);
      }
      if (filters.dateTo) {
        query = query.lte('created_at', filters.dateTo);
      }

      // Apply pagination
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to).order('created_at', { ascending: false });

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        data: (data || []).map(item => ({
          ...item,
          payment_details: item.payment_details as any,
          user: item.user as any
        })) as Transaction[],
        total: count || 0,
        page,
        limit,
        hasMore: (count || 0) > page * limit
      };
    } catch (error) {
      return {
        data: [],
        total: 0,
        page,
        limit,
        hasMore: false
      };
    }
  }

  async createTransaction(transaction: Omit<Transaction, 'id' | 'created_at'>): Promise<ApiResponse<Transaction>> {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .insert(transaction as any)
        .select()
        .maybeSingle();

      if (error) throw error;
      return { data: { ...data, payment_details: data?.payment_details as any } as Transaction };
    } catch (error) {
      return { error: (error as Error).message };
    }
  }

  async updateTransaction(transactionId: string, updates: Partial<Transaction>): Promise<ApiResponse<Transaction>> {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .update(updates as any)
        .eq('id', transactionId)
        .select()
        .maybeSingle();

      if (error) throw error;
      return { data: { ...data, payment_details: data?.payment_details as any } as Transaction };
    } catch (error) {
      return { error: (error as Error).message };
    }
  }

  // Review operations
  async getReviews(targetUserId?: string, page = 1, limit = 20): Promise<PaginatedResponse<Review>> {
    try {
      let query = supabase
        .from('reviews')
        .select(`
          *,
          author:profiles!reviews_author_id_fkey(*),
          target_user:profiles!reviews_target_user_id_fkey(*)
        `, { count: 'exact' });

      if (targetUserId) {
        query = query.eq('target_user_id', targetUserId);
      }

      // Apply pagination
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to).order('created_at', { ascending: false });

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        data: data || [],
        total: count || 0,
        page,
        limit,
        hasMore: (count || 0) > page * limit
      };
    } catch (error) {
      return {
        data: [],
        total: 0,
        page,
        limit,
        hasMore: false
      };
    }
  }

  async createReview(review: Omit<Review, 'id' | 'created_at'>): Promise<ApiResponse<Review>> {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .insert(review as any)
        .select()
        .maybeSingle();

      if (error) throw error;
      return { data: data as Review };
    } catch (error) {
      return { error: (error as Error).message };
    }
  }

  // Conversation operations
  async getConversations(userId: string, page = 1, limit = 20): Promise<PaginatedResponse<Conversation>> {
    try {
      let query = supabase
        .from('conversations')
        .select('*', { count: 'exact' })
        .contains('participants', [userId]);

      // Apply pagination
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to).order('last_message_at', { ascending: false });

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        data: (data || []) as Conversation[],
        total: count || 0,
        page,
        limit,
        hasMore: (count || 0) > page * limit
      };
    } catch (error) {
      return {
        data: [],
        total: 0,
        page,
        limit,
        hasMore: false
      };
    }
  }

  async createConversation(conversation: Omit<Conversation, 'id' | 'created_at' | 'updated_at' | 'last_message_at'>): Promise<ApiResponse<Conversation>> {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .insert(conversation as any)
        .select()
        .maybeSingle();

      if (error) throw error;
      return { data: data as Conversation };
    } catch (error) {
      return { error: (error as Error).message };
    }
  }

  // Message operations
  async getMessages(conversationId: string, page = 1, limit = 50): Promise<PaginatedResponse<Message>> {
    try {
      let query = supabase
        .from('messages')
        .select(`
          *,
          sender:profiles(*),
          reactions:message_reactions(*)
        `, { count: 'exact' })
        .eq('conversation_id', conversationId)
        .eq('is_deleted', false);

      // Apply pagination
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to).order('created_at', { ascending: true });

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        data: (data || []) as Message[],
        total: count || 0,
        page,
        limit,
        hasMore: (count || 0) > page * limit
      };
    } catch (error) {
      return {
        data: [],
        total: 0,
        page,
        limit,
        hasMore: false
      };
    }
  }

  async sendMessage(message: Omit<Message, 'id' | 'created_at' | 'updated_at' | 'is_edited' | 'is_deleted'>): Promise<ApiResponse<Message>> {
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert(message as any)
        .select()
        .maybeSingle();

      if (error) throw error;
      return { data: data as Message };
    } catch (error) {
      return { error: (error as Error).message };
    }
  }

  // Notification operations
  async getNotifications(userId: string, page = 1, limit = 20): Promise<PaginatedResponse<Notification>> {
    try {
      let query = supabase
        .from('notifications')
        .select('*', { count: 'exact' })
        .eq('user_id', userId);

      // Apply pagination
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to).order('created_at', { ascending: false });

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        data: (data || []) as Notification[],
        total: count || 0,
        page,
        limit,
        hasMore: (count || 0) > page * limit
      };
    } catch (error) {
      return {
        data: [],
        total: 0,
        page,
        limit,
        hasMore: false
      };
    }
  }

  async markNotificationAsRead(notificationId: string): Promise<ApiResponse<void>> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;
      return { message: 'Notification marked as read' };
    } catch (error) {
      return { error: (error as Error).message };
    }
  }

  // Support ticket operations
  async getSupportTickets(userId?: string, page = 1, limit = 20): Promise<PaginatedResponse<SupportTicket>> {
    try {
      let query = supabase
        .from('support_tickets')
        .select(`
          *,
          creator:profiles!support_tickets_created_by_fkey(*),
          assignee:profiles!support_tickets_assigned_to_fkey(*)
        `, { count: 'exact' });

      if (userId) {
        query = query.eq('created_by', userId);
      }

      // Apply pagination
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to).order('created_at', { ascending: false });

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        data: (data || []) as SupportTicket[],
        total: count || 0,
        page,
        limit,
        hasMore: (count || 0) > page * limit
      };
    } catch (error) {
      return {
        data: [],
        total: 0,
        page,
        limit,
        hasMore: false
      };
    }
  }

  async createSupportTicket(ticket: Omit<SupportTicket, 'id' | 'ticket_number' | 'created_at' | 'updated_at'>): Promise<ApiResponse<SupportTicket>> {
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .insert(ticket as any)
        .select()
        .maybeSingle();

      if (error) throw error;
      return { data: data as SupportTicket };
    } catch (error) {
      return { error: (error as Error).message };
    }
  }

  // File operations
  async uploadFile(file: File, bucket: string, path: string): Promise<ApiResponse<{ url: string; path: string }>> {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, file);

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);

      return {
        data: {
          url: urlData.publicUrl,
          path: data.path
        }
      };
    } catch (error) {
      return { error: (error as Error).message };
    }
  }

  async deleteFile(bucket: string, path: string): Promise<ApiResponse<void>> {
    try {
      const { error } = await supabase.storage
        .from(bucket)
        .remove([path]);

      if (error) throw error;
      return { message: 'File deleted successfully' };
    } catch (error) {
      return { error: (error as Error).message };
    }
  }
}

export const apiService = new ApiService();
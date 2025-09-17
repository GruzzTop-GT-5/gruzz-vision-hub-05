import { supabase } from '@/integrations/supabase/client';
import { handleError } from '@/lib/errorHandler';
import type { User, Order, Transaction, Review, Category } from '@/types/common';

// Упрощенный API клиент без сложной типизации
export const api = {
  // Users API
  users: {
    async getById(id: string) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', id)
          .single();
        
        if (error) throw error;
        return { data: data as User, error: null };
      } catch (error) {
        handleError(error, { component: 'UsersAPI', action: 'getById' });
        return { data: null, error: error as Error };
      }
    },

    async getAll(limit = 50, offset = 0) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1);
        
        if (error) throw error;
        return { data: data as User[], error: null };
      } catch (error) {
        handleError(error, { component: 'UsersAPI', action: 'getAll' });
        return { data: null, error: error as Error };
      }
    },

    async search(query: string, limit = 20) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .or(`display_name.ilike.%${query}%,full_name.ilike.%${query}%,phone.ilike.%${query}%`)
          .limit(limit);
        
        if (error) throw error;
        return { data: data as User[], error: null };
      } catch (error) {
        handleError(error, { component: 'UsersAPI', action: 'search' });
        return { data: null, error: error as Error };
      }
    },

    async update(id: string, updates: Partial<User>) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .update(updates)
          .eq('id', id)
          .select()
          .single();
        
        if (error) throw error;
        return { data: data as User, error: null };
      } catch (error) {
        handleError(error, { component: 'UsersAPI', action: 'update' });
        return { data: null, error: error as Error };
      }
    }
  },

  // Orders API
  orders: {
    async getAll(filters?: {
      status?: string[];
      category?: string;
      limit?: number;
      offset?: number;
    }) {
      try {
        let query = supabase
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false });

        if (filters?.status?.length) {
          query = query.in('status', filters.status);
        }

        if (filters?.category) {
          query = query.eq('category', filters.category);
        }

        if (filters?.limit && filters?.offset !== undefined) {
          query = query.range(filters.offset, filters.offset + filters.limit - 1);
        }

        const { data, error } = await query;
        
        if (error) throw error;
        return { data: data as Order[], error: null };
      } catch (error) {
        handleError(error, { component: 'OrdersAPI', action: 'getAll' });
        return { data: null, error: error as Error };
      }
    },

    async getById(id: string) {
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .eq('id', id)
          .single();
        
        if (error) throw error;
        return { data: data as Order, error: null };
      } catch (error) {
        handleError(error, { component: 'OrdersAPI', action: 'getById' });
        return { data: null, error: error as Error };
      }
    },

    async create(orderData: Partial<Order>) {
      try {
        const { data, error } = await supabase
          .from('orders')
          .insert(orderData)
          .select()
          .single();
        
        if (error) throw error;
        return { data: data as Order, error: null };
      } catch (error) {
        handleError(error, { component: 'OrdersAPI', action: 'create' });
        return { data: null, error: error as Error };
      }
    },

    async updateStatus(id: string, status: string) {
      try {
        const { data, error } = await supabase
          .from('orders')
          .update({ status, updated_at: new Date().toISOString() })
          .eq('id', id)
          .select()
          .single();
        
        if (error) throw error;
        return { data: data as Order, error: null };
      } catch (error) {
        handleError(error, { component: 'OrdersAPI', action: 'updateStatus' });
        return { data: null, error: error as Error };
      }
    }
  },

  // Transactions API
  transactions: {
    async getByUserId(userId: string, limit = 50) {
      try {
        const { data, error } = await supabase
          .from('transactions')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(limit);
        
        if (error) throw error;
        return { data: data as Transaction[], error: null };
      } catch (error) {
        handleError(error, { component: 'TransactionsAPI', action: 'getByUserId' });
        return { data: null, error: error as Error };
      }
    },

    async create(transactionData: Partial<Transaction>) {
      try {
        const { data, error } = await supabase
          .from('transactions')
          .insert(transactionData)
          .select()
          .single();
        
        if (error) throw error;
        return { data: data as Transaction, error: null };
      } catch (error) {
        handleError(error, { component: 'TransactionsAPI', action: 'create' });
        return { data: null, error: error as Error };
      }
    },

    async updateStatus(id: string, status: string, adminNotes?: string) {
      try {
        const updates: any = { status };
        if (adminNotes) updates.admin_notes = adminNotes;
        if (status === 'completed') updates.completed_at = new Date().toISOString();

        const { data, error } = await supabase
          .from('transactions')
          .update(updates)
          .eq('id', id)
          .select()
          .single();
        
        if (error) throw error;
        return { data: data as Transaction, error: null };
      } catch (error) {
        handleError(error, { component: 'TransactionsAPI', action: 'updateStatus' });
        return { data: null, error: error as Error };
      }
    },

    async getPending(limit = 100) {
      try {
        const { data, error } = await supabase
          .from('transactions')
          .select('*')
          .eq('status', 'pending')
          .order('created_at', { ascending: true })
          .limit(limit);
        
        if (error) throw error;
        return { data: data as Transaction[], error: null };
      } catch (error) {
        handleError(error, { component: 'TransactionsAPI', action: 'getPending' });
        return { data: null, error: error as Error };
      }
    }
  },

  // Reviews API
  reviews: {
    async getByTargetUserId(targetUserId: string, limit = 20) {
      try {
        const { data, error } = await supabase
          .from('reviews')
          .select('*')
          .eq('target_user_id', targetUserId)
          .eq('is_hidden', false)
          .order('created_at', { ascending: false })
          .limit(limit);
        
        if (error) throw error;
        return { data: data as Review[], error: null };
      } catch (error) {
        handleError(error, { component: 'ReviewsAPI', action: 'getByTargetUserId' });
        return { data: null, error: error as Error };
      }
    },

    async create(reviewData: Partial<Review>) {
      try {
        const { data, error } = await supabase
          .from('reviews')
          .insert(reviewData)
          .select()
          .single();
        
        if (error) throw error;
        return { data: data as Review, error: null };
      } catch (error) {
        handleError(error, { component: 'ReviewsAPI', action: 'create' });
        return { data: null, error: error as Error };
      }
    },

    async moderate(id: string, isApproved: boolean, adminComment?: string, bonusPoints = 0) {
      try {
        const updates = {
          is_moderated: true,
          moderated_at: new Date().toISOString(),
          admin_comment: adminComment,
          admin_bonus_points: bonusPoints,
          is_hidden: !isApproved
        };

        const { data, error } = await supabase
          .from('reviews')
          .update(updates)
          .eq('id', id)
          .select()
          .single();
        
        if (error) throw error;
        return { data: data as Review, error: null };
      } catch (error) {
        handleError(error, { component: 'ReviewsAPI', action: 'moderate' });
        return { data: null, error: error as Error };
      }
    }
  },

  // Categories API
  categories: {
    async getActive() {
      try {
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .eq('is_active', true)
          .order('sort_order', { ascending: true });
        
        if (error) throw error;
        return { data: data as Category[], error: null };
      } catch (error) {
        handleError(error, { component: 'CategoriesAPI', action: 'getActive' });
        return { data: null, error: error as Error };
      }
    },

    async create(categoryData: Partial<Category>) {
      try {
        const { data, error } = await supabase
          .from('categories')
          .insert(categoryData)
          .select()
          .single();
        
        if (error) throw error;
        return { data: data as Category, error: null };
      } catch (error) {
        handleError(error, { component: 'CategoriesAPI', action: 'create' });
        return { data: null, error: error as Error };
      }
    },

    async update(id: string, updates: Partial<Category>) {
      try {
        const { data, error } = await supabase
          .from('categories')
          .update(updates)
          .eq('id', id)
          .select()
          .single();
        
        if (error) throw error;
        return { data: data as Category, error: null };
      } catch (error) {
        handleError(error, { component: 'CategoriesAPI', action: 'update' });
        return { data: null, error: error as Error };
      }
    }
  }
};

// Статистические функции
export const statsAPI = {
  async getDashboardStats() {
    try {
      const [users, orders, transactions, tickets] = await Promise.all([
        supabase.from('profiles').select('id, created_at', { count: 'exact' }),
        supabase.from('orders').select('id, status, created_at', { count: 'exact' }),
        supabase.from('transactions').select('id, status, amount, type', { count: 'exact' }),
        supabase.from('support_tickets').select('id, status', { count: 'exact' })
      ]);

      const now = new Date();
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      return {
        totalUsers: users.count || 0,
        activeUsers: users.data?.filter((u: any) => new Date(u.created_at) > monthAgo).length || 0,
        totalOrders: orders.count || 0,
        activeOrders: orders.data?.filter((o: any) => ['pending', 'in_progress'].includes(o.status)).length || 0,
        totalTransactions: transactions.count || 0,
        pendingTransactions: transactions.data?.filter((t: any) => t.status === 'pending').length || 0,
        totalRevenue: transactions.data
          ?.filter((t: any) => t.status === 'completed' && t.type === 'deposit')
          .reduce((sum: number, t: any) => sum + t.amount, 0) || 0,
        totalTickets: tickets.count || 0,
        openTickets: tickets.data?.filter((t: any) => t.status === 'open').length || 0,
      };
    } catch (error) {
      handleError(error, { component: 'statsAPI', action: 'getDashboardStats' });
      return null;
    }
  }
};
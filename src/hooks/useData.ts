// Custom React hooks for common operations
// Centralized hooks for state management and business logic

import { useState, useEffect, useCallback, useMemo } from 'react';
import { apiService } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import type { 
  Ad, 
  Transaction, 
  Review, 
  Conversation, 
  Message, 
  Notification,
  SupportTicket,
  PaginatedResponse,
  AdFilters,
  TransactionFilters,
  UserFilters
} from '@/types';

// Generic pagination hook
export const usePagination = <T>(
  fetchFunction: (page: number, limit: number, ...args: any[]) => Promise<PaginatedResponse<T>>,
  dependencies: any[] = [],
  limit = 20
) => {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);

  const loadData = useCallback(async (pageNum: number, reset = false) => {
    setLoading(true);
    setError(null);

    try {
      const result = await fetchFunction(pageNum, limit, ...dependencies);
      
      if (reset) {
        setData(result.data);
      } else {
        setData(prev => [...prev, ...result.data]);
      }
      
      setHasMore(result.hasMore);
      setTotal(result.total);
      setPage(pageNum);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [fetchFunction, limit, ...dependencies]);

  const refresh = useCallback(() => {
    setData([]);
    setPage(1);
    loadData(1, true);
  }, [loadData]);

  const loadMore = useCallback(() => {
    if (hasMore && !loading) {
      loadData(page + 1);
    }
  }, [hasMore, loading, page, loadData]);

  const updateData = useCallback((updater: (prev: T[]) => T[]) => {
    setData(updater);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    data,
    loading,
    error,
    hasMore,
    total,
    page,
    refresh,
    loadMore,
    updateData
  };
};

// Ads hook
export const useAds = (filters: AdFilters = {}) => {
  const { toast } = useToast();

  const fetchAds = useCallback(
    (page: number, limit: number) => apiService.getAds(filters, page, limit),
    [filters]
  );

  const pagination = usePagination(fetchAds, [filters]);

  const createAd = useCallback(async (adData: Omit<Ad, 'id' | 'created_at'>) => {
    const result = await apiService.createAd(adData);
    if (result.error) {
      toast({
        title: "Ошибка",
        description: result.error,
        variant: "destructive"
      });
      return false;
    }

    toast({
      title: "Успешно",
      description: "Объявление создано"
    });
    
    pagination.refresh();
    return true;
  }, [toast, pagination.refresh]);

  const updateAd = useCallback(async (adId: string, updates: Partial<Ad>) => {
    const result = await apiService.updateAd(adId, updates);
    if (result.error) {
      toast({
        title: "Ошибка",
        description: result.error,
        variant: "destructive"
      });
      return false;
    }

    toast({
      title: "Успешно",
      description: "Объявление обновлено"
    });
    
    pagination.refresh();
    return true;
  }, [toast, pagination.refresh]);

  const deleteAd = useCallback(async (adId: string) => {
    const result = await apiService.deleteAd(adId);
    if (result.error) {
      toast({
        title: "Ошибка",
        description: result.error,
        variant: "destructive"
      });
      return false;
    }

    toast({
      title: "Успешно",
      description: "Объявление удалено"
    });
    
    pagination.refresh();
    return true;
  }, [toast, pagination.refresh]);

  return {
    ...pagination,
    createAd,
    updateAd,
    deleteAd
  };
};

// Transactions hook
export const useTransactions = (filters: TransactionFilters = {}) => {
  const { toast } = useToast();

  const fetchTransactions = useCallback(
    (page: number, limit: number) => apiService.getTransactions(filters, page, limit),
    [filters]
  );

  const pagination = usePagination(fetchTransactions, [filters]);

  const createTransaction = useCallback(async (transactionData: Omit<Transaction, 'id' | 'created_at'>) => {
    const result = await apiService.createTransaction(transactionData);
    if (result.error) {
      toast({
        title: "Ошибка",
        description: result.error,
        variant: "destructive"
      });
      return false;
    }

    toast({
      title: "Успешно",
      description: "Транзакция создана"
    });
    
    pagination.refresh();
    return true;
  }, [toast, pagination.refresh]);

  const updateTransaction = useCallback(async (transactionId: string, updates: Partial<Transaction>) => {
    const result = await apiService.updateTransaction(transactionId, updates);
    if (result.error) {
      toast({
        title: "Ошибка",
        description: result.error,
        variant: "destructive"
      });
      return false;
    }

    toast({
      title: "Успешно",
      description: "Транзакция обновлена"
    });
    
    pagination.refresh();
    return true;
  }, [toast, pagination.refresh]);

  return {
    ...pagination,
    createTransaction,
    updateTransaction
  };
};

// Reviews hook
export const useReviews = (targetUserId?: string) => {
  const { toast } = useToast();

  const fetchReviews = useCallback(
    (page: number, limit: number) => apiService.getReviews(targetUserId, page, limit),
    [targetUserId]
  );

  const pagination = usePagination(fetchReviews, [targetUserId]);

  const createReview = useCallback(async (reviewData: Omit<Review, 'id' | 'created_at'>) => {
    const result = await apiService.createReview(reviewData);
    if (result.error) {
      toast({
        title: "Ошибка",
        description: result.error,
        variant: "destructive"
      });
      return false;
    }

    toast({
      title: "Успешно",
      description: "Отзыв добавлен"
    });
    
    pagination.refresh();
    return true;
  }, [toast, pagination.refresh]);

  const averageRating = useMemo(() => {
    if (pagination.data.length === 0) return 0;
    const total = pagination.data.reduce((sum, review) => sum + (review.rating || 0), 0);
    return total / pagination.data.length;
  }, [pagination.data]);

  return {
    ...pagination,
    createReview,
    averageRating
  };
};

// Conversations hook
export const useConversations = (userId: string) => {
  const { toast } = useToast();

  const fetchConversations = useCallback(
    (page: number, limit: number) => apiService.getConversations(userId, page, limit),
    [userId]
  );

  const pagination = usePagination(fetchConversations, [userId]);

  const createConversation = useCallback(async (conversationData: Omit<Conversation, 'id' | 'created_at' | 'updated_at' | 'last_message_at'>) => {
    const result = await apiService.createConversation(conversationData);
    if (result.error) {
      toast({
        title: "Ошибка",
        description: result.error,
        variant: "destructive"
      });
      return null;
    }

    pagination.refresh();
    return result.data;
  }, [toast, pagination.refresh]);

  return {
    ...pagination,
    createConversation
  };
};

// Messages hook
export const useMessages = (conversationId: string) => {
  const { toast } = useToast();

  const fetchMessages = useCallback(
    (page: number, limit: number) => apiService.getMessages(conversationId, page, limit),
    [conversationId]
  );

  const pagination = usePagination(fetchMessages, [conversationId], 50);

  const sendMessage = useCallback(async (messageData: Omit<Message, 'id' | 'created_at' | 'updated_at' | 'is_edited' | 'is_deleted'>) => {
    const result = await apiService.sendMessage(messageData);
    if (result.error) {
      toast({
        title: "Ошибка",
        description: result.error,
        variant: "destructive"
      });
      return false;
    }

    // Add the new message to the beginning of the data array
    if (result.data) {
      pagination.updateData(prev => [result.data!, ...prev]);
    }
    
    return true;
  }, [toast]);

  return {
    ...pagination,
    sendMessage
  };
};

// Notifications hook
export const useNotifications = (userId: string) => {
  const { toast } = useToast();

  const fetchNotifications = useCallback(
    (page: number, limit: number) => apiService.getNotifications(userId, page, limit),
    [userId]
  );

  const pagination = usePagination(fetchNotifications, [userId]);

  const markAsRead = useCallback(async (notificationId: string) => {
    const result = await apiService.markNotificationAsRead(notificationId);
    if (result.error) {
      toast({
        title: "Ошибка",
        description: result.error,
        variant: "destructive"
      });
      return false;
    }

    // Update the notification in the data array
    pagination.updateData(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, is_read: true }
          : notification
      )
    );
    
    return true;
  }, [toast]);

  const unreadCount = useMemo(() => {
    return pagination.data.filter(notification => !notification.is_read).length;
  }, [pagination.data]);

  return {
    ...pagination,
    markAsRead,
    unreadCount
  };
};

// Support tickets hook
export const useSupportTickets = (userId?: string) => {
  const { toast } = useToast();

  const fetchTickets = useCallback(
    (page: number, limit: number) => apiService.getSupportTickets(userId, page, limit),
    [userId]
  );

  const pagination = usePagination(fetchTickets, [userId]);

  const createTicket = useCallback(async (ticketData: Omit<SupportTicket, 'id' | 'ticket_number' | 'created_at' | 'updated_at'>) => {
    const result = await apiService.createSupportTicket(ticketData);
    if (result.error) {
      toast({
        title: "Ошибка",
        description: result.error,
        variant: "destructive"
      });
      return null;
    }

    toast({
      title: "Успешно",
      description: "Тикет создан"
    });
    
    pagination.refresh();
    return result.data;
  }, [toast, pagination.refresh]);

  return {
    ...pagination,
    createTicket
  };
};

// File upload hook
export const useFileUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const uploadFile = useCallback(async (
    file: File, 
    bucket: string, 
    path: string,
    onProgress?: (progress: number) => void
  ) => {
    setUploading(true);
    setProgress(0);

    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          const newProgress = Math.min(prev + 10, 90);
          onProgress?.(newProgress);
          return newProgress;
        });
      }, 100);

      const result = await apiService.uploadFile(file, bucket, path);
      
      clearInterval(progressInterval);
      setProgress(100);
      onProgress?.(100);

      if (result.error) {
        toast({
          title: "Ошибка загрузки",
          description: result.error,
          variant: "destructive"
        });
        return null;
      }

      toast({
        title: "Успешно",
        description: "Файл загружен"
      });

      return result.data;
    } catch (error) {
      toast({
        title: "Ошибка загрузки",
        description: "Не удалось загрузить файл",
        variant: "destructive"
      });
      return null;
    } finally {
      setUploading(false);
      setTimeout(() => setProgress(0), 1000);
    }
  }, [toast]);

  return {
    uploadFile,
    uploading,
    progress
  };
};

// Local storage hook
export const useLocalStorage = <T>(key: string, initialValue: T) => {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  const removeValue = useCallback(() => {
    try {
      window.localStorage.removeItem(key);
      setStoredValue(initialValue);
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue] as const;
};
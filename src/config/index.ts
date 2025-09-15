// Application configuration management
// Centralized configuration for easy maintenance and environment management

import type { AppConfig } from '@/types';

const config: AppConfig = {
  app: {
    name: 'GruzzTop',
    version: '1.0.0',
    environment: 'development' // This should be set based on environment
  },
  supabase: {
    url: 'https://huwjvdqdnktddnmfmflw.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh1d2p2ZHFkbmt0ZGRubWZtZmx3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc5NjUyNTYsImV4cCI6MjA3MzU0MTI1Nn0.cvKXfuu31RddKHfNfXm2TzVY5NJD6Cx-RnDsBFBKMJU',
    projectId: 'huwjvdqdnktddnmfmflw'
  },
  features: {
    telegramIntegration: true,
    paymentMethods: ['bank_card', 'yoomoney', 'ozon'],
    maxFileSize: 10 * 1024 * 1024, // 10MB
    supportedFileTypes: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]
  },
  limits: {
    maxAdsPerUser: 50,
    maxTransactionAmount: 100000, // 100,000 руб
    minTransactionAmount: 100, // 100 руб
    rateLimitRequests: 100,
    rateLimitWindow: 60 * 1000 // 1 minute
  }
};

// Environment-specific overrides
if (typeof window !== 'undefined') {
  // Browser environment - can access window
  const hostname = window.location.hostname;
  
  if (hostname.includes('lovableproject.com') || hostname.includes('lovable.app')) {
    config.app.environment = 'production';
  } else if (hostname.includes('staging')) {
    config.app.environment = 'staging';
  }
}

// Configuration getters with validation
export const getConfig = () => config;

export const getSupabaseConfig = () => config.supabase;

export const getFeatureConfig = () => config.features;

export const getLimitsConfig = () => config.limits;

export const isFeatureEnabled = (feature: keyof typeof config.features): boolean => {
  return Boolean(config.features[feature]);
};

export const isPaymentMethodSupported = (method: string): boolean => {
  return config.features.paymentMethods.includes(method);
};

export const validateFileSize = (size: number): boolean => {
  return size <= config.features.maxFileSize;
};

export const validateFileType = (type: string): boolean => {
  return config.features.supportedFileTypes.includes(type);
};

export const isDevelopment = (): boolean => {
  return config.app.environment === 'development';
};

export const isProduction = (): boolean => {
  return config.app.environment === 'production';
};

// Constants for easy access
export const CONSTANTS = {
  APP_NAME: config.app.name,
  APP_VERSION: config.app.version,
  MAX_FILE_SIZE: config.features.maxFileSize,
  MAX_ADS_PER_USER: config.limits.maxAdsPerUser,
  MIN_TRANSACTION_AMOUNT: config.limits.minTransactionAmount,
  MAX_TRANSACTION_AMOUNT: config.limits.maxTransactionAmount,
  PAYMENT_METHODS: config.features.paymentMethods,
  SUPPORTED_FILE_TYPES: config.features.supportedFileTypes,
  
  // UI Constants
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  DEBOUNCE_DELAY: 300,
  TOAST_DURATION: 5000,
  
  // Validation Constants
  MIN_PASSWORD_LENGTH: 6,
  MAX_TITLE_LENGTH: 200,
  MAX_DESCRIPTION_LENGTH: 2000,
  MAX_COMMENT_LENGTH: 500,
  
  // Categories
  AD_CATEGORIES: [
    'Дизайн',
    'Программирование',
    'Написание текстов',
    'Маркетинг',
    'Видео и анимация',
    'Музыка и аудио',
    'Бизнес',
    'Lifestyle',
    'Другое'
  ],
  
  SUPPORT_CATEGORIES: [
    'Технические проблемы',
    'Вопросы по оплате',
    'Проблемы с заказами',
    'Жалобы и споры',
    'Предложения по улучшению',
    'Другое'
  ],
  
  PRIORITY_LEVELS: [
    { value: 'low', label: 'Низкий' },
    { value: 'normal', label: 'Обычный' },
    { value: 'high', label: 'Высокий' },
    { value: 'urgent', label: 'Срочный' }
  ],
  
  USER_ROLES: [
    { value: 'user', label: 'Пользователь' },
    { value: 'support', label: 'Поддержка' },
    { value: 'moderator', label: 'Модератор' },
    { value: 'admin', label: 'Администратор' },
    { value: 'system_admin', label: 'Системный администратор' }
  ]
} as const;

export default config;
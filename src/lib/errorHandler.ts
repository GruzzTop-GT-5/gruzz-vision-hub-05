import { toast } from "@/hooks/use-toast";

export interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  additionalInfo?: Record<string, any>;
}

export class AppError extends Error {
  public readonly code: string;
  public readonly context?: ErrorContext;
  public readonly timestamp: Date;

  constructor(
    message: string,
    code: string = 'UNKNOWN_ERROR',
    context?: ErrorContext
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.context = context;
    this.timestamp = new Date();
  }
}

export const handleError = (
  error: unknown,
  context?: ErrorContext,
  showToast: boolean = true
) => {
  console.error('Error occurred:', error, context);

  let message = 'Произошла неожиданная ошибка';
  let code = 'UNKNOWN_ERROR';

  if (error instanceof AppError) {
    message = error.message;
    code = error.code;
  } else if (error instanceof Error) {
    message = error.message;
    if (error.message.includes('auth')) {
      code = 'AUTH_ERROR';
      message = 'Ошибка авторизации. Попробуйте войти заново.';
    } else if (error.message.includes('network')) {
      code = 'NETWORK_ERROR';
      message = 'Проблемы с сетью. Проверьте подключение к интернету.';
    } else if (error.message.includes('permission')) {
      code = 'PERMISSION_ERROR';
      message = 'Недостаточно прав для выполнения операции.';
    }
  }

  // В продакшене здесь должна быть отправка в Sentry
  if (process.env.NODE_ENV === 'production') {
    // Sentry.captureException(error, { contexts: { custom: context } });
  }

  if (showToast) {
    toast({
      variant: "destructive",
      title: "Ошибка",
      description: message,
    });
  }

  return { message, code };
};

export const createErrorHandler = (defaultContext: ErrorContext) => {
  return (error: unknown, additionalContext?: Partial<ErrorContext>, showToast: boolean = true) => {
    return handleError(error, { ...defaultContext, ...additionalContext }, showToast);
  };
};

// Специализированные обработчики ошибок
export const authErrorHandler = createErrorHandler({ component: 'Auth' });
export const apiErrorHandler = createErrorHandler({ component: 'API' });
export const uiErrorHandler = createErrorHandler({ component: 'UI' });
/**
 * Централизованная система отчетов об ошибках
 * Логирует критические ошибки для мониторинга
 */

interface ErrorReport {
  timestamp: string;
  component: string;
  action: string;
  error: Error | unknown;
  userId?: string;
  context?: Record<string, any>;
}

class ErrorReporter {
  private static instance: ErrorReporter;
  private reports: ErrorReport[] = [];
  private maxReports = 100; // Хранить последние 100 ошибок

  private constructor() {}

  static getInstance(): ErrorReporter {
    if (!ErrorReporter.instance) {
      ErrorReporter.instance = new ErrorReporter();
    }
    return ErrorReporter.instance;
  }

  /**
   * Записать ошибку
   */
  report(
    component: string,
    action: string,
    error: Error | unknown,
    context?: Record<string, any>
  ) {
    const report: ErrorReport = {
      timestamp: new Date().toISOString(),
      component,
      action,
      error,
      context
    };

    // Добавляем в массив
    this.reports.push(report);

    // Ограничиваем размер
    if (this.reports.length > this.maxReports) {
      this.reports.shift();
    }

    // Логируем в консоль для разработки
    if (import.meta.env.DEV) {
      console.error(`[${component}] ${action}:`, error, context);
    }

    // В продакшене можно отправлять на сервер
    // this.sendToServer(report);
  }

  /**
   * Получить все отчеты
   */
  getReports(): ErrorReport[] {
    return [...this.reports];
  }

  /**
   * Очистить отчеты
   */
  clear() {
    this.reports = [];
  }

  /**
   * Получить отчеты по компоненту
   */
  getByComponent(component: string): ErrorReport[] {
    return this.reports.filter(r => r.component === component);
  }

  /**
   * Экспорт отчетов
   */
  export(): string {
    return JSON.stringify(this.reports, null, 2);
  }
}

export const errorReporter = ErrorReporter.getInstance();

/**
 * Хелпер для обработки ошибок с автоматическим репортингом
 */
export function handleError(
  component: string,
  action: string,
  error: unknown,
  context?: Record<string, any>
) {
  errorReporter.report(component, action, error as Error, context);
  
  // Возвращаем человекочитаемое сообщение
  if (error instanceof Error) {
    return error.message;
  }
  return 'Произошла неизвестная ошибка';
}

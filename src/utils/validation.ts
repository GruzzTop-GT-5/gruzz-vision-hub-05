/**
 * Валидация данных для форм и API запросов
 */

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Валидация номера телефона
 */
export function validatePhone(phone: string): ValidationResult {
  const errors: string[] = [];
  
  if (!phone || phone.trim() === '') {
    errors.push('Номер телефона обязателен');
    return { valid: false, errors };
  }

  // Удаляем все не-цифры
  const digitsOnly = phone.replace(/\D/g, '');
  
  if (digitsOnly.length < 10) {
    errors.push('Номер телефона слишком короткий');
  }
  
  if (digitsOnly.length > 15) {
    errors.push('Номер телефона слишком длинный');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Валидация оценки (рейтинга)
 */
export function validateRating(rating: number): ValidationResult {
  const errors: string[] = [];
  
  if (rating < 1 || rating > 5) {
    errors.push('Оценка должна быть от 1 до 5');
  }
  
  if (!Number.isInteger(rating)) {
    errors.push('Оценка должна быть целым числом');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Валидация комментария
 */
export function validateComment(comment: string, maxLength = 1000): ValidationResult {
  const errors: string[] = [];
  
  if (comment.length > maxLength) {
    errors.push(`Комментарий не должен превышать ${maxLength} символов`);
  }
  
  // Проверка на подозрительный контент
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i, // onclick=, onerror= и т.д.
    /data:text\/html/i
  ];
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(comment)) {
      errors.push('Комментарий содержит недопустимый контент');
      break;
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Валидация суммы
 */
export function validateAmount(amount: number, min = 0, max = 1000000): ValidationResult {
  const errors: string[] = [];
  
  if (amount < min) {
    errors.push(`Сумма не может быть меньше ${min}`);
  }
  
  if (amount > max) {
    errors.push(`Сумма не может превышать ${max}`);
  }
  
  if (!Number.isFinite(amount)) {
    errors.push('Некорректная сумма');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Валидация текстового поля
 */
export function validateTextField(
  value: string,
  minLength = 0,
  maxLength = 255,
  required = true
): ValidationResult {
  const errors: string[] = [];
  
  if (required && (!value || value.trim() === '')) {
    errors.push('Это поле обязательно для заполнения');
    return { valid: false, errors };
  }
  
  if (value.length < minLength) {
    errors.push(`Минимальная длина: ${minLength} символов`);
  }
  
  if (value.length > maxLength) {
    errors.push(`Максимальная длина: ${maxLength} символов`);
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Общая функция валидации объекта
 */
export function validateObject<T extends Record<string, any>>(
  obj: T,
  rules: Record<keyof T, (value: any) => ValidationResult>
): { valid: boolean; errors: Record<string, string[]> } {
  const errors: Record<string, string[]> = {};
  let valid = true;

  for (const key in rules) {
    const result = rules[key](obj[key]);
    if (!result.valid) {
      errors[key] = result.errors;
      valid = false;
    }
  }

  return { valid, errors };
}

// Security utilities for XSS protection and content sanitization

/**
 * Sanitize user input to prevent XSS attacks
 */
export const sanitizeInput = (input: string): string => {
  if (typeof input !== 'string') return '';
  
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

/**
 * Escape HTML entities in user content
 */
export const escapeHtml = (text: string): string => {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};

/**
 * Strip dangerous HTML tags and attributes
 */
export const stripDangerousHtml = (html: string): string => {
  // Allow only safe tags
  const allowedTags = ['p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li'];
  const tagRegex = /<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^<>]*>/gi;
  
  return html.replace(tagRegex, (match, tagName) => {
    if (allowedTags.includes(tagName.toLowerCase())) {
      return match.replace(/on\w+="[^"]*"/gi, ''); // Remove event handlers
    }
    return '';
  });
};

/**
 * Validate and sanitize file uploads
 */
export const validateFileUpload = (file: File): { isValid: boolean; error?: string } => {
  const maxSize = 20 * 1024 * 1024; // 20MB
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
  
  if (file.size > maxSize) {
    return { isValid: false, error: 'Файл слишком большой (максимум 20MB)' };
  }
  
  if (!allowedTypes.includes(file.type)) {
    return { isValid: false, error: 'Недопустимый тип файла' };
  }
  
  return { isValid: true };
};

/**
 * Generate secure random tokens
 */
export const generateSecureToken = (length: number = 32): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const randomArray = new Uint8Array(length);
  crypto.getRandomValues(randomArray);
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(randomArray[i] % chars.length);
  }
  
  return result;
};

/**
 * Validate input against common injection patterns
 */
export const detectSuspiciousInput = (input: string): boolean => {
  const suspiciousPatterns = [
    /script\s*:/i,
    /javascript\s*:/i,
    /data\s*:/i,
    /vbscript\s*:/i,
    /<\s*script/i,
    /on\w+\s*=/i,
    /eval\s*\(/i,
    /expression\s*\(/i,
  ];
  
  return suspiciousPatterns.some(pattern => pattern.test(input));
};
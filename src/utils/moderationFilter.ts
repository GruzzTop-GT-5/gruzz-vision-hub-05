// Simple profanity filter for comment moderation
const INAPPROPRIATE_WORDS = [
  // Basic inappropriate words (expandable list)
  'spam',
  'скам',
  'мошенник',
  'кидалово',
  'развод',
  // Add more words as needed for moderation
];

export const containsInappropriateContent = (text: string): boolean => {
  const normalizedText = text.toLowerCase().replace(/[^\w\s]/g, '');
  
  return INAPPROPRIATE_WORDS.some(word => 
    normalizedText.includes(word.toLowerCase())
  );
};

export const flagSuspiciousContent = (text: string): string[] => {
  const issues: string[] = [];
  const normalizedText = text.toLowerCase();
  
  // Check for excessive caps
  if (text.length > 10 && text.replace(/[^A-ZА-Я]/g, '').length / text.length > 0.7) {
    issues.push('Excessive capitalization');
  }
  
  // Check for repeated characters
  if (/(.)\1{4,}/.test(text)) {
    issues.push('Repeated characters');
  }
  
  // Check for suspicious patterns
  if (/telegram|viber|whatsapp|звони|звонить/i.test(normalizedText)) {
    issues.push('Contact information in review');
  }
  
  return issues;
};
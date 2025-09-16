/**
 * Утилиты для работы с валютой GT Coins
 * 1 GT Coin = 1 рубль
 */

export const CURRENCY_CONFIG = {
  GT_COIN_RATE: 1.00, // 1 GT = 1 рубль
  CURRENCY_SYMBOL: '₽',
  CURRENCY_NAME: 'рубль',
  GT_SYMBOL: 'GT'
} as const;

/**
 * Форматирует сумму в GT Coins для отображения
 */
export function formatGTCoins(amount: number): string {
  return `${amount.toFixed(2)} GT`;
}

/**
 * Форматирует сумму в рублях для отображения
 */
export function formatRubles(amount: number): string {
  return `${amount.toFixed(2)} ${CURRENCY_CONFIG.CURRENCY_SYMBOL}`;
}

/**
 * Конвертирует GT Coins в рубли
 */
export function gtCoinsToRubles(gtAmount: number): number {
  return gtAmount * CURRENCY_CONFIG.GT_COIN_RATE;
}

/**
 * Конвертирует рубли в GT Coins
 */
export function rublesToGTCoins(rubleAmount: number): number {
  return rubleAmount / CURRENCY_CONFIG.GT_COIN_RATE;
}

/**
 * Форматирует баланс с показом и GT Coins и рублей
 */
export function formatBalance(gtAmount: number): {
  gtCoins: string;
  rubles: string;
  combined: string;
} {
  const rubleAmount = gtCoinsToRubles(gtAmount);
  
  return {
    gtCoins: formatGTCoins(gtAmount),
    rubles: formatRubles(rubleAmount),
    combined: `${formatGTCoins(gtAmount)} (${formatRubles(rubleAmount)})`
  };
}

/**
 * Валидирует сумму для операций с балансом
 */
export function validateAmount(amount: number): {
  isValid: boolean;
  error?: string;
} {
  if (amount <= 0) {
    return {
      isValid: false,
      error: 'Сумма должна быть больше 0'
    };
  }
  
  if (amount > 1000000) {
    return {
      isValid: false,
      error: 'Сумма слишком большая (максимум 1,000,000 GT)'
    };
  }
  
  // Проверяем, что сумма имеет максимум 2 знака после запятой
  if (Math.round(amount * 100) !== amount * 100) {
    return {
      isValid: false,
      error: 'Сумма должна иметь максимум 2 знака после запятой'
    };
  }
  
  return { isValid: true };
}
export interface CurrencyInfo {
  code: string;
  name: string;
  symbol: string;
  decimalPlaces: number;
  locale: string;
  rateToUsd: number; // exchange rate relative to USD
}

export const CURRENCIES: Record<string, CurrencyInfo> = {
  USD: { code: 'USD', name: 'US Dollar', symbol: '$', decimalPlaces: 2, locale: 'en-US', rateToUsd: 1.0 },
  EUR: { code: 'EUR', name: 'Euro', symbol: '€', decimalPlaces: 2, locale: 'de-DE', rateToUsd: 0.92 },
  GBP: { code: 'GBP', name: 'British Pound', symbol: '£', decimalPlaces: 2, locale: 'en-GB', rateToUsd: 0.79 },
  INR: { code: 'INR', name: 'Indian Rupee', symbol: '₹', decimalPlaces: 2, locale: 'en-IN', rateToUsd: 83.12 },
  JPY: { code: 'JPY', name: 'Japanese Yen', symbol: '¥', decimalPlaces: 0, locale: 'ja-JP', rateToUsd: 149.5 },
  CAD: { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', decimalPlaces: 2, locale: 'en-CA', rateToUsd: 1.36 },
  AUD: { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', decimalPlaces: 2, locale: 'en-AU', rateToUsd: 1.53 },
  CHF: { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', decimalPlaces: 2, locale: 'de-CH', rateToUsd: 0.9 },
  CNY: { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', decimalPlaces: 2, locale: 'zh-CN', rateToUsd: 7.24 },
  BRL: { code: 'BRL', name: 'Brazilian Real', symbol: 'R$', decimalPlaces: 2, locale: 'pt-BR', rateToUsd: 4.97 },
  MXN: { code: 'MXN', name: 'Mexican Peso', symbol: 'MX$', decimalPlaces: 2, locale: 'es-MX', rateToUsd: 17.15 },
  KRW: { code: 'KRW', name: 'South Korean Won', symbol: '₩', decimalPlaces: 0, locale: 'ko-KR', rateToUsd: 1325.0 },
  SGD: { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', decimalPlaces: 2, locale: 'en-SG', rateToUsd: 1.34 },
  HKD: { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$', decimalPlaces: 2, locale: 'zh-HK', rateToUsd: 7.82 },
  SEK: { code: 'SEK', name: 'Swedish Krona', symbol: 'kr', decimalPlaces: 2, locale: 'sv-SE', rateToUsd: 10.41 },
  NOK: { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr', decimalPlaces: 2, locale: 'nb-NO', rateToUsd: 10.56 },
  DKK: { code: 'DKK', name: 'Danish Krone', symbol: 'kr', decimalPlaces: 2, locale: 'da-DK', rateToUsd: 6.88 },
  ZAR: { code: 'ZAR', name: 'South African Rand', symbol: 'R', decimalPlaces: 2, locale: 'en-ZA', rateToUsd: 18.63 },
  THB: { code: 'THB', name: 'Thai Baht', symbol: '฿', decimalPlaces: 2, locale: 'th-TH', rateToUsd: 35.1 },
  AED: { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', decimalPlaces: 2, locale: 'ar-AE', rateToUsd: 3.67 },
};

export const CURRENCY_LIST = Object.values(CURRENCIES);

export function getCurrency(code: string): CurrencyInfo {
  return CURRENCIES[code] ?? CURRENCIES['USD'];
}

/**
 * Convert an amount from one currency to another using static rates.
 */
export function convertCurrency(amount: number, from: string, to: string): number {
  if (from === to) return amount;
  const fromRate = CURRENCIES[from]?.rateToUsd ?? 1;
  const toRate = CURRENCIES[to]?.rateToUsd ?? 1;
  // amount in USD = amount / fromRate; then convert to target
  return (amount / fromRate) * toRate;
}

/**
 * Format an amount with proper Intl.NumberFormat locale/symbol.
 */
export function formatCurrency(amount: number, currencyCode: string): string {
  const info = getCurrency(currencyCode);
  return new Intl.NumberFormat(info.locale, {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: info.decimalPlaces,
    maximumFractionDigits: info.decimalPlaces,
  }).format(amount);
}

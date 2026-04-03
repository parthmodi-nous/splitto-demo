'use client';

import { useMemo } from 'react';
import { formatCurrency, getCurrency, type CurrencyInfo } from '@/lib/currencies';

export interface UseCurrencyReturn {
  format: (amount: number) => string;
  currency: CurrencyInfo;
}

export function useCurrency(currencyCode: string = 'USD'): UseCurrencyReturn {
  return useMemo(() => {
    const currency = getCurrency(currencyCode);
    return {
      format: (amount: number) => formatCurrency(amount, currencyCode),
      currency,
    };
  }, [currencyCode]);
}

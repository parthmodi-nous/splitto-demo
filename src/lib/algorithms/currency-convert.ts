import { convertCurrency } from '@/lib/currencies';

export { convertCurrency };

/**
 * Convert all amounts in a list to a target currency and sum them.
 */
export function sumInCurrency(
  items: Array<{ amount: number; currency: string }>,
  targetCurrency: string
): number {
  return items.reduce((sum, item) => {
    return sum + convertCurrency(item.amount, item.currency, targetCurrency);
  }, 0);
}

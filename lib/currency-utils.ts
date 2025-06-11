// Currency utility functions for dynamic currency display

export interface CurrencyConfig {
  code: string;
  symbol: string;
  name: string;
}

export const SUPPORTED_CURRENCIES: Record<string, CurrencyConfig> = {
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound' },
  USD: { code: 'USD', symbol: '$', name: 'US Dollar' },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro' },
  JPY: { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
};

/**
 * Formats a price with the correct currency symbol
 */
export function formatPrice(price: number, currencyCode: string = 'GBP'): string {
  const currency = SUPPORTED_CURRENCIES[currencyCode] || SUPPORTED_CURRENCIES.GBP;
  return `${currency.symbol}${price.toLocaleString()}`;
}

/**
 * Gets the currency symbol for a given currency code
 */
export function getCurrencySymbol(currencyCode: string = 'GBP'): string {
  const currency = SUPPORTED_CURRENCIES[currencyCode] || SUPPORTED_CURRENCIES.GBP;
  return currency.symbol;
}

/**
 * Gets the currency name for a given currency code
 */
export function getCurrencyName(currencyCode: string = 'GBP'): string {
  const currency = SUPPORTED_CURRENCIES[currencyCode] || SUPPORTED_CURRENCIES.GBP;
  return currency.name;
}

/**
 * Validates if a currency code is supported
 */
export function isSupportedCurrency(currencyCode: string): boolean {
  return currencyCode in SUPPORTED_CURRENCIES;
} 
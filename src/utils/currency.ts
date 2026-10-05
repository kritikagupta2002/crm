
export interface CurrencyFormatOptions {
  lakhSuffix?: 'L' | 'Lakhs';
  lakhDecimals?: number;
  fallback?: string;
}

export function formatCurrency(
  amt?: number | null,
  options?: CurrencyFormatOptions
): string {
  if (amt === null || amt === undefined || isNaN(amt) || amt === 0) {
    return options?.fallback ?? '₹0';
  }

  if (amt >= 10000000) {
    return `₹${(amt / 10000000).toFixed(2)} Cr`;
  }

  if (amt >= 100000) {
    const suffix = options?.lakhSuffix ?? 'L';
    const decimals = options?.lakhDecimals ?? (suffix === 'Lakhs' ? 1 : 2);
    return `₹${(amt / 100000).toFixed(decimals)} ${suffix}`;
  }

  return `₹${amt.toLocaleString('en-IN')}`;
}

export function formatCurrencyLakhs(amt?: number | null): string {
  return formatCurrency(amt, { lakhSuffix: 'Lakhs' });
}

export function formatExactCurrency(
  amt?: number | null,
  fallback = '₹0'
): string {
  if (amt === null || amt === undefined || isNaN(amt)) {
    return fallback;
  }
  return `₹${amt.toLocaleString('en-IN')}`;
}

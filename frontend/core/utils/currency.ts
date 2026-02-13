/**
 * Currency Formatting Utilities
 * Provides consistent INR currency formatting across the application
 */

/**
 * Format a number as Indian Rupees (INR)
 * Uses Indian number formatting (lakhs, crores) with ₹ symbol
 *
 * @param amount - The amount to format (number or string)
 * @param options - Formatting options
 * @returns Formatted currency string (e.g., "₹ 1,00,000.00")
 *
 * @example
 * formatInrCurrency(100000) // "₹ 1,00,000.00"
 * formatInrCurrency(1500.5) // "₹ 1,500.50"
 * formatInrCurrency(null) // "₹ 0.00"
 * formatInrCurrency(undefined, { showZero: false }) // "—"
 */
export const formatInrCurrency = (
  amount: number | string | null | undefined,
  options: {
    /** Number of decimal places (default: 2) */
    decimals?: number;
    /** Show "—" instead of ₹ 0.00 when amount is null/undefined/0 */
    showZero?: boolean;
    /** Use compact notation for large numbers (e.g., ₹ 10L) */
    compact?: boolean;
  } = {}
): string => {
  const { decimals = 2, showZero = true, compact = false } = options;

  // Handle null/undefined
  if (amount === null || amount === undefined) {
    return showZero ? '₹ 0.00' : '—';
  }

  // Convert string to number
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

  // Handle NaN
  if (isNaN(numericAmount)) {
    return showZero ? '₹ 0.00' : '—';
  }

  // Handle zero when showZero is false
  if (numericAmount === 0 && !showZero) {
    return '—';
  }

  // Use compact notation for large numbers if requested
  if (compact && Math.abs(numericAmount) >= 100000) {
    return formatCompactInr(numericAmount);
  }

  // Use Intl.NumberFormat for proper Indian formatting
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(numericAmount);
  } catch (error) {
    // Fallback for environments where Intl isn't fully supported
    return `₹ ${numericAmount.toFixed(decimals)}`;
  }
};

/**
 * Format large INR amounts in compact notation (Lakhs, Crores)
 * 
 * @param amount - The amount to format
 * @returns Compact formatted string (e.g., "₹ 10L", "₹ 1.5Cr")
 */
export const formatCompactInr = (amount: number): string => {
  const absAmount = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';

  if (absAmount >= 10000000) {
    // Crores (10 million+)
    const crores = absAmount / 10000000;
    return `${sign}₹ ${crores.toFixed(crores >= 10 ? 1 : 2)}Cr`;
  } else if (absAmount >= 100000) {
    // Lakhs (100,000+)
    const lakhs = absAmount / 100000;
    return `${sign}₹ ${lakhs.toFixed(lakhs >= 10 ? 1 : 2)}L`;
  } else if (absAmount >= 1000) {
    // Thousands
    const thousands = absAmount / 1000;
    return `${sign}₹ ${thousands.toFixed(thousands >= 10 ? 1 : 2)}K`;
  }

  return formatInrCurrency(amount);
};

/**
 * Parse a currency string back to number
 * Handles "₹ 1,00,000.00" -> 100000
 *
 * @param currencyString - The currency string to parse
 * @returns Numeric value or 0 if invalid
 */
export const parseInrCurrency = (currencyString: string | null | undefined): number => {
  if (!currencyString) return 0;

  // Remove currency symbol, spaces, and commas
  const cleaned = currencyString
    .replace(/₹/g, '')
    .replace(/,/g, '')
    .replace(/\s/g, '')
    .trim();

  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
};

/**
 * Format percentage with proper formatting
 * 
 * @param value - The percentage value
 * @param decimals - Number of decimal places
 * @returns Formatted percentage string
 */
export const formatPercentage = (
  value: number | null | undefined,
  decimals: number = 1
): string => {
  if (value === null || value === undefined || isNaN(value)) {
    return '0%';
  }
  return `${value.toFixed(decimals)}%`;
};

/**
 * Format a number with Indian number system (lakhs, crores)
 * Without currency symbol
 * 
 * @param num - The number to format
 * @returns Formatted number string
 */
export const formatIndianNumber = (num: number | null | undefined): string => {
  if (num === null || num === undefined || isNaN(num)) {
    return '0';
  }

  try {
    return new Intl.NumberFormat('en-IN').format(num);
  } catch (error) {
    return num.toString();
  }
};

export default {
  formatInrCurrency,
  formatCompactInr,
  parseInrCurrency,
  formatPercentage,
  formatIndianNumber,
};

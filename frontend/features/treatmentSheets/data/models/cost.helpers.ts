/**
 * Cost Formatting Helpers
 * Utility functions for displaying cost information
 */

/**
 * Format cost range for display
 * @param min Minimum cost
 * @param max Maximum cost
 * @param currency Currency code (default: INR)
 * @returns Formatted cost string
 */
export const formatCostRange = (
  min?: number,
  max?: number,
  currency: string = 'INR'
): string => {
  if (!min && !max) return 'Cost to be determined';
  
  const symbol = currency === 'INR' ? '₹' : currency;
  
  if (min && max && min !== max) {
    return `${symbol}${min.toLocaleString()} - ${symbol}${max.toLocaleString()}`;
  }
  
  const amount = min || max || 0;
  return `${symbol}${amount.toLocaleString()}`;
};

/**
 * Utility functions for converting decimal numbers to fractions
 * Useful for displaying recipe quantities in a kitchen-friendly format
 */

interface Fraction {
  whole: number;
  numerator: number;
  denominator: number;
}

/**
 * Convert a decimal number to a fraction representation
 * @param decimal The decimal number to convert
 * @param precision The maximum denominator to consider (default: 64)
 * @returns Fraction object with whole, numerator, and denominator
 */
export function decimalToFraction(decimal: number, precision: number = 64): Fraction {
  if (decimal === 0) {
    return { whole: 0, numerator: 0, denominator: 1 };
  }

  const sign = decimal < 0 ? -1 : 1;
  decimal = Math.abs(decimal);

  const whole = Math.floor(decimal);
  const fractionalPart = decimal - whole;

  if (fractionalPart === 0) {
    return { whole: whole * sign, numerator: 0, denominator: 1 };
  }

  // Find the best fraction representation
  let bestNumerator = 1;
  let bestDenominator = 1;
  let bestError = Math.abs(fractionalPart - bestNumerator / bestDenominator);

  for (let denominator = 2; denominator <= precision; denominator++) {
    const numerator = Math.round(fractionalPart * denominator);
    const error = Math.abs(fractionalPart - numerator / denominator);

    if (error < bestError) {
      bestNumerator = numerator;
      bestDenominator = denominator;
      bestError = error;
    }

    // If we found an exact match, stop
    if (error < 0.0001) {
      break;
    }
  }

  // Reduce the fraction
  const gcd = greatestCommonDivisor(bestNumerator, bestDenominator);
  bestNumerator = bestNumerator / gcd;
  bestDenominator = bestDenominator / gcd;

  return {
    whole: whole * sign,
    numerator: bestNumerator * sign,
    denominator: bestDenominator
  };
}

/**
 * Format a fraction object as a readable string
 * @param fraction The fraction to format
 * @returns Formatted string (e.g., "1 1/2", "3/4", "2")
 */
export function formatFraction(fraction: Fraction): string {
  const { whole, numerator, denominator } = fraction;

  if (numerator === 0) {
    return whole.toString();
  }

  if (whole === 0) {
    return `${Math.abs(numerator)}/${denominator}`;
  }

  const sign = whole < 0 || numerator < 0 ? '-' : '';
  return `${sign}${Math.abs(whole)} ${Math.abs(numerator)}/${denominator}`;
}

/**
 * Convert a decimal directly to a formatted fraction string
 * @param decimal The decimal number to convert
 * @param precision The maximum denominator to consider (default: 64)
 * @returns Formatted fraction string
 */
export function decimalToFractionString(decimal: number, precision: number = 64): string {
  // Handle special cases
  if (decimal === 0) return '0';
  if (isNaN(decimal)) return decimal.toString();

  const fraction = decimalToFraction(decimal, precision);
  return formatFraction(fraction);
}

/**
 * Greatest Common Divisor helper function
 */
function greatestCommonDivisor(a: number, b: number): number {
  return b === 0 ? a : greatestCommonDivisor(b, a % b);
}

/**
 * Common cooking fractions for better recognition
 */
const COMMON_COOKING_FRACTIONS = [
  { decimal: 0.125, fraction: '1/8' },
  { decimal: 0.25, fraction: '1/4' },
  { decimal: 0.333, fraction: '1/3' },
  { decimal: 0.5, fraction: '1/2' },
  { decimal: 0.666, fraction: '2/3' },
  { decimal: 0.75, fraction: '3/4' },
  { decimal: 1.25, fraction: '1 1/4' },
  { decimal: 1.333, fraction: '1 1/3' },
  { decimal: 1.5, fraction: '1 1/2' },
  { decimal: 1.666, fraction: '1 2/3' },
  { decimal: 1.75, fraction: '1 3/4' },
  { decimal: 2.25, fraction: '2 1/4' },
  { decimal: 2.333, fraction: '2 1/3' },
  { decimal: 2.5, fraction: '2 1/2' },
  { decimal: 2.666, fraction: '2 2/3' },
  { decimal: 2.75, fraction: '2 3/4' }
];

/**
 * Convert decimal to fraction with preference for common cooking fractions
 * @param decimal The decimal number to convert
 * @returns Formatted fraction string optimized for cooking
 */
export function decimalToCookingFraction(decimal: number): string {
  if (decimal === 0) return '0';
  if (isNaN(decimal)) return decimal.toString();

  // Check for common cooking fractions first (with small tolerance)
  for (const common of COMMON_COOKING_FRACTIONS) {
    if (Math.abs(decimal - common.decimal) < 0.01) {
      return common.fraction;
    }
  }

  // Fall back to general fraction conversion
  return decimalToFractionString(decimal, 32); // Use smaller precision for cooking
}
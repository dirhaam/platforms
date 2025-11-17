/**
 * Phone number masking utilities for privacy
 * Masks phone numbers to show only first digits and last 3 digits
 */

/**
 * Mask phone number - show first digits and last 3 digits only
 * Example: +62812345678 → +62* * * * * 678
 * Example: 081234567890 → 081* * * * * 890
 * 
 * @param phone - Phone number to mask
 * @returns Masked phone number
 */
export function maskPhoneNumber(phone: string): string {
  if (!phone) return '';

  // Remove any whitespace
  const cleanPhone = phone.trim();

  // If phone is too short, return as is
  if (cleanPhone.length <= 3) return cleanPhone;

  // Get the first 3 characters (country code or area code)
  const firstPart = cleanPhone.substring(0, 3);
  
  // Get the last 3 characters
  const lastPart = cleanPhone.substring(cleanPhone.length - 3);

  // Get the middle length
  const middleLength = cleanPhone.length - 6;

  // Create mask (asterisks with spaces)
  const mask = '* '.repeat(middleLength).trim();

  return `${firstPart}${mask ? ' ' + mask + ' ' : ' '}${lastPart}`;
}

/**
 * Mask phone number - show first 3 and last 3 digits (compact version)
 * Example: +62812345678 → +62***5678
 * Example: 081234567890 → 081***7890
 * 
 * @param phone - Phone number to mask
 * @returns Masked phone number (compact)
 */
export function maskPhoneNumberCompact(phone: string): string {
  if (!phone) return '';

  const cleanPhone = phone.trim();

  // If phone is too short, return as is
  if (cleanPhone.length <= 6) return cleanPhone;

  const firstPart = cleanPhone.substring(0, 3);
  const lastPart = cleanPhone.substring(cleanPhone.length - 3);

  return `${firstPart}***${lastPart}`;
}

/**
 * Mask phone number - show first 4 and last 4 digits
 * Example: +62812345678 → +6281***5678
 * Example: 081234567890 → 0812***7890
 * 
 * @param phone - Phone number to mask
 * @returns Masked phone number (4-4 format)
 */
export function maskPhoneNumber44(phone: string): string {
  if (!phone) return '';

  const cleanPhone = phone.trim();

  // If phone is too short, return as is
  if (cleanPhone.length <= 8) return cleanPhone;

  const firstPart = cleanPhone.substring(0, 4);
  const lastPart = cleanPhone.substring(cleanPhone.length - 4);

  return `${firstPart}***${lastPart}`;
}

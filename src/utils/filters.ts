/**
 * Message filtering utilities
 */

/**
 * Parse date string to Date object
 *
 * @param dateStr - Date string in YYYY-MM-DD format
 * @returns Date object
 */
export function parseDate(dateStr: string): Date {
  const date = new Date(dateStr + 'T00:00:00Z');
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date format: ${dateStr}. Expected YYYY-MM-DD`);
  }
  return date;
}

/**
 * Convert date string to Unix timestamp
 *
 * @param dateStr - Date string in YYYY-MM-DD format
 * @returns Unix timestamp in seconds
 */
export function dateToTimestamp(dateStr: string): number {
  return Math.floor(parseDate(dateStr).getTime() / 1000);
}

/**
 * Check if message date is within range
 *
 * @param messageDate - Message date
 * @param minDate - Minimum date (inclusive)
 * @param maxDate - Maximum date (inclusive)
 * @returns true if within range
 */
export function isWithinDateRange(
  messageDate: Date,
  minDate?: Date,
  maxDate?: Date
): boolean {
  if (minDate && messageDate < minDate) {
    return false;
  }
  if (maxDate) {
    // Add one day to maxDate to make it inclusive of the entire day
    const maxDateEndOfDay = new Date(maxDate);
    maxDateEndOfDay.setDate(maxDateEndOfDay.getDate() + 1);
    if (messageDate >= maxDateEndOfDay) {
      return false;
    }
  }
  return true;
}

/**
 * Check if text contains any of the keywords (case-insensitive)
 *
 * @param text - Text to search
 * @param keywords - Comma-separated keywords
 * @returns true if contains any keyword
 */
export function containsKeywords(text: string, keywords?: string): boolean {
  if (!keywords) {
    return true; // No filter
  }

  const keywordList = keywords
    .split(',')
    .map(k => k.trim().toLowerCase())
    .filter(k => k.length > 0);

  if (keywordList.length === 0) {
    return true;
  }

  const lowerText = text.toLowerCase();
  return keywordList.some(keyword => lowerText.includes(keyword));
}

/**
 * Check if sender matches any of the specified users
 *
 * @param sender - Sender username or ID
 * @param senderId - Sender numeric ID
 * @param users - Comma-separated usernames or IDs
 * @returns true if matches any user
 */
export function matchesUser(
  sender: string | null,
  senderId: number | string | null,
  users?: string
): boolean {
  if (!users) {
    return true; // No filter
  }

  const userList = users
    .split(',')
    .map(u => u.trim().toLowerCase())
    .filter(u => u.length > 0);

  if (userList.length === 0) {
    return true;
  }

  // Check username match
  if (sender) {
    const lowerSender = sender.toLowerCase().replace('@', '');
    if (userList.some(u => u === lowerSender || u === `@${lowerSender}`)) {
      return true;
    }
  }

  // Check ID match
  if (senderId !== null && senderId !== undefined) {
    const senderIdStr = senderId.toString();
    if (userList.some(u => u === senderIdStr)) {
      return true;
    }
  }

  return false;
}

/**
 * Check if message has media
 *
 * @param hasMedia - Whether message contains media
 * @param onlyMedia - Filter to only media messages
 * @param onlyText - Filter to only text messages
 * @returns true if passes filter
 */
export function matchesMediaFilter(
  hasMedia: boolean,
  onlyMedia?: boolean,
  onlyText?: boolean
): boolean {
  if (onlyMedia && onlyText) {
    // Both filters active is contradictory, treat as no filter
    return true;
  }

  if (onlyMedia && !hasMedia) {
    return false;
  }

  if (onlyText && hasMedia) {
    return false;
  }

  return true;
}

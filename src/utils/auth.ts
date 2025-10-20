/**
 * Authentication utilities for ChatScraper MCP Server
 */

/**
 * Parsed Telegram credentials from composite token
 */
export interface TelegramCredentials {
  apiId: number;
  apiHash: string;
  phone: string;
  sessionString: string;
}

/**
 * Parse Telegram composite token
 * Format: api_id:api_hash:phone:session_string
 *
 * @param accessToken - Composite token string
 * @returns Parsed credentials
 * @throws Error if token format is invalid
 */
export function parseTelegramToken(accessToken: string): TelegramCredentials {
  const parts = accessToken.split(':');

  if (parts.length !== 4) {
    throw new Error(
      'Invalid Telegram token format. Expected: api_id:api_hash:phone:session_string'
    );
  }

  const [apiIdStr, apiHash, phone, sessionString] = parts;

  const apiId = parseInt(apiIdStr, 10);
  if (isNaN(apiId)) {
    throw new Error('Invalid api_id: must be a number');
  }

  if (!apiHash || apiHash.length < 10) {
    throw new Error('Invalid api_hash: too short');
  }

  if (!phone || !phone.startsWith('+')) {
    throw new Error('Invalid phone: must start with +');
  }

  if (!sessionString) {
    throw new Error('Invalid session_string: cannot be empty');
  }

  return {
    apiId,
    apiHash,
    phone,
    sessionString
  };
}

/**
 * Validate Slack OAuth token format
 *
 * @param accessToken - Slack OAuth token
 * @returns true if valid format
 * @throws Error if token format is invalid
 */
export function validateSlackToken(accessToken: string): boolean {
  if (!accessToken) {
    throw new Error('Slack token cannot be empty');
  }

  // Slack tokens start with xoxb- (bot) or xoxp- (user)
  if (!accessToken.startsWith('xoxb-') && !accessToken.startsWith('xoxp-')) {
    throw new Error(
      'Invalid Slack token format. Must start with xoxb- (bot) or xoxp- (user)'
    );
  }

  if (accessToken.length < 20) {
    throw new Error('Invalid Slack token: too short');
  }

  return true;
}

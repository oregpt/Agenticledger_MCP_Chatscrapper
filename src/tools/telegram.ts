/**
 * Telegram scraping tools for MCP server
 */

import { TelegramScraper } from '../clients/telegram-client.js';
import {
  ScrapeTelegramChannelSchema,
  ListTelegramChannelsSchema,
  type SuccessResponse,
  type ErrorResponse,
  type TelegramScrapeData,
  type TelegramChannelsData
} from './schemas.js';

/**
 * Tool: scrape_telegram_channel
 * Scrape messages from a Telegram channel or group
 */
export async function scrapeTelegramChannel(
  args: unknown
): Promise<SuccessResponse<TelegramScrapeData> | ErrorResponse> {
  try {
    // Validate input
    const params = ScrapeTelegramChannelSchema.parse(args);

    // Create scraper
    const scraper = new TelegramScraper(params.accessToken);

    try {
      // Scrape channel
      const data = await scraper.scrapeChannel({
        chat: params.chat,
        limit: params.limit,
        minDate: params.minDate,
        maxDate: params.maxDate,
        keywords: params.keywords,
        users: params.users,
        onlyMedia: params.onlyMedia,
        onlyText: params.onlyText,
        reverse: params.reverse
      });

      return {
        success: true,
        data
      };
    } finally {
      // Always disconnect
      await scraper.disconnect();
    }
  } catch (error) {
    // Handle specific error types
    if (error instanceof Error) {
      // Rate limit error
      if (error.message.includes('FLOOD_WAIT')) {
        const match = error.message.match(/(\d+)/);
        const retryAfter = match ? parseInt(match[1]) : undefined;
        return {
          success: false,
          error: `Rate limited by Telegram. Please wait ${retryAfter || 'a few'} seconds before trying again.`,
          retryAfter
        };
      }

      // Authentication error
      if (
        error.message.includes('AUTH_KEY') ||
        error.message.includes('SESSION_EXPIRED')
      ) {
        return {
          success: false,
          error: 'Invalid or expired session. Please re-authenticate with Telegram.'
        };
      }

      // Channel not found
      if (error.message.includes('CHANNEL_INVALID') || error.message.includes('not found')) {
        return {
          success: false,
          error: `Channel not found: ${(args as any).chat}. Make sure you have access to this channel.`
        };
      }

      // Invalid token format
      if (error.message.includes('Invalid Telegram token')) {
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: false,
        error: error.message
      };
    }

    return {
      success: false,
      error: String(error)
    };
  }
}

/**
 * Tool: list_telegram_channels
 * List all accessible Telegram channels and groups
 */
export async function listTelegramChannels(
  args: unknown
): Promise<SuccessResponse<TelegramChannelsData> | ErrorResponse> {
  try {
    // Validate input
    const params = ListTelegramChannelsSchema.parse(args);

    // Create scraper
    const scraper = new TelegramScraper(params.accessToken);

    try {
      // List channels
      const data = await scraper.listChannels();

      return {
        success: true,
        data
      };
    } finally {
      // Always disconnect
      await scraper.disconnect();
    }
  } catch (error) {
    if (error instanceof Error) {
      // Authentication error
      if (
        error.message.includes('AUTH_KEY') ||
        error.message.includes('SESSION_EXPIRED')
      ) {
        return {
          success: false,
          error: 'Invalid or expired session. Please re-authenticate with Telegram.'
        };
      }

      // Invalid token format
      if (error.message.includes('Invalid Telegram token')) {
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: false,
        error: error.message
      };
    }

    return {
      success: false,
      error: String(error)
    };
  }
}

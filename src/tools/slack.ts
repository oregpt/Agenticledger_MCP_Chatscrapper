/**
 * Slack scraping tools for MCP server
 */

import { SlackScraper } from '../clients/slack-client.js';
import {
  ScrapeSlackChannelSchema,
  ListSlackChannelsSchema,
  type SuccessResponse,
  type ErrorResponse,
  type SlackScrapeData,
  type SlackChannelsData
} from './schemas.js';

/**
 * Tool: scrape_slack_channel
 * Scrape messages from a Slack channel
 */
export async function scrapeSlackChannel(
  args: unknown
): Promise<SuccessResponse<SlackScrapeData> | ErrorResponse> {
  try {
    // Validate input
    const params = ScrapeSlackChannelSchema.parse(args);

    // Create scraper
    const scraper = new SlackScraper(params.accessToken);

    // Scrape channel
    const data = await scraper.scrapeChannel({
      channel: params.channel,
      limit: params.limit,
      minDate: params.minDate,
      maxDate: params.maxDate,
      keywords: params.keywords,
      users: params.users,
      onlyMedia: params.onlyMedia,
      onlyText: params.onlyText,
      includeThreads: params.includeThreads
    });

    return {
      success: true,
      data
    };
  } catch (error) {
    // Handle Slack-specific errors
    if (error instanceof Error) {
      const errorMsg = error.message.toLowerCase();

      // Authentication errors
      if (errorMsg.includes('invalid_auth') || errorMsg.includes('not_authed')) {
        return {
          success: false,
          error: 'Invalid Slack token. Please check your authentication credentials.'
        };
      }

      // Token expired
      if (errorMsg.includes('token_expired') || errorMsg.includes('token_revoked')) {
        return {
          success: false,
          error: 'Slack token has expired or been revoked. Please re-authenticate.'
        };
      }

      // Rate limiting
      if (errorMsg.includes('rate_limited') || errorMsg.includes('ratelimited')) {
        const match = error.message.match(/retry after (\d+)/i);
        const retryAfter = match ? parseInt(match[1]) : undefined;
        return {
          success: false,
          error: `Rate limited by Slack. Please wait ${retryAfter || 60} seconds before trying again.`,
          retryAfter
        };
      }

      // Channel not found
      if (errorMsg.includes('channel_not_found')) {
        return {
          success: false,
          error: `Channel not found: ${(args as any).channel}. Make sure the bot is a member of the channel.`
        };
      }

      // Permission errors
      if (errorMsg.includes('missing_scope') || errorMsg.includes('not_in_channel')) {
        return {
          success: false,
          error: `Missing permissions. Ensure the bot has the following scopes: channels:history, groups:history, channels:read, users:read. Also verify the bot is a member of the channel.`
        };
      }

      // Invalid token format
      if (errorMsg.includes('invalid slack token')) {
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
 * Tool: list_slack_channels
 * List all accessible Slack channels
 */
export async function listSlackChannels(
  args: unknown
): Promise<SuccessResponse<SlackChannelsData> | ErrorResponse> {
  try {
    // Validate input
    const params = ListSlackChannelsSchema.parse(args);

    // Create scraper
    const scraper = new SlackScraper(params.accessToken);

    // List channels
    const data = await scraper.listChannels({
      includePrivate: params.includePrivate
    });

    return {
      success: true,
      data
    };
  } catch (error) {
    if (error instanceof Error) {
      const errorMsg = error.message.toLowerCase();

      // Authentication errors
      if (errorMsg.includes('invalid_auth') || errorMsg.includes('not_authed')) {
        return {
          success: false,
          error: 'Invalid Slack token. Please check your authentication credentials.'
        };
      }

      // Token expired
      if (errorMsg.includes('token_expired') || errorMsg.includes('token_revoked')) {
        return {
          success: false,
          error: 'Slack token has expired or been revoked. Please re-authenticate.'
        };
      }

      // Permission errors
      if (errorMsg.includes('missing_scope')) {
        return {
          success: false,
          error: 'Missing permissions. Ensure the bot has channels:read and groups:read scopes.'
        };
      }

      // Invalid token format
      if (errorMsg.includes('invalid slack token')) {
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

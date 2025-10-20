/**
 * Slack client wrapper for chat scraping
 * Uses @slack/web-api official SDK
 */

import { WebClient } from '@slack/web-api';
import type {
  SlackMessage,
  SlackChannel,
  SlackScrapeData,
  SlackChannelsData
} from '../tools/schemas.js';
import { validateSlackToken } from '../utils/auth.js';
import {
  dateToTimestamp,
  containsKeywords,
  matchesUser,
  matchesMediaFilter
} from '../utils/filters.js';

/**
 * Slack scraper client
 */
export class SlackScraper {
  private client: WebClient;

  constructor(accessToken: string) {
    validateSlackToken(accessToken);
    this.client = new WebClient(accessToken);
  }

  /**
   * Resolve channel name to channel ID
   */
  private async resolveChannelId(channel: string): Promise<{
    id: string;
    name: string;
  }> {
    // If already an ID (starts with C or G), return as-is
    if (channel.match(/^[CG][A-Z0-9]+$/)) {
      return { id: channel, name: channel };
    }

    // Remove # prefix if present
    const channelName = channel.replace(/^#/, '');

    // Search for channel
    const result = await this.client.conversations.list({
      types: 'public_channel,private_channel',
      limit: 1000
    });

    if (!result.channels) {
      throw new Error(`No channels found`);
    }

    const found = result.channels.find(
      (ch) => ch.name === channelName || ch.id === channel
    );

    if (!found) {
      throw new Error(
        `Channel not found: ${channel}. Make sure the bot is a member of the channel.`
      );
    }

    return {
      id: found.id!,
      name: found.name || channelName
    };
  }

  /**
   * Get user information for a user ID
   */
  private async getUserInfo(userId: string): Promise<{
    name: string | null;
    realName: string | null;
  }> {
    try {
      const result = await this.client.users.info({ user: userId });
      return {
        name: result.user?.name || null,
        realName: result.user?.real_name || null
      };
    } catch (error) {
      return { name: null, realName: null };
    }
  }

  /**
   * Scrape messages from a Slack channel
   */
  async scrapeChannel(params: {
    channel: string;
    limit?: number;
    minDate?: string;
    maxDate?: string;
    keywords?: string;
    users?: string;
    onlyMedia?: boolean;
    onlyText?: boolean;
    includeThreads?: boolean;
  }): Promise<SlackScrapeData> {
    // Resolve channel
    const { id: channelId, name: channelName } = await this.resolveChannelId(
      params.channel
    );

    // Get workspace info (optional - requires team:read scope)
    let workspace = 'Unknown';
    try {
      const teamInfo = await this.client.team.info();
      workspace = teamInfo.team?.name || 'Unknown';
    } catch (error) {
      // team:read scope not available, use default
      workspace = 'Unknown';
    }

    // Convert date filters to timestamps (Slack API expects string timestamps)
    const oldest = params.minDate ? String(dateToTimestamp(params.minDate)) : undefined;
    const latest = params.maxDate
      ? String(dateToTimestamp(params.maxDate) + 86400)
      : undefined; // Add 1 day to make inclusive

    // Fetch messages
    const messages: SlackMessage[] = [];
    const limit = Math.min(params.limit || 100, 1000);
    let cursor: string | undefined;
    let fetchedCount = 0;

    // User info cache
    const userCache = new Map<string, { name: string | null; realName: string | null }>();

    while (fetchedCount < limit) {
      const result = await this.client.conversations.history({
        channel: channelId,
        limit: Math.min(limit - fetchedCount, 1000),
        oldest,
        latest,
        cursor
      });

      if (!result.messages || result.messages.length === 0) {
        break;
      }

      for (const msg of result.messages) {
        // Skip if not a regular message
        if (!msg.ts || !msg.user) {
          continue;
        }

        // Get user info (cached)
        let userInfo = userCache.get(msg.user);
        if (!userInfo) {
          userInfo = await this.getUserInfo(msg.user);
          userCache.set(msg.user, userInfo);
        }

        // User filter
        const userName = userInfo.name || userInfo.realName;
        if (!matchesUser(userName, msg.user, params.users)) {
          continue;
        }

        // Get message text
        const text = msg.text || '';

        // Keyword filter
        if (!containsKeywords(text, params.keywords)) {
          continue;
        }

        // Media/files info
        const hasMedia = !!(msg.files && msg.files.length > 0);

        // Media filter
        if (!matchesMediaFilter(hasMedia, params.onlyMedia, params.onlyText)) {
          continue;
        }

        // Parse timestamp to date
        const messageDate = new Date(parseFloat(msg.ts) * 1000);

        // Build files array
        const files =
          msg.files?.map((file) => ({
            id: file.id!,
            name: file.name || 'unknown',
            mimetype: file.mimetype || 'application/octet-stream',
            size: file.size || 0,
            url: file.url_private || file.permalink || ''
          })) || [];

        // Build reactions array
        const reactions =
          msg.reactions?.map((reaction) => ({
            name: reaction.name!,
            count: reaction.count!,
            users: reaction.users || []
          })) || [];

        // Add message
        messages.push({
          ts: msg.ts,
          date: messageDate.toISOString(),
          text,
          user: msg.user,
          userName: userInfo.name,
          userRealName: userInfo.realName || undefined,
          files: files.length > 0 ? files : undefined,
          reactions: reactions.length > 0 ? reactions : undefined,
          threadTs: msg.thread_ts,
          replyCount: msg.reply_count,
          isThreadReply: !!msg.thread_ts && msg.thread_ts !== msg.ts
        });

        fetchedCount++;

        // Fetch thread replies if requested
        if (params.includeThreads && msg.thread_ts && msg.reply_count) {
          try {
            const threadResult = await this.client.conversations.replies({
              channel: channelId,
              ts: msg.thread_ts
            });

            if (threadResult.messages && threadResult.messages.length > 1) {
              // Skip first message (parent)
              for (const threadMsg of threadResult.messages.slice(1)) {
                if (!threadMsg.ts || !threadMsg.user) continue;

                let threadUserInfo = userCache.get(threadMsg.user);
                if (!threadUserInfo) {
                  threadUserInfo = await this.getUserInfo(threadMsg.user);
                  userCache.set(threadMsg.user, threadUserInfo);
                }

                const threadText = threadMsg.text || '';
                if (!containsKeywords(threadText, params.keywords)) {
                  continue;
                }

                const threadDate = new Date(parseFloat(threadMsg.ts) * 1000);

                messages.push({
                  ts: threadMsg.ts,
                  date: threadDate.toISOString(),
                  text: threadText,
                  user: threadMsg.user,
                  userName: threadUserInfo.name,
                  userRealName: threadUserInfo.realName || undefined,
                  threadTs: msg.thread_ts,
                  isThreadReply: true
                });

                fetchedCount++;
              }
            }
          } catch (error) {
            // Ignore thread fetch errors
            console.error('Error fetching thread:', error);
          }
        }

        if (fetchedCount >= limit) {
          break;
        }
      }

      // Check for more messages
      if (!result.has_more || !result.response_metadata?.next_cursor) {
        break;
      }

      cursor = result.response_metadata.next_cursor;
    }

    return {
      channel: params.channel,
      totalMessages: messages.length,
      messages,
      metadata: {
        channelName,
        channelId,
        workspace,
        exportedAt: new Date().toISOString()
      }
    };
  }

  /**
   * List all accessible Slack channels
   */
  async listChannels(params: {
    includePrivate?: boolean;
  }): Promise<SlackChannelsData> {
    const types = params.includePrivate
      ? 'public_channel,private_channel'
      : 'public_channel';

    const result = await this.client.conversations.list({
      types,
      limit: 1000,
      exclude_archived: true
    });

    const channels: SlackChannel[] =
      result.channels?.map((ch) => ({
        id: ch.id!,
        name: ch.name!,
        isPrivate: ch.is_private || false,
        memberCount: ch.num_members,
        topic: ch.topic?.value,
        purpose: ch.purpose?.value,
        created: ch.created || 0
      })) || [];

    return {
      channels,
      totalCount: channels.length
    };
  }
}

/**
 * Telegram client wrapper for chat scraping
 * Uses telegram npm package (MTProto client for Node.js)
 */

import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions/index.js';
import { Api } from 'telegram/tl/index.js';
import type {
  TelegramMessage,
  TelegramChannel,
  TelegramScrapeData,
  TelegramChannelsData
} from '../tools/schemas.js';
import { parseTelegramToken, type TelegramCredentials } from '../utils/auth.js';
import {
  parseDate,
  isWithinDateRange,
  containsKeywords,
  matchesUser,
  matchesMediaFilter
} from '../utils/filters.js';

/**
 * Telegram scraper client
 */
export class TelegramScraper {
  private client: TelegramClient | null = null;
  private credentials: TelegramCredentials;

  constructor(accessToken: string) {
    this.credentials = parseTelegramToken(accessToken);
  }

  /**
   * Initialize and connect Telegram client
   */
  private async getClient(): Promise<TelegramClient> {
    if (this.client) {
      return this.client;
    }

    const session = new StringSession(this.credentials.sessionString);
    this.client = new TelegramClient(
      session,
      this.credentials.apiId,
      this.credentials.apiHash,
      {
        connectionRetries: 5
      }
    );

    await this.client.connect();
    return this.client;
  }

  /**
   * Scrape messages from a Telegram channel/group
   */
  async scrapeChannel(params: {
    chat: string;
    limit?: number;
    minDate?: string;
    maxDate?: string;
    keywords?: string;
    users?: string;
    onlyMedia?: boolean;
    onlyText?: boolean;
    reverse?: boolean;
  }): Promise<TelegramScrapeData> {
    const client = await this.getClient();

    // Parse date filters
    const minDateObj = params.minDate ? parseDate(params.minDate) : undefined;
    const maxDateObj = params.maxDate ? parseDate(params.maxDate) : undefined;

    // Get chat entity
    const entity = await client.getEntity(params.chat);

    let chatTitle = '';
    let chatType: 'channel' | 'group' | 'chat' = 'chat';
    let totalParticipants: number | undefined;

    if (entity instanceof Api.Channel) {
      chatTitle = entity.title;
      chatType = entity.broadcast ? 'channel' : 'group';
      if (entity.participantsCount) {
        totalParticipants = entity.participantsCount;
      }
    } else if (entity instanceof Api.Chat) {
      chatTitle = entity.title;
      chatType = 'group';
      totalParticipants = entity.participantsCount;
    } else if (entity instanceof Api.User) {
      chatTitle = entity.firstName || entity.username || 'User';
      chatType = 'chat';
    }

    // Fetch messages
    const messages: TelegramMessage[] = [];
    const limit = Math.min(params.limit || 100, 1000);

    const iter = client.iterMessages(entity, {
      limit,
      reverse: params.reverse || false,
      ...(minDateObj && { offsetDate: Math.floor(minDateObj.getTime() / 1000) })
    });

    for await (const message of iter) {
      // Skip if no message
      if (!message) continue;

      // Date filter
      const messageDate = new Date(message.date * 1000);
      if (!isWithinDateRange(messageDate, minDateObj, maxDateObj)) {
        continue;
      }

      // Get sender info
      const sender = message.sender;
      let senderName: string | null = null;
      let senderId: number | null = null;

      if (sender instanceof Api.User) {
        senderName = sender.username || sender.firstName || null;
        senderId = Number(sender.id);
      } else if (sender instanceof Api.Channel) {
        senderName = sender.username || sender.title;
        senderId = Number(sender.id);
      }

      // User filter
      if (!matchesUser(senderName, senderId, params.users)) {
        continue;
      }

      // Get message text
      const text = message.message || '';

      // Keyword filter
      if (!containsKeywords(text, params.keywords)) {
        continue;
      }

      // Media info
      let mediaType: string | null = null;
      let mediaUrl: string | null = null;
      let mediaSize: number | undefined;
      let fileName: string | undefined;
      const hasMedia = !!message.media;

      if (message.media) {
        if (message.media instanceof Api.MessageMediaPhoto) {
          mediaType = 'photo';
        } else if (message.media instanceof Api.MessageMediaDocument) {
          const doc = message.media.document;
          if (doc instanceof Api.Document) {
            // Determine media type from mime
            if (doc.mimeType?.startsWith('image/')) {
              mediaType = 'photo';
            } else if (doc.mimeType?.startsWith('video/')) {
              mediaType = 'video';
            } else if (doc.mimeType?.startsWith('audio/')) {
              mediaType = 'audio';
            } else {
              mediaType = 'document';
            }

            mediaSize = Number(doc.size);

            // Get filename from attributes
            if (doc.attributes) {
              for (const attr of doc.attributes) {
                if (attr instanceof Api.DocumentAttributeFilename) {
                  fileName = attr.fileName;
                  break;
                }
              }
            }
          }
        } else if (message.media instanceof Api.MessageMediaWebPage) {
          mediaType = 'webpage';
        } else if (message.media instanceof Api.MessageMediaGeo) {
          mediaType = 'location';
        } else if (message.media instanceof Api.MessageMediaContact) {
          mediaType = 'contact';
        } else if (message.media instanceof Api.MessageMediaPoll) {
          mediaType = 'poll';
        }
      }

      // Media filter
      if (!matchesMediaFilter(hasMedia, params.onlyMedia, params.onlyText)) {
        continue;
      }

      // Get reactions
      const reactions: Record<string, number> = {};
      if (message.reactions?.results) {
        for (const reaction of message.reactions.results) {
          if (reaction.reaction instanceof Api.ReactionEmoji) {
            reactions[reaction.reaction.emoticon] = reaction.count;
          }
        }
      }

      // Build message object
      messages.push({
        id: message.id,
        date: messageDate.toISOString(),
        text,
        sender: senderName,
        senderId,
        mediaType,
        mediaUrl,
        mediaSize,
        fileName,
        reactions: Object.keys(reactions).length > 0 ? reactions : undefined,
        views: message.views || undefined,
        forwards: message.forwards || undefined,
        isForwarded: !!message.fwdFrom,
        forwardFrom: message.fwdFrom?.fromName || undefined
      });
    }

    return {
      channel: params.chat,
      totalMessages: messages.length,
      messages,
      metadata: {
        chatTitle,
        chatType,
        totalParticipants,
        exportedAt: new Date().toISOString()
      }
    };
  }

  /**
   * List all accessible channels and groups
   */
  async listChannels(): Promise<TelegramChannelsData> {
    const client = await this.getClient();

    const dialogs = await client.getDialogs({ limit: 100 });
    const channels: TelegramChannel[] = [];

    for (const dialog of dialogs) {
      const entity = dialog.entity;

      if (entity instanceof Api.Channel) {
        channels.push({
          id: Number(entity.id),
          title: entity.title,
          username: entity.username || null,
          type: entity.broadcast ? 'channel' : 'group',
          participants: entity.participantsCount || undefined,
          isPublic: !entity.megagroup,
          description: entity.about || undefined
        });
      } else if (entity instanceof Api.Chat) {
        channels.push({
          id: Number(entity.id),
          title: entity.title,
          username: null,
          type: 'group',
          participants: entity.participantsCount,
          isPublic: false
        });
      }
    }

    return {
      channels,
      totalCount: channels.length
    };
  }

  /**
   * Disconnect client
   */
  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.disconnect();
      this.client = null;
    }
  }
}

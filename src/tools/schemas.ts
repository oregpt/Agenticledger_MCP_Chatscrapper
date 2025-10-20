import { z } from 'zod';

/**
 * Schema definitions for ChatScraper MCP Server tools
 * Following AgenticLedger MCP Server Build Pattern
 */

// ============================================================================
// TELEGRAM SCHEMAS
// ============================================================================

/**
 * Telegram scrape_telegram_channel tool schema
 * Authentication Pattern: Form-Based (api_id:api_hash:phone:session_string)
 */
export const ScrapeTelegramChannelSchema = z.object({
  accessToken: z
    .string()
    .describe('Telegram authentication token in format: api_id:api_hash:phone:session_string'),

  chat: z
    .string()
    .describe('Channel username (@channel), link (https://t.me/...), or numeric ID'),

  limit: z
    .number()
    .min(1)
    .max(1000)
    .optional()
    .default(100)
    .describe('Maximum number of messages to fetch (default: 100, max: 1000)'),

  minDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .describe('Start date in YYYY-MM-DD format (inclusive)'),

  maxDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .describe('End date in YYYY-MM-DD format (inclusive)'),

  keywords: z
    .string()
    .optional()
    .describe('Comma-separated keywords to filter messages (case-insensitive)'),

  users: z
    .string()
    .optional()
    .describe('Comma-separated usernames (without @) or numeric IDs to filter by sender'),

  onlyMedia: z
    .boolean()
    .optional()
    .default(false)
    .describe('Only return messages containing media (photos, videos, documents)'),

  onlyText: z
    .boolean()
    .optional()
    .default(false)
    .describe('Only return messages without media'),

  reverse: z
    .boolean()
    .optional()
    .default(false)
    .describe('Return messages in chronological order (oldest first)')
});

export type ScrapeTelegramChannelInput = z.infer<typeof ScrapeTelegramChannelSchema>;

/**
 * Telegram list_telegram_channels tool schema
 */
export const ListTelegramChannelsSchema = z.object({
  accessToken: z
    .string()
    .describe('Telegram authentication token in format: api_id:api_hash:phone:session_string')
});

export type ListTelegramChannelsInput = z.infer<typeof ListTelegramChannelsSchema>;

// ============================================================================
// SLACK SCHEMAS
// ============================================================================

/**
 * Slack scrape_slack_channel tool schema
 * Authentication Pattern: OAuth (Direct token)
 */
export const ScrapeSlackChannelSchema = z.object({
  accessToken: z
    .string()
    .describe('Slack OAuth token (xoxb-... for bot or xoxp-... for user)'),

  channel: z
    .string()
    .describe('Channel name (#general) or channel ID (C0123456789)'),

  limit: z
    .number()
    .min(1)
    .max(1000)
    .optional()
    .default(100)
    .describe('Maximum number of messages to fetch (default: 100, max: 1000)'),

  minDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .describe('Start date in YYYY-MM-DD format (inclusive)'),

  maxDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .describe('End date in YYYY-MM-DD format (inclusive)'),

  keywords: z
    .string()
    .optional()
    .describe('Comma-separated keywords to filter messages (case-insensitive)'),

  users: z
    .string()
    .optional()
    .describe('Comma-separated user IDs or display names to filter by sender'),

  onlyMedia: z
    .boolean()
    .optional()
    .default(false)
    .describe('Only return messages containing files or attachments'),

  onlyText: z
    .boolean()
    .optional()
    .default(false)
    .describe('Only return messages without files or attachments'),

  includeThreads: z
    .boolean()
    .optional()
    .default(false)
    .describe('Include thread replies in the results')
});

export type ScrapeSlackChannelInput = z.infer<typeof ScrapeSlackChannelSchema>;

/**
 * Slack list_slack_channels tool schema
 */
export const ListSlackChannelsSchema = z.object({
  accessToken: z
    .string()
    .describe('Slack OAuth token (xoxb-... for bot or xoxp-... for user)'),

  includePrivate: z
    .boolean()
    .optional()
    .default(false)
    .describe('Include private channels (requires appropriate scopes)')
});

export type ListSlackChannelsInput = z.infer<typeof ListSlackChannelsSchema>;

// ============================================================================
// RESPONSE TYPES
// ============================================================================

/**
 * Standard success response format
 */
export interface SuccessResponse<T> {
  success: true;
  data: T;
}

/**
 * Standard error response format
 */
export interface ErrorResponse {
  success: false;
  error: string;
  retryAfter?: number; // For rate limit errors
}

/**
 * Telegram message structure
 */
export interface TelegramMessage {
  id: number;
  date: string; // ISO 8601
  text: string;
  sender: string | null;
  senderId: number | null;
  mediaType: string | null;
  mediaUrl: string | null;
  mediaSize?: number;
  fileName?: string;
  reactions?: Record<string, number>;
  views?: number;
  forwards?: number;
  isForwarded?: boolean;
  forwardFrom?: string;
}

/**
 * Telegram scrape response data
 */
export interface TelegramScrapeData {
  channel: string;
  totalMessages: number;
  messages: TelegramMessage[];
  metadata: {
    chatTitle: string;
    chatType: 'channel' | 'group' | 'chat';
    totalParticipants?: number;
    exportedAt: string; // ISO 8601
  };
}

/**
 * Telegram channel info
 */
export interface TelegramChannel {
  id: number;
  title: string;
  username: string | null;
  type: 'channel' | 'group' | 'chat';
  participants?: number;
  isPublic: boolean;
  description?: string;
}

/**
 * Telegram channels list response data
 */
export interface TelegramChannelsData {
  channels: TelegramChannel[];
  totalCount: number;
}

/**
 * Slack message structure
 */
export interface SlackMessage {
  ts: string; // Slack timestamp
  date: string; // ISO 8601
  text: string;
  user: string;
  userName: string | null;
  userRealName?: string;
  files?: Array<{
    id: string;
    name: string;
    mimetype: string;
    size: number;
    url: string;
  }>;
  reactions?: Array<{
    name: string;
    count: number;
    users: string[];
  }>;
  threadTs?: string;
  replyCount?: number;
  isThreadReply?: boolean;
}

/**
 * Slack scrape response data
 */
export interface SlackScrapeData {
  channel: string;
  totalMessages: number;
  messages: SlackMessage[];
  metadata: {
    channelName: string;
    channelId: string;
    workspace: string;
    exportedAt: string; // ISO 8601
  };
}

/**
 * Slack channel info
 */
export interface SlackChannel {
  id: string;
  name: string;
  isPrivate: boolean;
  memberCount?: number;
  topic?: string;
  purpose?: string;
  created: number;
}

/**
 * Slack channels list response data
 */
export interface SlackChannelsData {
  channels: SlackChannel[];
  totalCount: number;
}

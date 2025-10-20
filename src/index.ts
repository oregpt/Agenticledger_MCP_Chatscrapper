#!/usr/bin/env node

/**
 * ChatScraper MCP Server
 * Scrape Telegram and Slack channels for AI agents
 *
 * Following AgenticLedger Platform MCP Server Build Pattern v1.0.0
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema
} from '@modelcontextprotocol/sdk/types.js';
import { zodToJsonSchema } from 'zod-to-json-schema';

// Tool implementations
import { scrapeTelegramChannel, listTelegramChannels } from './tools/telegram.js';
import { scrapeSlackChannel, listSlackChannels } from './tools/slack.js';

// Schemas for tool registration
import {
  ScrapeTelegramChannelSchema,
  ListTelegramChannelsSchema,
  ScrapeSlackChannelSchema,
  ListSlackChannelsSchema
} from './tools/schemas.js';

/**
 * ChatScraper MCP Server
 */
class ChatScraperServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: 'chatscraper-mcp',
        version: '1.0.0'
      },
      {
        capabilities: {
          tools: {}
        }
      }
    );

    this.setupToolHandlers();
    this.setupErrorHandling();
  }

  /**
   * Register tool handlers
   */
  private setupToolHandlers(): void {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        // Telegram tools
        {
          name: 'scrape_telegram_channel',
          description:
            'Scrape messages from a Telegram channel or group. Supports filtering by date range, keywords, users, and media type. Returns structured message data with metadata.',
          inputSchema: zodToJsonSchema(ScrapeTelegramChannelSchema)
        },
        {
          name: 'list_telegram_channels',
          description:
            'List all Telegram channels and groups accessible to the authenticated user. Returns channel names, IDs, types, and participant counts.',
          inputSchema: zodToJsonSchema(ListTelegramChannelsSchema)
        },

        // Slack tools
        {
          name: 'scrape_slack_channel',
          description:
            'Scrape messages from a Slack channel. Supports filtering by date range, keywords, users, media type, and optionally includes thread replies. Returns structured message data with user info and files.',
          inputSchema: zodToJsonSchema(ScrapeSlackChannelSchema)
        },
        {
          name: 'list_slack_channels',
          description:
            'List all Slack channels accessible to the bot. Optionally includes private channels. Returns channel names, IDs, member counts, and topics.',
          inputSchema: zodToJsonSchema(ListSlackChannelsSchema)
        }
      ]
    }));

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'scrape_telegram_channel':
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(await scrapeTelegramChannel(args), null, 2)
                }
              ]
            };

          case 'list_telegram_channels':
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(await listTelegramChannels(args), null, 2)
                }
              ]
            };

          case 'scrape_slack_channel':
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(await scrapeSlackChannel(args), null, 2)
                }
              ]
            };

          case 'list_slack_channels':
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(await listSlackChannels(args), null, 2)
                }
              ]
            };

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        // Return error in standard format
        const errorMessage =
          error instanceof Error ? error.message : String(error);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: false,
                  error: errorMessage
                },
                null,
                2
              )
            }
          ],
          isError: true
        };
      }
    });
  }

  /**
   * Setup error handling
   */
  private setupErrorHandling(): void {
    this.server.onerror = (error) => {
      console.error('[MCP Error]', error);
    };

    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  /**
   * Start the server
   */
  async start(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);

    // Log to stderr (stdout is used for MCP protocol)
    console.error('ChatScraper MCP Server running on stdio');
    console.error('Available tools:');
    console.error('  - scrape_telegram_channel');
    console.error('  - list_telegram_channels');
    console.error('  - scrape_slack_channel');
    console.error('  - list_slack_channels');
  }
}

/**
 * Main entry point
 */
async function main() {
  const server = new ChatScraperServer();
  await server.start();
}

// Start server
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

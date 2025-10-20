# ChatScraper MCP Server

**Version:** 1.0.0
**Platform:** AgenticLedger AI Agent Platform
**Status:** Production Ready

## Overview

ChatScraper is an MCP (Model Context Protocol) server that enables AI agents to scrape and analyze messages from Telegram channels/groups and Slack channels. It provides filtered access to chat history with support for date ranges, keyword matching, user filtering, and media detection.

### Use Cases

- **Context Gathering:** AI agents retrieve chat history for context
- **Trend Analysis:** Monitor specific keywords or topics over time
- **Community Insights:** Analyze discussions in public channels
- **Research:** Extract information from chat communities
- **Compliance:** Audit and review team communications

## Authentication Patterns

This MCP server uses two different authentication patterns depending on the platform:

### Telegram - Form-Based Pattern (Composite Token)

**Token Format:**
```
api_id:api_hash:phone:session_string
```

**Example:**
```
123456:abcd1234567890:+1234567890:base64_encoded_session_data
```

**Components:**
- `api_id`: Telegram API ID from https://my.telegram.org
- `api_hash`: Telegram API hash from https://my.telegram.org
- `phone`: Phone number with country code (e.g., +1234567890)
- `session_string`: Base64-encoded session data (generated after login)

**Platform Responsibilities:**
1. Collect `api_id`, `api_hash`, and `phone` from user
2. Handle initial Telegram login flow (SMS code + optional 2FA)
3. Generate session string using Telethon's `StringSession`
4. Create composite token and store securely
5. Provide token to MCP server

**MCP Server Responsibilities:**
- Parse composite token
- Recreate Telethon session from session string
- Make authenticated API calls
- No re-authentication needed per request

---

### Slack - OAuth Pattern (Direct Token)

**Token Format:**
```
xoxb-1234567890-ABCDEFGHIJ  (Bot token)
xoxp-1234567890-ABCDEFGHIJ  (User token)
```

**Required OAuth Scopes:**
- `channels:history` - Read public channel messages
- `groups:history` - Read private channel messages
- `channels:read` - List public channels
- `groups:read` - List private channels
- `files:read` - Access file metadata and URLs
- `users:read` - Get user information

**Platform Responsibilities:**
1. Handle Slack OAuth flow
2. Store token securely
3. Pass token directly to MCP server

**MCP Server Responsibilities:**
- Use token with @slack/web-api SDK
- Make authenticated API calls
- Handle rate limiting and errors

---

## Available Tools

### 1. scrape_telegram_channel

**Description:** Export messages from a Telegram channel or group with advanced filtering options.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `accessToken` | string | Yes | Telegram composite token (api_id:api_hash:phone:session_string) |
| `chat` | string | Yes | Channel username (@channel), link (https://t.me/...), or numeric ID |
| `limit` | number | No | Max messages (1-1000, default: 100) |
| `minDate` | string | No | Start date YYYY-MM-DD (inclusive) |
| `maxDate` | string | No | End date YYYY-MM-DD (inclusive) |
| `keywords` | string | No | Comma-separated keywords (case-insensitive) |
| `users` | string | No | Comma-separated usernames or IDs |
| `onlyMedia` | boolean | No | Only messages with media (default: false) |
| `onlyText` | boolean | No | Only text messages (default: false) |
| `reverse` | boolean | No | Oldest first (default: false/newest first) |

**Example Request:**
```json
{
  "accessToken": "123456:hash:+1234567890:session",
  "chat": "@publicchannel",
  "limit": 50,
  "minDate": "2025-01-01",
  "maxDate": "2025-01-20",
  "keywords": "blockchain,crypto",
  "reverse": true
}
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "channel": "@publicchannel",
    "totalMessages": 50,
    "messages": [
      {
        "id": 123,
        "date": "2025-01-15T10:30:00Z",
        "text": "Blockchain technology is revolutionary...",
        "sender": "username",
        "senderId": 456789,
        "mediaType": null,
        "mediaUrl": null,
        "reactions": { "👍": 5, "🔥": 3 },
        "views": 1234,
        "forwards": 10
      }
    ],
    "metadata": {
      "chatTitle": "Public Channel",
      "chatType": "channel",
      "totalParticipants": 5000,
      "exportedAt": "2025-01-20T12:00:00Z"
    }
  }
}
```

---

### 2. list_telegram_channels

**Description:** List all Telegram channels and groups accessible to the authenticated user.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `accessToken` | string | Yes | Telegram composite token |

**Example Request:**
```json
{
  "accessToken": "123456:hash:+1234567890:session"
}
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "channels": [
      {
        "id": -1001234567890,
        "title": "Public Channel",
        "username": "@publicchannel",
        "type": "channel",
        "participants": 5000,
        "isPublic": true,
        "description": "Channel description"
      },
      {
        "id": -1009876543210,
        "title": "Private Group",
        "username": null,
        "type": "group",
        "participants": 250,
        "isPublic": false
      }
    ],
    "totalCount": 2
  }
}
```

---

### 3. scrape_slack_channel

**Description:** Export messages from a Slack channel with filtering and optional thread support.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `accessToken` | string | Yes | Slack OAuth token (xoxb-... or xoxp-...) |
| `channel` | string | Yes | Channel name (#general) or ID (C0123456789) |
| `limit` | number | No | Max messages (1-1000, default: 100) |
| `minDate` | string | No | Start date YYYY-MM-DD (inclusive) |
| `maxDate` | string | No | End date YYYY-MM-DD (inclusive) |
| `keywords` | string | No | Comma-separated keywords (case-insensitive) |
| `users` | string | No | Comma-separated user IDs or names |
| `onlyMedia` | boolean | No | Only messages with files (default: false) |
| `onlyText` | boolean | No | Only text messages (default: false) |
| `includeThreads` | boolean | No | Include thread replies (default: false) |

**Example Request:**
```json
{
  "accessToken": "xoxb-1234567890-ABCDEFGHIJ",
  "channel": "#general",
  "limit": 30,
  "minDate": "2025-01-10",
  "keywords": "deployment,production",
  "includeThreads": true
}
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "channel": "#general",
    "totalMessages": 30,
    "messages": [
      {
        "ts": "1705752000.123456",
        "date": "2025-01-20T10:00:00Z",
        "text": "Production deployment completed successfully!",
        "user": "U012345",
        "userName": "john.doe",
        "userRealName": "John Doe",
        "files": [
          {
            "id": "F0123456",
            "name": "deployment.log",
            "mimetype": "text/plain",
            "size": 2048,
            "url": "https://files.slack.com/..."
          }
        ],
        "reactions": [
          {
            "name": "tada",
            "count": 5,
            "users": ["U012345", "U067890"]
          }
        ],
        "threadTs": "1705752000.123456",
        "replyCount": 3
      }
    ],
    "metadata": {
      "channelName": "general",
      "channelId": "C0123456789",
      "workspace": "MyWorkspace",
      "exportedAt": "2025-01-20T12:00:00Z"
    }
  }
}
```

---

### 4. list_slack_channels

**Description:** List all Slack channels accessible to the bot or user token.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `accessToken` | string | Yes | Slack OAuth token |
| `includePrivate` | boolean | No | Include private channels (default: false) |

**Example Request:**
```json
{
  "accessToken": "xoxb-1234567890-ABCDEFGHIJ",
  "includePrivate": true
}
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "channels": [
      {
        "id": "C0123456789",
        "name": "general",
        "isPrivate": false,
        "memberCount": 50,
        "topic": "General discussion",
        "purpose": "Company-wide announcements",
        "created": 1609459200
      },
      {
        "id": "G9876543210",
        "name": "engineering",
        "isPrivate": true,
        "memberCount": 15,
        "topic": "Engineering team chat",
        "created": 1640995200
      }
    ],
    "totalCount": 2
  }
}
```

---

## Installation

### Prerequisites
- Node.js 18.0.0 or higher
- npm or yarn

### Install Dependencies

```bash
cd chatscraper
npm install
```

### Build

```bash
npm run build
```

This compiles TypeScript to JavaScript in the `dist/` directory.

---

## Testing

### Run All Tests

```bash
npm test
```

### Run Integration Tests Only

```bash
npm run test:integration
```

**Note:** Integration tests require valid API credentials. See `tests/` directory for test setup instructions.

---

## Development

### Watch Mode

```bash
npm run dev
```

This runs TypeScript in watch mode, automatically recompiling on file changes.

### Linting

```bash
npm run lint
```

---

## Error Handling

All tools return standardized response formats:

**Success Response:**
```json
{
  "success": true,
  "data": { ... }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Descriptive error message",
  "retryAfter": 60  // Optional, for rate limit errors
}
```

### Common Errors

**Telegram:**
- `Invalid or expired session` - Re-authenticate required
- `Rate limited by Telegram` - Wait and retry (retryAfter provided)
- `Channel not found` - Check channel access/permissions
- `Invalid Telegram token format` - Check token structure

**Slack:**
- `Invalid Slack token` - Check token validity
- `Token expired or revoked` - Re-authenticate required
- `Rate limited by Slack` - Wait and retry (retryAfter provided)
- `Channel not found` - Ensure bot is channel member
- `Missing permissions` - Add required OAuth scopes

---

## Rate Limits

### Telegram
- Varies by account type (regular vs. premium)
- FloodWaitError returned with wait time
- Automatic handling with clear error messages

### Slack
- **Free tier:** ~1 request per minute per method
- **Pro tier:** ~100 requests per minute
- **429 responses:** Include retry-after header
- Errors include `retryAfter` field

---

## Platform Integration Notes

### Session Management (Telegram)

The platform must handle Telegram's interactive login flow:

1. Collect `api_id`, `api_hash`, `phone` from user
2. Initiate Telethon session
3. Request SMS code from user
4. Optionally request 2FA password
5. Generate session string: `client.session.save()`
6. Create composite token: `${apiId}:${apiHash}:${phone}:${sessionString}`
7. Store token securely

**Example Platform-Side Code:**
```typescript
import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions';

const stringSession = new StringSession(''); // Empty for new login
const client = new TelegramClient(stringSession, apiId, apiHash, {});

await client.start({
  phoneNumber: async () => userPhone,
  password: async () => user2FA,  // Optional
  phoneCode: async () => smsCode,
  onError: (err) => console.error(err)
});

const sessionString = client.session.save();
const compositeToken = `${apiId}:${apiHash}:${phone}:${sessionString}`;
// Store compositeToken for user
```

### OAuth Flow (Slack)

Standard Slack OAuth 2.0 flow. Platform handles:

1. Redirect user to Slack OAuth URL
2. Receive authorization code
3. Exchange code for access token
4. Store token securely
5. Pass token to MCP server

---

## Performance

**Typical Response Times:**
- Telegram scrape (100 messages): 1-3 seconds
- Slack scrape (100 messages): 2-4 seconds
- List channels: <1 second

**Limitations:**
- Max 1000 messages per request (prevents timeout)
- Pagination not implemented (call multiple times with date ranges)
- Media download not supported (URLs provided only)

---

## Security Considerations

- **Never log credentials** - Tokens excluded from all logs
- **Validate all inputs** - Zod schemas enforce types
- **Session isolation** - Each request creates new scraper instance
- **Automatic cleanup** - Telegram clients disconnected after use
- **Token validation** - Format checked before API calls

---

## Known Limitations

1. **No Media Download:** Media URLs provided, not file content
2. **No Pagination Cursor:** Use date ranges for large exports
3. **Thread Limits:** Slack threads limited to avoid deep recursion
4. **Public Access Only (Telegram):** User must have channel access
5. **Bot Membership Required (Slack):** Bot must be in channel

---

## Future Enhancements

- [ ] Media file download support
- [ ] Cursor-based pagination
- [ ] Discord integration
- [ ] Export to different formats (CSV, Markdown)
- [ ] Advanced filtering (regex, sentiment)
- [ ] Streaming large result sets
- [ ] Caching for frequently accessed channels

---

## Support

**Issues:** File issues on GitHub repository

**Questions:** Contact AgenticLedger support

---

## License

MIT License

---

## Acknowledgments

- Built for [AgenticLedger](https://agenticledger.com) AI Agent Platform
- Uses [Telegram SDK](https://github.com/gram-js/gramjs) for Telegram integration
- Uses [@slack/web-api](https://github.com/slackapi/node-slack-sdk) for Slack integration
- Follows [MCP Protocol](https://modelcontextprotocol.org) specification

---

**Ready for AgenticLedger Platform Integration** 🚀

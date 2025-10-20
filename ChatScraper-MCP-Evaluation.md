# Chat Scraper MCP Server - Evaluation & Plan
## Converting chattools-exporter to AgenticLedger MCP Server

**Created:** 2025-01-20
**Status:** Planning Phase
**Target:** AgenticLedger Platform Integration

---

## 📋 What We're Building

**Goal:** Convert the existing `chattools-exporter` Python tool into a TypeScript MCP server that can scrape Telegram and Slack channels through AI agents.

**Existing Tool:**
- Python-based with Tkinter/React frontends
- Exports Telegram & Slack messages to JSONL/CSV
- Supports filtering, media download, Notion integration

**New MCP Server:**
- TypeScript-based MCP server (no UI)
- AI agents can call scraping tools
- Returns data in standardized JSON format
- Platform handles authentication and orchestration

---

## ✅ Feasibility Assessment

### **Is This a Good Fit for MCP?**

**YES!** This is an excellent candidate for MCP because:

✅ **Clear API Operations**
- Scrape channel messages
- Filter by date/keywords/users
- Download media files
- Export in structured format

✅ **Authentication Patterns Supported**
- **Telegram:** API credentials (api_id + api_hash + phone) - **Form-Based Pattern**
- **Slack:** OAuth token or Bot token - **OAuth/API Key Pattern**

✅ **Stateless Operations**
- Each scrape is independent
- No long-running sessions needed (can handle session in backend)
- Results returned immediately

✅ **Value for AI Agents**
- Agents can gather context from chat history
- Analyze team conversations
- Extract insights from communities
- Monitor specific topics/keywords

---

## 🎯 Core Functionality Mapping

### **Existing Features → MCP Tools**

| Current Feature | MCP Tool | Priority |
|----------------|----------|----------|
| Telegram message export | `scrape_telegram_channel` | ⭐⭐⭐ HIGH |
| Slack message export | `scrape_slack_channel` | ⭐⭐⭐ HIGH |
| Filter by date range | Query parameters | ⭐⭐⭐ HIGH |
| Filter by keywords | Query parameters | ⭐⭐ MEDIUM |
| Filter by users | Query parameters | ⭐⭐ MEDIUM |
| Media download | Query parameter | ⭐ LOW |
| Resume from last | Query parameter | ⭐ LOW |
| Notion export | Separate tool | ⏸️ FUTURE |

---

## 🔧 Proposed MCP Tools

### **Tool 1: scrape_telegram_channel** ⭐⭐⭐

**Description:** Export messages from a Telegram channel or group

**Authentication Pattern:** Form-Based (Composite Token)
```
accessToken: "api_id:api_hash:phone:session_string"
```

**Parameters:**
```typescript
{
  accessToken: string;     // Format: "123456:abcd1234:+1234567890:session_base64"
  chat: string;            // Channel username (@channel), link (https://t.me/...), or ID
  limit?: number;          // Max messages to fetch (default: 100, max: 1000)
  minDate?: string;        // Start date YYYY-MM-DD
  maxDate?: string;        // End date YYYY-MM-DD
  keywords?: string;       // Comma-separated keywords
  users?: string;          // Comma-separated usernames or IDs
  onlyMedia?: boolean;     // Only messages with media
  onlyText?: boolean;      // Only text messages
  reverse?: boolean;       // Oldest first (default: newest first)
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "channel": "@channel_name",
    "totalMessages": 150,
    "messages": [
      {
        "id": 123,
        "date": "2025-01-20T10:30:00Z",
        "text": "Message content",
        "sender": "username",
        "senderId": 456789,
        "mediaType": "photo",
        "mediaUrl": "https://...",
        "reactions": {...},
        "views": 1234
      }
    ],
    "metadata": {
      "chatTitle": "Channel Name",
      "chatType": "channel",
      "totalParticipants": 5000,
      "exportedAt": "2025-01-20T12:00:00Z"
    }
  }
}
```

---

### **Tool 2: scrape_slack_channel** ⭐⭐⭐

**Description:** Export messages from a Slack channel

**Authentication Pattern:** OAuth (Direct Token)
```
accessToken: "xoxb-..." or "xoxp-..."
```

**Parameters:**
```typescript
{
  accessToken: string;     // Slack OAuth token (bot or user)
  channel: string;         // Channel name (#general) or ID (C0123...)
  limit?: number;          // Max messages (default: 100, max: 1000)
  minDate?: string;        // Start date YYYY-MM-DD
  maxDate?: string;        // End date YYYY-MM-DD
  keywords?: string;       // Comma-separated keywords
  users?: string;          // Comma-separated user IDs or names
  onlyMedia?: boolean;     // Only messages with files
  onlyText?: boolean;      // Only text messages
  includeThreads?: boolean; // Include thread replies (default: false)
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "channel": "#general",
    "totalMessages": 200,
    "messages": [
      {
        "ts": "1705752000.123456",
        "date": "2025-01-20T10:30:00Z",
        "text": "Message content",
        "user": "U012345",
        "userName": "John Doe",
        "files": [...],
        "reactions": [...],
        "threadTs": "1705752000.123456",
        "replyCount": 5
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

### **Tool 3: list_telegram_channels** ⭐⭐

**Description:** List all accessible Telegram channels/groups for the authenticated user

**Parameters:**
```typescript
{
  accessToken: string;     // Format: "api_id:api_hash:phone:session_string"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "channels": [
      {
        "id": -1001234567890,
        "title": "My Channel",
        "username": "@mychannel",
        "type": "channel",
        "participants": 1000,
        "isPublic": true
      }
    ],
    "totalCount": 25
  }
}
```

---

### **Tool 4: list_slack_channels** ⭐⭐

**Description:** List all accessible Slack channels

**Parameters:**
```typescript
{
  accessToken: string;     // Slack OAuth token
  includePrivate?: boolean; // Include private channels (default: false)
}
```

**Response:**
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
        "topic": "General discussion"
      }
    ],
    "totalCount": 15
  }
}
```

---

## 🔐 Authentication Patterns

### **Telegram - Form-Based Pattern**

**Challenge:** Telegram requires:
1. API credentials (api_id, api_hash)
2. Phone number
3. Login code (sent via SMS/Telegram)
4. 2FA password (optional)
5. Session persistence

**Solution:** Composite token with pre-authenticated session

**Token Format:**
```
api_id:api_hash:phone:session_string
```

**Example:**
```
123456:abcd1234567890:+1234567890:base64_encoded_session_data
```

**Platform Responsibility:**
- Collect api_id, api_hash, phone from user
- Handle initial login flow (code + 2FA)
- Generate and store session string
- Provide composite token to MCP server

**MCP Server Responsibility:**
- Parse composite token
- Recreate Telethon session from string
- Make API calls
- Return results

**Implementation Notes:**
- Use Telethon's `StringSession` for serializable sessions
- Session string persists login across calls
- No re-authentication needed per request

---

### **Slack - OAuth Pattern**

**Challenge:** Slack uses OAuth tokens

**Solution:** Direct token pass-through

**Token Format:**
```
xoxb-1234567890-ABCDEFGHIJ  (Bot token)
xoxp-1234567890-ABCDEFGHIJ  (User token)
```

**Platform Responsibility:**
- OAuth flow to get token
- Store token securely
- Pass to MCP server

**MCP Server Responsibility:**
- Use token with slack_sdk
- Make API calls
- Return results

**Required Scopes:**
- `channels:history` - Read public channel messages
- `groups:history` - Read private channel messages
- `channels:read` - List channels
- `groups:read` - List private channels
- `files:read` - Access file metadata/URLs
- `users:read` - Get user information

---

## 🏗️ Technical Architecture

### **Stack:**

**Language:** TypeScript
**MCP SDK:** `@modelcontextprotocol/sdk`
**Telegram Client:** `telegram` (npm package for Node.js)
**Slack Client:** `@slack/web-api`
**Validation:** `zod`
**Build:** `typescript`, `esbuild` or `tsc`

### **Project Structure:**

```
chat-scraper-mcp/
├── src/
│   ├── index.ts                 # Main MCP server
│   ├── tools/
│   │   ├── telegram.ts          # Telegram scraping tools
│   │   ├── slack.ts             # Slack scraping tools
│   │   └── schemas.ts           # Zod schemas
│   ├── clients/
│   │   ├── telegram-client.ts   # Telegram API wrapper
│   │   └── slack-client.ts      # Slack API wrapper
│   └── utils/
│       ├── auth.ts              # Token parsing
│       ├── filters.ts           # Message filtering logic
│       └── formatters.ts        # Response formatters
├── tests/
│   ├── telegram.test.ts
│   ├── slack.test.ts
│   └── integration.test.ts
├── package.json
├── tsconfig.json
├── README.md
├── PLATFORM_INTEGRATION_REPORT.md
└── .gitignore
```

---

## 📊 Implementation Phases

### **Phase 1: Core Setup** (Week 1)

**Goal:** Basic MCP server skeleton

- [ ] Initialize TypeScript project
- [ ] Install MCP SDK and dependencies
- [ ] Set up build pipeline
- [ ] Create basic server structure
- [ ] Define Zod schemas for all tools

**Deliverables:**
- `package.json` with all dependencies
- TypeScript configuration
- Basic server that starts without errors

---

### **Phase 2: Telegram Integration** (Week 2-3)

**Goal:** Working Telegram scraping

- [ ] Implement `telegram-client.ts` wrapper
- [ ] Handle session management (StringSession)
- [ ] Implement `scrape_telegram_channel` tool
- [ ] Implement `list_telegram_channels` tool
- [ ] Add message filtering (date, keywords, users)
- [ ] Add error handling (rate limits, auth errors)
- [ ] Test with real Telegram account

**Deliverables:**
- Working Telegram tools
- Test results with real API calls
- Documentation of token format

---

### **Phase 3: Slack Integration** (Week 4)

**Goal:** Working Slack scraping

- [ ] Implement `slack-client.ts` wrapper
- [ ] Implement `scrape_slack_channel` tool
- [ ] Implement `list_slack_channels` tool
- [ ] Add message filtering (date, keywords, users)
- [ ] Handle pagination (Slack cursor-based)
- [ ] Add error handling
- [ ] Test with real Slack workspace

**Deliverables:**
- Working Slack tools
- Test results with real API calls
- Documentation of token format and scopes

---

### **Phase 4: Testing & Documentation** (Week 5)

**Goal:** Production-ready submission

- [ ] Write comprehensive tests
- [ ] Create `PLATFORM_INTEGRATION_REPORT.md`
- [ ] Document all real API test results
- [ ] Create usage examples
- [ ] Performance testing
- [ ] Error scenario testing
- [ ] Write complete README

**Deliverables:**
- Complete test suite
- PLATFORM_INTEGRATION_REPORT.md with real results
- README with setup instructions
- Example credentials format

---

### **Phase 5: Optional Enhancements** (Future)

- [ ] Media download support (return URLs vs. download)
- [ ] Export to different formats (CSV option)
- [ ] Thread support for Slack
- [ ] Advanced filtering (regex, sentiment)
- [ ] Discord integration
- [ ] Rate limit handling with retries

---

## ⚠️ Challenges & Solutions

### **Challenge 1: Telegram Session Management**

**Problem:** Telegram requires interactive login (SMS code, 2FA)

**Solution:**
- Platform handles initial login via UI
- Generate `StringSession` after successful login
- Serialize session to base64 string
- Include in composite token
- MCP server recreates session from string

**Code Example:**
```typescript
// Platform side (during user setup)
const client = new TelegramClient(stringSession, apiId, apiHash, {});
await client.start({
  phoneNumber: async () => userPhone,
  password: async () => user2FA,
  phoneCode: async () => smsCode,
});
const sessionString = client.session.save();
// Store: `${apiId}:${apiHash}:${phone}:${sessionString}`

// MCP server side
const [apiId, apiHash, phone, sessionString] = accessToken.split(':');
const session = new StringSession(sessionString);
const client = new TelegramClient(session, Number(apiId), apiHash, {});
await client.connect();
// Client is now authenticated!
```

---

### **Challenge 2: Rate Limiting**

**Problem:** Both APIs have rate limits
- Telegram: FloodWaitError
- Slack: 429 responses

**Solution:**
- Implement exponential backoff
- Return partial results if limit hit
- Include rate limit info in response
- Document limits in README

**Code Example:**
```typescript
try {
  const messages = await fetchMessages();
  return { success: true, data: messages };
} catch (error) {
  if (error.name === 'FloodWaitError') {
    return {
      success: false,
      error: `Rate limited. Please wait ${error.seconds} seconds.`,
      retryAfter: error.seconds
    };
  }
  throw error;
}
```

---

### **Challenge 3: Large Message Sets**

**Problem:** Channels may have millions of messages

**Solution:**
- Enforce `limit` parameter (max 1000 per call)
- Support pagination via `minId` / `cursor`
- Return metadata about total available
- Let agent make multiple calls if needed

**Response:**
```json
{
  "success": true,
  "data": {
    "messages": [...],  // Max 1000
    "hasMore": true,
    "nextCursor": "xyz",
    "totalEstimate": 50000
  }
}
```

---

### **Challenge 4: Media Files**

**Problem:** Media can be large, slow to download

**Solution:**
- **Phase 1:** Return media URLs only (no download)
- **Future:** Add optional download parameter
- Include media metadata (type, size, filename)

**Response:**
```json
{
  "mediaType": "photo",
  "mediaUrl": "https://...",
  "mediaSize": 1024000,
  "fileName": "image.jpg",
  "thumbUrl": "https://..."  // If available
}
```

---

## 📝 Documentation Requirements

### **README.md Contents:**

```markdown
# Chat Scraper MCP Server

## Overview
MCP server for scraping Telegram and Slack channels. Enables AI agents to retrieve chat history with filtering capabilities.

## Authentication Patterns

### Telegram (Form-Based)
Token format: `api_id:api_hash:phone:session_string`

Setup:
1. Get API credentials from https://my.telegram.org
2. Platform handles login flow
3. Session string generated and stored
4. Composite token provided to MCP server

### Slack (OAuth)
Token format: `xoxb-...` (bot) or `xoxp-...` (user)

Required scopes:
- channels:history
- groups:history
- channels:read
- groups:read
- files:read
- users:read

## Available Tools

### scrape_telegram_channel
[Full documentation...]

### scrape_slack_channel
[Full documentation...]

## Installation
npm install
npm run build

## Testing
npm test

## Rate Limits
- Telegram: Varies by account type, FloodWaitError handling included
- Slack: Tier-based (Free: 1/min, Pro: 100/min), automatic retry
```

---

### **PLATFORM_INTEGRATION_REPORT.md Contents:**

```markdown
# Platform Integration Report - Chat Scraper MCP Server

## Testing Summary
- Date: 2025-01-20
- All tools tested with real API credentials
- 100% success rate on valid requests
- Error handling verified

## Test Results

### Tool: scrape_telegram_channel
**Test 1: Public Channel**
Request:
{
  "accessToken": "123456:hash:+1234567890:session",
  "chat": "@durov",
  "limit": 10
}

Response: (200 OK)
{
  "success": true,
  "data": {
    "messages": [...]  // Real messages
  }
}

Time: 1.2s

[Continue with all tools and scenarios...]
```

---

## 💰 Cost/Benefit Analysis

### **Development Effort:**

**Estimated Time:** 4-5 weeks

| Phase | Hours | Complexity |
|-------|-------|-----------|
| Setup | 8 | Low |
| Telegram | 40 | High (session mgmt) |
| Slack | 20 | Medium |
| Testing | 24 | Medium |
| Docs | 8 | Low |
| **Total** | **100** | **Medium-High** |

---

### **Platform Value:**

**Benefits:**
✅ AI agents can analyze chat history
✅ Extract insights from communities
✅ Monitor keywords/topics
✅ Gather context for conversations
✅ Research trending discussions
✅ Compliance/audit use cases

**Target Users:**
- Community managers
- Market researchers
- Compliance teams
- Social media analysts
- AI agent developers

**Competitive Advantage:**
- No other MCP server does chat scraping
- Unique value proposition
- High demand for chat analysis

---

## ✅ Recommendation: BUILD IT!

### **Reasons to Proceed:**

1. **Clear Use Case** - Chat scraping is valuable for AI agents
2. **Feasible** - Authentication challenges are solvable
3. **Differentiator** - No existing chat scraper MCP servers
4. **Existing Code** - Can reference Python implementation
5. **Platform Fit** - Aligns with MCP architecture

### **Success Criteria:**

- [ ] 4 working tools (2 Telegram + 2 Slack)
- [ ] Real API tests documented
- [ ] Performance <2s per request
- [ ] Error handling for common scenarios
- [ ] Complete documentation
- [ ] Platform integration report

---

## 🚀 Next Steps

1. **Set up project structure**
   ```bash
   mkdir chat-scraper-mcp
   cd chat-scraper-mcp
   npm init -y
   npm install @modelcontextprotocol/sdk zod telegram @slack/web-api
   npm install -D typescript @types/node
   ```

2. **Create basic server skeleton**
   - Define Zod schemas
   - Set up MCP server boilerplate
   - Create empty tool handlers

3. **Implement Telegram tools**
   - Start with `list_telegram_channels` (simpler)
   - Then `scrape_telegram_channel`
   - Test with real account

4. **Implement Slack tools**
   - Follow same pattern
   - Test with real workspace

5. **Testing & documentation**
   - Write PLATFORM_INTEGRATION_REPORT.md
   - Document all API calls
   - Create README

---

## 📞 Questions for Platform Team

Before starting, clarify:

1. **Session Management:** Can platform handle Telegram login UI flow?
2. **Token Storage:** How long are composite tokens stored?
3. **Rate Limiting:** Should MCP server implement retries or return errors?
4. **Media Files:** URLs only or download support needed?
5. **Pagination:** Should tools support pagination or enforce single-call limits?

---

**Status:** Ready to build
**Next Action:** Set up project structure and begin Phase 1
**Timeline:** 4-5 weeks to production-ready MCP server

---

*This is a solid MCP server opportunity with clear value and feasible implementation!* 🚀

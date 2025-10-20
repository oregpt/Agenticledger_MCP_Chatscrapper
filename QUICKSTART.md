# ChatScraper MCP Server - Quick Start Guide

Get started with ChatScraper in 5 minutes!

---

## Prerequisites

- Node.js 18.0.0 or higher
- npm or yarn
- API credentials for Telegram and/or Slack

---

## Installation

### 1. Install Dependencies

```bash
cd C:\Users\oreph\Documents\AgenticLedger\Custom MCP SERVERS\chatscraper
npm install
```

### 2. Build the Project

```bash
npm run build
```

You should see output indicating TypeScript compilation succeeded and `dist/` directory created.

---

## Getting API Credentials

### Telegram Setup

1. **Get API Credentials:**
   - Visit https://my.telegram.org
   - Log in with your phone number
   - Go to "API development tools"
   - Create a new application
   - Save your `api_id` and `api_hash`

2. **Generate Session String:**

   You need to run a one-time script on your platform to generate the session string.

   ```typescript
   import { TelegramClient } from 'telegram';
   import { StringSession } from 'telegram/sessions';

   const apiId = YOUR_API_ID;
   const apiHash = 'YOUR_API_HASH';
   const phone = '+YOUR_PHONE';

   const stringSession = new StringSession(''); // Empty for new login
   const client = new TelegramClient(stringSession, apiId, apiHash, {});

   await client.start({
     phoneNumber: async () => phone,
     password: async () => promptFor2FA(),  // Only if 2FA enabled
     phoneCode: async () => promptForSMSCode(),
     onError: (err) => console.error(err)
   });

   const sessionString = client.session.save();
   console.log('Session String:', sessionString);
   // Save this securely!
   ```

3. **Create Composite Token:**

   Format: `api_id:api_hash:phone:session_string`

   Example: `123456:abc123def456:+1234567890:YOUR_SESSION_STRING_HERE`

### Slack Setup

1. **Create Slack App:**
   - Visit https://api.slack.com/apps
   - Click "Create New App" → "From scratch"
   - Name your app and select workspace

2. **Add OAuth Scopes:**
   - Go to "OAuth & Permissions"
   - Add these scopes:
     - `channels:history`
     - `groups:history`
     - `channels:read`
     - `groups:read`
     - `files:read`
     - `users:read`

3. **Install App to Workspace:**
   - Click "Install to Workspace"
   - Authorize the app
   - Copy the "Bot User OAuth Token" (starts with `xoxb-`)

4. **Add Bot to Channels:**
   - Go to each channel you want to scrape
   - Type `/invite @YourBotName`

---

## Quick Test

### Test Telegram

```bash
# Create test credentials file
cp tests/credentials.example.json tests/credentials.json

# Edit tests/credentials.json with your credentials
# Fill in telegram.compositeToken with your token

# Run tests
npm run test:integration
```

### Test Slack

```bash
# Edit tests/credentials.json
# Fill in slack.botToken with your token

# Run tests
npm run test:integration
```

---

## Using with MCP Inspector

The MCP Inspector is a great tool for manually testing your MCP server.

### 1. Install MCP Inspector

```bash
npm install -g @modelcontextprotocol/inspector
```

### 2. Start Inspector

```bash
npx @modelcontextprotocol/inspector node dist/index.js
```

### 3. Test Tools in Browser

The inspector will open at `http://localhost:5173` (or similar).

**Test list_telegram_channels:**
```json
{
  "accessToken": "YOUR_TELEGRAM_COMPOSITE_TOKEN"
}
```

**Test scrape_telegram_channel:**
```json
{
  "accessToken": "YOUR_TELEGRAM_COMPOSITE_TOKEN",
  "chat": "@publicchannel",
  "limit": 10
}
```

**Test list_slack_channels:**
```json
{
  "accessToken": "xoxb-YOUR-SLACK-BOT-TOKEN"
}
```

**Test scrape_slack_channel:**
```json
{
  "accessToken": "xoxb-YOUR-SLACK-BOT-TOKEN",
  "channel": "#general",
  "limit": 10
}
```

---

## Common Issues

### Issue: "Invalid Telegram token format"

**Solution:** Ensure your token is in the format: `api_id:api_hash:phone:session_string`

All four parts are required, separated by colons.

### Issue: "Channel not found" (Telegram)

**Solution:**
- For public channels: Use format `@channelname`
- For private groups: You must be a member
- Try using the numeric channel ID instead

### Issue: "Channel not found" (Slack)

**Solution:**
- Ensure bot is added to channel: `/invite @YourBot`
- Use format `#channelname` or channel ID like `C0123456789`
- Verify bot has required OAuth scopes

### Issue: "Rate limited"

**Solution:**
- Wait the specified time (check `retryAfter` in error response)
- Reduce message limits
- Spread out requests over time

### Issue: "Missing permissions" (Slack)

**Solution:**
- Go to your Slack app settings
- OAuth & Permissions → Scopes
- Ensure all required scopes are added (see Slack Setup above)
- Reinstall app to workspace

---

## Example Use Cases

### 1. Get Recent Messages from Telegram Channel

```json
{
  "accessToken": "YOUR_TOKEN",
  "chat": "@yourchannel",
  "limit": 50,
  "minDate": "2025-01-15",
  "maxDate": "2025-01-20"
}
```

### 2. Find Messages About Specific Topic

```json
{
  "accessToken": "YOUR_TOKEN",
  "chat": "@yourchannel",
  "keywords": "blockchain,crypto,defi",
  "limit": 100
}
```

### 3. Get Media Messages Only

```json
{
  "accessToken": "YOUR_TOKEN",
  "chat": "@yourchannel",
  "onlyMedia": true,
  "limit": 30
}
```

### 4. Scrape Slack with Thread Replies

```json
{
  "accessToken": "xoxb-YOUR-TOKEN",
  "channel": "#engineering",
  "includeThreads": true,
  "limit": 50
}
```

### 5. Filter by Specific Users

```json
{
  "accessToken": "xoxb-YOUR-TOKEN",
  "channel": "#general",
  "users": "U012345,john.doe",
  "limit": 30
}
```

---

## Next Steps

1. **Review Full Documentation:** See [README.md](./README.md) for complete API reference
2. **Run Integration Tests:** Complete testing with `npm run test:integration`
3. **Fill Out Integration Report:** Update [PLATFORM_INTEGRATION_REPORT.md](./PLATFORM_INTEGRATION_REPORT.md)
4. **Deploy to Platform:** Submit to AgenticLedger platform for integration

---

## Support

- **Documentation:** See [README.md](./README.md)
- **Testing Guide:** See [PLATFORM_INTEGRATION_REPORT.md](./PLATFORM_INTEGRATION_REPORT.md)
- **Issues:** File on GitHub repository
- **Questions:** Contact AgenticLedger support

---

**Happy Scraping! 🚀**

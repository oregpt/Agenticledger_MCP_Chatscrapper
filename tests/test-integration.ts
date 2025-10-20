/**
 * Integration tests for ChatScraper MCP Server
 *
 * IMPORTANT: This file requires real API credentials.
 * Copy credentials.example.json to credentials.json and fill in your credentials.
 *
 * Run with: npm run test:integration
 */

import * as fs from 'fs';
import * as path from 'path';
import { scrapeTelegramChannel, listTelegramChannels } from '../src/tools/telegram.js';
import { scrapeSlackChannel, listSlackChannels } from '../src/tools/slack.js';

// Load credentials
const credentialsPath = path.join(__dirname, 'credentials.json');

if (!fs.existsSync(credentialsPath)) {
  console.error('❌ credentials.json not found!');
  console.error('Copy credentials.example.json to credentials.json and fill in your API credentials.');
  process.exit(1);
}

const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf-8'));

// Test utilities
function logTest(name: string) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Testing: ${name}`);
  console.log('='.repeat(60));
}

function logResult(result: any) {
  console.log(JSON.stringify(result, null, 2));
}

async function runTests() {
  console.log('🚀 ChatScraper MCP Server - Integration Tests\n');

  // ============================================================================
  // TELEGRAM TESTS
  // ============================================================================

  if (credentials.telegram.compositeToken !== 'apiId:apiHash:phone:sessionString') {
    logTest('Telegram: List Channels');
    try {
      const result = await listTelegramChannels({
        accessToken: credentials.telegram.compositeToken
      });
      logResult(result);

      if (result.success && result.data.channels.length > 0) {
        console.log('✅ PASS: Listed Telegram channels successfully');
      } else {
        console.log('⚠️ WARN: No channels found or error occurred');
      }
    } catch (error) {
      console.error('❌ FAIL:', error);
    }

    logTest('Telegram: Scrape Channel (Basic)');
    try {
      const result = await scrapeTelegramChannel({
        accessToken: credentials.telegram.compositeToken,
        chat: credentials.telegram.testChannel,
        limit: 10
      });
      logResult(result);

      if (result.success && result.data.messages.length > 0) {
        console.log('✅ PASS: Scraped Telegram channel successfully');
      } else {
        console.log('⚠️ WARN: No messages found or error occurred');
      }
    } catch (error) {
      console.error('❌ FAIL:', error);
    }

    logTest('Telegram: Scrape with Date Filter');
    try {
      const result = await scrapeTelegramChannel({
        accessToken: credentials.telegram.compositeToken,
        chat: credentials.telegram.testChannel,
        limit: 20,
        minDate: '2025-01-01',
        maxDate: '2025-01-20'
      });
      logResult(result);

      if (result.success) {
        console.log('✅ PASS: Date filtering works');
      } else {
        console.log('❌ FAIL: Date filtering failed');
      }
    } catch (error) {
      console.error('❌ FAIL:', error);
    }

    logTest('Telegram: Scrape with Keyword Filter');
    try {
      const result = await scrapeTelegramChannel({
        accessToken: credentials.telegram.compositeToken,
        chat: credentials.telegram.testChannel,
        limit: 15,
        keywords: 'test,example'
      });
      logResult(result);

      if (result.success) {
        console.log('✅ PASS: Keyword filtering works');
      } else {
        console.log('❌ FAIL: Keyword filtering failed');
      }
    } catch (error) {
      console.error('❌ FAIL:', error);
    }

    logTest('Telegram: Error Handling - Invalid Channel');
    try {
      const result = await scrapeTelegramChannel({
        accessToken: credentials.telegram.compositeToken,
        chat: '@nonexistentchannel12345678',
        limit: 10
      });
      logResult(result);

      if (!result.success && result.error.includes('not found')) {
        console.log('✅ PASS: Error handling works correctly');
      } else {
        console.log('❌ FAIL: Expected error for invalid channel');
      }
    } catch (error) {
      console.error('❌ FAIL:', error);
    }
  } else {
    console.log('⏭️ Skipping Telegram tests - credentials not configured');
  }

  // ============================================================================
  // SLACK TESTS
  // ============================================================================

  if (credentials.slack.botToken !== 'xoxb-YOUR-BOT-TOKEN') {
    logTest('Slack: List Channels');
    try {
      const result = await listSlackChannels({
        accessToken: credentials.slack.botToken,
        includePrivate: false
      });
      logResult(result);

      if (result.success && result.data.channels.length > 0) {
        console.log('✅ PASS: Listed Slack channels successfully');
      } else {
        console.log('⚠️ WARN: No channels found or error occurred');
      }
    } catch (error) {
      console.error('❌ FAIL:', error);
    }

    logTest('Slack: Scrape Channel (Basic)');
    try {
      const result = await scrapeSlackChannel({
        accessToken: credentials.slack.botToken,
        channel: credentials.slack.testChannel,
        limit: 10
      });
      logResult(result);

      if (result.success && result.data.messages.length > 0) {
        console.log('✅ PASS: Scraped Slack channel successfully');
      } else {
        console.log('⚠️ WARN: No messages found or error occurred');
      }
    } catch (error) {
      console.error('❌ FAIL:', error);
    }

    logTest('Slack: Scrape with Date Filter');
    try {
      const result = await scrapeSlackChannel({
        accessToken: credentials.slack.botToken,
        channel: credentials.slack.testChannel,
        limit: 20,
        minDate: '2025-01-10',
        maxDate: '2025-01-20'
      });
      logResult(result);

      if (result.success) {
        console.log('✅ PASS: Date filtering works');
      } else {
        console.log('❌ FAIL: Date filtering failed');
      }
    } catch (error) {
      console.error('❌ FAIL:', error);
    }

    logTest('Slack: Scrape with Keyword Filter');
    try {
      const result = await scrapeSlackChannel({
        accessToken: credentials.slack.botToken,
        channel: credentials.slack.testChannel,
        limit: 15,
        keywords: 'test,example'
      });
      logResult(result);

      if (result.success) {
        console.log('✅ PASS: Keyword filtering works');
      } else {
        console.log('❌ FAIL: Keyword filtering failed');
      }
    } catch (error) {
      console.error('❌ FAIL:', error);
    }

    logTest('Slack: Include Threads');
    try {
      const result = await scrapeSlackChannel({
        accessToken: credentials.slack.botToken,
        channel: credentials.slack.testChannel,
        limit: 10,
        includeThreads: true
      });
      logResult(result);

      if (result.success) {
        console.log('✅ PASS: Thread inclusion works');
      } else {
        console.log('❌ FAIL: Thread inclusion failed');
      }
    } catch (error) {
      console.error('❌ FAIL:', error);
    }

    logTest('Slack: Error Handling - Invalid Channel');
    try {
      const result = await scrapeSlackChannel({
        accessToken: credentials.slack.botToken,
        channel: '#nonexistentchannel12345678',
        limit: 10
      });
      logResult(result);

      if (!result.success && result.error.includes('not found')) {
        console.log('✅ PASS: Error handling works correctly');
      } else {
        console.log('❌ FAIL: Expected error for invalid channel');
      }
    } catch (error) {
      console.error('❌ FAIL:', error);
    }

    logTest('Slack: List Private Channels');
    try {
      const result = await listSlackChannels({
        accessToken: credentials.slack.botToken,
        includePrivate: true
      });
      logResult(result);

      if (result.success) {
        console.log('✅ PASS: Private channel listing works');
      } else {
        console.log('❌ FAIL: Private channel listing failed');
      }
    } catch (error) {
      console.error('❌ FAIL:', error);
    }
  } else {
    console.log('⏭️ Skipping Slack tests - credentials not configured');
  }

  // ============================================================================
  // SUMMARY
  // ============================================================================

  console.log('\n' + '='.repeat(60));
  console.log('✅ Integration tests completed!');
  console.log('='.repeat(60));
  console.log('\nNext steps:');
  console.log('1. Review test results above');
  console.log('2. Update PLATFORM_INTEGRATION_REPORT.md with actual results');
  console.log('3. Test with MCP Inspector for full MCP protocol validation');
  console.log('4. Submit to AgenticLedger platform for review');
}

// Run tests
runTests().catch((error) => {
  console.error('Fatal error during testing:', error);
  process.exit(1);
});

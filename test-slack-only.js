/**
 * Quick Slack-only test script
 */

import * as fs from 'fs';
import * as path from 'path';
import { scrapeSlackChannel, listSlackChannels } from './dist/tools/slack.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testSlack() {
  console.log('🧪 Testing Slack ChatScraper Tools\n');
  console.log('='.repeat(60));

  // Load credentials
  const credPath = path.join(__dirname, 'tests', 'credentials.json');
  const credentials = JSON.parse(fs.readFileSync(credPath, 'utf-8'));

  const slackToken = credentials.slack.botToken;
  const testChannel = credentials.slack.testChannel;
  const workspace = credentials.slack.workspace;

  console.log(`\nWorkspace: ${workspace}`);
  console.log(`Test Channel: ${testChannel}`);
  console.log(`Token: ${slackToken.substring(0, 15)}...`);
  console.log('\n' + '='.repeat(60));

  // Test 1: List Slack Channels
  console.log('\n📋 TEST 1: List Slack Channels');
  console.log('-'.repeat(60));
  try {
    const result = await listSlackChannels({
      accessToken: slackToken,
      includePrivate: false
    });

    console.log('Response:');
    console.log(JSON.stringify(result, null, 2));

    if (result.success) {
      console.log(`\n✅ SUCCESS: Listed ${result.data.totalCount} channels`);
    } else {
      console.log(`\n❌ FAILED: ${result.error}`);
    }
  } catch (error) {
    console.log(`\n❌ ERROR: ${error.message}`);
  }

  // Test 2: Scrape Slack Channel (Basic)
  console.log('\n\n📥 TEST 2: Scrape Slack Channel (Basic - 10 messages)');
  console.log('-'.repeat(60));
  try {
    const result = await scrapeSlackChannel({
      accessToken: slackToken,
      channel: testChannel,
      limit: 10
    });

    console.log('Response:');
    console.log(JSON.stringify(result, null, 2));

    if (result.success) {
      console.log(`\n✅ SUCCESS: Scraped ${result.data.totalMessages} messages`);
      console.log(`Channel: ${result.data.metadata.channelName}`);
      console.log(`Workspace: ${result.data.metadata.workspace}`);
    } else {
      console.log(`\n❌ FAILED: ${result.error}`);
    }
  } catch (error) {
    console.log(`\n❌ ERROR: ${error.message}`);
  }

  // Test 3: Scrape with Keyword Filter
  console.log('\n\n🔍 TEST 3: Scrape with Keyword Filter');
  console.log('-'.repeat(60));
  try {
    const result = await scrapeSlackChannel({
      accessToken: slackToken,
      channel: testChannel,
      limit: 20,
      keywords: 'test,cantara,agent'
    });

    console.log('Response:');
    console.log(JSON.stringify(result, null, 2));

    if (result.success) {
      console.log(`\n✅ SUCCESS: Found ${result.data.totalMessages} messages with keywords`);
    } else {
      console.log(`\n❌ FAILED: ${result.error}`);
    }
  } catch (error) {
    console.log(`\n❌ ERROR: ${error.message}`);
  }

  // Test 4: Scrape with Thread Support
  console.log('\n\n💬 TEST 4: Scrape with Thread Support');
  console.log('-'.repeat(60));
  try {
    const result = await scrapeSlackChannel({
      accessToken: slackToken,
      channel: testChannel,
      limit: 15,
      includeThreads: true
    });

    console.log('Response:');
    console.log(JSON.stringify(result, null, 2));

    if (result.success) {
      console.log(`\n✅ SUCCESS: Scraped ${result.data.totalMessages} messages (including threads)`);
    } else {
      console.log(`\n❌ FAILED: ${result.error}`);
    }
  } catch (error) {
    console.log(`\n❌ ERROR: ${error.message}`);
  }

  // Test 5: Error Handling - Invalid Channel
  console.log('\n\n⚠️  TEST 5: Error Handling - Invalid Channel');
  console.log('-'.repeat(60));
  try {
    const result = await scrapeSlackChannel({
      accessToken: slackToken,
      channel: '#nonexistent-channel-12345',
      limit: 10
    });

    console.log('Response:');
    console.log(JSON.stringify(result, null, 2));

    if (!result.success && result.error.includes('not found')) {
      console.log('\n✅ SUCCESS: Error handling works correctly');
    } else {
      console.log('\n⚠️  UNEXPECTED: Expected channel not found error');
    }
  } catch (error) {
    console.log(`\n❌ ERROR: ${error.message}`);
  }

  console.log('\n' + '='.repeat(60));
  console.log('🎉 Slack Testing Complete!');
  console.log('='.repeat(60));
}

testSlack().catch((error) => {
  console.error('\n💥 Fatal Error:', error);
  process.exit(1);
});

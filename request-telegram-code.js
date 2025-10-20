/**
 * Request new Telegram SMS code
 * This will trigger Telegram to send a fresh SMS code to your phone
 */

import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions/index.js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function requestCode() {
  console.log('📱 Requesting new Telegram SMS code...\n');

  // Load credentials
  const credPath = path.join(__dirname, 'tests', 'credentials.json');
  const credentials = JSON.parse(fs.readFileSync(credPath, 'utf-8'));

  const apiId = parseInt(credentials.telegram.apiId);
  const apiHash = credentials.telegram.apiHash;
  const phone = credentials.telegram.phone;

  console.log(`API ID: ${apiId}`);
  console.log(`Phone: ${phone}\n`);

  // Create client with empty session
  const stringSession = new StringSession('');
  const client = new TelegramClient(stringSession, apiId, apiHash, {
    connectionRetries: 5,
  });

  console.log('🔄 Connecting to Telegram and requesting SMS code...\n');

  try {
    await client.connect();

    // This will trigger SMS code to be sent
    await client.sendCode({
      apiId: apiId,
      apiHash: apiHash
    }, phone);

    console.log('✅ SMS code has been sent to ' + phone);
    console.log('\n📬 Check your phone for the SMS code from Telegram');
    console.log('\n⏰ The code will expire in a few minutes');
    console.log('\n🔑 Once you receive it, run:');
    console.log('   node telegram-auth-with-code.js <CODE>');
    console.log('\n   Example: node telegram-auth-with-code.js 12345\n');

    await client.disconnect();

  } catch (error) {
    console.error('❌ Error requesting code:', error.message);
    await client.disconnect();
    process.exit(1);
  }
}

requestCode();

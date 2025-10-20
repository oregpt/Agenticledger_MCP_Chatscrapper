/**
 * Telegram Authentication with SMS Code
 * Usage: node telegram-auth-with-code.js <sms_code> [2fa_password]
 */

import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions/index.js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const smsCode = process.argv[2];
const twoFaPassword = process.argv[3] || '';

if (!smsCode) {
  console.error('❌ Usage: node telegram-auth-with-code.js <sms_code> [2fa_password]');
  console.error('   Example: node telegram-auth-with-code.js 12345');
  process.exit(1);
}

async function authenticate() {
  console.log('🔐 Telegram Authentication\n');

  // Load credentials
  const credPath = path.join(__dirname, 'tests', 'credentials.json');
  const credentials = JSON.parse(fs.readFileSync(credPath, 'utf-8'));

  const apiId = parseInt(credentials.telegram.apiId);
  const apiHash = credentials.telegram.apiHash;
  const phone = credentials.telegram.phone;

  console.log(`API ID: ${apiId}`);
  console.log(`Phone: ${phone}`);
  console.log(`SMS Code: ${smsCode}`);
  if (twoFaPassword) {
    console.log(`2FA: Provided\n`);
  } else {
    console.log(`2FA: Not provided\n`);
  }

  // Create client with empty session
  const stringSession = new StringSession('');
  const client = new TelegramClient(stringSession, apiId, apiHash, {
    connectionRetries: 5,
  });

  console.log('📱 Connecting to Telegram...\n');

  try {
    await client.start({
      phoneNumber: async () => phone,
      password: async () => twoFaPassword || undefined,
      phoneCode: async () => smsCode,
      onError: (err) => console.error('Error:', err),
    });

    console.log('\n✅ Successfully authenticated!\n');

    // Get session string
    const sessionString = client.session.save();
    console.log('Session String Generated:\n');
    console.log(sessionString);
    console.log('\n');

    // Create composite token
    const compositeToken = `${apiId}:${apiHash}:${phone}:${sessionString}`;

    // Update credentials.json
    credentials.telegram.sessionString = sessionString;
    credentials.telegram.compositeToken = compositeToken;

    fs.writeFileSync(credPath, JSON.stringify(credentials, null, 2));

    console.log('✅ Updated credentials.json with session string');
    console.log('\nComposite Token (for platform):');
    console.log(compositeToken);
    console.log('\n');

    await client.disconnect();

    console.log('🎉 Done! You can now run Telegram tests with: npm run test:integration');
  } catch (error) {
    console.error('❌ Authentication failed:', error.message);
    process.exit(1);
  }
}

authenticate();

/**
 * Telegram Session Generator
 * Generates a session string for Telegram authentication
 */

import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions/index.js';
import * as readline from 'readline';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

async function generateSession() {
  console.log('🔐 Telegram Session Generator\n');

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

  console.log('📱 Connecting to Telegram...\n');

  await client.start({
    phoneNumber: async () => phone,
    password: async () => {
      const pwd = await question('Enter your 2FA password (or press Enter if none): ');
      return pwd || undefined;
    },
    phoneCode: async () => {
      const code = await question('Enter the code you received via SMS: ');
      return code;
    },
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
  console.log('\nComposite Token (save this for platform):');
  console.log(compositeToken);
  console.log('\n');

  await client.disconnect();
  rl.close();

  console.log('🎉 Done! You can now run: npm run test:integration');
}

generateSession().catch((error) => {
  console.error('❌ Error:', error);
  rl.close();
  process.exit(1);
});

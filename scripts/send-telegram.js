#!/usr/bin/env node

/**
 * Send video file via Telegram Bot.
 *
 * Usage: node scripts/send-telegram.js <video-file> [caption]
 */

import fs from 'fs';
import https from 'https';

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const CHAT_ID = process.env.CHAT_ID;

/**
 * Send a video to Telegram chat.
 */
async function sendVideo(videoFile, caption = '') {
  // Validate inputs
  if (!TELEGRAM_TOKEN) {
    console.error('❌ TELEGRAM_TOKEN environment variable is required');
    process.exit(1);
  }

  if (!CHAT_ID) {
    console.error('❌ CHAT_ID environment variable is required');
    process.exit(1);
  }

  if (!fs.existsSync(videoFile)) {
    console.error(`❌ Video file not found: ${videoFile}`);
    process.exit(1);
  }

  console.log(`📤 Sending video to Telegram...`);
  console.log(`📁 File: ${videoFile}`);

  try {
    const videoBuffer = fs.readFileSync(videoFile);
    const stats = fs.statSync(videoFile);
    const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);

    console.log(`📊 Size: ${fileSizeMB} MB`);

    if (stats.size > 50 * 1024 * 1024) {
      console.error('❌ File too large. Telegram limit is 50MB for videos');
      process.exit(1);
    }

    // Prepare multipart/form-data
    const boundary = '----TelegramFormBoundary' + Date.now();
    const fileName = videoFile.split(/[/\\]/).pop();

    let requestBody = '';
    const headers = {};

    // Add chat_id field
    requestBody += `--${boundary}\r\n`;
    requestBody += 'Content-Disposition: form-data; name="chat_id"\r\n\r\n';
    requestBody += `${CHAT_ID}\r\n`;

    // Add caption field (optional)
    if (caption) {
      requestBody += `--${boundary}\r\n`;
      requestBody += 'Content-Disposition: form-data; name="caption"\r\n\r\n';
      requestBody += `${caption}\r\n`;
    }

    // Add video file
    requestBody += `--${boundary}\r\n`;
    requestBody += `Content-Disposition: form-data; name="video"; filename="${fileName}"\r\n`;
    requestBody += 'Content-Type: video/mp4\r\n\r\n';

    const bodyBuffer = Buffer.concat([
      Buffer.from(requestBody, 'utf-8'),
      videoBuffer,
      Buffer.from(`\r\n--${boundary}--\r\n`, 'utf-8')
    ]);

    headers['Content-Type'] = `multipart/form-data; boundary=${boundary}`;
    headers['Content-Length'] = bodyBuffer.length;

    // Send to Telegram
    const response = await new Promise((resolve, reject) => {
      const req = https.request(
        `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendVideo`,
        { method: 'POST', headers },
        (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            try {
              resolve(JSON.parse(data));
            } catch (e) {
              reject(new Error(`Failed to parse response: ${e.message}`));
            }
          });
        }
      );

      req.on('error', reject);
      req.write(bodyBuffer);
      req.end();
    });

    if (!response.ok) {
      throw new Error(`Telegram API error: ${response.description}`);
    }

    const result = response.result;
    console.log(`✅ Video sent successfully!`);
    console.log(`📱 Message ID: ${result.message_id}`);
    console.log(`🔗 Watch it in Telegram: https://t.me/c/${CHAT_ID.toString().replace('-100', '')}/${result.message_id}`);

  } catch (error) {
    console.error('❌ Failed to send video:', error.message);
    process.exit(1);
  }
}

/**
 * Send a text message to Telegram chat.
 */
async function sendMessage(text) {
  if (!TELEGRAM_TOKEN || !CHAT_ID) {
    console.error('❌ TELEGRAM_TOKEN and CHAT_ID required');
    process.exit(1);
  }

  const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: text,
        parse_mode: 'HTML'
      })
    });

    const data = await response.json();

    if (!data.ok) {
      throw new Error(data.description || 'Unknown error');
    }

    console.log(`✅ Message sent successfully`);

  } catch (error) {
    console.error('❌ Failed to send message:', error.message);
  }
}

// CLI execution
const args = process.argv.slice(2);

if (args.length === 0) {
  console.error('Usage: node scripts/send-telegram.js <video-file> [caption]');
  console.error('       node scripts/send-telegram.js --message <text>');
  process.exit(1);
}

if (args[0] === '--message' && args.length >= 2) {
  sendMessage(args.slice(1).join(' '));
} else {
  sendVideo(args[0], args[1] || '');
}

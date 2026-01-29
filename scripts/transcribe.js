#!/usr/bin/env node

/**
 * Transcribe audio using Deepgram API.
 * Generates word-level timestamps for subtitle synchronization.
 *
 * Usage: node scripts/transcribe.js <audio-file> <output-file>
 */

import fs from 'fs';
import https from 'https';

const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY;
const DEEPGRAM_URL = 'https://api.deepgram.com/v1/listen?model=nova-2&punctuate=true&paragraphs=true&diarize=false&utterances=false&smart_format=true';

async function transcribe(audioFile, outputFile) {
  // Validate inputs
  if (!DEEPGRAM_API_KEY) {
    console.error('❌ DEEPGRAM_API_KEY environment variable is required');
    process.exit(1);
  }

  if (!fs.existsSync(audioFile)) {
    console.error(`❌ Audio file not found: ${audioFile}`);
    process.exit(1);
  }

  console.log(`🎙️ Transcribing: ${audioFile}`);
  console.log('⏳ Processing... (this may take a while)');

  try {
    const audioBuffer = fs.readFileSync(audioFile);

    const response = await new Promise((resolve, reject) => {
      const req = https.request(DEEPGRAM_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${DEEPGRAM_API_KEY}`,
          'Content-Type': 'audio/mp3'
        }
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error(`Failed to parse response: ${e.message}`));
          }
        });
      });

      req.on('error', reject);
      req.write(audioBuffer);
      req.end();
    });

    // Extract word-level timestamps
    if (!response.results?.channels?.[0]?.alternatives?.[0]) {
      throw new Error('Invalid response format from Deepgram');
    }

    const alternative = response.results.channels[0].alternatives[0];

    // Format for Remotion Subtitles component
    const words = alternative.words.map(word => ({
      word: word.word,
      start: word.start,
      end: word.end
    }));

    // Save to output file
    fs.writeFileSync(outputFile, JSON.stringify(words, null, 2));

    console.log(`✅ Transcription complete!`);
    console.log(`📊 ${words.length} words transcribed`);
    console.log(`💾 Saved to: ${outputFile}`);
    console.log(`⏱️ Duration: ${Math.max(...words.map(w => w.end)).toFixed(2)}s`);

  } catch (error) {
    console.error('❌ Transcription failed:', error.message);
    process.exit(1);
  }
}

// CLI execution
const args = process.argv.slice(2);
if (args.length !== 2) {
  console.error('Usage: node scripts/transcribe.js <audio-file> <output-file>');
  process.exit(1);
}

transcribe(args[0], args[1]);

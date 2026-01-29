#!/usr/bin/env node

/**
 * Analyze video transcript to find viral moments using Google Gemini AI.
 *
 * Usage: node scripts/analyze-viral.js <transcript-file> <output-file>
 */

import fs from 'fs';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent';

/**
 * Analyze transcript for viral potential using Gemini AI.
 */
async function analyzeViral(transcriptFile, outputFile) {
  // Validate inputs
  if (!GEMINI_API_KEY) {
    console.error('❌ GEMINI_API_KEY environment variable is required');
    process.exit(1);
  }

  if (!fs.existsSync(transcriptFile)) {
    console.error(`❌ Transcript file not found: ${transcriptFile}`);
    process.exit(1);
  }

  console.log(`🔍 Analyzing: ${transcriptFile}`);
  console.log('⏳ Finding viral moments...');

  try {
    // Read and parse transcript
    const transcript = JSON.parse(fs.readFileSync(transcriptFile, 'utf-8'));

    // Build full text for AI analysis
    const fullText = transcript.map(w => w.word).join(' ');
    const totalDuration = Math.max(...transcript.map(w => w.end));

    // Limit text to avoid token limits (first ~3000 words)
    const truncatedText = fullText.split(' ').slice(0, 3000).join(' ');

    const prompt = `You are an expert at identifying viral content for short-form video (TikTok, Reels, Shorts).

Analyze this transcript and find the most compelling 30-60 second segment that would go viral.

Look for:
- Strong hooks within first 3 seconds
- High emotion, controversy, or surprising insights
- Actionable value or "aha!" moments
- Natural story arc within 60 seconds

Transcript (duration: ${totalDuration.toFixed(1)}s):
"${truncatedText}"

Respond ONLY with valid JSON in this exact format:
{
  "headline": "viral headline in ALL CAPS",
  "start": 0.0,
  "end": 45.5,
  "reason": "brief explanation"
}

Rules:
- Start time must be between 0 and ${Math.max(0, totalDuration - 30).toFixed(1)}
- End time must be at least 30 seconds after start
- End time cannot exceed ${totalDuration.toFixed(1)}
- Headline must be UNDER 60 CHARACTERS
- Respond with ONLY the JSON, no other text`;

    const response = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 500
        }
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!aiResponse) {
      throw new Error('No response from Gemini API');
    }

    // Extract JSON from response (handle markdown code blocks)
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No valid JSON in Gemini response');
    }

    const result = JSON.parse(jsonMatch[0]);

    // Validate result
    if (typeof result.start !== 'number' || typeof result.end !== 'number') {
      throw new Error('Invalid start/end times in response');
    }

    if (result.start < 0 || result.start >= totalDuration) {
      throw new Error(`Start time ${result.start} is out of bounds`);
    }

    if (result.end <= result.start || result.end > totalDuration) {
      throw new Error(`End time ${result.end} is invalid`);
    }

    // Filter transcript to selected segment
    const segmentTranscript = transcript.filter(
      w => w.start >= result.start && w.end <= result.end
    );

    // Adjust timestamps to be relative to segment start
    const adjustedTranscript = segmentTranscript.map(w => ({
      word: w.word,
      start: Math.max(0, w.start - result.start),
      end: Math.max(0, w.end - result.start)
    }));

    const output = {
      headline: result.headline,
      start: result.start,
      end: result.end,
      reason: result.reason,
      transcript: adjustedTranscript
    };

    // Save to output file
    fs.writeFileSync(outputFile, JSON.stringify(output, null, 2));

    console.log(`✅ Analysis complete!`);
    console.log(`📢 Headline: ${result.headline}`);
    console.log(`⏱️ Segment: ${result.start.toFixed(1)}s - ${result.end.toFixed(1)}s (${(result.end - result.start).toFixed(1)}s)`);
    console.log(`📝 ${segmentTranscript.length} words in segment`);
    console.log(`💾 Saved to: ${outputFile}`);
    console.log(`💡 ${result.reason}`);

  } catch (error) {
    console.error('❌ Analysis failed:', error.message);
    process.exit(1);
  }
}

// CLI execution
const args = process.argv.slice(2);
if (args.length !== 2) {
  console.error('Usage: node scripts/analyze-viral.js <transcript-file> <output-file>');
  process.exit(1);
}

analyzeViral(args[0], args[1]);

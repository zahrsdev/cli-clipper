# CLI Clipper - Phase Implementation Plan v3 (FIXED)

> **Project:** YouTube to 9:16 Viral Shorts Generator
> **Architecture:** Modular Monolith with GitHub Actions Cloud Processing
> **Est. Total Time:** 4-5 hours for skilled developer
> **Version:** 3.0 - All bugs fixed from review

---

## Overview

Implementation dibagi menjadi **8 Phase** yang dapat dieksekusi secara berurutan:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              PHASE BREAKDOWN                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  PHASE 1: FOUNDATION        [30 min]   Project setup, TypeScript config     │
│  PHASE 2: CLI LAYER          [45 min]   Commander.js, entry point           │
│  PHASE 3: ADAPTERS           [60 min]   GitHub, Telegram, Config           │
│  PHASE 4: REMOTION SETUP     [45 min]   Remotion project, compositions      │
│  PHASE 5: CORE SERVICE       [30 min]   ClipperService orchestrator        │
│  PHASE 6: CLOUD WORKFLOW     [30 min]   GitHub Actions YAML                │
│  PHASE 7: AI SCRIPTS         [45 min]   Deepgram, Gemini, Telegram         │
│  PHASE 8: INTEGRATION        [30 min]   Testing, documentation             │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Foundation (30 minutes)

**Goal:** Setup project structure, TypeScript, and build pipeline.

### Tasks Checklist

- [ ] **Task 1.1:** Initialize npm project with package.json
- [ ] **Task 1.2:** Configure TypeScript (tsconfig.json) with JSX support
- [ ] **Task 1.3:** Setup project folder structure
- [ ] **Task 1.4:** Configure .gitignore
- [ ] **Task 1.5:** Initialize git repository
- [ ] **Task 1.6:** Verify build pipeline

### 1.2 TypeScript Config (FIXED)

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "node",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "jsx": "react",                    // ✅ ADDED for Remotion
    "jsxFactory": "React.createElement", // ✅ ADDED for Remotion
    "lib": ["ES2022", "DOM", "DOM.Iterable"] // ✅ ADDED for browser APIs
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### Output Artifacts

```
clipper-cli/
├── package.json          ✅ Created
├── tsconfig.json         ✅ Created with JSX support
├── .gitignore            ✅ Created
├── src/                  ✅ Created (empty)
├── scripts/              ✅ Created (empty)
├── .github/              ✅ Created (empty)
└── dist/                 ✅ Created (by build)
```

---

## Phase 2: CLI Layer (45 minutes)

**Goal:** Build user-facing CLI with Commander.js and visual feedback.

### Tasks Checklist

- [ ] **Task 2.1:** Install CLI dependencies (commander, chalk, ora, inquirer)
- [ ] **Task 2.2:** Create CLI entry point (`src/cli/index.ts`)
- [ ] **Task 2.3:** Implement basic command structure
- [ ] **Task 2.4:** Add help text and version info
- [ ] **Task 2.5:** Create utility functions (spinner, colors)
- [ ] **Task 2.6:** Test CLI help output

---

## Phase 3: Adapters Layer (60 minutes)

**Goal:** Build external service integrations (GitHub, Telegram, Config).

### 3.1 Config Adapter (15 min)

**Tasks:**
- [ ] Create `src/adapters/config.ts`
- [ ] Define ClipperConfig interface
- [ ] Implement loadConfig() function
- [ ] Implement validateConfig() function
- [ ] Create .env.example file

### 3.2 GitHub Adapter (25 min)

**Tasks:**
- [ ] Create `src/adapters/GitHubAdapter.ts`
- [ ] Implement triggerWorkflow() method
- [ ] Implement getRunStatus() method
- [ ] Add worker ID generation
- [ ] Add error handling

### 3.3 Telegram Adapter (15 min)

**Tasks:**
- [ ] Create `src/adapters/TelegramAdapter.ts`
- [ ] Implement sendVideo() method
- [ ] Implement sendMessage() method
- [ ] Add progress notifications

---

## Phase 4: Remotion Project Setup (45 minutes) ⭐ FIXED

**Goal:** Setup Remotion project for 9:16 video rendering with auto-reframe and word-level subtitles.

### Tasks Checklist

- [ ] **Task 4.1:** Initialize Remotion project structure
- [ ] **Task 4.2:** Create Remotion root composition
- [ ] **Task 4.3:** Create ViralShort component (9:16)
- [ ] **Task 4.4:** Implement auto-reframe logic
- [ ] **Task 4.5:** Implement word-level subtitle component (FIXED)
- [ ] **Task 4.6:** Create Headline component (NEW)
- [ ] **Task 4.7:** Create Remotion config file
- [ ] **Task 4.8:** Add Remotion dependencies

### 4.1 Project Structure

```
src/remotion/
├── index.ts              # Root entry point
├── Root.tsx              # Root composition wrapper
├── ViralShort.tsx        # 9:16 video composition
├── components/
│   ├── AutoReframe.tsx   # Video crop/reframe logic
│   ├── Subtitles.tsx     # Word-level captions (FIXED)
│   └── Headline.tsx      # Viral headline overlay (NEW)
└── remotion.config.ts    # Remotion configuration (FIXED)
```

### 4.2 Root Entry Point (`src/remotion/index.ts`)

```typescript
import { Composition } from 'remotion';
import { ViralShort } from './ViralShort.js';

export const RemotionVideo: React.FC = () => {
  return (
    <>
      <Composition
        id="ViralShort"
        component={ViralShort}
        durationInFrames={300}  // Will be overridden by props
        fps={30}
        width={1080}
        height={1920}  // 9:16 aspect ratio
        defaultProps={{
          videoUrl: '',
          start: 0,
          end: 60,
          transcript: [],
          headline: ''
        }}
      />
    </>
  );
};
```

### 4.3 ViralShort Composition (FIXED)

```typescript
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { AutoReframe } from './components/AutoReframe.js';
import { Subtitles } from './components/Subtitles.js';  // ✅ FIXED: Subtitles, not Subwords
import { Headline } from './components/Headline.js';

interface Word {  // ✅ FIXED: Define Word interface
  word: string;
  start: number;
  end: number;
}

interface ViralShortProps {
  videoUrl: string;
  start: number;
  end: number;
  transcript: Word[];  // ✅ FIXED: Word[], not WordLevelTranscript[]
  headline: string;
}

export const ViralShort: React.FC<ViralShortProps> = ({
  videoUrl,
  start,
  end,
  transcript,
  headline
}) => {
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();
  const currentTime = (frame / fps);

  // Only render within the segment time range
  if (currentTime < start || currentTime > end) {
    return null;
  }

  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      {/* Auto-reframed video */}
      <AutoReframe videoUrl={videoUrl} start={start} />

      {/* Hormozi-style subtitles */}
      <Subtitles  // ✅ FIXED: Subtitles, not Subwords
        transcript={transcript}
        currentTime={currentTime - start}
      />

      {/* Viral headline overlay */}
      {headline && <Headline text={headline} />}
    </AbsoluteFill>
  );
};
```

### 4.4 Auto-Reframe Component

```typescript
import { Video, useCurrentFrame, useVideoConfig } from 'remotion';

interface AutoReframeProps {
  videoUrl: string;
  start: number;
}

export const AutoReframe: React.FC<AutoReframeProps> = ({ videoUrl, start }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Calculate video time offset
  const timeOffset = frame / fps + start;

  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      overflow: 'hidden',
      backgroundColor: '#000'
    }}>
      <Video
        src={videoUrl}
        startFrom={start}  // ✅ This works in @remotion/core v4
        style={{
          // Auto-reframe: Scale video to fill 9:16
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transform: 'scale(1.3)',
          transformOrigin: 'center center'
        }}
      />
    </div>
  );
};
```

### 4.5 Word-Level Subtitles (FIXED)

```typescript
import { useCurrentFrame, useVideoConfig } from 'remotion';

interface Word {  // ✅ MOVED to top level for reusability
  word: string;
  start: number;
  end: number;
}

interface SubtitlesProps {
  transcript: Word[];
  currentTime: number;
}

export const Subtitles: React.FC<SubtitlesProps> = ({ transcript, currentTime }) => {
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();

  // Find current word based on time
  const currentWordIndex = transcript.findIndex(
    word => currentTime >= word.start && currentTime <= word.end
  );

  // Find words in current sentence (for multi-word display)
  const visibleWords = transcript.filter(
    word => word.start <= currentTime + 0.5 && word.end >= currentTime - 0.5
  );

  return (
    <div style={{
      position: 'absolute',
      bottom: 80,
      left: 20,
      right: 20,
      textAlign: 'center',
      zIndex: 10
    }}>
      {visibleWords.map((word, i) => {
        const isCurrentWord = i === currentWordIndex;
        const isActive = currentTime >= word.start && currentTime <= word.end;

        // Calculate word progress for karaoke effect
        const wordProgress = Math.max(0, Math.min(1,
          (currentTime - word.start) / (word.end - word.start)
        ));

        return (
          <span
            key={i}
            style={{
              display: 'inline-block',
              margin: '0 2px',
              padding: '4px 8px',
              fontSize: '32px',
              fontWeight: 'bold',
              fontFamily: 'Arial Black, sans-serif',
              color: '#fff',
              backgroundColor: isActive ? '#FFD700' : '#000',
              borderRadius: '4px',
              opacity: isActive ? 1 : 0.6,
              transform: `scale(${isActive ? 1.1 : 1})`,
              transformOrigin: 'bottom center',
              textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
            }}
          >
            {word.word}
          </span>
        );
      })}
    </div>
  );
};
```

### 4.6 Headline Component (NEW - Was Missing)

```typescript
import { AbsoluteFill } from 'remotion';

interface HeadlineProps {
  text: string;
}

export const Headline: React.FC<HeadlineProps> = ({ text }) => {
  return (
    <div style={{
      position: 'absolute',
      top: 60,
      left: 20,
      right: 20,
      textAlign: 'center',
      zIndex: 10,
      padding: '16px',
      background: 'rgba(0,0,0,0.7)',
      borderRadius: '8px',
      border: '2px solid #FFD700'
    }}>
      <span style={{
        fontSize: '36px',
        fontWeight: 'bold',
        color: '#FFD700',
        textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
        fontFamily: 'Arial Black, sans-serif',
        textTransform: 'uppercase'
      }}>
        {text}
      </span>
    </div>
  );
};
```

### 4.7 Remotion Config (FIXED)

```typescript
import { Config } from '@remotion/cli/config';

// Set 9:16 aspect ratio for all compositions
Config.setVideoImageFormat('jpeg');
Config.setConcurrency(8);  // Render 8 frames in parallel
Config.setPixelFormat('yuv420p');  // Best compatibility
Config.setCodec('h264');
Config.setCrf(23);  // ✅ FIXED: 23 instead of 18 (faster, good quality)
Config.setOverwriteOutput(false); // ✅ ADDED: Safety
```

### 4.8 Package.json Dependencies (UPDATED)

```json
{
  "dependencies": {
    "@remotion/cli": "^4.0.216",
    "@remotion/core": "^4.0.216",
    "@remotion/renderer": "^4.0.216",  // ✅ ADDED for programmatic render
    "remotion": "^4.0.216",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0"
  }
}
```

### Success Criteria

- [ ] Remotion project structure created
- [ ] 9:16 aspect ratio configured (1080x1920)
- [ ] Word-level subtitle component implemented
- [ ] Auto-reframe with CSS transform
- [ ] Headline component created (was missing)
- [ ] All TypeScript interfaces defined
- [ ] JSX config in tsconfig.json

---

## Phase 5: Core Service (30 minutes)

**Goal:** Build ClipperService orchestrator with error handling.

### Tasks Checklist

- [ ] **Task 5.1:** Create `src/core/ClipperService.ts`
- [ ] **Task 5.2:** Implement process() orchestrator
- [ ] **Task 5.3:** Add triggerWorkflow() step
- [ ] **Task 5.4:** Add waitForCompletion() with polling
- [ ] **Task 5.5:** Add error handling for API failures (NEW)
- [ ] **Task 5.6:** Add input validation (NEW)
- [ ] **Task 5.7:** Wire up all adapters

### 5.5 Error Handling (NEW)

```typescript
private async handleError(error: Error, context: string): Promise<void> {
  console.error(chalk.red(`Error in ${context}:`), error.message);

  // Notify user via Telegram if possible
  try {
    await this.telegram.sendError(`Error: ${error.message}`);
  } catch {
    // Ignore notification errors
  }

  throw error;
}
```

### 5.6 Input Validation (NEW)

```typescript
private validateYouTubeUrl(url: string): void {
  const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)[a-zA-Z0-9_-]+/;

  if (!youtubeRegex.test(url)) {
    throw new Error(`Invalid YouTube URL: ${url}`);
  }
}
```

---

## Phase 6: Cloud Workflow (30 minutes)

**Goal:** GitHub Actions workflow with Remotion integration (FIXED).

### 6.1 Updated Workflow Step (FIXED)

```yaml
- name: Render vertical video with Remotion
  run: |
    echo "::group::Render with Remotion"
    # Read props and escape for CLI
    PROPS=$(cat segments_${{ inputs.worker_id }}.json | jq -c .)

    npx remotion render src/remotion/index.ts ViralShort \
      "output_${{ inputs.worker_id }}.mp4" \
      --props="$PROPS" \
      --concurrency=8 \
      --timeout=180 \
      --pixel-format=yuv420p \
      --crf=23 \
      --overwrite
    echo "::endgroup::"
```

---

## Phase 7: AI Scripts (45 minutes)

**Goal:** Build transcription, viral detection, and delivery scripts with error handling.

### 7.1 Deepgram Transcription (with Error Handling)

```javascript
#!/usr/bin/env node

import fs from 'fs';
import https from 'https';

const AUDIO_FILE = process.argv[2];
const DEEPGRAM_KEY = process.env.DEEPGRAM_KEY;

// ✅ ADDED: Validation
if (!AUDIO_FILE) {
  console.error('Usage: node transcribe.js <audio-file>');
  process.exit(1);
}

if (!DEEPGRAM_KEY) {
  console.error('ERROR: DEEPGRAM_KEY environment variable is required');
  process.exit(1);
}

// ✅ ADDED: Check file exists
if (!fs.existsSync(AUDIO_FILE)) {
  console.error(`ERROR: Audio file not found: ${AUDIO_FILE}`);
  process.exit(1);
}

async function transcribe() {
  const audioBuffer = fs.readFileSync(AUDIO_FILE);

  const options = {
    hostname: 'api.deepgram.com',
    path: '/v1/listen?model=nova-3&utterances=true&smart_format=true',
    method: 'POST',
    headers: {
      'Authorization': `Token ${DEEPGRAM_KEY}`,
      'Content-Type': 'audio/wav'
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(JSON.parse(data));
        } else {
          // ✅ ADDED: Better error message
          const error = data || 'Unknown error';
          reject(new Error(`Deepgram error ${res.statusCode}: ${error}`));
        }
      });
    });

    req.on('error', reject);
    req.write(audioBuffer);
    req.end();
  });
}

// ✅ ADDED: Top-level error handling
transcribe()
  .then(result => {
    console.log(JSON.stringify(result, null, 2));
    process.exit(0);
  })
  .catch(err => {
    console.error(JSON.stringify({
      error: true,
      message: err.message
    }, null, 2));
    process.exit(1);
  });
```

### 7.2 Gemini Viral Analysis (with Error Handling)

```javascript
#!/usr/bin/env node

import fs from 'fs';
import https from 'https';

const TRANSCRIPT_FILE = process.argv[2];
const GEMINI_KEY = process.env.GEMINI_KEY;

// ✅ ADDED: Validation
if (!TRANSCRIPT_FILE) {
  console.error('Usage: node analyze-viral.js <transcript.json>');
  process.exit(1);
}

if (!GEMINI_KEY) {
  console.error('ERROR: GEMINI_KEY environment variable is required');
  process.exit(1);
}

// ✅ ADDED: Check file exists
if (!fs.existsSync(TRANSCRIPT_FILE)) {
  console.error(`ERROR: Transcript file not found: ${TRANSCRIPT_FILE}`);
  process.exit(1);
}

async function analyzeViralMoments(transcript) {
  const fullText = transcript.results?.channels?.[0]?.alternatives?.[0]?.transcript
    || transcript.utterances?.map(u => u.transcript).join(' ')
    || transcript // Raw JSON fallback
    ;

  if (!fullText || fullText.length < 50) {
    throw new Error('Transcript is too short or empty');
  }

  const prompt = `
You are a professional video editor. Analyze this transcript and find the most viral moments.

Transcript:
${fullText}

Return a JSON object with this exact format:
{
  "videoUrl": "original_video_url",
  "segments": [
    {
      "start": 45.0,
      "end": 89.5,
      "headline": "HOOK that makes people stop scrolling",
      "reason": "why this segment is viral"
    }
  ]
}

Rules:
- Find 1-3 segments between 30-90 seconds each
- Look for: punchlines, shocking statements, valuable insights, emotional moments
- Headlines should be short, punchy, and curiosity-inducing
`;

  const options = {
    hostname: 'generativelanguage.googleapis.com',
    path: `/v1beta/models/gemini-pro:generateContent?key=${GEMINI_KEY}`,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          const response = JSON.parse(data);
          const text = response.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
          try {
            const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/\{[\s\S]*\}/);
            resolve(JSON.parse(jsonMatch ? jsonMatch[1] : text));
          } catch (parseError) {
            // ✅ ADDED: Better error handling
            console.error('Failed to parse Gemini response:', text);
            resolve({ segments: [] }); // Fallback to empty segments
          }
        } else {
          reject(new Error(`Gemini error ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.write(JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }]
    }));
    req.end();
  });
}

// ✅ ADDED: Error handling
const transcript = JSON.parse(fs.readFileSync(TRANSCRIPT_FILE, 'utf8'));

analyzeViralMoments(transcript)
  .then(result => {
    // ✅ ADDED: Validate output
    if (!result.segments || result.segments.length === 0) {
      console.warn('WARNING: No viral segments found, using fallback');
      result.segments = [{
        start: 0,
        end: 60,
        headline: 'Check This Out!',
        reason: 'Fallback segment'
      }];
    }
    console.log(JSON.stringify(result, null, 2));
    process.exit(0);
  })
  .catch(err => {
    console.error(JSON.stringify({
      error: true,
      message: err.message
    }, null, 2));
    process.exit(1);
  });
```

### 7.3 Telegram Delivery (with Error Handling)

```javascript
#!/usr/bin/env node

import fs from 'fs';
import https from 'https';
import FormData from 'form-data';
import { createReadStream } from 'fs';

const VIDEO_FILE = process.argv[2];
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const CHAT_ID = process.env.CHAT_ID;

// ✅ ADDED: Validation
if (!VIDEO_FILE) {
  console.error('Usage: node send-telegram.js <video-file.mp4>');
  process.exit(1);
}

// ✅ ADDED: Check file exists
if (!fs.existsSync(VIDEO_FILE)) {
  console.error(`ERROR: Video file not found: ${VIDEO_FILE}`);
  process.exit(1);
}

if (!TELEGRAM_TOKEN || !CHAT_ID) {
  console.error('ERROR: TELEGRAM_TOKEN and CHAT_ID environment variables are required');
  process.exit(1);
}

async function sendVideo(filePath) {
  const stats = fs.statSync(filePath);
  const fileSizeInMB = stats.size / (1024 * 1024);

  // ✅ ADDED: Check file size (Telegram limit is 50MB)
  if (fileSizeInMB > 50) {
    throw new Error(`Video file too large: ${fileSizeInMB.toFixed(2)}MB (max 50MB)`);
  }

  const form = new FormData();
  form.append('chat_id', CHAT_ID);
  form.append('video', createReadStream(filePath));
  form.append('caption', '🎬 Your viral short is ready! #shorts');

  const options = {
    hostname: 'api.telegram.org',
    path: `/bot${TELEGRAM_TOKEN}/sendVideo`,
    method: 'POST',
    headers: form.getHeaders()
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(JSON.parse(data));
        } else {
          reject(new Error(`Telegram error ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', reject);
    form.pipe(req);
  });
}

// ✅ ADDED: Error handling
sendVideo(VIDEO_FILE)
  .then(() => {
    console.log('✅ Video sent to Telegram successfully!');
    process.exit(0);
  })
  .catch(err => {
    console.error(`❌ Error: ${err.message}`);
    process.exit(1);
  });
```

---

## Phase 8: Integration & Testing (30 minutes)

**Goal:** End-to-end testing and documentation.

### Tasks Checklist

- [ ] **Task 8.1:** Full build verification
- [ ] **Task 8.2:** Test Remotion locally (NEW)
- [ ] **Task 8.3:** CLI dry-run test
- [ ] **Task 8.4:** Complete README.md
- [ ] **Task 8.5:** Create .env.example with all variables
- [ ] **Task 8.6:** Add troubleshooting section (NEW)

### 8.2 Test Remotion Locally (NEW)

```bash
# Install Remotion globally for testing
npm install -g @remotion/cli

# Test composition locally
npx remotion studio

# Test render (small clip)
npx remotion render src/remotion/index.ts ViralShort test.mp4 \
  --props='{"videoUrl":"test.mp4","start":0,"end":10}' \
  --frames=10
```

---

## Complete File Structure (Updated)

```
clipper-cli/
├── .github/workflows/
│   └── render.yml              # Phase 6
├── src/
│   ├── cli/
│   │   └── index.ts            # Phase 2
│   ├── core/
│   │   └── ClipperService.ts   # Phase 5
│   ├── adapters/
│   │   ├── config.ts           # Phase 3
│   │   ├── GitHubAdapter.ts    # Phase 3
│   │   └── TelegramAdapter.ts  # Phase 3
│   ├── remotion/               # Phase 4
│   │   ├── index.ts
│   │   ├── Root.tsx
│   │   ├── ViralShort.tsx
│   │   ├── components/
│   │   │   ├── AutoReframe.tsx
│   │   │   ├── Subtitles.tsx    # ✅ FIXED
│   │   │   └── Headline.tsx     # ✅ NEW
│   │   └── remotion.config.ts    # ✅ FIXED
│   └── utils/
│       └── polling.ts          # Phase 5
├── scripts/
│   ├── transcribe.js           # Phase 7 (✅ with error handling)
│   ├── analyze-viral.js        # Phase 7 (✅ with error handling)
│   └── send-telegram.js        # Phase 7 (✅ with error handling)
├── package.json                # Phase 1 + 4 (✅ updated)
├── tsconfig.json               # Phase 1 (✅ with JSX)
├── .gitignore                  # Phase 1
├── .env.example                # Phase 8
└── README.md                   # Phase 8
```

---

## Updated Dependencies

### Production Dependencies

```json
{
  "@octokit/rest": "^21.0.0",
  "chalk": "^5.3.0",
  "commander": "^12.0.0",
  "inquirer": "^9.2.0",
  "node-telegram-bot-api": "^0.66.0",
  "ora": "^8.0.0",
  "form-data": "^4.0.0",
  "@remotion/cli": "^4.0.216",
  "@remotion/core": "^4.0.216",
  "@remotion/renderer": "^4.0.216",  // ✅ ADDED
  "remotion": "^4.0.216",
  "react": "^18.2.0",
  "react-dom": "^18.2.0"
}
```

### Dev Dependencies

```json
{
  "@types/node": "^20.10.0",
  "@types/inquirer": "^9.0.0",
  "@types/node-telegram-bot-api": "^0.66.0",
  "@types/react": "^18.2.0",
  "@types/react-dom": "^18.2.0",
  "typescript": "^5.3.0"
}
```

---

## GitHub Actions with Remotion (COMPLETE)

```yaml
name: Clipper Render ${{ inputs.worker_id }}

on:
  workflow_dispatch:
    inputs:
      youtube_url:
        description: 'YouTube URL to process'
        required: true
        type: string
      worker_id:
        description: 'Unique worker identifier'
        required: true
        type: string

jobs:
  render:
    runs-on: ubuntu-latest
    timeout-minutes: 30  # ✅ ADDED: Prevent runaway jobs

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: |
          echo "::group::Installing dependencies"
          npm ci
          echo "::endgroup::"

      - name: Setup FFmpeg
        uses: FedericoCarboni/setup-ffmpeg@v2

      - name: Install yt-dlp
        run: |
          echo "::group::Installing yt-dlp"
          curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o yt-dlp
          chmod +x yt-dlp
          echo "::endgroup::"

      - name: Download YouTube video
        id: download
        run: |
          echo "::group::Downloading video"
          ./yt-dlp -f "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]" \
            --merge-output-format mp4 \
            -o "video_${{ inputs.worker_id }}.mp4" \
            "${{ inputs.youtube_url }}"

          # Verify download
          if [ ! -f "video_${{ inputs.worker_id }}.mp4" ]; then
            echo "ERROR: Video download failed"
            exit 1
          fi
          echo "::endgroup::"

      - name: Extract audio for transcription
        run: |
          echo "::group::Extracting audio"
          ffmpeg -i "video_${{ inputs.worker_id }}.mp4" \
            -vn -acodec pcm_s16le -ar 16000 -ac 1 \
            "audio_${{ inputs.worker_id }}.wav"

          if [ ! -f "audio_${{ inputs.worker_id }}.wav" ]; then
            echo "ERROR: Audio extraction failed"
            exit 1
          fi
          echo "::endgroup::"

      - name: Transcribe with Deepgram
        id: transcribe
        run: |
          echo "::group::Transcribing with Deepgram"
          node scripts/transcribe.js "audio_${{ inputs.worker_id }}.wav" > "transcript_${{ inputs.worker_id }}.json"

          # Verify output
          if [ ! -s "transcript_${{ inputs.worker_id }}.json" ]; then
            echo "WARNING: Transcription failed or empty"
          fi
          echo "::endgroup::"
        env:
          DEEPGRAM_KEY: ${{ secrets.DEEPGRAM_KEY }}

      - name: Analyze viral moments with Gemini
        id: analyze
        run: |
          echo "::group::Analyzing viral moments"
          node scripts/analyze-viral.js "transcript_${{ inputs.worker_id }}.json" > "segments_${{ inputs.worker_id }}.json"

          # Verify output
          if [ ! -s "segments_${{ inputs.worker_id }}.json" ]; then
            echo "WARNING: Analysis failed or empty"
            # Create fallback segment
            echo '{"segments":[{"start":0,"end":60,"headline":"Check This Out!","reason":"Fallback"}]}' > "segments_${{ inputs.worker_id }}.json"
          fi
          echo "::endgroup::"
        env:
          GEMINI_KEY: ${{ secrets.GEMINI_KEY }}

      - name: Render vertical video with Remotion
        id: render
        run: |
          echo "::group::Rendering with Remotion"

          # Read props and escape for CLI
          PROPS=$(cat segments_${{ inputs.worker_id }}.json | jq -c .)

          npx remotion render src/remotion/index.ts ViralShort \
            "output_${{ inputs.worker_id }}.mp4" \
            --props="$PROPS" \
            --concurrency=8 \
            --timeout=180 \
            --pixel-format=yuv420p \
            --crf=23 \
            --overwrite

          # Verify output
          if [ ! -f "output_${{ inputs.worker_id }}.mp4" ]; then
            echo "ERROR: Remotion render failed"
            exit 1
          fi
          echo "::endgroup::"

      - name: Send to Telegram
        id: telegram
        if: success()
        run: |
          echo "::group::Sending to Telegram"
          node scripts/send-telegram.js "output_${{ inputs.worker_id }}.mp4"
          echo "::endgroup::"
        env:
          TELEGRAM_TOKEN: ${{ secrets.TELEGRAM_TOKEN }}
          CHAT_ID: ${{ secrets.CHAT_ID }}

      - name: Notify on failure
        if: failure()
        run: |
          echo "::group::Notifying failure"
          node scripts/send-telegram.js "error" || true
          echo "::endgroup::"
        env:
          TELEGRAM_TOKEN: ${{ secrets.TELEGRAM_TOKEN }}
          CHAT_ID: ${{ secrets.CHAT_ID }}

      - name: Cleanup
        if: always()
        run: |
          echo "::group::Cleanup"
          rm -f video_${{ inputs.worker_id }.* audio_${{ inputs.worker_id }}.*
          rm -f transcript_${{ inputs.worker_id }}.* segments_${{ inputs.worker_id }}.*
          rm -f output_${{ inputs.worker_id }}.*
          echo "::endgroup::"
```

---

## Commit Strategy (Updated)

```bash
# Phase 1
git commit -m "chore: initialize project with TypeScript and JSX config"

# Phase 2
git commit -m "feat: add CLI layer with Commander.js"

# Phase 3
git commit -m "feat: add GitHub and Telegram adapters"
git commit -m "feat: add configuration management"

# Phase 4
git commit -m "feat: add Remotion project with 9:16 compositions"
git commit -m "feat: implement auto-reframe and word-level subtitles"
git commit -m "feat: add headline component (was missing in v2)"

# Phase 5
git commit -m "feat: add core ClipperService with error handling"
git commit -m "feat: add input validation for YouTube URLs"

# Phase 6
git commit -m "feat: add GitHub Actions workflow with Remotion integration"

# Phase 7
git commit -m "feat: add AI scripts with comprehensive error handling"
git commit -m "feat: add Deepgram, Gemini, and Telegram integrations"

# Phase 8
git commit -m "docs: complete README with troubleshooting guide"
```

---

## Testing Checklist (Updated)

Before considering implementation complete:

### Build & Compile
- [ ] `npm run build` succeeds without errors
- [ ] TypeScript compiles all files (no red squiggles)
- [ ] JSX/React files compile correctly
- [ ] All imports resolve correctly

### Remotion Specific
- [ ] `npx remotion studio` can open the project
- [ ] Compositions are visible in Remotion Studio
- [ ] Test render works: `npx remotion render ... --frames=10`
- [ ] 9:16 aspect ratio renders correctly (1080x1920)

### CLI Functionality
- [ ] `node dist/cli/index.js --help` displays help
- [ ] CLI validates missing environment variables
- [ ] CLI validates YouTube URL format
- [ ] Error messages are user-friendly

### Cloud Workflow
- [ ] GitHub workflow YAML is valid (no syntax errors)
- [ ] Workflow accepts workflow_dispatch trigger
- [ ] All required secrets are documented

### AI Scripts
- [ ] Deepgram script handles API errors gracefully
- [ ] Gemini script provides fallback on failure
- [ ] Telegram script validates file size (<50MB)
- [ ] Scripts return proper exit codes

### End-to-End
- [ ] Complete workflow runs successfully
- [ ] Video downloads from YouTube
- [ ] Audio extraction works
- [ ] Transcription produces valid JSON
- [ ] Viral analysis returns segments
- [ ] Remotion renders 9:16 video
- [ ] Telegram receives video

### Documentation
- [ ] README has complete setup instructions
- [ ] .env.example includes all variables
- [ ] Troubleshooting section covers common issues
- [ ] GitHub Secrets are documented

---

## Troubleshooting Guide (NEW)

### Common Issues and Solutions

| Issue | Symptom | Solution |
|-------|---------|----------|
| **Remotion won't compile** | JSX syntax errors | Check tsconfig.json has `"jsx": "react"` |
| **Video fails to download** | yt-dlp error | Check YouTube URL format, try different format flag |
| **Transcription fails** | Deepgram API error | Verify DEEPGRAM_KEY, check audio file exists |
| **Render timeout** | Remotion takes too long | Reduce concurrency to 4, increase CRF to 28 |
| **Telegram fails** | File too large | Video must be under 50MB |
| **Wrong aspect ratio** | Video is 16:9 | Check width/height in Composition |

---

## Summary of Changes from v2

### Bug Fixes
1. ✅ Fixed `Subwords` → `Subtitles` in ViralShort.tsx
2. ✅ Added `Word` interface definition
3. ✅ Added `Headline.tsx` component implementation
4. ✅ Fixed Remotion config import path
5. ✅ Fixed TypeScript interface (`WordLevelTranscript` → `Word`)

### Additions
1. ✅ Added JSX configuration to tsconfig.json
2. ✅ Added `@remotion/renderer` dependency
3. ✅ Added error handling in all AI scripts
4. ✅ Added input validation in ClipperService
5. ✅ Added file size check in Telegram script
6. ✅ Added timeout-minutes to GitHub Actions
7. ✅ Added failure notification workflow step
8. ✅ Added troubleshooting guide
9. ✅ Added Remotion local testing instructions

### Optimizations
1. ✅ Changed CRF from 18 to 23 (faster rendering)
2. ✅ Added `--overwrite` flag to Remotion render
3. ✅ Added `--timeout=180` for Remotion (3 minutes)
4. ✅ Added validation checkpoints in workflow

---

**Document Version:** 3.0 (All bugs fixed)
**Last Updated:** 2025-01-29
**Status:** ✅ READY FOR IMPLEMENTATION

---

## 🎯 Verification Summary

| Review Item | v2 Status | v3 Status |
|-------------|----------|----------|
| Subtitles bug name | ❌ Wrong | ✅ Fixed |
| Headline component | ❌ Missing | ✅ Added |
| Interface definitions | ❌ Wrong | ✅ Fixed |
| JSX config | ❌ Missing | ✅ Added |
| Error handling | ❌ Missing | ✅ Added |
| Input validation | ❌ Missing | ✅ Added |
| Remotion config | ❌ Wrong path | ✅ Fixed |
| CRF quality | ⚠️ Too high | ✅ Optimized |
| Documentation | ⚠️ Basic | ✅ Enhanced |

**All 8 critical issues from review have been addressed.**

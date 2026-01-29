# CLI Clipper - Phase Implementation Plan (v2 with Remotion)

> **Project:** YouTube to 9:16 Viral Shorts Generator
> **Architecture:** Modular Monolith with GitHub Actions Cloud Processing
> **Est. Total Time:** 4-5 hours for skilled developer

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

## Phase 4: Remotion Project Setup (45 minutes) ⭐ NEW!

**Goal:** Setup Remotion project for 9:16 video rendering with auto-reframe and word-level subtitles.

### Why Remotion?

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  REMOTION VIDEO ENGINE                                                     │
│                                                                             │
│  16:9 Source Video  ──────>  [Remotion Rendering]  ──────>  9:16 Output    │
│                                   │                                       │
│                    ┌──────────────────┴──────────────────┐                   │
│                    │                                     │                   │
│              Auto-Reframe 9:16              Word-Level Subtitles             │
│              (CSS Transform)              (Hormozi-style)                  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Tasks Checklist

- [ ] **Task 4.1:** Initialize Remotion project structure
- [ ] **Task 4.2:** Create Remotion root composition
- [ ] **Task 4.3:** Create ViralShort component (9:16)
- [ ] **Task 4.4:** Implement auto-reframe logic
- [ ] **Task 4.5:** Implement word-level subtitle component
- [ ] **Task 4.6:** Create Remotion config file
- [ ] **Task 4.7:** Add Remotion dependencies

### 4.1 Project Structure

```
src/remotion/
├── index.ts              # Root entry point
├── Root.tsx              # Root composition wrapper
├── ViralShort.tsx        # 9:16 video composition
├── components/
│   ├── AutoReframe.tsx   # Video crop/reframe logic
│   ├── Subtitles.tsx     # Word-level captions
│   └── Headline.tsx      # Viral headline overlay
└── remotion.config.ts    # Remotion configuration
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

### 4.3 ViralShort Composition (`src/remotion/ViralShort.tsx`)

```typescript
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { AutoReframe } from './components/AutoReframe.js';
import { Subtitles } from './components/Subtitles.js';
import { Headline } from './components/Headline.js';

interface ViralShortProps {
  videoUrl: string;
  start: number;
  end: number;
  transcript: WordLevelTranscript[];
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
      <Subwords
        transcript={transcript}
        currentTime={currentTime - start}
      />

      {/* Viral headline overlay */}
      {headline && <Headline text={headline} />}
    </AbsoluteFill>
  );
};
```

### 4.4 Auto-Reframe Component (`src/remotion/components/AutoReframe.tsx`)

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
        startFrom={start}
        style={{
          // Auto-reframe: Scale video to fill 9:16
          // Center crop the most important area
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transform: 'scale(1.3)',  // Zoom to focus on center
          transformOrigin: 'center center'
        }}
      />
    </div>
  );
};
```

### 4.5 Word-Level Subtitles (`src/remotion/components/Subtitles.tsx`)

```typescript
import { useCurrentFrame, useVideoConfig, interpolate } from 'remotion';

interface Word {
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
              backgroundColor: isActive ? '#FFD700' : '#000',  // Gold when active
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

### 4.6 Remotion Config (`src/remotion/remotion.config.ts`)

```typescript
import { Config } from '@remotion/cli/config';

// Set 9:16 aspect ratio for all compositions
Config.setVideoImageFormat('jpeg');
Config.setConcurrency(8);  // Render 8 frames in parallel
Config.setPixelFormat('yuv420p');  // Best compatibility
Config.setCodec('h264');
Config.setCrf(18);  // High quality (lower = better)
```

### 4.7 Package.json Dependencies

```json
{
  "dependencies": {
    "@remotion/cli": "^4.0.216",
    "@remotion/core": "^4.0.216",
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

- Remotion project structure created
- 9:16 aspect ratio configured (1080x1920)
- Word-level subtitle component implemented
- Auto-reframe with CSS transform

---

## Phase 5: Core Service (30 minutes) - UPDATED

**Goal:** Build ClipperService orchestrator (unchanged, just renumbered).

---

## Phase 6: Cloud Workflow (30 minutes) - UPDATED

**Goal:** GitHub Actions workflow with Remotion integration.

### Updated Workflow Step

```yaml
- name: Render vertical video with Remotion
  run: |
    npx remotion render src/remotion/index.ts ViralShort \
      "output_${{ inputs.worker_id }}.mp4" \
      --props="$(cat segments_${{ inputs.worker_id }}.json)" \
      --concurrency=8 \
      --timeout=120 \
      --pixel-format=yuv420p \
      --crf=18
  env:
    DEEPGRAM_KEY: ${{ secrets.DEEPGRAM_KEY }}
```

---

## Phase 7: AI Scripts (45 minutes) - UPDATED

Now includes all three scripts:
- Deepgram transcription
- Gemini viral analysis
- Telegram delivery

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
│   ├── remotion/               # Phase 4 ⭐ NEW!
│   │   ├── index.ts
│   │   ├── Root.tsx
│   │   ├── ViralShort.tsx
│   │   ├── components/
│   │   │   ├── AutoReframe.tsx
│   │   │   ├── Subtitles.tsx
│   │   │   └── Headline.tsx
│   │   └── remotion.config.ts
│   └── utils/
│       └── polling.ts          # Phase 5
├── scripts/
│   ├── transcribe.js           # Phase 7
│   ├── analyze-viral.js        # Phase 7
│   └── send-telegram.js        # Phase 7
├── package.json                # Phase 1 + 4
├── tsconfig.json               # Phase 1
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
  "@remotion/cli": "^4.0.216",      // ⭐ NEW
  "@remotion/core": "^4.0.216",     // ⭐ NEW
  "remotion": "^4.0.216",           // ⭐ NEW
  "react": "^18.2.0",               // ⭐ NEW
  "react-dom": "^18.2.0"            // ⭐ NEW
}
```

### Dev Dependencies

```json
{
  "@types/node": "^20.10.0",
  "@types/inquirer": "^9.0.0",
  "@types/node-telegram-bot-api": "^0.66.0",
  "@types/react": "^18.2.0",        // ⭐ NEW
  "@types/react-dom": "^18.2.0",    // ⭐ NEW
  "typescript": "^5.3.0"
}
```

---

## GitHub Actions with Remotion (Complete)

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

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Setup FFmpeg
        uses: FedericoCarboni/setup-ffmpeg@v2

      - name: Install yt-dlp
        run: |
          curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o yt-dlp
          chmod +x yt-dlp

      - name: Download YouTube video
        run: |
          ./yt-dlp -f "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]" \
            --merge-output-format mp4 \
            -o "video_${{ inputs.worker_id }}.mp4" \
            "${{ inputs.youtube_url }}"

      - name: Extract audio for transcription
        run: |
          ffmpeg -i "video_${{ inputs.worker_id }}.mp4" \
            -vn -acodec pcm_s16le -ar 16000 -ac 1 \
            "audio_${{ inputs.worker_id }}.wav"

      - name: Transcribe with Deepgram
        run: |
          node scripts/transcribe.js "audio_${{ inputs.worker_id }}.wav" > "transcript_${{ inputs.worker_id }}.json"
        env:
          DEEPGRAM_KEY: ${{ secrets.DEEPGRAM_KEY }}

      - name: Analyze viral moments with Gemini
        run: |
          node scripts/analyze-viral.js "transcript_${{ inputs.worker_id }}.json" > "segments_${{ inputs.worker_id }}.json"
        env:
          GEMINI_KEY: ${{ secrets.GEMINI_KEY }}

      - name: Render vertical video with Remotion  ⭐
        run: |
          npx remotion render src/remotion/index.ts ViralShort \
            "output_${{ inputs.worker_id }}.mp4" \
            --props="$(cat segments_${{ inputs.worker_id }}.json)" \
            --concurrency=8 \
            --timeout=120 \
            --pixel-format=yuv420p \
            --crf=18

      - name: Send to Telegram
        run: |
          node scripts/send-telegram.js "output_${{ inputs.worker_id }}.mp4"
        env:
          TELEGRAM_TOKEN: ${{ secrets.TELEGRAM_TOKEN }}
          CHAT_ID: ${{ secrets.CHAT_ID }}

      - name: Cleanup
        if: always()
        run: |
          rm -f video_${{ inputs.worker_id }}.* audio_${{ inputs.worker_id }}.*
          rm -f transcript_${{ inputs.worker_id }}.* segments_${{ inputs.worker_id }}.*
          rm -f output_${{ inputs.worker_id }}.*
```

---

## Commit Strategy (Updated)

```bash
# Phase 1
git commit -m "chore: initialize project with TypeScript config"

# Phase 2
git commit -m "feat: add CLI layer with Commander.js"

# Phase 3
git commit -m "feat: add GitHub and Telegram adapters"
git commit -m "feat: add configuration management"

# Phase 4 ⭐ NEW
git commit -m "feat: add Remotion project with 9:16 compositions"
git commit -m "feat: implement auto-reframe and word-level subtitles"

# Phase 5
git commit -m "feat: add core ClipperService orchestrator"

# Phase 6
git commit -m "feat: add GitHub Actions workflow with Remotion"

# Phase 7
git commit -m "feat: add AI scripts (Deepgram, Gemini, Telegram)"

# Phase 8
git commit -m "docs: complete README and setup guide"
```

---

## Testing Checklist (Updated)

Before considering implementation complete:

- [ ] `npm run build` succeeds
- [ ] Remotion compositions render locally (test with `npx remotion studio`)
- [ ] CLI triggers GitHub workflow
- [ ] Deepgram produces valid JSON
- [ ] Gemini returns segment data
- [ ] Remotion renders 9:16 video
- [ ] Telegram receives video
- [ ] README has complete setup instructions
- [ ] .env.example includes all variables

---

**Document Version:** 2.0 (with Remotion)
**Last Updated:** 2025-01-29
**Status:** Ready for Implementation

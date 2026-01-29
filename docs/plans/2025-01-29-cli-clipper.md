# CLI Clipper Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a Node.js CLI tool that triggers GitHub Actions to convert YouTube videos into 9:16 viral shorts with auto-generated subtitles, then delivers them via Telegram.

**Architecture:** Modular Monolith with clean separation between CLI layer, domain logic, and external adapters (GitHub, Deepgram, Gemini, Telegram). All heavy computation happens in GitHub Actions (cloud), local CLI only triggers and polls.

**Tech Stack:**
- **CLI:** Node.js 20+, TypeScript, Commander.js
- **Cloud:** GitHub Actions (ubuntu-latest)
- **Video Processing:** FFmpeg, yt-dlp, Remotion
- **AI:** Deepgram API (transcription), Gemini API (viral detection)
- **Delivery:** Telegram Bot API
- **UX:** ora (spinner), chalk (colors)

---

## Project Structure

```
clipper-cli/
├── .github/
│   └── workflows/
│       └── render.yml           # GitHub Actions workflow
├── src/
│   ├── cli/
│   │   └── index.ts             # Commander.js entry point
│   ├── core/
│   │   └── ClipperService.ts    # Domain logic
│   ├── adapters/
│   │   ├── GitHubAdapter.ts     # Octokit wrapper
│   │   ├── TelegramAdapter.ts   # Telegram bot wrapper
│   │   └── config.ts            # Config management
│   └── utils/
│       └── polling.ts           # Status polling logic
├── scripts/
│   ├── transcribe.js            # Deepgram transcription
│   ├── analyze-viral.js         # Gemini viral analysis
│   ├── send-telegram.js         # Telegram delivery
│   └── smart-crop.js            # Subject detection (optional)
├── package.json
├── tsconfig.json
└── README.md
```

---

## Task 1: Project Initialization

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `.gitignore`
- Create: `README.md`

**Step 1: Create package.json**

```json
{
  "name": "clipper-cli",
  "version": "1.0.0",
  "description": "CLI tool to convert YouTube videos into viral 9:16 shorts",
  "type": "module",
  "main": "dist/cli/index.js",
  "bin": {
    "clipper": "./dist/cli/index.js"
  },
  "scripts": {
    "build": "tsc",
    "dev": "tsc && node dist/cli/index.js",
    "start": "node dist/cli/index.js"
  },
  "keywords": ["cli", "youtube", "video", "shorts"],
  "author": "",
  "license": "MIT",
  "dependencies": {
    "@octokit/rest": "^21.0.0",
    "chalk": "^5.3.0",
    "commander": "^12.0.0",
    "inquirer": "^9.2.0",
    "node-telegram-bot-api": "^0.66.0",
    "ora": "^8.0.0"
  },
  "devDependencies": {
    "@types/inquirer": "^9.0.0",
    "@types/node": "^20.10.0",
    "@types/node-telegram-bot-api": "^0.66.0",
    "typescript": "^5.3.0"
  }
}
```

**Step 2: Create tsconfig.json**

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
    "declaration": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

**Step 3: Create .gitignore**

```
node_modules/
dist/
.env
*.log
.DS_Store
```

**Step 4: Create README.md**

```markdown
# Clipper CLI

Convert YouTube videos into viral 9:16 shorts with AI-generated subtitles.

## Setup

1. Clone this repository
2. Run `npm install`
3. Configure GitHub Secrets (see below)
4. Run `npm run build`

## GitHub Secrets Required

Add these to your repository Settings → Secrets:

- `DEEPGRAM_KEY` - Deepgram API key
- `GEMINI_KEY` - Google Gemini API key
- `TELEGRAM_TOKEN` - Telegram bot token
- `CHAT_ID` - Your Telegram chat ID
- `GH_PAT` - GitHub Personal Access Token (for workflow dispatch)

## Usage

```bash
clipper "https://youtube.com/watch?v=xxx"
```

## Architecture

- Local CLI triggers GitHub Actions workflow
- All processing happens in the cloud (FREE!)
- Result delivered via Telegram
```

**Step 5: Initialize git and commit initial setup**

```bash
git init
git add .
git commit -m "chore: initialize project with package.json and tsconfig"
```

---

## Task 2: CLI Entry Point with Commander.js

**Files:**
- Create: `src/cli/index.ts`

**Step 1: Write the CLI entry point**

```typescript
#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { ClipperService } from '../core/ClipperService.js';
import { loadConfig } from '../adapters/config.js';

const program = new Command();

program
  .name('clipper')
  .description('Convert YouTube videos into viral 9:16 shorts')
  .version('1.0.0')
  .argument('<url>', 'YouTube URL to process')
  .option('-w, --watch', 'Watch processing progress', true)
  .action(async (url: string, options) => {
    console.log(chalk.cyan('\n🎬 Clipper CLI - YouTube to 9:16 Shorts\n'));

    const config = loadConfig();
    const service = new ClipperService(config);

    try {
      await service.process(url, options.watch);
    } catch (error) {
      console.error(chalk.red(`\n❌ Error: ${error.message}\n`));
      process.exit(1);
    }
  });

program.parse();
```

**Step 2: Build and test CLI structure**

```bash
npm run build
node dist/cli/index.js --help
```

Expected output: Help text showing clipper command

**Step 3: Commit**

```bash
git add src/cli/
git commit -m "feat: add CLI entry point with Commander.js"
```

---

## Task 3: Configuration Management

**Files:**
- Create: `src/adapters/config.ts`

**Step 1: Write config loader**

```typescript
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface ClipperConfig {
  github: {
    owner: string;
    repo: string;
    workflowId: string;
    token: string;
  };
  telegram: {
    token: string;
    chatId: string;
  };
}

export function loadConfig(): ClipperConfig {
  // Check for .env file or environment variables
  return {
    github: {
      owner: process.env.GITHUB_OWNER || process.env.GITHUB_REPOSITORY?.split('/')[0] || '',
      repo: process.env.GITHUB_REPO || process.env.GITHUB_REPOSITORY?.split('/')[1] || '',
      workflowId: 'render.yml',
      token: process.env.GH_PAT || ''
    },
    telegram: {
      token: process.env.TELEGRAM_TOKEN || '',
      chatId: process.env.CHAT_ID || ''
    }
  };
}

export function validateConfig(config: ClipperConfig): void {
  if (!config.github.token) {
    throw new Error('GH_PAT environment variable is required');
  }
  if (!config.github.owner || !config.github.repo) {
    throw new Error('GITHUB_REPOSITORY or GITHUB_OWNER/GITHUB_REPO environment variables required');
  }
  if (!config.telegram.token) {
    throw new Error('TELEGRAM_TOKEN environment variable is required');
  }
  if (!config.telegram.chatId) {
    throw new Error('CHAT_ID environment variable is required');
  }
}
```

**Step 2: Create .env.example**

```
# GitHub
GITHUB_OWNER=your-username
GITHUB_REPO=your-repo-name
GH_PAT=your_personal_access_token

# Telegram
TELEGRAM_TOKEN=your_bot_token
CHAT_ID=your_chat_id
```

**Step 3: Build and test**

```bash
npm run build
```

**Step 4: Commit**

```bash
git add src/adapters/config.ts .env.example
git commit -m "feat: add configuration management with env variables"
```

---

## Task 4: GitHub Adapter (Octokit Wrapper)

**Files:**
- Create: `src/adapters/GitHubAdapter.ts`

**Step 1: Write GitHub adapter**

```typescript
import { Octokit } from '@octokit/rest';
import type { RestEndpointMethodTypes } from '@octokit/plugin-rest-endpoint-methods';

export interface WorkflowDispatchOptions {
  youtubeUrl: string;
  workerId: string;
}

export interface WorkflowRunStatus {
  id: number;
  status: 'queued' | 'in_progress' | 'completed';
  conclusion: 'success' | 'failure' | null;
  url: string;
}

export class GitHubAdapter {
  private octokit: Octokit;
  private owner: string;
  private repo: string;
  private workflowId: string;

  constructor(owner: string, repo: string, workflowId: string, token: string) {
    this.octokit = new Octokit({ auth: token });
    this.owner = owner;
    this.repo = repo;
    this.workflowId = workflowId;
  }

  async triggerWorkflow(options: WorkflowDispatchOptions): Promise<void> {
    await this.octokit.rest.actions.createWorkflowDispatch({
      owner: this.owner,
      repo: this.repo,
      workflow_id: this.workflowId,
      ref: 'main',
      inputs: {
        youtube_url: options.youtubeUrl,
        worker_id: options.workerId
      }
    });
  }

  async getRunStatus(workerId: string): Promise<WorkflowRunStatus | null> {
    const { data } = await this.octokit.rest.actions.listWorkflowRuns({
      owner: this.owner,
      repo: this.repo,
      workflow_id: this.workflowId,
      per_page: 10
    });

    // Find run with matching worker_id in name
    const run = data.workflow_runs.find(
      r => r.name.includes(workerId) ||
           (r.event === 'workflow_dispatch' && new Date(r.created_at) > new Date(Date.now() - 300000))
    );

    if (!run) return null;

    return {
      id: run.id,
      status: run.status as any,
      conclusion: run.conclusion as any,
      url: run.html_url
    };
  }

  async getWorkflowLogs(runId: number): Promise<string> {
    const { data } = await this.octokit.rest.actions.downloadWorkflowRunLogs({
      owner: this.owner,
      repo: this.repo,
      run_id: runId
    });
    return data.url;
  }
}
```

**Step 2: Build**

```bash
npm run build
```

**Step 3: Commit**

```bash
git add src/adapters/GitHubAdapter.ts
git commit -m "feat: add GitHub adapter with workflow dispatch and polling"
```

---

## Task 5: Telegram Adapter

**Files:**
- Create: `src/adapters/TelegramAdapter.ts`

**Step 1: Write Telegram adapter**

```typescript
import TelegramBot from 'node-telegram-bot-api';

export interface VideoDeliveryOptions {
  videoPath: string;
  caption?: string;
  duration?: number;
}

export class TelegramAdapter {
  private bot: TelegramBot;
  private chatId: string;

  constructor(token: string, chatId: string) {
    this.bot = new TelegramBot(token, { polling: false });
    this.chatId = chatId;
  }

  async sendVideo(options: VideoDeliveryOptions): Promise<void> {
    const { videoPath, caption, duration } = options;

    await this.bot.sendVideo(this.chatId, videoPath, {
      caption: caption || 'Your viral short is ready! 🎬',
      duration: duration,
      parse_mode: 'HTML'
    });
  }

  async sendMessage(text: string): Promise<void> {
    await this.bot.sendMessage(this.chatId, text, { parse_mode: 'HTML' });
  }

  async sendProgress(message: string): Promise<void> {
    await this.sendMessage(`⏳ ${message}`);
  }

  async sendSuccess(message: string): Promise<void> {
    await this.sendMessage(`✅ ${message}`);
  }

  async sendError(message: string): Promise<void> {
    await this.sendMessage(`❌ ${message}`);
  }
}
```

**Step 2: Build**

```bash
npm run build
```

**Step 3: Commit**

```bash
git add src/adapters/TelegramAdapter.ts
git commit -m "feat: add Telegram adapter for video delivery"
```

---

## Task 6: Polling Utility with ora Spinner

**Files:**
- Create: `src/utils/polling.ts`

**Step 1: Write polling utility**

```typescript
import ora, { Ora } from 'ora';
import chalk from 'chalk';

export interface PollingOptions<T> {
  interval: number;
  timeout: number;
  onTick: () => Promise<T | null>;
  isComplete: (result: T) => boolean;
  onSuccess: (result: T) => void;
  onError?: (error: Error) => void;
}

export async function pollWithSpinner<T>(
  initialMessage: string,
  options: PollingOptions<T>
): Promise<T> {
  const spinner = ora({
    text: initialMessage,
    spinner: 'dots',
    color: 'cyan'
  }).start();

  const startTime = Date.now();
  let lastResult: T | null = null;

  try {
    while (Date.now() - startTime < options.timeout) {
      lastResult = await options.onTick();

      if (lastResult && options.isComplete(lastResult)) {
        spinner.succeed(chalk.green('Processing complete!'));
        options.onSuccess(lastResult);
        return lastResult;
      }

      // Update spinner text based on result
      if (lastResult) {
        spinner.text = formatProgress(lastResult);
      }

      await sleep(options.interval);
    }

    spinner.fail(chalk.red('Timeout - processing took too long'));
    throw new Error('Polling timeout');
  } catch (error) {
    spinner.fail(chalk.red(`Error: ${error.message}`));
    if (options.onError) {
      options.onError(error as Error);
    }
    throw error;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function formatProgress(result: any): string {
  if (result.progress) {
    return `Processing... ${result.progress}%`;
  }
  if (result.status) {
    return `Status: ${chalk.cyan(result.status)}`;
  }
  return 'Processing...';
}
```

**Step 2: Build**

```bash
npm run build
```

**Step 3: Commit**

```bash
git add src/utils/polling.ts
git commit -m "feat: add polling utility with ora spinner"
```

---

## Task 7: Core Clipper Service

**Files:**
- Create: `src/core/ClipperService.ts`

**Step 1: Write ClipperService**

```typescript
import chalk from 'chalk';
import { v4 as uuidv4 } from 'uuid';
import { GitHubAdapter, WorkflowRunStatus } from '../adapters/GitHubAdapter.js';
import { TelegramAdapter } from '../adapters/TelegramAdapter.js';
import { pollWithSpinner } from '../utils/polling.js';
import type { ClipperConfig } from '../adapters/config.js';

export class ClipperService {
  private github: GitHubAdapter;
  private telegram: TelegramAdapter;
  private config: ClipperConfig;

  constructor(config: ClipperConfig) {
    this.config = config;
    this.github = new GitHubAdapter(
      config.github.owner,
      config.github.repo,
      config.github.workflowId,
      config.github.token
    );
    this.telegram = new TelegramAdapter(
      config.telegram.token,
      config.telegram.chatId
    );
  }

  async process(youtubeUrl: string, watch: boolean): Promise<void> {
    const workerId = `clipper-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    console.log(chalk.gray(`  Worker ID: ${workerId}`));
    console.log(chalk.gray(`  URL: ${youtubeUrl}\n`));

    // Step 1: Trigger workflow
    await this.triggerWorkflow(youtubeUrl, workerId);

    if (!watch) {
      console.log(chalk.green('\n✅ Workflow triggered! Check GitHub Actions for progress.\n'));
      return;
    }

    // Step 2: Poll for completion
    await this.waitForCompletion(workerId);

    // Step 3: Notify completion
    await this.telegram.sendSuccess('Your viral short is ready! Check Telegram for the video.\n');
  }

  private async triggerWorkflow(url: string, workerId: string): Promise<void> {
    const spinner = ora('Triggering GitHub Actions workflow...').start();

    try {
      await this.github.triggerWorkflow({
        youtubeUrl: url,
        workerId: workerId
      });
      spinner.succeed(chalk.green('Workflow triggered!'));
    } catch (error) {
      spinner.fail(chalk.red('Failed to trigger workflow'));
      throw error;
    }
  }

  private async waitForCompletion(workerId: string): Promise<void> {
    console.log(chalk.cyan('Waiting for processing to complete...\n'));

    await pollWithSpinner<WorkflowRunStatus>(
      'Initializing...',
      {
        interval: 5000,  // Poll every 5 seconds
        timeout: 3600000, // 1 hour max
        onTick: async () => {
          return await this.github.getRunStatus(workerId);
        },
        isComplete: (result) => {
          return result.status === 'completed';
        },
        onSuccess: async (result) => {
          if (result.conclusion === 'success') {
            console.log(chalk.green(`\n  View run: ${result.url}\n`));
          } else {
            throw new Error('Workflow failed - check logs for details');
          }
        }
      }
    );
  }
}
```

**Step 2: Build**

```bash
npm run build
```

**Step 3: Commit**

```bash
git add src/core/ClipperService.ts
git commit -m "feat: add core ClipperService with workflow orchestration"
```

---

## Task 8: GitHub Actions Workflow

**Files:**
- Create: `.github/workflows/render.yml`

**Step 1: Create the workflow file**

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

env:
  YOUTUBE_URL: ${{ inputs.youtube_url }}
  WORKER_ID: ${{ inputs.worker_id }}

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
        run: |
          npm ci

      - name: Setup FFmpeg
        uses: FedericoCarboni/setup-ffmpeg@v2

      - name: Install yt-dlp
        run: |
          curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o yt-dlp
          chmod +x yt-dlp

      - name: Download YouTube video
        run: |
          echo "::group::Download video"
          ./yt-dlp -f "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]" \
            --merge-output-format mp4 \
            -o "video_${{ inputs.worker_id }}.mp4" \
            "${{ inputs.youtube_url }}"
          echo "::endgroup::"

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

      - name: Render vertical video
        run: |
          npx remotion@4.0 render src/remotion/index.ts ViralShort \
            "output_${{ inputs.worker_id }}.mp4" \
            --props="$(cat segments_${{ inputs.worker_id }}.json)" \
            --concurrency=8 \
            --timeout=120

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

**Step 2: Commit workflow**

```bash
git add .github/workflows/
git commit -m "feat: add GitHub Actions workflow for video processing"
```

---

## Task 9: Deepgram Transcription Script

**Files:**
- Create: `scripts/transcribe.js`

**Step 1: Write transcription script**

```javascript
#!/usr/bin/env node

import fs from 'fs';
import https from 'https';

const AUDIO_FILE = process.argv[2];
const DEEPGRAM_KEY = process.env.DEEPGRAM_KEY;

if (!AUDIO_FILE) {
  console.error('Usage: node transcribe.js <audio-file>');
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
          reject(new Error(`Deepgram error: ${res.statusCode}`));
        }
      });
    });

    req.on('error', reject);
    req.write(audioBuffer);
    req.end();
  });
}

transcribe()
  .then(result => console.log(JSON.stringify(result, null, 2)))
  .catch(err => {
    console.error(err.message);
    process.exit(1);
  });
```

**Step 2: Make executable and commit**

```bash
git add scripts/transcribe.js
git commit -m "feat: add Deepgram transcription script"
```

---

## Task 10: Gemini Viral Analysis Script

**Files:**
- Create: `scripts/analyze-viral.js`

**Step 1: Write viral analysis script**

```javascript
#!/usr/bin/env node

import fs from 'fs';
import https from 'https';

const TRANSCRIPT_FILE = process.argv[2];
const GEMINI_KEY = process.env.GEMINI_KEY;

if (!TRANSCRIPT_FILE) {
  console.error('Usage: node analyze-viral.js <transcript.json>');
  process.exit(1);
}

async function analyzeViralMoments(transcript) {
  // Extract full text from Deepgram response
  const fullText = transcript.results?.channels?.[0]?.alternatives?.[0]?.transcript
    || transcript.utterances?.map(u => u.transcript).join(' ')
    || '';

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
    headers: {
      'Content-Type': 'application/json'
    }
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
            // Extract JSON from markdown code blocks if present
            const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/\{[\s\S]*\}/);
            resolve(JSON.parse(jsonMatch ? jsonMatch[1] : text));
          } catch {
            resolve({ segments: [] });
          }
        } else {
          reject(new Error(`Gemini error: ${res.statusCode}`));
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

const transcript = JSON.parse(fs.readFileSync(TRANSCRIPT_FILE, 'utf8'));

analyzeViralMoments(transcript)
  .then(result => console.log(JSON.stringify(result, null, 2)))
  .catch(err => {
    console.error(err.message);
    process.exit(1);
  });
```

**Step 2: Commit**

```bash
git add scripts/analyze-viral.js
git commit -m "feat: add Gemini viral analysis script"
```

---

## Task 11: Telegram Delivery Script

**Files:**
- Create: `scripts/send-telegram.js`

**Step 1: Write Telegram delivery script**

```javascript
#!/usr/bin/env node

import fs from 'fs';
import https from 'https';
import FormData from 'form-data';

const VIDEO_FILE = process.argv[2];
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const CHAT_ID = process.env.CHAT_ID;

if (!VIDEO_FILE) {
  console.error('Usage: node send-telegram.js <video-file.mp4>');
  process.exit(1);
}

async function sendVideo(filePath) {
  const form = new FormData();
  form.append('chat_id', CHAT_ID);
  form.append('video', fs.createReadStream(filePath));
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
          reject(new Error(`Telegram error: ${res.statusCode} - ${data}`));
        }
      });
    });

    req.on('error', reject);
    form.pipe(req);
  });
}

sendVideo(VIDEO_FILE)
  .then(() => console.log('Video sent to Telegram successfully!'))
  .catch(err => {
    console.error(err.message);
    process.exit(1);
  });
```

**Step 2: Add form-data dependency**

```bash
npm install form-data
npm install --save-dev @types/form-data
```

**Step 3: Update package.json**

```json
"dependencies": {
  "form-data": "^4.0.0",
  // ... existing dependencies
}
```

**Step 4: Commit**

```bash
git add scripts/send-telegram.js package.json package-lock.json
git commit -m "feat: add Telegram delivery script"
```

---

## Task 12: Add uuid dependency

**Files:**
- Modify: `package.json`
- Modify: `src/core/ClipperService.ts`

**Step 1: Add uuid to dependencies**

```bash
npm install uuid
npm install --save-dev @types/uuid
```

**Step 2: Update import in ClipperService**

```typescript
import { randomUUID } from 'crypto';

// Replace v4 as uuidv4 with:
const workerId = `clipper-${Date.now()}-${randomUUID().slice(0, 8)}`;
```

**Step 3: Commit**

```bash
git add package.json package-lock.json src/core/ClipperService.ts
git commit -m "fix: use built-in crypto.randomUUID instead of uuid package"
```

---

## Task 13: Final Build and Test

**Files:**
- None (build and verify)

**Step 1: Build the project**

```bash
npm run build
```

Expected: No TypeScript errors, dist/ directory created

**Step 2: Verify CLI help**

```bash
node dist/cli/index.js --help
```

Expected output:
```
Usage: clipper [options] [url]

Convert YouTube videos into viral 9:16 shorts

Arguments:
  url                     YouTube URL to process

Options:
  -w, --watch              Watch processing progress (default: true)
  -h, --help               display help for command
  -V, --version            output version number
```

**Step 3: Create test command**

```bash
node dist/cli/index.js "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
```

Expected: CLI prompts for missing env variables or triggers workflow (if configured)

**Step 4: Commit final version**

```bash
git add .
git commit -m "chore: final build verification complete"
```

---

## Task 14: Documentation Completion

**Files:**
- Update: `README.md`

**Step 1: Complete README with full setup guide**

```markdown
# Clipper CLI

Convert YouTube videos into viral 9:16 shorts with AI-generated subtitles.

## Features

- 🎬 **Cloud Processing**: All heavy computation in GitHub Actions (FREE!)
- 🤖 **AI-Powered**: Deepgram transcription + Gemini viral detection
- 📱 **Auto-Delivery**: Videos sent directly to Telegram
- 💻 **Zero Local Load**: Your laptop does nothing but trigger and wait

## Quick Start

### 1. Clone and Install

```bash
git clone <your-repo>
cd clipper-cli
npm install
npm run build
```

### 2. Get Required API Keys

| Service | Link | Purpose |
|---------|------|---------|
| Deepgram | https://deepgram.com | Transcription with timestamps |
| Gemini | https://ai.google.dev | Viral moment detection |
| Telegram Bot | @BotFather | Video delivery |
| GitHub PAT | https://github.com/settings/tokens | Trigger workflows |

### 3. Configure GitHub Secrets

Go to your repository → Settings → Secrets and variables → Actions:

```
DEEPGRAM_KEY=your_deepgram_api_key
GEMINI_KEY=your_gemini_api_key
TELEGRAM_TOKEN=your_bot_token
CHAT_ID=your_telegram_chat_id
GH_PAT=your_github_personal_access_token
```

To find your CHAT_ID, message @userinfobot on Telegram.

### 4. Configure Environment

```bash
cp .env.example .env
# Edit .env with your values
```

### 5. Run

```bash
npm start "https://youtube.com/watch?v=xxx"
```

## Architecture

```
┌─────────────┐     trigger      ┌────────────────┐
│   Laptop    │ ───────────────> │ GitHub Actions │
│   (CLI)     │ <────poll────── │  (Processing)  │
└─────────────┘                  └────────────────┘
                                          │
                                          ▼
                                    ┌──────────┐
                                    │ Telegram │
                                    └──────────┘
```

## Development

```bash
npm run dev    # Build + run
npm run build  # TypeScript compilation
```

## License

MIT
```

**Step 2: Commit documentation**

```bash
git add README.md
git commit -m "docs: complete README with full setup guide"
```

---

## Summary

This implementation plan creates a complete CLI Clipper tool with:

- **Modular Monolith** architecture (simple, maintainable)
- **Clean separation** between CLI, domain, and adapters
- **GitHub Actions** for all heavy lifting (FREE tier)
- **AI-powered** viral moment detection
- **Telegram delivery** of final videos

**Total commits:** ~14 atomic commits
**Estimated implementation time:** 2-3 hours for a skilled developer

---

## Post-Implementation Checklist

- [ ] All TypeScript tests pass
- [ ] CLI help text displays correctly
- [ ] GitHub Actions workflow runs successfully
- [ ] Deepgram transcription produces valid JSON
- [ ] Gemini analysis returns segments
- [ ] Telegram bot receives video
- [ ] Polling spinner works as expected
- [ ] Error handling for missing API keys
- [ ] README has complete setup instructions

---

**Plan complete and saved to `docs/plans/2025-01-29-cli-clipper.md`.**

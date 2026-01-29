# CLI Clipper - Phase Implementation Plan

> **Project:** YouTube to 9:16 Viral Shorts Generator
> **Architecture:** Modular Monolith with GitHub Actions Cloud Processing
> **Est. Total Time:** 3-4 hours for skilled developer

---

## Overview

Implementation dibagi menjadi **5 Phase** yang dapat dieksekusi secara berurutan:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              PHASE BREAKDOWN                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  PHASE 1: FOUNDATION        [30 min]   Project setup, TypeScript config     │
│  PHASE 2: CLI LAYER          [45 min]   Commander.js, entry point           │
│  PHASE 3: ADAPTERS           [60 min]   GitHub, Telegram, Config           │
│  PHASE 4: CLOUD WORKFLOW     [45 min]   GitHub Actions YAML                 │
│  PHASE 5: AI SCRIPTS         [30 min]   Deepgram, Gemini integration       │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Foundation (30 minutes)

**Goal:** Setup project structure, TypeScript, and build pipeline.

### Tasks Checklist

- [ ] **Task 1.1:** Initialize npm project with package.json
- [ ] **Task 1.2:** Configure TypeScript (tsconfig.json)
- [ ] **Task 1.3:** Setup project folder structure
- [ ] **Task 1.4:** Configure .gitignore
- [ ] **Task 1.5:** Initialize git repository
- [ ] **Task 1.6:** Verify build pipeline

### Output Artifacts

```
clipper-cli/
├── package.json          ✅ Created
├── tsconfig.json         ✅ Created
├── .gitignore            ✅ Created
├── src/                  ✅ Created (empty)
├── scripts/              ✅ Created (empty)
├── .github/              ✅ Created (empty)
└── dist/                 ✅ Created (by build)
```

### Success Criteria

- `npm run build` completes without errors
- `tsc` compiles successfully
- Folder structure matches design

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

### Output Artifacts

```typescript
// src/cli/index.ts
import { Command } from 'commander';
import chalk from 'chalk';

const program = new Command();
program
  .name('clipper')
  .description('YouTube to 9:16 Viral Shorts Generator')
  .version('1.0.0')
  .argument('<url>', 'YouTube URL')
  .action(processVideo);
```

### Success Criteria

- `npm run build` && `node dist/cli/index.js --help` works
- Help text displays correctly
- No TypeScript errors

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

**Output:**
```typescript
export interface ClipperConfig {
  github: { owner, repo, workflowId, token };
  telegram: { token, chatId };
}
```

### 3.2 GitHub Adapter (25 min)

**Tasks:**
- [ ] Create `src/adapters/GitHubAdapter.ts`
- [ ] Implement triggerWorkflow() method
- [ ] Implement getRunStatus() method
- [ ] Add worker ID generation
- [ ] Add error handling

**Output:**
```typescript
export class GitHubAdapter {
  async triggerWorkflow(options: WorkflowDispatchOptions): Promise<void>
  async getRunStatus(workerId: string): Promise<WorkflowRunStatus | null>
}
```

### 3.3 Telegram Adapter (15 min)

**Tasks:**
- [ ] Create `src/adapters/TelegramAdapter.ts`
- [ ] Implement sendVideo() method
- [ ] Implement sendMessage() method
- [ ] Add progress notifications

**Output:**
```typescript
export class TelegramAdapter {
  async sendVideo(options: VideoDeliveryOptions): Promise<void>
  async sendProgress(message: string): Promise<void>
}
```

### Success Criteria

- All adapters compile without errors
- TypeScript interfaces defined
- Environment variables documented

---

## Phase 4: Core & Cloud Workflow (45 minutes)

**Goal:** Build domain logic and GitHub Actions workflow.

### 4.1 Core Service (20 min)

**Tasks:**
- [ ] Create `src/core/ClipperService.ts`
- [ ] Implement process() orchestrator
- [ ] Add triggerWorkflow() step
- [ ] Add waitForCompletion() with polling
- [ ] Wire up all adapters

**Output:**
```typescript
export class ClipperService {
  async process(youtubeUrl: string, watch: boolean): Promise<void>
}
```

### 4.2 Polling Utility (10 min)

**Tasks:**
- [ ] Create `src/utils/polling.ts`
- [ ] Implement pollWithSpinner() function
- [ ] Add ora spinner integration
- [ ] Add timeout handling

### 4.3 GitHub Actions Workflow (15 min)

**Tasks:**
- [ ] Create `.github/workflows/render.yml`
- [ ] Define workflow_dispatch inputs
- [ ] Add FFmpeg and yt-dlp setup
- [ ] Configure job steps
- [ ] Add cleanup step

**Output:**
```yaml
name: Clipper Render ${{ inputs.worker_id }}
on:
  workflow_dispatch:
    inputs:
      youtube_url: { required: true }
      worker_id: { required: true }
```

### Success Criteria

- Core service compiles
- Workflow YAML is valid
- All adapters wired correctly

---

## Phase 5: AI Scripts (30 minutes)

**Goal:** Build transcription and viral detection scripts.

### 5.1 Deepgram Transcription (15 min)

**Tasks:**
- [ ] Create `scripts/transcribe.js`
- [ ] Implement audio file reading
- [ ] Add Deepgram API call
- [ ] Parse and output JSON response
- [ ] Add error handling

**Output:**
```javascript
// Input: audio.wav
// Output: { utterances: [{ start, end, transcript, words: [...] }] }
```

### 5.2 Gemini Viral Analysis (15 min)

**Tasks:**
- [ ] Create `scripts/analyze-viral.js`
- [ ] Read transcript JSON
- [ ] Build prompt for Gemini
- [ ] Call Gemini API
- [ ] Parse JSON response

**Output:**
```javascript
// Input: transcript.json
// Output: { segments: [{ start, end, headline, reason }] }
```

### Success Criteria

- Scripts run standalone
- Output valid JSON
- API calls successful (with real keys)

---

## Phase 6: Telegram Delivery Script (15 minutes)

**Goal:** Build video delivery to Telegram.

### Tasks Checklist

- [ ] Create `scripts/send-telegram.js`
- [ ] Implement video file upload
- [ ] Add caption support
- [ ] Add error handling
- [ ] Install form-data dependency

**Output:**
```javascript
node scripts/send-telegram.js video.mp4
// Sends video to configured Telegram chat
```

---

## Phase 7: Integration & Testing (30 minutes)

**Goal:** End-to-end testing and documentation.

### Tasks Checklist

- [ ] **Task 7.1:** Full build verification
- [ ] **Task 7.2:** CLI dry-run test
- [ ] **Task 7.3:** Complete README.md
- [ ] **Task 7.4:** Create .env.example with all variables
- [ ] **Task 7.5:** Add setup instructions

### Documentation Requirements

```markdown
# README.md sections:
1. Project overview
2. Features list
3. Quick start guide
4. Required API keys
5. GitHub Secrets setup
6. Environment configuration
7. Usage examples
8. Architecture diagram
9. Development commands
10. Troubleshooting
```

---

## Dependency Summary

### Production Dependencies

```json
{
  "@octokit/rest": "^21.0.0",      // GitHub API
  "chalk": "^5.3.0",                // Terminal colors
  "commander": "^12.0.0",           // CLI framework
  "inquirer": "^9.2.0",             // Interactive prompts
  "node-telegram-bot-api": "^0.66.0", // Telegram Bot
  "ora": "^8.0.0",                  // Spinner
  "form-data": "^4.0.0"             // Multipart uploads
}
```

### Dev Dependencies

```json
{
  "@types/node": "^20.10.0",
  "@types/inquirer": "^9.0.0",
  "@types/node-telegram-bot-api": "^0.66.0",
  "typescript": "^5.3.0"
}
```

---

## GitHub Secrets Required

```
┌────────────────────────────────────────────────────────────────┐
│  SECRET NAME           PURPOSE                                │
├────────────────────────────────────────────────────────────────┤
│  DEEPGRAM_KEY         Deepgram Speech-to-Text API             │
│  GEMINI_KEY           Google Gemini API for viral analysis    │
│  TELEGRAM_TOKEN       Telegram Bot Token                      │
│  CHAT_ID              Your Telegram Chat ID                   │
│  GH_PAT               GitHub Personal Access Token            │
└────────────────────────────────────────────────────────────────┘
```

---

## Environment Variables (.env)

```bash
# GitHub Configuration
GITHUB_OWNER=your-username
GITHUB_REPO=your-repo-name
GH_PAT=ghp_xxxxxxxxxxxxxxxxxxxx

# Telegram Configuration
TELEGRAM_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
CHAT_ID=123456789
```

---

## Commit Strategy

Each phase should result in atomic commits:

```bash
# Phase 1
git commit -m "chore: initialize project with TypeScript config"

# Phase 2
git commit -m "feat: add CLI layer with Commander.js"

# Phase 3
git commit -m "feat: add GitHub and Telegram adapters"
git commit -m "feat: add configuration management"

# Phase 4
git commit -m "feat: add core ClipperService"
git commit -m "feat: add GitHub Actions workflow"

# Phase 5
git commit -m "feat: add Deepgram transcription script"
git commit -m "feat: add Gemini viral analysis script"

# Phase 6
git commit -m "feat: add Telegram delivery script"

# Phase 7
git commit -m "docs: complete README and setup guide"
```

---

## Testing Checklist

Before considering implementation complete:

- [ ] `npm run build` succeeds
- [ ] `node dist/cli/index.js --help` displays help
- [ ] CLI validates missing environment variables
- [ ] GitHub workflow YAML is valid
- [ ] All TypeScript files compile
- [ ] No unused dependencies
- [ ] README has complete setup instructions
- [ ] .env.example is provided

---

## Post-Implementation Phase (Optional)

### Future Enhancements

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  PHASE 8: SMART CROP (Optional)                                             │
│  • Add MediaPipe/TensorFlow for subject detection                           │
│  • Implement dynamic crop path smoothing                                    │
│  • Add Remotion composition for video rendering                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  PHASE 9: ADVANCED FEATURES (Optional)                                     │
│  • Batch processing (multiple URLs)                                        │
│  • Custom subtitle styling (Hormozi-style presets)                         │
│  • Progress webhook instead of polling                                     │
│  • Video quality presets                                                   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Quick Reference

### File Structure

```
clipper-cli/
├── .github/workflows/
│   └── render.yml              # Phase 4
├── src/
│   ├── cli/
│   │   └── index.ts            # Phase 2
│   ├── core/
│   │   └── ClipperService.ts   # Phase 4
│   ├── adapters/
│   │   ├── config.ts           # Phase 3
│   │   ├── GitHubAdapter.ts    # Phase 3
│   │   └── TelegramAdapter.ts  # Phase 3
│   └── utils/
│       └── polling.ts          # Phase 4
├── scripts/
│   ├── transcribe.js           # Phase 5
│   ├── analyze-viral.js        # Phase 5
│   └── send-telegram.js        # Phase 6
├── package.json                # Phase 1
├── tsconfig.json               # Phase 1
├── .gitignore                  # Phase 1
├── .env.example                # Phase 7
└── README.md                   # Phase 7
```

### Command Reference

```bash
# Development
npm install                     # Install dependencies
npm run build                   # Compile TypeScript
npm run dev                     # Build + run

# Usage
clipper "https://youtube.com/watch?v=xxx"
clipper "https://youtube.com/watch?v=xxx" --watch
clipper "https://youtube.com/watch?v=xxx" --no-watch

# Manual script testing
node scripts/transcribe.js audio.wav
node scripts/analyze-viral.js transcript.json
node scripts/send-telegram.js video.mp4
```

---

**Document Version:** 1.0
**Last Updated:** 2025-01-29
**Status:** Ready for Implementation

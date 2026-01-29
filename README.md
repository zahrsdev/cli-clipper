# CLI Clipper 🎬

Convert YouTube videos into viral 9:16 shorts with AI-generated subtitles.

All heavy processing happens in the cloud via GitHub Actions - **0% local CPU load**.

## Features

- 🎥 **Auto-reframe**: Converts 16:9 landscape videos to 9:16 portrait format
- 🎤 **Word-level subtitles**: Karaoke-style synced captions using Deepgram AI
- 🤖 **Viral detection**: AI finds the best moments using Google Gemini
- ☁️ **Cloud rendering**: GitHub Actions does all the heavy lifting
- 📱 **Telegram delivery**: Get your shorts delivered instantly to your phone

## Quick Start

### 1. Clone or Create Repository

```bash
git clone https://github.com/YOUR_USERNAME/clipper-actions.git
cd clipper-actions
npm install
```

### 2. Get API Keys

| Service | Link | Purpose |
|---------|------|---------|
| Deepgram | https://console.deepgram.com | Speech-to-text transcription |
| Gemini | https://ai.google.dev | Viral moment analysis |
| GitHub PAT | https://github.com/settings/tokens | Trigger workflows |

### 3. Set Up Telegram Bot (Optional)

1. Message [@BotFather](https://t.me/BotFather) on Telegram
2. Send `/newbot` and follow instructions
3. Copy the bot token
4. Message [@userinfobot](https://t.me/userinfobot) to get your Chat ID

### 4. Configure Environment

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
# Edit .env with your API keys
```

### 5. Push to GitHub

```bash
git add .
git commit -m "Initial setup"
git push origin main
```

### 6. Add GitHub Secrets

Go to your repository Settings → Secrets and variables → Actions:

- `DEEPGRAM_API_KEY`
- `GEMINI_API_KEY`
- `TELEGRAM_TOKEN` (optional)
- `CHAT_ID` (optional)

## Usage

### Basic Command

```bash
npm run dev https://www.youtube.com/watch?v=example
```

### Watch Progress

```bash
npm run dev https://www.youtube.com/watch?v=example -- --watch
```

### Development

```bash
# Build TypeScript
npm run build

# Run Remotion Studio (preview videos)
npm run remotion:studio
```

## Project Structure

```
clipper-cli/
├── src/
│   ├── cli/           # CLI entry point (Commander.js)
│   ├── adapters/      # External service integrations
│   ├── core/          # Business logic (ClipperService)
│   ├── remotion/      # Video rendering components
│   └── types/         # TypeScript definitions
├── scripts/           # AI processing scripts
├── .github/
│   └── workflows/     # GitHub Actions workflows
└── docs/
    └── plans/         # Implementation plans
```

## Architecture

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│   CLI       │─────▶│ GitHub       │─────▶│   yt-dlp    │
│  (Local)    │      │   Actions    │      │  (Download) │
└─────────────┘      └──────────────┘      └─────────────┘
                            │
                            ▼
                      ┌──────────────┐      ┌─────────────┐
                      │  FFmpeg      │─────▶│  Deepgram   │
                      │(Audio Extract)│     │(Transcribe) │
                      └──────────────┘      └─────────────┘
                            │
                            ▼
                      ┌──────────────┐      ┌─────────────┐
                      │   Gemini     │─────▶│  Remotion   │
                      │(Viral Analysis)│    │  (Render)   │
                      └──────────────┘      └─────────────┘
                                                  │
                                                  ▼
                                            ┌──────────────┐
                                            │  Telegram    │
                                            │  (Delivery)  │
                                            └──────────────┘
```

## How It Works

1. **CLI triggers workflow** → GitHub Actions receives YouTube URL
2. **Download video** → yt-dlp fetches the video
3. **Extract audio** → FFmpeg pulls audio track
4. **Transcribe** → Deepgram creates word-level timestamps
5. **Analyze** → Gemini finds the most viral 30-60 second segment
6. **Render** → Remotion creates 9:16 video with subtitles
7. **Deliver** → Telegram bot sends the final video

## Remotion Components

| Component | Description |
|-----------|-------------|
| `ViralShort` | Main composition for 9:16 video |
| `AutoReframe` | Centers video with smart scaling |
| `Subtitles` | Word-level karaoke captions |
| `Headline` | Viral headline overlay |

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GITHUB_OWNER` | Yes | GitHub username or org |
| `GITHUB_REPO` | Yes | Repository name |
| `GH_PAT` | Yes | GitHub Personal Access Token |
| `DEEPGRAM_API_KEY` | Yes | Deepgram API key |
| `GEMINI_API_KEY` | Yes | Google Gemini API key |
| `TELEGRAM_TOKEN` | No | Telegram bot token |
| `CHAT_ID` | No | Your Telegram chat ID |

## Troubleshooting

### Workflow not triggering

Check your GitHub PAT has `repo` and `workflow` scopes.

### Render timeout

Increase the `timeout` value in `.github/workflows/render.yml`.

### Subtitles out of sync

Deepgram may have timestamp drift. Try re-transcribing.

## License

MIT

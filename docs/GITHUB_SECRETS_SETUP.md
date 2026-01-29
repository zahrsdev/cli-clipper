# GitHub Secrets Setup Guide

This guide will walk you through setting up all required GitHub Secrets for CLI Clipper to work with GitHub Actions.

## Table of Contents

- [Overview](#overview)
- [Required Secrets](#required-secrets)
- [Optional Secrets](#optional-secrets)
- [Adding Secrets to GitHub](#adding-secrets-to-github)
- [Troubleshooting](#troubleshooting)

---

## Overview

CLI Clipper uses GitHub Actions to process videos in the cloud. To enable this, you need to configure several API keys as GitHub Secrets. These secrets allow your workflows to:

- Download videos using yt-dlp
- Transcribe audio with Deepgram AI
- Analyze viral moments with Google Gemini
- Trigger workflows remotely
- Deliver videos via Telegram (optional)

---

## Required Secrets

### 1. DEEPGRAM_API_KEY

**Purpose**: Transcribes audio files into word-level timestamps for synchronized subtitles.

**How to get it**:

1. Go to [https://console.deepgram.com](https://console.deepgram.com)
2. Sign up for a free account (no credit card required)
3. Once logged in, you'll be redirected to the API Keys page
4. Click **"Create API Key"** button
5. Give it a name (e.g., "CLI Clipper")
6. Select scope: **"Global"** or restrict to specific projects
7. Copy the generated API key (starts with `xxxx-xxxx-xxxx-xxxx`)

**Key format**:
```
xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

**Usage limits** (Free tier):
- 200 hours of transcription per month
- Perfect for testing and personal projects

**Verification**:
```bash
# Test your API key locally first
curl -X POST \
  -H "Authorization: Token YOUR_DEEPGRAM_API_KEY" \
  -H "Content-Type: audio/wav" \
  --data-binary @sample.wav \
  "https://api.deepgram.com/v1/listen?model=nova-2"
```

---

### 2. GEMINI_API_KEY

**Purpose**: Analyzes transcribed text to find the most viral 30-60 second segments.

**How to get it**:

1. Go to [https://ai.google.dev](https://ai.google.dev)
2. Click **"Get API Key"** or **"Make a request"**
3. Sign in with your Google account
4. Create a new project or select existing one
5. Generate API key
6. Copy the API key (starts with `AIzaSy...`)

**Key format**:
```
AIzaSyxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Usage limits** (Free tier):
- 15 requests per minute
- 1,500 requests per day
- Sufficient for personal use

**Verification**:
```bash
# Test your API key locally
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"contents":[{"parts":[{"text":"Hello"}]}]}' \
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=YOUR_GEMINI_API_KEY"
```

---

### 3. GH_PAT (GitHub Personal Access Token)

**Purpose**: Allows the CLI to trigger GitHub Actions workflows remotely and monitor their progress.

**How to get it**:

1. Go to [https://github.com/settings/tokens](https://github.com/settings/tokens)
2. Click **"Generate new token"** (select "Generate new token (classic)" if prompted)
3. Give it a descriptive name (e.g., "CLI Clipper")
4. Set expiration (recommend 90 days or No expiration for personal projects)
5. **Crucial**: Select the following scopes:
   - Check **`repo`** - Full control of private repositories
   - Check **`workflow`** - Ability to update GitHub Action workflows
6. Click **"Generate token"** at the bottom
7. **Important**: Copy the token immediately (you won't see it again!)

**Token format**:
```
ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Required scopes explained**:
- `repo`: Allows the CLI to trigger workflows and check their status
- `workflow`: Required for dispatching workflow_run events

**Security note**:
- Never share your PAT publicly
- Rotate it regularly if working in team environments
- Use fine-grained tokens for production if needed

---

## Optional Secrets

### 4. TELEGRAM_TOKEN

**Purpose**: Enables automatic delivery of generated shorts to your Telegram app.

**How to get it**:

1. Open Telegram and search for **@BotFather**
2. Start a chat with BotFather
3. Send command: `/newbot`
4. Follow the prompts:
   - Choose a name for your bot (e.g., "Clipper Bot")
   - Choose a username (must end in 'bot', e.g., "my_clipper_bot")
5. BotFather will respond with your token
6. Copy the token

**Token format**:
```
123456789:ABCdefGHIjklMNOpqrsTUVwxyz
```

**Verification**:
```bash
# Test your bot token
curl -X GET \
  "https://api.telegram.org/botYOUR_TELEGRAM_TOKEN/getMe"
```

---

### 5. CHAT_ID

**Purpose**: Specifies which Telegram chat/user should receive the generated videos.

**How to get it**:

1. Open Telegram and search for **@userinfobot**
2. Start a chat (it will respond automatically)
3. The bot will immediately reply with your User ID
4. Copy the ID

**Chat ID formats**:
- Personal chat: `123456789`
- Group chat: `-1001234567890`

**Alternative method (if @userinfobot is down)**:
1. Send a message to your bot
2. Visit: `https://api.telegram.org/botYOUR_TOKEN/getUpdates`
3. Find `"chat":{"id":123456789}` in the response

**Verification**:
```bash
# Test sending a message
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"chat_id":"YOUR_CHAT_ID","text":"Test from CLI Clipper"}' \
  "https://api.telegram.org/botYOUR_TELEGRAM_TOKEN/sendMessage"
```

---

## Adding Secrets to GitHub

Once you have all your API keys, add them to your GitHub repository:

### Step-by-Step Instructions

1. **Navigate to your repository**:
   - Go to https://github.com/YOUR_USERNAME/clipper-actions
   - Replace `YOUR_USERNAME` and `clipper-actions` with your actual values

2. **Open Settings**:
   - Click the **Settings** tab at the top of the repository

3. **Go to Secrets**:
   - In the left sidebar, find **"Secrets and variables"**
   - Click **Actions**

4. **Add each secret**:
   - Click **"New repository secret"** button
   - For each secret:
     - **Name**: Enter the secret name (exactly as shown below)
     - **Value**: Paste your API key
     - Click **"Add secret"**

5. **Verify all secrets are added**:
   You should see all secrets listed:
   - DEEPGRAM_API_KEY
   - GEMINI_API_KEY
   - GH_PAT
   - TELEGRAM_TOKEN (if using Telegram)
   - CHAT_ID (if using Telegram)

### Visual Reference

The secret names must match **exactly** (case-sensitive):

| Secret Name | Value | Required |
|-------------|-------|----------|
| `DEEPGRAM_API_KEY` | Your Deepgram API key | Yes |
| `GEMINI_API_KEY` | Your Gemini API key | Yes |
| `GH_PAT` | Your GitHub Personal Access Token | Yes |
| `TELEGRAM_TOKEN` | Your Telegram bot token | No |
| `CHAT_ID` | Your Telegram chat ID | No |

### Important Notes

- **Secrets are never revealed** once added (you'll see `***` instead of the actual value)
- **Update secrets carefully**: If you need to change a value, click "Update" and re-enter the entire value
- **Environment-specific**: You can add secrets to different environments (dev, prod) if using environments
- **Repository access**: Secrets are scoped to the repository only

---

## Troubleshooting

### Issue: "Resource not accessible by integration" Error

**Cause**: GitHub Actions doesn't have permission to access secrets.

**Solutions**:
1. Ensure your repository is not a fork (secrets don't work in forks by default)
2. Check Actions permissions: Settings → Actions → General
   - Set "Workflow permissions" to **"Read and write permissions"**
3. Re-add the secrets if they were added before permissions were set

### Issue: Workflow fails with "Invalid API Key"

**Cause**: The API key is incorrect or malformed.

**Solutions**:
1. **Deepgram**: Ensure you copied the entire key (36 chars with hyphens)
2. **Gemini**: Ensure the key starts with `AIzaSy`
3. **GitHub PAT**: Ensure it starts with `ghp_`
4. **Telegram**: Ensure format is `number:letters`
5. Re-add the secret with careful copy-paste (no extra spaces)

### Issue: Deepgram returns "401 Unauthorized"

**Cause**: API key is invalid or expired.

**Solutions**:
1. Go to [https://console.deepgram.com](https://console.deepgram.com)
2. Check if your key is active
3. Create a new key if needed
4. Update the GitHub secret

### Issue: Gemini returns "API key not valid"

**Cause**: Incorrect API key or missing permissions.

**Solutions**:
1. Verify key at [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
2. Ensure Generative Language API is enabled
3. Regenerate key if needed

### Issue: GitHub PAT doesn't trigger workflows

**Cause**: Token is missing `workflow` scope.

**Solutions**:
1. Go to [https://github.com/settings/tokens](https://github.com/settings/tokens)
2. Edit your token
3. Ensure **`workflow`** scope is checked
4. Save and update the GitHub secret

### Issue: Telegram bot says "bot can't initiate conversation"

**Cause**: You must message the bot first before it can send messages to you.

**Solutions**:
1. Search for your bot on Telegram
2. Send `/start` command to initiate the chat
3. The bot can now send you messages

### Issue: Telegram delivery fails with "chat not found"

**Cause**: Incorrect CHAT_ID or bot doesn't have access.

**Solutions**:
1. Verify CHAT_ID with @userinfobot
2. Ensure bot is in the group (if using group chat)
3. Check for typos in the CHAT_ID value
4. Try using the getUpdates method to find correct ID

### Issue: Local .env works but GitHub Actions fails

**Cause**: Secrets not added to GitHub or wrong secret names.

**Solutions**:
1. Verify secret names match exactly (case-sensitive)
2. Check for leading/trailing spaces in secret values
3. Use the check-secrets.js helper script (see below)

---

## Helper Script

Use the included helper script to verify your secrets before pushing to GitHub:

```bash
# Verify all required secrets are present
npm run check-secrets
```

This script will:
- Check if all required variables are in your `.env` file
- Test each API key with a simple validation request
- Show which secrets are valid and which need attention
- Provide friendly output with emoji indicators

For more details, see [scripts/check-secrets.js](../scripts/check-secrets.js)

---

## Security Best Practices

1. **Never commit secrets to git**:
   - Always use `.env` files (add to `.gitignore`)
   - Use GitHub Secrets for production
   - Never hardcode API keys in code

2. **Rotate keys regularly**:
   - Update API keys every 90 days
   - Delete unused keys from service dashboards
   - Monitor usage for suspicious activity

3. **Use minimal scopes**:
   - Only grant required permissions
   - Use separate tokens for different projects
   - Consider fine-grained PATs for production

4. **Monitor usage**:
   - Check service dashboards for unusual activity
   - Set up alerts for quota limits
   - Review GitHub Actions logs for errors

---

## Next Steps

After setting up all secrets:

1. Test locally: `npm run check-secrets`
2. Push your changes: `git push origin main`
3. Trigger a workflow: `npm run dev https://youtube.com/watch?v=example`
4. Monitor progress: `npm run dev <URL> -- --watch`

For full usage instructions, see the [main README](../README.md).

---

## Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Deepgram API Docs](https://developers.deepgram.com/docs)
- [Google Gemini API Docs](https://ai.google.dev/docs)
- [Telegram Bot API](https://core.telegram.org/bots/api)

---

Need help? Open an issue at [https://github.com/zahrsdev/cli-clipper/issues](https://github.com/zahrsdev/cli-clipper/issues)

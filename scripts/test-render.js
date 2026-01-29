#!/usr/bin/env node

/**
 * test-render.js
 *
 * Script to trigger GitHub Actions workflow for CLI Clipper
 * Usage: node scripts/test-render.js <youtube-url>
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Parse .env file manually
function loadEnv() {
  const envPath = path.join(process.cwd(), '.env');

  if (!fs.existsSync(envPath)) {
    console.error('Error: .env file not found at', envPath);
    process.exit(1);
  }

  const envContent = fs.readFileSync(envPath, 'utf-8');
  const env = {};

  for (const line of envContent.split('\n')) {
    const trimmedLine = line.trim();

    // Skip empty lines and comments
    if (!trimmedLine || trimmedLine.startsWith('#')) {
      continue;
    }

    // Parse KEY=VALUE
    const eqIndex = trimmedLine.indexOf('=');
    if (eqIndex > 0) {
      const key = trimmedLine.substring(0, eqIndex).trim();
      const value = trimmedLine.substring(eqIndex + 1).trim();
      env[key] = value;
    }
  }

  return env;
}

// Sleep utility
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Trigger GitHub Actions workflow
async function triggerWorkflow(env, youtubeUrl) {
  const { GITHUB_OWNER, GITHUB_REPO, GH_PAT } = env;

  if (!GITHUB_OWNER || !GITHUB_REPO || !GH_PAT) {
    console.error('Error: Missing required environment variables');
    console.error('Required: GITHUB_OWNER, GITHUB_REPO, GH_PAT');
    process.exit(1);
  }

  // Generate unique worker ID
  const workerId = `test-${Date.now()}`;

  const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/actions/workflows/render.yml/dispatches`;

  console.log('Triggering workflow...');
  console.log(`  URL: ${youtubeUrl}`);
  console.log(`  Worker ID: ${workerId}`);
  console.log(`  Endpoint: ${url}`);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GH_PAT}`,
      'Accept': 'application/vnd.github+json',
      'Content-Type': 'application/json',
      'X-GitHub-Api-Version': '2022-11-28'
    },
    body: JSON.stringify({
      ref: 'main',
      inputs: {
        youtube_url: youtubeUrl,
        worker_id: workerId
      }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Failed to trigger workflow: ${response.status} ${response.statusText}`);
    console.error(errorText);
    process.exit(1);
  }

  console.log('Workflow triggered successfully!');
  console.log('Waiting for workflow run to start...');

  return workerId;
}

// Poll for workflow completion
async function pollWorkflow(env, workerId) {
  const { GITHUB_OWNER, GITHUB_REPO, GH_PAT } = env;

  const runsUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/actions/runs`;

  let runId = null;
  let status = 'unknown';
  let startTime = Date.now();
  const maxWaitTime = 30 * 60 * 1000; // 30 minutes
  const pollInterval = 5000; // 5 seconds

  console.log('\nPolling for workflow status...');
  console.log('(Press Ctrl+C to stop polling)\n');

  while (true) {
    const elapsed = Date.now() - startTime;
    if (elapsed > maxWaitTime) {
      console.error('\nError: Timeout waiting for workflow to complete');
      process.exit(1);
    }

    const response = await fetch(`${runsUrl}?event=workflow_dispatch&per_page=5`, {
      headers: {
        'Authorization': `Bearer ${GH_PAT}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28'
      }
    });

    if (!response.ok) {
      console.error(`Failed to fetch workflow runs: ${response.status}`);
      await sleep(pollInterval);
      continue;
    }

    const data = await response.json();

    // Find the most recent workflow run with our worker_id
    // We need to check the workflow run details to get the inputs
    for (const run of data.workflow_runs) {
      if (run.name === 'Clipper Render' && run.event === 'workflow_dispatch') {
        // Fetch run details to check inputs
        const runResponse = await fetch(run.url, {
          headers: {
            'Authorization': `Bearer ${GH_PAT}`,
            'Accept': 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28'
          }
        });

        if (runResponse.ok) {
          const runData = await runResponse.json();

          // Check if this is our run by checking created_at and inputs
          if (runData.created_at > new Date(startTime - 10000).toISOString()) {
            runId = runData.id;
            status = runData.status;
            const conclusion = runData.conclusion;

            const elapsedMin = (elapsed / 1000 / 60).toFixed(1);
            const statusEmoji = getStatusEmoji(status, conclusion);

            process.stdout.write(`\r${statusEmoji} Status: ${status.toUpperCase()}${conclusion ? ` -> ${conclusion.toUpperCase()}` : ''} | Elapsed: ${elapsedMin}min | Run ID: ${runId}   `);

            if (status === 'completed') {
              console.log('\n');

              if (conclusion === 'success') {
                console.log('Workflow completed successfully!');
                console.log(`\nArtifact: clipper-output-${workerId}`);
                console.log(`View: https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/actions/runs/${runId}`);
                return { success: true, runId, workerId };
              } else {
                console.error('Workflow failed!');
                console.error(`View logs: https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/actions/runs/${runId}`);
                return { success: false, runId, workerId };
              }
            }
          }
        }
      }
    }

    await sleep(pollInterval);
  }
}

function getStatusEmoji(status, conclusion) {
  if (status === 'completed') {
    return conclusion === 'success' ? '[OK]' : '[FAIL]';
  }
  if (status === 'in_progress') return '[RUN]';
  if (status === 'queued') return '[WAIT]';
  return '[?]';
}

// Main function
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('Usage: node scripts/test-render.js <youtube-url>');
    console.log('\nExample:');
    console.log('  node scripts/test-render.js "https://www.youtube.com/watch?v=aSxLg7fRuFs"');
    process.exit(1);
  }

  const youtubeUrl = args[0];

  // Validate YouTube URL
  if (!youtubeUrl.includes('youtube.com') && !youtubeUrl.includes('youtu.be')) {
    console.error('Error: Invalid YouTube URL');
    process.exit(1);
  }

  // Load environment
  const env = loadEnv();

  try {
    // Trigger workflow
    const workerId = await triggerWorkflow(env, youtubeUrl);

    // Poll for completion
    const result = await pollWorkflow(env, workerId);

    process.exit(result.success ? 0 : 1);
  } catch (error) {
    console.error('\nError:', error.message);
    process.exit(1);
  }
}

// Run
main();

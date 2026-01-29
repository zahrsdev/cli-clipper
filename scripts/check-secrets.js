#!/usr/bin/env node

/**
 * CLI Clipper - Secrets Verification Script
 *
 * This script verifies that all required environment variables are set
 * and tests each API key validity with simple API calls.
 *
 * Usage: node scripts/check-secrets.js
 */

import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m',
};

const symbols = {
  success: '✓',
  error: '✗',
  warning: '⚠',
  info: 'ℹ',
  loading: '⋯',
  check: '✅',
  cross: '❌',
  question: '❓',
};

/**
 * Required secrets with their validation functions
 */
const requiredSecrets = [
  {
    name: 'GITHUB_OWNER',
    description: 'GitHub username or organization',
    required: true,
    validate: (value) => {
      if (!value || value === 'your-username') {
        return { valid: false, message: 'Not configured (still set to placeholder)' };
      }
      if (value.length < 1) {
        return { valid: false, message: 'Empty value' };
      }
      return { valid: true };
    },
  },
  {
    name: 'GITHUB_REPO',
    description: 'Repository name',
    required: true,
    validate: (value) => {
      if (!value || value === 'clipper-actions') {
        return { valid: false, message: 'Still set to default value' };
      }
      return { valid: true };
    },
  },
  {
    name: 'GH_PAT',
    description: 'GitHub Personal Access Token',
    required: true,
    validate: (value) => {
      if (!value || !value.startsWith('ghp_')) {
        return { valid: false, message: 'Invalid format (should start with ghp_)' };
      }
      if (value.length < 40) {
        return { valid: false, message: 'Too short (likely incomplete)' };
      }
      return { valid: true, canTest: true };
    },
    test: async (value) => {
      return new Promise((resolve) => {
        const req = https.request('https://api.github.com/user', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${value}`,
            'User-Agent': 'CLI-Clipper-Secrets-Check',
          },
        }, (res) => {
          resolve({
            valid: res.statusCode === 200,
            message: res.statusCode === 200 ? 'Token is valid' : `HTTP ${res.statusCode}`,
          });
        });

        req.on('error', () => {
          resolve({ valid: false, message: 'Network error' });
        });

        req.setTimeout(10000, () => {
          req.destroy();
          resolve({ valid: false, message: 'Request timeout' });
        });

        req.end();
      });
    },
  },
  {
    name: 'DEEPGRAM_API_KEY',
    description: 'Deepgram API Key for transcription',
    required: true,
    validate: (value) => {
      if (!value) {
        return { valid: false, message: 'Missing' };
      }
      // Deepgram keys are either UUID format or 40-char hex string
      const isValidFormat = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(value) ||
                            /^[a-f0-9]{40}$/i.test(value);
      if (!isValidFormat) {
        return { valid: false, message: 'Invalid format (expected UUID or 40-char hex)' };
      }
      return { valid: true, canTest: true };
    },
    test: async (value) => {
      return new Promise((resolve) => {
        const req = https.request('https://api.deepgram.com/v1/projects', {
          method: 'GET',
          headers: {
            'Authorization': `Token ${value}`,
            'Content-Type': 'application/json',
          },
        }, (res) => {
          resolve({
            valid: res.statusCode === 200 || res.statusCode === 403, // 403 means key is valid but no project access
            message: res.statusCode === 200 ? 'Key is valid' :
                     res.statusCode === 403 ? 'Key is valid (no project access)' :
                     `HTTP ${res.statusCode}`,
          });
        });

        req.on('error', () => {
          resolve({ valid: false, message: 'Network error' });
        });

        req.setTimeout(10000, () => {
          req.destroy();
          resolve({ valid: false, message: 'Request timeout' });
        });

        req.end();
      });
    },
  },
  {
    name: 'GEMINI_API_KEY',
    description: 'Google Gemini API Key for viral analysis',
    required: true,
    validate: (value) => {
      if (!value) {
        return { valid: false, message: 'Missing' };
      }
      if (!value.startsWith('AIzaSy')) {
        return { valid: false, message: 'Invalid format (should start with AIzaSy)' };
      }
      if (value.length < 35) {
        return { valid: false, message: 'Too short (likely incomplete)' };
      }
      return { valid: true, canTest: true };
    },
    test: async (value) => {
      return new Promise((resolve) => {
        const req = https.request(`https://generativelanguage.googleapis.com/v1beta/models?key=${value}`, {
          method: 'GET',
          headers: {
            'User-Agent': 'CLI-Clipper-Secrets-Check',
          },
        }, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            try {
              const json = JSON.parse(data);
              resolve({
                valid: res.statusCode === 200,
                message: res.statusCode === 200 ? 'Key is valid' :
                         res.statusCode === 403 ? 'Key may not have access to Generative Language API' :
                         json.error?.message || `HTTP ${res.statusCode}`,
              });
            } catch {
              resolve({ valid: res.statusCode === 200, message: `HTTP ${res.statusCode}` });
            }
          });
        });

        req.on('error', () => {
          resolve({ valid: false, message: 'Network error' });
        });

        req.setTimeout(10000, () => {
          req.destroy();
          resolve({ valid: false, message: 'Request timeout' });
        });

        req.end();
      });
    },
  },
];

const optionalSecrets = [
  {
    name: 'TELEGRAM_TOKEN',
    description: 'Telegram Bot Token for video delivery',
    required: false,
    validate: (value) => {
      if (!value) {
        return { valid: false, message: 'Not configured (optional)' };
      }
      if (!/^\d+:[A-Za-z0-9_-]+$/.test(value)) {
        return { valid: false, message: 'Invalid format (should be number:letters)' };
      }
      return { valid: true, canTest: true };
    },
    test: async (value) => {
      return new Promise((resolve) => {
        const req = https.request(`https://api.telegram.org/bot${value}/getMe`, {
          method: 'GET',
        }, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            try {
              const json = JSON.parse(data);
              resolve({
                valid: json.ok && json.result?.is_bot,
                message: json.ok ? `Bot: @${json.result.username}` : json.description || 'Invalid token',
              });
            } catch {
              resolve({ valid: false, message: 'Invalid response' });
            }
          });
        });

        req.on('error', () => {
          resolve({ valid: false, message: 'Network error' });
        });

        req.setTimeout(10000, () => {
          req.destroy();
          resolve({ valid: false, message: 'Request timeout' });
        });

        req.end();
      });
    },
  },
  {
    name: 'CHAT_ID',
    description: 'Telegram Chat ID for receiving videos',
    required: false,
    validate: (value) => {
      if (!value) {
        return { valid: false, message: 'Not configured (optional)' };
      }
      if (!/^-?\d+$/.test(value)) {
        return { valid: false, message: 'Invalid format (should be numeric)' };
      }
      return { valid: true };
    },
  },
];

/**
 * Load environment variables from .env file
 */
function loadEnvFile() {
  const envPath = path.join(process.cwd(), '.env');

  if (!fs.existsSync(envPath)) {
    return null;
  }

  const content = fs.readFileSync(envPath, 'utf-8');
  const env = {};

  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const match = trimmed.match(/^([^=]+)=(.*)$/);
    if (match) {
      const [, key, value] = match;
      env[key.trim()] = value.trim();
    }
  }

  return env;
}

/**
 * Print colored message
 */
function print(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * Print section header
 */
function printHeader(title) {
  console.log();
  print(`━${'━'.repeat(60)}`, 'dim');
  print(`  ${title}`, 'bright');
  print(`━${'━'.repeat(60)}`, 'dim');
  console.log();
}

/**
 * Print secret check result
 */
function printSecretResult(secret, validation, testResult = null) {
  const { name, description, required } = secret;
  const value = process.env[name] || '';

  // Status icon
  let icon, color;
  if (!value && !required) {
    icon = symbols.info;
    color = 'dim';
  } else if (!validation.valid) {
    icon = symbols.error;
    color = 'red';
  } else if (testResult && !testResult.valid) {
    icon = symbols.warning;
    color = 'yellow';
  } else {
    icon = symbols.success;
    color = 'green';
  }

  // Print header
  const requiredLabel = required ? '' : ' (optional)';
  print(`${icon}  ${name}${requiredLabel}`, color);
  print(`   ${description}`, 'dim');

  // Print validation message
  if (!value) {
    print(`   ${symbols.question} ${validation.message}`, 'dim');
  } else if (!validation.valid) {
    print(`   ${symbols.cross} ${validation.message}`, 'red');
  } else if (testResult) {
    if (testResult.valid) {
      print(`   ${symbols.check} ${testResult.message}`, 'green');
    } else {
      print(`   ${symbols.warning} ${testResult.message}`, 'yellow');
    }
  } else {
    print(`   ${symbols.check} Format is valid`, 'green');
  }

  // Show masked value
  if (value && value.length > 0) {
    const masked = value.length > 8
      ? `${value.slice(0, 4)}${'•'.repeat(8)}${value.slice(-4)}`
      : '•'.repeat(value.length);
    print(`   Value: ${masked}`, 'dim');
  }

  console.log();
}

/**
 * Main execution
 */
async function main() {
  console.clear();

  // Header
  printHeader('CLI Clipper - Secrets Verification');

  // Load .env file
  const env = loadEnvFile();

  if (!env) {
    print(`${symbols.error}  .env file not found!`, 'red');
    print(`   Create one from .env.example:`, 'dim');
    print(`   ${colors.cyan}cp .env.example .env`, 'reset');
    console.log();
    process.exit(1);
  }

  // Set environment variables
  Object.assign(process.env, env);

  print(`${symbols.info}  Loaded .env file`, 'blue');
  console.log();

  // Check required secrets
  printHeader('Required Secrets');

  const allSecrets = [...requiredSecrets, ...optionalSecrets];
  const results = [];

  for (const secret of allSecrets) {
    const value = process.env[secret.name] || '';
    const validation = secret.validate(value);
    let testResult = null;

    if (validation.valid && validation.canTest && secret.test) {
      print(`   ${symbols.loading} Testing ${secret.name}...`, 'dim');
      testResult = await secret.test(value);
    }

    printSecretResult(secret, validation, testResult);

    results.push({
      secret,
      validation,
      testResult,
      value: !!value,
    });
  }

  // Summary
  printHeader('Summary');

  const requiredResults = results.filter(r => r.secret.required);
  const presentRequired = requiredResults.filter(r => r.validation.valid).length;
  const totalRequired = requiredResults.length;

  const validRequired = requiredResults.filter(r => {
    if (!r.validation.valid) return false;
    if (r.testResult && !r.testResult.valid) return false;
    return true;
  }).length;

  // Count status
  const valid = results.filter(r => r.validation.valid && (!r.testResult || r.testResult.valid)).length;
  const invalid = results.filter(r => !r.validation.valid).length;
  const failed = results.filter(r => r.validation.valid && r.testResult && !r.testResult.valid).length;

  // Print stats
  console.log(`   Secrets Present:    ${colors.bright}${presentRequired}/${totalRequired}${colors.reset}`);
  console.log(`   Secrets Validated:  ${colors.green}${validRequired}/${totalRequired}${colors.reset}`);

  if (invalid > 0) {
    console.log(`   Missing/Invalid:    ${colors.red}${invalid}${colors.reset}`);
  }
  if (failed > 0) {
    console.log(`   API Tests Failed:   ${colors.yellow}${failed}${colors.reset}`);
  }

  console.log();

  // Overall status
  if (validRequired === totalRequired) {
    print(`${symbols.check}  All required secrets are configured and valid!`, 'green');
    print(`   You're ready to use CLI Clipper.`, 'dim');
    console.log();
    print(`   Next steps:`, 'cyan');
    print(`   1. Add these secrets to GitHub (see docs/GITHUB_SECRETS_SETUP.md)`, 'dim');
    print(`   2. Test the workflow: ${colors.cyan}npm run dev <youtube-url>${colors.reset}`, 'dim');
  } else {
    const missing = totalRequired - presentRequired;
    print(`${symbols.error}  Configuration incomplete!`, 'red');

    if (missing > 0) {
      print(`   ${missing} required secret(s) are missing.`, 'red');
    }
    if (validRequired < presentRequired) {
      print(`   Some secrets failed validation.`, 'red');
    }

    console.log();
    print(`   To fix:`, 'cyan');
    print(`   1. Edit your .env file: ${colors.cyan}nano .env${colors.reset}`, 'dim');
    print(`   2. Get API keys from: ${colors.cyan}docs/GITHUB_SECRETS_SETUP.md${colors.reset}`, 'dim');
    print(`   3. Run this script again: ${colors.cyan}npm run check-secrets${colors.reset}`, 'dim');
  }

  console.log();
  console.log();

  // Exit with appropriate code
  process.exit(validRequired === totalRequired ? 0 : 1);
}

// Run
main().catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
});

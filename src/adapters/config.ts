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
  return {
    github: {
      owner: process.env.GITHUB_OWNER || '',
      repo: process.env.GITHUB_REPO || '',
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
  const errors: string[] = [];

  if (!config.github.token) errors.push('❌ GH_PAT environment variable is required');
  if (!config.github.owner || !config.github.repo) {
    errors.push('❌ GITHUB_OWNER and GITHUB_REPO environment variables required');
  }
  if (!config.telegram.token) errors.push('❌ TELEGRAM_TOKEN environment variable is required');
  if (!config.telegram.chatId) errors.push('❌ CHAT_ID environment variable required');

  if (errors.length > 0) {
    throw new Error('\n' + errors.join('\n'));
  }
}

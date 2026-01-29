import { keyRotation, ServiceName } from './KeyRotation.js';

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
  apiKeys: {
    /**
     * Get the next API key for a service using round-robin rotation
     *
     * @param serviceName - The service name ('deepgram' or 'gemini')
     * @returns The next API key in the rotation
     *
     * @example
     * ```typescript
     * const deepgramKey = config.apiKeys.getNext('deepgram');
     * const geminiKey = config.apiKeys.getNext('gemini');
     * ```
     */
    getNext(serviceName: ServiceName): string;

    /**
     * Get all available keys for a service (without rotation)
     *
     * @param serviceName - The service name
     * @returns Array of all available keys
     */
    getAll(serviceName: ServiceName): string[];

    /**
     * Get the count of available keys for a service
     *
     * @param serviceName - The service name
     * @returns Number of available keys
     */
    getCount(serviceName: ServiceName): number;

    /**
     * Check if a service has keys available
     *
     * @param serviceName - The service name
     * @returns True if keys are available
     */
    has(serviceName: ServiceName): boolean;
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
    },
    apiKeys: {
      getNext: (serviceName: ServiceName) => keyRotation.getNextKey(serviceName),
      getAll: (serviceName: ServiceName) => keyRotation.getAllKeys(serviceName),
      getCount: (serviceName: ServiceName) => keyRotation.getKeyCount(serviceName),
      has: (serviceName: ServiceName) => keyRotation.hasKeys(serviceName)
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

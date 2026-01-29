import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Service names that support API key rotation
 */
export type ServiceName = 'deepgram' | 'gemini';

/**
 * Key file mapping - maps service names to their key file names
 */
const KEY_FILES: Record<ServiceName, string> = {
  deepgram: 'deepgram-keys.txt',
  gemini: 'gemini-keys.txt'
};

/**
 * Environment variable fallback mapping
 */
const ENV_VARS: Record<ServiceName, string> = {
  deepgram: 'DEEPGRAM_API_KEY',
  gemini: 'GEMINI_API_KEY'
};

/**
 * KeyRotation Adapter - Manages round-robin API key rotation per service
 *
 * Features:
 * - Round-robin rotation: Each service maintains its own rotation index
 * - File-based storage: Keys are loaded from text files in config/keys/
 * - Environment fallback: Falls back to environment variables if key files don't exist
 * - Independent tracking: Each service rotates independently
 *
 * @example
 * ```typescript
 * const rotation = new KeyRotation();
 * const deepgramKey = rotation.getNextKey('deepgram');
 * const geminiKey = rotation.getNextKey('gemini');
 * ```
 */
export class KeyRotation {
  /**
   * Maps service names to their current rotation index
   * Each service maintains its own index for independent rotation
   */
  private currentIndex: Map<ServiceName, number> = new Map();

  /**
   * Cache for loaded keys to avoid repeated file reads
   * Maps service names to their array of keys
   */
  private keysCache: Map<ServiceName, string[]> = new Map();

  /**
   * Path to the keys directory
   */
  private readonly keysDir: string;

  constructor() {
    // Navigate from src/adapters/ to config/keys/
    this.keysDir = path.resolve(__dirname, '../../config/keys');
  }

  /**
   * Get the next API key for a service using round-robin rotation
   *
   * @param serviceName - The service name ('deepgram' or 'gemini')
   * @returns The next API key in the rotation
   * @throws Error if no keys are available for the service
   *
   * @example
   * ```typescript
   * const rotation = new KeyRotation();
   * const key1 = rotation.getNextKey('deepgram'); // Returns key at index 0
   * const key2 = rotation.getNextKey('deepgram'); // Returns key at index 1
   * const key3 = rotation.getNextKey('deepgram'); // Returns key at index 2 (or wraps to 0)
   * ```
   */
  getNextKey(serviceName: ServiceName): string {
    const keys = this.loadKeys(serviceName);

    if (keys.length === 0) {
      throw new Error(
        `No API keys available for service: ${serviceName}. ` +
        `Either add keys to ${KEY_FILES[serviceName]} or set ${ENV_VARS[serviceName]} environment variable.`
      );
    }

    // Get current index for this service (default to 0)
    const idx = this.currentIndex.get(serviceName) || 0;

    // Update index for next call (round-robin: wrap to 0 after last key)
    this.currentIndex.set(serviceName, (idx + 1) % keys.length);

    return keys[idx];
  }

  /**
   * Get all keys for a service without advancing the rotation
   * Useful for checking how many keys are available
   *
   * @param serviceName - The service name
   * @returns Array of all available keys for the service
   */
  getAllKeys(serviceName: ServiceName): string[] {
    return this.loadKeys(serviceName);
  }

  /**
   * Get the count of available keys for a service
   *
   * @param serviceName - The service name
   * @returns Number of available keys
   */
  getKeyCount(serviceName: ServiceName): number {
    return this.loadKeys(serviceName).length;
  }

  /**
   * Reset the rotation index for a service
   * Useful for testing or manual reset scenarios
   *
   * @param serviceName - The service name to reset
   */
  resetRotation(serviceName: ServiceName): void {
    this.currentIndex.delete(serviceName);
  }

  /**
   * Clear the keys cache for a service
   * Forces a reload from disk on next access
   *
   * @param serviceName - The service name
   */
  clearCache(serviceName?: ServiceName): void {
    if (serviceName) {
      this.keysCache.delete(serviceName);
    } else {
      this.keysCache.clear();
    }
  }

  /**
   * Load keys for a service from file or environment variable
   * Uses cached keys if available to avoid repeated file reads
   *
   * @param serviceName - The service name
   * @returns Array of API keys for the service
   */
  private loadKeys(serviceName: ServiceName): string[] {
    // Return cached keys if available
    if (this.keysCache.has(serviceName)) {
      return this.keysCache.get(serviceName)!;
    }

    const keyFile = path.join(this.keysDir, KEY_FILES[serviceName]);
    const envVar = ENV_VARS[serviceName];
    let keys: string[] = [];

    // Try to load from file first
    if (fs.existsSync(keyFile)) {
      try {
        const content = fs.readFileSync(keyFile, 'utf-8');
        keys = content
          .split('\n')
          .map(line => line.trim())
          .filter(line => line.length > 0 && !line.startsWith('#')); // Skip empty lines and comments
      } catch (error) {
        throw new Error(
          `Failed to read key file: ${keyFile}. ` +
          `Error: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }

    // If no keys from file, try environment variable fallback
    if (keys.length === 0 && process.env[envVar]) {
      keys = [process.env[envVar]!];
    }

    // Cache the keys
    this.keysCache.set(serviceName, keys);

    return keys;
  }

  /**
   * Check if a service has keys available
   *
   * @param serviceName - The service name
   * @returns True if keys are available, false otherwise
   */
  hasKeys(serviceName: ServiceName): boolean {
    return this.loadKeys(serviceName).length > 0;
  }
}

/**
 * Singleton instance for convenient access
 * Use this for easy access throughout the application
 *
 * @example
 * ```typescript
 * import { keyRotation } from './KeyRotation';
 * const key = keyRotation.getNextKey('deepgram');
 * ```
 */
export const keyRotation = new KeyRotation();

// Word-level transcript from Deepgram
export interface Word {
  word: string;
  start: number;
  end: number;
}

// Viral segment analysis result
export interface ViralSegment {
  headline: string;
  start: number;
  end: number;
  reason: string;
  transcript: Word[];
}

// GitHub configuration
export interface GitHubConfig {
  owner: string;
  repo: string;
  workflowId: string;
  token: string;
}

// Telegram configuration
export interface TelegramConfig {
  token: string;
  chatId: string;
}

// Workflow dispatch options
export interface WorkflowDispatchOptions {
  youtubeUrl: string;
  workerId: string;
}

// Workflow run status
export interface WorkflowRunStatus {
  status: 'queued' | 'in_progress' | 'completed' | 'failed';
  conclusion?: 'success' | 'failure' | 'neutral';
  downloadUrl?: string;
  checkUrl?: string;
  error?: string;
}

// Full clipper configuration
export interface ClipperConfig {
  github: GitHubConfig;
  telegram: TelegramConfig;
  apiKeys: {
    getNext(service: 'deepgram' | 'gemini'): string;
    getAll(service: 'deepgram' | 'gemini'): string[];
    getCount(service: 'deepgram' | 'gemini'): number;
    has(service: 'deepgram' | 'gemini'): boolean;
  };
}

// Legacy alias for compatibility
export type WorkflowStatus = WorkflowRunStatus;

import { GitHubAdapter } from '../adapters/GitHubAdapter.js';
import { TelegramAdapter } from '../adapters/TelegramAdapter.js';
import { ClipperConfig, WorkflowStatus } from '../types/index.js';
import { pollWorkflowStatus } from '../adapters/polling.js';

/**
 * Main orchestrator service for the Clipper CLI.
 * Coordinates GitHub Actions workflow execution and status polling.
 */
export class ClipperService {
  private github: GitHubAdapter;
  private telegram: TelegramAdapter;

  constructor(private config: ClipperConfig) {
    this.github = new GitHubAdapter(config.github);
    this.telegram = new TelegramAdapter(config.telegram);
  }

  /**
   * Process a YouTube URL through the complete pipeline.
   * @param url - YouTube video URL
   * @param watch - If true, poll for status updates and display progress
   */
  async process(url: string, watch: boolean = true): Promise<void> {
    const workerId = this.generateWorkerId();

    console.log(`🎬 Starting clipper for: ${url}`);
    console.log(`📝 Worker ID: ${workerId}`);

    try {
      // Trigger the GitHub Actions workflow
      await this.github.triggerWorkflow({
        youtubeUrl: url,
        workerId: workerId
      });
      console.log('✅ Workflow triggered successfully');

      if (watch) {
        // Poll for completion and send result via Telegram
        const result = await pollWorkflowStatus(this.github, workerId);

        if (result.status === 'completed') {
          console.log('✅ Video rendered successfully!');
          console.log(`📥 Download URL: ${result.downloadUrl}`);

          // Send notification via Telegram
          if (this.config.telegram.token && this.config.telegram.chatId) {
            await this.telegram.sendVideo(result.downloadUrl!, workerId);
            console.log('📱 Video sent to Telegram');
          }
        } else if (result.status === 'failed') {
          console.error('❌ Workflow failed:', result.error);
          throw new Error(result.error || 'Workflow failed');
        } else {
          console.log('⏸️ Workflow is still running...');
          console.log(`Check status at: ${result.checkUrl}`);
        }
      } else {
        console.log('💡 Run with --watch to track progress');
        console.log(`Worker ID: ${workerId}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Error during processing:', errorMessage);

      // Send error notification via Telegram
      if (this.config.telegram.token && this.config.telegram.chatId) {
        await this.telegram.sendError(workerId, errorMessage);
      }

      throw error;
    }
  }

  /**
   * Generate a unique worker ID for tracking this job.
   */
  private generateWorkerId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `clipper-${timestamp}-${random}`;
  }
}

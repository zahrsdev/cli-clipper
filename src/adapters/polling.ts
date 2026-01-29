import { GitHubAdapter, WorkflowRunStatus } from './GitHubAdapter.js';
import ora from 'ora';

export interface PollOptions {
  interval?: number;  // milliseconds, default 5000
  timeout?: number;   // milliseconds, default 600000 (10 min)
  onProgress?: (status: WorkflowRunStatus) => void;
}

export async function pollWorkflowStatus(
  gitHub: GitHubAdapter,
  workerId: string,
  options: PollOptions = {}
): Promise<WorkflowRunStatus> {
  const { interval = 5000, timeout = 600000, onProgress } = options;
  const startTime = Date.now();
  const spinner = ora('Checking workflow status...').start();

  while (Date.now() - startTime < timeout) {
    const status = await gitHub.getRunStatus(workerId);

    if (!status) {
      await new Promise(r => setTimeout(r, interval));
      continue;
    }

    spinner.text = `Workflow ${status.status}...`;

    if (onProgress) {
      onProgress(status);
    }

    if (status.status === 'completed') {
      spinner.succeed('Workflow completed!');
      return status;
    }

    if (status.status === 'failed') {
      spinner.fail('Workflow failed');
      return status;
    }

    await new Promise(r => setTimeout(r, interval));
  }

  spinner.warn('Workflow timeout');
  return { status: 'in_progress', checkUrl: gitHub.getWorkflowUrl() } as unknown as WorkflowRunStatus;
}

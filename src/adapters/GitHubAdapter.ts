import { Octokit } from '@octokit/rest';
import type { RestEndpointMethodTypes } from '@octokit/plugin-rest-endpoint-methods';

export interface WorkflowDispatchOptions {
  youtubeUrl: string;
  workerId: string;
}

export interface WorkflowRunStatus {
  id: number;
  status: 'queued' | 'in_progress' | 'completed';
  conclusion: 'success' | 'failure' | null;
  url: string;
}

export class GitHubAdapter {
  private octokit: Octokit;
  private owner: string;
  private repo: string;
  private workflowId: string;

  constructor(owner: string, repo: string, workflowId: string, token: string) {
    this.octokit = new Octokit({ auth: token });
    this.owner = owner;
    this.repo = repo;
    this.workflowId = workflowId;
  }

  async triggerWorkflow(options: WorkflowDispatchOptions): Promise<void> {
    await this.octokit.rest.actions.createWorkflowDispatch({
      owner: this.owner,
      repo: this.repo,
      workflow_id: this.workflowId,
      ref: 'main',
      inputs: {
        youtube_url: options.youtubeUrl,
        worker_id: options.workerId
      }
    });
  }

  async getRunStatus(workerId: string): Promise<WorkflowRunStatus | null> {
    const { data } = await this.octokit.rest.actions.listWorkflowRuns({
      owner: this.owner,
      repo: this.repo,
      workflow_id: this.workflowId,
      per_page: 10
    });

    const run = data.workflow_runs.find(
      r => r.name.includes(workerId) ||
           (r.event === 'workflow_dispatch' && new Date(r.created_at) > new Date(Date.now() - 300000))
    );

    if (!run) return null;

    return {
      id: run.id,
      status: run.status as any,
      conclusion: run.conclusion as any,
      url: run.html_url
    };
  }

  getWorkflowUrl(): string {
    return `https://github.com/${this.owner}/${this.repo}/actions`;
  }
}

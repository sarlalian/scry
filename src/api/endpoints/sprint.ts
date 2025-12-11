import type { JiraClient } from "../client.ts";
import type {
  Sprint,
  SprintListResult,
  SprintListOptions,
  CreateSprintRequest,
} from "../types/sprint.ts";

export class SprintEndpoint {
  constructor(private client: JiraClient) {}

  async list(boardId: number, options?: SprintListOptions): Promise<SprintListResult> {
    const params: Record<string, string | number | boolean | undefined> = {
      startAt: options?.startAt ?? 0,
      maxResults: options?.maxResults ?? 50,
    };

    if (options?.state) {
      params["state"] = options.state;
    }

    return this.client.get<SprintListResult>(`/rest/agile/1.0/board/${boardId}/sprint`, params);
  }

  async get(sprintId: number): Promise<Sprint> {
    return this.client.get<Sprint>(`/rest/agile/1.0/sprint/${sprintId}`);
  }

  async create(request: CreateSprintRequest): Promise<Sprint> {
    return this.client.post<Sprint>(`/rest/agile/1.0/sprint`, request);
  }

  async addIssues(sprintId: number, issueKeys: string[]): Promise<void> {
    await this.client.post(`/rest/agile/1.0/sprint/${sprintId}/issue`, {
      issues: issueKeys,
    });
  }
}

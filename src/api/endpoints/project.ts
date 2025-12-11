import type { JiraClient } from "../client.ts";
import type { Project, ProjectListResult, ProjectListOptions } from "../types/project.ts";

export class ProjectEndpoint {
  constructor(private client: JiraClient) {}

  async list(options?: ProjectListOptions): Promise<ProjectListResult> {
    const params: Record<string, string | number | boolean | undefined> = {
      startAt: options?.startAt ?? 0,
      maxResults: options?.maxResults ?? 50,
    };

    if (options?.orderBy) {
      params["orderBy"] = options.orderBy;
    }

    if (options?.query) {
      params["query"] = options.query;
    }

    return this.client.get<ProjectListResult>("/rest/api/3/project/search", params);
  }

  async get(projectKeyOrId: string): Promise<Project> {
    return this.client.get<Project>(`/rest/api/3/project/${projectKeyOrId}`);
  }
}

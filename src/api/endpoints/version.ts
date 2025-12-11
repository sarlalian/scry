import type { JiraClient } from "../client.ts";
import type { Version, VersionListOptions, CreateVersionRequest } from "../types/version.ts";

export class VersionEndpoint {
  constructor(private client: JiraClient) {}

  async list(projectKey: string, options?: VersionListOptions): Promise<Version[]> {
    const params: Record<string, string | number | boolean | undefined> = {};

    if (options?.status) {
      params["status"] = options.status;
    }

    if (options?.orderBy) {
      params["orderBy"] = options.orderBy;
    }

    if (options?.maxResults !== undefined) {
      params["maxResults"] = options.maxResults;
    }

    if (options?.startAt !== undefined) {
      params["startAt"] = options.startAt;
    }

    return this.client.get<Version[]>(`/rest/api/3/project/${projectKey}/versions`, params);
  }

  async get(versionId: string): Promise<Version> {
    return this.client.get<Version>(`/rest/api/3/version/${versionId}`);
  }

  async create(request: CreateVersionRequest): Promise<Version> {
    return this.client.post<Version>(`/rest/api/3/version`, request);
  }
}

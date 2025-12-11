import type { JiraClient } from "../client.ts";
import type { User } from "../types/user.ts";

export class UserEndpoint {
  constructor(private client: JiraClient) {}

  async getMyself(): Promise<User> {
    return this.client.get<User>("/rest/api/3/myself");
  }

  async search(
    query: string,
    options?: { maxResults?: number; startAt?: number }
  ): Promise<User[]> {
    return this.client.get<User[]>("/rest/api/3/user/search", {
      query,
      maxResults: options?.maxResults ?? 50,
      startAt: options?.startAt ?? 0,
    });
  }

  async getUser(accountId: string): Promise<User> {
    return this.client.get<User>("/rest/api/3/user", { accountId });
  }

  async findAssignable(
    projectKey: string,
    query?: string,
    options?: { maxResults?: number }
  ): Promise<User[]> {
    return this.client.get<User[]>("/rest/api/3/user/assignable/search", {
      project: projectKey,
      query,
      maxResults: options?.maxResults ?? 50,
    });
  }
}

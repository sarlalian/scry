import type { JiraClient } from "../client.ts";
import type { Board, BoardListResult, BoardListOptions } from "../types/board.ts";

export class BoardEndpoint {
  constructor(private client: JiraClient) {}

  async list(options?: BoardListOptions): Promise<BoardListResult> {
    const params: Record<string, string | number | boolean | undefined> = {
      startAt: options?.startAt ?? 0,
      maxResults: options?.maxResults ?? 50,
    };

    if (options?.type) {
      params["type"] = options.type;
    }

    if (options?.name) {
      params["name"] = options.name;
    }

    if (options?.projectKeyOrId) {
      params["projectKeyOrId"] = options.projectKeyOrId;
    }

    return this.client.get<BoardListResult>("/rest/agile/1.0/board", params);
  }

  async get(boardId: number): Promise<Board> {
    return this.client.get<Board>(`/rest/agile/1.0/board/${boardId}`);
  }
}

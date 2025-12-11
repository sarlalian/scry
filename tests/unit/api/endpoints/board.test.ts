import { describe, expect, test, mock } from "bun:test";
import { BoardEndpoint } from "../../../../src/api/endpoints/board.ts";
import type { JiraClient } from "../../../../src/api/client.ts";
import type { BoardListResult, Board } from "../../../../src/api/types/board.ts";

describe("BoardEndpoint", () => {
  describe("list", () => {
    test("fetches all boards", async () => {
      const mockResult: BoardListResult = {
        maxResults: 50,
        startAt: 0,
        isLast: true,
        values: [
          {
            id: 1,
            self: "https://example.atlassian.net/rest/agile/1.0/board/1",
            name: "TEST board",
            type: "scrum",
            location: {
              projectId: 10000,
              projectKey: "TEST",
              projectName: "Test Project",
              displayName: "Test Project (TEST)",
              projectTypeKey: "software",
            },
          },
          {
            id: 2,
            self: "https://example.atlassian.net/rest/agile/1.0/board/2",
            name: "DEMO board",
            type: "kanban",
            location: {
              projectId: 10001,
              projectKey: "DEMO",
              projectName: "Demo Project",
              displayName: "Demo Project (DEMO)",
              projectTypeKey: "software",
            },
          },
        ],
      };

      const mockClient = {
        get: mock(() => Promise.resolve(mockResult)),
      } as unknown as JiraClient;

      const endpoint = new BoardEndpoint(mockClient);
      const result = await endpoint.list();

      expect(mockClient.get).toHaveBeenCalledWith("/rest/agile/1.0/board", {
        startAt: 0,
        maxResults: 50,
      });
      expect(result.values).toHaveLength(2);
      expect(result.values[0]?.id).toBe(1);
      expect(result.values[0]?.name).toBe("TEST board");
      expect(result.values[0]?.type).toBe("scrum");
      expect(result.values[1]?.id).toBe(2);
      expect(result.values[1]?.type).toBe("kanban");
    });

    test("applies pagination options", async () => {
      const mockResult: BoardListResult = {
        maxResults: 20,
        startAt: 10,
        isLast: false,
        values: [],
      };

      const mockClient = {
        get: mock(() => Promise.resolve(mockResult)),
      } as unknown as JiraClient;

      const endpoint = new BoardEndpoint(mockClient);
      await endpoint.list({ startAt: 10, maxResults: 20 });

      expect(mockClient.get).toHaveBeenCalledWith("/rest/agile/1.0/board", {
        startAt: 10,
        maxResults: 20,
      });
    });

    test("filters by board type", async () => {
      const mockResult: BoardListResult = {
        maxResults: 50,
        startAt: 0,
        isLast: true,
        values: [
          {
            id: 1,
            self: "https://example.atlassian.net/rest/agile/1.0/board/1",
            name: "TEST Scrum board",
            type: "scrum",
          },
        ],
      };

      const mockClient = {
        get: mock(() => Promise.resolve(mockResult)),
      } as unknown as JiraClient;

      const endpoint = new BoardEndpoint(mockClient);
      await endpoint.list({ type: "scrum" });

      expect(mockClient.get).toHaveBeenCalledWith("/rest/agile/1.0/board", {
        startAt: 0,
        maxResults: 50,
        type: "scrum",
      });
    });

    test("filters by board name", async () => {
      const mockResult: BoardListResult = {
        maxResults: 50,
        startAt: 0,
        isLast: true,
        values: [
          {
            id: 1,
            self: "https://example.atlassian.net/rest/agile/1.0/board/1",
            name: "TEST board",
            type: "scrum",
          },
        ],
      };

      const mockClient = {
        get: mock(() => Promise.resolve(mockResult)),
      } as unknown as JiraClient;

      const endpoint = new BoardEndpoint(mockClient);
      await endpoint.list({ name: "TEST" });

      expect(mockClient.get).toHaveBeenCalledWith("/rest/agile/1.0/board", {
        startAt: 0,
        maxResults: 50,
        name: "TEST",
      });
    });

    test("filters by project key or id", async () => {
      const mockResult: BoardListResult = {
        maxResults: 50,
        startAt: 0,
        isLast: true,
        values: [
          {
            id: 1,
            self: "https://example.atlassian.net/rest/agile/1.0/board/1",
            name: "TEST board",
            type: "scrum",
            location: {
              projectKey: "TEST",
            },
          },
        ],
      };

      const mockClient = {
        get: mock(() => Promise.resolve(mockResult)),
      } as unknown as JiraClient;

      const endpoint = new BoardEndpoint(mockClient);
      await endpoint.list({ projectKeyOrId: "TEST" });

      expect(mockClient.get).toHaveBeenCalledWith("/rest/agile/1.0/board", {
        startAt: 0,
        maxResults: 50,
        projectKeyOrId: "TEST",
      });
    });

    test("applies multiple filters", async () => {
      const mockResult: BoardListResult = {
        maxResults: 20,
        startAt: 10,
        isLast: false,
        values: [],
      };

      const mockClient = {
        get: mock(() => Promise.resolve(mockResult)),
      } as unknown as JiraClient;

      const endpoint = new BoardEndpoint(mockClient);
      await endpoint.list({
        startAt: 10,
        maxResults: 20,
        type: "scrum",
        name: "TEST",
        projectKeyOrId: "TEST",
      });

      expect(mockClient.get).toHaveBeenCalledWith("/rest/agile/1.0/board", {
        startAt: 10,
        maxResults: 20,
        type: "scrum",
        name: "TEST",
        projectKeyOrId: "TEST",
      });
    });

    test("returns boards with different types", async () => {
      const mockResult: BoardListResult = {
        maxResults: 50,
        startAt: 0,
        isLast: true,
        values: [
          {
            id: 1,
            self: "https://example.atlassian.net/rest/agile/1.0/board/1",
            name: "Scrum Board",
            type: "scrum",
          },
          {
            id: 2,
            self: "https://example.atlassian.net/rest/agile/1.0/board/2",
            name: "Kanban Board",
            type: "kanban",
          },
          {
            id: 3,
            self: "https://example.atlassian.net/rest/agile/1.0/board/3",
            name: "Simple Board",
            type: "simple",
          },
        ],
      };

      const mockClient = {
        get: mock(() => Promise.resolve(mockResult)),
      } as unknown as JiraClient;

      const endpoint = new BoardEndpoint(mockClient);
      const result = await endpoint.list();

      expect(result.values).toHaveLength(3);
      expect(result.values[0]?.type).toBe("scrum");
      expect(result.values[1]?.type).toBe("kanban");
      expect(result.values[2]?.type).toBe("simple");
    });
  });

  describe("get", () => {
    test("fetches a single board by id", async () => {
      const mockBoard: Board = {
        id: 1,
        self: "https://example.atlassian.net/rest/agile/1.0/board/1",
        name: "TEST board",
        type: "scrum",
        location: {
          projectId: 10000,
          projectKey: "TEST",
          projectName: "Test Project",
          displayName: "Test Project (TEST)",
          projectTypeKey: "software",
        },
      };

      const mockClient = {
        get: mock(() => Promise.resolve(mockBoard)),
      } as unknown as JiraClient;

      const endpoint = new BoardEndpoint(mockClient);
      const result = await endpoint.get(1);

      expect(mockClient.get).toHaveBeenCalledWith("/rest/agile/1.0/board/1");
      expect(result.id).toBe(1);
      expect(result.name).toBe("TEST board");
      expect(result.type).toBe("scrum");
    });
  });
});

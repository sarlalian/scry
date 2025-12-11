import { describe, expect, test, mock } from "bun:test";
import { SprintEndpoint } from "../../../../src/api/endpoints/sprint.ts";
import type { JiraClient } from "../../../../src/api/client.ts";
import type { SprintListResult, Sprint } from "../../../../src/api/types/sprint.ts";

describe("SprintEndpoint", () => {
  describe("list", () => {
    test("fetches sprints from a board", async () => {
      const mockResult: SprintListResult = {
        maxResults: 50,
        startAt: 0,
        isLast: true,
        values: [
          {
            id: 1,
            self: "https://example.atlassian.net/rest/agile/1.0/sprint/1",
            state: "active",
            name: "Sprint 1",
            startDate: "2025-01-01T00:00:00.000Z",
            endDate: "2025-01-14T00:00:00.000Z",
            originBoardId: 123,
          },
        ],
      };

      const mockClient = {
        get: mock(() => Promise.resolve(mockResult)),
      } as unknown as JiraClient;

      const endpoint = new SprintEndpoint(mockClient);
      const result = await endpoint.list(123);

      expect(mockClient.get).toHaveBeenCalledWith("/rest/agile/1.0/board/123/sprint", {
        startAt: 0,
        maxResults: 50,
      });
      expect(result.values).toHaveLength(1);
      expect(result.values[0]?.name).toBe("Sprint 1");
      expect(result.values[0]?.state).toBe("active");
    });

    test("applies state filter", async () => {
      const mockResult: SprintListResult = {
        maxResults: 50,
        startAt: 0,
        isLast: true,
        values: [],
      };

      const mockClient = {
        get: mock(() => Promise.resolve(mockResult)),
      } as unknown as JiraClient;

      const endpoint = new SprintEndpoint(mockClient);
      await endpoint.list(123, { state: "closed" });

      expect(mockClient.get).toHaveBeenCalledWith("/rest/agile/1.0/board/123/sprint", {
        startAt: 0,
        maxResults: 50,
        state: "closed",
      });
    });

    test("applies pagination options", async () => {
      const mockResult: SprintListResult = {
        maxResults: 20,
        startAt: 10,
        isLast: false,
        values: [],
      };

      const mockClient = {
        get: mock(() => Promise.resolve(mockResult)),
      } as unknown as JiraClient;

      const endpoint = new SprintEndpoint(mockClient);
      await endpoint.list(123, { startAt: 10, maxResults: 20 });

      expect(mockClient.get).toHaveBeenCalledWith("/rest/agile/1.0/board/123/sprint", {
        startAt: 10,
        maxResults: 20,
      });
    });

    test("returns multiple sprints in different states", async () => {
      const mockResult: SprintListResult = {
        maxResults: 50,
        startAt: 0,
        isLast: true,
        values: [
          {
            id: 1,
            self: "https://example.atlassian.net/rest/agile/1.0/sprint/1",
            state: "closed",
            name: "Sprint 1",
            startDate: "2024-12-01T00:00:00.000Z",
            endDate: "2024-12-14T00:00:00.000Z",
            completeDate: "2024-12-14T00:00:00.000Z",
            originBoardId: 123,
          },
          {
            id: 2,
            self: "https://example.atlassian.net/rest/agile/1.0/sprint/2",
            state: "active",
            name: "Sprint 2",
            startDate: "2024-12-15T00:00:00.000Z",
            endDate: "2024-12-28T00:00:00.000Z",
            originBoardId: 123,
          },
          {
            id: 3,
            self: "https://example.atlassian.net/rest/agile/1.0/sprint/3",
            state: "future",
            name: "Sprint 3",
            originBoardId: 123,
          },
        ],
      };

      const mockClient = {
        get: mock(() => Promise.resolve(mockResult)),
      } as unknown as JiraClient;

      const endpoint = new SprintEndpoint(mockClient);
      const result = await endpoint.list(123);

      expect(result.values).toHaveLength(3);
      expect(result.values[0]?.state).toBe("closed");
      expect(result.values[1]?.state).toBe("active");
      expect(result.values[2]?.state).toBe("future");
    });
  });

  describe("get", () => {
    test("fetches a single sprint by ID", async () => {
      const mockSprint: Sprint = {
        id: 1,
        self: "https://example.atlassian.net/rest/agile/1.0/sprint/1",
        state: "active",
        name: "Sprint 1",
        startDate: "2025-01-01T00:00:00.000Z",
        endDate: "2025-01-14T00:00:00.000Z",
        goal: "Complete feature X",
        originBoardId: 123,
      };

      const mockClient = {
        get: mock(() => Promise.resolve(mockSprint)),
      } as unknown as JiraClient;

      const endpoint = new SprintEndpoint(mockClient);
      const result = await endpoint.get(1);

      expect(mockClient.get).toHaveBeenCalledWith("/rest/agile/1.0/sprint/1");
      expect(result.id).toBe(1);
      expect(result.name).toBe("Sprint 1");
      expect(result.goal).toBe("Complete feature X");
    });
  });

  describe("create", () => {
    test("creates a sprint with required fields", async () => {
      const mockSprint: Sprint = {
        id: 42,
        self: "https://example.atlassian.net/rest/agile/1.0/sprint/42",
        state: "future",
        name: "Sprint 10",
        originBoardId: 123,
      };

      const mockClient = {
        post: mock(() => Promise.resolve(mockSprint)),
      } as unknown as JiraClient;

      const endpoint = new SprintEndpoint(mockClient);
      const result = await endpoint.create({
        name: "Sprint 10",
        originBoardId: 123,
      });

      expect(mockClient.post).toHaveBeenCalledWith("/rest/agile/1.0/sprint", {
        name: "Sprint 10",
        originBoardId: 123,
      });
      expect(result.id).toBe(42);
      expect(result.name).toBe("Sprint 10");
      expect(result.state).toBe("future");
    });

    test("creates a sprint with all optional fields", async () => {
      const mockSprint: Sprint = {
        id: 43,
        self: "https://example.atlassian.net/rest/agile/1.0/sprint/43",
        state: "future",
        name: "Sprint 11",
        startDate: "2025-01-15T00:00:00.000Z",
        endDate: "2025-01-29T00:00:00.000Z",
        goal: "Complete feature Y",
        originBoardId: 123,
      };

      const mockClient = {
        post: mock(() => Promise.resolve(mockSprint)),
      } as unknown as JiraClient;

      const endpoint = new SprintEndpoint(mockClient);
      const result = await endpoint.create({
        name: "Sprint 11",
        startDate: "2025-01-15T00:00:00.000Z",
        endDate: "2025-01-29T00:00:00.000Z",
        goal: "Complete feature Y",
        originBoardId: 123,
      });

      expect(mockClient.post).toHaveBeenCalledWith("/rest/agile/1.0/sprint", {
        name: "Sprint 11",
        startDate: "2025-01-15T00:00:00.000Z",
        endDate: "2025-01-29T00:00:00.000Z",
        goal: "Complete feature Y",
        originBoardId: 123,
      });
      expect(result.id).toBe(43);
      expect(result.name).toBe("Sprint 11");
      expect(result.goal).toBe("Complete feature Y");
    });

    test("creates a sprint with only name and board ID", async () => {
      const mockSprint: Sprint = {
        id: 44,
        self: "https://example.atlassian.net/rest/agile/1.0/sprint/44",
        state: "future",
        name: "Sprint 12",
        originBoardId: 456,
      };

      const mockClient = {
        post: mock(() => Promise.resolve(mockSprint)),
      } as unknown as JiraClient;

      const endpoint = new SprintEndpoint(mockClient);
      const result = await endpoint.create({
        name: "Sprint 12",
        originBoardId: 456,
      });

      expect(mockClient.post).toHaveBeenCalledWith("/rest/agile/1.0/sprint", {
        name: "Sprint 12",
        originBoardId: 456,
      });
      expect(result.originBoardId).toBe(456);
    });
  });

  describe("addIssues", () => {
    test("adds a single issue to a sprint", async () => {
      const mockClient = {
        post: mock(() => Promise.resolve(undefined)),
      } as unknown as JiraClient;

      const endpoint = new SprintEndpoint(mockClient);
      await endpoint.addIssues(42, ["SCRY-123"]);

      expect(mockClient.post).toHaveBeenCalledWith("/rest/agile/1.0/sprint/42/issue", {
        issues: ["SCRY-123"],
      });
    });

    test("adds multiple issues to a sprint", async () => {
      const mockClient = {
        post: mock(() => Promise.resolve(undefined)),
      } as unknown as JiraClient;

      const endpoint = new SprintEndpoint(mockClient);
      await endpoint.addIssues(42, ["SCRY-123", "SCRY-456", "SCRY-789"]);

      expect(mockClient.post).toHaveBeenCalledWith("/rest/agile/1.0/sprint/42/issue", {
        issues: ["SCRY-123", "SCRY-456", "SCRY-789"],
      });
    });

    test("handles empty issue array", async () => {
      const mockClient = {
        post: mock(() => Promise.resolve(undefined)),
      } as unknown as JiraClient;

      const endpoint = new SprintEndpoint(mockClient);
      await endpoint.addIssues(42, []);

      expect(mockClient.post).toHaveBeenCalledWith("/rest/agile/1.0/sprint/42/issue", {
        issues: [],
      });
    });
  });
});

import { describe, expect, test, mock } from "bun:test";
import { ProjectEndpoint } from "../../../../src/api/endpoints/project.ts";
import type { JiraClient } from "../../../../src/api/client.ts";
import type { ProjectListResult, Project } from "../../../../src/api/types/project.ts";

describe("ProjectEndpoint", () => {
  describe("list", () => {
    test("fetches all projects", async () => {
      const mockResult: ProjectListResult = {
        self: "https://example.atlassian.net/rest/api/3/project/search",
        maxResults: 50,
        startAt: 0,
        total: 2,
        isLast: true,
        values: [
          {
            id: "10000",
            key: "TEST",
            name: "Test Project",
            projectTypeKey: "software",
            self: "https://example.atlassian.net/rest/api/3/project/10000",
            lead: {
              accountId: "123456:abcdef-1234-5678-9abc-def123456789",
              displayName: "John Doe",
              active: true,
            },
          },
          {
            id: "10001",
            key: "DEMO",
            name: "Demo Project",
            projectTypeKey: "business",
            self: "https://example.atlassian.net/rest/api/3/project/10001",
            lead: {
              accountId: "789012:fedcba-9876-5432-1fed-cba987654321",
              displayName: "Jane Smith",
              active: true,
            },
          },
        ],
      };

      const mockClient = {
        get: mock(() => Promise.resolve(mockResult)),
      } as unknown as JiraClient;

      const endpoint = new ProjectEndpoint(mockClient);
      const result = await endpoint.list();

      expect(mockClient.get).toHaveBeenCalledWith("/rest/api/3/project/search", {
        startAt: 0,
        maxResults: 50,
      });
      expect(result.values).toHaveLength(2);
      expect(result.values[0]?.key).toBe("TEST");
      expect(result.values[0]?.name).toBe("Test Project");
      expect(result.values[1]?.key).toBe("DEMO");
      expect(result.total).toBe(2);
    });

    test("applies pagination options", async () => {
      const mockResult: ProjectListResult = {
        self: "https://example.atlassian.net/rest/api/3/project/search",
        maxResults: 20,
        startAt: 10,
        total: 100,
        isLast: false,
        values: [],
      };

      const mockClient = {
        get: mock(() => Promise.resolve(mockResult)),
      } as unknown as JiraClient;

      const endpoint = new ProjectEndpoint(mockClient);
      await endpoint.list({ startAt: 10, maxResults: 20 });

      expect(mockClient.get).toHaveBeenCalledWith("/rest/api/3/project/search", {
        startAt: 10,
        maxResults: 20,
      });
    });

    test("applies query filter", async () => {
      const mockResult: ProjectListResult = {
        self: "https://example.atlassian.net/rest/api/3/project/search",
        maxResults: 50,
        startAt: 0,
        total: 1,
        isLast: true,
        values: [
          {
            id: "10000",
            key: "TEST",
            name: "Test Project",
            projectTypeKey: "software",
            self: "https://example.atlassian.net/rest/api/3/project/10000",
          },
        ],
      };

      const mockClient = {
        get: mock(() => Promise.resolve(mockResult)),
      } as unknown as JiraClient;

      const endpoint = new ProjectEndpoint(mockClient);
      await endpoint.list({ query: "test" });

      expect(mockClient.get).toHaveBeenCalledWith("/rest/api/3/project/search", {
        startAt: 0,
        maxResults: 50,
        query: "test",
      });
    });

    test("applies orderBy option", async () => {
      const mockResult: ProjectListResult = {
        self: "https://example.atlassian.net/rest/api/3/project/search",
        maxResults: 50,
        startAt: 0,
        total: 2,
        isLast: true,
        values: [],
      };

      const mockClient = {
        get: mock(() => Promise.resolve(mockResult)),
      } as unknown as JiraClient;

      const endpoint = new ProjectEndpoint(mockClient);
      await endpoint.list({ orderBy: "name" });

      expect(mockClient.get).toHaveBeenCalledWith("/rest/api/3/project/search", {
        startAt: 0,
        maxResults: 50,
        orderBy: "name",
      });
    });

    test("returns projects with different types", async () => {
      const mockResult: ProjectListResult = {
        self: "https://example.atlassian.net/rest/api/3/project/search",
        maxResults: 50,
        startAt: 0,
        total: 3,
        isLast: true,
        values: [
          {
            id: "10000",
            key: "SOFT",
            name: "Software Project",
            projectTypeKey: "software",
            self: "https://example.atlassian.net/rest/api/3/project/10000",
          },
          {
            id: "10001",
            key: "BUS",
            name: "Business Project",
            projectTypeKey: "business",
            self: "https://example.atlassian.net/rest/api/3/project/10001",
          },
          {
            id: "10002",
            key: "SVC",
            name: "Service Project",
            projectTypeKey: "service_desk",
            self: "https://example.atlassian.net/rest/api/3/project/10002",
          },
        ],
      };

      const mockClient = {
        get: mock(() => Promise.resolve(mockResult)),
      } as unknown as JiraClient;

      const endpoint = new ProjectEndpoint(mockClient);
      const result = await endpoint.list();

      expect(result.values).toHaveLength(3);
      expect(result.values[0]?.projectTypeKey).toBe("software");
      expect(result.values[1]?.projectTypeKey).toBe("business");
      expect(result.values[2]?.projectTypeKey).toBe("service_desk");
    });
  });

  describe("get", () => {
    test("fetches a single project by key", async () => {
      const mockProject: Project = {
        id: "10000",
        key: "TEST",
        name: "Test Project",
        projectTypeKey: "software",
        self: "https://example.atlassian.net/rest/api/3/project/10000",
        description: "A test project",
        lead: {
          accountId: "123456:abcdef-1234-5678-9abc-def123456789",
          displayName: "John Doe",
          active: true,
        },
      };

      const mockClient = {
        get: mock(() => Promise.resolve(mockProject)),
      } as unknown as JiraClient;

      const endpoint = new ProjectEndpoint(mockClient);
      const result = await endpoint.get("TEST");

      expect(mockClient.get).toHaveBeenCalledWith("/rest/api/3/project/TEST");
      expect(result.key).toBe("TEST");
      expect(result.name).toBe("Test Project");
      expect(result.description).toBe("A test project");
    });
  });
});

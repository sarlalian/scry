import { describe, expect, test, mock } from "bun:test";
import { VersionEndpoint } from "../../../../src/api/endpoints/version.ts";
import type { JiraClient } from "../../../../src/api/client.ts";
import type { Version } from "../../../../src/api/types/version.ts";

describe("VersionEndpoint", () => {
  describe("list", () => {
    test("fetches all versions for a project", async () => {
      const mockVersions: Version[] = [
        {
          id: "10000",
          name: "v1.0.0",
          description: "First release",
          archived: false,
          released: true,
          releaseDate: "2024-01-15",
          projectId: 10001,
          self: "https://example.atlassian.net/rest/api/3/version/10000",
        },
        {
          id: "10001",
          name: "v1.1.0",
          description: "Minor update",
          archived: false,
          released: false,
          projectId: 10001,
          self: "https://example.atlassian.net/rest/api/3/version/10001",
        },
      ];

      const mockClient = {
        get: mock(() => Promise.resolve(mockVersions)),
      } as unknown as JiraClient;

      const endpoint = new VersionEndpoint(mockClient);
      const result = await endpoint.list("TEST");

      expect(mockClient.get).toHaveBeenCalledWith("/rest/api/3/project/TEST/versions", {});
      expect(result).toHaveLength(2);
      expect(result[0]?.name).toBe("v1.0.0");
      expect(result[0]?.released).toBe(true);
      expect(result[1]?.name).toBe("v1.1.0");
      expect(result[1]?.released).toBe(false);
    });

    test("filters by released status", async () => {
      const mockVersions: Version[] = [
        {
          id: "10000",
          name: "v1.0.0",
          archived: false,
          released: true,
          releaseDate: "2024-01-15",
          projectId: 10001,
          self: "https://example.atlassian.net/rest/api/3/version/10000",
        },
      ];

      const mockClient = {
        get: mock(() => Promise.resolve(mockVersions)),
      } as unknown as JiraClient;

      const endpoint = new VersionEndpoint(mockClient);
      await endpoint.list("TEST", { status: "released" });

      expect(mockClient.get).toHaveBeenCalledWith("/rest/api/3/project/TEST/versions", {
        status: "released",
      });
    });

    test("filters by unreleased status", async () => {
      const mockVersions: Version[] = [
        {
          id: "10001",
          name: "v1.1.0",
          archived: false,
          released: false,
          projectId: 10001,
          self: "https://example.atlassian.net/rest/api/3/version/10001",
        },
      ];

      const mockClient = {
        get: mock(() => Promise.resolve(mockVersions)),
      } as unknown as JiraClient;

      const endpoint = new VersionEndpoint(mockClient);
      await endpoint.list("TEST", { status: "unreleased" });

      expect(mockClient.get).toHaveBeenCalledWith("/rest/api/3/project/TEST/versions", {
        status: "unreleased",
      });
    });

    test("filters by archived status", async () => {
      const mockVersions: Version[] = [
        {
          id: "10002",
          name: "v0.9.0",
          archived: true,
          released: true,
          releaseDate: "2023-12-01",
          projectId: 10001,
          self: "https://example.atlassian.net/rest/api/3/version/10002",
        },
      ];

      const mockClient = {
        get: mock(() => Promise.resolve(mockVersions)),
      } as unknown as JiraClient;

      const endpoint = new VersionEndpoint(mockClient);
      await endpoint.list("TEST", { status: "archived" });

      expect(mockClient.get).toHaveBeenCalledWith("/rest/api/3/project/TEST/versions", {
        status: "archived",
      });
    });

    test("applies orderBy option", async () => {
      const mockVersions: Version[] = [];

      const mockClient = {
        get: mock(() => Promise.resolve(mockVersions)),
      } as unknown as JiraClient;

      const endpoint = new VersionEndpoint(mockClient);
      await endpoint.list("TEST", { orderBy: "-releaseDate" });

      expect(mockClient.get).toHaveBeenCalledWith("/rest/api/3/project/TEST/versions", {
        orderBy: "-releaseDate",
      });
    });

    test("applies pagination options", async () => {
      const mockVersions: Version[] = [];

      const mockClient = {
        get: mock(() => Promise.resolve(mockVersions)),
      } as unknown as JiraClient;

      const endpoint = new VersionEndpoint(mockClient);
      await endpoint.list("TEST", { maxResults: 20, startAt: 10 });

      expect(mockClient.get).toHaveBeenCalledWith("/rest/api/3/project/TEST/versions", {
        maxResults: 20,
        startAt: 10,
      });
    });

    test("returns versions with all fields populated", async () => {
      const mockVersions: Version[] = [
        {
          id: "10000",
          name: "v2.0.0",
          description: "Major release with breaking changes",
          archived: false,
          released: true,
          startDate: "2024-01-01",
          releaseDate: "2024-03-15",
          overdue: false,
          userStartDate: "01/Jan/24",
          userReleaseDate: "15/Mar/24",
          projectId: 10001,
          self: "https://example.atlassian.net/rest/api/3/version/10000",
        },
      ];

      const mockClient = {
        get: mock(() => Promise.resolve(mockVersions)),
      } as unknown as JiraClient;

      const endpoint = new VersionEndpoint(mockClient);
      const result = await endpoint.list("TEST");

      expect(result).toHaveLength(1);
      expect(result[0]?.name).toBe("v2.0.0");
      expect(result[0]?.description).toBe("Major release with breaking changes");
      expect(result[0]?.startDate).toBe("2024-01-01");
      expect(result[0]?.releaseDate).toBe("2024-03-15");
      expect(result[0]?.overdue).toBe(false);
    });
  });

  describe("get", () => {
    test("fetches a single version by id", async () => {
      const mockVersion: Version = {
        id: "10000",
        name: "v1.0.0",
        description: "First release",
        archived: false,
        released: true,
        releaseDate: "2024-01-15",
        projectId: 10001,
        self: "https://example.atlassian.net/rest/api/3/version/10000",
      };

      const mockClient = {
        get: mock(() => Promise.resolve(mockVersion)),
      } as unknown as JiraClient;

      const endpoint = new VersionEndpoint(mockClient);
      const result = await endpoint.get("10000");

      expect(mockClient.get).toHaveBeenCalledWith("/rest/api/3/version/10000");
      expect(result.id).toBe("10000");
      expect(result.name).toBe("v1.0.0");
      expect(result.description).toBe("First release");
    });
  });

  describe("create", () => {
    test("creates a new version with required fields", async () => {
      const mockCreatedVersion: Version = {
        id: "10003",
        name: "v2.0.0",
        archived: false,
        released: false,
        projectId: 10001,
        self: "https://example.atlassian.net/rest/api/3/version/10003",
      };

      const mockClient = {
        post: mock(() => Promise.resolve(mockCreatedVersion)),
      } as unknown as JiraClient;

      const endpoint = new VersionEndpoint(mockClient);
      const result = await endpoint.create({
        name: "v2.0.0",
        projectId: 10001,
      });

      expect(mockClient.post).toHaveBeenCalledWith("/rest/api/3/version", {
        name: "v2.0.0",
        projectId: 10001,
      });
      expect(result.id).toBe("10003");
      expect(result.name).toBe("v2.0.0");
      expect(result.projectId).toBe(10001);
    });

    test("creates a version with all optional fields", async () => {
      const mockCreatedVersion: Version = {
        id: "10004",
        name: "v2.1.0",
        description: "Feature release",
        archived: false,
        released: false,
        startDate: "2024-01-01T00:00:00.000Z",
        releaseDate: "2024-06-01T00:00:00.000Z",
        projectId: 10001,
        self: "https://example.atlassian.net/rest/api/3/version/10004",
      };

      const mockClient = {
        post: mock(() => Promise.resolve(mockCreatedVersion)),
      } as unknown as JiraClient;

      const endpoint = new VersionEndpoint(mockClient);
      const result = await endpoint.create({
        name: "v2.1.0",
        projectId: 10001,
        description: "Feature release",
        startDate: "2024-01-01T00:00:00.000Z",
        releaseDate: "2024-06-01T00:00:00.000Z",
      });

      expect(mockClient.post).toHaveBeenCalledWith("/rest/api/3/version", {
        name: "v2.1.0",
        projectId: 10001,
        description: "Feature release",
        startDate: "2024-01-01T00:00:00.000Z",
        releaseDate: "2024-06-01T00:00:00.000Z",
      });
      expect(result.id).toBe("10004");
      expect(result.name).toBe("v2.1.0");
      expect(result.description).toBe("Feature release");
      expect(result.startDate).toBe("2024-01-01T00:00:00.000Z");
      expect(result.releaseDate).toBe("2024-06-01T00:00:00.000Z");
    });

    test("creates a version marked as released", async () => {
      const mockCreatedVersion: Version = {
        id: "10005",
        name: "v1.5.0",
        archived: false,
        released: true,
        releaseDate: "2024-03-15T00:00:00.000Z",
        projectId: 10001,
        self: "https://example.atlassian.net/rest/api/3/version/10005",
      };

      const mockClient = {
        post: mock(() => Promise.resolve(mockCreatedVersion)),
      } as unknown as JiraClient;

      const endpoint = new VersionEndpoint(mockClient);
      const result = await endpoint.create({
        name: "v1.5.0",
        projectId: 10001,
        releaseDate: "2024-03-15T00:00:00.000Z",
        released: true,
      });

      expect(mockClient.post).toHaveBeenCalledWith("/rest/api/3/version", {
        name: "v1.5.0",
        projectId: 10001,
        releaseDate: "2024-03-15T00:00:00.000Z",
        released: true,
      });
      expect(result.released).toBe(true);
    });

    test("creates a version marked as archived", async () => {
      const mockCreatedVersion: Version = {
        id: "10006",
        name: "v0.9.0",
        archived: true,
        released: true,
        projectId: 10001,
        self: "https://example.atlassian.net/rest/api/3/version/10006",
      };

      const mockClient = {
        post: mock(() => Promise.resolve(mockCreatedVersion)),
      } as unknown as JiraClient;

      const endpoint = new VersionEndpoint(mockClient);
      const result = await endpoint.create({
        name: "v0.9.0",
        projectId: 10001,
        archived: true,
        released: true,
      });

      expect(mockClient.post).toHaveBeenCalledWith("/rest/api/3/version", {
        name: "v0.9.0",
        projectId: 10001,
        archived: true,
        released: true,
      });
      expect(result.archived).toBe(true);
    });
  });
});

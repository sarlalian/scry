import { describe, expect, test, mock } from "bun:test";
import { UserEndpoint } from "../../../../src/api/endpoints/user.ts";
import type { JiraClient } from "../../../../src/api/client.ts";
import type { User } from "../../../../src/api/types/user.ts";

describe("UserEndpoint", () => {
  describe("getMyself", () => {
    test("fetches current user information", async () => {
      const mockUser: User = {
        accountId: "user123",
        emailAddress: "user@example.com",
        displayName: "Test User",
        active: true,
        self: "https://example.atlassian.net/rest/api/3/user?accountId=user123",
      };

      const mockClient = {
        get: mock(() => Promise.resolve(mockUser)),
      } as unknown as JiraClient;

      const endpoint = new UserEndpoint(mockClient);
      const result = await endpoint.getMyself();

      expect(mockClient.get).toHaveBeenCalledWith("/rest/api/3/myself");
      expect(result.accountId).toBe("user123");
      expect(result.displayName).toBe("Test User");
      expect(result.emailAddress).toBe("user@example.com");
    });
  });

  describe("search", () => {
    test("searches for users with a query", async () => {
      const mockUsers: User[] = [
        {
          accountId: "user1",
          emailAddress: "john@example.com",
          displayName: "John Doe",
          active: true,
          self: "https://example.atlassian.net/rest/api/3/user?accountId=user1",
        },
        {
          accountId: "user2",
          emailAddress: "jane@example.com",
          displayName: "Jane Doe",
          active: true,
          self: "https://example.atlassian.net/rest/api/3/user?accountId=user2",
        },
      ];

      const mockClient = {
        get: mock(() => Promise.resolve(mockUsers)),
      } as unknown as JiraClient;

      const endpoint = new UserEndpoint(mockClient);
      const result = await endpoint.search("doe");

      expect(mockClient.get).toHaveBeenCalledWith("/rest/api/3/user/search", {
        query: "doe",
        maxResults: 50,
        startAt: 0,
      });
      expect(result).toHaveLength(2);
      expect(result[0]?.displayName).toBe("John Doe");
      expect(result[1]?.displayName).toBe("Jane Doe");
    });

    test("applies custom pagination options", async () => {
      const mockUsers: User[] = [];

      const mockClient = {
        get: mock(() => Promise.resolve(mockUsers)),
      } as unknown as JiraClient;

      const endpoint = new UserEndpoint(mockClient);
      await endpoint.search("test", { maxResults: 10, startAt: 20 });

      expect(mockClient.get).toHaveBeenCalledWith("/rest/api/3/user/search", {
        query: "test",
        maxResults: 10,
        startAt: 20,
      });
    });

    test("uses default pagination when not specified", async () => {
      const mockUsers: User[] = [];

      const mockClient = {
        get: mock(() => Promise.resolve(mockUsers)),
      } as unknown as JiraClient;

      const endpoint = new UserEndpoint(mockClient);
      await endpoint.search("query");

      expect(mockClient.get).toHaveBeenCalledWith("/rest/api/3/user/search", {
        query: "query",
        maxResults: 50,
        startAt: 0,
      });
    });
  });

  describe("getUser", () => {
    test("fetches a user by account ID", async () => {
      const mockUser: User = {
        accountId: "user456",
        emailAddress: "specific@example.com",
        displayName: "Specific User",
        active: true,
        self: "https://example.atlassian.net/rest/api/3/user?accountId=user456",
      };

      const mockClient = {
        get: mock(() => Promise.resolve(mockUser)),
      } as unknown as JiraClient;

      const endpoint = new UserEndpoint(mockClient);
      const result = await endpoint.getUser("user456");

      expect(mockClient.get).toHaveBeenCalledWith("/rest/api/3/user", {
        accountId: "user456",
      });
      expect(result.accountId).toBe("user456");
      expect(result.displayName).toBe("Specific User");
    });
  });

  describe("findAssignable", () => {
    test("finds assignable users for a project", async () => {
      const mockUsers: User[] = [
        {
          accountId: "user1",
          emailAddress: "assignee1@example.com",
          displayName: "Assignee One",
          active: true,
          self: "https://example.atlassian.net/rest/api/3/user?accountId=user1",
        },
        {
          accountId: "user2",
          emailAddress: "assignee2@example.com",
          displayName: "Assignee Two",
          active: true,
          self: "https://example.atlassian.net/rest/api/3/user?accountId=user2",
        },
      ];

      const mockClient = {
        get: mock(() => Promise.resolve(mockUsers)),
      } as unknown as JiraClient;

      const endpoint = new UserEndpoint(mockClient);
      const result = await endpoint.findAssignable("SCRY");

      expect(mockClient.get).toHaveBeenCalledWith("/rest/api/3/user/assignable/search", {
        project: "SCRY",
        query: undefined,
        maxResults: 50,
      });
      expect(result).toHaveLength(2);
      expect(result[0]?.displayName).toBe("Assignee One");
      expect(result[1]?.displayName).toBe("Assignee Two");
    });

    test("applies query filter when provided", async () => {
      const mockUsers: User[] = [];

      const mockClient = {
        get: mock(() => Promise.resolve(mockUsers)),
      } as unknown as JiraClient;

      const endpoint = new UserEndpoint(mockClient);
      await endpoint.findAssignable("SCRY", "john");

      expect(mockClient.get).toHaveBeenCalledWith("/rest/api/3/user/assignable/search", {
        project: "SCRY",
        query: "john",
        maxResults: 50,
      });
    });

    test("applies custom maxResults option", async () => {
      const mockUsers: User[] = [];

      const mockClient = {
        get: mock(() => Promise.resolve(mockUsers)),
      } as unknown as JiraClient;

      const endpoint = new UserEndpoint(mockClient);
      await endpoint.findAssignable("SCRY", "test", { maxResults: 25 });

      expect(mockClient.get).toHaveBeenCalledWith("/rest/api/3/user/assignable/search", {
        project: "SCRY",
        query: "test",
        maxResults: 25,
      });
    });

    test("handles project key with special characters", async () => {
      const mockUsers: User[] = [];

      const mockClient = {
        get: mock(() => Promise.resolve(mockUsers)),
      } as unknown as JiraClient;

      const endpoint = new UserEndpoint(mockClient);
      await endpoint.findAssignable("PROJECT-KEY-123");

      expect(mockClient.get).toHaveBeenCalledWith("/rest/api/3/user/assignable/search", {
        project: "PROJECT-KEY-123",
        query: undefined,
        maxResults: 50,
      });
    });
  });
});

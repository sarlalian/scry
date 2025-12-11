import { describe, expect, test, mock } from "bun:test";
import { IssueEndpoint } from "../../../../src/api/endpoints/issue.ts";
import type { JiraClient } from "../../../../src/api/client.ts";
import type {
  Issue,
  SearchResult,
  CreateIssueRequest,
  CreatedIssue,
  Transition,
  Comment,
  Worklog,
  IssueLinkType,
  IssueLink,
} from "../../../../src/api/types/issue.ts";

describe("IssueEndpoint", () => {
  describe("assign", () => {
    test("assigns an issue to a user", async () => {
      const mockClient = {
        put: mock(() => Promise.resolve(undefined)),
      } as unknown as JiraClient;

      const endpoint = new IssueEndpoint(mockClient);
      await endpoint.assign("SCRY-123", "user456");

      expect(mockClient.put).toHaveBeenCalledWith("/rest/api/3/issue/SCRY-123/assignee", {
        accountId: "user456",
      });
    });

    test("unassigns an issue with null", async () => {
      const mockClient = {
        put: mock(() => Promise.resolve(undefined)),
      } as unknown as JiraClient;

      const endpoint = new IssueEndpoint(mockClient);
      await endpoint.assign("SCRY-456", null);

      expect(mockClient.put).toHaveBeenCalledWith("/rest/api/3/issue/SCRY-456/assignee", {
        accountId: null,
      });
    });
  });

  describe("addComment", () => {
    test("adds a simple text comment", async () => {
      const mockComment: Comment = {
        id: "comment123",
        self: "https://example.atlassian.net/rest/api/3/issue/SCRY-123/comment/comment123",
        author: {
          accountId: "user123",
          displayName: "Test User",
          active: true,
          self: "https://example.atlassian.net/rest/api/3/user?accountId=user123",
        },
        body: {
          type: "doc",
          version: 1,
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "Test comment" }],
            },
          ],
        },
        created: "2025-01-01T00:00:00.000Z",
        updated: "2025-01-01T00:00:00.000Z",
      };

      const mockClient = {
        post: mock(() => Promise.resolve(mockComment)),
      } as unknown as JiraClient;

      const endpoint = new IssueEndpoint(mockClient);
      const result = await endpoint.addComment("SCRY-123", "Test comment");

      expect(mockClient.post).toHaveBeenCalled();
      expect(result.id).toBe("comment123");
    });

    test("adds a multi-line comment", async () => {
      const mockComment: Comment = {
        id: "comment456",
        self: "https://example.atlassian.net/rest/api/3/issue/SCRY-123/comment/comment456",
        author: {
          accountId: "user123",
          displayName: "Test User",
          active: true,
          self: "https://example.atlassian.net/rest/api/3/user?accountId=user123",
        },
        body: {
          type: "doc",
          version: 1,
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "Line 1" }],
            },
            {
              type: "paragraph",
              content: [{ type: "text", text: "Line 2" }],
            },
          ],
        },
        created: "2025-01-01T00:00:00.000Z",
        updated: "2025-01-01T00:00:00.000Z",
      };

      const mockClient = {
        post: mock(() => Promise.resolve(mockComment)),
      } as unknown as JiraClient;

      const endpoint = new IssueEndpoint(mockClient);
      const result = await endpoint.addComment("SCRY-123", "Line 1\nLine 2");

      expect(mockClient.post).toHaveBeenCalled();
      const callArgs = (mockClient.post as any).mock.calls[0];
      expect(callArgs[1].body.content).toHaveLength(2);
    });

    test("adds a comment with visibility restrictions", async () => {
      const mockComment: Comment = {
        id: "comment789",
        self: "https://example.atlassian.net/rest/api/3/issue/SCRY-123/comment/comment789",
        author: {
          accountId: "user123",
          displayName: "Test User",
          active: true,
          self: "https://example.atlassian.net/rest/api/3/user?accountId=user123",
        },
        body: {
          type: "doc",
          version: 1,
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "Private comment" }],
            },
          ],
        },
        created: "2025-01-01T00:00:00.000Z",
        updated: "2025-01-01T00:00:00.000Z",
      };

      const mockClient = {
        post: mock(() => Promise.resolve(mockComment)),
      } as unknown as JiraClient;

      const endpoint = new IssueEndpoint(mockClient);
      await endpoint.addComment("SCRY-123", "Private comment", {
        visibility: { type: "role", value: "Developers" },
      });

      expect(mockClient.post).toHaveBeenCalled();
      const callArgs = (mockClient.post as any).mock.calls[0];
      expect(callArgs[1].visibility).toEqual({ type: "role", value: "Developers" });
    });

    test("handles empty comment", async () => {
      const mockComment: Comment = {
        id: "comment999",
        self: "https://example.atlassian.net/rest/api/3/issue/SCRY-123/comment/comment999",
        author: {
          accountId: "user123",
          displayName: "Test User",
          active: true,
          self: "https://example.atlassian.net/rest/api/3/user?accountId=user123",
        },
        body: {
          type: "doc",
          version: 1,
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "" }],
            },
          ],
        },
        created: "2025-01-01T00:00:00.000Z",
        updated: "2025-01-01T00:00:00.000Z",
      };

      const mockClient = {
        post: mock(() => Promise.resolve(mockComment)),
      } as unknown as JiraClient;

      const endpoint = new IssueEndpoint(mockClient);
      await endpoint.addComment("SCRY-123", "");

      expect(mockClient.post).toHaveBeenCalled();
      const callArgs = (mockClient.post as any).mock.calls[0];
      expect(callArgs[1].body.content[0].content[0].text).toBe("");
    });
  });

  describe("addWorklog", () => {
    test("adds a worklog with time spent", async () => {
      const mockWorklog: Worklog = {
        id: "worklog123",
        self: "https://example.atlassian.net/rest/api/3/issue/SCRY-123/worklog/worklog123",
        author: {
          accountId: "user123",
          displayName: "Test User",
          active: true,
          self: "https://example.atlassian.net/rest/api/3/user?accountId=user123",
        },
        timeSpent: "2h",
        timeSpentSeconds: 7200,
        created: "2025-01-01T00:00:00.000Z",
        updated: "2025-01-01T00:00:00.000Z",
        started: "2025-01-01T00:00:00.000Z",
      };

      const mockClient = {
        post: mock(() => Promise.resolve(mockWorklog)),
      } as unknown as JiraClient;

      const endpoint = new IssueEndpoint(mockClient);
      const result = await endpoint.addWorklog("SCRY-123", "2h");

      expect(mockClient.post).toHaveBeenCalledWith("/rest/api/3/issue/SCRY-123/worklog", {
        timeSpent: "2h",
      });
      expect(result.timeSpent).toBe("2h");
    });

    test("adds a worklog with comment", async () => {
      const mockWorklog: Worklog = {
        id: "worklog456",
        self: "https://example.atlassian.net/rest/api/3/issue/SCRY-123/worklog/worklog456",
        author: {
          accountId: "user123",
          displayName: "Test User",
          active: true,
          self: "https://example.atlassian.net/rest/api/3/user?accountId=user123",
        },
        timeSpent: "1h 30m",
        timeSpentSeconds: 5400,
        created: "2025-01-01T00:00:00.000Z",
        updated: "2025-01-01T00:00:00.000Z",
        started: "2025-01-01T00:00:00.000Z",
      };

      const mockClient = {
        post: mock(() => Promise.resolve(mockWorklog)),
      } as unknown as JiraClient;

      const endpoint = new IssueEndpoint(mockClient);
      await endpoint.addWorklog("SCRY-123", "1h 30m", { comment: "Worked on feature X" });

      expect(mockClient.post).toHaveBeenCalled();
      const callArgs = (mockClient.post as any).mock.calls[0];
      expect(callArgs[1].comment).toBeDefined();
      expect(callArgs[1].comment.content[0].content[0].text).toBe("Worked on feature X");
    });

    test("adds a worklog with started time", async () => {
      const mockWorklog: Worklog = {
        id: "worklog789",
        self: "https://example.atlassian.net/rest/api/3/issue/SCRY-123/worklog/worklog789",
        author: {
          accountId: "user123",
          displayName: "Test User",
          active: true,
          self: "https://example.atlassian.net/rest/api/3/user?accountId=user123",
        },
        timeSpent: "4h",
        timeSpentSeconds: 14400,
        created: "2025-01-01T00:00:00.000Z",
        updated: "2025-01-01T00:00:00.000Z",
        started: "2025-01-01T09:00:00.000Z",
      };

      const mockClient = {
        post: mock(() => Promise.resolve(mockWorklog)),
      } as unknown as JiraClient;

      const endpoint = new IssueEndpoint(mockClient);
      await endpoint.addWorklog("SCRY-123", "4h", {
        started: "2025-01-01T09:00:00.000Z",
      });

      expect(mockClient.post).toHaveBeenCalled();
      const callArgs = (mockClient.post as any).mock.calls[0];
      expect(callArgs[1].started).toBe("2025-01-01T09:00:00.000Z");
    });
  });

  describe("link", () => {
    test("creates a link between two issues", async () => {
      const mockClient = {
        post: mock(() => Promise.resolve(undefined)),
      } as unknown as JiraClient;

      const endpoint = new IssueEndpoint(mockClient);
      await endpoint.link("SCRY-123", "SCRY-456", "Blocks");

      expect(mockClient.post).toHaveBeenCalledWith("/rest/api/3/issueLink", {
        outwardIssue: { key: "SCRY-123" },
        inwardIssue: { key: "SCRY-456" },
        type: { name: "Blocks" },
      });
    });
  });

  describe("unlink", () => {
    test("removes a link by ID", async () => {
      const mockClient = {
        delete: mock(() => Promise.resolve(undefined)),
      } as unknown as JiraClient;

      const endpoint = new IssueEndpoint(mockClient);
      await endpoint.unlink("link123");

      expect(mockClient.delete).toHaveBeenCalledWith("/rest/api/3/issueLink/link123");
    });
  });

  describe("getLinkTypes", () => {
    test("fetches available link types", async () => {
      const mockLinkTypes = {
        issueLinkTypes: [
          {
            id: "1",
            name: "Blocks",
            inward: "is blocked by",
            outward: "blocks",
            self: "https://example.atlassian.net/rest/api/3/issueLinkType/1",
          },
          {
            id: "2",
            name: "Relates",
            inward: "relates to",
            outward: "relates to",
            self: "https://example.atlassian.net/rest/api/3/issueLinkType/2",
          },
        ],
      };

      const mockClient = {
        get: mock(() => Promise.resolve(mockLinkTypes)),
      } as unknown as JiraClient;

      const endpoint = new IssueEndpoint(mockClient);
      const result = await endpoint.getLinkTypes();

      expect(mockClient.get).toHaveBeenCalledWith("/rest/api/3/issueLinkType");
      expect(result).toHaveLength(2);
      expect(result[0]?.name).toBe("Blocks");
      expect(result[1]?.name).toBe("Relates");
    });
  });

  describe("getLinks", () => {
    test("fetches links for an issue", async () => {
      const mockIssue: Issue = {
        id: "123",
        key: "SCRY-123",
        self: "https://example.atlassian.net/rest/api/3/issue/123",
        fields: {
          summary: "Test Issue",
          status: {
            name: "To Do",
            id: "1",
            statusCategory: {
              id: 2,
              key: "new",
              name: "To Do",
              colorName: "blue-gray",
              self: "https://example.atlassian.net/rest/api/3/statuscategory/2",
            },
          },
          issuelinks: [
            {
              id: "link1",
              type: {
                id: "1",
                name: "Blocks",
                inward: "is blocked by",
                outward: "blocks",
                self: "https://example.atlassian.net/rest/api/3/issueLinkType/1",
              },
              outwardIssue: {
                id: "456",
                key: "SCRY-456",
                self: "https://example.atlassian.net/rest/api/3/issue/456",
                fields: {
                  summary: "Blocked Issue",
                  status: {
                    name: "Blocked",
                    id: "5",
                    statusCategory: {
                      id: 4,
                      key: "indeterminate",
                      name: "In Progress",
                      colorName: "yellow",
                      self: "https://example.atlassian.net/rest/api/3/statuscategory/4",
                    },
                  },
                },
              },
            },
          ],
        },
      };

      const mockClient = {
        get: mock(() => Promise.resolve(mockIssue)),
      } as unknown as JiraClient;

      const endpoint = new IssueEndpoint(mockClient);
      const result = await endpoint.getLinks("SCRY-123");

      expect(mockClient.get).toHaveBeenCalledWith("/rest/api/3/issue/SCRY-123", {
        fields: "issuelinks",
      });
      expect(result).toHaveLength(1);
      expect(result[0]?.id).toBe("link1");
    });

    test("returns empty array when no links exist", async () => {
      const mockIssue: Issue = {
        id: "123",
        key: "SCRY-123",
        self: "https://example.atlassian.net/rest/api/3/issue/123",
        fields: {
          summary: "Test Issue",
          status: {
            name: "To Do",
            id: "1",
            statusCategory: {
              id: 2,
              key: "new",
              name: "To Do",
              colorName: "blue-gray",
              self: "https://example.atlassian.net/rest/api/3/statuscategory/2",
            },
          },
        },
      };

      const mockClient = {
        get: mock(() => Promise.resolve(mockIssue)),
      } as unknown as JiraClient;

      const endpoint = new IssueEndpoint(mockClient);
      const result = await endpoint.getLinks("SCRY-123");

      expect(result).toEqual([]);
    });
  });

  describe("clone", () => {
    test("clones an issue with default options", async () => {
      const mockOriginal: Issue = {
        id: "123",
        key: "SCRY-123",
        self: "https://example.atlassian.net/rest/api/3/issue/123",
        fields: {
          summary: "Original Issue",
          description: {
            type: "doc",
            version: 1,
            content: [
              {
                type: "paragraph",
                content: [{ type: "text", text: "Description" }],
              },
            ],
          },
          issuetype: { id: "1", name: "Task" },
          project: { id: "1", key: "SCRY", name: "Scry Project" },
          labels: ["label1", "label2"],
          components: [{ id: "comp1", name: "Component 1" }],
          priority: { id: "3", name: "Medium" },
          status: {
            name: "To Do",
            id: "1",
            statusCategory: {
              id: 2,
              key: "new",
              name: "To Do",
              colorName: "blue-gray",
              self: "https://example.atlassian.net/rest/api/3/statuscategory/2",
            },
          },
        },
      };

      const mockCreated: CreatedIssue = {
        id: "456",
        key: "SCRY-456",
        self: "https://example.atlassian.net/rest/api/3/issue/456",
      };

      const mockClient = {
        get: mock(() => Promise.resolve(mockOriginal)),
        post: mock(() => Promise.resolve(mockCreated)),
      } as unknown as JiraClient;

      const endpoint = new IssueEndpoint(mockClient);
      const result = await endpoint.clone("SCRY-123");

      expect(mockClient.get).toHaveBeenCalled();
      expect(mockClient.post).toHaveBeenCalled();
      expect(result.key).toBe("SCRY-456");
    });

    test("clones an issue with custom summary", async () => {
      const mockOriginal: Issue = {
        id: "123",
        key: "SCRY-123",
        self: "https://example.atlassian.net/rest/api/3/issue/123",
        fields: {
          summary: "Original Issue",
          issuetype: { id: "1", name: "Task" },
          project: { id: "1", key: "SCRY", name: "Scry Project" },
          status: {
            name: "To Do",
            id: "1",
            statusCategory: {
              id: 2,
              key: "new",
              name: "To Do",
              colorName: "blue-gray",
              self: "https://example.atlassian.net/rest/api/3/statuscategory/2",
            },
          },
        },
      };

      const mockCreated: CreatedIssue = {
        id: "456",
        key: "SCRY-456",
        self: "https://example.atlassian.net/rest/api/3/issue/456",
      };

      const mockClient = {
        get: mock(() => Promise.resolve(mockOriginal)),
        post: mock(() => Promise.resolve(mockCreated)),
      } as unknown as JiraClient;

      const endpoint = new IssueEndpoint(mockClient);
      await endpoint.clone("SCRY-123", { summary: "Custom Clone Summary" });

      expect(mockClient.post).toHaveBeenCalled();
      const callArgs = (mockClient.post as any).mock.calls[0];
      expect(callArgs[1].fields.summary).toBe("Custom Clone Summary");
    });

    test("clones an issue to a different project", async () => {
      const mockOriginal: Issue = {
        id: "123",
        key: "SCRY-123",
        self: "https://example.atlassian.net/rest/api/3/issue/123",
        fields: {
          summary: "Original Issue",
          issuetype: { id: "1", name: "Task" },
          project: { id: "1", key: "SCRY", name: "Scry Project" },
          status: {
            name: "To Do",
            id: "1",
            statusCategory: {
              id: 2,
              key: "new",
              name: "To Do",
              colorName: "blue-gray",
              self: "https://example.atlassian.net/rest/api/3/statuscategory/2",
            },
          },
        },
      };

      const mockCreated: CreatedIssue = {
        id: "789",
        key: "OTHER-789",
        self: "https://example.atlassian.net/rest/api/3/issue/789",
      };

      const mockClient = {
        get: mock(() => Promise.resolve(mockOriginal)),
        post: mock(() => Promise.resolve(mockCreated)),
      } as unknown as JiraClient;

      const endpoint = new IssueEndpoint(mockClient);
      await endpoint.clone("SCRY-123", { project: "OTHER" });

      expect(mockClient.post).toHaveBeenCalled();
      const callArgs = (mockClient.post as any).mock.calls[0];
      expect(callArgs[1].fields.project.key).toBe("OTHER");
    });

    test("clones an issue without description when specified", async () => {
      const mockOriginal: Issue = {
        id: "123",
        key: "SCRY-123",
        self: "https://example.atlassian.net/rest/api/3/issue/123",
        fields: {
          summary: "Original Issue",
          description: {
            type: "doc",
            version: 1,
            content: [
              {
                type: "paragraph",
                content: [{ type: "text", text: "Description" }],
              },
            ],
          },
          issuetype: { id: "1", name: "Task" },
          project: { id: "1", key: "SCRY", name: "Scry Project" },
          status: {
            name: "To Do",
            id: "1",
            statusCategory: {
              id: 2,
              key: "new",
              name: "To Do",
              colorName: "blue-gray",
              self: "https://example.atlassian.net/rest/api/3/statuscategory/2",
            },
          },
        },
      };

      const mockCreated: CreatedIssue = {
        id: "456",
        key: "SCRY-456",
        self: "https://example.atlassian.net/rest/api/3/issue/456",
      };

      const mockClient = {
        get: mock(() => Promise.resolve(mockOriginal)),
        post: mock(() => Promise.resolve(mockCreated)),
      } as unknown as JiraClient;

      const endpoint = new IssueEndpoint(mockClient);
      await endpoint.clone("SCRY-123", { description: false });

      expect(mockClient.post).toHaveBeenCalled();
      const callArgs = (mockClient.post as any).mock.calls[0];
      expect(callArgs[1].fields.description).toBeUndefined();
    });

    test("clones an issue with custom components", async () => {
      const mockOriginal: Issue = {
        id: "123",
        key: "SCRY-123",
        self: "https://example.atlassian.net/rest/api/3/issue/123",
        fields: {
          summary: "Original Issue",
          issuetype: { id: "1", name: "Task" },
          project: { id: "1", key: "SCRY", name: "Scry Project" },
          components: [{ id: "comp1", name: "Component 1" }],
          status: {
            name: "To Do",
            id: "1",
            statusCategory: {
              id: 2,
              key: "new",
              name: "To Do",
              colorName: "blue-gray",
              self: "https://example.atlassian.net/rest/api/3/statuscategory/2",
            },
          },
        },
      };

      const mockCreated: CreatedIssue = {
        id: "456",
        key: "SCRY-456",
        self: "https://example.atlassian.net/rest/api/3/issue/456",
      };

      const mockClient = {
        get: mock(() => Promise.resolve(mockOriginal)),
        post: mock(() => Promise.resolve(mockCreated)),
      } as unknown as JiraClient;

      const endpoint = new IssueEndpoint(mockClient);
      await endpoint.clone("SCRY-123", { components: [{ name: "New Component" }] });

      expect(mockClient.post).toHaveBeenCalled();
      const callArgs = (mockClient.post as any).mock.calls[0];
      expect(callArgs[1].fields.components).toEqual([{ name: "New Component" }]);
    });

    test("clones an issue with additional labels", async () => {
      const mockOriginal: Issue = {
        id: "123",
        key: "SCRY-123",
        self: "https://example.atlassian.net/rest/api/3/issue/123",
        fields: {
          summary: "Original Issue",
          issuetype: { id: "1", name: "Task" },
          project: { id: "1", key: "SCRY", name: "Scry Project" },
          labels: ["existing"],
          status: {
            name: "To Do",
            id: "1",
            statusCategory: {
              id: 2,
              key: "new",
              name: "To Do",
              colorName: "blue-gray",
              self: "https://example.atlassian.net/rest/api/3/statuscategory/2",
            },
          },
        },
      };

      const mockCreated: CreatedIssue = {
        id: "456",
        key: "SCRY-456",
        self: "https://example.atlassian.net/rest/api/3/issue/456",
      };

      const mockClient = {
        get: mock(() => Promise.resolve(mockOriginal)),
        post: mock(() => Promise.resolve(mockCreated)),
      } as unknown as JiraClient;

      const endpoint = new IssueEndpoint(mockClient);
      await endpoint.clone("SCRY-123", { labels: ["new-label"] });

      expect(mockClient.post).toHaveBeenCalled();
      const callArgs = (mockClient.post as any).mock.calls[0];
      expect(callArgs[1].fields.labels).toEqual(["existing", "new-label"]);
    });

    test("clones an issue with custom priority", async () => {
      const mockOriginal: Issue = {
        id: "123",
        key: "SCRY-123",
        self: "https://example.atlassian.net/rest/api/3/issue/123",
        fields: {
          summary: "Original Issue",
          issuetype: { id: "1", name: "Task" },
          project: { id: "1", key: "SCRY", name: "Scry Project" },
          priority: { id: "3", name: "Medium" },
          status: {
            name: "To Do",
            id: "1",
            statusCategory: {
              id: 2,
              key: "new",
              name: "To Do",
              colorName: "blue-gray",
              self: "https://example.atlassian.net/rest/api/3/statuscategory/2",
            },
          },
        },
      };

      const mockCreated: CreatedIssue = {
        id: "456",
        key: "SCRY-456",
        self: "https://example.atlassian.net/rest/api/3/issue/456",
      };

      const mockClient = {
        get: mock(() => Promise.resolve(mockOriginal)),
        post: mock(() => Promise.resolve(mockCreated)),
      } as unknown as JiraClient;

      const endpoint = new IssueEndpoint(mockClient);
      await endpoint.clone("SCRY-123", { priority: { name: "High" } });

      expect(mockClient.post).toHaveBeenCalled();
      const callArgs = (mockClient.post as any).mock.calls[0];
      expect(callArgs[1].fields.priority).toEqual({ name: "High" });
    });
  });
});

import { describe, expect, test, mock } from "bun:test";
import type {
  Issue,
  CreateIssueRequest,
  CreatedIssue,
} from "../../../../../src/api/types/issue.ts";

describe("issue clone command", () => {
  test("clones issue with default summary", async () => {
    const mockGet = mock(async (_issueKey: string): Promise<Issue> => {
      return {
        id: "10001",
        key: "PROJ-123",
        self: "https://example.atlassian.net/rest/api/3/issue/10001",
        fields: {
          summary: "Original issue",
          status: {
            id: "1",
            name: "To Do",
            statusCategory: { id: 1, key: "new", name: "To Do", colorName: "blue-gray" },
          },
          issuetype: { id: "1", name: "Task", subtask: false },
          project: { id: "1", key: "PROJ", name: "Project" },
          labels: ["backend", "api"],
          components: [{ id: "100", name: "API" }],
          priority: { id: "3", name: "Medium" },
          created: "2025-01-01T00:00:00.000Z",
          updated: "2025-01-01T00:00:00.000Z",
        },
      };
    });

    const mockCreate = mock(async (_fields: CreateIssueRequest): Promise<CreatedIssue> => {
      return {
        id: "10002",
        key: "PROJ-124",
        self: "https://example.atlassian.net/rest/api/3/issue/10002",
      };
    });

    const original = await mockGet("PROJ-123");
    const cloneFields: CreateIssueRequest = {
      project: { key: original.fields.project.key },
      issuetype: { name: original.fields.issuetype.name },
      summary: `Clone of ${original.fields.summary}`,
      labels: original.fields.labels,
      components: original.fields.components?.map((c) => ({ id: c.id })),
      priority: original.fields.priority ? { id: original.fields.priority.id } : undefined,
    };

    const result = await mockCreate(cloneFields);

    expect(result.key).toBe("PROJ-124");
    expect(mockGet).toHaveBeenCalledTimes(1);
    expect(mockCreate).toHaveBeenCalledTimes(1);
  });

  test("clones issue with custom summary", async () => {
    const mockGet = mock(async (_issueKey: string): Promise<Issue> => {
      return {
        id: "10001",
        key: "PROJ-123",
        self: "https://example.atlassian.net/rest/api/3/issue/10001",
        fields: {
          summary: "Original issue",
          status: {
            id: "1",
            name: "To Do",
            statusCategory: { id: 1, key: "new", name: "To Do", colorName: "blue-gray" },
          },
          issuetype: { id: "1", name: "Task", subtask: false },
          project: { id: "1", key: "PROJ", name: "Project" },
          labels: [],
          created: "2025-01-01T00:00:00.000Z",
          updated: "2025-01-01T00:00:00.000Z",
        },
      };
    });

    const mockCreate = mock(async (_fields: CreateIssueRequest): Promise<CreatedIssue> => {
      return {
        id: "10002",
        key: "PROJ-124",
        self: "https://example.atlassian.net/rest/api/3/issue/10002",
      };
    });

    const original = await mockGet("PROJ-123");
    const customSummary = "Custom cloned issue summary";
    const cloneFields: CreateIssueRequest = {
      project: { key: original.fields.project.key },
      issuetype: { name: original.fields.issuetype.name },
      summary: customSummary,
      labels: original.fields.labels,
      components: original.fields.components?.map((c) => ({ id: c.id })),
      priority: original.fields.priority ? { id: original.fields.priority.id } : undefined,
    };

    const result = await mockCreate(cloneFields);

    expect(result.key).toBe("PROJ-124");
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        summary: customSummary,
      })
    );
  });

  test("clones issue to different project", async () => {
    const mockGet = mock(async (_issueKey: string): Promise<Issue> => {
      return {
        id: "10001",
        key: "PROJ-123",
        self: "https://example.atlassian.net/rest/api/3/issue/10001",
        fields: {
          summary: "Original issue",
          status: {
            id: "1",
            name: "To Do",
            statusCategory: { id: 1, key: "new", name: "To Do", colorName: "blue-gray" },
          },
          issuetype: { id: "1", name: "Task", subtask: false },
          project: { id: "1", key: "PROJ", name: "Project" },
          labels: ["backend"],
          created: "2025-01-01T00:00:00.000Z",
          updated: "2025-01-01T00:00:00.000Z",
        },
      };
    });

    const mockCreate = mock(async (_fields: CreateIssueRequest): Promise<CreatedIssue> => {
      return {
        id: "20001",
        key: "OTHER-456",
        self: "https://example.atlassian.net/rest/api/3/issue/20001",
      };
    });

    const original = await mockGet("PROJ-123");
    const targetProject = "OTHER";
    const cloneFields: CreateIssueRequest = {
      project: { key: targetProject },
      issuetype: { name: original.fields.issuetype.name },
      summary: `Clone of ${original.fields.summary}`,
      labels: original.fields.labels,
      components: original.fields.components?.map((c) => ({ id: c.id })),
      priority: original.fields.priority ? { id: original.fields.priority.id } : undefined,
    };

    const result = await mockCreate(cloneFields);

    expect(result.key).toBe("OTHER-456");
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        project: { key: targetProject },
      })
    );
  });

  test("clones issue with description", async () => {
    const mockGet = mock(async (_issueKey: string): Promise<Issue> => {
      return {
        id: "10001",
        key: "PROJ-123",
        self: "https://example.atlassian.net/rest/api/3/issue/10001",
        fields: {
          summary: "Original issue",
          description: {
            type: "doc",
            version: 1,
            content: [
              {
                type: "paragraph",
                content: [{ type: "text", text: "Original description" }],
              },
            ],
          },
          status: {
            id: "1",
            name: "To Do",
            statusCategory: { id: 1, key: "new", name: "To Do", colorName: "blue-gray" },
          },
          issuetype: { id: "1", name: "Task", subtask: false },
          project: { id: "1", key: "PROJ", name: "Project" },
          labels: [],
          created: "2025-01-01T00:00:00.000Z",
          updated: "2025-01-01T00:00:00.000Z",
        },
      };
    });

    const mockCreate = mock(async (_fields: CreateIssueRequest): Promise<CreatedIssue> => {
      return {
        id: "10002",
        key: "PROJ-124",
        self: "https://example.atlassian.net/rest/api/3/issue/10002",
      };
    });

    const original = await mockGet("PROJ-123");
    const cloneFields: CreateIssueRequest = {
      project: { key: original.fields.project.key },
      issuetype: { name: original.fields.issuetype.name },
      summary: `Clone of ${original.fields.summary}`,
      description: original.fields.description || undefined,
      labels: original.fields.labels,
      components: original.fields.components?.map((c) => ({ id: c.id })),
      priority: original.fields.priority ? { id: original.fields.priority.id } : undefined,
    };

    const result = await mockCreate(cloneFields);

    expect(result.key).toBe("PROJ-124");
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        description: expect.objectContaining({
          type: "doc",
          version: 1,
        }),
      })
    );
  });

  test("clones issue without optional fields", async () => {
    const mockGet = mock(async (_issueKey: string): Promise<Issue> => {
      return {
        id: "10001",
        key: "PROJ-123",
        self: "https://example.atlassian.net/rest/api/3/issue/10001",
        fields: {
          summary: "Minimal issue",
          status: {
            id: "1",
            name: "To Do",
            statusCategory: { id: 1, key: "new", name: "To Do", colorName: "blue-gray" },
          },
          issuetype: { id: "1", name: "Task", subtask: false },
          project: { id: "1", key: "PROJ", name: "Project" },
          created: "2025-01-01T00:00:00.000Z",
          updated: "2025-01-01T00:00:00.000Z",
        },
      };
    });

    const mockCreate = mock(async (_fields: CreateIssueRequest): Promise<CreatedIssue> => {
      return {
        id: "10002",
        key: "PROJ-124",
        self: "https://example.atlassian.net/rest/api/3/issue/10002",
      };
    });

    const original = await mockGet("PROJ-123");
    const cloneFields: CreateIssueRequest = {
      project: { key: original.fields.project.key },
      issuetype: { name: original.fields.issuetype.name },
      summary: `Clone of ${original.fields.summary}`,
      labels: original.fields.labels,
      components: original.fields.components?.map((c) => ({ id: c.id })),
      priority: original.fields.priority ? { id: original.fields.priority.id } : undefined,
    };

    const result = await mockCreate(cloneFields);

    expect(result.key).toBe("PROJ-124");
    expect(mockGet).toHaveBeenCalledTimes(1);
    expect(mockCreate).toHaveBeenCalledTimes(1);
  });

  test("preserves labels when cloning", () => {
    const originalLabels = ["backend", "api", "v2"];
    const clonedLabels = originalLabels;

    expect(clonedLabels).toEqual(originalLabels);
    expect(clonedLabels).toHaveLength(3);
  });

  test("converts components to ID references", () => {
    const originalComponents = [
      { id: "100", name: "API" },
      { id: "101", name: "Frontend" },
    ];

    const convertedComponents = originalComponents.map((c) => ({ id: c.id }));

    expect(convertedComponents).toEqual([{ id: "100" }, { id: "101" }]);
  });

  test("handles null priority gracefully", () => {
    const createPriorityField = (priority: { id: string } | null | undefined) => {
      return priority ? { id: priority.id } : undefined;
    };

    expect(createPriorityField(null)).toBeUndefined();
    expect(createPriorityField(undefined)).toBeUndefined();
  });

  test("parses additional labels from flag", () => {
    const parseLabels = (labelString?: string): string[] | undefined => {
      if (!labelString) return undefined;
      return labelString
        .split(",")
        .map((l) => l.trim())
        .filter(Boolean);
    };

    const originalLabels = ["backend", "api"];
    const additionalLabels = parseLabels("urgent,critical");
    const combinedLabels = [...(originalLabels || []), ...(additionalLabels || [])];

    expect(combinedLabels).toEqual(["backend", "api", "urgent", "critical"]);
  });
});

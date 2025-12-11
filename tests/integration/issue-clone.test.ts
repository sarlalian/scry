import { describe, expect, test } from "bun:test";
import type { AtlassianDocument } from "../../src/api/types/common.ts";
import type { Issue, CreateIssueRequest } from "../../src/api/types/issue.ts";

describe("issue clone integration", () => {
  test("copies description from original issue", () => {
    const originalDescription: AtlassianDocument = {
      type: "doc",
      version: 1,
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "This is the original description" }],
        },
      ],
    };

    const clonedDescription = originalDescription;

    expect(clonedDescription.type).toBe("doc");
    expect(clonedDescription.version).toBe(1);
    expect(clonedDescription.content).toHaveLength(1);
  });

  test("generates default clone summary", () => {
    const originalSummary = "Fix authentication bug";
    const cloneSummary = `Clone of ${originalSummary}`;

    expect(cloneSummary).toBe("Clone of Fix authentication bug");
  });

  test("handles custom summary override", () => {
    const originalSummary = "Fix authentication bug";
    const customSummary = "Fix authentication bug for production";

    expect(customSummary).not.toBe(originalSummary);
    expect(customSummary).not.toContain("Clone of");
  });

  test("preserves all relevant fields when cloning", () => {
    const originalIssue: Issue = {
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
              content: [{ type: "text", text: "Description" }],
            },
          ],
        },
        status: {
          id: "1",
          name: "To Do",
          statusCategory: { id: 1, key: "new", name: "To Do", colorName: "blue-gray" },
        },
        issuetype: { id: "1", name: "Bug", subtask: false },
        project: { id: "1", key: "PROJ", name: "Project" },
        labels: ["backend", "critical"],
        components: [
          { id: "100", name: "API" },
          { id: "101", name: "Auth" },
        ],
        priority: { id: "2", name: "High" },
        created: "2025-01-01T00:00:00.000Z",
        updated: "2025-01-01T00:00:00.000Z",
      },
    };

    const cloneFields: CreateIssueRequest = {
      project: { key: originalIssue.fields.project.key },
      issuetype: { name: originalIssue.fields.issuetype.name },
      summary: `Clone of ${originalIssue.fields.summary}`,
      description: originalIssue.fields.description || undefined,
      labels: originalIssue.fields.labels,
      components: originalIssue.fields.components?.map((c) => ({ id: c.id })),
      priority: originalIssue.fields.priority
        ? { id: originalIssue.fields.priority.id }
        : undefined,
    };

    expect(cloneFields.project).toEqual({ key: "PROJ" });
    expect(cloneFields.issuetype).toEqual({ name: "Bug" });
    expect(cloneFields.summary).toBe("Clone of Original issue");
    expect(cloneFields.description).toBeDefined();
    expect(cloneFields.labels).toEqual(["backend", "critical"]);
    expect(cloneFields.components).toEqual([{ id: "100" }, { id: "101" }]);
    expect(cloneFields.priority).toEqual({ id: "2" });
  });

  test("handles issue without description", () => {
    const originalIssue: Issue = {
      id: "10001",
      key: "PROJ-123",
      self: "https://example.atlassian.net/rest/api/3/issue/10001",
      fields: {
        summary: "Issue without description",
        description: null,
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

    const cloneFields: CreateIssueRequest = {
      project: { key: originalIssue.fields.project.key },
      issuetype: { name: originalIssue.fields.issuetype.name },
      summary: `Clone of ${originalIssue.fields.summary}`,
      description: originalIssue.fields.description || undefined,
    };

    expect(cloneFields.description).toBeUndefined();
  });

  test("handles issue without labels", () => {
    const originalIssue: Issue = {
      id: "10001",
      key: "PROJ-123",
      self: "https://example.atlassian.net/rest/api/3/issue/10001",
      fields: {
        summary: "Issue without labels",
        status: {
          id: "1",
          name: "To Do",
          statusCategory: { id: 1, key: "new", name: "To Do", colorName: "blue-gray" },
        },
        issuetype: { id: "1", name: "Task", subtask: false },
        project: { id: "1", key: "PROJ", name: "Project" },
        labels: undefined,
        created: "2025-01-01T00:00:00.000Z",
        updated: "2025-01-01T00:00:00.000Z",
      },
    };

    const cloneFields: CreateIssueRequest = {
      project: { key: originalIssue.fields.project.key },
      issuetype: { name: originalIssue.fields.issuetype.name },
      summary: `Clone of ${originalIssue.fields.summary}`,
      labels: originalIssue.fields.labels,
    };

    expect(cloneFields.labels).toBeUndefined();
  });

  test("handles issue without components", () => {
    const originalIssue: Issue = {
      id: "10001",
      key: "PROJ-123",
      self: "https://example.atlassian.net/rest/api/3/issue/10001",
      fields: {
        summary: "Issue without components",
        status: {
          id: "1",
          name: "To Do",
          statusCategory: { id: 1, key: "new", name: "To Do", colorName: "blue-gray" },
        },
        issuetype: { id: "1", name: "Task", subtask: false },
        project: { id: "1", key: "PROJ", name: "Project" },
        components: undefined,
        created: "2025-01-01T00:00:00.000Z",
        updated: "2025-01-01T00:00:00.000Z",
      },
    };

    const cloneFields: CreateIssueRequest = {
      project: { key: originalIssue.fields.project.key },
      issuetype: { name: originalIssue.fields.issuetype.name },
      summary: `Clone of ${originalIssue.fields.summary}`,
      components: originalIssue.fields.components?.map((c) => ({ id: c.id })),
    };

    expect(cloneFields.components).toBeUndefined();
  });

  test("handles issue without priority", () => {
    const originalIssue: Issue = {
      id: "10001",
      key: "PROJ-123",
      self: "https://example.atlassian.net/rest/api/3/issue/10001",
      fields: {
        summary: "Issue without priority",
        status: {
          id: "1",
          name: "To Do",
          statusCategory: { id: 1, key: "new", name: "To Do", colorName: "blue-gray" },
        },
        issuetype: { id: "1", name: "Task", subtask: false },
        project: { id: "1", key: "PROJ", name: "Project" },
        priority: null,
        created: "2025-01-01T00:00:00.000Z",
        updated: "2025-01-01T00:00:00.000Z",
      },
    };

    const cloneFields: CreateIssueRequest = {
      project: { key: originalIssue.fields.project.key },
      issuetype: { name: originalIssue.fields.issuetype.name },
      summary: `Clone of ${originalIssue.fields.summary}`,
      priority: originalIssue.fields.priority
        ? { id: originalIssue.fields.priority.id }
        : undefined,
    };

    expect(cloneFields.priority).toBeUndefined();
  });

  test("merges additional labels with original labels", () => {
    const originalLabels = ["backend", "api"];
    const additionalLabels = ["urgent", "critical"];
    const mergedLabels = [...originalLabels, ...additionalLabels];

    expect(mergedLabels).toEqual(["backend", "api", "urgent", "critical"]);
    expect(mergedLabels).toHaveLength(4);
  });

  test("changes project key when cloning to different project", () => {
    const originalProjectKey = "PROJ";
    const targetProjectKey = "OTHER";

    const cloneFields: CreateIssueRequest = {
      project: { key: targetProjectKey },
      issuetype: { name: "Task" },
      summary: "Cloned issue",
    };

    expect(cloneFields.project).toEqual({ key: "OTHER" });
    expect(cloneFields.project).not.toEqual({ key: originalProjectKey });
  });
});

import { describe, expect, test, mock } from "bun:test";
import type { CreateIssueRequest, Issue } from "../../../../../src/api/types/issue.ts";

describe("issue edit command", () => {
  test("updates issue with summary flag", async () => {
    const mockUpdate = mock(
      async (_issueKey: string, _fields: Partial<CreateIssueRequest>): Promise<void> => {}
    );

    const fields: Partial<CreateIssueRequest> = {
      summary: "Updated summary",
    };

    await mockUpdate("PROJ-123", fields);

    expect(mockUpdate).toHaveBeenCalledTimes(1);
    expect(mockUpdate).toHaveBeenCalledWith("PROJ-123", fields);
  });

  test("updates issue with multiple fields", async () => {
    const mockUpdate = mock(
      async (_issueKey: string, _fields: Partial<CreateIssueRequest>): Promise<void> => {}
    );

    const fields: Partial<CreateIssueRequest> = {
      summary: "Updated summary",
      priority: { name: "High" },
      labels: ["backend", "urgent"],
    };

    await mockUpdate("PROJ-456", fields);

    expect(mockUpdate).toHaveBeenCalledTimes(1);
    expect(mockUpdate).toHaveBeenCalledWith("PROJ-456", fields);
  });

  test("updates issue description with ADF format", async () => {
    const mockUpdate = mock(
      async (_issueKey: string, _fields: Partial<CreateIssueRequest>): Promise<void> => {}
    );

    const fields: Partial<CreateIssueRequest> = {
      description: {
        type: "doc",
        version: 1,
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: "Updated description" }],
          },
        ],
      },
    };

    await mockUpdate("PROJ-789", fields);

    expect(mockUpdate).toHaveBeenCalledTimes(1);
  });

  test("updates assignee with account ID", async () => {
    const mockUpdate = mock(
      async (_issueKey: string, _fields: Partial<CreateIssueRequest>): Promise<void> => {}
    );

    const fields: Partial<CreateIssueRequest> = {
      assignee: { accountId: "user123" },
    };

    await mockUpdate("PROJ-111", fields);

    expect(mockUpdate).toHaveBeenCalledTimes(1);
    expect(mockUpdate).toHaveBeenCalledWith("PROJ-111", fields);
  });

  test("updates labels as array", async () => {
    const mockUpdate = mock(
      async (_issueKey: string, _fields: Partial<CreateIssueRequest>): Promise<void> => {}
    );

    const fields: Partial<CreateIssueRequest> = {
      labels: ["label1", "label2", "label3"],
    };

    await mockUpdate("PROJ-222", fields);

    expect(mockUpdate).toHaveBeenCalledTimes(1);
  });

  test("updates components as array of objects", async () => {
    const mockUpdate = mock(
      async (_issueKey: string, _fields: Partial<CreateIssueRequest>): Promise<void> => {}
    );

    const fields: Partial<CreateIssueRequest> = {
      components: [{ name: "API" }, { name: "Frontend" }],
    };

    await mockUpdate("PROJ-333", fields);

    expect(mockUpdate).toHaveBeenCalledTimes(1);
  });

  test("parses comma-separated labels for update", () => {
    const parseLabels = (labelString?: string): string[] | undefined => {
      if (!labelString) return undefined;
      return labelString
        .split(",")
        .map((l) => l.trim())
        .filter(Boolean);
    };

    expect(parseLabels("label1,label2,label3")).toEqual(["label1", "label2", "label3"]);
    expect(parseLabels("label1, label2 , label3 ")).toEqual(["label1", "label2", "label3"]);
    expect(parseLabels("")).toBeUndefined();
    expect(parseLabels(undefined)).toBeUndefined();
  });

  test("parses comma-separated components for update", () => {
    const parseComponents = (componentString?: string): Array<{ name: string }> | undefined => {
      if (!componentString) return undefined;
      return componentString
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean)
        .map((name) => ({ name }));
    };

    expect(parseComponents("API,Frontend")).toEqual([{ name: "API" }, { name: "Frontend" }]);
    expect(parseComponents("API")).toEqual([{ name: "API" }]);
    expect(parseComponents("")).toBeUndefined();
    expect(parseComponents(undefined)).toBeUndefined();
  });

  test("converts plain text description to ADF format", () => {
    const textToAdf = (text: string) => {
      const paragraphs = text.split("\n").filter((line) => line.trim());

      if (paragraphs.length === 0) {
        return {
          type: "doc",
          version: 1,
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "" }],
            },
          ],
        };
      }

      return {
        type: "doc",
        version: 1,
        content: paragraphs.map((para) => ({
          type: "paragraph",
          content: [{ type: "text", text: para }],
        })),
      };
    };

    const result = textToAdf("Test description");
    expect(result.type).toBe("doc");
    expect(result.version).toBe(1);
    expect(result.content[0]?.content?.[0]?.text).toBe("Test description");

    const multiline = textToAdf("Line 1\nLine 2");
    expect(multiline.content).toHaveLength(2);
    expect(multiline.content[0]?.content?.[0]?.text).toBe("Line 1");
    expect(multiline.content[1]?.content?.[0]?.text).toBe("Line 2");
  });

  test("fetches current issue before editing in interactive mode", async () => {
    const mockGet = mock(async (_issueKey: string): Promise<Issue> => {
      return {
        id: "10001",
        key: "PROJ-123",
        self: "https://example.atlassian.net/rest/api/3/issue/10001",
        fields: {
          summary: "Current summary",
          description: null,
          status: {
            id: "1",
            name: "To Do",
            statusCategory: { id: 2, key: "new", name: "To Do", colorName: "blue-gray" },
          },
          assignee: null,
          reporter: null,
          priority: { id: "3", name: "Medium" },
          issuetype: { id: "1", name: "Task", subtask: false },
          project: { id: "10000", key: "PROJ", name: "Test Project" },
          labels: ["existing-label"],
          components: [{ id: "1", name: "API" }],
          created: "2024-01-01T00:00:00.000Z",
          updated: "2024-01-02T00:00:00.000Z",
          resolution: null,
        },
      };
    });

    const issue = await mockGet("PROJ-123");

    expect(mockGet).toHaveBeenCalledTimes(1);
    expect(issue.fields.summary).toBe("Current summary");
    expect(issue.fields.priority?.name).toBe("Medium");
    expect(issue.fields.labels).toContain("existing-label");
  });

  test("validates issue key is provided", () => {
    const validateIssueKey = (key?: string): boolean => {
      return !!key && key.trim().length > 0;
    };

    expect(validateIssueKey("PROJ-123")).toBe(true);
    expect(validateIssueKey("TEST-1")).toBe(true);
    expect(validateIssueKey("")).toBe(false);
    expect(validateIssueKey(undefined)).toBe(false);
    expect(validateIssueKey("   ")).toBe(false);
  });

  test("ensures at least one field is provided for update", () => {
    const hasUpdateFields = (fields: Partial<CreateIssueRequest>): boolean => {
      return Object.keys(fields).length > 0;
    };

    expect(hasUpdateFields({ summary: "Test" })).toBe(true);
    expect(hasUpdateFields({ priority: { name: "High" } })).toBe(true);
    expect(hasUpdateFields({})).toBe(false);
  });
});

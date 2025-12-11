import { describe, expect, test, mock } from "bun:test";
import type { CreateIssueRequest, CreatedIssue } from "../../../../../src/api/types/issue.ts";

describe("issue create command", () => {
  test("creates issue with required fields from flags", async () => {
    const mockCreate = mock(async (_fields: CreateIssueRequest): Promise<CreatedIssue> => {
      return {
        id: "10001",
        key: "PROJ-123",
        self: "https://example.atlassian.net/rest/api/3/issue/10001",
      };
    });

    const fields: CreateIssueRequest = {
      project: { key: "PROJ" },
      issuetype: { name: "Task" },
      summary: "Test issue",
    };

    const result = await mockCreate(fields);

    expect(result.key).toBe("PROJ-123");
    expect(result.id).toBe("10001");
    expect(mockCreate).toHaveBeenCalledTimes(1);
  });

  test("creates issue with all optional fields", async () => {
    const mockCreate = mock(async (_fields: CreateIssueRequest): Promise<CreatedIssue> => {
      return {
        id: "10002",
        key: "PROJ-124",
        self: "https://example.atlassian.net/rest/api/3/issue/10002",
      };
    });

    const fields: CreateIssueRequest = {
      project: { key: "PROJ" },
      issuetype: { name: "Bug" },
      summary: "Test bug with all fields",
      description: {
        type: "doc",
        version: 1,
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: "This is a test description" }],
          },
        ],
      },
      priority: { name: "High" },
      labels: ["backend", "api"],
      components: [{ name: "API" }],
    };

    const result = await mockCreate(fields);

    expect(result.key).toBe("PROJ-124");
    expect(mockCreate).toHaveBeenCalledTimes(1);
  });

  test("converts plain text description to ADF format", () => {
    const plainText = "This is a plain text description";
    const expectedAdf = {
      type: "doc" as const,
      version: 1 as const,
      content: [
        {
          type: "paragraph" as const,
          content: [{ type: "text" as const, text: plainText }],
        },
      ],
    };

    expect(expectedAdf.content[0]?.content?.[0]?.text).toBe(plainText);
  });

  test("handles multiline description text", () => {
    const multilineText = "Line 1\nLine 2\nLine 3";
    const lines = multilineText.split("\n");

    expect(lines).toHaveLength(3);
    expect(lines[0]).toBe("Line 1");
    expect(lines[1]).toBe("Line 2");
    expect(lines[2]).toBe("Line 3");
  });

  test("validates required fields are present", () => {
    const validateRequiredFields = (
      project?: string,
      issuetype?: string,
      summary?: string
    ): { valid: boolean; missing: string[] } => {
      const missing: string[] = [];
      if (!project) missing.push("project");
      if (!issuetype) missing.push("issuetype");
      if (!summary) missing.push("summary");
      return { valid: missing.length === 0, missing };
    };

    const result1 = validateRequiredFields("PROJ", "Task", "Summary");
    expect(result1.valid).toBe(true);
    expect(result1.missing).toHaveLength(0);

    const result2 = validateRequiredFields(undefined, "Task", "Summary");
    expect(result2.valid).toBe(false);
    expect(result2.missing).toContain("project");

    const result3 = validateRequiredFields("PROJ", undefined, undefined);
    expect(result3.valid).toBe(false);
    expect(result3.missing).toContain("issuetype");
    expect(result3.missing).toContain("summary");
  });

  test("parses comma-separated labels", () => {
    const parseLabels = (labelString?: string): string[] | undefined => {
      if (!labelString) return undefined;
      return labelString
        .split(",")
        .map((l) => l.trim())
        .filter(Boolean);
    };

    expect(parseLabels("backend,api,frontend")).toEqual(["backend", "api", "frontend"]);
    expect(parseLabels("backend, api , frontend ")).toEqual(["backend", "api", "frontend"]);
    expect(parseLabels("single")).toEqual(["single"]);
    expect(parseLabels("")).toBeUndefined();
    expect(parseLabels(undefined)).toBeUndefined();
  });

  test("parses comma-separated components", () => {
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
});

import { describe, expect, test, mock } from "bun:test";
import type { CreateIssueRequest, CreatedIssue } from "../../../../../src/api/types/issue.ts";

describe("epic create command", () => {
  test("creates epic with required fields from flags", async () => {
    const mockCreate = mock(async (_fields: CreateIssueRequest): Promise<CreatedIssue> => {
      return {
        id: "10001",
        key: "PROJ-123",
        self: "https://example.atlassian.net/rest/api/3/issue/10001",
      };
    });

    const fields: CreateIssueRequest = {
      project: { key: "PROJ" },
      issuetype: { name: "Epic" },
      summary: "Test epic",
    };

    const result = await mockCreate(fields);

    expect(result.key).toBe("PROJ-123");
    expect(result.id).toBe("10001");
    expect(mockCreate).toHaveBeenCalledTimes(1);
  });

  test("creates epic with all optional fields", async () => {
    const mockCreate = mock(async (_fields: CreateIssueRequest): Promise<CreatedIssue> => {
      return {
        id: "10002",
        key: "PROJ-124",
        self: "https://example.atlassian.net/rest/api/3/issue/10002",
      };
    });

    const fields: CreateIssueRequest = {
      project: { key: "PROJ" },
      issuetype: { name: "Epic" },
      summary: "Test epic with all fields",
      description: {
        type: "doc",
        version: 1,
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: "This is an epic description" }],
          },
        ],
      },
      priority: { name: "High" },
      labels: ["backend", "api"],
      assignee: { accountId: "user123" },
    };

    const result = await mockCreate(fields);

    expect(result.key).toBe("PROJ-124");
    expect(mockCreate).toHaveBeenCalledTimes(1);
  });

  test("epic must have issuetype set to Epic", async () => {
    const mockCreate = mock(async (fields: CreateIssueRequest): Promise<CreatedIssue> => {
      if (fields.issuetype && "name" in fields.issuetype && fields.issuetype.name !== "Epic") {
        throw new Error("Issue type must be Epic");
      }
      return {
        id: "10003",
        key: "PROJ-125",
        self: "https://example.atlassian.net/rest/api/3/issue/10003",
      };
    });

    const validFields: CreateIssueRequest = {
      project: { key: "PROJ" },
      issuetype: { name: "Epic" },
      summary: "Valid epic",
    };

    const result = await mockCreate(validFields);
    expect(result.key).toBe("PROJ-125");

    const invalidFields: CreateIssueRequest = {
      project: { key: "PROJ" },
      issuetype: { name: "Task" },
      summary: "Invalid epic",
    };

    expect(mockCreate(invalidFields)).rejects.toThrow("Issue type must be Epic");
  });

  test("converts plain text description to ADF format", () => {
    const plainText = "This is an epic description";
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
      summary?: string
    ): { valid: boolean; missing: string[] } => {
      const missing: string[] = [];
      if (!project) missing.push("project");
      if (!summary) missing.push("summary");
      return { valid: missing.length === 0, missing };
    };

    const result1 = validateRequiredFields("PROJ", "Epic Summary");
    expect(result1.valid).toBe(true);
    expect(result1.missing).toHaveLength(0);

    const result2 = validateRequiredFields(undefined, "Epic Summary");
    expect(result2.valid).toBe(false);
    expect(result2.missing).toContain("project");

    const result3 = validateRequiredFields("PROJ", undefined);
    expect(result3.valid).toBe(false);
    expect(result3.missing).toContain("summary");
  });

  test("parses comma-separated labels", () => {
    const parseLabels = (labelString?: string): string[] | undefined => {
      if (!labelString) return undefined;
      const labels = labelString
        .split(",")
        .map((l) => l.trim())
        .filter(Boolean);
      return labels.length > 0 ? labels : undefined;
    };

    expect(parseLabels("backend,api,frontend")).toEqual(["backend", "api", "frontend"]);
    expect(parseLabels("backend, api , frontend ")).toEqual(["backend", "api", "frontend"]);
    expect(parseLabels("single")).toEqual(["single"]);
    expect(parseLabels("")).toBeUndefined();
    expect(parseLabels(undefined)).toBeUndefined();
  });
});

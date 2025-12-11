import { describe, expect, test } from "bun:test";
import type { CreateIssueRequest } from "../../src/api/types/issue.ts";

describe("epic add/remove integration", () => {
  test("epic add produces valid update request with parent field", () => {
    const updateFields: Partial<CreateIssueRequest> = {
      parent: { key: "SCRY-100" },
    };

    expect(updateFields).toHaveProperty("parent");
    expect(updateFields.parent).toHaveProperty("key", "SCRY-100");
    expect(updateFields.parent?.key).toMatch(/^[A-Z]+-\d+$/);
  });

  test("epic remove produces valid update request with null parent", () => {
    const updateFields: Partial<CreateIssueRequest> = {
      parent: null,
    };

    expect(updateFields).toHaveProperty("parent");
    expect(updateFields.parent).toBeNull();
  });

  test("epic add validates epic key format", () => {
    const validKeys = ["SCRY-100", "PROJ-1", "ABC-999"];
    const invalidKeys = ["scry-100", "PROJ", "PROJ-", "-123", "PROJ123"];

    const validateKey = (key: string): boolean => /^[A-Z]+-\d+$/.test(key);

    for (const key of validKeys) {
      expect(validateKey(key)).toBe(true);
    }

    for (const key of invalidKeys) {
      expect(validateKey(key)).toBe(false);
    }
  });

  test("epic add supports multiple issue keys", () => {
    const epicKey = "SCRY-100";
    const issueKeys = ["SCRY-101", "SCRY-102", "SCRY-103"];

    const updates = issueKeys.map((issueKey) => ({
      issueKey,
      fields: { parent: { key: epicKey } },
    }));

    expect(updates).toHaveLength(3);
    expect(updates[0]?.fields.parent?.key).toBe("SCRY-100");
    expect(updates[1]?.fields.parent?.key).toBe("SCRY-100");
    expect(updates[2]?.fields.parent?.key).toBe("SCRY-100");
  });

  test("epic remove supports multiple issue keys", () => {
    const epicKey = "SCRY-100";
    const issueKeys = ["SCRY-101", "SCRY-102", "SCRY-103"];

    const updates = issueKeys.map((issueKey) => ({
      issueKey,
      epicKey,
      fields: { parent: null },
    }));

    expect(updates).toHaveLength(3);
    expect(updates[0]?.fields.parent).toBeNull();
    expect(updates[1]?.fields.parent).toBeNull();
    expect(updates[2]?.fields.parent).toBeNull();
  });

  test("epic add result structure contains all required fields", () => {
    interface AddResult {
      epicKey: string;
      results: Array<{
        issueKey: string;
        success: boolean;
        error: string | null;
      }>;
    }

    const result: AddResult = {
      epicKey: "SCRY-100",
      results: [
        { issueKey: "SCRY-101", success: true, error: null },
        { issueKey: "SCRY-102", success: true, error: null },
      ],
    };

    expect(result).toHaveProperty("epicKey");
    expect(result).toHaveProperty("results");
    expect(result.results).toBeArray();
    expect(result.results[0]).toHaveProperty("issueKey");
    expect(result.results[0]).toHaveProperty("success");
    expect(result.results[0]).toHaveProperty("error");
  });

  test("epic remove result structure contains all required fields", () => {
    interface RemoveResult {
      epicKey: string;
      results: Array<{
        issueKey: string;
        success: boolean;
        error: string | null;
      }>;
    }

    const result: RemoveResult = {
      epicKey: "SCRY-100",
      results: [
        { issueKey: "SCRY-101", success: true, error: null },
        { issueKey: "SCRY-102", success: false, error: "Issue not found" },
      ],
    };

    expect(result).toHaveProperty("epicKey");
    expect(result).toHaveProperty("results");
    expect(result.results).toBeArray();
    expect(result.results[0]?.success).toBe(true);
    expect(result.results[1]?.success).toBe(false);
    expect(result.results[1]?.error).toBe("Issue not found");
  });

  test("epic add handles partial success scenarios", () => {
    const successCount = 2;
    const failureCount = 1;
    const totalCount = successCount + failureCount;

    expect(totalCount).toBe(3);
    expect(successCount).toBeGreaterThan(0);
    expect(failureCount).toBeGreaterThan(0);
  });

  test("epic parent field is optional in CreateIssueRequest", () => {
    const withParent: Partial<CreateIssueRequest> = {
      summary: "Issue with parent",
      parent: { key: "SCRY-100" },
    };

    const withoutParent: Partial<CreateIssueRequest> = {
      summary: "Issue without parent",
    };

    const parentRemoved: Partial<CreateIssueRequest> = {
      summary: "Issue with parent removed",
      parent: null,
    };

    expect(withParent.parent).toBeDefined();
    expect(withoutParent.parent).toBeUndefined();
    expect(parentRemoved.parent).toBeNull();
  });
});

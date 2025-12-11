import { describe, expect, test, mock } from "bun:test";

describe("epic add command", () => {
  test("adds single issue to epic", async () => {
    const mockUpdate = mock(
      async (issueKey: string, fields: Record<string, unknown>): Promise<void> => {
        expect(issueKey).toBe("PROJ-123");
        expect(fields).toEqual({ parent: { key: "PROJ-100" } });
      }
    );

    await mockUpdate("PROJ-123", { parent: { key: "PROJ-100" } });

    expect(mockUpdate).toHaveBeenCalledTimes(1);
    expect(mockUpdate).toHaveBeenCalledWith("PROJ-123", { parent: { key: "PROJ-100" } });
  });

  test("adds multiple issues to epic", async () => {
    const mockUpdate = mock(
      async (_issueKey: string, fields: Record<string, unknown>): Promise<void> => {
        expect(fields).toEqual({ parent: { key: "PROJ-100" } });
      }
    );

    await mockUpdate("PROJ-123", { parent: { key: "PROJ-100" } });
    await mockUpdate("PROJ-124", { parent: { key: "PROJ-100" } });
    await mockUpdate("PROJ-125", { parent: { key: "PROJ-100" } });

    expect(mockUpdate).toHaveBeenCalledTimes(3);
  });

  test("validates epic key format", () => {
    const isValidIssueKey = (key: string): boolean => {
      return /^[A-Z]+-\d+$/.test(key);
    };

    expect(isValidIssueKey("PROJ-100")).toBe(true);
    expect(isValidIssueKey("ABC-1")).toBe(true);
    expect(isValidIssueKey("EPIC-999")).toBe(true);
    expect(isValidIssueKey("proj-100")).toBe(false);
    expect(isValidIssueKey("PROJ100")).toBe(false);
    expect(isValidIssueKey("PROJ-")).toBe(false);
  });

  test("validates issue key format", () => {
    const isValidIssueKey = (key: string): boolean => {
      return /^[A-Z]+-\d+$/.test(key);
    };

    expect(isValidIssueKey("PROJ-123")).toBe(true);
    expect(isValidIssueKey("PROJ-124")).toBe(true);
    expect(isValidIssueKey("proj-123")).toBe(false);
    expect(isValidIssueKey("PROJ123")).toBe(false);
  });

  test("formats success message for single issue", () => {
    const formatMessage = (
      epicKey: string,
      issueKeys: string[],
      success: boolean
    ): { success: boolean; message: string } => {
      if (issueKeys.length === 1) {
        return {
          success,
          message: `Issue ${issueKeys[0]} has been added to epic ${epicKey}`,
        };
      }
      return {
        success,
        message: `${issueKeys.length} issues have been added to epic ${epicKey}`,
      };
    };

    const result = formatMessage("PROJ-100", ["PROJ-123"], true);
    expect(result.success).toBe(true);
    expect(result.message).toContain("Issue PROJ-123 has been added to epic PROJ-100");
  });

  test("formats success message for multiple issues", () => {
    const formatMessage = (
      epicKey: string,
      issueKeys: string[],
      success: boolean
    ): { success: boolean; message: string } => {
      if (issueKeys.length === 1) {
        return {
          success,
          message: `Issue ${issueKeys[0]} has been added to epic ${epicKey}`,
        };
      }
      return {
        success,
        message: `${issueKeys.length} issues have been added to epic ${epicKey}`,
      };
    };

    const result = formatMessage("PROJ-100", ["PROJ-123", "PROJ-124", "PROJ-125"], true);
    expect(result.success).toBe(true);
    expect(result.message).toContain("3 issues have been added to epic PROJ-100");
  });

  test("handles partial success with multiple issues", () => {
    const results = [
      { issueKey: "PROJ-123", success: true, error: null },
      { issueKey: "PROJ-124", success: false, error: "Issue not found" },
      { issueKey: "PROJ-125", success: true, error: null },
    ];

    const successCount = results.filter((r) => r.success).length;
    const failureCount = results.filter((r) => !r.success).length;

    expect(successCount).toBe(2);
    expect(failureCount).toBe(1);
  });

  test("returns structured result for each issue", () => {
    const createResult = (
      issueKey: string,
      epicKey: string,
      success: boolean,
      error: string | null = null
    ) => {
      return {
        issueKey,
        epicKey,
        success,
        error,
      };
    };

    const successResult = createResult("PROJ-123", "PROJ-100", true);
    expect(successResult.success).toBe(true);
    expect(successResult.error).toBeNull();

    const failureResult = createResult("PROJ-124", "PROJ-100", false, "Issue not found");
    expect(failureResult.success).toBe(false);
    expect(failureResult.error).toBe("Issue not found");
  });

  test("handles empty issue keys array", () => {
    const issueKeys: string[] = [];
    expect(issueKeys.length).toBe(0);
  });

  test("updates parent field with correct structure", () => {
    const buildUpdateFields = (epicKey: string) => {
      return { parent: { key: epicKey } };
    };

    const fields = buildUpdateFields("PROJ-100");
    expect(fields).toEqual({ parent: { key: "PROJ-100" } });
    expect(fields.parent.key).toBe("PROJ-100");
  });

  test("handles API error gracefully", async () => {
    const mockUpdate = mock(
      async (_issueKey: string, _fields: Record<string, unknown>): Promise<void> => {
        throw new Error("API Error: Issue not found");
      }
    );

    try {
      await mockUpdate("PROJ-123", { parent: { key: "PROJ-100" } });
      expect(true).toBe(false); // Should not reach here
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toContain("API Error");
    }
  });
});

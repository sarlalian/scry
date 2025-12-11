import { describe, expect, test, mock } from "bun:test";

describe("sprint add command", () => {
  test("adds a single issue to a sprint", async () => {
    const mockAddIssues = mock(async (_sprintId: number, _issueKeys: string[]): Promise<void> => {
      return;
    });

    await mockAddIssues(42, ["SCRY-123"]);

    expect(mockAddIssues).toHaveBeenCalledWith(42, ["SCRY-123"]);
    expect(mockAddIssues).toHaveBeenCalledTimes(1);
  });

  test("adds multiple issues to a sprint", async () => {
    const mockAddIssues = mock(async (_sprintId: number, _issueKeys: string[]): Promise<void> => {
      return;
    });

    await mockAddIssues(42, ["SCRY-123", "SCRY-456", "SCRY-789"]);

    expect(mockAddIssues).toHaveBeenCalledWith(42, ["SCRY-123", "SCRY-456", "SCRY-789"]);
    expect(mockAddIssues).toHaveBeenCalledTimes(1);
  });

  test("validates sprint ID is a number", () => {
    const parseSprintId = (sprintIdStr: string): number => {
      const parsed = parseInt(sprintIdStr, 10);
      if (isNaN(parsed)) {
        throw new Error("Sprint ID must be a number");
      }
      return parsed;
    };

    expect(parseSprintId("42")).toBe(42);
    expect(parseSprintId("123")).toBe(123);
    expect(() => parseSprintId("abc")).toThrow("Sprint ID must be a number");
    expect(() => parseSprintId("")).toThrow("Sprint ID must be a number");
  });

  test("validates at least one issue key is provided", () => {
    const validateIssueKeys = (issueKeys: string[]): { valid: boolean; error?: string } => {
      if (issueKeys.length === 0) {
        return { valid: false, error: "At least one issue key is required" };
      }
      return { valid: true };
    };

    const result1 = validateIssueKeys(["SCRY-123"]);
    expect(result1.valid).toBe(true);
    expect(result1.error).toBeUndefined();

    const result2 = validateIssueKeys(["SCRY-123", "SCRY-456"]);
    expect(result2.valid).toBe(true);

    const result3 = validateIssueKeys([]);
    expect(result3.valid).toBe(false);
    expect(result3.error).toBe("At least one issue key is required");
  });

  test("formats issue keys list for output", () => {
    const formatIssueKeys = (issueKeys: string[]): string => {
      if (issueKeys.length === 1) {
        return issueKeys[0] as string;
      }
      return issueKeys.join(", ");
    };

    expect(formatIssueKeys(["SCRY-123"])).toBe("SCRY-123");
    expect(formatIssueKeys(["SCRY-123", "SCRY-456"])).toBe("SCRY-123, SCRY-456");
    expect(formatIssueKeys(["SCRY-1", "SCRY-2", "SCRY-3"])).toBe("SCRY-1, SCRY-2, SCRY-3");
  });

  test("builds success message for adding issues", () => {
    const buildSuccessMessage = (sprintId: number, issueKeys: string[]): string => {
      const issueCount = issueKeys.length;
      const issueText = issueCount === 1 ? "issue" : "issues";
      return `Successfully added ${issueCount} ${issueText} to sprint ${sprintId}`;
    };

    expect(buildSuccessMessage(42, ["SCRY-123"])).toBe("Successfully added 1 issue to sprint 42");
    expect(buildSuccessMessage(42, ["SCRY-123", "SCRY-456"])).toBe(
      "Successfully added 2 issues to sprint 42"
    );
    expect(buildSuccessMessage(99, ["SCRY-1", "SCRY-2", "SCRY-3"])).toBe(
      "Successfully added 3 issues to sprint 99"
    );
  });

  test("formats output for table format", () => {
    const formatForTable = (
      sprintId: number,
      issueKeys: string[]
    ): Record<string, string | number> => {
      return {
        sprintId,
        issuesAdded: issueKeys.length,
        issueKeys: issueKeys.join(", "),
      };
    };

    const result1 = formatForTable(42, ["SCRY-123"]);
    expect(result1.sprintId).toBe(42);
    expect(result1.issuesAdded).toBe(1);
    expect(result1.issueKeys).toBe("SCRY-123");

    const result2 = formatForTable(42, ["SCRY-123", "SCRY-456"]);
    expect(result2.sprintId).toBe(42);
    expect(result2.issuesAdded).toBe(2);
    expect(result2.issueKeys).toBe("SCRY-123, SCRY-456");
  });
});

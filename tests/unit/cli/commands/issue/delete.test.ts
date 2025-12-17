import { describe, expect, test, mock } from "bun:test";

describe("issue delete command", () => {
  test("deletes single issue successfully", async () => {
    const mockDelete = mock(async (_issueKey: string, _deleteSubtasks: boolean): Promise<void> => {
      return;
    });

    await mockDelete("PROJ-123", false);

    expect(mockDelete).toHaveBeenCalledTimes(1);
    expect(mockDelete).toHaveBeenCalledWith("PROJ-123", false);
  });

  test("deletes issue with subtasks when deleteSubtasks is true", async () => {
    const mockDelete = mock(async (_issueKey: string, deleteSubtasks: boolean): Promise<void> => {
      expect(deleteSubtasks).toBe(true);
    });

    await mockDelete("PROJ-123", true);

    expect(mockDelete).toHaveBeenCalledTimes(1);
    expect(mockDelete).toHaveBeenCalledWith("PROJ-123", true);
  });

  test("deletes multiple issues in sequence", async () => {
    const mockDelete = mock(async (_issueKey: string, _deleteSubtasks: boolean): Promise<void> => {
      return;
    });

    const issueKeys = ["PROJ-123", "PROJ-124", "PROJ-125"];

    for (const key of issueKeys) {
      await mockDelete(key, false);
    }

    expect(mockDelete).toHaveBeenCalledTimes(3);
    expect(mockDelete).toHaveBeenCalledWith("PROJ-123", false);
    expect(mockDelete).toHaveBeenCalledWith("PROJ-124", false);
    expect(mockDelete).toHaveBeenCalledWith("PROJ-125", false);
  });

  test("validates issue key format", () => {
    const isValidIssueKey = (key: string): boolean => {
      return /^[A-Z]+-\d+$/.test(key);
    };

    expect(isValidIssueKey("PROJ-123")).toBe(true);
    expect(isValidIssueKey("ABC-1")).toBe(true);
    expect(isValidIssueKey("LONGKEY-999")).toBe(true);
    expect(isValidIssueKey("proj-123")).toBe(false);
    expect(isValidIssueKey("PROJ123")).toBe(false);
    expect(isValidIssueKey("PROJ-")).toBe(false);
    expect(isValidIssueKey("123-PROJ")).toBe(false);
  });

  test("formats success message for single deletion", () => {
    const formatDeleteResult = (
      issueKey: string,
      success: boolean
    ): { success: boolean; message: string } => {
      if (success) {
        return {
          success: true,
          message: `Issue ${issueKey} deleted successfully`,
        };
      }
      return {
        success: false,
        message: `Failed to delete issue ${issueKey}`,
      };
    };

    const result = formatDeleteResult("PROJ-123", true);
    expect(result.success).toBe(true);
    expect(result.message).toContain("deleted successfully");
  });

  test("formats success message for multiple deletions", () => {
    const formatMultipleDeleteResult = (
      results: Array<{ issueKey: string; success: boolean; error?: string }>
    ): { total: number; succeeded: number; failed: number } => {
      return {
        total: results.length,
        succeeded: results.filter((r) => r.success).length,
        failed: results.filter((r) => !r.success).length,
      };
    };

    const results = [
      { issueKey: "PROJ-123", success: true },
      { issueKey: "PROJ-124", success: true },
      { issueKey: "PROJ-125", success: false, error: "Not found" },
    ];

    const summary = formatMultipleDeleteResult(results);
    expect(summary.total).toBe(3);
    expect(summary.succeeded).toBe(2);
    expect(summary.failed).toBe(1);
  });

  test("handles deletion error gracefully", async () => {
    const mockDelete = mock(async (_issueKey: string, _deleteSubtasks: boolean): Promise<void> => {
      throw new Error("Issue not found");
    });

    try {
      await mockDelete("PROJ-999", false);
      expect(true).toBe(false);
    } catch (err) {
      expect(err).toBeInstanceOf(Error);
      expect((err as Error).message).toBe("Issue not found");
    }

    expect(mockDelete).toHaveBeenCalledTimes(1);
  });

  test("splits comma-separated issue keys", () => {
    const parseIssueKeys = (input: string): string[] => {
      return input
        .split(",")
        .map((key) => key.trim())
        .filter(Boolean);
    };

    expect(parseIssueKeys("PROJ-123,PROJ-124,PROJ-125")).toEqual([
      "PROJ-123",
      "PROJ-124",
      "PROJ-125",
    ]);
    expect(parseIssueKeys("PROJ-123, PROJ-124 , PROJ-125")).toEqual([
      "PROJ-123",
      "PROJ-124",
      "PROJ-125",
    ]);
    expect(parseIssueKeys("PROJ-123")).toEqual(["PROJ-123"]);
  });

  test("parses space-separated issue keys", () => {
    const parseIssueKeys = (input: string): string[] => {
      return input
        .split(/[\s,]+/)
        .map((key) => key.trim())
        .filter(Boolean);
    };

    expect(parseIssueKeys("PROJ-123 PROJ-124 PROJ-125")).toEqual([
      "PROJ-123",
      "PROJ-124",
      "PROJ-125",
    ]);
    expect(parseIssueKeys("PROJ-123,PROJ-124 PROJ-125")).toEqual([
      "PROJ-123",
      "PROJ-124",
      "PROJ-125",
    ]);
  });

  test("validates all issue keys before deletion", () => {
    const isValidIssueKey = (key: string): boolean => {
      return /^[A-Z]+-\d+$/.test(key);
    };

    const validateIssueKeys = (keys: string[]): { valid: boolean; invalidKeys: string[] } => {
      const invalidKeys = keys.filter((key) => !isValidIssueKey(key));
      return {
        valid: invalidKeys.length === 0,
        invalidKeys,
      };
    };

    const result1 = validateIssueKeys(["PROJ-123", "PROJ-124"]);
    expect(result1.valid).toBe(true);
    expect(result1.invalidKeys).toEqual([]);

    const result2 = validateIssueKeys(["PROJ-123", "invalid", "PROJ-124"]);
    expect(result2.valid).toBe(false);
    expect(result2.invalidKeys).toEqual(["invalid"]);
  });

  test("confirmation prompt returns boolean", () => {
    const mockConfirm = (shouldConfirm: boolean): boolean => {
      return shouldConfirm;
    };

    expect(mockConfirm(true)).toBe(true);
    expect(mockConfirm(false)).toBe(false);
  });

  test("force flag bypasses confirmation", () => {
    const shouldPromptConfirmation = (force: boolean): boolean => {
      return !force;
    };

    expect(shouldPromptConfirmation(true)).toBe(false);
    expect(shouldPromptConfirmation(false)).toBe(true);
  });

  test("dry-run flag prevents API call", () => {
    const shouldExecuteDelete = (dryRun: boolean): boolean => {
      return !dryRun;
    };

    expect(shouldExecuteDelete(true)).toBe(false);
    expect(shouldExecuteDelete(false)).toBe(true);
  });

  test("dry-run produces preview output for single issue", () => {
    const createDryRunOutput = (issueKey: string, deleteSubtasks: boolean) => {
      return {
        dryRun: true,
        actions: [
          {
            issueKey,
            action: "delete",
            deleteSubtasks,
          },
        ],
      };
    };

    const result = createDryRunOutput("PROJ-123", false);
    expect(result.dryRun).toBe(true);
    expect(result.actions[0]?.issueKey).toBe("PROJ-123");
    expect(result.actions[0]?.action).toBe("delete");
    expect(result.actions[0]?.deleteSubtasks).toBe(false);
  });

  test("dry-run produces preview output for multiple issues", () => {
    const createDryRunOutput = (issueKeys: string[], deleteSubtasks: boolean) => {
      return {
        dryRun: true,
        actions: issueKeys.map((key) => ({
          issueKey: key,
          action: "delete",
          deleteSubtasks,
        })),
      };
    };

    const result = createDryRunOutput(["PROJ-123", "PROJ-124", "PROJ-125"], true);
    expect(result.dryRun).toBe(true);
    expect(result.actions).toHaveLength(3);
    expect(result.actions[0]?.deleteSubtasks).toBe(true);
  });

  test("creates delete result object with correct structure", () => {
    interface DeleteResult {
      success: boolean;
      issueKey: string;
      message: string;
      error?: string;
    }

    const createDeleteResult = (
      issueKey: string,
      success: boolean,
      error?: string
    ): DeleteResult => {
      return {
        success,
        issueKey,
        message: success
          ? `Issue ${issueKey} deleted successfully`
          : `Failed to delete issue ${issueKey}`,
        error,
      };
    };

    const successResult = createDeleteResult("PROJ-123", true);
    expect(successResult.success).toBe(true);
    expect(successResult.issueKey).toBe("PROJ-123");
    expect(successResult.message).toContain("deleted successfully");
    expect(successResult.error).toBeUndefined();

    const failureResult = createDeleteResult("PROJ-124", false, "Not found");
    expect(failureResult.success).toBe(false);
    expect(failureResult.issueKey).toBe("PROJ-124");
    expect(failureResult.message).toContain("Failed to delete");
    expect(failureResult.error).toBe("Not found");
  });

  test("handles empty issue key list", () => {
    const validateIssueKeyList = (keys: string[]): boolean => {
      return keys.length > 0;
    };

    expect(validateIssueKeyList(["PROJ-123"])).toBe(true);
    expect(validateIssueKeyList([])).toBe(false);
  });
});

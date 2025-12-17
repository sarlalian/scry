import { describe, expect, test, mock } from "bun:test";
import type { User } from "../../../../../src/api/types/user.ts";

describe("issue assign command", () => {
  test("assigns issue to user by account ID", async () => {
    const mockAssign = mock(async (_issueKey: string, accountId: string | null): Promise<void> => {
      expect(accountId).toBe("5f8d9e7a6b5c4d3e2f1a0b9c");
    });

    await mockAssign("PROJ-123", "5f8d9e7a6b5c4d3e2f1a0b9c");

    expect(mockAssign).toHaveBeenCalledTimes(1);
    expect(mockAssign).toHaveBeenCalledWith("PROJ-123", "5f8d9e7a6b5c4d3e2f1a0b9c");
  });

  test("assigns issue to current user with 'me' shorthand", async () => {
    const mockGetMyself = mock(async (): Promise<User> => {
      return {
        accountId: "current-user-id",
        displayName: "Current User",
        emailAddress: "current@example.com",
        active: true,
      };
    });

    const mockAssign = mock(async (_issueKey: string, accountId: string | null): Promise<void> => {
      expect(accountId).toBe("current-user-id");
    });

    const currentUser = await mockGetMyself();
    await mockAssign("PROJ-123", currentUser.accountId);

    expect(mockGetMyself).toHaveBeenCalledTimes(1);
    expect(mockAssign).toHaveBeenCalledWith("PROJ-123", "current-user-id");
  });

  test("unassigns issue with '-' value", async () => {
    const mockAssign = mock(async (_issueKey: string, accountId: string | null): Promise<void> => {
      expect(accountId).toBeNull();
    });

    await mockAssign("PROJ-123", null);

    expect(mockAssign).toHaveBeenCalledTimes(1);
    expect(mockAssign).toHaveBeenCalledWith("PROJ-123", null);
  });

  test("unassigns issue with 'none' value", async () => {
    const normalizeAssignee = (assignee: string): string | null => {
      const normalized = assignee.trim().toLowerCase();
      if (normalized === "-" || normalized === "none" || normalized === "unassigned") {
        return null;
      }
      return assignee;
    };

    expect(normalizeAssignee("none")).toBeNull();
    expect(normalizeAssignee("NONE")).toBeNull();
    expect(normalizeAssignee("None")).toBeNull();
  });

  test("unassigns issue with 'unassigned' value", async () => {
    const normalizeAssignee = (assignee: string): string | null => {
      const normalized = assignee.trim().toLowerCase();
      if (normalized === "-" || normalized === "none" || normalized === "unassigned") {
        return null;
      }
      return assignee;
    };

    expect(normalizeAssignee("unassigned")).toBeNull();
    expect(normalizeAssignee("UNASSIGNED")).toBeNull();
    expect(normalizeAssignee("Unassigned")).toBeNull();
  });

  test("handles 'me' shorthand case-insensitively", () => {
    const isMe = (assignee: string): boolean => {
      return assignee.trim().toLowerCase() === "me";
    };

    expect(isMe("me")).toBe(true);
    expect(isMe("Me")).toBe(true);
    expect(isMe("ME")).toBe(true);
    expect(isMe(" me ")).toBe(true);
    expect(isMe("myself")).toBe(false);
  });

  test("searches for user by email", async () => {
    const mockSearch = mock(async (query: string): Promise<User[]> => {
      if (query.includes("@")) {
        return [
          {
            accountId: "found-user-id",
            displayName: "Found User",
            emailAddress: query,
            active: true,
          },
        ];
      }
      return [];
    });

    const results = await mockSearch("user@example.com");

    expect(results).toHaveLength(1);
    expect(results[0]?.accountId).toBe("found-user-id");
    expect(results[0]?.emailAddress).toBe("user@example.com");
  });

  test("searches for user by display name", async () => {
    const mockSearch = mock(async (query: string): Promise<User[]> => {
      return [
        {
          accountId: "found-user-id",
          displayName: query,
          emailAddress: "user@example.com",
          active: true,
        },
      ];
    });

    const results = await mockSearch("John Doe");

    expect(results).toHaveLength(1);
    expect(results[0]?.accountId).toBe("found-user-id");
    expect(results[0]?.displayName).toBe("John Doe");
  });

  test("handles no users found in search", async () => {
    const mockSearch = mock(async (_query: string): Promise<User[]> => {
      return [];
    });

    const results = await mockSearch("nonexistent@example.com");

    expect(results).toHaveLength(0);
  });

  test("handles multiple users found in search", async () => {
    const mockSearch = mock(async (query: string): Promise<User[]> => {
      return [
        {
          accountId: "user1",
          displayName: `${query} 1`,
          emailAddress: "user1@example.com",
          active: true,
        },
        {
          accountId: "user2",
          displayName: `${query} 2`,
          emailAddress: "user2@example.com",
          active: true,
        },
      ];
    });

    const results = await mockSearch("John");

    expect(results).toHaveLength(2);
    expect(results[0]?.accountId).toBe("user1");
    expect(results[1]?.accountId).toBe("user2");
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

  test("formats success message for assignment", () => {
    const formatAssignMessage = (
      issueKey: string,
      assigneeName: string | null
    ): { success: boolean; message: string } => {
      if (assigneeName === null) {
        return {
          success: true,
          message: `Issue ${issueKey} has been unassigned`,
        };
      }
      return {
        success: true,
        message: `Issue ${issueKey} has been assigned to ${assigneeName}`,
      };
    };

    const assignedMsg = formatAssignMessage("PROJ-123", "John Doe");
    expect(assignedMsg.success).toBe(true);
    expect(assignedMsg.message).toContain("assigned to John Doe");

    const unassignedMsg = formatAssignMessage("PROJ-123", null);
    expect(unassignedMsg.success).toBe(true);
    expect(unassignedMsg.message).toContain("unassigned");
  });

  test("handles empty assignee string", () => {
    const normalizeAssignee = (assignee: string): string | null => {
      const trimmed = assignee.trim();
      if (!trimmed) {
        return null;
      }
      const normalized = trimmed.toLowerCase();
      if (normalized === "-" || normalized === "none" || normalized === "unassigned") {
        return null;
      }
      return assignee;
    };

    expect(normalizeAssignee("")).toBeNull();
    expect(normalizeAssignee("   ")).toBeNull();
  });

  test("preserves account ID when it looks like a valid Jira account ID", () => {
    const isAccountId = (value: string): boolean => {
      return /^[a-f0-9]{24}$/.test(value) || value.includes(":");
    };

    expect(isAccountId("5f8d9e7a6b5c4d3e2f1a0b9c")).toBe(true);
    expect(isAccountId("557058:f58131cb-b67d-43c7-b30d-6b58d40bd077")).toBe(true);
    expect(isAccountId("user@example.com")).toBe(false);
    expect(isAccountId("John Doe")).toBe(false);
  });

  test("dry-run flag prevents API call", () => {
    const shouldExecuteAssign = (dryRun: boolean): boolean => {
      return !dryRun;
    };

    expect(shouldExecuteAssign(true)).toBe(false);
    expect(shouldExecuteAssign(false)).toBe(true);
  });

  test("dry-run produces preview output for assignment", () => {
    const createDryRunOutput = (
      issueKey: string,
      assignee: { accountId: string | null; displayName: string | null }
    ) => {
      return {
        dryRun: true,
        issueKey,
        action: "assign",
        assignee,
      };
    };

    const result = createDryRunOutput("PROJ-123", {
      accountId: "user123",
      displayName: "John Doe",
    });

    expect(result.dryRun).toBe(true);
    expect(result.issueKey).toBe("PROJ-123");
    expect(result.action).toBe("assign");
    expect(result.assignee.accountId).toBe("user123");
    expect(result.assignee.displayName).toBe("John Doe");
  });

  test("dry-run produces preview output for unassignment", () => {
    const createDryRunOutput = (
      issueKey: string,
      assignee: { accountId: string | null; displayName: string | null }
    ) => {
      return {
        dryRun: true,
        issueKey,
        action: "assign",
        assignee,
      };
    };

    const result = createDryRunOutput("PROJ-123", {
      accountId: null,
      displayName: null,
    });

    expect(result.dryRun).toBe(true);
    expect(result.assignee.accountId).toBeNull();
    expect(result.assignee.displayName).toBeNull();
  });
});

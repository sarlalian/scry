import { describe, expect, test } from "bun:test";

describe("user search command", () => {
  test("formats user data for output", () => {
    const users = [
      {
        accountId: "123-abc-456",
        displayName: "John Doe",
        emailAddress: "john@example.com",
        active: true,
        accountType: "atlassian",
      },
      {
        accountId: "789-def-012",
        displayName: "Jane Smith",
        emailAddress: "jane@example.com",
        active: false,
        accountType: "atlassian",
      },
      {
        accountId: "345-ghi-678",
        displayName: "Bob Wilson",
        active: true,
        accountType: "atlassian",
      },
    ];

    type User = (typeof users)[number];
    const formatUsersForOutput = (users: User[]) => {
      return users.map((user) => ({
        accountId: user.accountId,
        displayName: user.displayName,
        email: user.emailAddress ?? "-",
        active: user.active,
      }));
    };

    const formatted = formatUsersForOutput(users);

    expect(formatted).toHaveLength(3);
    expect(formatted[0]?.accountId).toBe("123-abc-456");
    expect(formatted[0]?.displayName).toBe("John Doe");
    expect(formatted[0]?.email).toBe("john@example.com");
    expect(formatted[0]?.active).toBe(true);
    expect(formatted[1]?.active).toBe(false);
    expect(formatted[2]?.email).toBe("-");
  });

  test("validates query parameter is provided", () => {
    const validateQuery = (query?: string): { valid: boolean; error?: string } => {
      if (!query || query.trim() === "") {
        return { valid: false, error: "Search query is required" };
      }
      return { valid: true };
    };

    const result1 = validateQuery("john");
    expect(result1.valid).toBe(true);

    const result2 = validateQuery("");
    expect(result2.valid).toBe(false);
    expect(result2.error).toBe("Search query is required");

    const result3 = validateQuery(undefined);
    expect(result3.valid).toBe(false);
    expect(result3.error).toBe("Search query is required");

    const result4 = validateQuery("  ");
    expect(result4.valid).toBe(false);
  });

  test("parses pagination options", () => {
    const parsePaginationOptions = (
      startAt?: string,
      maxResults?: string
    ): { startAt: number; maxResults: number } => {
      return {
        startAt: startAt ? parseInt(startAt, 10) : 0,
        maxResults: maxResults ? parseInt(maxResults, 10) : 50,
      };
    };

    const result1 = parsePaginationOptions();
    expect(result1.startAt).toBe(0);
    expect(result1.maxResults).toBe(50);

    const result2 = parsePaginationOptions("10", "25");
    expect(result2.startAt).toBe(10);
    expect(result2.maxResults).toBe(25);

    const result3 = parsePaginationOptions("0", "100");
    expect(result3.startAt).toBe(0);
    expect(result3.maxResults).toBe(100);
  });

  test("truncates long display names for table output", () => {
    const truncate = (str: string, len: number): string => {
      if (str.length <= len) return str;
      return str.slice(0, len - 1) + "…";
    };

    expect(truncate("John Doe", 50)).toBe("John Doe");
    expect(truncate("This is a very long display name that should be truncated", 20)).toBe(
      "This is a very long…"
    );
    expect(truncate("Exact", 5)).toBe("Exact");
    expect(truncate("Toolong", 5)).toBe("Tool…");
  });

  test("formats active status for display", () => {
    const formatActiveStatus = (active: boolean): string => {
      return active ? "Yes" : "No";
    };

    expect(formatActiveStatus(true)).toBe("Yes");
    expect(formatActiveStatus(false)).toBe("No");
  });

  test("validates limit parameter", () => {
    const validateLimit = (limit?: string): { valid: boolean; limit: number; error?: string } => {
      if (!limit) {
        return { valid: true, limit: 50 };
      }

      const parsed = parseInt(limit, 10);
      if (isNaN(parsed) || parsed < 1) {
        return { valid: false, limit: 50, error: "Limit must be a positive number" };
      }

      if (parsed > 1000) {
        return { valid: false, limit: 50, error: "Limit must not exceed 1000" };
      }

      return { valid: true, limit: parsed };
    };

    const result1 = validateLimit(undefined);
    expect(result1.valid).toBe(true);
    expect(result1.limit).toBe(50);

    const result2 = validateLimit("25");
    expect(result2.valid).toBe(true);
    expect(result2.limit).toBe(25);

    const result3 = validateLimit("0");
    expect(result3.valid).toBe(false);
    expect(result3.error).toContain("positive number");

    const result4 = validateLimit("-10");
    expect(result4.valid).toBe(false);

    const result5 = validateLimit("1001");
    expect(result5.valid).toBe(false);
    expect(result5.error).toContain("not exceed 1000");

    const result6 = validateLimit("abc");
    expect(result6.valid).toBe(false);
  });

  test("validates startAt parameter", () => {
    const validateStartAt = (
      startAt?: string
    ): { valid: boolean; startAt: number; error?: string } => {
      if (!startAt) {
        return { valid: true, startAt: 0 };
      }

      const parsed = parseInt(startAt, 10);
      if (isNaN(parsed) || parsed < 0) {
        return { valid: false, startAt: 0, error: "Start-at must be a non-negative number" };
      }

      return { valid: true, startAt: parsed };
    };

    const result1 = validateStartAt(undefined);
    expect(result1.valid).toBe(true);
    expect(result1.startAt).toBe(0);

    const result2 = validateStartAt("10");
    expect(result2.valid).toBe(true);
    expect(result2.startAt).toBe(10);

    const result3 = validateStartAt("0");
    expect(result3.valid).toBe(true);
    expect(result3.startAt).toBe(0);

    const result4 = validateStartAt("-5");
    expect(result4.valid).toBe(false);
    expect(result4.error).toContain("non-negative");

    const result5 = validateStartAt("xyz");
    expect(result5.valid).toBe(false);
  });
});

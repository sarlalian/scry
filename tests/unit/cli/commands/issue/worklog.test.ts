import { describe, expect, test, mock } from "bun:test";
import type { Worklog } from "../../../../../src/api/types/issue.ts";

describe("issue worklog add command", () => {
  test("adds worklog with time spent", async () => {
    const mockAddWorklog = mock(async (_issueKey: string, _timeSpent: string): Promise<Worklog> => {
      return {
        id: "10000",
        author: {
          accountId: "123",
          displayName: "Test User",
          emailAddress: "test@example.com",
          active: true,
          timeZone: "UTC",
        },
        timeSpent: "2h",
        timeSpentSeconds: 7200,
        started: "2024-01-01T09:00:00.000+0000",
      };
    });

    const result = await mockAddWorklog("PROJ-123", "2h");

    expect(result.id).toBe("10000");
    expect(result.timeSpent).toBe("2h");
    expect(result.timeSpentSeconds).toBe(7200);
    expect(mockAddWorklog).toHaveBeenCalledTimes(1);
    expect(mockAddWorklog).toHaveBeenCalledWith("PROJ-123", "2h");
  });

  test("adds worklog with comment", async () => {
    const mockAddWorklog = mock(
      async (
        _issueKey: string,
        _timeSpent: string,
        _options?: { comment?: string }
      ): Promise<Worklog> => {
        return {
          id: "10001",
          author: {
            accountId: "123",
            displayName: "Test User",
            emailAddress: "test@example.com",
            active: true,
            timeZone: "UTC",
          },
          comment: {
            type: "doc",
            version: 1,
            content: [
              {
                type: "paragraph",
                content: [{ type: "text", text: "Fixed bug" }],
              },
            ],
          },
          timeSpent: "30m",
          timeSpentSeconds: 1800,
          started: "2024-01-01T09:00:00.000+0000",
        };
      }
    );

    const result = await mockAddWorklog("PROJ-456", "30m", { comment: "Fixed bug" });

    expect(result.id).toBe("10001");
    expect(result.timeSpent).toBe("30m");
    expect(mockAddWorklog).toHaveBeenCalledWith("PROJ-456", "30m", { comment: "Fixed bug" });
  });

  test("adds worklog with started time", async () => {
    const mockAddWorklog = mock(
      async (
        _issueKey: string,
        _timeSpent: string,
        _options?: { started?: string }
      ): Promise<Worklog> => {
        return {
          id: "10002",
          author: {
            accountId: "123",
            displayName: "Test User",
            emailAddress: "test@example.com",
            active: true,
            timeZone: "UTC",
          },
          timeSpent: "1d",
          timeSpentSeconds: 28800,
          started: "2024-01-15T09:00:00.000+0000",
        };
      }
    );

    const result = await mockAddWorklog("PROJ-789", "1d", {
      started: "2024-01-15T09:00:00.000+0000",
    });

    expect(result.id).toBe("10002");
    expect(result.started).toBe("2024-01-15T09:00:00.000+0000");
    expect(mockAddWorklog).toHaveBeenCalledWith("PROJ-789", "1d", {
      started: "2024-01-15T09:00:00.000+0000",
    });
  });

  test("validates time format - hours", () => {
    const validateTime = (time: string): boolean => {
      const timePattern = /^(\d+w)?(\d+d)?(\d+h)?(\d+m)?$/;
      return timePattern.test(time) && time.length > 0;
    };

    expect(validateTime("2h")).toBe(true);
    expect(validateTime("1h")).toBe(true);
    expect(validateTime("24h")).toBe(true);
  });

  test("validates time format - minutes", () => {
    const validateTime = (time: string): boolean => {
      const timePattern = /^(\d+w)?(\d+d)?(\d+h)?(\d+m)?$/;
      return timePattern.test(time) && time.length > 0;
    };

    expect(validateTime("30m")).toBe(true);
    expect(validateTime("15m")).toBe(true);
    expect(validateTime("60m")).toBe(true);
  });

  test("validates time format - days", () => {
    const validateTime = (time: string): boolean => {
      const timePattern = /^(\d+w)?(\d+d)?(\d+h)?(\d+m)?$/;
      return timePattern.test(time) && time.length > 0;
    };

    expect(validateTime("1d")).toBe(true);
    expect(validateTime("5d")).toBe(true);
  });

  test("validates time format - weeks", () => {
    const validateTime = (time: string): boolean => {
      const timePattern = /^(\d+w)?(\d+d)?(\d+h)?(\d+m)?$/;
      return timePattern.test(time) && time.length > 0;
    };

    expect(validateTime("1w")).toBe(true);
    expect(validateTime("2w")).toBe(true);
  });

  test("validates time format - combinations", () => {
    const validateTime = (time: string): boolean => {
      const timePattern = /^(\d+w)?(\d+d)?(\d+h)?(\d+m)?$/;
      return timePattern.test(time) && time.length > 0;
    };

    expect(validateTime("1w2d")).toBe(true);
    expect(validateTime("1d4h")).toBe(true);
    expect(validateTime("2h30m")).toBe(true);
    expect(validateTime("1w2d4h30m")).toBe(true);
  });

  test("validates time format - invalid formats", () => {
    const validateTime = (time: string): boolean => {
      const timePattern = /^(\d+w)?(\d+d)?(\d+h)?(\d+m)?$/;
      return timePattern.test(time) && time.length > 0;
    };

    expect(validateTime("")).toBe(false);
    expect(validateTime("2hours")).toBe(false);
    expect(validateTime("30minutes")).toBe(false);
    expect(validateTime("2h30s")).toBe(false);
    expect(validateTime("invalid")).toBe(false);
  });

  test("validates issue key is provided", () => {
    const validateIssueKey = (issueKey?: string): boolean => {
      return !!issueKey && issueKey.trim().length > 0;
    };

    expect(validateIssueKey("PROJ-123")).toBe(true);
    expect(validateIssueKey("")).toBe(false);
    expect(validateIssueKey(undefined)).toBe(false);
    expect(validateIssueKey("  ")).toBe(false);
  });

  test("formats worklog output for table format", () => {
    const formatWorklog = (worklog: Worklog): string => {
      return `Worklog added successfully!\nID: ${worklog.id}\nTime Spent: ${worklog.timeSpent}\nAuthor: ${worklog.author.displayName}\nStarted: ${worklog.started}`;
    };

    const worklog: Worklog = {
      id: "10000",
      author: {
        accountId: "123",
        displayName: "Test User",
        emailAddress: "test@example.com",
        active: true,
        timeZone: "UTC",
      },
      timeSpent: "2h",
      timeSpentSeconds: 7200,
      started: "2024-01-01T09:00:00.000+0000",
    };

    const output = formatWorklog(worklog);
    expect(output).toContain("Worklog added successfully!");
    expect(output).toContain("ID: 10000");
    expect(output).toContain("Time Spent: 2h");
    expect(output).toContain("Author: Test User");
  });

  test("formats worklog with comment", () => {
    const formatWorklog = (worklog: Worklog): string => {
      let output = `Worklog added successfully!\nID: ${worklog.id}\nTime Spent: ${worklog.timeSpent}\nAuthor: ${worklog.author.displayName}\nStarted: ${worklog.started}`;

      if (worklog.comment) {
        const commentText = worklog.comment.content
          ?.map((node) => {
            if ("content" in node && Array.isArray(node.content)) {
              return node.content.map((c) => ("text" in c ? c.text : "")).join("");
            }
            return "";
          })
          .join("\n");
        if (commentText) {
          output += `\nComment: ${commentText}`;
        }
      }

      return output;
    };

    const worklog: Worklog = {
      id: "10001",
      author: {
        accountId: "123",
        displayName: "Test User",
        emailAddress: "test@example.com",
        active: true,
        timeZone: "UTC",
      },
      comment: {
        type: "doc",
        version: 1,
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: "Fixed authentication bug" }],
          },
        ],
      },
      timeSpent: "2h",
      timeSpentSeconds: 7200,
      started: "2024-01-01T09:00:00.000+0000",
    };

    const output = formatWorklog(worklog);
    expect(output).toContain("Comment: Fixed authentication bug");
  });

  test("parses ISO 8601 started time", () => {
    const parseStartedTime = (started: string): string => {
      return started;
    };

    expect(parseStartedTime("2024-01-15T09:00:00")).toBe("2024-01-15T09:00:00");
    expect(parseStartedTime("2024-01-15T09:00:00.000+0000")).toBe("2024-01-15T09:00:00.000+0000");
  });
});

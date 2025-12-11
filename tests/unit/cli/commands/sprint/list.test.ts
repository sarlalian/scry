import { describe, expect, test } from "bun:test";

describe("sprint list command", () => {
  test("formats sprint data for output", () => {
    const sprints = [
      {
        id: 1,
        self: "https://example.atlassian.net/rest/agile/1.0/sprint/1",
        state: "closed" as const,
        name: "Sprint 1",
        startDate: "2024-12-01T00:00:00.000Z",
        endDate: "2024-12-14T00:00:00.000Z",
        completeDate: "2024-12-14T00:00:00.000Z",
        originBoardId: 123,
      },
      {
        id: 2,
        self: "https://example.atlassian.net/rest/agile/1.0/sprint/2",
        state: "active" as const,
        name: "Sprint 2",
        startDate: "2024-12-15T00:00:00.000Z",
        endDate: "2024-12-28T00:00:00.000Z",
        originBoardId: 123,
        goal: "Complete feature X",
      },
      {
        id: 3,
        self: "https://example.atlassian.net/rest/agile/1.0/sprint/3",
        state: "future" as const,
        name: "Sprint 3",
        originBoardId: 123,
      },
    ];

    type Sprint = (typeof sprints)[number];
    const formatSprintsForOutput = (sprints: Sprint[]) => {
      return sprints.map((sprint) => ({
        id: sprint.id,
        name: sprint.name,
        state: sprint.state,
        startDate: sprint.startDate ? formatDate(sprint.startDate) : "-",
        endDate: sprint.endDate ? formatDate(sprint.endDate) : "-",
        goal: sprint.goal ?? "-",
      }));
    };

    const formatDate = (dateStr: string): string => {
      return dateStr.split("T")[0] ?? "";
    };

    const formatted = formatSprintsForOutput(sprints);

    expect(formatted).toHaveLength(3);
    expect(formatted[0]?.state).toBe("closed");
    expect(formatted[0]?.startDate).toBe("2024-12-01");
    expect(formatted[0]?.endDate).toBe("2024-12-14");
    expect(formatted[1]?.state).toBe("active");
    expect(formatted[1]?.goal).toBe("Complete feature X");
    expect(formatted[2]?.state).toBe("future");
    expect(formatted[2]?.startDate).toBe("-");
  });

  test("validates board ID is provided or in config", () => {
    const validateBoardId = (
      boardIdFromFlag?: string,
      boardIdFromConfig?: number
    ): { valid: boolean; boardId?: number; error?: string } => {
      if (boardIdFromFlag) {
        const parsed = parseInt(boardIdFromFlag, 10);
        if (isNaN(parsed)) {
          return { valid: false, error: "Board ID must be a number" };
        }
        return { valid: true, boardId: parsed };
      }

      if (boardIdFromConfig) {
        return { valid: true, boardId: boardIdFromConfig };
      }

      return {
        valid: false,
        error: "Board ID is required. Use --board-id or configure default board in config",
      };
    };

    const result1 = validateBoardId("123", undefined);
    expect(result1.valid).toBe(true);
    expect(result1.boardId).toBe(123);

    const result2 = validateBoardId(undefined, 456);
    expect(result2.valid).toBe(true);
    expect(result2.boardId).toBe(456);

    const result3 = validateBoardId(undefined, undefined);
    expect(result3.valid).toBe(false);
    expect(result3.error).toContain("Board ID is required");

    const result4 = validateBoardId("abc", undefined);
    expect(result4.valid).toBe(false);
    expect(result4.error).toContain("must be a number");
  });

  test("validates state filter values", () => {
    const validateState = (
      state?: string
    ): { valid: boolean; state?: "active" | "closed" | "future"; error?: string } => {
      if (!state) {
        return { valid: true };
      }

      const validStates = ["active", "closed", "future"];
      if (!validStates.includes(state)) {
        return {
          valid: false,
          error: `State must be one of: ${validStates.join(", ")}`,
        };
      }

      return { valid: true, state: state as "active" | "closed" | "future" };
    };

    const result1 = validateState(undefined);
    expect(result1.valid).toBe(true);

    const result2 = validateState("active");
    expect(result2.valid).toBe(true);
    expect(result2.state).toBe("active");

    const result3 = validateState("invalid");
    expect(result3.valid).toBe(false);
    expect(result3.error).toContain("must be one of");
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

    const result2 = parsePaginationOptions("10", "20");
    expect(result2.startAt).toBe(10);
    expect(result2.maxResults).toBe(20);
  });

  test("truncates long sprint names for table output", () => {
    const truncate = (str: string, len: number): string => {
      if (str.length <= len) return str;
      return str.slice(0, len - 1) + "…";
    };

    expect(truncate("Short name", 50)).toBe("Short name");
    expect(truncate("This is a very long sprint name that should be truncated", 20)).toBe(
      "This is a very long…"
    );
  });

  test("formats state with color indication", () => {
    const getStateDisplay = (state: "active" | "closed" | "future"): string => {
      const stateMap = {
        active: "ACTIVE",
        closed: "CLOSED",
        future: "FUTURE",
      };
      return stateMap[state];
    };

    expect(getStateDisplay("active")).toBe("ACTIVE");
    expect(getStateDisplay("closed")).toBe("CLOSED");
    expect(getStateDisplay("future")).toBe("FUTURE");
  });
});

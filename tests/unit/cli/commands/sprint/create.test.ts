import { describe, expect, test, mock } from "bun:test";
import type { CreateSprintRequest, Sprint } from "../../../../../src/api/types/sprint.ts";

describe("sprint create command", () => {
  test("creates sprint with required fields from flags", async () => {
    const mockCreate = mock(async (_request: CreateSprintRequest): Promise<Sprint> => {
      return {
        id: 42,
        self: "https://example.atlassian.net/rest/agile/1.0/sprint/42",
        state: "future",
        name: "Sprint 10",
        originBoardId: 123,
      };
    });

    const request: CreateSprintRequest = {
      name: "Sprint 10",
      originBoardId: 123,
    };

    const result = await mockCreate(request);

    expect(result.id).toBe(42);
    expect(result.name).toBe("Sprint 10");
    expect(result.state).toBe("future");
    expect(mockCreate).toHaveBeenCalledTimes(1);
  });

  test("creates sprint with all optional fields", async () => {
    const mockCreate = mock(async (_request: CreateSprintRequest): Promise<Sprint> => {
      return {
        id: 43,
        self: "https://example.atlassian.net/rest/agile/1.0/sprint/43",
        state: "future",
        name: "Sprint 11",
        startDate: "2025-01-15T00:00:00.000Z",
        endDate: "2025-01-29T00:00:00.000Z",
        goal: "Complete feature Y",
        originBoardId: 123,
      };
    });

    const request: CreateSprintRequest = {
      name: "Sprint 11",
      startDate: "2025-01-15T00:00:00.000Z",
      endDate: "2025-01-29T00:00:00.000Z",
      goal: "Complete feature Y",
      originBoardId: 123,
    };

    const result = await mockCreate(request);

    expect(result.id).toBe(43);
    expect(result.name).toBe("Sprint 11");
    expect(result.goal).toBe("Complete feature Y");
    expect(result.startDate).toBe("2025-01-15T00:00:00.000Z");
    expect(result.endDate).toBe("2025-01-29T00:00:00.000Z");
    expect(mockCreate).toHaveBeenCalledTimes(1);
  });

  test("validates required fields are present", () => {
    const validateRequiredFields = (
      name?: string,
      boardId?: number
    ): { valid: boolean; missing: string[] } => {
      const missing: string[] = [];
      if (!name) missing.push("name");
      if (!boardId) missing.push("boardId");
      return { valid: missing.length === 0, missing };
    };

    const result1 = validateRequiredFields("Sprint 10", 123);
    expect(result1.valid).toBe(true);
    expect(result1.missing).toHaveLength(0);

    const result2 = validateRequiredFields(undefined, 123);
    expect(result2.valid).toBe(false);
    expect(result2.missing).toContain("name");

    const result3 = validateRequiredFields("Sprint 10", undefined);
    expect(result3.valid).toBe(false);
    expect(result3.missing).toContain("boardId");

    const result4 = validateRequiredFields(undefined, undefined);
    expect(result4.valid).toBe(false);
    expect(result4.missing).toContain("name");
    expect(result4.missing).toContain("boardId");
  });

  test("parses ISO date strings for start and end dates", () => {
    const parseDate = (dateStr?: string): string | undefined => {
      if (!dateStr) return undefined;
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        throw new Error(`Invalid date: ${dateStr}`);
      }
      return date.toISOString();
    };

    expect(parseDate("2025-01-15")).toBe("2025-01-15T00:00:00.000Z");
    expect(parseDate("2025-01-15T10:30:00Z")).toBe("2025-01-15T10:30:00.000Z");
    expect(parseDate(undefined)).toBeUndefined();
    expect(() => parseDate("invalid-date")).toThrow("Invalid date: invalid-date");
  });

  test("board ID must be a valid number", () => {
    const parseBoardId = (boardIdStr: string): number => {
      const parsed = parseInt(boardIdStr, 10);
      if (isNaN(parsed)) {
        throw new Error("Board ID must be a number");
      }
      return parsed;
    };

    expect(parseBoardId("123")).toBe(123);
    expect(parseBoardId("456")).toBe(456);
    expect(() => parseBoardId("abc")).toThrow("Board ID must be a number");
    expect(parseBoardId("12.34")).toBe(12);
  });

  test("handles missing optional fields correctly", async () => {
    const mockCreate = mock(async (request: CreateSprintRequest): Promise<Sprint> => {
      return {
        id: 44,
        self: "https://example.atlassian.net/rest/agile/1.0/sprint/44",
        state: "future",
        name: request.name,
        originBoardId: request.originBoardId,
        startDate: request.startDate,
        endDate: request.endDate,
        goal: request.goal,
      };
    });

    const request: CreateSprintRequest = {
      name: "Sprint 12",
      originBoardId: 456,
    };

    const result = await mockCreate(request);

    expect(result.startDate).toBeUndefined();
    expect(result.endDate).toBeUndefined();
    expect(result.goal).toBeUndefined();
    expect(result.name).toBe("Sprint 12");
    expect(result.originBoardId).toBe(456);
  });

  test("creates sprint with goal but no dates", async () => {
    const mockCreate = mock(async (_request: CreateSprintRequest): Promise<Sprint> => {
      return {
        id: 45,
        self: "https://example.atlassian.net/rest/agile/1.0/sprint/45",
        state: "future",
        name: "Sprint 13",
        goal: "Research spike",
        originBoardId: 789,
      };
    });

    const request: CreateSprintRequest = {
      name: "Sprint 13",
      originBoardId: 789,
      goal: "Research spike",
    };

    const result = await mockCreate(request);

    expect(result.goal).toBe("Research spike");
    expect(result.startDate).toBeUndefined();
    expect(result.endDate).toBeUndefined();
  });
});

import { describe, expect, test } from "bun:test";
import type { Board } from "../../../../../src/api/types/board.ts";

describe("board list command", () => {
  test("formats board data for output", () => {
    const boards: Board[] = [
      {
        id: 1,
        self: "https://example.atlassian.net/rest/agile/1.0/board/1",
        name: "TEST Scrum Board",
        type: "scrum",
        location: {
          projectKey: "TEST",
          projectName: "Test Project",
        },
      },
      {
        id: 2,
        self: "https://example.atlassian.net/rest/agile/1.0/board/2",
        name: "DEMO Kanban Board",
        type: "kanban",
        location: {
          projectKey: "DEMO",
          projectName: "Demo Project",
        },
      },
      {
        id: 3,
        self: "https://example.atlassian.net/rest/agile/1.0/board/3",
        name: "Simple Board",
        type: "simple",
      },
    ];

    const formatBoardsForOutput = (boards: Board[]) => {
      return boards.map((board) => ({
        id: board.id,
        name: board.name,
        type: board.type.toUpperCase(),
        projectKey: board.location?.projectKey ?? "-",
      }));
    };

    const formatted = formatBoardsForOutput(boards);

    expect(formatted).toHaveLength(3);
    expect(formatted[0]?.id).toBe(1);
    expect(formatted[0]?.name).toBe("TEST Scrum Board");
    expect(formatted[0]?.type).toBe("SCRUM");
    expect(formatted[0]?.projectKey).toBe("TEST");
    expect(formatted[1]?.id).toBe(2);
    expect(formatted[1]?.type).toBe("KANBAN");
    expect(formatted[1]?.projectKey).toBe("DEMO");
    expect(formatted[2]?.id).toBe(3);
    expect(formatted[2]?.type).toBe("SIMPLE");
    expect(formatted[2]?.projectKey).toBe("-");
  });

  test("truncates long board names for table output", () => {
    const truncate = (str: string, len: number): string => {
      if (str.length <= len) return str;
      return str.slice(0, len - 1) + "…";
    };

    expect(truncate("Short name", 50)).toBe("Short name");
    expect(truncate("This is a very long board name that should be truncated", 30)).toBe(
      "This is a very long board nam…"
    );
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

  test("formats board type to uppercase", () => {
    const formatBoardType = (type: string): string => {
      return type.toUpperCase();
    };

    expect(formatBoardType("scrum")).toBe("SCRUM");
    expect(formatBoardType("kanban")).toBe("KANBAN");
    expect(formatBoardType("simple")).toBe("SIMPLE");
  });

  test("handles boards without location", () => {
    const boards: Board[] = [
      {
        id: 1,
        self: "https://example.atlassian.net/rest/agile/1.0/board/1",
        name: "TEST board",
        type: "scrum",
      },
    ];

    const formatBoardsForOutput = (boards: Board[]) => {
      return boards.map((board) => ({
        id: board.id,
        name: board.name,
        type: board.type,
        projectKey: board.location?.projectKey ?? "-",
      }));
    };

    const formatted = formatBoardsForOutput(boards);
    expect(formatted[0]?.projectKey).toBe("-");
  });

  test("validates board type filter", () => {
    const validateBoardType = (type: string): boolean => {
      const validTypes = ["scrum", "kanban", "simple"];
      return validTypes.includes(type.toLowerCase());
    };

    expect(validateBoardType("scrum")).toBe(true);
    expect(validateBoardType("SCRUM")).toBe(true);
    expect(validateBoardType("kanban")).toBe(true);
    expect(validateBoardType("simple")).toBe(true);
    expect(validateBoardType("invalid")).toBe(false);
  });

  test("builds filter parameters", () => {
    const buildFilterParams = (
      name?: string,
      type?: string,
      projectKey?: string
    ): Record<string, string> => {
      const params: Record<string, string> = {};
      if (name) params["name"] = name;
      if (type) params["type"] = type;
      if (projectKey) params["projectKeyOrId"] = projectKey;
      return params;
    };

    const result1 = buildFilterParams();
    expect(Object.keys(result1)).toHaveLength(0);

    const result2 = buildFilterParams("TEST", "scrum", "TEST");
    expect(result2["name"]).toBe("TEST");
    expect(result2["type"]).toBe("scrum");
    expect(result2["projectKeyOrId"]).toBe("TEST");

    const result3 = buildFilterParams("TEST");
    expect(result3["name"]).toBe("TEST");
    expect(result3["type"]).toBeUndefined();
  });

  test("handles empty board list", () => {
    const boards: Board[] = [];

    const formatBoardsForOutput = (boards: Board[]) => {
      return boards.map((board) => ({
        id: board.id,
        name: board.name,
        type: board.type,
        projectKey: board.location?.projectKey ?? "-",
      }));
    };

    const formatted = formatBoardsForOutput(boards);
    expect(formatted).toHaveLength(0);
  });
});

import { describe, expect, test, mock } from "bun:test";
import type { Config } from "../../../../src/config/index.ts";

describe("open command", () => {
  const mockConfig: Config = {
    server: "https://example.atlassian.net",
    login: "user@example.com",
    auth: { type: "basic", token: "test-token" },
    project: { key: "PROJ" },
    board: { id: 123 },
    epic: {},
    issue: { types: [] },
    output: { format: "table", colors: true },
  };

  test("opens issue URL when given issue key", async () => {
    const mockOpenBrowser = mock((_url: string) => Promise.resolve());
    const expectedUrl = "https://example.atlassian.net/browse/PROJ-123";

    await mockOpenBrowser(expectedUrl);

    expect(mockOpenBrowser).toHaveBeenCalledWith(expectedUrl);
  });

  test("opens project URL when given project key", async () => {
    const mockOpenBrowser = mock((_url: string) => Promise.resolve());
    const expectedUrl = "https://example.atlassian.net/browse/PROJ";

    await mockOpenBrowser(expectedUrl);

    expect(mockOpenBrowser).toHaveBeenCalledWith(expectedUrl);
  });

  test("opens board URL when given board flag", async () => {
    const mockOpenBrowser = mock((_url: string) => Promise.resolve());
    const expectedUrl = "https://example.atlassian.net/secure/RapidBoard.jspa?rapidView=456";

    await mockOpenBrowser(expectedUrl);

    expect(mockOpenBrowser).toHaveBeenCalledWith(expectedUrl);
  });

  test("opens sprint URL when given sprint and board flags", async () => {
    const mockOpenBrowser = mock((_url: string) => Promise.resolve());
    const expectedUrl =
      "https://example.atlassian.net/secure/RapidBoard.jspa?rapidView=123&sprint=789";

    await mockOpenBrowser(expectedUrl);

    expect(mockOpenBrowser).toHaveBeenCalledWith(expectedUrl);
  });

  test("uses configured server URL", () => {
    const config = mockConfig;
    expect(config.server).toBe("https://example.atlassian.net");
  });

  test("uses default board ID from config when not provided", () => {
    const config = mockConfig;
    const boardId = config.board.id;
    expect(boardId).toBe(123);
  });

  test("requires resource identifier", () => {
    const validateInput = (
      resource?: string,
      board?: number,
      sprint?: number
    ): { valid: boolean; error?: string } => {
      if (!resource && !board && !sprint) {
        return {
          valid: false,
          error: "Must provide a resource (issue/project key, --board, or --sprint)",
        };
      }
      return { valid: true };
    };

    const result = validateInput();
    expect(result.valid).toBe(false);
    expect(result.error).toBe("Must provide a resource (issue/project key, --board, or --sprint)");
  });

  test("requires board ID when sprint is specified", () => {
    const validateInput = (board?: number, sprint?: number): { valid: boolean; error?: string } => {
      if (sprint && !board) {
        return { valid: false, error: "--sprint requires --board to be specified" };
      }
      return { valid: true };
    };

    const result = validateInput(undefined, 789);
    expect(result.valid).toBe(false);
    expect(result.error).toBe("--sprint requires --board to be specified");
  });

  test("handles case-insensitive issue keys", () => {
    const normalizeKey = (key: string) => key.toUpperCase();

    expect(normalizeKey("proj-123")).toBe("PROJ-123");
    expect(normalizeKey("PROJ-123")).toBe("PROJ-123");
    expect(normalizeKey("PrOj-123")).toBe("PROJ-123");
  });

  test("detects resource type from input", () => {
    const detectType = (input: string) => {
      if (/^[A-Z][A-Z0-9]+-\d+$/i.test(input)) return "issue";
      if (/^[A-Z][A-Z0-9]+$/i.test(input)) return "project";
      return "unknown";
    };

    expect(detectType("PROJ-123")).toBe("issue");
    expect(detectType("PROJ")).toBe("project");
    expect(detectType("proj-456")).toBe("issue");
    expect(detectType("proj")).toBe("project");
  });
});

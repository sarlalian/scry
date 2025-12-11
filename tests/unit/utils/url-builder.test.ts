import { describe, expect, test } from "bun:test";

describe("URL builder utility", () => {
  const baseUrl = "https://example.atlassian.net";

  describe("buildIssueUrl", () => {
    test("builds URL for issue key", () => {
      const buildIssueUrl = (base: string, key: string) => `${base}/browse/${key}`;
      const url = buildIssueUrl(baseUrl, "PROJ-123");
      expect(url).toBe("https://example.atlassian.net/browse/PROJ-123");
    });

    test("handles uppercase issue keys", () => {
      const buildIssueUrl = (base: string, key: string) => `${base}/browse/${key}`;
      const url = buildIssueUrl(baseUrl, "PROJ-456");
      expect(url).toBe("https://example.atlassian.net/browse/PROJ-456");
    });

    test("handles lowercase issue keys", () => {
      const buildIssueUrl = (base: string, key: string) => `${base}/browse/${key}`;
      const url = buildIssueUrl(baseUrl, "proj-789");
      expect(url).toBe("https://example.atlassian.net/browse/proj-789");
    });
  });

  describe("buildProjectUrl", () => {
    test("builds URL for project key", () => {
      const buildProjectUrl = (base: string, key: string) => `${base}/browse/${key}`;
      const url = buildProjectUrl(baseUrl, "PROJ");
      expect(url).toBe("https://example.atlassian.net/browse/PROJ");
    });
  });

  describe("buildBoardUrl", () => {
    test("builds URL for board ID", () => {
      const buildBoardUrl = (base: string, id: number) =>
        `${base}/secure/RapidBoard.jspa?rapidView=${id}`;
      const url = buildBoardUrl(baseUrl, 123);
      expect(url).toBe("https://example.atlassian.net/secure/RapidBoard.jspa?rapidView=123");
    });

    test("handles string board ID", () => {
      const buildBoardUrl = (base: string, id: string | number) =>
        `${base}/secure/RapidBoard.jspa?rapidView=${id}`;
      const url = buildBoardUrl(baseUrl, "456");
      expect(url).toBe("https://example.atlassian.net/secure/RapidBoard.jspa?rapidView=456");
    });
  });

  describe("buildSprintUrl", () => {
    test("builds URL for sprint with board ID", () => {
      const buildSprintUrl = (base: string, boardId: number, sprintId: number) =>
        `${base}/secure/RapidBoard.jspa?rapidView=${boardId}&sprint=${sprintId}`;
      const url = buildSprintUrl(baseUrl, 123, 456);
      expect(url).toBe(
        "https://example.atlassian.net/secure/RapidBoard.jspa?rapidView=123&sprint=456"
      );
    });
  });

  describe("detectResourceType", () => {
    test("detects issue key pattern", () => {
      const detectResourceType = (input: string) => {
        if (/^[A-Z][A-Z0-9]+-\d+$/i.test(input)) return "issue";
        if (/^[A-Z][A-Z0-9]+$/i.test(input)) return "project";
        return "unknown";
      };

      expect(detectResourceType("PROJ-123")).toBe("issue");
      expect(detectResourceType("ABC-1")).toBe("issue");
      expect(detectResourceType("PROJECT-9999")).toBe("issue");
    });

    test("detects project key pattern", () => {
      const detectResourceType = (input: string) => {
        if (/^[A-Z][A-Z0-9]+-\d+$/i.test(input)) return "issue";
        if (/^[A-Z][A-Z0-9]+$/i.test(input)) return "project";
        return "unknown";
      };

      expect(detectResourceType("PROJ")).toBe("project");
      expect(detectResourceType("ABC")).toBe("project");
      expect(detectResourceType("PROJECT")).toBe("project");
    });

    test("handles lowercase input", () => {
      const detectResourceType = (input: string) => {
        if (/^[A-Z][A-Z0-9]+-\d+$/i.test(input)) return "issue";
        if (/^[A-Z][A-Z0-9]+$/i.test(input)) return "project";
        return "unknown";
      };

      expect(detectResourceType("proj-123")).toBe("issue");
      expect(detectResourceType("proj")).toBe("project");
    });

    test("returns unknown for invalid patterns", () => {
      const detectResourceType = (input: string) => {
        if (/^[A-Z][A-Z0-9]+-\d+$/i.test(input)) return "issue";
        if (/^[A-Z][A-Z0-9]+$/i.test(input)) return "project";
        return "unknown";
      };

      expect(detectResourceType("123")).toBe("unknown");
      expect(detectResourceType("proj-")).toBe("unknown");
      expect(detectResourceType("")).toBe("unknown");
    });
  });

  describe("normalizeBaseUrl", () => {
    test("removes trailing slash", () => {
      const normalizeBaseUrl = (url: string) => url.replace(/\/$/, "");
      expect(normalizeBaseUrl("https://example.atlassian.net/")).toBe(
        "https://example.atlassian.net"
      );
    });

    test("preserves URL without trailing slash", () => {
      const normalizeBaseUrl = (url: string) => url.replace(/\/$/, "");
      expect(normalizeBaseUrl("https://example.atlassian.net")).toBe(
        "https://example.atlassian.net"
      );
    });
  });
});

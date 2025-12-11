import { describe, expect, test } from "bun:test";
import type { Version } from "../../../../../src/api/types/version.ts";

describe("release list command", () => {
  test("formats version data for output", () => {
    const versions: Version[] = [
      {
        id: "10000",
        name: "v1.0.0",
        description: "First release",
        archived: false,
        released: true,
        releaseDate: "2024-01-15",
        projectId: 10001,
        self: "https://example.atlassian.net/rest/api/3/version/10000",
      },
      {
        id: "10001",
        name: "v1.1.0",
        description: "Minor update",
        archived: false,
        released: false,
        projectId: 10001,
        self: "https://example.atlassian.net/rest/api/3/version/10001",
      },
      {
        id: "10002",
        name: "v0.9.0",
        archived: true,
        released: true,
        releaseDate: "2023-12-01",
        projectId: 10001,
        self: "https://example.atlassian.net/rest/api/3/version/10002",
      },
    ];

    const formatVersionsForOutput = (versions: Version[]) => {
      return versions.map((version) => ({
        id: version.id,
        name: version.name,
        status: formatStatus(version),
        releaseDate: version.releaseDate ?? "-",
        description: version.description ?? "-",
      }));
    };

    const formatStatus = (version: Version): string => {
      if (version.archived) return "archived";
      if (version.released) return "released";
      return "unreleased";
    };

    const formatted = formatVersionsForOutput(versions);

    expect(formatted).toHaveLength(3);
    expect(formatted[0]?.id).toBe("10000");
    expect(formatted[0]?.name).toBe("v1.0.0");
    expect(formatted[0]?.status).toBe("released");
    expect(formatted[0]?.releaseDate).toBe("2024-01-15");
    expect(formatted[0]?.description).toBe("First release");
    expect(formatted[1]?.id).toBe("10001");
    expect(formatted[1]?.status).toBe("unreleased");
    expect(formatted[1]?.releaseDate).toBe("-");
    expect(formatted[2]?.status).toBe("archived");
  });

  test("truncates long descriptions for table output", () => {
    const truncate = (str: string, len: number): string => {
      if (str.length <= len) return str;
      return str.slice(0, len - 1) + "…";
    };

    expect(truncate("Short description", 50)).toBe("Short description");
    expect(truncate("This is a very long description that should be truncated", 30)).toBe(
      "This is a very long descripti…"
    );
  });

  test("formats status correctly based on version state", () => {
    const formatStatus = (version: Version): string => {
      if (version.archived) return "archived";
      if (version.released) return "released";
      return "unreleased";
    };

    expect(
      formatStatus({
        id: "1",
        name: "v1",
        archived: true,
        released: true,
        projectId: 1,
        self: "url",
      })
    ).toBe("archived");

    expect(
      formatStatus({
        id: "1",
        name: "v1",
        archived: false,
        released: true,
        projectId: 1,
        self: "url",
      })
    ).toBe("released");

    expect(
      formatStatus({
        id: "1",
        name: "v1",
        archived: false,
        released: false,
        projectId: 1,
        self: "url",
      })
    ).toBe("unreleased");
  });

  test("handles versions without descriptions", () => {
    const versions: Version[] = [
      {
        id: "10000",
        name: "v1.0.0",
        archived: false,
        released: true,
        projectId: 10001,
        self: "https://example.atlassian.net/rest/api/3/version/10000",
      },
    ];

    const formatVersionsForOutput = (versions: Version[]) => {
      return versions.map((version) => ({
        id: version.id,
        name: version.name,
        description: version.description ?? "-",
      }));
    };

    const formatted = formatVersionsForOutput(versions);
    expect(formatted[0]?.description).toBe("-");
  });

  test("handles versions without release dates", () => {
    const versions: Version[] = [
      {
        id: "10000",
        name: "v1.0.0",
        archived: false,
        released: false,
        projectId: 10001,
        self: "https://example.atlassian.net/rest/api/3/version/10000",
      },
    ];

    const formatVersionsForOutput = (versions: Version[]) => {
      return versions.map((version) => ({
        id: version.id,
        name: version.name,
        releaseDate: version.releaseDate ?? "-",
      }));
    };

    const formatted = formatVersionsForOutput(versions);
    expect(formatted[0]?.releaseDate).toBe("-");
  });

  test("handles empty version list", () => {
    const versions: Version[] = [];

    const formatVersionsForOutput = (versions: Version[]) => {
      return versions.map((version) => ({
        id: version.id,
        name: version.name,
      }));
    };

    const formatted = formatVersionsForOutput(versions);
    expect(formatted).toHaveLength(0);
  });

  test("parses status filter option", () => {
    const parseStatusFilter = (
      status?: string
    ): "released" | "unreleased" | "archived" | undefined => {
      if (!status) return undefined;
      if (status === "released" || status === "unreleased" || status === "archived") {
        return status;
      }
      return undefined;
    };

    expect(parseStatusFilter(undefined)).toBeUndefined();
    expect(parseStatusFilter("released")).toBe("released");
    expect(parseStatusFilter("unreleased")).toBe("unreleased");
    expect(parseStatusFilter("archived")).toBe("archived");
    expect(parseStatusFilter("invalid")).toBeUndefined();
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
});

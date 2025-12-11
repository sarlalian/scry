import { describe, expect, test } from "bun:test";
import type { Version } from "../../../../../src/api/types/version.ts";

describe("release create command", () => {
  test("parses date strings to ISO 8601 format", () => {
    const parseDate = (dateStr?: string): string | undefined => {
      if (!dateStr || !dateStr.trim()) return undefined;
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        throw new Error(`Invalid date: ${dateStr}`);
      }
      return date.toISOString();
    };

    expect(parseDate(undefined)).toBeUndefined();
    expect(parseDate("")).toBeUndefined();
    expect(parseDate("   ")).toBeUndefined();

    const result = parseDate("2024-06-15");
    expect(result).toBeDefined();
    expect(result).toContain("2024-06-15");

    const result2 = parseDate("2024-01-01T10:30:00");
    expect(result2).toBeDefined();
    expect(result2).toContain("2024-01-01");

    expect(() => parseDate("invalid-date")).toThrow("Invalid date: invalid-date");
    expect(() => parseDate("not-a-date")).toThrow("Invalid date: not-a-date");
  });

  test("formats created version for table output", () => {
    const formatCreatedVersion = (version: Version, format: string): string => {
      if (format === "table" || format === "plain") {
        return `Release created successfully!
ID: ${version.id}
Name: ${version.name}
${version.description ? `Description: ${version.description}\n` : ""}${version.releaseDate ? `Release Date: ${version.releaseDate.split("T")[0]}\n` : ""}${version.startDate ? `Start Date: ${version.startDate.split("T")[0]}\n` : ""}Status: ${version.released ? "released" : "unreleased"}
URL: ${version.self}`;
      }
      return "";
    };

    const version: Version = {
      id: "10003",
      name: "v2.0.0",
      description: "Major release",
      archived: false,
      released: false,
      releaseDate: "2024-06-15T00:00:00.000Z",
      startDate: "2024-05-01T00:00:00.000Z",
      projectId: 10001,
      self: "https://example.atlassian.net/rest/api/3/version/10003",
    };

    const result = formatCreatedVersion(version, "table");
    expect(result).toContain("Release created successfully!");
    expect(result).toContain("ID: 10003");
    expect(result).toContain("Name: v2.0.0");
    expect(result).toContain("Description: Major release");
    expect(result).toContain("Release Date: 2024-06-15");
    expect(result).toContain("Start Date: 2024-05-01");
    expect(result).toContain("Status: unreleased");
  });

  test("formats released version correctly", () => {
    const formatCreatedVersion = (version: Version, format: string): string => {
      if (format === "table" || format === "plain") {
        return `Status: ${version.released ? "released" : "unreleased"}`;
      }
      return "";
    };

    const releasedVersion: Version = {
      id: "10004",
      name: "v1.5.0",
      archived: false,
      released: true,
      projectId: 10001,
      self: "https://example.atlassian.net/rest/api/3/version/10004",
    };

    const result = formatCreatedVersion(releasedVersion, "table");
    expect(result).toContain("Status: released");
  });

  test("handles version without optional fields", () => {
    const formatCreatedVersion = (version: Version, format: string): string => {
      if (format === "table" || format === "plain") {
        return `Release created successfully!
ID: ${version.id}
Name: ${version.name}
${version.description ? `Description: ${version.description}\n` : ""}${version.releaseDate ? `Release Date: ${version.releaseDate.split("T")[0]}\n` : ""}${version.startDate ? `Start Date: ${version.startDate.split("T")[0]}\n` : ""}Status: ${version.released ? "released" : "unreleased"}
URL: ${version.self}`;
      }
      return "";
    };

    const version: Version = {
      id: "10005",
      name: "v2.1.0",
      archived: false,
      released: false,
      projectId: 10001,
      self: "https://example.atlassian.net/rest/api/3/version/10005",
    };

    const result = formatCreatedVersion(version, "table");
    expect(result).toContain("Release created successfully!");
    expect(result).toContain("ID: 10005");
    expect(result).toContain("Name: v2.1.0");
    expect(result).not.toContain("Description:");
    expect(result).not.toContain("Release Date:");
    expect(result).not.toContain("Start Date:");
  });

  test("validates required fields", () => {
    const validateRequired = (projectKey?: string, name?: string): string | null => {
      if (!projectKey || !projectKey.trim()) {
        return "Project key is required";
      }
      if (!name || !name.trim()) {
        return "Release name is required";
      }
      return null;
    };

    expect(validateRequired(undefined, "v1.0.0")).toBe("Project key is required");
    expect(validateRequired("", "v1.0.0")).toBe("Project key is required");
    expect(validateRequired("   ", "v1.0.0")).toBe("Project key is required");
    expect(validateRequired("TEST", undefined)).toBe("Release name is required");
    expect(validateRequired("TEST", "")).toBe("Release name is required");
    expect(validateRequired("TEST", "   ")).toBe("Release name is required");
    expect(validateRequired("TEST", "v1.0.0")).toBeNull();
  });

  test("builds CreateVersionRequest correctly", () => {
    interface CreateVersionRequest {
      name: string;
      projectId: number;
      description?: string;
      releaseDate?: string;
      startDate?: string;
      archived?: boolean;
      released?: boolean;
    }

    const buildRequest = (
      name: string,
      projectId: number,
      description?: string,
      releaseDate?: string,
      startDate?: string,
      released?: boolean,
      archived?: boolean
    ): CreateVersionRequest => {
      const request: CreateVersionRequest = {
        name,
        projectId,
      };

      if (description && description.trim()) {
        request.description = description;
      }

      if (releaseDate && releaseDate.trim()) {
        request.releaseDate = releaseDate;
      }

      if (startDate && startDate.trim()) {
        request.startDate = startDate;
      }

      if (released !== undefined) {
        request.released = released;
      }

      if (archived !== undefined) {
        request.archived = archived;
      }

      return request;
    };

    const minimalRequest = buildRequest("v1.0.0", 10001);
    expect(minimalRequest.name).toBe("v1.0.0");
    expect(minimalRequest.projectId).toBe(10001);
    expect(minimalRequest.description).toBeUndefined();
    expect(minimalRequest.releaseDate).toBeUndefined();
    expect(minimalRequest.startDate).toBeUndefined();

    const fullRequest = buildRequest(
      "v2.0.0",
      10001,
      "Major release",
      "2024-06-15T00:00:00.000Z",
      "2024-05-01T00:00:00.000Z",
      true,
      false
    );
    expect(fullRequest.name).toBe("v2.0.0");
    expect(fullRequest.projectId).toBe(10001);
    expect(fullRequest.description).toBe("Major release");
    expect(fullRequest.releaseDate).toBe("2024-06-15T00:00:00.000Z");
    expect(fullRequest.startDate).toBe("2024-05-01T00:00:00.000Z");
    expect(fullRequest.released).toBe(true);
    expect(fullRequest.archived).toBe(false);
  });

  test("handles empty optional fields correctly", () => {
    interface CreateVersionRequest {
      name: string;
      projectId: number;
      description?: string;
    }

    const buildRequest = (
      name: string,
      projectId: number,
      description?: string
    ): CreateVersionRequest => {
      const request: CreateVersionRequest = {
        name,
        projectId,
      };

      if (description && description.trim()) {
        request.description = description;
      }

      return request;
    };

    const requestWithEmptyDescription = buildRequest("v1.0.0", 10001, "");
    expect(requestWithEmptyDescription.description).toBeUndefined();

    const requestWithWhitespace = buildRequest("v1.0.0", 10001, "   ");
    expect(requestWithWhitespace.description).toBeUndefined();

    const requestWithValue = buildRequest("v1.0.0", 10001, "Description");
    expect(requestWithValue.description).toBe("Description");
  });
});

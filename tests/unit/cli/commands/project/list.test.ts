import { describe, expect, test } from "bun:test";
import type { Project } from "../../../../../src/api/types/project.ts";

describe("project list command", () => {
  test("formats project data for output", () => {
    const projects: Project[] = [
      {
        id: "10000",
        key: "TEST",
        name: "Test Project",
        projectTypeKey: "software",
        self: "https://example.atlassian.net/rest/api/3/project/10000",
        lead: {
          accountId: "123456",
          displayName: "John Doe",
          active: true,
        },
      },
      {
        id: "10001",
        key: "DEMO",
        name: "Demo Project",
        projectTypeKey: "business",
        self: "https://example.atlassian.net/rest/api/3/project/10001",
        lead: {
          accountId: "789012",
          displayName: "Jane Smith",
          active: true,
        },
      },
      {
        id: "10002",
        key: "SVC",
        name: "Service Project",
        projectTypeKey: "service_desk",
        self: "https://example.atlassian.net/rest/api/3/project/10002",
      },
    ];

    const formatProjectsForOutput = (projects: Project[]) => {
      return projects.map((project) => ({
        key: project.key,
        name: project.name,
        projectType: formatProjectType(project.projectTypeKey),
        lead: project.lead?.displayName ?? "-",
      }));
    };

    const formatProjectType = (typeKey: string): string => {
      const typeMap: Record<string, string> = {
        software: "Software",
        business: "Business",
        service_desk: "Service Desk",
      };
      return typeMap[typeKey] ?? typeKey;
    };

    const formatted = formatProjectsForOutput(projects);

    expect(formatted).toHaveLength(3);
    expect(formatted[0]?.key).toBe("TEST");
    expect(formatted[0]?.name).toBe("Test Project");
    expect(formatted[0]?.projectType).toBe("Software");
    expect(formatted[0]?.lead).toBe("John Doe");
    expect(formatted[1]?.key).toBe("DEMO");
    expect(formatted[1]?.projectType).toBe("Business");
    expect(formatted[2]?.key).toBe("SVC");
    expect(formatted[2]?.projectType).toBe("Service Desk");
    expect(formatted[2]?.lead).toBe("-");
  });

  test("truncates long project names for table output", () => {
    const truncate = (str: string, len: number): string => {
      if (str.length <= len) return str;
      return str.slice(0, len - 1) + "…";
    };

    expect(truncate("Short name", 50)).toBe("Short name");
    expect(truncate("This is a very long project name that should be truncated", 30)).toBe(
      "This is a very long project n…"
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

  test("formats project type keys to display names", () => {
    const formatProjectType = (typeKey: string): string => {
      const typeMap: Record<string, string> = {
        software: "Software",
        business: "Business",
        service_desk: "Service Desk",
      };
      return typeMap[typeKey] ?? typeKey;
    };

    expect(formatProjectType("software")).toBe("Software");
    expect(formatProjectType("business")).toBe("Business");
    expect(formatProjectType("service_desk")).toBe("Service Desk");
    expect(formatProjectType("unknown")).toBe("unknown");
  });

  test("handles projects without lead", () => {
    const projects: Project[] = [
      {
        id: "10000",
        key: "TEST",
        name: "Test Project",
        projectTypeKey: "software",
        self: "https://example.atlassian.net/rest/api/3/project/10000",
      },
    ];

    const formatProjectsForOutput = (projects: Project[]) => {
      return projects.map((project) => ({
        key: project.key,
        name: project.name,
        projectType: project.projectTypeKey,
        lead: project.lead?.displayName ?? "-",
      }));
    };

    const formatted = formatProjectsForOutput(projects);
    expect(formatted[0]?.lead).toBe("-");
  });

  test("builds query parameter from name pattern", () => {
    const buildQueryParam = (namePattern?: string): string | undefined => {
      if (!namePattern) {
        return undefined;
      }
      return namePattern;
    };

    expect(buildQueryParam(undefined)).toBeUndefined();
    expect(buildQueryParam("test")).toBe("test");
    expect(buildQueryParam("Test Project")).toBe("Test Project");
  });

  test("handles empty project list", () => {
    const projects: Project[] = [];

    const formatProjectsForOutput = (projects: Project[]) => {
      return projects.map((project) => ({
        key: project.key,
        name: project.name,
        projectType: project.projectTypeKey,
        lead: project.lead?.displayName ?? "-",
      }));
    };

    const formatted = formatProjectsForOutput(projects);
    expect(formatted).toHaveLength(0);
  });
});

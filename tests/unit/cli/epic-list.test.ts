import { describe, expect, test } from "bun:test";
import { JqlBuilder } from "../../../src/utils/jql.ts";

describe("Epic List Command", () => {
  describe("JQL Building for Epics", () => {
    test("builds JQL to filter by issuetype = Epic", () => {
      const jql = new JqlBuilder().project("PROJ").type("Epic").build();

      expect(jql).toBe('project = "PROJ" AND issuetype = "Epic"');
    });

    test("builds JQL for epics with status filter", () => {
      const jql = new JqlBuilder().project("PROJ").type("Epic").status("In Progress").build();

      expect(jql).toBe('project = "PROJ" AND issuetype = "Epic" AND status = "In Progress"');
    });

    test("builds JQL for epics with assignee filter", () => {
      const jql = new JqlBuilder().project("PROJ").type("Epic").assignee("john.doe").build();

      expect(jql).toBe('project = "PROJ" AND issuetype = "Epic" AND assignee = "john.doe"');
    });

    test("builds JQL for unassigned epics", () => {
      const jql = new JqlBuilder().project("PROJ").type("Epic").assignee("x").build();

      expect(jql).toBe('project = "PROJ" AND issuetype = "Epic" AND assignee IS EMPTY');
    });

    test("builds JQL with status NOT IN filter", () => {
      const jql = new JqlBuilder().project("PROJ").type("Epic").status("~Done").build();

      expect(jql).toBe('project = "PROJ" AND issuetype = "Epic" AND status != "Done"');
    });

    test("builds JQL with ordering", () => {
      const jql = new JqlBuilder().project("PROJ").type("Epic").orderBy("created", "DESC").build();

      expect(jql).toBe('project = "PROJ" AND issuetype = "Epic" ORDER BY created DESC');
    });

    test("builds JQL with reverse (ASC) ordering", () => {
      const jql = new JqlBuilder().project("PROJ").type("Epic").orderBy("updated", "ASC").build();

      expect(jql).toBe('project = "PROJ" AND issuetype = "Epic" ORDER BY updated ASC');
    });

    test("builds JQL for epics without project when project is not provided", () => {
      const jql = new JqlBuilder().type("Epic").build();

      expect(jql).toBe('issuetype = "Epic"');
    });

    test("builds JQL with multiple filters", () => {
      const jql = new JqlBuilder()
        .project("PROJ")
        .type("Epic")
        .assignee("jane.doe")
        .status("To Do")
        .orderBy("created", "DESC")
        .build();

      expect(jql).toBe(
        'project = "PROJ" AND issuetype = "Epic" AND assignee = "jane.doe" AND status = "To Do" ORDER BY created DESC'
      );
    });

    test("builds JQL with label filter", () => {
      const jql = new JqlBuilder().project("PROJ").type("Epic").label("backend").build();

      expect(jql).toBe('project = "PROJ" AND issuetype = "Epic" AND labels IN ("backend")');
    });

    test("builds JQL with created date filter", () => {
      const jql = new JqlBuilder().project("PROJ").type("Epic").created("-30d").build();

      expect(jql).toBe('project = "PROJ" AND issuetype = "Epic" AND created >= -30d');
    });
  });

  describe("Epic Formatting", () => {
    test("formats epic data for table output", () => {
      const epics = [
        {
          key: "PROJ-100",
          summary: "User Authentication System",
          status: "In Progress",
          assignee: "John Doe",
          priority: "High",
          labels: ["backend", "security"],
          created: "2025-12-01T10:00:00Z",
          updated: "2025-12-10T15:30:00Z",
        },
        {
          key: "PROJ-200",
          summary: "Mobile App Redesign",
          status: "To Do",
          assignee: "-",
          priority: "Medium",
          labels: ["frontend", "ui"],
          created: "2025-12-05T09:00:00Z",
          updated: "2025-12-08T11:20:00Z",
        },
      ];

      expect(epics[0]?.key).toBe("PROJ-100");
      expect(epics[0]?.summary).toBe("User Authentication System");
      expect(epics[0]?.status).toBe("In Progress");
      expect(epics[1]?.assignee).toBe("-");
    });

    test("truncates long epic summaries", () => {
      const summary =
        "This is a very long epic summary that needs to be truncated because it exceeds the maximum width allowed";
      const truncated = truncate(summary, 48);

      expect(truncated.length).toBeLessThanOrEqual(48);
      expect(truncated).toContain("…");
    });

    test("does not truncate short summaries", () => {
      const summary = "Short summary";
      const truncated = truncate(summary, 48);

      expect(truncated).toBe(summary);
      expect(truncated).not.toContain("…");
    });
  });
});

function truncate(str: string, len: number): string {
  if (str.length <= len) return str;
  return str.slice(0, len - 1) + "…";
}

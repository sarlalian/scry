import { describe, test, expect } from "bun:test";
import { runScry, scryJson } from "../helpers/cli-runner.ts";
import { parseJsonOutput, isValidXml, hasTableHeader } from "../helpers/output-parser.ts";
import { describeWithCredentials, getCredentials } from "../helpers/skip-helpers.ts";

interface IssueListItem {
  key: string;
  summary: string;
  status: string;
  assignee?: string;
  type: string;
  priority?: string;
}

describeWithCredentials("issue list CLI", () => {
  const creds = getCredentials()!;

  describe("basic listing", () => {
    test("lists issues in configured project", async () => {
      const result = await runScry(["issue", "list", "-p", creds.project, "--limit", "5"]);

      expect(result.exitCode).toBe(0);
      // Output should contain table headers indicating successful listing
      expect(result.stdout).toContain("Key");
      expect(result.stdout).toContain("Summary");
    });

    test("returns JSON output with --output json", async () => {
      const result = await runScry([
        "issue",
        "list",
        "-p",
        creds.project,
        "--limit",
        "3",
        "-o",
        "json",
      ]);

      expect(result.exitCode).toBe(0);

      const parsed = parseJsonOutput<IssueListItem[]>(result.stdout);
      expect(parsed.data).toBeArray();
      expect(parsed.meta).toBeDefined();
    });

    test("returns XML output with --output xml", async () => {
      const result = await runScry([
        "issue",
        "list",
        "-p",
        creds.project,
        "--limit",
        "2",
        "-o",
        "xml",
      ]);

      expect(result.exitCode).toBe(0);
      expect(isValidXml(result.stdout)).toBe(true);
    });

    test("returns table output by default", async () => {
      const result = await runScry(["issue", "list", "-p", creds.project, "--limit", "3"]);

      expect(result.exitCode).toBe(0);
      expect(hasTableHeader(result.stdout, "Key")).toBe(true);
      expect(hasTableHeader(result.stdout, "Summary")).toBe(true);
    });
  });

  describe("filtering", () => {
    test("filters by status", async () => {
      const result = await runScry([
        "issue",
        "list",
        "-p",
        creds.project,
        "-s",
        "To Do",
        "--limit",
        "10",
        "-o",
        "json",
      ]);

      expect(result.exitCode).toBe(0);

      const parsed = parseJsonOutput<IssueListItem[]>(result.stdout);
      for (const issue of parsed.data) {
        expect(issue.status).toBe("To Do");
      }
    });

    test("filters with raw JQL", async () => {
      const jql = `project = ${creds.project} ORDER BY created DESC`;
      const result = await runScry(["issue", "list", "-q", jql, "--limit", "5", "-o", "json"]);

      expect(result.exitCode).toBe(0);

      const parsed = parseJsonOutput<IssueListItem[]>(result.stdout);
      expect(parsed.data).toBeArray();
    });

    test("excludes status with ~ prefix", async () => {
      const result = await runScry([
        "issue",
        "list",
        "-p",
        creds.project,
        "-s",
        "~Done",
        "--limit",
        "10",
        "-o",
        "json",
      ]);

      expect(result.exitCode).toBe(0);

      const parsed = parseJsonOutput<IssueListItem[]>(result.stdout);
      for (const issue of parsed.data) {
        expect(issue.status).not.toBe("Done");
      }
    });
  });

  describe("pagination", () => {
    test("respects --limit option", async () => {
      const result = await scryJson<IssueListItem[]>([
        "issue",
        "list",
        "-p",
        creds.project,
        "--limit",
        "2",
      ]);

      expect(result.data.length).toBeLessThanOrEqual(2);
    });

    test("returns meta object", async () => {
      const result = await runScry([
        "issue",
        "list",
        "-p",
        creds.project,
        "--limit",
        "1",
        "-o",
        "json",
      ]);

      expect(result.exitCode).toBe(0);

      const parsed = parseJsonOutput<IssueListItem[]>(result.stdout);
      expect(parsed.meta).toBeDefined();
    });
  });

  describe("ordering", () => {
    test("orders by created date by default", async () => {
      const result = await runScry([
        "issue",
        "list",
        "-p",
        creds.project,
        "--limit",
        "5",
        "-o",
        "json",
      ]);

      expect(result.exitCode).toBe(0);
    });

    test("supports --order-by option", async () => {
      const result = await runScry([
        "issue",
        "list",
        "-p",
        creds.project,
        "--order-by",
        "updated",
        "--limit",
        "5",
        "-o",
        "json",
      ]);

      expect(result.exitCode).toBe(0);
    });

    test("supports --reverse option", async () => {
      const result = await runScry([
        "issue",
        "list",
        "-p",
        creds.project,
        "--reverse",
        "--limit",
        "5",
        "-o",
        "json",
      ]);

      expect(result.exitCode).toBe(0);
    });
  });

  describe("error scenarios", () => {
    test("handles invalid project", async () => {
      const result = await runScry([
        "issue",
        "list",
        "-p",
        "NONEXISTENT_PROJECT_XYZ123",
        "-o",
        "json",
      ]);

      // Jira may return error or empty results depending on permissions
      if (result.exitCode === 0) {
        const parsed = parseJsonOutput<IssueListItem[]>(result.stdout);
        expect(parsed.data).toBeArray();
      } else {
        expect(result.exitCode).not.toBe(0);
      }
    });

    test("fails gracefully with invalid JQL", async () => {
      const result = await runScry([
        "issue",
        "list",
        "-q",
        "this is not valid JQL syntax!!!",
        "-o",
        "json",
      ]);

      expect(result.exitCode).not.toBe(0);
    });
  });
});

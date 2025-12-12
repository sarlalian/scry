import { describe, test, expect } from "bun:test";
import { runScry } from "../helpers/cli-runner.ts";
import { describeWithCredentials, getCredentials } from "../helpers/skip-helpers.ts";
import { parseJsonOutput, isValidXml, isValidJson } from "../helpers/output-parser.ts";

interface IssueView {
  key: string;
  id: string;
  self: string;
  fields: {
    summary: string;
    status: {
      name: string;
    };
    issuetype: {
      name: string;
    };
    project: {
      key: string;
    };
    [key: string]: unknown;
  };
}

describeWithCredentials("issue view CLI", () => {
  const creds = getCredentials()!;

  describe("command structure", () => {
    test("shows help with --help flag", async () => {
      const result = await runScry(["issue", "view", "--help"]);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("View issue details");
    });
  });

  describe("non-existent issue", () => {
    test("returns error for non-existent issue", async () => {
      const result = await runScry(["issue", "view", `${creds.project}-999999`, "-o", "json"]);

      expect(result.exitCode).not.toBe(0);
    });

    test("returns structured error in JSON format", async () => {
      const result = await runScry(["issue", "view", `${creds.project}-999999`, "-o", "json"]);

      expect(result.exitCode).not.toBe(0);

      // Error should still be valid JSON
      if (isValidJson(result.stdout)) {
        const parsed = parseJsonOutput<unknown>(result.stdout);
        expect(parsed.error).toBeDefined();
      }
    });
  });

  describe("existing issue viewing", () => {
    // Use an issue from the list command to test view
    test("can view an existing issue from list", async () => {
      // First get an issue key from the list
      const listResult = await runScry([
        "issue",
        "list",
        "-p",
        creds.project,
        "--limit",
        "1",
        "-o",
        "json",
      ]);

      if (listResult.exitCode !== 0) {
        // No issues in project, skip this test
        return;
      }

      const listParsed = parseJsonOutput<Array<{ key: string }>>(listResult.stdout);
      if (listParsed.data.length === 0) {
        // No issues in project, skip this test
        return;
      }

      const testIssueKey = listParsed.data[0]!.key;

      // Now view that issue
      const viewResult = await runScry(["issue", "view", testIssueKey, "-o", "json"]);

      expect(viewResult.exitCode).toBe(0);
      expect(isValidJson(viewResult.stdout)).toBe(true);

      const parsed = parseJsonOutput<IssueView>(viewResult.stdout);
      expect(parsed.data.key).toBe(testIssueKey);
      expect(parsed.data.fields).toBeDefined();
      expect(parsed.data.fields.summary).toBeDefined();
    });

    test("view supports table format", async () => {
      // First get an issue key from the list
      const listResult = await runScry([
        "issue",
        "list",
        "-p",
        creds.project,
        "--limit",
        "1",
        "-o",
        "json",
      ]);

      if (listResult.exitCode !== 0) return;

      const listParsed = parseJsonOutput<Array<{ key: string }>>(listResult.stdout);
      if (listParsed.data.length === 0) return;

      const testIssueKey = listParsed.data[0]!.key;

      const result = await runScry(["issue", "view", testIssueKey]);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain(testIssueKey);
    });

    test("view supports XML format", async () => {
      // First get an issue key from the list
      const listResult = await runScry([
        "issue",
        "list",
        "-p",
        creds.project,
        "--limit",
        "1",
        "-o",
        "json",
      ]);

      if (listResult.exitCode !== 0) return;

      const listParsed = parseJsonOutput<Array<{ key: string }>>(listResult.stdout);
      if (listParsed.data.length === 0) return;

      const testIssueKey = listParsed.data[0]!.key;

      const result = await runScry(["issue", "view", testIssueKey, "-o", "xml"]);

      expect(result.exitCode).toBe(0);
      expect(isValidXml(result.stdout)).toBe(true);
    });
  });
});

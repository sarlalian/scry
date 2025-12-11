import { describe, test, expect } from "bun:test";
import { runScry } from "../helpers/cli-runner.ts";
import { describeWithCredentials, getCredentials } from "../helpers/skip-helpers.ts";
import {
  isValidJson,
  isValidXml,
  hasTableHeader,
  parseJsonOutput,
} from "../helpers/output-parser.ts";

interface User {
  accountId: string;
  displayName: string;
  emailAddress?: string;
}

interface IssueListItem {
  key: string;
  summary: string;
  status: string;
}

describeWithCredentials("output format validation", () => {
  const creds = getCredentials()!;

  describe("JSON format", () => {
    test("produces valid JSON", async () => {
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
      expect(isValidJson(result.stdout)).toBe(true);
    });

    test("includes data wrapper", async () => {
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

      const parsed = JSON.parse(result.stdout);
      expect(parsed).toHaveProperty("data");
    });

    test("includes meta for list operations", async () => {
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

    test("data is array for list commands", async () => {
      const result = await runScry([
        "issue",
        "list",
        "-p",
        creds.project,
        "--limit",
        "2",
        "-o",
        "json",
      ]);

      expect(result.exitCode).toBe(0);

      const parsed = parseJsonOutput<IssueListItem[]>(result.stdout);
      expect(Array.isArray(parsed.data)).toBe(true);
    });

    test("data is object for single item commands", async () => {
      const result = await runScry(["me", "-o", "json"]);

      expect(result.exitCode).toBe(0);

      const parsed = parseJsonOutput<User>(result.stdout);
      expect(typeof parsed.data).toBe("object");
      expect(Array.isArray(parsed.data)).toBe(false);
    });
  });

  describe("XML format", () => {
    test("produces valid XML with declaration", async () => {
      const result = await runScry([
        "issue",
        "list",
        "-p",
        creds.project,
        "--limit",
        "1",
        "-o",
        "xml",
      ]);

      expect(result.exitCode).toBe(0);
      expect(isValidXml(result.stdout)).toBe(true);
      expect(result.stdout.trim()).toStartWith("<?xml");
    });

    test("includes data element", async () => {
      const result = await runScry([
        "issue",
        "list",
        "-p",
        creds.project,
        "--limit",
        "1",
        "-o",
        "xml",
      ]);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("<data>");
      expect(result.stdout).toContain("</data>");
    });

    test("includes response wrapper element", async () => {
      const result = await runScry([
        "issue",
        "list",
        "-p",
        creds.project,
        "--limit",
        "1",
        "-o",
        "xml",
      ]);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("<response>");
      expect(result.stdout).toContain("</response>");
    });
  });

  describe("table format", () => {
    test("produces table output with headers", async () => {
      const result = await runScry([
        "issue",
        "list",
        "-p",
        creds.project,
        "--limit",
        "3",
        "-o",
        "table",
      ]);

      expect(result.exitCode).toBe(0);
      expect(hasTableHeader(result.stdout, "Key")).toBe(true);
      expect(hasTableHeader(result.stdout, "Summary")).toBe(true);
    });

    test("uses box drawing characters", async () => {
      const result = await runScry([
        "issue",
        "list",
        "-p",
        creds.project,
        "--limit",
        "2",
        "-o",
        "table",
      ]);

      expect(result.exitCode).toBe(0);
      // Should contain box drawing chars like │ ─ ┌ ┐ └ ┘
      expect(result.stdout).toMatch(/[│┌┐└┘├┤┬┴┼─]/);
    });

    test("is the default output format", async () => {
      const tableResult = await runScry([
        "issue",
        "list",
        "-p",
        creds.project,
        "--limit",
        "1",
        "-o",
        "table",
      ]);

      const defaultResult = await runScry([
        "issue",
        "list",
        "-p",
        creds.project,
        "--limit",
        "1",
      ]);

      expect(tableResult.exitCode).toBe(0);
      expect(defaultResult.exitCode).toBe(0);

      // Both should use table format
      expect(hasTableHeader(tableResult.stdout, "Key")).toBe(true);
      expect(hasTableHeader(defaultResult.stdout, "Key")).toBe(true);
    });
  });

  describe("plain format", () => {
    test("produces minimal output", async () => {
      const result = await runScry(["me", "-o", "plain"]);

      expect(result.exitCode).toBe(0);
      // Plain format should be concise
      expect(result.stdout.split("\n").filter((l) => l.trim()).length).toBeLessThan(10);
    });

    test("shows key-value pairs", async () => {
      const result = await runScry(["me", "-o", "plain"]);

      expect(result.exitCode).toBe(0);
      // Should contain colon-separated values
      expect(result.stdout).toMatch(/\w+:\s*.+/);
    });

    test("is human readable without formatting characters", async () => {
      const result = await runScry(["me", "-o", "plain"]);

      expect(result.exitCode).toBe(0);
      // Should not contain box drawing or XML/JSON syntax
      expect(result.stdout).not.toMatch(/[│┌┐└┘├┤┬┴┼─]/);
      expect(result.stdout).not.toContain("<?xml");
      expect(result.stdout).not.toMatch(/^\s*[{[]/);
    });
  });

  describe("CSV format", () => {
    test("produces CSV output", async () => {
      const result = await runScry([
        "issue",
        "list",
        "-p",
        creds.project,
        "--limit",
        "2",
        "-o",
        "csv",
      ]);

      expect(result.exitCode).toBe(0);
      // Should have comma-separated values
      expect(result.stdout).toContain(",");
    });

    test("has header row", async () => {
      const result = await runScry([
        "issue",
        "list",
        "-p",
        creds.project,
        "--limit",
        "2",
        "-o",
        "csv",
      ]);

      expect(result.exitCode).toBe(0);

      const lines = result.stdout.trim().split("\n");
      expect(lines.length).toBeGreaterThan(0);

      // First line should be headers
      const headers = lines[0]!.toLowerCase();
      expect(headers).toContain("key");
    });
  });

  describe("format consistency across commands", () => {
    test("me command supports all formats", async () => {
      const formats = ["json", "xml", "table", "plain"];

      for (const format of formats) {
        const result = await runScry(["me", "-o", format]);
        expect(result.exitCode).toBe(0);
      }
    });

    test("issue list command supports all formats", async () => {
      const formats = ["json", "xml", "table", "plain", "csv"];

      for (const format of formats) {
        const result = await runScry([
          "issue",
          "list",
          "-p",
          creds.project,
          "--limit",
          "1",
          "-o",
          format,
        ]);
        expect(result.exitCode).toBe(0);
      }
    });
  });
});

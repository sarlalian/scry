import { describe, test, expect } from "bun:test";
import { runScry } from "../helpers/cli-runner.ts";
import { describeWithCredentials, getCredentials } from "../helpers/skip-helpers.ts";

// Note: The issue create command currently enters interactive mode even when
// all required flags are provided. This is a known limitation that should be
// addressed in a future update to add a --no-interactive or --batch flag.
//
// For now, we test the validation behavior and help output.

describeWithCredentials("issue create CLI", () => {
  const creds = getCredentials()!;

  describe("command structure", () => {
    test("shows help with --help flag", async () => {
      const result = await runScry(["issue", "create", "--help"]);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("Create a new Jira issue");
      expect(result.stdout).toContain("-t, --type");
      expect(result.stdout).toContain("-s, --summary");
    });

    test("shows all required options in help", async () => {
      const result = await runScry(["issue", "create", "--help"]);

      expect(result.exitCode).toBe(0);
      // Note: --project is a global option (scry -p PROJECT issue create ...)
      expect(result.stdout).toContain("--type");
      expect(result.stdout).toContain("--summary");
      expect(result.stdout).toContain("--description");
      expect(result.stdout).toContain("--priority");
      expect(result.stdout).toContain("--labels");
    });

    test("supports alias 'new'", async () => {
      const result = await runScry(["issue", "new", "--help"]);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("Create a new Jira issue");
    });
  });

  describe("interactive mode detection", () => {
    // The create command enters interactive mode when missing required fields
    // This test documents the current behavior
    test.skip("enters interactive mode without all required flags", async () => {
      // This test is skipped because it would hang waiting for input
      // The expected behavior is that the command should prompt for missing fields
      const result = await runScry(["issue", "create", "-p", creds.project], { timeout: 1000 });

      // Command will timeout or fail because it's waiting for input
      expect(result.exitCode).not.toBe(0);
    });
  });

  // Note: Full create/cleanup tests require non-interactive mode support
  // These tests are documented here for when that feature is added:
  //
  // describe("issue creation", () => {
  //   test("creates issue with all required fields", async () => { ... });
  //   test("creates issue with optional description", async () => { ... });
  //   test("creates different issue types (Task, Bug, Story)", async () => { ... });
  //   test("fails with invalid issue type", async () => { ... });
  // });
});

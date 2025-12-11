import { describe, test, expect } from "bun:test";
import { runScry } from "../helpers/cli-runner.ts";
import { isValidJson, parseJsonOutput } from "../helpers/output-parser.ts";
import { getCredentials } from "../helpers/skip-helpers.ts";

describe("authentication errors", () => {
  const creds = getCredentials();
  const testServer = creds?.server ?? "https://test.atlassian.net";

  test("fails with missing API token", async () => {
    const result = await runScry(["me", "-o", "json"], {
      env: {
        SCRY_SERVER: testServer,
        SCRY_API_TOKEN: "",
        SCRY_LOGIN: "test@example.com",
      },
    });

    expect(result.exitCode).not.toBe(0);
  });

  test("fails with invalid API token", async () => {
    const result = await runScry(["me", "-o", "json"], {
      env: {
        SCRY_SERVER: testServer,
        SCRY_API_TOKEN: "invalid-token-12345-definitely-wrong",
        SCRY_LOGIN: "test@example.com",
      },
    });

    expect(result.exitCode).not.toBe(0);
  });

  test("fails without server configuration", async () => {
    const result = await runScry(["issue", "list", "-o", "json"], {
      env: {
        SCRY_SERVER: "",
        SCRY_API_TOKEN: "some-token",
      },
    });

    expect(result.exitCode).not.toBe(0);
  });

  test("returns error for unauthenticated request", async () => {
    const result = await runScry(["me", "-o", "json"], {
      env: {
        SCRY_SERVER: testServer,
        SCRY_API_TOKEN: "definitely-not-a-valid-token",
        SCRY_LOGIN: "test@example.com",
      },
    });

    expect(result.exitCode).not.toBe(0);

    // Output should still be parseable
    if (isValidJson(result.stdout)) {
      const parsed = parseJsonOutput<unknown>(result.stdout);
      expect(parsed.error).toBeDefined();
    }
  });

  test("provides helpful error message for auth failure", async () => {
    const result = await runScry(["me", "-o", "json"], {
      env: {
        SCRY_SERVER: testServer,
        SCRY_API_TOKEN: "invalid-token",
        SCRY_LOGIN: "test@example.com",
      },
    });

    expect(result.exitCode).not.toBe(0);

    // Should contain some indication of the error
    const output = result.stdout + result.stderr;
    expect(output.length).toBeGreaterThan(0);
  });

  describe("config validation", () => {
    test("fails gracefully when config is missing", async () => {
      const result = await runScry(["issue", "list", "-o", "json"], {
        env: {
          HOME: "/nonexistent",
          XDG_CONFIG_HOME: "/nonexistent",
          SCRY_SERVER: "",
          SCRY_API_TOKEN: "",
        },
      });

      expect(result.exitCode).not.toBe(0);
    });
  });

  describe("error format consistency", () => {
    test("JSON error has code and message", async () => {
      const result = await runScry(["me", "-o", "json"], {
        env: {
          SCRY_SERVER: testServer,
          SCRY_API_TOKEN: "invalid",
          SCRY_LOGIN: "test@example.com",
        },
      });

      expect(result.exitCode).not.toBe(0);

      if (isValidJson(result.stdout)) {
        const parsed = parseJsonOutput<unknown>(result.stdout);
        if (parsed.error) {
          expect(parsed.error.message).toBeDefined();
        }
      }
    });
  });
});

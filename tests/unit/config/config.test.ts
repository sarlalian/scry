import { describe, expect, test, beforeEach, afterEach } from "bun:test";
import { ConfigManager, ConfigError } from "../../../src/config/index.ts";
import { validateConfig, getDefaultConfig } from "../../../src/config/schema.ts";
import { mkdirSync, writeFileSync, rmSync, existsSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

describe("ConfigManager", () => {
  const testDir = join(tmpdir(), `scry-test-${Date.now()}`);
  const testConfigPath = join(testDir, "config.yml");

  // Store original environment variables to restore after tests
  const originalEnv: Record<string, string | undefined> = {};
  const envVars = [
    "SCRY_SERVER",
    "SCRY_LOGIN",
    "SCRY_PROJECT",
    "SCRY_AUTH_TYPE",
    "SCRY_API_TOKEN",
    "SCRY_CONFIG_FILE",
  ];

  beforeEach(() => {
    mkdirSync(testDir, { recursive: true });

    // Save and clear environment variables to isolate tests
    for (const envVar of envVars) {
      originalEnv[envVar] = process.env[envVar];
      delete process.env[envVar];
    }
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }

    // Restore original environment variables
    for (const envVar of envVars) {
      if (originalEnv[envVar] !== undefined) {
        process.env[envVar] = originalEnv[envVar];
      } else {
        delete process.env[envVar];
      }
    }
  });

  test("loads config from specified path", () => {
    const configContent = `
server: https://test.atlassian.net
login: test@example.com
project:
  key: TEST
auth:
  type: basic
`;
    writeFileSync(testConfigPath, configContent);

    const manager = new ConfigManager();
    const config = manager.load(testConfigPath);

    expect(config.server).toBe("https://test.atlassian.net");
    expect(config.login).toBe("test@example.com");
    expect(config.project.key).toBe("TEST");
    expect(config.auth.type).toBe("basic");
  });

  test("throws ConfigError when no config file found", () => {
    const manager = new ConfigManager();
    expect(() => manager.load("/nonexistent/path.yml")).toThrow(ConfigError);
  });

  test("loadOrDefault returns defaults when no config found", () => {
    const manager = new ConfigManager();
    const config = manager.loadOrDefault("/nonexistent/path.yml");

    expect(config.server).toBe("");
    expect(config.auth.type).toBe("basic");
    expect(config.output.format).toBe("table");
  });

  test("saves config to file", () => {
    const manager = new ConfigManager();
    const configToSave = {
      server: "https://new.atlassian.net",
      login: "new@example.com",
    };

    manager.save(configToSave, testConfigPath);

    const loadedManager = new ConfigManager();
    const config = loadedManager.load(testConfigPath);

    expect(config.server).toBe("https://new.atlassian.net");
    expect(config.login).toBe("new@example.com");
  });

  test("merges environment variables with config", () => {
    const configContent = `
server: https://file.atlassian.net
login: file@example.com
`;
    writeFileSync(testConfigPath, configContent);

    const originalEnv = process.env["SCRY_SERVER"];
    process.env["SCRY_SERVER"] = "https://env.atlassian.net";

    try {
      const manager = new ConfigManager();
      const config = manager.load(testConfigPath);

      expect(config.server).toBe("https://env.atlassian.net");
      expect(config.login).toBe("file@example.com");
    } finally {
      if (originalEnv) {
        process.env["SCRY_SERVER"] = originalEnv;
      } else {
        delete process.env["SCRY_SERVER"];
      }
    }
  });

  test("getConfigPath returns loaded config path", () => {
    const configContent = `server: https://test.atlassian.net\nlogin: test@example.com`;
    writeFileSync(testConfigPath, configContent);

    const manager = new ConfigManager();
    manager.load(testConfigPath);

    expect(manager.getConfigPath()).toBe(testConfigPath);
  });
});

describe("validateConfig", () => {
  test("returns errors for missing required fields", () => {
    const errors = validateConfig({});
    expect(errors).toContain("server is required");
    expect(errors).toContain("login is required");
  });

  test("returns no errors for valid config", () => {
    const errors = validateConfig({
      server: "https://test.atlassian.net",
      login: "test@example.com",
    });
    expect(errors).toHaveLength(0);
  });

  test("validates auth type", () => {
    const errors = validateConfig({
      server: "https://test.atlassian.net",
      login: "test@example.com",
      auth: { type: "invalid" as "basic" },
    });
    expect(errors).toContain("auth.type must be 'basic' or 'bearer'");
  });

  test("validates board type", () => {
    const errors = validateConfig({
      server: "https://test.atlassian.net",
      login: "test@example.com",
      board: { type: "invalid" as "scrum" },
    });
    expect(errors).toContain("board.type must be 'scrum' or 'kanban'");
  });
});

describe("getDefaultConfig", () => {
  test("returns sensible defaults", () => {
    const defaults = getDefaultConfig();

    expect(defaults.auth.type).toBe("basic");
    expect(defaults.output.format).toBe("table");
    expect(defaults.output.colors).toBe(true);
    expect(defaults.issue.types).toHaveLength(5);
  });
});

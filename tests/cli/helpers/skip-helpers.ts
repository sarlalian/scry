import { describe } from "bun:test";
import { existsSync, readFileSync } from "fs";
import { homedir } from "os";
import { join } from "path";

export interface JiraCredentials {
  server: string;
  token: string;
  login?: string;
  project: string;
}

function loadConfigFile(): { server?: string; login?: string; project?: string } {
  const configPath = process.env["XDG_CONFIG_HOME"]
    ? join(process.env["XDG_CONFIG_HOME"], "scry", "config.yml")
    : join(homedir(), ".config", "scry", "config.yml");

  if (!existsSync(configPath)) {
    return {};
  }

  try {
    const configText = readFileSync(configPath, "utf-8");

    // Simple YAML parsing for the fields we need
    const serverMatch = configText.match(/^server:\s*(.+)$/m);
    const loginMatch = configText.match(/^login:\s*(.+)$/m);
    const projectMatch = configText.match(/^\s*key:\s*(.+)$/m);

    return {
      server: serverMatch?.[1]?.trim(),
      login: loginMatch?.[1]?.trim(),
      project: projectMatch?.[1]?.trim(),
    };
  } catch {
    return {};
  }
}

export function getCredentials(): JiraCredentials | null {
  // Load config file for defaults
  const config = loadConfigFile();

  // Environment variables override config file
  const server = process.env["SCRY_SERVER"] || config.server;
  const login = process.env["SCRY_LOGIN"] || config.login;
  const project = process.env["SCRY_TEST_PROJECT"] || process.env["SCRY_PROJECT"] || config.project;

  // Token must come from environment (security)
  const token = process.env["SCRY_API_TOKEN"];

  // For local testing without token env var, we allow running tests
  // as long as a config file exists (CLI will use its own auth)
  if (!server || !project) {
    return null;
  }

  // If no token in env but we have a config file, return credentials
  // (tests will use CLI's actual config)
  return {
    server,
    token: token ?? "",
    login,
    project,
  };
}

export function hasCredentials(): boolean {
  return getCredentials() !== null;
}

export function getMissingCredentials(): string[] {
  const missing: string[] = [];
  if (!process.env["SCRY_SERVER"]) missing.push("SCRY_SERVER");
  if (!process.env["SCRY_API_TOKEN"]) missing.push("SCRY_API_TOKEN");
  if (!process.env["SCRY_TEST_PROJECT"] && !process.env["SCRY_PROJECT"]) {
    missing.push("SCRY_TEST_PROJECT or SCRY_PROJECT");
  }
  return missing;
}

export function describeWithCredentials(name: string, fn: () => void): void {
  if (hasCredentials()) {
    describe(name, fn);
  } else {
    const missing = getMissingCredentials();
    describe.skip(`${name} (skipped: missing ${missing.join(", ")})`, fn);
  }
}

export function logSkipReason(): void {
  if (!hasCredentials()) {
    const missing = getMissingCredentials();
    console.log(`Skipping CLI integration tests: missing ${missing.join(", ")}`);
  }
}

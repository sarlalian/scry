import { scryJson, runScry } from "./cli-runner.ts";
import { getCredentials } from "./skip-helpers.ts";

export interface CreatedIssue {
  key: string;
  id: string;
  self: string;
}

// Track created issues for cleanup
const createdIssueKeys: string[] = [];

export async function createTestIssue(opts: {
  project?: string;
  summary: string;
  type?: string;
  description?: string;
  labels?: string[];
  priority?: string;
}): Promise<CreatedIssue> {
  const creds = getCredentials();
  const project = opts.project ?? creds?.project;

  if (!project) {
    throw new Error("No project specified and no credentials available");
  }

  const args = ["issue", "create", "-p", project, "-t", opts.type ?? "Task", "-s", opts.summary];

  if (opts.description) {
    args.push("-d", opts.description);
  }

  if (opts.labels && opts.labels.length > 0) {
    args.push("-l", opts.labels.join(","));
  }

  if (opts.priority) {
    args.push("-y", opts.priority);
  }

  const result = await scryJson<CreatedIssue>(args);
  createdIssueKeys.push(result.data.key);
  return result.data;
}

export async function cleanupTestIssues(): Promise<void> {
  const keysToCleanup = [...createdIssueKeys];
  createdIssueKeys.length = 0;

  for (const key of keysToCleanup) {
    try {
      await runScry(["issue", "delete", key, "--force"]);
    } catch (error) {
      // Log but don't fail - cleanup issues shouldn't break tests
      console.warn(`Failed to cleanup issue ${key}:`, error);
    }
  }
}

export function trackIssueForCleanup(key: string): void {
  if (!createdIssueKeys.includes(key)) {
    createdIssueKeys.push(key);
  }
}

export function generateUniqueSummary(prefix: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 8);
  return `[CLI-TEST] ${prefix} - ${timestamp} - ${random}`;
}

export function getTrackedIssueCount(): number {
  return createdIssueKeys.length;
}

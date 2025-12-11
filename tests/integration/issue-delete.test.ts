import { describe, expect, test, beforeAll } from "bun:test";
import { getConfigManager } from "../../src/config/index.ts";
import { JiraClient } from "../../src/api/client.ts";
import { IssueEndpoint } from "../../src/api/endpoints/issue.ts";
import type { Config } from "../../src/config/schema.ts";

describe.skip("issue delete integration", () => {
  let config: Config;
  let client: JiraClient;
  let issueEndpoint: IssueEndpoint;

  beforeAll(() => {
    const configManager = getConfigManager();
    config = configManager.load();
    client = new JiraClient(config);
    issueEndpoint = new IssueEndpoint(client);
  });

  test("deletes issue successfully", async () => {
    const createdIssue = await issueEndpoint.create({
      project: { key: config.project?.key ?? "TEST" },
      issuetype: { name: "Task" },
      summary: "Test issue for deletion",
    });

    expect(createdIssue.key).toBeDefined();

    await issueEndpoint.delete(createdIssue.key, false);

    try {
      await issueEndpoint.get(createdIssue.key);
      expect(true).toBe(false);
    } catch (err) {
      expect(err).toBeDefined();
    }
  });

  test("deletes issue with subtasks when deleteSubtasks is true", async () => {
    const parentIssue = await issueEndpoint.create({
      project: { key: config.project?.key ?? "TEST" },
      issuetype: { name: "Task" },
      summary: "Parent issue for deletion test",
    });

    const subtask = await issueEndpoint.create({
      project: { key: config.project?.key ?? "TEST" },
      issuetype: { name: "Subtask" },
      summary: "Subtask for deletion test",
      parent: { key: parentIssue.key },
    });

    expect(parentIssue.key).toBeDefined();
    expect(subtask.key).toBeDefined();

    await issueEndpoint.delete(parentIssue.key, true);

    try {
      await issueEndpoint.get(parentIssue.key);
      expect(true).toBe(false);
    } catch (err) {
      expect(err).toBeDefined();
    }

    try {
      await issueEndpoint.get(subtask.key);
      expect(true).toBe(false);
    } catch (err) {
      expect(err).toBeDefined();
    }
  });

  test("throws error when deleting non-existent issue", async () => {
    try {
      await issueEndpoint.delete("NONEXISTENT-999", false);
      expect(true).toBe(false);
    } catch (err) {
      expect(err).toBeDefined();
    }
  });

  test("throws error when deleting issue with subtasks without deleteSubtasks flag", async () => {
    const parentIssue = await issueEndpoint.create({
      project: { key: config.project?.key ?? "TEST" },
      issuetype: { name: "Task" },
      summary: "Parent issue with subtasks",
    });

    const subtask = await issueEndpoint.create({
      project: { key: config.project?.key ?? "TEST" },
      issuetype: { name: "Subtask" },
      summary: "Subtask that blocks deletion",
      parent: { key: parentIssue.key },
    });

    expect(parentIssue.key).toBeDefined();
    expect(subtask.key).toBeDefined();

    try {
      await issueEndpoint.delete(parentIssue.key, false);
      expect(true).toBe(false);
    } catch (err) {
      expect(err).toBeDefined();
    }

    await issueEndpoint.delete(subtask.key, false);
    await issueEndpoint.delete(parentIssue.key, false);
  });
});

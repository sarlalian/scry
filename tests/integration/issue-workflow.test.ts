import { describe, expect, test, beforeAll, afterAll } from "bun:test";
import { MockJiraServer } from "../fixtures/mock-server.ts";
import { JiraClient } from "../../src/api/client.ts";
import { IssueEndpoint } from "../../src/api/endpoints/issue.ts";
import type { Config } from "../../src/config/index.ts";

describe("Issue Workflow Integration Tests", () => {
  let server: MockJiraServer;
  let client: JiraClient;
  let issueEndpoint: IssueEndpoint;

  beforeAll(() => {
    server = new MockJiraServer(3340);
    server.start();

    const config: Config = {
      server: server.getUrl(),
      login: "test@example.com",
      auth: {
        type: "basic",
        token: "test-token",
      },
      project: { key: "TEST" },
      board: {},
      epic: {},
      issue: {},
      output: {},
    };

    client = new JiraClient(config);
    issueEndpoint = new IssueEndpoint(client);
  });

  afterAll(() => {
    server.stop();
  });

  test("complete issue lifecycle: create, edit, move through statuses, delete", async () => {
    const created = await issueEndpoint.create({
      project: { key: "TEST" },
      issuetype: { name: "Task" },
      summary: "Complete lifecycle test issue",
      description: {
        type: "doc",
        version: 1,
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: "This issue will go through a complete lifecycle" }],
          },
        ],
      },
      labels: ["test", "lifecycle"],
    });

    expect(created.key).toMatch(/^TEST-\d+$/);
    expect(created.id).toBeDefined();
    expect(created.self).toContain(server.getUrl());

    let issue = await issueEndpoint.get(created.key);
    expect(issue.fields.summary).toBe("Complete lifecycle test issue");
    expect(issue.fields.status.name).toBe("To Do");
    expect(issue.fields.labels).toEqual(["test", "lifecycle"]);

    await issueEndpoint.update(created.key, {
      summary: "Updated lifecycle test issue",
      labels: ["test", "lifecycle", "updated"],
    });

    issue = await issueEndpoint.get(created.key);
    expect(issue.fields.summary).toBe("Updated lifecycle test issue");
    expect(issue.fields.labels).toEqual(["test", "lifecycle", "updated"]);

    const transitions = await issueEndpoint.getTransitions(created.key);
    expect(transitions.length).toBeGreaterThan(0);

    const startProgressTransition = transitions.find((t) => t.name === "Start Progress");
    expect(startProgressTransition).toBeDefined();
    expect(startProgressTransition?.to.name).toBe("In Progress");

    await issueEndpoint.transition(created.key, startProgressTransition!.id);

    issue = await issueEndpoint.get(created.key);
    expect(issue.fields.status.name).toBe("In Progress");

    const doneTransitions = await issueEndpoint.getTransitions(created.key);
    const doneTransition = doneTransitions.find((t) => t.name === "Done");
    expect(doneTransition).toBeDefined();

    await issueEndpoint.transition(created.key, doneTransition!.id);

    issue = await issueEndpoint.get(created.key);
    expect(issue.fields.status.name).toBe("Done");

    await issueEndpoint.delete(created.key);

    try {
      await issueEndpoint.get(created.key);
      expect(true).toBe(false);
    } catch (error) {
      expect((error as { statusCode: number }).statusCode).toBe(404);
    }
  });

  test("create multiple issues with different types and verify each", async () => {
    const taskIssue = await issueEndpoint.create({
      project: { key: "TEST" },
      issuetype: { name: "Task" },
      summary: "Task Issue",
      labels: ["task"],
    });

    const bugIssue = await issueEndpoint.create({
      project: { key: "TEST" },
      issuetype: { name: "Bug" },
      summary: "Bug Issue",
      labels: ["bug"],
    });

    expect(taskIssue.key).toMatch(/^TEST-\d+$/);
    expect(bugIssue.key).toMatch(/^TEST-\d+$/);
    expect(taskIssue.key).not.toBe(bugIssue.key);

    const task = await issueEndpoint.get(taskIssue.key);
    expect(task.fields.issuetype.name).toBe("Task");
    expect(task.fields.summary).toBe("Task Issue");

    const bug = await issueEndpoint.get(bugIssue.key);
    expect(bug.fields.issuetype.name).toBe("Bug");
    expect(bug.fields.summary).toBe("Bug Issue");

    await issueEndpoint.delete(taskIssue.key);
    await issueEndpoint.delete(bugIssue.key);
  });

  test("update various fields and verify changes persist", async () => {
    const created = await issueEndpoint.create({
      project: { key: "TEST" },
      issuetype: { name: "Task" },
      summary: "Original Summary",
      labels: ["original"],
    });

    let issue = await issueEndpoint.get(created.key);
    const originalCreated = issue.fields.created;
    const originalUpdated = issue.fields.updated;

    await new Promise((resolve) => setTimeout(resolve, 10));

    await issueEndpoint.update(created.key, {
      summary: "Updated Summary",
      labels: ["updated", "modified", "changed"],
      description: {
        type: "doc",
        version: 1,
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: "This description was added later" }],
          },
        ],
      },
    });

    issue = await issueEndpoint.get(created.key);
    expect(issue.fields.summary).toBe("Updated Summary");
    expect(issue.fields.labels).toEqual(["updated", "modified", "changed"]);
    expect(issue.fields.created).toBe(originalCreated);
    expect(new Date(issue.fields.updated).getTime()).toBeGreaterThanOrEqual(
      new Date(originalUpdated).getTime()
    );

    await issueEndpoint.delete(created.key);
  });

  test("transition through multiple states in sequence", async () => {
    const created = await issueEndpoint.create({
      project: { key: "TEST" },
      issuetype: { name: "Task" },
      summary: "Multi-transition test issue",
    });

    let issue = await issueEndpoint.get(created.key);
    expect(issue.fields.status.name).toBe("To Do");

    let transitions = await issueEndpoint.getTransitions(created.key);
    const startProgress = transitions.find((t) => t.name === "Start Progress");
    await issueEndpoint.transition(created.key, startProgress!.id);

    issue = await issueEndpoint.get(created.key);
    expect(issue.fields.status.name).toBe("In Progress");

    transitions = await issueEndpoint.getTransitions(created.key);
    const done = transitions.find((t) => t.name === "Done");
    await issueEndpoint.transition(created.key, done!.id);

    issue = await issueEndpoint.get(created.key);
    expect(issue.fields.status.name).toBe("Done");

    await issueEndpoint.delete(created.key);
  });

  test("handle authentication failures", async () => {
    const badConfig: Config = {
      server: server.getUrl(),
      login: "test@example.com",
      auth: {
        type: "basic",
        token: "",
      },
      project: { key: "TEST" },
      board: {},
      epic: {},
      issue: {},
      output: {},
    };

    const badClient = new JiraClient(badConfig);
    const badIssueEndpoint = new IssueEndpoint(badClient);

    try {
      await badIssueEndpoint.get("TEST-1");
      expect(true).toBe(false);
    } catch (error) {
      expect((error as { statusCode: number }).statusCode).toBe(401);
    }
  });

  test("handle non-existent issue errors", async () => {
    try {
      await issueEndpoint.get("TEST-99999");
      expect(true).toBe(false);
    } catch (error) {
      expect((error as { statusCode: number }).statusCode).toBe(404);
    }

    try {
      await issueEndpoint.update("TEST-99999", { summary: "This should fail" });
      expect(true).toBe(false);
    } catch (error) {
      expect((error as { statusCode: number }).statusCode).toBe(404);
    }

    try {
      await issueEndpoint.delete("TEST-99999");
      expect(true).toBe(false);
    } catch (error) {
      expect((error as { statusCode: number }).statusCode).toBe(404);
    }
  });

  test("handle missing required fields when creating issue", async () => {
    try {
      await issueEndpoint.create({
        project: { key: "TEST" },
        issuetype: { name: "Task" },
        summary: "",
      });
      expect(true).toBe(false);
    } catch (error) {
      expect((error as { statusCode: number }).statusCode).toBe(400);
    }
  });

  test("create issue with all optional fields", async () => {
    const created = await issueEndpoint.create({
      project: { key: "TEST" },
      issuetype: { name: "Task" },
      summary: "Issue with all fields",
      description: {
        type: "doc",
        version: 1,
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: "Detailed description" }],
          },
        ],
      },
      labels: ["feature", "priority-high", "backend"],
      priority: { name: "High" },
    });

    const issue = await issueEndpoint.get(created.key);
    expect(issue.fields.summary).toBe("Issue with all fields");
    expect(issue.fields.labels).toEqual(["feature", "priority-high", "backend"]);

    await issueEndpoint.delete(created.key);
  });

  test("verify issue search returns created issues", async () => {
    const issue1 = await issueEndpoint.create({
      project: { key: "TEST" },
      issuetype: { name: "Task" },
      summary: "Searchable Issue 1",
      labels: ["search-test"],
    });

    const issue2 = await issueEndpoint.create({
      project: { key: "TEST" },
      issuetype: { name: "Task" },
      summary: "Searchable Issue 2",
      labels: ["search-test"],
    });

    const searchResult1 = await issueEndpoint.search(`key = ${issue1.key}`);
    expect(searchResult1.issues.length).toBe(1);
    expect(searchResult1.issues[0]?.key).toBe(issue1.key);

    const searchResult2 = await issueEndpoint.search(`key = ${issue2.key}`);
    expect(searchResult2.issues.length).toBe(1);
    expect(searchResult2.issues[0]?.key).toBe(issue2.key);

    await issueEndpoint.delete(issue1.key);
    await issueEndpoint.delete(issue2.key);
  });

  test("update and transition in same workflow", async () => {
    const created = await issueEndpoint.create({
      project: { key: "TEST" },
      issuetype: { name: "Task" },
      summary: "Update and transition test",
      labels: ["original"],
    });

    await issueEndpoint.update(created.key, {
      summary: "Updated before transition",
      labels: ["updated"],
    });

    const transitions = await issueEndpoint.getTransitions(created.key);
    const startProgress = transitions.find((t) => t.name === "Start Progress");
    await issueEndpoint.transition(created.key, startProgress!.id);

    const issue = await issueEndpoint.get(created.key);
    expect(issue.fields.summary).toBe("Updated before transition");
    expect(issue.fields.status.name).toBe("In Progress");
    expect(issue.fields.labels).toEqual(["updated"]);

    await issueEndpoint.delete(created.key);
  });
});

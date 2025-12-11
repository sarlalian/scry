import { describe, expect, test, beforeAll, afterAll } from "bun:test";
import { MockJiraServer } from "../fixtures/mock-server.ts";
import { JiraClient } from "../../src/api/client.ts";
import { IssueEndpoint } from "../../src/api/endpoints/issue.ts";
import { ProjectEndpoint } from "../../src/api/endpoints/project.ts";
import type { Config } from "../../src/config/index.ts";

describe("Mock Server - Complete Workflow Integration Test", () => {
  let server: MockJiraServer;
  let client: JiraClient;
  let issueEndpoint: IssueEndpoint;
  let projectEndpoint: ProjectEndpoint;

  beforeAll(() => {
    server = new MockJiraServer(3336);
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
    projectEndpoint = new ProjectEndpoint(client);
  });

  afterAll(() => {
    server.stop();
  });

  test("complete issue lifecycle workflow", async () => {
    const project = await projectEndpoint.get("TEST");
    expect(project.key).toBe("TEST");

    const created = await issueEndpoint.create({
      project: { key: "TEST" },
      issuetype: { name: "Task" },
      summary: "Implement feature X",
      description: {
        type: "doc",
        version: 1,
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: "This is a test feature" }],
          },
        ],
      },
      labels: ["feature", "priority-high"],
    });

    expect(created.key).toMatch(/^TEST-\d+$/);

    let issue = await issueEndpoint.get(created.key);
    expect(issue.fields.summary).toBe("Implement feature X");
    expect(issue.fields.status.name).toBe("To Do");
    expect(issue.fields.labels).toEqual(["feature", "priority-high"]);

    await issueEndpoint.update(created.key, {
      summary: "Implement feature X with improvements",
    });

    issue = await issueEndpoint.get(created.key);
    expect(issue.fields.summary).toBe("Implement feature X with improvements");

    const transitions = await issueEndpoint.getTransitions(created.key);
    const startTransition = transitions.find((t) => t.name === "Start Progress");
    expect(startTransition).toBeDefined();

    await issueEndpoint.transition(created.key, startTransition!.id);

    issue = await issueEndpoint.get(created.key);
    expect(issue.fields.status.name).toBe("In Progress");

    const doneTransitions = await issueEndpoint.getTransitions(created.key);
    const doneTransition = doneTransitions.find((t) => t.name === "Done");

    if (doneTransition) {
      await issueEndpoint.transition(created.key, doneTransition.id);

      issue = await issueEndpoint.get(created.key);
      expect(issue.fields.status.name).toBe("Done");
    }

    const searchResults = await issueEndpoint.search(`project = TEST AND key = ${created.key}`);
    expect(searchResults.issues.length).toBe(1);
    expect(searchResults.issues[0]?.key).toBe(created.key);

    await issueEndpoint.delete(created.key);

    try {
      await issueEndpoint.get(created.key);
      expect(true).toBe(false);
    } catch (error) {
      expect((error as { statusCode: number }).statusCode).toBe(404);
    }
  });

  test("search and filter multiple issues", async () => {
    const issue1 = await issueEndpoint.create({
      project: { key: "TEST" },
      issuetype: { name: "Task" },
      summary: "Task 1",
      labels: ["backend"],
    });

    const issue2 = await issueEndpoint.create({
      project: { key: "TEST" },
      issuetype: { name: "Bug" },
      summary: "Bug 1",
      labels: ["frontend"],
    });

    const issue3 = await issueEndpoint.create({
      project: { key: "DEMO" },
      issuetype: { name: "Task" },
      summary: "Demo Task",
      labels: ["demo"],
    });

    const testResults = await issueEndpoint.search("project = TEST");
    expect(testResults.issues.length).toBeGreaterThanOrEqual(2);
    expect(testResults.issues.some((i) => i.key === issue1.key)).toBe(true);
    expect(testResults.issues.some((i) => i.key === issue2.key)).toBe(true);
    expect(testResults.issues.every((i) => i.fields.project.key === "TEST")).toBe(true);

    const demoResults = await issueEndpoint.search("project = DEMO");
    expect(demoResults.issues.some((i) => i.key === issue3.key)).toBe(true);

    await issueEndpoint.delete(issue1.key);
    await issueEndpoint.delete(issue2.key);
    await issueEndpoint.delete(issue3.key);
  });

  test("update issue and verify changes persist", async () => {
    const created = await issueEndpoint.create({
      project: { key: "TEST" },
      issuetype: { name: "Task" },
      summary: "Original Summary",
      labels: ["original"],
    });

    let issue = await issueEndpoint.get(created.key);
    expect(issue.fields.summary).toBe("Original Summary");
    expect(issue.fields.labels).toEqual(["original"]);

    await issueEndpoint.update(created.key, {
      summary: "Updated Summary",
      labels: ["updated", "modified"],
    });

    issue = await issueEndpoint.get(created.key);
    expect(issue.fields.summary).toBe("Updated Summary");
    expect(issue.fields.labels).toEqual(["updated", "modified"]);

    const searchResults = await issueEndpoint.search(`key = ${created.key}`);
    expect(searchResults.issues[0]?.fields.summary).toBe("Updated Summary");

    await issueEndpoint.delete(created.key);
  });

  test("handle multiple transitions in sequence", async () => {
    const created = await issueEndpoint.create({
      project: { key: "TEST" },
      issuetype: { name: "Task" },
      summary: "Transition Test Issue",
    });

    let issue = await issueEndpoint.get(created.key);
    expect(issue.fields.status.name).toBe("To Do");

    let transitions = await issueEndpoint.getTransitions(created.key);
    const startProgress = transitions.find((t) => t.name === "Start Progress");
    expect(startProgress).toBeDefined();

    await issueEndpoint.transition(created.key, startProgress!.id);

    issue = await issueEndpoint.get(created.key);
    expect(issue.fields.status.name).toBe("In Progress");

    transitions = await issueEndpoint.getTransitions(created.key);
    const done = transitions.find((t) => t.name === "Done");
    expect(done).toBeDefined();

    await issueEndpoint.transition(created.key, done!.id);

    issue = await issueEndpoint.get(created.key);
    expect(issue.fields.status.name).toBe("Done");

    await issueEndpoint.delete(created.key);
  });

  test("create issues across multiple projects", async () => {
    const testIssue = await issueEndpoint.create({
      project: { key: "TEST" },
      issuetype: { name: "Task" },
      summary: "TEST Project Issue",
    });

    const demoIssue = await issueEndpoint.create({
      project: { key: "DEMO" },
      issuetype: { name: "Task" },
      summary: "DEMO Project Issue",
    });

    const testResults = await issueEndpoint.search("project = TEST");
    expect(testResults.issues.some((i) => i.key === testIssue.key)).toBe(true);
    expect(testResults.issues.every((i) => i.fields.project.key === "TEST")).toBe(true);

    const demoResults = await issueEndpoint.search("project = DEMO");
    expect(demoResults.issues.some((i) => i.key === demoIssue.key)).toBe(true);
    expect(demoResults.issues.every((i) => i.fields.project.key === "DEMO")).toBe(true);

    await issueEndpoint.delete(testIssue.key);
    await issueEndpoint.delete(demoIssue.key);
  });
});

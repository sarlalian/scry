import { describe, expect, test, beforeAll, afterAll } from "bun:test";
import { MockJiraServer } from "../fixtures/mock-server.ts";
import { JiraClient } from "../../src/api/client.ts";
import { IssueEndpoint } from "../../src/api/endpoints/issue.ts";
import type { Config } from "../../src/config/index.ts";

describe("Epic Workflow Integration Tests", () => {
  let server: MockJiraServer;
  let client: JiraClient;
  let issueEndpoint: IssueEndpoint;

  beforeAll(() => {
    server = new MockJiraServer(3341);
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

  test("create epic and add issues to it", async () => {
    const epic = await issueEndpoint.create({
      project: { key: "TEST" },
      issuetype: { name: "Epic" },
      summary: "User Authentication Epic",
      description: {
        type: "doc",
        version: 1,
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: "This epic covers all authentication features" }],
          },
        ],
      },
      labels: ["security", "authentication"],
    });

    expect(epic.key).toMatch(/^TEST-\d+$/);

    const epicIssue = await issueEndpoint.get(epic.key);
    expect(epicIssue.fields.issuetype.name).toBe("Epic");
    expect(epicIssue.fields.summary).toBe("User Authentication Epic");

    const issue1 = await issueEndpoint.create({
      project: { key: "TEST" },
      issuetype: { name: "Task" },
      summary: "Implement login endpoint",
    });

    const issue2 = await issueEndpoint.create({
      project: { key: "TEST" },
      issuetype: { name: "Task" },
      summary: "Implement logout endpoint",
    });

    await issueEndpoint.update(issue1.key, {
      parent: { key: epic.key },
    });

    await issueEndpoint.update(issue2.key, {
      parent: { key: epic.key },
    });

    const updatedIssue1 = await issueEndpoint.get(issue1.key);
    expect(updatedIssue1.fields.parent?.key).toBe(epic.key);

    const updatedIssue2 = await issueEndpoint.get(issue2.key);
    expect(updatedIssue2.fields.parent?.key).toBe(epic.key);

    await issueEndpoint.delete(issue1.key);
    await issueEndpoint.delete(issue2.key);
    await issueEndpoint.delete(epic.key);
  });

  test("list issues belonging to an epic", async () => {
    const epic = await issueEndpoint.create({
      project: { key: "TEST" },
      issuetype: { name: "Epic" },
      summary: "Feature Development Epic",
    });

    const issue1 = await issueEndpoint.create({
      project: { key: "TEST" },
      issuetype: { name: "Task" },
      summary: "Feature task 1",
      parent: { key: epic.key },
    });

    const issue2 = await issueEndpoint.create({
      project: { key: "TEST" },
      issuetype: { name: "Task" },
      summary: "Feature task 2",
      parent: { key: epic.key },
    });

    const issue3 = await issueEndpoint.create({
      project: { key: "TEST" },
      issuetype: { name: "Task" },
      summary: "Unrelated task",
    });

    const searchResult = await issueEndpoint.search(`project = TEST`);
    const epicIssues = searchResult.issues.filter((issue) => issue.fields.parent?.key === epic.key);

    expect(epicIssues.length).toBeGreaterThanOrEqual(2);
    expect(epicIssues.some((i) => i.key === issue1.key)).toBe(true);
    expect(epicIssues.some((i) => i.key === issue2.key)).toBe(true);
    expect(epicIssues.some((i) => i.key === issue3.key)).toBe(false);

    await issueEndpoint.delete(issue1.key);
    await issueEndpoint.delete(issue2.key);
    await issueEndpoint.delete(issue3.key);
    await issueEndpoint.delete(epic.key);
  });

  test("remove issues from an epic", async () => {
    const epic = await issueEndpoint.create({
      project: { key: "TEST" },
      issuetype: { name: "Epic" },
      summary: "Removable Epic",
    });

    const issue = await issueEndpoint.create({
      project: { key: "TEST" },
      issuetype: { name: "Task" },
      summary: "Task in epic",
      parent: { key: epic.key },
    });

    let issueData = await issueEndpoint.get(issue.key);
    expect(issueData.fields.parent?.key).toBe(epic.key);

    await issueEndpoint.update(issue.key, {
      parent: null,
    });

    issueData = await issueEndpoint.get(issue.key);
    expect(issueData.fields.parent == null).toBe(true);

    await issueEndpoint.delete(issue.key);
    await issueEndpoint.delete(epic.key);
  });

  test("move issue from one epic to another", async () => {
    const epic1 = await issueEndpoint.create({
      project: { key: "TEST" },
      issuetype: { name: "Epic" },
      summary: "Epic 1",
    });

    const epic2 = await issueEndpoint.create({
      project: { key: "TEST" },
      issuetype: { name: "Epic" },
      summary: "Epic 2",
    });

    const issue = await issueEndpoint.create({
      project: { key: "TEST" },
      issuetype: { name: "Task" },
      summary: "Movable task",
      parent: { key: epic1.key },
    });

    let issueData = await issueEndpoint.get(issue.key);
    expect(issueData.fields.parent?.key).toBe(epic1.key);

    await issueEndpoint.update(issue.key, {
      parent: { key: epic2.key },
    });

    issueData = await issueEndpoint.get(issue.key);
    expect(issueData.fields.parent?.key).toBe(epic2.key);
    expect(issueData.fields.parent?.key).not.toBe(epic1.key);

    await issueEndpoint.delete(issue.key);
    await issueEndpoint.delete(epic1.key);
    await issueEndpoint.delete(epic2.key);
  });

  test("create epic with all optional fields", async () => {
    const epic = await issueEndpoint.create({
      project: { key: "TEST" },
      issuetype: { name: "Epic" },
      summary: "Comprehensive Epic",
      description: {
        type: "doc",
        version: 1,
        content: [
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "This epic has all optional fields set",
              },
            ],
          },
        ],
      },
      labels: ["epic", "comprehensive", "test"],
      priority: { name: "High" },
    });

    const epicIssue = await issueEndpoint.get(epic.key);
    expect(epicIssue.fields.issuetype.name).toBe("Epic");
    expect(epicIssue.fields.summary).toBe("Comprehensive Epic");
    expect(epicIssue.fields.labels).toEqual(["epic", "comprehensive", "test"]);

    await issueEndpoint.delete(epic.key);
  });

  test("update epic details", async () => {
    const epic = await issueEndpoint.create({
      project: { key: "TEST" },
      issuetype: { name: "Epic" },
      summary: "Original Epic Name",
      labels: ["original"],
    });

    await issueEndpoint.update(epic.key, {
      summary: "Updated Epic Name",
      labels: ["updated", "modified"],
    });

    const epicIssue = await issueEndpoint.get(epic.key);
    expect(epicIssue.fields.summary).toBe("Updated Epic Name");
    expect(epicIssue.fields.labels).toEqual(["updated", "modified"]);

    await issueEndpoint.delete(epic.key);
  });

  test("add multiple issues to epic in bulk", async () => {
    const epic = await issueEndpoint.create({
      project: { key: "TEST" },
      issuetype: { name: "Epic" },
      summary: "Bulk Add Epic",
    });

    const issues = await Promise.all([
      issueEndpoint.create({
        project: { key: "TEST" },
        issuetype: { name: "Task" },
        summary: "Bulk task 1",
      }),
      issueEndpoint.create({
        project: { key: "TEST" },
        issuetype: { name: "Task" },
        summary: "Bulk task 2",
      }),
      issueEndpoint.create({
        project: { key: "TEST" },
        issuetype: { name: "Task" },
        summary: "Bulk task 3",
      }),
    ]);

    await Promise.all(
      issues.map((issue) =>
        issueEndpoint.update(issue.key, {
          parent: { key: epic.key },
        })
      )
    );

    const results = await Promise.all(issues.map((issue) => issueEndpoint.get(issue.key)));

    results.forEach((issueData) => {
      expect(issueData.fields.parent?.key).toBe(epic.key);
    });

    await Promise.all(issues.map((issue) => issueEndpoint.delete(issue.key)));
    await issueEndpoint.delete(epic.key);
  });

  test("delete epic with child issues", async () => {
    const epic = await issueEndpoint.create({
      project: { key: "TEST" },
      issuetype: { name: "Epic" },
      summary: "Epic to delete",
    });

    const issue = await issueEndpoint.create({
      project: { key: "TEST" },
      issuetype: { name: "Task" },
      summary: "Child task",
      parent: { key: epic.key },
    });

    await issueEndpoint.delete(epic.key);

    try {
      await issueEndpoint.get(epic.key);
      expect(true).toBe(false);
    } catch (error) {
      expect((error as { statusCode: number }).statusCode).toBe(404);
    }

    const childIssue = await issueEndpoint.get(issue.key);
    expect(childIssue).toBeDefined();

    await issueEndpoint.delete(issue.key);
  });

  test("transition epic through statuses", async () => {
    const epic = await issueEndpoint.create({
      project: { key: "TEST" },
      issuetype: { name: "Epic" },
      summary: "Epic with status changes",
    });

    let epicIssue = await issueEndpoint.get(epic.key);
    expect(epicIssue.fields.status.name).toBe("To Do");

    const transitions = await issueEndpoint.getTransitions(epic.key);
    const startProgress = transitions.find((t) => t.name === "Start Progress");
    expect(startProgress).toBeDefined();

    await issueEndpoint.transition(epic.key, startProgress!.id);

    epicIssue = await issueEndpoint.get(epic.key);
    expect(epicIssue.fields.status.name).toBe("In Progress");

    await issueEndpoint.delete(epic.key);
  });

  test("create issues with parent in single request", async () => {
    const epic = await issueEndpoint.create({
      project: { key: "TEST" },
      issuetype: { name: "Epic" },
      summary: "Parent Epic",
    });

    const issue = await issueEndpoint.create({
      project: { key: "TEST" },
      issuetype: { name: "Task" },
      summary: "Child created with parent",
      parent: { key: epic.key },
    });

    const issueData = await issueEndpoint.get(issue.key);
    expect(issueData.fields.parent?.key).toBe(epic.key);

    await issueEndpoint.delete(issue.key);
    await issueEndpoint.delete(epic.key);
  });

  test("handle invalid epic key when adding issues", async () => {
    const issue = await issueEndpoint.create({
      project: { key: "TEST" },
      issuetype: { name: "Task" },
      summary: "Task for invalid epic test",
    });

    await issueEndpoint.update(issue.key, {
      parent: { key: "TEST-99999" },
    });

    const issueData = await issueEndpoint.get(issue.key);
    expect(issueData.fields.parent?.key).toBe("TEST-99999");

    await issueEndpoint.delete(issue.key);
  });
});

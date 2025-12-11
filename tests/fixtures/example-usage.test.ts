import { describe, expect, test, beforeAll, afterAll } from "bun:test";
import { MockJiraServer } from "./mock-server.ts";
import { JiraClient } from "../../src/api/client.ts";
import { IssueEndpoint } from "../../src/api/endpoints/issue.ts";
import { ProjectEndpoint } from "../../src/api/endpoints/project.ts";
import { BoardEndpoint } from "../../src/api/endpoints/board.ts";
import { SprintEndpoint } from "../../src/api/endpoints/sprint.ts";
import { UserEndpoint } from "../../src/api/endpoints/user.ts";
import type { Config } from "../../src/config/index.ts";

describe("MockJiraServer Usage Example", () => {
  let server: MockJiraServer;
  let client: JiraClient;
  let issueEndpoint: IssueEndpoint;
  let projectEndpoint: ProjectEndpoint;
  let boardEndpoint: BoardEndpoint;
  let sprintEndpoint: SprintEndpoint;
  let userEndpoint: UserEndpoint;

  beforeAll(() => {
    server = new MockJiraServer(3335);
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
    boardEndpoint = new BoardEndpoint(client);
    sprintEndpoint = new SprintEndpoint(client);
    userEndpoint = new UserEndpoint(client);
  });

  afterAll(() => {
    server.stop();
  });

  describe("Real-world integration test examples", () => {
    test("fetch current user information", async () => {
      const user = await userEndpoint.getMyself();
      expect(user.displayName).toBe("Test User");
      expect(user.emailAddress).toBe("test@example.com");
      expect(user.active).toBe(true);
    });

    test("search for issues in a project", async () => {
      const result = await issueEndpoint.search("project = TEST");
      expect(result.issues).toHaveLength(2);
      expect(result.issues[0]?.key).toBe("TEST-1");
      expect(result.issues[1]?.key).toBe("TEST-2");
      expect(result.total).toBe(2);
    });

    test("get a specific issue by key", async () => {
      const issue = await issueEndpoint.get("TEST-1");
      expect(issue.key).toBe("TEST-1");
      expect(issue.fields.summary).toBe("First test issue");
      expect(issue.fields.status.name).toBe("To Do");
      expect(issue.fields.project.key).toBe("TEST");
    });

    test("create a new issue", async () => {
      const created = await issueEndpoint.create({
        project: { key: "TEST" },
        issuetype: { name: "Task" },
        summary: "New test issue created via mock server",
        labels: ["test", "mock"],
      });

      expect(created.key).toBeDefined();
      expect(created.id).toBeDefined();
      expect(created.self).toContain(server.getUrl());

      const retrieved = await issueEndpoint.get(created.key);
      expect(retrieved.fields.summary).toBe("New test issue created via mock server");
      expect(retrieved.fields.labels).toEqual(["test", "mock"]);
    });

    test("update an issue", async () => {
      await issueEndpoint.update("TEST-1", {
        summary: "Updated test issue summary",
      });

      const updated = await issueEndpoint.get("TEST-1");
      expect(updated.fields.summary).toBe("Updated test issue summary");
    });

    test("get available transitions for an issue", async () => {
      const transitions = await issueEndpoint.getTransitions("TEST-1");
      expect(transitions.length).toBeGreaterThan(0);
      expect(transitions[0]?.name).toBeDefined();
      expect(transitions[0]?.to).toBeDefined();
    });

    test("execute a transition", async () => {
      const transitions = await issueEndpoint.getTransitions("TEST-1");
      const doneTransition = transitions.find((t) => t.name === "Done");
      expect(doneTransition).toBeDefined();

      await issueEndpoint.transition("TEST-1", doneTransition!.id);

      const updated = await issueEndpoint.get("TEST-1");
      expect(updated.fields.status.name).toBe("Done");
    });

    test("list all projects", async () => {
      const result = await projectEndpoint.list();
      expect(result.values.length).toBeGreaterThan(0);
      expect(result.values.some((p) => p.key === "TEST")).toBe(true);
      expect(result.values.some((p) => p.key === "DEMO")).toBe(true);
    });

    test("get a specific project", async () => {
      const project = await projectEndpoint.get("TEST");
      expect(project.key).toBe("TEST");
      expect(project.name).toBe("Test Project");
      expect(project.projectTypeKey).toBe("software");
    });

    test("list boards", async () => {
      const result = await boardEndpoint.list();
      expect(result.values.length).toBeGreaterThan(0);
      expect(result.values[0]?.name).toBeDefined();
      expect(result.values[0]?.type).toBeDefined();
    });

    test("filter boards by project", async () => {
      const result = await boardEndpoint.list({ projectKeyOrId: "TEST" });
      expect(result.values.length).toBeGreaterThan(0);
      expect(result.values[0]?.location?.projectKey).toBe("TEST");
    });

    test("list sprints for a board", async () => {
      const result = await sprintEndpoint.list(1);
      expect(result.values.length).toBeGreaterThan(0);
      expect(result.values[0]?.name).toBeDefined();
      expect(result.values[0]?.state).toBeDefined();
    });

    test("filter sprints by state", async () => {
      const result = await sprintEndpoint.list(1, { state: "active" });
      expect(result.values.length).toBeGreaterThan(0);
      expect(result.values.every((s) => s.state === "active")).toBe(true);
    });

    test("delete an issue", async () => {
      const created = await issueEndpoint.create({
        project: { key: "TEST" },
        issuetype: { name: "Task" },
        summary: "Issue to be deleted",
      });

      await issueEndpoint.delete(created.key);

      try {
        await issueEndpoint.get(created.key);
        expect(true).toBe(false);
      } catch (error: any) {
        expect(error.statusCode).toBe(404);
      }
    });
  });

  describe("Error handling examples", () => {
    test("handles non-existent issue", async () => {
      try {
        await issueEndpoint.get("NONEXIST-999");
        expect(true).toBe(false);
      } catch (error: any) {
        expect(error.name).toBe("JiraApiError");
        expect(error.statusCode).toBe(404);
      }
    });

    test("handles non-existent project", async () => {
      try {
        await projectEndpoint.get("NONEXIST");
        expect(true).toBe(false);
      } catch (error: any) {
        expect(error.name).toBe("JiraApiError");
        expect(error.statusCode).toBe(404);
      }
    });

    test("handles non-existent board sprints", async () => {
      try {
        await sprintEndpoint.list(999);
        expect(true).toBe(false);
      } catch (error: any) {
        expect(error.name).toBe("JiraApiError");
        expect(error.statusCode).toBe(404);
      }
    });
  });
});

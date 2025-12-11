import { describe, expect, test, beforeAll, afterAll } from "bun:test";
import { MockJiraServer } from "./mock-server.ts";

describe("MockJiraServer", () => {
  let server: MockJiraServer;
  const baseUrl = "http://localhost:3333";

  beforeAll(() => {
    server = new MockJiraServer(3333);
    server.start();
  });

  afterAll(() => {
    server.stop();
  });

  describe("server lifecycle", () => {
    test("starts and stops successfully", () => {
      const testServer = new MockJiraServer(3334);
      testServer.start();
      expect(testServer.isRunning()).toBe(true);
      testServer.stop();
      expect(testServer.isRunning()).toBe(false);
    });

    test("getUrl returns correct base URL", () => {
      expect(server.getUrl()).toBe(baseUrl);
    });
  });

  describe("authentication", () => {
    test("rejects requests without authorization", async () => {
      const response = await fetch(`${baseUrl}/rest/api/3/myself`);
      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.errorMessages).toContain("Authentication required");
    });

    test("accepts requests with valid basic auth", async () => {
      const credentials = btoa("test@example.com:test-token");
      const response = await fetch(`${baseUrl}/rest/api/3/myself`, {
        headers: {
          Authorization: `Basic ${credentials}`,
        },
      });
      expect(response.status).toBe(200);
    });

    test("accepts requests with valid bearer token", async () => {
      const response = await fetch(`${baseUrl}/rest/api/3/myself`, {
        headers: {
          Authorization: `Bearer test-token`,
        },
      });
      expect(response.status).toBe(200);
    });
  });

  describe("GET /rest/api/3/myself", () => {
    test("returns current user information", async () => {
      const credentials = btoa("test@example.com:test-token");
      const response = await fetch(`${baseUrl}/rest/api/3/myself`, {
        headers: {
          Authorization: `Basic ${credentials}`,
        },
      });
      expect(response.status).toBe(200);
      const user = await response.json();
      expect(user.accountId).toBeDefined();
      expect(user.displayName).toBeDefined();
      expect(user.emailAddress).toBe("test@example.com");
      expect(user.active).toBe(true);
    });
  });

  describe("POST /rest/api/3/search/jql", () => {
    test("searches issues with JQL", async () => {
      const credentials = btoa("test@example.com:test-token");
      const response = await fetch(`${baseUrl}/rest/api/3/search/jql`, {
        method: "POST",
        headers: {
          Authorization: `Basic ${credentials}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jql: "project = TEST",
          maxResults: 50,
        }),
      });
      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result.issues).toBeDefined();
      expect(Array.isArray(result.issues)).toBe(true);
      expect(result.maxResults).toBe(50);
      expect(result.startAt).toBeDefined();
    });

    test("filters issues by project", async () => {
      const credentials = btoa("test@example.com:test-token");
      const response = await fetch(`${baseUrl}/rest/api/3/search/jql`, {
        method: "POST",
        headers: {
          Authorization: `Basic ${credentials}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jql: "project = TEST",
          maxResults: 50,
        }),
      });
      const result = await response.json();
      expect(result.issues.every((issue: any) => issue.fields.project.key === "TEST")).toBe(true);
    });

    test("returns empty results for non-existent project", async () => {
      const credentials = btoa("test@example.com:test-token");
      const response = await fetch(`${baseUrl}/rest/api/3/search/jql`, {
        method: "POST",
        headers: {
          Authorization: `Basic ${credentials}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jql: "project = NONEXIST",
          maxResults: 50,
        }),
      });
      const result = await response.json();
      expect(result.issues).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  describe("GET /rest/api/3/issue/{key}", () => {
    test("returns issue by key", async () => {
      const credentials = btoa("test@example.com:test-token");
      const response = await fetch(`${baseUrl}/rest/api/3/issue/TEST-1`, {
        headers: {
          Authorization: `Basic ${credentials}`,
        },
      });
      expect(response.status).toBe(200);
      const issue = await response.json();
      expect(issue.key).toBe("TEST-1");
      expect(issue.fields).toBeDefined();
      expect(issue.fields.summary).toBeDefined();
    });

    test("returns 404 for non-existent issue", async () => {
      const credentials = btoa("test@example.com:test-token");
      const response = await fetch(`${baseUrl}/rest/api/3/issue/NONEXIST-999`, {
        headers: {
          Authorization: `Basic ${credentials}`,
        },
      });
      expect(response.status).toBe(404);
    });
  });

  describe("POST /rest/api/3/issue", () => {
    test("creates a new issue", async () => {
      const credentials = btoa("test@example.com:test-token");
      const response = await fetch(`${baseUrl}/rest/api/3/issue`, {
        method: "POST",
        headers: {
          Authorization: `Basic ${credentials}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fields: {
            project: { key: "TEST" },
            issuetype: { name: "Task" },
            summary: "Test Issue",
          },
        }),
      });
      expect(response.status).toBe(201);
      const result = await response.json();
      expect(result.key).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.self).toBeDefined();
    });
  });

  describe("PUT /rest/api/3/issue/{key}", () => {
    test("updates an issue", async () => {
      const credentials = btoa("test@example.com:test-token");
      const response = await fetch(`${baseUrl}/rest/api/3/issue/TEST-1`, {
        method: "PUT",
        headers: {
          Authorization: `Basic ${credentials}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fields: {
            summary: "Updated Summary",
          },
        }),
      });
      expect(response.status).toBe(204);
    });

    test("returns 404 for non-existent issue", async () => {
      const credentials = btoa("test@example.com:test-token");
      const response = await fetch(`${baseUrl}/rest/api/3/issue/NONEXIST-999`, {
        method: "PUT",
        headers: {
          Authorization: `Basic ${credentials}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fields: {
            summary: "Updated Summary",
          },
        }),
      });
      expect(response.status).toBe(404);
    });
  });

  describe("DELETE /rest/api/3/issue/{key}", () => {
    test("deletes an issue", async () => {
      const credentials = btoa("test@example.com:test-token");
      const response = await fetch(`${baseUrl}/rest/api/3/issue/TEST-2`, {
        method: "DELETE",
        headers: {
          Authorization: `Basic ${credentials}`,
        },
      });
      expect(response.status).toBe(204);
    });
  });

  describe("GET /rest/api/3/issue/{key}/transitions", () => {
    test("returns available transitions for issue", async () => {
      const credentials = btoa("test@example.com:test-token");
      const response = await fetch(`${baseUrl}/rest/api/3/issue/TEST-1/transitions`, {
        headers: {
          Authorization: `Basic ${credentials}`,
        },
      });
      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result.transitions).toBeDefined();
      expect(Array.isArray(result.transitions)).toBe(true);
    });
  });

  describe("POST /rest/api/3/issue/{key}/transitions", () => {
    test("executes a transition", async () => {
      const credentials = btoa("test@example.com:test-token");
      const response = await fetch(`${baseUrl}/rest/api/3/issue/TEST-1/transitions`, {
        method: "POST",
        headers: {
          Authorization: `Basic ${credentials}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transition: { id: "21" },
        }),
      });
      expect(response.status).toBe(204);
    });
  });

  describe("GET /rest/api/3/project/search", () => {
    test("returns list of projects", async () => {
      const credentials = btoa("test@example.com:test-token");
      const response = await fetch(`${baseUrl}/rest/api/3/project/search`, {
        headers: {
          Authorization: `Basic ${credentials}`,
        },
      });
      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result.values).toBeDefined();
      expect(Array.isArray(result.values)).toBe(true);
      expect(result.maxResults).toBeDefined();
      expect(result.startAt).toBeDefined();
      expect(result.total).toBeDefined();
    });
  });

  describe("GET /rest/api/3/project/{key}", () => {
    test("returns project by key", async () => {
      const credentials = btoa("test@example.com:test-token");
      const response = await fetch(`${baseUrl}/rest/api/3/project/TEST`, {
        headers: {
          Authorization: `Basic ${credentials}`,
        },
      });
      expect(response.status).toBe(200);
      const project = await response.json();
      expect(project.key).toBe("TEST");
      expect(project.name).toBeDefined();
    });

    test("returns 404 for non-existent project", async () => {
      const credentials = btoa("test@example.com:test-token");
      const response = await fetch(`${baseUrl}/rest/api/3/project/NONEXIST`, {
        headers: {
          Authorization: `Basic ${credentials}`,
        },
      });
      expect(response.status).toBe(404);
    });
  });

  describe("GET /rest/agile/1.0/board", () => {
    test("returns list of boards", async () => {
      const credentials = btoa("test@example.com:test-token");
      const response = await fetch(`${baseUrl}/rest/agile/1.0/board`, {
        headers: {
          Authorization: `Basic ${credentials}`,
        },
      });
      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result.values).toBeDefined();
      expect(Array.isArray(result.values)).toBe(true);
      expect(result.maxResults).toBeDefined();
      expect(result.startAt).toBeDefined();
    });
  });

  describe("GET /rest/agile/1.0/board/{id}/sprint", () => {
    test("returns list of sprints for board", async () => {
      const credentials = btoa("test@example.com:test-token");
      const response = await fetch(`${baseUrl}/rest/agile/1.0/board/1/sprint`, {
        headers: {
          Authorization: `Basic ${credentials}`,
        },
      });
      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result.values).toBeDefined();
      expect(Array.isArray(result.values)).toBe(true);
      expect(result.maxResults).toBeDefined();
      expect(result.startAt).toBeDefined();
    });

    test("returns 404 for non-existent board", async () => {
      const credentials = btoa("test@example.com:test-token");
      const response = await fetch(`${baseUrl}/rest/agile/1.0/board/999/sprint`, {
        headers: {
          Authorization: `Basic ${credentials}`,
        },
      });
      expect(response.status).toBe(404);
    });
  });
});

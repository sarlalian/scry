import { describe, expect, test, beforeAll, afterAll } from "bun:test";
import { MockJiraServer } from "../fixtures/mock-server.ts";
import { JiraClient } from "../../src/api/client.ts";
import { IssueEndpoint } from "../../src/api/endpoints/issue.ts";
import type { Config } from "../../src/config/index.ts";

describe("Search Integration Tests", () => {
  let server: MockJiraServer;
  let client: JiraClient;
  let issueEndpoint: IssueEndpoint;
  const createdIssues: string[] = [];

  beforeAll(async () => {
    server = new MockJiraServer(3343);
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

    const issue1 = await issueEndpoint.create({
      project: { key: "TEST" },
      issuetype: { name: "Task" },
      summary: "Backend API Development",
      labels: ["backend", "api"],
    });
    createdIssues.push(issue1.key);

    const issue2 = await issueEndpoint.create({
      project: { key: "TEST" },
      issuetype: { name: "Bug" },
      summary: "Fix login issue",
      labels: ["frontend", "bug"],
    });
    createdIssues.push(issue2.key);

    const issue3 = await issueEndpoint.create({
      project: { key: "DEMO" },
      issuetype: { name: "Task" },
      summary: "Demo documentation",
      labels: ["documentation"],
    });
    createdIssues.push(issue3.key);

    await issueEndpoint.transition(
      issue1.key,
      (await issueEndpoint.getTransitions(issue1.key)).find((t) => t.name === "Start Progress")!.id
    );
  });

  afterAll(async () => {
    for (const key of createdIssues) {
      try {
        await issueEndpoint.delete(key);
      } catch {
        // Ignore errors when cleaning up
      }
    }
    server.stop();
  });

  test("search by project key", async () => {
    const testResults = await issueEndpoint.search("project = TEST");
    expect(testResults.issues.length).toBeGreaterThanOrEqual(2);
    testResults.issues.forEach((issue) => {
      expect(issue.fields.project.key).toBe("TEST");
    });

    const demoResults = await issueEndpoint.search("project = DEMO");
    expect(demoResults.issues.length).toBeGreaterThanOrEqual(1);
    demoResults.issues.forEach((issue) => {
      expect(issue.fields.project.key).toBe("DEMO");
    });
  });

  test("search by status", async () => {
    const todoResults = await issueEndpoint.search('project = TEST AND status = "To Do"');
    if (todoResults.issues.length > 0) {
      todoResults.issues.forEach((issue) => {
        expect(issue.fields.status.name).toBe("To Do");
      });
    }

    const inProgressResults = await issueEndpoint.search(
      'project = TEST AND status = "In Progress"'
    );
    expect(inProgressResults.issues.length).toBeGreaterThanOrEqual(1);
    inProgressResults.issues.forEach((issue) => {
      expect(issue.fields.status.name).toBe("In Progress");
    });
  });

  test("search by issue key", async () => {
    const issueKey = createdIssues[0];
    const result = await issueEndpoint.search(`key = ${issueKey}`);

    expect(result.issues.length).toBe(1);
    expect(result.issues[0]?.key).toBe(issueKey);
  });

  test("search with pagination using nextPageToken", async () => {
    const firstPage = await issueEndpoint.search("project = TEST", {
      maxResults: 1,
    });

    expect(firstPage.maxResults).toBe(1);
    expect(firstPage.issues.length).toBeLessThanOrEqual(1);

    if (firstPage.total! > 1 && firstPage.nextPageToken) {
      const secondPage = await issueEndpoint.search("project = TEST", {
        maxResults: 1,
        nextPageToken: firstPage.nextPageToken,
      });

      expect(secondPage.issues.length).toBeLessThanOrEqual(1);

      if (firstPage.issues[0] && secondPage.issues[0]) {
        expect(firstPage.issues[0].key).not.toBe(secondPage.issues[0].key);
      }
    }
  });

  test("search returns correct metadata", async () => {
    const result = await issueEndpoint.search("project = TEST", {
      maxResults: 10,
    });

    expect(result.maxResults).toBeDefined();
    expect(result.total).toBeDefined();
    expect(result.isLast).toBeDefined();
    expect(typeof result.isLast).toBe("boolean");
    expect(result.total).toBeGreaterThanOrEqual(result.issues.length);
  });

  test("search with large maxResults", async () => {
    const result = await issueEndpoint.search("project = TEST", {
      maxResults: 100,
    });

    expect(result.issues.length).toBeLessThanOrEqual(100);
    expect(result.maxResults).toBe(100);
  });

  test("search returns default fields", async () => {
    const result = await issueEndpoint.search("project = TEST");

    if (result.issues.length > 0) {
      const issue = result.issues[0]!;
      expect(issue.fields.summary).toBeDefined();
      expect(issue.fields.status).toBeDefined();
      expect(issue.fields.project).toBeDefined();
      expect(issue.fields.issuetype).toBeDefined();
      expect(issue.fields.priority).toBeDefined();
      expect(issue.fields.created).toBeDefined();
      expect(issue.fields.updated).toBeDefined();
    }
  });

  test("search with empty result set", async () => {
    const result = await issueEndpoint.search("project = NONEXISTENT");
    expect(result.issues.length).toBe(0);
    expect(result.total).toBe(0);
    expect(result.isLast).toBe(true);
  });

  test("search with complex JQL query", async () => {
    const result = await issueEndpoint.search('project = TEST AND status = "In Progress"');

    if (result.issues.length > 0) {
      result.issues.forEach((issue) => {
        expect(issue.fields.project.key).toBe("TEST");
        expect(issue.fields.status.name).toBe("In Progress");
      });
    }
  });

  test("search across multiple projects", async () => {
    const result = await issueEndpoint.search("project = TEST");
    const testCount = result.total;

    const demoResult = await issueEndpoint.search("project = DEMO");
    const demoCount = demoResult.total;

    expect(testCount).toBeGreaterThanOrEqual(2);
    expect(demoCount).toBeGreaterThanOrEqual(1);
  });

  test("verify search result structure", async () => {
    const result = await issueEndpoint.search("project = TEST");

    expect(result).toHaveProperty("issues");
    expect(result).toHaveProperty("maxResults");
    expect(result).toHaveProperty("startAt");
    expect(result).toHaveProperty("total");
    expect(result).toHaveProperty("isLast");
    expect(Array.isArray(result.issues)).toBe(true);
  });

  test("verify issue structure in search results", async () => {
    const result = await issueEndpoint.search("project = TEST");

    if (result.issues.length > 0) {
      const issue = result.issues[0]!;
      expect(issue).toHaveProperty("id");
      expect(issue).toHaveProperty("key");
      expect(issue).toHaveProperty("self");
      expect(issue).toHaveProperty("fields");
      expect(issue.fields).toHaveProperty("summary");
      expect(issue.fields).toHaveProperty("status");
      expect(issue.fields).toHaveProperty("project");
    }
  });

  test("search handles special characters in JQL", async () => {
    const result = await issueEndpoint.search('project = TEST AND status = "To Do"');
    expect(result).toBeDefined();
    expect(Array.isArray(result.issues)).toBe(true);
  });

  test("search with authentication failure", async () => {
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
      await badIssueEndpoint.search("project = TEST");
      expect(true).toBe(false);
    } catch (error) {
      expect((error as { statusCode: number }).statusCode).toBe(401);
    }
  });

  test("pagination with nextPageToken and maxResults", async () => {
    const fullResult = await issueEndpoint.search("project = TEST", {
      maxResults: 100,
    });
    const totalIssues = fullResult.total!;

    if (totalIssues > 1) {
      const pageSize = 1;
      const maxPages = Math.min(Math.ceil(totalIssues / pageSize), 3);

      const seenKeys = new Set<string>();
      let nextPageToken: string | undefined = undefined;

      for (let page = 0; page < maxPages; page++) {
        const pageResult = await issueEndpoint.search("project = TEST", {
          maxResults: pageSize,
          nextPageToken,
        });

        expect(pageResult.maxResults).toBe(pageSize);

        pageResult.issues.forEach((issue) => {
          expect(seenKeys.has(issue.key)).toBe(false);
          seenKeys.add(issue.key);
        });

        nextPageToken = pageResult.nextPageToken;
        if (!nextPageToken) break;
      }
    }
  });

  test("isLast flag accuracy", async () => {
    const result = await issueEndpoint.search("project = TEST", {
      maxResults: 100,
    });

    if (result.total! <= 100) {
      expect(result.isLast).toBe(true);
    }
  });

  test("search created issues can be found individually", async () => {
    for (const issueKey of createdIssues) {
      const result = await issueEndpoint.search(`key = ${issueKey}`);
      expect(result.issues.length).toBe(1);
      expect(result.issues[0]?.key).toBe(issueKey);
      expect(result.total).toBe(1);
      expect(result.isLast).toBe(true);
    }
  });

  test("search results match direct issue retrieval", async () => {
    const issueKey = createdIssues[0]!;
    const searchResult = await issueEndpoint.search(`key = ${issueKey}`);
    const directResult = await issueEndpoint.get(issueKey);

    expect(searchResult.issues.length).toBe(1);
    const searchedIssue = searchResult.issues[0]!;

    expect(searchedIssue.key).toBe(directResult.key);
    expect(searchedIssue.id).toBe(directResult.id);
    expect(searchedIssue.fields.summary).toBe(directResult.fields.summary);
    expect(searchedIssue.fields.status.name).toBe(directResult.fields.status.name);
  });

  test("search with zero maxResults still returns metadata", async () => {
    const result = await issueEndpoint.search("project = TEST", {
      maxResults: 0,
    });

    expect(result.maxResults).toBe(0);
    expect(result.total).toBeGreaterThanOrEqual(0);
    expect(result.issues.length).toBe(0);
  });
});

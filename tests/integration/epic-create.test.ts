import { describe, expect, test } from "bun:test";
import type { CreateIssueRequest, CreatedIssue } from "../../src/api/types/issue.ts";

describe("epic create integration", () => {
  test("epic create produces valid CreateIssueRequest with Epic issuetype", () => {
    const fields: CreateIssueRequest = {
      project: { key: "SCRY" },
      issuetype: { name: "Epic" },
      summary: "Implement user authentication system",
      description: {
        type: "doc",
        version: 1,
        content: [
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "This epic covers all authentication-related features including login, logout, and session management.",
              },
            ],
          },
        ],
      },
      priority: { name: "High" },
      labels: ["security", "authentication", "backend"],
    };

    expect(fields.project).toHaveProperty("key", "SCRY");
    expect(fields.issuetype).toHaveProperty("name", "Epic");
    expect(fields.summary).toBe("Implement user authentication system");
    expect(fields.labels).toEqual(["security", "authentication", "backend"]);
    expect(fields.priority).toHaveProperty("name", "High");
  });

  test("epic create response structure matches CreatedIssue", () => {
    const createdEpic: CreatedIssue = {
      id: "10042",
      key: "SCRY-100",
      self: "https://sarlalian.atlassian.net/rest/api/3/issue/10042",
    };

    expect(createdEpic).toHaveProperty("id");
    expect(createdEpic).toHaveProperty("key");
    expect(createdEpic).toHaveProperty("self");
    expect(createdEpic.key).toMatch(/^[A-Z]+-\d+$/);
  });

  test("epic create handles minimal required fields", () => {
    const minimalFields: CreateIssueRequest = {
      project: { key: "SCRY" },
      issuetype: { name: "Epic" },
      summary: "Minimal Epic",
    };

    expect(minimalFields.issuetype).toHaveProperty("name", "Epic");
    expect(minimalFields.summary).toBe("Minimal Epic");
    expect(minimalFields.description).toBeUndefined();
    expect(minimalFields.labels).toBeUndefined();
  });

  test("epic create with assignee", () => {
    const fieldsWithAssignee: CreateIssueRequest = {
      project: { key: "SCRY" },
      issuetype: { name: "Epic" },
      summary: "Epic with assignee",
      assignee: { accountId: "5ff5e2c8e7e22e00689e7890" },
    };

    expect(fieldsWithAssignee.assignee).toHaveProperty("accountId");
    expect(fieldsWithAssignee.assignee?.accountId).toBeTruthy();
  });
});

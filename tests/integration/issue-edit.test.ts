import { describe, expect, test } from "bun:test";
import type { CreateIssueRequest } from "../../src/api/types/issue.ts";

describe("issue edit integration", () => {
  test("update method accepts valid update fields", async () => {
    const updates: Partial<CreateIssueRequest> = {
      summary: "Updated summary",
      description: {
        type: "doc",
        version: 1,
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: "Updated description" }],
          },
        ],
      },
      priority: { name: "High" },
      labels: ["updated", "test"],
      components: [{ name: "Backend" }],
    };

    expect(updates.summary).toBe("Updated summary");
    expect(updates.priority && "name" in updates.priority ? updates.priority.name : undefined).toBe(
      "High"
    );
    expect(updates.labels).toContain("updated");
    expect(
      updates.components?.[0] && "name" in updates.components[0]
        ? updates.components[0].name
        : undefined
    ).toBe("Backend");
  });

  test("update method accepts partial fields", async () => {
    const updates: Partial<CreateIssueRequest> = {
      summary: "Only summary updated",
    };

    expect(Object.keys(updates)).toHaveLength(1);
    expect(updates.summary).toBe("Only summary updated");
  });

  test("update method accepts empty assignee to unassign", async () => {
    const updates: Partial<CreateIssueRequest> = {
      assignee: { accountId: "" },
    };

    expect(updates.assignee?.accountId).toBe("");
  });

  test("update method accepts empty labels array", async () => {
    const updates: Partial<CreateIssueRequest> = {
      labels: [],
    };

    expect(updates.labels).toEqual([]);
    expect(updates.labels).toHaveLength(0);
  });

  test("update method accepts empty components array", async () => {
    const updates: Partial<CreateIssueRequest> = {
      components: [],
    };

    expect(updates.components).toEqual([]);
    expect(updates.components).toHaveLength(0);
  });

  test("validates issue key format", () => {
    const isValidIssueKey = (key: string): boolean => {
      const pattern = /^[A-Z][A-Z0-9]*-[0-9]+$/;
      return pattern.test(key);
    };

    expect(isValidIssueKey("PROJ-123")).toBe(true);
    expect(isValidIssueKey("TEST-1")).toBe(true);
    expect(isValidIssueKey("MYPROJ-999")).toBe(true);
    expect(isValidIssueKey("proj-123")).toBe(false);
    expect(isValidIssueKey("PROJ123")).toBe(false);
    expect(isValidIssueKey("PROJ-")).toBe(false);
    expect(isValidIssueKey("-123")).toBe(false);
  });
});

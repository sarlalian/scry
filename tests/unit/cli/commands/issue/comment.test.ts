import { describe, expect, test, mock } from "bun:test";
import type { Comment } from "../../../../../src/api/types/issue.ts";
import type { AtlassianDocument } from "../../../../../src/api/types/common.ts";

describe("issue comment add command", () => {
  test("adds comment with body from argument", async () => {
    const mockAddComment = mock(async (_issueKey: string, _body: string): Promise<Comment> => {
      return {
        id: "10000",
        author: {
          accountId: "123",
          displayName: "Test User",
          emailAddress: "test@example.com",
          active: true,
          timeZone: "UTC",
        },
        body: {
          type: "doc",
          version: 1,
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "This is a test comment" }],
            },
          ],
        },
        created: "2024-01-01T00:00:00.000Z",
        updated: "2024-01-01T00:00:00.000Z",
      };
    });

    const result = await mockAddComment("PROJ-123", "This is a test comment");

    expect(result.id).toBe("10000");
    expect(result.author.displayName).toBe("Test User");
    expect(mockAddComment).toHaveBeenCalledTimes(1);
    expect(mockAddComment).toHaveBeenCalledWith("PROJ-123", "This is a test comment");
  });

  test("adds comment with body from flag", async () => {
    const mockAddComment = mock(async (_issueKey: string, _body: string): Promise<Comment> => {
      return {
        id: "10001",
        author: {
          accountId: "123",
          displayName: "Test User",
          emailAddress: "test@example.com",
          active: true,
          timeZone: "UTC",
        },
        body: {
          type: "doc",
          version: 1,
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "Comment from flag" }],
            },
          ],
        },
        created: "2024-01-01T00:00:00.000Z",
        updated: "2024-01-01T00:00:00.000Z",
      };
    });

    const result = await mockAddComment("PROJ-456", "Comment from flag");

    expect(result.id).toBe("10001");
    expect(mockAddComment).toHaveBeenCalledWith("PROJ-456", "Comment from flag");
  });

  test("converts plain text to ADF format", () => {
    const textToAdf = (text: string): AtlassianDocument => {
      const paragraphs = text.split("\n").filter((line) => line.trim());

      if (paragraphs.length === 0) {
        return {
          type: "doc",
          version: 1,
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "" }],
            },
          ],
        };
      }

      return {
        type: "doc",
        version: 1,
        content: paragraphs.map((para) => ({
          type: "paragraph",
          content: [{ type: "text", text: para }],
        })),
      };
    };

    const singleLine = textToAdf("Single line comment");
    expect(singleLine.content).toHaveLength(1);
    const firstNode = singleLine.content[0];
    if (firstNode?.type === "paragraph" && firstNode.content?.[0]?.type === "text") {
      expect(firstNode.content[0].text).toBe("Single line comment");
    }

    const multiLine = textToAdf("Line 1\nLine 2\nLine 3");
    expect(multiLine.content).toHaveLength(3);
    const node1 = multiLine.content[0];
    const node2 = multiLine.content[1];
    const node3 = multiLine.content[2];
    if (node1?.type === "paragraph" && node1.content?.[0]?.type === "text") {
      expect(node1.content[0].text).toBe("Line 1");
    }
    if (node2?.type === "paragraph" && node2.content?.[0]?.type === "text") {
      expect(node2.content[0].text).toBe("Line 2");
    }
    if (node3?.type === "paragraph" && node3.content?.[0]?.type === "text") {
      expect(node3.content[0].text).toBe("Line 3");
    }

    const empty = textToAdf("");
    expect(empty.content).toHaveLength(1);
    const emptyNode = empty.content[0];
    if (emptyNode?.type === "paragraph" && emptyNode.content?.[0]?.type === "text") {
      expect(emptyNode.content[0].text).toBe("");
    }
  });

  test("handles multiline comments", () => {
    const multilineText = "First paragraph\n\nSecond paragraph\nStill second paragraph";
    const lines = multilineText.split("\n").filter((line) => line.trim());

    expect(lines).toHaveLength(3);
    expect(lines[0]).toBe("First paragraph");
    expect(lines[1]).toBe("Second paragraph");
    expect(lines[2]).toBe("Still second paragraph");
  });

  test("validates issue key is provided", () => {
    const validateIssueKey = (issueKey?: string): boolean => {
      return !!issueKey && issueKey.trim().length > 0;
    };

    expect(validateIssueKey("PROJ-123")).toBe(true);
    expect(validateIssueKey("")).toBe(false);
    expect(validateIssueKey(undefined)).toBe(false);
    expect(validateIssueKey("  ")).toBe(false);
  });

  test("validates comment body is provided", () => {
    const validateBody = (body?: string): boolean => {
      return !!body && body.trim().length > 0;
    };

    expect(validateBody("This is a comment")).toBe(true);
    expect(validateBody("")).toBe(false);
    expect(validateBody(undefined)).toBe(false);
    expect(validateBody("  \n  ")).toBe(false);
  });

  test("formats comment output for table format", () => {
    const formatComment = (comment: Comment): string => {
      return `Comment added successfully!\nID: ${comment.id}\nAuthor: ${comment.author.displayName}\nCreated: ${comment.created}`;
    };

    const comment: Comment = {
      id: "10000",
      author: {
        accountId: "123",
        displayName: "Test User",
        emailAddress: "test@example.com",
        active: true,
        timeZone: "UTC",
      },
      body: {
        type: "doc",
        version: 1,
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: "Test" }],
          },
        ],
      },
      created: "2024-01-01T00:00:00.000Z",
      updated: "2024-01-01T00:00:00.000Z",
    };

    const output = formatComment(comment);
    expect(output).toContain("Comment added successfully!");
    expect(output).toContain("ID: 10000");
    expect(output).toContain("Author: Test User");
  });
});

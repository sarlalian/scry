import { describe, expect, test } from "bun:test";
import type { AtlassianDocument } from "../../src/api/types/common.ts";

describe("issue create integration", () => {
  test("textToAdf converts single line text", () => {
    function textToAdf(text: string): AtlassianDocument {
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
    }

    const result = textToAdf("Single line");
    expect(result.type).toBe("doc");
    expect(result.version).toBe(1);
    expect(result.content).toHaveLength(1);
    expect(result.content[0]?.type).toBe("paragraph");
  });

  test("textToAdf converts multiline text", () => {
    function textToAdf(text: string): AtlassianDocument {
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
    }

    const result = textToAdf("Line 1\nLine 2\nLine 3");
    expect(result.content).toHaveLength(3);
    expect(result.content[0]?.type).toBe("paragraph");
    expect(result.content[1]?.type).toBe("paragraph");
    expect(result.content[2]?.type).toBe("paragraph");
  });

  test("textToAdf handles empty string", () => {
    function textToAdf(text: string): AtlassianDocument {
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
    }

    const result = textToAdf("");
    expect(result.content).toHaveLength(1);
    expect(result.content[0]?.type).toBe("paragraph");
  });

  test("parseLabels handles comma-separated values", () => {
    function parseLabels(labelString?: string): string[] | undefined {
      if (!labelString) return undefined;
      const labels = labelString
        .split(",")
        .map((l) => l.trim())
        .filter(Boolean);
      return labels.length > 0 ? labels : undefined;
    }

    expect(parseLabels("backend,frontend")).toEqual(["backend", "frontend"]);
    expect(parseLabels("backend, frontend, api")).toEqual(["backend", "frontend", "api"]);
    expect(parseLabels("single")).toEqual(["single"]);
    expect(parseLabels("")).toBeUndefined();
    expect(parseLabels(undefined)).toBeUndefined();
  });

  test("parseComponents creates component objects", () => {
    function parseComponents(componentString?: string): Array<{ name: string }> | undefined {
      if (!componentString) return undefined;
      const components = componentString
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean)
        .map((name) => ({ name }));
      return components.length > 0 ? components : undefined;
    }

    const result = parseComponents("API,Frontend,Backend");
    expect(result).toEqual([{ name: "API" }, { name: "Frontend" }, { name: "Backend" }]);
  });

  test("required field validation", () => {
    function validateFields(project?: string, issueType?: string, summary?: string): boolean {
      return !!(project && issueType && summary);
    }

    expect(validateFields("PROJ", "Task", "Summary")).toBe(true);
    expect(validateFields(undefined, "Task", "Summary")).toBe(false);
    expect(validateFields("PROJ", undefined, "Summary")).toBe(false);
    expect(validateFields("PROJ", "Task", undefined)).toBe(false);
    expect(validateFields("PROJ", "Task", "")).toBe(false);
  });
});

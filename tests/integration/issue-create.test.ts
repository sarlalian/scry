import { describe, expect, test } from "bun:test";
import { textToAdf, parseLabels, parseComponents } from "../../src/utils/adf-helpers.ts";

describe("issue create integration", () => {
  test("textToAdf converts single line text", () => {
    const result = textToAdf("Single line");
    expect(result.type).toBe("doc");
    expect(result.version).toBe(1);
    expect(result.content).toHaveLength(1);
    expect(result.content[0]?.type).toBe("paragraph");
  });

  test("textToAdf converts multiline text", () => {
    const result = textToAdf("Line 1\nLine 2\nLine 3");
    expect(result.content).toHaveLength(3);
    expect(result.content[0]?.type).toBe("paragraph");
    expect(result.content[1]?.type).toBe("paragraph");
    expect(result.content[2]?.type).toBe("paragraph");
  });

  test("textToAdf handles empty string", () => {
    const result = textToAdf("");
    expect(result.content).toHaveLength(1);
    expect(result.content[0]?.type).toBe("paragraph");
  });

  test("parseLabels handles comma-separated values", () => {
    expect(parseLabels("backend,frontend")).toEqual(["backend", "frontend"]);
    expect(parseLabels("backend, frontend, api")).toEqual(["backend", "frontend", "api"]);
    expect(parseLabels("single")).toEqual(["single"]);
    expect(parseLabels("")).toBeUndefined();
    expect(parseLabels(undefined)).toBeUndefined();
  });

  test("parseComponents creates component objects", () => {
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

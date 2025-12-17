import type { AtlassianDocument } from "../api/types/common.ts";

/**
 * Converts plain text to Atlassian Document Format (ADF).
 * Splits text by newlines and creates a paragraph for each non-empty line.
 */
export function textToAdf(text: string): AtlassianDocument {
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

/**
 * Parses a comma-separated string of labels into an array.
 * Returns undefined if the input is empty or contains no valid labels.
 */
export function parseLabels(labelString?: string): string[] | undefined {
  if (!labelString) return undefined;
  const labels = labelString
    .split(",")
    .map((l) => l.trim())
    .filter(Boolean);
  return labels.length > 0 ? labels : undefined;
}

/**
 * Parses a comma-separated string of component names into an array of component objects.
 * Returns undefined if the input is empty or contains no valid components.
 */
export function parseComponents(componentString?: string): Array<{ name: string }> | undefined {
  if (!componentString) return undefined;
  const components = componentString
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean)
    .map((name) => ({ name }));
  return components.length > 0 ? components : undefined;
}

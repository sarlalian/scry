import { describe, expect, test } from "bun:test";
import { OutputManager, TableFormatter } from "../../../src/output/index.ts";
import { JsonFormatter } from "../../../src/output/formatters/json.ts";
import { XmlFormatter } from "../../../src/output/formatters/xml.ts";
import { PlainFormatter } from "../../../src/output/formatters/plain.ts";
import { CsvFormatter } from "../../../src/output/formatters/csv.ts";
import type { OutputWrapper } from "../../../src/output/types.ts";

describe("JsonFormatter", () => {
  const formatter = new JsonFormatter();

  test("formats data as JSON", () => {
    const data: OutputWrapper<{ name: string }[]> = {
      data: [{ name: "Test" }],
      meta: { total: 1 },
    };
    const result = formatter.format(data);
    const parsed = JSON.parse(result);

    expect(parsed.data).toHaveLength(1);
    expect(parsed.data[0].name).toBe("Test");
    expect(parsed.meta.total).toBe(1);
  });

  test("formats error as JSON", () => {
    const data: OutputWrapper<null> = {
      data: null,
      error: { code: "ERR", message: "Something went wrong" },
    };
    const result = formatter.format(data);
    const parsed = JSON.parse(result);

    expect(parsed.error.code).toBe("ERR");
    expect(parsed.error.message).toBe("Something went wrong");
  });
});

describe("XmlFormatter", () => {
  const formatter = new XmlFormatter();

  test("formats data as XML with declaration", () => {
    const data: OutputWrapper<{ name: string }[]> = {
      data: [{ name: "Test" }],
    };
    const result = formatter.format(data);

    expect(result).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(result).toContain("<response>");
    expect(result).toContain("<data>");
    expect(result).toContain("<name>Test</name>");
  });
});

describe("PlainFormatter", () => {
  const formatter = new PlainFormatter();

  test("formats object properties", () => {
    const data: OutputWrapper<{ key: string; status: string }> = {
      data: { key: "PROJ-123", status: "Open" },
    };
    const result = formatter.format(data);

    expect(result).toContain("key: PROJ-123");
    expect(result).toContain("status: Open");
  });

  test("formats array of objects", () => {
    const data: OutputWrapper<{ key: string }[]> = {
      data: [{ key: "PROJ-1" }, { key: "PROJ-2" }],
    };
    const result = formatter.format(data);

    expect(result).toContain("key: PROJ-1");
    expect(result).toContain("key: PROJ-2");
  });

  test("formats error message", () => {
    const data: OutputWrapper<null> = {
      data: null,
      error: { code: "ERR", message: "Something went wrong" },
    };
    const result = formatter.format(data);

    expect(result).toBe("Error: Something went wrong");
  });
});

describe("CsvFormatter", () => {
  const formatter = new CsvFormatter();

  test("formats array as CSV with headers", () => {
    const data: OutputWrapper<{ key: string; status: string }[]> = {
      data: [
        { key: "PROJ-1", status: "Open" },
        { key: "PROJ-2", status: "Closed" },
      ],
    };
    const result = formatter.format(data);
    const lines = result.split("\n");

    expect(lines[0]).toBe("key,status");
    expect(lines[1]).toBe("PROJ-1,Open");
    expect(lines[2]).toBe("PROJ-2,Closed");
  });

  test("escapes fields with commas", () => {
    const data: OutputWrapper<{ name: string }[]> = {
      data: [{ name: "Doe, John" }],
    };
    const result = formatter.format(data);
    const lines = result.split("\n");

    expect(lines[1]).toBe('"Doe, John"');
  });

  test("escapes fields with quotes", () => {
    const data: OutputWrapper<{ name: string }[]> = {
      data: [{ name: 'Say "Hello"' }],
    };
    const result = formatter.format(data);
    const lines = result.split("\n");

    expect(lines[1]).toBe('"Say ""Hello"""');
  });

  test("respects columns option", () => {
    const data: OutputWrapper<{ key: string; status: string; priority: string }[]> = {
      data: [{ key: "PROJ-1", status: "Open", priority: "High" }],
    };
    const result = formatter.format(data, { columns: ["key", "priority"] });
    const lines = result.split("\n");

    expect(lines[0]).toBe("key,priority");
    expect(lines[1]).toBe("PROJ-1,High");
  });

  test("handles error in CSV format", () => {
    const data: OutputWrapper<null> = {
      data: null,
      error: { code: "ERR", message: "Test error" },
    };
    const result = formatter.format(data);

    expect(result).toBe("error,Test error");
  });

  test("handles error with comma in message", () => {
    const data: OutputWrapper<null> = {
      data: null,
      error: { code: "ERR", message: "Test error, with comma" },
    };
    const result = formatter.format(data);

    expect(result).toBe('error,"Test error, with comma"');
  });

  test("handles empty array", () => {
    const data: OutputWrapper<unknown[]> = {
      data: [],
    };
    const result = formatter.format(data);

    expect(result).toBe("");
  });

  test("handles single non-object value", () => {
    const data: OutputWrapper<string[]> = {
      data: ["value1", "value2", "value3"],
    };
    const result = formatter.format(data);

    expect(result).toBe("value1\nvalue2\nvalue3");
  });

  test("handles null values in objects", () => {
    const data: OutputWrapper<{ key: string; value: null }[]> = {
      data: [{ key: "test", value: null }],
    };
    const result = formatter.format(data);
    const lines = result.split("\n");

    expect(lines[0]).toBe("key,value");
    expect(lines[1]).toContain("test");
  });

  test("handles undefined values in objects", () => {
    const data: OutputWrapper<{ key: string; value?: string }[]> = {
      data: [{ key: "test" }],
    };
    const result = formatter.format(data);
    const lines = result.split("\n");

    expect(lines[0]).toBe("key");
    expect(lines[1]).toBe("test");
  });

  test("handles array values by joining with semicolon", () => {
    const data: OutputWrapper<{ tags: string[] }[]> = {
      data: [{ tags: ["tag1", "tag2", "tag3"] }],
    };
    const result = formatter.format(data);
    const lines = result.split("\n");

    expect(lines[1]).toBe("tag1;tag2;tag3");
  });

  test("handles object with name property", () => {
    const data: OutputWrapper<{ user: { name: string } }[]> = {
      data: [{ user: { name: "John Doe" } }],
    };
    const result = formatter.format(data);
    const lines = result.split("\n");

    expect(lines[1]).toBe("John Doe");
  });

  test("handles object with displayName property", () => {
    const data: OutputWrapper<{ status: { displayName: string } }[]> = {
      data: [{ status: { displayName: "In Progress" } }],
    };
    const result = formatter.format(data);
    const lines = result.split("\n");

    expect(lines[1]).toBe("In Progress");
  });

  test("handles complex objects as JSON string", () => {
    const data: OutputWrapper<{ metadata: { foo: string; bar: number } }[]> = {
      data: [{ metadata: { foo: "test", bar: 123 } }],
    };
    const result = formatter.format(data);
    const lines = result.split("\n");

    expect(lines[1]).toContain("foo");
    expect(lines[1]).toContain("test");
    expect(lines[1]).toContain("123");
  });

  test("escapes fields with newlines", () => {
    const data: OutputWrapper<{ description: string }[]> = {
      data: [{ description: "Line 1\nLine 2" }],
    };
    const result = formatter.format(data);

    expect(result).toContain('"Line 1');
    expect(result).toContain('Line 2"');
  });
});

describe("TableFormatter", () => {
  test("formats array of objects as table", () => {
    const formatter = new TableFormatter();
    const data: OutputWrapper<{ key: string; status: string }[]> = {
      data: [
        { key: "PROJ-1", status: "Open" },
        { key: "PROJ-2", status: "Closed" },
      ],
    };
    const result = formatter.format(data);

    expect(result).toContain("PROJ-1");
    expect(result).toContain("PROJ-2");
    expect(result).toContain("Open");
    expect(result).toContain("Closed");
  });

  test("handles error", () => {
    const formatter = new TableFormatter();
    const data: OutputWrapper<null> = {
      data: null,
      error: { code: "ERR", message: "Test error" },
    };
    const result = formatter.format(data);

    expect(result).toContain("Error: Test error");
  });

  test("handles empty array", () => {
    const formatter = new TableFormatter();
    const data: OutputWrapper<unknown[]> = {
      data: [],
    };
    const result = formatter.format(data);

    expect(result).toContain("No results found");
  });

  test("uses custom columns when provided", () => {
    const columns = [
      { key: "key", header: "Issue Key" },
      { key: "summary", header: "Summary" },
    ];
    const formatter = new TableFormatter(columns);
    const data: OutputWrapper<{ key: string; summary: string; status: string }[]> = {
      data: [{ key: "PROJ-1", summary: "Test", status: "Open" }],
    };
    const result = formatter.format(data);

    expect(result).toContain("Issue Key");
    expect(result).toContain("Summary");
    expect(result).toContain("PROJ-1");
    expect(result).toContain("Test");
  });

  test("filters custom columns with columns option", () => {
    const columns = [
      { key: "key", header: "Issue Key" },
      { key: "summary", header: "Summary" },
      { key: "status", header: "Status" },
    ];
    const formatter = new TableFormatter(columns);
    const data: OutputWrapper<{ key: string; summary: string; status: string }[]> = {
      data: [{ key: "PROJ-1", summary: "Test", status: "Open" }],
    };
    const result = formatter.format(data, { columns: ["key", "status"] });

    expect(result).toContain("Issue Key");
    expect(result).toContain("Status");
    expect(result).toContain("PROJ-1");
    expect(result).toContain("Open");
  });

  test("handles single object", () => {
    const formatter = new TableFormatter();
    const data: OutputWrapper<{ key: string; status: string }> = {
      data: { key: "PROJ-1", status: "Open" },
    };
    const result = formatter.format(data);

    expect(result).toContain("PROJ-1");
    expect(result).toContain("Open");
  });

  test("handles non-object values", () => {
    const formatter = new TableFormatter();
    const data: OutputWrapper<string[]> = {
      data: ["value1", "value2"],
    };
    const result = formatter.format(data);

    expect(result).toContain("Value");
  });

  test("formats header from camelCase", () => {
    const formatter = new TableFormatter();
    const data: OutputWrapper<{ issueKey: string; projectName: string }[]> = {
      data: [{ issueKey: "PROJ-1", projectName: "Test Project" }],
    };
    const result = formatter.format(data);

    expect(result).toContain("Issue Key");
    expect(result).toContain("Project Name");
  });

  test("handles null values as dash", () => {
    const formatter = new TableFormatter();
    const data: OutputWrapper<{ key: string; value: null }[]> = {
      data: [{ key: "test", value: null }],
    };
    const result = formatter.format(data);

    expect(result).toContain("test");
    expect(result).toContain("-");
  });

  test("handles undefined values as dash", () => {
    const formatter = new TableFormatter();
    const data: OutputWrapper<{ key: string; value?: string }[]> = {
      data: [{ key: "test", value: undefined }],
    };
    const result = formatter.format(data);

    expect(result).toContain("test");
    expect(result).toContain("-");
  });

  test("handles array values by joining with comma", () => {
    const formatter = new TableFormatter();
    const data: OutputWrapper<{ tags: string[] }[]> = {
      data: [{ tags: ["tag1", "tag2", "tag3"] }],
    };
    const result = formatter.format(data);

    expect(result).toContain("tag1, tag2, tag3");
  });

  test("handles object with name property", () => {
    const formatter = new TableFormatter();
    const data: OutputWrapper<{ user: { name: string } }[]> = {
      data: [{ user: { name: "John Doe" } }],
    };
    const result = formatter.format(data);

    expect(result).toContain("John Doe");
  });

  test("handles object with displayName property", () => {
    const formatter = new TableFormatter();
    const data: OutputWrapper<{ status: { displayName: string } }[]> = {
      data: [{ status: { displayName: "In Progress" } }],
    };
    const result = formatter.format(data);

    expect(result).toContain("In Progress");
  });

  test("handles nested property paths with dots", () => {
    const columns = [
      { key: "key", header: "Key" },
      { key: "user.name", header: "User" },
    ];
    const formatter = new TableFormatter(columns);
    const data: OutputWrapper<{ key: string; user: { name: string } }[]> = {
      data: [{ key: "PROJ-1", user: { name: "John Doe" } }],
    };
    const result = formatter.format(data);

    expect(result).toContain("PROJ-1");
    expect(result).toContain("John Doe");
  });

  test("handles nested path with null intermediate value", () => {
    const columns = [
      { key: "key", header: "Key" },
      { key: "user.name", header: "User" },
    ];
    const formatter = new TableFormatter(columns);
    const data: OutputWrapper<{ key: string; user: null }[]> = {
      data: [{ key: "PROJ-1", user: null }],
    };
    const result = formatter.format(data);

    expect(result).toContain("PROJ-1");
    expect(result).toContain("-");
  });

  test("uses custom formatter for column", () => {
    const columns = [
      {
        key: "date",
        header: "Date",
        formatter: (value: unknown) => {
          return value ? new Date(value as string).toLocaleDateString() : "-";
        },
      },
    ];
    const formatter = new TableFormatter(columns);
    const data: OutputWrapper<{ date: string }[]> = {
      data: [{ date: "2024-01-01T00:00:00Z" }],
    };
    const result = formatter.format(data);

    expect(result).toContain("Date");
    expect(result).not.toContain("2024-01-01T00:00:00Z");
  });

  test("respects colors option", () => {
    const formatter = new TableFormatter();
    const data: OutputWrapper<{ key: string }[]> = {
      data: [{ key: "PROJ-1" }],
    };
    const withColors = formatter.format(data, { colors: true });
    const withoutColors = formatter.format(data, { colors: false });

    expect(withColors).toContain("PROJ-1");
    expect(withoutColors).toContain("PROJ-1");
  });

  test("filters columns by requested columns option", () => {
    const formatter = new TableFormatter();
    const data: OutputWrapper<{ key: string; status: string; priority: string }[]> = {
      data: [{ key: "PROJ-1", status: "Open", priority: "High" }],
    };
    const result = formatter.format(data, { columns: ["key", "priority"] });

    expect(result).toContain("Key");
    expect(result).toContain("Priority");
    expect(result).toContain("PROJ-1");
    expect(result).toContain("High");
  });
});

describe("OutputManager", () => {
  test("formats using correct formatter", () => {
    const manager = new OutputManager();
    const data: OutputWrapper<{ test: string }> = { data: { test: "value" } };

    const jsonResult = manager.format(data, "json");
    expect(JSON.parse(jsonResult).data.test).toBe("value");

    const csvResult = manager.format(data, "csv");
    expect(csvResult).toContain("test");
    expect(csvResult).toContain("value");
  });

  test("throws for unknown format", () => {
    const manager = new OutputManager();
    const data: OutputWrapper<null> = { data: null };

    expect(() => manager.format(data, "invalid" as "json")).toThrow(
      "Unknown output format: invalid"
    );
  });

  test("registers custom formatter", () => {
    const manager = new OutputManager();
    const customFormatter = {
      format: () => "custom output",
    };
    manager.registerFormatter("custom" as "json", customFormatter);

    const data: OutputWrapper<{ test: string }> = { data: { test: "value" } };
    const result = manager.format(data, "custom" as "json");

    expect(result).toBe("custom output");
  });

  test("uses default format when not specified", () => {
    const manager = new OutputManager();
    const data: OutputWrapper<{ key: string }[]> = {
      data: [{ key: "test" }],
    };
    const result = manager.format(data);

    expect(result).toContain("test");
  });

  test("formats data with all supported formats", () => {
    const manager = new OutputManager();
    const data: OutputWrapper<{ name: string }[]> = {
      data: [{ name: "Test" }],
    };

    const jsonResult = manager.format(data, "json");
    const parsed = JSON.parse(jsonResult);
    expect(parsed.data[0].name).toBe("Test");

    const xmlResult = manager.format(data, "xml");
    expect(xmlResult).toContain("<name>Test</name>");

    const plainResult = manager.format(data, "plain");
    expect(plainResult).toContain("name: Test");

    const tableResult = manager.format(data, "table");
    expect(tableResult).toContain("Test");

    const csvResult = manager.format(data, "csv");
    expect(csvResult).toContain("Test");
  });

  test("passes options to formatter", () => {
    const manager = new OutputManager();
    const data: OutputWrapper<{ key: string; status: string }[]> = {
      data: [{ key: "test", status: "open" }],
    };
    const result = manager.format(data, "csv", { columns: ["key"] });

    const lines = result.split("\n");
    expect(lines[0]).toBe("key");
    expect(lines[1]).toBe("test");
  });
});

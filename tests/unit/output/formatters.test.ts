import { describe, expect, test } from "bun:test";
import { OutputManager } from "../../../src/output/index.ts";
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
});

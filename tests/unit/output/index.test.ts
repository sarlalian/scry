import { describe, expect, test, beforeEach, mock, spyOn } from "bun:test";
import {
  OutputManager,
  getOutputManager,
  output,
  outputError,
  type OutputWrapper,
} from "../../../src/output/index.ts";

describe("OutputManager", () => {
  let manager: OutputManager;

  beforeEach(() => {
    manager = new OutputManager();
  });

  test("creates instance with default formatters", () => {
    expect(manager).toBeDefined();
  });

  test("format method returns string", () => {
    const data: OutputWrapper<{ test: string }> = { data: { test: "value" } };
    const result = manager.format(data, "json");

    expect(typeof result).toBe("string");
  });

  test("format method uses json formatter", () => {
    const data: OutputWrapper<{ test: string }> = { data: { test: "value" } };
    const result = manager.format(data, "json");
    const parsed = JSON.parse(result);

    expect(parsed.data.test).toBe("value");
  });

  test("format method uses xml formatter", () => {
    const data: OutputWrapper<{ test: string }> = { data: { test: "value" } };
    const result = manager.format(data, "xml");

    expect(result).toContain("<?xml version");
    expect(result).toContain("<test>value</test>");
  });

  test("format method uses plain formatter", () => {
    const data: OutputWrapper<{ test: string }> = { data: { test: "value" } };
    const result = manager.format(data, "plain");

    expect(result).toContain("test: value");
  });

  test("format method uses table formatter by default", () => {
    const data: OutputWrapper<{ test: string }[]> = { data: [{ test: "value" }] };
    const result = manager.format(data);

    expect(result).toContain("Test");
    expect(result).toContain("value");
  });

  test("format method uses csv formatter", () => {
    const data: OutputWrapper<{ test: string }[]> = { data: [{ test: "value" }] };
    const result = manager.format(data, "csv");

    expect(result).toContain("test");
    expect(result).toContain("value");
  });

  test("format method passes options to formatter", () => {
    const data: OutputWrapper<{ key: string; status: string; priority: string }[]> = {
      data: [{ key: "PROJ-1", status: "Open", priority: "High" }],
    };
    const result = manager.format(data, "csv", { columns: ["key", "priority"] });
    const lines = result.split("\n");

    expect(lines[0]).toBe("key,priority");
    expect(lines[1]).toBe("PROJ-1,High");
  });

  test("format throws for unknown format", () => {
    const data: OutputWrapper<null> = { data: null };

    expect(() => manager.format(data, "unknown" as "json")).toThrow(
      "Unknown output format: unknown"
    );
  });

  test("registerFormatter adds custom formatter", () => {
    const customFormatter = {
      format: () => "custom output",
    };
    manager.registerFormatter("custom" as "json", customFormatter);

    const data: OutputWrapper<{ test: string }> = { data: { test: "value" } };
    const result = manager.format(data, "custom" as "json");

    expect(result).toBe("custom output");
  });

  test("registerFormatter replaces existing formatter", () => {
    const customFormatter = {
      format: () => "replaced json output",
    };
    manager.registerFormatter("json", customFormatter);

    const data: OutputWrapper<{ test: string }> = { data: { test: "value" } };
    const result = manager.format(data, "json");

    expect(result).toBe("replaced json output");
  });

  test("print method calls console.log", () => {
    const consoleSpy = spyOn(console, "log").mockImplementation(() => {});
    const data: OutputWrapper<{ test: string }> = { data: { test: "value" } };

    manager.print(data, "json");

    expect(consoleSpy).toHaveBeenCalledTimes(1);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("test"));

    consoleSpy.mockRestore();
  });

  test("print method formats data before logging", () => {
    const consoleSpy = spyOn(console, "log").mockImplementation(() => {});
    const data: OutputWrapper<{ test: string }> = { data: { test: "value" } };

    manager.print(data, "json");

    const logged = consoleSpy.mock.calls[0][0];
    const parsed = JSON.parse(logged);
    expect(parsed.data.test).toBe("value");

    consoleSpy.mockRestore();
  });
});

describe("getOutputManager", () => {
  test("returns OutputManager instance", () => {
    const manager = getOutputManager();

    expect(manager).toBeInstanceOf(OutputManager);
  });

  test("returns same instance on multiple calls", () => {
    const manager1 = getOutputManager();
    const manager2 = getOutputManager();

    expect(manager1).toBe(manager2);
  });
});

describe("output", () => {
  test("outputs data using default table format", () => {
    const consoleSpy = spyOn(console, "log").mockImplementation(() => {});
    const data = { test: "value" };

    output(data);

    expect(consoleSpy).toHaveBeenCalledTimes(1);
    consoleSpy.mockRestore();
  });

  test("outputs data using specified format", () => {
    const consoleSpy = spyOn(console, "log").mockImplementation(() => {});
    const data = { test: "value" };

    output(data, "json");

    const logged = consoleSpy.mock.calls[0][0];
    const parsed = JSON.parse(logged);
    expect(parsed.data.test).toBe("value");

    consoleSpy.mockRestore();
  });

  test("includes metadata when provided", () => {
    const consoleSpy = spyOn(console, "log").mockImplementation(() => {});
    const data = { test: "value" };

    output(data, "json", { meta: { total: 10 } });

    const logged = consoleSpy.mock.calls[0][0];
    const parsed = JSON.parse(logged);
    expect(parsed.meta.total).toBe(10);

    consoleSpy.mockRestore();
  });

  test("passes options to formatter", () => {
    const consoleSpy = spyOn(console, "log").mockImplementation(() => {});
    const data = [{ key: "PROJ-1", status: "Open", priority: "High" }];

    output(data, "csv", { columns: ["key", "priority"] });

    const logged = consoleSpy.mock.calls[0][0];
    const lines = logged.split("\n");
    expect(lines[0]).toBe("key,priority");

    consoleSpy.mockRestore();
  });

  test("wraps data in OutputWrapper", () => {
    const consoleSpy = spyOn(console, "log").mockImplementation(() => {});
    const data = { test: "value" };

    output(data, "json");

    const logged = consoleSpy.mock.calls[0][0];
    const parsed = JSON.parse(logged);
    expect(parsed).toHaveProperty("data");
    expect(parsed.data.test).toBe("value");

    consoleSpy.mockRestore();
  });
});

describe("outputError", () => {
  test("outputs error from Error object", () => {
    const consoleSpy = spyOn(console, "log").mockImplementation(() => {});
    const error = new Error("Test error");

    outputError(error, "json");

    const logged = consoleSpy.mock.calls[0][0];
    const parsed = JSON.parse(logged);
    expect(parsed.error.message).toBe("Test error");
    expect(parsed.error.code).toBe("Error");

    consoleSpy.mockRestore();
  });

  test("outputs error from string", () => {
    const consoleSpy = spyOn(console, "log").mockImplementation(() => {});

    outputError("Test error", "json");

    const logged = consoleSpy.mock.calls[0][0];
    const parsed = JSON.parse(logged);
    expect(parsed.error.message).toBe("Test error");
    expect(parsed.error.code).toBe("ERROR");

    consoleSpy.mockRestore();
  });

  test("uses custom error name as code", () => {
    const consoleSpy = spyOn(console, "log").mockImplementation(() => {});
    const error = new Error("Test error");
    error.name = "CustomError";

    outputError(error, "json");

    const logged = consoleSpy.mock.calls[0][0];
    const parsed = JSON.parse(logged);
    expect(parsed.error.code).toBe("CustomError");

    consoleSpy.mockRestore();
  });

  test("uses default table format when format not specified", () => {
    const consoleSpy = spyOn(console, "log").mockImplementation(() => {});
    const error = new Error("Test error");

    outputError(error);

    expect(consoleSpy).toHaveBeenCalledTimes(1);
    expect(consoleSpy.mock.calls[0][0]).toContain("Error: Test error");

    consoleSpy.mockRestore();
  });

  test("wraps error in OutputWrapper with null data", () => {
    const consoleSpy = spyOn(console, "log").mockImplementation(() => {});
    const error = new Error("Test error");

    outputError(error, "json");

    const logged = consoleSpy.mock.calls[0][0];
    const parsed = JSON.parse(logged);
    expect(parsed.data).toBe(null);
    expect(parsed).toHaveProperty("error");

    consoleSpy.mockRestore();
  });

  test("outputs error in xml format", () => {
    const consoleSpy = spyOn(console, "log").mockImplementation(() => {});
    const error = new Error("Test error");

    outputError(error, "xml");

    const logged = consoleSpy.mock.calls[0][0];
    expect(logged).toContain("<error>");
    expect(logged).toContain("<message>Test error</message>");

    consoleSpy.mockRestore();
  });

  test("outputs error in plain format", () => {
    const consoleSpy = spyOn(console, "log").mockImplementation(() => {});
    const error = new Error("Test error");

    outputError(error, "plain");

    const logged = consoleSpy.mock.calls[0][0];
    expect(logged).toBe("Error: Test error");

    consoleSpy.mockRestore();
  });
});

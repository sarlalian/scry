import { describe, expect, test } from "bun:test";
import { success, error, warning, info, dryRun } from "../../../src/utils/messages.ts";

describe("messages utilities", () => {
  test("success formats message with green checkmark", () => {
    const message = success("Operation completed");
    expect(message).toContain("Operation completed");
    expect(message).toContain("✓");
  });

  test("error formats message with red X", () => {
    const message = error("Operation failed");
    expect(message).toContain("Operation failed");
    expect(message).toContain("✗");
  });

  test("warning formats message with yellow warning symbol", () => {
    const message = warning("This is a warning");
    expect(message).toContain("This is a warning");
    expect(message).toContain("⚠");
  });

  test("info formats message with blue info symbol", () => {
    const message = info("This is informational");
    expect(message).toContain("This is informational");
    expect(message).toContain("ℹ");
  });

  test("dryRun formats message with DRY RUN prefix", () => {
    const message = dryRun("Would delete issue PROJ-123");
    expect(message).toContain("DRY RUN:");
    expect(message).toContain("Would delete issue PROJ-123");
    expect(message).toContain("◆");
  });

  test("all message functions return non-empty strings", () => {
    expect(success("test").length).toBeGreaterThan(0);
    expect(error("test").length).toBeGreaterThan(0);
    expect(warning("test").length).toBeGreaterThan(0);
    expect(info("test").length).toBeGreaterThan(0);
    expect(dryRun("test").length).toBeGreaterThan(0);
  });
});

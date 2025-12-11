import { describe, expect, test } from "bun:test";
import {
  generateBashCompletion,
  generateZshCompletion,
  generateFishCompletion,
  getCompletion,
  validateShell,
} from "../../../../src/cli/commands/completion/generators.ts";

describe("completion command", () => {
  test("generates bash completion script", () => {
    const bashScript = generateBashCompletion();

    expect(bashScript).toContain("_scry_completion()");
    expect(bashScript).toContain("COMPREPLY");
    expect(bashScript).toContain("complete -F _scry_completion scry");
  });

  test("bash completion includes all main commands", () => {
    const bashScript = generateBashCompletion();

    expect(bashScript).toContain("init");
    expect(bashScript).toContain("issue");
    expect(bashScript).toContain("epic");
    expect(bashScript).toContain("sprint");
    expect(bashScript).toContain("project");
    expect(bashScript).toContain("board");
    expect(bashScript).toContain("release");
    expect(bashScript).toContain("user");
    expect(bashScript).toContain("me");
    expect(bashScript).toContain("open");
    expect(bashScript).toContain("completion");
  });

  test("bash completion includes common flags", () => {
    const bashScript = generateBashCompletion();

    expect(bashScript).toContain("--output");
    expect(bashScript).toContain("--project");
    expect(bashScript).toContain("--config");
    expect(bashScript).toContain("--debug");
    expect(bashScript).toContain("--version");
    expect(bashScript).toContain("--help");
    expect(bashScript).toContain("--no-color");
  });

  test("bash completion includes issue subcommands", () => {
    const bashScript = generateBashCompletion();

    expect(bashScript).toContain("list");
    expect(bashScript).toContain("view");
    expect(bashScript).toContain("create");
    expect(bashScript).toContain("clone");
    expect(bashScript).toContain("assign");
    expect(bashScript).toContain("move");
    expect(bashScript).toContain("edit");
    expect(bashScript).toContain("comment");
    expect(bashScript).toContain("delete");
  });

  test("bash completion includes output format options", () => {
    const bashScript = generateBashCompletion();

    expect(bashScript).toContain("table");
    expect(bashScript).toContain("plain");
    expect(bashScript).toContain("json");
    expect(bashScript).toContain("xml");
    expect(bashScript).toContain("csv");
  });

  test("generates zsh completion script", () => {
    const zshScript = generateZshCompletion();

    expect(zshScript).toContain("#compdef scry");
    expect(zshScript).toContain("_scry()");
    expect(zshScript).toContain("_arguments");
  });

  test("zsh completion includes all main commands", () => {
    const zshScript = generateZshCompletion();

    expect(zshScript).toContain("init");
    expect(zshScript).toContain("issue");
    expect(zshScript).toContain("epic");
    expect(zshScript).toContain("sprint");
    expect(zshScript).toContain("project");
    expect(zshScript).toContain("board");
    expect(zshScript).toContain("release");
    expect(zshScript).toContain("user");
    expect(zshScript).toContain("me");
    expect(zshScript).toContain("open");
    expect(zshScript).toContain("completion");
  });

  test("zsh completion includes common flags", () => {
    const zshScript = generateZshCompletion();

    expect(zshScript).toContain("--output");
    expect(zshScript).toContain("--project");
    expect(zshScript).toContain("--config");
    expect(zshScript).toContain("--debug");
    expect(zshScript).toContain("--version");
    expect(zshScript).toContain("--help");
    expect(zshScript).toContain("--no-color");
  });

  test("generates fish completion script", () => {
    const fishScript = generateFishCompletion();

    expect(fishScript).toContain("complete -c scry");
  });

  test("fish completion includes all main commands", () => {
    const fishScript = generateFishCompletion();

    expect(fishScript).toContain("init");
    expect(fishScript).toContain("issue");
    expect(fishScript).toContain("epic");
    expect(fishScript).toContain("sprint");
    expect(fishScript).toContain("project");
    expect(fishScript).toContain("board");
    expect(fishScript).toContain("release");
    expect(fishScript).toContain("user");
    expect(fishScript).toContain("me");
    expect(fishScript).toContain("open");
    expect(fishScript).toContain("completion");
  });

  test("fish completion includes common flags", () => {
    const fishScript = generateFishCompletion();

    expect(fishScript).toContain("-l output");
    expect(fishScript).toContain("-l project");
    expect(fishScript).toContain("-l config");
    expect(fishScript).toContain("-l debug");
    expect(fishScript).toContain("-l version");
    expect(fishScript).toContain("-l help");
    expect(fishScript).toContain("-l no-color");
  });

  test("validates shell type", () => {
    expect(validateShell("bash")).toBe(true);
    expect(validateShell("zsh")).toBe(true);
    expect(validateShell("fish")).toBe(true);
    expect(validateShell("powershell")).toBe(false);
    expect(validateShell("invalid")).toBe(false);
  });

  test("shell type is case-insensitive", () => {
    expect(validateShell("BASH")).toBe(true);
    expect(validateShell("Zsh")).toBe(true);
    expect(validateShell("FiSh")).toBe(true);
  });

  test("generates correct completion for specific shell", () => {
    expect(() => getCompletion("bash")).not.toThrow();
    expect(() => getCompletion("zsh")).not.toThrow();
    expect(() => getCompletion("fish")).not.toThrow();
    expect(() => getCompletion("invalid")).toThrow("Unsupported shell: invalid");
  });
});

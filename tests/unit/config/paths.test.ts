import { describe, expect, test, beforeEach, afterEach } from "bun:test";
import { homedir } from "os";
import { join } from "path";
import {
  getDefaultConfigPaths,
  getDefaultConfigDir,
  getDefaultConfigPath,
  CONFIG_FILE_NAME,
  CONFIG_DIR_NAME,
} from "../../../src/config/paths.ts";

describe("config paths", () => {
  let originalEnv: string | undefined;

  beforeEach(() => {
    originalEnv = process.env["SCRY_CONFIG_FILE"];
  });

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env["SCRY_CONFIG_FILE"] = originalEnv;
    } else {
      delete process.env["SCRY_CONFIG_FILE"];
    }
  });

  describe("getDefaultConfigPaths", () => {
    test("returns array of config file paths", () => {
      delete process.env["SCRY_CONFIG_FILE"];
      const paths = getDefaultConfigPaths();

      expect(Array.isArray(paths)).toBe(true);
      expect(paths.length).toBeGreaterThan(0);
    });

    test("includes SCRY_CONFIG_FILE env var when set", () => {
      process.env["SCRY_CONFIG_FILE"] = "/custom/path/config.yml";
      const paths = getDefaultConfigPaths();

      expect(paths).toContain("/custom/path/config.yml");
      expect(paths[0]).toBe("/custom/path/config.yml");
    });

    test("excludes SCRY_CONFIG_FILE when not set", () => {
      delete process.env["SCRY_CONFIG_FILE"];
      const paths = getDefaultConfigPaths();

      expect(paths[0]).not.toBeUndefined();
    });

    test("includes .scry.yml in current working directory", () => {
      delete process.env["SCRY_CONFIG_FILE"];
      const paths = getDefaultConfigPaths();
      const cwdPath = join(process.cwd(), ".scry.yml");

      expect(paths).toContain(cwdPath);
    });

    test("includes .config/scry/config.yml in home directory", () => {
      delete process.env["SCRY_CONFIG_FILE"];
      const paths = getDefaultConfigPaths();
      const homePath = join(homedir(), ".config", CONFIG_DIR_NAME, CONFIG_FILE_NAME);

      expect(paths).toContain(homePath);
    });

    test("includes .scry.yml in home directory", () => {
      delete process.env["SCRY_CONFIG_FILE"];
      const paths = getDefaultConfigPaths();
      const homePath = join(homedir(), `.${CONFIG_DIR_NAME}.yml`);

      expect(paths).toContain(homePath);
    });

    test("filters out undefined and empty values", () => {
      delete process.env["SCRY_CONFIG_FILE"];
      const paths = getDefaultConfigPaths();

      expect(paths.every((p) => typeof p === "string" && p.length > 0)).toBe(true);
    });

    test("returns paths in correct priority order", () => {
      process.env["SCRY_CONFIG_FILE"] = "/custom/config.yml";
      const paths = getDefaultConfigPaths();

      expect(paths[0]).toBe("/custom/config.yml");
      expect(paths[1]).toBe(join(process.cwd(), ".scry.yml"));
    });
  });

  describe("getDefaultConfigDir", () => {
    test("returns path to config directory in home", () => {
      const dir = getDefaultConfigDir();
      const expectedDir = join(homedir(), ".config", CONFIG_DIR_NAME);

      expect(dir).toBe(expectedDir);
    });

    test("returns absolute path", () => {
      const dir = getDefaultConfigDir();

      expect(dir.startsWith("/") || dir.match(/^[A-Z]:\\/)).toBe(true);
    });

    test("includes CONFIG_DIR_NAME in path", () => {
      const dir = getDefaultConfigDir();

      expect(dir).toContain(CONFIG_DIR_NAME);
    });
  });

  describe("getDefaultConfigPath", () => {
    test("returns path to config file in config directory", () => {
      const path = getDefaultConfigPath();
      const expectedPath = join(homedir(), ".config", CONFIG_DIR_NAME, CONFIG_FILE_NAME);

      expect(path).toBe(expectedPath);
    });

    test("returns absolute path", () => {
      const path = getDefaultConfigPath();

      expect(path.startsWith("/") || path.match(/^[A-Z]:\\/)).toBe(true);
    });

    test("includes CONFIG_FILE_NAME in path", () => {
      const path = getDefaultConfigPath();

      expect(path).toContain(CONFIG_FILE_NAME);
    });

    test("path ends with config.yml", () => {
      const path = getDefaultConfigPath();

      expect(path.endsWith(CONFIG_FILE_NAME)).toBe(true);
    });
  });

  describe("constants", () => {
    test("CONFIG_FILE_NAME is defined", () => {
      expect(CONFIG_FILE_NAME).toBe("config.yml");
    });

    test("CONFIG_DIR_NAME is defined", () => {
      expect(CONFIG_DIR_NAME).toBe("scry");
    });
  });
});

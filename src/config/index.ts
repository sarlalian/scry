import { parse, stringify } from "yaml";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname } from "path";
import { getDefaultConfigPaths, getDefaultConfigPath } from "./paths.ts";
import {
  type Config,
  type ConfigSchema,
  type AuthType,
  validateConfig,
  getDefaultConfig,
} from "./schema.ts";

export { type Config, type ConfigSchema, type AuthType } from "./schema.ts";
export { getDefaultConfigPath, getDefaultConfigDir } from "./paths.ts";

export class ConfigError extends Error {
  constructor(
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = "ConfigError";
  }
}

export class ConfigManager {
  private config: Config | null = null;
  private configPath: string | null = null;

  load(customPath?: string): Config {
    const paths = customPath ? [customPath] : getDefaultConfigPaths();

    for (const path of paths) {
      if (existsSync(path)) {
        try {
          const content = readFileSync(path, "utf-8");
          const parsed = parse(content) as ConfigSchema;
          this.config = this.mergeWithEnv(parsed);
          this.configPath = path;
          return this.config;
        } catch (err) {
          throw new ConfigError(`Failed to parse config file: ${path}`, err);
        }
      }
    }

    throw new ConfigError('No configuration file found. Run "scry init" to create one.');
  }

  loadOrDefault(customPath?: string): Config {
    try {
      return this.load(customPath);
    } catch {
      this.config = this.mergeWithEnv({});
      return this.config;
    }
  }

  save(config: ConfigSchema, path?: string): void {
    const targetPath = path ?? this.configPath ?? getDefaultConfigPath();
    const dir = dirname(targetPath);

    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    const content = stringify(config, { indent: 2 });
    writeFileSync(targetPath, content, "utf-8");
    this.configPath = targetPath;
  }

  validate(config: ConfigSchema): string[] {
    return validateConfig(config);
  }

  getConfig(): Config | null {
    return this.config;
  }

  getConfigPath(): string | null {
    return this.configPath;
  }

  private mergeWithEnv(config: ConfigSchema): Config {
    const defaults = getDefaultConfig();

    return {
      server: process.env["SCRY_SERVER"] ?? config.server ?? defaults.server,
      login: process.env["SCRY_LOGIN"] ?? config.login ?? defaults.login,
      project: {
        ...defaults.project,
        ...config.project,
        key: process.env["SCRY_PROJECT"] ?? config.project?.key,
      },
      board: {
        ...defaults.board,
        ...config.board,
      },
      auth: {
        ...defaults.auth,
        ...config.auth,
        type:
          (process.env["SCRY_AUTH_TYPE"] as AuthType) ?? config.auth?.type ?? defaults.auth.type,
        token: process.env["SCRY_API_TOKEN"] ?? config.auth?.token,
      },
      epic: {
        ...defaults.epic,
        ...config.epic,
      },
      issue: {
        ...defaults.issue,
        ...config.issue,
      },
      output: {
        ...defaults.output,
        ...config.output,
      },
    };
  }
}

let defaultManager: ConfigManager | null = null;

export function getConfigManager(): ConfigManager {
  if (!defaultManager) {
    defaultManager = new ConfigManager();
  }
  return defaultManager;
}

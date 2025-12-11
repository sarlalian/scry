import { homedir } from "os";
import { join } from "path";

export const CONFIG_FILE_NAME = "config.yml";
export const CONFIG_DIR_NAME = "scry";

export function getDefaultConfigPaths(): string[] {
  return [
    process.env["SCRY_CONFIG_FILE"],
    join(process.cwd(), ".scry.yml"),
    join(homedir(), ".config", CONFIG_DIR_NAME, CONFIG_FILE_NAME),
    join(homedir(), `.${CONFIG_DIR_NAME}.yml`),
  ].filter((p): p is string => Boolean(p));
}

export function getDefaultConfigDir(): string {
  return join(homedir(), ".config", CONFIG_DIR_NAME);
}

export function getDefaultConfigPath(): string {
  return join(getDefaultConfigDir(), CONFIG_FILE_NAME);
}

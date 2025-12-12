import { resolve } from "path";

export interface CliResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

export interface CliOptions {
  env?: Record<string, string>;
  timeout?: number;
  cwd?: string;
}

const CLI_PATH = resolve(import.meta.dir, "../../../src/index.ts");

export async function runScry(args: string[], options: CliOptions = {}): Promise<CliResult> {
  const env = {
    ...process.env,
    ...options.env,
    // Disable color for predictable output parsing
    NO_COLOR: "1",
    FORCE_COLOR: "0",
  };

  const timeout = options.timeout ?? 30000;
  const cwd = options.cwd ?? process.cwd();

  try {
    const proc = Bun.spawn(["bun", CLI_PATH, ...args], {
      env,
      cwd,
      stdout: "pipe",
      stderr: "pipe",
    });

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        proc.kill();
        reject(new Error(`CLI command timed out after ${timeout}ms`));
      }, timeout);
    });

    const exitCode = await Promise.race([proc.exited, timeoutPromise]);
    const stdout = await new Response(proc.stdout).text();
    const stderr = await new Response(proc.stderr).text();

    return {
      stdout,
      stderr,
      exitCode,
    };
  } catch (error) {
    if (error instanceof Error && error.message.includes("timed out")) {
      throw error;
    }
    // Handle other spawn errors
    return {
      stdout: "",
      stderr: error instanceof Error ? error.message : String(error),
      exitCode: 1,
    };
  }
}

export async function scryJson<T>(
  args: string[],
  options?: CliOptions
): Promise<{ data: T; meta?: Record<string, unknown> }> {
  const result = await runScry([...args, "-o", "json"], options);
  if (result.exitCode !== 0) {
    let errorMessage = result.stderr || result.stdout;
    try {
      const parsed = JSON.parse(result.stdout);
      if (parsed.error) {
        errorMessage = parsed.error.message || JSON.stringify(parsed.error);
      }
    } catch {
      // Not JSON, use stderr
    }
    throw new Error(`CLI failed with exit code ${result.exitCode}: ${errorMessage}`);
  }
  return JSON.parse(result.stdout);
}

export async function scryJsonRaw<T>(
  args: string[],
  options?: CliOptions
): Promise<CliResult & { parsed?: T }> {
  const result = await runScry([...args, "-o", "json"], options);
  let parsed: T | undefined;
  try {
    parsed = JSON.parse(result.stdout);
  } catch {
    // Not valid JSON
  }
  return { ...result, parsed };
}

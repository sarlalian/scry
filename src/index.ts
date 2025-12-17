#!/usr/bin/env bun
import { cli } from "./cli/index.ts";
import { ScryError, AuthError, JiraApiError } from "./errors.ts";
import { ConfigError } from "./config/index.ts";

async function main() {
  try {
    await cli.parseAsync(process.argv);
  } catch (err) {
    if (err instanceof ScryError || err instanceof AuthError || err instanceof JiraApiError || err instanceof ConfigError) {
      console.error(`Error: ${err.message}`);
      if (process.env.DEBUG) {
        console.error(err.stack);
      }
    } else if (err instanceof Error) {
      console.error(`Unexpected error: ${err.message}`);
      if (process.env.DEBUG) {
        console.error(err.stack);
      }
    } else {
      console.error(`Unknown error: ${String(err)}`);
    }
    process.exit(1);
  }
}

main().catch(() => {
  // Error already logged in main()
  process.exit(1);
});

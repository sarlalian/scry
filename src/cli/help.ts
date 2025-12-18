import type { Command } from "commander";

const GLOBAL_OPTIONS_HELP = `
Global Options:
  -p, --project <key>     Jira project key
  -o, --output <format>   Output format: table|plain|json|xml (default: table)
  -c, --config <path>     Config file path
  --debug                 Enable debug output
  --no-color              Disable colored output
`;

/**
 * Add global options help text to a command group.
 * This makes global options visible in subcommand help output.
 */
export function addGlobalOptionsHelp(command: Command): Command {
  return command.addHelpText("after", GLOBAL_OPTIONS_HELP);
}

import { Command } from "commander";
import { meCommand } from "./commands/me.ts";
import { initCommand } from "./commands/init.ts";
import { issueCommand } from "./commands/issue/index.ts";
import { epicCommand } from "./commands/epic/index.ts";
import { sprintCommand } from "./commands/sprint/index.ts";
import { projectCommand } from "./commands/project/index.ts";
import { boardCommand } from "./commands/board/index.ts";
import { releaseCommand } from "./commands/release/index.ts";
import { userCommand } from "./commands/user/index.ts";
import { openCommand } from "./commands/open.ts";
import { completionCommand } from "./commands/completion/index.ts";

const VERSION = "0.1.0";

export const cli = new Command()
  .name("scry")
  .description("CLI and interactive Jira command line")
  .version(VERSION, "-V, --version", "Show version")
  .option("-c, --config <path>", "Config file path")
  .option("-p, --project <key>", "Jira project key")
  .option("--debug", "Enable debug output")
  .option("-o, --output <format>", "Output format: table|plain|json|xml", "table")
  .option("--no-color", "Disable colored output")
  .addCommand(initCommand)
  .addCommand(issueCommand)
  .addCommand(epicCommand)
  .addCommand(sprintCommand)
  .addCommand(projectCommand)
  .addCommand(boardCommand)
  .addCommand(releaseCommand)
  .addCommand(userCommand)
  .addCommand(meCommand)
  .addCommand(openCommand)
  .addCommand(completionCommand);

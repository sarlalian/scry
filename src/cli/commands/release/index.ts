import { Command } from "commander";
import { listCommand } from "./list.ts";
import { createCommand } from "./create.ts";

export const releaseCommand = new Command("release")
  .description("Manage Jira releases/versions")
  .addCommand(listCommand)
  .addCommand(createCommand);

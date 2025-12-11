import { Command } from "commander";
import { listCommand } from "./list.ts";
import { createCommand } from "./create.ts";
import { addCommand } from "./add.ts";

export const sprintCommand = new Command("sprint")
  .description("Manage Jira sprints")
  .addCommand(listCommand)
  .addCommand(createCommand)
  .addCommand(addCommand);

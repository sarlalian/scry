import { Command } from "commander";
import { listCommand } from "./list.ts";
import { createCommand } from "./create.ts";
import { addCommand } from "./add.ts";
import { removeCommand } from "./remove.ts";

export const epicCommand = new Command("epic")
  .description("Manage Jira epics")
  .addCommand(listCommand)
  .addCommand(createCommand)
  .addCommand(addCommand)
  .addCommand(removeCommand);

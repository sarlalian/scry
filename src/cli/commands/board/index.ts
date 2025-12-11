import { Command } from "commander";
import { listCommand } from "./list.ts";

export const boardCommand = new Command("board")
  .description("Manage Jira boards")
  .addCommand(listCommand);
